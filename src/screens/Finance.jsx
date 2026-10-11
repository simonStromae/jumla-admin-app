'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

const money = (v) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(v || 0);
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
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink-900)' }}>{fmt2(totalVariable / wKg)} $</div>
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
            {wKg && <KpiCard label="Coût / kg" value={fmt2(totalVarCosts / wKg) + ' $'} sub={`Poids AWB : ${wKg} kg`} />}
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
      default:          return <ComingSoonTab name={NAV_ITEMS.find(n => n.id === activeTab)?.label ?? activeTab} />;
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
          const isReady  = ['dashboard', 'posts', 'cargo'].includes(item.id);
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
