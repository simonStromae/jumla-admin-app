export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireDriver } from '@/src/lib/api-auth';

export async function GET(req: NextRequest) {
  const { error, session } = await requireDriver();
  if (error) return error;

  const driverId = (session!.user as any).id as string;
  const status   = req.nextUrl.searchParams.get('status');

  const parcels = await prisma.parcel.findMany({
    where: {
      driverId,
      deletedAt: null,
      ...(status ? { status } : {}),
    },
    include: {
      client:   { select: { name: true, phone: true } },
      campaign: { select: { code: true } },
      payment:  { select: { status: true, amount: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(parcels);
}
