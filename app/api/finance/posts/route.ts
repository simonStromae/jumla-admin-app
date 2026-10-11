export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const posts = await prisma.costPost.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  });
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { name, type } = await req.json() as { name: string; type: string };
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 });
  if (!['variable', 'fixed'].includes(type)) return NextResponse.json({ error: 'type must be variable or fixed' }, { status: 400 });

  const max = await prisma.costPost.aggregate({ _max: { id: true } });
  const nextId = (max._max.id ?? 174) + 1;

  const post = await prisma.costPost.create({
    data: { id: nextId, name: name.trim(), type, historicalAmt: 0, sortOrder: nextId, customAdded: true },
  });
  return NextResponse.json(post, { status: 201 });
}
