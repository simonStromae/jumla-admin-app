import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';
import { sendVerificationEmail } from '@/src/lib/email';

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { name: true, email: true, emailVerified: true },
  });

  if (!user) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
  if ((user as any).emailVerified) return NextResponse.json({ error: 'Email déjà vérifié' }, { status: 400 });

  const newCode = String(Math.floor(100000 + Math.random() * 900000));
  await prisma.user.update({ where: { id: params.id }, data: { verifyToken: newCode } });
  await sendVerificationEmail(user.email, user.name, newCode);

  return NextResponse.json({ ok: true });
}
