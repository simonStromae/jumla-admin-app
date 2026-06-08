export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { description, weightKg, nbPieces, status, notes } = body;

  const bordereau = await prisma.bordereau.update({
    where: { id: params.id },
    data: {
      ...(description !== undefined && { description }),
      ...(weightKg    !== undefined && { weightKg: weightKg ? Number(weightKg) : null }),
      ...(nbPieces    !== undefined && { nbPieces: Number(nbPieces) }),
      ...(status      !== undefined && { status }),
      ...(notes       !== undefined && { notes }),
    },
  });
  return NextResponse.json({ ok: true, bordereau });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  await prisma.bordereau.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
