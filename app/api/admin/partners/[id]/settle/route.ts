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

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('payments');
  if (error) return error;

  const body = await req.json();
  const { campaignId, amountXaf, notes, markParcelsAsPaid } = body;

  if (!amountXaf || amountXaf <= 0) {
    return NextResponse.json({ error: 'amountXaf required' }, { status: 400 });
  }

  const number = await generateInvoiceNumber();

  const invoice = await (prisma.invoice.create as any)({
    data: {
      number,
      clientId: params.id,
      campaignId: campaignId ?? null,
      amountXaf: parseInt(amountXaf, 10),
      notes: notes ?? null,
      status: 'paid',
      paidAt: new Date(),
      issuedAt: new Date(),
    },
  });

  const updatedParcelIds: string[] = [];

  if (markParcelsAsPaid && campaignId) {
    const parcels = await (prisma.parcel.findMany as any)({
      where: { clientId: params.id, campaignId, deletedAt: null },
      select: {
        id: true,
        priceXaf: true,
        confirmedPriceXaf: true,
        payment: { select: { id: true } },
      },
    });

    for (const p of parcels) {
      const amount = p.confirmedPriceXaf ?? p.priceXaf ?? 0;
      if (p.payment?.id) {
        await (prisma.payment.update as any)({
          where: { id: p.payment.id },
          data: { status: 'completed', paidAt: new Date() },
        });
      } else {
        await (prisma.payment.create as any)({
          data: {
            parcelId: p.id,
            clientId: params.id,
            amount,
            status: 'completed',
            paidAt: new Date(),
          },
        });
      }
      updatedParcelIds.push(p.id);
    }
  }

  return NextResponse.json({ invoice, updatedParcelIds });
}
