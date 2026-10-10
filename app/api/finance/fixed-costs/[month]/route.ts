export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function GET(_req: NextRequest, { params }: { params: { month: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { month } = params;
  if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: 'invalid month format' }, { status: 400 });

  const costs = await prisma.fixedMonthlyCost.findMany({ where: { month } });
  const costsMap: Record<number, number> = {};
  for (const c of costs) costsMap[c.postId] = c.amountCad;

  // Compute YTD: from start of fiscal year (July 1) to this month
  const [year, mo] = month.split('-').map(Number);
  const fyStart = mo >= 7 ? year : year - 1;
  const startMonth = `${fyStart}-07`;

  const ytdCosts = await prisma.fixedMonthlyCost.findMany({
    where: { month: { gte: startMonth, lte: month } },
  });
  const ytdMap: Record<number, number> = {};
  for (const c of ytdCosts) {
    ytdMap[c.postId] = (ytdMap[c.postId] ?? 0) + c.amountCad;
  }

  return NextResponse.json({ month, costs: costsMap, ytd: ytdMap });
}

export async function PUT(req: NextRequest, { params }: { params: { month: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { month } = params;
  if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: 'invalid month format' }, { status: 400 });

  const body = await req.json() as Record<string, number | null>;

  await Promise.all(
    Object.entries(body).map(([postIdStr, amount]) => {
      const postId = parseInt(postIdStr);
      if (amount === null || amount === undefined) {
        return prisma.fixedMonthlyCost.deleteMany({ where: { month, postId } });
      }
      return prisma.fixedMonthlyCost.upsert({
        where:  { month_postId: { month, postId } },
        create: { month, postId, amountCad: amount },
        update: { amountCad: amount },
      });
    })
  );

  return NextResponse.json({ ok: true });
}
