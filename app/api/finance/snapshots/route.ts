export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const snapshots = await prisma.fiscalSnapshot.findMany({
    orderBy: { fiscalYear: 'desc' },
    select: { fiscalYear: true, createdAt: true, payload: true },
  });

  return NextResponse.json(snapshots);
}
