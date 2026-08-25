export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { chargeOpaqueData } from '@/src/lib/authorizeNet';

async function resolveToken(token: string) {
  const settings = await prisma.setting.findMany({
    where: { key: { endsWith: `:${token}` } },
  });
  const row = settings.find(s => s.key.startsWith('plink:parcel:'));
  if (!row) return null;
  try {
    const meta = JSON.parse(row.value) as { parcelId: string; expiresAt: string };
    if (new Date(meta.expiresAt) < new Date()) return null;
    return meta.parcelId;
  } catch { return null; }
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const parcelId = await resolveToken(params.token);
    if (!parcelId) return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 404 });

    const parcel = await prisma.parcel.findUnique({
      where: { id: parcelId },
      include: { payment: true },
    });
    if (!parcel) return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 404 });

    if (parcel.payment?.status === 'completed') {
      return NextResponse.json({ error: 'Ce colis a déjà été payé.' }, { status: 409 });
    }

    const body = await req.json();
    const { opaqueData } = body;
    if (!opaqueData?.dataDescriptor || !opaqueData?.dataValue) {
      return NextResponse.json({ error: 'Token de carte manquant' }, { status: 400 });
    }

    const amountCad = parcel.payment?.amount ?? parcel.priceXaf ?? 0;
    if (!amountCad || amountCad <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }

    const rows = await prisma.setting.findMany({
      where: { key: { in: ['authnet_login_id', 'authnet_transaction_key', 'authnet_environment'] } },
    });
    const m: Record<string, string> = {};
    for (const r of rows) m[r.key] = r.value;

    if (!m.authnet_login_id || !m.authnet_transaction_key) {
      return NextResponse.json({ error: 'Paiement par carte non configuré' }, { status: 503 });
    }

    const creds = {
      loginId:        m.authnet_login_id,
      transactionKey: m.authnet_transaction_key,
      environment:    (m.authnet_environment === 'production' ? 'production' : 'sandbox') as 'sandbox' | 'production',
    };

    const result = await chargeOpaqueData(
      creds,
      opaqueData,
      amountCad,
      `Jumla Cargo — ${parcel.trackingCode}`,
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error ?? 'Paiement refusé' }, { status: 402 });
    }

    // Charge succeeded — record in DB (errors here are non-fatal: card already charged)
    try {
      await (prisma.payment.upsert as any)({
        where:  { parcelId: parcel.id },
        update: { status: 'completed', paidAt: new Date(), interacRef: result.transactionId },
        create: {
          parcelId:   parcel.id,
          clientId:   parcel.clientId,
          amount:     amountCad,
          status:     'completed',
          paidAt:     new Date(),
          interacRef: result.transactionId,
        },
      });

      const txId = crypto.randomUUID().replace(/-/g, '');
      await prisma.$executeRawUnsafe(
        `INSERT INTO transactions (id, "clientId", amount, type, method, reference, note, "recordedById", "createdAt")
         VALUES ($1, $2, $3, 'payment', 'card', $4, $5, $6, NOW())`,
        txId, parcel.clientId, amountCad,
        result.transactionId ?? '',
        `Paiement lien public ${parcel.trackingCode} — carte ${result.cardType ?? ''} •••• ${result.last4 ?? ''}`,
        parcel.clientId,
      );

      const payment = await prisma.payment.findUnique({ where: { parcelId: parcel.id }, select: { id: true } });
      if (payment) {
        const allocId = crypto.randomUUID().replace(/-/g, '');
        await prisma.$executeRawUnsafe(
          `INSERT INTO transaction_allocations (id, "transactionId", "paymentId", amount) VALUES ($1, $2, $3, $4)`,
          allocId, txId, payment.id, amountCad,
        );
      }
    } catch (dbErr: any) {
      console.error('[public/payment/charge] DB error after successful charge:', {
        transactionId: result.transactionId,
        parcelId: parcel.id,
        error: dbErr?.message ?? dbErr,
      });
      // Still return success — card was charged, we log for manual reconciliation
    }

    return NextResponse.json({
      ok:            true,
      transactionId: result.transactionId,
      last4:         result.last4,
      cardType:      result.cardType,
    });
  } catch (err: any) {
    console.error('[public/payment/charge] Unexpected error:', err?.message ?? err);
    return NextResponse.json({ error: 'Erreur serveur inattendue' }, { status: 500 });
  }
}
