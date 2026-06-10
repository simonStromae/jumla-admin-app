export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/src/lib/api-auth';
import { getTwilioClient, getTwilioSettings } from '@/src/lib/twilio';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const { accountSid, authToken, fromNumber } = await getTwilioSettings();
  if (!accountSid || !authToken || !fromNumber) {
    return NextResponse.json({ ok: false, error: 'Credentials manquants (Account SID, Auth Token, numéro)' });
  }

  try {
    const client = await getTwilioClient();
    // Fetch account info — lightweight call that validates credentials
    const account = await client!.api.accounts(accountSid).fetch();
    return NextResponse.json({ ok: true, accountName: account.friendlyName, status: account.status });
  } catch (e: any) {
    const msg = e?.message ?? 'Erreur inconnue';
    const code = e?.code ?? '';
    return NextResponse.json({ ok: false, error: msg, code });
  }
}
