export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';
import { getTwilioSettings } from '@/src/lib/twilio';

const ERROR_LABELS: Record<string, string> = {
  '63016': "Hors fenêtre 24h — modèle de message requis.",
  '63007': "Numéro non disponible sur WhatsApp.",
  '63006': "Numéro non enregistré sur WhatsApp.",
  '21211': "Numéro invalide.",
  '30003': "Numéro injoignable.",
  '30004': "Message bloqué.",
  '30005': "Numéro inconnu.",
};

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { accountSid, authToken } = await getTwilioSettings();
  if (!accountSid || !authToken) {
    return NextResponse.json({ error: 'API Twilio non configurée' }, { status: 503 });
  }

  // Find all queued/accepted logs that have a twilioSid
  const logs = await prisma.whatsappLog.findMany({
    where: {
      status:    { in: ['queued', 'accepted', 'sending'] },
      twilioSid: { not: null },
    },
    select: { id: true, twilioSid: true },
    take: 50,
  });

  if (!logs.length) {
    return NextResponse.json({ ok: true, updated: 0, message: 'Aucun message en attente' });
  }

  const basic = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  let updated = 0;

  await Promise.all(logs.map(async (log) => {
    try {
      const res  = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages/${log.twilioSid}.json`,
        { headers: { Authorization: basic } },
      );
      if (!res.ok) return;
      const data = await res.json() as any;

      const newStatus  = data.status as string;
      const errorCode  = data.error_code  ? String(data.error_code)  : null;
      const errorMsg   = data.error_message ?? null;
      const errorLabel = errorCode
        ? (ERROR_LABELS[errorCode] ?? `Erreur ${errorCode}: ${errorMsg ?? ''}`)
        : null;

      await prisma.whatsappLog.update({
        where: { id: log.id },
        data:  { status: newStatus, error: errorLabel ?? undefined },
      });
      updated++;
    } catch {}
  }));

  return NextResponse.json({ ok: true, updated, total: logs.length });
}
