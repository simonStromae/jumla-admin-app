export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

// Create a completed payment for parcels that have no payment record.
// Supports single or bulk:
//   POST { trackingCode: "JMS-99107" }
//   POST { trackingCodes: ["JMS-62042", "JMS-65120", ...] }
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const codes: string[] = body.trackingCodes
    ? body.trackingCodes
    : body.trackingCode
    ? [body.trackingCode]
    : [];

  if (codes.length === 0) return NextResponse.json({ error: 'trackingCode(s) requis' }, { status: 400 });

  const results = [];

  for (const trackingCode of codes) {
    const parcel = await (prisma.parcel.findFirst as any)({
      where: { trackingCode },
      include: { payment: true },
    });

    if (!parcel) {
      results.push({ trackingCode, ok: false, message: 'Colis introuvable' });
      continue;
    }

    if (parcel.payment) {
      results.push({ trackingCode, ok: false, message: 'Paiement déjà existant', paymentId: parcel.payment.id, existingAmount: parcel.payment.amount });
      continue;
    }

    const amount = Math.round(Number(parcel.confirmedPriceXaf ?? parcel.priceXaf ?? 0));
    if (amount <= 0) {
      results.push({ trackingCode, ok: false, message: 'Montant introuvable (priceXaf et confirmedPriceXaf sont null/0)' });
      continue;
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

    results.push({ trackingCode, ok: true, paymentId: payment.id, amount });
  }

  return NextResponse.json({ results });
}
