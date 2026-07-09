export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const status     = searchParams.get('status');     // filter by parcel status
  const campaignId = searchParams.get('campaign');   // filter by campaign
  const search     = searchParams.get('q');          // search by code or client name

  // Active campaigns only (exclude closed)
  const activeCampaignStatuses = ['enr', 'rec', 'pre', 'exp', 'tra', 'apd', 'dou', 'lib', 'ard', 'pdl'];

  const parcels = await prisma.parcel.findMany({
    where: {
      deletedAt: null,
      campaign: { status: { in: activeCampaignStatuses } },
      ...(campaignId ? { campaignId }          : {}),
      ...(status     ? { status }              : {}),
      ...(search     ? {
        OR: [
          { trackingCode: { contains: search, mode: 'insensitive' } },
          { client: { name: { contains: search, mode: 'insensitive' } } },
          { recipName:  { contains: search, mode: 'insensitive' } },
          { recipPhone: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      client:   { select: { id: true, name: true, phone: true } },
      campaign: { include: { route: true } },
      payment:  { select: { status: true, amount: true } },
      trackingEvents: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  return NextResponse.json(parcels.map(p => ({
    id:           p.id,
    trackingCode: p.trackingCode,
    description:  p.description,
    weightKg:     p.weightKg,
    priceXaf:     p.priceXaf,
    status:       p.status,
    confirmed:    p.confirmed,
    notes:        p.notes,
    delivery:     p.delivery ?? 'pickup',
    recipName:    p.recipName,
    recipPhone:   p.recipPhone,
    recipCity:    p.recipCity,
    createdAt:    p.createdAt,
    client: {
      id:    p.client.id,
      name:  p.client.name,
      phone: p.client.phone,
    },
    campaign: {
      id:       p.campaign.id,
      code:     p.campaign.code,
      status:   p.campaign.status,
      from:     p.campaign.route.origin,
      to:       p.campaign.route.destination,
      arrivalDate: p.campaign.arrivalDate,
    },
    payment: p.payment ? {
      status: p.payment.status,
      amount: p.payment.amount,
    } : null,
    lastStatus: p.trackingEvents[0]?.status ?? null,
    lastNote:   p.trackingEvents[0]?.note   ?? null,
    lastAt:     p.trackingEvents[0]?.createdAt ?? null,
  })));
}
