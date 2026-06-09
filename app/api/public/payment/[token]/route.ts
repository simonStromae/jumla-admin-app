export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(_: NextRequest, { params }: { params: { token: string } }) {
  const parcel = await prisma.parcel.findUnique({
    where: { id: params.token },
    include: {
      client:   { select: { name: true, phone: true, email: true, city: true } },
      campaign: { include: { route: true } },
      payment:  true,
    },
  });

  if (!parcel) return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 404 });

  return NextResponse.json({
    trackingCode:  parcel.trackingCode,
    description:   parcel.description,
    weightKg:      parcel.weightKg,
    amount:        parcel.payment?.amount ?? parcel.priceXaf ?? 0,
    clientName:    parcel.client.name,
    clientPhone:   parcel.client.phone,
    clientEmail:   parcel.client.email,
    clientCity:    parcel.client.city,
    campaign: {
      code: parcel.campaign.code,
      from: parcel.campaign.route.origin,
      to:   parcel.campaign.route.destination,
    },
    paymentStatus: parcel.payment?.status ?? 'unpaid',
    interacRef:    parcel.payment?.interacRef ?? null,
  });
}

export async function POST(_: NextRequest, { params }: { params: { token: string } }) {
  const parcel = await prisma.parcel.findUnique({
    where: { id: params.token },
    include: { payment: true },
  });

  if (!parcel) return NextResponse.json({ error: 'Lien invalide' }, { status: 404 });

  if (!parcel.payment) {
    await prisma.payment.create({
      data: {
        parcelId: parcel.id,
        clientId: parcel.clientId,
        amount:   parcel.priceXaf ?? 0,
        status:   'pending',
      },
    });
  }

  return NextResponse.json({ ok: true });
}
