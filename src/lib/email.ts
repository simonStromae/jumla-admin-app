import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, name: string, code: string) {
  if (!process.env.RESEND_API_KEY) {
    // No API key — skip silently (code still returned in dev mode)
    return;
  }
  await resend.emails.send({
    from: 'Jumla Shipping <no-reply@jumla.cargo>',
    to: email,
    subject: 'Votre code de vérification Jumla',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <div style="background:#1a1408;padding:24px 32px;border-radius:12px 12px 0 0">
          <div style="color:#F5A524;font-size:22px;font-weight:800">Jumla Shipping</div>
          <div style="color:rgba(255,255,255,.5);font-size:12px;margin-top:2px">Fret international · Douala → Montréal</div>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
          <p style="margin:0 0 8px;font-size:16px;color:#111">Bonjour <strong>${name}</strong>,</p>
          <p style="margin:0 0 24px;font-size:14px;color:#6b7280">Voici votre code de vérification pour activer votre compte Jumla :</p>
          <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px">
            <div style="font-size:36px;font-weight:800;letter-spacing:10px;color:#1a1408">${code}</div>
          </div>
          <p style="margin:0;font-size:12px;color:#9ca3af">Ce code expire dans 15 minutes. Ne le partagez pas.</p>
        </div>
      </div>
    `,
  });
}
