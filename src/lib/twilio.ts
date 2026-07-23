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

function basicAuth(accountSid: string, authToken: string): string {
  const raw = `${accountSid}:${authToken}`;
  return 'Basic ' + btoa(raw);
}

export async function twilioVerify(accountSid: string, authToken: string) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`;
  const res  = await fetch(url, {
    headers: { Authorization: basicAuth(accountSid, authToken) },
  });
  const data = await res.json() as any;
  if (!res.ok) {
    throw Object.assign(
      new Error(data.message ?? `HTTP ${res.status}`),
      { code: data.code ?? res.status, httpStatus: res.status, raw: data }
    );
  }
  return data as { friendly_name: string; status: string };
}

export async function twilioSendWhatsapp(
  accountSid: string,
  authToken: string,
  from: string,
  to: string,
  body: string,
) {
  const url    = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const params = new URLSearchParams({
    From: from.startsWith('whatsapp:') ? from : 'whatsapp:' + from,
    To:   to.startsWith('whatsapp:')   ? to   : 'whatsapp:' + to,
    Body: body,
  });

  const res  = await fetch(url, {
    method:  'POST',
    headers: {
      Authorization:  basicAuth(accountSid, authToken),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  const data = await res.json() as any;
  if (!res.ok) {
    throw Object.assign(
      new Error(data.message ?? `HTTP ${res.status}`),
      { code: data.code ?? res.status }
    );
  }
  return data as { sid: string; status: string };
}

export async function twilioSendSms(
  accountSid: string,
  authToken: string,
  from: string,
  to: string,
  body: string,
) {
  const url    = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const clean  = (n: string) => n.replace(/^whatsapp:/i, '').replace(/\s/g, '');
  const params = new URLSearchParams({ From: clean(from), To: clean(to), Body: body });

  const res  = await fetch(url, {
    method:  'POST',
    headers: { Authorization: basicAuth(accountSid, authToken), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const data = await res.json() as any;
  if (!res.ok) throw Object.assign(new Error(data.message ?? `HTTP ${res.status}`), { code: data.code ?? res.status });
  return data as { sid: string; status: string };
}

// Send a pre-approved WhatsApp template (works without 24h session)
export async function twilioSendWhatsappTemplate(
  accountSid: string,
  authToken: string,
  from: string,
  to: string,
  contentSid: string,
  contentVariables: Record<string, string>,
) {
  const url    = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const params = new URLSearchParams({
    From:             from.startsWith('whatsapp:') ? from : 'whatsapp:' + from,
    To:               to.startsWith('whatsapp:')   ? to   : 'whatsapp:' + to,
    ContentSid:       contentSid,
    ContentVariables: JSON.stringify(contentVariables),
  });

  const res  = await fetch(url, {
    method:  'POST',
    headers: {
      Authorization:  basicAuth(accountSid, authToken),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  const data = await res.json() as any;
  if (!res.ok) {
    throw Object.assign(
      new Error(data.message ?? `HTTP ${res.status}`),
      { code: data.code ?? res.status }
    );
  }
  return data as { sid: string; status: string };
}

export function formatWhatsappNumber(phone: string): string {
  const clean = phone.trim().replace(/\s/g, '');
  // Already E.164 with +
  if (clean.startsWith('+')) return 'whatsapp:' + clean;
  // Already prefixed
  if (clean.startsWith('whatsapp:')) return clean;
  const digits = clean.replace(/\D/g, '');
  // 10-digit → North American (+1)
  // 11+ digits starting with 1 → North American (already has country code)
  // 11+ digits NOT starting with 1 → international (already has country code, just add +)
  if (digits.length === 10) return 'whatsapp:+1' + digits;
  if (digits.length >= 11 && digits.startsWith('1')) return 'whatsapp:+' + digits;
  return 'whatsapp:+' + digits;
}

// ─── Status label maps ─────────────────────────────────────────────────────

export const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  enr: 'Enregistrée',
  exp: 'Expédiée',
  tra: 'En transit',
  apd: 'Arrivée au pays de destination',
  dou: 'Présentée aux douanes',
  ins: 'En inspection douanière',
  ret: 'Retenue par les douanes',
  lib: 'Libérée par les douanes',
  ard: 'Arrivée à l\'entrepôt de destination',
  pdl: 'Prête pour livraison / retrait',
  ok:  'Terminée',
};

export const PARCEL_STATUS_LABELS: Record<string, string> = {
  enr: 'Enregistré',
  rec: 'Reçu à l\'entrepôt',
  pre: 'Vérifié et préparé',
  exp: 'Expédié',
  tra: 'En transit',
  apd: 'Arrivé au pays de destination',
  dou: 'Présenté aux douanes',
  ins: 'En inspection douanière',
  ret: 'Retenu par les douanes',
  lib: 'Libéré par les douanes',
  ard: 'Arrivé à l\'entrepôt de destination',
  ver: 'Vérification finale',
  pdl: 'Prêt pour livraison / retrait',
  liv: 'En cours de livraison',
  ok:  'Livré',
  adr: 'Avis de réception',
  tdl: 'Tentative de livraison échouée',
  dom: 'Problème de domicile',
  cla: 'En cours de classement',
  rte: 'Retour expéditeur',
};

// ─── Shared notification helper ────────────────────────────────────────────

export async function sendWhatsappNotification(
  phone:      string,
  message:    string,
  parcelId?:  string | null,
  templateId?: string,
  templateVars?: Record<string, string>,
): Promise<void> {
  const { accountSid, authToken, fromNumber } = await getTwilioSettings();
  if (!accountSid || !authToken || !fromNumber) return;
  const to = formatWhatsappNumber(phone);

  // Try template first if templateId provided
  let contentSid: string | null = null;
  if (templateId) {
    try {
      const { TWILIO_TEMPLATES } = await import('./wa-template');
      const tmpl = TWILIO_TEMPLATES[templateId];
      if (tmpl) {
        const row = await prisma.setting.findUnique({ where: { key: tmpl.settingKey } });
        contentSid = row?.value ?? null;
      }
    } catch { /* no template */ }
  }

  try {
    let result: { sid: string; status: string };

    if (contentSid && templateId && templateVars) {
      const { buildContentVariables } = await import('./wa-template');
      const contentVariables = buildContentVariables(templateId, templateVars) ?? {};
      result = await twilioSendWhatsappTemplate(accountSid, authToken, fromNumber, to, contentSid, contentVariables);
    } else {
      result = await twilioSendWhatsapp(accountSid, authToken, fromNumber, to, message);
    }

    await prisma.whatsappLog.create({
      data: { parcelId: parcelId ?? null, toPhone: to, body: message, status: result.status ?? 'queued', twilioSid: result.sid },
    }).catch(() => {});
  } catch (e: any) {
    await prisma.whatsappLog.create({
      data: { parcelId: parcelId ?? null, toPhone: to, body: message, status: 'failed', error: e?.message ?? 'Unknown' },
    }).catch(() => {});
  }
}
