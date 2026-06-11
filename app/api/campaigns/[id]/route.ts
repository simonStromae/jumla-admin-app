export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin, requirePermission, mapCampaignStatus, toPrismaStatus } from '@/src/lib/api-auth';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const c = await prisma.campaign.findUnique({
    where: { id: params.id },
    include: {
      route: true,
      costs: true,
      parcels: {
        include: {
          client: { select: { id: true, name: true, email: true, phone: true, city: true } },
          payment: true,
          trackingEvents: { orderBy: { createdAt: 'desc' } },
        },
      },
    },
  });

  if (!c) return NextResponse.json({ error: 'Cargaison introuvable' }, { status: 404 });

  // statusNotes is not in Prisma schema — fetch via raw SQL
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT "statusNotes" FROM campaigns WHERE id = $1`, params.id
  ).catch(() => [{}]);
  const statusNotes = rows[0]?.statusNotes ?? {};

  return NextResponse.json({
    ...c,
    status: mapCampaignStatus(c.status),
    statusNotes,
    collected: c.parcels.reduce((s, p) =>
      s + (p.payment?.status === 'completed' ? p.payment.amount : 0), 0),
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('campaigns');
  if (error) return error;

  const body = await req.json();
  const { status, departureDate, arrivalDate, capacityKg, statusNote } = body;

  try {
    // Update status via raw SQL to support new enum values not yet in schema.prisma
    if (status) {
      const prismaStatus = toPrismaStatus(status);
      await prisma.$executeRawUnsafe(
        `UPDATE campaigns SET status = $1::\"CampaignStatus\" WHERE id = $2`,
        prismaStatus,
        params.id,
      );

      // Update statusNotes for transit legs (also outside schema)
      if (statusNote && (prismaStatus === 'in_transit' || prismaStatus === 'in_transit_2')) {
        const rows = await prisma.$queryRawUnsafe<any[]>(
          `SELECT "statusNotes" FROM campaigns WHERE id = $1`, params.id
        );
        const current = (rows[0]?.statusNotes ?? {}) as any;
        const noteKey = prismaStatus === 'in_transit' ? 'in-transit' : 'in_transit_2';
        const updated = { ...current, [noteKey]: statusNote };
        await prisma.$executeRawUnsafe(
          `UPDATE campaigns SET "statusNotes" = $1::jsonb WHERE id = $2`,
          JSON.stringify(updated),
          params.id,
        );
      }
    }

    // Update regular fields via Prisma (these are in the schema)
    const regularUpdate: any = {};
    if (departureDate !== undefined) regularUpdate.departureDate = departureDate ? new Date(departureDate) : null;
    if (arrivalDate   !== undefined) regularUpdate.arrivalDate   = arrivalDate   ? new Date(arrivalDate)   : null;
    if (capacityKg    !== undefined) regularUpdate.capacityKg    = capacityKg    ? Number(capacityKg)      : null;

    if (Object.keys(regularUpdate).length > 0) {
      await prisma.campaign.update({ where: { id: params.id }, data: regularUpdate });
    }

    // Cascade parcel statuses when campaign advances
    if (status) {
      const prismaStatus = toPrismaStatus(status);
      if (prismaStatus === 'in_transit' || prismaStatus === 'in_transit_2') {
        await prisma.parcel.updateMany({
          where: { campaignId: params.id, status: 'recu' },
          data:  { status: 'en_transit' },
        });
      } else if (prismaStatus === 'arrived') {
        await prisma.parcel.updateMany({
          where: { campaignId: params.id, status: 'en_transit' },
          data:  { status: 'arrive' },
        });
      }
    }

    // Re-fetch the full updated campaign to return
    const updated = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: { route: true },
    });
    const noteRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT "statusNotes" FROM campaigns WHERE id = $1`, params.id
    ).catch(() => [{}]);

    return NextResponse.json({
      ok: true,
      campaign: {
        ...updated,
        status: mapCampaignStatus(updated!.status),
        statusNotes: noteRows[0]?.statusNotes ?? {},
      },
    });
  } catch (e: any) {
    console.error('[campaigns PUT]', e);
    return NextResponse.json({ error: e?.message ?? 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('campaigns');
  if (error) return error;

  await prisma.campaign.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
