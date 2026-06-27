export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/api-auth';

export async function DELETE() {
  const { session, error } = await requireAuth();
  if (error) return error;
  const userId = (session.user as any).id;

  const parcelCount = await prisma.parcel.count({ where: { clientId: userId } });
  if (parcelCount > 0) {
    return NextResponse.json(
      { error: 'Vous avez des colis enregistrés. Contactez le support pour supprimer votre compte.' },
      { status: 400 },
    );
  }

  await prisma.$transaction([
    prisma.message.deleteMany({ where: { OR: [{ senderId: userId }, { recipientId: userId }] } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  return NextResponse.json({ ok: true });
}
