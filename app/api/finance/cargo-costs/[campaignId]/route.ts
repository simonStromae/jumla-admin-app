export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function GET(_req: NextRequest, { params }: { params: { campaignId: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { campaignId } = params;

  const [campaign, costs] = await Promise.all([
    prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        route: true,
        legs: { select: { weightKg: true } },
        parcels: {
          where: { deletedAt: null },
          include: { payment: { select: { amount: true, status: true } } },
        },
      },
    }),
    prisma.cargoVariableCost.findMany({ where: { campaignId } }),
  ]);

  if (!campaign) return NextResponse.json({ error: 'not found' }, { status: 404 });

  // Compute CA: manual override first, then sum of paid payments
  const paidRevenue = campaign.parcels.reduce((sum, p) =>
    sum + (p.payment?.status === 'paid' ? (p.payment.amount ?? 0) : 0), 0);
  const revenueCad = campaign.financeRevenueCad ?? paidRevenue / 100; // payments stored in cents

  // Compute weight: manual override first, then sum of leg weights
  const legWeight = campaign.legs.reduce((sum, l) => sum + (l.weightKg ?? 0), 0);
  const weightKg = campaign.financeWeightKg ?? (legWeight || null);

  const costsMap: Record<number, number> = {};
  for (const c of costs) costsMap[c.postId] = c.amountCad;

  return NextResponse.json({
    campaign: {
      id: campaign.id,
      code: campaign.code,
      route: `${campaign.route.origin} → ${campaign.route.destination}`,
      departureDate: campaign.departureDate,
      revenueCad,
      weightKg,
      revenueCadIsOverride: campaign.financeRevenueCad !== null,
      weightKgIsOverride: campaign.financeWeightKg !== null,
    },
    costs: costsMap,
  });
}

export async function PUT(req: NextRequest, { params }: { params: { campaignId: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { campaignId } = params;
  const body = await req.json() as {
    costs?: Record<string, number | null>;
    revenueCad?: number | null;
    weightKg?: number | null;
  };

  const ops: Promise<unknown>[] = [];

  if (body.costs) {
    for (const [postIdStr, amount] of Object.entries(body.costs)) {
      const postId = parseInt(postIdStr);
      if (amount === null || amount === undefined) {
        ops.push(prisma.cargoVariableCost.deleteMany({ where: { campaignId, postId } }));
      } else {
        ops.push(prisma.cargoVariableCost.upsert({
          where:  { campaignId_postId: { campaignId, postId } },
          create: { campaignId, postId, amountCad: amount },
          update: { amountCad: amount },
        }));
      }
    }
  }

  if ('revenueCad' in body) {
    ops.push(prisma.campaign.update({
      where: { id: campaignId },
      data: { financeRevenueCad: body.revenueCad ?? null },
    }));
  }

  if ('weightKg' in body) {
    ops.push(prisma.campaign.update({
      where: { id: campaignId },
      data: { financeWeightKg: body.weightKg ?? null },
    }));
  }

  await Promise.all(ops);
  return NextResponse.json({ ok: true });
}
