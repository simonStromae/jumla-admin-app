export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/src/lib/api-auth';
import { getVapidPublicKey } from '@/src/lib/push';

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const publicKey = await getVapidPublicKey();
  if (!publicKey) {
    return NextResponse.json({ error: 'Push non configuré — visitez /api/push/setup' }, { status: 503 });
  }
  return NextResponse.json({ publicKey });
}
