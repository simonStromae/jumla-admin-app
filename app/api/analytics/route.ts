export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const year    = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
  const routeId = searchParams.get('routeId') || null;

  const yearStart = new Date(year, 0, 1);
  const yearEnd   = new Date(year + 1, 0, 1);

  // Campaigns for this year (and optional route)
  const campaigns = await prisma.campaign.findMany({
    where: { ...(routeId ? { routeId } : {}) },
    include: { route: true },
  });

  const yearCampaigns = campaigns.filter(c =>
    c.departureDate ? (c.departureDate >= yearStart && c.departureDate < yearEnd) : true
  );
  const yearCampaignIds = yearCampaigns.map(c => c.id);

  let parcels:  any[] = [];
  let payments: any[] = [];
  let costs:    any[] = [];

  if (yearCampaignIds.length > 0) {
    [parcels, costs] = await Promise.all([
      prisma.parcel.findMany({ where: { campaignId: { in: yearCampaignIds } } }),
      prisma.campaignCost.findMany({ where: { campaignId: { in: yearCampaignIds } } }),
    ]);
    const parcelIds = parcels.map((p: any) => p.id);
    if (parcelIds.length > 0) {
      payments = await prisma.payment.findMany({
        where: { status: 'completed', parcelId: { in: parcelIds } },
      });
    }
  }

  const totalCollected  = payments.reduce((s: number, p: any) => s + p.amount, 0);
  const totalInvoiced   = parcels.reduce((s: number, p: any)  => s + (p.priceXaf ?? 0), 0);
  const totalWeight     = parcels.reduce((s: number, p: any)  => s + (p.weightKg ?? 0), 0);
  const totalParcels    = parcels.length;
  const totalCampaigns  = yearCampaigns.length;
  const totalCosts      = costs.reduce((s: number, c: any) => s + c.fret + c.manutention + c.douane + c.transport + c.divers, 0);
  const grossMargin     = totalCollected - totalCosts;
  const recoveryRate    = totalInvoiced > 0 ? Math.round(totalCollected / totalInvoiced * 100) : 0;
  const grossMarginPct  = totalCollected > 0 ? Math.round(grossMargin / totalCollected * 100) : 0;
  const avgCostPerKg    = totalWeight > 0 ? totalCosts / totalWeight : 0;
  const marginPerParcel = totalParcels > 0 ? Math.round(grossMargin / totalParcels) : 0;

  // Monthly breakdown — all 12 months of the selected year
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(year, i, 1);
    return {
      label: new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(d),
      year:  d.getFullYear(),
      month: d.getMonth(),
    };
  });

  const monthlyRevenue = months.map(m =>
    payments
      .filter((p: any) => {
        const d = p.paidAt ?? p.createdAt;
        return new Date(d).getFullYear() === m.year && new Date(d).getMonth() === m.month;
      })
      .reduce((s: number, p: any) => s + p.amount, 0)
  );

  const monthlyCosts = months.map(m => {
    const campIds = yearCampaigns
      .filter(c => {
        if (!c.departureDate) return false;
        return c.departureDate.getFullYear() === m.year && c.departureDate.getMonth() === m.month;
      })
      .map(c => c.id);
    return costs
      .filter((c: any) => campIds.includes(c.campaignId))
      .reduce((s: number, c: any) => s + c.fret + c.manutention + c.douane + c.transport + c.divers, 0);
  });

  return NextResponse.json({
    kpi: {
      totalCollected,
      totalInvoiced,
      totalWeight:   Math.round(totalWeight * 10) / 10,
      totalParcels,
      totalCampaigns,
      recoveryRate,
      totalCosts,
      grossMargin,
      grossMarginPct,
      avgCostPerKg:  Math.round(avgCostPerKg * 100) / 100,
      marginPerParcel,
    },
    months: {
      labels:  months.map(m => m.label),
      revenue: monthlyRevenue,
      costs:   monthlyCosts,
    },
  });
}
