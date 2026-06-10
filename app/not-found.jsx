import Link from 'next/link';

export default function NotFound() {
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
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 64, fontWeight: 800, color: 'var(--ink-100)',
          lineHeight: 1, marginBottom: 4, letterSpacing: -4,
        }}>
          404
        </div>

        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink-900)', marginBottom: 10 }}>
          Page introuvable
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink-500)', lineHeight: 1.7, marginBottom: 28 }}>
          Cette page n'existe pas ou a été déplacée.<br />
          Vérifiez l'adresse ou retournez à l'accueil.
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/admin/campaigns" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 20px', borderRadius: 8,
            background: 'var(--brand-500)', color: 'white',
            fontSize: 13.5, fontWeight: 600, textDecoration: 'none',
          }}>
            ← Tableau de bord
          </Link>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 20px', borderRadius: 8,
            background: 'white', color: 'var(--ink-700)',
            border: '1px solid var(--border)',
            fontSize: 13.5, fontWeight: 600, textDecoration: 'none',
          }}>
            Site public
          </Link>
        </div>

        <div style={{ marginTop: 32, fontSize: 11, color: 'var(--ink-300)', fontFamily: 'monospace' }}>
          HTTP 404 · Jumla Shipping
        </div>
      </div>
    </div>
  );
}
