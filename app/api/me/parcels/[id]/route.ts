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
      trackingEvents: { orderBy: { createdAt: 'asc' } },
      bordereaux: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!parcel || parcel.clientId !== userId) {
    return NextResponse.json({ error: 'Colis introuvable' }, { status: 404 });
  }

  // Extra bordereau fields
  const blIds = parcel.bordereaux.map(b => b.id);
  let blExtra: Record<string, any> = {};
  if (blIds.length) {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, status, "clientConfirmed", "clientConfirmedAt", items, description, "weightKg", "nbPieces", notes
       FROM bordereaux WHERE id = ANY($1::text[])`,
      blIds
    ).catch(() => []);
    for (const r of rows) blExtra[r.id] = r;
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
    id:           parcel.id,
    trackingCode: parcel.trackingCode,
    description:  parcel.description,
    weightKg:     parcel.weightKg,
    priceXaf:     parcel.priceXaf,
    status:       parcel.status,
    confirmed:    parcel.confirmed,
    notes:        (parcel as any).notes ?? null,
    createdAt:    parcel.createdAt,
    campaign: {
      id:            parcel.campaign.id,
      code:          parcel.campaign.code,
      status:        parcel.campaign.status,
      from:          parcel.campaign.route.origin,
      to:            parcel.campaign.route.destination,
      departureDate: parcel.campaign.departureDate,
      arrivalDate:   parcel.campaign.arrivalDate,
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
      status:    e.status,
      location:  e.location,
      note:      e.note,
      createdAt: e.createdAt,
    })),
    bordereaux: parcel.bordereaux.map(b => {
      const ex = blExtra[b.id] ?? {};
      return {
        id:              b.id,
        code:            b.code,
        status:          ex.status ?? 'en_attente',
        clientConfirmed: ex.clientConfirmed ?? false,
        clientConfirmedAt: ex.clientConfirmedAt ?? null,
        description:     ex.description ?? null,
        weightKg:        ex.weightKg ?? null,
        nbPieces:        ex.nbPieces ?? null,
        notes:           ex.notes ?? null,
        items:           ex.items ?? [],
      };
    }),
  });
}

const EDITABLE_STATUSES = ['en_attente', 'recu'];

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

  const { description, weightKg } = await req.json();

  const updated = await prisma.parcel.update({
    where: { id: params.id },
    data: {
      ...(description !== undefined && { description }),
      ...(weightKg    !== undefined && { weightKg: Number(weightKg) }),
    },
    select: { id: true, description: true, weightKg: true, status: true },
  });

  return NextResponse.json({ ok: true, parcel: updated });
}
