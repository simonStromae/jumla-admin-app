import { useState } from 'react';
import { DATA } from '../data.js';
import I from '../components/Icons.jsx';
import { Bi, RoutePill, Progress } from '../components/Shell.jsx';

const COST_FIELDS = [
  { key: 'fret',        label: 'Fret aérien',  color: 'var(--brand-500)' },
  { key: 'manutention', label: 'Manutention',  color: 'var(--info-500)'  },
  { key: 'douane',      label: 'Douanes',      color: 'var(--warn-500)'  },
  { key: 'transport',   label: 'Transport',    color: 'var(--ok-500)'    },
  { key: 'divers',      label: 'Divers',       color: 'var(--ink-400)'   },
];

function marginKind(pct) {
  if (pct >= 55) return 'ok';
  if (pct >= 35) return 'info';
  if (pct >= 15) return 'warn';
  return 'bad';
}

export default function CostsScreen({ onNav }) {
  const [costsData, setCostsData] = useState(() =>
    Object.fromEntries(DATA.CAMPAIGNS.map(c => [c.id, { ...c.costs }]))
  );
  const [editing, setEditing] = useState(null); // { id, field }
  const [editVal, setEditVal]  = useState('');
  const [routeFilter, setRouteFilter] = useState('all');

  const campaigns = DATA.CAMPAIGNS.filter(c =>
    routeFilter === 'all' || c.route === routeFilter
  );

  const totalCost = c => Object.values(costsData[c.id] || {}).reduce((a, b) => a + (b || 0), 0);
  const margin    = c => c.collected - totalCost(c);
  const marginPct = c => c.collected > 0 ? Math.round(margin(c) / c.collected * 100) : 0;

  const allCollected = campaigns.reduce((s, c) => s + c.collected, 0);
  const allCosts     = campaigns.reduce((s, c) => s + totalCost(c), 0);
  const allMargin    = allCollected - allCosts;
  const allPct       = allCollected > 0 ? Math.round(allMargin / allCollected * 100) : 0;
  const allWeight    = campaigns.reduce((s, c) => s + c.weight, 0);
  const costPerKg    = allWeight > 0 ? (allCosts / allWeight).toFixed(2) : '—';
  const best         = [...DATA.CAMPAIGNS].sort((a, b) => marginPct(b) - marginPct(a))[0];

  const startEdit = (id, field, val) => { setEditing({ id, field }); setEditVal(String(val || 0)); };
  const commitEdit = () => {
    if (!editing) return;
    const num = Math.max(0, parseInt(editVal) || 0);
    setCostsData(d => ({ ...d, [editing.id]: { ...d[editing.id], [editing.field]: num } }));
    setEditing(null);
  };

  const routeOf = id => DATA.ROUTES.find(r => r.id === id);

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__title"><Bi fr="Coûts & Marges" en="Cost tracking" /></div>
          <div className="page__sub">Coûts opérationnels saisis par cargaison · marge brute calculée</div>
        </div>
        <div className="page__actions">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 6px 4px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'white', fontSize: 12.5 }}>
            <I.Route style={{ width: 14, height: 14, color: 'var(--ink-400)' }} />
            <select value={routeFilter} onChange={e => setRouteFilter(e.target.value)} style={{ border: 0, background: 'transparent', fontWeight: 600, paddingRight: 4 }}>
              <option value="all">Toutes les routes</option>
              {DATA.ROUTES.filter(r => r.active).map(r => <option key={r.id} value={r.id}>{r.code}</option>)}
            </select>
          </div>
          <button className="btn btn--ghost"><I.Download />Export</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 18 }}>
        <CostKpi icon="📉" label="Coûts totaux" value={(allCosts / 1000).toFixed(1) + 'k'} unit="CAD" color="var(--bad-500)" />
        <CostKpi icon="📈" label="Marge brute" value={(allMargin / 1000).toFixed(1) + 'k'} unit="CAD" color="var(--ok-500)" />
        <CostKpi icon="%" label="Taux de marge" value={allPct} unit="%" color={allPct >= 55 ? 'var(--ok-500)' : 'var(--warn-500)'} progress={allPct} />
        <CostKpi icon="⚖️" label="Coût moyen / kg" value={costPerKg} unit="CAD/kg" color="var(--brand-500)" />
        <CostKpi icon="🏆" label="Meilleure cargaison" value={marginPct(best) + '%'} unit="" color="var(--ok-600)" sub={best?.code} />
      </div>

      {/* Cost field legend */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '9px 14px', background: 'white', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10.5, color: 'var(--ink-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Postes de coût</span>
        {COST_FIELDS.map(f => (
          <span key={f.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
            <span style={{ width: 8, height: 8, background: f.color, borderRadius: 2, flexShrink: 0 }} />
            {f.label}
          </span>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11.5, color: 'var(--ink-400)' }}>
          <I.Edit style={{ width: 12, height: 12, verticalAlign: 'middle', marginRight: 4 }} />
          Cliquez sur un montant pour le modifier
        </span>
      </div>

      {/* Main table */}
      <div className="card" style={{ overflow: 'auto', marginBottom: 14 }}>
        <table className="tbl" style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th>Cargaison</th>
              <th style={{ textAlign: 'right' }}>CA encaissé</th>
              {COST_FIELDS.map(f => (
                <th key={f.key} style={{ textAlign: 'right' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 7, height: 7, background: f.color, borderRadius: 2, flexShrink: 0 }} />
                    {f.label}
                  </span>
                </th>
              ))}
              <th style={{ textAlign: 'right', color: 'var(--ink-700)' }}>Total coûts</th>
              <th style={{ textAlign: 'right', color: 'var(--ok-700)' }}>Marge brute</th>
              <th style={{ textAlign: 'center' }}>Taux</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map(c => {
              const r   = routeOf(c.route);
              const tc  = totalCost(c);
              const mg  = margin(c);
              const mp  = marginPct(c);
              const cd  = costsData[c.id] || {};
              return (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <RoutePill from={r?.fromIATA} to={r?.toIATA} />
                      <div>
                        <div className="mono" style={{ fontSize: 12.5, fontWeight: 700 }}>{c.code}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 1 }}>
                          {c.dep} · {c.parcels} colis · {(c.weight / 1000).toFixed(1)} t
                        </div>
                      </div>
                      <span className={'badge badge--' + (c.status === 'closed' ? 'ok' : 'info') + ' badge--dot'}>
                        {c.status === 'closed' ? 'Clôturé' : 'En transit'}
                      </span>
                    </div>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <span className="mono" style={{ fontWeight: 700 }}>{c.collected.toLocaleString('fr')}</span>
                    <span style={{ fontSize: 10.5, color: 'var(--ink-400)', marginLeft: 3 }}>CAD</span>
                  </td>

                  {COST_FIELDS.map(f => {
                    const isEdit = editing?.id === c.id && editing?.field === f.key;
                    const val = cd[f.key] || 0;
                    return (
                      <td key={f.key} style={{ textAlign: 'right' }}>
                        {isEdit ? (
                          <input
                            type="number" value={editVal} autoFocus
                            onChange={e => setEditVal(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(null); }}
                            style={{ width: 84, textAlign: 'right', fontSize: 12.5, fontFamily: 'var(--ff-mono)', padding: '2px 6px', border: '1.5px solid var(--brand-400)', borderRadius: 4, outline: 'none', background: 'var(--brand-50)' }}
                          />
                        ) : (
                          <button
                            onClick={() => startEdit(c.id, f.key, val)}
                            title="Cliquer pour modifier"
                            style={{ background: 'none', border: '1px dashed transparent', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', fontSize: 12.5, fontFamily: 'var(--ff-mono)', color: 'var(--ink-700)' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-300)'; e.currentTarget.style.background = 'var(--brand-50)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'none'; }}
                          >
                            {val.toLocaleString('fr')}
                          </button>
                        )}
                      </td>
                    );
                  })}

                  <td style={{ textAlign: 'right' }}>
                    <span className="mono" style={{ fontWeight: 800, color: 'var(--ink-800)' }}>{tc.toLocaleString('fr')}</span>
                    <span style={{ fontSize: 10.5, color: 'var(--ink-400)', marginLeft: 3 }}>CAD</span>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <span className="mono" style={{ fontWeight: 800, color: mg >= 0 ? 'var(--ok-600)' : 'var(--bad-500)' }}>
                      {mg.toLocaleString('fr')}
                    </span>
                    <span style={{ fontSize: 10.5, color: 'var(--ink-400)', marginLeft: 3 }}>CAD</span>
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <span className={'badge badge--' + marginKind(mp)}>{mp}%</span>
                  </td>
                </tr>
              );
            })}

            {/* Totals row */}
            <tr style={{ background: 'var(--ink-50)', borderTop: '2px solid var(--border)' }}>
              <td>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-700)' }}>
                  Total · {campaigns.length} cargaison{campaigns.length > 1 ? 's' : ''}
                </span>
              </td>
              <td style={{ textAlign: 'right' }}>
                <span className="mono" style={{ fontWeight: 800 }}>{allCollected.toLocaleString('fr')}</span>
                <span style={{ fontSize: 10.5, color: 'var(--ink-400)', marginLeft: 3 }}>CAD</span>
              </td>
              {COST_FIELDS.map(f => (
                <td key={f.key} style={{ textAlign: 'right' }}>
                  <span className="mono" style={{ fontWeight: 700, color: 'var(--ink-600)' }}>
                    {campaigns.reduce((s, c) => s + (costsData[c.id]?.[f.key] || 0), 0).toLocaleString('fr')}
                  </span>
                </td>
              ))}
              <td style={{ textAlign: 'right' }}>
                <span className="mono" style={{ fontWeight: 800, color: 'var(--ink-900)' }}>
                  {allCosts.toLocaleString('fr')}
                </span>
                <span style={{ fontSize: 10.5, color: 'var(--ink-400)', marginLeft: 3 }}>CAD</span>
              </td>
              <td style={{ textAlign: 'right' }}>
                <span className="mono" style={{ fontWeight: 800, color: 'var(--ok-600)' }}>
                  {allMargin.toLocaleString('fr')}
                </span>
                <span style={{ fontSize: 10.5, color: 'var(--ink-400)', marginLeft: 3 }}>CAD</span>
              </td>
              <td style={{ textAlign: 'center' }}>
                <span className={'badge badge--' + marginKind(allPct)} style={{ fontWeight: 800 }}>{allPct}%</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Per-route breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {DATA.ROUTES.filter(r => r.active).map(r => {
          const rc   = DATA.CAMPAIGNS.filter(c => c.route === r.id);
          if (!rc.length) return null;
          const rColl  = rc.reduce((s, c) => s + c.collected, 0);
          const rCosts = rc.reduce((s, c) => s + totalCost(c), 0);
          const rMg    = rColl - rCosts;
          const rPct   = rColl > 0 ? Math.round(rMg / rColl * 100) : 0;
          const rWt    = rc.reduce((s, c) => s + c.weight, 0);
          return (
            <div key={r.id} className="card" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <RoutePill from={r.fromIATA} to={r.toIATA} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{r.fromCity} → {r.toCity}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>{rc.length} cargaison{rc.length > 1 ? 's' : ''} · {(rWt / 1000).toFixed(1)} t</div>
                </div>
              </div>
              {[
                { l: 'CA encaissé',  v: rColl,  color: 'var(--brand-600)' },
                { l: 'Total coûts',  v: rCosts, color: 'var(--bad-500)'   },
                { l: 'Marge brute',  v: rMg,    color: 'var(--ok-600)'    },
              ].map(row => (
                <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border-soft)', fontSize: 12.5 }}>
                  <span style={{ color: 'var(--ink-500)' }}>{row.l}</span>
                  <span className="mono" style={{ fontWeight: 700, color: row.color }}>
                    {row.v.toLocaleString('fr')} {r.currency}
                  </span>
                </div>
              ))}
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 11.5 }}>
                  <span style={{ color: 'var(--ink-500)' }}>Taux de marge</span>
                  <span style={{ fontWeight: 700, color: rPct >= 55 ? 'var(--ok-600)' : 'var(--warn-600)' }}>{rPct}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--ink-100)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: rPct + '%', background: rPct >= 55 ? 'var(--ok-500)' : 'var(--warn-500)', borderRadius: 999 }} />
                </div>
              </div>
              {/* Cost breakdown mini bars */}
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {COST_FIELDS.map(f => {
                  const fieldTotal = rc.reduce((s, c) => s + (costsData[c.id]?.[f.key] || 0), 0);
                  const pct = rCosts > 0 ? Math.round(fieldTotal / rCosts * 100) : 0;
                  return (
                    <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 72, fontSize: 10.5, color: 'var(--ink-400)', flexShrink: 0 }}>{f.label}</span>
                      <div style={{ flex: 1, height: 4, background: 'var(--ink-100)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: pct + '%', background: f.color, borderRadius: 999 }} />
                      </div>
                      <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-500)', width: 30, textAlign: 'right' }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CostKpi({ icon, label, value, unit, color, sub, progress }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 10.5, color: 'var(--ink-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', lineHeight: 1.4 }}>{label}</div>
        <span style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <div className="mono" style={{ fontSize: 22, fontWeight: 700, color, letterSpacing: '-.02em' }}>
        {value}{unit && <span style={{ fontSize: 12, color: 'var(--ink-400)', fontWeight: 500, marginLeft: 3 }}>{unit}</span>}
      </div>
      {sub && <div className="mono" style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 4 }}>{sub}</div>}
      {progress != null && (
        <div style={{ height: 5, background: 'var(--ink-100)', borderRadius: 999, overflow: 'hidden', marginTop: 8 }}>
          <div style={{ height: '100%', width: Math.min(100, progress) + '%', background: color, borderRadius: 999 }} />
        </div>
      )}
    </div>
  );
}
