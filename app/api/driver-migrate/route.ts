export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const results: Record<string, string> = {};
  const run = async (name: string, sql: string) => {
    try { await prisma.$executeRawUnsafe(sql); results[name] = 'ok'; }
    catch (e: any) { results[name] = e.message; }
  };

  await run('userRole.driver', `ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'driver'`);
  await run('parcels.driverId',      `ALTER TABLE parcels ADD COLUMN IF NOT EXISTS "driverId" TEXT REFERENCES users(id)`);
  await run('parcels.deliveredAt',   `ALTER TABLE parcels ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMPTZ`);
  await run('parcels.deliveryProof', `ALTER TABLE parcels ADD COLUMN IF NOT EXISTS "deliveryProof" JSONB`);

  return NextResponse.json({ ok: true, results });
}
