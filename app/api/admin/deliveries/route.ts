export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requirePermission } from '@/src/lib/api-auth';

// Statuses where a home-delivery parcel is actionable (pending driver assignment or in delivery)
const DELIVERY_STATUSES = ['ard', 'lib', 'ver', 'pdl', 'liv', 'ok', 'tdl'];

export async function GET() {
  const { error } = await requirePermission('parcels');
  if (error) return error;

  const parcels = await prisma.parcel.findMany({
    where: {
      delivery: 'home',
      deletedAt: null,
      status: { in: DELIVERY_STATUSES },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      client:   { select: { id: true, name: true, phone: true } },
      campaign: { select: { id: true, code: true, route: { select: { origin: true, destination: true } } } },
      driver:   { select: { id: true, name: true, phone: true } },
    },
  });

  const drivers = await prisma.user.findMany({
    where: { role: 'driver', status: 'active' },
    select: { id: true, name: true, phone: true },
    orderBy: { name: 'asc' },
  });

  const result = parcels.map(p => ({
    id:           p.id,
    trackingCode: p.trackingCode,
    status:       p.status,
    recipName:    (p as any).recipName  ?? null,
    recipPhone:   (p as any).recipPhone ?? null,
    recipCity:    (p as any).recipCity  ?? null,
    notes:        (p as any).notes      ?? null,
    weightKg:     p.weightKg,
    priceXaf:     p.priceXaf,
    deliveredAt:  (p as any).deliveredAt ?? null,
    deliveryProof:(p as any).deliveryProof ?? null,
    createdAt:    p.createdAt,
    client:       { id: p.client.id, name: p.client.name, phone: p.client.phone },
    campaign:     { id: p.campaign.id, code: p.campaign.code, from: p.campaign.route.origin, to: p.campaign.route.destination },
    driver:       p.driver ? { id: p.driver.id, name: p.driver.name, phone: p.driver.phone } : null,
  }));

  return NextResponse.json({ parcels: result, drivers });
}
