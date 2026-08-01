export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { sendWhatsappNotification } from '@/src/lib/twilio';
import { renderWaTemplate } from '@/src/lib/wa-template';

// Vercel calls this with CRON_SECRET in Authorization header
function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgoEnd(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: { id: string; trackingCode: string; wave: 'j3' | 'j7'; status: 'sent' | 'skipped' | 'failed'; reason?: string }[] = [];

  // Find cancelled parcels (deletedAt set, not null = client-cancelled parcels)
  // We target j3 (deletedAt between 3 days ago 00:00 and 23:59) and j7 similarly
  const j3Start = daysAgo(3);
  const j3End   = daysAgoEnd(3);
  const j7Start = daysAgo(7);
  const j7End   = daysAgoEnd(7);

  const cancelledParcels = await prisma.$queryRawUnsafe<{
    id: string;
    trackingCode: string;
    deletedAt: Date;
    clientId: string;
    clientName: string;
    clientPhone: string | null;
    routeId: string;
    routeOrigin: string;
    routeDestination: string;
  }[]>(`
    SELECT
      p.id,
      p."trackingCode",
      p."deletedAt",
      u.id AS "clientId",
      u.name AS "clientName",
      u.phone AS "clientPhone",
      r.id AS "routeId",
      r.origin AS "routeOrigin",
      r.destination AS "routeDestination"
    FROM parcels p
    JOIN users u ON u.id = p."clientId"
    JOIN campaigns c ON c.id = p."campaignId"
    JOIN routes r ON r.id = c."routeId"
    WHERE p."deletedAt" IS NOT NULL
      AND u.phone IS NOT NULL
      AND u.status = 'active'
      AND (
        (p."deletedAt" >= $1 AND p."deletedAt" <= $2)
        OR
        (p."deletedAt" >= $3 AND p."deletedAt" <= $4)
      )
  `, j3Start, j3End, j7Start, j7End);

  for (const parcel of cancelledParcels) {
    if (!parcel.clientPhone) continue;

    const isJ3 = parcel.deletedAt >= j3Start && parcel.deletedAt <= j3End;
    const wave: 'j3' | 'j7' = isJ3 ? 'j3' : 'j7';
    const route = `${parcel.routeOrigin} → ${parcel.routeDestination}`;
    const firstName = parcel.clientName.split(' ')[0];

    // Find next available campaign on same route (closest future departure)
    const nextCampaign = await prisma.campaign.findFirst({
      where: {
        routeId:   parcel.routeId,
        deletedAt: null,
        status:    { notIn: ['ok', 'ann'] as any[] },
        OR: [
          { departureDate: { gte: new Date() } },
          { departureDate: null },
        ],
      },
      orderBy: { departureDate: 'asc' },
      select: { departureDate: true },
    });

    if (wave === 'j3' && !nextCampaign) {
      results.push({ id: parcel.id, trackingCode: parcel.trackingCode, wave, status: 'skipped', reason: 'no upcoming campaign' });
      continue;
    }

    const depDate = nextCampaign?.departureDate
      ? new Date(nextCampaign.departureDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'à définir';

    const templateId = wave === 'j3' ? 'auto_reengage_j3' : 'auto_reengage_j7';
    const vars: Record<string, string> = wave === 'j3'
      ? { first_name: firstName, route, departure_date: depDate }
      : { first_name: firstName, route };

    try {
      const body = await renderWaTemplate(templateId, vars);
      await sendWhatsappNotification(parcel.clientPhone, body, parcel.id, templateId, vars);
      results.push({ id: parcel.id, trackingCode: parcel.trackingCode, wave, status: 'sent' });
    } catch (e: any) {
      results.push({ id: parcel.id, trackingCode: parcel.trackingCode, wave, status: 'failed', reason: e?.message });
    }
  }

  const sent   = results.filter(r => r.status === 'sent').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const failed = results.filter(r => r.status === 'failed').length;

  return NextResponse.json({ ok: true, sent, skipped, failed, total: cancelledParcels.length, results });
}
