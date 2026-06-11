export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';
import { auth } from '@/auth';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const bl = await prisma.bordereau.findFirst({
    where: { OR: [{ id: params.id }, { code: params.id }] },
    include: {
      parcel: {
        include: {
          client:   { select: { name: true, phone: true, city: true, email: true, addresses: true } },
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
  const addresses = parcel.client.addresses as any;
  const delivery = addresses?.delivery ?? {};

  return NextResponse.json({
    id:          bl.id,
    code:        bl.code,
    status:      bl.status,
    description: bl.description,
    weightKg:    bl.weightKg,
    nbPieces:    bl.nbPieces,
    items:       (bl as any).items ?? [],
    notes:       bl.notes,
    createdAt:   bl.createdAt,
    client: {
      name:    parcel.client.name,
      phone:   parcel.client.phone,
      city:    parcel.client.city,
      email:   parcel.client.email,
    },
    recipient: {
      name:    delivery.name    || parcel.client.name,
      phone:   delivery.phone   || parcel.client.phone,
      address: delivery.address || '',
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
      status:       parcel.status,
      items:        (parcel as any).items ?? [],
    },
    payment: parcel.payment ? {
      status:     parcel.payment.status,
      amount:     parcel.payment.amount,
      paidAt:     parcel.payment.paidAt,
      interacRef: parcel.payment.interacRef,
    } : null,
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { description, weightKg, nbPieces, status, notes, items } = body;

  // Check campaign lock for structural edits (not status validation)
  if (!body.status) {
    const bl = await prisma.bordereau.findUnique({
      where: { id: params.id },
      select: { parcel: { select: { campaign: { select: { status: true } } } } },
    });
    const LOCKED_STATUSES = ['in_transit', 'in_transit_2', 'arrived', 'preparing_arrival', 'closed'];
    if (bl?.parcel?.campaign && LOCKED_STATUSES.includes(bl.parcel.campaign.status as string)) {
      return NextResponse.json({ error: 'Bordereau verrouillé — la cargaison est déjà en transit.' }, { status: 403 });
    }
  }

  const bordereau = await prisma.bordereau.update({
    where: { id: params.id },
    data: {
      ...(description !== undefined && { description }),
      ...(weightKg    !== undefined && { weightKg: weightKg ? Number(weightKg) : null }),
      ...(nbPieces    !== undefined && { nbPieces: Number(nbPieces) }),
      ...(status      !== undefined && { status }),
      ...(notes       !== undefined && { notes }),
      ...(items       !== undefined && { items } as any),
    } as any,
  });

  // Validating a bordereau moves the parcel to "recu"
  if (status === 'valide') {
    const sess = await auth();
    const bl = await prisma.bordereau.findUnique({ where: { id: params.id }, select: { parcelId: true } });
    if (bl) {
      const parcel = await prisma.parcel.findUnique({ where: { id: bl.parcelId }, select: { status: true } });
      if (parcel?.status === 'en_attente') {
        await prisma.parcel.update({ where: { id: bl.parcelId }, data: { status: 'recu' } });
        await prisma.trackingEvent.create({
          data: {
            parcelId:    bl.parcelId,
            status:      'recu',
            note:        'Bordereau validé',
            createdById: (sess?.user as any)?.id ?? null,
          },
        });
      }
    }
  }

  return NextResponse.json({ ok: true, bordereau: { ...bordereau, items: (bordereau as any).items ?? [] } });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  await prisma.bordereau.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
