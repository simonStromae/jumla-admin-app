export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

async function resolveToken(token: string) {
  // Look up token in settings (key = "plink:parcel:{parcelId}:{token}")
  const settings = await prisma.setting.findMany({
    where: { key: { endsWith: `:${token}` } },
  });
  const row = settings.find(s => s.key.startsWith('plink:parcel:'));
  if (!row) return { error: 'Lien invalide ou expiré', status: 404 };

  let meta: { parcelId: string; clientId: string; expiresAt: string };
  try { meta = JSON.parse(row.value); } catch { return { error: 'Token corrompu', status: 400 }; }

  if (new Date(meta.expiresAt) < new Date()) {
    return { error: 'Ce lien de paiement a expiré. Demandez un nouveau lien à Jumla Cargo.', status: 410 };
  }

  return { parcelId: meta.parcelId, clientId: meta.clientId };
}

export async function GET(_: NextRequest, { params }: { params: { token: string } }) {
  const resolved = await resolveToken(params.token);
  if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status });

  const parcel = await prisma.parcel.findUnique({
    where: { id: resolved.parcelId },
    include: {
      client:   { select: { id: true, name: true, phone: true, email: true, city: true } },
      campaign: { include: { route: true } },
      payment:  true,
    },
  });
  if (!parcel) return NextResponse.json({ error: 'Colis introuvable' }, { status: 404 });

  return NextResponse.json({
    trackingCode:  parcel.trackingCode,
    description:   parcel.description,
    weightKg:      parcel.weightKg,
    amount:        parcel.payment?.amount ?? parcel.priceXaf ?? 0,
    clientId:      parcel.client.id,
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

// Interac self-report (legacy path — kept for backward compat)
export async function POST(_: NextRequest, { params }: { params: { token: string } }) {
  const resolved = await resolveToken(params.token);
  if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status });

  const parcel = await prisma.parcel.findUnique({
    where: { id: resolved.parcelId },
    include: { payment: true },
  });
  if (!parcel) return NextResponse.json({ error: 'Colis introuvable' }, { status: 404 });

  if (!parcel.payment) {
    await prisma.payment.create({
      data: { parcelId: parcel.id, clientId: parcel.clientId, amount: parcel.priceXaf ?? 0, status: 'pending' },
    });
  }
  return NextResponse.json({ ok: true });
}
