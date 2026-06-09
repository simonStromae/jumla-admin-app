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
  let allPayments: any[] = [];

  if (yearCampaignIds.length > 0) {
    [parcels, costs] = await Promise.all([
      prisma.parcel.findMany({
        where: { campaignId: { in: yearCampaignIds } },
        include: { client: { select: { id: true, name: true, city: true } } },
      }),
      prisma.campaignCost.findMany({ where: { campaignId: { in: yearCampaignIds } } }),
    ]);
    const parcelIds = parcels.map((p: any) => p.id);
    if (parcelIds.length > 0) {
      [payments, allPayments] = await Promise.all([
        prisma.payment.findMany({
          where: { status: 'completed', parcelId: { in: parcelIds } },
          include: { client: { select: { id: true, name: true } } },
        }),
        prisma.payment.findMany({
          where: { parcelId: { in: parcelIds } },
          include: {
            client: { select: { id: true, name: true } },
            parcel: { select: { trackingCode: true, campaignId: true } },
          },
        }),
      ]);
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

  // Monthly breakdown
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(year, i, 1);
    return { label: new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(d), year: d.getFullYear(), month: d.getMonth() };
  });

  const monthlyRevenue = months.map(m =>
    payments.filter((p: any) => {
      const d = new Date(p.paidAt ?? p.createdAt);
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    }).reduce((s: number, p: any) => s + p.amount, 0)
  );

  const monthlyCosts = months.map(m => {
    const campIds = yearCampaigns
      .filter(c => c.departureDate && c.departureDate.getFullYear() === m.year && c.departureDate.getMonth() === m.month)
      .map(c => c.id);
    return costs.filter((c: any) => campIds.includes(c.campaignId))
      .reduce((s: number, c: any) => s + c.fret + c.manutention + c.douane + c.transport + c.divers, 0);
  });

  // ── Top clients (by collected payments) ──────────────────────────
  const clientRevMap: Record<string, { name: string; amount: number; count: number }> = {};
  for (const p of payments) {
    const id = p.client.id;
    if (!clientRevMap[id]) clientRevMap[id] = { name: p.client.name, amount: 0, count: 0 };
    clientRevMap[id].amount += p.amount;
    clientRevMap[id].count  += 1;
  }
  const topClients = Object.values(clientRevMap)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((c, i, arr) => ({
      name:  c.name,
      value: c.amount.toLocaleString('fr') + ' CAD',
      sub:   c.count + ' colis payé' + (c.count > 1 ? 's' : ''),
      meter: arr[0].amount > 0 ? Math.round(c.amount / arr[0].amount * 100) : 0,
      color: (i % 8) + 1,
    }));

  // ── Top destinations (by parcel count via client city) ───────────
  const destMap: Record<string, number> = {};
  for (const p of parcels) {
    const city = p.client?.city || 'Inconnue';
    destMap[city] = (destMap[city] ?? 0) + 1;
  }
  const destEntries = Object.entries(destMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const destMax = destEntries[0]?.[1] ?? 1;
  const topDestinations = destEntries.map(([city, count]) => ({
    name:  city,
    value: count + ' colis',
    sub:   Math.round(count / (totalParcels || 1) * 100) + '% du volume',
    meter: Math.round(count / destMax * 100),
  }));

  // ── Top agents (by campaign count) ───────────────────────────────
  const agents = await prisma.user.findMany({
    where: { role: { in: ['admin', 'agent'] } },
    include: { _count: { select: { campaigns: true } } },
    orderBy: { campaigns: { _count: 'desc' } },
    take: 5,
  });
  const agentMax = agents[0]?._count.campaigns ?? 1;
  const topAgents = agents.filter(a => a._count.campaigns > 0).map((a, i) => ({
    name:  a.name,
    value: a._count.campaigns + ' cargaison' + (a._count.campaigns > 1 ? 's' : ''),
    sub:   a.city ?? a.role,
    meter: agentMax > 0 ? Math.round(a._count.campaigns / agentMax * 100) : 0,
    color: (i % 8) + 1,
  }));

  // ── Impayés ───────────────────────────────────────────────────────
  const unpaid = allPayments
    .filter((p: any) => p.status !== 'completed')
    .map((p: any) => ({
      id:           p.id,
      clientName:   p.client.name,
      trackingCode: p.parcel.trackingCode,
      amount:       p.amount,
      status:       p.status,
    }))
    .slice(0, 8);

  const unpaidTotal = allPayments
    .filter((p: any) => p.status !== 'completed')
    .reduce((s: number, p: any) => s + p.amount, 0);

  return NextResponse.json({
    kpi: {
      totalCollected, totalInvoiced,
      totalWeight:    Math.round(totalWeight * 10) / 10,
      totalParcels, totalCampaigns, recoveryRate,
      totalCosts, grossMargin, grossMarginPct,
      avgCostPerKg:  Math.round(avgCostPerKg * 100) / 100,
      marginPerParcel,
      unpaidTotal,
      unpaidCount: allPayments.filter((p: any) => p.status !== 'completed').length,
    },
    months:       { labels: months.map(m => m.label), revenue: monthlyRevenue, costs: monthlyCosts },
    topClients,
    topDestinations,
    topAgents,
    unpaid,
  });
}
