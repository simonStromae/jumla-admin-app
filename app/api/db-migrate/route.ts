export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

// Safe incremental migration — adds missing columns/tables only.
// Never truncates or deletes data.
export async function GET() {
  const results: Record<string, string> = {};

  const run = async (name: string, sql: string) => {
    try { await prisma.$executeRawUnsafe(sql); results[name] = 'ok'; }
    catch (e: any) { results[name] = e.message; }
  };

  // ── Users ──────────────────────────────────────────────────────────────────
  await run('users.status',             `ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'`);
  await run('users.mustChangePassword', `ALTER TABLE users ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false`);
  await run('users.resetToken',         `ALTER TABLE users ADD COLUMN IF NOT EXISTS "resetToken" TEXT`);
  await run('users.resetExpiry',        `ALTER TABLE users ADD COLUMN IF NOT EXISTS "resetExpiry" TIMESTAMPTZ`);

  // ── Routes ─────────────────────────────────────────────────────────────────
  await run('routes.transitDays', `ALTER TABLE routes ADD COLUMN IF NOT EXISTS "transitDays" INTEGER NOT NULL DEFAULT 14`);
  await run('routes.currency',    `ALTER TABLE routes ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'CAD'`);
  await run('routes.fees',        `ALTER TABLE routes ADD COLUMN IF NOT EXISTS fees JSONB`);
  // Seed arrival info for existing DLA→MTL/YUL routes (idempotent — only sets if arrival is null)
  await run('routes.seed_arrival_dla_mtl', `
    UPDATE routes
    SET fees = COALESCE(fees, '{}'::jsonb) || jsonb_build_object('arrival', jsonb_build_object(
      'city',    'Montréal',
      'address', '5500 Pl. de la Savane, Lachine',
      'phone',   '+1 514 998 0709'
    ))
    WHERE destination IN ('MTL','YUL')
      AND (fees IS NULL OR fees->'arrival' IS NULL)
  `);

  // ── Campaigns ──────────────────────────────────────────────────────────────
  await run('campaigns.status_to_text', `ALTER TABLE campaigns ALTER COLUMN status TYPE TEXT USING status::TEXT`);
  await run('campaigns.statusNotes',    `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS "statusNotes" JSONB`);

  // ── Campaign costs ─────────────────────────────────────────────────────────
  await run('campaign_costs.entrepot', `ALTER TABLE campaign_costs ADD COLUMN IF NOT EXISTS entrepot INTEGER NOT NULL DEFAULT 0`);

  // ── Parcels ────────────────────────────────────────────────────────────────
  await run('parcels.status_to_text', `ALTER TABLE parcels ALTER COLUMN status TYPE TEXT USING status::TEXT`);
  await run('parcels.recipName',          `ALTER TABLE parcels ADD COLUMN IF NOT EXISTS "recipName" TEXT`);
  await run('parcels.recipPhone',         `ALTER TABLE parcels ADD COLUMN IF NOT EXISTS "recipPhone" TEXT`);
  await run('parcels.recipCity',          `ALTER TABLE parcels ADD COLUMN IF NOT EXISTS "recipCity" TEXT`);
  await run('parcels.confirmedPriceXaf',  `ALTER TABLE parcels ADD COLUMN IF NOT EXISTS "confirmedPriceXaf" INTEGER`);
  await run('parcels.adjustmentStatus',   `ALTER TABLE parcels ADD COLUMN IF NOT EXISTS "adjustmentStatus" TEXT NOT NULL DEFAULT 'none'`);
  await run('parcels.delivery',           `ALTER TABLE parcels ADD COLUMN IF NOT EXISTS delivery TEXT NOT NULL DEFAULT 'pickup'`);
  await run('parcels.deletedAt',          `ALTER TABLE parcels ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ`);

  // ── Tracking events ────────────────────────────────────────────────────────
  await run('tracking_events.status_to_text', `ALTER TABLE tracking_events ALTER COLUMN status TYPE TEXT USING status::TEXT`);

  // ── Payments ───────────────────────────────────────────────────────────────
  await run('payments.status_to_text', `ALTER TABLE payments ALTER COLUMN status TYPE TEXT USING status::TEXT`);

  // ── Bordereaux ─────────────────────────────────────────────────────────────
  await run('bordereaux.items',            `ALTER TABLE bordereaux ADD COLUMN IF NOT EXISTS items JSONB`);
  await run('bordereaux.clientConfirmed',  `ALTER TABLE bordereaux ADD COLUMN IF NOT EXISTS "clientConfirmed" BOOLEAN NOT NULL DEFAULT false`);
  await run('bordereaux.clientConfirmedAt',`ALTER TABLE bordereaux ADD COLUMN IF NOT EXISTS "clientConfirmedAt" TIMESTAMPTZ`);

  // ── Transactions ───────────────────────────────────────────────────────────
  await run('transactions', `
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
  await run('transaction_allocations', `
    CREATE TABLE IF NOT EXISTS transaction_allocations (
      id TEXT PRIMARY KEY,
      "transactionId" TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
      "paymentId" TEXT NOT NULL REFERENCES payments(id),
      amount INTEGER NOT NULL
    )
  `);

  // ── Push subscriptions ─────────────────────────────────────────────────────
  await run('push_subscriptions', `
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // ── Notifications ──────────────────────────────────────────────────────────
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

  return NextResponse.json({ ok: true, results });
}
