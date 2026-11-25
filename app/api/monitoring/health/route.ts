import { NextResponse } from 'next/server';
import { requireOnlyAdmin } from '@/src/lib/api-auth';
import { prisma } from '@/src/lib/prisma';
import { getTwilioSettings, twilioVerify } from '@/src/lib/twilio';

export const dynamic = 'force-dynamic';

type ServiceStatus = {
  id: string;
  label: string;
  status: 'ok' | 'warn' | 'error' | 'unconfigured';
  detail?: string;
  latencyMs?: number;
};

async function checkDb(): Promise<ServiceStatus> {
  const t0 = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { id: 'db', label: 'Base de donnees Neon', status: 'ok', latencyMs: Date.now() - t0 };
  } catch (e: any) {
    return { id: 'db', label: 'Base de donnees Neon', status: 'error', detail: e?.message };
  }
}

async function checkMigrations(): Promise<ServiceStatus> {
  try {
    const failed: any[] = await prisma.$queryRaw`
      SELECT migration_name FROM _prisma_migrations WHERE applied_steps_count = 0 AND finished_at IS NOT NULL LIMIT 5
    `;
    const rolled: any[] = await prisma.$queryRaw`
      SELECT migration_name FROM _prisma_migrations WHERE rolled_back_at IS NOT NULL LIMIT 5
    `;
    if (rolled.length > 0) {
      return { id: 'migrations', label: 'Migrations Prisma', status: 'error', detail: `${rolled.length} migration(s) annulee(s)` };
    }
    if (failed.length > 0) {
      return { id: 'migrations', label: 'Migrations Prisma', status: 'warn', detail: `${failed.length} migration(s) echouee(s)` };
    }
    const total: any[] = await prisma.$queryRaw`SELECT COUNT(*) as n FROM _prisma_migrations WHERE finished_at IS NOT NULL`;
    return { id: 'migrations', label: 'Migrations Prisma', status: 'ok', detail: `${total[0]?.n ?? '?'} migrations appliquees` };
  } catch (e: any) {
    return { id: 'migrations', label: 'Migrations Prisma', status: 'warn', detail: 'Table _prisma_migrations inaccessible' };
  }
}

async function checkTwilio(): Promise<ServiceStatus> {
  try {
    const cfg = await getTwilioSettings();
    if (!cfg.accountSid || !cfg.authToken) {
      return { id: 'twilio', label: 'Twilio WhatsApp', status: 'unconfigured', detail: 'Cles non configurees' };
    }
    const t0 = Date.now();
    const account = await twilioVerify(cfg.accountSid, cfg.authToken);
    return {
      id: 'twilio', label: 'Twilio WhatsApp', status: account.status === 'active' ? 'ok' : 'warn',
      detail: account.status === 'active' ? account.friendly_name : `Compte ${account.status}`,
      latencyMs: Date.now() - t0,
    };
  } catch (e: any) {
    return { id: 'twilio', label: 'Twilio WhatsApp', status: 'error', detail: e?.message };
  }
}

async function checkResend(): Promise<ServiceStatus> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { id: 'resend', label: 'Resend Email', status: 'unconfigured', detail: 'RESEND_API_KEY absent' };
  }
  try {
    const t0 = Date.now();
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      return { id: 'resend', label: 'Resend Email', status: 'error', detail: `HTTP ${res.status}` };
    }
    return { id: 'resend', label: 'Resend Email', status: 'ok', latencyMs: Date.now() - t0 };
  } catch (e: any) {
    return { id: 'resend', label: 'Resend Email', status: 'error', detail: e?.message };
  }
}

async function checkAuthNet(): Promise<ServiceStatus> {
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: ['authnet_login_id', 'authnet_transaction_key'] } },
    });
    const m: Record<string, string> = {};
    for (const r of rows) m[r.key] = r.value;
    const loginId = m['authnet_login_id'];
    const txKey   = m['authnet_transaction_key'];
    if (!loginId || !txKey) {
      return { id: 'authnet', label: 'Paiement en ligne (Authorize.Net)', status: 'unconfigured', detail: 'Identifiants non configures' };
    }
    return { id: 'authnet', label: 'Paiement en ligne (Authorize.Net)', status: 'ok', detail: `Login ID: ${loginId.slice(0, 4)}****` };
  } catch (e: any) {
    return { id: 'authnet', label: 'Paiement en ligne (Authorize.Net)', status: 'error', detail: e?.message };
  }
}

async function checkCron(): Promise<ServiceStatus> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return { id: 'cron', label: 'Cron relances paiement', status: 'warn', detail: 'CRON_SECRET absent — cron non securise' };
  }
  try {
    const lastRun = await prisma.setting.findFirst({ where: { key: 'cron_payment_reminders_last_run' } });
    const lastRunAt = lastRun?.value;
    const detail = lastRunAt
      ? `Dernier run : ${new Date(lastRunAt).toLocaleString('fr-FR', { timeZone: 'America/Toronto' })}`
      : 'Aucun run enregistre';
    return { id: 'cron', label: 'Cron relances paiement', status: 'ok', detail };
  } catch {
    return { id: 'cron', label: 'Cron relances paiement', status: 'ok', detail: 'Secret configure (aucun run enregistre)' };
  }
}

export async function GET() {
  const { error } = await requireOnlyAdmin();
  if (error) return error;

  const [db, migrations, twilio, resend, authnet, cron] = await Promise.allSettled([
    checkDb(), checkMigrations(), checkTwilio(), checkResend(), checkAuthNet(), checkCron(),
  ]);

  const services: ServiceStatus[] = [db, migrations, twilio, resend, authnet, cron].map((r) =>
    r.status === 'fulfilled' ? r.value : { id: 'unknown', label: 'Service', status: 'error' as const, detail: String((r as any).reason) }
  );

  const overall = services.some(s => s.status === 'error') ? 'error'
    : services.some(s => s.status === 'warn') ? 'warn' : 'ok';

  return NextResponse.json({ overall, services, checkedAt: new Date().toISOString() });
}
