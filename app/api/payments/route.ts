export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const payments = await prisma.payment.findMany({
    where:    { parcel: { deletedAt: null } },
    orderBy:  { createdAt: 'desc' },
    include: {
      client: { select: { name: true, phone: true, email: true } },
      parcel: {
        select: {
          trackingCode:      true,
          priceXaf:          true,
          confirmedPriceXaf: true,
          adjustmentStatus:  true,
          campaign: { select: { code: true } },
        },
      },
    },
  });

  // Batch-fetch allocations for all payments
  const paymentIds = payments.map(p => p.id);
  let allocMap: Record<string, number> = {};
  if (paymentIds.length > 0) {
    try {
      const rows = await prisma.$queryRawUnsafe<{ paymentId: string; allocated: number }[]>(
        `SELECT "paymentId", COALESCE(SUM(amount), 0)::int AS allocated
         FROM transaction_allocations
         WHERE "paymentId" = ANY($1::text[])
         GROUP BY "paymentId"`,
        paymentIds
      );
      for (const r of rows) allocMap[r.paymentId] = Number(r.allocated);
    } catch {
      // transaction tables may not exist yet
    }
  }

  const result = payments.map(p => {
    const confirmedPriceXaf = p.parcel.confirmedPriceXaf ?? null;
    const adjustmentStatus  = (p.parcel as any).adjustmentStatus ?? 'none';

    // Actual money received on main invoice:
    // - completed legacy payments (no allocations): full amount
    // - payments with allocations: sum of allocations
    const rawAllocated = allocMap[p.id] ?? 0;
    const allocated = p.status === 'completed'
      ? Math.max(rawAllocated, p.amount)   // legacy completed = full amount
      : rawAllocated;

    // Supplement amounts
    const suppAmt = (confirmedPriceXaf != null && (p.parcel as any).priceXaf != null)
      ? Math.max(0, confirmedPriceXaf - (p.parcel as any).priceXaf)
      : 0;
    const suppPaid    = adjustmentStatus === 'paid'    ? suppAmt : 0;
    const suppPending = adjustmentStatus === 'pending' ? suppAmt : 0;

    // Total invoiced for this parcel (base + supplement)
    const invoiced = (confirmedPriceXaf ?? p.amount) + 0;  // confirmedPriceXaf already includes supplement

    // Total collected for this parcel
    const collected = allocated + suppPaid;

    // Remaining owed
    const remaining = Math.max(0, invoiced - collected);

    return {
      id:               p.id,
      clientId:         p.clientId,
      parcelId:         p.parcelId,
      date:             new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(p.createdAt),
      recipName:        p.client.name,
      recipPhone:       p.client.phone ?? p.client.email,
      campaign:         p.parcel.campaign.code,
      parcel:           p.parcel.trackingCode,
      priceXaf:         p.parcel.priceXaf,
      confirmedPriceXaf,
      adjustmentStatus,
      due:              p.amount,
      amount:           p.amount,
      invoiced,           // total facturé réel (avec supplément)
      allocated,          // encaissé sur facture principale
      suppAmt,
      suppPaid,
      suppPending,
      collected,          // total encaissé (facture + supplément)
      remaining,          // reste dû total
      received:         p.status === 'completed' ? p.amount : 0,
      status:           p.status === 'completed' ? 'paid' : p.status === 'pending' ? 'pending' : 'unpaid',
      interacRef:       p.interacRef,
      paidAt:           p.paidAt,
      createdAt:        p.createdAt,
    };
  });

  return NextResponse.json(result);
}
