'use client';
import { useEffect, useState } from 'react';

function pad(n) { return String(n).padStart(2, '0'); }

function useCountdown(launchDate) {
  const [vals, setVals] = useState({ d: '--', h: '--', m: '--', s: '--' });
  useEffect(() => {
    const target = new Date(launchDate + 'T00:00:00');
    function tick() {
      const diff = target - Date.now();
      if (diff <= 0) { setVals({ d: '00', h: '00', m: '00', s: '00' }); return; }
      setVals({
        d: pad(Math.floor(diff / 86400000)),
        h: pad(Math.floor((diff % 86400000) / 3600000)),
        m: pad(Math.floor((diff % 3600000) / 60000)),
        s: pad(Math.floor((diff % 60000) / 1000)),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [launchDate]);
  return vals;
}

const DEFAULTS = {
  eyebrow:     'Bientôt disponible',
  originFlag:  '🇨🇳',
  destFlag:    '🇨🇦',
  title:       'Chine → Montréal',
  subtitle:    'Nouvelle route cargo directe · Guangzhou · Shenzhen · Shanghai → Canada',
  launchDate:  '2026-08-31',
  ctaTitle:    'Nos cargaisons Cameroun → Montréal sont ouvertes.',
  ctaSubtitle: 'Expédiez dès aujourd\'hui avec Jumla Cargo.',
  ctaButton:   'Réserver une expédition →',
  launchLabel: 'Lancement prévu : 31 août 2026',
  bgImage:     '',
};

const CD_LABELS = ['Jours', 'Heures', 'Min', 'Sec'];

export default function ChinaComingSoon({ onBook, content }) {
  const c = { ...DEFAULTS, ...content };
  const { d, h, m, s } = useCountdown(c.launchDate);
  const [blink, setBlink] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setBlink(v => !v), 1000);
    return () => clearInterval(id);
  }, []);

  const cdVals = [d, h, m, s];

  return (
    <section style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      overflow: 'hidden',
      fontFamily: "'Inter', system-ui, sans-serif",
      background: '#060c18',
    }}>

      {/* ── Background ── */}
      {c.bgImage ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={c.bgImage}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
            pointerEvents: 'none',
          }}
        />
      ) : (
        /* Default: layered gradient that evokes depth */
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(ellipse 80% 60% at 70% 30%, rgba(0,50,80,.55) 0%, transparent 65%),
            radial-gradient(ellipse 60% 50% at 20% 70%, rgba(27,79,216,.18) 0%, transparent 60%),
            linear-gradient(160deg, #0d1a2e 0%, #060c18 60%)
          `,
        }} />
      )}

      {/* ── Dark overlay — heavier at bottom where text lives ── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: c.bgImage
          ? 'linear-gradient(to top, rgba(6,12,24,.96) 0%, rgba(6,12,24,.75) 45%, rgba(6,12,24,.35) 100%)'
          : 'linear-gradient(to top, rgba(6,12,24,.85) 0%, transparent 60%)',
      }} />

      {/* ── Subtle top vignette ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '30%', pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(6,12,24,.5) 0%, transparent 100%)',
      }} />

      {/* ── Content — bottom-left layout ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 40,
        padding: 'clamp(32px,5vh,64px) clamp(24px,5vw,72px) clamp(48px,7vh,88px)',
        flexWrap: 'wrap',
      }}>

        {/* ── Left block ── */}
        <div style={{ flex: '1 1 380px', maxWidth: 580 }}>

          {/* Eyebrow badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28,
            fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase',
            color: '#00B4D8',
            background: 'rgba(0,180,216,.10)',
            border: '1px solid rgba(0,180,216,.22)',
            borderRadius: 999, padding: '6px 16px',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: '#00B4D8',
              animation: 'cs-pulse 2.2s ease-in-out infinite',
            }} />
            {c.eyebrow}
          </div>

          {/* Flag row */}
          <div style={{ fontSize: 'clamp(22px,3vw,32px)', marginBottom: 14, lineHeight: 1 }}>
            {c.originFlag}&nbsp;&nbsp;
            <span style={{ color: '#00B4D8', fontSize: '.75em', verticalAlign: 'middle' }}>→</span>
            &nbsp;&nbsp;{c.destFlag}
          </div>

          {/* Headline */}
          <h2 style={{
            fontSize: 'clamp(36px,5.5vw,72px)',
            fontWeight: 800, lineHeight: 1.05, letterSpacing: '-.03em',
            color: 'white', margin: '0 0 14px',
            whiteSpace: 'nowrap',
          }}>
            {c.title}
          </h2>

          {/* Subtitle */}
          <p style={{
            fontSize: 14, color: 'rgba(255,255,255,.45)',
            lineHeight: 1.65, margin: '0 0 36px',
            maxWidth: 460,
          }}>
            {c.subtitle}
          </p>

          {/* Countdown */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginBottom: 36 }}>
            {cdVals.map((val, i) => (
              <div key={CD_LABELS[i]} style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 'clamp(52px,8vw,76px)' }}>
                  <span style={{
                    fontSize: 'clamp(32px,5vw,56px)', fontWeight: 800,
                    lineHeight: 1, letterSpacing: '-.04em',
                    fontVariantNumeric: 'tabular-nums', color: 'white',
                  }}>
                    {val}
                  </span>
                  <span style={{
                    fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,.32)', fontWeight: 600, marginTop: 6,
                  }}>
                    {CD_LABELS[i]}
                  </span>
                </div>
                {i < 3 && (
                  <span style={{
                    fontSize: 'clamp(26px,4vw,46px)', fontWeight: 300,
                    color: '#00B4D8', lineHeight: 1, padding: '0 2px',
                    opacity: blink ? 1 : 0.15, transition: 'none',
                  }}>:</span>
                )}
              </div>
            ))}
          </div>

          {/* Primary CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={onBook}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(90deg, #00B4D8, #1B4FD8)',
                color: 'white', fontWeight: 700, fontSize: 14,
                padding: '13px 26px', borderRadius: 999,
                border: 'none', cursor: 'pointer', letterSpacing: '.01em',
                transition: 'opacity .18s, transform .18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '.85'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; }}
            >
              {c.ctaButton}
            </button>
            <span style={{
              fontSize: 11, color: 'rgba(255,255,255,.28)',
              border: '1px solid rgba(255,255,255,.1)', borderRadius: 999,
              padding: '5px 14px', letterSpacing: '.04em', whiteSpace: 'nowrap',
            }}>
              {c.launchLabel}
            </span>
          </div>
        </div>

        {/* ── Right block — "En attendant" ── */}
        <div style={{
          flex: '0 1 300px',
          display: 'flex', flexDirection: 'column', gap: 16,
          paddingBottom: 4,
        }}>
          <div style={{
            padding: '20px 24px',
            background: 'rgba(255,255,255,.04)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 16,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,.35)', marginBottom: 12,
            }}>
              En attendant
            </div>
            <p style={{ fontSize: 14, color: 'white', fontWeight: 600, lineHeight: 1.5, margin: '0 0 6px' }}>
              {c.ctaTitle}
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', lineHeight: 1.55, margin: '0 0 16px' }}>
              {c.ctaSubtitle}
            </p>
            <button
              onClick={() => document.getElementById('jest')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(0,180,216,.12)',
                border: '1px solid rgba(0,180,216,.3)',
                color: '#00B4D8', fontWeight: 600, fontSize: 13,
                padding: '9px 18px', borderRadius: 8,
                cursor: 'pointer', transition: 'background .18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,180,216,.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,180,216,.12)'; }}
            >
              Estimer mon envoi →
            </button>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes cs-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: .3; transform: scale(.6); }
        }
        @media (max-width: 768px) {
          .cs-right { display: none; }
        }
      `}</style>
    </section>
  );
}
