import { useState, useEffect } from 'react';
import I from '../components/Icons.jsx';
import { Bi, RoutePill, useCan } from '../components/Shell.jsx';

const COST_FIELDS = [
  { key: 'fret',        label: 'Transport aérien',       hint: 'Coût du fret aérien facturé par la compagnie', color: 'var(--brand-500)' },
  { key: 'douane',      label: 'Douane & dédouanement',  hint: "Frais de dédouanement, taxes à l'import", color: 'var(--warn-500)'  },
  { key: 'entrepot',    label: 'Entrepôt & logistique',  hint: 'Stockage, manutention, entreposage des deux côtés', color: 'var(--info-500)'  },
  { key: 'transport',   label: 'Transport terrestre',    hint: 'Acheminement vers/depuis aéroport, dernier kilomètre', color: 'var(--ok-500)'    },
  { key: 'manutention', label: 'Frais de manutention',   hint: 'Main-d\'œuvre de chargement et déchargement', color: 'var(--ok-700)'    },
  { key: 'divers',      label: 'Divers & imprévus',      hint: 'Assurance, emballage, frais bancaires, imprévus', color: 'var(--ink-400)'   },
];

function marginKind(pct) {
  if (pct >= 55) return 'ok';
  if (pct >= 35) return 'info';
  if (pct >= 15) return 'warn';
  return 'bad';
}

function hasCosts(cd) {
  return cd && Object.values(cd).some(v => v > 0);
}

// ── Modal de saisie des coûts ──────────────────────────────────────
function CostModal({ campaign, currentCosts, onSave, onClose }) {
  const route = { fromIATA: campaign.from, toIATA: campaign.to };
  const currency = 'CAD';
  const [draft, setDraft] = useState(
    Object.fromEntries(COST_FIELDS.map(f => [f.key, currentCosts?.[f.key] || '']))
  );

  const val  = k => parseInt(draft[k]) || 0;
  const total = COST_FIELDS.reduce((s, f) => s + val(f.key), 0);
  const col   = campaign.collected ?? 0;
  const mg    = col - total;
  const mp    = col > 0 ? Math.round(mg / col * 100) : 0;
  const upd   = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  const save = () => {
    const saved = Object.fromEntries(COST_FIELDS.map(f => [f.key, val(f.key)]));
    onSave(campaign.id, saved);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 520, boxShadow: '0 24px 64px rgba(0,0,0,.28)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <RoutePill from={route?.fromIATA} to={route?.toIATA} />
          <div style={{ flex: 1 }}>
            <div className="mono" style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>{campaign.code}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>
              {campaign.dep} · {campaign.parcels} colis · {(campaign.weight / 1000).toFixed(1)} t
            </div>
          </div>
          <button onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 999, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 16, color: 'var(--ink-400)', flexShrink: 0 }}>
            ×
          </button>
        </div>

        {/* CA encaissé */}
        <div style={{ padding: '10px 20px', background: 'var(--brand-50)', borderBottom: '1px solid var(--brand-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12.5, color: 'var(--brand-700)', fontWeight: 600 }}>CA encaissé (référence)</span>
          <span className="mono" style={{ fontSize: 18, fontWeight: 800, color: 'var(--brand-700)' }}>
            {col.toLocaleString('fr')}
            <span style={{ fontSize: 11, fontWeight: 500, marginLeft: 4 }}>{currency}</span>
          </span>
        </div>

        {/* Form */}
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 11 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 2 }}>
            Postes de coût opérationnel
          </div>

          {COST_FIELDS.map(f => {
            const v    = val(f.key);
            const pct  = total > 0 ? Math.round(v / total * 100) : 0;
            return (
              <div key={f.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, width: 148, flexShrink: 0 }}>
                    <span style={{ width: 10, height: 10, background: f.color, borderRadius: 3, flexShrink: 0 }} />
                    <label style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-800)', cursor: 'default' }}>{f.label}</label>
                  </div>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      type="number" min="0" placeholder="0"
                      value={draft[f.key]}
                      onChange={e => upd(f.key, e.target.value)}
                      style={{ width: '100%', padding: '8px 52px 8px 12px', border: '1.5px solid var(--border)', borderRadius: 6, fontSize: 14, fontFamily: 'var(--ff-mono)', outline: 'none', textAlign: 'right', transition: 'border-color .15s' }}
                      onFocus={e => e.currentTarget.style.borderColor = 'var(--brand-400)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--ink-400)', fontWeight: 600, pointerEvents: 'none' }}>
                      {currency}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--ink-300)', width: 28, textAlign: 'right', fontFamily: 'var(--ff-mono)', flexShrink: 0 }}>
                    {pct > 0 ? pct + '%' : ''}
                  </span>
                </div>
                {f.hint && (
                  <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 3, paddingLeft: 155, lineHeight: 1.4 }}>{f.hint}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Live calculation */}
        <div style={{ margin: '0 20px 16px', background: 'var(--bg-soft)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '13px 16px' }}>
          {[
            { l: 'Total coûts',  v: total, color: 'var(--ink-900)' },
            { l: 'Marge brute',  v: mg,    color: mg >= 0 ? 'var(--ok-600)' : 'var(--bad-500)' },
          ].map(row => (
            <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12.5, color: 'var(--ink-500)' }}>{row.l}</span>
              <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: row.color }}>
                {row.v.toLocaleString('fr')} {currency}
              </span>
            </div>
          ))}
          <div style={{ height: 1, background: 'var(--border-soft)', margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)' }}>Taux de marge</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 80, height: 6, background: 'var(--ink-100)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: Math.min(100, Math.max(0, mp)) + '%', borderRadius: 999, transition: 'width .3s, background .3s',
                  background: mp >= 55 ? 'var(--ok-500)' : mp >= 35 ? 'var(--brand-500)' : mp >= 15 ? 'var(--warn-500)' : 'var(--bad-500)' }} />
              </div>
              <span className={'badge badge--' + marginKind(mp)} style={{ minWidth: 44, textAlign: 'center', fontWeight: 700 }}>{mp}%</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '13px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end', background: 'var(--bg-soft)' }}>
          <button className="btn btn--ghost" onClick={onClose}>Annuler</button>
          <button className="btn btn--primary" onClick={save}>
            <I.Check style={{ width: 14, height: 14 }} />
            Enregistrer les coûts
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main screen ────────────────────────────────────────────────────
export default function CostsScreen({ onNav }) {
  const can = useCan();
  const [campaigns, setCampaigns]     = useState([]);
  const [costsData, setCostsData]     = useState({});
  const [modal, setModal]             = useState(null);
  const [routeFilter, setRouteFilter] = useState('all');
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    fetch('/api/campaigns').then(r => r.json()).then(data => {
      const arr = Array.isArray(data) ? data : [];
      setCampaigns(arr);
      setCostsData(Object.fromEntries(arr.map(c => [c.id, c.costs ?? {}])));
      setLoading(false);
    });
  }, []);

  const filtered = campaigns.filter(c => routeFilter === 'all' || c.route === routeFilter);

  const totalCost = c => COST_FIELDS.reduce((s, f) => s + (costsData[c.id]?.[f.key] || 0), 0);
  const margin    = c => (c.collected ?? 0) - totalCost(c);
  const marginPct = c => (c.collected ?? 0) > 0 ? Math.round(margin(c) / c.collected * 100) : 0;

  const allCollected = filtered.reduce((s, c) => s + (c.collected ?? 0), 0);
  const allCosts     = filtered.reduce((s, c) => s + totalCost(c), 0);
  const allMargin    = allCollected - allCosts;
  const allPct       = allCollected > 0 ? Math.round(allMargin / allCollected * 100) : 0;
  const allWeight    = filtered.reduce((s, c) => s + (c.weight ?? 0), 0);
  const costPerKg    = allWeight > 0 ? (allCosts / allWeight).toFixed(2) : '—';
  const best         = [...filtered].sort((a, b) => marginPct(b) - marginPct(a))[0];

  const saveCosts = async (id, saved) => {
    await fetch(`/api/costs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saved),
    });
    setCostsData(d => ({ ...d, [id]: saved }));
    setModal(null);
  };

  const routes = [...new Map(campaigns.map(c => [c.route, { id: c.route, code: c.routeCode }])).values()];
  const routeOf = id => campaigns.find(c => c.id === id) ?? null;

  return (
    <div className="page">
      {modal && (
        <CostModal
          campaign={modal}
          currentCosts={costsData[modal.id]}
          onSave={saveCosts}
          onClose={() => setModal(null)}
        />
      )}

      <div className="page__head">
        <div>
          <div className="page__title"><Bi fr="Coûts & Marges" en="Cost tracking" /></div>
          <div className="page__sub">Saisie des coûts opérationnels par cargaison · marge brute calculée en temps réel</div>
        </div>
        <div className="page__actions">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 6px 4px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'white', fontSize: 12.5 }}>
            <I.Route style={{ width: 14, height: 14, color: 'var(--ink-400)' }} />
            <select value={routeFilter} onChange={e => setRouteFilter(e.target.value)} style={{ border: 0, background: 'transparent', fontWeight: 600, paddingRight: 4 }}>
              <option value="all">Toutes les routes</option>
              {routes.map(r => <option key={r.id} value={r.id}>{r.code}</option>)}
            </select>
          </div>
          <button className="btn btn--ghost"><I.Download />Export</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 18 }}>
        <CostKpi icon="📉" label="Coûts totaux"       value={(allCosts / 1000).toFixed(1) + 'k'}  unit="CAD" color="var(--bad-500)" />
        <CostKpi icon="📈" label="Marge brute"         value={(allMargin / 1000).toFixed(1) + 'k'} unit="CAD" color="var(--ok-500)" />
        <CostKpi icon="%" label="Taux de marge"        value={allPct}  unit="%" color={allPct >= 55 ? 'var(--ok-500)' : 'var(--warn-500)'} progress={allPct} />
        <CostKpi icon="⚖️" label="Coût moyen / kg"    value={costPerKg} unit="CAD/kg" color="var(--brand-500)" />
        <CostKpi icon="🏆" label="Meilleure marge"     value={best ? marginPct(best) + '%' : '—'} unit="" color="var(--ok-600)" sub={best?.code} />
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'auto', marginBottom: 14 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Cargaison</th>
              <th style={{ textAlign: 'right' }}>CA encaissé</th>
              <th style={{ textAlign: 'right' }}>Total coûts</th>
              <th style={{ textAlign: 'right' }}>Marge brute</th>
              <th style={{ textAlign: 'center' }}>Taux</th>
              <th style={{ textAlign: 'center', borderRadius: 0 }}>Coûts</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const tc  = totalCost(c);
              const mg  = margin(c);
              const mp  = marginPct(c);
              const renseigné = hasCosts(costsData[c.id]);
              return (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <RoutePill from={c.from} to={c.to} />
                      <div>
                        <div className="mono" style={{ fontSize: 12.5, fontWeight: 700 }}>{c.code}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 1 }}>
                          {c.dep} · {c.parcels} colis · {(c.weight / 1000).toFixed(1)} t
                        </div>
                      </div>
                      <span className={'badge badge--' + (c.status === 'ok' ? 'ok' : 'info') + ' badge--dot'}>
                        {c.status === 'ok' ? 'Clôturé' : 'En transit'}
                      </span>
                    </div>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <span className="mono" style={{ fontWeight: 700 }}>{(c.collected ?? 0).toLocaleString('fr')}</span>
                    <span style={{ fontSize: 10.5, color: 'var(--ink-400)', marginLeft: 3 }}>CAD</span>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    {renseigné ? (
                      <>
                        <span className="mono" style={{ fontWeight: 700, color: 'var(--ink-800)' }}>{tc.toLocaleString('fr')}</span>
                        <span style={{ fontSize: 10.5, color: 'var(--ink-400)', marginLeft: 3 }}>CAD</span>
                      </>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--ink-300)', fontStyle: 'italic' }}>Non renseigné</span>
                    )}
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    {renseigné ? (
                      <>
                        <span className="mono" style={{ fontWeight: 700, color: mg >= 0 ? 'var(--ok-600)' : 'var(--bad-500)' }}>{mg.toLocaleString('fr')}</span>
                        <span style={{ fontSize: 10.5, color: 'var(--ink-400)', marginLeft: 3 }}>CAD</span>
                      </>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--ink-300)', fontStyle: 'italic' }}>—</span>
                    )}
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    {renseigné
                      ? <span className={'badge badge--' + marginKind(mp)}>{mp}%</span>
                      : <span style={{ fontSize: 12, color: 'var(--ink-300)' }}>—</span>
                    }
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    {can('costs', 'edit') ? (
                      <button
                        className={'btn btn--xs ' + (renseigné ? 'btn--ghost' : 'btn--primary')}
                        onClick={() => setModal(c)}
                      >
                        {renseigné
                          ? <><I.Edit style={{ width: 12, height: 12 }} />Modifier</>
                          : <><I.Plus style={{ width: 12, height: 12 }} />Saisir</>
                        }
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--ink-300)' }}>Lecture seule</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Totals */}
            <tr style={{ background: 'var(--ink-50)', borderTop: '2px solid var(--border)' }}>
              <td><span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-600)' }}>Total · {campaigns.length} cargaisons</span></td>
              <td style={{ textAlign: 'right' }}>
                <span className="mono" style={{ fontWeight: 800 }}>{allCollected.toLocaleString('fr')}</span>
                <span style={{ fontSize: 10.5, color: 'var(--ink-400)', marginLeft: 3 }}>CAD</span>
              </td>
              <td style={{ textAlign: 'right' }}>
                <span className="mono" style={{ fontWeight: 800, color: 'var(--ink-900)' }}>{allCosts.toLocaleString('fr')}</span>
                <span style={{ fontSize: 10.5, color: 'var(--ink-400)', marginLeft: 3 }}>CAD</span>
              </td>
              <td style={{ textAlign: 'right' }}>
                <span className="mono" style={{ fontWeight: 800, color: 'var(--ok-600)' }}>{allMargin.toLocaleString('fr')}</span>
                <span style={{ fontSize: 10.5, color: 'var(--ink-400)', marginLeft: 3 }}>CAD</span>
              </td>
              <td style={{ textAlign: 'center' }}>
                <span className={'badge badge--' + marginKind(allPct)} style={{ fontWeight: 800 }}>{allPct}%</span>
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Per-route breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {routes.map(r => {
          const rc    = filtered.filter(c => c.route === r.id);
          if (!rc.length) return null;
          const rColl  = rc.reduce((s, c) => s + (c.collected ?? 0), 0);
          const rCosts = rc.reduce((s, c) => s + totalCost(c), 0);
          const rMg    = rColl - rCosts;
          const rPct   = rColl > 0 ? Math.round(rMg / rColl * 100) : 0;
          const rWt    = rc.reduce((s, c) => s + (c.weight ?? 0), 0);
          const [from, to] = r.code.split(' → ');
          return (
            <div key={r.id} className="card" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <RoutePill from={from} to={to} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{r.code}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>{rc.length} cargaisons · {(rWt / 1000).toFixed(1)} t</div>
                </div>
              </div>
              {[
                { l: 'CA encaissé', v: rColl,  color: 'var(--brand-600)' },
                { l: 'Total coûts', v: rCosts, color: 'var(--bad-500)'   },
                { l: 'Marge brute', v: rMg,    color: 'var(--ok-600)'    },
              ].map(row => (
                <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border-soft)', fontSize: 12.5 }}>
                  <span style={{ color: 'var(--ink-500)' }}>{row.l}</span>
                  <span className="mono" style={{ fontWeight: 700, color: row.color }}>{row.v.toLocaleString('fr')} {r.currency}</span>
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
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {COST_FIELDS.map(f => {
                  const ft  = rc.reduce((s, c) => s + (costsData[c.id]?.[f.key] || 0), 0);
                  const pct = rCosts > 0 ? Math.round(ft / rCosts * 100) : 0;
                  return (
                    <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 80, fontSize: 10.5, color: 'var(--ink-400)', flexShrink: 0 }}>{f.label}</span>
                      <div style={{ flex: 1, height: 4, background: 'var(--ink-100)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: pct + '%', background: f.color, borderRadius: 999 }} />
                      </div>
                      <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-500)', width: 28, textAlign: 'right' }}>{pct}%</span>
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
