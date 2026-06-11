export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

// GET /api/clients/[id]/balance
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  return getBalance(params.id);
}

async function getBalance(clientId: string) {
  const payments = await prisma.payment.findMany({
    where: { clientId },
    include: {
      parcel: {
        select: {
          trackingCode: true,
          campaign: { select: { code: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Per-payment allocated amounts from transactions
  let allocRows: { paymentId: string; allocated: number }[] = [];
  if (payments.length) {
    try {
      allocRows = await prisma.$queryRawUnsafe(
        `SELECT ta."paymentId", COALESCE(SUM(ta.amount), 0)::int AS allocated
         FROM transaction_allocations ta
         JOIN transactions t ON t.id = ta."transactionId"
         WHERE ta."paymentId" = ANY($1::text[])
         GROUP BY ta."paymentId"`,
        payments.map(p => p.id)
      ) as { paymentId: string; allocated: number }[];
    } catch {
      // tables not yet migrated — treat all as unallocated
      allocRows = [];
    }
  }

  const allocMap: Record<string, number> = {};
  for (const r of allocRows) allocMap[r.paymentId] = Number(r.allocated);

  const invoices = payments.map(p => {
    const allocatedOnPayment = allocMap[p.id] || 0;
    // A payment manually marked completed (old flow) counts as fully paid
    const effectiveAllocated = p.status === 'completed'
      ? Math.max(allocatedOnPayment, p.amount)
      : allocatedOnPayment;
    return {
      id:           p.id,
      parcelId:     p.parcelId,
      trackingCode: p.parcel.trackingCode,
      campaignCode: p.parcel.campaign.code,
      amount:       p.amount,
      allocated:    effectiveAllocated,
      remaining:    Math.max(0, p.amount - effectiveAllocated),
      status:       p.status,
      createdAt:    p.createdAt,
    };
  });

  const totalInvoiced = invoices.reduce((s, i) => s + i.amount, 0);
  const totalAllocated = invoices.reduce((s, i) => s + i.allocated, 0);
  const totalDue = invoices.reduce((s, i) => s + i.remaining, 0);

  // Credit = money received beyond what was invoiced
  let totalReceived = 0;
  try {
    const [txRow] = await prisma.$queryRawUnsafe(
      `SELECT COALESCE(SUM(amount), 0)::int AS total FROM transactions WHERE "clientId" = $1`,
      clientId
    ) as { total: number }[];
    totalReceived = Number(txRow?.total ?? 0);
  } catch {
    // transactions table not yet migrated
  }
  const creditBalance = Math.max(0, totalReceived - totalAllocated);

  return NextResponse.json({
    totalInvoiced,
    totalReceived,
    totalDue,
    creditBalance,
    unpaidInvoices: invoices.filter(i => i.remaining > 0),
    allInvoices:    invoices,
  });
}
