export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

function fiscalYearOf(date: Date): number {
  return date.getMonth() >= 6 ? date.getFullYear() : date.getFullYear() - 1;
}

function fyMonths(fy: number): string[] {
  const months: string[] = [];
  for (let m = 7; m <= 12; m++) months.push(`${fy}-${String(m).padStart(2, '0')}`);
  for (let m = 1; m <= 6; m++) months.push(`${fy + 1}-${String(m).padStart(2, '0')}`);
  return months;
}

// GET /api/finance/cost-breakdown?fy=2026
// Variable cost actuals broken down by post and by month
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const url = new URL(req.url);
  const fy = parseInt(url.searchParams.get('fy') ?? String(fiscalYearOf(new Date())));

  const fyStart = new Date(`${fy}-07-01`);
  const fyEnd   = new Date(`${fy + 1}-07-01`);
  const months  = fyMonths(fy);

  const posts = await prisma.costPost.findMany({
    where: { active: true, type: 'variable' },
    orderBy: { sortOrder: 'asc' },
  });

  const campaigns = await prisma.campaign.findMany({
    where: {
      deletedAt: null,
      OR: [
        { departureDate: { gte: fyStart, lt: fyEnd } },
        { arrivalDate:   { gte: fyStart, lt: fyEnd } },
      ],
    },
    select: {
      id: true,
      name: true,
      departureDate: true,
      arrivalDate: true,
      createdAt: true,
      routeId: true,
      route: { select: { id: true, label: true, origin: true, destination: true } },
      cargoVariableCosts: {
        select: { postId: true, amountCad: true },
      },
      parcels: {
        where: { deletedAt: null },
        select: { payment: { select: { amount: true, status: true } } },
      },
      financeRevenueCad: true,
    },
  });

  // byPost[postId][month] = total amount
  const byPost: Record<number, Record<string, number>> = {};
  // totalByPost[postId] = total for FY
  const totalByPost: Record<number, number> = {};
  // byRoute[routeId] = { label, costs per post, revenue, campaignCount }
  const byRoute: Record<string, {
    routeId: string;
    route: string;
    revenue: number;
    variableCosts: number;
    grossMargin: number;
    marginPct: number | null;
    campaignCount: number;
    costByPost: Record<number, number>;
  }> = {};

  for (const c of campaigns) {
    const refDate = c.departureDate ?? c.arrivalDate ?? c.createdAt;
    const d = new Date(refDate);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    const paidRevenue = c.parcels.reduce((sum, p) =>
      sum + (p.payment?.status === 'paid' ? (p.payment.amount ?? 0) : 0), 0);
    const rev = c.financeRevenueCad ?? paidRevenue / 100;

    for (const vc of c.cargoVariableCosts) {
      if (!byPost[vc.postId]) byPost[vc.postId] = {};
      byPost[vc.postId][monthKey] = (byPost[vc.postId][monthKey] ?? 0) + vc.amountCad;
      totalByPost[vc.postId] = (totalByPost[vc.postId] ?? 0) + vc.amountCad;
    }

    if (c.route) {
      const rId = c.route.id;
      if (!byRoute[rId]) {
        const label = c.route.label ?? `${c.route.origin} → ${c.route.destination}`;
        byRoute[rId] = { routeId: rId, route: label, revenue: 0, variableCosts: 0, grossMargin: 0, marginPct: null, campaignCount: 0, costByPost: {} };
      }
      byRoute[rId].revenue       += rev;
      byRoute[rId].campaignCount += 1;
      for (const vc of c.cargoVariableCosts) {
        byRoute[rId].variableCosts += vc.amountCad;
        byRoute[rId].costByPost[vc.postId] = (byRoute[rId].costByPost[vc.postId] ?? 0) + vc.amountCad;
      }
    }
  }

  for (const row of Object.values(byRoute)) {
    row.grossMargin = row.revenue - row.variableCosts;
    row.marginPct   = row.revenue > 0 ? (row.grossMargin / row.revenue) * 100 : null;
  }

  // Monthly totals across all posts
  const totalByMonth: Record<string, number> = {};
  for (const postCosts of Object.values(byPost)) {
    for (const [month, amt] of Object.entries(postCosts)) {
      totalByMonth[month] = (totalByMonth[month] ?? 0) + amt;
    }
  }

  return NextResponse.json({
    fiscalYear: fy,
    label: `${fy}–${fy + 1}`,
    months,
    posts,
    byPost,       // Record<postId, Record<month, amount>>
    totalByPost,  // Record<postId, total>
    totalByMonth, // Record<month, total>
    byRoute: Object.values(byRoute).sort((a, b) => b.revenue - a.revenue),
    campaignCount: campaigns.length,
  });
}
