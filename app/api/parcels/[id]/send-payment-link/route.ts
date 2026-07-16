export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requirePermission } from '@/src/lib/api-auth';
import { sendWhatsappNotification, formatWhatsappNumber } from '@/src/lib/twilio';
import { renderWaTemplate } from '@/src/lib/wa-template';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('parcels');
  if (error) return error;

  const parcel = await prisma.parcel.findUnique({
    where: { id: params.id },
    include: {
      client:  { select: { name: true, phone: true, email: true } },
      payment: { select: { amount: true } },
    },
  });

  if (!parcel) return NextResponse.json({ error: 'Colis introuvable' }, { status: 404 });

  const clientPhone = parcel.client.phone || parcel.client.email;
  if (!clientPhone) {
    return NextResponse.json({ error: 'Numéro de téléphone du client introuvable' }, { status: 400 });
  }

  // Resolve payment email from settings
  const paymentEmailRow = await prisma.setting.findUnique({ where: { key: 'payment_email' } });
  const paymentEmail = paymentEmailRow?.value || 'paiement@jumla.cargo';

  // Build payment URL from request origin
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host  = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const paymentUrl = `${proto}://${host}/payer/${parcel.id}`;

  const firstName = parcel.client.name.split(' ')[0];
  const amount    = (parcel.payment?.amount ?? parcel.priceXaf ?? 0).toLocaleString('fr');

  const body = await renderWaTemplate('payment_link', {
    first_name:    firstName,
    parcel_code:   parcel.trackingCode,
    amount,
    payment_email: paymentEmail,
    payment_url:   paymentUrl,
  });

  try {
    await sendWhatsappNotification(
      clientPhone,
      body,
      parcel.id,
      'payment_link',
      { first_name: firstName, parcel_code: parcel.trackingCode, amount, payment_email: paymentEmail, payment_url: paymentUrl },
    );
    return NextResponse.json({ ok: true, sentTo: formatWhatsappNumber(clientPhone) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erreur envoi WhatsApp' }, { status: 500 });
  }
}
