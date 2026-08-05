export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const activeCampaignStatuses = ['enr', 'rec', 'pre', 'exp', 'tra', 'apd', 'dou', 'lib', 'ard', 'pdl'];

  const [
    pendingPickup,
    toProcess,
    activeCampaigns,
    recentEvents,
  ] = await Promise.all([
    // Parcels ready for client pickup (pdl status)
    prisma.parcel.findMany({
      where: {
        status: 'pdl',
        deletedAt: null,
        campaign: { status: { in: activeCampaignStatuses } },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
      include: {
        client:   { select: { name: true, phone: true } },
        campaign: { include: { route: true } },
        payment:  { select: { status: true, amount: true } },
      },
    }),
    // Parcels received at warehouse, not yet processed (rec status)
    prisma.parcel.count({
      where: {
        status: { in: ['rec', 'ard'] },
        deletedAt: null,
        campaign: { status: { in: activeCampaignStatuses } },
      },
    }),
    // Active campaigns summary
    prisma.campaign.findMany({
      where: { status: { in: activeCampaignStatuses } },
      orderBy: { departureDate: 'desc' },
      take: 10,
      include: {
        route: true,
        _count: { select: { parcels: { where: { deletedAt: null, status: { not: 'ann' } } } } },
      },
    }),
    // Tracking events created today
    prisma.trackingEvent.findMany({
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        parcel: {
          select: {
            trackingCode: true,
            client: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const deliveredToday = recentEvents.filter(e => e.status === 'ok').length;
  const receivedToday  = recentEvents.filter(e => ['rec', 'ard'].includes(e.status)).length;

  return NextResponse.json({
    counts: {
      pendingPickup: pendingPickup.length,
      toProcess,
      deliveredToday,
      receivedToday,
    },
    pendingPickupList: pendingPickup.map(p => ({
      id:           p.id,
      trackingCode: p.trackingCode,
      description:  p.description,
      weightKg:     p.weightKg,
      status:       p.status,
      recipName:    p.recipName,
      recipPhone:   p.recipPhone,
      recipCity:    p.recipCity,
      createdAt:    p.createdAt,
      client: { name: p.client.name, phone: p.client.phone },
      campaign: {
        code: p.campaign.code,
        from: p.campaign.route.origin,
        to:   p.campaign.route.destination,
      },
      payment: p.payment ? { status: p.payment.status, amount: p.payment.amount } : null,
    })),
    activeCampaigns: activeCampaigns.map(c => ({
      id:            c.id,
      code:          c.code,
      status:        c.status,
      from:          c.route.origin,
      to:            c.route.destination,
      departureDate: c.departureDate,
      arrivalDate:   c.arrivalDate,
      parcelCount:   c._count.parcels,
    })),
    recentActivity: recentEvents.slice(0, 10).map(e => ({
      status:      e.status,
      note:        e.note,
      createdAt:   e.createdAt,
      parcelCode:  e.parcel?.trackingCode,
      clientName:  e.parcel?.client?.name,
    })),
  });
}
