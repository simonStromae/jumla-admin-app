export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const drivers = await prisma.user.findMany({
    where: { role: 'driver' },
    select: { id: true, name: true, email: true, phone: true },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(drivers);
}
