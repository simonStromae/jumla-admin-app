'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import '@/src/styles/tokens.css';

const STATUS = {
  enr: { label: 'Colis enregistré',              color: '#6b7280', bg: '#f9fafb', icon: '📝' },
  rec: { label: 'Reçu à l\'entrepôt',            color: '#1d4ed8', bg: '#eff6ff', icon: '📥' },
  pre: { label: 'Vérifié et préparé',             color: '#7c3aed', bg: '#f5f3ff', icon: '🔍' },
  exp: { label: 'Expédié',                        color: '#0e7490', bg: '#ecfeff', icon: '🚀' },
  tra: { label: 'En transit',                     color: '#0891b2', bg: '#ecfeff', icon: '✈️' },
  apd: { label: 'Arrivé au pays de destination',  color: '#16a34a', bg: '#f0fdf4', icon: '🛬' },
  dou: { label: 'Présenté aux douanes',           color: '#b45309', bg: '#fffbeb', icon: '🛃' },
  ins: { label: 'En inspection douanière',        color: '#b45309', bg: '#fffbeb', icon: '🔎' },
  ret: { label: 'Retenu par les douanes',         color: '#dc2626', bg: '#fef2f2', icon: '⚠️' },
  lib: { label: 'Libéré par les douanes',         color: '#16a34a', bg: '#f0fdf4', icon: '✅' },
  del: { label: 'En cours de livraison',          color: '#0e7490', bg: '#ecfeff', icon: '🚚' },
  liv: { label: 'Livré',                          color: '#15803d', bg: '#dcfce7', icon: '🎉' },
};
const STEPS = ['enr', 'rec', 'pre', 'exp', 'tra', 'apd', 'dou', 'lib', 'del', 'liv'];

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtFull(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function TrackContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [input,   setInput]   = useState(searchParams.get('code') ?? '');
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const search = async (code) => {
    if (!code.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res  = await fetch('/api/public/track?code=' + encodeURIComponent(code.trim().toUpperCase()));
      const json = await res.json();
      if (!res.ok) setError(json.error || 'Colis introuvable');
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
    router.push('/suivi?code=' + encodeURIComponent(input.trim()));
    search(input);
  };

  const currentStep = result ? STEPS.indexOf(result.status) : -1;
  const s = result ? (STATUS[result.status] ?? { label: result.status, color: '#6b7280', bg: '#f9fafb', icon: '📦' }) : null;

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <header style={{ background: '#1a1408', color: 'white', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => router.push('/')}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#F5A524,#D97706)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 15, color: 'white' }}>J</div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Jumla Shipping</span>
        </div>
        <a href="/login" style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', textDecoration: 'none', padding: '6px 14px', border: '1px solid rgba(255,255,255,.2)' }}>
          Connexion →
        </a>
      </header>

      <div style={{ maxWidth: 680, margin: '48px auto', padding: '0 20px 60px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: '#111827' }}>Suivi de colis</h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 28px' }}>
          Entrez votre numéro de suivi (format JMS-XXXXX) pour voir l'état de votre envoi.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
          <input value={input} onChange={e => setInput(e.target.value.toUpperCase())}
            placeholder="JMS-12345"
            style={{ flex: 1, height: 46, padding: '0 14px', border: '1.5px solid #d1d5db', background: 'white', fontFamily: 'monospace', fontSize: 15, fontWeight: 700, letterSpacing: '.04em', outline: 'none' }}
          />
          <button type="submit" disabled={loading}
            style={{ padding: '0 24px', background: '#1a1408', color: 'white', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: loading ? .6 : 1 }}>
            {loading ? '…' : 'Suivre'}
          </button>
        </form>

        {error && (
          <div style={{ padding: '14px 18px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, marginBottom: 20 }}>
            {error === 'Colis introuvable' ? <>Aucun colis trouvé avec le code <strong>{input}</strong>.</> : error}
          </div>
        )}

        {result && s && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: s.bg, border: '1px solid ' + s.color + '33', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 36 }}>{s.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: s.color, marginBottom: 3 }}>Statut actuel</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.label}</div>
                <div style={{ fontSize: 12, color: s.color, opacity: .7, marginTop: 2 }}>{result.campaign.from} → {result.campaign.to} · {result.campaign.code}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'monospace', fontSize: 17, fontWeight: 700, color: '#111827' }}>{result.trackingCode}</div>
                <div style={{ fontSize: 11, marginTop: 2 }}>
                  {result.paid ? <span style={{ color: '#15803d', fontWeight: 600 }}>✓ Payé</span> : <span style={{ color: '#b45309', fontWeight: 600 }}>⏳ Paiement en attente</span>}
                </div>
              </div>
            </div>

            <div style={{ background: 'white', border: '1px solid #e5e7eb', padding: '18px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 16 }}>Progression</div>
              <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto' }}>
                {STEPS.map((step, i) => {
                  const st = STATUS[step]; const done = i <= currentStep; const cur = i === currentStep;
                  return (
                    <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none', minWidth: 40 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 14, background: done ? (cur ? s.bg : '#f0fdf4') : '#f3f4f6', border: '2px solid ' + (cur ? s.color : done ? '#4ade80' : '#e5e7eb'), boxShadow: cur ? '0 0 0 4px ' + s.color + '22' : 'none' }}>
                          {done ? (cur ? st.icon : '✓') : ''}
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 600, color: done ? (cur ? s.color : '#16a34a') : '#d1d5db', textAlign: 'center', whiteSpace: 'nowrap', maxWidth: 52 }}>{st.label.split(' ')[0]}</span>
                      </div>
                      {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < currentStep ? '#4ade80' : '#e5e7eb', margin: '0 4px', marginBottom: 22 }} />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: 'white', border: '1px solid #e5e7eb', padding: '18px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 14 }}>Détails</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                {[
                  { l: 'Description',    v: result.description || '—' },
                  { l: 'Poids',          v: result.weightKg ? result.weightKg + ' kg' : '—' },
                  { l: 'Départ prévu',   v: fmt(result.campaign.departureDate) },
                  { l: 'Arrivée prévue', v: fmt(result.campaign.arrivalDate) },
                ].map(r => (
                  <div key={r.l}>
                    <div style={{ fontSize: 10.5, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 3 }}>{r.l}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>{r.v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'white', border: '1px solid #e5e7eb', padding: '18px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 16 }}>Historique</div>
              {result.tracking.length === 0 ? (
                <div style={{ color: '#d1d5db', fontSize: 13, fontStyle: 'italic' }}>Aucun événement enregistré.</div>
              ) : result.tracking.map((e, i, arr) => {
                const es = STATUS[e.status] ?? { label: e.status, color: '#6b7280', icon: '📦', bg: '#f9fafb' };
                const isLatest = i === arr.length - 1;
                return (
                  <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: i < arr.length - 1 ? 18 : 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: isLatest ? 36 : 30, height: isLatest ? 36 : 30, borderRadius: '50%', background: isLatest ? es.bg : '#f9fafb', display: 'grid', placeItems: 'center', fontSize: isLatest ? 17 : 13, flexShrink: 0, border: '2px solid ' + (isLatest ? es.color : '#e5e7eb') }}>
                        {isLatest ? es.icon : '✓'}
                      </div>
                      {i < arr.length - 1 && <div style={{ width: 2, flex: 1, background: '#d1fae5', marginTop: 4, minHeight: 20 }} />}
                    </div>
                    <div style={{ paddingTop: isLatest ? 6 : 3 }}>
                      <div style={{ fontWeight: isLatest ? 700 : 500, fontSize: isLatest ? 14 : 13, color: isLatest ? es.color : '#374151' }}>
                        {es.label}
                        {isLatest && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, background: es.color, color: 'white', padding: '2px 7px', verticalAlign: 'middle' }}>ACTUEL</span>}
                      </div>
                      {e.location && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>📍 {e.location}</div>}
                      {e.note     && <div style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic', marginTop: 2 }}>{e.note}</div>}
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{fmtFull(e.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>
              Pour plus de détails, <a href="/login" style={{ color: '#1a1408', fontWeight: 600 }}>connectez-vous à votre espace client</a>.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SuiviPage() {
  return <Suspense><TrackContent /></Suspense>;
}
