import { NextResponse } from 'next/server';
import { requireAdmin } from '@/src/lib/api-auth';
import { prisma } from '@/src/lib/prisma';

export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  // List users to determine what to keep
  const allUsers = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true } });
  const clientIds = allUsers.filter(u => u.role === 'client').map(u => u.id);

  if (clientIds.length > 0) {
    // Delete bordereaux of client parcels
    await prisma.bordereau.deleteMany({ where: { parcel: { clientId: { in: clientIds } } } });
    // Tracking events of client parcels
    await prisma.trackingEvent.deleteMany({ where: { parcel: { clientId: { in: clientIds } } } });
    // Payments
    await prisma.payment.deleteMany({ where: { clientId: { in: clientIds } } });
    // Parcels
    await prisma.parcel.deleteMany({ where: { clientId: { in: clientIds } } });
    // Messages involving deleted clients
    await prisma.message.deleteMany({
      where: { OR: [{ senderId: { in: clientIds } }, { recipientId: { in: clientIds } }] },
    });
    // Client users
    await prisma.user.deleteMany({ where: { id: { in: clientIds } } });
  }

  // Campaigns with no parcels
  await prisma.campaignCost.deleteMany({ where: { campaign: { parcels: { none: {} } } } });
  await prisma.campaign.deleteMany({ where: { parcels: { none: {} } } });

  // Orphan WhatsApp logs
  await prisma.whatsappLog.deleteMany({ where: { parcelId: null } });

  const remaining = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true } });

  return NextResponse.json({
    ok: true,
    deleted: { clients: clientIds.length },
    remaining,
  });
}
