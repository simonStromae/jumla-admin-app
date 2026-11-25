export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireOnlyAdmin } from '@/src/lib/api-auth';

function fiscalYearOf(date: Date): number {
  return date.getMonth() >= 6 ? date.getFullYear() : date.getFullYear() - 1;
}

function monthStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function fiscalMonths(fy: number): string[] {
  const months: string[] = [];
  for (let m = 7; m <= 12; m++) months.push(`${fy}-${String(m).padStart(2, '0')}`);
  for (let m = 1; m <= 6; m++) months.push(`${fy + 1}-${String(m).padStart(2, '0')}`);
  return months;
}

export async function GET() {
  const { error } = await requireOnlyAdmin();
  if (error) return error;

  const now = new Date();
  const fy = fiscalYearOf(now);
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
    },
  });

  const currentMonthStr = monthStr(now);
  const fyStartStr = `${fy}-07`;

  const fixedCosts = await prisma.fixedMonthlyCost.findMany({
    where: { month: { gte: fyStartStr, lte: currentMonthStr } },
  });

  // ── Totals ──────────────────────────────────────────────────
  let totalRevenueCad = 0;
  let totalVariableCosts = 0;
  let incompleteCampaigns = 0;

  // ── Monthly breakdown ────────────────────────────────────────
  const months = fiscalMonths(fy);
  const byMonthRev: Record<string, number> = {};
  const byMonthVar: Record<string, number> = {};
  for (const m of months) { byMonthRev[m] = 0; byMonthVar[m] = 0; }

  const variablePostCount = await prisma.costPost.count({ where: { type: 'variable' } });

  for (const c of campaigns) {
    const paidRevenue = c.parcels.reduce((sum, p) =>
      sum + (p.payment?.status === 'paid' ? (p.payment.amount ?? 0) : 0), 0);
    const revenueCad = c.financeRevenueCad ?? paidRevenue / 100;
    const varCosts = c.cargoVariableCosts.reduce((sum, vc) => sum + vc.amountCad, 0);

    totalRevenueCad   += revenueCad;
    totalVariableCosts += varCosts;

    if (variablePostCount > 0 && c.cargoVariableCosts.length === 0) incompleteCampaigns++;

    const refDate = c.departureDate ?? c.arrivalDate;
    if (refDate) {
      const m = monthStr(refDate);
      if (m in byMonthRev) {
        byMonthRev[m] += revenueCad;
        byMonthVar[m] += varCosts;
      }
    }
  }

  const fixedByMonth: Record<string, number> = {};
  for (const f of fixedCosts) {
    fixedByMonth[f.month] = (fixedByMonth[f.month] ?? 0) + f.amountCad;
  }
  const totalFixedCosts = Object.values(fixedByMonth).reduce((s, v) => s + v, 0);

  const grossMargin = totalRevenueCad - totalVariableCosts;
  const netResult   = grossMargin - totalFixedCosts;
  const marginPct   = totalRevenueCad > 0 ? grossMargin / totalRevenueCad * 100 : null;

  // Build monthly array up to current month
  const byMonth = months
    .filter(m => m <= currentMonthStr)
    .map(m => {
      const rev = byMonthRev[m] ?? 0;
      const varC = byMonthVar[m] ?? 0;
      const fixC = fixedByMonth[m] ?? 0;
      const gross = rev - varC;
      return {
        month: m,
        revenue: rev,
        variableCosts: varC,
        fixedCosts: fixC,
        grossMargin: gross,
        marginPct: rev > 0 ? gross / rev * 100 : null,
      };
    });

  return NextResponse.json({
    fiscalYear: fy,
    fiscalLabel: `${fy}–${fy + 1}`,
    ytdThrough: currentMonthStr,
    campaignCount: campaigns.length,
    incompleteCampaigns,
    totalRevenueCad,
    totalVariableCosts,
    totalFixedCosts,
    grossMargin,
    netResult,
    marginPct,
    byMonth,
  });
}
