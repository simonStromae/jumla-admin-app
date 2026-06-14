export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/api-auth';

export async function GET(_: NextRequest, { params }: { params: { blId: string } }) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = (session!.user as any).id;

  const bl = await prisma.bordereau.findUnique({
    where: { id: params.blId },
    include: {
      parcel: {
        include: {
          client:   { select: { id: true, name: true, phone: true, city: true } },
          campaign: { include: { route: true } },
          payment:  { select: { status: true, paidAt: true, amount: true } },
        },
      },
    },
  });

  if (!bl) return NextResponse.json({ error: 'Bordereau introuvable' }, { status: 404 });
  if (bl.parcel.clientId !== userId) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  return NextResponse.json({
    id:          bl.id,
    code:        bl.code,
    description: bl.description,
    weightKg:    bl.weightKg,
    nbPieces:    bl.nbPieces,
    notes:       bl.notes,
    status:      bl.status,
    items:       (bl as any).items ?? [],
    createdAt:   bl.createdAt,
    clientConfirmed:   bl.clientConfirmed,
    clientConfirmedAt: bl.clientConfirmedAt,
    parcel: {
      id:           bl.parcel.id,
      trackingCode: bl.parcel.trackingCode,
      description:  bl.parcel.description,
      weightKg:     bl.parcel.weightKg,
      items:        (bl.parcel as any).items ?? [],
    },
    client: {
      name:  bl.parcel.client.name,
      phone: bl.parcel.client.phone,
      city:  bl.parcel.client.city,
    },
    campaign: {
      code:          bl.parcel.campaign.code,
      from:          bl.parcel.campaign.route.origin,
      to:            bl.parcel.campaign.route.destination,
      departureDate: bl.parcel.campaign.departureDate,
      arrivalDate:   bl.parcel.campaign.arrivalDate,
    },
    payment: bl.parcel.payment ? {
      amount: bl.parcel.payment.amount,
      status: bl.parcel.payment.status,
      paidAt: bl.parcel.payment.paidAt,
    } : null,
    paid:   bl.parcel.payment?.status === 'completed',
    paidAt: bl.parcel.payment?.paidAt ?? null,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { blId: string } }) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = (session!.user as any).id;

  const bl = await prisma.bordereau.findUnique({
    where: { id: params.blId },
    select: {
      id: true,
      code: true,
      status: true,
      clientConfirmed: true,
      parcel: { select: { clientId: true, id: true, trackingCode: true } },
    },
  });

  if (!bl) return NextResponse.json({ error: 'Bordereau introuvable' }, { status: 404 });
  if (bl.parcel.clientId !== userId) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  if (bl.clientConfirmed) {
    return NextResponse.json({ error: 'Déjà confirmé.' }, { status: 400 });
  }

  try {
    await prisma.bordereau.update({
      where: { id: bl.id },
      data: { clientConfirmed: true, clientConfirmedAt: new Date() },
    });
  } catch (e: any) {
    console.error('[bordereau PATCH]', e);
    return NextResponse.json({ error: e?.message ?? 'Erreur serveur' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
