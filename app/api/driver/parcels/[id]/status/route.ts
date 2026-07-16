export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireDriver } from '@/src/lib/api-auth';
import { sendPushToUser } from '@/src/lib/push';

const ALLOWED = ['liv', 'ok', 'tdl'];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireDriver();
  if (error) return error;

  const driverId = (session!.user as any).id as string;
  const { status, note } = await req.json();

  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: `Statut invalide. Valeurs autorisées : ${ALLOWED.join(', ')}` }, { status: 400 });
  }

  const parcel = await prisma.parcel.findUnique({
    where: { id: params.id },
    select: { id: true, driverId: true, clientId: true, trackingCode: true, status: true },
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
          deliveryProof: { note: note || null, ts: new Date().toISOString(), by: driverId },
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

  if (parcel.clientId) {
    const labels: Record<string, string> = { liv: 'En livraison', ok: 'Livré', tdl: 'Tentative de livraison échouée' };
    sendPushToUser(parcel.clientId, {
      title: `${labels[status] ?? status} — ${parcel.trackingCode}`,
      body:  note || `Le statut de votre colis ${parcel.trackingCode} a été mis à jour.`,
      url:   `/client/colis/${params.id}`,
      tag:   `parcel-status-${params.id}`,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
