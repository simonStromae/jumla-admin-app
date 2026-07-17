export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/src/lib/prisma';
import { requirePermission } from '@/src/lib/api-auth';
import { getTwilioSettings, twilioSendWhatsapp, twilioSendWhatsappTemplate, formatWhatsappNumber } from '@/src/lib/twilio';
import { TWILIO_TEMPLATES, buildContentVariables } from '@/src/lib/wa-template';

function generateTempPassword(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `Jumla#${num}`;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requirePermission('agents');
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, phone: true, role: true },
  });
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

  const tempPassword = generateTempPassword();
  const tempHash = await bcrypt.hash(tempPassword, 10);

  await prisma.user.update({
    where:  { id: params.id },
    data:   { passwordHash: tempHash, mustChangePassword: true } as any,
  });

  // Try WhatsApp
  let whatsappSent = false;
  let whatsappError = '';
  const { sendWhatsapp } = await req.json().catch(() => ({ sendWhatsapp: false }));

  if (sendWhatsapp && user.phone) {
    try {
      const { accountSid, authToken, fromNumber } = await getTwilioSettings();
      if (accountSid && authToken && fromNumber) {
        const firstName  = user.name.split(' ')[0];
        const roleLabel  = user.role === 'admin' ? 'Administrateur' : user.role === 'driver' ? 'Livreur' : 'Agent';
        const to         = formatWhatsappNumber(user.phone);
        const tmpl       = TWILIO_TEMPLATES['invite_staff'];
        const sidRow     = tmpl ? await prisma.setting.findUnique({ where: { key: tmpl.settingKey } }) : null;
        const contentSid = sidRow?.value ?? null;

        if (contentSid && tmpl) {
          const vars = buildContentVariables('invite_staff', {
            first_name: firstName, role_label: roleLabel, temp_password: tempPassword,
          }) ?? {};
          await twilioSendWhatsappTemplate(accountSid, authToken, fromNumber, to, contentSid, vars);
        } else {
          const msg = `Bonjour ${firstName} 👋\n\nVotre mot de passe *Jumla Shipping* a été réinitialisé.\n\n🔑 Nouveau mot de passe temporaire : *${tempPassword}*\n\nVous devrez le changer à la prochaine connexion.`;
          await twilioSendWhatsapp(accountSid, authToken, fromNumber, to, msg);
        }
        whatsappSent = true;
      }
    } catch (e: any) {
      whatsappError = e?.message ?? 'Erreur WhatsApp';
    }
  }

  return NextResponse.json({ ok: true, tempPassword, whatsappSent, whatsappError: whatsappError || undefined });
}
