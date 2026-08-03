export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requirePermission } from '@/src/lib/api-auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('payments');
  if (error) return error;

  const body = await req.json();
  const { status, notes, dueAt, amountXaf } = body;

  const data: Record<string, any> = {};
  if (status) {
    data.status = status;
    if (status === 'paid') data.paidAt = new Date();
    if (status === 'sent') data.issuedAt = new Date();
  }
  if (notes !== undefined) data.notes = notes;
  if (dueAt !== undefined) data.dueAt = dueAt ? new Date(dueAt) : null;
  if (amountXaf !== undefined) data.amountXaf = parseInt(amountXaf, 10);

  const invoice = await (prisma.invoice.update as any)({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(invoice);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('payments');
  if (error) return error;

  await (prisma.invoice.delete as any)({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
