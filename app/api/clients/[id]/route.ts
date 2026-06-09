export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const client = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      parcels: {
        orderBy: { createdAt: 'desc' },
        include: {
          campaign: { select: { id: true, code: true, status: true } },
          payment:  { select: { status: true, amount: true } },
        },
      },
    },
  });

  if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });

  return NextResponse.json({
    id:    client.id,
    name:  client.name,
    email: client.email,
    phone: client.phone,
    city:  client.city,
    createdAt: client.createdAt,
    parcels: client.parcels.map(p => ({
      id:           p.id,
      trackingCode: p.trackingCode,
      description:  p.description,
      weightKg:     p.weightKg,
      priceXaf:     p.priceXaf,
      status:       p.status,
      createdAt:    p.createdAt,
      campaign: {
        id:     p.campaign.id,
        code:   p.campaign.code,
        status: p.campaign.status,
      },
      paid:   p.payment?.status === 'completed',
      amount: p.payment?.amount ?? p.priceXaf ?? 0,
    })),
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { name, email, phone, city } = await req.json();

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(name  !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(city  !== undefined && { city:  city  || null }),
    },
  });

  return NextResponse.json({ ok: true, id: user.id });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  await prisma.user.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
