import { useState, useEffect } from 'react';
import { STATUS } from '../data.js';
import I from '../components/Icons.jsx';
import { Bi, Avatar, ParcelActionsMenu, useCan } from '../components/Shell.jsx';
import { Pagination } from '../components/Pagination.jsx';

export default function AllParcelsScreen({ onNav, initialSearch = '' }) {
  const can = useCan();
  const [tab, setTab]                     = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [search, setSearch]               = useState(initialSearch);
  const [page, setPage]                   = useState(1);
  const [pageSize, setPageSize]           = useState(25);
  const [allParcels, setAllParcels]       = useState([]);
  const [campaigns, setCampaigns]         = useState([]);
  const [loading, setLoading]             = useState(true);

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

  const filtered = allParcels.filter(p => {
    if (campaignFilter !== 'all' && p.campaignId !== campaignFilter) return false;
    if (tab === 'unpaid') return p.paid === 'unpaid';
    if (tab === 'pending') return p.paid === 'pending';
    if (tab === 'overrun') return p.overrun;
    if (tab === 'home') return p.delivery === 'home';
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

  function exportCSV() {
    const PAYMENT_LABEL = { paid: 'Payé', pending: 'En cours', unpaid: 'Impayé' };
    const STATUS_LABEL  = { en_attente: 'En attente', recu: 'Reçu', en_transit: 'En transit', en_douane: 'En douane', arrive: 'Arrivé', livre: 'Livré' };
    const headers = ['Code', 'Cargaison', 'Expéditeur', 'Tél expéditeur', 'Destinataire', 'Ville', 'Poids (kg)', 'Montant (CAD)', 'Paiement', 'Statut', 'Date'];
    const rows = filtered.map(p => [
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
    a.download = `colis-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__title"><Bi fr="Tous les colis" en="All parcels" /></div>
          <div className="page__sub">Vue globale — colis de toutes les cargaisons, filtrables par statut</div>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost" onClick={exportCSV}><I.Download />Export CSV ({filtered.length})</button>
          {can('parcels', 'create') && <button className="btn btn--brand" onClick={() => onNav('/parcels/new')}><I.Plus />Nouveau colis</button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 18 }}>
        <div className="kpi">
          <div className="kpi__label">Total colis <span style={{ textTransform: 'none', color: 'var(--ink-300)' }}>/ Parcels</span></div>
          <div className="kpi__value">{allParcels.length.toLocaleString('fr')}</div>
          <div className="kpi__delta">8 cargaisons</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Poids cumulé</div>
          <div className="kpi__value">{allParcels.reduce((a, p) => a + p.actualKg, 0).toFixed(0)} <span style={{ fontSize: 14, color: 'var(--ink-400)' }}>kg</span></div>
        </div>
        <div className="kpi" style={{ background: 'var(--ok-50)', borderColor: 'var(--ok-100)' }}>
          <div className="kpi__label" style={{ color: 'var(--ok-700)' }}>Payés</div>
          <div className="kpi__value" style={{ color: 'var(--ok-700)' }}>{allParcels.filter(p => p.paid === 'paid').length}</div>
        </div>
        <div className="kpi" style={{ background: 'var(--bad-50)', borderColor: 'var(--bad-100)' }}>
          <div className="kpi__label" style={{ color: 'var(--bad-700)' }}>Impayés</div>
          <div className="kpi__value" style={{ color: 'var(--bad-700)' }}>{allParcels.filter(p => p.paid === 'unpaid').length}</div>
        </div>
        <div className="kpi" style={{ background: 'var(--warn-50)', borderColor: 'var(--warn-100)' }}>
          <div className="kpi__label" style={{ color: 'var(--warn-700)' }}>Dépassements</div>
          <div className="kpi__value" style={{ color: 'var(--warn-700)' }}>{allParcels.filter(p => p.overrun).length}</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="tabs">
          <button className={'tab ' + (tab === 'all' ? 'is-active' : '')} onClick={() => setTab('all')}>Tous <span className="count">{allParcels.length}</span></button>
          <button className={'tab ' + (tab === 'unpaid' ? 'is-active' : '')} onClick={() => setTab('unpaid')}>Impayés <span className="count">{allParcels.filter(p => p.paid === 'unpaid').length}</span></button>
          <button className={'tab ' + (tab === 'pending' ? 'is-active' : '')} onClick={() => setTab('pending')}>En cours</button>
          <button className={'tab ' + (tab === 'home' ? 'is-active' : '')} onClick={() => setTab('home')}>À livrer</button>
          <button className={'tab ' + (tab === 'overrun' ? 'is-active' : '')} onClick={() => setTab('overrun')}>Dépassements</button>
        </div>
        <div className="spacer" />
        <div style={{ position: 'relative' }}>
          <I.Search style={{ position: 'absolute', left: 10, top: 9, width: 14, height: 14, color: 'var(--ink-400)' }} />
          <input className="input input--sm" placeholder="Code, expéditeur, destinataire..." style={{ width: 260, paddingLeft: 32 }}
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 6px 4px 10px', border: '1px solid var(--border)', borderRadius: 7, background: 'white', fontSize: 12 }}>
          <I.Plane style={{ width: 12, height: 12, color: 'var(--ink-400)' }} />
          <select value={campaignFilter} onChange={e => setCampaignFilter(e.target.value)} style={{ border: 0, background: 'transparent', fontWeight: 600, paddingRight: 4 }}>
            <option value="all">Toutes cargaisons</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
        </div>
      </div>

      <table className="tbl" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <thead>
          <tr>
            <th style={{ width: 32, borderRadius: 0 }}><input type="checkbox" style={{ accentColor: 'var(--brand-500)' }} /></th>
            <th>Cargaison</th>
            <th>Code</th>
            <th>Expéditeur</th>
            <th>Destinataire</th>
            <th>Poids</th>
            <th style={{ textAlign: 'right' }}>Montant</th>
            <th>Paiement</th>
            <th>Livraison</th>
            <th title="Dernier message WhatsApp">WA</th>
            <th style={{ borderRadius: 0, width: 44 }}></th>
          </tr>
        </thead>
        <tbody>
          {paged.map(p => (
            <tr key={p.id}>
              <td><input type="checkbox" style={{ accentColor: 'var(--brand-500)' }} /></td>
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
                <span className="mono" style={{ fontWeight: 700 }}>{p.amount}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-400)', marginLeft: 3 }}>CAD</span>
              </td>
              <td>
                <span className={'badge badge--dot badge--' + STATUS.payment[p.paid].cls}>
                  {STATUS.payment[p.paid].label}
                </span>
              </td>
              <td>
                <span style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--ink-600)' }}>
                  {p.delivery === 'home' ? <><I.Truck style={{ width: 13, height: 13 }} /> Domicile</> : <><I.Warehouse style={{ width: 13, height: 13 }} /> Retrait</>}
                </span>
              </td>
              <td>
                {p.lastWhatsapp ? (
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
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--ink-300)' }}>—</span>
                )}
              </td>
              <td style={{ overflow: 'visible' }}>
                <ParcelActionsMenu parcel={{ ...p, id: p.id.split('-').pop() }} onNav={onNav} isLocked={false} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination total={filtered.length} page={page} pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />

    </div>
  );
}
