export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(req: NextRequest) {
  const routeId = new URL(req.url).searchParams.get('routeId');

  const campaigns = await prisma.campaign.findMany({
    where: {
      status: 'enr',
      ...(routeId ? { routeId } : {}),
    },
    include: {
      route:   { select: { origin: true, destination: true, label: true } },
      parcels: { select: { weightKg: true } },
    },
    orderBy: { departureDate: 'asc' },
  });

  return NextResponse.json(campaigns.map(c => {
    const usedKg  = c.parcels.reduce((s, p) => s + (p.weightKg ?? 0), 0);
    const spotsKg = c.capacityKg ? Math.max(0, c.capacityKg - usedKg) : null;
    return {
      id:            c.id,
      code:          c.code,
      routeId:       c.routeId,
      departureDate: c.departureDate,
      arrivalDate:   c.arrivalDate,
      capacityKg:    c.capacityKg,
      usedKg:        Math.round(usedKg),
      spotsKg:       spotsKg !== null ? Math.round(spotsKg) : null,
    };
  }));
}
