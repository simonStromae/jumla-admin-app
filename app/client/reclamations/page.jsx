'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const TYPES = [
  { id: 'retard',    label: '🕐 Retard de livraison' },
  { id: 'endommage', label: '📦 Colis endommagé' },
  { id: 'perdu',     label: '❓ Colis perdu' },
  { id: 'autre',     label: '💬 Autre problème' },
];

function ReclamationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [trackingCode, setTrackingCode] = useState(searchParams.get('code') ?? '');
  const [type, setType]       = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!type || !message.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/me/reclamation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingCode: trackingCode.trim().toUpperCase() || null, type, message }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? 'Erreur inattendue. Réessayez.');
      } else {
        setSent(true);
      }
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion.');
    }
    setSending(false);
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-900)', margin: '0 0 6px', letterSpacing: '-.02em' }}>
          Réclamations
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--ink-400)', margin: 0 }}>
          Signalez un problème lié à votre envoi. Notre équipe vous répond sous 24–48 h.
        </p>
      </div>

      {sent ? (
        <div style={{ background: 'var(--ok-50)', border: '1px solid var(--ok-200)', borderRadius: 14, padding: '36px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ok-700)', marginBottom: 8 }}>Réclamation envoyée</div>
          <p style={{ fontSize: 13, color: 'var(--ok-600)', margin: '0 0 20px' }}>
            Nous avons bien reçu votre message. Notre équipe vous contactera dans les 24–48 heures.
          </p>
          <button
            onClick={() => router.push('/client/dashboard')}
            className="btn btn--brand"
            style={{ fontSize: 13, padding: '10px 20px' }}
          >
            Retour au tableau de bord
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Tracking code (optional) */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-400)', marginBottom: 6 }}>
              Code colis (facultatif)
            </label>
            <input
              value={trackingCode}
              onChange={e => setTrackingCode(e.target.value.toUpperCase())}
              placeholder="JMS-12345"
              className="input"
              style={{ width: '100%', fontFamily: 'var(--ff-mono)', fontSize: 14, fontWeight: 600, letterSpacing: '.04em', boxSizing: 'border-box' }}
            />
          </div>

          {/* Type */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-400)', marginBottom: 8 }}>
              Type de problème <span style={{ color: 'var(--bad-500)' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {TYPES.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setType(opt.id)}
                  style={{
                    padding: '10px 14px',
                    border: `2px solid ${type === opt.id ? 'var(--brand-500)' : 'var(--border)'}`,
                    borderRadius: 10,
                    background: type === opt.id ? 'var(--brand-50)' : 'white',
                    color: type === opt.id ? 'var(--brand-700)' : 'var(--ink-700)',
                    fontSize: 13, fontWeight: type === opt.id ? 700 : 500,
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all .15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-400)', marginBottom: 6 }}>
              Votre message <span style={{ color: 'var(--bad-500)' }}>*</span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Décrivez le problème en détail : date estimée, état du colis, circonstances…"
              rows={5}
              maxLength={2000}
              className="input"
              style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', fontSize: 13.5, lineHeight: 1.6, boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: 11, color: 'var(--ink-300)', textAlign: 'right', marginTop: 4 }}>
              {message.length} / 2000
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', background: 'var(--bad-50)', border: '1px solid var(--bad-100)', borderRadius: 8, color: 'var(--bad-700)', fontSize: 13, fontWeight: 500 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn--brand"
            disabled={sending || !type || !message.trim()}
            style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 700 }}
          >
            {sending ? 'Envoi en cours…' : 'Envoyer la réclamation'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ReclamationsPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 16px 80px' }}>
      <Suspense><ReclamationsContent /></Suspense>
    </div>
  );
}
