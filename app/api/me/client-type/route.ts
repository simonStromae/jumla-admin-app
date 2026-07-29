export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/api-auth';

const VALID_TYPES = ['standard', 'commercial', 'partenaire'];

export async function PATCH(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { clientType } = await req.json();
  if (!VALID_TYPES.includes(clientType)) {
    return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
  }

  const userId = (session!.user as any).id;
  await prisma.user.update({
    where: { id: userId },
    data:  { clientType } as any,
  });

  return NextResponse.json({ ok: true, clientType });
}
