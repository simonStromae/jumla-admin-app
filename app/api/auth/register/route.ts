import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/src/lib/prisma';
import { sendVerificationEmail } from '@/src/lib/email';

export async function POST(req: NextRequest) {
  const { email, name, password } = await req.json();

  if (!email || !name || !password) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Mot de passe trop court (6 caractères min)' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Adresse email déjà utilisée' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  // 6-digit verification code (demo: returned in response since no email service)
  const verifyToken  = String(Math.floor(100000 + Math.random() * 900000));

  await prisma.user.create({
    data: { email, name, passwordHash, verifyToken, role: 'client' },
  });

  await sendVerificationEmail(email, name, verifyToken).catch(() => {}); // never block registration if email fails

  return NextResponse.json({ ok: true, demoCode: verifyToken });
}
