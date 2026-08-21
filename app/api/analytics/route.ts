export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requirePermission } from '@/src/lib/api-auth';

const METHOD_LABELS: Record<string, string> = {
  interac:      'Virement Interac',
  cash:         'Espèces',
  mobile_money: 'Mobile Money',
  virement:     'Virement bancaire',
  card:         'Carte bancaire',
};

export async function GET(req: NextRequest) {
  const { error } = await requirePermission('analytics');
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const year    = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
  const routeId = searchParams.get('routeId') || null;

  const yearStart = new Date(year, 0, 1);
  const yearEnd   = new Date(year + 1, 0, 1);

  const campaigns = await (prisma.campaign.findMany as any)({
    where: { deletedAt: null, ...(routeId ? { routeId } : {}) },
    include: { route: true },
  }).catch(() => prisma.campaign.findMany({
    where: { ...(routeId ? { routeId } : {}) },
    include: { route: true },
  }));

  const yearCampaigns = campaigns.filter(c =>
    c.departureDate ? (c.departureDate >= yearStart && c.departureDate < yearEnd) : true
  );
  const yearCampaignIds = yearCampaigns.map(c => c.id);

  let parcels:  any[] = [];
  let costs:    any[] = [];

  if (yearCampaignIds.length > 0) {
    [parcels, costs] = await Promise.all([
      prisma.parcel.findMany({
        where: { campaignId: { in: yearCampaignIds }, deletedAt: null, NOT: { status: 'ann' } },
        include: {
          client:  { select: { id: true, name: true, city: true } },
          payment: true,
        },
      }),
      prisma.campaignCost.findMany({ where: { campaignId: { in: yearCampaignIds } } }),
    ]);
  }

  // ── Allocations — actual cash received, with dates and method ───────────────
  const paymentIds = parcels.filter((p: any) => p.payment).map((p: any) => p.payment.id) as string[];
  let allocationsWithDates: { paymentId: string; amount: number; createdAt: Date; method: string }[] = [];
  if (paymentIds.length > 0) {
    allocationsWithDates = await prisma.$queryRawUnsafe<any[]>(
      `SELECT ta."paymentId", ta.amount::int AS amount, t."createdAt",
              COALESCE(t.method, 'interac') AS method
       FROM transaction_allocations ta
       JOIN transactions t ON t.id = ta."transactionId"
       WHERE ta."paymentId" = ANY($1::text[])`,
      paymentIds
    ).catch(() => []);
  }

  const allocByPayment: Record<string, number> = {};
  for (const a of allocationsWithDates) {
    allocByPayment[a.paymentId] = (allocByPayment[a.paymentId] ?? 0) + Number(a.amount);
  }
  const paymentsWithAllocations = new Set(allocationsWithDates.map(a => a.paymentId));

  // ── Helper: invoiced amount for a single parcel (same rule as campaigns list) ──
  function parcelInvoiced(p: any): number {
    const adj  = (p.adjustmentStatus ?? 'none') as string;
    const conf = p.confirmedPriceXaf as number | null;
    return (adj === 'paid' || adj === 'discount') && conf != null
      ? conf
      : (p.payment?.amount ?? p.priceXaf ?? 0);
  }

  // ── Helper: collected amount for a single parcel ────────────────────────────
  function parcelCollected(p: any): number {
    let collected = 0;
    if (p.payment) {
      if (p.payment.status === 'completed') {
        collected = paymentsWithAllocations.has(p.payment.id)
          ? (allocByPayment[p.payment.id] ?? p.payment.amount)
          : p.payment.amount;
      } else {
        collected = allocByPayment[p.payment.id] ?? 0;
      }
    }
    if ((p.adjustmentStatus ?? 'none') === 'paid' && p.confirmedPriceXaf != null) {
      collected += Math.max(0, p.confirmedPriceXaf - (p.priceXaf ?? 0));
    }
    // Cap at invoiced to prevent double-counting when priceXaf = null
    return Math.min(collected, parcelInvoiced(p));
  }

  // ── Exchange rate map: campaignId → { rate: number; currency: string } ──────
  const campaignRateMap: Record<string, { rate: number; currency: string }> = {};
  for (const c of yearCampaigns) {
    campaignRateMap[c.id] = {
      rate:     (c as any).exchangeRateToCAD ?? 1,
      currency: (c.route as any).currency ?? 'CAD',
    };
  }
  function toCAD(amount: number, campaignId: string): number {
    const { rate, currency } = campaignRateMap[campaignId] ?? { rate: 1, currency: 'CAD' };
    return currency === 'CAD' ? amount : amount * rate;
  }

  // ── Per-parcel aggregation ─────────────────────────────────────────────────
  let totalInvoiced  = 0;
  let totalCollected = 0;
  const clientRevMap: Record<string, { name: string; amount: number; count: number }> = {};
  const monthlyRevMap:      number[] = new Array(12).fill(0);
  const monthlyInvoicedMap: number[] = new Array(12).fill(0);

  for (const p of parcels) {
    const invoicedNative  = parcelInvoiced(p);
    const collectedNative = parcelCollected(p);
    const invoiced  = toCAD(invoicedNative,  p.campaignId);
    const collected = toCAD(collectedNative, p.campaignId);

    totalInvoiced  += invoiced;
    totalCollected += collected;

    // Monthly invoiced (by campaign departure month)
    const camp = yearCampaigns.find(c => c.id === p.campaignId);
    const dCamp = camp?.departureDate ? new Date(camp.departureDate) : null;
    if (dCamp && dCamp.getFullYear() === year) {
      monthlyInvoicedMap[dCamp.getMonth()] += invoiced;
    }

    // Top clients
    const cid = p.client.id;
    if (!clientRevMap[cid]) clientRevMap[cid] = { name: p.client.name, amount: 0, count: 0 };
    clientRevMap[cid].amount += collected;
    if (p.payment) clientRevMap[cid].count++;
  }

  // Monthly collected — from allocations (transaction dates)
  // Allocations are always in CAD (they come from transactions which are CAD-denominated)
  for (const a of allocationsWithDates) {
    const d = new Date(a.createdAt);
    if (d.getFullYear() === year) monthlyRevMap[d.getMonth()] += Number(a.amount);
  }
  // Legacy completed payments without allocations — use paidAt
  for (const p of parcels) {
    if (p.payment?.status === 'completed' && !paymentsWithAllocations.has(p.payment.id)) {
      const d = new Date(p.payment.paidAt ?? p.payment.createdAt);
      if (d.getFullYear() === year) monthlyRevMap[d.getMonth()] += toCAD(p.payment.amount, p.campaignId);
    }
    // Only add supplement to monthly when priceXaf is set — otherwise the full
    // confirmedPriceXaf is already counted in the base payment above.
    if (((p as any).adjustmentStatus ?? 'none') === 'paid' && (p as any).confirmedPriceXaf != null && p.priceXaf != null) {
      const supp = Math.max(0, (p as any).confirmedPriceXaf - p.priceXaf);
      if (supp > 0) {
        const camp = yearCampaigns.find(c => c.id === p.campaignId);
        const d    = camp?.departureDate ? new Date(camp.departureDate) : new Date();
        if (d.getFullYear() === year) monthlyRevMap[d.getMonth()] += toCAD(supp, p.campaignId);
      }
    }
  }

  // ── Payment method breakdown ───────────────────────────────────────────────
  const methodTotals: Record<string, number> = {};
  for (const a of allocationsWithDates) {
    const m = a.method || 'interac';
    methodTotals[m] = (methodTotals[m] ?? 0) + Number(a.amount);
  }
  // Legacy completed payments: interacRef → interac, else virement
  for (const p of parcels) {
    if (p.payment?.status === 'completed' && !paymentsWithAllocations.has(p.payment.id)) {
      const m = p.payment.interacRef ? 'interac' : 'virement';
      methodTotals[m] = (methodTotals[m] ?? 0) + p.payment.amount;
    }
  }
  const totalMethodAmt = Object.values(methodTotals).reduce((a, b) => a + b, 0);
  const paymentMethods = Object.entries(methodTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([method, amount]) => ({
      method,
      label:  METHOD_LABELS[method] || method,
      amount,
      pct:    totalMethodAmt > 0 ? Math.round(amount / totalMethodAmt * 100) : 0,
    }));

  // ── Per-route stats ────────────────────────────────────────────────────────
  interface RouteStat {
    label: string; fromIATA: string; toIATA: string;
    collected: number; invoiced: number; parcels: number; weightKg: number;
    currency: string; collectedNative: number; invoicedNative: number;
  }
  const routeRevMap: Record<string, RouteStat> = {};
  for (const c of yearCampaigns) {
    const rid      = c.routeId;
    const currency = (c.route as any).currency ?? 'CAD';
    if (!routeRevMap[rid]) {
      routeRevMap[rid] = {
        label:    (c.route as any).label || `${(c.route as any).origin} → ${(c.route as any).destination}`,
        fromIATA: (c.route as any).origin,
        toIATA:   (c.route as any).destination,
        currency,
        collected: 0, invoiced: 0, parcels: 0, weightKg: 0,
        collectedNative: 0, invoicedNative: 0,
      };
    }
    for (const p of parcels.filter((p: any) => p.campaignId === c.id)) {
      const invNative  = parcelInvoiced(p);
      const collNative = parcelCollected(p);
      routeRevMap[rid].collectedNative += collNative;
      routeRevMap[rid].invoicedNative  += invNative;
      routeRevMap[rid].collected += toCAD(collNative, c.id);
      routeRevMap[rid].invoiced  += toCAD(invNative,  c.id);
      routeRevMap[rid].parcels   += 1;
      routeRevMap[rid].weightKg  += p.weightKg ?? 0;
    }
  }
  const routeMax  = Math.max(...Object.values(routeRevMap).map(r => r.collected), 1);
  const routeStats = Object.values(routeRevMap)
    .sort((a, b) => b.collected - a.collected)
    .map(r => ({
      ...r,
      meter:    Math.round(r.collected / routeMax * 100),
      weightKg: Math.round(r.weightKg * 10) / 10,
      collectedNative: Math.round(r.collectedNative),
      invoicedNative:  Math.round(r.invoicedNative),
    }));

  // ── Restant à encaisser — ALL-TIME (same scope as Dashboard + Payments) ──
  // Derived from all pending/partial payments, not filtered by year.
  const unpaidRows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT py.id, py.amount, py.status,
            p."trackingCode", u.name AS "clientName",
            p."confirmedPriceXaf", p."adjustmentStatus",
            p."campaignId",
            COALESCE(r.currency, 'CAD') AS "routeCurrency",
            COALESCE(c."exchangeRateToCAD", 1)::float AS "exchangeRateToCAD"
     FROM payments py
     JOIN parcels p ON p.id = py."parcelId"
     JOIN users u ON u.id = py."clientId"
     JOIN campaigns c ON c.id = p."campaignId"
     JOIN routes r ON r.id = c."routeId"
     WHERE py.status IN ('pending','partial')
       AND p."deletedAt" IS NULL
       AND p.status != 'ann'
     ORDER BY py."createdAt" ASC`
  ).catch(() => [] as any[]);

  const unpaidPaymentIds = unpaidRows.map((r: any) => r.id) as string[];
  let unpaidAllocMap: Record<string, number> = {};
  if (unpaidPaymentIds.length > 0) {
    const allocRows = await prisma.$queryRawUnsafe<{ paymentId: string; allocated: number }[]>(
      `SELECT ta."paymentId", COALESCE(SUM(ta.amount), 0)::int AS allocated
       FROM transaction_allocations ta
       WHERE ta."paymentId" = ANY($1::text[])
       GROUP BY ta."paymentId"`,
      unpaidPaymentIds
    ).catch(() => [] as any[]);
    for (const r of allocRows) unpaidAllocMap[r.paymentId] = Number(r.allocated);
  }

  const unpaidItems: { id: string; clientName: string; trackingCode: string; amount: number; amountNative: number; currency: string; status: string }[] = [];
  for (const inv of unpaidRows) {
    const adj  = inv.adjustmentStatus ?? 'none';
    const conf = inv.confirmedPriceXaf != null ? Number(inv.confirmedPriceXaf) : null;
    const invoicedAmt = (adj === 'paid' || adj === 'discount') && conf != null ? conf : Number(inv.amount);
    const allocated   = unpaidAllocMap[inv.id] ?? 0;
    const remainingNative = Math.max(0, invoicedAmt - allocated);
    if (remainingNative > 0) {
      const rc   = inv.routeCurrency ?? 'CAD';
      const rate = Number(inv.exchangeRateToCAD ?? 1);
      const remainingCAD = rc === 'CAD' ? remainingNative : remainingNative * rate;
      unpaidItems.push({ id: inv.id, clientName: inv.clientName, trackingCode: inv.trackingCode, amount: remainingCAD, amountNative: remainingNative, currency: rc, status: inv.status });
    }
  }

  // ── KPIs de base ──────────────────────────────────────────────────────────
  const totalWeight    = parcels.reduce((s: number, p: any) => s + (p.weightKg ?? 0), 0);
  const totalParcels   = parcels.length;
  const totalCampaigns = yearCampaigns.length;
  const totalCosts     = costs.reduce((s: number, c: any) => s + toCAD(c.fret + c.manutention + c.douane + c.entrepot + c.transport + c.divers, c.campaignId), 0);
  const grossMargin    = totalCollected - totalCosts;
  const recoveryRate   = totalInvoiced > 0 ? Math.round(totalCollected / totalInvoiced * 100) : 0;
  const grossMarginPct = totalCollected > 0 ? Math.round(grossMargin / totalCollected * 100) : 0;
  const avgCostPerKg   = totalWeight > 0 ? totalCosts / totalWeight : 0;
  const marginPerParcel = totalParcels > 0 ? Math.round(grossMargin / totalParcels) : 0;
  const unpaidTotal    = unpaidItems.reduce((s, u) => s + u.amount, 0);
  const unpaidCount    = unpaidItems.length;

  // ── KPIs opérationnels ────────────────────────────────────────────────────
  // Délai moyen de paiement (parcel.createdAt → payment.paidAt)
  const paidParcels = parcels.filter((p: any) => p.payment?.status === 'completed' && p.payment?.paidAt);
  const avgPaymentDays = paidParcels.length > 0
    ? Math.round(paidParcels.reduce((sum: number, p: any) =>
        sum + Math.max(0, (new Date(p.payment.paidAt).getTime() - new Date(p.createdAt).getTime()) / 86400000), 0
      ) / paidParcels.length)
    : 0;

  // Délai moyen de transit (campaign.departureDate → arrivalDate pour cargaisons arrivées)
  const deliveredCampaigns = yearCampaigns.filter((c: any) =>
    c.arrivalDate && c.departureDate && ['ard', 'ok'].includes(c.status)
  );
  const avgDeliveryDays = deliveredCampaigns.length > 0
    ? Math.round(deliveredCampaigns.reduce((sum: number, c: any) =>
        sum + Math.max(0, (new Date(c.arrivalDate).getTime() - new Date(c.departureDate).getTime()) / 86400000), 0
      ) / deliveredCampaigns.length)
    : 0;

  // Taux de validation des bordereaux
  const parcelIds = parcels.map((p: any) => p.id) as string[];
  let borderValidated = 0, borderTotal = 0;
  if (parcelIds.length > 0) {
    const allBdx = await prisma.bordereau.findMany({
      where: { parcelId: { in: parcelIds } },
      select: { status: true },
    });
    borderTotal     = allBdx.length;
    borderValidated = allBdx.filter(b => b.status !== 'en_attente').length;
  }
  const borderValRate = borderTotal > 0 ? Math.round(borderValidated / borderTotal * 100) : 100;

  // ── Monthly breakdown ─────────────────────────────────────────────────────
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(year, i, 1);
    return { label: new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(d), year: d.getFullYear(), month: d.getMonth() };
  });
  const monthlyCosts = months.map(m => {
    const campIds = yearCampaigns
      .filter(c => c.departureDate && c.departureDate.getFullYear() === m.year && c.departureDate.getMonth() === m.month)
      .map(c => c.id);
    return costs.filter((c: any) => campIds.includes(c.campaignId))
      .reduce((s: number, c: any) => s + toCAD(c.fret + c.manutention + c.douane + c.entrepot + c.transport + c.divers, c.campaignId), 0);
  });

  // ── Top clients ───────────────────────────────────────────────────────────
  const topClients = Object.values(clientRevMap)
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((c, i, arr) => ({
      name:  c.name,
      value: Math.round(c.amount).toLocaleString('fr') + ' CAD',
      sub:   c.count + ' colis payé' + (c.count > 1 ? 's' : ''),
      meter: arr[0].amount > 0 ? Math.round(c.amount / arr[0].amount * 100) : 0,
      color: (i % 8) + 1,
    }));

  // ── Top destinations ──────────────────────────────────────────────────────
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

  // ── Compagnies aériennes ──────────────────────────────────────────────────
  const legs = await prisma.campaignLeg.findMany({
    where: { campaignId: { in: yearCampaignIds.length > 0 ? yearCampaignIds : ['__none__'] } },
    include: { airline: true },
  });
  const campaignLegWeights: Record<string, number> = {};
  for (const leg of legs) {
    campaignLegWeights[leg.campaignId] = (campaignLegWeights[leg.campaignId] ?? 0) + (leg.weightKg ?? 0);
  }
  const airlineMap: Record<string, { name: string; iata: string | null; weightKg: number; campaigns: Set<string>; fretXaf: number }> = {};
  for (const leg of legs) {
    const aid = leg.airlineId;
    if (!airlineMap[aid]) airlineMap[aid] = { name: leg.airline.name, iata: leg.airline.iata, weightKg: 0, campaigns: new Set(), fretXaf: 0 };
    airlineMap[aid].weightKg += leg.weightKg ?? 0;
    airlineMap[aid].campaigns.add(leg.campaignId);
    const campCost = costs.find((c: any) => c.campaignId === leg.campaignId);
    if (campCost && leg.weightKg) {
      const ratio = leg.weightKg / (campaignLegWeights[leg.campaignId] || 1);
      airlineMap[aid].fretXaf += Math.round(campCost.fret * ratio);
    }
  }
  const airlineStats = Object.values(airlineMap).sort((a, b) => b.weightKg - a.weightKg).map(a => ({
    name: a.name, iata: a.iata,
    weightKg:  Math.round(a.weightKg * 10) / 10,
    campaigns: a.campaigns.size,
    fretXaf:   a.fretXaf,
    fretPerKg: a.weightKg > 0 ? Math.round(a.fretXaf / a.weightKg * 100) / 100 : 0,
    weightPct: 0,
  }));
  const totalAirlineWeight = airlineStats.reduce((s, a) => s + a.weightKg, 0);
  for (const a of airlineStats) a.weightPct = totalAirlineWeight > 0 ? Math.round(a.weightKg / totalAirlineWeight * 100) : 0;

  // ── Top agents ────────────────────────────────────────────────────────────
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

  // ── Activité récente ──────────────────────────────────────────────────────
  const recentTrackingEvents = yearCampaignIds.length === 0 ? [] : await prisma.trackingEvent.findMany({
    where:   { parcel: { campaignId: { in: yearCampaignIds } } },
    include: {
      parcel:    { select: { trackingCode: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 8,
  });
  const recentTx = await prisma.$queryRawUnsafe<any[]>(
    `SELECT t.amount::int AS amount, t."createdAt", t.reference, t.method,
            u.name AS agent_name
     FROM transactions t
     LEFT JOIN users u ON u.id = t."recordedById"
     ORDER BY t."createdAt" DESC
     LIMIT 6`
  ).catch(() => []);

  const recentActivity = [
    ...recentTrackingEvents.map((e: any) => ({
      type:  'tracking',
      label: `${e.parcel.trackingCode} — ${e.status}`,
      sub:   e.createdBy?.name ?? 'Système',
      date:  e.createdAt.toISOString(),
    })),
    ...recentTx.map((t: any) => ({
      type:  'payment',
      label: `Paiement ${Number(t.amount).toLocaleString('fr')} CAD${t.reference ? ' · ' + t.reference : ''}`,
      sub:   t.agent_name ?? 'Système',
      date:  new Date(t.createdAt).toISOString(),
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 12);

  return NextResponse.json({
    kpi: {
      totalCollected, totalInvoiced,
      totalWeight:    Math.round(totalWeight * 10) / 10,
      totalParcels, totalCampaigns, recoveryRate,
      totalCosts, grossMargin, grossMarginPct,
      avgCostPerKg:   Math.round(avgCostPerKg * 100) / 100,
      marginPerParcel,
      unpaidTotal,
      unpaidCount,
    },
    opKpi: {
      avgPaymentDays,
      avgDeliveryDays,
      borderValRate,
      borderTotal,
    },
    months: {
      labels:   months.map(m => m.label),
      invoiced: monthlyInvoicedMap,
      revenue:  monthlyRevMap,
      costs:    monthlyCosts,
    },
    topClients,
    topDestinations,
    topAgents,
    airlineStats,
    routeStats,
    paymentMethods,
    unpaid: unpaidItems.slice(0, 8),
    recentActivity,
  });
}
