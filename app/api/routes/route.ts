export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const routes = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, origin, destination, label, active, "transitDays", currency, fees FROM routes ORDER BY origin`
  );
  return NextResponse.json(routes.map(r => ({
    id:          r.id,
    code:        `${r.origin} → ${r.destination}`,
    fromIATA:    r.origin,
    toIATA:      r.destination,
    label:       r.label ?? `${r.origin} → ${r.destination}`,
    active:      r.active,
    transitDays: r.transitDays ?? 14,
    currency:    r.currency ?? 'CAD',
    fees:        r.fees ?? null,
  })));
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { origin, destination, label, transitDays, currency, fees } = await req.json();
  if (!origin || !destination) {
    return NextResponse.json({ error: 'Origine et destination obligatoires' }, { status: 400 });
  }

  const org  = origin.toUpperCase().trim();
  const dest = destination.toUpperCase().trim();
  const lbl  = label?.trim() || `${org} → ${dest}`;

  const rows = await prisma.$queryRawUnsafe<any[]>(
    `INSERT INTO routes (id, origin, destination, label, active, "transitDays", currency, fees)
     VALUES (gen_random_uuid()::text, $1, $2, $3, true, $4, $5, $6::jsonb)
     RETURNING id, origin, destination, label, active, "transitDays", currency, fees`,
    org, dest, lbl,
    transitDays ?? 14,
    currency    ?? 'CAD',
    fees        ? JSON.stringify(fees) : null,
  );
  const r = rows[0];

  return NextResponse.json({
    id:          r.id,
    code:        `${r.origin} → ${r.destination}`,
    fromIATA:    r.origin,
    toIATA:      r.destination,
    label:       r.label ?? `${r.origin} → ${r.destination}`,
    active:      r.active,
    transitDays: r.transitDays,
    currency:    r.currency,
    fees:        r.fees,
  });
}
