export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin, requirePermission } from '@/src/lib/api-auth';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  let rows: any[];
  try {
    rows = await prisma.$queryRawUnsafe(`
      SELECT
        t.id,
        t."clientId",
        t.amount,
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
              'amount',       ta.amount,
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
  } catch {
    // transactions table not yet created — run /api/_migrate
    rows = [];
  }

  return NextResponse.json(
    rows.map(r => ({
      ...r,
      credit: r.amount - r.totalAllocated,
    }))
  );
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

      const allocId = crypto.randomUUID().replace(/-/g, '');
      await prisma.$executeRawUnsafe(
        `INSERT INTO transaction_allocations (id, "transactionId", "paymentId", amount) VALUES ($1, $2, $3, $4)`,
        allocId, txId, alloc.paymentId, Number(alloc.amount)
      );

      // Mark payment completed if fully covered
      const [row] = await prisma.$queryRawUnsafe(
        `SELECT COALESCE(SUM(amount), 0)::int AS total FROM transaction_allocations WHERE "paymentId" = $1`,
        alloc.paymentId
      ) as any[];

      const payment = await prisma.payment.findUnique({
        where: { id: alloc.paymentId },
        select: { amount: true, status: true },
      });

      if (payment) {
        const totalAllocated = Number(row.total);
        if (totalAllocated >= payment.amount && payment.status !== 'completed') {
          await prisma.payment.update({
            where: { id: alloc.paymentId },
            data: { status: 'completed', paidAt: new Date(), interacRef: reference || undefined },
          });
        } else if (totalAllocated > 0 && totalAllocated < payment.amount && payment.status === 'pending') {
          await prisma.payment.update({
            where: { id: alloc.paymentId },
            data: { status: 'partial' as any },
          });
        }
      }
    }

    return NextResponse.json({ ok: true, transactionId: txId });
  } catch (e: any) {
    console.error('[transactions POST]', e);
    const msg = e?.message ?? 'Erreur serveur';
    const hint = msg.includes('does not exist')
      ? 'Tables non initialisées — visitez /api/_migrate pour créer les tables.'
      : msg;
    return NextResponse.json({ error: hint }, { status: 500 });
  }
}
