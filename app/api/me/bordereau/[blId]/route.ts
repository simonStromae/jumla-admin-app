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
          payment:  { select: { status: true, paidAt: true } },
        },
      },
    },
  });

  if (!bl) return NextResponse.json({ error: 'Bordereau introuvable' }, { status: 404 });
  if (bl.parcel.clientId !== userId) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  return NextResponse.json({
    code:        bl.code,
    description: bl.description,
    weightKg:    bl.weightKg,
    nbPieces:    bl.nbPieces,
    notes:       bl.notes,
    status:      bl.status,
    createdAt:   bl.createdAt,
    parcel: {
      trackingCode: bl.parcel.trackingCode,
      description:  bl.parcel.description,
      weightKg:     bl.parcel.weightKg,
    },
    client: {
      name:  bl.parcel.client.name,
      phone: bl.parcel.client.phone,
      city:  bl.parcel.client.city,
    },
    campaign: {
      code: bl.parcel.campaign.code,
      from: bl.parcel.campaign.route.origin,
      to:   bl.parcel.campaign.route.destination,
      arrivalDate: bl.parcel.campaign.arrivalDate,
    },
    paid: bl.parcel.payment?.status === 'completed',
    paidAt: bl.parcel.payment?.paidAt ?? null,
  });
}
