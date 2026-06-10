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

  return NextResponse.json({
    accountSid:  m['TWILIO_ACCOUNT_SID']   ? '••••' + m['TWILIO_ACCOUNT_SID'].slice(-4)   : '',
    authToken:   m['TWILIO_AUTH_TOKEN']    ? '••••' + m['TWILIO_AUTH_TOKEN'].slice(-4)    : '',
    fromNumber:  m['TWILIO_WHATSAPP_FROM'] ?? '',
    configured:  KEYS.every(k => !!m[k]),
  });
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json() as { accountSid?: string; authToken?: string; fromNumber?: string };

  const ops: Promise<any>[] = [];
  if (body.accountSid && !body.accountSid.startsWith('••••')) {
    ops.push(prisma.setting.upsert({ where: { key: 'TWILIO_ACCOUNT_SID' }, create: { key: 'TWILIO_ACCOUNT_SID', value: body.accountSid }, update: { value: body.accountSid } }));
  }
  if (body.authToken && !body.authToken.startsWith('••••')) {
    ops.push(prisma.setting.upsert({ where: { key: 'TWILIO_AUTH_TOKEN' }, create: { key: 'TWILIO_AUTH_TOKEN', value: body.authToken }, update: { value: body.authToken } }));
  }
  if (body.fromNumber !== undefined) {
    ops.push(prisma.setting.upsert({ where: { key: 'TWILIO_WHATSAPP_FROM' }, create: { key: 'TWILIO_WHATSAPP_FROM', value: body.fromNumber }, update: { value: body.fromNumber } }));
  }

  await Promise.all(ops);
  return NextResponse.json({ ok: true });
}
