import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { sendVerificationEmail } from '@/src/lib/email';

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ ok: true }); // no info leak

  const user = await prisma.user.findUnique({ where: { email }, select: { name: true, emailVerified: true, verifyToken: true } });

  if (!user || user.emailVerified) {
    return NextResponse.json({ ok: true }); // no info leak for verified / non-existent
  }

  // Generate a fresh code and resend
  const newCode = String(Math.floor(100000 + Math.random() * 900000));
  await prisma.user.update({ where: { email }, data: { verifyToken: newCode } });
  await sendVerificationEmail(email, user.name, newCode).catch(() => {});

  return NextResponse.json({ needsVerification: true });
}
