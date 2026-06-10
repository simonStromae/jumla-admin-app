'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const STATUS = {
  en_attente: { label: 'En attente de prise en charge', color: 'var(--ink-500)',   bg: 'var(--bg-soft)',  icon: '⏳' },
  recu:       { label: 'Reçu par Jumla',                color: 'var(--brand-700)', bg: 'var(--brand-50)', icon: '✅' },
  en_transit: { label: 'En transit',                    color: 'var(--info-700)',  bg: 'var(--info-50)',  icon: '✈️' },
  en_douane:  { label: 'En douane',                     color: 'var(--warn-700)',  bg: 'var(--warn-50)',  icon: '🛃' },
  arrive:     { label: 'Arrivé à destination',          color: 'var(--ok-700)',    bg: 'var(--ok-50)',    icon: '📦' },
  livre:      { label: 'Livré',                         color: 'var(--ok-700)',    bg: 'var(--ok-50)',    icon: '🎉' },
};

const STEPS = ['en_attente', 'recu', 'en_transit', 'en_douane', 'arrive', 'livre'];

function fmt(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtFull(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function SuiviContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [input, setInput]   = useState(searchParams.get('code') ?? '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const search = async (code) => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/public/track?code=' + encodeURIComponent(code.trim().toUpperCase()));
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Colis introuvable'); }
      else setResult(json);
    } catch { setError('Erreur réseau — réessayez.'); }
    setLoading(false);
  };

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) { setInput(code); search(code); }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    router.push('/client/suivi?code=' + encodeURIComponent(input.trim()));
    search(input);
  };

  const currentStep = result ? STEPS.indexOf(result.status) : -1;
  const s = result ? (STATUS[result.status] ?? { label: result.status, color: 'var(--ink-400)', bg: 'var(--bg-soft)', icon: '📦' }) : null;

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Suivi de colis</h2>
      <p style={{ color: 'var(--ink-400)', fontSize: 13.5, marginBottom: 24 }}>
        Entrez votre numéro de suivi (format JMS-XXXXX) pour voir l'état de votre colis.
      </p>

      {/* Search bar */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value.toUpperCase())}
          placeholder="JMS-12345"
          className="input"
          style={{ flex: 1, fontFamily: 'var(--ff-mono)', fontSize: 15, fontWeight: 600, letterSpacing: '.04em' }}
        />
        <button type="submit" className="btn btn--brand" disabled={loading} style={{ minWidth: 90 }}>
          {loading ? '…' : 'Suivre'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div style={{ padding: '14px 18px', background: 'var(--bad-50)', border: '1px solid var(--bad-100)', borderRadius: 10, color: 'var(--bad-700)', fontSize: 13, fontWeight: 500, marginBottom: 20 }}>
          {error === 'Colis introuvable'
            ? <>Aucun colis trouvé avec le code <strong>{input}</strong>. Vérifiez votre numéro de suivi.</>
            : error}
        </div>
      )}

      {/* Result */}
      {result && s && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Status banner */}
          <div style={{ background: s.bg, border: '1px solid', borderColor: s.color + '33', borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 36 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: s.color, opacity: .8, marginBottom: 3 }}>Statut actuel</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.label}</div>
              <div style={{ fontSize: 12, color: s.color, opacity: .7, marginTop: 2 }}>
                {result.campaign.from} → {result.campaign.to} · Cargaison {result.campaign.code}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 17, fontWeight: 700, color: 'var(--ink-900)' }}>{result.trackingCode}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 2 }}>
                {result.paid
                  ? <span style={{ color: 'var(--ok-600)', fontWeight: 600 }}>✓ Payé</span>
                  : <span style={{ color: 'var(--warn-700)', fontWeight: 600 }}>⏳ Paiement en attente</span>}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-400)', marginBottom: 16 }}>Progression</div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {STEPS.map((step, i) => {
                const st   = STATUS[step];
                const done = i <= currentStep;
                const cur  = i === currentStep;
                return (
                  <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 14,
                        background: done ? (cur ? s.bg : 'var(--ok-50)') : 'var(--ink-100)',
                        border: '2px solid ' + (cur ? s.color : done ? 'var(--ok-400)' : 'var(--border)'),
                        boxShadow: cur ? '0 0 0 4px ' + s.color + '22' : 'none',
                        transition: 'all .2s',
                      }}>
                        {done ? (cur ? st.icon : '✓') : ''}
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 600, color: done ? (cur ? s.color : 'var(--ok-600)') : 'var(--ink-300)', textAlign: 'center', whiteSpace: 'nowrap', maxWidth: 52 }}>
                        {st.label.split(' ')[0]}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div style={{ flex: 1, height: 2, background: i < currentStep ? 'var(--ok-400)' : 'var(--border)', margin: '0 4px', marginBottom: 22, borderRadius: 999 }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info card */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-400)', marginBottom: 14 }}>Détails</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
              {[
                { l: 'Description', v: result.description || '—' },
                { l: 'Poids',       v: result.weightKg ? result.weightKg + ' kg' : '—' },
                { l: 'Départ prévu', v: fmt(result.campaign.departureDate) },
                { l: 'Arrivée prévue', v: fmt(result.campaign.arrivalDate) },
              ].map(r => (
                <div key={r.l}>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 3 }}>{r.l}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)' }}>{r.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-400)', marginBottom: 16 }}>Historique</div>
            {result.tracking.length === 0 ? (
              <div style={{ color: 'var(--ink-300)', fontSize: 13, fontStyle: 'italic' }}>Aucun événement enregistré pour l'instant.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[...result.tracking].reverse().map((e, i, arr) => {
                  const es = STATUS[e.status] ?? { label: e.status, color: 'var(--ink-400)', icon: '•', bg: 'var(--bg-soft)' };
                  return (
                    <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: i < arr.length - 1 ? 16 : 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: es.bg, display: 'grid', placeItems: 'center', fontSize: 17, flexShrink: 0, border: '1px solid ' + es.color + '33' }}>{es.icon}</div>
                        {i < arr.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--border-soft)', marginTop: 4 }} />}
                      </div>
                      <div style={{ paddingTop: 6 }}>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: es.color }}>{es.label}</div>
                        {e.location && <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>📍 {e.location}</div>}
                        {e.note     && <div style={{ fontSize: 12, color: 'var(--ink-500)', fontStyle: 'italic', marginTop: 2 }}>{e.note}</div>}
                        <div style={{ fontSize: 11, color: 'var(--ink-300)', marginTop: 4 }}>{fmtFull(e.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export default function ClientSuiviPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100%' }}>
      <Suspense><SuiviContent /></Suspense>
    </div>
  );
}
