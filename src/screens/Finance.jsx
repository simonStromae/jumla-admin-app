'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useCurrency } from '../lib/useCurrency.js';
const fmt2 = (v) => new Intl.NumberFormat('fr-CA', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(v || 0);

function fiscalYearOf(date) {
  const d = new Date(date);
  return d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
}
function fiscalLabel(y) { return `${y}–${y + 1}`; }
function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Tableau de bord',       icon: '📊' },
  { id: 'posts',      label: 'Postes de coûts',        icon: '📋' },
  { id: 'cargo',      label: 'Cargaisons',             icon: '✈️' },
  { id: 'margin',     label: 'Marge',                  icon: '📈' },
  { id: 'finance',    label: 'Analyse financière',     icon: '💰' },
  { id: 'transport',  label: 'Transport & Douane',     icon: '🚚' },
  { id: 'routes',     label: 'Rentabilité par ligne',  icon: '🗺️' },
  { id: 'budget',     label: 'Budget annuel',          icon: '📒' },
  { id: 'payroll',    label: 'Paie Québec',            icon: '👥' },
  { id: 'hyp',        label: 'Hypothèses / kg',        icon: '⚙️' },
  { id: 'scenarios',  label: 'Scénarios & Break-even', icon: '🔮' },
  { id: 'guide',      label: 'Guide',                  icon: '📖' },
];

// ─── KPI Card ────────────────────────────────────────────────
function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', borderLeft: color ? `3px solid ${color}` : undefined }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink-900)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Dashboard Tab ───────────────────────────────────────────
function DashboardTab() {
  const { fmt: money } = useCurrency();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/finance/dashboard')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 32, color: 'var(--ink-400)' }}>Chargement…</div>;
  if (!data) return null;

  const marginColor = data.marginPct >= 20 ? 'var(--ok-500)' : data.marginPct >= 0 ? 'var(--info-500)' : 'var(--bad-500)';
  const netColor = data.netResult >= 0 ? 'var(--ok-500)' : 'var(--bad-500)';

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--info-600)', marginBottom: 6 }}>
          Exercice {fiscalLabel(data.fiscalYear)} · YTD au {data.ytdThrough}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-900)' }}>Tableau de bord financier</div>
        <div style={{ fontSize: 14, color: 'var(--ink-400)', marginTop: 4 }}>{data.campaignCount} cargaison{data.campaignCount !== 1 ? 's' : ''} dans l'exercice en cours</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        <KpiCard label="CA facturé YTD" value={money(data.totalRevenueCad)} sub="Paiements reçus" color="var(--info-500)" />
        <KpiCard label="Coûts variables YTD" value={money(data.totalVariableCosts)} sub="Dépenses par cargaison" color="var(--bad-400)" />
        <KpiCard label="Charges fixes YTD" value={money(data.totalFixedCosts)} sub="Frais généraux" color="var(--bad-300)" />
        <KpiCard label="Marge brute YTD" value={data.marginPct !== null ? fmt2(data.marginPct) + ' %' : '—'}
          sub={money(data.grossMargin)} color={marginColor} />
        <KpiCard label="Résultat net YTD" value={money(data.netResult)} sub="Après toutes charges" color={netColor} />
      </div>

      <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, fontSize: 13, color: 'var(--ink-500)' }}>
        <strong style={{ color: 'var(--ink-700)' }}>Formule :</strong> CA facturé ({money(data.totalRevenueCad)}) − Coûts variables ({money(data.totalVariableCosts)}) = Marge brute ({money(data.grossMargin)}) − Charges fixes ({money(data.totalFixedCosts)}) = <strong style={{ color: netColor }}>Résultat net {money(data.netResult)}</strong>
      </div>
    </div>
  );
}

// ─── Posts Tab ───────────────────────────────────────────────
function PostsTab() {
  const { fmt: money, currency } = useCurrency();
  const [posts, setPosts] = useState([]);
  const [dataMode, setDataMode] = useState('historical'); // historical | real
  const [realCategory, setRealCategory] = useState('variable'); // variable | fixed
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Variable costs state
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [campaignInfo, setCampaignInfo] = useState(null);
  const [cargoCosts, setCargoCosts] = useState({});
  const [cargoLoading, setCargoLoading] = useState(false);

  // Fixed costs state
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [fixedCosts, setFixedCosts] = useState({});
  const [fixedYtd, setFixedYtd] = useState({});
  const [fixedLoading, setFixedLoading] = useState(false);

  // Add post modal
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addType, setAddType] = useState('variable');
  const [adding, setAdding] = useState(false);

  const saveTimer = useRef({});

  useEffect(() => {
    Promise.all([
      fetch('/api/finance/posts').then(r => r.json()),
      fetch('/api/campaigns').then(r => r.json()),
    ]).then(([p, c]) => {
      setPosts(p);
      const list = Array.isArray(c) ? c : (c.campaigns ?? []);
      setCampaigns(list.filter(x => !x.deletedAt).sort((a, b) =>
        new Date(b.departureDate || b.createdAt) - new Date(a.departureDate || a.createdAt)));
    }).finally(() => setLoading(false));
  }, []);

  const loadCargoCosts = useCallback((campaignId) => {
    if (!campaignId) return;
    setCargoLoading(true);
    fetch(`/api/finance/cargo-costs/${campaignId}`)
      .then(r => r.json())
      .then(d => {
        setCampaignInfo(d.campaign);
        setCargoCosts(d.costs || {});
      })
      .finally(() => setCargoLoading(false));
  }, []);

  const loadFixedCosts = useCallback((month) => {
    setFixedLoading(true);
    fetch(`/api/finance/fixed-costs/${month}`)
      .then(r => r.json())
      .then(d => {
        setFixedCosts(d.costs || {});
        setFixedYtd(d.ytd || {});
      })
      .finally(() => setFixedLoading(false));
  }, []);

  useEffect(() => { if (selectedCampaign) loadCargoCosts(selectedCampaign); }, [selectedCampaign, loadCargoCosts]);
  useEffect(() => { if (dataMode === 'real' && realCategory === 'fixed') loadFixedCosts(selectedMonth); }, [dataMode, realCategory, selectedMonth, loadFixedCosts]);

  const handleCargoCostChange = (postId, raw) => {
    const val = raw === '' ? null : parseFloat(raw);
    setCargoCosts(prev => ({ ...prev, [postId]: val === null ? undefined : val }));
    clearTimeout(saveTimer.current[postId]);
    saveTimer.current[postId] = setTimeout(() => {
      fetch(`/api/finance/cargo-costs/${selectedCampaign}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ costs: { [postId]: val } }),
      });
    }, 600);
  };

  const handleFixedCostChange = (postId, raw) => {
    const val = raw === '' ? null : parseFloat(raw);
    setFixedCosts(prev => ({ ...prev, [postId]: val === null ? undefined : val }));
    clearTimeout(saveTimer.current[`f${postId}`]);
    saveTimer.current[`f${postId}`] = setTimeout(() => {
      fetch(`/api/finance/fixed-costs/${selectedMonth}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [postId]: val }),
      });
    }, 600);
  };

  const handleAddPost = async () => {
    if (!addName.trim()) return;
    setAdding(true);
    const r = await fetch('/api/finance/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: addName.trim(), type: addType }),
    });
    const p = await r.json();
    setPosts(prev => [...prev, p]);
    setAddName(''); setShowAdd(false); setAdding(false);
  };

  const variablePosts = posts.filter(p => p.type === 'variable');
  const fixedPosts    = posts.filter(p => p.type === 'fixed');

  const filtered = (dataMode === 'real'
    ? (realCategory === 'variable' ? variablePosts : fixedPosts)
    : posts.filter(p => p.type !== 'excluded')
  ).filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  const totalHistorical = filtered.reduce((s, p) => s + (p.historicalAmt || 0), 0);

  // Compute margin for variable tab
  const totalVariable = variablePosts.reduce((s, p) => s + (cargoCosts[p.id] ?? 0), 0);
  const revCad = campaignInfo?.revenueCad ?? 0;
  const wKg    = campaignInfo?.weightKg ?? 0;
  const grossMargin = revCad > 0 ? revCad - totalVariable : null;
  const marginPct   = grossMargin !== null && revCad > 0 ? grossMargin / revCad * 100 : null;

  const totalFixed = fixedPosts.reduce((s, p) => s + (fixedCosts[p.id] ?? 0), 0);
  const totalFixedYtd = fixedPosts.reduce((s, p) => s + (fixedYtd[p.id] ?? 0), 0);

  if (loading) return <div style={{ padding: 32, color: 'var(--ink-400)' }}>Chargement…</div>;

  const s = { // table cell styles
    th: { padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--ink-400)', background: 'var(--bg-soft)', whiteSpace: 'nowrap', textAlign: 'left' },
    td: { padding: '8px 12px', fontSize: 13, borderBottom: '1px solid var(--border)', color: 'var(--ink-700)' },
    num: { textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
    input: { border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', fontSize: 13, width: '100%', background: 'var(--white)', color: 'var(--ink-900)', textAlign: 'right' },
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-900)' }}>Postes de coûts</div>
          <div style={{ fontSize: 14, color: 'var(--ink-400)', marginTop: 4 }}>
            {variablePosts.length} postes variables · {fixedPosts.length} postes fixes
          </div>
        </div>
        {dataMode === 'real' && (
          <button onClick={() => setShowAdd(true)}
            style={{ background: 'var(--ok-500)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            + Ajouter un poste
          </button>
        )}
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 6, background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 10, padding: 5, width: 'fit-content', marginBottom: 20 }}>
        {[['historical', '📚 Historique'], ['real', '✏️ Réel']].map(([m, label]) => (
          <button key={m} onClick={() => setDataMode(m)} style={{
            border: 'none', borderRadius: 7, padding: '9px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 700,
            background: dataMode === m ? 'var(--brand-gradient)' : 'transparent',
            color: dataMode === m ? '#fff' : 'var(--ink-600)',
          }}>{label}</button>
        ))}
      </div>

      {/* Real mode: category tabs */}
      {dataMode === 'real' && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {[['variable', '✈ Coûts variables'], ['fixed', '🏢 Coûts fixes']].map(([c, label]) => (
            <button key={c} onClick={() => setRealCategory(c)} style={{
              border: `2px solid ${realCategory === c ? 'var(--info-500)' : 'var(--border)'}`,
              borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700,
              background: realCategory === c ? 'var(--info-50)' : 'var(--white)',
              color: realCategory === c ? 'var(--info-700)' : 'var(--ink-500)',
            }}>{label}</button>
          ))}
        </div>
      )}

      {/* Variable costs: cargo selector + summary */}
      {dataMode === 'real' && realCategory === 'variable' && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 10 }}>Cargaison</div>
          <select value={selectedCampaign} onChange={e => setSelectedCampaign(e.target.value)}
            style={{ width: '100%', maxWidth: 520, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, fontWeight: 600, background: 'var(--white)', color: 'var(--ink-900)' }}>
            <option value="">— Sélectionner une cargaison —</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.from && c.to ? `${c.from} → ${c.to}` : ''} · {c.departureDate ? new Date(c.departureDate).toLocaleDateString('fr-CA') : '—'}
              </option>
            ))}
          </select>

          {campaignInfo && !cargoLoading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginTop: 14 }}>
              <div style={{ background: 'var(--bg-soft)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', marginBottom: 4 }}>CA facturé</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink-900)' }}>{money(campaignInfo.revenueCad)}</div>
                {campaignInfo.revenueCadIsOverride && <div style={{ fontSize: 11, color: 'var(--info-600)' }}>Valeur manuelle</div>}
              </div>
              <div style={{ background: 'var(--bg-soft)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', marginBottom: 4 }}>Coûts variables</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink-900)' }}>{money(totalVariable)}</div>
              </div>
              {grossMargin !== null && (
                <div style={{ background: grossMargin >= 0 ? 'var(--ok-50)' : 'var(--bad-50)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', marginBottom: 4 }}>Marge brute</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: grossMargin >= 0 ? 'var(--ok-600)' : 'var(--bad-600)' }}>
                    {money(grossMargin)} ({fmt2(marginPct)} %)
                  </div>
                </div>
              )}
              {wKg > 0 && totalVariable > 0 && (
                <div style={{ background: 'var(--bg-soft)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', marginBottom: 4 }}>Coût / kg</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink-900)' }}>{fmt2(totalVariable / wKg)} {currency}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Fixed costs: month selector + YTD summary */}
      {dataMode === 'real' && realCategory === 'fixed' && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 6 }}>Mois</div>
              <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'var(--white)', color: 'var(--ink-900)' }} />
            </div>
            <div style={{ background: 'var(--bg-soft)', borderRadius: 8, padding: '10px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', marginBottom: 2 }}>Total du mois</div>
              <div style={{ fontSize: 17, fontWeight: 800 }}>{money(totalFixed)}</div>
            </div>
            <div style={{ background: 'var(--bg-soft)', borderRadius: 8, padding: '10px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', marginBottom: 2 }}>Cumul YTD</div>
              <div style={{ fontSize: 17, fontWeight: 800 }}>{money(totalFixedYtd)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 12 }}>
        <input placeholder="Rechercher un poste…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', maxWidth: 360, padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'var(--white)', color: 'var(--ink-900)' }} />
      </div>

      {/* Posts table */}
      {(dataMode === 'historical' || (dataMode === 'real' && (realCategory === 'variable' ? true : true))) && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', maxHeight: 560 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th style={s.th}>#</th>
                  <th style={s.th}>Poste de coûts</th>
                  {dataMode === 'historical' && <th style={{ ...s.th, textAlign: 'right' }}>Montant historique</th>}
                  {dataMode === 'real' && realCategory === 'variable' && <th style={{ ...s.th, textAlign: 'right' }}>Montant réel (CAD)</th>}
                  {dataMode === 'real' && realCategory === 'fixed' && (
                    <>
                      <th style={{ ...s.th, textAlign: 'right' }}>Mois {selectedMonth}</th>
                      <th style={{ ...s.th, textAlign: 'right' }}>Cumul YTD</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map(post => (
                  <tr key={post.id} style={{ background: 'var(--white)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-soft)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--white)'}>
                    <td style={{ ...s.td, color: 'var(--ink-300)', fontSize: 11, width: 40 }}>{post.id}</td>
                    <td style={s.td}>
                      <span style={{ fontWeight: 600 }}>{post.name}</span>
                      {post.customAdded && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, background: 'var(--info-100)', color: 'var(--info-700)', borderRadius: 999, padding: '2px 6px' }}>personnalisé</span>}
                    </td>
                    {dataMode === 'historical' && (
                      <td style={{ ...s.td, ...s.num }}>{post.historicalAmt !== 0 ? money(post.historicalAmt) : <span style={{ color: 'var(--ink-300)' }}>—</span>}</td>
                    )}
                    {dataMode === 'real' && realCategory === 'variable' && (
                      <td style={{ ...s.td, ...s.num, width: 160 }}>
                        {selectedCampaign ? (
                          <input type="number" step="0.01" placeholder="—"
                            value={cargoCosts[post.id] !== undefined ? cargoCosts[post.id] : ''}
                            onChange={e => handleCargoCostChange(post.id, e.target.value)}
                            style={s.input} />
                        ) : <span style={{ color: 'var(--ink-300)' }}>Choisir une cargaison</span>}
                      </td>
                    )}
                    {dataMode === 'real' && realCategory === 'fixed' && (
                      <>
                        <td style={{ ...s.td, ...s.num, width: 160 }}>
                          {fixedLoading ? '…' : (
                            <input type="number" step="0.01" placeholder="—"
                              value={fixedCosts[post.id] !== undefined ? fixedCosts[post.id] : ''}
                              onChange={e => handleFixedCostChange(post.id, e.target.value)}
                              style={s.input} />
                          )}
                        </td>
                        <td style={{ ...s.td, ...s.num, fontWeight: 700 }}>
                          {fixedYtd[post.id] ? money(fixedYtd[post.id]) : <span style={{ color: 'var(--ink-300)' }}>—</span>}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} style={{ ...s.td, textAlign: 'center', color: 'var(--ink-300)', padding: 24 }}>Aucun poste trouvé</td></tr>
                )}
              </tbody>
              {dataMode === 'historical' && (
                <tfoot>
                  <tr style={{ background: 'var(--bg-soft)' }}>
                    <td colSpan={2} style={{ ...s.td, fontWeight: 700, fontSize: 12 }}>Total affiché</td>
                    <td style={{ ...s.td, ...s.num, fontWeight: 800, fontSize: 14 }}>{money(totalHistorical)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Add post modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowAdd(false)}>
          <div style={{ background: 'var(--white)', borderRadius: 14, padding: 28, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Nouveau poste de coûts</div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', display: 'block', marginBottom: 6 }}>Nom du poste</label>
              <input value={addName} onChange={e => setAddName(e.target.value)}
                placeholder="ex. Nouveau frais douanier"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'var(--white)', color: 'var(--ink-900)' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', display: 'block', marginBottom: 6 }}>Type</label>
              <select value={addType} onChange={e => setAddType(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'var(--white)', color: 'var(--ink-900)' }}>
                <option value="variable">Variable (par cargaison)</option>
                <option value="fixed">Fixe (par mois, entreprise)</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAdd(false)} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '9px 16px', fontSize: 13, cursor: 'pointer', background: 'var(--white)', color: 'var(--ink-700)' }}>Annuler</button>
              <button onClick={handleAddPost} disabled={!addName.trim() || adding}
                style={{ background: 'var(--brand-gradient)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: addName.trim() ? 'pointer' : 'not-allowed', opacity: addName.trim() ? 1 : .5 }}>
                {adding ? 'Création…' : 'Créer le poste'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Cargo Margin Tab ────────────────────────────────────────
function CargoTab() {
  const { fmt: money, currency } = useCurrency();
  const [campaigns, setCampaigns] = useState([]);
  const [selected, setSelected] = useState('');
  const [data, setData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/campaigns').then(r => r.json()),
      fetch('/api/finance/posts').then(r => r.json()),
    ]).then(([c, p]) => {
      const list = Array.isArray(c) ? c : (c.campaigns ?? []);
      setCampaigns(list.filter(x => !x.deletedAt));
      setPosts(p.filter(x => x.type === 'variable'));
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) { setData(null); return; }
    fetch(`/api/finance/cargo-costs/${selected}`).then(r => r.json()).then(setData);
  }, [selected]);

  if (loading) return <div style={{ padding: 32, color: 'var(--ink-400)' }}>Chargement…</div>;

  const costsMap = data?.costs ?? {};
  const totalVarCosts = posts.reduce((s, p) => s + (costsMap[p.id] ?? 0), 0);
  const filledCount   = posts.filter(p => costsMap[p.id] !== undefined).length;
  const revCad = data?.campaign?.revenueCad ?? 0;
  const wKg    = data?.campaign?.weightKg;
  const gross  = revCad > 0 && filledCount > 0 ? revCad - totalVarCosts : null;
  const pct    = gross !== null && revCad > 0 ? gross / revCad * 100 : null;

  const s = {
    td: { padding: '8px 12px', fontSize: 13, borderBottom: '1px solid var(--border)', color: 'var(--ink-700)' },
    th: { padding: '9px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--ink-400)', background: 'var(--bg-soft)', textAlign: 'left' },
  };

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-900)', marginBottom: 20 }}>Marge par cargaison</div>

      <select value={selected} onChange={e => setSelected(e.target.value)}
        style={{ width: '100%', maxWidth: 520, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, fontWeight: 600, background: 'var(--white)', color: 'var(--ink-900)', marginBottom: 20 }}>
        <option value="">— Sélectionner une cargaison —</option>
        {campaigns.map(c => (
          <option key={c.id} value={c.id}>
            {c.code} · {c.from && c.to ? `${c.from} → ${c.to}` : ''} · {c.departureDate ? new Date(c.departureDate).toLocaleDateString('fr-CA') : '—'}
          </option>
        ))}
      </select>

      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12, marginBottom: 20 }}>
            <KpiCard label="CA facturé" value={money(revCad)} sub={data.campaign.revenueCadIsOverride ? 'Valeur manuelle' : 'Paiements reçus'} color="var(--info-500)" />
            <KpiCard label="Coûts variables" value={money(totalVarCosts)} sub={`${filledCount}/${posts.length} postes renseignés`} color="var(--bad-400)" />
            {gross !== null && <KpiCard label="Marge brute" value={money(gross)} sub={fmt2(pct) + ' %'} color={gross >= 0 ? 'var(--ok-500)' : 'var(--bad-500)'} />}
            {wKg && <KpiCard label="Coût / kg" value={fmt2(totalVarCosts / wKg) + ' ' + currency} sub={`Poids AWB : ${wKg} kg`} />}
          </div>

          {filledCount < posts.length && (
            <div style={{ background: 'var(--info-50)', border: '1px solid var(--info-200)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--info-700)', marginBottom: 16 }}>
              {posts.length - filledCount} poste{posts.length - filledCount > 1 ? 's' : ''} sans montant — marge provisoire. Pour saisir les coûts, aller dans <strong>Postes de coûts → Coûts réels → Coûts variables</strong>.
            </div>
          )}

          <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', maxHeight: 420 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
                <thead style={{ position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={s.th}>Poste</th>
                    <th style={{ ...s.th, textAlign: 'right' }}>Montant (CAD)</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map(p => (
                    <tr key={p.id}>
                      <td style={s.td}>{p.name}</td>
                      <td style={{ ...s.td, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: costsMap[p.id] ? 600 : 400, color: costsMap[p.id] ? 'var(--ink-900)' : 'var(--ink-300)' }}>
                        {costsMap[p.id] !== undefined ? money(costsMap[p.id]) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--bg-soft)' }}>
                    <td style={{ ...s.td, fontWeight: 700 }}>Total coûts variables</td>
                    <td style={{ ...s.td, textAlign: 'right', fontWeight: 800, fontSize: 14 }}>{money(totalVarCosts)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Margin Analysis Tab (Phase 2) ───────────────────────────
function MarginAnalysisTab() {
  const { fmt: money } = useCurrency();
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView]   = useState('month'); // 'month' | 'route'

  useEffect(() => {
    fetch('/api/finance/margin-analysis')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 32, color: 'var(--ink-400)' }}>Chargement…</div>;
  if (!data)   return null;

  const { currentFY, prevFY } = data;

  const pct2 = v => v !== null && v !== undefined ? fmt2(v) + ' %' : '—';
  const diff = (n, p) => {
    if (!n || !p) return null;
    return n - p;
  };
  const diffPct = (n, p) => {
    if (!p || p === 0) return null;
    return ((n - p) / Math.abs(p)) * 100;
  };

  const marginColor = v => v === null ? 'var(--ink-400)' : v >= 20 ? 'var(--ok-600)' : v >= 0 ? 'var(--info-600)' : 'var(--bad-500)';
  const deltaColor  = v => v === null ? 'var(--ink-300)' : v > 0 ? 'var(--ok-600)' : v < 0 ? 'var(--bad-500)' : 'var(--ink-400)';
  const deltaSign   = v => v === null ? '—' : v > 0 ? `+${fmt2(v)} %` : `${fmt2(v)} %`;

  const s = {
    th: { padding: '9px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--ink-400)', background: 'var(--bg-soft)', textAlign: 'right', borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap' },
    thL: { padding: '9px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--ink-400)', background: 'var(--bg-soft)', textAlign: 'left', borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap' },
    td: { padding: '8px 10px', fontSize: 13, borderBottom: '1px solid var(--border)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
    tdL: { padding: '8px 10px', fontSize: 13, borderBottom: '1px solid var(--border)', textAlign: 'left' },
    tot: { padding: '9px 10px', fontSize: 13, fontWeight: 800, background: 'var(--bg-soft)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
    totL: { padding: '9px 10px', fontSize: 13, fontWeight: 800, background: 'var(--bg-soft)', textAlign: 'left' },
  };

  const FRENCH_MONTHS = ['juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.', 'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin'];
  const monthLabel = (m) => {
    const [y, mo] = m.split('-').map(Number);
    const idx = mo >= 7 ? mo - 7 : mo + 5;
    return `${FRENCH_MONTHS[idx]} ${y}`;
  };

  const rows = view === 'month'
    ? currentFY.byMonth.map((cur, i) => ({ key: cur.month, label: monthLabel(cur.month), cur, prev: prevFY.byMonth[i] }))
    : currentFY.byRoute.map(cur => {
        const pr = prevFY.byRoute.find(r => r.routeId === cur.routeId);
        return { key: cur.routeId, label: cur.route, cur, prev: pr ?? null };
      });

  const ctot = currentFY.totals;
  const ptot = prevFY.totals;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--info-600)', marginBottom: 6 }}>
          Comparaison {currentFY.label} vs {prevFY.label}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-900)' }}>Analyse des marges YTD</div>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        <KpiCard label={`CA ${currentFY.label}`}   value={money(ctot.revenue)}     sub={`N-1 : ${money(ptot.revenue)}`}     color="var(--info-500)" />
        <KpiCard label={`Coûts var. ${currentFY.label}`} value={money(ctot.variableCosts)} sub={`N-1 : ${money(ptot.variableCosts)}`} color="var(--bad-400)" />
        <KpiCard label="Marge brute N"  value={money(ctot.grossMargin)}  sub={pct2(ctot.marginPct)}  color={marginColor(ctot.marginPct)} />
        <KpiCard label="Marge brute N-1" value={money(ptot.grossMargin)} sub={pct2(ptot.marginPct)} color={marginColor(ptot.marginPct)} />
        <KpiCard label="Δ Marge brute"
          value={deltaSign(diffPct(ctot.grossMargin, ptot.grossMargin))}
          sub={diff(ctot.grossMargin, ptot.grossMargin) !== null ? money(diff(ctot.grossMargin, ptot.grossMargin)) : ''}
          color={deltaColor(diffPct(ctot.grossMargin, ptot.grossMargin))} />
      </div>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: 6, background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, width: 'fit-content', marginBottom: 20 }}>
        {[{ id: 'month', label: 'Par mois' }, { id: 'route', label: 'Par ligne' }].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            padding: '6px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: view === v.id ? 'var(--white)' : 'transparent',
            color: view === v.id ? 'var(--ink-900)' : 'var(--ink-400)',
            boxShadow: view === v.id ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
          }}>{v.label}</button>
        ))}
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr>
                <th style={s.thL}>{view === 'month' ? 'Mois' : 'Ligne'}</th>
                <th style={s.th}>CA N</th>
                <th style={s.th}>CA N-1</th>
                <th style={s.th}>Coûts var. N</th>
                <th style={s.th}>Coûts var. N-1</th>
                <th style={s.th}>Marge brute N</th>
                <th style={s.th}>Marge % N</th>
                <th style={s.th}>Marge % N-1</th>
                <th style={s.th}>Δ marge</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ key, label, cur, prev }) => {
                const prevRow = prev ?? { revenue: 0, variableCosts: 0, grossMargin: 0, marginPct: null, campaignCount: 0 };
                const dp = diffPct(cur.grossMargin, prevRow.grossMargin);
                const hasData = cur.revenue > 0 || cur.variableCosts > 0;
                return (
                  <tr key={key} style={{ background: 'var(--white)', opacity: hasData ? 1 : 0.45 }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-soft)'}
                    onMouseLeave={e => e.currentTarget.style.background = hasData ? 'var(--white)' : 'transparent'}>
                    <td style={{ ...s.tdL, fontWeight: 600 }}>{label}</td>
                    <td style={s.td}>{cur.revenue > 0 ? money(cur.revenue) : <span style={{ color: 'var(--ink-300)' }}>—</span>}</td>
                    <td style={{ ...s.td, color: 'var(--ink-400)' }}>{prevRow.revenue > 0 ? money(prevRow.revenue) : <span style={{ color: 'var(--ink-300)' }}>—</span>}</td>
                    <td style={s.td}>{cur.variableCosts > 0 ? money(cur.variableCosts) : <span style={{ color: 'var(--ink-300)' }}>—</span>}</td>
                    <td style={{ ...s.td, color: 'var(--ink-400)' }}>{prevRow.variableCosts > 0 ? money(prevRow.variableCosts) : <span style={{ color: 'var(--ink-300)' }}>—</span>}</td>
                    <td style={{ ...s.td, fontWeight: 700, color: cur.grossMargin >= 0 ? 'var(--ok-600)' : 'var(--bad-500)' }}>
                      {cur.revenue > 0 ? money(cur.grossMargin) : <span style={{ color: 'var(--ink-300)' }}>—</span>}
                    </td>
                    <td style={{ ...s.td, color: marginColor(cur.marginPct), fontWeight: 700 }}>{pct2(cur.marginPct)}</td>
                    <td style={{ ...s.td, color: marginColor(prevRow.marginPct) }}>{pct2(prevRow.marginPct)}</td>
                    <td style={{ ...s.td, fontWeight: 700, color: deltaColor(dp) }}>{deltaSign(dp)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td style={s.totL}>Total exercice</td>
                <td style={s.tot}>{money(ctot.revenue)}</td>
                <td style={{ ...s.tot, color: 'var(--ink-500)' }}>{money(ptot.revenue)}</td>
                <td style={s.tot}>{money(ctot.variableCosts)}</td>
                <td style={{ ...s.tot, color: 'var(--ink-500)' }}>{money(ptot.variableCosts)}</td>
                <td style={{ ...s.tot, color: ctot.grossMargin >= 0 ? 'var(--ok-600)' : 'var(--bad-500)' }}>{money(ctot.grossMargin)}</td>
                <td style={{ ...s.tot, color: marginColor(ctot.marginPct) }}>{pct2(ctot.marginPct)}</td>
                <td style={{ ...s.tot, color: marginColor(ptot.marginPct) }}>{pct2(ptot.marginPct)}</td>
                <td style={{ ...s.tot, color: deltaColor(diffPct(ctot.grossMargin, ptot.grossMargin)) }}>
                  {deltaSign(diffPct(ctot.grossMargin, ptot.grossMargin))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 14, fontSize: 12, color: 'var(--ink-400)' }}>
        N = {currentFY.label} · N-1 = {prevFY.label} · Marge brute = CA − coûts variables · Δ = variation en % de la marge brute
      </div>
    </div>
  );
}

// ─── Fiscal Snapshots Tab (Phase 3) ──────────────────────────
function SnapshotsTab() {
  const { fmt: money } = useCurrency();
  const [snapshots, setSnapshots] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);
  const [archiving, setArchiving] = useState(false);
  const [archiveMsg, setArchiveMsg] = useState('');

  useEffect(() => {
    fetch('/api/finance/snapshots')
      .then(r => r.json())
      .then(s => {
        setSnapshots(s);
        if (s.length > 0) setSelected(s[0].fiscalYear);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleArchive = async () => {
    setArchiving(true);
    setArchiveMsg('');
    const res = await fetch('/api/finance/archive-fiscal-year', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    const d = await res.json();
    if (d.alreadyExists) {
      setArchiveMsg(`L'exercice ${d.fiscalYear}–${d.fiscalYear + 1} est déjà archivé.`);
    } else if (d.ok) {
      setArchiveMsg(`Exercice ${d.label} archivé (${d.campaignCount} cargaisons).`);
      const updated = await fetch('/api/finance/snapshots').then(r => r.json());
      setSnapshots(updated);
      setSelected(d.fiscalYear);
    } else {
      setArchiveMsg('Erreur lors de l\'archivage.');
    }
    setArchiving(false);
  };

  if (loading) return <div style={{ padding: 32, color: 'var(--ink-400)' }}>Chargement…</div>;

  const snap = snapshots.find(s => s.fiscalYear === selected);
  const payload = snap?.payload;

  const pct2 = v => v !== null && v !== undefined ? fmt2(v) + ' %' : '—';
  const marginColor = v => v === null ? 'var(--ink-400)' : v >= 20 ? 'var(--ok-600)' : v >= 0 ? 'var(--info-600)' : 'var(--bad-500)';
  const FRENCH_MONTHS = ['juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.', 'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin'];
  const monthLabel = (m) => {
    const [y, mo] = m.split('-').map(Number);
    const idx = mo >= 7 ? mo - 7 : mo + 5;
    return `${FRENCH_MONTHS[idx]} ${y}`;
  };

  const s = {
    th: { padding: '9px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--ink-400)', background: 'var(--bg-soft)', textAlign: 'right', borderBottom: '2px solid var(--border)' },
    thL: { padding: '9px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--ink-400)', background: 'var(--bg-soft)', textAlign: 'left', borderBottom: '2px solid var(--border)' },
    td: { padding: '8px 10px', fontSize: 13, borderBottom: '1px solid var(--border)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
    tdL: { padding: '8px 10px', fontSize: 13, borderBottom: '1px solid var(--border)', textAlign: 'left' },
    tot: { padding: '9px 10px', fontSize: 13, fontWeight: 800, background: 'var(--bg-soft)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
    totL: { padding: '9px 10px', fontSize: 13, fontWeight: 800, background: 'var(--bg-soft)', textAlign: 'left' },
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--info-600)', marginBottom: 6 }}>Archivage automatique · 1er juillet</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-900)' }}>Exercices archivés</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {archiveMsg && <span style={{ fontSize: 13, color: 'var(--ink-500)' }}>{archiveMsg}</span>}
          <button onClick={handleArchive} disabled={archiving}
            style={{ background: 'var(--brand-gradient)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: archiving ? 'not-allowed' : 'pointer', opacity: archiving ? .6 : 1 }}>
            {archiving ? 'Archivage…' : '📦 Archiver l\'exercice précédent'}
          </button>
        </div>
      </div>

      {snapshots.length === 0 ? (
        <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 10, padding: 32, textAlign: 'center', color: 'var(--ink-400)', fontSize: 14 }}>
          Aucun exercice archivé. Le cron du 1er juillet archivera automatiquement l'exercice écoulé.<br />
          Vous pouvez aussi archiver manuellement via le bouton ci-dessus.
        </div>
      ) : (
        <>
          {/* Year selector */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
            {snapshots.map(s => (
              <button key={s.fiscalYear} onClick={() => setSelected(s.fiscalYear)} style={{
                padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: selected === s.fiscalYear ? 'var(--info-50)' : 'var(--white)',
                color: selected === s.fiscalYear ? 'var(--info-700)' : 'var(--ink-700)',
              }}>
                {s.fiscalYear}–{s.fiscalYear + 1}
              </button>
            ))}
          </div>

          {payload && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
                <KpiCard label="CA total" value={money(payload.totals.revenue)} sub={`${payload.campaignCount} cargaisons`} color="var(--info-500)" />
                <KpiCard label="Coûts variables" value={money(payload.totals.variableCosts)} color="var(--bad-400)" />
                <KpiCard label="Charges fixes" value={money(payload.totals.fixedCosts)} color="var(--bad-300)" />
                <KpiCard label="Marge brute" value={money(payload.totals.grossMargin)} sub={pct2(payload.totals.marginPct)} color={marginColor(payload.totals.marginPct)} />
                <KpiCard label="Résultat net" value={money(payload.totals.netResult)} color={payload.totals.netResult >= 0 ? 'var(--ok-500)' : 'var(--bad-500)'} />
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                    <thead>
                      <tr>
                        <th style={s.thL}>Mois</th>
                        <th style={s.th}>CA</th>
                        <th style={s.th}>Coûts var.</th>
                        <th style={s.th}>Charges fixes</th>
                        <th style={s.th}>Marge brute</th>
                        <th style={s.th}>Marge %</th>
                        <th style={s.th}>Résultat net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payload.byMonth.map(row => (
                        <tr key={row.month}
                          style={{ background: row.revenue > 0 ? 'var(--white)' : 'transparent', opacity: row.revenue > 0 ? 1 : 0.4 }}
                          onMouseEnter={e => { if (row.revenue > 0) e.currentTarget.style.background = 'var(--bg-soft)'; }}
                          onMouseLeave={e => { if (row.revenue > 0) e.currentTarget.style.background = 'var(--white)'; }}>
                          <td style={{ ...s.tdL, fontWeight: 600 }}>{monthLabel(row.month)}</td>
                          <td style={s.td}>{row.revenue > 0 ? money(row.revenue) : <span style={{ color: 'var(--ink-300)' }}>—</span>}</td>
                          <td style={s.td}>{row.variableCosts > 0 ? money(row.variableCosts) : <span style={{ color: 'var(--ink-300)' }}>—</span>}</td>
                          <td style={s.td}>{row.fixedCosts > 0 ? money(row.fixedCosts) : <span style={{ color: 'var(--ink-300)' }}>—</span>}</td>
                          <td style={{ ...s.td, fontWeight: 700, color: row.revenue > 0 ? (row.grossMargin >= 0 ? 'var(--ok-600)' : 'var(--bad-500)') : 'var(--ink-300)' }}>
                            {row.revenue > 0 ? money(row.grossMargin) : '—'}
                          </td>
                          <td style={{ ...s.td, color: marginColor(row.marginPct), fontWeight: 700 }}>{pct2(row.marginPct)}</td>
                          <td style={{ ...s.td, color: row.netResult >= 0 ? 'var(--ok-600)' : 'var(--bad-500)' }}>
                            {row.revenue > 0 ? money(row.netResult) : <span style={{ color: 'var(--ink-300)' }}>—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td style={s.totL}>Total exercice</td>
                        <td style={s.tot}>{money(payload.totals.revenue)}</td>
                        <td style={s.tot}>{money(payload.totals.variableCosts)}</td>
                        <td style={s.tot}>{money(payload.totals.fixedCosts)}</td>
                        <td style={{ ...s.tot, color: payload.totals.grossMargin >= 0 ? 'var(--ok-600)' : 'var(--bad-500)' }}>{money(payload.totals.grossMargin)}</td>
                        <td style={{ ...s.tot, color: marginColor(payload.totals.marginPct) }}>{pct2(payload.totals.marginPct)}</td>
                        <td style={{ ...s.tot, color: payload.totals.netResult >= 0 ? 'var(--ok-600)' : 'var(--bad-500)' }}>{money(payload.totals.netResult)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {payload.byRoute.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 12 }}>Répartition par ligne</div>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={s.thL}>Ligne</th>
                          <th style={s.th}>CA</th>
                          <th style={s.th}>Coûts var.</th>
                          <th style={s.th}>Marge brute</th>
                          <th style={s.th}>Marge %</th>
                          <th style={s.th}>Cargaisons</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payload.byRoute.map(r => (
                          <tr key={r.routeId} style={{ background: 'var(--white)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-soft)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--white)'}>
                            <td style={{ ...s.tdL, fontWeight: 600 }}>{r.route}</td>
                            <td style={s.td}>{money(r.revenue)}</td>
                            <td style={s.td}>{money(r.variableCosts)}</td>
                            <td style={{ ...s.td, fontWeight: 700, color: r.grossMargin >= 0 ? 'var(--ok-600)' : 'var(--bad-500)' }}>{money(r.grossMargin)}</td>
                            <td style={{ ...s.td, color: marginColor(r.marginPct), fontWeight: 700 }}>{pct2(r.marginPct)}</td>
                            <td style={s.td}>{r.campaignCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── Budget & Scenarios Tab (Phase 4) ────────────────────────
function BudgetTab() {
  const { fmt: money } = useCurrency();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [budget,  setBudget]  = useState({});
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [fy,      setFy]      = useState(null);
  const [view,    setView]    = useState('budget'); // 'budget' | 'breakeven' | 'scenarios'
  const saveTimer = useRef(null);

  const currentFY = fiscalYearOf(new Date());

  useEffect(() => {
    const year = fy ?? currentFY;
    setLoading(true);
    fetch(`/api/finance/budget?fy=${year}`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        setBudget(d.budget || {});
      })
      .finally(() => setLoading(false));
  }, [fy, currentFY]);

  const handleBudgetChange = (postId, raw) => {
    const val = raw === '' ? undefined : parseFloat(raw);
    setBudget(prev => {
      const next = { ...prev, [postId]: val };
      if (val === undefined) delete next[postId];
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        setSaving(true);
        await fetch(`/api/finance/budget?fy=${fy ?? currentFY}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next),
        });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }, 800);
      return next;
    });
  };

  if (loading) return <div style={{ padding: 32, color: 'var(--ink-400)' }}>Chargement…</div>;
  if (!data)   return null;

  const varPosts  = data.posts.filter(p => p.type === 'variable');
  const fixPosts  = data.posts.filter(p => p.type === 'fixed');
  const pct2 = v => v !== null && v !== undefined ? fmt2(v) + ' %' : '—';

  // Totals
  const totalBudgetVar = varPosts.reduce((s, p) => s + (budget[p.id] ?? 0), 0);
  const totalBudgetFix = fixPosts.reduce((s, p) => s + (budget[p.id] ?? 0), 0);
  const totalActualVar = varPosts.reduce((s, p) => s + (data.actualVariable[p.id] ?? 0), 0);
  const totalActualFix = fixPosts.reduce((s, p) => s + (data.actualFixed[p.id] ?? 0), 0);
  const totalBudget    = totalBudgetVar + totalBudgetFix;

  // Break-even: fixed costs / contribution margin ratio
  const totalAnnualFix = fixPosts.reduce((s, p) => s + (data.annualFixed[p.id] ?? 0), 0);
  const totalAnnualVar = varPosts.reduce((s, p) => s + (budget[p.id] ?? 0), 0);
  const budgetRevenue  = data.totalRevenue > 0 ? data.totalRevenue : null;
  const varRatio       = budgetRevenue && totalActualVar > 0 ? totalActualVar / budgetRevenue : (totalBudgetVar > 0 && totalBudget > 0 ? totalBudgetVar / (totalBudgetVar + totalBudgetFix + 1) : null);
  const cmRatio        = varRatio !== null ? 1 - varRatio : null;
  const breakEven      = cmRatio && cmRatio > 0 && totalAnnualFix > 0 ? totalAnnualFix / cmRatio : null;

  // Scenario volumes: 0% / +10% / +20%
  const baseRevenue = budgetRevenue ?? 0;
  const baseVarCosts = totalActualVar > 0 ? totalActualVar : totalBudgetVar;
  const scenarios = [0, 10, 20].map(pctChange => {
    const rev    = baseRevenue * (1 + pctChange / 100);
    const varC   = varRatio !== null ? rev * varRatio : baseVarCosts * (1 + pctChange / 100);
    const gross  = rev - varC;
    const net    = gross - totalAnnualFix;
    const margin = rev > 0 ? gross / rev * 100 : null;
    return { pctChange, rev, varC, gross, net, margin };
  });

  const s = {
    th: { padding: '8px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--ink-400)', background: 'var(--bg-soft)', textAlign: 'right', borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap' },
    thL: { padding: '8px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--ink-400)', background: 'var(--bg-soft)', textAlign: 'left', borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap' },
    td: { padding: '7px 10px', fontSize: 13, borderBottom: '1px solid var(--border)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
    tdL: { padding: '7px 10px', fontSize: 13, borderBottom: '1px solid var(--border)', textAlign: 'left' },
    tot: { padding: '8px 10px', fontSize: 13, fontWeight: 800, background: 'var(--bg-soft)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
    totL: { padding: '8px 10px', fontSize: 13, fontWeight: 800, background: 'var(--bg-soft)', textAlign: 'left' },
    input: { width: 110, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, textAlign: 'right', background: 'var(--white)', color: 'var(--ink-900)', fontVariantNumeric: 'tabular-nums' },
  };

  const availableYears = [currentFY, currentFY - 1, currentFY - 2];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-900)' }}>Budget & Break-even</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saved && <span style={{ fontSize: 12, color: 'var(--ok-600)', fontWeight: 600 }}>✓ Enregistré</span>}
          {saving && <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>Enregistrement…</span>}
          <select value={fy ?? currentFY} onChange={e => setFy(parseInt(e.target.value))}
            style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--white)', color: 'var(--ink-900)' }}>
            {availableYears.map(y => <option key={y} value={y}>{y}–{y + 1}</option>)}
          </select>
        </div>
      </div>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: 6, background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, width: 'fit-content', marginBottom: 24 }}>
        {[{ id: 'budget', label: '📒 Budget' }, { id: 'breakeven', label: '⚖️ Break-even' }, { id: 'scenarios', label: '🔮 Scénarios' }].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: view === v.id ? 'var(--white)' : 'transparent',
            color: view === v.id ? 'var(--ink-900)' : 'var(--ink-400)',
            boxShadow: view === v.id ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
          }}>{v.label}</button>
        ))}
      </div>

      {view === 'budget' && (
        <>
          <div style={{ fontSize: 13, color: 'var(--ink-500)', marginBottom: 16 }}>
            Saisissez les montants budgétés pour l'exercice {data.label} · Réel YTD = cumulé depuis juillet
          </div>
          {[{ label: 'Coûts variables', posts: varPosts, actualMap: data.actualVariable, budgetTotal: totalBudgetVar, actualTotal: totalActualVar },
            { label: 'Charges fixes (YTD)', posts: fixPosts, actualMap: data.actualFixed, budgetTotal: totalBudgetFix, actualTotal: totalActualFix }].map(section => (
            <div key={section.label} style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-600)', marginBottom: 10 }}>{section.label}</div>
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
                  <thead>
                    <tr>
                      <th style={s.thL}>Poste</th>
                      <th style={s.th}>Budget annuel</th>
                      <th style={s.th}>Réel YTD</th>
                      <th style={s.th}>Écart</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.posts.map(post => {
                      const bud   = budget[post.id] ?? 0;
                      const act   = section.actualMap[post.id] ?? 0;
                      const delta = act - bud;
                      return (
                        <tr key={post.id} style={{ background: 'var(--white)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-soft)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'var(--white)'}>
                          <td style={s.tdL}>{post.name}</td>
                          <td style={{ ...s.td, width: 140 }}>
                            <input type="number" step="0.01" placeholder="—"
                              value={budget[post.id] !== undefined ? budget[post.id] : ''}
                              onChange={e => handleBudgetChange(post.id, e.target.value)}
                              style={s.input} />
                          </td>
                          <td style={s.td}>{act > 0 ? money(act) : <span style={{ color: 'var(--ink-300)' }}>—</span>}</td>
                          <td style={{ ...s.td, fontWeight: bud > 0 ? 700 : 400, color: bud > 0 ? (delta > 0 ? 'var(--bad-500)' : 'var(--ok-600)') : 'var(--ink-300)' }}>
                            {bud > 0 && act > 0 ? (delta > 0 ? '+' : '') + money(delta) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td style={s.totL}>Total</td>
                      <td style={s.tot}>{section.budgetTotal > 0 ? money(section.budgetTotal) : '—'}</td>
                      <td style={s.tot}>{section.actualTotal > 0 ? money(section.actualTotal) : '—'}</td>
                      <td style={{ ...s.tot, color: section.actualTotal > section.budgetTotal ? 'var(--bad-500)' : section.budgetTotal > 0 ? 'var(--ok-600)' : 'var(--ink-400)' }}>
                        {section.budgetTotal > 0 && section.actualTotal > 0
                          ? (section.actualTotal - section.budgetTotal > 0 ? '+' : '') + money(section.actualTotal - section.budgetTotal)
                          : '—'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
        </>
      )}

      {view === 'breakeven' && (
        <div>
          <div style={{ fontSize: 13, color: 'var(--ink-500)', marginBottom: 20 }}>
            Basé sur les coûts fixes annuels réels et le ratio coûts variables / CA YTD
          </div>
          {breakEven !== null ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
              <KpiCard label="CA réel YTD" value={money(data.totalRevenue)} sub={`${data.campaignCount} cargaisons`} color="var(--info-500)" />
              <KpiCard label="Charges fixes annualisées" value={money(totalAnnualFix)} sub="Exercice complet" color="var(--bad-400)" />
              <KpiCard label="Ratio coûts variables / CA" value={pct2(varRatio !== null ? varRatio * 100 : null)} sub="Coûts var. ÷ CA" color="var(--bad-300)" />
              <KpiCard label="Taux de marge sur coûts var." value={pct2(cmRatio !== null ? cmRatio * 100 : null)} sub="1 − ratio var." color="var(--info-500)" />
              <KpiCard label="Seuil de rentabilité"
                value={money(breakEven)}
                sub={data.totalRevenue > 0 ? (data.totalRevenue >= breakEven ? '✓ Seuil atteint YTD' : `Manque ${money(breakEven - data.totalRevenue)}`) : ''}
                color={data.totalRevenue >= breakEven ? 'var(--ok-500)' : 'var(--bad-500)'} />
            </div>
          ) : (
            <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 10, padding: 24, color: 'var(--ink-400)', fontSize: 14 }}>
              Insuffisamment de données pour calculer le seuil de rentabilité. Renseignez les coûts variables et les charges fixes réelles.
            </div>
          )}
          {breakEven !== null && totalAnnualFix > 0 && (
            <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, fontSize: 13, color: 'var(--ink-600)' }}>
              <strong>Formule :</strong> Seuil = Charges fixes ({money(totalAnnualFix)}) ÷ Taux de marge ({pct2(cmRatio !== null ? cmRatio * 100 : null)}) = <strong>{money(breakEven)}</strong>
            </div>
          )}
        </div>
      )}

      {view === 'scenarios' && (
        <div>
          <div style={{ fontSize: 13, color: 'var(--ink-500)', marginBottom: 20 }}>
            Projection de la marge brute selon différentes hypothèses de volume, à partir du CA et des coûts YTD
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
            {scenarios.map(sc => {
              const mColor = sc.margin === null ? 'var(--ink-400)' : sc.margin >= 20 ? 'var(--ok-600)' : sc.margin >= 0 ? 'var(--info-600)' : 'var(--bad-500)';
              return (
                <div key={sc.pctChange} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, borderTop: sc.pctChange === 0 ? '3px solid var(--info-400)' : sc.pctChange === 10 ? '3px solid var(--ok-400)' : '3px solid var(--bad-400)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink-400)', marginBottom: 10 }}>
                    {sc.pctChange === 0 ? 'Volume actuel' : `+${sc.pctChange} % volume`}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--ink-500)' }}>CA projeté</span>
                      <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{money(sc.rev)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--ink-500)' }}>Coûts variables</span>
                      <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--bad-500)' }}>− {money(sc.varC)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--ink-500)' }}>Charges fixes</span>
                      <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--bad-400)' }}>− {money(totalAnnualFix)}</span>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ fontWeight: 700 }}>Résultat net</span>
                      <span style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: sc.net >= 0 ? 'var(--ok-600)' : 'var(--bad-500)' }}>{money(sc.net)}</span>
                    </div>
                    <div style={{ fontSize: 13, textAlign: 'right', color: mColor, fontWeight: 700 }}>
                      Marge brute : {pct2(sc.margin)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {baseRevenue === 0 && (
            <div style={{ background: 'var(--info-50)', border: '1px solid var(--info-200)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--info-700)' }}>
              Aucun CA réel enregistré pour cet exercice. Les scénarios se baseront sur les montants budgétés une fois saisis.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Payroll Québec Tab (Phase 4) ─────────────────────────────
const QC_RATES_2025 = {
  rrq:   { rate: 0.0640, maxEarnings: 69700, basicExemption: 3500, label: 'RRQ (employeur)' },
  rqap:  { rate: 0.00692, maxEarnings: 94000, label: 'RQAP (employeur)' },
  ae:    { rate: 0.01848, maxEarnings: 63200, label: 'AE (employeur, ×1.4)' },
  fss:   { rate: 0.0270,  maxEarnings: null,  label: 'FSS (masse salariale < 1 M$)' },
  cnt:   { rate: 0.0007,  maxEarnings: 94000, label: 'Normes du travail (CNT)' },
  cnesst:{ rate: 0.015,   maxEarnings: null,  label: 'CNESST (taux moyen)' },
};

function calcQC(grossSalary, cnesstRate = 0.015) {
  const s = grossSalary;
  const rrqBase = Math.max(0, Math.min(s, QC_RATES_2025.rrq.maxEarnings) - QC_RATES_2025.rrq.basicExemption);
  const rrq     = rrqBase * QC_RATES_2025.rrq.rate;
  const rqap    = Math.min(s, QC_RATES_2025.rqap.maxEarnings) * QC_RATES_2025.rqap.rate;
  const ae      = Math.min(s, QC_RATES_2025.ae.maxEarnings) * QC_RATES_2025.ae.rate;
  const fss     = s * QC_RATES_2025.fss.rate;
  const cnt     = Math.min(s, QC_RATES_2025.cnt.maxEarnings) * QC_RATES_2025.cnt.rate;
  const cnesst  = s * cnesstRate;
  const total   = rrq + rqap + ae + fss + cnt + cnesst;
  return { rrq, rqap, ae, fss, cnt, cnesst, total, effective: s > 0 ? total / s * 100 : 0 };
}

function PayrollTab() {
  const [salary,     setSalary]     = useState('');
  const [cnesstRate, setCnesstRate] = useState('1.5');
  const [employees,  setEmployees]  = useState('1');

  const gross    = parseFloat(salary) || 0;
  const cRate    = (parseFloat(cnesstRate) || 1.5) / 100;
  const empCount = parseInt(employees) || 1;
  const calc     = gross > 0 ? calcQC(gross, cRate) : null;

  const fmt = v => new Intl.NumberFormat('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  const rows = calc ? [
    { label: 'RRQ (Régime de rentes du Québec)', amount: calc.rrq, note: `${fmt(Math.max(0, Math.min(gross, 69700) - 3500))} × 6,40 %` },
    { label: 'RQAP (Assurance parentale Québec)', amount: calc.rqap, note: `${fmt(Math.min(gross, 94000))} × 0,692 %` },
    { label: 'AE (Assurance-emploi, ×1,4)', amount: calc.ae, note: `${fmt(Math.min(gross, 63200))} × 1,848 %` },
    { label: 'FSS (Fonds services de santé)', amount: calc.fss, note: `${fmt(gross)} × 2,70 %` },
    { label: 'CNT (Normes du travail)', amount: calc.cnt, note: `${fmt(Math.min(gross, 94000))} × 0,07 %` },
    { label: `CNESST (taux ${parseFloat(cnesstRate).toFixed(2)} %)`, amount: calc.cnesst, note: `${fmt(gross)} × ${cnesstRate} %` },
  ] : [];

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-900)', marginBottom: 6 }}>Calculateur de charges — Québec 2025</div>
      <div style={{ fontSize: 13, color: 'var(--ink-400)', marginBottom: 24 }}>Cotisations patronales estimées selon les taux 2025</div>

      {/* Inputs */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Salaire brut annuel (CAD)</label>
          <input type="number" value={salary} onChange={e => setSalary(e.target.value)} placeholder="ex. 55000"
            style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, fontWeight: 600, background: 'var(--white)', color: 'var(--ink-900)' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Taux CNESST (%)</label>
          <input type="number" step="0.01" value={cnesstRate} onChange={e => setCnesstRate(e.target.value)} placeholder="1.5"
            style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'var(--white)', color: 'var(--ink-900)' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Nombre d'employés</label>
          <input type="number" min="1" value={employees} onChange={e => setEmployees(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: 'var(--white)', color: 'var(--ink-900)' }} />
        </div>
      </div>

      {calc && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
            <KpiCard label="Salaire brut" value={`${fmt(gross)} $`} color="var(--info-500)" />
            <KpiCard label="Charges patronales" value={`${fmt(calc.total)} $`} sub={`${fmt(calc.effective)} % du salaire`} color="var(--bad-400)" />
            <KpiCard label="Coût total employeur" value={`${fmt(gross + calc.total)} $`} sub="Salaire + charges" color="var(--ink-500)" />
            {empCount > 1 && <KpiCard label={`Charges × ${empCount} emp.`} value={`${fmt(calc.total * empCount)} $`} color="var(--bad-300)" />}
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-400)', background: 'var(--bg-soft)', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Cotisation</th>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-400)', background: 'var(--bg-soft)', textAlign: 'right', borderBottom: '2px solid var(--border)' }}>Calcul</th>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-400)', background: 'var(--bg-soft)', textAlign: 'right', borderBottom: '2px solid var(--border)' }}>Montant</th>
                  {empCount > 1 && <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-400)', background: 'var(--bg-soft)', textAlign: 'right', borderBottom: '2px solid var(--border)' }}>× {empCount}</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.label} style={{ background: 'var(--white)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-soft)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--white)'}>
                    <td style={{ padding: '8px 12px', fontSize: 13, borderBottom: '1px solid var(--border)' }}>{r.label}</td>
                    <td style={{ padding: '8px 12px', fontSize: 12, borderBottom: '1px solid var(--border)', textAlign: 'right', color: 'var(--ink-400)' }}>{r.note}</td>
                    <td style={{ padding: '8px 12px', fontSize: 13, borderBottom: '1px solid var(--border)', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmt(r.amount)} $</td>
                    {empCount > 1 && <td style={{ padding: '8px 12px', fontSize: 13, borderBottom: '1px solid var(--border)', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--ink-500)' }}>{fmt(r.amount * empCount)} $</td>}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--bg-soft)' }}>
                  <td colSpan={2} style={{ padding: '9px 12px', fontWeight: 800, fontSize: 13 }}>Total charges patronales</td>
                  <td style={{ padding: '9px 12px', fontWeight: 800, fontSize: 14, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--bad-500)' }}>{fmt(calc.total)} $</td>
                  {empCount > 1 && <td style={{ padding: '9px 12px', fontWeight: 800, fontSize: 14, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--bad-500)' }}>{fmt(calc.total * empCount)} $</td>}
                </tr>
              </tfoot>
            </table>
          </div>

          <div style={{ fontSize: 12, color: 'var(--ink-400)', lineHeight: 1.6 }}>
            Taux 2025 · RRQ max. 69 700 $ (exonération 3 500 $) · RQAP max. 94 000 $ · AE max. 63 200 $ · FSS taux simplifié masse salariale &lt; 1 M$ · CNESST variable selon secteur d'activité
          </div>
        </>
      )}

      {!calc && (
        <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 10, padding: 32, textAlign: 'center', color: 'var(--ink-400)', fontSize: 14 }}>
          Saisissez un salaire brut annuel pour voir le calcul des charges
        </div>
      )}
    </div>
  );
}

// ─── Routes Tab — Rentabilité par ligne ──────────────────────
const MONTHS_FR_SHORT = ['juil.','août','sept.','oct.','nov.','déc.','janv.','févr.','mars','avr.','mai','juin'];

function RoutesTab() {
  const { fmt: money } = useCurrency();
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const currentFY = fiscalYearOf(new Date());

  useEffect(() => {
    setLoading(true);
    fetch('/api/finance/cost-breakdown?fy=' + currentFY)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [currentFY]);

  if (loading) return <div style={{ padding: 32, color: 'var(--ink-400)' }}>Chargement…</div>;
  if (!data) return null;

  const { byRoute, months, byPost, posts } = data;

  const marginColor = (pct) =>
    pct === null ? 'var(--ink-400)' : pct >= 20 ? 'var(--ok-600)' : pct >= 0 ? 'var(--info-600)' : 'var(--bad-500)';

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--info-600)', marginBottom: 6 }}>
          Exercice {fiscalLabel(currentFY)}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-900)' }}>Rentabilité par ligne</div>
        <div style={{ fontSize: 14, color: 'var(--ink-400)', marginTop: 4 }}>Marge brute par route, basée sur les coûts variables saisisis.</div>
      </div>

      {byRoute.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-400)' }}>Aucune cargaison avec route dans cet exercice.</div>
      ) : (
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-soft)' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--ink-500)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>Route</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--ink-500)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>Cargaisons</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--ink-500)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>CA</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--ink-500)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>Coûts var.</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--ink-500)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>Marge brute</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--ink-500)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>Marge %</th>
                <th style={{ width: 32 }}></th>
              </tr>
            </thead>
            <tbody>
              {byRoute.map((r, i) => {
                const isOpen = expanded === r.routeId;
                const pctColor = marginColor(r.marginPct);
                return (
                  <>
                    <tr key={r.routeId} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none', background: isOpen ? 'var(--info-50)' : 'transparent' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--ink-900)' }}>{r.route}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--ink-600)' }}>{r.campaignCount}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{money(r.revenue)}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--bad-500)' }}>{money(r.variableCosts)}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{money(r.grossMargin)}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: pctColor }}>{r.marginPct !== null ? fmt2(r.marginPct) + ' %' : '—'}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <button onClick={() => setExpanded(isOpen ? null : r.routeId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-400)', fontSize: 12, padding: '2px 6px', borderRadius: 4 }}>
                          {isOpen ? '▲' : '▼'}
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={r.routeId + '-detail'}>
                        <td colSpan={7} style={{ padding: '0 14px 14px 28px', background: 'var(--info-50)' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>Détail par poste de coût</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {posts.filter(p => r.costByPost[p.id] > 0).map(p => (
                              <div key={p.id} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', fontSize: 12 }}>
                                <span style={{ color: 'var(--ink-500)' }}>{p.name}: </span>
                                <span style={{ fontWeight: 700, color: 'var(--bad-500)' }}>{money(r.costByPost[p.id])}</span>
                              </div>
                            ))}
                            {posts.filter(p => r.costByPost[p.id] > 0).length === 0 && (
                              <div style={{ color: 'var(--ink-400)', fontSize: 12 }}>Aucun coût variable saisi pour cette route.</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Transport Tab — Transport & Douane ───────────────────────
function TransportTab() {
  const { fmt: money } = useCurrency();
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView]   = useState('by-post'); // 'by-post' | 'by-month'
  const currentFY = fiscalYearOf(new Date());

  useEffect(() => {
    setLoading(true);
    fetch('/api/finance/cost-breakdown?fy=' + currentFY)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [currentFY]);

  if (loading) return <div style={{ padding: 32, color: 'var(--ink-400)' }}>Chargement…</div>;
  if (!data) return null;

  const { posts, byPost, totalByPost, totalByMonth, months } = data;

  const grandTotal = Object.values(totalByPost).reduce((s, v) => s + v, 0);

  const btnStyle = (active) => ({
    padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13,
    background: active ? 'var(--info-600)' : 'var(--white)', color: active ? '#fff' : 'var(--ink-700)', fontWeight: active ? 700 : 500,
  });

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--info-600)', marginBottom: 6 }}>
          Exercice {fiscalLabel(currentFY)}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-900)' }}>Transport & Douane</div>
        <div style={{ fontSize: 14, color: 'var(--ink-400)', marginTop: 4 }}>Répartition des coûts variables par poste.</div>
      </div>

      <div style={{ marginBottom: 18, display: 'flex', gap: 8 }}>
        <button style={btnStyle(view === 'by-post')}  onClick={() => setView('by-post')}>Par poste</button>
        <button style={btnStyle(view === 'by-month')} onClick={() => setView('by-month')}>Par mois</button>
      </div>

      {view === 'by-post' && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-soft)' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--ink-500)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>Poste</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--ink-500)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>Total YTD</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--ink-500)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>% du total</th>
              </tr>
            </thead>
            <tbody>
              {posts.filter(p => (totalByPost[p.id] ?? 0) > 0).map((p, i) => {
                const amt = totalByPost[p.id] ?? 0;
                const pct = grandTotal > 0 ? (amt / grandTotal) * 100 : 0;
                return (
                  <tr key={p.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '12px 14px', color: 'var(--ink-800)' }}>
                      {p.name}
                      <div style={{ marginTop: 4, height: 4, borderRadius: 2, background: 'var(--border)', width: 120 }}>
                        <div style={{ height: '100%', borderRadius: 2, background: 'var(--bad-400)', width: pct + '%' }} />
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--bad-500)' }}>{money(amt)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--ink-500)' }}>{fmt2(pct)} %</td>
                  </tr>
                );
              })}
              <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--bg-soft)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--ink-900)' }}>Total</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: 'var(--bad-600)' }}>{money(grandTotal)}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700 }}>100 %</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {view === 'by-month' && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--bg-soft)' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--ink-500)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', position: 'sticky', left: 0, background: 'var(--bg-soft)' }}>Poste</th>
                {months.map((m, i) => (
                  <th key={m} style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600, color: 'var(--ink-500)', fontSize: 11, whiteSpace: 'nowrap' }}>{MONTHS_FR_SHORT[i]}</th>
                ))}
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--ink-700)', fontSize: 11, textTransform: 'uppercase' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {posts.filter(p => (totalByPost[p.id] ?? 0) > 0).map((p, i) => (
                <tr key={p.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '10px 14px', color: 'var(--ink-800)', position: 'sticky', left: 0, background: 'var(--white)', whiteSpace: 'nowrap' }}>{p.name}</td>
                  {months.map(m => (
                    <td key={m} style={{ padding: '10px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: (byPost[p.id]?.[m] ?? 0) > 0 ? 'var(--bad-500)' : 'var(--ink-300)' }}>
                      {(byPost[p.id]?.[m] ?? 0) > 0 ? money(byPost[p.id][m]) : '—'}
                    </td>
                  ))}
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: 'var(--bad-500)' }}>{money(totalByPost[p.id] ?? 0)}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--bg-soft)' }}>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--ink-900)', position: 'sticky', left: 0, background: 'var(--bg-soft)' }}>Total</td>
                {months.map(m => (
                  <td key={m} style={{ padding: '10px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: (totalByMonth[m] ?? 0) > 0 ? 'var(--bad-600)' : 'var(--ink-300)' }}>
                    {(totalByMonth[m] ?? 0) > 0 ? money(totalByMonth[m]) : '—'}
                  </td>
                ))}
                <td style={{ padding: '10px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 800, color: 'var(--bad-600)' }}>{money(grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Hypothèses Tab — Hypothèses / kg ────────────────────────
const HYP_FIELDS = [
  { key: 'transportPerKg',  label: 'Transport / kg',     unit: '$/kg',  help: 'Fret aérien ou terrestre par kilogramme' },
  { key: 'customsPct',      label: 'Douane (% valeur)',  unit: '%',     help: 'Taux de droits de douane sur la valeur déclarée' },
  { key: 'brokerPerKg',     label: 'Courtier / kg',      unit: '$/kg',  help: 'Honoraires du transitaire ou courtier en douane' },
  { key: 'storagePerKg',    label: 'Entreposage / kg',   unit: '$/kg',  help: 'Coûts de stockage par kilogramme' },
  { key: 'handlingPerKg',   label: 'Manutention / kg',   unit: '$/kg',  help: 'Chargement, déchargement, emballage' },
];

function HypTab() {
  const { fmt: money } = useCurrency();
  const currentFY = fiscalYearOf(new Date());
  const [fy, setFY]       = useState(currentFY);
  const [hyp, setHyp]     = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/finance/hypotheses?fy=' + fy)
      .then(r => r.json())
      .then(d => { setHyp(d.hyp); setLoading(false); });
  }, [fy]);

  const update = (key, raw) => {
    const val = parseFloat(raw) || 0;
    setHyp(h => ({ ...h, [key]: val }));
    setSaved(false);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setHyp(prev => {
        fetch('/api/finance/hypotheses?fy=' + fy, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prev),
        }).then(() => setSaved(true));
        return prev;
      });
    }, 800);
  };

  if (loading || !hyp) return <div style={{ padding: 32, color: 'var(--ink-400)' }}>Chargement…</div>;

  const weight = hyp.targetWeightKg || 1000;
  const revKg  = hyp.revenuePerKg || 0;
  const varCost = (
    hyp.transportPerKg * weight +
    (hyp.customsPct / 100) * (revKg * weight) +
    hyp.brokerPerKg * weight +
    hyp.storagePerKg * weight +
    hyp.handlingPerKg * weight
  );
  const revenue   = revKg * weight;
  const grossMargin = revenue - varCost;
  const marginPct   = revenue > 0 ? (grossMargin / revenue) * 100 : null;

  const inputStyle = { width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14, background: 'var(--white)', color: 'var(--ink-900)' };

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--info-600)', marginBottom: 6 }}>
            Exercice {fiscalLabel(fy)}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-900)' }}>Hypothèses / kg</div>
          <div style={{ fontSize: 14, color: 'var(--ink-400)', marginTop: 4 }}>Paramètres de coût par kilogramme pour les projections.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {saved && <span style={{ fontSize: 12, color: 'var(--ok-600)' }}>✓ Sauvegardé</span>}
          <select value={fy} onChange={e => setFY(Number(e.target.value))} style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, background: 'var(--white)' }}>
            {[currentFY, currentFY - 1, currentFY - 2].map(y => <option key={y} value={y}>{fiscalLabel(y)}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Parameters */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 16 }}>Paramètres de coût</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {HYP_FIELDS.map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', display: 'block', marginBottom: 4 }}>
                  {f.label} <span style={{ fontWeight: 400, color: 'var(--ink-400)' }}>({f.unit})</span>
                </label>
                <input type="number" min="0" step="0.01" value={hyp[f.key] ?? 0}
                  onChange={e => update(f.key, e.target.value)} style={inputStyle} />
                <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 3 }}>{f.help}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Simulation */}
        <div>
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 16 }}>Simulation par volume</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', display: 'block', marginBottom: 4 }}>Poids cible (kg)</label>
                <input type="number" min="0" step="1" value={hyp.targetWeightKg ?? 1000}
                  onChange={e => update('targetWeightKg', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', display: 'block', marginBottom: 4 }}>Revenu / kg ($/kg)</label>
                <input type="number" min="0" step="0.01" value={hyp.revenuePerKg ?? 0}
                  onChange={e => update('revenuePerKg', e.target.value)} style={inputStyle} />
              </div>
            </div>
          </div>
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 16 }}>Résultat estimé</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--ink-500)' }}>Revenu estimé</span>
                <span style={{ fontWeight: 700 }}>{money(revenue)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--ink-500)' }}>Coûts variables estimés</span>
                <span style={{ fontWeight: 700, color: 'var(--bad-500)' }}>{money(varCost)}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ fontWeight: 700 }}>Marge brute estimée</span>
                <span style={{ fontWeight: 800, color: grossMargin >= 0 ? 'var(--ok-600)' : 'var(--bad-500)' }}>{money(grossMargin)}</span>
              </div>
              {marginPct !== null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--ink-500)' }}>Marge %</span>
                  <span style={{ fontWeight: 700, color: marginPct >= 20 ? 'var(--ok-600)' : marginPct >= 0 ? 'var(--info-600)' : 'var(--bad-500)' }}>{fmt2(marginPct)} %</span>
                </div>
              )}
              <div style={{ background: 'var(--bg-soft)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--ink-500)', marginTop: 4 }}>
                Coût variable total / kg : <strong style={{ color: 'var(--ink-700)' }}>{weight > 0 ? fmt2(varCost / weight) : '—'} $/kg</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Scenarios & Break-even Tab (Phase 6) ────────────────────
function ScenariosTab() {
  const { fmt: money } = useCurrency();
  const currentFY = fiscalYearOf(new Date());
  const [fy, setFy] = useState(currentFY);
  const [loading, setLoading] = useState(true);

  // Simulator inputs (seeded from actuals, fully editable)
  const [simRev,    setSimRev]    = useState('');
  const [simVarPct, setSimVarPct] = useState('');
  const [simFix,    setSimFix]    = useState('');

  // Named scenarios
  const [rows, setRows] = useState([
    { id: 1, label: 'Pessimiste', revenue: '' },
    { id: 2, label: 'Réaliste',   revenue: '' },
    { id: 3, label: 'Optimiste',  revenue: '' },
  ]);
  const [nextId, setNextId] = useState(4);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/finance/budget?fy=${fy}`)
      .then(r => r.json())
      .then(data => {
        const varPosts = data.posts.filter(p => p.type === 'variable');
        const fixPosts = data.posts.filter(p => p.type === 'fixed');
        const totalVar = varPosts.reduce((s, p) => s + (data.actualVariable[p.id] ?? 0), 0);
        const totalFix = fixPosts.reduce((s, p) => s + (data.annualFixed[p.id] ?? 0), 0);
        const rev = data.totalRevenue;

        setSimRev(rev > 0 ? String(Math.round(rev)) : '');
        setSimVarPct(rev > 0 && totalVar > 0 ? String(Math.round(totalVar / rev * 1000) / 10) : '');
        setSimFix(totalFix > 0 ? String(Math.round(totalFix)) : '');

        if (rev > 0) {
          setRows([
            { id: 1, label: 'Pessimiste (−20 %)', revenue: String(Math.round(rev * 0.8)) },
            { id: 2, label: 'Base (actuel)',        revenue: String(Math.round(rev)) },
            { id: 3, label: 'Optimiste (+20 %)',    revenue: String(Math.round(rev * 1.2)) },
          ]);
        }
      })
      .finally(() => setLoading(false));
  }, [fy]);

  const rev    = parseFloat(simRev)    || 0;
  const varPct = parseFloat(simVarPct) || 0;
  const fix    = parseFloat(simFix)    || 0;
  const cmRatio   = varPct < 100 ? (100 - varPct) / 100 : 0;
  const varCost   = rev * varPct / 100;
  const gross     = rev - varCost;
  const net       = gross - fix;
  const marginPct = rev > 0 ? gross / rev * 100 : null;
  const breakEven = cmRatio > 0 && fix > 0 ? fix / cmRatio : null;
  const progressPct = breakEven && breakEven > 0 ? Math.min(rev / breakEven * 100, 100) : 0;

  function addRow() {
    setRows(r => [...r, { id: nextId, label: `Scénario ${nextId}`, revenue: '' }]);
    setNextId(n => n + 1);
  }
  function removeRow(id) { setRows(r => r.filter(x => x.id !== id)); }
  function updateRow(id, field, val) { setRows(r => r.map(x => x.id === id ? { ...x, [field]: val } : x)); }

  const inp = { padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, background: 'var(--white)', color: 'var(--ink-900)', fontVariantNumeric: 'tabular-nums' };
  const th  = { padding: '8px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--ink-400)', background: 'var(--bg-soft)', textAlign: 'right', borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap' };
  const thL = { ...th, textAlign: 'left' };
  const td  = { padding: '7px 10px', fontSize: 13, borderBottom: '1px solid var(--border)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' };
  const tdL = { ...td, textAlign: 'left' };

  const availableYears = [currentFY, currentFY - 1, currentFY - 2];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-900)' }}>Scénarios & Break-even</div>
          <div style={{ fontSize: 13, color: 'var(--ink-400)', marginTop: 4 }}>Simulateur interactif — ajustez les paramètres, les calculs se mettent à jour en direct</div>
        </div>
        <select value={fy} onChange={e => setFy(parseInt(e.target.value))}
          style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--white)', color: 'var(--ink-900)' }}>
          {availableYears.map(y => <option key={y} value={y}>{y}–{y + 1}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ padding: 40, color: 'var(--ink-400)' }}>Chargement…</div>
      ) : (
        <>
          {/* ── Simulator inputs ── */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 16 }}>Paramètres du simulateur</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', display: 'block', marginBottom: 4 }}>CA annuel ($ CAD)</label>
                <input type="number" min="0" step="100" value={simRev} onChange={e => setSimRev(e.target.value)} placeholder="ex. 150000" style={{ ...inp, width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', display: 'block', marginBottom: 4 }}>Coûts variables / CA (%)</label>
                <input type="number" min="0" max="100" step="0.1" value={simVarPct} onChange={e => setSimVarPct(e.target.value)} placeholder="ex. 60" style={{ ...inp, width: '100%' }} />
                <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 3 }}>Chargé depuis les réels YTD</div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', display: 'block', marginBottom: 4 }}>Charges fixes annuelles ($ CAD)</label>
                <input type="number" min="0" step="100" value={simFix} onChange={e => setSimFix(e.target.value)} placeholder="ex. 50000" style={{ ...inp, width: '100%' }} />
                <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 3 }}>Chargé depuis les charges fixes réelles</div>
              </div>
            </div>
          </div>

          {/* ── Break-even KPIs ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
            <KpiCard label="CA simulé" value={money(rev)} sub={`Taux marge var. : ${fmt2(100 - varPct)} %`} color="var(--info-500)" />
            <KpiCard label="Coûts variables" value={money(varCost)} sub={`${fmt2(varPct)} % du CA`} color="var(--bad-400)" />
            <KpiCard label="Marge brute" value={money(gross)} sub={marginPct !== null ? fmt2(marginPct) + ' %' : '—'}
              color={gross >= 0 ? 'var(--ok-500)' : 'var(--bad-500)'} />
            <KpiCard label="Charges fixes" value={money(fix)} sub="Annualisées" color="var(--bad-300)" />
            <KpiCard label="Résultat net" value={money(net)} sub={net >= 0 ? 'Bénéfice' : 'Perte'}
              color={net >= 0 ? 'var(--ok-500)' : 'var(--bad-500)'} />
            <KpiCard label="Seuil de rentabilité"
              value={breakEven !== null ? money(breakEven) : '—'}
              sub={breakEven !== null && rev > 0 ? (rev >= breakEven ? '✓ Seuil atteint' : `Manque ${money(breakEven - rev)}`) : 'Données insuffisantes'}
              color={breakEven !== null && rev >= breakEven ? 'var(--ok-500)' : 'var(--bad-500)'} />
          </div>

          {/* ── Break-even progress bar ── */}
          {breakEven !== null && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 12 }}>
                Progression vers le seuil de rentabilité
              </div>
              <div style={{ height: 20, background: 'var(--bg-soft)', borderRadius: 10, overflow: 'hidden', position: 'relative', marginBottom: 8 }}>
                <div style={{
                  height: '100%', width: `${progressPct}%`,
                  background: rev >= breakEven ? 'var(--ok-500)' : 'var(--info-500)',
                  borderRadius: 10, transition: 'width .3s',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-400)' }}>
                <span>0</span>
                <span style={{ fontWeight: 700, color: 'var(--ink-700)' }}>
                  {fmt2(progressPct)} % du seuil atteint · CA actuel {money(rev)} / seuil {money(breakEven)}
                </span>
                <span>{money(breakEven)}</span>
              </div>
              <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--bg-soft)', borderRadius: 8, fontSize: 12, color: 'var(--ink-600)' }}>
                <strong>Formule :</strong> Seuil = Charges fixes ({money(fix)}) ÷ Taux de marge sur coûts var. ({fmt2(cmRatio * 100)} %) = <strong>{money(breakEven)}</strong>
              </div>
            </div>
          )}

          {/* ── Named scenarios ── */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)' }}>Scénarios nommés</div>
              <button onClick={addRow} style={{ padding: '5px 12px', border: '1px solid var(--info-300)', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'var(--info-50)', color: 'var(--info-700)' }}>
                + Ajouter
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thL}>Nom</th>
                  <th style={th}>CA projeté ($)</th>
                  <th style={th}>Coûts var.</th>
                  <th style={th}>Marge brute</th>
                  <th style={th}>Marge %</th>
                  <th style={th}>Résultat net</th>
                  <th style={{ ...th, width: 36 }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  const rRev   = parseFloat(row.revenue) || 0;
                  const rVar   = rRev * varPct / 100;
                  const rGross = rRev - rVar;
                  const rNet   = rGross - fix;
                  const rMpct  = rRev > 0 ? rGross / rRev * 100 : null;
                  const mColor = rMpct === null ? 'var(--ink-400)' : rMpct >= 20 ? 'var(--ok-600)' : rMpct >= 0 ? 'var(--info-600)' : 'var(--bad-500)';
                  return (
                    <tr key={row.id} style={{ background: 'var(--white)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-soft)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--white)'}>
                      <td style={tdL}>
                        <input value={row.label} onChange={e => updateRow(row.id, 'label', e.target.value)}
                          style={{ ...inp, width: 160 }} />
                      </td>
                      <td style={td}>
                        <input type="number" min="0" step="100" value={row.revenue} onChange={e => updateRow(row.id, 'revenue', e.target.value)}
                          placeholder="—" style={{ ...inp, width: 110 }} />
                      </td>
                      <td style={{ ...td, color: 'var(--bad-500)' }}>{rRev > 0 ? money(rVar) : '—'}</td>
                      <td style={{ ...td, color: rRev > 0 ? (rGross >= 0 ? 'var(--ok-600)' : 'var(--bad-500)') : 'var(--ink-300)', fontWeight: rRev > 0 ? 700 : 400 }}>
                        {rRev > 0 ? money(rGross) : '—'}
                      </td>
                      <td style={{ ...td, color: mColor, fontWeight: rMpct !== null ? 700 : 400 }}>
                        {rMpct !== null ? fmt2(rMpct) + ' %' : '—'}
                      </td>
                      <td style={{ ...td, color: rRev > 0 ? (rNet >= 0 ? 'var(--ok-600)' : 'var(--bad-500)') : 'var(--ink-300)', fontWeight: rRev > 0 ? 700 : 400 }}>
                        {rRev > 0 ? money(rNet) : '—'}
                      </td>
                      <td style={{ ...td, textAlign: 'center', paddingLeft: 4, paddingRight: 4 }}>
                        <button onClick={() => removeRow(row.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-300)', fontSize: 15, padding: '0 2px', lineHeight: 1 }}
                          title="Supprimer">×</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-400)', fontSize: 13 }}>
                Aucun scénario. Cliquez sur « + Ajouter » pour en créer.
              </div>
            )}
          </div>

          <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 8 }}>
            Les scénarios utilisent le même ratio coûts variables ({fmt2(varPct)} %) et les mêmes charges fixes ({money(fix)}) que le simulateur.
          </div>
        </>
      )}
    </div>
  );
}

// ─── Coming Soon Tab ─────────────────────────────────────────
function ComingSoonTab({ name }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12, color: 'var(--ink-400)', textAlign: 'center' }}>
      <div style={{ fontSize: 40 }}>🚧</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-700)' }}>{name}</div>
      <div style={{ fontSize: 14 }}>Cette section sera disponible prochainement.</div>
    </div>
  );
}

// ─── Main Finance Screen ──────────────────────────────────────
export default function FinanceScreen() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab />;
      case 'posts':     return <PostsTab />;
      case 'cargo':     return <CargoTab />;
      case 'margin':    return <MarginAnalysisTab />;
      case 'finance':   return <SnapshotsTab />;
      case 'budget':    return <BudgetTab />;
      case 'payroll':    return <PayrollTab />;
      case 'routes':     return <RoutesTab />;
      case 'transport':  return <TransportTab />;
      case 'hyp':        return <HypTab />;
      case 'scenarios':  return <ScenariosTab />;
      default:           return <ComingSoonTab name={NAV_ITEMS.find(n => n.id === activeTab)?.label ?? activeTab} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)', gap: 0, background: 'var(--bg)' }}>
      {/* Left nav */}
      <aside style={{ width: 220, flexShrink: 0, background: 'var(--white)', borderRight: '1px solid var(--border)', padding: '20px 12px', position: 'sticky', top: 56, height: 'calc(100vh - 56px)', overflowY: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-300)', marginBottom: 12, paddingLeft: 8 }}>
          Finance
        </div>
        {NAV_ITEMS.map(item => {
          const isActive = activeTab === item.id;
          const isReady  = ['dashboard', 'posts', 'cargo', 'margin', 'finance', 'budget', 'payroll', 'routes', 'transport', 'hyp', 'scenarios'].includes(item.id);
          return (
            <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
              width: '100%', textAlign: 'left', border: 'none', borderRadius: 8, padding: '9px 10px',
              marginBottom: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              background: isActive ? 'var(--info-50)' : 'transparent',
              color: isActive ? 'var(--info-700)' : isReady ? 'var(--ink-700)' : 'var(--ink-400)',
            }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {!isReady && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--ink-300)' }}>bientôt</span>}
            </button>
          );
        })}
      </aside>

      {/* Content */}
      <main style={{ flex: 1, minWidth: 0, padding: '28px 30px', overflowY: 'auto' }}>
        {renderTab()}
      </main>
    </div>
  );
}
