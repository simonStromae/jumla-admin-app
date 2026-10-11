export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

function fiscalYearOf(date: Date): number {
  return date.getMonth() >= 6 ? date.getFullYear() : date.getFullYear() - 1;
}

// GET /api/finance/hypotheses?fy=2026
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const url = new URL(req.url);
  const fy = parseInt(url.searchParams.get('fy') ?? String(fiscalYearOf(new Date())));

  const key = `finance-hyp-${fy}`;
  const setting = await prisma.setting.findUnique({ where: { key } });
  const hyp = setting ? JSON.parse(setting.value) : {
    transportPerKg:   0,
    customsPct:       0,
    brokerPerKg:      0,
    storagePerKg:     0,
    handlingPerKg:    0,
    targetWeightKg:   1000,
    revenuePerKg:     0,
  };

  return NextResponse.json({ fiscalYear: fy, hyp });
}

// PUT /api/finance/hypotheses?fy=2026
// Body: the full hypotheses map
export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const url = new URL(req.url);
  const fy = parseInt(url.searchParams.get('fy') ?? String(fiscalYearOf(new Date())));

  const body = await req.json();
  const key = `finance-hyp-${fy}`;

  await prisma.setting.upsert({
    where: { key },
    create: { key, value: JSON.stringify(body) },
    update: { value: JSON.stringify(body) },
  });

  return NextResponse.json({ ok: true });
}
