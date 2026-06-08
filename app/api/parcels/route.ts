export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

function genTrackingCode() {
  return 'JMS-' + String(Math.floor(10000 + Math.random() * 90000));
}

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get('campaign');

  const parcels = await prisma.parcel.findMany({
    where: campaignId ? { campaignId } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      client:   { select: { id: true, name: true, email: true, phone: true, city: true } },
      campaign: { select: { id: true, code: true } },
      payment:  true,
      trackingEvents: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  const result = parcels.map(p => ({
    id:           p.id,
    code:         p.trackingCode,
    trackingCode: p.trackingCode,
    campaign:     p.campaign.code,
    campaignId:   p.campaignId,
    clientId:     p.clientId,
    senderName:   p.client.name,
    senderPhone:  p.client.phone ?? '—',
    recipName:    p.client.name,
    recipPhone:   p.client.phone ?? '—',
    recipCity:    p.client.city  ?? '—',
    description:  p.description,
    actualKg:     p.weightKg,
    reservedKg:   p.weightKg,
    weightKg:     p.weightKg,
    amount:       p.priceXaf,
    priceXaf:     p.priceXaf,
    declaredValue: p.declaredValue,
    paid:         p.payment?.status === 'completed' ? 'paid' : p.payment ? 'pending' : 'unpaid',
    status:       p.status,
    confirmed:    p.confirmed,
    notes:        p.notes,
    delivery:     'pickup',
    createdAt:    p.createdAt,
    payment:      p.payment,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const {
    clientId, campaignId, description, weightKg, priceXaf, declaredValue, notes,
    productType, nbCartons, nbPetitsSacs, nbSacsMoyens, nbGrandsSacs,
    nbPlastiques, nbPlastiquesBiere, nbCasiers24x65, nbCasiers24x33, nbCasiers12x50,
    marginPct, pricingDetails, items,
  } = body;

  if (!clientId || !campaignId) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
  }

  const finalWeightKg = weightKg ? Number(weightKg) : (Array.isArray(items) ? items.reduce((s: number, i: any) => s + (Number(i.weightKg) || 0), 0) : 0);

  const parcel = await prisma.parcel.create({
    data: {
      clientId,
      campaignId,
      trackingCode:     genTrackingCode(),
      description,
      weightKg:         finalWeightKg,
      priceXaf:         priceXaf ? Number(priceXaf) : null,
      declaredValue:    declaredValue ? Number(declaredValue) : null,
      notes,
      productType:      productType      ?? 'standard',
      nbCartons:        nbCartons        ? Number(nbCartons)        : 0,
      nbPetitsSacs:     nbPetitsSacs     ? Number(nbPetitsSacs)     : 0,
      nbSacsMoyens:     nbSacsMoyens     ? Number(nbSacsMoyens)     : 0,
      nbGrandsSacs:     nbGrandsSacs     ? Number(nbGrandsSacs)     : 0,
      nbPlastiques:     nbPlastiques     ? Number(nbPlastiques)     : 0,
      nbPlastiquesBiere:nbPlastiquesBiere? Number(nbPlastiquesBiere): 0,
      nbCasiers24x65:   nbCasiers24x65   ? Number(nbCasiers24x65)   : 0,
      nbCasiers24x33:   nbCasiers24x33   ? Number(nbCasiers24x33)   : 0,
      nbCasiers12x50:   nbCasiers12x50   ? Number(nbCasiers12x50)   : 0,
      marginPct:        marginPct        ? Number(marginPct)        : 30,
      pricingDetails:   pricingDetails   ?? undefined,
      items:            items            ?? undefined,
    },
    include: { client: true, campaign: true },
  });

  return NextResponse.json({ ok: true, parcel });
}
