export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';
import { sendWhatsappNotification } from '@/src/lib/twilio';
import { renderWaTemplate } from '@/src/lib/wa-template';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
    include: { route: true },
  });
  if (!campaign) return NextResponse.json({ error: 'Cargaison introuvable' }, { status: 404 });

  // All active clients with a phone number
  const clients = await prisma.user.findMany({
    where: { role: 'client', status: 'active', phone: { not: null } },
    select: { id: true, name: true, phone: true },
  });

  if (!clients.length) {
    return NextResponse.json({ ok: true, sent: 0, failed: 0, total: 0 });
  }

  const arrDate = campaign.arrivalDate
    ? new Date(campaign.arrivalDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'à définir';
  const depDate = campaign.departureDate
    ? new Date(campaign.departureDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'à définir';

  const isChina =
    campaign.route.origin.toUpperCase().startsWith('CHN') ||
    campaign.route.destination.toUpperCase().startsWith('CHN');
  const templateId = isChina ? 'broadcast_china' : 'broadcast';
  const routeLabel = `${campaign.route.origin} → ${campaign.route.destination}`;

  const results: { clientId: string; name: string; status: 'sent' | 'failed'; error?: string }[] = [];

  for (const client of clients) {
    const firstName = client.name.split(' ')[0];
    const vars = isChina
      ? { first_name: firstName, route: routeLabel, departure_date: depDate, arrival_date: arrDate }
      : { first_name: firstName, arrival_date: depDate };
    const body = await renderWaTemplate(templateId, vars);

    try {
      await sendWhatsappNotification(
        client.phone!,
        body,
        null,
        templateId,
        vars,
      );
      results.push({ clientId: client.id, name: client.name, status: 'sent' });
    } catch (e: any) {
      results.push({ clientId: client.id, name: client.name, status: 'failed', error: e?.message });
    }
  }

  const sent   = results.filter(r => r.status === 'sent').length;
  const failed = results.filter(r => r.status === 'failed').length;

  return NextResponse.json({ ok: true, sent, failed, total: clients.length, results });
}

// GET: returns recipient count preview
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
    select: { id: true, code: true, departureDate: true, arrivalDate: true },
  });
  if (!campaign) return NextResponse.json({ error: 'Cargaison introuvable' }, { status: 404 });

  const total = await prisma.user.count({
    where: { role: 'client', status: 'active', phone: { not: null } },
  });

  return NextResponse.json({ total, campaign });
}
