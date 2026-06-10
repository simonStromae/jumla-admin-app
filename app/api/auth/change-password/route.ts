export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/api-auth';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { currentPassword, newPassword } = await req.json();
  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'Le nouveau mot de passe doit faire au moins 8 caractères' }, { status: 400 });
  }

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

  // Trust either the DB value or the session token — whichever says true
  const dbMustChange      = (user as any).mustChangePassword ?? false;
  const sessionMustChange = (session.user as any).mustChangePassword ?? false;
  const mustChange        = dbMustChange || sessionMustChange;

  if (!mustChange) {
    if (!currentPassword) return NextResponse.json({ error: 'Mot de passe actuel requis' }, { status: 400 });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 });
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hash, mustChangePassword: false } as any,
  });

  return NextResponse.json({ ok: true });
}
