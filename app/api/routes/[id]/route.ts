export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { origin, destination, label, active, transitDays, currency, fees } = await req.json();

  await prisma.$executeRawUnsafe(
    `UPDATE routes SET
      origin       = COALESCE($1, origin),
      destination  = COALESCE($2, destination),
      label        = COALESCE($3, label),
      active       = COALESCE($4, active),
      "transitDays" = COALESCE($5, "transitDays"),
      currency     = COALESCE($6, currency),
      fees         = COALESCE($7::jsonb, fees)
    WHERE id = $8`,
    origin       ?? null,
    destination  ?? null,
    label        ?? null,
    active       ?? null,
    transitDays  ?? null,
    currency     ?? null,
    fees         ? JSON.stringify(fees) : null,
    params.id,
  );

  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, origin, destination, label, active, "transitDays", currency, fees FROM routes WHERE id = $1`,
    params.id,
  );
  const r = rows[0];
  return NextResponse.json({
    id:          r.id,
    fromIATA:    r.origin,
    toIATA:      r.destination,
    label:       r.label ?? `${r.origin} → ${r.destination}`,
    active:      r.active,
    transitDays: r.transitDays,
    currency:    r.currency,
    fees:        r.fees,
  });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  await prisma.route.delete({ where: { id: params.id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
