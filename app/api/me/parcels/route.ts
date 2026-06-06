import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/api-auth';

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = (session!.user as any).id;

  const parcels = await prisma.parcel.findMany({
    where:   { clientId: userId },
    orderBy: { createdAt: 'desc' },
    include: {
      campaign: { include: { route: true } },
      payment:  true,
      trackingEvents: { orderBy: { createdAt: 'desc' } },
    },
  });

  const result = parcels.map(p => ({
    id:           p.id,
    trackingCode: p.trackingCode,
    description:  p.description,
    weightKg:     p.weightKg,
    priceXaf:     p.priceXaf,
    status:       p.status,
    confirmed:    p.confirmed,
    createdAt:    p.createdAt,
    campaign: {
      id:     p.campaign.id,
      code:   p.campaign.code,
      status: p.campaign.status,
      from:   p.campaign.route.origin,
      to:     p.campaign.route.destination,
      departureDate: p.campaign.departureDate,
      arrivalDate:   p.campaign.arrivalDate,
    },
    payment: p.payment ? {
      amount:     p.payment.amount,
      status:     p.payment.status,
      paidAt:     p.payment.paidAt,
      interacRef: p.payment.interacRef,
    } : null,
    tracking: p.trackingEvents.map(e => ({
      status:    e.status,
      location:  e.location,
      note:      e.note,
      createdAt: e.createdAt,
    })),
  }));

  return NextResponse.json(result);
}
