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
       WHERE b.status = 'valide' AND b."clientConfirmed" = false
       ORDER BY b."createdAt" ASC`
    );
  } catch (e) {
    unconfirmedBordereaux = [];
  }

  try {
    unpaidInvoices = await prisma.$queryRawUnsafe(
      `SELECT py.id, py.amount, py.status, py."createdAt", p."trackingCode", u.name as "clientName", p.id as "parcelId"
       FROM payments py
       JOIN parcels p ON p.id = py."parcelId"
       JOIN users u ON u.id = py."clientId"
       WHERE py.status IN ('pending','partial')
       ORDER BY py."createdAt" ASC`
    );
  } catch (e) {
    unpaidInvoices = [];
  }

  try {
    const result: any[] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int as count FROM parcels WHERE "weightKg" IS NULL AND status NOT IN ('livre')`
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
