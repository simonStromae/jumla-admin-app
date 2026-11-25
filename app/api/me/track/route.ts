export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/api-auth';

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = (session!.user as any).id;
  const code = new URL(req.url).searchParams.get('code')?.trim().toUpperCase();
  if (!code) return NextResponse.json({ error: 'Code requis' }, { status: 400 });

  const parcel = await prisma.parcel.findFirst({
    where: { trackingCode: code },
    include: {
      campaign: { include: { route: true } },
      payment: true,
      trackingEvents: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!parcel) return NextResponse.json({ error: 'Colis introuvable' }, { status: 404 });

  const isOwner = parcel.clientId === userId;

  let paymentRemaining: number | null = null;
  if (isOwner && parcel.payment) {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COALESCE(SUM(amount),0)::int AS allocated FROM transaction_allocations WHERE "paymentId" = $1`,
      parcel.payment.id
    ).catch(() => [{ allocated: 0 }]);
    const allocated = Number(rows[0]?.allocated ?? 0);
    paymentRemaining = Math.max(0, parcel.payment.amount - allocated);
  }

  return NextResponse.json({
    trackingCode: parcel.trackingCode,
    description: parcel.description,
    weightKg: parcel.weightKg,
    status: parcel.status,
    createdAt: parcel.createdAt,
    campaign: {
      code: parcel.campaign.code,
      from: parcel.campaign.route.origin,
      to: parcel.campaign.route.destination,
      departureDate: parcel.campaign.departureDate,
      arrivalDate: parcel.campaign.arrivalDate,
      status: parcel.campaign.status,
    },
    paid: parcel.payment?.status === 'paid',
    tracking: parcel.trackingEvents.map(e => ({
      status: e.status,
      location: e.location,
      note: e.note,
      createdAt: e.createdAt,
    })),
    isOwner,
    ...(isOwner && {
      parcelId: parcel.id,
      priceXaf: parcel.priceXaf,
      confirmedPriceXaf: (parcel as any).confirmedPriceXaf ?? null,
      currency: (parcel.campaign.route as any).currency ?? 'CAD',
      paymentStatus: parcel.payment?.status ?? null,
      paymentAmount: parcel.payment?.amount ?? null,
      paymentRemaining,
    }),
  });
}
