import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/src/lib/prisma';

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

  // In production: send verifyToken by email (Resend, Nodemailer, etc.)
  // For now: return it in the response so the UI can display it
  return NextResponse.json({ ok: true, demoCode: verifyToken });
}
