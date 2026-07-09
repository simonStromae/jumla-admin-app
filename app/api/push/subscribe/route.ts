export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/api-auth';

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = (session!.user as any).id;
  const { endpoint, keys } = await req.json();

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Subscription invalide' }, { status: 400 });
  }

  await prisma.$executeRawUnsafe(
    `INSERT INTO push_subscriptions (id, "userId", endpoint, p256dh, auth, "createdAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW())
     ON CONFLICT (endpoint) DO UPDATE SET "userId" = $1, p256dh = $3, auth = $4`,
    userId, endpoint, keys.p256dh, keys.auth,
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = (session!.user as any).id;
  const { endpoint } = await req.json().catch(() => ({}));

  if (endpoint) {
    await prisma.$executeRawUnsafe(
      `DELETE FROM push_subscriptions WHERE "userId" = $1 AND endpoint = $2`,
      userId, endpoint,
    ).catch(() => {});
  } else {
    await prisma.$executeRawUnsafe(
      `DELETE FROM push_subscriptions WHERE "userId" = $1`,
      userId,
    ).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
