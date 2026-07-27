export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin, requirePermission } from '@/src/lib/api-auth';
import { createNotification } from '@/src/lib/notifications';
import { sendStatusEmail } from '@/src/lib/email';
import { sendWhatsappNotification, PARCEL_STATUS_LABELS } from '@/src/lib/twilio';
import { sendPushToUser } from '@/src/lib/push';
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
  const { error, session } = await requirePermission('parcels');
  if (error) return error;
  const isAdmin = (session!.user as any).role === 'admin';

  try {
  const body = await req.json();
  const { status, confirmed, notes, weightKg, priceXaf, eventNote, eventLocation, items, confirmedPriceXaf, adjustmentStatus, marginPct, driverId, delivery, cancellationReason } = body;

  // Fetch parcel with campaign to check lock status
  const existing = await prisma.parcel.findUnique({
    where: { id: params.id },
    select: {
      clientId: true,
      trackingCode: true,
      priceXaf: true,
      status: true,
      campaign: { select: { status: true } },
      client: { select: { name: true, email: true, phone: true } },
    },
  });

  // Cancellation guard — only allowed before shipment
  if (status === 'ann') {
    const CANCELLABLE = ['enr', 'rec', 'pre'];
    if (!CANCELLABLE.includes((existing as any)?.status ?? '')) {
      return NextResponse.json({ error: 'Ce colis ne peut plus être annulé — il a déjà été expédié.' }, { status: 403 });
    }
  }
  // Content edits (weight, items, price) are locked once the campaign is in transit.
  // Status updates and driver assignment are ALWAYS allowed.
  const LOCKED_STATUSES = ['exp', 'tra', 'apd', 'dou', 'lib', 'ard', 'pdl', 'ok'];
  const contentChanged  = weightKg !== undefined || priceXaf !== undefined || items !== undefined || confirmed !== undefined || notes !== undefined;
  if (!isAdmin && contentChanged && existing?.campaign && LOCKED_STATUSES.includes(existing.campaign.status as string)) {
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
      ...(driverId  !== undefined && { driverId:  driverId  || null }),
      ...(delivery  !== undefined && { delivery:  delivery  || null }),
      ...(cancellationReason !== undefined && { cancellationReason } as any),
    },
  });

  // Mettre à jour le montant du paiement si remise appliquée
  if (paymentAmountUpdate !== undefined) {
    await prisma.payment.updateMany({
      where: { parcelId: params.id },
      data: { amount: paymentAmountUpdate },
    }).catch(() => {});
  }

  if (status && status !== 'ann') {
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
      }).then(msg => sendWhatsappNotification(
        existing!.client!.phone!, msg, params.id,
        'auto_status_parcel',
        { first_name: firstName, parcel_code: existing.trackingCode, status_label: statusLabel },
      )).catch(() => {});
    }
    // Push notification on status change
    if (existing?.clientId) {
      const statusLabel = PARCEL_STATUS_LABELS[status] ?? status;
      const code = existing.trackingCode ?? params.id;
      sendPushToUser(existing.clientId, {
        title: `${statusLabel} — ${code}`,
        body:  eventNote || `Le statut de votre colis ${code} a été mis à jour.`,
        url:   `/client/colis/${params.id}`,
        tag:   `parcel-status-${params.id}`,
      }).catch(() => {});
    }
  }

  // Notify client of price adjustment via WhatsApp
  if (confirmedPriceXaf !== undefined && existing?.client?.phone) {
    const estimatedPrice = existing.priceXaf ?? 0;
    const diff = Number(confirmedPriceXaf) - estimatedPrice;
    if (diff > 0) {
      const firstName  = (existing.client.name ?? 'Client').split(' ')[0];
      const trackCode  = existing.trackingCode ?? params.id;
      const supplementVars = {
        first_name:      firstName,
        parcel_code:     trackCode,
        estimated_price: estimatedPrice.toLocaleString('fr'),
        confirmed_price: Number(confirmedPriceXaf).toLocaleString('fr'),
        diff:            diff.toLocaleString('fr'),
      };
      renderWaTemplate('auto_supplement', supplementVars)
        .then(msg => sendWhatsappNotification(
          existing!.client!.phone!, msg, params.id,
          'auto_supplement', supplementVars,
        )).catch(() => {});
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
  } catch (e: any) {
    console.error('[PUT /api/parcels/[id]]', e);
    return NextResponse.json({ error: e?.message ?? 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('parcels');
  if (error) return error;

  try {
    const parcel = await prisma.parcel.findUnique({
      where: { id: params.id },
      select: { id: true, status: true, trackingCode: true, payment: { select: { status: true } } },
    });

    if (!parcel) {
      return NextResponse.json({ error: 'Colis introuvable' }, { status: 404 });
    }

    // Block only if the parcel is already in transit or delivered
    const BLOCKED = ['exp', 'tra', 'apd', 'dou', 'lib', 'ard', 'pdl', 'liv', 'ok'];
    if (BLOCKED.includes(parcel.status)) {
      return NextResponse.json(
        { error: `Impossible de supprimer — le colis est déjà en transit ou livré (statut "${parcel.status}"). Utilisez l'annulation.` },
        { status: 403 },
      );
    }

    // Block only if money was actually received
    if (parcel.payment?.status === 'completed') {
      return NextResponse.json(
        { error: 'Ce colis a un paiement encaissé. Remboursez le client avant de supprimer.' },
        { status: 403 },
      );
    }

    // Delete any pending/partial payment first to avoid FK constraint on hard delete
    await prisma.payment.deleteMany({
      where: { parcelId: params.id, status: { not: 'completed' } },
    }).catch(() => {});

    try {
      // Soft-delete (preferred) — requires deletedAt column
      await prisma.$executeRawUnsafe(
        `UPDATE parcels SET "deletedAt" = NOW() WHERE id = $1`,
        params.id,
      );
    } catch {
      // deletedAt column not yet migrated — fall back to hard delete
      await prisma.parcel.delete({ where: { id: params.id } });
    }

    return NextResponse.json({ ok: true, trackingCode: parcel.trackingCode });
  } catch (e: any) {
    console.error('[DELETE /api/parcels/[id]]', e);
    return NextResponse.json({ error: e?.message ?? 'Erreur serveur' }, { status: 500 });
  }
}
