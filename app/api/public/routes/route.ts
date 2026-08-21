export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getExchangeRatesToCAD, rateForCurrency } from '@/src/lib/exchangeRates';

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

  const rates = await getExchangeRatesToCAD();

  return NextResponse.json(rows.map(r => {
    const currency = r.currency ?? 'CAD';
    return {
      id:               r.id,
      origin:           r.origin,
      destination:      r.destination,
      label:            r.label ?? `${r.origin} → ${r.destination}`,
      code:             `${r.origin} → ${r.destination}`,
      transitDays:      r.transitDays ?? 14,
      currency,
      exchangeRateToCad: rateForCurrency(rates, currency),
      fees:             r.fees ?? null,
    };
  }));
}
