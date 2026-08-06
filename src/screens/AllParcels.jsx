import { useState, useEffect, useRef } from 'react';
import { useAdminT } from '../lib/useAdminT.js';
import { STATUS } from '../data.js';
import I from '../components/Icons.jsx';
import { Bi, Avatar, ParcelActionsMenu, Modal, useCan } from '../components/Shell.jsx';
import { Pagination } from '../components/Pagination.jsx';

export default function AllParcelsScreen({ onNav, initialSearch = '' }) {
  const can = useCan();
  const t = useAdminT();
  const [tab, setTab]                     = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [search, setSearch]               = useState(initialSearch);
  const [page, setPage]                   = useState(1);
  const [pageSize, setPageSize]           = useState(25);
  const [allParcels, setAllParcels]       = useState([]);
  const [campaigns, setCampaigns]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selected, setSelected]           = useState([]);
  const [cancelingParcel, setCancelingParcel] = useState(null);
  const [confirmDeleteParcel, setConfirmDeleteParcel] = useState(null);
  const [deleting, setDeleting]           = useState(false);
  const [deleteError, setDeleteError]     = useState(null);
  const [repairOpen, setRepairOpen]       = useState(false);
  const [repairCodes, setRepairCodes]     = useState('');
  const [repairLoading, setRepairLoading] = useState(false);
  const [repairResults, setRepairResults] = useState(null);
  const [syncing, setSyncing]             = useState(false);
  const [syncResult, setSyncResult]       = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/parcels').then(r => r.json()),
      fetch('/api/campaigns').then(r => r.json()),
    ]).then(([pData, cData]) => {
      setAllParcels(Array.isArray(pData) ? pData : []);
      setCampaigns(Array.isArray(cData) ? cData : []);
      setLoading(false);
    });
  }, []);
  useEffect(() => { setSelected([]); }, [tab, campaignFilter, search]);

  const handleSelectOne = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const handleSelectAll = (ids, checked) => {
    if (checked) setSelected(prev => [...new Set([...prev, ...ids])]);
    else setSelected(prev => prev.filter(x => !ids.includes(x)));
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDeleteParcel) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/parcels/${confirmDeleteParcel.id}`, { method: 'DELETE' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(d.error || 'Erreur lors de la suppression.');
        setDeleting(false);
        return;
      }
      setAllParcels(prev => prev.filter(p => p.id !== confirmDeleteParcel.id));
      setConfirmDeleteParcel(null);
    } catch {
      setDeleteError('Erreur réseau — veuillez réessayer.');
    }
    setDeleting(false);
  };

  const handleRepairPayments = async () => {
    const trackingCodes = repairCodes
      .split(/[\n,\s]+/)
      .map(s => s.trim())
      .filter(Boolean);
    if (trackingCodes.length === 0) return;
    setRepairLoading(true);
    setRepairResults(null);
    try {
      const res = await fetch('/api/admin/repair-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingCodes }),
      });
      const d = await res.json();
      setRepairResults(d.results ?? []);
      // Refresh parcel list to reflect new payment statuses
      fetch('/api/parcels').then(r => r.json()).then(data => {
        if (Array.isArray(data)) setAllParcels(data);
      });
    } catch {
      setRepairResults([{ trackingCode: '—', ok: false, message: 'Erreur réseau' }]);
    }
    setRepairLoading(false);
  };

  const handleSyncStatuses = async () => {
    if (!confirm('Synchroniser les statuts de tous les colis avec leur cargaison ? Les statuts bloqués à "Enregistré" seront mis à jour.')) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/admin/sync-parcel-statuses', { method: 'POST' });
      const d = await res.json();
      setSyncResult(d);
      if (d.totalUpdated > 0) {
        fetch('/api/parcels').then(r => r.json()).then(data => {
          if (Array.isArray(data)) setAllParcels(data);
        });
      }
    } catch {
      setSyncResult({ ok: false, error: 'Erreur réseau' });
    }
    setSyncing(false);
  };

  const handleCancelConfirm = async (parcel, reason) => {
    const res = await fetch(`/api/parcels/${parcel.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ann', cancellationReason: reason }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setDeleteError(d.error || 'Erreur');
      setTimeout(() => setDeleteError(null), 6000);
      return;
    }
    setAllParcels(prev => prev.map(p => p.id === parcel.id ? { ...p, status: 'ann', paid: 'ann', cancellationReason: reason } : p));
    setCancelingParcel(null);
  };

  const filtered = allParcels.filter(p => {
    if (campaignFilter !== 'all' && p.campaignId !== campaignFilter) return false;
    if (tab === 'ann')     return p.status === 'ann';
    if (tab === 'pending') return (p.paid === 'pending' || p.paid === 'unpaid') && p.status !== 'ann';
    if (tab === 'overrun') return p.overrun && p.status !== 'ann';
    if (tab === 'home')    return p.delivery === 'home' && p.status !== 'ann';
    // "Tous" exclut les annulés
    if (p.status === 'ann') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (p.code || '').toLowerCase().includes(q) ||
             (p.senderName || '').toLowerCase().includes(q) ||
             (p.recipName || '').toLowerCase().includes(q) ||
             (p.campaign || '').toLowerCase().includes(q);
    }
    return true;
  });
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const pagedIds = paged.map(p => p.id);
  const allParcelsChecked = pagedIds.length > 0 && pagedIds.every(id => selected.includes(id));
  const someParcelsChecked = pagedIds.some(id => selected.includes(id));

  function exportCSV(onlySelected = false) {
    const PAYMENT_LABEL = { paid: 'Payé', pending: 'En cours', unpaid: 'En cours' };
    const STATUS_LABEL  = { enr: 'Enregistré', rec: 'Reçu entrepôt', pre: 'Vérifié/Préparé', exp: 'Expédié', tra: 'En transit', apd: 'Arrivé pays dest.', dou: 'Aux douanes', ins: 'Inspection', ret: 'Retenu', lib: 'Libéré', ard: 'Entrepôt dest.', ver: 'Vérification', pdl: 'Prêt livraison', liv: 'En livraison', ok: 'Livré', adr: 'Adresse incompl.', tdl: 'Tentative livr.', rte: 'Retour entrepôt', dom: 'Endommagé', cla: 'Réclamation' };
    const headers = ['Code', 'Cargaison', 'Expéditeur', 'Tél expéditeur', 'Destinataire', 'Ville', 'Poids (kg)', 'Montant (CAD)', 'Paiement', 'Statut', 'Date'];
    const data = onlySelected && selected.length > 0 ? filtered.filter(p => selected.includes(p.id)) : filtered;
    const rows = data.map(p => [
      p.code,
      p.campaign,
      p.senderName,
      p.senderPhone,
      p.recipName,
      p.recipCity,
      p.actualKg,
      p.amount,
      PAYMENT_LABEL[p.paid] ?? p.paid,
      STATUS_LABEL[p.status] ?? p.status,
      p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-CA') : '',
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `colis${onlySelected && selected.length > 0 ? '-selection' : ''}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__title">{t.parcels.title}</div>
          {/* TODO: no translation key for page subtitle */}
          <div className="page__sub">Vue globale — colis de toutes les cargaisons, filtrables par statut</div>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost" onClick={exportCSV}><I.Download />{t.parcels.exportCsv} ({filtered.length})</button>
          {can('parcels', 'admin') && (
            <button className="btn btn--ghost" onClick={() => { setRepairOpen(true); setRepairCodes(''); setRepairResults(null); }}
              title="Rétablir des paiements manquants">
              <I.Check style={{ width: 14, height: 14 }} /> Rétablir paiements
            </button>
          )}
          {can('parcels', 'admin') && (
            <button className="btn btn--ghost" onClick={handleSyncStatuses} disabled={syncing}
              title="Mettre à jour les statuts colis selon leur cargaison">
              <I.Route style={{ width: 14, height: 14 }} /> {syncing ? 'Sync…' : 'Sync statuts'}
            </button>
          )}
          {syncResult && (
            <span style={{ fontSize: 12, color: syncResult.totalUpdated > 0 ? 'var(--ok-600)' : 'var(--ink-400)', fontWeight: 600 }}>
              {syncResult.totalUpdated > 0 ? `✓ ${syncResult.totalUpdated} colis mis à jour` : '✓ Déjà à jour'}
            </span>
          )}
          {can('parcels', 'create') && <button className="btn btn--brand" onClick={() => onNav('/parcels/new')}><I.Plus />Nouveau colis</button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 18 }}>
        <div className="kpi">
          <div className="kpi__label">{t.campaigns.kpi.parcels}</div>
          <div className="kpi__value">{allParcels.filter(p => p.status !== 'ann').length.toLocaleString('fr')}</div>
          <div className="kpi__delta">8 cargaisons</div>
        </div>
        <div className="kpi">
          {/* TODO: no translation key for "Poids cumulé" */}
          <div className="kpi__label">Poids cumulé</div>
          <div className="kpi__value">{allParcels.filter(p => p.status !== 'ann').reduce((a, p) => a + p.actualKg, 0).toFixed(0)} <span style={{ fontSize: 14, color: 'var(--ink-400)' }}>kg</span></div>
        </div>
        <div className="kpi" style={{ background: 'var(--ok-50)', borderColor: 'var(--ok-100)' }}>
          <div className="kpi__label" style={{ color: 'var(--ok-700)' }}>{t.paymentStatus.completed}</div>
          <div className="kpi__value" style={{ color: 'var(--ok-700)' }}>{allParcels.filter(p => p.paid === 'paid' && p.status !== 'ann').length}</div>
        </div>
        <div className="kpi" style={{ background: 'var(--warn-50)', borderColor: 'var(--warn-100)' }}>
          <div className="kpi__label" style={{ color: 'var(--warn-700)' }}>En cours</div>
          <div className="kpi__value" style={{ color: 'var(--warn-700)' }}>{allParcels.filter(p => (p.paid === 'pending' || p.paid === 'unpaid') && p.status !== 'ann').length}</div>
        </div>
        <div className="kpi" style={{ background: 'var(--warn-50)', borderColor: 'var(--warn-100)' }}>
          <div className="kpi__label" style={{ color: 'var(--warn-700)' }}>Surpoids</div>
          <div className="kpi__value" style={{ color: 'var(--warn-700)' }}>{allParcels.filter(p => p.overrun).length}</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="tabs">
          <button className={'tab ' + (tab === 'all' ? 'is-active' : '')} onClick={() => setTab('all')}>{t.parcels.filterAll} <span className="count">{allParcels.filter(p => p.status !== 'ann').length}</span></button>
          <button className={'tab ' + (tab === 'pending' ? 'is-active' : '')} onClick={() => setTab('pending')}>En cours <span className="count">{allParcels.filter(p => (p.paid === 'pending' || p.paid === 'unpaid') && p.status !== 'ann').length}</span></button>
          <button className={'tab ' + (tab === 'home' ? 'is-active' : '')} onClick={() => setTab('home')}>À livrer</button>
          <button className={'tab ' + (tab === 'overrun' ? 'is-active' : '')} onClick={() => setTab('overrun')}>Dépassements</button>
          <button className={'tab ' + (tab === 'ann' ? 'is-active' : '')} onClick={() => setTab('ann')} style={{ color: tab === 'ann' ? undefined : 'var(--ink-400)' }}>Annulés <span className="count">{allParcels.filter(p => p.status === 'ann').length}</span></button>
        </div>
        <div className="spacer" />
        <div style={{ position: 'relative' }}>
          <I.Search style={{ position: 'absolute', left: 10, top: 9, width: 14, height: 14, color: 'var(--ink-400)' }} />
          <input className="input input--sm" placeholder={t.parcels.searchPlaceholder} style={{ width: 260, paddingLeft: 32 }}
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 6px 4px 10px', border: '1px solid var(--border)', borderRadius: 7, background: 'white', fontSize: 12 }}>
          <I.Plane style={{ width: 12, height: 12, color: 'var(--ink-400)' }} />
          <select value={campaignFilter} onChange={e => setCampaignFilter(e.target.value)} style={{ border: 0, background: 'transparent', fontWeight: 600, paddingRight: 4 }}>
            {/* TODO: no translation key for "Toutes cargaisons" campaign filter */}
            <option value="all">Toutes cargaisons</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
        </div>
      </div>

      {deleteError && (
        <div style={{ padding: '10px 14px', background: 'var(--bad-50)', border: '1px solid var(--bad-200)', borderRadius: 8, marginBottom: 8, fontSize: 13, color: 'var(--bad-700)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <I.Alert style={{ width: 14, height: 14, flexShrink: 0 }} />
          {deleteError}
          <button onClick={() => setDeleteError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bad-500)', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {selected.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'var(--brand-50)', border: '1px solid var(--brand-200)', borderBottom: 0, borderRadius: '8px 8px 0 0', fontSize: 13 }}>
          <span style={{ fontWeight: 600, color: 'var(--brand-700)' }}>{selected.length} sélectionné(s)</span>
          <div style={{ flex: 1 }} />
          <button className="btn btn--ghost btn--sm" onClick={() => exportCSV(true)} style={{ fontSize: 12 }}>
            <I.Download style={{ width: 12, height: 12 }} /> Exporter sélection
          </button>
          <button className="btn btn--ghost btn--sm" onClick={() => setSelected([])} style={{ fontSize: 12 }}>✕ Désélectionner</button>
        </div>
      )}

      <table className="tbl" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <thead>
          <tr>
            <th style={{ width: 32, borderRadius: 0 }}>
              <input type="checkbox"
                checked={allParcelsChecked}
                ref={el => { if (el) el.indeterminate = someParcelsChecked && !allParcelsChecked; }}
                onChange={e => handleSelectAll(pagedIds, e.target.checked)}
                style={{ accentColor: 'var(--brand-500)' }} />
            </th>
            <th>{t.parcels.table.campaign}</th>
            <th>{t.parcels.table.trackingId}</th>
            {/* TODO: no translation key for "Expéditeur" (sender) */}
            <th>Expéditeur</th>
            {/* TODO: no translation key for "Destinataire" (recipient) */}
            <th>Destinataire</th>
            <th>{t.parcels.table.weight}</th>
            <th style={{ textAlign: 'right' }}>{t.parcels.table.amount}</th>
            <th>{t.parcels.table.payment}</th>
            <th>Statut colis</th>
            {/* TODO: no translation key for "Livraison" delivery-type column */}
            <th>Livraison</th>
            <th title="Dernier message WhatsApp">WA</th>
            <th style={{ borderRadius: 0, width: 44 }}></th>
          </tr>
        </thead>
        <tbody>
          {paged.map(p => (
            <tr key={p.id}>
              <td onClick={e => e.stopPropagation()}>
                <input type="checkbox"
                  checked={selected.includes(p.id)}
                  onChange={() => handleSelectOne(p.id)}
                  style={{ accentColor: 'var(--brand-500)' }} />
              </td>
              <td>
                <a className="mono" onClick={() => onNav('/campaign/' + p.campaignId)} style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-700)', cursor: 'pointer' }}>{p.campaign}</a>
              </td>
              <td><a className="mono" style={{ fontWeight: 700, color: 'var(--brand-700)', cursor: 'pointer' }} onClick={() => onNav('/parcels/' + p.id.split('-').pop())}>{p.code}</a></td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar initials={p.senderName.split(' ').map(x => x[0]).join('')} color={(p.id.charCodeAt(0) % 8) + 1} size="sm" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12.5 }}>{p.senderName}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>{p.senderPhone}</div>
                  </div>
                </div>
              </td>
              <td>
                <div style={{ fontWeight: 600, fontSize: 12.5 }}>{p.recipName}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>{p.recipCity}</div>
              </td>
              <td>
                <div className="mono" style={{ fontSize: 12 }}>
                  <strong>{p.actualKg}</strong> kg
                  {p.overrun && <span style={{ marginLeft: 4, color: 'var(--warn-700)' }}>⚠</span>}
                </div>
              </td>
              <td style={{ textAlign: 'right' }}>
                {p.confirmedPriceXaf != null && p.adjustmentStatus !== 'none' ? (
                  <>
                    <div>
                      <span className="mono" style={{ fontWeight: 700 }}>{p.confirmedPriceXaf.toLocaleString('fr')}</span>
                      <span style={{ fontSize: 11, color: 'var(--ink-400)', marginLeft: 3 }}>CAD</span>
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--ink-400)', textDecoration: 'line-through', fontFamily: 'var(--font-mono)' }}>
                      Est. {(p.priceXaf ?? p.amount ?? 0).toLocaleString('fr')}
                    </div>
                  </>
                ) : (
                  <>
                    <span className="mono" style={{ fontWeight: 700 }}>{(p.amount ?? p.priceXaf ?? 0).toLocaleString('fr')}</span>
                    <span style={{ fontSize: 11, color: 'var(--ink-400)', marginLeft: 3 }}>CAD</span>
                  </>
                )}
              </td>
              <td>
                {(() => {
                  const ps = STATUS.payment[p.paid] ?? STATUS.payment['pending'];
                  return <span className={'badge badge--dot badge--' + ps.cls}>{ps.label}</span>;
                })()}
              </td>
              <td>
                {(() => {
                  const ps = STATUS.parcel[p.status] ?? { label: p.status, cls: 'neutral' };
                  return <span className={'badge badge--dot badge--' + ps.cls} style={{ fontSize: 11 }}>{ps.label}</span>;
                })()}
              </td>
              <td>
                <span style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--ink-600)' }}>
                  {/* TODO: no translation keys for "Domicile" and "Retrait" delivery types */}
                  {p.delivery === 'home' ? <><I.Truck style={{ width: 13, height: 13 }} /> Domicile</> : <><I.Warehouse style={{ width: 13, height: 13 }} /> Retrait</>}
                </span>
              </td>
              <td>
                {p.lastWhatsapp ? (
                  <>
                    {/* TODO: no translation keys for WhatsApp "Envoyé"/"Échec" status labels */}
                    <span
                      title={`${p.lastWhatsapp.status === 'sent' ? 'Envoyé' : 'Échec'} · ${new Date(p.lastWhatsapp.sentAt).toLocaleDateString('fr-CA', { day: '2-digit', month: '2-digit' })}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 3, cursor: 'default' }}
                    >
                      <svg viewBox="0 0 24 24" fill={p.lastWhatsapp.status === 'sent' ? '#25D366' : '#ef4444'} width="14" height="14">
                        <path d="M17.5 14.4c-.3-.1-1.7-.9-2-1s-.5-.1-.7.1c-.2.3-.7 1-.9 1.1-.2.2-.3.2-.6 0-.3-.1-1.2-.5-2.3-1.4-.8-.7-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5 0-.2 0-.4-.1-.5 0-.1-.7-1.6-1-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.4-.3.3-1 1-1 2.4s1 2.8 1.2 3.1c.2.2 2 3 4.8 4.3.7.3 1.2.4 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.3.3-.7.3-1.2.2-1.3-.1-.2-.3-.3-.6-.4zM12 21a9 9 0 0 1-4.6-1.3L3 21l1.3-4.3A9 9 0 1 1 12 21z" />
                      </svg>
                      <span style={{ fontSize: 10, color: 'var(--ink-400)' }}>
                        {new Date(p.lastWhatsapp.sentAt).toLocaleDateString('fr-CA', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--ink-300)' }}>—</span>
                )}
              </td>
              <td style={{ overflow: 'visible' }}>
                {p.status === 'ann'
                  ? <span className="badge" title={p.cancellationReason || 'Aucune raison renseignée'} style={{ background: 'var(--bad-50)', color: 'var(--bad-700)', border: '1px solid var(--bad-200)', fontSize: 11, cursor: 'help' }}>Annulé</span>
                  : <ParcelActionsMenu
                      parcel={{ ...p, id: p.id.split('-').pop() }}
                      onNav={onNav}
                      isLocked={false}
                      onDelete={can('parcels', 'delete') ? () => setConfirmDeleteParcel(p) : undefined}
                      onCancel={can('parcels', 'delete') ? () => setCancelingParcel(p) : undefined}
                    />
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination total={filtered.length} page={page} pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />

      {cancelingParcel && (
        <CancelParcelModal
          parcel={cancelingParcel}
          onClose={() => setCancelingParcel(null)}
          onConfirm={handleCancelConfirm}
        />
      )}

      {repairOpen && (
        <Modal
          title="Rétablir des paiements manquants"
          sub="Crée un paiement 'Réglé' pour chaque colis sans enregistrement de paiement"
          width={520}
          onClose={() => { setRepairOpen(false); setRepairResults(null); }}
          footer={
            repairResults ? (
              <>
                <div style={{ flex: 1 }} />
                <button className="btn btn--ghost" onClick={() => { setRepairOpen(false); setRepairResults(null); }}>Fermer</button>
                <button className="btn btn--ghost" onClick={() => { setRepairResults(null); setRepairCodes(''); }}>Nouveau lot</button>
              </>
            ) : (
              <>
                <div style={{ flex: 1 }} />
                <button className="btn btn--ghost" onClick={() => setRepairOpen(false)}>Annuler</button>
                <button
                  className="btn btn--brand"
                  onClick={handleRepairPayments}
                  disabled={repairLoading || !repairCodes.trim()}
                >
                  {repairLoading ? 'Traitement…' : 'Rétablir les paiements'}
                </button>
              </>
            )
          }
        >
          {repairResults ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 13, color: 'var(--ink-500)', marginBottom: 4 }}>
                {repairResults.filter(r => r.ok).length} paiement(s) créé(s) · {repairResults.filter(r => !r.ok).length} ignoré(s)
              </div>
              {repairResults.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 8,
                  background: r.ok ? 'var(--ok-50)' : 'var(--bad-50)',
                  border: `1px solid ${r.ok ? 'var(--ok-100)' : 'var(--bad-100)'}`,
                  fontSize: 13,
                }}>
                  <span style={{ fontFamily: 'var(--ff-mono)', fontWeight: 700, color: r.ok ? 'var(--ok-700)' : 'var(--bad-700)', minWidth: 100 }}>
                    {r.trackingCode}
                  </span>
                  <span style={{ flex: 1, color: r.ok ? 'var(--ok-700)' : 'var(--bad-600)' }}>
                    {r.ok ? `✓ Paiement créé — ${r.amount?.toLocaleString('fr')} CAD` : `✗ ${r.message}`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: '10px 14px', background: 'var(--info-50, #eff6ff)', border: '1px solid var(--info-100, #dbeafe)', borderRadius: 8, fontSize: 13, color: 'var(--info-700, #1d4ed8)' }}>
                Entrez les codes colis (un par ligne, ou séparés par des virgules/espaces). Un paiement "Réglé" sera créé pour chaque colis sans paiement existant, en utilisant le montant enregistré.
              </div>
              <div>
                <label className="label">Codes colis</label>
                <textarea
                  className="input"
                  rows={6}
                  placeholder={'JMS-62042\nJMS-65120\nJMS-21541\nJMS-63753'}
                  value={repairCodes}
                  onChange={e => setRepairCodes(e.target.value)}
                  style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, resize: 'vertical' }}
                />
              </div>
            </div>
          )}
        </Modal>
      )}

      {confirmDeleteParcel && (
        <Modal
          title="Supprimer ce colis"
          sub={`${confirmDeleteParcel.code} · ${confirmDeleteParcel.senderName}`}
          width={420}
          onClose={() => { setConfirmDeleteParcel(null); setDeleteError(null); }}
          footer={
            <>
              <div style={{ flex: 1 }} />
              <button className="btn btn--ghost" onClick={() => { setConfirmDeleteParcel(null); setDeleteError(null); }}>Annuler</button>
              <button
                className="btn"
                style={{ background: 'var(--bad-600)', color: 'white' }}
                onClick={handleDeleteConfirmed}
                disabled={deleting}
              >
                <I.Trash style={{ width: 13, height: 13 }} />
                {deleting ? 'Suppression…' : 'Supprimer définitivement'}
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: '12px 14px', background: 'var(--bad-50)', border: '1px solid var(--bad-200)', borderRadius: 8, fontSize: 13, color: 'var(--bad-700)' }}>
              Cette action est <strong>irréversible</strong>. Le colis et son historique seront définitivement supprimés.
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>
              Seuls les colis au statut <strong>Enregistré</strong> ou <strong>Reçu entrepôt</strong> peuvent être supprimés.
              Pour les autres statuts, utilisez l'<strong>annulation</strong>.
            </div>
            {deleteError && (
              <div style={{ padding: '10px 14px', background: 'var(--bad-50)', border: '1px solid var(--bad-300)', borderRadius: 8, fontSize: 13, color: 'var(--bad-700)', fontWeight: 600 }}>
                {deleteError}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

const CANCEL_REASONS = [
  'Dépôt jamais effectué',
  'Client injoignable',
  'Annulation à la demande du client',
  'Poids/volume non conforme',
  'Autre',
];

function CancelParcelModal({ parcel, onClose, onConfirm }) {
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    await onConfirm(parcel, reason + (note.trim() ? ` — ${note.trim()}` : ''));
    setSaving(false);
  };

  return (
    <Modal
      title="Annuler la réservation"
      sub={`Colis ${parcel.code} · ${parcel.senderName}`}
      width={480}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Retour</button>
          <button
            className="btn"
            style={{ background: 'var(--bad-600)', color: 'white' }}
            onClick={handleSubmit}
            disabled={saving}>
            <I.Ban style={{ width: 13, height: 13 }} />
            {saving ? 'Annulation…' : 'Confirmer l\'annulation'}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ padding: '10px 14px', background: 'var(--warn-50)', border: '1px solid var(--warn-200)', borderRadius: 8, fontSize: 13, color: 'var(--warn-800)' }}>
          ⚠ Ce colis sera marqué comme annulé et retiré des montants impayés. L'action est réversible via la modification du statut.
        </div>
        <div>
          <label className="label">Raison de l'annulation *</label>
          <select className="select" value={reason} onChange={e => setReason(e.target.value)}>
            {CANCEL_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Précisions (optionnel)</label>
          <input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="Détails complémentaires…" />
        </div>
      </div>
    </Modal>
  );
}
