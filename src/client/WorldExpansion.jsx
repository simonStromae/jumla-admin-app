'use client';
import { useEffect, useRef } from 'react';

function project(lat, lng, W, H) {
  // Mercator-cropped range matching the EPS image bounds
  const LAT_MAX = 82, LAT_MIN = -55;
  return {
    x: ((lng + 180) / 360) * W,
    y: ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H,
  };
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

const ARCS = [
  { id: 'cn-ca', from: { lat: 31.2, lng: 121.5 }, ctrl: { lat: 74, lng: -28 }, to: { lat: 45.5, lng: -73.6 }, color: '#00B4D8', glow: 'rgba(0,180,216,' },
  { id: 'cn-cm', from: { lat: 31.2, lng: 121.5 }, ctrl: { lat: 5,  lng:  64 }, to: { lat: 4.0,  lng: 9.7   }, color: '#38CBE8', glow: 'rgba(56,203,232,' },
  { id: 'ng-ca', from: { lat: 6.5,  lng: 3.4   }, ctrl: { lat: 38, lng: -44 }, to: { lat: 45.5, lng: -73.6 }, color: '#1B4FD8', glow: 'rgba(27,79,216,' },
];

function initPackets() {
  return ARCS.map(arc => [0, 0.34, 0.67].map(offset => ({
    arc,
    t: offset,
    speed: 0.0012 + Math.random() * 0.0006,
  }))).flat();
}

/* ── Canvas: arcs + packets only (no dot grid — image handles that) ── */
function ArcCanvas() {
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
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      if (!W || !H) { raf.current = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, W, H);

      /* Dashed arc trails */
      for (const arc of ARCS) {
        ctx.save();
        ctx.setLineDash([5, 10]);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = arc.color + '35';
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

      /* City endpoint glow dots */
      const cities = [
        { lat: 31.2, lng: 121.5, color: '#00B4D8' },
        { lat: 45.5, lng: -73.6, color: '#1B4FD8' },
        { lat: 4.0,  lng: 9.7,   color: '#38CBE8' },
        { lat: 6.5,  lng: 3.4,   color: '#1B4FD8' },
      ];
      for (const city of cities) {
        const pt = project(city.lat, city.lng, W, H);
        const ring = ctx.createRadialGradient(pt.x, pt.y, 1, pt.x, pt.y, 14);
        ring.addColorStop(0, city.color + 'cc');
        ring.addColorStop(1, city.color + '00');
        ctx.fillStyle = ring;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 14, 0, Math.PI * 2); ctx.fill();
        ctx.shadowColor = city.color; ctx.shadowBlur = 14;
        ctx.fillStyle = city.color;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }

      /* Animated cargo packets */
      for (const pkt of pkts.current) {
        const pt = arcPt(pkt.t, pkt.arc, W, H);
        const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 11);
        g.addColorStop(0, pkt.arc.glow + '.9)');
        g.addColorStop(1, pkt.arc.glow + '0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 11, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 2.2, 0, Math.PI * 2); ctx.fill();
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
    <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
  );
}

/* ── Route item ── */
const ROUTE_COLORS = ['#00B4D8', '#38CBE8', '#1B4FD8'];
function RouteItem({ route, index }) {
  const color = ROUTE_COLORS[index % ROUTE_COLORS.length];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={{
        display: 'inline-flex', alignSelf: 'flex-start',
        fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase',
        color, padding: '4px 12px', borderRadius: 999,
        background: color + '18', border: '1px solid ' + color + '35',
      }}>
        {route.status}
      </span>
      <div style={{ fontSize: 'clamp(15px, 1.4vw, 18px)', fontWeight: 800, color: 'white', letterSpacing: '-.02em' }}>
        {route.from}
        <span style={{ color, margin: '0 10px', fontWeight: 300 }}>→</span>
        {route.to}
      </div>
      {route.detail && (
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.38)', lineHeight: 1.5 }}>{route.detail}</div>
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
    { from: 'Chine',   to: 'Montréal', status: 'Bientôt disponible', detail: 'Guangzhou · Shenzhen · Shanghai' },
    { from: 'Chine',   to: 'Cameroun', status: 'Bientôt disponible', detail: 'Douala · Yaoundé' },
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
      position: 'relative',
      minHeight: '95vh',
      background: '#0B1220',
      fontFamily: "'Inter', system-ui, sans-serif",
      overflow: 'hidden',
    }}>
      {/* ── World map image — stretched to fill exact section bounds ── */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/world-dots.png)',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        opacity: 0.14,
        pointerEvents: 'none',
      }} />

      {/* ── Animated arcs + packets canvas ── */}
      <ArcCanvas />

      {/* Top vignette */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '30%', pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(11,18,32,.6) 0%, transparent 100%)',
      }} />
      {/* Bottom vignette — text readability */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', pointerEvents: 'none',
        background: 'linear-gradient(to top, #0B1220 25%, rgba(11,18,32,.88) 60%, transparent 100%)',
      }} />

      {/* ── Content anchored to bottom ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
        maxWidth: 1400, margin: '0 auto',
        padding: '0 clamp(20px, 5vw, 72px) clamp(48px, 6vh, 80px)',
      }}>
        {/* Eyebrow */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24,
          fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase',
          color: '#00B4D8',
          background: 'rgba(0,180,216,.10)',
          border: '1px solid rgba(0,180,216,.22)',
          borderRadius: 999, padding: '6px 16px',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: '#00B4D8',
            animation: 'we-pulse 2s ease-in-out infinite',
          }} />
          {c.eyebrow}
        </div>

        {/* Headline + subtitle */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'clamp(260px, 42%, 500px) 1fr',
          gap: 'clamp(24px, 5vw, 72px)',
          alignItems: 'end',
          marginBottom: 44,
        }}>
          <h2 style={{
            fontSize: 'clamp(30px, 4.5vw, 54px)',
            fontWeight: 800, lineHeight: 1.07, letterSpacing: '-.03em',
            color: 'white', margin: 0,
          }}>
            {c.title}
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,.48)', lineHeight: 1.7, margin: 0 }}>
            {c.subtitle}
          </p>
        </div>

        {/* Route items */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'clamp(20px, 4vw, 48px)',
        }}>
          {c.routes.map((route, i) => (
            <RouteItem key={i} route={route} index={i} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes we-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: .3; transform: scale(.6); }
        }
      `}</style>
    </section>
  );
}
