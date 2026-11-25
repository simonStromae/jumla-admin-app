export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/api-auth';
import { Resend } from 'resend';

const TYPES: Record<string, string> = {
  retard:   'Retard de livraison',
  endommage: 'Colis endommagé',
  perdu:    'Colis perdu',
  autre:    'Autre problème',
};

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const user = session!.user as any;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });

  const { trackingCode, type, message } = body;
  if (!type || !message?.trim()) {
    return NextResponse.json({ error: 'Type et message requis' }, { status: 400 });
  }
  if (!TYPES[type]) {
    return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: 'Message trop long (max 2000 caractères)' }, { status: 400 });
  }

  // Verify parcel belongs to user if code provided
  let parcelInfo = '';
  if (trackingCode?.trim()) {
    const parcel = await prisma.parcel.findFirst({
      where: { trackingCode: trackingCode.trim().toUpperCase(), clientId: user.id },
      select: { trackingCode: true, status: true },
    });
    if (parcel) {
      parcelInfo = `Colis : ${parcel.trackingCode} (statut : ${parcel.status})`;
    }
  }

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const adminEmail = process.env.RECLAMATION_EMAIL ?? process.env.RESEND_FROM_EMAIL?.replace(/.*<(.+)>/, '$1') ?? 'incjumla@gmail.com';
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'Jumla Shipping <onboarding@resend.dev>',
      to: adminEmail,
      replyTo: user.email,
      subject: `📋 Réclamation [${TYPES[type]}] — ${user.name ?? user.email}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <div style="background:linear-gradient(135deg,#0D2E6E 0%,#1B4FD8 100%);padding:20px 28px;border-radius:12px 12px 0 0">
            <div style="color:#00B4D8;font-size:18px;font-weight:800">📋 Nouvelle réclamation</div>
            <div style="color:rgba(255,255,255,.5);font-size:12px;margin-top:2px">Jumla Shipping — espace client</div>
          </div>
          <div style="background:#fff;padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
            <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
              <tr><td style="padding:6px 0;color:#9ca3af;width:140px">Client</td><td style="padding:6px 0;font-weight:600;color:#111">${user.name ?? '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#9ca3af">Email</td><td style="padding:6px 0;font-weight:600;color:#111">${user.email}</td></tr>
              <tr><td style="padding:6px 0;color:#9ca3af">Type</td><td style="padding:6px 0;font-weight:700;color:#DC2626">${TYPES[type]}</td></tr>
              ${parcelInfo ? `<tr><td style="padding:6px 0;color:#9ca3af">Colis</td><td style="padding:6px 0;font-weight:600;color:#111">${parcelInfo}</td></tr>` : ''}
            </table>
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;font-size:13px;color:#374151;line-height:1.6;white-space:pre-wrap">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          </div>
        </div>
      `,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
