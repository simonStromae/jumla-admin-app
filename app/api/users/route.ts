import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/src/lib/prisma';
import { requirePermission } from '@/src/lib/api-auth';
import { getTwilioSettings, twilioSendWhatsapp, formatWhatsappNumber } from '@/src/lib/twilio';

export const dynamic = 'force-dynamic';

function generateTempPassword(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `Jumla#${num}`;
}

export async function GET(req: Request) {
  const { error } = await requirePermission('agents');
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const roleParam = searchParams.get('role');

  const where: any = roleParam
    ? { role: roleParam }
    : { role: { in: ['admin', 'agent'] } };

  const users = await prisma.user.findMany({
    where,
    include: {
      _count: { select: { campaigns: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(users.map((u, i) => ({
    id:                u.id,
    name:              u.name,
    email:             u.email,
    phone:             u.phone,
    role:              u.role,
    status:            (u as any).status ?? 'active',
    city:              u.city ?? '—',
    country:           u.country,
    permissions:       u.permissions,
    campaigns:         u._count.campaigns,
    parcels:           0,
    collected:         0,
    createdAt:         u.createdAt,
    initials:          u.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
    color:             (i % 8) + 1,
    lastLogin:         new Date(u.createdAt).toLocaleDateString('fr-FR'),
    mustChangePassword: (u as any).mustChangePassword ?? false,
  })));
}

export async function POST(req: NextRequest) {
  const { error } = await requirePermission('agents');
  if (error) return error;

  const { name, email, phone, city, role, permissions, sendInvite } = await req.json();
  if (!name || !email) return NextResponse.json({ error: 'Nom et email requis' }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: 'Email déjà utilisé' }, { status: 409 });

  const tempPassword = generateTempPassword();
  const tempHash = await bcrypt.hash(tempPassword, 10);

  const user = await prisma.user.create({
    data: {
      name, email,
      phone:              phone  || null,
      city:               city   || null,
      role:               (role  || 'agent') as any,
      permissions:        permissions || {},
      passwordHash:       tempHash,
      emailVerified:      true,
      mustChangePassword: true,
    } as any,
  });

  // Try to send temp password via WhatsApp if phone provided and sendInvite checked
  let whatsappSent = false;
  let whatsappError = '';
  if (sendInvite && phone) {
    try {
      const { accountSid, authToken, fromNumber } = await getTwilioSettings();
      if (accountSid && authToken && fromNumber) {
        const firstName = name.split(' ')[0];
        const msgBody = `Bonjour ${firstName} 👋\n\nVous êtes invité(e) à rejoindre *Jumla Shipping* en tant qu'${role === 'admin' ? 'Administrateur' : 'Agent'}.\n\n🔑 Mot de passe temporaire : *${tempPassword}*\n\n🌐 Connectez-vous sur : jumla.app\n\nVous devrez changer ce mot de passe à la première connexion.`;
        await twilioSendWhatsapp(accountSid, authToken, fromNumber, formatWhatsappNumber(phone), msgBody);
        whatsappSent = true;
      }
    } catch (e: any) {
      whatsappError = e?.message ?? 'Erreur WhatsApp';
    }
  }

  return NextResponse.json({
    ok: true,
    id: user.id,
    tempPassword: whatsappSent ? undefined : tempPassword,
    whatsappSent,
    whatsappError: whatsappError || undefined,
  });
}
