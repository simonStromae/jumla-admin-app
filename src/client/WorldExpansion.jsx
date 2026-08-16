'use client';
import { useEffect, useRef } from 'react';

/* ── Land detection ── */
function isLand(lat, lng) {
  if (lat > 7  && lat < 84  && lng > -168 && lng < -52)  return true;
  if (lat > -56 && lat < 13  && lng > -82  && lng < -34)  return true;
  if (lat > 36  && lat < 72  && lng > -10  && lng < 40)   return true;
  if (lat > -35 && lat < 37  && lng > -18  && lng < 52)   return true;
  if (lat > 50  && lat < 78  && lng > 40   && lng < 180)  return true;
  if (lat > 18  && lat < 55  && lng > 72   && lng < 145)  return true;
  if (lat > 5   && lat < 37  && lng > 60   && lng < 100)  return true;
  if (lat > -10 && lat < 22  && lng > 95   && lng < 145)  return true;
  if (lat > -45 && lat < -10 && lng > 113  && lng < 155)  return true;
  if (lat > 59  && lat < 84  && lng > -54  && lng < -15)  return true;
  if (lat > 30  && lat < 46  && lng > 129  && lng < 146)  return true;
  if (lat > 55  && lat < 72  && lng > 4    && lng < 32)   return true;
  return false;
}
function isChina(lat, lng)    { return lat > 18  && lat < 42 && lng > 100 && lng < 125; }
function isCanada(lat, lng)   { return lat > 42  && lat < 84 && lng > -141 && lng < -52; }
function isCameroon(lat, lng) { return lat > 2   && lat < 13 && lng > 8   && lng < 16.5; }
function isNigeria(lat, lng)  { return lat > 4   && lat < 14 && lng > 2.5 && lng < 15; }

function project(lat, lng, W, H) {
  return { x: ((lng + 180) / 360) * W, y: ((90 - lat) / 180) * H };
}
function bezier(t, a, b, c) {
  const mt = 1 - t;
  return mt * mt * a + 2 * mt * t * b + t * t * c;
}
function arcPt(t, arc, W, H) {
  return project(
    bezier(t, arc.from.lat, arc.ctrl.lat, arc.to.lat),
    bezier(t, arc.from.lng, arc.ctrl.lng, arc.to.lng),
    W, H,
  );
}

/* 3 routes — geographic arcs, always fixed */
const ARCS = [
  { id: 'cn-ca', from: { lat: 31.2, lng: 121.5 }, ctrl: { lat: 74, lng: -28 }, to: { lat: 45.5, lng: -73.6 }, color: '#00B4D8', glow: 'rgba(0,180,216,' },
  { id: 'cn-cm', from: { lat: 31.2, lng: 121.5 }, ctrl: { lat: 5,  lng:  64 }, to: { lat: 4.0, lng: 9.7    }, color: '#38CBE8', glow: 'rgba(56,203,232,' },
  { id: 'ng-ca', from: { lat: 6.5,  lng: 3.4   }, ctrl: { lat: 38, lng: -44 }, to: { lat: 45.5, lng: -73.6 }, color: '#1B4FD8', glow: 'rgba(27,79,216,' },
];

/* 3 staggered packets per arc */
function initPackets() {
  return ARCS.map(arc => [0, 0.34, 0.67].map(offset => ({
    arc,
    t: offset,
    speed: 0.0013 + Math.random() * 0.0006,
  }))).flat();
}

function WorldMapCanvas() {
  const ref  = useRef(null);
  const raf  = useRef(null);
  const pkts = useRef(initPackets());

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const lw = canvas.offsetWidth;
      const lh = canvas.offsetHeight;
      canvas.width  = lw * dpr;
      canvas.height = lh * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      W = lw; H = lh;
    }

    function dotColor(lat, lng) {
      if (isChina(lat, lng))    return 'rgba(0,180,216,.72)';
      if (isCanada(lat, lng))   return 'rgba(27,79,216,.62)';
      if (isCameroon(lat, lng)) return 'rgba(56,203,232,.68)';
      if (isNigeria(lat, lng))  return 'rgba(27,79,216,.65)';
      return 'rgba(255,255,255,.07)';
    }

    function draw() {
      if (!W || !H) { raf.current = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, W, H);

      const GAP = Math.max(8, Math.min(11, W / 130));
      const DOT = GAP * 0.22;
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
          ctx.fillStyle = dotColor(lat, lng);
          ctx.beginPath();
          ctx.arc(x, y, DOT, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      /* Dashed arcs */
      for (const arc of ARCS) {
        ctx.save();
        ctx.setLineDash([4, 9]);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = arc.color + '30';
        ctx.beginPath();
        const s = arcPt(0, arc, W, H);
        ctx.moveTo(s.x, s.y);
        for (let t = 0.02; t <= 1; t += 0.02) {
          const p = arcPt(t, arc, W, H);
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.restore();
      }

      /* City endpoint dots */
      const cities = [
        { lat: 31.2, lng: 121.5, color: '#00B4D8' }, // Shanghai
        { lat: 45.5, lng: -73.6, color: '#1B4FD8' }, // Montréal
        { lat: 4.0,  lng: 9.7,   color: '#38CBE8' }, // Douala
        { lat: 6.5,  lng: 3.4,   color: '#1B4FD8' }, // Lagos
      ];
      for (const city of cities) {
        const pt = project(city.lat, city.lng, W, H);
        ctx.shadowColor = city.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = city.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      /* Animated packets */
      for (const pkt of pkts.current) {
        const pt = arcPt(pkt.t, pkt.arc, W, H);
        const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 9);
        g.addColorStop(0, pkt.arc.glow + '.82)');
        g.addColorStop(1, pkt.arc.glow + '0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = pkt.arc.color;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2); ctx.fill();
        pkt.t += pkt.speed;
        if (pkt.t > 1) pkt.t = 0;
      }

      raf.current = requestAnimationFrame(draw);
    }

    resize();
    draw();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => { cancelAnimationFrame(raf.current); ro.disconnect(); };
  }, []);

  return (
    <canvas ref={ref} style={{ display: 'block', width: '100%', height: '100%' }} />
  );
}

/* ── Route badge card ── */
const ROUTE_COLORS = ['#00B4D8', '#38CBE8', '#1B4FD8'];

function RouteCard({ route, index }) {
  const color = ROUTE_COLORS[index % ROUTE_COLORS.length];
  return (
    <div style={{
      padding: '18px 20px',
      background: 'rgba(255,255,255,.04)',
      border: '1px solid rgba(255,255,255,.08)',
      borderRadius: 12,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
          color, background: color + '18', border: '1px solid ' + color + '30',
          borderRadius: 999, padding: '3px 10px',
        }}>
          {route.status}
        </span>
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: 'white', letterSpacing: '-.02em' }}>
        {route.from}
        <span style={{ color, margin: '0 8px', fontWeight: 400 }}>→</span>
        {route.to}
      </div>
      {route.detail && (
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', lineHeight: 1.5 }}>{route.detail}</div>
      )}
    </div>
  );
}

/* ── Defaults ── */
const DEFAULTS = {
  eyebrow:  'Expansion mondiale',
  title:    'Jumla s\'ouvre au monde',
  subtitle: 'Nos nouvelles routes cargo connectent l\'Asie, l\'Afrique et le Canada.',
  routes: [
    { from: 'Chine', to: 'Montréal', status: 'Bientôt disponible', detail: 'Guangzhou · Shenzhen · Shanghai' },
    { from: 'Chine', to: 'Cameroun', status: 'Bientôt disponible', detail: 'Douala · Yaoundé' },
    { from: 'Nigeria', to: 'Montréal', status: 'Bientôt disponible', detail: 'Lagos · Abuja' },
  ],
};

/* ── Section ── */
export default function WorldExpansion({ content }) {
  const c = {
    ...DEFAULTS,
    ...content,
    routes: (content?.routes ?? DEFAULTS.routes).map((r, i) => ({ ...DEFAULTS.routes[i], ...r })),
  };

  return (
    <section style={{
      background: '#0B1220',
      fontFamily: "'Inter', system-ui, sans-serif",
      overflow: 'hidden',
    }}>
      {/* ── Content ── */}
      <div style={{
        maxWidth: 1400, margin: '0 auto',
        padding: '80px clamp(20px, 5vw, 72px) 52px',
      }}>
        {/* Eyebrow */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28,
          fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase',
          color: '#00B4D8',
          background: 'rgba(0,180,216,.1)',
          border: '1px solid rgba(0,180,216,.22)',
          borderRadius: 999, padding: '6px 16px',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: '#00B4D8',
            animation: 'we-pulse 2s ease-in-out infinite',
          }} />
          {c.eyebrow}
        </div>

        {/* Headline + subtitle row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'clamp(280px, 45%, 520px) 1fr',
          gap: 'clamp(24px, 6vw, 80px)',
          alignItems: 'end',
          marginBottom: 40,
        }}>
          <h2 style={{
            fontSize: 'clamp(28px, 4.5vw, 52px)',
            fontWeight: 800, lineHeight: 1.08, letterSpacing: '-.03em',
            color: 'white', margin: 0,
          }}>
            {c.title}
          </h2>
          <p style={{
            fontSize: 15, color: 'rgba(255,255,255,.5)',
            lineHeight: 1.65, margin: 0,
          }}>
            {c.subtitle}
          </p>
        </div>

        {/* Route cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 14,
        }}>
          {c.routes.map((route, i) => (
            <RouteCard key={i} route={route} index={i} />
          ))}
        </div>
      </div>

      {/* ── World map canvas ── */}
      <div style={{
        position: 'relative',
        height: 'clamp(280px, 32vw, 440px)',
        marginTop: 8,
      }}>
        {/* Edge fade top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 80, zIndex: 2, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, #0B1220, transparent)',
        }} />
        {/* Edge fade bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, zIndex: 2, pointerEvents: 'none',
          background: 'linear-gradient(to top, #0B1220, transparent)',
        }} />
        <WorldMapCanvas />
      </div>

      {/* Bottom padding */}
      <div style={{ height: 64, background: '#0B1220' }} />

      <style>{`
        @keyframes we-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: .3; transform: scale(.6); }
        }
        @media (max-width: 640px) {
          .we-grid { grid-template-columns: 1fr !important; }
          .we-routes { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
