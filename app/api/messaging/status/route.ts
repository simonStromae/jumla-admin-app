export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/src/lib/api-auth';
import { getTwilioSettings } from '@/src/lib/twilio';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const { accountSid, authToken, fromNumber } = await getTwilioSettings();
  const configured = !!(accountSid && authToken && fromNumber);

  return NextResponse.json({ configured, fromNumber: configured ? fromNumber : null });
}
