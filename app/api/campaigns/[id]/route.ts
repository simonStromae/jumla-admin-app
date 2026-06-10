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
    collected: c.parcels.reduce((s, p) =>
      s + (p.payment?.status === 'completed' ? p.payment.amount : 0), 0),
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('campaigns');
  if (error) return error;

  const body = await req.json();
  const { status, departureDate, arrivalDate, capacityKg } = body;

  const updated = await prisma.campaign.update({
    where: { id: params.id },
    data: {
      ...(status        && { status: toPrismaStatus(status) as any }),
      ...(departureDate !== undefined && { departureDate: departureDate ? new Date(departureDate) : null }),
      ...(arrivalDate   !== undefined && { arrivalDate:   arrivalDate   ? new Date(arrivalDate)   : null }),
      ...(capacityKg    !== undefined && { capacityKg:    capacityKg    ? Number(capacityKg)      : null }),
    },
    include: { route: true },
  });

  // Cascade parcel statuses when campaign advances
  if (status) {
    const prismaStatus = toPrismaStatus(status);
    if (prismaStatus === 'in_transit') {
      // All received parcels move to in_transit
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

  return NextResponse.json({ ok: true, campaign: { ...updated, status: mapCampaignStatus(updated.status) } });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('campaigns');
  if (error) return error;

  await prisma.campaign.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
