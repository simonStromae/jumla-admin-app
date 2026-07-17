export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireDriver } from '@/src/lib/api-auth';
import { cloudinary } from '@/src/lib/cloudinary';

export async function POST(req: NextRequest) {
  const { error, session } = await requireDriver();
  if (error) return error;

  const driverId = (session!.user as any).id as string;

  const formData  = await req.formData();
  const file      = formData.get('file') as File | null;
  const parcelId  = formData.get('parcelId') as string | null;

  if (!file || !parcelId) {
    return NextResponse.json({ error: 'Fichier et parcelId requis' }, { status: 400 });
  }

  // Verify parcel belongs to this driver
  const parcel = await prisma.parcel.findUnique({
    where: { id: parcelId },
    select: { id: true, driverId: true },
  });

  if (!parcel || parcel.driverId !== driverId) {
    return NextResponse.json({ error: 'Colis introuvable ou non assigné' }, { status: 404 });
  }

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

  const result = await cloudinary.uploader.upload(base64, {
    folder:         'jumla/delivery-proofs',
    transformation: [{ width: 1200, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' }],
  });

  return NextResponse.json({ url: result.secure_url });
}
