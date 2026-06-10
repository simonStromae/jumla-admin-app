export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/src/lib/api-auth';
import { getTwilioSettings, twilioVerify } from '@/src/lib/twilio';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const { accountSid, authToken, fromNumber } = await getTwilioSettings();

  if (!accountSid || !authToken || !fromNumber) {
    return NextResponse.json({ ok: false, error: 'Credentials manquants (Account SID, Auth Token, numéro)' });
  }

  const sidPreview   = accountSid.slice(0, 6) + '…' + accountSid.slice(-4) + ' (' + accountSid.length + ' car.)';
  const tokenPreview = authToken.slice(0, 4)  + '…' + authToken.slice(-4)  + ' (' + authToken.length  + ' car.)';

  try {
    const account = await twilioVerify(accountSid, authToken);
    return NextResponse.json({ ok: true, accountName: account.friendly_name, status: account.status, sidPreview, tokenPreview });
  } catch (e: any) {
    return NextResponse.json({
      ok:           false,
      error:        e?.message  ?? 'Erreur inconnue',
      code:         e?.code     ?? '',
      httpStatus:   e?.httpStatus ?? '',
      rawTwilio:    e?.raw       ?? null,
      sidPreview,
      tokenPreview,
    });
  }
}
