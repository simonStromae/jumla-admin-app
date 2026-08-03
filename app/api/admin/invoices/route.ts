export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requirePermission } from '@/src/lib/api-auth';

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `FAC-${year}-`;
  const last = await (prisma.invoice.findFirst as any)({
    where: { number: { startsWith: prefix } },
    orderBy: { number: 'desc' },
    select: { number: true },
  });
  let seq = 1;
  if (last) {
    const n = parseInt(last.number.replace(prefix, ''), 10);
    if (!isNaN(n)) seq = n + 1;
  }
  return prefix + String(seq).padStart(3, '0');
}

export async function GET(req: NextRequest) {
  const { error } = await requirePermission('payments');
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('clientId');

  const invoices = await (prisma.invoice.findMany as any)({
    where: clientId ? { clientId } : undefined,
    include: {
      client: { select: { id: true, name: true, email: true, companyName: true } },
      campaign: { select: { id: true, code: true, route: { select: { origin: true, destination: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(invoices);
}

export async function POST(req: NextRequest) {
  const { error } = await requirePermission('payments');
  if (error) return error;

  const body = await req.json();
  const { clientId, campaignId, amountXaf, notes, dueAt } = body;

  if (!clientId || !amountXaf) {
    return NextResponse.json({ error: 'clientId and amountXaf required' }, { status: 400 });
  }

  const number = await generateInvoiceNumber();

  const invoice = await (prisma.invoice.create as any)({
    data: {
      number,
      clientId,
      campaignId: campaignId ?? null,
      amountXaf: parseInt(amountXaf, 10),
      notes: notes ?? null,
      dueAt: dueAt ? new Date(dueAt) : null,
      status: 'draft',
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}
