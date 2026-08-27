export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/api-auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = (session!.user as any).id;

  const parcel = await prisma.parcel.findUnique({
    where: { id: params.id },
    include: {
      campaign: { include: { route: true } },
      payment:  true,
      trackingEvents: { orderBy: { createdAt: 'asc' }, include: { createdBy: { select: { name: true } } } },
      bordereaux: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!parcel || parcel.clientId !== userId) {
    return NextResponse.json({ error: 'Colis introuvable' }, { status: 404 });
  }

  // Allocated amount
  let allocated = 0;
  if (parcel.payment) {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COALESCE(SUM(amount),0)::int AS allocated FROM transaction_allocations WHERE "paymentId" = $1`,
      parcel.payment.id
    ).catch(() => [{ allocated: 0 }]);
    allocated = Number(rows[0]?.allocated ?? 0);
  }

  return NextResponse.json({
    id:                parcel.id,
    trackingCode:      parcel.trackingCode,
    description:       parcel.description,
    weightKg:          parcel.weightKg,
    priceXaf:          parcel.priceXaf,
    confirmedPriceXaf: (parcel as any).confirmedPriceXaf ?? null,
    adjustmentStatus:  (parcel as any).adjustmentStatus ?? 'none',
    recipName:         (parcel as any).recipName  ?? null,
    recipPhone:        (parcel as any).recipPhone ?? null,
    recipCity:         (parcel as any).recipCity  ?? null,
    delivery:          (parcel as any).delivery ?? 'pickup',
    status:            parcel.status,
    confirmed:         parcel.confirmed,
    notes:             (parcel as any).notes ?? null,
    createdAt:         parcel.createdAt,
    productType:       parcel.productType,
    nbCartons:         parcel.nbCartons,
    nbPetitsSacs:      parcel.nbPetitsSacs,
    nbSacsMoyens:      parcel.nbSacsMoyens,
    nbGrandsSacs:      parcel.nbGrandsSacs,
    nbPlastiques:      parcel.nbPlastiques,
    nbPlastiquesBiere: parcel.nbPlastiquesBiere,
    nbCasiers24x65:    parcel.nbCasiers24x65,
    nbCasiers24x33:    parcel.nbCasiers24x33,
    nbCasiers12x50:    parcel.nbCasiers12x50,
    marginPct:         parcel.marginPct,
    pricingDetails:    parcel.pricingDetails,
    items:             parcel.items,
    campaign: {
      id:              parcel.campaign.id,
      code:            parcel.campaign.code,
      status:          parcel.campaign.status,
      from:            parcel.campaign.route.origin,
      to:              parcel.campaign.route.destination,
      departureDate:   parcel.campaign.departureDate,
      arrivalDate:     parcel.campaign.arrivalDate,
      currency:        parcel.campaign.route.currency ?? 'CAD',
      exchangeRateToCAD: (parcel.campaign as any).exchangeRateToCAD ?? null,
    },
    payment: parcel.payment ? {
      id:         parcel.payment.id,
      amount:     parcel.payment.amount,
      status:     parcel.payment.status,
      paidAt:     parcel.payment.paidAt,
      interacRef: parcel.payment.interacRef,
      allocated,
      remaining:  Math.max(0, parcel.payment.amount - allocated),
    } : null,
    tracking: parcel.trackingEvents.map(e => ({
      status:      e.status,
      location:    e.location,
      note:        e.note,
      createdAt:   e.createdAt,
      createdBy:   e.createdBy?.name ?? null,
    })),
    bordereaux: parcel.bordereaux.map(b => ({
      id:                b.id,
      code:              b.code,
      status:            b.status,
      clientConfirmed:   b.clientConfirmed,
      clientConfirmedAt: b.clientConfirmedAt,
      description:       b.description,
      weightKg:          b.weightKg,
      nbPieces:          b.nbPieces,
      notes:             b.notes,
      items:             (b as any).items ?? [],
    })),
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = (session!.user as any).id;

  const parcel = await prisma.parcel.findUnique({
    where: { id: params.id },
    select: { id: true, clientId: true, status: true, trackingCode: true, payment: { select: { status: true } } },
  });

  if (!parcel || parcel.clientId !== userId || (parcel as any).deletedAt) {
    return NextResponse.json({ error: 'Colis introuvable' }, { status: 404 });
  }

  if (parcel.status !== 'enr') {
    return NextResponse.json(
      { error: 'Annulation impossible : votre colis a déjà été pris en charge. Contactez-nous pour toute demande.' },
      { status: 403 },
    );
  }

  if (parcel.payment?.status === 'completed' || parcel.payment?.status === 'partial') {
    return NextResponse.json(
      { error: 'Un paiement est associé à ce colis. Contactez notre équipe pour annuler.' },
      { status: 403 },
    );
  }

  let cancellationReason: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    if (body.reason) cancellationReason = String(body.reason).slice(0, 500);
  } catch {}

  await prisma.$executeRawUnsafe(
    `UPDATE parcels SET "deletedAt" = NOW(), status = 'ann', "cancellationReason" = $2 WHERE id = $1`,
    params.id,
    cancellationReason,
  );

  return NextResponse.json({ ok: true, trackingCode: parcel.trackingCode });
}

const EDITABLE_STATUSES = ['enr', 'rec', 'pre'];

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = (session!.user as any).id;

  const parcel = await prisma.parcel.findUnique({
    where: { id: params.id },
    select: { id: true, clientId: true, status: true },
  });

  if (!parcel || parcel.clientId !== userId) {
    return NextResponse.json({ error: 'Colis introuvable' }, { status: 404 });
  }

  if (!EDITABLE_STATUSES.includes(parcel.status)) {
    return NextResponse.json(
      { error: 'Ce colis ne peut plus être modifié (déjà en transit).' },
      { status: 403 },
    );
  }

  const body = await req.json();
  const {
    description, weightKg, notes, items,
    nbCartons, nbPetitsSacs, nbSacsMoyens, nbGrandsSacs,
    nbPlastiques, nbPlastiquesBiere,
    nbCasiers24x65, nbCasiers24x33, nbCasiers12x50,
  } = body;

  const data: any = {};
  if (description       !== undefined) data.description       = description;
  if (weightKg          !== undefined) data.weightKg          = Number(weightKg);
  if (notes             !== undefined) data.notes             = notes;
  if (items             !== undefined) data.items             = items;
  if (nbCartons         !== undefined) data.nbCartons         = Number(nbCartons);
  if (nbPetitsSacs      !== undefined) data.nbPetitsSacs      = Number(nbPetitsSacs);
  if (nbSacsMoyens      !== undefined) data.nbSacsMoyens      = Number(nbSacsMoyens);
  if (nbGrandsSacs      !== undefined) data.nbGrandsSacs      = Number(nbGrandsSacs);
  if (nbPlastiques      !== undefined) data.nbPlastiques      = Number(nbPlastiques);
  if (nbPlastiquesBiere !== undefined) data.nbPlastiquesBiere = Number(nbPlastiquesBiere);
  if (nbCasiers24x65    !== undefined) data.nbCasiers24x65    = Number(nbCasiers24x65);
  if (nbCasiers24x33    !== undefined) data.nbCasiers24x33    = Number(nbCasiers24x33);
  if (nbCasiers12x50    !== undefined) data.nbCasiers12x50    = Number(nbCasiers12x50);

  const updated = await prisma.parcel.update({
    where: { id: params.id },
    data,
    select: {
      id: true, description: true, weightKg: true, status: true, notes: true, items: true,
      nbCartons: true, nbPetitsSacs: true, nbSacsMoyens: true, nbGrandsSacs: true,
      nbPlastiques: true, nbPlastiquesBiere: true,
      nbCasiers24x65: true, nbCasiers24x33: true, nbCasiers12x50: true,
    },
  });

  return NextResponse.json({ ok: true, parcel: updated });
}
