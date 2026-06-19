export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/api-auth';

export async function GET(_: NextRequest, { params }: { params: { parcelId: string } }) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = (session!.user as any).id;

  const parcel = await prisma.parcel.findUnique({
    where: { id: params.parcelId },
    include: {
      client:   { select: { id: true, name: true, phone: true, email: true, city: true } },
      campaign: { include: { route: true } },
      payment:  true,
      bordereaux: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!parcel) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  if (parcel.clientId !== userId) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const confirmedPriceXaf = (parcel as any).confirmedPriceXaf ?? null;
  const adjustmentStatus  = (parcel as any).adjustmentStatus  ?? 'none';
  const priceXaf          = parcel.priceXaf ?? null;

  return NextResponse.json({
    invoiceNumber:     'FAC-' + parcel.trackingCode,
    issueDate:         parcel.createdAt,
    trackingCode:      parcel.trackingCode,
    description:       parcel.description,
    weightKg:          parcel.weightKg,
    notes:             (parcel as any).notes ?? null,
    priceXaf,
    confirmedPriceXaf,
    adjustmentStatus,
    amount:            parcel.payment?.amount ?? priceXaf ?? 0,
    pricingDetails:    parcel.pricingDetails,
    client: {
      name:  parcel.client.name,
      phone: parcel.client.phone,
      email: parcel.client.email,
      city:  parcel.client.city,
    },
    recipient: {
      name:  (parcel as any).recipName  ?? null,
      phone: (parcel as any).recipPhone ?? null,
      city:  (parcel as any).recipCity  ?? null,
    },
    campaign: {
      code:          parcel.campaign.code,
      from:          parcel.campaign.route.origin,
      to:            parcel.campaign.route.destination,
      departureDate: parcel.campaign.departureDate,
      arrivalDate:   parcel.campaign.arrivalDate,
    },
    payment: parcel.payment ? {
      status:     parcel.payment.status,
      paidAt:     parcel.payment.paidAt,
      interacRef: parcel.payment.interacRef,
    } : null,
    bordereaux: parcel.bordereaux.map(b => ({
      id:        b.id,
      code:      b.code,
      nbPieces:  b.nbPieces,
      weightKg:  b.weightKg,
    })),
  });
}
