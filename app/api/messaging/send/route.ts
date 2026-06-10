export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';
import { getTwilioClient, getTwilioSettings, formatWhatsappNumber } from '@/src/lib/twilio';

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { parcelIds, body } = await req.json() as { parcelIds: string[], body: string };
  if (!parcelIds?.length || !body) {
    return NextResponse.json({ error: 'parcelIds et body sont requis' }, { status: 400 });
  }

  const { fromNumber } = await getTwilioSettings();
  const client = await getTwilioClient();
  if (!client || !fromNumber) {
    return NextResponse.json({ error: 'API Twilio non configurée' }, { status: 503 });
  }

  const parcels = await prisma.parcel.findMany({
    where:   { id: { in: parcelIds } },
    include: {
      client:   { select: { name: true, phone: true } },
      campaign: { select: { code: true, arrivalDate: true } },
      payment:  { select: { status: true, amount: true } },
    },
  });

  const results: { parcelId: string; status: string; error?: string }[] = [];

  for (const p of parcels) {
    const phone = p.client.phone;
    if (!phone) {
      results.push({ parcelId: p.id, status: 'failed', error: 'Numéro manquant' });
      continue;
    }

    const firstName = p.client.name.split(' ')[0];
    const amount    = (p.payment?.amount ?? p.priceXaf ?? 0).toLocaleString('fr');
    const arrDate   = p.campaign.arrivalDate
      ? new Date(p.campaign.arrivalDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
      : 'à définir';

    const finalBody = body
      .replace(/\{first_name\}/g,        firstName)
      .replace(/\{amount\}/g,            amount)
      .replace(/\{weight\}/g,            String(p.weightKg ?? '—'))
      .replace(/\{parcel_code\}/g,       p.trackingCode)
      .replace(/\{arrival_date\}/g,      arrDate)
      .replace(/\{warehouse_address\}/g, '5500 Pl. de la Savane, Lachine')
      .replace(/\{agent_phone\}/g,       '+1 514 000 0000');

    try {
      const msg = await client.messages.create({
        from: 'whatsapp:' + fromNumber,
        to:   formatWhatsappNumber(phone),
        body: finalBody,
      });

      await prisma.whatsappLog.create({
        data: { parcelId: p.id, toPhone: phone, body: finalBody, status: 'sent', twilioSid: msg.sid },
      });
      results.push({ parcelId: p.id, status: 'sent' });
    } catch (e: any) {
      const errMsg = e?.message ?? 'Erreur inconnue';
      await prisma.whatsappLog.create({
        data: { parcelId: p.id, toPhone: phone, body: finalBody, status: 'failed', error: errMsg },
      });
      results.push({ parcelId: p.id, status: 'failed', error: errMsg });
    }
  }

  const sentCount   = results.filter(r => r.status === 'sent').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  return NextResponse.json({ ok: true, sentCount, failedCount, results });
}
