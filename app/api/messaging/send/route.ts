export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requirePermission } from '@/src/lib/api-auth';
import { getTwilioSettings, twilioSendWhatsapp, twilioSendWhatsappTemplate, formatWhatsappNumber } from '@/src/lib/twilio';
import { TWILIO_TEMPLATES, buildContentVariables } from '@/src/lib/wa-template';

export async function POST(req: NextRequest) {
  const { error } = await requirePermission('whatsapp');
  if (error) return error;

  const { parcelIds, body, templateId } = await req.json() as {
    parcelIds:  string[];
    body:       string;
    templateId?: string;
  };
  if (!parcelIds?.length || !body) {
    return NextResponse.json({ error: 'parcelIds et body sont requis' }, { status: 400 });
  }

  const { accountSid, authToken, fromNumber } = await getTwilioSettings();
  if (!accountSid || !authToken || !fromNumber) {
    return NextResponse.json({ error: 'API Twilio non configurée' }, { status: 503 });
  }

  // Look up template ContentSid if a templateId was provided
  let contentSid: string | null = null;
  if (templateId && TWILIO_TEMPLATES[templateId]) {
    const row = await prisma.setting.findUnique({
      where: { key: TWILIO_TEMPLATES[templateId].settingKey },
    });
    contentSid = row?.value ?? null;
  }

  const parcels = await prisma.parcel.findMany({
    where:   { id: { in: parcelIds } },
    include: {
      client:   { select: { name: true, phone: true } },
      campaign: { select: { code: true, arrivalDate: true, route: { select: { destination: true, fees: true } } } },
      payment:  { select: { status: true, amount: true } },
    },
  });

  const results: { parcelId: string; status: string; error?: string; mode?: string }[] = [];

  for (const p of parcels) {
    const phone = p.client.phone;
    if (!phone) {
      results.push({ parcelId: p.id, status: 'failed', error: 'Numéro manquant' });
      continue;
    }

    const firstName = p.client.name.split(' ')[0];
    const amount    = (p.payment?.amount ?? p.priceXaf ?? 0).toLocaleString('fr');
    const weight    = String(p.weightKg ?? '—');
    const arrDate   = p.campaign.arrivalDate
      ? new Date(p.campaign.arrivalDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
      : 'à définir';

    // Route-specific overrides from fees.arrival; fall back to hardcoded Montreal defaults
    const routeFees = (p.campaign as any).route?.fees as any;
    const warehouseAddress = routeFees?.arrival?.address ?? '5500 Pl. de la Savane, Lachine';
    const agentPhone       = routeFees?.arrival?.phone   ?? '+1 514 998 0709';
    const destCode         = (p.campaign as any).route?.destination ?? 'MTL';
    const CITY_MAP: Record<string, string> = {
      MTL: 'Montréal', YUL: 'Montréal', DLA: 'Douala', BRU: 'Bruxelles', LOS: 'Lagos',
    };
    const destinationCity  = routeFees?.arrival?.city ?? CITY_MAP[destCode] ?? destCode;

    const namedVars: Record<string, string> = {
      first_name:        firstName,
      parcel_code:       p.trackingCode,
      amount,
      weight,
      arrival_date:      arrDate,
      destination_city:  destinationCity,
      warehouse_address: warehouseAddress,
      agent_phone:       agentPhone,
    };

    // Render free-form body (always computed, used as fallback or log)
    const finalBody = body
      .replace(/\{first_name\}/g,        firstName)
      .replace(/\{amount\}/g,            amount)
      .replace(/\{weight\}/g,            weight)
      .replace(/\{parcel_code\}/g,       p.trackingCode)
      .replace(/\{arrival_date\}/g,      arrDate)
      .replace(/\{destination_city\}/g,  destinationCity)
      .replace(/\{warehouse_address\}/g, warehouseAddress)
      .replace(/\{agent_phone\}/g,       agentPhone);

    const toPhone = formatWhatsappNumber(phone);

    try {
      let msg: { sid: string; status: string };
      let mode: string;

      if (contentSid && templateId) {
        // Use approved WhatsApp template
        const contentVariables = buildContentVariables(templateId, namedVars) ?? {};
        msg  = await twilioSendWhatsappTemplate(accountSid, authToken, fromNumber, toPhone, contentSid, contentVariables);
        mode = 'template';
      } else {
        // Free-form (works only within 24h session window)
        msg  = await twilioSendWhatsapp(accountSid, authToken, fromNumber, toPhone, finalBody);
        mode = 'freeform';
      }

      await prisma.whatsappLog.create({
        data: { parcelId: p.id, toPhone: phone, body: finalBody, status: msg.status ?? 'queued', twilioSid: msg.sid },
      });
      results.push({ parcelId: p.id, status: msg.status ?? 'queued', mode });
    } catch (e: any) {
      const errMsg = e?.message ?? 'Erreur inconnue';
      await prisma.whatsappLog.create({
        data: { parcelId: p.id, toPhone: phone, body: finalBody, status: 'failed', error: errMsg },
      });
      results.push({ parcelId: p.id, status: 'failed', error: errMsg });
    }
  }

  const sentCount    = results.filter(r => ['sent','queued','accepted'].includes(r.status)).length;
  const failedCount  = results.filter(r => r.status === 'failed').length;
  const templateUsed = results.some(r => r.mode === 'template');
  return NextResponse.json({ ok: true, sentCount, failedCount, templateUsed, results });
}
