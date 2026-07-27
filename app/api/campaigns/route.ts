export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin, requirePermission, mapCampaignStatus } from '@/src/lib/api-auth';

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const archived = req.nextUrl.searchParams.get('archived') === 'true';

  let campaigns: any[];
  try {
    campaigns = await (prisma.campaign.findMany as any)({
      where: archived ? { deletedAt: { not: null } } : { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        route: true,
        costs: true,
        parcels: {
          where: { deletedAt: null },
          include: {
            payment: true,
            bordereaux: { select: { status: true } },
          },
        },
      },
    });
  } catch {
    // Fallback when deletedAt column hasn't been migrated yet
    campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        route: true,
        costs: true,
        parcels: {
          include: {
            payment: true,
            bordereaux: { select: { status: true } },
          },
        },
      },
    });
  }

  const result = campaigns.map(c => {
    const active    = c.parcels.filter(p => p.status !== 'ann');
    const cancelled = c.parcels.filter(p => p.status === 'ann').length;
    const invoiced  = active.reduce((s, p) => {
      const adj  = (p as any).adjustmentStatus;
      const conf = (p as any).confirmedPriceXaf;
      // Include confirmed price only when supplement is fully resolved (no impact on rate for pending supplements)
      const inv = (adj === 'paid' || adj === 'discount') && conf != null
        ? conf
        : (p.payment?.amount ?? p.priceXaf ?? 0);
      return s + inv;
    }, 0);
    const collected = active.reduce((s, p) => {
      const adj  = (p as any).adjustmentStatus;
      const conf = (p as any).confirmedPriceXaf;
      const inv  = (adj === 'paid' || adj === 'discount') && conf != null
        ? conf
        : (p.payment?.amount ?? p.priceXaf ?? 0);
      const payAmt  = p.payment?.status === 'completed' ? p.payment.amount : 0;
      const suppAmt = conf != null ? Math.max(0, conf - (p.priceXaf ?? 0)) : 0;
      const suppPaid = adj === 'paid' ? suppAmt : 0;
      return s + Math.min(payAmt + suppPaid, inv);
    }, 0);
    const weight    = active.reduce((s, p) => s + (p.weightKg ?? 0), 0);
    const unpaid    = active.filter(p => !p.payment || p.payment.status !== 'completed').length;

    const allBordereaux   = active.flatMap(p => (p as any).bordereaux ?? []);
    const totalBordereaux = allBordereaux.length;
    const verifiedBordereaux = allBordereaux.filter((b: any) =>
      b.status === 'verifie' || b.status === 'ecart'
    ).length;

    return {
      id:         c.id,
      code:       c.code,
      route:      c.routeId,
      routeCode:  `${c.route.origin} → ${c.route.destination}`,
      from:       c.route.origin,
      to:         c.route.destination,
      month:      c.departureDate ? new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(c.departureDate) : '—',
      dep:        c.departureDate ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(c.departureDate) : '—',
      arrival:    c.arrivalDate   ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(c.arrivalDate) : '—',
      status:     mapCampaignStatus(c.status),
      parcels:    active.length,
      weight:     Math.round(weight * 10) / 10,
      invoiced,
      collected,
      alerts:     unpaid,
      cancelled,
      totalBordereaux,
      verifiedBordereaux,
      costs:      c.costs ? {
        fret:        c.costs.fret,
        manutention: c.costs.manutention,
        douane:      c.costs.douane,
        entrepot:    (c.costs as any).entrepot ?? 0,
        transport:   c.costs.transport,
        divers:      c.costs.divers,
      } : null,
      capacityKg:    c.capacityKg,
      departureDate: c.departureDate,
      arrivalDate:   c.arrivalDate,
      deletedAt:     (c as any).deletedAt,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { error } = await requirePermission('campaigns');
  if (error) return error;

  const body = await req.json();
  const { code, routeId, departureDate, arrivalDate, capacityKg, status } = body;

  if (!code || !routeId) {
    return NextResponse.json({ error: 'Code et route obligatoires' }, { status: 400 });
  }

  const existing = await prisma.campaign.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json({ error: 'Ce code de cargaison existe déjà' }, { status: 409 });
  }

  const campaign = await prisma.campaign.create({
    data: {
      code,
      routeId,
      departureDate: departureDate ? new Date(departureDate) : null,
      arrivalDate:   arrivalDate   ? new Date(arrivalDate)   : null,
      capacityKg:    capacityKg    ? Number(capacityKg)      : null,
      status:        status ?? 'enr',
    },
    include: { route: true },
  });

  return NextResponse.json({ ok: true, campaign });
}
