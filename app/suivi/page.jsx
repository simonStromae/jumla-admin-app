'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import '@/src/styles/tokens.css';

const STATUS = {
  enr: { label: 'Colis enregistré',               color: '#4B5563', bg: '#F4F5F7', icon: '📝' },
  rec: { label: "Reçu à l'entrepôt",              color: '#1d4ed8', bg: '#EEF2FF', icon: '📥' },
  pre: { label: 'Vérifié et préparé',              color: '#7c3aed', bg: '#F5F3FF', icon: '🔍' },
  exp: { label: 'Expédié',                         color: '#0e7490', bg: '#ECFEFF', icon: '🚀' },
  tra: { label: 'En transit',                      color: '#0891b2', bg: '#ECFEFF', icon: '✈️' },
  apd: { label: 'Arrivé au pays de destination',   color: '#059669', bg: '#ECFDF5', icon: '🛬' },
  dou: { label: 'Présenté aux douanes',            color: '#B45309', bg: '#FFFBEB', icon: '🛃' },
  ins: { label: 'En inspection douanière',         color: '#B45309', bg: '#FFFBEB', icon: '🔎' },
  ret: { label: 'Retenu par les douanes',          color: '#DC2626', bg: '#FEF2F2', icon: '⚠️' },
  lib: { label: 'Libéré par les douanes',          color: '#059669', bg: '#ECFDF5', icon: '✅' },
  ard: { label: "Arrivé à l'entrepôt destination", color: '#059669', bg: '#ECFDF5', icon: '🏭' },
  ver: { label: 'Vérification finale',             color: '#7c3aed', bg: '#F5F3FF', icon: '🔬' },
  pdl: { label: 'Prêt pour livraison ou retrait',  color: '#0e7490', bg: '#ECFEFF', icon: '📦' },
  liv: { label: 'En cours de livraison',           color: '#0891b2', bg: '#ECFEFF', icon: '🚚' },
  ok:  { label: 'Livré',                           color: '#047857', bg: '#D1FAE5', icon: '🎉' },
  adr: { label: 'Adresse incomplète',              color: '#DC2626', bg: '#FEF2F2', icon: '📍' },
  tdl: { label: 'Tentative de livraison',          color: '#B45309', bg: '#FFFBEB', icon: '🔔' },
  rte: { label: "Retour à l'entrepôt",             color: '#DC2626', bg: '#FEF2F2', icon: '↩️' },
  dom: { label: 'Colis endommagé',                 color: '#DC2626', bg: '#FEF2F2', icon: '💥' },
  cla: { label: 'Réclamation ouverte',             color: '#DC2626', bg: '#FEF2F2', icon: '📋' },
};

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtFull(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const BRAND = '#F5A524';
const DARK  = '#1a1408';
const CARD  = { background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 1px 1px rgba(15,23,42,.04)' };
const LABEL = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#9CA3AF', marginBottom: 6 };

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

  const s = result ? (STATUS[result.status] ?? { label: result.status, color: '#6B7280', bg: '#F4F5F7', icon: '📦' }) : null;

  return (
    <div style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', minHeight: '100vh', background: '#F7F8FA', WebkitFontSmoothing: 'antialiased' }}>

      {/* Header */}
      <header style={{ background: DARK, color: 'white', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => router.push('/')}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#F5A524,#D97706)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 15, boxShadow: 'inset 0 -2px 4px rgba(0,0,0,.1)' }}>J</div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-.01em' }}>Jumla Shipping</span>
        </div>
        <a href="/login" style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', textDecoration: 'none', padding: '6px 14px', border: '1px solid rgba(255,255,255,.18)', borderRadius: 8, fontWeight: 600, letterSpacing: '.01em' }}>
          Connexion →
        </a>
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* Title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 5px', color: '#111827', letterSpacing: '-.02em' }}>Suivi de colis</h1>
          <p style={{ fontSize: 13.5, color: '#6B7280', margin: 0 }}>
            Entrez votre numéro de suivi pour voir l'état de votre envoi en temps réel.
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            placeholder="JMS-12345"
            style={{
              flex: 1, height: 44, padding: '0 14px',
              border: '1px solid #E5E7EB', borderRadius: 8,
              background: 'white', fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              fontSize: 15, fontWeight: 700, letterSpacing: '.05em',
              outline: 'none', color: '#111827',
              boxShadow: '0 1px 2px rgba(15,23,42,.06)',
              transition: 'border-color .15s, box-shadow .15s',
            }}
            onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = '0 0 0 3px #FFF8EB'; }}
            onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = '0 1px 2px rgba(15,23,42,.06)'; }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0 20px', height: 44,
              background: loading ? '#E5E7EB' : BRAND,
              color: loading ? '#9CA3AF' : DARK,
              border: 'none', borderRadius: 8,
              fontWeight: 700, fontSize: 13.5, cursor: loading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap', letterSpacing: '.01em',
              boxShadow: loading ? 'none' : '0 1px 2px rgba(180,83,9,.25), inset 0 1px 0 rgba(255,255,255,.15)',
              transition: 'all .15s',
            }}>
            {loading ? '…' : 'Suivre →'}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#DC2626', fontSize: 13, marginBottom: 18, fontWeight: 500 }}>
            {error === 'Colis introuvable'
              ? <>Aucun colis trouvé avec le code <strong style={{ fontFamily: 'monospace' }}>{input}</strong>. Vérifiez l'orthographe.</>
              : error}
          </div>
        )}

        {/* Result */}
        {result && s && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Status banner */}
            <div style={{
              ...CARD,
              background: s.bg,
              borderColor: s.color + '30',
              padding: '18px 20px',
              display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: 40, lineHeight: 1, flexShrink: 0 }}>{s.icon}</span>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ ...LABEL, color: s.color, opacity: .7, marginBottom: 4 }}>
                  Statut · {result.campaign.from} → {result.campaign.to}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.color, letterSpacing: '-.02em', lineHeight: 1.15 }}>{s.label}</div>
                <div style={{ fontSize: 11.5, color: s.color, opacity: .55, marginTop: 3 }}>Cargaison {result.campaign.code}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', fontSize: 18, fontWeight: 700, color: '#111827', letterSpacing: '.03em' }}>{result.trackingCode}</div>
                <div style={{ marginTop: 6 }}>
                  {result.paid
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#047857', fontWeight: 600, background: '#D1FAE5', padding: '2px 9px', borderRadius: 999, border: '1px solid #A7F3D0' }}>✓ Paiement confirmé</span>
                    : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#92400E', fontWeight: 600, background: '#FEF3C7', padding: '2px 9px', borderRadius: 999, border: '1px solid #FDE68A' }}>⏳ Paiement en attente</span>}
                </div>
              </div>
            </div>

            {/* Details grid */}
            <div style={{ ...CARD, padding: '16px 20px' }}>
              <div style={LABEL}>Détails de l'envoi</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 28px' }}>
                {[
                  { l: 'Description',    v: result.description || '—' },
                  { l: 'Poids déclaré',  v: result.weightKg ? result.weightKg + ' kg' : '—' },
                  { l: 'Départ prévu',   v: fmt(result.campaign.departureDate) },
                  { l: 'Arrivée prévue', v: fmt(result.campaign.arrivalDate) },
                ].map(r => (
                  <div key={r.l}>
                    <div style={{ ...LABEL, marginBottom: 3 }}>{r.l}</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{r.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div style={{ ...CARD, padding: '16px 20px' }}>
              <div style={LABEL}>Historique du colis</div>
              {result.tracking.length === 0 ? (
                <div style={{ color: '#D1D5DB', fontSize: 13, fontStyle: 'italic', padding: '6px 0' }}>Aucun événement enregistré pour le moment.</div>
              ) : (
                <div>
                  {[...result.tracking].reverse().map((e, i, arr) => {
                    const es      = STATUS[e.status] ?? { label: e.status, color: '#6B7280', icon: '📦', bg: '#F4F5F7' };
                    const isFirst = i === 0;
                    return (
                      <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: i < arr.length - 1 ? 20 : 0, position: 'relative' }}>
                        {i < arr.length - 1 && (
                          <div style={{ position: 'absolute', left: isFirst ? 17 : 14, top: isFirst ? 38 : 30, bottom: 0, width: 2, background: '#F3F4F6', borderRadius: 1 }} />
                        )}
                        <div style={{ flexShrink: 0, paddingTop: 2 }}>
                          <div style={{
                            width: isFirst ? 36 : 28, height: isFirst ? 36 : 28,
                            borderRadius: '50%',
                            background: isFirst ? es.bg : '#F4F5F7',
                            border: '2px solid ' + (isFirst ? es.color : '#E5E7EB'),
                            display: 'grid', placeItems: 'center',
                            fontSize: isFirst ? 18 : 11,
                            boxShadow: isFirst ? '0 0 0 4px ' + es.color + '18' : 'none',
                            transition: 'box-shadow .2s',
                          }}>
                            {isFirst ? es.icon : <span style={{ color: '#9CA3AF' }}>✓</span>}
                          </div>
                        </div>
                        <div style={{ paddingTop: isFirst ? 6 : 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                            <span style={{ fontSize: isFirst ? 14.5 : 13, fontWeight: isFirst ? 700 : 500, color: isFirst ? es.color : '#374151' }}>
                              {es.label}
                            </span>
                            {isFirst && (
                              <span style={{ fontSize: 10, fontWeight: 700, background: es.color, color: 'white', padding: '2px 7px', borderRadius: 999, letterSpacing: '.05em' }}>
                                ACTUEL
                              </span>
                            )}
                          </div>
                          {e.location && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>📍 {e.location}</div>}
                          {e.note     && <div style={{ fontSize: 12, color: '#6B7280', fontStyle: 'italic', marginTop: 2 }}>{e.note}</div>}
                          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{fmtFull(e.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer CTA */}
            <div style={{ textAlign: 'center', fontSize: 13, color: '#9CA3AF', padding: '6px 0' }}>
              Pour plus de détails,{' '}
              <a href="/login" style={{ color: '#111827', fontWeight: 600, textDecoration: 'none', borderBottom: '1.5px solid ' + BRAND }}>
                connectez-vous à votre espace client
              </a>.
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
