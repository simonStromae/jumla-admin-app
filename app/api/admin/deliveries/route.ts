export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requirePermission } from '@/src/lib/api-auth';

const HOME_STATUSES   = ['ard', 'lib', 'ver', 'pdl', 'liv', 'ok', 'tdl'];
const PICKUP_STATUSES = ['pdl']; // ready for warehouse pickup

function mapParcel(p: any) {
  return {
    id:           p.id,
    trackingCode: p.trackingCode,
    status:       p.status,
    delivery:     p.delivery ?? 'pickup',
    recipName:    p.recipName   ?? null,
    recipPhone:   p.recipPhone  ?? null,
    recipCity:    p.recipCity   ?? null,
    notes:        p.notes       ?? null,
    weightKg:     p.weightKg,
    priceXaf:     p.priceXaf,
    deliveredAt:  p.deliveredAt  ?? null,
    deliveryProof: p.deliveryProof ?? null,
    createdAt:    p.createdAt,
    client:   { id: p.client.id, name: p.client.name, phone: p.client.phone },
    campaign: { id: p.campaign.id, code: p.campaign.code, from: p.campaign.route.origin, to: p.campaign.route.destination },
    driver:   p.driver ? { id: p.driver.id, name: p.driver.name, phone: p.driver.phone } : null,
  };
}

const INCLUDE = {
  client:   { select: { id: true, name: true, phone: true } },
  campaign: { select: { id: true, code: true, route: { select: { origin: true, destination: true } } } },
  driver:   { select: { id: true, name: true, phone: true } },
};

export async function GET() {
  const { error } = await requirePermission('parcels');
  if (error) return error;

  const [homeParcels, pickupParcels, drivers] = await Promise.all([
    (prisma.parcel.findMany as any)({
      where: { delivery: 'home', deletedAt: null, status: { in: HOME_STATUSES } },
      orderBy: { createdAt: 'desc' },
      include: INCLUDE,
    }),
    (prisma.parcel.findMany as any)({
      where: { delivery: { not: 'home' }, deletedAt: null, status: { in: PICKUP_STATUSES } },
      orderBy: { createdAt: 'desc' },
      include: INCLUDE,
    }),
    prisma.user.findMany({
      where: { role: 'driver', status: 'active' },
      select: { id: true, name: true, phone: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return NextResponse.json({
    home:    homeParcels.map(mapParcel),
    pickup:  pickupParcels.map(mapParcel),
    drivers,
  });
}
