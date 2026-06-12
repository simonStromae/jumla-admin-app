export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  let rows: any[];
  try {
    rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, origin, destination, label, active, "transitDays", currency, fees FROM routes WHERE active = true ORDER BY origin`
    );
  } catch {
    const routes = await prisma.route.findMany({ where: { active: true }, orderBy: { origin: 'asc' } });
    rows = routes;
  }

  return NextResponse.json(rows.map(r => ({
    id:          r.id,
    origin:      r.origin,
    destination: r.destination,
    label:       r.label ?? `${r.origin} → ${r.destination}`,
    code:        `${r.origin} → ${r.destination}`,
    transitDays: r.transitDays ?? 14,
    currency:    r.currency ?? 'CAD',
    fees:        r.fees ?? null,
  })));
}
