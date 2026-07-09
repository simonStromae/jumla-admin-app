export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin, requirePermission } from '@/src/lib/api-auth';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  let rows: any[] = [];
  let queryError: string | null = null;

  try {
    rows = await prisma.$queryRawUnsafe(`
      SELECT
        t.id,
        t."clientId",
        t.amount::int                  AS amount,
        t.type,
        t.method,
        t.reference,
        t.note,
        t."createdAt",
        u.name  AS "clientName",
        u.phone AS "clientPhone",
        rb.name AS "recordedByName",
        COALESCE(
          json_agg(
            json_build_object(
              'paymentId',    ta."paymentId",
              'amount',       ta.amount::int,
              'trackingCode', par."trackingCode",
              'campaignCode', c.code
            ) ORDER BY ta.id
          ) FILTER (WHERE ta.id IS NOT NULL),
          '[]'::json
        ) AS allocations,
        COALESCE(SUM(ta.amount), 0)::int AS "totalAllocated"
      FROM transactions t
      JOIN users u ON u.id = t."clientId"
      LEFT JOIN users rb ON rb.id = t."recordedById"
      LEFT JOIN transaction_allocations ta ON ta."transactionId" = t.id
      LEFT JOIN payments py  ON py.id  = ta."paymentId"
      LEFT JOIN parcels par  ON par.id = py."parcelId"
      LEFT JOIN campaigns c  ON c.id   = par."campaignId"
      GROUP BY t.id, t."clientId", t.amount, t.type, t.method, t.reference, t.note, t."createdAt",
               u.name, u.phone, rb.name
      ORDER BY t."createdAt" DESC
    `) as any[];
  } catch (e: any) {
    queryError = e?.message ?? 'unknown';
    rows = [];
  }

  // Legacy payments (marked completed before transactions table existed)
  // Show them as synthetic rows so admins can see historical data
  let legacyRows: any[] = [];
  try {
    const txIds = rows.map((r: any) => r.id as string);
    // Find completed payments that have no transaction allocation
    legacyRows = await prisma.$queryRawUnsafe(`
      SELECT
        py.id                                    AS id,
        py."clientId",
        py.amount::int                           AS amount,
        'payment'                                AS type,
        'interac'                                AS method,
        py."interacRef"                          AS reference,
        NULL::text                               AS note,
        COALESCE(py."paidAt", py."createdAt")    AS "createdAt",
        u.name                                   AS "clientName",
        u.phone                                  AS "clientPhone",
        NULL::text                               AS "recordedByName",
        json_build_array(json_build_object(
          'paymentId',    py.id,
          'amount',       py.amount::int,
          'trackingCode', par."trackingCode",
          'campaignCode', c.code
        ))                                       AS allocations,
        py.amount::int                           AS "totalAllocated",
        true                                     AS "isLegacy"
      FROM payments py
      JOIN users u   ON u.id   = py."clientId"
      JOIN parcels par ON par.id = py."parcelId"
      JOIN campaigns c ON c.id  = par."campaignId"
      WHERE py.status = 'completed'
        AND NOT EXISTS (
          SELECT 1 FROM transaction_allocations ta WHERE ta."paymentId" = py.id
        )
      ORDER BY COALESCE(py."paidAt", py."createdAt") DESC
    `) as any[];
  } catch {
    legacyRows = [];
  }

  const allRows = [...rows, ...legacyRows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  try {
    // Prisma raw queries can return BigInt/Decimal for numeric fields — convert everything to Number
    const safe = allRows.map(r => {
      const amount         = Number(r.amount ?? 0);
      const totalAllocated = Number(r.totalAllocated ?? 0);
      return {
        ...JSON.parse(JSON.stringify(r, (_, v) => typeof v === 'bigint' ? Number(v) : v)),
        amount,
        totalAllocated,
        credit: amount - totalAllocated,
      };
    });
    return NextResponse.json(safe, queryError ? { headers: { 'X-Query-Error': queryError } } : undefined);
  } catch (serr: any) {
    return NextResponse.json({ error: 'Erreur de sérialisation', detail: serr?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { session, error } = await requirePermission('payments');
  if (error) return error;

  const recordedById = (session!.user as any).id as string;
  const body = await req.json();
  const { clientId, amount, type, method, reference, note, allocations } = body;

  if (!clientId || !amount) {
    return NextResponse.json({ error: 'clientId et amount requis' }, { status: 400 });
  }

  try {
    const txId = crypto.randomUUID().replace(/-/g, '');

    await prisma.$executeRawUnsafe(
      `INSERT INTO transactions (id, "clientId", amount, type, method, reference, note, "recordedById", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      txId, clientId, Number(amount), type || 'payment', method || 'interac',
      reference || null, note || null, recordedById
    );

    for (const alloc of (allocations ?? []) as { paymentId: string; amount: number }[]) {
      if (!alloc.paymentId || !alloc.amount) continue;

      // Supplement pseudo-invoice: id starts with "sup_"
      if (alloc.paymentId.startsWith('sup_')) {
        const parcelId = alloc.paymentId.substring(4);
        await prisma.$executeRawUnsafe(
          `UPDATE parcels SET "adjustmentStatus" = 'paid' WHERE id = $1 AND "adjustmentStatus" = 'pending'`,
          parcelId
        );
        continue;
      }

      // Prevent overpayment: check remaining balance before allocating
      const payment = await prisma.payment.findUnique({
        where: { id: alloc.paymentId },
        select: { amount: true, status: true },
      });
      if (!payment) continue;

      const [existingRow] = await prisma.$queryRawUnsafe<any[]>(
        `SELECT COALESCE(SUM(amount), 0)::int AS total FROM transaction_allocations WHERE "paymentId" = $1`,
        alloc.paymentId
      );
      const alreadyAllocated = Number(existingRow.total);
      const remaining = payment.amount - alreadyAllocated;
      if (remaining <= 0) continue; // already fully paid
      const allocAmount = Math.min(Number(alloc.amount), remaining); // cap at remaining balance

      const allocId = crypto.randomUUID().replace(/-/g, '');
      await prisma.$executeRawUnsafe(
        `INSERT INTO transaction_allocations (id, "transactionId", "paymentId", amount) VALUES ($1, $2, $3, $4)`,
        allocId, txId, alloc.paymentId, allocAmount
      );

      // Mark payment completed if fully covered
      const [row] = await prisma.$queryRawUnsafe<any[]>(
        `SELECT COALESCE(SUM(amount), 0)::int AS total FROM transaction_allocations WHERE "paymentId" = $1`,
        alloc.paymentId
      );
      const totalAllocated = Number(row.total);
      if (totalAllocated >= payment.amount && payment.status !== 'completed') {
        await prisma.payment.update({
          where: { id: alloc.paymentId },
          data: { status: 'completed', paidAt: new Date(), interacRef: reference || undefined },
        });
      } else if (totalAllocated > 0 && totalAllocated < payment.amount && payment.status !== 'partial') {
        await prisma.payment.update({
          where: { id: alloc.paymentId },
          data: { status: 'partial' },
        });
      }
    }

    return NextResponse.json({ ok: true, transactionId: txId });
  } catch (e: any) {
    console.error('[transactions POST]', e);
    const msg = e?.message ?? 'Erreur serveur';
    const hint = msg.includes('does not exist')
      ? 'Tables non initialisées — visitez /api/db-migrate pour créer les tables.'
      : msg;
    return NextResponse.json({ error: hint }, { status: 500 });
  }
}
