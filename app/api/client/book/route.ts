export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/api-auth';

// Map client-side category IDs → admin productType values
const CAT_TO_PRODUCT_TYPE: Record<string, string> = {
  standard:    'standard',
  vetements:   'vetements',
  cosmetiques: 'cosmetique',
  alimentaire: 'standard',
  electronique: 'standard',
  documents:   'standard',
};

function genTrackingCode() {
  return 'JMS-' + String(Math.floor(10000 + Math.random() * 90000));
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const userId = (session.user as any).id as string;

  const body = await req.json();
  const {
    campaignId,
    items,          // [{cat, desc, pieces, kg}]
    addons,
    senderPhone,
    recipName,
    recipPhone,
    recipCity,
    recipCityCustom,
    recipAddress,
    recipApt,
    recipProvince,
    recipPostal,
    delivery,
    totalPrice,     // pre-calculated by client
    notes,
  } = body;

  if (!campaignId) {
    return NextResponse.json({ error: 'Cargaison requise' }, { status: 400 });
  }

  // Map items to admin format
  const mappedItems = Array.isArray(items) ? items
    .filter((i: any) => parseFloat(i.kg) > 0)
    .map((i: any) => ({
      description: i.desc || null,
      productType: CAT_TO_PRODUCT_TYPE[i.cat] || 'standard',
      weightKg:    parseFloat(i.kg) || 0,
      nbPieces:    i.pieces > 1 ? Number(i.pieces) : null,
    })) : [];

  const totalWeightKg = mappedItems.reduce((s, i) => s + i.weightKg, 0);

  // Dominant product type (heaviest item's type, for pricing fields)
  const dominantType = mappedItems.reduce((best: any, item: any) => {
    return item.weightKg > best.w ? { type: item.productType, w: item.weightKg } : best;
  }, { type: 'standard', w: 0 }).type;

  // Build description summary
  const description = mappedItems.map(i => i.description).filter(Boolean).join(' · ') || null;

  // Recipient city: combine city + custom
  const finalCity = recipCity === 'Hors région' ? (recipCityCustom || 'Hors région') : (recipCity || 'Montréal');

  // Delivery address as notes addition
  let deliveryNote = '';
  if (delivery === 'home' && recipAddress) {
    deliveryNote = `Livraison: ${recipAddress}${recipApt ? ` apt ${recipApt}` : ''}, ${finalCity}, ${recipProvince} ${recipPostal || ''}`.trim();
  } else if (delivery === 'expedition' && recipAddress) {
    deliveryNote = `Expédition: ${recipAddress}${recipApt ? ` apt ${recipApt}` : ''}, ${finalCity}, ${recipProvince} ${recipPostal || ''}`.trim();
  }
  const finalNotes = [notes, deliveryNote].filter(Boolean).join('\n') || null;

  // Update client phone if provided
  if (senderPhone) {
    await prisma.user.update({
      where: { id: userId },
      data: { phone: senderPhone, city: finalCity },
    }).catch(() => {});
  }

  const parcel = await prisma.parcel.create({
    data: {
      clientId:     userId,
      campaignId,
      trackingCode: genTrackingCode(),
      description,
      weightKg:     totalWeightKg || null,
      priceXaf:     totalPrice ? Math.round(Number(totalPrice)) : null,
      productType:  dominantType,
      nbCartons:    addons?.cartons    || 0,
      nbPetitsSacs: addons?.smallBag   || 0,
      nbSacsMoyens: addons?.mediumBag  || 0,
      nbGrandsSacs: addons?.largeBag   || 0,
      marginPct:    30,
      items:        mappedItems.length > 0 ? mappedItems : undefined,
      notes:        finalNotes,
    },
    include: { campaign: { select: { code: true } } },
  });

  // Create initial tracking event
  await prisma.trackingEvent.create({
    data: {
      parcelId:    parcel.id,
      status:      'en_attente',
      note:        'Réservation client enregistrée',
      createdById: userId,
    },
  });

  // Create pending payment record
  if (totalPrice && Number(totalPrice) > 0) {
    await prisma.payment.create({
      data: {
        parcelId: parcel.id,
        clientId: userId,
        amount:   Math.round(Number(totalPrice)),
        status:   'pending',
      },
    }).catch(() => {});
  }

  return NextResponse.json({
    ok:           true,
    trackingCode: parcel.trackingCode,
    parcelId:     parcel.id,
    campaign:     parcel.campaign.code,
  });
}
