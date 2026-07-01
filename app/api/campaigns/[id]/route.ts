export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin, requirePermission, mapCampaignStatus, toPrismaStatus } from '@/src/lib/api-auth';
import { auth } from '@/auth';
import { sendWhatsappNotification, CAMPAIGN_STATUS_LABELS } from '@/src/lib/twilio';
import { renderWaTemplate } from '@/src/lib/wa-template';

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
  const { status, departureDate, arrivalDate, capacityKg, statusNote, code, routeId } = body;

  try {
    const prismaStatus = status ? toPrismaStatus(status) : undefined;

    // Campaign status order (for rollback detection)
    const STEPS_ORDER = ['enr', 'exp', 'tra', 'apd', 'dou', 'ins', 'ret', 'lib', 'ard', 'pdl', 'ok'];
    // Full parcel flow order (superset — includes individual steps)
    const PARCEL_FLOW = ['enr', 'rec', 'pre', 'exp', 'tra', 'apd', 'dou', 'ins', 'ret', 'lib', 'ard', 'ver', 'pdl', 'liv', 'ok'];

    // Always record timestamp (+ optional note) for every status transition
    const data: any = {};
    let oldStatus = 'enr';
    if (prismaStatus !== undefined) {
      data.status = prismaStatus;

      const existing = await prisma.campaign.findUnique({
        where: { id: params.id },
        select: { statusNotes: true, status: true },
      });
      oldStatus = existing?.status ?? 'enr';
      const current = (existing?.statusNotes as any) ?? {};
      data.statusNotes = {
        ...current,
        [prismaStatus]: { at: new Date().toISOString(), ...(statusNote ? { note: statusNote } : {}) },
      };
    }
    if (code          !== undefined) data.code          = code;
    if (routeId       !== undefined) data.routeId       = routeId;
    if (departureDate !== undefined) data.departureDate = departureDate ? new Date(departureDate) : null;
    if (arrivalDate   !== undefined) data.arrivalDate   = arrivalDate   ? new Date(arrivalDate)   : null;
    if (capacityKg    !== undefined) data.capacityKg    = capacityKg    ? Number(capacityKg)      : null;

    if (Object.keys(data).length > 0) {
      await prisma.campaign.update({ where: { id: params.id }, data });
    }

    // Cascade parcel statuses + create a tracking event per parcel.
    // Parcels with individual exceptional statuses are never touched.
    if (prismaStatus) {
      const EXCEPTIONAL = ['adr', 'tdl', 'dom', 'cla', 'rte'];
      const sess    = await auth();
      const adminId = (sess?.user as any)?.id ?? null;

      const oldIdx = STEPS_ORDER.indexOf(oldStatus);
      const newIdx = STEPS_ORDER.indexOf(prismaStatus);
      const isRollback = oldIdx >= 0 && newIdx >= 0 && newIdx < oldIdx;

      if (isRollback) {
        // Rollback: move parcels that are AHEAD of the new target back to it.
        // "Ahead" means their status appears after prismaStatus in PARCEL_FLOW.
        const targetPosInFlow = PARCEL_FLOW.indexOf(prismaStatus);
        const aheadStatuses = targetPosInFlow >= 0
          ? PARCEL_FLOW.slice(targetPosInFlow + 1)
          : [];

        if (aheadStatuses.length > 0) {
          const toRollback = await prisma.parcel.findMany({
            where: {
              campaignId: params.id,
              status:     { in: aheadStatuses, notIn: EXCEPTIONAL },
            },
            select: { id: true },
          });

          if (toRollback.length > 0) {
            const parcelIds = toRollback.map(p => p.id);
            await prisma.parcel.updateMany({
              where: { id: { in: parcelIds } },
              data:  { status: prismaStatus },
            });
            await prisma.trackingEvent.createMany({
              data: parcelIds.map(parcelId => ({
                parcelId,
                status:      prismaStatus,
                note:        statusNote ?? null,
                createdById: adminId,
              })),
            });
          }
        }
      } else {
        // Forward cascade: move parcels that are BEHIND the new target up to it.
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
          const toUpdate = await prisma.parcel.findMany({
            where: {
              campaignId: params.id,
              status:     { in: fromStatuses, notIn: EXCEPTIONAL },
            },
            select: { id: true },
          });

          if (toUpdate.length > 0) {
            const parcelIds = toUpdate.map(p => p.id);
            await prisma.parcel.updateMany({
              where: { id: { in: parcelIds } },
              data:  { status: prismaStatus },
            });
            await prisma.trackingEvent.createMany({
              data: parcelIds.map(parcelId => ({
                parcelId,
                status:      prismaStatus,
                note:        statusNote ?? null,
                createdById: adminId,
              })),
            });
          }
        }
      }
    }

    // Re-fetch full updated campaign
    const updated = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: { route: true },
    });

    // WhatsApp to all unique clients of this campaign when status changes
    if (prismaStatus && updated?.code) {
      const campaignParcels = await prisma.parcel.findMany({
        where:  { campaignId: params.id },
        select: { id: true, trackingCode: true, client: { select: { name: true, phone: true } } },
      });

      // One message per client phone (may have multiple parcels)
      const byPhone = new Map<string, { firstName: string; phone: string; codes: string[]; parcelId: string }>();
      for (const p of campaignParcels) {
        if (!p.client?.phone) continue;
        const key = p.client.phone;
        if (!byPhone.has(key)) {
          byPhone.set(key, { firstName: (p.client.name ?? 'Client').split(' ')[0], phone: p.client.phone, codes: [], parcelId: p.id });
        }
        byPhone.get(key)!.codes.push(p.trackingCode);
      }

      const statusLabel = CAMPAIGN_STATUS_LABELS[prismaStatus] ?? prismaStatus;
      for (const { firstName, phone, codes, parcelId } of byPhone.values()) {
        renderWaTemplate('auto_campaign_status', {
          first_name:    firstName,
          campaign_code: updated.code,
          status_label:  statusLabel,
          parcel_codes:  codes.join(', '),
        }).then(msg => sendWhatsappNotification(phone, msg, parcelId)).catch(() => {});
      }
    }

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
