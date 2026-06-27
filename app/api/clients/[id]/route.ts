export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const client = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      parcels: {
        orderBy: { createdAt: 'desc' },
        include: {
          campaign: { select: { id: true, code: true, status: true } },
          payment:  { select: { id: true, status: true, amount: true } },
        },
      },
    },
  });

  if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });

  // Batch-fetch allocations for all payments
  const paymentIds = client.parcels.filter(p => p.payment).map(p => p.payment!.id);
  let allocMap: Record<string, number> = {};
  if (paymentIds.length > 0) {
    try {
      const rows = await prisma.$queryRawUnsafe<{ paymentId: string; allocated: number }[]>(
        `SELECT "paymentId", COALESCE(SUM(amount), 0)::int AS allocated
         FROM transaction_allocations
         WHERE "paymentId" = ANY($1::text[])
         GROUP BY "paymentId"`,
        paymentIds
      );
      for (const r of rows) allocMap[r.paymentId] = Number(r.allocated);
    } catch { /* tables may not exist yet */ }
  }

  const rawAddr  = client.addresses;
  const addresses = (Array.isArray(rawAddr) ? { saved: rawAddr } : ((rawAddr as any) ?? {}));
  const delivery  = addresses.delivery ?? {};

  return NextResponse.json({
    id:               client.id,
    name:             client.name,
    email:            client.email,
    phone:            client.phone,
    city:             client.city,
    whatsapp:         addresses.whatsapp ?? client.phone,
    deliveryName:     delivery.name    ?? '',
    deliveryAddress:  delivery.address ?? '',
    deliveryPhone:    delivery.phone   ?? '',
    savedAddresses:   Array.isArray(addresses.saved)      ? addresses.saved      : [],
    savedRecipients:  Array.isArray(addresses.recipients) ? addresses.recipients : [],
    createdAt:        client.createdAt,
    parcels: client.parcels.map(p => {
      const confirmedPriceXaf = (p as any).confirmedPriceXaf ?? null;
      const adjustmentStatus  = (p as any).adjustmentStatus  ?? 'none';
      const paymentStatus     = p.payment?.status ?? null;

      const rawAllocated = allocMap[p.payment?.id ?? ''] ?? 0;
      const allocated = paymentStatus === 'completed'
        ? Math.max(rawAllocated, p.payment!.amount)
        : rawAllocated;

      const suppAmt     = confirmedPriceXaf != null && p.priceXaf != null
        ? Math.max(0, confirmedPriceXaf - p.priceXaf)
        : 0;
      const suppPaid    = adjustmentStatus === 'paid'    ? suppAmt : 0;
      const suppPending = adjustmentStatus === 'pending' ? suppAmt : 0;

      const invoiced  = confirmedPriceXaf ?? p.payment?.amount ?? p.priceXaf ?? 0;
      const collected = allocated + suppPaid;
      const remaining = Math.max(0, invoiced - collected);

      const displayStatus =
        paymentStatus === 'completed' && adjustmentStatus === 'pending' ? 'paid_supp_pending' :
        paymentStatus === 'completed'                                   ? 'paid' :
        paymentStatus === 'partial'                                     ? 'partial' :
        paymentStatus === 'pending'                                     ? 'pending' : 'none';

      return {
        id:               p.id,
        trackingCode:     p.trackingCode,
        description:      p.description,
        weightKg:         p.weightKg,
        priceXaf:         p.priceXaf,
        confirmedPriceXaf,
        adjustmentStatus,
        status:           p.status,
        createdAt:        p.createdAt,
        campaign: {
          id:     p.campaign.id,
          code:   p.campaign.code,
          status: p.campaign.status,
        },
        paymentStatus,
        paid:         paymentStatus === 'completed',
        amount:       p.payment?.amount ?? p.priceXaf ?? 0,
        invoiced,
        allocated,
        suppAmt,
        suppPaid,
        suppPending,
        collected,
        remaining,
        displayStatus,
      };
    }),
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { name, email, phone, city, whatsapp, deliveryName, deliveryAddress, deliveryPhone } = await req.json();

  // Merge into existing addresses JSON
  const existing = await prisma.user.findUnique({ where: { id: params.id }, select: { addresses: true } });
  const prev = (existing?.addresses as any) ?? {};
  const addresses = {
    ...prev,
    ...(whatsapp !== undefined && { whatsapp: whatsapp || null }),
    delivery: {
      ...(prev.delivery ?? {}),
      ...(deliveryName    !== undefined && { name:    deliveryName    || null }),
      ...(deliveryAddress !== undefined && { address: deliveryAddress || null }),
      ...(deliveryPhone   !== undefined && { phone:   deliveryPhone   || null }),
    },
  };

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(name  !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(city  !== undefined && { city:  city  || null }),
      addresses,
    },
  });

  return NextResponse.json({ ok: true, id: user.id });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const parcelCount = await prisma.parcel.count({ where: { clientId: params.id } });
  if (parcelCount > 0) {
    return NextResponse.json(
      { error: 'Ce client a des colis enregistrés. Supprimez-les d\'abord.' },
      { status: 400 },
    );
  }

  await prisma.$transaction([
    prisma.message.deleteMany({ where: { OR: [{ senderId: params.id }, { recipientId: params.id }] } }),
    prisma.user.delete({ where: { id: params.id } }),
  ]);

  return NextResponse.json({ ok: true });
}
