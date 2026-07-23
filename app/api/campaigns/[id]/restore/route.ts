export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requirePermission } from '@/src/lib/api-auth';

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('campaigns');
  if (error) return error;

  await prisma.campaign.update({
    where: { id: params.id },
    data:  { deletedAt: null } as any,
  });
  return NextResponse.json({ ok: true });
}
