export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const parcelId   = searchParams.get('parcelId');
  const campaignId = searchParams.get('campaignId');

  const bordereaux = await prisma.bordereau.findMany({
    where: {
      ...(parcelId   ? { parcelId } : {}),
      ...(campaignId ? { parcel: { campaignId } } : {}),
    },
    include: {
      parcel: {
        select: {
          trackingCode: true,
          weightKg:     true,
          priceXaf:     true,
          payment:      { select: { status: true } },
          client:       { select: { name: true, city: true } },
          campaign:     { select: { id: true, code: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(bordereaux.map(b => ({
    id:            b.id,
    code:          b.code,
    status:        b.status,
    description:   b.description,
    weightKg:      b.weightKg,
    nbPieces:      b.nbPieces,
    notes:         b.notes,
    createdAt:     b.createdAt,
    parcelId:      b.parcelId,
    trackingCode:  b.parcel.trackingCode,
    clientName:    b.parcel.client.name,
    clientCity:    b.parcel.client.city,
    amount:        b.parcel.priceXaf,
    paid:          b.parcel.payment?.status === 'completed' ? 'paid' : b.parcel.payment ? 'pending' : 'unpaid',
    campaign:      b.parcel.campaign.code,
    campaignId:    b.parcel.campaign.id,
  })));
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { parcelId, description, weightKg, nbPieces, notes } = await req.json();
  if (!parcelId) return NextResponse.json({ error: 'parcelId requis' }, { status: 400 });

  const parcel = await prisma.parcel.findUnique({ where: { id: parcelId }, select: { trackingCode: true } });
  if (!parcel) return NextResponse.json({ error: 'Colis introuvable' }, { status: 404 });

  const existing = await prisma.bordereau.count({ where: { parcelId } });
  const code = `BL-${parcel.trackingCode}-${String(existing + 1).padStart(2, '0')}`;

  const bordereau = await prisma.bordereau.create({
    data: {
      parcelId,
      code,
      description: description || null,
      weightKg:    weightKg ? Number(weightKg) : null,
      nbPieces:    nbPieces ? Number(nbPieces) : 1,
      notes:       notes    || null,
    },
  });
  return NextResponse.json({ ok: true, bordereau });
}
