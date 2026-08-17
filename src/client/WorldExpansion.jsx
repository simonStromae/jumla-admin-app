'use client';
import { useEffect, useRef } from 'react';

/* ── Projection — matched to the world-dots.png lat range ── */
const LAT_MAX = 82, LAT_MIN = -55;
function project(lat, lng, W, H) {
  return {
    x: ((lng + 180) / 360) * W,
    y: ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H,
  };
}
function bezier(t, a, b, c) { const mt = 1 - t; return mt * mt * a + 2 * mt * t * b + t * t * c; }
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
    arc, t: offset, speed: 0.0012 + Math.random() * 0.0006,
  }))).flat();
}

/* ── Arc + packet canvas (covers full section, same projection as map) ── */
function ArcCanvas({ height }) {
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
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      if (!W || !H) { raf.current = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, W, H);

      for (const arc of ARCS) {
        ctx.save();
        ctx.setLineDash([5, 10]);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = arc.color + '40';
        ctx.beginPath();
        const s = arcPt(0, arc, W, H);
        ctx.moveTo(s.x, s.y);
        for (let t = 0.02; t <= 1; t += 0.02) { const p = arcPt(t, arc, W, H); ctx.lineTo(p.x, p.y); }
        ctx.stroke();
        ctx.restore();
      }

      const cities = [
        { lat: 31.2, lng: 121.5, color: '#00B4D8' },
        { lat: 45.5, lng: -73.6, color: '#1B4FD8' },
        { lat: 4.0,  lng: 9.7,   color: '#38CBE8' },
        { lat: 6.5,  lng: 3.4,   color: '#1B4FD8' },
      ];
      for (const city of cities) {
        const pt = project(city.lat, city.lng, W, H);
        const ring = ctx.createRadialGradient(pt.x, pt.y, 1, pt.x, pt.y, 14);
        ring.addColorStop(0, city.color + 'cc'); ring.addColorStop(1, city.color + '00');
        ctx.fillStyle = ring;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 14, 0, Math.PI * 2); ctx.fill();
        ctx.shadowColor = city.color; ctx.shadowBlur = 14;
        ctx.fillStyle = city.color;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }

      for (const pkt of pkts.current) {
        const pt = arcPt(pkt.t, pkt.arc, W, H);
        const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 11);
        g.addColorStop(0, pkt.arc.glow + '.9)'); g.addColorStop(1, pkt.arc.glow + '0)');
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

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />;
}

/* ── Route item ── */
const ROUTE_COLORS = ['#00B4D8', '#38CBE8', '#1B4FD8'];
function RouteItem({ route, index }) {
  const color = ROUTE_COLORS[index % ROUTE_COLORS.length];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 13, fontWeight: 700, color: 'white', letterSpacing: '-.01em',
      }}>
        <span style={{ color, fontSize: 16 }}>◈</span>
        {route.from}
        <span style={{ color, fontWeight: 300, fontSize: 14 }}>→</span>
        {route.to}
      </div>
      {route.detail && (
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', lineHeight: 1.55, paddingLeft: 22 }}>
          {route.detail}
        </div>
      )}
      <div style={{ paddingLeft: 22 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
          color, background: color + '15', border: '1px solid ' + color + '30',
          borderRadius: 999, padding: '3px 10px',
        }}>
          {route.status}
        </span>
      </div>
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
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* ── Text content — top, in normal flow ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        maxWidth: 1400, width: '100%', margin: '0 auto',
        padding: 'clamp(56px, 8vh, 96px) clamp(20px, 5vw, 72px) 0',
      }}>
        {/* Eyebrow */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28,
          fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase',
          color: '#00B4D8', background: 'rgba(0,180,216,.10)',
          border: '1px solid rgba(0,180,216,.22)', borderRadius: 999, padding: '6px 16px',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00B4D8', animation: 'we-pulse 2s ease-in-out infinite' }} />
          {c.eyebrow}
        </div>

        {/* Headline | Subtitle */}
        <div className="we-head-grid">
          <h2 style={{
            fontSize: 'clamp(32px, 4.5vw, 56px)',
            fontWeight: 800, lineHeight: 1.07, letterSpacing: '-.03em',
            color: 'white', margin: 0,
          }}>
            {c.title}
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,.48)', lineHeight: 1.7, margin: 0 }}>
            {c.subtitle}
          </p>
        </div>

        {/* Horizontal rule */}
        <div style={{ height: 1, background: 'rgba(255,255,255,.08)', marginBottom: 36 }} />

        {/* Route items */}
        <div className="we-routes-grid">
          {c.routes.map((route, i) => <RouteItem key={i} route={route} index={i} />)}
        </div>
      </div>

      {/* ── World map — fills remaining space at bottom ── */}
      <div style={{ flex: 1, position: 'relative', minHeight: 320 }}>
        {/* Fade top edge of map area into section background */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '45%', zIndex: 2, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, #0B1220 0%, transparent 100%)',
        }} />
        {/* Fade bottom edge */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '25%', zIndex: 2, pointerEvents: 'none',
          background: 'linear-gradient(to top, #0B1220 0%, transparent 100%)',
        }} />

        {/* Map image */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/world-dots.png)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          opacity: 0.20,
        }} />

        {/* Arc canvas — same bounds as map div */}
        <ArcCanvas />
      </div>

      <style>{`
        @keyframes we-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: .3; transform: scale(.6); }
        }
        .we-head-grid {
          display: grid;
          grid-template-columns: clamp(280px, 45%, 540px) 1fr;
          gap: clamp(32px, 6vw, 96px);
          align-items: end;
          margin-bottom: 40px;
        }
        .we-routes-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(20px, 4vw, 56px);
          padding-bottom: clamp(40px, 5vh, 64px);
        }
        @media (max-width: 768px) {
          .we-head-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .we-routes-grid {
            grid-template-columns: 1fr;
            gap: 28px;
          }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .we-routes-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </section>
  );
}
