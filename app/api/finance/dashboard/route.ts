export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

function fiscalYearOf(date: Date): number {
  return date.getMonth() >= 6 ? date.getFullYear() : date.getFullYear() - 1;
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const now = new Date();
  const fy = fiscalYearOf(now);
  const fyStart = new Date(`${fy}-07-01`);
  const fyEnd   = new Date(`${fy + 1}-07-01`);

  // Campaigns in current fiscal year
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

  let totalRevenueCad = 0;
  let totalVariableCosts = 0;

  for (const c of campaigns) {
    const paidRevenue = c.parcels.reduce((sum, p) =>
      sum + (p.payment?.status === 'paid' ? (p.payment.amount ?? 0) : 0), 0);
    const revenueCad = c.financeRevenueCad ?? paidRevenue / 100;
    totalRevenueCad += revenueCad;
    totalVariableCosts += c.cargoVariableCosts.reduce((sum, vc) => sum + vc.amountCad, 0);
  }

  // Fixed costs YTD: sum all fixed_monthly_costs from fy-07 to current month
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const fyStartStr = `${fy}-07`;

  const fixedCosts = await prisma.fixedMonthlyCost.findMany({
    where: { month: { gte: fyStartStr, lte: currentMonthStr } },
  });
  const totalFixedCosts = fixedCosts.reduce((sum, f) => sum + f.amountCad, 0);

  const grossMargin = totalRevenueCad - totalVariableCosts;
  const netResult   = grossMargin - totalFixedCosts;
  const marginPct   = totalRevenueCad > 0 ? grossMargin / totalRevenueCad * 100 : null;

  return NextResponse.json({
    fiscalYear: fy,
    fiscalLabel: `${fy}–${fy + 1}`,
    ytdThrough: currentMonthStr,
    campaignCount: campaigns.length,
    totalRevenueCad,
    totalVariableCosts,
    totalFixedCosts,
    grossMargin,
    netResult,
    marginPct,
  });
}
