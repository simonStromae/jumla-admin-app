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

  const confirmed = await prisma.$queryRawUnsafe<any[]>(
    `SELECT "clientConfirmed", "clientConfirmedAt" FROM bordereaux WHERE id = $1`, bl.id,
  );

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
    clientConfirmed:   confirmed[0]?.clientConfirmed   ?? false,
    clientConfirmedAt: confirmed[0]?.clientConfirmedAt ?? null,
    parcel: {
      id:           bl.parcel.id,
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
      parcel: { select: { clientId: true, id: true, trackingCode: true } },
    },
  });

  if (!bl) return NextResponse.json({ error: 'Bordereau introuvable' }, { status: 404 });
  if (bl.parcel.clientId !== userId) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  if (bl.status !== 'valide') return NextResponse.json({ error: 'Ce bordereau n\'est pas encore confirmé par Jumla.' }, { status: 400 });

  const existing = await prisma.$queryRawUnsafe<any[]>(
    `SELECT "clientConfirmed" FROM bordereaux WHERE id = $1`, bl.id,
  );
  if (existing[0]?.clientConfirmed) {
    return NextResponse.json({ error: 'Déjà confirmé.' }, { status: 400 });
  }

  await prisma.$executeRawUnsafe(
    `UPDATE bordereaux SET "clientConfirmed" = true, "clientConfirmedAt" = NOW() WHERE id = $1`,
    bl.id,
  );

  // Notify admins via the notification system (optional — could be extended)
  // For now just return success
  return NextResponse.json({ ok: true });
}
