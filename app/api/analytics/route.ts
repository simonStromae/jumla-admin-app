export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const [campaigns, parcels, payments, costs] = await Promise.all([
    prisma.campaign.findMany({ include: { route: true } }),
    prisma.parcel.findMany(),
    prisma.payment.findMany({ where: { status: 'completed' } }),
    prisma.campaignCost.findMany(),
  ]);

  const totalCollected  = payments.reduce((s, p) => s + p.amount, 0);
  const totalInvoiced   = parcels.reduce((s, p)  => s + (p.priceXaf ?? 0), 0);
  const totalWeight     = parcels.reduce((s, p)  => s + (p.weightKg ?? 0), 0);
  const totalParcels    = parcels.length;
  const totalCampaigns  = campaigns.length;
  const totalCosts      = costs.reduce((s, c) => s + c.fret + c.manutention + c.douane + c.transport + c.divers, 0);
  const grossMargin     = totalCollected - totalCosts;
  const recoveryRate    = totalInvoiced > 0 ? Math.round(totalCollected / totalInvoiced * 100) : 0;
  const grossMarginPct  = totalCollected > 0 ? Math.round(grossMargin / totalCollected * 100) : 0;
  const avgCostPerKg    = totalWeight > 0 ? totalCosts / totalWeight : 0;
  const marginPerParcel = totalParcels > 0 ? Math.round(grossMargin / totalParcels) : 0;

  // Monthly breakdown (last 6 months)
  const now   = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      label:     new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(d),
      year:      d.getFullYear(),
      month:     d.getMonth(),
    };
  }).reverse();

  const monthlyRevenue = months.map(m => {
    return payments
      .filter(p => {
        const d = p.paidAt ?? p.createdAt;
        return d.getFullYear() === m.year && d.getMonth() === m.month;
      })
      .reduce((s, p) => s + p.amount, 0);
  });

  const monthlyCosts = months.map(m => {
    const campIds = campaigns
      .filter(c => {
        if (!c.departureDate) return false;
        return c.departureDate.getFullYear() === m.year && c.departureDate.getMonth() === m.month;
      })
      .map(c => c.id);
    return costs
      .filter(c => campIds.includes(c.campaignId))
      .reduce((s, c) => s + c.fret + c.manutention + c.douane + c.transport + c.divers, 0);
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
