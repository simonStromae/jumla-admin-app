export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requirePermission } from '@/src/lib/api-auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('payments');
  if (error) return error;

  const { status, interacRef } = await req.json();

  const payment = await prisma.payment.update({
    where: { id: params.id },
    data: {
      status:     status as any,
      interacRef: interacRef ?? undefined,
      paidAt:     status === 'completed' ? new Date() : undefined,
    },
  });

  return NextResponse.json({ ok: true, payment });
}
