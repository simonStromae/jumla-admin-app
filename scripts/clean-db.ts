// Uses Neon HTTP driver — no WebSocket or pg needed
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  // List users
  const users = await sql`SELECT id, name, email, role FROM users ORDER BY role, name`;
  console.log('\n=== UTILISATEURS ACTUELS ===');
  users.forEach(u => console.log(`  [${String(u.role).padEnd(5)}] ${String(u.name).padEnd(30)} ${u.email}`));

  const clientIds: string[] = users.filter(u => u.role === 'client').map(u => u.id as string);
  const keepCount = users.filter(u => u.role === 'admin' || u.role === 'agent').length;

  console.log(`\nÀ conserver : ${keepCount} (admin/agent)`);
  console.log(`À supprimer : ${clientIds.length} clients\n`);

  if (clientIds.length > 0) {
    // Delete in FK order
    const b = await sql`DELETE FROM bordereaux WHERE parcel_id IN (SELECT id FROM parcels WHERE client_id = ANY(${clientIds}))`;
    console.log(`Bordereaux supprimés      : ${b.length ?? '?'}`);

    await sql`DELETE FROM tracking_events WHERE parcel_id IN (SELECT id FROM parcels WHERE client_id = ANY(${clientIds}))`;
    console.log(`Tracking events supprimés`);

    await sql`DELETE FROM payments WHERE client_id = ANY(${clientIds})`;
    console.log(`Paiements supprimés`);

    await sql`DELETE FROM parcels WHERE client_id = ANY(${clientIds})`;
    console.log(`Colis supprimés`);

    await sql`DELETE FROM messages WHERE sender_id = ANY(${clientIds}) OR recipient_id = ANY(${clientIds})`;
    console.log(`Messages supprimés`);

    await sql`DELETE FROM users WHERE id = ANY(${clientIds})`;
    console.log(`Utilisateurs clients supprimés`);
  }

  // Delete campaigns with no parcels
  await sql`DELETE FROM campaign_costs WHERE campaign_id IN (SELECT id FROM campaigns WHERE id NOT IN (SELECT DISTINCT campaign_id FROM parcels WHERE campaign_id IS NOT NULL))`;
  await sql`DELETE FROM campaigns WHERE id NOT IN (SELECT DISTINCT campaign_id FROM parcels WHERE campaign_id IS NOT NULL)`;
  console.log(`Campagnes vides supprimées`);

  await sql`DELETE FROM whatsapp_logs WHERE parcel_id IS NULL`;
  console.log(`WhatsApp logs orphelins supprimés`);

  const remaining = await sql`SELECT name, email, role FROM users ORDER BY role, name`;
  console.log('\n=== COMPTES RESTANTS ===');
  remaining.forEach(u => console.log(`  [${u.role}] ${u.name} — ${u.email}`));
}

main().catch(console.error);
