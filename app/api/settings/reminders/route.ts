export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';
import { runReminders } from '@/src/lib/reminders';

const KEYS = ['REMINDER_ENABLED', 'REMINDER_WAVES'] as const;

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const rows = await prisma.setting.findMany({ where: { key: { in: [...KEYS] } } });
  const m: Record<string, string> = {};
  for (const r of rows) m[r.key] = r.value;

  let waves: number[] = [3, 7, 14];
  try {
    const parsed = JSON.parse(m['REMINDER_WAVES'] ?? '[]');
    if (Array.isArray(parsed) && parsed.length > 0) waves = parsed.map(Number).filter(n => n > 0);
  } catch { /* use default */ }

  return NextResponse.json({
    enabled: m['REMINDER_ENABLED'] !== 'false',
    waves,
  });
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json() as { enabled?: boolean; waves?: number[] };
  const ops: Promise<any>[] = [];

  if (body.enabled !== undefined) {
    ops.push(prisma.setting.upsert({
      where:  { key: 'REMINDER_ENABLED' },
      create: { key: 'REMINDER_ENABLED', value: body.enabled ? 'true' : 'false' },
      update: { value: body.enabled ? 'true' : 'false' },
    }));
  }

  if (body.waves !== undefined) {
    const clean = body.waves.map(Number).filter(n => n > 0 && n <= 90);
    ops.push(prisma.setting.upsert({
      where:  { key: 'REMINDER_WAVES' },
      create: { key: 'REMINDER_WAVES', value: JSON.stringify(clean) },
      update: { value: JSON.stringify(clean) },
    }));
  }

  await Promise.all(ops);
  return NextResponse.json({ ok: true });
}

// POST /api/settings/reminders — trigger a dry-run or real run from the admin UI
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => ({})) as { dryRun?: boolean };
  const result = await runReminders(body.dryRun ?? true);
  return NextResponse.json(result);
}
