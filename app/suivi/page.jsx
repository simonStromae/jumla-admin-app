'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import '@/src/styles/tokens.css';
import { useCompanyAssets } from '@/src/lib/useCompanyAssets.js';

/* ── Jumla brand tokens ──────────────────────────────── */
const J = {
  cyan:    '#00B4D8',
  blue:    '#1B4FD8',
  teal:    '#0087A8',
  dark:    '#0D2E6E',
  black:   '#1A1A2E',
  gray100: '#F4F6FA',
  gray200: '#E2E8F0',
  gray400: '#94A3B8',
  gray700: '#374151',
  success: '#10B981',
  warning: '#F59E0B',
  danger:  '#EF4444',
  gradient: 'linear-gradient(90deg, #00B4D8 0%, #1B4FD8 100%)',
};

const FONT_DISPLAY = "'Barlow Condensed', 'Arial Narrow', sans-serif";
const FONT_BODY    = "'Barlow', 'Helvetica Neue', Arial, sans-serif";

const STATUS = {
  enr: { label: 'Colis enregistré',               color: J.gray400,  bg: 'rgba(148,163,184,.1)',  icon: '📝' },
  rec: { label: "Reçu à l'entrepôt",              color: J.blue,     bg: 'rgba(27,79,216,.08)',   icon: '📥' },
  pre: { label: 'Vérifié et préparé',              color: J.blue,     bg: 'rgba(27,79,216,.08)',   icon: '🔍' },
  exp: { label: 'Expédié',                         color: J.teal,     bg: 'rgba(0,180,216,.08)',   icon: '🚀' },
  tra: { label: 'En transit',                      color: J.teal,     bg: 'rgba(0,180,216,.08)',   icon: '✈️' },
  apd: { label: 'Arrivé au pays de destination',   color: '#059669',  bg: 'rgba(16,185,129,.08)',  icon: '🛬' },
  dou: { label: 'Présenté aux douanes',            color: '#D97706',  bg: 'rgba(245,158,11,.08)',  icon: '🛃' },
  ins: { label: 'En inspection douanière',         color: '#D97706',  bg: 'rgba(245,158,11,.08)',  icon: '🔎' },
  ret: { label: 'Retenu par les douanes',          color: '#DC2626',  bg: 'rgba(239,68,68,.08)',   icon: '⚠️' },
  lib: { label: 'Libéré par les douanes',          color: '#059669',  bg: 'rgba(16,185,129,.08)',  icon: '✅' },
  ard: { label: "Arrivé à l'entrepôt destination", color: '#059669',  bg: 'rgba(16,185,129,.08)',  icon: '🏭' },
  ver: { label: 'Vérification finale',             color: J.blue,     bg: 'rgba(27,79,216,.08)',   icon: '🔬' },
  pdl: { label: 'Prêt pour livraison ou retrait',  color: J.teal,     bg: 'rgba(0,180,216,.08)',   icon: '📦' },
  liv: { label: 'En cours de livraison',           color: J.teal,     bg: 'rgba(0,180,216,.08)',   icon: '🚚' },
  ok:  { label: 'Livré',                           color: '#059669',  bg: 'rgba(16,185,129,.1)',   icon: '🎉' },
  adr: { label: 'Adresse incomplète',              color: '#DC2626',  bg: 'rgba(239,68,68,.08)',   icon: '📍' },
  tdl: { label: 'Tentative de livraison',          color: '#D97706',  bg: 'rgba(245,158,11,.08)',  icon: '🔔' },
  rte: { label: "Retour à l'entrepôt",             color: '#DC2626',  bg: 'rgba(239,68,68,.08)',   icon: '↩️' },
  dom: { label: 'Colis endommagé',                 color: '#DC2626',  bg: 'rgba(239,68,68,.08)',   icon: '💥' },
  cla: { label: 'Réclamation ouverte',             color: '#DC2626',  bg: 'rgba(239,68,68,.08)',   icon: '📋' },
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
  const { logoUrl, logoIconUrl } = useCompanyAssets();
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

  const s = result ? (STATUS[result.status] ?? { label: result.status, color: J.gray400, bg: 'rgba(148,163,184,.1)', icon: '📦' }) : null;

  return (
    <div style={{ fontFamily: FONT_BODY, minHeight: '100vh', background: J.gray100, WebkitFontSmoothing: 'antialiased', color: J.gray700 }}>

      {/* Header */}
      <header style={{ background: J.black, padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 32px rgba(27,79,216,.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }} onClick={() => router.push('/')}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" style={{ height: 38, maxWidth: 160, objectFit: 'contain' }} />
          ) : (
            <>
              <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
                <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#00B4D8"/><stop offset="100%" stopColor="#1B4FD8"/></linearGradient></defs>
                <path d="M8 8 C8 6 10 4 12 5 L38 20 C40 21 40 27 38 28 L12 43 C10 44 8 42 8 40 Z" fill="url(#lg)"/>
              </svg>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', background: J.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>JUMLA</div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.15em', color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', marginTop: 2 }}>Import · Export · Livraison</div>
              </div>
            </>
          )}
        </div>
        <a href="/login" style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'white', textDecoration: 'none', padding: '8px 18px', border: '2px solid rgba(255,255,255,.25)', borderRadius: 8, transition: 'all .2s' }}>
          Connexion →
        </a>
      </header>

      <div style={{ maxWidth: 660, margin: '0 auto', padding: '44px 20px 80px' }}>

        {/* Title */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: J.cyan, marginBottom: 6 }}>Suivi en temps réel</div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 36, fontWeight: 800, margin: '0 0 8px', color: J.black, textTransform: 'uppercase', letterSpacing: '.02em', lineHeight: 1.1 }}>Suivi de colis</h1>
          <p style={{ fontSize: 15, color: J.gray400, margin: 0 }}>
            Entrez votre numéro de suivi pour voir l'état de votre envoi.
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            placeholder="JMS-12345"
            style={{
              flex: 1, height: 50, padding: '0 16px',
              border: '2px solid ' + J.gray200, borderRadius: 8,
              background: 'white', fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              fontSize: 16, fontWeight: 700, letterSpacing: '.05em',
              outline: 'none', color: J.black,
              boxShadow: '0 1px 3px rgba(0,0,0,.08)',
              transition: 'border-color .2s, box-shadow .2s',
            }}
            onFocus={e => { e.target.style.borderColor = J.cyan; e.target.style.boxShadow = '0 0 0 3px rgba(0,180,216,.15)'; }}
            onBlur={e => { e.target.style.borderColor = J.gray200; e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,.08)'; }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0 24px', height: 50,
              background: loading ? J.gray200 : J.gradient,
              color: loading ? J.gray400 : 'white',
              border: 'none', borderRadius: 8,
              fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16,
              letterSpacing: '.08em', textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(27,79,216,.3)',
              transition: 'all .2s',
            }}>
            {loading ? '…' : 'Suivre'}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderLeft: '4px solid ' + J.danger, borderRadius: 8, color: '#DC2626', fontSize: 14, marginBottom: 20, fontWeight: 500 }}>
            <span>🚫</span>
            <div>
              {error === 'Colis introuvable'
                ? <>Aucun colis trouvé avec le code <strong style={{ fontFamily: 'monospace' }}>{input}</strong>. Vérifiez l'orthographe.</>
                : error}
            </div>
          </div>
        )}

        {/* Result */}
        {result && s && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Status banner */}
            <div style={{
              background: 'white',
              border: '1px solid ' + J.gray200,
              borderTop: '3px solid ' + s.color,
              borderRadius: 16,
              padding: '20px 22px',
              boxShadow: '0 1px 3px rgba(0,0,0,.08)',
              display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: s.bg, display: 'grid', placeItems: 'center', fontSize: 26, flexShrink: 0 }}>{s.icon}</div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: J.gray400, marginBottom: 4 }}>
                  Statut · {result.campaign.from} → {result.campaign.to}
                </div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 700, color: s.color, letterSpacing: '.02em', lineHeight: 1.15, textTransform: 'uppercase' }}>{s.label}</div>
                <div style={{ fontSize: 12, color: J.gray400, marginTop: 3 }}>Cargaison {result.campaign.code}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700, color: J.blue, letterSpacing: '.03em' }}>{result.trackingCode}</div>
                <div style={{ marginTop: 8 }}>
                  {result.paid
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#059669', background: 'rgba(16,185,129,.1)', padding: '3px 10px', borderRadius: 9999, letterSpacing: '.05em', textTransform: 'uppercase' }}>✓ Paiement confirmé</span>
                    : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#D97706', background: 'rgba(245,158,11,.1)', padding: '3px 10px', borderRadius: 9999, letterSpacing: '.05em', textTransform: 'uppercase' }}>⏳ En attente</span>}
                </div>
              </div>
            </div>

            {/* Details grid */}
            <div style={{ background: 'white', border: '1px solid ' + J.gray200, borderRadius: 16, padding: '18px 22px', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: J.cyan, marginBottom: 14 }}>Détails de l'envoi</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 32px' }}>
                {[
                  { l: 'Description',    v: result.description || '—' },
                  { l: 'Poids déclaré',  v: result.weightKg ? result.weightKg + ' kg' : '—' },
                  { l: 'Départ prévu',   v: fmt(result.campaign.departureDate) },
                  { l: 'Arrivée prévue', v: fmt(result.campaign.arrivalDate) },
                ].map(r => (
                  <div key={r.l}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: J.gray400, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>{r.l}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: J.black }}>{r.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div style={{ background: 'white', border: '1px solid ' + J.gray200, borderRadius: 16, padding: '18px 22px', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: J.cyan, marginBottom: 20 }}>Historique du colis</div>
              {result.tracking.length === 0 ? (
                <div style={{ color: J.gray400, fontSize: 14, fontStyle: 'italic', padding: '8px 0' }}>Aucun événement enregistré pour le moment.</div>
              ) : (
                <div>
                  {[...result.tracking].reverse().map((e, i, arr) => {
                    const es      = STATUS[e.status] ?? { label: e.status, color: J.gray400, icon: '📦', bg: 'rgba(148,163,184,.1)' };
                    const isFirst = i === 0;
                    return (
                      <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: i < arr.length - 1 ? 22 : 0, position: 'relative' }}>
                        {i < arr.length - 1 && (
                          <div style={{ position: 'absolute', left: isFirst ? 19 : 15, top: isFirst ? 42 : 32, bottom: 0, width: 2, background: J.gray200, borderRadius: 1 }} />
                        )}
                        <div style={{ flexShrink: 0, paddingTop: 2 }}>
                          {isFirst ? (
                            <div style={{
                              width: 40, height: 40, borderRadius: '50%',
                              background: J.gradient,
                              display: 'grid', placeItems: 'center',
                              fontSize: 18,
                              boxShadow: '0 4px 14px rgba(27,79,216,.3)',
                            }}>{es.icon}</div>
                          ) : (
                            <div style={{
                              width: 30, height: 30, borderRadius: '50%',
                              background: J.gray100,
                              border: '2px solid ' + J.gray200,
                              display: 'grid', placeItems: 'center',
                              fontSize: 11, color: J.gray400,
                            }}>✓</div>
                          )}
                        </div>
                        <div style={{ paddingTop: isFirst ? 7 : 5 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                            <span style={{ fontFamily: isFirst ? FONT_DISPLAY : FONT_BODY, fontSize: isFirst ? 16 : 13.5, fontWeight: isFirst ? 700 : 500, color: isFirst ? J.blue : J.gray700, textTransform: isFirst ? 'uppercase' : 'none', letterSpacing: isFirst ? '.02em' : 0 }}>
                              {es.label}
                            </span>
                            {isFirst && (
                              <span style={{ fontFamily: FONT_DISPLAY, fontSize: 10, fontWeight: 700, background: J.gradient, color: 'white', padding: '2px 8px', borderRadius: 9999, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                                ACTUEL
                              </span>
                            )}
                          </div>
                          {e.location && <div style={{ fontSize: 12, color: J.gray400, marginTop: 2 }}>📍 {e.location}</div>}
                          {e.note     && <div style={{ fontSize: 12, color: J.gray400, fontStyle: 'italic', marginTop: 2 }}>{e.note}</div>}
                          <div style={{ fontSize: 11, color: J.gray400, marginTop: 3 }}>{fmtFull(e.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer CTA */}
            <div style={{ textAlign: 'center', fontSize: 13, color: J.gray400, padding: '8px 0' }}>
              Pour plus de détails,{' '}
              <a href="/login" style={{ color: J.blue, fontWeight: 600, textDecoration: 'none', borderBottom: '1.5px solid ' + J.cyan }}>
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
