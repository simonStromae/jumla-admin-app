import { NextResponse } from 'next/server';
import { requireAdmin } from '@/src/lib/api-auth';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  let unconfirmedBordereaux: any[] = [];
  let unpaidInvoices: any[] = [];
  let missingWeightCount = 0;

  try {
    unconfirmedBordereaux = await prisma.$queryRawUnsafe(
      `SELECT b.id, b.code, b.status, p.id as "parcelId", p."trackingCode", u.name as "clientName", u.phone as "clientPhone", b."createdAt"
       FROM bordereaux b
       JOIN parcels p ON p.id = b."parcelId"
       JOIN users u ON u.id = p."clientId"
       WHERE b.status = 'valide'
         AND b."clientConfirmed" = false
         AND p."deletedAt" IS NULL
         AND p.status != 'ann'
       ORDER BY b."createdAt" ASC`
    );
  } catch {
    unconfirmedBordereaux = [];
  }

  try {
    // Fetch pending/partial payments, excluding cancelled and deleted parcels
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT py.id, py.amount, py.status, py."createdAt",
              p."trackingCode", u.name as "clientName", p.id as "parcelId",
              p."confirmedPriceXaf", p."adjustmentStatus",
              COALESCE(r.currency, 'CAD') AS "routeCurrency",
              COALESCE(c."exchangeRateToCAD", 1)::float AS "exchangeRateToCAD"
       FROM payments py
       JOIN parcels p ON p.id = py."parcelId"
       JOIN users u ON u.id = py."clientId"
       JOIN campaigns c ON c.id = p."campaignId"
       JOIN routes r ON r.id = c."routeId"
       WHERE py.status IN ('pending','partial')
         AND p."deletedAt" IS NULL
         AND p.status != 'ann'
       ORDER BY py."createdAt" ASC`
    );

    // Batch-fetch allocations to compute the actual remaining (not the full invoiced amount)
    const paymentIds = rows.map(r => r.id);
    let allocMap: Record<string, number> = {};
    if (paymentIds.length > 0) {
      try {
        const allocRows: { paymentId: string; allocated: number }[] = await prisma.$queryRawUnsafe(
          `SELECT ta."paymentId", COALESCE(SUM(ta.amount), 0)::int AS allocated
           FROM transaction_allocations ta
           WHERE ta."paymentId" = ANY($1::text[])
           GROUP BY ta."paymentId"`,
          paymentIds
        );
        for (const r of allocRows) allocMap[r.paymentId] = Number(r.allocated);
      } catch {
        // table not migrated — treat as 0 allocated
      }
    }

    unpaidInvoices = rows.map((inv: any) => {
      const adj  = inv.adjustmentStatus ?? 'none';
      const conf = inv.confirmedPriceXaf != null ? Number(inv.confirmedPriceXaf) : null;
      const invoiced = (adj === 'paid' || adj === 'discount') && conf != null
        ? conf
        : Number(inv.amount);
      const allocated = allocMap[inv.id] ?? 0;
      const remainingNative = Math.max(0, invoiced - allocated);
      const rc   = inv.routeCurrency ?? 'CAD';
      const rate = Number(inv.exchangeRateToCAD ?? 1);
      const remainingCAD = rc === 'CAD' ? remainingNative : remainingNative * rate;
      return { ...inv, amount: Number(inv.amount), invoiced, allocated, remaining: remainingNative, remainingCAD, currency: rc };
    });
  } catch {
    unpaidInvoices = [];
  }

  try {
    const result: any[] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int as count FROM parcels
       WHERE "weightKg" IS NULL AND status NOT IN ('ok', 'ann') AND "deletedAt" IS NULL`
    );
    missingWeightCount = result[0]?.count ?? 0;
  } catch {
    missingWeightCount = 0;
  }

  return NextResponse.json({
    unconfirmedBordereaux,
    unpaidInvoices,
    missingWeightCount,
  });
}
