import { useState, useEffect } from 'react';
import I from '../components/Icons.jsx';
import { Bi, RoutePill, Avatar, Progress } from '../components/Shell.jsx';

export default function AnalyticsScreen({ onNav }) {
  const [year, setYear] = useState(2026);
  const [routeFilter, setRouteFilter] = useState('all');
  const [period, setPeriod] = useState('ytd');
  const [kpi, setKpi] = useState(null);
  const [monthData, setMonthData] = useState({ labels: [], revenue: [], costs: [] });
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/analytics').then(r => r.json()),
      fetch('/api/routes').then(r => r.json()),
    ]).then(([analyticsData, routesData]) => {
      if (analyticsData.kpi) setKpi(analyticsData.kpi);
      if (analyticsData.months) {
        setMonthData({
          labels: analyticsData.months.labels || [],
          revenue: analyticsData.months.revenue || [],
          costs: analyticsData.months.costs || [],
        });
      }
      setRoutes(Array.isArray(routesData) ? routesData : []);
    }).catch(() => {});
  }, [year]);

  if (!kpi) {
    return (
      <div className="page">
        <div className="page__head">
          <div>
            <div className="page__title"><Bi fr="Analyses" en="Analytics" /></div>
            <div className="page__sub">Chargement des données…</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--ink-400)', fontSize: 14 }}>
          Chargement en cours…
        </div>
      </div>
    );
  }

  const {
    totalCollected, totalInvoiced, totalWeight, totalParcels,
    recoveryRate, totalCosts, grossMargin, grossMarginPct,
    avgCostPerKg, marginPerParcel,
  } = kpi;

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__title"><Bi fr="Analyses" en="Analytics" /></div>
          <div className="page__sub">Performance commerciale, opérationnelle et financière · {year}</div>
        </div>
        <div className="page__actions">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 6px 4px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'white', fontSize: 12.5 }}>
            <I.Calendar style={{ width: 14, height: 14, color: 'var(--ink-400)' }} />
            <select value={year} onChange={e => setYear(+e.target.value)} style={{ border: 0, background: 'transparent', fontWeight: 600, paddingRight: 4 }}>
              <option>2026</option><option>2025</option><option>2024</option>
            </select>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 6px 4px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'white', fontSize: 12.5 }}>
            <I.Route style={{ width: 14, height: 14, color: 'var(--ink-400)' }} />
            <select value={routeFilter} onChange={e => setRouteFilter(e.target.value)} style={{ border: 0, background: 'transparent', fontWeight: 600, paddingRight: 4 }}>
              <option value="all">Toutes les routes</option>
              {routes.map(r => <option key={r.id} value={r.id}>{r.code}</option>)}
            </select>
          </div>
          <div className="tabs" style={{ padding: 2 }}>
            {[['ytd','YTD'],['month','Mois'],['12m','12 mois']].map(([id, lbl]) => (
              <button key={id} className={'tab '+(period===id?'is-active':'')} onClick={() => setPeriod(id)} style={{ padding: '4px 10px', fontSize: 11.5 }}>{lbl}</button>
            ))}
          </div>
          <button className="btn btn--ghost"><I.Download />Export PDF</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 18 }}>
        <KpiCard label="CA encaissé" en="Revenue" value={(totalCollected/1000).toFixed(1)+'k'} unit="CAD" color="var(--ok-500)" big />
        <KpiCard label="Taux recouvrement" en="Recovery" value={recoveryRate} unit="%" progress={recoveryRate} color="var(--brand-500)" />
        <KpiCard label="Colis livrés" en="Parcels" value={totalParcels.toLocaleString('fr')} unit="" color="var(--info-500)" />
        <KpiCard label="Poids transporté" en="Weight" value={(totalWeight/1000).toFixed(1)} unit="t" color="var(--brand-500)" />
        <KpiCard label="Impayés" en="Outstanding" value="—" unit="CAD" color="var(--bad-500)" sub="Données non disponibles" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
        <KpiCard label="Coûts opérationnels" en="Op. Costs" value={(totalCosts/1000).toFixed(1)+'k'} unit="CAD" color="var(--bad-500)" />
        <KpiCard label="Coût moyen / kg" en="Cost / kg" value={avgCostPerKg.toFixed(2)} unit="CAD/kg" color="var(--brand-500)" sub="par kilogramme expédié" />
        <KpiCard label="Marge brute" en="Gross Margin" value={(grossMargin/1000).toFixed(1)+'k'} unit="CAD" color="var(--ok-500)" big />
        <KpiCard label="Marge / colis" en="Per Parcel" value={marginPerParcel} unit="CAD" color="var(--ok-500)" sub={`Taux ${grossMarginPct}%`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
        <ChartCard title="Évolution du chiffre d'affaires" sub="CA facturé vs encaissé · par mois">
          <RevenueChart months={monthData.labels} revenue={monthData.revenue} collected={monthData.revenue} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14, padding: '10px 0 0', borderTop: '1px solid var(--border-soft)' }}>
            <LegendItem color="var(--brand-500)" label="Facturé" v={(totalInvoiced/1000).toFixed(1)+'k CAD'} />
            <LegendItem color="var(--ok-500)" label="Encaissé" v={(totalCollected/1000).toFixed(1)+'k CAD'} />
            <div style={{ flex: 1 }} />
          </div>
        </ChartCard>

        <ChartCard title="Performance opérationnelle" sub="3 indicateurs clés">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <GaugeRow label="Taux recouvrement" v={recoveryRate} target={95} unit="%" />
            <GaugeRow label="Délai moyen paiement" v={2.4} target={3} unit=" j" inverse />
            <GaugeRow label="Délai livraison post-arrivée" v={1.8} target={2.5} unit=" j" inverse />
            <GaugeRow label="Bordereaux validés à temps" v={92} target={95} unit="%" />
          </div>
        </ChartCard>
      </div>

      <div style={{ marginBottom: 14 }}>
        <ChartCard title="Revenus vs Coûts" sub="CA encaissé · coûts opérationnels · marge brute — par mois">
          <RevsVsCostsChart months={monthData.labels} revenue={monthData.revenue} costs={monthData.costs} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14, padding: '10px 0 0', borderTop: '1px solid var(--border-soft)' }}>
            <LegendItem color="var(--ok-400)" label="Marge brute" v={(grossMargin/1000).toFixed(1)+'k CAD'} />
            <LegendItem color="var(--bad-300)" label="Coûts opérationnels" v={(totalCosts/1000).toFixed(1)+'k CAD'} />
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 11.5, color: 'var(--ink-400)' }}>
              Taux de marge <strong style={{ color: 'var(--ok-600)' }}>{grossMarginPct}%</strong>
              <span style={{ marginLeft: 12 }}>Marge / colis <strong style={{ color: 'var(--ink-700)' }}>{marginPerParcel} CAD</strong></span>
            </span>
          </div>
        </ChartCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
        <ChartCard title="Performance par route" sub="Volume et chiffre d'affaires">
          <RoutesBar routes={routes} />
        </ChartCard>
        <ChartCard title="Modes de livraison" sub="Répartition des colis">
          <Donut data={[
            { l: 'Domicile', v: 178, color: 'var(--brand-500)' },
            { l: 'Retrait',  v: 64,  color: 'var(--ink-400)' },
          ]} center={{ value: 242, label: 'colis' }} />
        </ChartCard>
        <ChartCard title="Méthodes de paiement" sub="Volume reçu par canal">
          <Donut data={[
            { l: 'Virement',     v: 92400, color: 'var(--info-500)' },
            { l: 'Espèces',      v: 41200, color: 'var(--brand-500)' },
            { l: 'Interac',      v: 58800, color: 'var(--ok-500)' },
            { l: 'Mobile Money', v: 16300, color: 'var(--warn-500)' },
          ]} center={{ value: (totalCollected/1000).toFixed(0)+'k', label: 'CAD' }} />
        </ChartCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
        <RankingCard title="Top clients" sub="Par chiffre d'affaires YTD" icon={<I.Star style={{ color: 'var(--brand-500)' }} />} items={[]} empty />
        <RankingCard title="Top destinations" sub="Villes au Canada" icon={<I.Pin style={{ color: 'var(--info-500)' }} />} items={[]} empty />
        <RankingCard title="Top agents" sub="Par colis traités YTD" icon={<I.Users style={{ color: 'var(--ok-500)' }} />} items={[]} empty />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
        <ChartCard title="Impayés à relancer" sub="Données en cours de chargement" actions={
          <a style={{ fontSize: 12, color: 'var(--brand-700)', fontWeight: 600, cursor: 'pointer' }} onClick={() => onNav('/payments')}>Voir tout →</a>
        }>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', color: 'var(--ink-400)', fontSize: 13 }}>
            Données en cours de chargement
          </div>
        </ChartCard>

        <ChartCard title="Activité récente" sub="Dernières actions de l'équipe">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', color: 'var(--ink-400)', fontSize: 13 }}>
            Données en cours de chargement
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function KpiCard({ label, en, value, unit, delta, deltaLabel, deltaInverse, spark, progress, color, sub, big }) {
  const trend = delta != null ? (deltaInverse ? -delta : delta) : null;
  const trendKind = trend != null ? (trend >= 0 ? 'up' : 'down') : null;
  return (
    <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 10.5, color: 'var(--ink-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>
        {label} <span style={{ color: 'var(--ink-300)', fontWeight: 500, textTransform: 'none', letterSpacing: 0, marginLeft: 2 }}>/ {en}</span>
      </div>
      <div className="mono" style={{ fontSize: big ? 26 : 22, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--ink-900)' }}>
        {value}{unit && <span style={{ fontSize: 12, color: 'var(--ink-400)', fontWeight: 500, marginLeft: 3 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>{sub}</div>}
      {delta != null && trend != null && (
        <div className={'kpi__delta kpi__delta--' + trendKind} style={{ marginTop: 'auto' }}>
          <span>{trend >= 0 ? '▲' : '▼'}</span>
          {Math.abs(delta)}% {deltaLabel || 'vs N-1'}
        </div>
      )}
      {spark && <Sparkline data={spark} color={color || 'var(--brand-500)'} />}
      {progress != null && <Progress pct={progress} />}
    </div>
  );
}

function Sparkline({ data, color, height = 28 }) {
  const w = 100, h = height;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * h}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height, marginTop: 4 }}>
      <defs>
        <linearGradient id={'sg' + color.replace(/[^a-z0-9]/gi, '')} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill={`url(#sg${color.replace(/[^a-z0-9]/gi, '')})`} points={`0,${h} ${pts} ${w},${h}`} />
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function ChartCard({ title, sub, actions, children }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink-900)' }}>{title}</div>
          {sub && <div style={{ fontSize: 11.5, color: 'var(--ink-400)', marginTop: 2 }}>{sub}</div>}
        </div>
        {actions}
      </div>
      <div style={{ padding: 16, flex: 1 }}>{children}</div>
    </div>
  );
}

function RevenueChart({ months, revenue, collected }) {
  if (!months || months.length === 0) return <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-300)', fontSize: 13 }}>Aucune donnée</div>;
  const max = Math.max(...revenue, 1);
  const w = 100, h = 180;
  const barW = w / months.length * 0.6;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 200 }}>
        {[0.25, 0.5, 0.75, 1].map((g, i) => (
          <line key={i} x1="0" x2={w} y1={h * (1 - g)} y2={h * (1 - g)} stroke="var(--border-soft)" strokeWidth=".3" vectorEffect="non-scaling-stroke" />
        ))}
        {months.map((m, i) => {
          const x = (i + 0.5) * (w / months.length) - barW / 2;
          const hRev = (revenue[i] / max) * h;
          const hColl = ((collected[i] || 0) / max) * h;
          return (
            <g key={i}>
              <rect x={x} y={h - hRev} width={barW} height={hRev || 0.1} fill="var(--brand-100)" rx={1.4} vectorEffect="non-scaling-stroke" />
              <rect x={x} y={h - hColl} width={barW} height={hColl || 0} fill="var(--brand-500)" rx={1.4} vectorEffect="non-scaling-stroke" />
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${months.length}, 1fr)`, marginTop: 6 }}>
        {months.map((m, i) => (
          <div key={i} style={{ fontSize: 10.5, textAlign: 'center', color: revenue[i] ? 'var(--ink-600)' : 'var(--ink-300)', fontWeight: 500 }}>{m}</div>
        ))}
      </div>
    </div>
  );
}

function GaugeRow({ label, v, target, unit, inverse }) {
  const pct = Math.min(100, Math.round((v / target) * 100));
  const ok = inverse ? v <= target : v >= target * 0.95;
  const color = ok ? 'var(--ok-500)' : v >= target * 0.7 ? 'var(--warn-500)' : 'var(--bad-500)';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 12.5, color: 'var(--ink-700)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 11.5, color: 'var(--ink-400)' }}>
          <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>{v}</span>{unit}
          <span style={{ color: 'var(--ink-400)', marginLeft: 6 }}>cible <span className="mono">{target}{unit}</span></span>
        </span>
      </div>
      <div style={{ height: 6, background: 'var(--ink-100)', borderRadius: 999, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: pct + '%', background: color, borderRadius: 999 }} />
      </div>
    </div>
  );
}

function Donut({ data, center }) {
  const total = data.reduce((a, d) => a + d.v, 0);
  const R = 60, r = 38;
  let acc = 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg viewBox="-70 -70 140 140" style={{ width: 130, height: 130, flexShrink: 0 }}>
        {data.map((d, i) => {
          const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
          acc += d.v;
          const end = (acc / total) * Math.PI * 2 - Math.PI / 2;
          const large = end - start > Math.PI ? 1 : 0;
          const x1 = Math.cos(start) * R, y1 = Math.sin(start) * R;
          const x2 = Math.cos(end) * R,   y2 = Math.sin(end) * R;
          const xi1 = Math.cos(start) * r, yi1 = Math.sin(start) * r;
          const xi2 = Math.cos(end) * r,   yi2 = Math.sin(end) * r;
          const dp = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${r} ${r} 0 ${large} 0 ${xi1} ${yi1} Z`;
          return <path key={i} d={dp} fill={d.color} stroke="white" strokeWidth="1.5" />;
        })}
        <text x="0" y="-2" textAnchor="middle" style={{ fontSize: 16, fontWeight: 700, fill: 'var(--ink-900)', fontFamily: 'var(--ff-mono)' }}>{center.value}</text>
        <text x="0" y="11" textAnchor="middle" style={{ fontSize: 8, fill: 'var(--ink-400)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>{center.label}</text>
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ width: 8, height: 8, background: d.color, borderRadius: 2, flexShrink: 0 }} />
            <span style={{ flex: 1, color: 'var(--ink-700)' }}>{d.l}</span>
            <span className="mono" style={{ fontWeight: 700, color: 'var(--ink-800)' }}>{Math.round(d.v / total * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoutesBar({ routes }) {
  const activeRoutes = routes.filter(r => r.active);
  if (activeRoutes.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0', color: 'var(--ink-300)', fontSize: 13 }}>
        Aucune route active
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {activeRoutes.map((r, idx) => (
        <div key={r.id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <RoutePill from={r.fromIATA} to={r.toIATA} />
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>{r.label || r.code}</span>
            <div style={{ flex: 1 }} />
            <span className="mono" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink-900)' }}>—</span>
          </div>
          <div style={{ height: 8, background: 'var(--ink-100)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: (100 / activeRoutes.length * (activeRoutes.length - idx)) + '%', background: 'linear-gradient(90deg, var(--brand-300), var(--brand-500))', borderRadius: 999 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function RankingCard({ title, sub, icon, items, empty }) {
  return (
    <ChartCard title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{icon}{title}</span>} sub={sub}>
      {empty || items.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0', color: 'var(--ink-300)', fontSize: 13 }}>
          Données en cours de chargement
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((it, i) => (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ width: 18, fontSize: 11, color: 'var(--ink-400)', fontWeight: 700, fontFamily: 'var(--ff-mono)' }}>{i + 1}.</span>
                {it.color && <Avatar initials={it.name.split(' ').map(x => x[0]).join('').slice(0, 2)} color={it.color} size="sm" />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{it.name}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>{it.sub}</div>
                </div>
                <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>{it.value}</span>
              </div>
              <div style={{ marginLeft: 26 + (it.color ? 30 : 0), height: 3, background: 'var(--ink-100)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: it.meter + '%', background: i === 0 ? 'var(--brand-500)' : 'var(--ink-300)', borderRadius: 999 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}

function RevsVsCostsChart({ months, revenue, costs }) {
  if (!months || months.length === 0) return <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-300)', fontSize: 13 }}>Aucune donnée</div>;
  const max = Math.max(...revenue, ...costs, 1);
  const w = 100, h = 140;
  const barW = w / months.length * 0.58;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 160 }}>
        {[0.25, 0.5, 0.75, 1].map((g, i) => (
          <line key={i} x1="0" x2={w} y1={h*(1-g)} y2={h*(1-g)} stroke="var(--border-soft)" strokeWidth=".3" vectorEffect="non-scaling-stroke" />
        ))}
        {months.map((m, i) => {
          if (!revenue[i]) return null;
          const x = (i + 0.5) * (w / months.length) - barW / 2;
          const hRev  = (revenue[i] / max) * h;
          const hCost = ((costs[i] || 0) / max) * h;
          const hMargin = Math.max(0, hRev - hCost);
          return (
            <g key={i}>
              <rect x={x} y={h - hCost}   width={barW} height={hCost   || 0.1} fill="var(--bad-300)"  rx="1.4" vectorEffect="non-scaling-stroke" />
              <rect x={x} y={h - hRev}    width={barW} height={hMargin || 0.1} fill="var(--ok-400)"   rx="1.4" vectorEffect="non-scaling-stroke" />
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${months.length}, 1fr)`, marginTop: 6 }}>
        {months.map((m, i) => (
          <div key={i} style={{ fontSize: 10.5, textAlign: 'center', color: revenue[i] ? 'var(--ink-600)' : 'var(--ink-300)', fontWeight: 500 }}>{m}</div>
        ))}
      </div>
    </div>
  );
}

function LegendItem({ color, label, v }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 10, height: 10, background: color, borderRadius: 2 }} />
      <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>{label}</span>
      <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-800)' }}>{v}</span>
    </div>
  );
}
