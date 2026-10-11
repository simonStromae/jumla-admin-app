export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

// Applies any missing Finance schema changes to the database.
// Safe to run multiple times (all statements use IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  const steps: string[] = [];

  try {
    // 1. Add finance override columns to campaigns table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE campaigns
        ADD COLUMN IF NOT EXISTS "financeRevenueCad" DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS "financeWeightKg"   DOUBLE PRECISION
    `);
    steps.push('campaigns columns');

    // 2. cost_posts
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS cost_posts (
        id              INTEGER PRIMARY KEY,
        name            TEXT NOT NULL,
        type            TEXT NOT NULL,
        "historicalAmt" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "sortOrder"     INTEGER NOT NULL DEFAULT 0,
        active          BOOLEAN NOT NULL DEFAULT true,
        "customAdded"   BOOLEAN NOT NULL DEFAULT false,
        "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    steps.push('cost_posts');

    // 3. cargo_variable_costs
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS cargo_variable_costs (
        id           TEXT PRIMARY KEY,
        "campaignId" TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        "postId"     INTEGER NOT NULL REFERENCES cost_posts(id),
        "amountCad"  DOUBLE PRECISION NOT NULL,
        "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("campaignId", "postId")
      )
    `);
    steps.push('cargo_variable_costs');

    // 4. fixed_monthly_costs
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS fixed_monthly_costs (
        id         TEXT PRIMARY KEY,
        month      TEXT NOT NULL,
        "postId"   INTEGER NOT NULL REFERENCES cost_posts(id),
        "amountCad" DOUBLE PRECISION NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (month, "postId")
      )
    `);
    steps.push('fixed_monthly_costs');

    // 5. fiscal_snapshots
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS fiscal_snapshots (
        id           TEXT PRIMARY KEY,
        "fiscalYear" INTEGER NOT NULL,
        "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        payload      JSONB NOT NULL,
        UNIQUE ("fiscalYear")
      )
    `);
    steps.push('fiscal_snapshots');

    return NextResponse.json({ ok: true, applied: steps });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err), appliedSoFar: steps },
      { status: 500 }
    );
  }
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  // Quick check: do the new columns exist on campaigns?
  const rows = await prisma.$queryRawUnsafe<{ column_name: string }[]>(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'campaigns'
      AND column_name IN ('financeRevenueCad', 'financeWeightKg')
  `);

  const tables = await prisma.$queryRawUnsafe<{ table_name: string }[]>(`
    SELECT table_name FROM information_schema.tables
    WHERE table_name IN ('cost_posts','cargo_variable_costs','fixed_monthly_costs','fiscal_snapshots')
  `);

  return NextResponse.json({
    campaignColumns: rows.map(r => r.column_name),
    financeTables: tables.map(r => r.table_name),
    ready: rows.length === 2 && tables.length === 4,
  });
}
