export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

// Returns only the Accept.js-safe fields — no Transaction Key
export async function GET() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ['authnet_login_id', 'authnet_client_key', 'authnet_environment'] } },
  });
  const m: Record<string, string> = {};
  for (const r of rows) m[r.key] = r.value;

  const loginId   = m.authnet_login_id   ?? '';
  const clientKey = m.authnet_client_key ?? '';
  const env       = m.authnet_environment === 'production' ? 'production' : 'sandbox';
  const enabled   = !!(loginId && clientKey);

  return NextResponse.json({ enabled, loginId, clientKey, environment: env });
}
