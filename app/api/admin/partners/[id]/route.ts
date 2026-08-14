export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requirePermission } from '@/src/lib/api-auth';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('parcels');
  if (error) return error;

  const partner = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
      country: true,
      clientType: true,
      companyName: true,
      billingAddress: true,
      createdAt: true,
      parcels: {
        where: { OR: [{ deletedAt: null }, { status: 'ann' }] },
        select: {
          id: true,
          trackingCode: true,
          status: true,
          delivery: true,
          priceXaf: true,
          confirmedPriceXaf: true,
          weightKg: true,
          recipName: true,
          recipCity: true,
          createdAt: true,
          campaignId: true,
          campaign: {
            select: {
              id: true,
              code: true,
              status: true,
              departureDate: true,
              route: { select: { origin: true, destination: true, currency: true } },
            },
          },
          payment: { select: { status: true, amount: true, paidAt: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      invoices: {
        select: {
          id: true,
          number: true,
          amountXaf: true,
          status: true,
          notes: true,
          issuedAt: true,
          dueAt: true,
          paidAt: true,
          createdAt: true,
          campaign: { select: { id: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!partner) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Group parcels by campaign
  const campaignMap: Record<string, any> = {};
  for (const p of partner.parcels) {
    const cid = p.campaignId;
    if (!campaignMap[cid]) {
      campaignMap[cid] = {
        campaign: p.campaign,
        parcels: [],
      };
    }
    campaignMap[cid].parcels.push(p);
  }

  const campaigns = Object.values(campaignMap).sort((a: any, b: any) => {
    const aDate = new Date(a.parcels[0]?.createdAt ?? 0).getTime();
    const bDate = new Date(b.parcels[0]?.createdAt ?? 0).getTime();
    return bDate - aDate;
  });

  return NextResponse.json({ partner, campaigns, invoices: partner.invoices });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('parcels');
  if (error) return error;

  const body = await req.json();
  const allowed = ['companyName', 'billingAddress', 'clientType', 'phone', 'city'];
  const data: Record<string, any> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }
  // Admin explicitly chose a type → suppress the onboarding modal for the user
  if (body.clientType) data.clientTypeChosen = true;

  await (prisma.user.update as any)({ where: { id: params.id }, data });
  return NextResponse.json({ ok: true });
}
