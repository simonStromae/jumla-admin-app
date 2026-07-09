export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/src/lib/api-auth';
import { setupVapidKeys } from '@/src/lib/push';

// GET /api/push/setup  — generates VAPID keys if not present, returns public key
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const { publicKey } = await setupVapidKeys();
  return NextResponse.json({ ok: true, publicKey });
}
