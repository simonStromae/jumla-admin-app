export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/api-auth';

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = (session!.user as any).id;

  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, type, title, body, "parcelId", read, "createdAt"
     FROM notifications
     WHERE "userId" = $1
     ORDER BY "createdAt" DESC
     LIMIT 50`,
    userId,
  );

  return NextResponse.json({ notifications: rows });
}

export async function PATCH() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = (session!.user as any).id;

  await prisma.$executeRawUnsafe(
    `UPDATE notifications SET read = true WHERE "userId" = $1 AND read = false`,
    userId,
  );

  return NextResponse.json({ ok: true });
}
