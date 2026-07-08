export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

// Twilio calls this URL with message status updates (delivered, failed, etc.)
// Configure in Twilio console: Messaging > Senders > WhatsApp > Status Callback URL
export async function POST(req: NextRequest) {
  let body: URLSearchParams;
  try {
    const text = await req.text();
    body = new URLSearchParams(text);
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const messageSid    = body.get('MessageSid')    ?? '';
  const messageStatus = body.get('MessageStatus') ?? '';
  const errorCode     = body.get('ErrorCode')     ?? null;
  const errorMessage  = body.get('ErrorMessage')  ?? null;

  if (!messageSid || !messageStatus) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Map Twilio error codes to human-readable French messages
  const errLabel = errorCode ? twilioErrorLabel(errorCode, errorMessage) : null;

  await prisma.whatsappLog.updateMany({
    where: { twilioSid: messageSid },
    data:  {
      status: messageStatus,
      error:  errLabel ?? (errorCode ? `Erreur ${errorCode}: ${errorMessage ?? ''}` : undefined),
    },
  }).catch(() => {});

  // Twilio expects a 200 OK with no body
  return new NextResponse(null, { status: 200 });
}

// GET so you can verify the webhook URL is reachable in a browser
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'Twilio WhatsApp webhook' });
}

function twilioErrorLabel(code: string, raw: string | null): string {
  const map: Record<string, string> = {
    '63016': "Hors fenêtre 24h — le destinataire n'a pas initié de conversation récente. Utilisez un modèle de message approuvé.",
    '63007': "Canal indisponible — le numéro du destinataire n'est pas sur WhatsApp ou est bloqué.",
    '63006': "Le numéro destinataire n'est pas enregistré sur WhatsApp.",
    '63003': "Contenu non autorisé par WhatsApp Business.",
    '21211': "Numéro de téléphone invalide.",
    '21614': "Le numéro n'est pas un numéro mobile valide.",
    '30008': "Message non délivré (raison inconnue de l'opérateur).",
    '30003': "Numéro injoignable — hors service ou mobile éteint.",
    '30004': "Message bloqué par l'opérateur ou le destinataire.",
    '30005': "Numéro inconnu ou hors service.",
    '30006': "Réseau fixe, ne peut pas recevoir de WhatsApp.",
  };
  return map[code] ?? (raw ? `Erreur ${code}: ${raw}` : `Erreur Twilio ${code}`);
}
