export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin, requirePermission } from '@/src/lib/api-auth';
import { createNotification } from '@/src/lib/notifications';
import { sendStatusEmail } from '@/src/lib/email';

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
  const { status, confirmed, notes, weightKg, priceXaf, eventNote, eventLocation, items } = body;

  // Fetch parcel with campaign to check lock status
  const existing = await prisma.parcel.findUnique({
    where: { id: params.id },
    select: {
      clientId: true,
      trackingCode: true,
      campaign: { select: { status: true } },
      client: { select: { name: true, email: true } },
    },
  });
  const LOCKED_STATUSES = ['in_transit', 'in_transit_2', 'arrived', 'preparing_arrival', 'closed'];
  if (existing?.campaign && LOCKED_STATUSES.includes(existing.campaign.status as string)) {
    return NextResponse.json({ error: 'Colis verrouillé — la cargaison est déjà en transit.' }, { status: 403 });
  }

  const parcel = await prisma.parcel.update({
    where: { id: params.id },
    data: {
      ...(status    && { status: status as any }),
      ...(confirmed !== undefined && { confirmed }),
      ...(notes     !== undefined && { notes }),
      ...(weightKg  !== undefined && { weightKg:  Number(weightKg) }),
      ...(priceXaf  !== undefined && { priceXaf:  Number(priceXaf) }),
      ...(items     !== undefined && { items } as any),
    },
  });

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
  }

  // Notify client when admin modifies parcel info (not just status)
  const infoChanged = weightKg !== undefined || priceXaf !== undefined || notes !== undefined || items !== undefined;
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
