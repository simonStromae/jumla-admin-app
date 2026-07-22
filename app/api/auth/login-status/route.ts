import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ attempts: 0, remaining: MAX_ATTEMPTS });

  const user = await (prisma.user as any).findUnique({
    where: { email },
    select: { loginAttempts: true, status: true },
  });

  if (!user) return NextResponse.json({ attempts: 0, remaining: MAX_ATTEMPTS });

  const attempts  = user.loginAttempts ?? 0;
  const remaining = Math.max(0, MAX_ATTEMPTS - attempts);

  return NextResponse.json({ attempts, remaining, suspended: user.status === 'suspended' });
}
