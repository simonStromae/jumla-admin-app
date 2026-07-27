import { prisma } from './prisma';

const run = async (sql: string) => {
  try { await prisma.$executeRawUnsafe(sql); } catch {}
};

export async function autoMigrate() {
  // Users
  await run(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'`);
  await run(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false`);
  await run(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "resetToken" TEXT`);
  await run(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "resetExpiry" TIMESTAMPTZ`);
  await run(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "loginAttempts" INTEGER NOT NULL DEFAULT 0`);
  await run(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "lockedAt" TIMESTAMPTZ`);
  await run(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "sessionVersion" INTEGER NOT NULL DEFAULT 0`);

  // Routes
  await run(`ALTER TABLE routes ADD COLUMN IF NOT EXISTS "transitDays" INTEGER NOT NULL DEFAULT 14`);
  await run(`ALTER TABLE routes ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'CAD'`);
  await run(`ALTER TABLE routes ADD COLUMN IF NOT EXISTS fees JSONB`);
  await run(`
    UPDATE routes
    SET fees = COALESCE(fees, '{}'::jsonb) || jsonb_build_object('arrival', jsonb_build_object(
      'city',    'Montréal',
      'address', '5500 Pl. de la Savane, Lachine',
      'phone',   '+1 514 998 0709'
    ))
    WHERE destination IN ('MTL','YUL')
      AND (fees IS NULL OR fees->'arrival' IS NULL)
  `);

  // Campaigns
  await run(`ALTER TABLE campaigns ALTER COLUMN status TYPE TEXT USING status::TEXT`);
  await run(`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS "statusNotes" JSONB`);
  await run(`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ`);

  // Campaign costs
  await run(`ALTER TABLE campaign_costs ADD COLUMN IF NOT EXISTS entrepot INTEGER NOT NULL DEFAULT 0`);

  // Parcels
  await run(`ALTER TABLE parcels ALTER COLUMN status TYPE TEXT USING status::TEXT`);
  await run(`ALTER TABLE parcels ADD COLUMN IF NOT EXISTS "recipName" TEXT`);
  await run(`ALTER TABLE parcels ADD COLUMN IF NOT EXISTS "recipPhone" TEXT`);
  await run(`ALTER TABLE parcels ADD COLUMN IF NOT EXISTS "recipCity" TEXT`);
  await run(`ALTER TABLE parcels ADD COLUMN IF NOT EXISTS "confirmedPriceXaf" INTEGER`);
  await run(`ALTER TABLE parcels ADD COLUMN IF NOT EXISTS "adjustmentStatus" TEXT NOT NULL DEFAULT 'none'`);
  await run(`ALTER TABLE parcels ADD COLUMN IF NOT EXISTS delivery TEXT NOT NULL DEFAULT 'pickup'`);
  await run(`ALTER TABLE parcels ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ`);
  await run(`ALTER TABLE parcels ADD COLUMN IF NOT EXISTS "declaredValue" FLOAT`);
  await run(`ALTER TABLE parcels ADD COLUMN IF NOT EXISTS "hasValuable" BOOLEAN NOT NULL DEFAULT false`);
  await run(`ALTER TABLE parcels ADD COLUMN IF NOT EXISTS "coverageFee" INTEGER`);
  await run(`ALTER TABLE parcels ADD COLUMN IF NOT EXISTS "waiverAccepted" BOOLEAN NOT NULL DEFAULT false`);
  await run(`ALTER TABLE parcels ADD COLUMN IF NOT EXISTS "forbiddenAcknowledged" BOOLEAN NOT NULL DEFAULT false`);
  await run(`ALTER TABLE parcels ADD COLUMN IF NOT EXISTS "disclaimerAcceptedAt" TIMESTAMPTZ`);
  await run(`ALTER TABLE parcels ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT`);

  // Tracking events
  await run(`ALTER TABLE tracking_events ALTER COLUMN status TYPE TEXT USING status::TEXT`);

  // Payments
  await run(`ALTER TABLE payments ALTER COLUMN status TYPE TEXT USING status::TEXT`);

  // Bordereaux
  await run(`ALTER TABLE bordereaux ADD COLUMN IF NOT EXISTS items JSONB`);
  await run(`ALTER TABLE bordereaux ADD COLUMN IF NOT EXISTS "clientConfirmed" BOOLEAN NOT NULL DEFAULT false`);
  await run(`ALTER TABLE bordereaux ADD COLUMN IF NOT EXISTS "clientConfirmedAt" TIMESTAMPTZ`);

  // Transactions
  await run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      "clientId" TEXT NOT NULL REFERENCES users(id),
      amount NUMERIC(12,2) NOT NULL,
      type TEXT NOT NULL DEFAULT 'payment',
      method TEXT NOT NULL DEFAULT 'interac',
      reference TEXT,
      note TEXT,
      "recordedById" TEXT REFERENCES users(id),
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS transaction_allocations (
      id TEXT PRIMARY KEY,
      "transactionId" TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
      "paymentId" TEXT NOT NULL REFERENCES payments(id),
      amount NUMERIC(12,2) NOT NULL
    )
  `);
  await run(`ALTER TABLE transactions ALTER COLUMN amount TYPE NUMERIC(12,2) USING amount::numeric`);
  await run(`ALTER TABLE transaction_allocations ALTER COLUMN amount TYPE NUMERIC(12,2) USING amount::numeric`);

  // Push subscriptions
  await run(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Notifications
  await run(`
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

  // Login logs
  await run(`
    CREATE TABLE IF NOT EXISTS login_logs (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "userId" TEXT,
      email TEXT NOT NULL,
      ip TEXT,
      "userAgent" TEXT,
      country TEXT,
      city TEXT,
      success BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}
