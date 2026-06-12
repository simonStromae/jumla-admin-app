export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { sendPasswordResetEmail } from '@/src/lib/email';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  // Always return ok — don't leak whether email exists
  if (!user) return NextResponse.json({ ok: true });

  const token   = crypto.randomBytes(32).toString('hex');
  const expiry  = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.$executeRawUnsafe(
    `UPDATE users SET "resetToken" = $1, "resetExpiry" = $2 WHERE id = $3`,
    token, expiry, user.id,
  );

  const baseUrl  = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  await sendPasswordResetEmail(user.email, user.name, resetUrl).catch(() => {});

  return NextResponse.json({ ok: true });
}
