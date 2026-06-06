export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin, mapCampaignStatus } from '@/src/lib/api-auth';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      route: true,
      costs: true,
      parcels: {
        include: { payment: true },
      },
    },
  });

  const result = campaigns.map(c => {
    const invoiced  = c.parcels.reduce((s, p) => s + (p.priceXaf ?? 0), 0);
    const collected = c.parcels.reduce((s, p) =>
      s + (p.payment?.status === 'completed' ? p.payment.amount : 0), 0);
    const weight    = c.parcels.reduce((s, p) => s + (p.weightKg ?? 0), 0);
    const unpaid    = c.parcels.filter(p => !p.payment || p.payment.status !== 'completed').length;

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
      parcels:    c.parcels.length,
      weight:     Math.round(weight * 10) / 10,
      invoiced,
      collected,
      alerts:     unpaid,
      costs:      c.costs ? {
        fret:        c.costs.fret,
        manutention: c.costs.manutention,
        douane:      c.costs.douane,
        transport:   c.costs.transport,
        divers:      c.costs.divers,
      } : null,
      capacityKg:    c.capacityKg,
      departureDate: c.departureDate,
      arrivalDate:   c.arrivalDate,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
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
      status:        status ?? 'open',
    },
    include: { route: true },
  });

  return NextResponse.json({ ok: true, campaign });
}
