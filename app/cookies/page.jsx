'use client';
import { useRouter } from 'next/navigation';
import { TopBar, SiteNav, SiteFooter } from '@/src/client/SiteLayout.jsx';
import '@/src/styles/client-omega.css';

export default function CookiesPage() {
  const router = useRouter();
  return (
    <>
      <TopBar />
      <SiteNav onNav={p => router.push(p)} mode="page" />
      <main style={{ minHeight: '60vh', padding: '64px 0' }}>
        <div className="jc" style={{ maxWidth: 720 }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--brand-500)', marginBottom: 10 }}>Légal</div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink-900)', margin: '0 0 8px', letterSpacing: '-.02em' }}>Politique de cookies</h1>
            <p style={{ fontSize: 14, color: 'var(--ink-400)', margin: 0 }}>Dernière mise à jour : janvier 2026</p>
          </div>
          <div style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 16, padding: '32px 40px', boxShadow: '0 2px 16px rgba(0,0,0,.04)' }}>
            <p style={{ fontSize: 14, color: 'var(--ink-500)', lineHeight: 1.8, marginTop: 0 }}>
              Ce site utilise uniquement des cookies strictement nécessaires à son fonctionnement (authentification, préférences de langue). Aucun cookie publicitaire ou de traçage tiers n'est déposé.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
              {[
                { name: 'next-auth.session-token', desc: "Session d'authentification — expire à la fermeture du navigateur ou après 30 jours.", essential: true },
                { name: 'NEXT_LOCALE', desc: 'Préférence de langue (fr / en) — expire après 1 an.', essential: true },
              ].map(c => (
                <div key={c.name} style={{ padding: '14px 16px', background: 'var(--bg-soft)', borderRadius: 10, border: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <code style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-800)', background: 'var(--border-soft)', padding: '2px 6px', borderRadius: 4 }}>{c.name}</code>
                    <p style={{ fontSize: 13, color: 'var(--ink-500)', margin: '6px 0 0', lineHeight: 1.5 }}>{c.desc}</p>
                  </div>
                  {c.essential && (
                    <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: 'var(--brand-600)', background: 'var(--brand-50)', border: '1px solid var(--brand-100)', padding: '3px 8px', borderRadius: 20 }}>
                      Essentiel
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-400)', lineHeight: 1.7, marginBottom: 0, marginTop: 20 }}>
              Pour toute question relative à l'utilisation des cookies, contactez-nous à{' '}
              <a href="mailto:info@jumlas.com" style={{ color: 'var(--brand-500)', fontWeight: 600 }}>info@jumlas.com</a>.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
