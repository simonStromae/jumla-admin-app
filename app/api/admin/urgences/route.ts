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
       WHERE b.status = 'valide' AND b."clientConfirmed" = false AND p."deletedAt" IS NULL
       ORDER BY b."createdAt" ASC`
    );
  } catch (e) {
    unconfirmedBordereaux = [];
  }

  try {
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT py.id, py.amount, py.status, py."createdAt",
              p."trackingCode", u.name as "clientName", p.id as "parcelId",
              p."confirmedPriceXaf", p."adjustmentStatus"
       FROM payments py
       JOIN parcels p ON p.id = py."parcelId"
       JOIN users u ON u.id = py."clientId"
       WHERE py.status IN ('pending','partial') AND p."deletedAt" IS NULL
       ORDER BY py."createdAt" ASC`
    );
    unpaidInvoices = rows.map((inv: any) => {
      const adj  = inv.adjustmentStatus ?? 'none';
      const conf = inv.confirmedPriceXaf != null ? Number(inv.confirmedPriceXaf) : null;
      const invoiced = (adj === 'paid' || adj === 'discount') && conf != null
        ? conf
        : Number(inv.amount);
      return { ...inv, amount: Number(inv.amount), invoiced };
    });
  } catch (e) {
    unpaidInvoices = [];
  }

  try {
    const result: any[] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int as count FROM parcels WHERE "weightKg" IS NULL AND status NOT IN ('ok') AND "deletedAt" IS NULL`
    );
    missingWeightCount = result[0]?.count ?? 0;
  } catch (e) {
    missingWeightCount = 0;
  }

  return NextResponse.json({
    unconfirmedBordereaux,
    unpaidInvoices,
    missingWeightCount,
  });
}
