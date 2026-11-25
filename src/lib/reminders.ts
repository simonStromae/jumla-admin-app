import { prisma } from './prisma';
import { sendWhatsappNotification } from './twilio';
import { renderWaTemplate } from './wa-template';

function dayWindow(daysAgo: number): { start: Date; end: Date } {
  const start = new Date();
  start.setDate(start.getDate() - daysAgo);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export type ReminderResult = {
  id: string;
  trackingCode: string;
  wave: number;
  status: 'sent' | 'skipped' | 'failed';
  reason?: string;
};

export async function runReminders(dryRun = false): Promise<{
  ok: boolean;
  sent: number;
  skipped: number;
  failed: number;
  total: number;
  results: ReminderResult[];
  waves: number[];
}> {
  const results: ReminderResult[] = [];

  const rows = await prisma.setting.findMany({
    where: { key: { in: ['REMINDER_ENABLED', 'REMINDER_WAVES'] } },
  });
  const cfg: Record<string, string> = {};
  for (const r of rows) cfg[r.key] = r.value;

  const enabled = cfg['REMINDER_ENABLED'] !== 'false';
  if (!enabled) {
    return { ok: true, sent: 0, skipped: 0, failed: 0, total: 0, results, waves: [] };
  }

  let waves: number[] = [3, 7, 14];
  try {
    const parsed = JSON.parse(cfg['REMINDER_WAVES'] ?? '[]');
    if (Array.isArray(parsed) && parsed.length > 0) waves = parsed.map(Number).filter(n => n > 0);
  } catch { /* use default */ }

  for (const wave of waves) {
    const { start, end } = dayWindow(wave);

    const parcels = await prisma.$queryRawUnsafe<{
      id: string;
      trackingCode: string;
      clientId: string;
      clientName: string;
      clientPhone: string | null;
      paymentId: string;
      amount: number;
      paymentCreatedAt: Date;
    }[]>(`
      SELECT
        p.id,
        p."trackingCode",
        u.id AS "clientId",
        u.name AS "clientName",
        u.phone AS "clientPhone",
        pay.id AS "paymentId",
        pay.amount,
        pay."createdAt" AS "paymentCreatedAt"
      FROM parcels p
      JOIN users u ON u.id = p."clientId"
      JOIN payments pay ON pay."parcelId" = p.id
      WHERE p."deletedAt" IS NULL
        AND p.status NOT IN ('ann', 'ok', 'liv')
        AND pay.status = 'pending'
        AND u.phone IS NOT NULL
        AND u.status = 'active'
        AND pay."createdAt" >= $1
        AND pay."createdAt" <= $2
    `, start, end);

    for (const parcel of parcels) {
      if (!parcel.clientPhone) {
        results.push({ id: parcel.id, trackingCode: parcel.trackingCode, wave, status: 'skipped', reason: 'no phone' });
        continue;
      }

      const firstName = parcel.clientName.split(' ')[0];
      const amount    = parcel.amount.toLocaleString('fr');
      const vars      = { first_name: firstName, parcel_code: parcel.trackingCode, amount };

      if (dryRun) {
        results.push({ id: parcel.id, trackingCode: parcel.trackingCode, wave, status: 'sent' });
        continue;
      }

      try {
        const body = await renderWaTemplate('reminder', vars);
        await sendWhatsappNotification(parcel.clientPhone, body, parcel.id, 'reminder', vars);
        results.push({ id: parcel.id, trackingCode: parcel.trackingCode, wave, status: 'sent' });
      } catch (e: any) {
        results.push({ id: parcel.id, trackingCode: parcel.trackingCode, wave, status: 'failed', reason: e?.message });
      }
    }
  }

  const sent    = results.filter(r => r.status === 'sent').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const failed  = results.filter(r => r.status === 'failed').length;

  return { ok: true, sent, skipped, failed, total: results.length, results, waves };
}
