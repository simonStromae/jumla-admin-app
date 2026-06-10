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

  return NextResponse.json({ ok: true, results });
}
