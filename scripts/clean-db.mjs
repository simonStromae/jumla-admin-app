import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: { role: 'asc' },
  });

  console.log('\n=== UTILISATEURS ACTUELS ===');
  users.forEach(u => console.log(`  [${u.role.padEnd(5)}] ${u.name.padEnd(30)} ${u.email}`));

  const keepers = users.filter(u => u.role === 'admin' || u.role === 'agent');
  const toDelete = users.filter(u => u.role === 'client');

  console.log(`\nÀ conserver : ${keepers.length} (admin/agent)`);
  console.log(`À supprimer : ${toDelete.length} clients\n`);

  if (toDelete.length === 0 && users.length === keepers.length) {
    console.log('Rien à supprimer côté users.');
  }

  const deleteIds = toDelete.map(u => u.id);

  // Delete in FK order
  const [bordereaux, trackingEvents, payments, parcels, campaignCosts, campaigns, messages, whatsappLogs] = await prisma.$transaction([
    // Bordereaux (dépend Parcel)
    prisma.bordereau.deleteMany({ where: { parcel: { clientId: { in: deleteIds } } } }),
    // TrackingEvents liés aux colis de ces clients
    prisma.trackingEvent.deleteMany({ where: { parcel: { clientId: { in: deleteIds } } } }),
    // Payments
    prisma.payment.deleteMany({ where: { clientId: { in: deleteIds } } }),
    // Parcels
    prisma.parcel.deleteMany({ where: { clientId: { in: deleteIds } } }),
    // CampaignCosts (campaigns sans colis)
    prisma.campaignCost.deleteMany({ where: { campaign: { parcels: { none: {} } } } }),
    // Campaigns vides
    prisma.campaign.deleteMany({ where: { parcels: { none: {} } } }),
    // Messages
    prisma.message.deleteMany({
      where: { OR: [{ senderId: { in: deleteIds } }, { recipientId: { in: deleteIds } }] },
    }),
    // WhatsappLogs orphelins
    prisma.whatsappLog.deleteMany({ where: { parcelId: null } }),
  ]);

  // Now delete the client users
  const deleted = await prisma.user.deleteMany({ where: { id: { in: deleteIds } } });

  console.log('=== RÉSULTAT ===');
  console.log(`  Bordereaux supprimés     : ${bordereaux.count}`);
  console.log(`  Tracking events supprimés: ${trackingEvents.count}`);
  console.log(`  Paiements supprimés      : ${payments.count}`);
  console.log(`  Colis supprimés          : ${parcels.count}`);
  console.log(`  Coûts campagnes supprimés: ${campaignCosts.count}`);
  console.log(`  Campagnes supprimées     : ${campaigns.count}`);
  console.log(`  Messages supprimés       : ${messages.count}`);
  console.log(`  WhatsApp logs supprimés  : ${whatsappLogs.count}`);
  console.log(`  Utilisateurs supprimés   : ${deleted.count}`);

  const remaining = await prisma.user.findMany({ select: { name: true, email: true, role: true } });
  console.log('\n=== COMPTES RESTANTS ===');
  remaining.forEach(u => console.log(`  [${u.role}] ${u.name} — ${u.email}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
