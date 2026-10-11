export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

function fiscalYearOf(date: Date): number {
  return date.getMonth() >= 6 ? date.getFullYear() : date.getFullYear() - 1;
}

function fyMonths(fy: number): string[] {
  const months: string[] = [];
  for (let m = 7; m <= 12; m++) months.push(`${fy}-${String(m).padStart(2, '0')}`);
  for (let m = 1; m <= 6; m++) months.push(`${fy + 1}-${String(m).padStart(2, '0')}`);
  return months;
}

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

// Called by Vercel Cron on July 1 at 06:00 UTC — archives the fiscal year that just ended
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // On July 1 the previous fiscal year just ended — archive fy = (year - 1)
  const now = new Date();
  const fy = now.getMonth() >= 6 ? now.getFullYear() - 1 : now.getFullYear() - 2;

  const existing = await prisma.fiscalSnapshot.findUnique({ where: { fiscalYear: fy } });
  if (existing) {
    return NextResponse.json({ ok: true, skipped: true, message: `Exercice ${fy}–${fy + 1} déjà archivé.` });
  }

  const fyStart = new Date(`${fy}-07-01`);
  const fyEnd   = new Date(`${fy + 1}-07-01`);

  const campaigns = await prisma.campaign.findMany({
    where: {
      deletedAt: null,
      OR: [
        { departureDate: { gte: fyStart, lt: fyEnd } },
        { arrivalDate:   { gte: fyStart, lt: fyEnd } },
      ],
    },
    include: {
      parcels: {
        where: { deletedAt: null },
        include: { payment: { select: { amount: true, status: true } } },
      },
      cargoVariableCosts: true,
      route: { select: { id: true, origin: true, destination: true, label: true } },
    },
  });

  const months = fyMonths(fy);
  const monthMap: Record<string, { month: string; revenue: number; variableCosts: number; fixedCosts: number; grossMargin: number; netResult: number; marginPct: number | null; campaignCount: number }> = {};
  for (const m of months) {
    monthMap[m] = { month: m, revenue: 0, variableCosts: 0, fixedCosts: 0, grossMargin: 0, netResult: 0, marginPct: null, campaignCount: 0 };
  }

  const routeMap: Record<string, { routeId: string; route: string; revenue: number; variableCosts: number; grossMargin: number; marginPct: number | null; campaignCount: number }> = {};

  for (const c of campaigns) {
    const refDate = c.departureDate ?? c.arrivalDate ?? c.createdAt;
    const d = new Date(refDate);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    const paidRevenue = c.parcels.reduce((sum, p) =>
      sum + (p.payment?.status === 'paid' ? (p.payment.amount ?? 0) : 0), 0);
    const rev = c.financeRevenueCad ?? paidRevenue / 100;
    const varCosts = c.cargoVariableCosts.reduce((sum, vc) => sum + vc.amountCad, 0);

    if (monthMap[monthKey]) {
      monthMap[monthKey].revenue       += rev;
      monthMap[monthKey].variableCosts += varCosts;
      monthMap[monthKey].campaignCount += 1;
    }

    if (c.route) {
      const rId = c.route.id;
      if (!routeMap[rId]) {
        const label = c.route.label ?? `${c.route.origin} → ${c.route.destination}`;
        routeMap[rId] = { routeId: rId, route: label, revenue: 0, variableCosts: 0, grossMargin: 0, marginPct: null, campaignCount: 0 };
      }
      routeMap[rId].revenue       += rev;
      routeMap[rId].variableCosts += varCosts;
      routeMap[rId].campaignCount += 1;
    }
  }

  const fyStartStr = `${fy}-07`;
  const fyEndStr   = `${fy + 1}-06`;
  const fixedCosts = await prisma.fixedMonthlyCost.findMany({
    where: { month: { gte: fyStartStr, lte: fyEndStr } },
  });
  const fixedByMonth: Record<string, number> = {};
  for (const f of fixedCosts) {
    fixedByMonth[f.month] = (fixedByMonth[f.month] ?? 0) + f.amountCad;
  }

  let totalRev = 0, totalVar = 0, totalFixed = 0;
  for (const row of Object.values(monthMap)) {
    const fixed = fixedByMonth[row.month] ?? 0;
    row.fixedCosts  = fixed;
    row.grossMargin = row.revenue - row.variableCosts;
    row.netResult   = row.grossMargin - fixed;
    row.marginPct   = row.revenue > 0 ? (row.grossMargin / row.revenue) * 100 : null;
    totalRev   += row.revenue;
    totalVar   += row.variableCosts;
    totalFixed += fixed;
  }
  for (const row of Object.values(routeMap)) {
    row.grossMargin = row.revenue - row.variableCosts;
    row.marginPct   = row.revenue > 0 ? (row.grossMargin / row.revenue) * 100 : null;
  }

  const totalGross = totalRev - totalVar;
  const totalNet   = totalGross - totalFixed;

  const payload = {
    fiscalYear: fy,
    label: `${fy}–${fy + 1}`,
    campaignCount: campaigns.length,
    byMonth: months.map(m => monthMap[m]),
    byRoute: Object.values(routeMap).sort((a, b) => b.revenue - a.revenue),
    totals: {
      revenue: totalRev,
      variableCosts: totalVar,
      fixedCosts: totalFixed,
      grossMargin: totalGross,
      netResult: totalNet,
      marginPct: totalRev > 0 ? (totalGross / totalRev) * 100 : null,
    },
    archivedAt: now.toISOString(),
  };

  await prisma.fiscalSnapshot.create({
    data: { fiscalYear: fy, payload: payload as object },
  });

  return NextResponse.json({ ok: true, fiscalYear: fy, label: payload.label, campaignCount: payload.campaignCount });
}
