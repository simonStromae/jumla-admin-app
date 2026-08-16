'use client';
import { useEffect, useRef } from 'react';

/* ── Fine-grained land detection ── */
function isLand(lat, lng) {
  // North America
  if (lat > 68 && lat < 84 && lng > -120 && lng < -65)  return true; // Canadian Arctic
  if (lat > 60 && lat < 72 && lng > -141 && lng < -65)  return true; // Alaska + N Canada
  if (lat > 49 && lat < 63 && lng > -140 && lng < -55)  return true; // Canada main
  if (lat > 42 && lat < 50 && lng > -128 && lng < -66)  return true; // N USA / Great Lakes
  if (lat > 32 && lat < 43 && lng > -124 && lng < -75)  return true; // S USA
  if (lat > 25 && lat < 33 && lng > -118 && lng < -97)  return true; // SW USA / NW Mexico
  if (lat > 17 && lat < 30 && lng > -115 && lng < -88)  return true; // Mexico
  if (lat > 7  && lat < 18 && lng > -92  && lng < -77)  return true; // Central America
  if (lat > 6  && lat < 12 && lng > -77  && lng < -73)  return true; // Colombia NW
  // Florida peninsula
  if (lat > 24 && lat < 31 && lng > -82  && lng < -80)  return true;
  // SE USA
  if (lat > 30 && lat < 37 && lng > -85  && lng < -75)  return true;

  // Greenland
  if (lat > 59 && lat < 84 && lng > -54  && lng < -15)  return true;

  // South America
  if (lat > 8  && lat < 12 && lng > -75  && lng < -60)  return true; // N Venezuela
  if (lat > 3  && lat < 12 && lng > -78  && lng < -60)  return true; // Colombia/Venezuela
  if (lat > -5 && lat < 6  && lng > -80  && lng < -48)  return true; // Ecuador/N Brazil
  if (lat > -12 && lat < -3 && lng > -77 && lng < -38)  return true; // C Brazil N
  if (lat > -20 && lat < -10 && lng > -68 && lng < -37) return true; // C Brazil S
  if (lat > -26 && lat < -18 && lng > -66 && lng < -43) return true; // S Brazil
  if (lat > -38 && lat < -25 && lng > -70 && lng < -52) return true; // Argentina N/Uruguay
  if (lat > -56 && lat < -37 && lng > -76 && lng < -60) return true; // Patagonia
  if (lat > -20 && lat < -10 && lng > -78 && lng < -68) return true; // Peru/Bolivia
  if (lat > -10 && lat < 0  && lng > -78 && lng < -70)  return true; // Peru coast

  // Europe
  if (lat > 36 && lat < 44 && lng > -9  && lng < 5)    return true; // Iberia
  if (lat > 43 && lat < 52 && lng > -5  && lng < 8)    return true; // France/Benelux
  if (lat > 44 && lat < 55 && lng > 8   && lng < 24)   return true; // Germany/Poland/Balkans
  if (lat > 52 && lat < 60 && lng > -3  && lng < 20)   return true; // UK/Denmark/Baltic
  if (lat > 56 && lat < 72 && lng > 4   && lng < 18)   return true; // Norway/Sweden
  if (lat > 56 && lat < 70 && lng > 18  && lng < 32)   return true; // Finland
  if (lat > 36 && lat < 42 && lng > 5   && lng < 18)   return true; // Italy
  if (lat > 40 && lat < 43 && lng > 18  && lng < 30)   return true; // Greece/Albania
  if (lat > 36 && lat < 42 && lng > 26  && lng < 42)   return true; // Turkey W

  // Africa
  if (lat > 30 && lat < 38 && lng > -6  && lng < 10)   return true; // Morocco/Tunisia
  if (lat > 23 && lat < 32 && lng > 24  && lng < 37)   return true; // Egypt
  if (lat > 18 && lat < 30 && lng > -18 && lng < 38)   return true; // Sahara band
  if (lat > 10 && lat < 20 && lng > -18 && lng < 42)   return true; // Sahel
  if (lat > 4  && lat < 12 && lng > -18 && lng < 45)   return true; // W Africa
  if (lat > -5 && lat < 6  && lng > -5  && lng < 45)   return true; // Equatorial Africa
  if (lat > -14 && lat < -3 && lng > 11 && lng < 40)   return true; // C Africa
  if (lat > -26 && lat < -13 && lng > 13 && lng < 36)  return true; // S Africa N
  if (lat > -36 && lat < -24 && lng > 17 && lng < 33)  return true; // S Africa tip
  if (lat > -4 && lat < 12 && lng > 40  && lng < 52)   return true; // Horn of Africa

  // Middle East / Arabian Peninsula
  if (lat > 28 && lat < 38 && lng > 34  && lng < 48)   return true; // Turkey E / Iraq / Syria
  if (lat > 12 && lat < 30 && lng > 34  && lng < 60)   return true; // Arabian Peninsula
  if (lat > 22 && lat < 37 && lng > 44  && lng < 60)   return true; // Iran W

  // Russia / N Asia
  if (lat > 50 && lat < 65 && lng > 40  && lng < 110)  return true; // W Siberia
  if (lat > 50 && lat < 70 && lng > 110 && lng < 145)  return true; // E Siberia
  if (lat > 63 && lat < 75 && lng > 60  && lng < 145)  return true; // N Siberia
  if (lat > 40 && lat < 52 && lng > 40  && lng < 70)   return true; // Kazakhstan

  // Central Asia
  if (lat > 36 && lat < 44 && lng > 48  && lng < 75)   return true; // Iran / Turkmenistan / Afghanistan
  if (lat > 30 && lat < 42 && lng > 60  && lng < 75)   return true; // Afghanistan/Pakistan N

  // South Asia
  if (lat > 20 && lat < 30 && lng > 70  && lng < 88)   return true; // India N
  if (lat > 8  && lat < 22 && lng > 72  && lng < 87)   return true; // India S
  if (lat > 22 && lat < 30 && lng > 88  && lng < 97)   return true; // Bangladesh/Myanmar N
  if (lat > 6  && lat < 9  && lng > 79  && lng < 82)   return true; // Sri Lanka

  // China / E Asia
  if (lat > 42 && lat < 53 && lng > 97  && lng < 135)  return true; // N China/Manchuria
  if (lat > 30 && lat < 43 && lng > 72  && lng < 100)  return true; // Tibet/W China
  if (lat > 20 && lat < 42 && lng > 100 && lng < 122)  return true; // China main
  if (lat > 30 && lat < 39 && lng > 122 && lng < 130)  return true; // Korea/E China

  // Japan
  if (lat > 30 && lat < 46 && lng > 129 && lng < 146)  return true;

  // SE Asia
  if (lat > 5  && lat < 22 && lng > 96  && lng < 106)  return true; // Thailand/Myanmar
  if (lat > 5  && lat < 22 && lng > 100 && lng < 110)  return true; // Indochina
  if (lat > -8 && lat < 7  && lng > 100 && lng < 120)  return true; // Malay/Sumatra/Borneo
  if (lat > -8 && lat < 3  && lng > 120 && lng < 141)  return true; // New Guinea/Sulawesi

  // Australia
  if (lat > -38 && lat < -22 && lng > 113 && lng < 154) return true;
  if (lat > -22 && lat < -12 && lng > 126 && lng < 154) return true;
  if (lat > -46 && lat < -38 && lng > 143 && lng < 149) return true; // Tasmania

  return false;
}

function isChina(lat, lng)    { return lat > 20  && lat < 42 && lng > 100 && lng < 122; }
function isCanada(lat, lng)   { return lat > 43  && lat < 84 && lng > -141 && lng < -52; }
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
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function dotColor(lat, lng) {
      if (isChina(lat, lng))    return 'rgba(0,180,216,.75)';
      if (isCanada(lat, lng))   return 'rgba(27,79,216,.65)';
      if (isCameroon(lat, lng)) return 'rgba(56,203,232,.70)';
      if (isNigeria(lat, lng))  return 'rgba(27,79,216,.68)';
      return 'rgba(255,255,255,.08)';
    }

    function draw() {
      if (!W || !H) { raf.current = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, W, H);

      const GAP = Math.max(7, Math.min(10, W / 140));
      const DOT = GAP * 0.20;
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
        ctx.setLineDash([5, 10]);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = arc.color + '28';
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

      /* City endpoint dots with pulse rings */
      const cities = [
        { lat: 31.2, lng: 121.5, color: '#00B4D8' },
        { lat: 45.5, lng: -73.6, color: '#1B4FD8' },
        { lat: 4.0,  lng: 9.7,   color: '#38CBE8' },
        { lat: 6.5,  lng: 3.4,   color: '#1B4FD8' },
      ];
      for (const city of cities) {
        const pt = project(city.lat, city.lng, W, H);
        // Outer glow ring
        const ring = ctx.createRadialGradient(pt.x, pt.y, 2, pt.x, pt.y, 12);
        ring.addColorStop(0, city.color + 'aa');
        ring.addColorStop(1, city.color + '00');
        ctx.fillStyle = ring;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 12, 0, Math.PI * 2); ctx.fill();
        // Core dot
        ctx.shadowColor = city.color; ctx.shadowBlur = 12;
        ctx.fillStyle = city.color;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }

      /* Animated packets */
      for (const pkt of pkts.current) {
        const pt = arcPt(pkt.t, pkt.arc, W, H);
        const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 10);
        g.addColorStop(0, pkt.arc.glow + '.85)');
        g.addColorStop(1, pkt.arc.glow + '0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2); ctx.fill();
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

/* ── Route item (no card chrome) ── */
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
      <div style={{
        fontSize: 'clamp(15px, 1.4vw, 18px)', fontWeight: 800,
        color: 'white', letterSpacing: '-.02em',
      }}>
        {route.from}
        <span style={{ color, margin: '0 10px', fontWeight: 300 }}>→</span>
        {route.to}
      </div>
      {route.detail && (
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.38)', lineHeight: 1.5, letterSpacing: '.01em' }}>
          {route.detail}
        </div>
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
      {/* ── Full-section canvas background ── */}
      <WorldMapCanvas />

      {/* Top vignette */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '40%', pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(11,18,32,.5) 0%, transparent 100%)',
      }} />
      {/* Bottom vignette — makes text readable */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%', pointerEvents: 'none',
        background: 'linear-gradient(to top, #0B1220 30%, rgba(11,18,32,.85) 65%, transparent 100%)',
      }} />

      {/* ── Content anchored to bottom of section ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
        maxWidth: 1400, margin: '0 auto',
        padding: '0 clamp(20px, 5vw, 72px) clamp(48px, 6vh, 80px)',
        display: 'flex', flexDirection: 'column', gap: 0,
      }}>
        {/* Eyebrow */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24,
          alignSelf: 'flex-start',
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
          marginBottom: 48,
        }}>
          <h2 style={{
            fontSize: 'clamp(30px, 4.5vw, 54px)',
            fontWeight: 800, lineHeight: 1.07, letterSpacing: '-.03em',
            color: 'white', margin: 0,
            textWrap: 'balance',
          }}>
            {c.title}
          </h2>
          <p style={{
            fontSize: 15, color: 'rgba(255,255,255,.48)',
            lineHeight: 1.7, margin: 0,
          }}>
            {c.subtitle}
          </p>
        </div>

        {/* Route items — no card backgrounds */}
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
        @media (max-width: 640px) {
          .we-routes { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
