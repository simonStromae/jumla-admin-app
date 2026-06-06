import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { name: true, phone: true, email: true } },
      parcel: {
        select: {
          trackingCode: true,
          campaign: { select: { code: true } },
        },
      },
    },
  });

  const result = payments.map(p => ({
    id:         p.id,
    date:       new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(p.createdAt),
    recipName:  p.client.name,
    recipPhone: p.client.phone ?? p.client.email,
    campaign:   p.parcel.campaign.code,
    parcel:     p.parcel.trackingCode,
    due:        p.amount,
    received:   p.status === 'completed' ? p.amount : 0,
    status:     p.status === 'completed' ? 'paid' : p.status === 'pending' ? 'pending' : 'unpaid',
    method:     'Virement Interac',
    interacRef: p.interacRef,
    paidAt:     p.paidAt,
    note:       '—',
    createdAt:  p.createdAt,
  }));

  return NextResponse.json(result);
}
