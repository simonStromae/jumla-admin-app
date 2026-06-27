export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requirePermission } from '@/src/lib/api-auth';

export async function GET(req: NextRequest) {
  const { error } = await requirePermission('analytics');
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
  let costs:    any[] = [];

  if (yearCampaignIds.length > 0) {
    [parcels, costs] = await Promise.all([
      prisma.parcel.findMany({
        where: { campaignId: { in: yearCampaignIds } },
        include: {
          client:  { select: { id: true, name: true, city: true } },
          payment: true,
        },
      }),
      prisma.campaignCost.findMany({ where: { campaignId: { in: yearCampaignIds } } }),
    ]);
  }

  // ── Collect transaction allocations (actual cash received, with dates) ──────
  const paymentIds = parcels.filter((p: any) => p.payment).map((p: any) => p.payment.id) as string[];
  let allocationsWithDates: { paymentId: string; amount: number; createdAt: Date }[] = [];
  if (paymentIds.length > 0) {
    allocationsWithDates = await prisma.$queryRawUnsafe<any[]>(
      `SELECT ta."paymentId", ta.amount::int AS amount, t."createdAt"
       FROM transaction_allocations ta
       JOIN transactions t ON t.id = ta."transactionId"
       WHERE ta."paymentId" = ANY($1::text[])`,
      paymentIds
    ).catch(() => []);
  }

  // Group allocations by paymentId → total collected for partial/legacy payments
  const allocByPayment: Record<string, number> = {};
  for (const a of allocationsWithDates) {
    allocByPayment[a.paymentId] = (allocByPayment[a.paymentId] ?? 0) + Number(a.amount);
  }
  const paymentsWithAllocations = new Set(allocationsWithDates.map(a => a.paymentId));

  // ── Per-parcel KPI computation ─────────────────────────────────────────────
  let totalInvoiced  = 0;
  let totalCollected = 0;

  // client revenue map (actual collected, for top clients)
  const clientRevMap: Record<string, { name: string; amount: number; count: number }> = {};

  // monthly revenue map (index = month 0-11)
  const monthlyRevMap: number[] = new Array(12).fill(0);

  // unpaid list items
  const unpaidItems: { id: string; clientName: string; trackingCode: string; amount: number; status: string }[] = [];

  for (const p of parcels) {
    const adjStatus      = (p as any).adjustmentStatus ?? 'none';
    const confirmedPrice = (p as any).confirmedPriceXaf as number | null;

    // Invoiced = confirmed price if exists, else original estimate
    const invoiced = confirmedPrice ?? p.priceXaf ?? 0;
    totalInvoiced += invoiced;

    // ── Collected: main invoice ──
    let collected = 0;
    if (p.payment) {
      if (p.payment.status === 'completed') {
        if (paymentsWithAllocations.has(p.payment.id)) {
          // Has transaction records → use allocations (more accurate)
          collected = allocByPayment[p.payment.id] ?? p.payment.amount;
        } else {
          // Legacy payment marked completed without transactions table
          collected = p.payment.amount;
        }
      } else {
        // Partial or pending: use actual allocations received
        collected = allocByPayment[p.payment.id] ?? 0;
      }
    }

    // ── Collected: supplement ──
    if (adjStatus === 'paid' && confirmedPrice != null) {
      const suppAmt = Math.max(0, confirmedPrice - (p.priceXaf ?? 0));
      collected += suppAmt;
    }

    totalCollected += collected;

    // ── Monthly revenue ──
    // Completed payments with no allocation records: use paidAt
    if (p.payment?.status === 'completed' && !paymentsWithAllocations.has(p.payment.id)) {
      const d = new Date(p.payment.paidAt ?? p.payment.createdAt);
      if (d.getFullYear() === year) monthlyRevMap[d.getMonth()] += p.payment.amount;
    }
    // Paid supplements: approximate to campaign departure month
    if (adjStatus === 'paid' && confirmedPrice != null) {
      const suppAmt = Math.max(0, confirmedPrice - (p.priceXaf ?? 0));
      if (suppAmt > 0) {
        const camp = yearCampaigns.find(c => c.id === p.campaignId);
        const d = camp?.departureDate ? new Date(camp.departureDate) : new Date();
        if (d.getFullYear() === year) monthlyRevMap[d.getMonth()] += suppAmt;
      }
    }

    // ── Top clients ──
    const cid = p.client.id;
    if (!clientRevMap[cid]) clientRevMap[cid] = { name: p.client.name, amount: 0, count: 0 };
    clientRevMap[cid].amount += collected;
    if (p.payment) clientRevMap[cid].count++;

    // ── Unpaid items ──
    const remaining = Math.max(0, invoiced - collected);
    if (remaining > 0) {
      // Split into main invoice remaining and supplement remaining
      const mainRemaining = p.payment
        ? Math.max(0, p.payment.amount - (p.payment.status === 'completed' ? p.payment.amount : (allocByPayment[p.payment.id] ?? 0)))
        : 0;
      const suppRemaining = adjStatus === 'pending' && confirmedPrice != null
        ? Math.max(0, confirmedPrice - (p.priceXaf ?? 0))
        : 0;

      if (mainRemaining > 0 && p.payment) {
        unpaidItems.push({
          id:           p.payment.id,
          clientName:   p.client.name,
          trackingCode: p.trackingCode,
          amount:       mainRemaining,
          status:       p.payment.status,
        });
      }
      if (suppRemaining > 0) {
        unpaidItems.push({
          id:           'sup_' + p.id,
          clientName:   p.client.name,
          trackingCode: p.trackingCode,
          amount:       suppRemaining,
          status:       'supplement_pending',
        });
      }
    }
  }

  // Monthly revenue from allocations (actual transaction dates)
  for (const a of allocationsWithDates) {
    const d = new Date(a.createdAt);
    if (d.getFullYear() === year) monthlyRevMap[d.getMonth()] += Number(a.amount);
  }

  const totalWeight    = parcels.reduce((s: number, p: any) => s + (p.weightKg ?? 0), 0);
  const totalParcels   = parcels.length;
  const totalCampaigns = yearCampaigns.length;
  const totalCosts     = costs.reduce((s: number, c: any) => s + c.fret + c.manutention + c.douane + c.transport + c.divers, 0);
  const grossMargin    = totalCollected - totalCosts;
  const recoveryRate   = totalInvoiced > 0 ? Math.round(totalCollected / totalInvoiced * 100) : 0;
  const grossMarginPct = totalCollected > 0 ? Math.round(grossMargin / totalCollected * 100) : 0;
  const avgCostPerKg   = totalWeight > 0 ? totalCosts / totalWeight : 0;
  const marginPerParcel = totalParcels > 0 ? Math.round(grossMargin / totalParcels) : 0;

  const unpaidTotal = unpaidItems.reduce((s, u) => s + u.amount, 0);
  const unpaidCount = unpaidItems.length;

  // ── Monthly breakdown ──────────────────────────────────────────────────────
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(year, i, 1);
    return { label: new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(d), year: d.getFullYear(), month: d.getMonth() };
  });

  const monthlyCosts = months.map(m => {
    const campIds = yearCampaigns
      .filter(c => c.departureDate && c.departureDate.getFullYear() === m.year && c.departureDate.getMonth() === m.month)
      .map(c => c.id);
    return costs.filter((c: any) => campIds.includes(c.campaignId))
      .reduce((s: number, c: any) => s + c.fret + c.manutention + c.douane + c.transport + c.divers, 0);
  });

  // ── Top clients (by actual collected) ─────────────────────────────────────
  const topClients = Object.values(clientRevMap)
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((c, i, arr) => ({
      name:  c.name,
      value: c.amount.toLocaleString('fr') + ' CAD',
      sub:   c.count + ' colis payé' + (c.count > 1 ? 's' : ''),
      meter: arr[0].amount > 0 ? Math.round(c.amount / arr[0].amount * 100) : 0,
      color: (i % 8) + 1,
    }));

  // ── Top destinations ───────────────────────────────────────────────────────
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

  // ── Analytics par compagnie aérienne ──────────────────────────────────────
  const legs = await prisma.campaignLeg.findMany({
    where: { campaignId: { in: yearCampaignIds } },
    include: { airline: true },
  });

  // Build per-campaign weight totals (to distribute fret cost proportionally)
  const campaignLegWeights: Record<string, number> = {};
  for (const leg of legs) {
    campaignLegWeights[leg.campaignId] = (campaignLegWeights[leg.campaignId] ?? 0) + (leg.weightKg ?? 0);
  }

  // Per-airline aggregation
  const airlineMap: Record<string, { name: string; iata: string | null; weightKg: number; campaigns: Set<string>; fretXaf: number }> = {};
  for (const leg of legs) {
    const aid = leg.airlineId;
    if (!airlineMap[aid]) {
      airlineMap[aid] = { name: leg.airline.name, iata: leg.airline.iata, weightKg: 0, campaigns: new Set(), fretXaf: 0 };
    }
    airlineMap[aid].weightKg += leg.weightKg ?? 0;
    airlineMap[aid].campaigns.add(leg.campaignId);

    // Distribute campaign fret cost by weight ratio
    const campCost = costs.find((c: any) => c.campaignId === leg.campaignId);
    if (campCost && leg.weightKg) {
      const campTotalWeight = campaignLegWeights[leg.campaignId] || 1;
      const ratio = leg.weightKg / campTotalWeight;
      airlineMap[aid].fretXaf += Math.round(campCost.fret * ratio);
    }
  }

  const airlineStats = Object.values(airlineMap)
    .sort((a, b) => b.weightKg - a.weightKg)
    .map(a => ({
      name:          a.name,
      iata:          a.iata,
      weightKg:      Math.round(a.weightKg * 10) / 10,
      campaigns:     a.campaigns.size,
      fretXaf:       a.fretXaf,
      fretPerKg:     a.weightKg > 0 ? Math.round(a.fretXaf / a.weightKg * 100) / 100 : 0,
      weightPct:     0, // filled below
    }));

  const totalAirlineWeight = airlineStats.reduce((s, a) => s + a.weightKg, 0);
  for (const a of airlineStats) {
    a.weightPct = totalAirlineWeight > 0 ? Math.round(a.weightKg / totalAirlineWeight * 100) : 0;
  }

  // ── Top agents ─────────────────────────────────────────────────────────────
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

  return NextResponse.json({
    kpi: {
      totalCollected, totalInvoiced,
      totalWeight:    Math.round(totalWeight * 10) / 10,
      totalParcels, totalCampaigns, recoveryRate,
      totalCosts, grossMargin, grossMarginPct,
      avgCostPerKg:  Math.round(avgCostPerKg * 100) / 100,
      marginPerParcel,
      unpaidTotal,
      unpaidCount,
    },
    months:         { labels: months.map(m => m.label), revenue: monthlyRevMap, costs: monthlyCosts },
    topClients,
    topDestinations,
    topAgents,
    airlineStats,
    unpaid:         unpaidItems.slice(0, 8),
  });
}
