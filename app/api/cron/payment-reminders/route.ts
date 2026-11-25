export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { logError } from '@/src/lib/logError';
import { runReminders } from '@/src/lib/reminders';

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await runReminders(false);
    await prisma.setting.upsert({
      where: { key: 'cron_payment_reminders_last_run' },
      update: { value: new Date().toISOString() },
      create: { key: 'cron_payment_reminders_last_run', value: new Date().toISOString() },
    });
    return NextResponse.json(result);
  } catch (e: any) {
    await logError({ route: '/api/cron/payment-reminders', method: 'GET', status: 500, message: e?.message ?? String(e), stack: e?.stack });
    return NextResponse.json({ error: 'Cron failed', detail: e?.message }, { status: 500 });
  }
}
