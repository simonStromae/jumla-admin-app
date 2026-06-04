'use client';
import { useState } from 'react';
import I from '../components/Icons.jsx';
import { TopBar, SiteNav, SiteFooter } from './SiteLayout.jsx';
import '@/src/styles/client-omega.css';

const DEMO_SHIPMENTS = {
  'JL-26042-DLA0418': {
    ref: 'JL-26042-DLA0418',
    status: 'En transit',
    pct: 80,
    kind: 'warn',
    origin: 'Douala, Cameroun',
    destination: 'Montréal, Canada',
    route: 'DLA → YUL',
    departure: '28 avr. 2026',
    estimatedArrival: '14 mai 2026',
    weight: '12,5 kg',
    recipient: 'Jean M. · Montréal, QC',
    timeline: [
      { l: 'Colis déposé à Douala',          d: '28 avr. · 10:14', s: 'done'   },
      { l: 'Contrôle et embarquement',        d: '28 avr. · 18:30', s: 'done'   },
      { l: 'En vol vers Montréal',            d: '03 mai · 22:45',  s: 'done'   },
      { l: 'Arrivé à Montréal — entrepôt',   d: '12 mai · 08:14',  s: 'active' },
      { l: 'Livraison au destinataire',       d: 'Prévu 14 mai',    s: 'todo'   },
    ],
  },
  'JL-26039-DLA0401': {
    ref: 'JL-26039-DLA0401',
    status: 'Livré',
    pct: 100,
    kind: 'ok',
    origin: 'Douala, Cameroun',
    destination: 'Montréal, Canada',
    route: 'DLA → YUL',
    departure: '04 avr. 2026',
    estimatedArrival: '18 avr. 2026',
    weight: '8 kg',
    recipient: 'Awa N. · Laval, QC',
    timeline: [
      { l: 'Colis déposé à Douala',          d: '04 avr. · 09:00', s: 'done' },
      { l: 'Contrôle et embarquement',        d: '04 avr. · 17:00', s: 'done' },
      { l: 'En vol vers Montréal',            d: '09 avr. · 20:10', s: 'done' },
      { l: 'Arrivé à Montréal — entrepôt',   d: '18 avr. · 07:45', s: 'done' },
      { l: 'Livré au destinataire',           d: '19 avr. · 14:22', s: 'done' },
    ],
  },
};

const STATUS_COLORS = {
  ok:   { bg: 'var(--ok-50)',   border: 'var(--ok-200)',   text: 'var(--ok-700)',   dot: 'var(--ok-500)'   },
  warn: { bg: 'var(--warn-50)', border: 'var(--warn-200)', text: 'var(--warn-700)', dot: 'var(--warn-500)' },
  info: { bg: 'var(--brand-50)', border: 'var(--brand-100)', text: 'var(--brand-700)', dot: 'var(--brand-500)' },
};

export default function TrackingScreen({ onNav, initialCode }) {
  const [code, setCode] = useState(initialCode || '');
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const onBook = () => onNav?.('/booking');

  const search = (val) => {
    const q = (val ?? code).trim().toUpperCase();
    if (!q) return;
    setLoading(true);
    setNotFound(false);
    setResult(null);
    setTimeout(() => {
      const found = DEMO_SHIPMENTS[q];
      setResult(found || null);
      setNotFound(!found);
      setLoading(false);
    }, 400);
  };

  const handleKey = (e) => { if (e.key === 'Enter') search(); };

  const sc = result ? STATUS_COLORS[result.kind] || STATUS_COLORS.info : null;

  return (
    <div className="jpage">
      <TopBar />
      <SiteNav onNav={onNav} onBook={onBook} mode="tracking" />

      {/* ── Hero band ── */}
      <div style={{
        background: 'var(--ink-900)',
        padding: '60px 0 52px',
        textAlign: 'center',
      }}>
        <div className="jc">
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--brand-400)', marginBottom: 14 }}>
            Suivi en temps réel
          </div>
          <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 900, color: 'white', marginBottom: 14, letterSpacing: '-.02em' }}>
            Où est mon colis ?
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,.55)', maxWidth: 420, margin: '0 auto 32px', lineHeight: 1.65 }}>
            Entrez votre numéro de suivi pour consulter l'état de votre expédition en temps réel.
          </p>

          {/* Search bar */}
          <div style={{ display: 'flex', gap: 0, maxWidth: 580, margin: '0 auto', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.35)' }}>
            <input
              value={code}
              onChange={e => { setCode(e.target.value); setNotFound(false); }}
              onKeyDown={handleKey}
              placeholder="Ex : JL-26042-DLA0418"
              style={{
                flex: 1, height: 52, padding: '0 18px',
                border: 'none', outline: 'none',
                fontSize: 15, fontFamily: 'ui-monospace, monospace',
                background: 'white', color: 'var(--ink-900)',
              }}
            />
            <button
              onClick={() => search()}
              disabled={loading}
              style={{
                height: 52, padding: '0 28px',
                background: 'var(--brand-500)', color: 'white',
                border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 8,
                flexShrink: 0,
                opacity: loading ? .7 : 1,
              }}
            >
              {loading ? '…' : <><I.Search style={{ width: 15, height: 15 }} /> Suivre</>}
            </button>
          </div>

          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', marginTop: 12 }}>
            Essayez : <button onClick={() => { setCode('JL-26042-DLA0418'); search('JL-26042-DLA0418'); }}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.45)', cursor: 'pointer', fontSize: 12, fontFamily: 'ui-monospace, monospace', textDecoration: 'underline' }}>
              JL-26042-DLA0418
            </button>
          </p>
        </div>
      </div>

      <div className="jc" style={{ padding: '40px 0 80px' }}>

        {/* Not found */}
        {notFound && (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 8 }}>Numéro de suivi introuvable</div>
            <p style={{ fontSize: 14, color: 'var(--ink-400)', maxWidth: 360, margin: '0 auto' }}>
              Vérifiez le numéro reçu par email ou WhatsApp. Il est de la forme <span style={{ fontFamily: 'monospace' }}>JL-XXXXX-DLAXXXX</span>.
            </p>
          </div>
        )}

        {/* Result */}
        {result && sc && (
          <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Status card */}
            <div style={{ background: sc.bg, border: `1.5px solid ${sc.border}`, borderRadius: 'var(--radius-lg)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: sc.text, marginBottom: 4 }}>Numéro de suivi</div>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 22, fontWeight: 800, color: 'var(--ink-900)' }}>{result.ref}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: sc.dot, flexShrink: 0 }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: sc.text }}>{result.status}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="card" style={{ padding: '18px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-700)' }}>Progression</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-600)' }}>{result.pct}%</span>
              </div>
              <div style={{ height: 8, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${result.pct}%`, background: result.pct === 100 ? 'var(--ok-500)' : 'var(--brand-500)', borderRadius: 999, transition: 'width .4s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11.5, color: 'var(--ink-400)' }}>
                <span>{result.origin}</span>
                <span>{result.destination}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Infos */}
              <div className="card" style={{ padding: '18px 22px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-400)', marginBottom: 14 }}>Détails de l'envoi</div>
                {[
                  ['Route',           result.route],
                  ['Départ',          result.departure],
                  ['Arrivée estimée', result.estimatedArrival],
                  ['Poids',           result.weight],
                  ['Destinataire',    result.recipient],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-soft)', fontSize: 13 }}>
                    <span style={{ color: 'var(--ink-400)' }}>{k}</span>
                    <span style={{ fontWeight: 600, color: 'var(--ink-800)' }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Timeline */}
              <div className="card" style={{ padding: '18px 22px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-400)', marginBottom: 14 }}>Étapes du trajet</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {result.timeline.map((t, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 14, position: 'relative' }}>
                      {i < result.timeline.length - 1 && (
                        <div style={{ position: 'absolute', left: 11, top: 26, bottom: -2, width: 2, background: t.s === 'done' ? 'var(--brand-300)' : 'var(--border)' }} />
                      )}
                      <div style={{
                        width: 24, height: 24, borderRadius: 999, flex: '0 0 24px', zIndex: 1,
                        background: t.s === 'done' ? 'var(--brand-500)' : t.s === 'active' ? 'var(--ink-900)' : 'white',
                        border: '2px solid ' + (t.s === 'todo' ? 'var(--border)' : t.s === 'active' ? 'var(--ink-900)' : 'var(--brand-500)'),
                        color: t.s === 'todo' ? 'var(--ink-300)' : 'white',
                        display: 'grid', placeItems: 'center', fontSize: 10,
                      }}>
                        {t.s === 'done' ? <I.Check style={{ width: 11, height: 11 }} /> : i + 1}
                      </div>
                      <div style={{ paddingTop: 2 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: t.s === 'todo' ? 'var(--ink-300)' : 'var(--ink-900)' }}>{t.l}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--ink-400)', marginTop: 1 }}>{t.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Notifications CTA */}
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 'var(--radius)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#15803D' }}>Recevez les mises à jour par WhatsApp</div>
                <div style={{ fontSize: 12, color: '#16A34A', marginTop: 3 }}>Nous vous notifions automatiquement à chaque étape.</div>
              </div>
              <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: '#25D366', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                <I.Whatsapp style={{ width: 16, height: 16 }} /> Activer les alertes
              </button>
            </div>
          </div>
        )}

        {/* Empty state — no search yet */}
        {!result && !notFound && !loading && (
          <div style={{ textAlign: 'center', padding: '48px 24px', maxWidth: 480, margin: '0 auto' }}>
            <div style={{ width: 72, height: 72, borderRadius: 'var(--radius-lg)', background: 'var(--brand-50)', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
              <I.Box style={{ width: 32, height: 32, color: 'var(--brand-500)' }} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 8 }}>Suivi de colis Jumla</div>
            <p style={{ fontSize: 14, color: 'var(--ink-400)', lineHeight: 1.7, marginBottom: 24 }}>
              Entrez le numéro de suivi reçu par email ou WhatsApp après votre réservation pour localiser votre colis en temps réel.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--ink-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Vous n'avez pas encore de numéro ?</div>
              <button className="jbtn-nav" onClick={onBook} style={{ fontSize: 13 }}>
                Faire une réservation <I.ArrowRight style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
