export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/api-auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth();
  if (error) return error;
  const userId = (session!.user as any).id;

  const contact = await prisma.partnerContact.findUnique({ where: { id: params.id } });
  if (!contact || contact.partnerId !== userId) {
    return NextResponse.json({ error: 'Contact introuvable' }, { status: 404 });
  }

  const body = await req.json();
  const { name, phone, city, address, notes, archived } = body;

  if (name !== undefined && !name?.trim()) {
    return NextResponse.json({ error: 'Le nom est obligatoire' }, { status: 400 });
  }

  const updateData: Record<string, any> = {};
  if (name     !== undefined) updateData.name    = name.trim();
  if (phone    !== undefined) updateData.phone   = phone?.trim() || null;
  if (city     !== undefined) updateData.city    = city?.trim() || null;
  if (address  !== undefined) updateData.address = address?.trim() || null;
  if (notes    !== undefined) updateData.notes   = notes?.trim() || null;
  if (archived !== undefined) updateData.archived = Boolean(archived);

  const updated = await prisma.partnerContact.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth();
  if (error) return error;
  const userId = (session!.user as any).id;

  const contact = await prisma.partnerContact.findUnique({ where: { id: params.id } });
  if (!contact || contact.partnerId !== userId) {
    return NextResponse.json({ error: 'Contact introuvable' }, { status: 404 });
  }

  await prisma.partnerContact.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
