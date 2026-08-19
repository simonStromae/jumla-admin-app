export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requirePermission } from '@/src/lib/api-auth';

const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('parcels');
  if (error) return error;

  const parcel = await prisma.parcel.findUnique({
    where: { id: params.id },
    select: { id: true, clientId: true, trackingCode: true },
  });
  if (!parcel) return NextResponse.json({ error: 'Colis introuvable' }, { status: 404 });

  // Invalidate any existing token for this parcel
  await prisma.setting.deleteMany({
    where: { key: { startsWith: `plink:parcel:${parcel.id}:` } },
  });

  const token     = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + TTL_MS).toISOString();

  await prisma.setting.create({
    data: {
      key:   `plink:parcel:${parcel.id}:${token}`,
      value: JSON.stringify({ parcelId: parcel.id, clientId: parcel.clientId, expiresAt }),
    },
  });

  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host  = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const url   = `${proto}://${host}/payer/${token}`;

  return NextResponse.json({ token, url, expiresAt });
}
