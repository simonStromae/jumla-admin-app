'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar, SiteNav, SiteFooter } from '@/src/client/SiteLayout.jsx';
import '@/src/styles/client-omega.css';

const FAQS = [
  {
    q: 'Combien de temps dure un envoi Douala → Montréal ?',
    a: 'Le transit moyen est de 14 jours porte à porte. Vous recevez une estimation précise dès la réservation, puis des notifications WhatsApp à chaque étape du voyage.',
  },
  {
    q: 'Comment est calculé le prix ?',
    a: "Le tarif est au kilo avec une grille par tranche (0–5 kg, 5–10 kg, 10–25 kg…). Certaines catégories appliquent un supplément : fragile +8%, électronique +5%. Les documents bénéficient d'une réduction de 10%. Utilisez notre simulateur sur la page d'accueil pour un devis instantané.",
  },
  {
    q: "Comment est vérifié le contenu à l'arrivée ?",
    a: "Chaque article est photographié et listé sur un bordereau signé au départ. À l'arrivée à Montréal, nos agents vérifient chaque article. En cas d'écart, vous êtes alertés immédiatement par WhatsApp.",
  },
  {
    q: 'Que puis-je envoyer ?',
    a: 'Vêtements, denrées alimentaires sèches, électronique, cosmétiques, documents, mobilier léger. Les produits dangereux, liquides et marchandises prohibées au transport aérien sont exclus.',
  },
  {
    q: 'Comment mon destinataire récupère-t-il le colis ?',
    a: "Au choix : livraison à domicile partout au Québec (créneau sur rendez-vous, signature requise) ou retrait à notre entrepôt de Montréal. Paiement à la livraison — Interac, virement, espèces ou Mobile Money.",
  },
  {
    q: "Peut-on envoyer depuis d'autres villes ?",
    a: "Nous opérons principalement depuis Douala. Nous avons également des routes depuis Lagos (Nigeria) et vers Bruxelles. Contactez-nous pour un devis personnalisé sur d'autres origines.",
  },
  {
    q: 'Comment créer un compte client ?',
    a: "Cliquez sur « Se connecter » puis « Créer un compte ». Renseignez votre nom, email et mot de passe. Vous recevrez un email de confirmation. Une fois validé, vous pouvez réserver votre premier envoi.",
  },
  {
    q: 'Quels modes de paiement sont acceptés ?',
    a: "Interac (pour les clients au Canada), virement bancaire, Mobile Money (Orange Money, MTN MoMo) et espèces à nos bureaux. Le paiement se fait à la livraison au Canada.",
  },
];

function FaqItem({ q, a, open, onToggle }) {
  return (
    <div style={{
      borderBottom: '1px solid var(--border)',
      padding: '0',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left', gap: 16,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-900)', lineHeight: 1.4 }}>{q}</span>
        <span style={{
          flexShrink: 0, width: 24, height: 24, borderRadius: '50%',
          background: open ? 'var(--brand-500)' : 'var(--bg-soft)',
          border: '1px solid var(--border)',
          display: 'grid', placeItems: 'center',
          fontSize: 16, color: open ? 'white' : 'var(--ink-500)',
          transition: 'all .2s',
        }}>
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--ink-500)', lineHeight: 1.7 }}>{a}</p>
      )}
    </div>
  );
}

export default function FaqPage() {
  const router = useRouter();
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <>
      <TopBar />
      <SiteNav onNav={p => router.push(p)} onBook={() => router.push('/login')} mode="public" />

      <main style={{ minHeight: '60vh', padding: '64px 0' }}>
        <div className="jc">
          <div style={{ marginBottom: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--brand-500)', marginBottom: 10 }}>
              FAQ
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--ink-900)', margin: '0 0 12px', letterSpacing: '-.02em' }}>
              Questions fréquentes
            </h1>
            <p style={{ fontSize: 16, color: 'var(--ink-400)', margin: 0 }}>
              Une autre question ?{' '}
              <a href="https://wa.me/15149980709" target="_blank" rel="noreferrer" style={{ color: '#25D366', fontWeight: 600, textDecoration: 'none' }}>
                WhatsApp nous répond en moins d'une heure.
              </a>
            </p>
          </div>

          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '0 32px', boxShadow: '0 2px 16px rgba(0,0,0,.04)' }}>
            {FAQS.map((f, i) => (
              <FaqItem
                key={i}
                q={f.q}
                a={f.a}
                open={openIdx === i}
                onToggle={() => setOpenIdx(openIdx === i ? -1 : i)}
              />
            ))}
          </div>

          <div style={{ marginTop: 48, padding: '28px 32px', background: 'var(--brand-50)', border: '1px solid var(--brand-100)', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink-900)', marginBottom: 4 }}>Vous n'avez pas trouvé votre réponse ?</div>
              <div style={{ fontSize: 14, color: 'var(--ink-500)' }}>Notre équipe est disponible lun–ven 9h–20h.</div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginLeft: 'auto' }}>
              <a href="https://wa.me/15149980709" target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 8, background: '#25D366', color: 'white', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                WhatsApp
              </a>
              <a href="/contact"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 8, background: 'white', color: 'var(--ink-700)', border: '1px solid var(--border)', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
                Nous contacter
              </a>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
