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

  // Show partial values in response to help user verify what's stored
  const sidPreview   = accountSid.slice(0, 6)   + '…' + accountSid.slice(-4);
  const tokenPreview = authToken.slice(0, 4)     + '…' + authToken.slice(-4);

  try {
    const client = await getTwilioClient();
    const account = await client!.api.accounts(accountSid).fetch();
    return NextResponse.json({
      ok: true,
      accountName: account.friendlyName,
      status:      account.status,
      sidPreview,
      tokenPreview,
    });
  } catch (e: any) {
    return NextResponse.json({
      ok:           false,
      error:        e?.message ?? 'Erreur inconnue',
      code:         e?.code    ?? '',
      sidPreview,
      tokenPreview,
    });
  }
}
