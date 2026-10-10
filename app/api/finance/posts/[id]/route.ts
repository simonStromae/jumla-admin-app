export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const id = parseInt(params.id);
  const { name, type } = await req.json() as { name?: string; type?: string };

  const post = await prisma.costPost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const hasCosts = await prisma.cargoVariableCost.count({ where: { postId: id } })
    .then(n => n > 0 || prisma.fixedMonthlyCost.count({ where: { postId: id } }).then(m => m > 0));

  const data: Record<string, unknown> = {};
  if (name && !hasCosts) data.name = name.trim();
  if (name && hasCosts) data.name = name.trim(); // allow rename even if costs recorded
  if (type && ['variable', 'fixed'].includes(type) && !hasCosts) data.type = type;

  const updated = await prisma.costPost.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const id = parseInt(params.id);
  const post = await prisma.costPost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (!post.customAdded) return NextResponse.json({ error: 'built-in posts cannot be deleted' }, { status: 400 });

  const cargoCount = await prisma.cargoVariableCost.count({ where: { postId: id } });
  const fixedCount = await prisma.fixedMonthlyCost.count({ where: { postId: id } });
  if (cargoCount > 0 || fixedCount > 0) {
    return NextResponse.json({ error: 'post has recorded costs and cannot be deleted' }, { status: 400 });
  }

  await prisma.costPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
