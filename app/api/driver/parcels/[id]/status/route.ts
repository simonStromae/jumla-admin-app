export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireDriver } from '@/src/lib/api-auth';
import { sendPushToUser } from '@/src/lib/push';
import { sendWhatsappNotification, PARCEL_STATUS_LABELS } from '@/src/lib/twilio';
import { sendStatusEmail } from '@/src/lib/email';
import { renderWaTemplate } from '@/src/lib/wa-template';

const ALLOWED = ['liv', 'ok', 'tdl'];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireDriver();
  if (error) return error;

  const driverId = (session!.user as any).id as string;
  const { status, note, photoUrl } = await req.json();

  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: `Statut invalide. Valeurs autorisées : ${ALLOWED.join(', ')}` }, { status: 400 });
  }

  const parcel = await prisma.parcel.findUnique({
    where: { id: params.id },
    select: {
      id: true, driverId: true, clientId: true, trackingCode: true, status: true,
      notifyTarget: true, notifyPhone: true, notifyEmail: true,
      client: { select: { name: true, email: true, phone: true } },
    },
  });

  if (!parcel || parcel.driverId !== driverId) {
    return NextResponse.json({ error: 'Colis introuvable ou non assigné' }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.parcel.update({
      where: { id: params.id },
      data: {
        status,
        ...(status === 'ok' ? {
          deliveredAt:   new Date(),
          deliveryProof: { note: note || null, photoUrl: photoUrl || null, ts: new Date().toISOString(), by: driverId },
        } : {}),
      },
    }),
    prisma.trackingEvent.create({
      data: {
        parcelId:    params.id,
        status,
        note:        note || null,
        createdById: driverId,
      },
    }),
  ]);

  const firstName   = (parcel.client?.name ?? 'Client').split(' ')[0];
  const statusLabel = PARCEL_STATUS_LABELS[status] ?? status;
  const trackCode   = parcel.trackingCode;

  const notifyTarget = (parcel.notifyTarget as string) ?? 'sender';
  const sendToSender    = notifyTarget === 'sender' || notifyTarget === 'both';
  const sendToRecipient = notifyTarget === 'recipient' || notifyTarget === 'both';
  const sendToCustom    = notifyTarget === 'custom';

  const waVars = { first_name: firstName, parcel_code: trackCode, status_label: statusLabel };

  // WhatsApp — sender
  if (sendToSender && parcel.client?.phone) {
    renderWaTemplate('auto_status_parcel', waVars)
      .then(msg => sendWhatsappNotification(parcel.client!.phone!, msg, params.id, 'auto_status_parcel', waVars))
      .catch(() => {});
  }
  // WhatsApp — recipient / custom
  const targetPhone = (sendToRecipient || sendToCustom) ? (parcel.notifyPhone as string | null) : null;
  if (targetPhone) {
    renderWaTemplate('auto_status_parcel', waVars)
      .then(msg => sendWhatsappNotification(targetPhone, msg, params.id, 'auto_status_parcel', waVars))
      .catch(() => {});
  }

  // Email — sender
  if (sendToSender && parcel.client?.email) {
    sendStatusEmail(parcel.client.email, parcel.client.name ?? 'Client', trackCode, status, null, note || null).catch(() => {});
  }
  // Email — recipient / custom
  const targetEmail = (sendToRecipient || sendToCustom) ? (parcel.notifyEmail as string | null) : null;
  if (targetEmail) {
    sendStatusEmail(targetEmail, parcel.client?.name ?? 'Client', trackCode, status, null, note || null).catch(() => {});
  }

  // Push
  if (parcel.clientId) {
    sendPushToUser(parcel.clientId, {
      title: `${statusLabel} — ${trackCode}`,
      body:  note || `Le statut de votre colis ${trackCode} a été mis à jour.`,
      url:   `/client/colis/${params.id}`,
      tag:   `parcel-status-${params.id}`,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
