export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requirePermission } from '@/src/lib/api-auth';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('campaigns');
  if (error) return error;

  const legs = await prisma.campaignLeg.findMany({
    where: { campaignId: params.id },
    include: { airline: true },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(legs);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('campaigns');
  if (error) return error;

  const { airlineId, awbNumber, weightKg, notes } = await req.json();
  if (!airlineId) return NextResponse.json({ error: 'Compagnie aérienne requise' }, { status: 400 });

  const leg = await prisma.campaignLeg.create({
    data: {
      campaignId: params.id,
      airlineId,
      awbNumber: awbNumber?.trim() || null,
      weightKg:  weightKg ? Number(weightKg) : null,
      notes:     notes?.trim() || null,
    },
    include: { airline: true },
  });

  return NextResponse.json({ ok: true, leg });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('campaigns');
  if (error) return error;

  const { legId, airlineId, awbNumber, weightKg, notes } = await req.json();
  if (!legId) return NextResponse.json({ error: 'legId requis' }, { status: 400 });

  const leg = await prisma.campaignLeg.update({
    where: { id: legId },
    data: {
      airlineId,
      awbNumber: awbNumber?.trim() || null,
      weightKg:  weightKg ? Number(weightKg) : null,
      notes:     notes?.trim() || null,
    },
    include: { airline: true },
  });

  return NextResponse.json({ ok: true, leg });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('campaigns');
  if (error) return error;

  const { legId } = await req.json();
  await prisma.campaignLeg.delete({ where: { id: legId } });
  return NextResponse.json({ ok: true });
}
