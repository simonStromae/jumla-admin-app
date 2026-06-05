import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function POST(req: NextRequest) {
  const { email, code } = await req.json();

  if (!email || !code) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.verifyToken !== code) {
    return NextResponse.json({ error: 'Code invalide' }, { status: 400 });
  }

  await prisma.user.update({
    where: { email },
    data: { emailVerified: true, verifyToken: null },
  });

  return NextResponse.json({ ok: true });
}
