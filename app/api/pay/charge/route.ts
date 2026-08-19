export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/src/lib/api-auth';
import { prisma } from '@/src/lib/prisma';
import { chargeOpaqueData } from '@/src/lib/authorizeNet';

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;
  const clientId = (session!.user as any).id as string;

  const body = await req.json();
  const { opaqueData, amountCad, parcelId, type, billTo } = body;
  // type: 'booking' | 'supplement' | 'invoice'

  if (!opaqueData?.dataDescriptor || !opaqueData?.dataValue) {
    return NextResponse.json({ error: 'Token de carte manquant' }, { status: 400 });
  }
  if (!amountCad || amountCad <= 0) {
    return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
  }
  if (!parcelId) {
    return NextResponse.json({ error: 'parcelId requis' }, { status: 400 });
  }

  // Verify this parcel belongs to this client
  const parcel = await prisma.parcel.findFirst({
    where: { id: parcelId, clientId, deletedAt: null },
    select: { id: true, trackingCode: true, priceXaf: true, confirmedPriceXaf: true, adjustmentStatus: true },
  });
  if (!parcel) {
    return NextResponse.json({ error: 'Colis introuvable' }, { status: 404 });
  }

  // Load Authorize.net credentials from DB settings
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

  const description = `Jumla Cargo — ${parcel.trackingCode} (${type ?? 'paiement'})`;
  const result = await chargeOpaqueData(creds, opaqueData, Number(amountCad), description, billTo ?? undefined);

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? 'Paiement refusé' }, { status: 402 });
  }

  // Record the payment / mark adjustment as paid
  if (type === 'supplement') {
    // Mark adjustment as paid
    await prisma.parcel.update({
      where: { id: parcelId },
      data:  { adjustmentStatus: 'paid' },
    });
    // Record as transaction
    const txId = crypto.randomUUID().replace(/-/g, '');
    await prisma.$executeRawUnsafe(
      `INSERT INTO transactions (id, "clientId", amount, type, method, reference, note, "recordedById", "createdAt")
       VALUES ($1, $2, $3, 'payment', 'card', $4, $5, $6, NOW())`,
      txId, clientId, Math.round(Number(amountCad)),
      result.transactionId ?? '',
      `Supplément ${parcel.trackingCode} — carte ${result.cardType ?? ''} •••• ${result.last4 ?? ''}`,
      clientId,
    );
    const [allocId] = [crypto.randomUUID().replace(/-/g, '')];
    // Allocate to payment if exists
    const payment = await prisma.payment.findUnique({ where: { parcelId }, select: { id: true } });
    if (payment) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO transaction_allocations (id, "transactionId", "paymentId", amount) VALUES ($1, $2, $3, $4)`,
        allocId, txId, payment.id, Math.round(Number(amountCad)),
      );
    }
  } else {
    // booking or invoice — upsert Payment and mark completed
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
    // Record as transaction
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

  return NextResponse.json({
    ok:            true,
    transactionId: result.transactionId,
    authCode:      result.authCode,
    last4:         result.last4,
    cardType:      result.cardType,
  });
}
