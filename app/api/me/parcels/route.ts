export const dynamic = 'force-dynamic';
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
      trackingEvents: { orderBy: { createdAt: 'asc' } },
      bordereaux: { orderBy: { createdAt: 'asc' } },
    },
  });

  // Fetch extra columns outside Prisma schema for bordereaux
  const blIds = parcels.flatMap(p => p.bordereaux.map(b => b.id));
  let blExtra: Record<string, { status: string; clientConfirmed: boolean }> = {};
  if (blIds.length) {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, status, "clientConfirmed" FROM bordereaux WHERE id = ANY($1::text[])`,
      blIds
    ).catch(() => []);
    for (const r of rows) blExtra[r.id] = { status: r.status, clientConfirmed: r.clientConfirmed ?? false };
  }

  // Fetch allocated amounts for payments
  const paymentIds = parcels.map(p => p.payment?.id).filter(Boolean) as string[];
  let allocMap: Record<string, number> = {};
  if (paymentIds.length) {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT "paymentId", COALESCE(SUM(amount),0)::int AS allocated
       FROM transaction_allocations WHERE "paymentId" = ANY($1::text[])
       GROUP BY "paymentId"`,
      paymentIds
    ).catch(() => []);
    for (const r of rows) allocMap[r.paymentId] = Number(r.allocated);
  }

  const result = parcels.map(p => {
    const allocated = p.payment ? (allocMap[p.payment.id] ?? 0) : 0;
    const paymentRemaining = p.payment ? Math.max(0, p.payment.amount - allocated) : 0;
    return {
      id:           p.id,
      trackingCode: p.trackingCode,
      description:  p.description,
      weightKg:     p.weightKg,
      priceXaf:     p.priceXaf,
      status:       p.status,
      confirmed:    p.confirmed,
      createdAt:    p.createdAt,
      campaign: {
        id:            p.campaign.id,
        code:          p.campaign.code,
        status:        p.campaign.status,
        from:          p.campaign.route.origin,
        to:            p.campaign.route.destination,
        departureDate: p.campaign.departureDate,
        arrivalDate:   p.campaign.arrivalDate,
      },
      payment: p.payment ? {
        id:         p.payment.id,
        amount:     p.payment.amount,
        status:     p.payment.status,
        paidAt:     p.payment.paidAt,
        interacRef: p.payment.interacRef,
        allocated,
        remaining:  paymentRemaining,
      } : null,
      tracking: p.trackingEvents.map(e => ({
        status:    e.status,
        location:  e.location,
        note:      e.note,
        createdAt: e.createdAt,
      })),
      bordereaux: p.bordereaux.map(b => ({
        id:              b.id,
        code:            b.code,
        nbPieces:        b.nbPieces,
        status:          blExtra[b.id]?.status ?? 'enr',
        clientConfirmed: blExtra[b.id]?.clientConfirmed ?? false,
      })),
    };
  });

  return NextResponse.json(result);
}
