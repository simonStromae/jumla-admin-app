export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
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

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { name, email, phone, city, notes } = await req.json();
  if (!name || !email) {
    return NextResponse.json({ error: 'Nom et email requis' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Email déjà utilisé' }, { status: 409 });
  }

  // Generate a temporary password — client will reset via forgot-password
  const tempHash = await bcrypt.hash(Math.random().toString(36).slice(2, 10), 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone:         phone || null,
      city:          city  || null,
      passwordHash:  tempHash,
      role:          'client',
      emailVerified: true,
    },
  });

  return NextResponse.json({ ok: true, id: user.id });
}
