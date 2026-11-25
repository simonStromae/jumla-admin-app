export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

// In-memory rate limiter: 20 req/min per IP
const rl = new Map<string, { n: number; reset: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rl.get(ip);
  if (!entry || now > entry.reset) {
    rl.set(ip, { n: 1, reset: now + 60_000 });
    return true;
  }
  if (entry.n >= 20) return false;
  entry.n++;
  return true;
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Trop de requêtes. Réessayez dans une minute.' }, { status: 429 });
  }

  const code = new URL(req.url).searchParams.get('code')?.trim().toUpperCase();
  if (!code) return NextResponse.json({ error: 'Code requis' }, { status: 400 });

  const parcel = await prisma.parcel.findFirst({
    where: { trackingCode: code },
    include: {
      campaign: { include: { route: true } },
      payment:  { select: { status: true, paidAt: true } },
      trackingEvents: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!parcel) return NextResponse.json({ error: 'Colis introuvable' }, { status: 404 });

  return NextResponse.json({
    trackingCode:  parcel.trackingCode,
    description:   parcel.description,
    weightKg:      parcel.weightKg,
    status:        parcel.status,
    createdAt:     parcel.createdAt,
    campaign: {
      code:          parcel.campaign.code,
      from:          parcel.campaign.route.origin,
      to:            parcel.campaign.route.destination,
      departureDate: parcel.campaign.departureDate,
      arrivalDate:   parcel.campaign.arrivalDate,
      status:        parcel.campaign.status,
    },
    paid: parcel.payment?.status === 'paid',
    tracking: parcel.trackingEvents.map(e => ({
      status:    e.status,
      location:  e.location,
      note:      e.note,
      createdAt: e.createdAt,
    })),
  });
}
