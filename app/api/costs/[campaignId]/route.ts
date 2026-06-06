export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';
import { auth } from '@/auth';

export async function GET(_: NextRequest, { params }: { params: { campaignId: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const costs = await prisma.campaignCost.findUnique({ where: { campaignId: params.campaignId } });
  return NextResponse.json(costs ?? { fret: 0, manutention: 0, douane: 0, transport: 0, divers: 0 });
}

export async function PUT(req: NextRequest, { params }: { params: { campaignId: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const session = await auth();
  const { fret, manutention, douane, transport, divers } = await req.json();

  const costs = await prisma.campaignCost.upsert({
    where:  { campaignId: params.campaignId },
    update: {
      fret:        Number(fret)        || 0,
      manutention: Number(manutention) || 0,
      douane:      Number(douane)      || 0,
      transport:   Number(transport)   || 0,
      divers:      Number(divers)      || 0,
      enteredById: (session?.user as any)?.id ?? null,
    },
    create: {
      campaignId: params.campaignId,
      fret:        Number(fret)        || 0,
      manutention: Number(manutention) || 0,
      douane:      Number(douane)      || 0,
      transport:   Number(transport)   || 0,
      divers:      Number(divers)      || 0,
      enteredById: (session?.user as any)?.id ?? null,
    },
  });

  return NextResponse.json({ ok: true, costs });
}
