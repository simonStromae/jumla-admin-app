export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin, requirePermission } from '@/src/lib/api-auth';
import { createNotification } from '@/src/lib/notifications';
import { sendStatusEmail } from '@/src/lib/email';
import { sendWhatsappNotification, PARCEL_STATUS_LABELS } from '@/src/lib/twilio';
import { renderWaTemplate } from '@/src/lib/wa-template';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const parcel = await prisma.parcel.findUnique({
    where: { id: params.id },
    include: {
      client:   { select: { id: true, name: true, email: true, phone: true, city: true } },
      campaign: { include: { route: true } },
      payment:  true,
      trackingEvents: { orderBy: { createdAt: 'desc' }, include: { createdBy: { select: { name: true } } } },
      bordereaux: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!parcel) return NextResponse.json({ error: 'Colis introuvable' }, { status: 404 });
  return NextResponse.json(parcel);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('parcels');
  if (error) return error;

  const body = await req.json();
  const { status, confirmed, notes, weightKg, priceXaf, eventNote, eventLocation, items, confirmedPriceXaf, adjustmentStatus, marginPct } = body;

  // Fetch parcel with campaign to check lock status
  const existing = await prisma.parcel.findUnique({
    where: { id: params.id },
    select: {
      clientId: true,
      trackingCode: true,
      priceXaf: true,
      campaign: { select: { status: true } },
      client: { select: { name: true, email: true, phone: true } },
    },
  });
  // Content edits (weight, items, price) are locked once the campaign is in transit.
  // Status updates are ALWAYS allowed — individual parcels can have problems at any stage.
  const LOCKED_STATUSES = ['exp', 'tra', 'apd', 'dou', 'lib', 'ard', 'pdl', 'ok'];
  const contentChanged  = weightKg !== undefined || priceXaf !== undefined || items !== undefined || confirmed !== undefined || notes !== undefined;
  if (contentChanged && existing?.campaign && LOCKED_STATUSES.includes(existing.campaign.status as string)) {
    return NextResponse.json({ error: 'Colis verrouillé — le contenu ne peut plus être modifié (cargaison en transit).' }, { status: 403 });
  }

  // Auto-set adjustmentStatus when confirmedPriceXaf is set
  let finalAdjustmentStatus = adjustmentStatus;
  let paymentAmountUpdate: number | undefined;
  if (confirmedPriceXaf !== undefined && adjustmentStatus === undefined) {
    const diff = Number(confirmedPriceXaf) - (existing?.priceXaf ?? 0);
    if (diff > 0) {
      finalAdjustmentStatus = 'pending';
    } else {
      // Remise ou prix identique — on met à jour le montant du payment
      finalAdjustmentStatus = 'discount';
      paymentAmountUpdate = Math.round(Number(confirmedPriceXaf));
    }
  }

  const parcel = await prisma.parcel.update({
    where: { id: params.id },
    data: {
      ...(status               && { status: status as any }),
      ...(confirmed !== undefined && { confirmed }),
      ...(notes     !== undefined && { notes }),
      ...(weightKg  !== undefined && { weightKg:  Number(weightKg) }),
      ...(priceXaf  !== undefined && { priceXaf:  Number(priceXaf) }),
      ...(items     !== undefined && { items } as any),
      ...(confirmedPriceXaf !== undefined && { confirmedPriceXaf: Number(confirmedPriceXaf) }),
      ...(finalAdjustmentStatus !== undefined && { adjustmentStatus: finalAdjustmentStatus }),
      ...(marginPct !== undefined && { marginPct: Number(marginPct) }),
    },
  });

  // Mettre à jour le montant du paiement si remise appliquée
  if (paymentAmountUpdate !== undefined) {
    await prisma.payment.updateMany({
      where: { parcelId: params.id },
      data: { amount: paymentAmountUpdate },
    }).catch(() => {});
  }

  if (status) {
    const sess = await import('@/auth').then(m => m.auth());
    await prisma.trackingEvent.create({
      data: {
        parcelId:    params.id,
        status:      status as any,
        note:        eventNote     || null,
        location:    eventLocation || null,
        createdById: (sess?.user as any)?.id ?? null,
      },
    });
    if (existing?.client?.email && existing.trackingCode) {
      sendStatusEmail(
        existing.client.email,
        existing.client.name ?? 'Client',
        existing.trackingCode,
        status,
        eventLocation || null,
        eventNote || null,
      ).catch(() => {});
    }
    if (existing?.client?.phone) {
      const firstName   = (existing.client.name ?? 'Client').split(' ')[0];
      const statusLabel = PARCEL_STATUS_LABELS[status] ?? status;
      renderWaTemplate('auto_status_parcel', {
        first_name:   firstName,
        parcel_code:  existing.trackingCode,
        status_label: statusLabel,
      }).then(msg => sendWhatsappNotification(existing!.client!.phone!, msg, params.id)).catch(() => {});
    }
  }

  // Notify client of price adjustment via WhatsApp
  if (confirmedPriceXaf !== undefined && existing?.client?.phone) {
    const estimatedPrice = existing.priceXaf ?? 0;
    const diff = Number(confirmedPriceXaf) - estimatedPrice;
    if (diff > 0) {
      const firstName  = (existing.client.name ?? 'Client').split(' ')[0];
      const trackCode  = existing.trackingCode ?? params.id;
      renderWaTemplate('auto_supplement', {
        first_name:      firstName,
        parcel_code:     trackCode,
        estimated_price: estimatedPrice.toLocaleString('fr'),
        confirmed_price: Number(confirmedPriceXaf).toLocaleString('fr'),
        diff:            diff.toLocaleString('fr'),
      }).then(msg => sendWhatsappNotification(existing!.client!.phone!, msg, params.id)).catch(() => {});
    }
  }

  // Notify client when admin modifies parcel info (not just status)
  const infoChanged = weightKg !== undefined || priceXaf !== undefined || notes !== undefined || items !== undefined || confirmedPriceXaf !== undefined;
  if (infoChanged && existing?.clientId) {
    const code = existing.trackingCode ?? params.id;
    await createNotification(
      existing.clientId,
      'parcel_modified',
      'Colis modifié',
      `Des informations de votre colis ${code} ont été mises à jour. Vérifiez les détails dans votre espace.`,
      params.id,
    ).catch(() => {});
  }

  return NextResponse.json({ ok: true, parcel });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('parcels');
  if (error) return error;

  const parcel = await prisma.parcel.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, trackingCode: true, payment: { select: { status: true } } },
  });

  if (!parcel || (parcel as any).deletedAt) {
    return NextResponse.json({ error: 'Colis introuvable' }, { status: 404 });
  }

  const DELETABLE = ['enr', 'rec'];
  if (!DELETABLE.includes(parcel.status)) {
    return NextResponse.json(
      { error: `Impossible de supprimer un colis au statut "${parcel.status}". Seuls les statuts Enregistré et Reçu sont supprimables.` },
      { status: 403 },
    );
  }

  if (parcel.payment?.status === 'completed') {
    return NextResponse.json(
      { error: 'Ce colis a un paiement complété. Remboursez le client avant de supprimer.' },
      { status: 403 },
    );
  }

  await prisma.$executeRawUnsafe(
    `UPDATE parcels SET "deletedAt" = NOW() WHERE id = $1`,
    params.id,
  );

  return NextResponse.json({ ok: true, trackingCode: parcel.trackingCode });
}
