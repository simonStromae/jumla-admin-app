import { useState, useEffect } from 'react';
import I from '../components/Icons.jsx';
import { Bi, RoutePill, StatusDot, Progress, Skel, useCan } from '../components/Shell.jsx';
import { useAdminT } from '../lib/useAdminT.js';

const getCampaignStatus = (t) => ({
  enr: { label: t.campaignStatus.open,     dot: 'brand' },
  exp: { label: 'Expédiée',               dot: 'warn' },   // TODO: no exact translation key
  tra: { label: t.campaignStatus.transit,  dot: 'warn' },
  apd: { label: t.campaignStatus.arrived,  dot: 'info' },
  dou: { label: 'En douane',              dot: 'warn' },   // TODO: no exact translation key
  lib: { label: 'Libérée douanes',        dot: 'ok' },    // TODO: no exact translation key
  ard: { label: 'Entrepôt dest.',         dot: 'ok' },    // TODO: no exact translation key
  pdl: { label: 'Prête livraison',        dot: 'info' },  // TODO: no exact translation key
  ok:  { label: t.campaignStatus.closed,   dot: 'neutral' },
});

export function CampaignCard({ c, onClick }) {
  const t = useAdminT();
  const CAMPAIGN_STATUS = getCampaignStatus(t);
  const s   = CAMPAIGN_STATUS[c.status] ?? { label: c.status, dot: 'neutral' };
  const pct = (c.invoiced ?? 0) > 0 ? Math.min(100, Math.round((c.collected ?? 0) / c.invoiced * 100)) : 0;
  const outstanding = Math.max(0, (c.invoiced ?? 0) - (c.collected ?? 0));

  return (
    <div className="card" style={{ padding: 0, cursor: 'pointer', transition: 'all .15s', position: 'relative', overflow: 'hidden' }}
      onClick={onClick}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--sh-md)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--sh-xs)'}>

      {(c.alerts ?? 0) > 0 && (
        <div style={{ position: 'absolute', top: 14, right: 14, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 999, background: 'var(--bad-50)', color: 'var(--bad-700)', fontSize: 10.5, fontWeight: 600 }}>
          <I.Alert style={{ width: 11, height: 11 }} /> {c.alerts}
        </div>
      )}

      <div style={{ padding: '16px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <RoutePill from={c.from} to={c.to} />
          <StatusDot kind={s.dot} label={s.label} />
        </div>
        <div className="mono" style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-.01em', color: 'var(--ink-900)', marginBottom: 4 }}>{c.code}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-400)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <I.Calendar style={{ width: 11, height: 11 }} />
          {t.campaigns.fields.departure} <span style={{ color: 'var(--ink-700)', fontWeight: 600 }}>{c.dep}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, margin: '14px 0 12px', paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
          {[
            { l: t.campaigns.kpi.parcels,  v: c.parcels,                                          suffix: '' },
            { l: t.common.weight,          v: (c.weight ?? 0).toLocaleString('fr'),              suffix: ' kg' },
            { l: t.campaigns.kpi.revenue,  v: ((c.invoiced ?? 0) / 1000).toFixed(1) + 'k',       suffix: ' CAD' }, // TODO: "Facturé" (invoiced) mapped to nearest key revenue
          ].map(({ l, v, suffix }) => (
            <div key={l}>
              <div style={{ fontSize: 10.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>{l}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }} className="mono">{v}<span style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 500 }}>{suffix}</span></div>
            </div>
          ))}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
            {/* TODO: no translation key for "Paiements" in this card context */}
            <span style={{ color: 'var(--ink-400)' }}>Paiements</span>
            <span style={{ fontWeight: 600, color: pct >= 95 ? 'var(--ok-600)' : pct >= 70 ? 'var(--warn-700)' : 'var(--bad-600)' }} className="mono">
              {pct}% · {(c.collected ?? 0).toLocaleString('fr')} / {(c.invoiced ?? 0).toLocaleString('fr')}
            </span>
          </div>
          <Progress pct={pct} kind={pct >= 95 ? null : pct >= 70 ? 'warn' : 'bad'} />
          {outstanding > 0 && (
            <div style={{ fontSize: 11, color: 'var(--bad-600)', marginTop: 5 }}>
              {/* TODO: no translation key for "Reste à percevoir" */}
              Reste à percevoir · <span className="mono" style={{ fontWeight: 600 }}>{outstanding.toLocaleString('fr')} CAD</span>
            </div>
          )}
          {(c.cancelled ?? 0) > 0 && (
            <div style={{ fontSize: 11, color: 'var(--warn-700)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <I.Ban style={{ width: 10, height: 10 }} />
              <span><span className="mono" style={{ fontWeight: 700 }}>{c.cancelled}</span> réservation{c.cancelled > 1 ? 's' : ''} annulée{c.cancelled > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-soft)', background: 'var(--bg-soft)', display: 'flex', alignItems: 'center' }}>
        <I.ChevronRight style={{ width: 14, height: 14, color: 'var(--ink-400)', marginLeft: 'auto' }} />
      </div>
    </div>
  );
}

export default function CampaignsScreen({ onNav, onNewCampaign }) {
  const can = useCan();
  const t = useAdminT();
  const [year, setYear]               = useState(2026);
  const [filter, setFilter]           = useState('all');
  const [routeFilter, setRouteFilter] = useState('all');
  const [view, setView]               = useState('grid');
  const [campaigns, setCampaigns]     = useState([]);
  const [routes, setRoutes]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [archiving, setArchiving]       = useState(null);

  function loadCampaigns(archived) {
    setLoading(true);
    Promise.all([
      fetch('/api/campaigns' + (archived ? '?archived=true' : '')).then(r => r.json()),
      fetch('/api/routes').then(r => r.json()),
    ]).then(([cData, rData]) => {
      setCampaigns(Array.isArray(cData) ? cData : []);
      setRoutes(Array.isArray(rData) ? rData : []);
      setLoading(false);
    });
  }

  useEffect(() => { loadCampaigns(showArchived); }, [showArchived]);

  const filtered = campaigns.filter(c => {
    if (routeFilter !== 'all' && c.route !== routeFilter) return false;
    if (filter === 'all') return true;
    if (filter === 'transit') return ['exp','tra','apd','dou','lib'].includes(c.status);
    if (filter === 'ard') return c.status === 'ard' || c.status === 'pdl';
    return c.status === filter;
  });

  const byMonth = {};
  filtered.forEach(c => {
    const key = c.month || '—';
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(c);
  });

  async function handleArchive(campaignId) {
    if (!confirm('Archiver cette cargaison ?')) return;
    setArchiving(campaignId);
    await fetch('/api/campaigns/' + campaignId, { method: 'DELETE' });
    setArchiving(null);
    loadCampaigns(showArchived);
  }

  async function handleRestore(campaignId) {
    setArchiving(campaignId);
    await fetch('/api/campaigns/' + campaignId + '/restore', { method: 'POST' });
    setArchiving(null);
    loadCampaigns(showArchived);
  }

  const totalCollected = campaigns.reduce((s, c) => s + (c.collected ?? 0), 0);
  const totalInvoiced  = campaigns.reduce((s, c) => s + (c.invoiced  ?? 0), 0);
  const totalWeight    = campaigns.reduce((s, c) => s + (c.weight    ?? 0), 0);
  const totalParcels   = campaigns.reduce((s, c) => s + (c.parcels   ?? 0), 0);
  const recoveryRate   = totalInvoiced > 0 ? Math.round(totalCollected / totalInvoiced * 100) : 0;
  const outstanding    = totalInvoiced - totalCollected;
  const avgWeight      = totalParcels > 0 ? Math.round(totalWeight / totalParcels * 10) / 10 : 0;

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__title"><Bi fr="Cargaisons" en="Shipments" /></div>
          {/* TODO: no translation key for this subtitle */}
          <div className="page__sub">Vue d'ensemble — toutes vos cargaisons {year}, par mois.</div>
        </div>
        <div className="page__actions">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 6px 4px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'white', fontSize: 12.5 }}>
            <I.Calendar style={{ width: 14, height: 14, color: 'var(--ink-400)' }} />
            <select value={year} onChange={e => setYear(+e.target.value)} style={{ border: 0, background: 'transparent', fontWeight: 600, paddingRight: 4 }}>
              <option>2026</option><option>2025</option><option>2024</option>
            </select>
          </div>
          <button className="btn btn--ghost"><I.Download />{t.common.export}</button>
          {can('campaigns', 'delete') && (
            <button
              className={'btn ' + (showArchived ? 'btn--soft' : 'btn--ghost')}
              onClick={() => { setShowArchived(v => !v); setFilter('all'); }}
            >
              <I.Archive /> {showArchived ? 'Archivées' : 'Archivées'}
            </button>
          )}
          {can('campaigns', 'create') && !showArchived && <button className="btn btn--brand" onClick={onNewCampaign}><I.Plus />{t.campaigns.new}</button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
        <div className="kpi">
          <div className="kpi__label">{t.campaigns.kpi.revenue} <span style={{ textTransform: 'none', color: 'var(--ink-300)' }}>/ Revenue</span></div>
          <div className="kpi__value">{(totalCollected / 1000).toFixed(1)}k <span style={{ fontSize: 14, color: 'var(--ink-400)' }}>CAD</span></div>
        </div>
        <div className="kpi">
          {/* TODO: no translation key for "Taux de recouvrement" */}
          <div className="kpi__label">Taux de recouvrement <span style={{ textTransform: 'none', color: 'var(--ink-300)' }}>/ Recovery</span></div>
          <div className="kpi__value">{recoveryRate}<span style={{ fontSize: 20 }}>%</span></div>
          <Progress pct={recoveryRate} />
        </div>
        <div className="kpi">
          {/* TODO: no translation key for "Impayés en cours" */}
          <div className="kpi__label">Impayés en cours <span style={{ textTransform: 'none', color: 'var(--ink-300)' }}>/ Outstanding</span></div>
          <div className="kpi__value" style={{ color: outstanding > 0 ? 'var(--bad-600)' : 'var(--ok-600)' }}>
            {Math.max(0, outstanding / 1000).toFixed(1)}k <span style={{ fontSize: 14, color: 'var(--ink-400)' }}>CAD</span>
          </div>
        </div>
        <div className="kpi">
          {/* TODO: no translation key for "Poids moyen / colis" */}
          <div className="kpi__label">Poids moyen / colis <span style={{ textTransform: 'none', color: 'var(--ink-300)' }}>/ Avg weight</span></div>
          <div className="kpi__value">{avgWeight}<span style={{ fontSize: 20 }}> kg</span></div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div className="tabs">
          {[
            { id: 'all',     l: t.parcels.filterAll,       n: campaigns.length },
            { id: 'enr',     l: t.campaignStatus.open,     n: campaigns.filter(c => c.status === 'enr').length },
            { id: 'transit', l: t.campaignStatus.transit,  n: campaigns.filter(c => ['exp','tra','apd','dou','lib'].includes(c.status)).length },
            { id: 'ard',     l: t.campaignStatus.arrived,  n: campaigns.filter(c => c.status === 'ard' || c.status === 'pdl').length },
            { id: 'ok',      l: t.campaignStatus.closed,   n: campaigns.filter(c => c.status === 'ok').length },
          ].map(tab => (
            <button key={tab.id} className={'tab ' + (filter === tab.id ? 'is-active' : '')} onClick={() => setFilter(tab.id)}>
              {tab.l} {tab.n > 0 && <span className="count">{tab.n}</span>}
            </button>
          ))}
        </div>
        <div className="spacer" />
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 6px 4px 10px', border: '1px solid var(--border)', borderRadius: 7, background: 'white', fontSize: 12 }}>
          <I.Route style={{ width: 12, height: 12, color: 'var(--ink-400)' }} />
          <select value={routeFilter} onChange={e => setRouteFilter(e.target.value)} style={{ border: 0, background: 'transparent', fontWeight: 600, paddingRight: 4 }}>
            {/* TODO: no translation key for "Toutes les routes" */}
            <option value="all">Toutes les routes</option>
            {routes.map(r => <option key={r.id} value={r.id}>{r.code}</option>)}
          </select>
        </div>
        <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 7, padding: 2, background: 'white' }}>
          {/* TODO: no translation keys for grid/list view toggle labels */}
          <button className={'btn--xs btn ' + (view === 'grid' ? 'btn--soft' : 'btn--ghost')} style={{ border: 0 }} onClick={() => setView('grid')}>Grille</button>
          <button className={'btn--xs btn ' + (view === 'list' ? 'btn--soft' : 'btn--ghost')} style={{ border: 0 }} onClick={() => setView('list')}>Liste</button>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Skel w={72} h={22} r={6} />
                <Skel w={80} h={18} r={999} />
              </div>
              <Skel w={120} h={18} style={{ marginBottom: 8 }} />
              <Skel w={100} h={13} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, margin: '14px 0 12px', paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
                {[1,2,3].map(j => (
                  <div key={j}>
                    <Skel w={40} h={10} style={{ marginBottom: 6 }} />
                    <Skel w={56} h={18} />
                  </div>
                ))}
              </div>
              <Skel w="100%" h={6} r={999} />
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-400)' }}>
          <I.Box style={{ width: 40, height: 40, opacity: .3, marginBottom: 12 }} />
          <div style={{ marginBottom: 12 }}>{t.campaigns.table.noCampaigns}</div>
          {can('campaigns', 'create') && <button className="btn btn--brand btn--sm" onClick={onNewCampaign}><I.Plus />{t.common.create}</button>}
        </div>
      )}

      {Object.entries(byMonth).map(([month, list]) => (
        <div key={month} style={{ marginBottom: 26 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 12px' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--ink-800)' }}>{month}</h3>
            <span style={{ fontSize: 11, color: 'var(--ink-400)', background: 'var(--ink-100)', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>
              {/* TODO: no translation key for "cargaison(s)" */}
              {list.length} cargaison{list.length > 1 ? 's' : ''}
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
            <span style={{ fontSize: 11.5, color: 'var(--ink-400)' }} className="mono">
              {list.reduce((a, c) => a + (c.weight ?? 0), 0).toLocaleString('fr')} kg ·{' '}
              {list.reduce((a, c) => a + (c.invoiced ?? 0), 0).toLocaleString('fr')} CAD
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 }}>
            {list.map(c => (
              <div key={c.id} style={{ position: 'relative' }}>
                <CampaignCard c={c} onClick={showArchived ? undefined : () => onNav('/admin/campaigns/' + c.id)} />
                {showArchived && can('campaigns', 'delete') && (
                  <div style={{ padding: '8px 12px', display: 'flex', gap: 8, borderTop: '1px solid var(--border-soft)', background: 'var(--bg-soft)', borderRadius: '0 0 10px 10px', marginTop: -1 }}>
                    <button
                      className="btn btn--sm btn--ghost"
                      style={{ flex: 1 }}
                      disabled={archiving === c.id}
                      onClick={() => handleRestore(c.id)}
                    >
                      {archiving === c.id ? '…' : '↩ Restaurer'}
                    </button>
                  </div>
                )}
                {!showArchived && can('campaigns', 'delete') && (
                  <button
                    style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-300)', padding: 4, borderRadius: 6, lineHeight: 1, zIndex: 2 }}
                    title="Archiver"
                    disabled={archiving === c.id}
                    onClick={e => { e.stopPropagation(); handleArchive(c.id); }}
                  >
                    <I.Archive style={{ width: 14, height: 14 }} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
