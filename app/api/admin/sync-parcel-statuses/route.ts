import { NextResponse } from 'next/server';
import { requireAdmin } from '@/src/lib/api-auth';
import { prisma } from '@/src/lib/prisma';

// The same cascade map as in campaigns/[id]/route.ts
// For each campaign status, which parcel statuses should be bumped up to it
const CASCADE: Record<string, string[]> = {
  exp: ['enr', 'rec', 'pre'],
  tra: ['enr', 'rec', 'pre', 'exp'],
  apd: ['enr', 'rec', 'pre', 'exp', 'tra'],
  dou: ['apd'],
  ins: ['dou'],
  ret: ['dou', 'ins'],
  lib: ['dou', 'ins', 'ret'],
  ard: ['exp', 'tra', 'apd', 'lib'],
  pdl: ['ard'],
  ok:  ['pdl'],
};

const EXCEPTIONAL = ['adr', 'tdl', 'dom', 'cla', 'rte', 'ann'];

export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  // Fetch all non-enr campaigns
  const campaigns = await prisma.campaign.findMany({
    where: { status: { not: 'enr' } },
    select: { id: true, status: true, code: true },
  });

  let totalUpdated = 0;
  const details: { campaign: string; status: string; updated: number }[] = [];

  for (const campaign of campaigns) {
    const fromStatuses = CASCADE[campaign.status];
    if (!fromStatuses || fromStatuses.length === 0) continue;

    const result = await prisma.parcel.updateMany({
      where: {
        campaignId: campaign.id,
        deletedAt:  null,
        status:     { in: fromStatuses, notIn: EXCEPTIONAL },
      },
      data: { status: campaign.status },
    });

    if (result.count > 0) {
      totalUpdated += result.count;
      details.push({ campaign: campaign.code, status: campaign.status, updated: result.count });
    }
  }

  return NextResponse.json({ ok: true, totalUpdated, details });
}
