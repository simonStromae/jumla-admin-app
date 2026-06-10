'use client';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-page)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif', padding: 24,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        {/* Logo */}
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: 'var(--brand-500)', color: 'white',
          fontSize: 24, fontWeight: 800,
          display: 'grid', placeItems: 'center',
          margin: '0 auto 28px',
        }}>
          J
        </div>

        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: 'var(--bad-50)', border: '1px solid var(--bad-100)',
          display: 'grid', placeItems: 'center',
          margin: '0 auto 20px',
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--bad-500)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28 }}>
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            <path d="M12 9v4M12 17h.01" />
          </svg>
        </div>

        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink-900)', marginBottom: 10 }}>
          Une erreur est survenue
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink-500)', lineHeight: 1.7, marginBottom: 28 }}>
          Quelque chose s'est mal passé côté application.<br />
          Vous pouvez réessayer ou contacter le support si le problème persiste.
        </div>

        {error?.message && (
          <div style={{
            background: 'var(--bg-soft)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 20,
            fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5,
            color: 'var(--ink-500)', textAlign: 'left', wordBreak: 'break-word',
          }}>
            {error.message}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={reset} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 20px', borderRadius: 8,
            background: 'var(--brand-500)', color: 'white',
            border: 'none', cursor: 'pointer',
            fontSize: 13.5, fontWeight: 600,
          }}>
            ↺ Réessayer
          </button>
          <a href="/admin/campaigns" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 20px', borderRadius: 8,
            background: 'white', color: 'var(--ink-700)',
            border: '1px solid var(--border)',
            fontSize: 13.5, fontWeight: 600, textDecoration: 'none',
          }}>
            ← Tableau de bord
          </a>
        </div>

        <div style={{ marginTop: 32, fontSize: 11, color: 'var(--ink-300)', fontFamily: 'monospace' }}>
          HTTP 500 · Jumla Shipping
        </div>
      </div>
    </div>
  );
}
