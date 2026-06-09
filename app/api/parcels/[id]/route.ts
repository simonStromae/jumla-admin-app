export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin, requirePermission } from '@/src/lib/api-auth';

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
  const { status, confirmed, notes, weightKg, priceXaf, eventNote, eventLocation } = body;

  const parcel = await prisma.parcel.update({
    where: { id: params.id },
    data: {
      ...(status    && { status: status as any }),
      ...(confirmed !== undefined && { confirmed }),
      ...(notes     !== undefined && { notes }),
      ...(weightKg  !== undefined && { weightKg:  Number(weightKg) }),
      ...(priceXaf  !== undefined && { priceXaf:  Number(priceXaf) }),
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
  }

  return NextResponse.json({ ok: true, parcel });
}
