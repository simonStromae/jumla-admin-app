export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireDriver } from '@/src/lib/api-auth';

export async function GET() {
  const { error, session } = await requireDriver();
  if (error) return error;

  const driverId = (session!.user as any).id as string;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

  const ACTIVE_STATUSES  = ['ard', 'lib', 'ver', 'pdl', 'liv', 'tdl'];
  const PENDING_STATUSES = ['enr', 'rec', 'pre', 'exp', 'tra', 'apd', 'dou', 'ins', 'ret'];

  const [allAssigned, deliveredToday, recentDeliveries, failedToday] = await Promise.all([
    prisma.parcel.findMany({
      where: { driverId, status: { notIn: ['ok'] }, deletedAt: null },
      include: {
        client:   { select: { name: true, phone: true } },
        campaign: { select: { code: true, status: true } },
        payment:  { select: { status: true, amount: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),

    prisma.parcel.count({
      where: { driverId, status: 'ok', deliveredAt: { gte: today, lt: tomorrow }, deletedAt: null },
    }),

    prisma.parcel.findMany({
      where: { driverId, status: 'ok', deletedAt: null },
      include: { client: { select: { name: true } } },
      orderBy: { deliveredAt: 'desc' },
      take: 5,
    }),

    prisma.trackingEvent.count({
      where: { status: 'tdl', createdById: driverId, createdAt: { gte: today, lt: tomorrow } },
    }),
  ]);

  const active  = allAssigned.filter(p => ACTIVE_STATUSES.includes(p.status));
  const pending = allAssigned.filter(p => PENDING_STATUSES.includes(p.status));

  return NextResponse.json({
    stats: {
      pending:        active.length,
      deliveredToday,
      failedToday,
    },
    active,
    pending,
    recentDeliveries,
  });
}
