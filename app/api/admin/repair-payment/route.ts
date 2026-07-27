export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

// One-shot: create a completed payment for parcels that have adjustmentStatus='paid'
// but no payment record (can happen when priceXaf was null at booking time).
// Call: POST /api/admin/repair-payment  { trackingCode: "JMS-99107" }
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { trackingCode } = await req.json();
  if (!trackingCode) return NextResponse.json({ error: 'trackingCode requis' }, { status: 400 });

  const parcel = await (prisma.parcel.findFirst as any)({
    where: { trackingCode },
    include: { payment: true },
  });

  if (!parcel) return NextResponse.json({ error: 'Colis introuvable' }, { status: 404 });

  if (parcel.payment) {
    return NextResponse.json({ ok: false, message: 'Un paiement existe déjà', paymentId: parcel.payment.id });
  }

  if (parcel.adjustmentStatus !== 'paid') {
    return NextResponse.json({ ok: false, message: `adjustmentStatus est "${parcel.adjustmentStatus}", pas "paid"` });
  }

  const amount = Math.round(Number(parcel.confirmedPriceXaf ?? parcel.priceXaf ?? 0));
  if (amount <= 0) {
    return NextResponse.json({ ok: false, message: 'Montant introuvable (confirmedPriceXaf et priceXaf sont null)' });
  }

  const payment = await prisma.payment.create({
    data: {
      parcelId: parcel.id,
      clientId: parcel.clientId,
      amount,
      status:  'completed',
      paidAt:  new Date(),
    },
  });

  return NextResponse.json({ ok: true, paymentId: payment.id, amount, trackingCode });
}
