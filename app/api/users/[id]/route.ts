export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requirePermission } from '@/src/lib/api-auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('agents');
  if (error) return error;

  const { name, email, phone, city, role, permissions, status, mustChangePassword } = await req.json();

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(name               !== undefined && { name }),
      ...(email              !== undefined && { email }),
      ...(phone              !== undefined && { phone: phone || null }),
      ...(city               !== undefined && { city: city || null }),
      ...(role               !== undefined && { role: role as any }),
      ...(permissions        !== undefined && { permissions }),
      ...(status             !== undefined && { status } as any),
      ...(mustChangePassword !== undefined && { mustChangePassword } as any),
    } as any,
  });

  return NextResponse.json({ ok: true, id: user.id });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('agents');
  if (error) return error;

  const target = await prisma.user.findUnique({ where: { id: params.id }, select: { role: true } });
  if (!target) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  if (target.role === 'admin') {
    const adminCount = await prisma.user.count({ where: { role: 'admin' } });
    if (adminCount <= 1) {
      return NextResponse.json({ error: 'Impossible de supprimer le dernier administrateur' }, { status: 400 });
    }
  }

  await prisma.$transaction([
    prisma.campaign.updateMany({ where: { createdById: params.id }, data: { createdById: null } }),
    prisma.campaignCost.updateMany({ where: { enteredById: params.id }, data: { enteredById: null } }),
    prisma.trackingEvent.updateMany({ where: { createdById: params.id }, data: { createdById: null } }),
    prisma.message.deleteMany({ where: { OR: [{ senderId: params.id }, { recipientId: params.id }] } }),
    prisma.user.delete({ where: { id: params.id } }),
  ]);

  return NextResponse.json({ ok: true });
}
