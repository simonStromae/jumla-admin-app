export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireDriver } from '@/src/lib/api-auth';

export async function GET(_: NextRequest, { params }: { params: { code: string } }) {
  const { error, session } = await requireDriver();
  if (error) return error;

  const driverId = (session!.user as any).id as string;
  const code     = params.code.toUpperCase();

  const parcel = await prisma.parcel.findFirst({
    where: { trackingCode: code, deletedAt: null },
    include: {
      client:        { select: { name: true, phone: true } },
      campaign:      { select: { code: true } },
      payment:       { select: { status: true, amount: true } },
      driver:        { select: { name: true } },
    },
  });

  if (!parcel) return NextResponse.json({ error: 'Colis introuvable' }, { status: 404 });

  return NextResponse.json({
    ...parcel,
    isMyDelivery: parcel.driverId === driverId,
  });
}
