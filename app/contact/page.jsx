'use client';
import { useRouter } from 'next/navigation';
import { TopBar, SiteNav, SiteFooter } from '@/src/client/SiteLayout.jsx';
import '@/src/styles/client-omega.css';

const CONTACTS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.5 14.4c-.3-.1-1.7-.9-2-1s-.5-.1-.7.1c-.2.3-.7 1-.9 1.1-.2.2-.3.2-.6 0-.3-.1-1.2-.5-2.3-1.4-.8-.7-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5 0-.2 0-.4-.1-.5 0-.1-.7-1.6-1-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.4-.3.3-1 1-1 2.4s1 2.8 1.2 3.1c.2.2 2 3 4.8 4.3.7.3 1.2.4 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.3.3-.7.3-1.2.2-1.3-.1-.2-.3-.3-.6-.4zM12 21a9 9 0 0 1-4.6-1.3L3 21l1.3-4.3A9 9 0 1 1 12 21z" />
      </svg>
    ),
    color: '#25D366',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    label: 'WhatsApp',
    value: '+1 514 998 0709',
    sub: "Réponse en moins d'une heure",
    href: 'https://wa.me/15149980709',
    external: true,
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.6 2.8.2.6 0 1.3-.4 1.7L8 9.4a16 16 0 0 0 6 6l1.2-1.3a2 2 0 0 1 1.7-.4c.9.3 1.8.5 2.8.6a2 2 0 0 1 1.7 2z" />
      </svg>
    ),
    color: 'var(--brand-600)',
    bg: 'var(--brand-50)',
    border: 'var(--brand-100)',
    label: 'Téléphone',
    value: '+1 514 998 0709',
    sub: 'Lun–ven · 9h–20h (heure de Montréal)',
    href: 'tel:+15149980709',
    external: false,
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m2 7 10 7 10-7" />
      </svg>
    ),
    color: 'var(--ink-700)',
    bg: 'var(--bg-soft)',
    border: 'var(--border)',
    label: 'Email',
    value: 'info@jumlas.com',
    sub: 'Réponse sous 24h ouvrées',
    href: 'mailto:info@jumlas.com',
    external: false,
  },
];

export default function ContactPage() {
  const router = useRouter();

  return (
    <>
      <TopBar />
      <SiteNav onNav={p => router.push(p)} onBook={() => router.push('/login')} mode="public" />

      <main style={{ minHeight: '60vh', padding: '64px 0' }}>
        <div className="jc" style={{ maxWidth: 800 }}>

          <div style={{ marginBottom: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--brand-500)', marginBottom: 10 }}>
              Contact
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--ink-900)', margin: '0 0 12px', letterSpacing: '-.02em' }}>
              Nous contacter
            </h1>
            <p style={{ fontSize: 16, color: 'var(--ink-400)', margin: 0 }}>
              Notre équipe est disponible du lundi au vendredi de 9h à 20h.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 40 }}>
            {CONTACTS.map(c => (
              <a key={c.label} href={c.href} target={c.external ? '_blank' : undefined} rel={c.external ? 'noreferrer' : undefined}
                style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{
                  background: c.bg, border: `1.5px solid ${c.border}`,
                  borderRadius: 16, padding: '24px 20px',
                  transition: 'box-shadow .15s',
                }}>
                  <div style={{ color: c.color, marginBottom: 12 }}>{c.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-400)', marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)', marginBottom: 4 }}>{c.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-400)' }}>{c.sub}</div>
                </div>
              </a>
            ))}
          </div>

          <div style={{
            background: 'white', border: '1px solid var(--border)', borderRadius: 16,
            padding: '32px', boxShadow: '0 2px 16px rgba(0,0,0,.04)',
          }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: 'var(--ink-900)' }}>Nos bureaux</h2>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--ink-400)' }}>Retrouvez-nous dans nos points de présence.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {[
                { city: 'Douala', country: 'Cameroun', detail: 'Bureau principal · Dépôt', flag: '🇨🇲' },
                { city: 'Montréal', country: 'Canada', detail: 'Entrepôt · Livraisons QC', flag: '🇨🇦' },
                { city: 'Lagos', country: 'Nigeria', detail: 'Correspondant local', flag: '🇳🇬' },
                { city: 'Bruxelles', country: 'Belgique', detail: 'Correspondant local', flag: '🇧🇪' },
              ].map(o => (
                <div key={o.city} style={{ padding: '14px 16px', background: 'var(--bg-soft)', borderRadius: 10, border: '1px solid var(--border-soft)' }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{o.flag}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink-900)' }}>{o.city}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>{o.country}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 4 }}>{o.detail}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      <SiteFooter />
    </>
  );
}
