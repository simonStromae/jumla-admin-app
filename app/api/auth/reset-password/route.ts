export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const { token, newPassword } = await req.json();
  if (!token || !newPassword) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
  if (newPassword.length < 8) return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, { status: 400 });

  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, "resetToken", "resetExpiry" FROM users WHERE "resetToken" = $1 LIMIT 1`,
    token,
  ).catch(() => []);

  const user = rows[0];
  if (!user) return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 400 });
  if (new Date(user.resetExpiry) < new Date()) return NextResponse.json({ error: 'Lien expiré — demandez un nouveau' }, { status: 400 });

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.$executeRawUnsafe(
    `UPDATE users SET "passwordHash" = $1, "resetToken" = NULL, "resetExpiry" = NULL WHERE id = $2`,
    hash, user.id,
  );

  return NextResponse.json({ ok: true });
}
