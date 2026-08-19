export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';
import { testCredentials } from '@/src/lib/authorizeNet';

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  // Accept credentials from body (unsaved) or fall back to DB
  const body = await req.json().catch(() => ({}));
  let loginId        = body.authnet_login_id;
  let transactionKey = body.authnet_transaction_key;
  let environment    = body.authnet_environment;

  if (!loginId || !transactionKey) {
    const rows = await prisma.setting.findMany({
      where: { key: { in: ['authnet_login_id', 'authnet_transaction_key', 'authnet_environment'] } },
    });
    const m: Record<string, string> = {};
    for (const r of rows) m[r.key] = r.value;
    loginId        ??= m.authnet_login_id;
    transactionKey ??= m.authnet_transaction_key;
    environment    ??= m.authnet_environment;
  }

  if (!loginId || !transactionKey) {
    return NextResponse.json({ ok: false, error: 'Clés API non configurées' }, { status: 400 });
  }

  let result: { ok: boolean; error?: string };
  try {
    result = await testCredentials({
      loginId,
      transactionKey,
      environment: environment === 'production' ? 'production' : 'sandbox',
    });
  } catch (e: any) {
    result = { ok: false, error: e?.message ?? 'Erreur serveur' };
  }

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
