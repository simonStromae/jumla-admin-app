export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requirePermission } from '@/src/lib/api-auth';

export async function GET() {
  const { error } = await requirePermission('parcels');
  if (error) return error;

  const partners = await prisma.user.findMany({
    where: {
      role: 'client',
      clientType: { in: ['commercial', 'partenaire'] },
      status: 'active',
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
      clientType: true,
      companyName: true,
      billingAddress: true,
      createdAt: true,
      parcels: {
        where: { OR: [{ deletedAt: null }, { status: 'ann' }] },
        select: {
          id: true,
          status: true,
          priceXaf: true,
          confirmedPriceXaf: true,
          createdAt: true,
          campaignId: true,
          campaign: { select: { id: true, code: true, status: true } },
          payment: { select: { status: true, amount: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      invoices: {
        select: { id: true, status: true, amountXaf: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const result = partners.map(p => {
    const activeParcels = p.parcels.filter(pk =>
      !['ok', 'ann'].includes(pk.status)
    );
    const totalAmount = p.parcels.reduce((s, pk) =>
      s + (pk.confirmedPriceXaf ?? pk.priceXaf ?? 0), 0
    );
    const paidAmount = p.parcels.reduce((s, pk) => {
      if (pk.payment?.status === 'completed') return s + (pk.payment.amount ?? 0);
      return s;
    }, 0);
    const campaigns = [...new Set(p.parcels.map(pk => pk.campaignId))].length;
    const lastActivity = p.parcels[0]?.createdAt ?? null;

    return {
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      city: p.city,
      clientType: p.clientType,
      companyName: p.companyName,
      billingAddress: p.billingAddress,
      createdAt: p.createdAt,
      stats: {
        totalParcels: p.parcels.length,
        activeParcels: activeParcels.length,
        campaigns,
        totalAmount,
        paidAmount,
        pendingAmount: totalAmount - paidAmount,
        pendingInvoices: p.invoices.filter(i => i.status !== 'paid').length,
      },
      lastActivity,
    };
  });

  return NextResponse.json(result);
}
