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
  const { name, phone, city, address, notes } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Le nom est obligatoire' }, { status: 400 });
  }

  const updated = await prisma.partnerContact.update({
    where: { id: params.id },
    data: {
      name: name.trim(),
      phone: phone?.trim() || null,
      city: city?.trim() || null,
      address: address?.trim() || null,
      notes: notes?.trim() || null,
    },
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
