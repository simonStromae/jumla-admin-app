import { useState } from 'react';
import { DATA, getRoute, STATUS } from '../data.js';
import I from '../components/Icons.jsx';
import { Bi, RoutePill, StatusDot, Avatar, Progress } from '../components/Shell.jsx';

export default function CampaignsScreen({ onNav, onNewCampaign }) {
  const [year, setYear] = useState(2026);
  const [filter, setFilter] = useState('all');
  const [routeFilter, setRouteFilter] = useState('all');
  const [view, setView] = useState('grid');

  const campaigns = DATA.CAMPAIGNS.filter(c => routeFilter === 'all' || c.route === routeFilter);
  const byMonth = {};
  campaigns.forEach(c => {
    if (!byMonth[c.month]) byMonth[c.month] = [];
    byMonth[c.month].push(c);
  });

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__title"><Bi fr="Cargaisons" en="Shipments" /></div>
          <div className="page__sub">Vue d'ensemble — toutes vos cargaisons {year}, par mois.</div>
        </div>
        <div className="page__actions">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 6px 4px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'white', fontSize: 12.5 }}>
            <I.Calendar style={{ width: 14, height: 14, color: 'var(--ink-400)' }} />
            <select value={year} onChange={e => setYear(+e.target.value)} style={{ border: 0, background: 'transparent', fontWeight: 600, paddingRight: 4 }}>
              <option>2026</option><option>2025</option><option>2024</option>
            </select>
          </div>
          <button className="btn btn--ghost"><I.Download />Exporter</button>
          <button className="btn btn--brand" onClick={onNewCampaign}><I.Plus />Nouvelle cargaison</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
        <div className="kpi">
          <div className="kpi__label">CA encaissé <span style={{ textTransform: 'none', color: 'var(--ink-300)' }}>/ Revenue</span></div>
          <div className="kpi__value">482 300 <span style={{ fontSize: 14, color: 'var(--ink-400)' }}>CAD</span></div>
          <div className="kpi__delta kpi__delta--up">▲ 18% vs 2025</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Taux de recouvrement <span style={{ textTransform: 'none', color: 'var(--ink-300)' }}>/ Recovery</span></div>
          <div className="kpi__value">94<span style={{ fontSize: 20 }}>,2%</span></div>
          <Progress pct={94.2} />
        </div>
        <div className="kpi">
          <div className="kpi__label">Impayés en cours <span style={{ textTransform: 'none', color: 'var(--ink-300)' }}>/ Outstanding</span></div>
          <div className="kpi__value" style={{ color: 'var(--bad-600)' }}>28 140 <span style={{ fontSize: 14, color: 'var(--ink-400)' }}>CAD</span></div>
          <div className="kpi__delta">12 colis · 8 clients</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Poids moyen / colis <span style={{ textTransform: 'none', color: 'var(--ink-300)' }}>/ Avg weight</span></div>
          <div className="kpi__value">28<span style={{ fontSize: 20 }}>,4 kg</span></div>
          <div className="kpi__delta kpi__delta--up">▲ 2,1 kg vs 2025</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div className="tabs">
          <button className={'tab ' + (filter === 'all' ? 'is-active' : '')} onClick={() => setFilter('all')}>Tous <span className="count">{campaigns.length}</span></button>
          <button className={'tab ' + (filter === 'in-transit' ? 'is-active' : '')} onClick={() => setFilter('in-transit')}>En transit <span className="count">1</span></button>
          <button className={'tab ' + (filter === 'processing' ? 'is-active' : '')} onClick={() => setFilter('processing')}>En traitement</button>
          <button className={'tab ' + (filter === 'closed' ? 'is-active' : '')} onClick={() => setFilter('closed')}>Clôturées <span className="count">7</span></button>
        </div>
        <div className="spacer" />
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 6px 4px 10px', border: '1px solid var(--border)', borderRadius: 7, background: 'white', fontSize: 12 }}>
          <I.Route style={{ width: 12, height: 12, color: 'var(--ink-400)' }} />
          <select value={routeFilter} onChange={e => setRouteFilter(e.target.value)} style={{ border: 0, background: 'transparent', fontWeight: 600, paddingRight: 4 }}>
            <option value="all">Toutes les routes</option>
            {DATA.ROUTES.map(r => <option key={r.id} value={r.id}>{r.code}</option>)}
          </select>
        </div>
        <button className="btn btn--ghost btn--sm"><I.Filter />Filtres</button>
        <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 7, padding: 2, background: 'white' }}>
          <button className={'btn--xs btn ' + (view === 'grid' ? 'btn--soft' : 'btn--ghost')} style={{ border: 0 }} onClick={() => setView('grid')}>Grille</button>
          <button className={'btn--xs btn ' + (view === 'list' ? 'btn--soft' : 'btn--ghost')} style={{ border: 0 }} onClick={() => setView('list')}>Liste</button>
        </div>
      </div>

      {Object.entries(byMonth).map(([month, list]) => (
        <div key={month} style={{ marginBottom: 26 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 12px' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--ink-800)', letterSpacing: '-.01em' }}>{month}</h3>
            <span style={{ fontSize: 11, color: 'var(--ink-400)', background: 'var(--ink-100)', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>
              {list.length} cargaison{list.length > 1 ? 's' : ''}
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
            <span style={{ fontSize: 11.5, color: 'var(--ink-400)' }} className="mono">
              {list.reduce((a, c) => a + c.weight, 0).toLocaleString('fr')} kg · {list.reduce((a, c) => a + c.invoiced, 0).toLocaleString('fr')} CAD
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 }}>
            {list.map(c => <CampaignCard key={c.id} c={c} onClick={() => onNav('/campaign/' + c.id)} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CampaignCard({ c, onClick }) {
  const r = getRoute(c.route);
  const s = STATUS.campaign[c.status];
  const pct = c.invoiced ? Math.round(c.collected / c.invoiced * 100) : 0;
  const outstanding = c.invoiced - c.collected;

  return (
    <div className="card" style={{ padding: 0, cursor: 'pointer', transition: 'all .15s', position: 'relative', overflow: 'hidden' }}
      onClick={onClick}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--sh-md)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--sh-xs)'}>

      {c.alerts > 0 && (
        <div style={{ position: 'absolute', top: 14, right: 14, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 999, background: 'var(--bad-50)', color: 'var(--bad-700)', fontSize: 10.5, fontWeight: 600 }}>
          <I.Alert style={{ width: 11, height: 11 }} /> {c.alerts}
        </div>
      )}

      <div style={{ padding: '16px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <RoutePill from={r.fromIATA} to={r.toIATA} />
          <StatusDot kind={s.dot} label={s.label} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <div className="mono" style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-.01em', color: 'var(--ink-900)' }}>{c.code}</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-400)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <I.Calendar style={{ width: 11, height: 11 }} />
          Départ <span style={{ color: 'var(--ink-700)', fontWeight: 600 }}>{c.dep}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, margin: '14px 0 12px', paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>Colis</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }} className="mono">{c.parcels}</div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>Poids</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }} className="mono">{c.weight.toLocaleString('fr')}<span style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 500 }}> kg</span></div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>Facturé</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }} className="mono">{(c.invoiced / 1000).toFixed(1)}k<span style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 500 }}> CAD</span></div>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
            <span style={{ color: 'var(--ink-400)' }}>Paiements</span>
            <span style={{ fontWeight: 600, color: pct >= 95 ? 'var(--ok-600)' : pct >= 70 ? 'var(--warn-700)' : 'var(--bad-600)' }} className="mono">
              {pct}% · {c.collected.toLocaleString('fr')} / {c.invoiced.toLocaleString('fr')}
            </span>
          </div>
          <Progress pct={pct} kind={pct >= 95 ? null : pct >= 70 ? 'warn' : 'bad'} />
          {outstanding > 0 && (
            <div style={{ fontSize: 11, color: 'var(--bad-600)', marginTop: 5 }}>
              Reste à percevoir · <span className="mono" style={{ fontWeight: 600 }}>{outstanding.toLocaleString('fr')} CAD</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-soft)', background: 'var(--bg-soft)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--ink-500)' }}>
        <Avatar initials="AM" color={1} size="sm" />
        <span style={{ color: 'var(--ink-600)', fontWeight: 500 }}>Aïcha M.</span>
        <span style={{ color: 'var(--ink-300)' }}>·</span>
        <span>Maj. il y a 2 h</span>
        <div className="spacer" />
        <I.ChevronRight style={{ width: 14, height: 14, color: 'var(--ink-400)' }} />
      </div>
    </div>
  );
}
