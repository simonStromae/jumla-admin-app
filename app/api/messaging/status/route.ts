export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/src/lib/api-auth';
import { getTwilioSettings } from '@/src/lib/twilio';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const { accountSid, authToken, fromNumber } = await getTwilioSettings();
  const configured = !!(accountSid && authToken && fromNumber);

  const rows = await prisma.setting.findMany({
    where: { key: { in: ['MESSAGING_ENABLED', 'MESSAGING_CHANNEL', 'MESSAGING_SEND_TO'] } },
  }).catch(() => []);
  const m: Record<string, string> = {};
  for (const r of rows) m[r.key] = r.value;

  return NextResponse.json({
    configured,
    fromNumber:       configured ? fromNumber : null,
    messagingEnabled: m['MESSAGING_ENABLED'] !== 'false',
    channel:          m['MESSAGING_CHANNEL'] ?? 'whatsapp',
    sendTo:           m['MESSAGING_SEND_TO'] ?? 'client',
  });
}
