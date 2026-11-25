export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/api-auth';

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;
  const userId = (session!.user as any).id;

  const contacts = await prisma.partnerContact.findMany({
    where: { partnerId: userId },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;
  const userId = (session!.user as any).id;

  const body = await req.json();
  const { name, phone, city, address, notes } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Le nom est obligatoire' }, { status: 400 });
  }

  const contact = await prisma.partnerContact.create({
    data: {
      partnerId: userId,
      name: name.trim(),
      phone: phone?.trim() || null,
      city: city?.trim() || null,
      address: address?.trim() || null,
      notes: notes?.trim() || null,
    },
  });

  return NextResponse.json(contact, { status: 201 });
}
