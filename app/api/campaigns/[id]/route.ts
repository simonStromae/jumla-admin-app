export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin, requirePermission, mapCampaignStatus, toPrismaStatus } from '@/src/lib/api-auth';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const c = await prisma.campaign.findUnique({
    where: { id: params.id },
    include: {
      route: true,
      costs: true,
      parcels: {
        include: {
          client: { select: { id: true, name: true, email: true, phone: true, city: true } },
          payment: true,
          trackingEvents: { orderBy: { createdAt: 'desc' } },
          bordereaux: { orderBy: { createdAt: 'asc' } },
        },
      },
    },
  });

  if (!c) return NextResponse.json({ error: 'Cargaison introuvable' }, { status: 404 });

  return NextResponse.json({
    ...c,
    status: mapCampaignStatus(c.status),
    statusNotes: (c.statusNotes as any) ?? {},
    collected: c.parcels.reduce((s, p) =>
      s + (p.payment?.status === 'completed' ? p.payment.amount : 0), 0),
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('campaigns');
  if (error) return error;

  const body = await req.json();
  const { status, departureDate, arrivalDate, capacityKg, statusNote } = body;

  try {
    // status is now a plain TEXT column — Prisma can write it directly
    const prismaStatus = status ? toPrismaStatus(status) : undefined;

    // Update statusNotes for departure legs
    if (prismaStatus && statusNote && (prismaStatus === 'exp' || prismaStatus === 'tra')) {
      const existing = await prisma.campaign.findUnique({
        where: { id: params.id },
        select: { statusNotes: true },
      });
      const current = (existing?.statusNotes as any) ?? {};
      await prisma.campaign.update({
        where: { id: params.id },
        data:  { statusNotes: { ...current, [prismaStatus]: statusNote } },
      });
    }

    // Regular Prisma update (status is now String — no casting needed)
    const data: any = {};
    if (prismaStatus !== undefined)    data.status        = prismaStatus;
    if (departureDate !== undefined)   data.departureDate = departureDate ? new Date(departureDate) : null;
    if (arrivalDate   !== undefined)   data.arrivalDate   = arrivalDate   ? new Date(arrivalDate)   : null;
    if (capacityKg    !== undefined)   data.capacityKg    = capacityKg    ? Number(capacityKg)      : null;

    if (Object.keys(data).length > 0) {
      await prisma.campaign.update({ where: { id: params.id }, data });
    }

    // Cascade parcel statuses when campaign moves forward.
    // Only parcels that are "behind" or at the same stage are moved.
    // Parcels with individual exceptional statuses are never touched.
    if (prismaStatus) {
      const EXCEPTIONAL = ['adr', 'tdl', 'dom', 'cla', 'rte'];

      // For each campaign status: which parcel statuses should be bumped up
      const CASCADE: Record<string, string[]> = {
        exp: ['enr', 'rec', 'pre'],
        tra: ['enr', 'rec', 'pre', 'exp'],
        apd: ['enr', 'rec', 'pre', 'exp', 'tra'],
        dou: ['apd'],
        ins: ['dou'],
        ret: ['dou', 'ins'],
        lib: ['dou', 'ins', 'ret'],
        ard: ['exp', 'tra', 'apd', 'lib'],
        pdl: ['ard'],
        ok:  ['pdl'],
      };

      const fromStatuses = CASCADE[prismaStatus];
      if (fromStatuses) {
        await prisma.parcel.updateMany({
          where: {
            campaignId: params.id,
            status:     { in: fromStatuses, notIn: EXCEPTIONAL },
          },
          data: { status: prismaStatus },
        });
      }
    }

    // Re-fetch full updated campaign
    const updated = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: { route: true },
    });

    return NextResponse.json({
      ok: true,
      campaign: {
        ...updated,
        status:      mapCampaignStatus(updated!.status),
        statusNotes: (updated?.statusNotes as any) ?? {},
      },
    });
  } catch (e: any) {
    console.error('[campaigns PUT]', e);
    return NextResponse.json({ error: e?.message ?? 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('campaigns');
  if (error) return error;

  await prisma.campaign.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
