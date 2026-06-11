export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/api-auth';

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
