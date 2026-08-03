export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';
import { sendWhatsappNotification } from '@/src/lib/twilio';
import { renderWaTemplate } from '@/src/lib/wa-template';

// Finds clients who previously shipped on the same route as this campaign (not mass broadcast)
async function getPastRouteClients(campaignId: string, routeId: string) {
  // Distinct clients with at least one non-cancelled parcel on the same route,
  // excluding clients who already have a parcel in THIS campaign.
  const rows = await prisma.$queryRawUnsafe<{ id: string; name: string; phone: string }[]>(
    `
    SELECT DISTINCT u.id, u.name, u.phone
    FROM users u
    JOIN parcels p ON p."clientId" = u.id
    JOIN campaigns c ON c.id = p."campaignId"
    WHERE c."routeId" = $1
      AND p."deletedAt" IS NULL
      AND p.status != 'ann'
      AND u.phone IS NOT NULL
      AND u.status = 'active'
      AND u.id NOT IN (
        SELECT DISTINCT p2."clientId"
        FROM parcels p2
        WHERE p2."campaignId" = $2 AND p2."deletedAt" IS NULL
      )
    `,
    routeId,
    campaignId,
  );
  return rows;
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
    include: { route: true },
  });
  if (!campaign) return NextResponse.json({ error: 'Cargaison introuvable' }, { status: 404 });

  const clients = await getPastRouteClients(params.id, campaign.routeId);
  return NextResponse.json({ total: clients.length, route: `${campaign.route.origin} → ${campaign.route.destination}` });
}

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
    include: { route: true },
  });
  if (!campaign) return NextResponse.json({ error: 'Cargaison introuvable' }, { status: 404 });

  const clients = await getPastRouteClients(params.id, campaign.routeId);

  if (!clients.length) {
    return NextResponse.json({ ok: true, sent: 0, failed: 0, total: 0 });
  }

  const route = `${campaign.route.origin} → ${campaign.route.destination}`;
  const depDate = campaign.departureDate
    ? new Date(campaign.departureDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'à définir';

  const results: { status: 'sent' | 'failed' }[] = [];

  for (const client of clients) {
    const firstName = client.name.split(' ')[0];
    const body = await renderWaTemplate('auto_new_campaign_route', {
      first_name:     firstName,
      route,
      departure_date: depDate,
    });
    try {
      await sendWhatsappNotification(client.phone, body, null, 'auto_new_campaign_route', {
        first_name: firstName, route, departure_date: depDate,
      });
      results.push({ status: 'sent' });
    } catch {
      results.push({ status: 'failed' });
    }
  }

  const sent   = results.filter(r => r.status === 'sent').length;
  const failed = results.filter(r => r.status === 'failed').length;
  return NextResponse.json({ ok: true, sent, failed, total: clients.length });
}
