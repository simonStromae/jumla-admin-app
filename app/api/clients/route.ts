export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  let clients;
  try {
    clients = await prisma.user.findMany({
      where: { role: 'client' },
      orderBy: { createdAt: 'desc' },
      include: {
        parcels: {
          include: {
            campaign: { select: { code: true } },
            payment:  true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  } catch (e: any) {
    console.error('[/api/clients] Prisma error:', e?.message);
    return NextResponse.json({ error: e?.message || 'Erreur base de données' }, { status: 500 });
  }

  const result = clients.map((u, i) => {
    const totalWeight   = u.parcels.reduce((s, p) => s + (p.weightKg ?? 0), 0);
    const totalAmount   = u.parcels.reduce((s, p) => s + (p.priceXaf  ?? 0), 0);
    const lastParcel    = u.parcels[0];
    const campaigns     = new Set(u.parcels.map(p => p.campaignId)).size;

    return {
      id:           u.id,
      name:         u.name,
      email:        u.email,
      code:         'CL-' + String(i + 1).padStart(4, '0'),
      phone:        u.phone ?? '—',
      city:         u.city  ?? '—',
      campaigns,
      weight:       Math.round(totalWeight * 10) / 10,
      amount:       totalAmount,
      parcelsCount: u.parcels.length,
      lastCampaign: lastParcel?.campaign.code ?? '—',
      lastStatus:   lastParcel?.status ?? '—',
      loyal:        campaigns >= 3,
      color:        (i % 8) + 1,
      createdAt:    u.createdAt,
    };
  });

  return NextResponse.json(result);
}
