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

// GET /api/finance/budget?fy=2026
// Returns budget + actuals for the requested fiscal year (defaults to current)
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const url = new URL(req.url);
  const fy = parseInt(url.searchParams.get('fy') ?? String(fiscalYearOf(new Date())));

  // Load budget settings
  const key = `finance-budget-${fy}`;
  const setting = await prisma.setting.findUnique({ where: { key } });
  const budget: Record<string, number> = setting ? JSON.parse(setting.value) : {};

  // Load posts
  const posts = await prisma.costPost.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } });

  // Load actuals: variable costs YTD
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

  const actualVariable: Record<number, number> = {};
  let totalRevenue = 0;
  let campaignCount = 0;

  for (const c of campaigns) {
    const paidRevenue = c.parcels.reduce((sum, p) =>
      sum + (p.payment?.status === 'paid' ? (p.payment.amount ?? 0) : 0), 0);
    totalRevenue += c.financeRevenueCad ?? paidRevenue / 100;
    campaignCount++;

    for (const vc of c.cargoVariableCosts) {
      actualVariable[vc.postId] = (actualVariable[vc.postId] ?? 0) + vc.amountCad;
    }
  }

  // Fixed costs YTD
  const months = fyMonths(fy);
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const fyStartStr = `${fy}-07`;

  const fixedCosts = await prisma.fixedMonthlyCost.findMany({
    where: { month: { gte: fyStartStr, lte: currentMonthStr } },
  });
  const actualFixed: Record<number, number> = {};
  for (const f of fixedCosts) {
    actualFixed[f.postId] = (actualFixed[f.postId] ?? 0) + f.amountCad;
  }

  // Annualized fixed (full year)
  const allFixedCosts = await prisma.fixedMonthlyCost.findMany({
    where: { month: { gte: fyStartStr, lte: `${fy + 1}-06` } },
  });
  const annualFixed: Record<number, number> = {};
  for (const f of allFixedCosts) {
    annualFixed[f.postId] = (annualFixed[f.postId] ?? 0) + f.amountCad;
  }

  return NextResponse.json({
    fiscalYear: fy,
    label: `${fy}–${fy + 1}`,
    campaignCount,
    totalRevenue,
    monthCount: months.length,
    posts,
    budget,
    actualVariable,
    actualFixed,
    annualFixed,
  });
}

// PUT /api/finance/budget?fy=2026
// Body: { [postId]: amount, ... } — full budget map (variable + fixed merged)
export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const url = new URL(req.url);
  const fy = parseInt(url.searchParams.get('fy') ?? String(fiscalYearOf(new Date())));

  const body = await req.json();
  const key = `finance-budget-${fy}`;

  await prisma.setting.upsert({
    where: { key },
    create: { key, value: JSON.stringify(body) },
    update: { value: JSON.stringify(body) },
  });

  return NextResponse.json({ ok: true });
}
