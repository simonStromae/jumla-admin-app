import twilio from 'twilio';
import { prisma } from './prisma';

export async function getTwilioSettings() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_FROM'] } },
  });
  const m: Record<string, string> = {};
  for (const r of rows) m[r.key] = r.value;
  return {
    accountSid:  m['TWILIO_ACCOUNT_SID']    || process.env.TWILIO_ACCOUNT_SID    || '',
    authToken:   m['TWILIO_AUTH_TOKEN']     || process.env.TWILIO_AUTH_TOKEN     || '',
    fromNumber:  m['TWILIO_WHATSAPP_FROM']  || process.env.TWILIO_WHATSAPP_FROM  || '',
  };
}

export async function getTwilioClient() {
  const { accountSid, authToken } = await getTwilioSettings();
  if (!accountSid || !authToken) return null;
  return twilio(accountSid, authToken);
}

export function formatWhatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, '');
  const e164 = digits.startsWith('1') ? '+' + digits : '+1' + digits;
  return 'whatsapp:' + e164;
}
