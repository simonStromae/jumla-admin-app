export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

function monthStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const now = new Date();
  const currentMonth = monthStr(now);

  // Build 6-month forward window
  const months: string[] = [];
  for (let i = 0; i < 6; i++) {
    months.push(monthStr(addMonths(now, i)));
  }

  const windowStart = new Date(`${months[0]}-01`);
  const windowEnd   = new Date(`${months[5]}-01`);
  windowEnd.setMonth(windowEnd.getMonth() + 1);

  // ── Upcoming campaigns (in the 6-month window) ──────────────
  const campaigns = await prisma.campaign.findMany({
    where: {
      deletedAt: null,
      OR: [
        { departureDate: { gte: windowStart, lt: windowEnd } },
        { arrivalDate:   { gte: windowStart, lt: windowEnd } },
      ],
    },
    include: {
      parcels: {
        where: { deletedAt: null },
        include: { payment: { select: { amount: true, status: true } } },
      },
      cargoVariableCosts: true,
    },
  });

  // ── Historical fixed costs: last 3 months average ───────────
  const past3: string[] = [];
  for (let i = 3; i >= 1; i--) {
    const m = monthStr(addMonths(now, -i));
    if (m < currentMonth) past3.push(m);
  }
  past3.push(currentMonth);

  const historicalFixed = await prisma.fixedMonthlyCost.findMany({
    where: { month: { in: past3 } },
  });

  // Sum by month, then average for projection
  const fixedByPastMonth: Record<string, number> = {};
  for (const f of historicalFixed) {
    fixedByPastMonth[f.month] = (fixedByPastMonth[f.month] ?? 0) + f.amountCad;
  }
  const knownFixedMonths = Object.values(fixedByPastMonth);
  const avgFixedPerMonth = knownFixedMonths.length > 0
    ? knownFixedMonths.reduce((s, v) => s + v, 0) / knownFixedMonths.length
    : 0;

  // ── Future fixed costs (may already be entered) ─────────────
  const futureFixed = await prisma.fixedMonthlyCost.findMany({
    where: { month: { in: months } },
  });
  const futureFixedByMonth: Record<string, number> = {};
  for (const f of futureFixed) {
    futureFixedByMonth[f.month] = (futureFixedByMonth[f.month] ?? 0) + f.amountCad;
  }

  // ── Aggregate by month ───────────────────────────────────────
  type CampaignRow = {
    id: string;
    code: string;
    revenueCad: number;
    variableCosts: number;
    hasVariableCosts: boolean;
  };

  const revByMonth:  Record<string, number> = {};
  const varByMonth:  Record<string, number> = {};
  const campsByMonth: Record<string, CampaignRow[]> = {};
  for (const m of months) {
    revByMonth[m]  = 0;
    varByMonth[m]  = 0;
    campsByMonth[m] = [];
  }

  for (const c of campaigns) {
    const paidRevenue = c.parcels.reduce((sum, p) =>
      sum + (p.payment?.status === 'paid' ? (p.payment.amount ?? 0) : 0), 0);
    const pendingRevenue = c.parcels.reduce((sum, p) =>
      sum + (p.payment?.status === 'pending' ? (p.payment.amount ?? 0) : 0), 0);
    const revenueCad = c.financeRevenueCad ?? (paidRevenue + pendingRevenue) / 100;
    const varCosts = c.cargoVariableCosts.reduce((sum, vc) => sum + vc.amountCad, 0);

    const refDate = c.arrivalDate ?? c.departureDate;
    if (!refDate) continue;
    const m = monthStr(refDate);
    if (!(m in revByMonth)) continue;

    revByMonth[m]  += revenueCad;
    varByMonth[m]  += varCosts;
    campsByMonth[m].push({
      id: c.id,
      code: c.code,
      revenueCad,
      variableCosts: varCosts,
      hasVariableCosts: c.cargoVariableCosts.length > 0,
    });
  }

  // ── Build projection rows ────────────────────────────────────
  let cumulative = 0;
  const rows = months.map(m => {
    const revenue   = revByMonth[m]  ?? 0;
    const varCosts  = varByMonth[m]  ?? 0;
    const fixedCosts = futureFixedByMonth[m] > 0
      ? futureFixedByMonth[m]
      : avgFixedPerMonth;
    const fixedIsEstimated = !(futureFixedByMonth[m] > 0);
    const net = revenue - varCosts - fixedCosts;
    cumulative += net;

    return {
      month: m,
      isPast: m < currentMonth,
      isCurrent: m === currentMonth,
      revenue,
      variableCosts: varCosts,
      fixedCosts,
      fixedIsEstimated,
      net,
      cumulative,
      campaigns: campsByMonth[m],
    };
  });

  return NextResponse.json({
    rows,
    avgFixedPerMonth,
  });
}
