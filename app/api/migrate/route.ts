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

  // Convert CampaignStatus from enum → TEXT (once and for all — no more enum migrations needed)
  // This is idempotent: if already TEXT it's a no-op, if still enum it converts safely
  await run('campaigns.status_to_text', `
    ALTER TABLE campaigns
      ALTER COLUMN status TYPE TEXT USING status::TEXT
  `);
  await run('campaigns.statusNotes', `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS "statusNotes" JSONB`);

  // Notifications
  await run('notifications', `
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'info',
      title TEXT NOT NULL,
      body TEXT,
      "parcelId" TEXT,
      read BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  // Client confirmation of bordereau
  await run('bordereaux.clientConfirmed', `ALTER TABLE bordereaux ADD COLUMN IF NOT EXISTS "clientConfirmed" BOOLEAN NOT NULL DEFAULT false`);
  await run('bordereaux.clientConfirmedAt', `ALTER TABLE bordereaux ADD COLUMN IF NOT EXISTS "clientConfirmedAt" TIMESTAMPTZ`);

  // Password reset columns
  await run('users.resetToken',  `ALTER TABLE users ADD COLUMN IF NOT EXISTS "resetToken" TEXT`);
  await run('users.resetExpiry', `ALTER TABLE users ADD COLUMN IF NOT EXISTS "resetExpiry" TIMESTAMPTZ`);

  // Convert PaymentStatus enum → TEXT so "partial" and future statuses work without migrations
  await run('payments.status_to_text', `
    ALTER TABLE payments
      ALTER COLUMN status TYPE TEXT USING status::TEXT
  `);

  return NextResponse.json({ ok: true, results });
}
