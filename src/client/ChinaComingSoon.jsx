'use client';
import { useEffect, useRef, useState } from 'react';

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

function isChina(lat, lng) {
  return lat > 18 && lat < 42 && lng > 100 && lng < 125;
}

function isCanada(lat, lng) {
  return lat > 42 && lat < 84 && lng > -141 && lng < -52;
}

function bezier(t, a, b, c) {
  const mt = 1 - t;
  return mt * mt * a + 2 * mt * t * b + t * t * c;
}

function project(lat, lng, W, H) {
  return { x: ((lng + 180) / 360) * W, y: ((90 - lat) / 180) * H };
}

const ARC = {
  p0: { lat: 23, lng: 113.3 },
  p1: { lat: 80, lng: -40 },
  p2: { lat: 45.5, lng: -73.6 },
};

function arcPoint(t, W, H) {
  const lat = bezier(t, ARC.p0.lat, ARC.p1.lat, ARC.p2.lat);
  const lng = bezier(t, ARC.p0.lng, ARC.p1.lng, ARC.p2.lng);
  return project(lat, lng, W, H);
}

function pad(n) { return String(n).padStart(2, '0'); }

const LAUNCH = new Date('2026-08-31T00:00:00');

function useCountdown() {
  const [vals, setVals] = useState({ d: '--', h: '--', m: '--', s: '--' });
  useEffect(() => {
    function tick() {
      const diff = LAUNCH - Date.now();
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
  }, []);
  return vals;
}

function WorldMapCanvas() {
  const ref = useRef(null);
  const raf = useRef(null);
  const packets = useRef([0.05, 0.28, 0.52, 0.77].map(t => ({ t, speed: 0.0016 + Math.random() * 0.0008 })));

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    function draw() {
      const W = canvas.width, H = canvas.height;
      if (!W || !H) { raf.current = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, W, H);

      const GAP = Math.max(8, Math.min(11, W / 120));
      const DOT = GAP * 0.22;
      const rows = Math.ceil(H / (GAP * 0.866));
      const cols = Math.ceil(W / GAP) + 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * GAP + (r % 2 === 0 ? 0 : GAP / 2);
          const y = r * GAP * 0.866;
          if (x > W + GAP) continue;
          const lng = (x / W) * 360 - 180;
          const lat = 90 - (y / H) * 180;
          if (!isLand(lat, lng)) continue;
          ctx.fillStyle = isChina(lat, lng)
            ? 'rgba(34,197,94,0.82)'
            : isCanada(lat, lng)
            ? 'rgba(34,197,94,0.65)'
            : 'rgba(34,197,94,0.14)';
          ctx.beginPath();
          ctx.arc(x, y, DOT, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Dashed arc
      ctx.save();
      ctx.setLineDash([3, 7]);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(34,197,94,0.28)';
      ctx.beginPath();
      const s0 = arcPoint(0, W, H);
      ctx.moveTo(s0.x, s0.y);
      for (let t = 0.02; t <= 1; t += 0.02) {
        const pt = arcPoint(t, W, H);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.restore();

      // Packets
      for (const pkt of packets.current) {
        const pt = arcPoint(pkt.t, W, H);
        const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 7);
        g.addColorStop(0, 'rgba(74,222,128,.85)');
        g.addColorStop(1, 'rgba(74,222,128,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#4ade80';
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2); ctx.fill();
        pkt.t += pkt.speed;
        if (pkt.t > 1) pkt.t = 0;
      }

      // Endpoint dots
      ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 12;
      ctx.fillStyle = '#22c55e';
      [arcPoint(0, W, H), arcPoint(1, W, H)].forEach(pt => {
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2); ctx.fill();
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

  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  );
}

export default function ChinaComingSoon({ onBook }) {
  const { d, h, m, s } = useCountdown();
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setBlink(v => !v), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      background: '#060f0c',
    }}>
      <WorldMapCanvas />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 75% 55% at 50% 50%, transparent 20%, #060f0c 100%), linear-gradient(to bottom, #060f0c 0%, transparent 15%, transparent 80%, #060f0c 100%)',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 10,
        textAlign: 'center', padding: '80px 24px 100px',
        maxWidth: 720, width: '100%',
      }}>
        {/* Eyebrow */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase',
          color: '#4ade80', background: 'rgba(34,197,94,0.12)',
          border: '1px solid rgba(34,197,94,0.18)', borderRadius: 999,
          padding: '6px 16px', marginBottom: 36,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', background: '#22c55e',
            animation: 'cs-pulse 2s ease-in-out infinite',
          }} />
          Bientôt disponible
        </div>

        {/* Headline */}
        <h2 style={{
          fontSize: 'clamp(36px, 7vw, 68px)',
          fontWeight: 800, lineHeight: 1.06,
          letterSpacing: '-.03em', color: '#e2f5e9',
          margin: '0 0 16px',
        }}>
          🇨🇳 Chine{' '}
          <span style={{ color: '#22c55e' }}>→</span>{' '}
          Montréal 🇨🇦
        </h2>

        <p style={{ fontSize: 15, color: '#6b9980', marginBottom: 56, lineHeight: 1.6 }}>
          Une nouvelle route cargo directe. Guangzhou · Shenzhen · Shanghai vers le Canada.
        </p>

        {/* Countdown */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginBottom: 68 }}>
          {[
            { val: d, label: 'Jours' },
            { val: h, label: 'Heures' },
            { val: m, label: 'Minutes' },
            { val: s, label: 'Secondes' },
          ].map((unit, i) => (
            <div key={unit.label} style={{ display: 'flex', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 'clamp(64px,11vw,100px)' }}>
                <span style={{
                  fontSize: 'clamp(44px,9vw,84px)', fontWeight: 800,
                  letterSpacing: '-.04em', lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums', color: '#e2f5e9',
                }}>
                  {unit.val}
                </span>
                <span style={{
                  fontSize: 9, letterSpacing: '.16em', textTransform: 'uppercase',
                  color: '#4a7358', fontWeight: 600, marginTop: 8,
                }}>
                  {unit.label}
                </span>
              </div>
              {i < 3 && (
                <span style={{
                  fontSize: 'clamp(36px,7vw,68px)', fontWeight: 300,
                  color: '#22c55e', lineHeight: 1, padding: '0 4px',
                  opacity: blink ? 1 : 0.12, transition: 'opacity 0s',
                }}>
                  :
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          marginBottom: 40, color: '#4a7358',
          fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 600,
        }}>
          <span style={{ flex: 1, height: 1, background: 'rgba(34,197,94,0.15)', maxWidth: 140, display: 'block' }} />
          En attendant
          <span style={{ flex: 1, height: 1, background: 'rgba(34,197,94,0.15)', maxWidth: 140, display: 'block' }} />
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          <p style={{ fontSize: 15, color: '#6b9980', lineHeight: 1.55 }}>
            <strong style={{ color: '#e2f5e9', fontWeight: 700 }}>
              Nos cargaisons Cameroun → Montréal sont ouvertes.
            </strong>
            <br />
            Expédiez dès aujourd'hui avec Jumla Cargo.
          </p>
          <button
            onClick={onBook}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'linear-gradient(135deg, #00B4D8, #1B4FD8)',
              color: 'white', fontWeight: 800, fontSize: 14,
              padding: '14px 28px', borderRadius: 999,
              border: 'none', cursor: 'pointer',
              letterSpacing: '.01em',
              transition: 'opacity .18s, transform .18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '.88'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; }}
          >
            Réserver une expédition →
          </button>
          <span style={{
            fontSize: 11, color: '#4a7358',
            border: '1px solid rgba(34,197,94,0.15)', borderRadius: 6,
            padding: '4px 12px', letterSpacing: '.04em',
          }}>
            🚀 Lancement prévu : 31 août 2026
          </span>
        </div>
      </div>

      <style>{`
        @keyframes cs-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: .35; transform: scale(.65); }
        }
      `}</style>
    </section>
  );
}
