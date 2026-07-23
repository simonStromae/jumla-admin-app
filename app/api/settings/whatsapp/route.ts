export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

const KEYS = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_FROM', 'TWILIO_SMS_FROM', 'MESSAGING_ENABLED', 'MESSAGING_CHANNEL', 'MESSAGING_SEND_TO'] as const;

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const rows = await prisma.setting.findMany({ where: { key: { in: [...KEYS] } } });
  const m: Record<string, string> = {};
  for (const r of rows) m[r.key] = r.value;

  const sid   = m['TWILIO_ACCOUNT_SID'] ?? '';
  const token = m['TWILIO_AUTH_TOKEN']  ?? '';

  return NextResponse.json({
    accountSid:  sid   ? sid.slice(0, 6)   + '••••••••••••••••••••••' + sid.slice(-4)   : '',
    authToken:   token ? token.slice(0, 4) + '••••••••••••••••••••••' + token.slice(-4) : '',
    fromNumber:  m['TWILIO_WHATSAPP_FROM'] ?? '',
    smsFrom:     m['TWILIO_SMS_FROM'] ?? '',
    configured:  !!(m['TWILIO_ACCOUNT_SID'] && m['TWILIO_AUTH_TOKEN'] && m['TWILIO_WHATSAPP_FROM']),
    messagingEnabled: m['MESSAGING_ENABLED'] !== 'false',
    channel:          m['MESSAGING_CHANNEL'] ?? 'whatsapp',
    sendTo:           m['MESSAGING_SEND_TO'] ?? 'client',
  });
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json() as { accountSid?: string; authToken?: string; fromNumber?: string; smsFrom?: string; messagingEnabled?: boolean; channel?: string; sendTo?: string };

  // Remove every non-printable-ASCII character (invisible Unicode, zero-width spaces, etc.)
  const sanitize = (s: string) => s.trim().replace(/[^\x20-\x7E]/g, '');

  const ops: Promise<any>[] = [];
  if (body.accountSid && !body.accountSid.includes('••••')) {
    ops.push(prisma.setting.upsert({
      where:  { key: 'TWILIO_ACCOUNT_SID' },
      create: { key: 'TWILIO_ACCOUNT_SID', value: sanitize(body.accountSid) },
      update: { value: sanitize(body.accountSid) },
    }));
  }
  if (body.authToken && !body.authToken.includes('••••')) {
    ops.push(prisma.setting.upsert({
      where:  { key: 'TWILIO_AUTH_TOKEN' },
      create: { key: 'TWILIO_AUTH_TOKEN', value: sanitize(body.authToken) },
      update: { value: sanitize(body.authToken) },
    }));
  }
  if (body.fromNumber !== undefined) {
    ops.push(prisma.setting.upsert({
      where:  { key: 'TWILIO_WHATSAPP_FROM' },
      create: { key: 'TWILIO_WHATSAPP_FROM', value: sanitize(body.fromNumber) },
      update: { value: sanitize(body.fromNumber) },
    }));
  }
  if (body.smsFrom !== undefined) {
    ops.push(prisma.setting.upsert({
      where:  { key: 'TWILIO_SMS_FROM' },
      create: { key: 'TWILIO_SMS_FROM', value: sanitize(body.smsFrom) },
      update: { value: sanitize(body.smsFrom) },
    }));
  }

  if (body.messagingEnabled !== undefined) {
    ops.push(prisma.setting.upsert({
      where:  { key: 'MESSAGING_ENABLED' },
      create: { key: 'MESSAGING_ENABLED', value: body.messagingEnabled ? 'true' : 'false' },
      update: { value: body.messagingEnabled ? 'true' : 'false' },
    }));
  }
  if (body.channel) {
    ops.push(prisma.setting.upsert({
      where:  { key: 'MESSAGING_CHANNEL' },
      create: { key: 'MESSAGING_CHANNEL', value: body.channel },
      update: { value: body.channel },
    }));
  }
  if (body.sendTo) {
    ops.push(prisma.setting.upsert({
      where:  { key: 'MESSAGING_SEND_TO' },
      create: { key: 'MESSAGING_SEND_TO', value: body.sendTo },
      update: { value: body.sendTo },
    }));
  }

  await Promise.all(ops);
  return NextResponse.json({ ok: true });
}
