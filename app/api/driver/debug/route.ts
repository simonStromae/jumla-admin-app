export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireDriver } from '@/src/lib/api-auth';

export async function GET() {
  const { error, session } = await requireDriver();
  if (error) return error;

  const driverId = (session!.user as any).id as string;

  // All parcels assigned to this driver (no status filter)
  const myParcels = await prisma.parcel.findMany({
    where: { driverId, deletedAt: null },
    select: { id: true, trackingCode: true, status: true, driverId: true, delivery: true },
    take: 20,
  });

  // All parcels with any driverId (to see what's in DB)
  const allAssigned = await prisma.parcel.findMany({
    where: { driverId: { not: null }, deletedAt: null },
    select: { id: true, trackingCode: true, status: true, driverId: true },
    take: 20,
  });

  return NextResponse.json({
    sessionDriverId: driverId,
    myParcels,
    allAssignedParcels: allAssigned,
  });
}
