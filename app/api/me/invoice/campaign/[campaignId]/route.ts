export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/api-auth';

export async function GET(_: NextRequest, { params }: { params: { campaignId: string } }) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId  = (session!.user as any).id;
  const isAdmin = ['admin', 'agent'].includes((session!.user as any).role ?? '');

  const campaign = await prisma.campaign.findUnique({
    where: { id: params.campaignId },
    include: { route: true },
  });
  if (!campaign) return NextResponse.json({ error: 'Cargaison introuvable' }, { status: 404 });

  const parcels = await prisma.parcel.findMany({
    where: {
      campaignId: params.campaignId,
      deletedAt: null,
      ...(isAdmin ? {} : { clientId: userId }),
    },
    include: {
      client:  { select: { id: true, name: true, phone: true, email: true, city: true } },
      payment: true,
      bordereaux: { orderBy: { createdAt: 'asc' } },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (parcels.length === 0) return NextResponse.json({ error: 'Aucun colis trouvé' }, { status: 404 });
  if (!isAdmin && !parcels.some(p => p.clientId === userId)) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  // Fetch allocations for all payments
  const paymentIds = parcels.filter(p => p.payment).map(p => p.payment!.id);
  let allocMap: Record<string, number> = {};
  if (paymentIds.length > 0) {
    try {
      const rows = await prisma.$queryRawUnsafe<{ paymentId: string; allocated: number }[]>(
        `SELECT "paymentId", COALESCE(SUM(amount), 0)::int AS allocated
         FROM transaction_allocations WHERE "paymentId" = ANY($1::text[])
         GROUP BY "paymentId"`,
        paymentIds
      );
      for (const r of rows) allocMap[r.paymentId] = Number(r.allocated);
    } catch {}
  }

  const client = parcels[0].client;

  const items = parcels.map(p => {
    const confirmedPriceXaf = (p as any).confirmedPriceXaf ?? null;
    const adjustmentStatus  = (p as any).adjustmentStatus  ?? 'none';
    const invoiced = (adjustmentStatus === 'paid' || adjustmentStatus === 'discount') && confirmedPriceXaf != null
      ? confirmedPriceXaf : (p.payment?.amount ?? p.priceXaf ?? 0);
    const rawAllocated = allocMap[p.payment?.id ?? ''] ?? 0;
    const allocated = p.payment?.status === 'completed'
      ? Math.max(rawAllocated, p.payment!.amount) : rawAllocated;
    const remaining = Math.max(0, invoiced - allocated);

    return {
      id:               p.id,
      trackingCode:     p.trackingCode,
      description:      p.description,
      weightKg:         p.weightKg,
      priceXaf:         p.priceXaf,
      confirmedPriceXaf,
      adjustmentStatus,
      status:           p.status,
      invoiced,
      allocated,
      remaining,
      paymentStatus:    p.payment?.status ?? null,
      paidAt:           p.payment?.paidAt ?? null,
      interacRef:       p.payment?.interacRef ?? null,
      bordereaux:       p.bordereaux.map(b => ({ id: b.id, code: (b as any).code, nbPieces: (b as any).nbPieces, weightKg: (b as any).weightKg })),
    };
  });

  const totalInvoiced  = items.reduce((s, i) => s + i.invoiced, 0);
  const totalAllocated = items.reduce((s, i) => s + i.allocated, 0);
  const totalRemaining = items.reduce((s, i) => s + i.remaining, 0);
  const totalWeight    = items.reduce((s, i) => s + (i.weightKg ?? 0), 0);
  const allPaid        = items.every(i => i.paymentStatus === 'completed');

  return NextResponse.json({
    invoiceNumber: `FAC-GRP-${campaign.code}`,
    issueDate:     new Date().toISOString(),
    campaign: {
      id:            campaign.id,
      code:          campaign.code,
      from:          (campaign as any).from ?? campaign.route?.from,
      to:            (campaign as any).to   ?? campaign.route?.to,
      departureDate: campaign.departureDate,
      arrivalDate:   campaign.arrivalDate,
      status:        campaign.status,
    },
    client: {
      name:  client.name,
      phone: client.phone,
      email: client.email,
      city:  client.city,
    },
    items,
    totalInvoiced,
    totalAllocated,
    totalRemaining,
    totalWeight:    Math.round(totalWeight * 10) / 10,
    allPaid,
    parcelsCount:   items.length,
  });
}
