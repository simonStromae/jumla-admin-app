export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/api-auth';

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;
  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, city: true, country: true, addresses: true },
  });
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;
  const userId = (session.user as any).id;
  const { name, phone, city, addresses } = await req.json();
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name      !== undefined && { name: name?.trim() }),
      ...(phone     !== undefined && { phone: phone?.trim() || null }),
      ...(city      !== undefined && { city: city?.trim() || null }),
      ...(addresses !== undefined && { addresses }),
    },
    select: { id: true, name: true, email: true, phone: true, city: true, addresses: true },
  });
  return NextResponse.json(user);
}
