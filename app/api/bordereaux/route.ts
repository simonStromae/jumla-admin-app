export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const parcelId = new URL(req.url).searchParams.get('parcelId');
  const bordereaux = await prisma.bordereau.findMany({
    where: parcelId ? { parcelId } : {},
    include: { parcel: { select: { trackingCode: true, client: { select: { name: true } } } } },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(bordereaux);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { parcelId, description, weightKg, nbPieces, notes } = await req.json();
  if (!parcelId) return NextResponse.json({ error: 'parcelId requis' }, { status: 400 });

  const parcel = await prisma.parcel.findUnique({ where: { id: parcelId }, select: { trackingCode: true } });
  if (!parcel) return NextResponse.json({ error: 'Colis introuvable' }, { status: 404 });

  const existing = await prisma.bordereau.count({ where: { parcelId } });
  const code = `BL-${parcel.trackingCode}-${String(existing + 1).padStart(2, '0')}`;

  const bordereau = await prisma.bordereau.create({
    data: {
      parcelId,
      code,
      description: description || null,
      weightKg:    weightKg ? Number(weightKg) : null,
      nbPieces:    nbPieces ? Number(nbPieces) : 1,
      notes:       notes    || null,
    },
  });
  return NextResponse.json({ ok: true, bordereau });
}
