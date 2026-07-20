export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  let rows: any[] = [];
  try {
    rows = await prisma.$queryRawUnsafe(`
      SELECT
        t.id,
        t."clientId",
        t.amount::numeric          AS amount,
        t.type,
        t.method,
        t.reference,
        t.note,
        t."createdAt",
        u.name                     AS "clientName",
        u.phone                    AS "clientPhone",
        u.email                    AS "clientEmail",
        u.city                     AS "clientCity",
        rb.name                    AS "recordedByName",
        COALESCE(
          json_agg(
            json_build_object(
              'paymentId',    ta."paymentId",
              'amount',       ta.amount::numeric,
              'trackingCode', par."trackingCode",
              'campaignCode', c.code,
              'priceXaf',     par."priceXaf",
              'clientName',   cu.name
            ) ORDER BY ta.id
          ) FILTER (WHERE ta.id IS NOT NULL),
          '[]'::json
        ) AS allocations
      FROM transactions t
      JOIN users u   ON u.id = t."clientId"
      LEFT JOIN users rb ON rb.id = t."recordedById"
      LEFT JOIN transaction_allocations ta ON ta."transactionId" = t.id
      LEFT JOIN payments py   ON py.id  = ta."paymentId"
      LEFT JOIN parcels par   ON par.id = py."parcelId"
      LEFT JOIN campaigns c   ON c.id   = par."campaignId"
      LEFT JOIN users cu      ON cu.id  = par."clientId"
      WHERE t.id = $1
      GROUP BY t.id, t."clientId", t.amount, t.type, t.method, t.reference, t.note, t."createdAt",
               u.name, u.phone, u.email, u.city, rb.name
    `, params.id) as any[];
  } catch {
    return NextResponse.json({ error: 'Transaction introuvable' }, { status: 404 });
  }

  if (!rows.length) return NextResponse.json({ error: 'Transaction introuvable' }, { status: 404 });

  const r = rows[0];
  return NextResponse.json({
    id:             r.id,
    amount:         Number(r.amount),
    type:           r.type,
    method:         r.method,
    reference:      r.reference ?? null,
    note:           r.note ?? null,
    createdAt:      r.createdAt,
    recordedByName: r.recordedByName ?? null,
    client: {
      id:    r.clientId,
      name:  r.clientName,
      phone: r.clientPhone ?? null,
      email: r.clientEmail ?? null,
      city:  r.clientCity  ?? null,
    },
    allocations: (Array.isArray(r.allocations) ? r.allocations : []).map((a: any) => ({
      paymentId:    a.paymentId,
      amount:       Number(a.amount),
      trackingCode: a.trackingCode,
      campaignCode: a.campaignCode,
    })),
  });
}
