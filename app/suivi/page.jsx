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
  ard: { label: 'Arrivé à l\'entrepôt de destination', color: '#16a34a', bg: '#f0fdf4', icon: '🏭' },
  ver: { label: 'Vérification finale',            color: '#7c3aed', bg: '#f5f3ff', icon: '🔬' },
  pdl: { label: 'Prêt pour livraison ou retrait', color: '#0e7490', bg: '#ecfeff', icon: '📦' },
  liv: { label: 'En cours de livraison',          color: '#0891b2', bg: '#ecfeff', icon: '🚚' },
  ok:  { label: 'Livré',                          color: '#15803d', bg: '#dcfce7', icon: '🎉' },
  adr: { label: 'Adresse incomplète',             color: '#dc2626', bg: '#fef2f2', icon: '📍' },
  tdl: { label: 'Tentative de livraison',         color: '#b45309', bg: '#fffbeb', icon: '🔔' },
  rte: { label: 'Retour à l\'entrepôt',           color: '#dc2626', bg: '#fef2f2', icon: '↩️' },
  dom: { label: 'Colis endommagé',                color: '#dc2626', bg: '#fef2f2', icon: '💥' },
  cla: { label: 'Réclamation ouverte',            color: '#dc2626', bg: '#fef2f2', icon: '📋' },
};

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

            {/* Status banner */}
            <div style={{ background: s.bg, border: '1px solid ' + s.color + '33', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 40 }}>{s.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: s.color, marginBottom: 4, opacity: .8 }}>Statut actuel · {result.campaign.from} → {result.campaign.to}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color, letterSpacing: '-.01em' }}>{s.label}</div>
                <div style={{ fontSize: 12, color: s.color, opacity: .65, marginTop: 3 }}>Cargaison {result.campaign.code}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: '#111827', letterSpacing: '.04em' }}>{result.trackingCode}</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>
                  {result.paid
                    ? <span style={{ color: '#15803d', fontWeight: 600 }}>✓ Paiement confirmé</span>
                    : <span style={{ color: '#b45309', fontWeight: 600 }}>⏳ Paiement en attente</span>}
                </div>
              </div>
            </div>

            {/* Details */}
            <div style={{ background: 'white', border: '1px solid #e5e7eb', padding: '16px 20px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 12 }}>Détails de l'envoi</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
                {[
                  { l: 'Description',    v: result.description || '—' },
                  { l: 'Poids déclaré',  v: result.weightKg ? result.weightKg + ' kg' : '—' },
                  { l: 'Départ prévu',   v: fmt(result.campaign.departureDate) },
                  { l: 'Arrivée prévue', v: fmt(result.campaign.arrivalDate) },
                ].map(r => (
                  <div key={r.l}>
                    <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>{r.l}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{r.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div style={{ background: 'white', border: '1px solid #e5e7eb', padding: '16px 20px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 16 }}>Historique du colis</div>
              {result.tracking.length === 0 ? (
                <div style={{ color: '#d1d5db', fontSize: 13, fontStyle: 'italic' }}>Aucun événement enregistré pour le moment.</div>
              ) : (
                <div>
                  {[...result.tracking].reverse().map((e, i, arr) => {
                    const es      = STATUS[e.status] ?? { label: e.status, color: '#6b7280', icon: '📦', bg: '#f9fafb' };
                    const isFirst = i === 0;
                    return (
                      <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: i < arr.length - 1 ? 20 : 0, position: 'relative' }}>
                        {i < arr.length - 1 && <div style={{ position: 'absolute', left: 17, top: 36, bottom: 0, width: 2, background: '#e5e7eb' }} />}
                        <div style={{ flexShrink: 0 }}>
                          <div style={{
                            width: isFirst ? 36 : 30, height: isFirst ? 36 : 30,
                            borderRadius: '50%',
                            background: isFirst ? es.bg : '#f9fafb',
                            border: '2px solid ' + (isFirst ? es.color : '#e5e7eb'),
                            display: 'grid', placeItems: 'center',
                            fontSize: isFirst ? 18 : 13,
                            boxShadow: isFirst ? '0 0 0 4px ' + es.color + '18' : 'none',
                          }}>
                            {isFirst ? es.icon : '✓'}
                          </div>
                        </div>
                        <div style={{ paddingTop: isFirst ? 6 : 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: isFirst ? 15 : 13, fontWeight: isFirst ? 700 : 500, color: isFirst ? es.color : '#374151' }}>
                              {es.label}
                            </span>
                            {isFirst && (
                              <span style={{ fontSize: 9.5, fontWeight: 700, background: es.color, color: 'white', padding: '2px 8px', letterSpacing: '.05em' }}>
                                ACTUEL
                              </span>
                            )}
                          </div>
                          {e.location && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>📍 {e.location}</div>}
                          {e.note     && <div style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic', marginTop: 2 }}>{e.note}</div>}
                          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{fmtFull(e.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
