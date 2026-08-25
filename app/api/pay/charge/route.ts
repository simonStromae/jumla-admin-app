export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/src/lib/api-auth';
import { prisma } from '@/src/lib/prisma';
import { chargeOpaqueData } from '@/src/lib/authorizeNet';

export async function POST(req: NextRequest) {
  let step = 'auth';
  try {
    const { error, session } = await requireAuth();
    if (error) return error;
    const clientId = (session!.user as any).id as string;

    step = 'parse-body';
    const body = await req.json();
    const { opaqueData, amountCad, parcelId, type, billTo } = body;

    if (!opaqueData?.dataDescriptor || !opaqueData?.dataValue) {
      return NextResponse.json({ error: 'Token de carte manquant' }, { status: 400 });
    }
    if (!amountCad || amountCad <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }
    if (!parcelId) {
      return NextResponse.json({ error: 'parcelId requis' }, { status: 400 });
    }

    step = 'find-parcel';
    const parcel = await prisma.parcel.findFirst({
      where: { id: parcelId, clientId },
      select: { id: true, trackingCode: true, priceXaf: true, confirmedPriceXaf: true, adjustmentStatus: true },
    });
    if (!parcel) {
      return NextResponse.json({ error: 'Colis introuvable' }, { status: 404 });
    }

    step = 'load-credentials';
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

    step = 'charge';
    console.log('[pay/charge] charging', { parcelId, amountCad, type, env: creds.environment });
    const description = `Jumla Cargo — ${parcel.trackingCode} (${type ?? 'paiement'})`;
    const result = await chargeOpaqueData(creds, opaqueData, Number(amountCad), description, billTo ?? undefined);
    console.log('[pay/charge] charge result', { success: result.success, error: result.error });

    if (!result.success) {
      return NextResponse.json({ error: result.error ?? 'Paiement refusé' }, { status: 402 });
    }

    // Charge succeeded — record in DB (errors here are non-fatal: card already charged)
    try {
      if (type === 'supplement') {
        await prisma.parcel.update({
          where: { id: parcelId },
          data:  { adjustmentStatus: 'paid' },
        });
        const txId = crypto.randomUUID().replace(/-/g, '');
        await prisma.$executeRawUnsafe(
          `INSERT INTO transactions (id, "clientId", amount, type, method, reference, note, "recordedById", "createdAt")
           VALUES ($1, $2, $3, 'payment', 'card', $4, $5, $6, NOW())`,
          txId, clientId, Math.round(Number(amountCad)),
          result.transactionId ?? '',
          `Supplément ${parcel.trackingCode} — carte ${result.cardType ?? ''} •••• ${result.last4 ?? ''}`,
          clientId,
        );
        const payment = await prisma.payment.findUnique({ where: { parcelId }, select: { id: true } });
        if (payment) {
          const allocId = crypto.randomUUID().replace(/-/g, '');
          await prisma.$executeRawUnsafe(
            `INSERT INTO transaction_allocations (id, "transactionId", "paymentId", amount) VALUES ($1, $2, $3, $4)`,
            allocId, txId, payment.id, Math.round(Number(amountCad)),
          );
        }
      } else {
        await (prisma.payment.upsert as any)({
          where:  { parcelId },
          update: { status: 'completed', paidAt: new Date(), interacRef: result.transactionId },
          create: {
            parcelId,
            clientId,
            amount:     Math.round(Number(amountCad)),
            status:     'completed',
            paidAt:     new Date(),
            interacRef: result.transactionId,
          },
        });
        const txId = crypto.randomUUID().replace(/-/g, '');
        await prisma.$executeRawUnsafe(
          `INSERT INTO transactions (id, "clientId", amount, type, method, reference, note, "recordedById", "createdAt")
           VALUES ($1, $2, $3, 'payment', 'card', $4, $5, $6, NOW())`,
          txId, clientId, Math.round(Number(amountCad)),
          result.transactionId ?? '',
          `Paiement ${parcel.trackingCode} — carte ${result.cardType ?? ''} •••• ${result.last4 ?? ''}`,
          clientId,
        );
        const payment = await prisma.payment.findUnique({ where: { parcelId }, select: { id: true } });
        if (payment) {
          const allocId = crypto.randomUUID().replace(/-/g, '');
          await prisma.$executeRawUnsafe(
            `INSERT INTO transaction_allocations (id, "transactionId", "paymentId", amount) VALUES ($1, $2, $3, $4)`,
            allocId, txId, payment.id, Math.round(Number(amountCad)),
          );
        }
      }
    } catch (dbErr: any) {
      console.error('[pay/charge] DB error after successful charge:', {
        transactionId: result.transactionId,
        parcelId,
        error: dbErr?.message ?? dbErr,
      });
      // Still return success — card was charged, we log for manual reconciliation
    }

    return NextResponse.json({
      ok:            true,
      transactionId: result.transactionId,
      authCode:      result.authCode,
      last4:         result.last4,
      cardType:      result.cardType,
    });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error(`[pay/charge] Error at step "${step}":`, msg);
    return NextResponse.json({ error: `Erreur étape ${step}: ${msg}` }, { status: 500 });
  }
}
