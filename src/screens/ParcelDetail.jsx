'use client';
import { useState, useEffect } from 'react';
import I from '../components/Icons.jsx';
import { Avatar, Modal } from '../components/Shell.jsx';

const PARCEL_STATUS = {
  enr: { label: 'Enregistré',                    cls: 'neutral', icon: '📝' },
  rec: { label: 'Reçu à l\'entrepôt',            cls: 'info',    icon: '📥' },
  pre: { label: 'Vérifié et préparé',             cls: 'info',    icon: '🔍' },
  exp: { label: 'Expédié',                        cls: 'info',    icon: '🚀' },
  tra: { label: 'En transit',                     cls: 'info',    icon: '✈️' },
  apd: { label: 'Arrivé au pays de destination',  cls: 'ok',      icon: '🛬' },
  dou: { label: 'Présenté aux douanes',           cls: 'warn',    icon: '🛃' },
  ins: { label: 'En inspection douanière',        cls: 'warn',    icon: '🔎' },
  ret: { label: 'Retenu par les douanes',         cls: 'bad',     icon: '⚠️' },
  lib: { label: 'Libéré par les douanes',         cls: 'ok',      icon: '✅' },
  ard: { label: 'Arrivé entrepôt de destination', cls: 'ok',      icon: '🏭' },
  ver: { label: 'Vérification finale',            cls: 'info',    icon: '🔬' },
  pdl: { label: 'Prêt pour livraison/retrait',   cls: 'info',    icon: '📦' },
  liv: { label: 'En cours de livraison',          cls: 'info',    icon: '🚚' },
  ok:  { label: 'Livré',                          cls: 'ok',      icon: '🎉' },
  adr: { label: 'Adresse incomplète',             cls: 'bad',     icon: '📍' },
  tdl: { label: 'Tentative de livraison',         cls: 'warn',    icon: '🔔' },
  rte: { label: 'Retour à l\'entrepôt',           cls: 'bad',     icon: '↩️' },
  dom: { label: 'Colis endommagé',                cls: 'bad',     icon: '💥' },
  cla: { label: 'Réclamation ouverte',            cls: 'bad',     icon: '📋' },
};
const PAYMENT_STATUS = {
  pending:   { label: 'En attente', cls: 'warn' },
  completed: { label: 'Payé',       cls: 'ok' },
  failed:    { label: 'Échoué',     cls: 'bad' },
  refunded:  { label: 'Remboursé',  cls: 'neutral' },
};
const BORDEREAU_STATUS = {
  en_attente: { label: 'À vérifier', cls: 'neutral' },
  en_cours:   { label: 'En cours',   cls: 'warn' },
  valide:     { label: 'Validé',     cls: 'ok' },
  libere:     { label: 'Libéré',     cls: 'ok' },
};

export default function ParcelDetailScreen({ id, onNav }) {
  const [parcel,        setParcel]        = useState(null);
  const [bordereaux,    setBordereaux]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showPayModal,    setShowPayModal]    = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: '', note: '', location: '', saving: false });
  const [showAddBl,       setShowAddBl]       = useState(false);
  const [newBl,    setNewBl]    = useState({ description: '', weightKg: '', items: [] });
  const [addingBl, setAddingBl] = useState(false);
  const [editingBlId,    setEditingBlId]    = useState(null);
  const [editingBlItems, setEditingBlItems] = useState([]);

  useEffect(() => {
    fetch('/api/parcels/' + id)
      .then(r => r.json())
      .then(data => { setParcel(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetch('/api/bordereaux?parcelId=' + id)
      .then(r => r.json())
      .then(data => setBordereaux(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [id]);

  const updateBlStatus = async (blId, status) => {
    await fetch('/api/bordereaux/' + blId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setBordereaux(bs => bs.map(b => b.id === blId ? { ...b, status } : b));
  };

  const deleteBl = async (blId) => {
    if (!confirm('Supprimer ce bordereau ?')) return;
    await fetch('/api/bordereaux/' + blId, { method: 'DELETE' });
    setBordereaux(bs => bs.filter(b => b.id !== blId));
  };

  const createBl = async () => {
    setAddingBl(true);
    const totalPieces = newBl.items.reduce((s, it) => s + (Number(it.count) || 0), 0);
    const res = await fetch('/api/bordereaux', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parcelId: id,
        description: newBl.description,
        weightKg: newBl.weightKg,
        nbPieces: totalPieces || 1,
        items: newBl.items,
      }),
    });
    const json = await res.json();
    if (json.ok) {
      setBordereaux(bs => [...bs, json.bordereau]);
      setNewBl({ description: '', weightKg: '', items: [] });
      setShowAddBl(false);
    }
    setAddingBl(false);
  };

  const addBlItem = () => {
    setNewBl(b => ({ ...b, items: [...b.items, { designation: '', description: '', type: 'carton', count: 1, nbPieces: '' }] }));
  };

  const updBlItem = (idx, k, v) => {
    setNewBl(b => ({ ...b, items: b.items.map((it, i) => i === idx ? { ...it, [k]: v } : it) }));
  };

  const removeBlItem = (idx) => {
    setNewBl(b => ({ ...b, items: b.items.filter((_, i) => i !== idx) }));
  };

  if (loading) return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'var(--ink-400)', fontSize: 14 }}>Chargement…</div>
    </div>
  );

  if (!parcel || parcel.error) return (
    <div className="page">
      <div style={{ padding: 32, color: 'var(--bad-700)' }}>Colis introuvable.</div>
    </div>
  );

  const client     = parcel.client     || {};
  const campaign   = parcel.campaign   || {};
  const payment    = parcel.payment;
  const PARCEL_FLOW = ['enr','rec','pre','exp','tra','apd','dou','ins','ret','lib','ard','ver','pdl','liv','ok'];
  const allEvents  = parcel.trackingEvents || [];
  const curFlowPos = PARCEL_FLOW.indexOf(parcel.status);
  const events     = allEvents.filter(ev => {
    const pos = PARCEL_FLOW.indexOf(ev.status);
    return pos === -1 || pos <= curFlowPos;
  });
  const items      = Array.isArray(parcel.items) ? parcel.items : [];
  const pStatus    = PARCEL_STATUS[parcel.status]  || { label: parcel.status,  cls: 'neutral' };
  const payStatus  = payment ? (PAYMENT_STATUS[payment.status] || { label: payment.status, cls: 'neutral' }) : { label: 'Non créé', cls: 'neutral' };
  const totalVerif = bordereaux.filter(b => b.status === 'verifie').length;

  const campaignLocked = ['exp', 'tra', 'apd', 'dou', 'lib', 'ard', 'pdl', 'ok'].includes(parcel?.campaign?.status);

  return (
    <div className="page">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ink-400)', marginBottom: 8 }}>
        <a style={{ cursor: 'pointer' }} onClick={() => onNav('/')}>Cargaisons</a>
        <I.ChevronRight style={{ width: 12, height: 12 }} />
        {campaign.id && <a style={{ cursor: 'pointer' }} onClick={() => onNav('/campaign/' + campaign.id)}>{campaign.code}</a>}
        {campaign.id && <I.ChevronRight style={{ width: 12, height: 12 }} />}
        <span style={{ color: 'var(--ink-600)', fontWeight: 600 }}>Colis {parcel.trackingCode}</span>
      </div>

      {/* Header */}
      <div className="page__head" style={{ marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h1 className="page__title" style={{ margin: 0 }}>{parcel.trackingCode}</h1>
            <span className={'badge badge--dot badge--' + pStatus.cls}>{pStatus.label}</span>
            <span className={'badge badge--dot badge--' + payStatus.cls}>{payStatus.label}</span>
          </div>
          <div className="page__sub">
            {campaign.code && <>Cargaison <a style={{ color: 'var(--brand-700)', fontWeight: 600, cursor: 'pointer' }} onClick={() => onNav('/campaign/' + campaign.id)}>{campaign.code}</a> · </>}
            Client <strong style={{ color: 'var(--ink-700)' }}>{client.name}</strong>
          </div>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost" onClick={() => setShowWeightModal(true)}><I.Edit />Poids / Prix</button>
          <button className="btn btn--ghost" onClick={() => setShowPayModal(true)}><I.Send />Lien Interac</button>
        </div>
      </div>

      <div className="layout-2col">
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Sender */}
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <I.Pin style={{ color: 'var(--brand-500)', width: 16, height: 16 }} />
              <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700, color: 'var(--ink-400)' }}>Expéditeur / Client</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar initials={(client.name || '?').split(' ').map(x => x[0]).slice(0,2).join('')} color={1} size="lg" />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{client.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>{client.city || '—'}</div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>{client.phone || '—'}</div>
              </div>
            </div>
          </div>

          {/* Recipient */}
          {(parcel.recipName || parcel.recipPhone || parcel.recipCity) && (
            <div className="card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <I.Truck style={{ color: 'var(--brand-500)', width: 16, height: 16 }} />
                <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700, color: 'var(--ink-400)' }}>Destinataire</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar initials={(parcel.recipName || '?').split(' ').map(x => x[0]).slice(0,2).join('')} color={3} size="lg" />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{parcel.recipName || '—'}</div>
                  {parcel.recipCity && <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>{parcel.recipCity}</div>}
                  {parcel.recipPhone && <div className="mono" style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>{parcel.recipPhone}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Items declared */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <I.Box style={{ width: 14, height: 14, color: 'var(--brand-600)' }} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>Contenu déclaré</span>
              {parcel.weightKg && <span className="mono" style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: 'var(--ink-600)' }}>{parcel.weightKg} kg total</span>}
            </div>

            {items.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-soft)' }}>
                    {['Description', 'Type', 'Poids', 'Pièces'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', border: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                      <td style={{ padding: '7px 10px', border: '1px solid var(--border)' }}>{item.description || '—'}</td>
                      <td style={{ padding: '7px 10px', border: '1px solid var(--border)', color: 'var(--ink-600)' }}>{item.productType || 'standard'}</td>
                      <td style={{ padding: '7px 10px', border: '1px solid var(--border)', fontFamily: 'monospace', fontWeight: 600 }}>{item.weightKg ? item.weightKg + ' kg' : '—'}</td>
                      <td style={{ padding: '7px 10px', border: '1px solid var(--border)', fontFamily: 'monospace' }}>{item.nbPieces || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--ink-600)', padding: '8px 12px', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 6 }}>
                {parcel.description || 'Aucun détail de contenu'}
              </div>
            )}
            {parcel.notes && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-500)', fontStyle: 'italic' }}>Note : {parcel.notes}</div>
            )}
          </div>

          {/* Bordereaux */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Bordereaux du colis</div>
                <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>
                  {bordereaux.length === 0 ? 'Aucun bordereau' : `${totalVerif}/${bordereaux.length} vérifiés`}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                {campaignLocked && (
                  <div style={{ padding: '8px 12px', background: 'var(--warn-50)', border: '1px solid var(--warn-200)', borderRadius: 6, fontSize: 12, color: 'var(--warn-700)' }}>
                    🔒 Cargaison en transit — modifications verrouillées
                  </div>
                )}
                {!campaignLocked && (
                  <button className="btn btn--brand btn--sm" onClick={() => setShowAddBl(v => !v)}>
                    <I.Plus />{showAddBl ? 'Annuler' : 'Ajouter'}
                  </button>
                )}
              </div>
            </div>

            {showAddBl && !campaignLocked && (
              <div style={{ padding: '14px 16px', background: 'var(--brand-50)', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 8, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', marginBottom: 4 }}>Description générale <span style={{ fontWeight: 400 }}>(optionnel)</span></div>
                    <input className="input input--sm" value={newBl.description}
                      onChange={e => setNewBl(b => ({ ...b, description: e.target.value }))} placeholder="Contenu du bordereau…" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', marginBottom: 4 }}>Poids total kg</div>
                    <input className="input input--sm mono" type="number" min="0" step="0.1"
                      value={newBl.weightKg} onChange={e => setNewBl(b => ({ ...b, weightKg: e.target.value }))} placeholder="0" />
                  </div>
                </div>

                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-600)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>
                  Contenu ({newBl.items.length} ligne{newBl.items.length !== 1 ? 's' : ''})
                </div>

                {newBl.items.length > 0 && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8, fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: 'var(--brand-100)' }}>
                        {['Désignation', 'Description', 'Type', 'Nb', 'Pièces (alt)', ''].map(h => (
                          <th key={h} style={{ padding: '5px 8px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: 'var(--brand-800)', borderBottom: '1px solid var(--brand-200)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {newBl.items.map((it, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: '4px 4px' }}>
                            <input className="input input--sm" value={it.designation}
                              onChange={e => updBlItem(idx, 'designation', e.target.value)} placeholder="Ex: Vêtements adulte" />
                          </td>
                          <td style={{ padding: '4px 4px', width: 140 }}>
                            <input className="input input--sm" value={it.description ?? ''}
                              onChange={e => updBlItem(idx, 'description', e.target.value)} placeholder="Détails…" />
                          </td>
                          <td style={{ padding: '4px 4px', width: 110 }}>
                            <select className="select input--sm" value={it.type} onChange={e => updBlItem(idx, 'type', e.target.value)}>
                              <option value="carton">Carton</option>
                              <option value="paquet">Paquet</option>
                              <option value="sachet">Sachet</option>
                              <option value="bouteille">Bouteille</option>
                            </select>
                          </td>
                          <td style={{ padding: '4px 4px', width: 60 }}>
                            <input className="input input--sm mono" type="number" min="1" value={it.count}
                              onChange={e => updBlItem(idx, 'count', e.target.value)} />
                          </td>
                          <td style={{ padding: '4px 4px', width: 90 }}>
                            <input className="input input--sm mono" type="number" min="1" value={it.nbPieces}
                              onChange={e => updBlItem(idx, 'nbPieces', e.target.value)} placeholder="—" />
                          </td>
                          <td style={{ padding: '4px 4px', width: 28 }}>
                            <button onClick={() => removeBlItem(idx)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bad-500)', fontSize: 16, padding: '0 4px' }}>×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button className="btn btn--ghost btn--sm" onClick={addBlItem} style={{ flex: 1 }}>
                    + Ajouter une ligne
                  </button>
                  <button className="btn btn--brand btn--sm" onClick={createBl} disabled={addingBl} style={{ flex: 0 }}>
                    {addingBl ? 'Création…' : 'Créer le bordereau'}
                  </button>
                </div>
              </div>
            )}

            {bordereaux.length === 0 && !showAddBl ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ink-400)', fontSize: 13 }}>
                Aucun bordereau du colis. Cliquez sur "Ajouter" pour créer le premier paquet.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-soft)' }}>
                    {['Code', 'Description', 'Poids', 'Lignes', 'Statut', ''].map(h => (
                      <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bordereaux.map(bl => {
                    const bs = BORDEREAU_STATUS[bl.status] || { label: bl.status, cls: 'neutral' };
                    const itemCount = Array.isArray(bl.items) ? bl.items.length : 0;
                    return (
                      <>
                        <tr key={bl.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                          <td style={{ padding: '8px 12px' }}>
                            <a className="mono" style={{ fontWeight: 700, fontSize: 12, color: 'var(--brand-700)', cursor: 'pointer' }}
                              onClick={() => onNav?.('/admin/slips/' + bl.code)}>
                              {bl.code}
                            </a>
                            {bl.clientConfirmed && (
                              <div style={{ marginTop: 3 }}>
                                <span style={{ fontSize: 9.5, fontWeight: 700, background: 'var(--ok-100)', color: 'var(--ok-700)', border: '1px solid var(--ok-200)', borderRadius: 4, padding: '1px 5px', whiteSpace: 'nowrap' }}>
                                  ✓ Attesté
                                </span>
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '8px 12px', color: 'var(--ink-700)', fontSize: 12 }}>
                            {bl.description || (itemCount > 0 ? `${itemCount} ligne${itemCount > 1 ? 's' : ''}` : '—')}
                          </td>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{bl.weightKg ? bl.weightKg + ' kg' : '—'}</td>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: 'var(--ink-500)' }}>{itemCount || bl.nbPieces}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <select className="select" style={{ height: 26, padding: '0 6px', fontSize: 11.5, border: '1px solid var(--border)', borderRadius: 4 }}
                              value={bl.status} onChange={e => updateBlStatus(bl.id, e.target.value)}>
                              {Object.entries(BORDEREAU_STATUS).map(([v, { label }]) => (
                                <option key={v} value={v}>{label}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '8px 12px', display: 'flex', gap: 6 }}>
                            {!campaignLocked && (
                              <button onClick={() => {
                                if (editingBlId === bl.id) { setEditingBlId(null); return; }
                                setEditingBlId(bl.id);
                                setEditingBlItems(Array.isArray(bl.items) ? bl.items.map(it => ({ ...it })) : []);
                              }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-400)', padding: '2px 4px', fontSize: 14 }}>
                                ✏️
                              </button>
                            )}
                            <button onClick={() => deleteBl(bl.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-400)', fontSize: 16, lineHeight: 1, padding: '2px 4px' }}>×</button>
                          </td>
                        </tr>
                        {editingBlId === bl.id && (
                          <tr key={bl.id + '-edit'}>
                            <td colSpan={6} style={{ padding: '0 12px 12px', background: 'var(--brand-50)' }}>
                              <BlItemsEditor
                                items={editingBlItems}
                                onChange={setEditingBlItems}
                                onSave={async () => {
                                  const res = await fetch('/api/bordereaux/' + bl.id, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ items: editingBlItems }),
                                  });
                                  if (res.ok) {
                                    setBordereaux(bs => bs.map(b => b.id === bl.id ? { ...b, items: editingBlItems } : b));
                                    setEditingBlId(null);
                                  }
                                }}
                                onCancel={() => setEditingBlId(null)}
                              />
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── Inline status update — always available, even when campaign is locked ── */}
          <div className="card" style={{ padding: 16 }}>
              <div className="section-title" style={{ marginBottom: 12 }}>
                <I.Edit style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Mettre à jour le statut
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <select
                  className="input"
                  value={statusForm.status || parcel.status}
                  onChange={e => setStatusForm(f => ({ ...f, status: e.target.value }))}
                >
                  <optgroup label="Flux principal">
                    {['enr','rec','pre','exp','tra','apd'].map(k => (
                      <option key={k} value={k}>{PARCEL_STATUS[k].icon} {PARCEL_STATUS[k].label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Douanes">
                    {['dou','ins','ret','lib'].map(k => (
                      <option key={k} value={k}>{PARCEL_STATUS[k].icon} {PARCEL_STATUS[k].label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Livraison">
                    {['ard','ver','pdl','liv','ok'].map(k => (
                      <option key={k} value={k}>{PARCEL_STATUS[k].icon} {PARCEL_STATUS[k].label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Exceptionnels">
                    {['adr','tdl','rte','dom','cla'].map(k => (
                      <option key={k} value={k}>{PARCEL_STATUS[k].icon} {PARCEL_STATUS[k].label}</option>
                    ))}
                  </optgroup>
                </select>
                <input className="input" placeholder="📍 Localisation (ex. Douala – Aéroport)"
                  value={statusForm.location}
                  onChange={e => setStatusForm(f => ({ ...f, location: e.target.value }))}
                />
                <textarea className="input" rows={2} placeholder="Note pour le client…"
                  value={statusForm.note}
                  onChange={e => setStatusForm(f => ({ ...f, note: e.target.value }))}
                  style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }}
                />
                <button
                  className="btn btn--brand"
                  style={{ justifyContent: 'center' }}
                  disabled={statusForm.saving || (statusForm.status || parcel.status) === parcel.status && !statusForm.note && !statusForm.location}
                  onClick={async () => {
                    const newStatus = statusForm.status || parcel.status;
                    setStatusForm(f => ({ ...f, saving: true }));
                    const res = await fetch('/api/parcels/' + parcel.id, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        status:        newStatus !== parcel.status ? newStatus : undefined,
                        eventNote:     statusForm.note     || undefined,
                        eventLocation: statusForm.location || undefined,
                      }),
                    });
                    if (res.ok) {
                      const fresh = await fetch('/api/parcels/' + parcel.id).then(r => r.json());
                      setParcel(fresh);
                      setStatusForm({ status: '', note: '', location: '', saving: false });
                    } else {
                      setStatusForm(f => ({ ...f, saving: false }));
                    }
                  }}
                >
                  {statusForm.saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
          </div>

          {/* Payment */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className="section-title" style={{ margin: 0 }}>
                <I.Wallet style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Paiement
              </div>
              <span className={'badge badge--dot badge--' + payStatus.cls}>{payStatus.label}</span>
            </div>

            <div style={{ padding: '12px 0', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              <span style={{ fontWeight: 700 }}>Total dû</span>
              <span className="mono" style={{ fontSize: 22, fontWeight: 700 }}>
                {(payment?.amount ?? parcel.priceXaf)?.toLocaleString('fr') ?? '—'} <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>CAD</span>
              </span>
            </div>

            {(!payment || payment.status !== 'completed') ? (
              <button className="btn btn--brand" style={{ justifyContent: 'center', width: '100%' }} onClick={() => setShowPayModal(true)}>
                <I.Send />Envoyer lien Interac
              </button>
            ) : (
              <div style={{ padding: 10, background: 'var(--ok-50)', border: '1px solid var(--ok-100)', fontSize: 11.5, color: 'var(--ok-700)', borderRadius: 6 }}>
                <strong>Réglé</strong> · {payment.interacRef ? 'Réf. ' + payment.interacRef : 'Virement Interac'}
              </div>
            )}
          </div>

          {/* Billing — read-only summary, updated via Poids/Prix modal */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className="section-title" style={{ margin: 0 }}>
                <I.Wallet style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Facturation
              </div>
              {parcel.adjustmentStatus === 'pending' && (
                <span className="badge badge--dot badge--warn">Supplément dû</span>
              )}
              {parcel.adjustmentStatus === 'paid' && (
                <span className="badge badge--dot badge--ok">Réglé</span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 8px', background: 'var(--bg-soft)', borderRadius: 5 }}>
                <span style={{ color: 'var(--ink-500)' }}>Estimation réservation</span>
                <span className="mono" style={{ color: parcel.confirmedPriceXaf != null ? 'var(--ink-400)' : 'var(--ink-700)', fontWeight: 600, textDecoration: parcel.confirmedPriceXaf != null ? 'line-through' : 'none' }}>
                  {parcel.priceXaf ? parcel.priceXaf.toLocaleString('fr') + ' CAD' : '—'}
                </span>
              </div>

              {parcel.confirmedPriceXaf != null ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 8px', background: 'var(--brand-50)', borderRadius: 5 }}>
                    <span style={{ color: 'var(--ink-700)', fontWeight: 600 }}>Prix réel (pesée)</span>
                    <span className="mono" style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink-900)' }}>
                      {parcel.confirmedPriceXaf.toLocaleString('fr')} CAD
                    </span>
                  </div>
                  {(() => {
                    const diff = parcel.confirmedPriceXaf - (parcel.priceXaf ?? 0);
                    if (diff === 0) return (
                      <div style={{ fontSize: 12, color: 'var(--ok-700)', textAlign: 'center', padding: '4px 0' }}>✓ Identique à l'estimation</div>
                    );
                    return (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 8px', background: diff > 0 ? 'var(--warn-50)' : 'var(--ok-50)', border: `1px solid ${diff > 0 ? 'var(--warn-200)' : 'var(--ok-100)'}`, borderRadius: 6 }}>
                        <span style={{ fontWeight: 700, color: diff > 0 ? 'var(--warn-700)' : 'var(--ok-700)' }}>
                          {diff > 0 ? '↑ Supplément' : '↓ Remise'}
                        </span>
                        <span className="mono" style={{ fontWeight: 700, color: diff > 0 ? 'var(--warn-700)' : 'var(--ok-700)' }}>
                          {diff > 0 ? '+' : ''}{diff.toLocaleString('fr')} CAD
                        </span>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--ink-400)', fontStyle: 'italic', padding: '6px 8px' }}>
                  Ouvrez <strong>Poids / Prix</strong> pour saisir le poids réel et confirmer le prix.
                </div>
              )}
            </div>
          </div>

          {/* Campaign info */}
          <div className="card" style={{ padding: 16 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>
              <I.Truck style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Campagne & Route
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-700)', marginBottom: 6 }}>
              <strong>{campaign.code}</strong>
            </div>
            {campaign.route && (
              <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>
                {campaign.route.origin} → {campaign.route.destination}
              </div>
            )}
            {campaign.departureDate && (
              <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 4 }}>
                Départ : {new Date(campaign.departureDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="card" style={{ padding: 16 }}>
            <div className="section-title" style={{ marginBottom: 14 }}>
              <I.History style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Timeline
            </div>
            {events.length === 0 ? (
              <div style={{ fontSize: 12.5, color: 'var(--ink-400)', fontStyle: 'italic' }}>Aucun événement enregistré.</div>
            ) : (
              <div>
                {[...events].reverse().map((ev, i, arr) => {
                  const st   = PARCEL_STATUS[ev.status] ?? { label: ev.status, icon: '📦', cls: 'neutral' };
                  const isLatest = i === 0;
                  const clsBg = {
                    ok: 'var(--ok-100)', info: 'var(--brand-100)', warn: 'var(--warn-100)',
                    bad: 'var(--bad-100)', neutral: 'var(--bg-soft)',
                  }[st.cls] ?? 'var(--bg-soft)';
                  const clsColor = {
                    ok: 'var(--ok-700)', info: 'var(--brand-600)', warn: 'var(--warn-700)',
                    bad: 'var(--bad-600)', neutral: 'var(--ink-500)',
                  }[st.cls] ?? 'var(--ink-500)';
                  return (
                    <div key={i} style={{ display: 'flex', gap: 12, position: 'relative', paddingBottom: i < arr.length - 1 ? 16 : 0 }}>
                      {i < arr.length - 1 && (
                        <div style={{ position: 'absolute', left: 15, top: 32, bottom: 0, width: 1.5, background: 'var(--border)' }} />
                      )}
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        background: isLatest ? clsBg : 'var(--bg-soft)',
                        border: `2px solid ${isLatest ? clsColor : 'var(--border)'}`,
                        display: 'grid', placeItems: 'center', fontSize: 14,
                      }}>
                        {isLatest ? st.icon : '✓'}
                      </div>
                      <div style={{ flex: 1, paddingTop: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: 12.5, fontWeight: isLatest ? 700 : 500,
                            color: isLatest ? clsColor : 'var(--ink-700)',
                          }}>
                            {st.label}
                          </span>
                          {isLatest && (
                            <span style={{ fontSize: 9.5, fontWeight: 700, background: clsColor, color: 'white', padding: '1px 6px', letterSpacing: '.04em' }}>
                              ACTUEL
                            </span>
                          )}
                        </div>
                        {ev.location && (
                          <div style={{ fontSize: 11.5, color: 'var(--ink-500)', marginTop: 1 }}>📍 {ev.location}</div>
                        )}
                        {ev.note && (
                          <div style={{ fontSize: 11.5, color: 'var(--ink-500)', fontStyle: 'italic', marginTop: 1 }}>{ev.note}</div>
                        )}
                        <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 2 }}>
                          {ev.createdBy?.name ?? 'Système'} · {new Date(ev.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {showWeightModal && parcel && (
        <WeightModal
          parcel={parcel}
          onClose={() => setShowWeightModal(false)}
          onSaved={(updated) => {
            setParcel(p => ({
              ...p,
              weightKg:          updated.weightKg,
              priceXaf:          updated.priceXaf,
              confirmedPriceXaf: updated.confirmedPriceXaf ?? p.confirmedPriceXaf,
              adjustmentStatus:  updated.adjustmentStatus  ?? p.adjustmentStatus,
              items:             updated.items || p.items,
            }));
            setShowWeightModal(false);
          }}
        />
      )}
      {showPayModal && parcel && (
        <InteracModal parcel={parcel} onClose={() => setShowPayModal(false)} />
      )}
    </div>
  );
}

function BlItemsEditor({ items, onChange, onSave, onCancel }) {
  const upd = (idx, k, v) => onChange(its => its.map((it, i) => i === idx ? { ...it, [k]: v } : it));
  const add = () => onChange(its => [...its, { id: Date.now(), designation: '', description: '', type: 'carton', count: 1, nbPieces: '' }]);
  const del = (idx) => onChange(its => its.filter((_, i) => i !== idx));

  return (
    <div style={{ paddingTop: 8 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 8 }}>
        <thead>
          <tr style={{ background: 'var(--brand-100)' }}>
            {['Désignation', 'Description', 'Type', 'Nb', ''].map(h => (
              <th key={h} style={{ padding: '4px 6px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: 'var(--brand-800)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx}>
              <td style={{ padding: '3px 3px' }}>
                <input className="input input--sm" value={it.designation ?? ''} onChange={e => upd(idx, 'designation', e.target.value)} placeholder="Désignation" />
              </td>
              <td style={{ padding: '3px 3px' }}>
                <input className="input input--sm" value={it.description ?? ''} onChange={e => upd(idx, 'description', e.target.value)} placeholder="Détails…" />
              </td>
              <td style={{ padding: '3px 3px', width: 100 }}>
                <select className="select input--sm" value={it.type ?? 'carton'} onChange={e => upd(idx, 'type', e.target.value)}>
                  <option value="carton">Carton</option>
                  <option value="paquet">Paquet</option>
                  <option value="sachet">Sachet</option>
                  <option value="bouteille">Bouteille</option>
                </select>
              </td>
              <td style={{ padding: '3px 3px', width: 55 }}>
                <input className="input input--sm mono" type="number" min="1" value={it.count ?? 1} onChange={e => upd(idx, 'count', e.target.value)} />
              </td>
              <td style={{ padding: '3px 3px', width: 28 }}>
                <button onClick={() => del(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bad-500)', fontSize: 16, padding: '0 4px' }}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn--ghost btn--sm" onClick={add}>+ Ligne</button>
        <div style={{ flex: 1 }} />
        <button className="btn btn--ghost btn--sm" onClick={onCancel}>Annuler</button>
        <button className="btn btn--brand btn--sm" onClick={onSave}>Enregistrer</button>
      </div>
    </div>
  );
}

const WEIGHT_CATEGORIES = [
  { id: 'standard',    label: 'Standard',         icon: '📦' },
  { id: 'vetements',   label: 'Vêtements',         icon: '👗' },
  { id: 'cosmetique',  label: 'Cosmétique',        icon: '💄' },
  { id: 'alimentaire', label: 'Alimentaire',       icon: '🥘' },
  { id: 'biere',       label: 'Bière',             icon: '🍺' },
  { id: 'manioc_huile',label: 'Manioc/Huile',      icon: '🌿' },
  { id: 'electronique',label: 'Électronique',      icon: '📱' },
  { id: 'documents',   label: 'Documents',         icon: '📄' },
];

const BEER_FORMATS = [
  { id: '24x65', label: '24×65 cl — 24.50$' },
  { id: '24x33', label: '24×33 cl — 35.83$' },
  { id: '12x50', label: '12×50 cl — 21.34$' },
];

function WeightModal({ parcel, onClose, onSaved }) {
  const initItems = () => {
    if (Array.isArray(parcel.items) && parcel.items.length > 0) {
      return parcel.items.map(it => ({
        description: it.description || '',
        category: it.category || it.productType || 'standard',
        weightKg: it.weightKg || '',
        beerFormat: it.beerFormat || '24x65',
        nbCasiers: it.nbCasiers || '',
      }));
    }
    return [{ description: parcel.description || '', category: parcel.productType || 'standard', weightKg: parcel.weightKg || '', beerFormat: '24x65', nbCasiers: '' }];
  };

  const [items,      setItems]      = useState(initItems);
  const [addons,     setAddons]     = useState({
    nbCartons:    parcel.nbCartons    || 0,
    nbPetitsSacs: parcel.nbPetitsSacs || 0,
    nbSacsMoyens: parcel.nbSacsMoyens || 0,
    nbGrandsSacs: parcel.nbGrandsSacs || 0,
    nbPlastiques: parcel.nbPlastiques || 0,
  });
  const [marginPct,  setMarginPct]  = useState(parcel.marginPct ?? 30);
  const [breakdown,  setBreakdown]  = useState(null);
  const [saving,     setSaving]     = useState(false);

  const updItem   = (idx, k, v) => setItems(its => its.map((it, i) => i === idx ? { ...it, [k]: v } : it));
  const addItem   = () => setItems(its => [...its, { description: '', category: 'standard', weightKg: '', beerFormat: '24x65', nbCasiers: '' }]);
  const delItem   = (idx) => setItems(its => its.filter((_, i) => i !== idx));
  const updAddon  = (k, v) => setAddons(a => ({ ...a, [k]: Number(v) || 0 }));

  // Auto-recalculate on any change
  useEffect(() => {
    const validItems = items.filter(it => Number(it.weightKg) > 0).map(it => ({
      description: it.description,
      category: it.category,
      weightKg: Number(it.weightKg),
      beerFormat: it.category === 'biere' ? it.beerFormat : undefined,
      nbCasiers:  it.category === 'biere' && Number(it.nbCasiers) > 0 ? Number(it.nbCasiers) : undefined,
    }));
    if (validItems.length === 0) { setBreakdown(null); return; }

    const ctrl = new AbortController();
    fetch('/api/pricing/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctrl.signal,
      body: JSON.stringify({
        items: validItems,
        addons,
        routeId: parcel.campaign?.route?.id ?? undefined,
        marginPct: Number(marginPct) || 0,
      }),
    })
      .then(r => r.json())
      .then(d => { if (!ctrl.signal.aborted) setBreakdown(d); })
      .catch(() => {});
    return () => ctrl.abort();
  }, [items, addons, marginPct]);

  const handleSave = async () => {
    setSaving(true);
    const validItems = items.filter(it => Number(it.weightKg) > 0);
    const realPrice  = breakdown?.prixClient ? Math.round(breakdown.prixClient) : undefined;
    const res = await fetch('/api/parcels/' + parcel.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weightKg:          breakdown?.totalKg || undefined,
        // priceXaf intentionally NOT sent — keeps the original booking estimate for comparison
        confirmedPriceXaf: realPrice,
        items:             validItems,
        marginPct:         Number(marginPct) || 0,
        nbCartons:         addons.nbCartons,
        nbPetitsSacs:      addons.nbPetitsSacs,
        nbSacsMoyens:      addons.nbSacsMoyens,
        nbGrandsSacs:      addons.nbGrandsSacs,
        nbPlastiques:      addons.nbPlastiques,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.ok) onSaved(json.parcel);
  };

  const bd = breakdown;
  const labelCat = (cat) => WEIGHT_CATEGORIES.find(c => c.id === cat)?.label || cat;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Poids &amp; Prix — {parcel.trackingCode}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>Calculateur de prix détaillé</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn--ghost" onClick={onClose}>Annuler</button>
          <button className="btn btn--brand" onClick={handleSave} disabled={saving || !bd}>
            {saving ? 'Enregistrement…' : 'Appliquer'}
          </button>
        </div>
      </div>

      {/* Body — 2 colonnes */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', overflow: 'hidden' }}>

        {/* Colonne gauche — saisie */}
        <div style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Table articles */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-400)', marginBottom: 8 }}>Articles</div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-soft)' }}>
                    {['Description', 'Catégorie', 'Poids (kg)', ''].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <>
                      <tr key={idx} style={{ borderBottom: it.category === 'biere' ? 'none' : '1px solid var(--border-soft)' }}>
                        <td style={{ padding: '6px 8px' }}>
                          <input className="input input--sm" value={it.description} onChange={e => updItem(idx, 'description', e.target.value)} placeholder="Ex: Robes, Bière 33cl…" style={{ width: '100%' }} />
                        </td>
                        <td style={{ padding: '6px 8px', width: 165 }}>
                          <select className="select input--sm" value={it.category} onChange={e => updItem(idx, 'category', e.target.value)} style={{ width: '100%' }}>
                            {WEIGHT_CATEGORIES.map(c => (
                              <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '6px 8px', width: 90 }}>
                          <input className="input input--sm mono" type="number" min="0" step="0.1" value={it.weightKg} onChange={e => updItem(idx, 'weightKg', e.target.value)} placeholder="0.0" style={{ width: '100%' }} />
                        </td>
                        <td style={{ padding: '6px 8px', width: 32 }}>
                          <button onClick={() => delItem(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-300)', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>×</button>
                        </td>
                      </tr>
                      {it.category === 'biere' && (
                        <tr key={idx + '-beer'} style={{ borderBottom: '1px solid var(--border-soft)', background: 'var(--warn-50)' }}>
                          <td colSpan={4} style={{ padding: '6px 8px 8px 24px' }}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                              <span style={{ fontSize: 11, color: 'var(--warn-700)', fontWeight: 600 }}>🍺 Frais SAQ :</span>
                              <select className="select input--sm" value={it.beerFormat} onChange={e => updItem(idx, 'beerFormat', e.target.value)} style={{ width: 200 }}>
                                {BEER_FORMATS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                              </select>
                              <input className="input input--sm mono" type="number" min="0" step="1" value={it.nbCasiers} onChange={e => updItem(idx, 'nbCasiers', e.target.value)} placeholder="Nb casiers" style={{ width: 90 }} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="btn btn--ghost btn--sm" onClick={addItem} style={{ marginTop: 8 }}>+ Ajouter une ligne</button>
          </div>

          {/* Emballages */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-400)', marginBottom: 8 }}>Emballages</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { key: 'nbCartons',    label: 'Cartons',      icon: '📦' },
                { key: 'nbPetitsSacs', label: 'Petits sacs',  icon: '🛍️' },
                { key: 'nbSacsMoyens', label: 'Moyens sacs',  icon: '🛍️' },
                { key: 'nbGrandsSacs', label: 'Grands sacs',  icon: '🛍️' },
                { key: 'nbPlastiques', label: 'Plastiques',   icon: '📦' },
              ].map(({ key, label, icon }) => (
                <div key={key} style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-500)', marginBottom: 6 }}>{icon} {label}</div>
                  <input className="input input--sm mono" type="number" min="0" value={addons[key]} onChange={e => updAddon(key, e.target.value)} style={{ width: '100%' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Marge */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-400)', marginBottom: 8 }}>Marge</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input className="input mono" type="number" min="0" max="200" step="1" value={marginPct} onChange={e => setMarginPct(e.target.value)} style={{ width: 90 }} />
              <span style={{ fontSize: 13, color: 'var(--ink-500)' }}>%</span>
            </div>
          </div>
        </div>

        {/* Colonne droite — breakdown sticky */}
        <div style={{ background: '#f8f9fa', borderLeft: '1px solid var(--border)', overflowY: 'auto', padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-400)', marginBottom: 14 }}>Détail du prix</div>

          {!bd ? (
            <div style={{ fontSize: 13, color: 'var(--ink-400)', fontStyle: 'italic' }}>Saisir les poids pour voir le calcul.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Ligne helper */}
              {[
                ['Transport', bd.transport],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '5px 0', color: 'var(--ink-700)' }}>
                  <span>{label} ({bd.totalKg} kg)</span><span className="mono">{val?.toFixed(2)} $</span>
                </div>
              ))}

              {/* Supplements */}
              {bd.supplements?.map(s => (
                <div key={s.category} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: 'var(--ink-600)', paddingLeft: 10 }}>
                  <span>Suppl. {labelCat(s.category)} ({s.kg} kg × {s.rate >= 0 ? '+' : ''}{s.rate}$/kg)</span>
                  <span className="mono">{s.amount >= 0 ? '+' : ''}{s.amount?.toFixed(2)} $</span>
                </div>
              ))}

              {/* SAQ */}
              {bd.saqLines?.map((l, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: 'var(--warn-700)', paddingLeft: 10 }}>
                  <span>SAQ {l.format} × {l.nbCasiers} casiers</span>
                  <span className="mono">+{l.amount?.toFixed(2)} $</span>
                </div>
              ))}

              {bd.carton > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: 'var(--ink-600)' }}>
                  <span>Carton</span><span className="mono">{bd.carton?.toFixed(2)} $</span>
                </div>
              )}
              {bd.sacs > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: 'var(--ink-600)' }}>
                  <span>Sacs</span><span className="mono">{bd.sacs?.toFixed(2)} $</span>
                </div>
              )}
              {bd.manutention > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: 'var(--ink-600)' }}>
                  <span>Manutention</span><span className="mono">{bd.manutention?.toFixed(2)} $</span>
                </div>
              )}
              {bd.douane > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: 'var(--ink-600)' }}>
                  <span>Douane</span><span className="mono">{bd.douane?.toFixed(2)} $</span>
                </div>
              )}
              {bd.formalites > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: 'var(--ink-600)' }}>
                  <span>Formalités</span><span className="mono">{bd.formalites?.toFixed(2)} $</span>
                </div>
              )}
              {bd.plastic > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: 'var(--ink-600)' }}>
                  <span>Conditionnement</span><span className="mono">{bd.plastic?.toFixed(2)} $</span>
                </div>
              )}

              {/* Séparateur */}
              <div style={{ borderTop: '1.5px solid var(--border)', margin: '10px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: 'var(--ink-700)' }}>
                <span>Sous-total</span><span className="mono">{bd.sousTotal?.toFixed(2)} $</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: 'var(--ink-600)' }}>
                <span>Marge ({bd.marginPct}%)</span><span className="mono">+{bd.marge?.toFixed(2)} $</span>
              </div>

              <div style={{ borderTop: '2px solid var(--ink-900)', margin: '10px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: 'var(--ink-900)', padding: '4px 0' }}>
                <span>Prix client</span>
                <span className="mono">{bd.prixClient?.toFixed(2)} $</span>
              </div>

              {/* ── Comparaison vs estimation réservation ── */}
              {parcel.priceXaf != null && (() => {
                const estimated = parcel.priceXaf;
                const real      = Math.round(bd.prixClient ?? 0);
                const diff      = real - estimated;
                return (
                  <>
                    <div style={{ borderTop: '1.5px dashed var(--border)', margin: '14px 0 10px' }} />
                    <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-400)', marginBottom: 8 }}>
                      Comparaison
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 8px', background: 'var(--bg-soft)', borderRadius: 4 }}>
                        <span style={{ color: 'var(--ink-400)' }}>Estimation réservation</span>
                        <span className="mono" style={{ color: 'var(--ink-400)', textDecoration: 'line-through' }}>{estimated.toLocaleString('fr')} CAD</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '4px 8px', background: 'var(--brand-50)', borderRadius: 4 }}>
                        <span style={{ color: 'var(--ink-700)', fontWeight: 600 }}>Prix réel (pesée)</span>
                        <span className="mono" style={{ fontWeight: 700, color: 'var(--ink-900)' }}>{real.toLocaleString('fr')} CAD</span>
                      </div>
                      {diff === 0 ? (
                        <div style={{ fontSize: 11.5, color: 'var(--ok-700)', textAlign: 'center', padding: '4px 0' }}>✓ Identique à l'estimation</div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 8px', background: diff > 0 ? 'var(--warn-50)' : 'var(--ok-50)', border: `1px solid ${diff > 0 ? 'var(--warn-200)' : 'var(--ok-100)'}`, borderRadius: 6 }}>
                          <span style={{ fontWeight: 700, color: diff > 0 ? 'var(--warn-700)' : 'var(--ok-700)' }}>
                            {diff > 0 ? '↑ Supplément' : '↓ Remise'}
                          </span>
                          <span className="mono" style={{ fontWeight: 700, color: diff > 0 ? 'var(--warn-700)' : 'var(--ok-700)' }}>
                            {diff > 0 ? '+' : ''}{diff.toLocaleString('fr')} CAD
                          </span>
                        </div>
                      )}
                    </div>
                    {diff !== 0 && (
                      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-400)', fontStyle: 'italic', lineHeight: 1.5 }}>
                        En cliquant "Appliquer", le client sera notifié par WhatsApp si un supplément est dû.
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InteracModal({ parcel, onClose }) {
  const payUrl = (typeof window !== 'undefined' ? window.location.origin : '') + '/payer/' + parcel.id;
  return (
    <Modal width={680} onClose={onClose}
      title="Lien de paiement Interac"
      sub={parcel.trackingCode + ' · ' + ((payment?.amount ?? parcel.priceXaf)?.toLocaleString('fr') ?? '—') + ' CAD dû'}
      footer={<><button className="btn btn--ghost" onClick={onClose}>Fermer</button></>}>
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-400)', marginBottom: 4 }}>Lien de paiement</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="mono" style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-soft)', border: '1px solid var(--border)', fontSize: 11.5, color: 'var(--ink-600)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderRadius: 6 }}>{payUrl}</div>
          <button className="btn btn--ghost btn--sm" onClick={() => navigator.clipboard?.writeText(payUrl)}>Copier</button>
        </div>
        <div style={{ padding: 12, background: 'var(--warn-50)', border: '1px solid var(--warn-100)', borderRadius: 6, fontSize: 12, color: 'var(--ink-700)', lineHeight: 1.6 }}>
          Client : <strong>{parcel.client?.name}</strong> · {parcel.client?.phone || parcel.client?.email}
        </div>
      </div>
    </Modal>
  );
}

