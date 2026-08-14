'use client';
import { useEffect, useRef, useState } from 'react';

/* ── Land test — approximate continental bounding boxes ── */
function isLand(lat, lng) {
  if (lat > 7  && lat < 84  && lng > -168 && lng < -52)  return true; // North America
  if (lat > -56 && lat < 13  && lng > -82  && lng < -34)  return true; // South America
  if (lat > 36  && lat < 72  && lng > -10  && lng < 40)   return true; // Europe
  if (lat > -35 && lat < 37  && lng > -18  && lng < 52)   return true; // Africa
  if (lat > 50  && lat < 78  && lng > 40   && lng < 180)  return true; // Russia / N Asia
  if (lat > 18  && lat < 55  && lng > 72   && lng < 145)  return true; // China / E Asia
  if (lat > 5   && lat < 37  && lng > 60   && lng < 100)  return true; // South Asia
  if (lat > -10 && lat < 22  && lng > 95   && lng < 145)  return true; // SE Asia
  if (lat > -45 && lat < -10 && lng > 113  && lng < 155)  return true; // Australia
  if (lat > 59  && lat < 84  && lng > -54  && lng < -15)  return true; // Greenland
  if (lat > 30  && lat < 46  && lng > 129  && lng < 146)  return true; // Japan
  if (lat > 55  && lat < 72  && lng > 4    && lng < 32)   return true; // Scandinavia
  return false;
}
function isChina(lat, lng) { return lat > 18 && lat < 42 && lng > 100 && lng < 125; }
function isCanada(lat, lng) { return lat > 42 && lat < 84 && lng > -141 && lng < -52; }

function bezier(t, a, b, c) { const mt = 1 - t; return mt * mt * a + 2 * mt * t * b + t * t * c; }
function project(lat, lng, W, H) { return { x: ((lng + 180) / 360) * W, y: ((90 - lat) / 180) * H }; }

const ARC = { p0: { lat: 23, lng: 113.3 }, p1: { lat: 78, lng: -40 }, p2: { lat: 45.5, lng: -73.6 } };
function arcPoint(t, W, H) {
  return project(bezier(t, ARC.p0.lat, ARC.p1.lat, ARC.p2.lat), bezier(t, ARC.p0.lng, ARC.p1.lng, ARC.p2.lng), W, H);
}

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

/* ── Animated canvas world map ── */
function WorldMapCanvas() {
  const ref = useRef(null);
  const raf = useRef(null);
  const pkts = useRef([0.05, 0.30, 0.55, 0.80].map(t => ({ t, speed: 0.0014 + Math.random() * 0.0008 })));

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }

    function draw() {
      const W = canvas.width, H = canvas.height;
      if (!W || !H) { raf.current = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, W, H);

      const GAP = Math.max(8, Math.min(12, W / 110));
      const DOT = GAP * 0.21;
      const rows = Math.ceil(H / (GAP * 0.866)) + 1;
      const cols = Math.ceil(W / GAP) + 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * GAP + (r % 2 === 0 ? 0 : GAP / 2);
          const y = r * GAP * 0.866;
          if (x > W + GAP) continue;
          const lng = (x / W) * 360 - 180;
          const lat = 90 - (y / H) * 180;
          if (!isLand(lat, lng)) continue;
          ctx.fillStyle = isChina(lat, lng)
            ? 'rgba(0,180,216,0.75)'
            : isCanada(lat, lng)
            ? 'rgba(0,180,216,0.5)'
            : 'rgba(255,255,255,0.09)';
          ctx.beginPath();
          ctx.arc(x, y, DOT, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Arc (dashed)
      ctx.save();
      ctx.setLineDash([3, 8]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(0,180,216,0.25)';
      ctx.beginPath();
      const s = arcPoint(0, W, H);
      ctx.moveTo(s.x, s.y);
      for (let t = 0.02; t <= 1; t += 0.02) { const p = arcPoint(t, W, H); ctx.lineTo(p.x, p.y); }
      ctx.stroke();
      ctx.restore();

      // Animated packets
      for (const pkt of pkts.current) {
        const pt = arcPoint(pkt.t, W, H);
        const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 8);
        g.addColorStop(0, 'rgba(0,180,216,.8)');
        g.addColorStop(1, 'rgba(0,180,216,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#00B4D8';
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2); ctx.fill();
        pkt.t += pkt.speed;
        if (pkt.t > 1) pkt.t = 0;
      }

      // Origin / destination dots
      ctx.shadowColor = '#00B4D8'; ctx.shadowBlur = 14;
      ctx.fillStyle = '#00B4D8';
      [arcPoint(0, W, H), arcPoint(1, W, H)].forEach(pt => {
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2); ctx.fill();
      });
      ctx.shadowBlur = 0;

      raf.current = requestAnimationFrame(draw);
    }

    resize();
    draw();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => { cancelAnimationFrame(raf.current); ro.disconnect(); };
  }, []);

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />;
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
};

/* ── Coming soon section ── */
export default function ChinaComingSoon({ onBook, content }) {
  const c = { ...DEFAULTS, ...content };
  const { d, h, m, s } = useCountdown(c.launchDate);
  const [blink, setBlink] = useState(true);
  useEffect(() => { const id = setInterval(() => setBlink(v => !v), 1000); return () => clearInterval(id); }, []);

  const CD_UNITS = [
    { val: d, label: 'Jours' },
    { val: h, label: 'Heures' },
    { val: m, label: 'Minutes' },
    { val: s, label: 'Secondes' },
  ];

  return (
    <section style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      background: '#0B1220',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <WorldMapCanvas />

      {/* Radial + edge vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 70% 50% at 50% 50%, transparent 15%, rgba(11,18,32,.92) 100%),
          linear-gradient(to bottom, #0B1220 0%, transparent 14%, transparent 82%, #0B1220 100%)
        `,
      }} />

      {/* Content — follows .jc max-width convention */}
      <div style={{
        position: 'relative', zIndex: 10,
        textAlign: 'center',
        padding: '88px clamp(20px, 5vw, 72px) 104px',
        maxWidth: 760, width: '100%', margin: '0 auto',
      }}>

        {/* Eyebrow chip */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 36,
          fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase',
          color: '#00B4D8',
          background: 'rgba(0,180,216,.1)',
          border: '1px solid rgba(0,180,216,.22)',
          borderRadius: 999, padding: '6px 16px',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00B4D8', animation: 'cspin 2.2s ease-in-out infinite' }} />
          {c.eyebrow}
        </div>

        {/* Flags row */}
        <div style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: 10, lineHeight: 1 }}>
          {c.originFlag}&nbsp;&nbsp;<span style={{ color: '#00B4D8', fontSize: '.7em', verticalAlign: 'middle' }}>→</span>&nbsp;&nbsp;{c.destFlag}
        </div>

        {/* Headline */}
        <h2 style={{
          fontSize: 'clamp(34px, 6.5vw, 64px)',
          fontWeight: 800, lineHeight: 1.06, letterSpacing: '-.03em',
          color: 'white', margin: '0 0 14px',
          whiteSpace: 'nowrap',
        }}>
          {c.title}
        </h2>

        <p style={{ fontSize: 15, color: 'rgba(255,255,255,.48)', margin: '0 0 52px', lineHeight: 1.65 }}>
          {c.subtitle}
        </p>

        {/* Countdown */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginBottom: 64 }}>
          {CD_UNITS.map((unit, i) => (
            <div key={unit.label} style={{ display: 'flex', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 'clamp(58px, 11vw, 96px)' }}>
                <span style={{
                  fontSize: 'clamp(40px, 8.5vw, 80px)', fontWeight: 800,
                  lineHeight: 1, letterSpacing: '-.04em',
                  fontVariantNumeric: 'tabular-nums', color: 'white',
                }}>
                  {unit.val}
                </span>
                <span style={{
                  fontSize: 9, letterSpacing: '.16em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,.35)', fontWeight: 600, marginTop: 8,
                }}>
                  {unit.label}
                </span>
              </div>
              {i < 3 && (
                <span style={{
                  fontSize: 'clamp(32px, 7vw, 64px)', fontWeight: 300,
                  color: '#00B4D8', lineHeight: 1, padding: '0 3px',
                  opacity: blink ? 1 : 0.12, transition: 'none',
                }}>:</span>
              )}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 40,
          color: 'rgba(255,255,255,.25)',
          fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 600,
        }}>
          <span style={{ width: 100, height: 1, background: 'rgba(255,255,255,.12)', flexShrink: 0 }} />
          En attendant
          <span style={{ width: 100, height: 1, background: 'rgba(255,255,255,.12)', flexShrink: 0 }} />
        </div>

        {/* CTA block */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,.55)', lineHeight: 1.6 }}>
            <strong style={{ color: 'white', fontWeight: 700 }}>{c.ctaTitle}</strong>
            <br />
            {c.ctaSubtitle}
          </p>
          <button
            onClick={onBook}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'linear-gradient(90deg, #00B4D8, #1B4FD8)',
              color: 'white', fontWeight: 700, fontSize: 14.5,
              padding: '13px 28px', borderRadius: 8,
              border: 'none', cursor: 'pointer', letterSpacing: '.01em',
              transition: 'opacity .18s, transform .18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '.88'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; }}
          >
            {c.ctaButton}
          </button>
          <span style={{
            fontSize: 11.5, color: 'rgba(255,255,255,.3)',
            border: '1px solid rgba(255,255,255,.1)', borderRadius: 6,
            padding: '4px 12px', letterSpacing: '.04em',
          }}>
            {c.launchLabel}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes cspin {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: .3; transform: scale(.6); }
        }
      `}</style>
    </section>
  );
}
