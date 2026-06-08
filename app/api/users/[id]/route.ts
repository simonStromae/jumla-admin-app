export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { name, email, phone, city, role, permissions } = await req.json();

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(name        !== undefined && { name }),
      ...(email       !== undefined && { email }),
      ...(phone       !== undefined && { phone: phone || null }),
      ...(city        !== undefined && { city: city || null }),
      ...(role        !== undefined && { role: role as any }),
      ...(permissions !== undefined && { permissions }),
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
