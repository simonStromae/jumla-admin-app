export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  const results: Record<string, string> = {};
  const run = async (name: string, sql: string) => {
    try { await prisma.$executeRawUnsafe(sql); results[name] = 'ok'; }
    catch (e: any) { results[name] = e.message; }
  };

  await run('users.status',              `ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'`);
  await run('users.mustChangePassword',  `ALTER TABLE users ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false`);
  await run('bordereaux.items',          `ALTER TABLE bordereaux ADD COLUMN IF NOT EXISTS items JSONB`);
  await run('transactions',              `
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      "clientId" TEXT NOT NULL REFERENCES users(id),
      amount INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'payment',
      method TEXT NOT NULL DEFAULT 'interac',
      reference TEXT,
      note TEXT,
      "recordedById" TEXT REFERENCES users(id),
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await run('transaction_allocations',   `
    CREATE TABLE IF NOT EXISTS transaction_allocations (
      id TEXT PRIMARY KEY,
      "transactionId" TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
      "paymentId" TEXT NOT NULL REFERENCES payments(id),
      amount INTEGER NOT NULL
    )
  `);

  await run('routes.transitDays', `ALTER TABLE routes ADD COLUMN IF NOT EXISTS "transitDays" INTEGER NOT NULL DEFAULT 14`);
  await run('routes.currency',    `ALTER TABLE routes ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'CAD'`);
  await run('routes.fees',        `ALTER TABLE routes ADD COLUMN IF NOT EXISTS fees JSONB`);
  await run('campaign_costs.entrepot', `ALTER TABLE campaign_costs ADD COLUMN IF NOT EXISTS entrepot INTEGER NOT NULL DEFAULT 0`);

  // Campaign status enum new values
  await run('campaign_status.preparing_departure', `ALTER TYPE "CampaignStatus" ADD VALUE IF NOT EXISTS 'preparing_departure'`);
  await run('campaign_status.in_transit_2',        `ALTER TYPE "CampaignStatus" ADD VALUE IF NOT EXISTS 'in_transit_2'`);
  await run('campaign_status.preparing_arrival',   `ALTER TYPE "CampaignStatus" ADD VALUE IF NOT EXISTS 'preparing_arrival'`);
  await run('campaigns.statusNotes',               `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS "statusNotes" JSONB`);

  return NextResponse.json({ ok: true, results });
}
