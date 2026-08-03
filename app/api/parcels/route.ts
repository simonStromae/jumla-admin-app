export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin, requirePermission } from '@/src/lib/api-auth';

function genTrackingCode() {
  return 'JMS-' + String(Math.floor(10000 + Math.random() * 90000));
}

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get('campaign');

  const queryOpts = {
    orderBy: { createdAt: 'desc' as const },
    include: {
      client:         { select: { id: true, name: true, email: true, phone: true, city: true } },
      campaign:       { select: { id: true, code: true } },
      payment:        true,
      trackingEvents: { orderBy: { createdAt: 'desc' as const }, take: 1 },
    },
  };

  // Include client-cancelled parcels (deletedAt set + status='ann') alongside admin-cancelled ones
  const baseWhere = campaignId ? { campaignId } : {};
  let parcels: any[];
  try {
    parcels = await (prisma.parcel.findMany as any)({
      where: {
        ...baseWhere,
        OR: [{ deletedAt: null }, { status: 'ann' }],
      },
      ...queryOpts,
    });
  } catch {
    parcels = await prisma.parcel.findMany({
      where: baseWhere,
      ...queryOpts,
    });
  }

  // Last WhatsApp log per parcel
  const parcelIds = parcels.map(p => p.id);
  let lastWhatsappMap: Record<string, { status: string; sentAt: Date }> = {};
  if (parcelIds.length) {
    const logs = await prisma.$queryRawUnsafe<{ parcelId: string; status: string; sentAt: Date }[]>(
      `SELECT DISTINCT ON ("parcelId") "parcelId", status, "sentAt"
       FROM whatsapp_logs
       WHERE "parcelId" = ANY($1::text[])
       ORDER BY "parcelId", "sentAt" DESC`,
      parcelIds
    ).catch(() => []);
    for (const l of logs) lastWhatsappMap[l.parcelId] = { status: l.status, sentAt: l.sentAt };
  }

  const result = parcels.map(p => ({
    id:           p.id,
    code:         p.trackingCode,
    trackingCode: p.trackingCode,
    campaign:     p.campaign.code,
    campaignId:   p.campaignId,
    clientId:     p.clientId,
    senderName:   p.client.name,
    senderPhone:  p.client.phone ?? '—',
    recipName:    p.recipName  ?? '—',
    recipPhone:   p.recipPhone ?? '—',
    recipCity:    p.recipCity  ?? '—',
    description:  p.description,
    actualKg:     p.weightKg,
    reservedKg:   p.weightKg,
    weightKg:     p.weightKg,
    amount:            p.payment?.amount ?? p.priceXaf,
    priceXaf:          p.priceXaf,
    confirmedPriceXaf: (p as any).confirmedPriceXaf ?? null,
    adjustmentStatus:  (p as any).adjustmentStatus  ?? 'none',
    declaredValue: p.declaredValue,
    paid:         p.status === 'ann' ? 'ann' : p.payment?.status === 'completed' ? 'paid' : p.payment ? 'pending' : 'unpaid',
    cancellationReason: (p as any).cancellationReason ?? null,
    status:       p.status,
    confirmed:    p.confirmed,
    notes:        p.notes,
    delivery:     p.delivery ?? 'pickup',
    createdAt:    p.createdAt,
    payment:      p.payment,
    lastWhatsapp: lastWhatsappMap[p.id] ?? null,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { error } = await requirePermission('parcels');
  if (error) return error;

  const body = await req.json();
  const {
    clientId, campaignId, description, weightKg, priceXaf, declaredValue, notes,
    productType, nbCartons, nbPetitsSacs, nbSacsMoyens, nbGrandsSacs,
    nbPlastiques, nbPlastiquesBiere, nbCasiers24x65, nbCasiers24x33, nbCasiers12x50,
    marginPct, pricingDetails, items,
    recipName, recipPhone, recipCity, recipAddress, recipApt, recipProvince, recipPostal, delivery,
  } = body;

  // Build delivery address note
  let deliveryNote = '';
  if (delivery === 'home' && recipAddress) {
    deliveryNote = `Livraison: ${recipAddress}${recipApt ? ` apt ${recipApt}` : ''}, ${recipCity || ''}, ${recipProvince || ''} ${recipPostal || ''}`.trim();
  }
  const finalNotes = [notes, deliveryNote].filter(Boolean).join('\n') || null;

  if (!clientId || !campaignId) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
  }

  // Block adding parcels to campaigns that are no longer open
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { status: true } });
  if (!campaign) return NextResponse.json({ error: 'Cargaison introuvable' }, { status: 404 });
  if (campaign.status !== 'enr') {
    return NextResponse.json({ error: 'Cette cargaison n\'est plus ouverte — impossible d\'ajouter un colis' }, { status: 409 });
  }

  const finalWeightKg = weightKg ? Number(weightKg) : (Array.isArray(items) ? items.reduce((s: number, i: any) => s + (Number(i.weightKg) || 0), 0) : 0);

  const finalPriceXaf = priceXaf ? Number(priceXaf) : null;

  const parcel = await prisma.parcel.create({
    data: {
      clientId,
      campaignId,
      trackingCode:     genTrackingCode(),
      description,
      weightKg:         finalWeightKg,
      priceXaf:         finalPriceXaf,
      declaredValue:    declaredValue ? Number(declaredValue) : null,
      notes:            finalNotes,
      recipName:        recipName  || null,
      recipPhone:       recipPhone || null,
      recipCity:        recipCity  || null,
      delivery:         delivery   ?? 'pickup',
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
      marginPct:        marginPct !== undefined ? Number(marginPct) : 0,
      pricingDetails:   pricingDetails   ?? undefined,
      items:            items            ?? undefined,
    },
    include: { client: true, campaign: true },
  });

  // Auto-create a pending payment record so invoices and Interac links work immediately
  if (finalPriceXaf && finalPriceXaf > 0) {
    await prisma.payment.create({
      data: {
        parcelId: parcel.id,
        clientId: parcel.clientId,
        amount:   finalPriceXaf,
        status:   'pending',
      },
    });
  }

  return NextResponse.json({ ok: true, parcel });
}
