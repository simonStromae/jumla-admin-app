import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const [payments, trackingEvents, campaigns, parcels] = await Promise.all([
    prisma.payment.findMany({
      take: 20, orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { name: true } },
        parcel:  { select: { trackingCode: true } },
      },
    }),
    prisma.trackingEvent.findMany({
      take: 20, orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { name: true } },
        parcel:    { select: { trackingCode: true } },
      },
    }),
    prisma.campaign.findMany({
      take: 10, orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { name: true } } },
    }),
    prisma.parcel.findMany({
      take: 15, orderBy: { createdAt: 'desc' },
      include: {
        client:   { select: { name: true } },
        campaign: { select: { code: true } },
      },
    }),
  ]);

  const logs = [
    ...payments.map(p => ({
      id:     'pay-' + p.id,
      ts:     p.createdAt,
      user:   p.client?.name ?? 'Système',
      action: p.status === 'completed' ? 'Paiement validé' : p.status === 'pending' ? 'Paiement en attente' : 'Paiement remboursé',
      obj:    `${p.parcel?.trackingCode ?? '—'} · ${Number(p.amount).toLocaleString('fr')} CAD`,
      kind:   p.status === 'completed' ? 'ok' : p.status === 'pending' ? 'warn' : 'neutral',
      cat:    'payment',
    })),
    ...trackingEvents.map(e => ({
      id:     'track-' + e.id,
      ts:     e.createdAt,
      user:   e.createdBy?.name ?? 'Système',
      action: 'Statut modifié',
      obj:    `${e.parcel?.trackingCode ?? '—'} → ${e.status}${e.location ? ' · ' + e.location : ''}`,
      kind:   'info',
      cat:    'parcel',
    })),
    ...campaigns.map(c => ({
      id:     'camp-' + c.id,
      ts:     c.createdAt,
      user:   c.createdBy?.name ?? 'Système',
      action: 'Cargaison créée',
      obj:    c.code,
      kind:   'ok',
      cat:    'campaign',
    })),
    ...parcels.map(p => ({
      id:     'parcel-' + p.id,
      ts:     p.createdAt,
      user:   p.client?.name ?? '—',
      action: 'Colis créé',
      obj:    `${p.trackingCode} · ${p.campaign?.code ?? '—'}`,
      kind:   'info',
      cat:    'parcel',
    })),
  ]
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .slice(0, 50);

  return NextResponse.json(logs);
}
