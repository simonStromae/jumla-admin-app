export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';
import { sendPasswordResetEmail } from '@/src/lib/email';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  // Mode 1: set a new password directly
  if (body.newPassword) {
    if (body.newPassword.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit faire au moins 8 caractères' }, { status: 400 });
    }
    const hashed = await bcrypt.hash(body.newPassword, 10);
    await prisma.$executeRawUnsafe(
      `UPDATE users SET password = $1, "resetToken" = NULL, "resetExpiry" = NULL WHERE id = $2`,
      hashed, user.id,
    );
    return NextResponse.json({ ok: true, mode: 'direct' });
  }

  // Mode 2: send a reset link by email
  const token  = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await prisma.$executeRawUnsafe(
    `UPDATE users SET "resetToken" = $1, "resetExpiry" = $2 WHERE id = $3`,
    token, expiry, user.id,
  );
  const baseUrl  = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? 'https://jumla.cargo';
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  await sendPasswordResetEmail(user.email, user.name, resetUrl);
  return NextResponse.json({ ok: true, mode: 'email', email: user.email });
}
