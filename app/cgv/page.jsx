'use client';
import { useRouter } from 'next/navigation';
import { TopBar, SiteNav, SiteFooter } from '@/src/client/SiteLayout.jsx';
import '@/src/styles/client-omega.css';

export default function CgvPage() {
  const router = useRouter();
  return (
    <>
      <TopBar />
      <SiteNav onNav={p => router.push(p)} mode="page" />
      <main style={{ minHeight: '60vh', padding: '64px 0' }}>
        <div className="jc" style={{ maxWidth: 720 }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--brand-500)', marginBottom: 10 }}>Légal</div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink-900)', margin: '0 0 8px', letterSpacing: '-.02em' }}>Conditions générales de vente</h1>
            <p style={{ fontSize: 14, color: 'var(--ink-400)', margin: 0 }}>Dernière mise à jour : janvier 2026</p>
          </div>
          <div style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 16, padding: '48px 40px', textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,.04)' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--brand-50)', border: '1.5px solid var(--brand-100)', display: 'grid', placeItems: 'center', fontSize: 28, margin: '0 auto 20px' }}>📋</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-900)', marginBottom: 8 }}>Document en cours de rédaction</div>
            <p style={{ fontSize: 14, color: 'var(--ink-400)', lineHeight: 1.7, maxWidth: 400, margin: '0 auto 24px' }}>
              Nos conditions générales de vente sont en cours de finalisation. Pour toute question commerciale, contactez-nous directement.
            </p>
            <a href="mailto:info@jumlas.com" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, background: 'var(--brand-500)', color: 'white', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
              Nous contacter
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
