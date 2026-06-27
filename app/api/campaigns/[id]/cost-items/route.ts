export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requirePermission } from '@/src/lib/api-auth';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('campaigns');
  if (error) return error;

  const items = await prisma.campaignCostItem.findMany({
    where: { campaignId: params.id },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('campaigns');
  if (error) return error;

  const { label, amountXaf } = await req.json();
  if (!label?.trim()) return NextResponse.json({ error: 'Libellé requis' }, { status: 400 });

  const item = await prisma.campaignCostItem.create({
    data: { campaignId: params.id, label: label.trim(), amountXaf: Number(amountXaf) || 0 },
  });

  return NextResponse.json({ ok: true, item });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('campaigns');
  if (error) return error;

  const { itemId, label, amountXaf } = await req.json();
  if (!itemId) return NextResponse.json({ error: 'itemId requis' }, { status: 400 });

  const item = await prisma.campaignCostItem.update({
    where: { id: itemId },
    data: { label: label?.trim() || undefined, amountXaf: amountXaf !== undefined ? Number(amountXaf) : undefined },
  });

  return NextResponse.json({ ok: true, item });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('campaigns');
  if (error) return error;

  const { itemId } = await req.json();
  await prisma.campaignCostItem.delete({ where: { id: itemId } });
  return NextResponse.json({ ok: true });
}
