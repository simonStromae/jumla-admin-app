export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

const KEYS = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_FROM'] as const;

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const rows = await prisma.setting.findMany({ where: { key: { in: [...KEYS] } } });
  const m: Record<string, string> = {};
  for (const r of rows) m[r.key] = r.value;

  const sid   = m['TWILIO_ACCOUNT_SID'] ?? '';
  const token = m['TWILIO_AUTH_TOKEN']  ?? '';

  return NextResponse.json({
    // Show first 6 + last 4 chars so user can verify what's stored without exposing the full value
    accountSid:  sid   ? sid.slice(0, 6)   + '••••••••••••••••••••••' + sid.slice(-4)   : '',
    authToken:   token ? token.slice(0, 4) + '••••••••••••••••••••••' + token.slice(-4) : '',
    fromNumber:  m['TWILIO_WHATSAPP_FROM'] ?? '',
    configured:  KEYS.every(k => !!m[k]),
  });
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json() as { accountSid?: string; authToken?: string; fromNumber?: string };

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

  await Promise.all(ops);
  return NextResponse.json({ ok: true });
}
