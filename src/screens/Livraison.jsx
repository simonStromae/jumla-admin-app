'use client';
import { useState, useEffect } from 'react';
import I from '../components/Icons.jsx';

const STATUS_LABEL = {
  ard: 'Arrivé entrepôt', lib: 'Libéré douanes', ver: 'Vérification',
  pdl: 'Prêt à livrer', liv: 'En livraison', ok: 'Livré', tdl: 'Échec livraison',
};
const STATUS_CLS = {
  ard: 'neutral', lib: 'ok', ver: 'info',
  pdl: 'info', liv: 'info', ok: 'ok', tdl: 'bad',
};

function Badge({ status }) {
  const cls = STATUS_CLS[status] ?? 'neutral';
  const label = STATUS_LABEL[status] ?? status;
  return <span className={`badge badge--dot badge--${cls}`} style={{ fontSize: 11 }}>{label}</span>;
}

export default function LivraisonScreen({ onNav }) {
  const [data,         setData]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState('pending');
  const [assigning,    setAssigning]    = useState({});
  const [search,       setSearch]       = useState('');

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

  const parcels = data?.parcels ?? [];
  const drivers = data?.drivers ?? [];

  const pending  = parcels.filter(p => ['ard','lib','ver','pdl'].includes(p.status) && !p.driver);
  const assigned = parcels.filter(p => ['ard','lib','ver','pdl'].includes(p.status) && p.driver);
  const inProgress = parcels.filter(p => p.status === 'liv');
  const done     = parcels.filter(p => p.status === 'ok');
  const failed   = parcels.filter(p => p.status === 'tdl');

  const today = new Date().toDateString();
  const deliveredToday = done.filter(p => p.deliveredAt && new Date(p.deliveredAt).toDateString() === today).length;

  const tabList = [
    { key: 'pending',    label: 'À assigner',   count: pending.length,    color: pending.length > 0 ? 'var(--bad-600)' : undefined },
    { key: 'assigned',   label: 'Assignés',      count: assigned.length },
    { key: 'inprogress', label: 'En livraison',  count: inProgress.length, color: inProgress.length > 0 ? 'var(--info-600)' : undefined },
    { key: 'results',    label: 'Résultats',     count: done.length + failed.length },
  ];

  const byDriver = {};
  [...assigned, ...inProgress].forEach(p => {
    const d = p.driver;
    if (!d) return;
    if (!byDriver[d.id]) byDriver[d.id] = { driver: d, parcels: [] };
    byDriver[d.id].parcels.push(p);
  });

  const q = search.toLowerCase();
  const filterParcel = p =>
    !q ||
    p.trackingCode.toLowerCase().includes(q) ||
    (p.recipName  ?? '').toLowerCase().includes(q) ||
    (p.client.name ?? '').toLowerCase().includes(q);

  const listFor = (list) => list.filter(filterParcel);

  return (
    <div className="page">
      {/* Header */}
      <div className="page__head" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page__title">Livraison à domicile</h1>
          <div className="page__sub">Gestion des livraisons · {parcels.length} colis concernés</div>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost" onClick={load}><I.Activity />Actualiser</button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
        {[
          { label: 'À assigner',     value: pending.length,     color: pending.length > 0 ? 'var(--bad-600)' : 'var(--ink-700)' },
          { label: 'Assignés',       value: assigned.length,    color: 'var(--ink-700)' },
          { label: 'En livraison',   value: inProgress.length,  color: inProgress.length > 0 ? 'var(--info-600)' : 'var(--ink-700)' },
          { label: 'Livrés auj.',    value: deliveredToday,     color: 'var(--ok-600)' },
          { label: 'Échecs',         value: failed.length,      color: failed.length > 0 ? 'var(--bad-600)' : 'var(--ink-700)' },
        ].map((k, i) => (
          <div key={i} style={{ padding: '14px 18px', borderRight: i < 4 ? '1px solid var(--border-soft)' : 'none', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.color, fontFamily: 'var(--ff-mono)' }}>{k.value}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-400)', marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Search + Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <I.Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--ink-400)' }} />
          <input
            className="input"
            style={{ paddingLeft: 32, fontSize: 13 }}
            placeholder="Colis, destinataire, client…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-soft)', borderRadius: 9, padding: 4 }}>
          {tabList.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: tab === t.key ? 700 : 500,
              background: tab === t.key ? 'white' : 'transparent',
              color: tab === t.key ? (t.color ?? '#111827') : 'var(--ink-500)',
              boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
            }}>
              {t.label} <span style={{ fontSize: 11, opacity: .75 }}>({t.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── À assigner ── */}
      {tab === 'pending' && (
        pending.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink-400)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
            <div style={{ fontWeight: 600, color: 'var(--ink-600)' }}>Tous les colis ont un livreur assigné</div>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Colis</th><th>Client</th><th>Destinataire</th><th>Statut</th><th>Livreur</th>
                </tr>
              </thead>
              <tbody>
                {listFor(pending).map(p => (
                  <tr key={p.id}>
                    <td>
                      <a className="mono" style={{ fontWeight: 700, color: 'var(--brand-700)', cursor: 'pointer', fontSize: 12 }} onClick={() => onNav('/parcels/' + p.id.split('-').pop())}>{p.trackingCode}</a>
                      <div style={{ fontSize: 10.5, color: 'var(--ink-400)', marginTop: 1 }}>{p.campaign.from} → {p.campaign.to}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{p.client.name}</div>
                      <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>{p.client.phone ?? '—'}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{p.recipName ?? '—'}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>{p.recipCity ?? ''}{p.recipPhone ? ` · ${p.recipPhone}` : ''}</div>
                    </td>
                    <td><Badge status={p.status} /></td>
                    <td>
                      <select
                        className="select"
                        style={{ fontSize: 12, padding: '5px 8px' }}
                        value=""
                        disabled={assigning[p.id]}
                        onChange={e => e.target.value && handleAssign(p.id, e.target.value)}
                      >
                        <option value="">— Assigner un livreur —</option>
                        {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── Assignés (par livreur) ── */}
      {tab === 'assigned' && (
        Object.keys(byDriver).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink-400)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🚚</div>
            <div style={{ fontWeight: 600, color: 'var(--ink-600)' }}>Aucun colis assigné pour le moment</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.values(byDriver).map(({ driver, parcels: dp }) => {
              const filtered = dp.filter(p => p.status !== 'liv').filter(filterParcel);
              if (filtered.length === 0) return null;
              return (
                <div key={driver.id} className="card" style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-soft)' }}>
                    <I.Truck style={{ width: 14, height: 14, color: 'var(--brand-500)' }} />
                    <span style={{ fontWeight: 700, fontSize: 13.5 }}>{driver.name}</span>
                    {driver.phone && <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-400)' }}>{driver.phone}</span>}
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink-500)' }}>{filtered.length} colis</span>
                  </div>
                  <table className="table" style={{ width: '100%' }}>
                    <thead><tr><th>Colis</th><th>Destinataire</th><th>Statut</th><th>Modifier livreur</th></tr></thead>
                    <tbody>
                      {filtered.map(p => (
                        <tr key={p.id}>
                          <td>
                            <a className="mono" style={{ fontWeight: 700, color: 'var(--brand-700)', cursor: 'pointer', fontSize: 12 }} onClick={() => onNav('/parcels/' + p.id.split('-').pop())}>{p.trackingCode}</a>
                          </td>
                          <td>
                            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{p.recipName ?? '—'}</div>
                            <div style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>{p.recipCity ?? ''}</div>
                          </td>
                          <td><Badge status={p.status} /></td>
                          <td>
                            <select
                              className="select"
                              style={{ fontSize: 12, padding: '5px 8px' }}
                              value={driver.id}
                              disabled={assigning[p.id]}
                              onChange={e => handleAssign(p.id, e.target.value)}
                            >
                              <option value="">— Retirer livreur —</option>
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
          </div>
        )
      )}

      {/* ── En livraison ── */}
      {tab === 'inprogress' && (
        inProgress.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink-400)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🚚</div>
            <div style={{ fontWeight: 600, color: 'var(--ink-600)' }}>Aucune livraison en cours</div>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead><tr><th>Colis</th><th>Livreur</th><th>Destinataire</th><th>Statut</th></tr></thead>
              <tbody>
                {listFor(inProgress).map(p => (
                  <tr key={p.id}>
                    <td>
                      <a className="mono" style={{ fontWeight: 700, color: 'var(--brand-700)', cursor: 'pointer', fontSize: 12 }} onClick={() => onNav('/parcels/' + p.id.split('-').pop())}>{p.trackingCode}</a>
                      <div style={{ fontSize: 10.5, color: 'var(--ink-400)', marginTop: 1 }}>{p.campaign.code}</div>
                    </td>
                    <td>
                      {p.driver ? (
                        <>
                          <div style={{ fontSize: 12.5, fontWeight: 600 }}>{p.driver.name}</div>
                          {p.driver.phone && <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>{p.driver.phone}</div>}
                        </>
                      ) : <span style={{ color: 'var(--ink-300)', fontSize: 12 }}>—</span>}
                    </td>
                    <td>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{p.recipName ?? '—'}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>{p.recipCity ?? ''}{p.recipPhone ? ` · ${p.recipPhone}` : ''}</div>
                    </td>
                    <td><Badge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── Résultats ── */}
      {tab === 'results' && (
        done.length + failed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink-400)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
            <div style={{ fontWeight: 600, color: 'var(--ink-600)' }}>Aucun résultat de livraison</div>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead><tr><th>Colis</th><th>Livreur</th><th>Destinataire</th><th>Résultat</th><th>Date</th></tr></thead>
              <tbody>
                {listFor([...done, ...failed].sort((a, b) => {
                  const da = a.deliveredAt ? new Date(a.deliveredAt) : new Date(a.createdAt);
                  const db = b.deliveredAt ? new Date(b.deliveredAt) : new Date(b.createdAt);
                  return db - da;
                })).map(p => (
                  <tr key={p.id}>
                    <td>
                      <a className="mono" style={{ fontWeight: 700, color: 'var(--brand-700)', cursor: 'pointer', fontSize: 12 }} onClick={() => onNav('/parcels/' + p.id.split('-').pop())}>{p.trackingCode}</a>
                    </td>
                    <td style={{ fontSize: 12.5 }}>{p.driver?.name ?? '—'}</td>
                    <td>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{p.recipName ?? '—'}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>{p.recipCity ?? ''}</div>
                    </td>
                    <td>
                      <Badge status={p.status} />
                      {p.deliveryProof?.note && (
                        <div style={{ fontSize: 10.5, color: 'var(--ink-500)', marginTop: 3, fontStyle: 'italic', maxWidth: 180 }}>{p.deliveryProof.note}</div>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--ink-500)' }}>
                      {p.deliveredAt ? new Date(p.deliveredAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
