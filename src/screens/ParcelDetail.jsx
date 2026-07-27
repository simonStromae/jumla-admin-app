'use client';
import { useState, useEffect } from 'react';
import I from '../components/Icons.jsx';
import { Avatar, Modal } from '../components/Shell.jsx';
import { useAdminT } from '../lib/useAdminT.js';

// TODO: i18n — PARCEL_STATUS labels are French; replace with t.parcelStatus keys when mapping is extended
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
// TODO: i18n — PAYMENT_STATUS labels are French; map to t.paymentStatus where possible
const PAYMENT_STATUS = {
  pending:   { label: 'En attente', cls: 'warn' },
  completed: { label: 'Payé',       cls: 'ok' },
  failed:    { label: 'Échoué',     cls: 'bad' },
  refunded:  { label: 'Remboursé',  cls: 'neutral' },
};
// TODO: i18n — BORDEREAU_STATUS labels are French; map to t.blStatus where possible
const BORDEREAU_STATUS = {
  en_attente: { label: 'À vérifier', cls: 'neutral' },
  en_cours:   { label: 'En cours',   cls: 'warn' },
  valide:     { label: 'Validé',     cls: 'ok' },
  libere:     { label: 'Libéré',     cls: 'ok' },
};

const DRIVER_WARNINGS = {
  enr: { cls: 'neutral', icon: '📝', msg: 'La cargaison n\'a pas encore été expédiée — le colis est toujours à l\'entrepôt d\'origine.' },
  exp: { cls: 'warn',    icon: '🚀', msg: 'La cargaison vient d\'être expédiée — le colis n\'est pas encore arrivé à destination.' },
  tra: { cls: 'warn',    icon: '✈️', msg: 'La cargaison est en transit (en vol / en route) — le colis n\'a pas encore atterri.' },
  apd: { cls: 'warn',    icon: '🛬', msg: 'La cargaison est arrivée au pays mais n\'a pas encore été dédouanée ni livrée à l\'entrepôt.' },
  dou: { cls: 'warn',    icon: '🛃', msg: 'La cargaison est en dédouanement — la livraison ne pourra commencer qu\'après la libération.' },
  ins: { cls: 'warn',    icon: '🔎', msg: 'La cargaison est en inspection douanière — date de libération incertaine.' },
  ret: { cls: 'bad',     icon: '⚠️', msg: 'La cargaison est retenue par les douanes — livraison bloquée jusqu\'à résolution.' },
};

export default function ParcelDetailScreen({ id, onNav }) {
  const t = useAdminT();
  const [parcel,        setParcel]        = useState(null);
  const [bordereaux,    setBordereaux]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showPayModal,    setShowPayModal]    = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting,        setDeleting]        = useState(false);
  const [deleteError,     setDeleteError]     = useState('');
  const [statusForm, setStatusForm] = useState({ status: '', note: '', location: '', saving: false });
  const [showAddBl,       setShowAddBl]       = useState(false);
  const [newBl,    setNewBl]    = useState({ description: '', weightKg: '', items: [] });
  const [addingBl, setAddingBl] = useState(false);
  const [editingBlId,    setEditingBlId]    = useState(null);
  const [editingBlItems, setEditingBlItems] = useState([]);
  const [drivers,      setDrivers]      = useState([]);
  const [driverId,     setDriverId]     = useState('');
  const [savingDriver, setSavingDriver] = useState(false);

  useEffect(() => {
    fetch('/api/parcels/' + id)
      .then(r => r.json())
      .then(data => { setParcel(data); setDriverId(data.driverId ?? ''); setLoading(false); })
      .catch(() => setLoading(false));
    fetch('/api/admin/drivers')
      .then(r => r.json())
      .then(d => Array.isArray(d) && setDrivers(d))
      .catch(() => {});
  }, [id]);

  const handleDriverAssign = async (newDriverId) => {
    setSavingDriver(true);
    const body = { driverId: newDriverId || null };
    if (newDriverId) {
      body.delivery = 'home';
      // Auto-promote to 'pdl' so driver sees it immediately in their dashboard
      if (['ard', 'lib', 'ver', 'tdl'].includes(parcel?.status)) {
        body.status = 'pdl';
        body.eventNote = 'Prêt pour livraison — livreur assigné';
      }
    }
    const res = await fetch('/api/parcels/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setDriverId(newDriverId);
      setParcel(p => ({
        ...p,
        driverId: newDriverId || null,
        delivery: newDriverId ? 'home' : null,
        ...(body.status ? { status: body.status } : {}),
      }));
    }
    setSavingDriver(false);
  };

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
    if (!confirm(t.common.confirm + ' ?')) return;
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'var(--ink-400)', fontSize: 14 }}>{t.common.loading}</div>
    </div>
  );

  if (!parcel || parcel.error) return (
    <div className="page">
      <div style={{ padding: 32, color: 'var(--bad-700)' }}>{t.common.error}</div>
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
  // TODO: i18n — 'Non créé' has no direct key in t.paymentStatus
  const payStatus  = payment ? (PAYMENT_STATUS[payment.status] || { label: payment.status, cls: 'neutral' }) : { label: 'Non créé', cls: 'neutral' };
  const totalVerif = bordereaux.filter(b => b.status === 'verifie').length;

  const campaignLocked = ['exp', 'tra', 'apd', 'dou', 'lib', 'ard', 'pdl', 'ok'].includes(parcel?.campaign?.status);

  return (
    <div className="page">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ink-400)', marginBottom: 8 }}>
        <a style={{ cursor: 'pointer' }} onClick={() => onNav('/')}>{t.nav.parcels}</a>
        <I.ChevronRight style={{ width: 12, height: 12 }} />
        {campaign.id && <a style={{ cursor: 'pointer' }} onClick={() => onNav('/campaign/' + campaign.id)}>{campaign.code}</a>}
        {campaign.id && <I.ChevronRight style={{ width: 12, height: 12 }} />}
        {/* TODO: i18n — 'Colis' (singular parcel) has no direct key */}
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
            {/* TODO: i18n — 'Cargaison' (singular campaign) has no direct key */}
            {campaign.code && <>Cargaison <a style={{ color: 'var(--brand-700)', fontWeight: 600, cursor: 'pointer' }} onClick={() => onNav('/campaign/' + campaign.id)}>{campaign.code}</a> · </>}
            {t.parcels.detail.sender} <strong style={{ color: 'var(--ink-700)' }}>{client.name}</strong>
          </div>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost" onClick={() => onNav('/admin/parcels/' + id + '/labels')}><I.Tag />{t.parcels.detail.bordereaux}</button>
          <button className="btn btn--ghost" onClick={() => window.open('/client/invoice/' + id, '_blank')}><I.FileText />{t.parcels.detail.billing}</button>
          {/* TODO: i18n — 'Poids / Prix' has no direct key (composite weight+price) */}
          <button className="btn btn--ghost" onClick={() => setShowWeightModal(true)}><I.Edit />Poids / Prix</button>
          <button className="btn btn--ghost" onClick={() => setShowPayModal(true)}><I.Send />{'Payer par Interac'}</button>
          {['enr', 'rec'].includes(parcel.status) && (
            <button
              className="btn btn--ghost"
              onClick={() => { setDeleteError(''); setShowDeleteModal(true); }}
              style={{ color: 'var(--bad-600)', borderColor: 'var(--bad-200)' }}
            >
              <I.Trash />{t.common.delete}
            </button>
          )}
        </div>
      </div>

      <div className="layout-2col">
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Sender */}
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <I.Pin style={{ color: 'var(--brand-500)', width: 16, height: 16 }} />
              {/* TODO: i18n — 'Expéditeur / Client' has no direct key */}
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
                {/* TODO: i18n — 'Destinataire' (recipient) has no direct key */}
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

          {/* Driver assignment */}
          {drivers.length > 0 && (
            <div className="card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <I.Truck style={{ width: 14, height: 14, color: 'var(--brand-500)' }} />
                  <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700, color: 'var(--ink-400)' }}>Livreur assigné</span>
                </div>
                <span className={'badge badge--dot badge--' + (parcel.delivery === 'home' ? 'info' : 'neutral')}>
                  {parcel.delivery === 'home' ? 'Domicile' : 'Retrait entrepôt'}
                </span>
              </div>

              {/* Campaign status warning */}
              {(() => {
                const w = DRIVER_WARNINGS[campaign.status];
                if (!w) return null;
                const bg  = w.cls === 'bad'  ? 'var(--bad-50)'  : w.cls === 'warn' ? 'var(--warn-50)'  : 'var(--bg-soft)';
                const bdr = w.cls === 'bad'  ? 'var(--bad-200)' : w.cls === 'warn' ? 'var(--warn-200)' : 'var(--border)';
                const txt = w.cls === 'bad'  ? 'var(--bad-700)' : w.cls === 'warn' ? 'var(--warn-700)' : 'var(--ink-500)';
                return (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 7, background: bg, border: '1px solid ' + bdr, marginBottom: 10 }}>
                    <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{w.icon}</span>
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: txt, marginBottom: 2 }}>
                        Cargaison : {campaign.code ?? ''} — {campaign.status?.toUpperCase()}
                      </div>
                      <div style={{ fontSize: 11.5, color: txt, lineHeight: 1.4 }}>{w.msg}</div>
                      <div style={{ fontSize: 11, color: txt, opacity: .8, marginTop: 3 }}>
                        Vous pouvez pré-assigner un livreur, mais la livraison ne pourra être effectuée que lorsque la cargaison sera disponible.
                      </div>
                    </div>
                  </div>
                );
              })()}

              <select
                className="select"
                value={driverId}
                onChange={e => handleDriverAssign(e.target.value)}
                disabled={savingDriver}
              >
                <option value="">— Aucun livreur —</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {savingDriver && <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 4 }}>Enregistrement…</div>}
              {!driverId && !savingDriver && (
                <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 6 }}>
                  Assigner un livreur bascule automatiquement la livraison en mode domicile.
                </div>
              )}
            </div>
          )}

          {/* Items declared */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <I.Box style={{ width: 14, height: 14, color: 'var(--brand-600)' }} />
              {/* TODO: i18n — 'Contenu déclaré' has no direct key */}
              <span style={{ fontSize: 13, fontWeight: 700 }}>Contenu déclaré</span>
              {parcel.weightKg && <span className="mono" style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: 'var(--ink-600)' }}>{parcel.weightKg} kg total</span>}
            </div>

            {items.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-soft)' }}>
                    {/* TODO: i18n — 'Pièces' has no direct key */}
                    {[t.common.description, t.common.type, t.common.weight, 'Pièces'].map(h => (
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
                {parcel.description || t.common.noData}
              </div>
            )}
            {parcel.notes && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-500)', fontStyle: 'italic' }}>{t.common.note} : {parcel.notes}</div>
            )}
          </div>

          {/* Bordereaux */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
              <div>
                {/* TODO: i18n — 'Bordereaux du colis' has no direct section-title key */}
                <div style={{ fontSize: 14, fontWeight: 700 }}>Bordereaux du colis</div>
                <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>
                  {/* TODO: i18n — 'vérifiés' format string has no direct key */}
                  {bordereaux.length === 0 ? t.common.noData : `${totalVerif}/${bordereaux.length} vérifiés`}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                {campaignLocked && (
                  <div style={{ padding: '8px 12px', background: 'var(--warn-50)', border: '1px solid var(--warn-200)', borderRadius: 6, fontSize: 12, color: 'var(--warn-700)' }}>
                    {/* TODO: i18n — 'Cargaison en transit — modifications verrouillées' has no direct key */}
                    🔒 Cargaison en transit — modifications verrouillées
                  </div>
                )}
                {!campaignLocked && (
                  <button className="btn btn--brand btn--sm" onClick={() => setShowAddBl(v => !v)}>
                    <I.Plus />{showAddBl ? t.common.cancel : t.common.add}
                  </button>
                )}
              </div>
            </div>

            {showAddBl && !campaignLocked && (
              <div style={{ padding: '14px 16px', background: 'var(--brand-50)', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 8, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', marginBottom: 4 }}>{t.common.description} <span style={{ fontWeight: 400 }}>({t.common.optional})</span></div>
                    {/* TODO: i18n — 'Contenu du bordereau…' placeholder has no direct key */}
                    <input className="input input--sm" value={newBl.description}
                      onChange={e => setNewBl(b => ({ ...b, description: e.target.value }))}
                      placeholder="Contenu du bordereau…" />
                  </div>
                  <div>
                    {/* TODO: i18n — 'Poids total kg' composite label has no direct key */}
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', marginBottom: 4 }}>Poids total kg</div>
                    <input className="input input--sm mono" type="number" min="0" step="0.1"
                      value={newBl.weightKg} onChange={e => setNewBl(b => ({ ...b, weightKg: e.target.value }))} placeholder="0" />
                  </div>
                </div>

                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-600)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>
                  {/* TODO: i18n — 'Contenu (N ligne{s})' format string has no direct key */}
                  Contenu ({newBl.items.length} ligne{newBl.items.length !== 1 ? 's' : ''})
                </div>

                {newBl.items.length > 0 && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8, fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: 'var(--brand-100)' }}>
                        {/* TODO: i18n — 'Désignation', 'Nb', 'Pièces (alt)' have no direct keys */}
                        {['Désignation', t.common.description, t.common.type, 'Nb', 'Pièces (alt)', ''].map(h => (
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
                            {/* TODO: i18n — placeholder 'Détails…' has no direct key */}
                            <input className="input input--sm" value={it.description ?? ''}
                              onChange={e => updBlItem(idx, 'description', e.target.value)} placeholder="Détails…" />
                          </td>
                          <td style={{ padding: '4px 4px', width: 110 }}>
                            {/* TODO: i18n — select options Carton/Paquet/Sachet/Bouteille have no direct keys */}
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
                  {/* TODO: i18n — 'Ajouter une ligne' (add row) has no direct key */}
                  <button className="btn btn--ghost btn--sm" onClick={addBlItem} style={{ flex: 1 }}>
                    + Ajouter une ligne
                  </button>
                  {/* TODO: i18n — 'Création…' / 'Créer le bordereau' have no direct keys */}
                  <button className="btn btn--brand btn--sm" onClick={createBl} disabled={addingBl} style={{ flex: 0 }}>
                    {addingBl ? 'Création…' : 'Créer le bordereau'}
                  </button>
                </div>
              </div>
            )}

            {bordereaux.length === 0 && !showAddBl ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--ink-400)', fontSize: 13 }}>
                {/* TODO: i18n — full sentence has no direct key */}
                Aucun bordereau du colis. Cliquez sur "Ajouter" pour créer le premier paquet.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-soft)' }}>
                    {/* TODO: i18n — 'Code', 'Lignes' have no direct keys */}
                    {['Code', t.common.description, t.common.weight, 'Lignes', t.common.status, ''].map(h => (
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
                                {/* TODO: i18n — '✓ Attesté' has no direct key */}
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
                <I.Edit style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> {t.campaigns.detail.changeStatus}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <select
                  className="input"
                  value={statusForm.status || parcel.status}
                  onChange={e => setStatusForm(f => ({ ...f, status: e.target.value }))}
                >
                  {/* TODO: i18n — optgroup labels 'Flux principal', 'Douanes', 'Livraison', 'Exceptionnels' have no direct keys */}
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
                {/* TODO: i18n — location placeholder has no direct key */}
                <input className="input" placeholder="📍 Localisation (ex. Douala – Aéroport)"
                  value={statusForm.location}
                  onChange={e => setStatusForm(f => ({ ...f, location: e.target.value }))}
                />
                <textarea className="input" rows={2} placeholder={t.common.note + '…'}
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
                  {statusForm.saving ? t.common.saving : t.common.save}
                </button>
              </div>
          </div>

          {/* Payment */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className="section-title" style={{ margin: 0 }}>
                {/* TODO: i18n — 'Paiement' singular has no direct key; t.nav.payments is plural */}
                <I.Wallet style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Paiement
              </div>
              <span className={'badge badge--dot badge--' + payStatus.cls}>{payStatus.label}</span>
            </div>

            <div style={{ padding: '12px 0', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              {/* TODO: i18n — 'Total dû' has no direct key; using t.common.total as close match */}
              <span style={{ fontWeight: 700 }}>{t.common.total}</span>
              <span className="mono" style={{ fontSize: 22, fontWeight: 700 }}>
                {(payment?.amount ?? parcel.priceXaf)?.toLocaleString('fr') ?? '—'} <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>CAD</span>
              </span>
            </div>

            {(!payment || payment.status !== 'completed') ? (
              <button className="btn btn--brand" style={{ justifyContent: 'center', width: '100%' }} onClick={() => setShowPayModal(true)}>
                <I.Send />{'Payer par Interac'}
              </button>
            ) : (
              <div style={{ padding: 10, background: 'var(--ok-50)', border: '1px solid var(--ok-100)', fontSize: 11.5, color: 'var(--ok-700)', borderRadius: 6 }}>
                {/* TODO: i18n — 'Réglé' and 'Réf.' / 'Virement Interac' have no direct keys */}
                <strong>Réglé</strong> · {payment.interacRef ? 'Réf. ' + payment.interacRef : 'Virement Interac'}
              </div>
            )}
          </div>

          {/* Billing — read-only summary, updated via Poids/Prix modal */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className="section-title" style={{ margin: 0 }}>
                {/* TODO: i18n — 'Facturation' has no direct key */}
                <I.Wallet style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Facturation
              </div>
              {parcel.adjustmentStatus === 'pending' && (
                // TODO: i18n — 'Supplément dû' has no direct key
                <span className="badge badge--dot badge--warn">Supplément dû</span>
              )}
              {parcel.adjustmentStatus === 'paid' && (
                // TODO: i18n — 'Réglé' has no direct key matching exactly
                <span className="badge badge--dot badge--ok">Réglé</span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 8px', background: 'var(--bg-soft)', borderRadius: 5 }}>
                {/* TODO: i18n — 'Estimation réservation' has no direct key */}
                <span style={{ color: 'var(--ink-500)' }}>Estimation réservation</span>
                <span className="mono" style={{ color: parcel.confirmedPriceXaf != null ? 'var(--ink-400)' : 'var(--ink-700)', fontWeight: 600, textDecoration: parcel.confirmedPriceXaf != null ? 'line-through' : 'none' }}>
                  {parcel.priceXaf ? parcel.priceXaf.toLocaleString('fr') + ' CAD' : '—'}
                </span>
              </div>

              {parcel.confirmedPriceXaf != null ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 8px', background: 'var(--brand-50)', borderRadius: 5 }}>
                    {/* TODO: i18n — 'Prix réel (pesée)' has no direct key */}
                    <span style={{ color: 'var(--ink-700)', fontWeight: 600 }}>Prix réel (pesée)</span>
                    <span className="mono" style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink-900)' }}>
                      {parcel.confirmedPriceXaf.toLocaleString('fr')} CAD
                    </span>
                  </div>
                  {(() => {
                    const diff = parcel.confirmedPriceXaf - (parcel.priceXaf ?? 0);
                    if (diff === 0) return (
                      // TODO: i18n — 'Identique à l\'estimation' has no direct key
                      <div style={{ fontSize: 12, color: 'var(--ok-700)', textAlign: 'center', padding: '4px 0' }}>✓ Identique à l'estimation</div>
                    );
                    return (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 8px', background: diff > 0 ? 'var(--warn-50)' : 'var(--ok-50)', border: `1px solid ${diff > 0 ? 'var(--warn-200)' : 'var(--ok-100)'}`, borderRadius: 6 }}>
                        {/* TODO: i18n — 'Supplément' / 'Remise' have no direct keys */}
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
                  {/* TODO: i18n — instruction sentence has no direct key */}
                  Ouvrez <strong>Poids / Prix</strong> pour saisir le poids réel et confirmer le prix.
                </div>
              )}
            </div>
          </div>

          {/* Disclaimer légal */}
          <div className="card" style={{ padding: 16 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>
              {/* TODO: i18n — 'Déclaration légale' has no direct key */}
              <span style={{ fontSize: 14 }}>📋</span> Déclaration légale
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Objets de valeur */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '6px 8px', background: 'var(--bg-soft)', borderRadius: 5 }}>
                {/* TODO: i18n — 'Objets de valeur' has no direct key */}
                <span style={{ color: 'var(--ink-500)' }}>Objets de valeur</span>
                {parcel.hasValuable
                  // TODO: i18n — 'Déclaré' / 'Renonciation signée' have no direct keys
                  ? <span className="badge badge--dot badge--warn">Déclaré</span>
                  : parcel.waiverAccepted
                    ? <span className="badge badge--dot badge--ok">Renonciation signée</span>
                    : <span style={{ color: 'var(--ink-300)', fontSize: 12 }}>—</span>
                }
              </div>
              {parcel.hasValuable && parcel.declaredValue && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 8px', background: 'var(--brand-50)', borderRadius: 5 }}>
                  {/* TODO: i18n — 'Valeur déclarée' has no direct key */}
                  <span style={{ color: 'var(--ink-600)' }}>Valeur déclarée</span>
                  <span className="mono" style={{ fontWeight: 700, color: 'var(--ink-900)' }}>{parcel.declaredValue.toLocaleString('fr')} $ CAD</span>
                </div>
              )}
              {parcel.coverageFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 8px', background: 'var(--brand-50)', borderRadius: 5 }}>
                  {/* TODO: i18n — 'Couverture (20 %)' has no direct key */}
                  <span style={{ color: 'var(--ink-600)' }}>Couverture (20 %)</span>
                  <span className="mono" style={{ fontWeight: 700, color: 'var(--brand-700)' }}>+{parcel.coverageFee.toLocaleString('fr')} CAD</span>
                </div>
              )}
              {/* Marchandises interdites */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '6px 8px', background: 'var(--bg-soft)', borderRadius: 5 }}>
                {/* TODO: i18n — 'Marchandises interdites' has no direct key */}
                <span style={{ color: 'var(--ink-500)' }}>Marchandises interdites</span>
                {parcel.forbiddenAcknowledged
                  // TODO: i18n — 'Confirmé' / 'Non confirmé' have no direct keys
                  ? <span className="badge badge--dot badge--ok">Confirmé</span>
                  : <span style={{ color: 'var(--err-500)', fontSize: 12, fontWeight: 600 }}>Non confirmé</span>
                }
              </div>
              {/* Timestamp */}
              {parcel.disclaimerAcceptedAt && (
                <div style={{ fontSize: 11, color: 'var(--ink-300)', padding: '2px 8px' }}>
                  {/* TODO: i18n — 'Accepté le' has no direct key */}
                  Accepté le {new Date(parcel.disclaimerAcceptedAt).toLocaleDateString('fr-CA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          </div>

          {/* Campaign info */}
          <div className="card" style={{ padding: 16 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>
              {/* TODO: i18n — 'Campagne & Route' composite label has no direct key */}
              <I.Truck style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Campagne &amp; Route
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
                {t.campaigns.fields.departure} : {new Date(campaign.departureDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="card" style={{ padding: 16 }}>
            <div className="section-title" style={{ marginBottom: 14 }}>
              {/* TODO: i18n — 'Timeline' kept as-is (English term); t.parcels.detail.tabs.history is closest */}
              <I.History style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Timeline
            </div>
            {events.length === 0 ? (
              <div style={{ fontSize: 12.5, color: 'var(--ink-400)', fontStyle: 'italic' }}>{t.parcels.detail.activity}</div>
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
                            // TODO: i18n — 'ACTUEL' (current status indicator) has no direct key
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
                          {/* TODO: i18n — 'Système' (system author fallback) has no direct key */}
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

      {showDeleteModal && (
        <Modal title={t.common.delete} onClose={() => setShowDeleteModal(false)}>
          <div style={{ marginBottom: 16, fontSize: 14, color: 'var(--ink-700)', lineHeight: 1.6 }}>
            {/* TODO: i18n — delete confirmation sentence has no direct key */}
            Vous êtes sur le point de supprimer le colis <strong style={{ fontFamily: 'monospace' }}>{parcel.trackingCode}</strong> de <strong>{client.name}</strong>.
          </div>
          <div style={{ padding: '10px 14px', background: 'var(--bad-50)', border: '1px solid var(--bad-100)', borderRadius: 8, fontSize: 13, color: 'var(--bad-700)', marginBottom: 20 }}>
            {/* TODO: i18n — irreversible warning sentence has no direct key */}
            ⚠️ Cette action est irréversible. Le colis sera archivé et n'apparaîtra plus dans les listes.
          </div>
          {deleteError && (
            <div style={{ padding: '8px 12px', background: '#fee2e2', borderRadius: 7, fontSize: 13, color: '#dc2626', marginBottom: 12 }}>
              {deleteError}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn--ghost" onClick={() => setShowDeleteModal(false)}>{t.common.cancel}</button>
            <button
              disabled={deleting}
              onClick={async () => {
                setDeleting(true);
                setDeleteError('');
                try {
                  const res = await fetch('/api/parcels/' + id, { method: 'DELETE' });
                  const json = await res.json().catch(() => ({}));
                  if (res.ok) {
                    setShowDeleteModal(false);
                    onNav(campaign?.id ? '/campaign/' + campaign.id : '/parcels');
                  } else {
                    setDeleteError(json.error || t.common.error);
                  }
                } catch {
                  setDeleteError('Erreur réseau — veuillez réessayer.');
                } finally {
                  setDeleting(false);
                }
              }}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--bad-500)', color: 'white', fontSize: 13, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? .6 : 1 }}
            >
              {/* TODO: i18n — 'Suppression…' has no direct key */}
              {deleting ? 'Suppression…' : t.common.confirm}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function BlItemsEditor({ items, onChange, onSave, onCancel }) {
  const t = useAdminT();
  const upd = (idx, k, v) => onChange(its => its.map((it, i) => i === idx ? { ...it, [k]: v } : it));
  const add = () => onChange(its => [...its, { id: Date.now(), designation: '', description: '', type: 'carton', count: 1, nbPieces: '' }]);
  const del = (idx) => onChange(its => its.filter((_, i) => i !== idx));

  return (
    <div style={{ paddingTop: 8 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 8 }}>
        <thead>
          <tr style={{ background: 'var(--brand-100)' }}>
            {/* TODO: i18n — 'Désignation', 'Nb' have no direct keys */}
            {['Désignation', t.common.description, t.common.type, 'Nb', ''].map(h => (
              <th key={h} style={{ padding: '4px 6px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: 'var(--brand-800)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx}>
              <td style={{ padding: '3px 3px' }}>
                {/* TODO: i18n — placeholder 'Désignation' has no direct key */}
                <input className="input input--sm" value={it.designation ?? ''} onChange={e => upd(idx, 'designation', e.target.value)} placeholder="Désignation" />
              </td>
              <td style={{ padding: '3px 3px' }}>
                {/* TODO: i18n — placeholder 'Détails…' has no direct key */}
                <input className="input input--sm" value={it.description ?? ''} onChange={e => upd(idx, 'description', e.target.value)} placeholder="Détails…" />
              </td>
              <td style={{ padding: '3px 3px', width: 100 }}>
                {/* TODO: i18n — select options Carton/Paquet/Sachet/Bouteille have no direct keys */}
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
        {/* TODO: i18n — '+ Ligne' (add row) has no direct key */}
        <button className="btn btn--ghost btn--sm" onClick={add}>+ Ligne</button>
        <div style={{ flex: 1 }} />
        <button className="btn btn--ghost btn--sm" onClick={onCancel}>{t.common.cancel}</button>
        <button className="btn btn--brand btn--sm" onClick={onSave}>{t.common.save}</button>
      </div>
    </div>
  );
}

// TODO: i18n — WEIGHT_CATEGORIES labels are French; no direct keys available
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
  const t = useAdminT();
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
          {/* TODO: i18n — 'Poids & Prix' and 'Calculateur de prix détaillé' have no direct keys */}
          <div style={{ fontSize: 16, fontWeight: 700 }}>Poids &amp; Prix — {parcel.trackingCode}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>Calculateur de prix détaillé</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn--ghost" onClick={onClose}>{t.common.cancel}</button>
          <button className="btn btn--brand" onClick={handleSave} disabled={saving || !bd}>
            {saving ? t.common.saving : t.common.apply}
          </button>
        </div>
      </div>

      {/* Body — 2 colonnes */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', overflow: 'hidden' }}>

        {/* Colonne gauche — saisie */}
        <div style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Table articles */}
          <div>
            {/* TODO: i18n — 'Articles' has no direct key */}
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-400)', marginBottom: 8 }}>Articles</div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-soft)' }}>
                    {[t.common.description, t.common.category, t.common.weight + ' (kg)', ''].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <>
                      <tr key={idx} style={{ borderBottom: it.category === 'biere' ? 'none' : '1px solid var(--border-soft)' }}>
                        <td style={{ padding: '6px 8px' }}>
                          {/* TODO: i18n — placeholder 'Ex: Robes, Bière 33cl…' has no direct key */}
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
                              {/* TODO: i18n — '🍺 Frais SAQ :' and 'Nb casiers' have no direct keys */}
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
            {/* TODO: i18n — '+ Ajouter une ligne' has no direct key */}
            <button className="btn btn--ghost btn--sm" onClick={addItem} style={{ marginTop: 8 }}>+ Ajouter une ligne</button>
          </div>

          {/* Emballages */}
          <div>
            {/* TODO: i18n — 'Emballages' and packaging labels have no direct keys */}
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
            {/* TODO: i18n — 'Marge' has no direct key */}
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-400)', marginBottom: 8 }}>Marge</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input className="input mono" type="number" min="0" max="200" step="1" value={marginPct} onChange={e => setMarginPct(e.target.value)} style={{ width: 90 }} />
              <span style={{ fontSize: 13, color: 'var(--ink-500)' }}>%</span>
            </div>
          </div>
        </div>

        {/* Colonne droite — breakdown sticky */}
        <div style={{ background: '#f8f9fa', borderLeft: '1px solid var(--border)', overflowY: 'auto', padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* TODO: i18n — 'Détail du prix' has no direct key */}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-400)', marginBottom: 14 }}>Détail du prix</div>

          {!bd ? (
            // TODO: i18n — 'Saisir les poids pour voir le calcul.' has no direct key
            <div style={{ fontSize: 13, color: 'var(--ink-400)', fontStyle: 'italic' }}>Saisir les poids pour voir le calcul.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Ligne helper */}
              {[
                // TODO: i18n — 'Transport' breakdown label has no direct key
                ['Transport', bd.transport],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '5px 0', color: 'var(--ink-700)' }}>
                  <span>{label} ({bd.totalKg} kg)</span><span className="mono">{val?.toFixed(2)} $</span>
                </div>
              ))}

              {/* Supplements */}
              {bd.supplements?.map(s => (
                <div key={s.category} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: 'var(--ink-600)', paddingLeft: 10 }}>
                  {/* TODO: i18n — 'Suppl.' prefix has no direct key */}
                  <span>Suppl. {labelCat(s.category)} ({s.kg} kg × {s.rate >= 0 ? '+' : ''}{s.rate}$/kg)</span>
                  <span className="mono">{s.amount >= 0 ? '+' : ''}{s.amount?.toFixed(2)} $</span>
                </div>
              ))}

              {/* SAQ */}
              {bd.saqLines?.map((l, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: 'var(--warn-700)', paddingLeft: 10 }}>
                  {/* TODO: i18n — 'SAQ' and 'casiers' have no direct keys */}
                  <span>SAQ {l.format} × {l.nbCasiers} casiers</span>
                  <span className="mono">+{l.amount?.toFixed(2)} $</span>
                </div>
              ))}

              {bd.carton > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: 'var(--ink-600)' }}>
                  {/* TODO: i18n — 'Carton' breakdown label has no direct key */}
                  <span>Carton</span><span className="mono">{bd.carton?.toFixed(2)} $</span>
                </div>
              )}
              {bd.sacs > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: 'var(--ink-600)' }}>
                  {/* TODO: i18n — 'Sacs' breakdown label has no direct key */}
                  <span>Sacs</span><span className="mono">{bd.sacs?.toFixed(2)} $</span>
                </div>
              )}
              {bd.manutention > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: 'var(--ink-600)' }}>
                  {/* TODO: i18n — 'Manutention' breakdown label has no direct key */}
                  <span>Manutention</span><span className="mono">{bd.manutention?.toFixed(2)} $</span>
                </div>
              )}
              {bd.douane > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: 'var(--ink-600)' }}>
                  {/* TODO: i18n — 'Douane' breakdown label has no direct key */}
                  <span>Douane</span><span className="mono">{bd.douane?.toFixed(2)} $</span>
                </div>
              )}
              {bd.formalites > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: 'var(--ink-600)' }}>
                  {/* TODO: i18n — 'Formalités' breakdown label has no direct key */}
                  <span>Formalités</span><span className="mono">{bd.formalites?.toFixed(2)} $</span>
                </div>
              )}
              {bd.plastic > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: 'var(--ink-600)' }}>
                  {/* TODO: i18n — 'Conditionnement' breakdown label has no direct key */}
                  <span>Conditionnement</span><span className="mono">{bd.plastic?.toFixed(2)} $</span>
                </div>
              )}

              {/* Séparateur */}
              <div style={{ borderTop: '1.5px solid var(--border)', margin: '10px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: 'var(--ink-700)' }}>
                {/* TODO: i18n — 'Sous-total' has no direct key */}
                <span>Sous-total</span><span className="mono">{bd.sousTotal?.toFixed(2)} $</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: 'var(--ink-600)' }}>
                {/* TODO: i18n — 'Marge' breakdown label has no direct key */}
                <span>Marge ({bd.marginPct}%)</span><span className="mono">+{bd.marge?.toFixed(2)} $</span>
              </div>

              <div style={{ borderTop: '2px solid var(--ink-900)', margin: '10px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: 'var(--ink-900)', padding: '4px 0' }}>
                {/* TODO: i18n — 'Prix client' has no direct key */}
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
                      {/* TODO: i18n — 'Comparaison' has no direct key */}
                      Comparaison
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 8px', background: 'var(--bg-soft)', borderRadius: 4 }}>
                        {/* TODO: i18n — 'Estimation réservation' has no direct key */}
                        <span style={{ color: 'var(--ink-400)' }}>Estimation réservation</span>
                        <span className="mono" style={{ color: 'var(--ink-400)', textDecoration: 'line-through' }}>{estimated.toLocaleString('fr')} CAD</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '4px 8px', background: 'var(--brand-50)', borderRadius: 4 }}>
                        {/* TODO: i18n — 'Prix réel (pesée)' has no direct key */}
                        <span style={{ color: 'var(--ink-700)', fontWeight: 600 }}>Prix réel (pesée)</span>
                        <span className="mono" style={{ fontWeight: 700, color: 'var(--ink-900)' }}>{real.toLocaleString('fr')} CAD</span>
                      </div>
                      {diff === 0 ? (
                        // TODO: i18n — 'Identique à l\'estimation' has no direct key
                        <div style={{ fontSize: 11.5, color: 'var(--ok-700)', textAlign: 'center', padding: '4px 0' }}>✓ Identique à l'estimation</div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 8px', background: diff > 0 ? 'var(--warn-50)' : 'var(--ok-50)', border: `1px solid ${diff > 0 ? 'var(--warn-200)' : 'var(--ok-100)'}`, borderRadius: 6 }}>
                          {/* TODO: i18n — 'Supplément' / 'Remise' have no direct keys */}
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
                        {/* TODO: i18n — WhatsApp notification note has no direct key */}
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
  const t = useAdminT();
  const payUrl = (typeof window !== 'undefined' ? window.location.origin : '') + '/payer/' + parcel.id;
  const [copied, setCopied]     = useState(false);
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [sendError, setSendError] = useState('');

  const handleCopy = () => {
    navigator.clipboard?.writeText(payUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWA = async () => {
    setSending(true);
    setSendError('');
    try {
      const res  = await fetch('/api/parcels/' + parcel.id + '/send-payment-link', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) setSendError(json.error || t.common.error);
      else setSent(true);
    } catch { setSendError(t.common.networkError); }
    finally { setSending(false); }
  };

  const amountLabel = (parcel.payment?.amount ?? parcel.priceXaf)?.toLocaleString('fr') ?? '—';

  return (
    <Modal width={640} onClose={onClose}
      title="Lien de paiement Interac"
      sub={parcel.trackingCode + ' · ' + amountLabel + ' CAD dû'}
      footer={<button className="btn btn--ghost" onClick={onClose}>{t.common.close}</button>}>
      <div style={{ display: 'grid', gap: 16 }}>

        {/* URL + copy */}
        <div>
          {/* TODO: i18n — 'Lien de paiement' section label has no direct key */}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-400)', marginBottom: 8 }}>Lien de paiement</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="mono" style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-soft)', border: '1px solid var(--border)', fontSize: 11.5, color: 'var(--ink-600)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderRadius: 6 }}>{payUrl}</div>
            {/* TODO: i18n — 'Copier' / '✓ Copié' have no direct keys in t.common */}
            <button className="btn btn--ghost btn--sm" onClick={handleCopy} style={{ minWidth: 70 }}>{copied ? '✓ Copié' : 'Copier'}</button>
          </div>
        </div>

        {/* Client info */}
        <div style={{ padding: '10px 14px', background: 'var(--warn-50)', border: '1px solid var(--warn-100)', borderRadius: 8, fontSize: 12.5, color: 'var(--ink-700)', lineHeight: 1.7 }}>
          <strong>{parcel.client?.name}</strong><br />
          {parcel.client?.phone && <span>📱 {parcel.client.phone}</span>}
          {parcel.client?.email && <><br /><span>✉️ {parcel.client.email}</span></>}
        </div>

        {/* WhatsApp send */}
        <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 14 }}>
          {/* TODO: i18n — 'Envoyer au client' has no direct key */}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-400)', marginBottom: 10 }}>Envoyer au client</div>
          {sent ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--ok-50)', border: '1px solid var(--ok-200)', borderRadius: 8, fontSize: 13, color: 'var(--ok-700)' }}>
              {/* TODO: i18n — '✓ Message envoyé via WhatsApp à' has no direct key */}
              ✓ Message envoyé via WhatsApp à {parcel.client?.phone || parcel.client?.email}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn btn--brand" style={{ justifyContent: 'center' }} onClick={handleSendWA} disabled={sending}>
                <I.Chat />{sending ? t.common.sending : 'Envoyer par WhatsApp'}
              </button>
              {sendError && <div style={{ fontSize: 12, color: 'var(--bad-600)', padding: '6px 10px', background: 'var(--bad-50)', borderRadius: 6, border: '1px solid var(--bad-200)' }}>{sendError}</div>}
              <div style={{ fontSize: 11.5, color: 'var(--ink-400)', lineHeight: 1.5 }}>
                {/* TODO: i18n — payment instructions sentence has no direct key */}
                Le client recevra les instructions de paiement Interac avec le lien sécurisé.
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
