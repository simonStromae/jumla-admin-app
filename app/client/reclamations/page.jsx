'use client';

export default function ReclamationsPage() {
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 0' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink-900)', margin: '0 0 6px', letterSpacing: '-.02em' }}>
          Réclamations
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-400)', margin: 0 }}>
          Signalez un problème lié à votre envoi.
        </p>
      </div>

      {/* Coming soon card */}
      <div style={{
        background: 'white',
        border: '1.5px solid var(--border)',
        borderRadius: 16,
        padding: '56px 40px',
        textAlign: 'center',
        boxShadow: '0 2px 16px rgba(0,0,0,.04)',
      }}>
        <div style={{
          width: 72, height: 72,
          borderRadius: 20,
          background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
          border: '1.5px solid #BFDBFE',
          display: 'grid', placeItems: 'center',
          fontSize: 34,
          margin: '0 auto 20px',
        }}>
          🛠️
        </div>

        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink-900)', marginBottom: 10, letterSpacing: '-.01em' }}>
          Bientôt disponible
        </div>
        <p style={{ fontSize: 14, color: 'var(--ink-500)', lineHeight: 1.7, maxWidth: 360, margin: '0 auto 28px' }}>
          La gestion des réclamations en ligne sera disponible prochainement.
          En attendant, contactez-nous directement par WhatsApp ou par email.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 300, margin: '0 auto' }}>
          <a
            href="https://wa.me/15142929261"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '12px 20px', borderRadius: 10,
              background: '#25D366', color: 'white',
              fontSize: 14, fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(37,211,102,.25)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.5 14.4c-.3-.1-1.7-.9-2-1s-.5-.1-.7.1c-.2.3-.7 1-.9 1.1-.2.2-.3.2-.6 0-.3-.1-1.2-.5-2.3-1.4-.8-.7-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5 0-.2 0-.4-.1-.5 0-.1-.7-1.6-1-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.4-.3.3-1 1-1 2.4s1 2.8 1.2 3.1c.2.2 2 3 4.8 4.3.7.3 1.2.4 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.3.3-.7.3-1.2.2-1.3-.1-.2-.3-.3-.6-.4zM12 21a9 9 0 0 1-4.6-1.3L3 21l1.3-4.3A9 9 0 1 1 12 21z" />
            </svg>
            Contacter par WhatsApp
          </a>

          <a
            href="mailto:support@jumla.cargo"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '12px 20px', borderRadius: 10,
              background: 'white', color: 'var(--ink-700)',
              border: '1.5px solid var(--border)',
              fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m2 7 10 7 10-7" />
            </svg>
            support@jumla.cargo
          </a>
        </div>

        {/* Divider */}
        <div style={{ margin: '32px auto', width: 48, height: 2, background: 'var(--border-soft)', borderRadius: 2 }} />

        {/* Info box */}
        <div style={{
          background: 'var(--brand-50)', border: '1px solid var(--brand-100)',
          borderRadius: 10, padding: '14px 16px', textAlign: 'left',
          maxWidth: 380, margin: '0 auto',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-700)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
            Informations à préparer
          </div>
          {[
            'Votre numéro de suivi (ex : JL-XXXX-XXXX)',
            'La nature du problème (colis endommagé, retard, article manquant…)',
            'Des photos si possible',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: i < 2 ? 6 : 0 }}>
              <span style={{ color: 'var(--brand-500)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>→</span>
              <span style={{ fontSize: 12.5, color: 'var(--brand-800)', lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
