export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  // id param may be the bordereau UUID or the human-readable code
  const bl = await prisma.bordereau.findFirst({
    where: { OR: [{ id: params.id }, { code: params.id }] },
    include: {
      parcel: {
        include: {
          client:   { select: { name: true, phone: true, city: true, email: true } },
          campaign: { include: { route: true } },
          payment:  { select: { status: true, amount: true, paidAt: true, interacRef: true } },
        },
      },
    },
  });

  if (!bl) return NextResponse.json({ error: 'Bordereau introuvable' }, { status: 404 });

  const parcel   = bl.parcel;
  const campaign = parcel.campaign;
  const route    = campaign.route;

  const items = Array.isArray(parcel.items) ? parcel.items : [];

  return NextResponse.json({
    id:          bl.id,
    code:        bl.code,
    status:      bl.status,
    description: bl.description,
    weightKg:    bl.weightKg,
    nbPieces:    bl.nbPieces,
    notes:       bl.notes,
    createdAt:   bl.createdAt,
    client: {
      name:  parcel.client.name,
      phone: parcel.client.phone,
      city:  parcel.client.city,
      email: parcel.client.email,
    },
    campaign: {
      code:          campaign.code,
      from:          route.origin,
      to:            route.destination,
      departureDate: campaign.departureDate,
      arrivalDate:   campaign.arrivalDate,
    },
    parcel: {
      id:           parcel.id,
      trackingCode: parcel.trackingCode,
      description:  parcel.description,
      weightKg:     parcel.weightKg,
      priceXaf:     parcel.priceXaf,
    },
    payment: parcel.payment ? {
      status:     parcel.payment.status,
      amount:     parcel.payment.amount,
      paidAt:     parcel.payment.paidAt,
      interacRef: parcel.payment.interacRef,
    } : null,
    items,
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { description, weightKg, nbPieces, status, notes } = body;

  const bordereau = await prisma.bordereau.update({
    where: { id: params.id },
    data: {
      ...(description !== undefined && { description }),
      ...(weightKg    !== undefined && { weightKg: weightKg ? Number(weightKg) : null }),
      ...(nbPieces    !== undefined && { nbPieces: Number(nbPieces) }),
      ...(status      !== undefined && { status }),
      ...(notes       !== undefined && { notes }),
    },
  });
  return NextResponse.json({ ok: true, bordereau });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  await prisma.bordereau.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
