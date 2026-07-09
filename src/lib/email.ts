import { Resend } from 'resend';

const HEADER = `
  <div style="background:linear-gradient(135deg,#0D2E6E 0%,#1B4FD8 100%);padding:24px 32px;border-radius:12px 12px 0 0">
    <div style="color:#00B4D8;font-size:22px;font-weight:800;font-family:sans-serif">Jumla Shipping</div>
    <div style="color:rgba(255,255,255,.5);font-size:12px;margin-top:2px;font-family:sans-serif">Fret international · Douala ↔ Montréal</div>
  </div>
`;

const FOOTER_TEXT = `<p style="margin:0;font-size:12px;color:#9ca3af;font-family:sans-serif">
  Vous recevez cet email car vous êtes client Jumla Shipping. Pour toute question : info@jumlas.com · +1 514 998 0709
</p>`;

export async function sendVerificationEmail(email: string, name: string, code: string) {
  if (!process.env.RESEND_API_KEY) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'Jumla Shipping <onboarding@resend.dev>',
    to: email,
    subject: 'Votre code de vérification Jumla',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        ${HEADER}
        <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
          <p style="margin:0 0 8px;font-size:16px;color:#111">Bonjour <strong>${name}</strong>,</p>
          <p style="margin:0 0 24px;font-size:14px;color:#6b7280">Voici votre code de vérification pour activer votre compte Jumla :</p>
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px">
            <div style="font-size:36px;font-weight:800;letter-spacing:10px;color:#1B4FD8;font-family:monospace">${code}</div>
          </div>
          <p style="margin:0 0 16px;font-size:12px;color:#9ca3af">Ce code expire dans 15 minutes. Ne le partagez pas.</p>
          ${FOOTER_TEXT}
        </div>
      </div>
    `,
  });
}

const STATUS_LABELS: Record<string, { label: string; icon: string }> = {
  enr: { label: 'Colis enregistré',             icon: '📝' },
  rec: { label: "Reçu à l'entrepôt",            icon: '📥' },
  pre: { label: 'Vérifié et préparé',            icon: '🔍' },
  exp: { label: 'Expédié',                       icon: '🚀' },
  tra: { label: 'En transit',                    icon: '✈️' },
  apd: { label: 'Arrivé au pays de destination', icon: '🛬' },
  dou: { label: 'Présenté aux douanes',          icon: '🛃' },
  ins: { label: 'En inspection douanière',       icon: '🔎' },
  ret: { label: 'Retenu par les douanes',        icon: '⚠️' },
  lib: { label: 'Libéré par les douanes',        icon: '✅' },
  del: { label: 'En cours de livraison',         icon: '🚚' },
  liv: { label: 'Livré',                         icon: '🎉' },
};

export async function sendStatusEmail(
  email: string,
  name: string,
  trackingCode: string,
  status: string,
  location?: string | null,
  note?: string | null,
) {
  if (!process.env.RESEND_API_KEY) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const st = STATUS_LABELS[status] ?? { label: status, icon: '📦' };
  const trackUrl = `${process.env.NEXTAUTH_URL ?? 'https://jumla.cargo'}/suivi?code=${trackingCode}`;
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'Jumla Shipping <onboarding@resend.dev>',
    to: email,
    subject: `${st.icon} ${st.label} — ${trackingCode}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        ${HEADER}
        <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
          <p style="margin:0 0 8px;font-size:16px;color:#111">Bonjour <strong>${name}</strong>,</p>
          <p style="margin:0 0 20px;font-size:14px;color:#6b7280">Le statut de votre colis a été mis à jour :</p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:18px 20px;margin-bottom:20px">
            <div style="font-size:26px;margin-bottom:8px">${st.icon}</div>
            <div style="font-size:18px;font-weight:700;color:#15803d">${st.label}</div>
            <div style="font-size:13px;color:#6b7280;margin-top:4px;font-family:monospace;font-weight:700">${trackingCode}</div>
            ${location ? `<div style="font-size:13px;color:#374151;margin-top:8px">📍 ${location}</div>` : ''}
            ${note ? `<div style="font-size:13px;color:#374151;font-style:italic;margin-top:4px">${note}</div>` : ''}
          </div>
          <a href="${trackUrl}" style="display:inline-block;background:linear-gradient(90deg,#00B4D8,#1B4FD8);color:white;padding:12px 24px;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;margin-bottom:24px">
            Suivre mon colis →
          </a>
          ${FOOTER_TEXT}
        </div>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, name: string, resetUrl: string) {
  if (!process.env.RESEND_API_KEY) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'Jumla Shipping <onboarding@resend.dev>',
    to: email,
    subject: 'Réinitialisation de votre mot de passe Jumla',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        ${HEADER}
        <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
          <p style="margin:0 0 8px;font-size:16px;color:#111">Bonjour <strong>${name}</strong>,</p>
          <p style="margin:0 0 24px;font-size:14px;color:#6b7280">
            Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous — ce lien expire dans 1 heure.
          </p>
          <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(90deg,#00B4D8,#1B4FD8);color:white;padding:14px 28px;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;margin-bottom:24px">
            Réinitialiser mon mot de passe
          </a>
          <p style="margin:0 0 16px;font-size:12px;color:#9ca3af">
            Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
          </p>
          ${FOOTER_TEXT}
        </div>
      </div>
    `,
  });
}
