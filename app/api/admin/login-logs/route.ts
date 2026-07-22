export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const userId = req.nextUrl.searchParams.get('userId');
  const limit  = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 50), 200);

  const where = userId ? `WHERE "userId" = $1` : '';
  const args  = userId ? [userId, limit] : [limit];

  const rows = await (prisma as any).$queryRawUnsafe(
    `SELECT id, "userId", email, ip, "userAgent", country, city, success, "createdAt"
     FROM login_logs
     ${where}
     ORDER BY "createdAt" DESC
     LIMIT $${userId ? 2 : 1}`,
    ...args,
  );

  return NextResponse.json(rows);
}
