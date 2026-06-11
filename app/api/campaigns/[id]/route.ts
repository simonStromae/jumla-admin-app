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

  return NextResponse.json({
    ...c,
    status: mapCampaignStatus(c.status),
    statusNotes: (c as any).statusNotes ?? {},
    collected: c.parcels.reduce((s, p) =>
      s + (p.payment?.status === 'completed' ? p.payment.amount : 0), 0),
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('campaigns');
  if (error) return error;

  const body = await req.json();
  const { status, departureDate, arrivalDate, capacityKg, statusNote } = body;

  let statusNotesUpdate: any = undefined;
  if (status && statusNote) {
    const prismaStatus = toPrismaStatus(status);
    if (prismaStatus === 'in_transit' || prismaStatus === 'in_transit_2') {
      const current = (await prisma.campaign.findUnique({ where: { id: params.id }, select: { statusNotes: true } }))?.statusNotes as any ?? {};
      statusNotesUpdate = { ...current, [prismaStatus === 'in_transit' ? 'in-transit' : 'in_transit_2']: statusNote };
    }
  }

  const updated = await prisma.campaign.update({
    where: { id: params.id },
    data: {
      ...(status        && { status: toPrismaStatus(status) as any }),
      ...(departureDate !== undefined && { departureDate: departureDate ? new Date(departureDate) : null }),
      ...(arrivalDate   !== undefined && { arrivalDate:   arrivalDate   ? new Date(arrivalDate)   : null }),
      ...(capacityKg    !== undefined && { capacityKg:    capacityKg    ? Number(capacityKg)      : null }),
      ...(statusNotesUpdate !== undefined && { statusNotes: statusNotesUpdate } as any),
    },
    include: { route: true },
  });

  // Cascade parcel statuses when campaign advances
  if (status) {
    const prismaStatus = toPrismaStatus(status);
    if (prismaStatus === 'in_transit' || prismaStatus === 'in_transit_2') {
      // All received parcels move to en_transit
      await prisma.parcel.updateMany({
        where: { campaignId: params.id, status: 'recu' },
        data:  { status: 'en_transit' },
      });
    } else if (prismaStatus === 'arrived') {
      // All in-transit parcels move to arrive
      await prisma.parcel.updateMany({
        where: { campaignId: params.id, status: 'en_transit' },
        data:  { status: 'arrive' },
      });
    }
  }

  return NextResponse.json({ ok: true, campaign: { ...updated, status: mapCampaignStatus(updated.status), statusNotes: (updated as any).statusNotes ?? {} } });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('campaigns');
  if (error) return error;

  await prisma.campaign.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
