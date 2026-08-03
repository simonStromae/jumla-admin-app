'use client';
import { useState, useEffect } from 'react';
import I from '../components/Icons.jsx';

const STATUS_LABEL = {
  ard: 'Arrivé entrepôt', lib: 'Libéré douanes', ver: 'Vérification',
  pdl: 'Prêt', liv: 'En livraison', ok: 'Livré', tdl: 'Échec',
};
const STATUS_CLS = {
  ard: 'neutral', lib: 'ok', ver: 'info',
  pdl: 'info', liv: 'info', ok: 'ok', tdl: 'bad',
};

function Badge({ status }) {
  const cls = STATUS_CLS[status] ?? 'neutral';
  return <span className={`badge badge--dot badge--${cls}`} style={{ fontSize: 11 }}>{STATUS_LABEL[status] ?? status}</span>;
}

// Compact parcel row used in the split overview cards
function OverviewRow({ p, onNav, drivers, onAssign, assigning }) {
  return (
    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <a className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-700)', cursor: 'pointer' }}
            onClick={() => onNav('/parcels/' + p.id.split('-').pop())}>{p.trackingCode}</a>
          <Badge status={p.status} />
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {p.recipName ?? p.client.name}
          {p.recipCity ? ` · ${p.recipCity}` : ''}
        </div>
      </div>
      {drivers && (
        <select
          className="select"
          style={{ fontSize: 11.5, padding: '4px 6px', minWidth: 130, maxWidth: 160 }}
          value={p.driver?.id ?? ''}
          disabled={assigning[p.id]}
          onChange={e => onAssign(p.id, e.target.value)}
        >
          <option value="">— Livreur —</option>
          {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      )}
    </div>
  );
}

export default function LivraisonScreen({ onNav }) {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('home');
  const [assigning, setAssigning] = useState({});
  const [search,    setSearch]    = useState('');

  const load = () => {
    setLoading(true);
    fetch('/api/admin/deliveries')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAssign = async (parcelId, driverId) => {
    setAssigning(a => ({ ...a, [parcelId]: true }));
    await fetch(`/api/parcels/${parcelId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId: driverId || null }),
    });
    setAssigning(a => ({ ...a, [parcelId]: false }));
    load();
  };

  if (loading) return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'var(--ink-400)', fontSize: 14 }}>Chargement…</div>
    </div>
  );

  const home    = data?.home    ?? [];
  const pickup  = data?.pickup  ?? [];
  const drivers = data?.drivers ?? [];

  // Home delivery sub-lists
  const homeUnassigned = home.filter(p => ['ard','lib','ver','pdl'].includes(p.status) && !p.driver);
  const homeAssigned   = home.filter(p => ['ard','lib','ver','pdl'].includes(p.status) && p.driver);
  const homeInProgress = home.filter(p => p.status === 'liv');
  const homeDone       = home.filter(p => p.status === 'ok');
  const homeFailed     = home.filter(p => p.status === 'tdl');

  const today = new Date().toDateString();
  const deliveredToday = homeDone.filter(p => p.deliveredAt && new Date(p.deliveredAt).toDateString() === today).length;

  const q = search.toLowerCase();
  const filter = p => !q
    || p.trackingCode.toLowerCase().includes(q)
    || (p.recipName  ?? '').toLowerCase().includes(q)
    || (p.client.name ?? '').toLowerCase().includes(q)
    || (p.recipCity  ?? '').toLowerCase().includes(q);

  const tabs = [
    { key: 'home',       label: 'Livraison domicile', count: home.filter(p => !['ok','tdl'].includes(p.status)).length },
    { key: 'pickup',     label: 'Retrait entrepôt',   count: pickup.length },
    { key: 'results',    label: 'Résultats',           count: homeDone.length + homeFailed.length },
  ];

  // Group assigned+in-progress by driver for the home tab
  const byDriver = {};
  [...homeAssigned, ...homeInProgress].forEach(p => {
    const d = p.driver;
    if (!d) return;
    if (!byDriver[d.id]) byDriver[d.id] = { driver: d, parcels: [] };
    byDriver[d.id].parcels.push(p);
  });

  return (
    <div className="page">
      {/* Header */}
      <div className="page__head" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page__title">Livraison / Expédition</h1>
          <div className="page__sub">Dispatch & suivi des remises — {home.length + pickup.length} colis actifs</div>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost" onClick={load}><I.Activity />Actualiser</button>
        </div>
      </div>

      {/* ── Split overview ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>

        {/* Livraison domicile */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--brand-50)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <I.Truck style={{ width: 15, height: 15, color: 'var(--brand-600)' }} />
            <span style={{ fontWeight: 700, fontSize: 13 }}>À livrer — domicile</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: homeUnassigned.length > 0 ? 'var(--bad-600)' : 'var(--ok-600)' }}>
              {homeUnassigned.length > 0 ? `${homeUnassigned.length} sans livreur` : `${homeAssigned.length + homeInProgress.length} assignés`}
            </span>
          </div>

          {/* KPI mini */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: '1px solid var(--border-soft)' }}>
            {[
              { v: homeUnassigned.length,              l: 'À assigner', c: homeUnassigned.length > 0 ? 'var(--bad-600)' : 'var(--ink-400)' },
              { v: homeAssigned.length,                l: 'Assignés',   c: 'var(--ink-700)' },
              { v: homeInProgress.length,              l: 'En cours',   c: homeInProgress.length > 0 ? 'var(--info-600)' : 'var(--ink-400)' },
              { v: deliveredToday,                     l: 'Livrés auj.',c: 'var(--ok-600)' },
            ].map((k, i) => (
              <div key={i} style={{ padding: '8px 12px', textAlign: 'center', borderRight: i < 3 ? '1px solid var(--border-soft)' : 'none' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: k.c, fontFamily: 'var(--ff-mono)' }}>{k.v}</div>
                <div style={{ fontSize: 10, color: 'var(--ink-400)', marginTop: 1 }}>{k.l}</div>
              </div>
            ))}
          </div>

          {/* List (top 6 priority = unassigned first) */}
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {[...homeUnassigned, ...homeAssigned, ...homeInProgress].slice(0, 8).map(p => (
              <OverviewRow key={p.id} p={p} onNav={onNav} drivers={drivers} onAssign={handleAssign} assigning={assigning} />
            ))}
            {home.filter(p => !['ok','tdl'].includes(p.status)).length === 0 && (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ink-400)', fontSize: 13 }}>Aucun colis en attente</div>
            )}
          </div>
          {home.filter(p => !['ok','tdl'].includes(p.status)).length > 8 && (
            <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border-soft)', fontSize: 12, color: 'var(--ink-400)', textAlign: 'center' }}>
              +{home.filter(p => !['ok','tdl'].includes(p.status)).length - 8} autres —{' '}
              <a style={{ color: 'var(--brand-600)', cursor: 'pointer' }} onClick={() => setTab('home')}>voir tous</a>
            </div>
          )}
        </div>

        {/* Retrait entrepôt */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--ok-50)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15, color: 'var(--ok-600)' }}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span style={{ fontWeight: 700, fontSize: 13 }}>À retirer — entrepôt</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: pickup.length > 0 ? 'var(--info-600)' : 'var(--ink-400)' }}>
              {pickup.length} colis prêts
            </span>
          </div>

          {/* KPI mini */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', borderBottom: '1px solid var(--border-soft)' }}>
            {[
              { v: pickup.length,                    l: 'Prêts pour retrait', c: pickup.length > 0 ? 'var(--info-600)' : 'var(--ink-400)' },
              { v: new Set(pickup.map(p => p.client.id)).size, l: 'Clients distincts',    c: 'var(--ink-700)' },
            ].map((k, i) => (
              <div key={i} style={{ padding: '8px 12px', textAlign: 'center', borderRight: i < 1 ? '1px solid var(--border-soft)' : 'none' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: k.c, fontFamily: 'var(--ff-mono)' }}>{k.v}</div>
                <div style={{ fontSize: 10, color: 'var(--ink-400)', marginTop: 1 }}>{k.l}</div>
              </div>
            ))}
          </div>

          {/* List */}
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {pickup.slice(0, 8).map(p => (
              <div key={p.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <a className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-700)', cursor: 'pointer' }}
                      onClick={() => onNav('/parcels/' + p.id.split('-').pop())}>{p.trackingCode}</a>
                    <Badge status={p.status} />
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>
                    {p.client.name}{p.recipCity ? ` · ${p.recipCity}` : ''}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-400)', textAlign: 'right' }}>
                  <div>{p.campaign.code}</div>
                  {p.weightKg && <div className="mono">{p.weightKg} kg</div>}
                </div>
              </div>
            ))}
            {pickup.length === 0 && (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ink-400)', fontSize: 13 }}>Aucun colis en attente de retrait</div>
            )}
          </div>
          {pickup.length > 8 && (
            <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border-soft)', fontSize: 12, color: 'var(--ink-400)', textAlign: 'center' }}>
              +{pickup.length - 8} autres —{' '}
              <a style={{ color: 'var(--brand-600)', cursor: 'pointer' }} onClick={() => setTab('pickup')}>voir tous</a>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail tabs ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <I.Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--ink-400)' }} />
          <input className="input" style={{ paddingLeft: 32, fontSize: 13 }} placeholder="Colis, destinataire, client…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-soft)', borderRadius: 9, padding: 4 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12.5,
              fontWeight: tab === t.key ? 700 : 500,
              background: tab === t.key ? 'white' : 'transparent',
              color: tab === t.key ? '#111827' : 'var(--ink-500)',
              boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
            }}>
              {t.label} <span style={{ fontSize: 11, opacity: .7 }}>({t.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab: Livraison domicile ── */}
      {tab === 'home' && (() => {
        const active = home.filter(p => !['ok','tdl'].includes(p.status));
        const byDrv = {};
        active.filter(p => p.driver).forEach(p => {
          const d = p.driver;
          if (!byDrv[d.id]) byDrv[d.id] = { driver: d, parcels: [] };
          byDrv[d.id].parcels.push(p);
        });
        const unassigned = active.filter(p => !p.driver).filter(filter);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Unassigned */}
            {unassigned.length > 0 && (
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bad-50)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--bad-700)' }}>⚠ Sans livreur ({unassigned.length})</span>
                </div>
                <table className="table" style={{ width: '100%' }}>
                  <thead><tr><th>Colis</th><th>Client</th><th>Destinataire</th><th>Statut</th><th>Assigner</th></tr></thead>
                  <tbody>
                    {unassigned.map(p => (
                      <tr key={p.id}>
                        <td>
                          <a className="mono" style={{ fontWeight: 700, color: 'var(--brand-700)', cursor: 'pointer', fontSize: 12 }} onClick={() => onNav('/parcels/' + p.id.split('-').pop())}>{p.trackingCode}</a>
                          <div style={{ fontSize: 10.5, color: 'var(--ink-400)', marginTop: 1 }}>{p.campaign.from} → {p.campaign.to}</div>
                        </td>
                        <td><div style={{ fontSize: 12.5, fontWeight: 600 }}>{p.client.name}</div><div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>{p.client.phone ?? '—'}</div></td>
                        <td><div style={{ fontSize: 12.5, fontWeight: 600 }}>{p.recipName ?? '—'}</div><div style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>{p.recipCity ?? ''}{p.recipPhone ? ` · ${p.recipPhone}` : ''}</div></td>
                        <td><Badge status={p.status} /></td>
                        <td>
                          <select className="select" style={{ fontSize: 12, padding: '5px 8px' }} value="" disabled={assigning[p.id]} onChange={e => e.target.value && handleAssign(p.id, e.target.value)}>
                            <option value="">— Livreur —</option>
                            {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Per driver */}
            {Object.values(byDrv).map(({ driver, parcels: dp }) => {
              const rows = dp.filter(filter);
              if (!rows.length) return null;
              return (
                <div key={driver.id} className="card" style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-soft)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <I.Truck style={{ width: 13, height: 13, color: 'var(--brand-500)' }} />
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{driver.name}</span>
                    {driver.phone && <span className="mono" style={{ fontSize: 11, color: 'var(--ink-400)' }}>{driver.phone}</span>}
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink-500)' }}>{rows.length} colis</span>
                  </div>
                  <table className="table" style={{ width: '100%' }}>
                    <thead><tr><th>Colis</th><th>Destinataire</th><th>Statut</th><th>Réassigner</th></tr></thead>
                    <tbody>
                      {rows.map(p => (
                        <tr key={p.id}>
                          <td><a className="mono" style={{ fontWeight: 700, color: 'var(--brand-700)', cursor: 'pointer', fontSize: 12 }} onClick={() => onNav('/parcels/' + p.id.split('-').pop())}>{p.trackingCode}</a></td>
                          <td><div style={{ fontSize: 12.5, fontWeight: 600 }}>{p.recipName ?? '—'}</div><div style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>{p.recipCity ?? ''}</div></td>
                          <td><Badge status={p.status} /></td>
                          <td>
                            <select className="select" style={{ fontSize: 12, padding: '5px 8px' }} value={driver.id} disabled={assigning[p.id]} onChange={e => handleAssign(p.id, e.target.value)}>
                              <option value="">— Retirer —</option>
                              {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}

            {active.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink-400)' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
                <div style={{ fontWeight: 600, color: 'var(--ink-600)' }}>Toutes les livraisons domicile sont gérées</div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Tab: Retrait entrepôt ── */}
      {tab === 'pickup' && (
        pickup.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink-400)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📦</div>
            <div style={{ fontWeight: 600, color: 'var(--ink-600)' }}>Aucun colis en attente de retrait</div>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead><tr><th>Colis</th><th>Client</th><th>Cargaison</th><th>Poids</th><th>Statut</th></tr></thead>
              <tbody>
                {pickup.filter(filter).map(p => (
                  <tr key={p.id}>
                    <td><a className="mono" style={{ fontWeight: 700, color: 'var(--brand-700)', cursor: 'pointer', fontSize: 12 }} onClick={() => onNav('/parcels/' + p.id.split('-').pop())}>{p.trackingCode}</a></td>
                    <td>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{p.client.name}</div>
                      <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>{p.client.phone ?? '—'}</div>
                    </td>
                    <td style={{ fontSize: 12.5 }}>{p.campaign.code}<div style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>{p.campaign.from} → {p.campaign.to}</div></td>
                    <td className="mono" style={{ fontSize: 12.5 }}>{p.weightKg ? `${p.weightKg} kg` : '—'}</td>
                    <td><Badge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── Tab: Résultats ── */}
      {tab === 'results' && (() => {
        const results = [...homeDone, ...homeFailed].sort((a, b) => {
          const da = a.deliveredAt ? new Date(a.deliveredAt) : new Date(a.createdAt);
          const db = b.deliveredAt ? new Date(b.deliveredAt) : new Date(b.createdAt);
          return db - da;
        }).filter(filter);
        return results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink-400)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
            <div style={{ fontWeight: 600, color: 'var(--ink-600)' }}>Aucun résultat de livraison</div>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead><tr><th>Colis</th><th>Livreur</th><th>Destinataire</th><th>Résultat</th><th>Date</th></tr></thead>
              <tbody>
                {results.map(p => (
                  <tr key={p.id}>
                    <td><a className="mono" style={{ fontWeight: 700, color: 'var(--brand-700)', cursor: 'pointer', fontSize: 12 }} onClick={() => onNav('/parcels/' + p.id.split('-').pop())}>{p.trackingCode}</a></td>
                    <td style={{ fontSize: 12.5 }}>{p.driver?.name ?? '—'}</td>
                    <td><div style={{ fontSize: 12.5, fontWeight: 600 }}>{p.recipName ?? '—'}</div><div style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>{p.recipCity ?? ''}</div></td>
                    <td>
                      <Badge status={p.status} />
                      {p.deliveryProof?.note && <div style={{ fontSize: 10.5, color: 'var(--ink-500)', marginTop: 3, fontStyle: 'italic', maxWidth: 180 }}>{p.deliveryProof.note}</div>}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--ink-500)' }}>{p.deliveredAt ? new Date(p.deliveredAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })()}
    </div>
  );
}
