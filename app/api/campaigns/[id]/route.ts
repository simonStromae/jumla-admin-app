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
    // status is now a plain TEXT column — Prisma can write it directly
    const prismaStatus = status ? toPrismaStatus(status) : undefined;

    // Update statusNotes for transit legs (JSONB column outside schema — raw SQL)
    if (prismaStatus && statusNote && (prismaStatus === 'in_transit' || prismaStatus === 'in_transit_2')) {
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT "statusNotes" FROM campaigns WHERE id = $1`, params.id
      );
      const current = (rows[0]?.statusNotes ?? {}) as any;
      const noteKey = prismaStatus === 'in_transit' ? 'in-transit' : 'in_transit_2';
      const updated = { ...current, [noteKey]: statusNote };
      await prisma.$executeRawUnsafe(
        `UPDATE campaigns SET "statusNotes" = $1::jsonb WHERE id = $2`,
        JSON.stringify(updated), params.id,
      );
    }

    // Regular Prisma update (status is now String — no casting needed)
    const data: any = {};
    if (prismaStatus !== undefined)    data.status        = prismaStatus;
    if (departureDate !== undefined)   data.departureDate = departureDate ? new Date(departureDate) : null;
    if (arrivalDate   !== undefined)   data.arrivalDate   = arrivalDate   ? new Date(arrivalDate)   : null;
    if (capacityKg    !== undefined)   data.capacityKg    = capacityKg    ? Number(capacityKg)      : null;

    if (Object.keys(data).length > 0) {
      await prisma.campaign.update({ where: { id: params.id }, data });
    }

    // Cascade parcel statuses
    if (prismaStatus) {
      if (prismaStatus === 'in_transit' || prismaStatus === 'in_transit_2') {
        await prisma.parcel.updateMany({
          where: { campaignId: params.id, status: { in: ['rec', 'pre'] } },
          data:  { status: 'exp' },
        });
      } else if (prismaStatus === 'arrived') {
        await prisma.parcel.updateMany({
          where: { campaignId: params.id, status: { in: ['exp', 'tra', 'apd', 'dou'] } },
          data:  { status: 'ard' },
        });
      }
    }

    // Re-fetch full updated campaign
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
