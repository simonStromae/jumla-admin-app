export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';
import { getTwilioSettings } from '@/src/lib/twilio';
import { TWILIO_TEMPLATES } from '@/src/lib/wa-template';

function contentAuth(accountSid: string, authToken: string) {
  return 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
}

// GET — list all templates with their SID and approval status
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const { accountSid, authToken } = await getTwilioSettings();

  // Load stored SIDs from DB
  const keys = Object.values(TWILIO_TEMPLATES).map(t => t.settingKey);
  const rows = await prisma.setting.findMany({ where: { key: { in: keys } } });
  const storedSids: Record<string, string> = {};
  for (const r of rows) storedSids[r.key] = r.value;

  const results = await Promise.all(
    Object.entries(TWILIO_TEMPLATES).map(async ([id, tmpl]) => {
      const contentSid = storedSids[tmpl.settingKey] ?? null;
      let approvalStatus = 'not_created';
      let approvalName = null;

      if (contentSid && accountSid && authToken) {
        try {
          const res  = await fetch(
            `https://content.twilio.com/v1/Content/${contentSid}/ApprovalRequests`,
            { headers: { Authorization: contentAuth(accountSid, authToken) } },
          );
          if (res.ok) {
            const data = await res.json() as any;
            const wa   = data.whatsapp;
            approvalStatus = wa?.status ?? 'pending';
            approvalName   = wa?.name   ?? null;
          }
        } catch { approvalStatus = 'unknown'; }
      }

      return {
        id,
        label:         Object.values(require('@/src/lib/wa-template').WA_DEFAULTS).find((_: any, i: number) =>
          Object.keys(require('@/src/lib/wa-template').WA_DEFAULTS)[i] === id
        ) ? (require('@/src/lib/wa-template').WA_DEFAULTS[id]?.label ?? id) : id,
        friendlyName:  tmpl.friendlyName,
        settingKey:    tmpl.settingKey,
        contentSid,
        approvalStatus,
        approvalName,
      };
    })
  );

  return NextResponse.json(results);
}

// POST — create missing templates in Twilio Content API + submit for approval
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { accountSid, authToken } = await getTwilioSettings();
  if (!accountSid || !authToken) {
    return NextResponse.json({ error: 'Twilio non configuré' }, { status: 503 });
  }

  const body = await req.json() as { ids?: string[] };
  const idsToCreate = body.ids ?? Object.keys(TWILIO_TEMPLATES);

  const results: Record<string, { ok: boolean; contentSid?: string; error?: string; approval?: string }> = {};

  for (const id of idsToCreate) {
    const tmpl = TWILIO_TEMPLATES[id];
    if (!tmpl) { results[id] = { ok: false, error: 'Template inconnu' }; continue; }

    // Check if already stored
    const existing = await prisma.setting.findUnique({ where: { key: tmpl.settingKey } });
    if (existing?.value) {
      results[id] = { ok: true, contentSid: existing.value, approval: 'already_registered' };
      continue;
    }

    try {
      // 1. Create content template
      const createRes = await fetch('https://content.twilio.com/v1/Content', {
        method:  'POST',
        headers: {
          Authorization:  contentAuth(accountSid, authToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          friendly_name: tmpl.friendlyName,
          language:      'fr',
          variables:     tmpl.sampleVars,
          types: {
            'twilio/text': { body: tmpl.body },
          },
        }),
      });
      const createData = await createRes.json() as any;
      if (!createRes.ok) {
        results[id] = { ok: false, error: createData.message ?? `HTTP ${createRes.status}` };
        continue;
      }

      const contentSid = createData.sid as string;

      // 2. Store SID in DB
      await prisma.setting.upsert({
        where:  { key: tmpl.settingKey },
        create: { key: tmpl.settingKey, value: contentSid },
        update: { value: contentSid },
      });

      // 3. Submit for WhatsApp approval
      const approvalRes = await fetch(
        `https://content.twilio.com/v1/Content/${contentSid}/ApprovalRequests/whatsapp`,
        {
          method:  'POST',
          headers: {
            Authorization:  contentAuth(accountSid, authToken),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: tmpl.friendlyName, category: 'UTILITY' }),
        },
      );
      const approvalData = await approvalRes.json() as any;
      const approvalStatus = approvalRes.ok ? (approvalData.status ?? 'pending') : 'approval_failed';

      results[id] = { ok: true, contentSid, approval: approvalStatus };
    } catch (e: any) {
      results[id] = { ok: false, error: e?.message ?? 'Erreur inconnue' };
    }
  }

  return NextResponse.json({ ok: true, results });
}
