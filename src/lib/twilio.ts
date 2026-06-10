import { prisma } from './prisma';

export async function getTwilioSettings() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_FROM'] } },
  });
  const m: Record<string, string> = {};
  for (const r of rows) m[r.key] = r.value;
  return {
    accountSid: m['TWILIO_ACCOUNT_SID']   || process.env.TWILIO_ACCOUNT_SID   || '',
    authToken:  m['TWILIO_AUTH_TOKEN']    || process.env.TWILIO_AUTH_TOKEN    || '',
    fromNumber: m['TWILIO_WHATSAPP_FROM'] || process.env.TWILIO_WHATSAPP_FROM || '',
  };
}

function basicAuth(accountSid: string, authToken: string) {
  return 'Basic ' + Buffer.from(accountSid + ':' + authToken).toString('base64');
}

export async function twilioVerify(accountSid: string, authToken: string) {
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
    { headers: { Authorization: basicAuth(accountSid, authToken) } }
  );
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.message ?? 'Authentication failed'), { code: data.code });
  return data as { friendly_name: string; status: string };
}

export async function twilioSendWhatsapp(
  accountSid: string,
  authToken: string,
  from: string,
  to: string,
  body: string,
) {
  const params = new URLSearchParams({
    From: from.startsWith('whatsapp:') ? from : 'whatsapp:' + from,
    To:   to.startsWith('whatsapp:')   ? to   : 'whatsapp:' + to,
    Body: body,
  });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method:  'POST',
      headers: {
        Authorization:  basicAuth(accountSid, authToken),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }
  );
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.message ?? 'Send failed'), { code: data.code });
  return data as { sid: string; status: string };
}

export function formatWhatsappNumber(phone: string): string {
  const clean = phone.trim();
  if (clean.startsWith('+')) return 'whatsapp:' + clean.replace(/\s/g, '');
  const digits = clean.replace(/\D/g, '');
  const e164 = digits.startsWith('1') ? '+' + digits : '+1' + digits;
  return 'whatsapp:' + e164;
}
