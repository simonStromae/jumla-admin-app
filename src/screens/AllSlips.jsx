import { useState, useEffect } from 'react';
import I from '../components/Icons.jsx';
import { Bi, Skel } from '../components/Shell.jsx';
import { Pagination } from '../components/Pagination.jsx';

const SLIP_STATUS = {
  en_attente: { l: 'À vérifier', cls: 'neutral' },
  en_cours:   { l: 'En cours',   cls: 'warn' },
  valide:     { l: 'Validé',     cls: 'ok' },
  libere:     { l: 'Libéré',     cls: 'ok' },
};

const PAY_STATUS = {
  paid:    { l: 'Payé',      cls: 'ok' },
  pending: { l: 'En attente', cls: 'warn' },
  unpaid:  { l: 'Impayé',    cls: 'bad' },
};

export default function AllSlipsScreen({ onNav }) {
  const [slips, setSlips]               = useState([]);
  const [campaigns, setCampaigns]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  const [pageSize, setPageSize]         = useState(25);

  useEffect(() => {
    Promise.all([
      fetch('/api/bordereaux').then(r => r.json()),
      fetch('/api/campaigns').then(r => r.json()),
    ]).then(([bData, cData]) => {
      setSlips(Array.isArray(bData) ? bData : []);
      setCampaigns(Array.isArray(cData) ? cData : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = slips.filter(s => {
    if (campaignFilter !== 'all' && s.campaignId !== campaignFilter) return false;
    if (search && !s.code.toLowerCase().includes(search.toLowerCase()) &&
        !s.clientName?.toLowerCase().includes(search.toLowerCase()) &&
        !s.trackingCode?.toLowerCase().includes(search.toLowerCase())) return false;
    if (tab === 'pending')   return s.status === 'en_attente';
    if (tab === 'validated') return s.status === 'valide' || s.status === 'libere';
    if (tab === 'released')  return s.status === 'libere';
    return true;
  });

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const counts = {
    all:       slips.length,
    pending:   slips.filter(s => s.status === 'en_attente').length,
    validated: slips.filter(s => s.status === 'valide' || s.status === 'libere').length,
    released:  slips.filter(s => s.status === 'libere').length,
  };

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__title"><Bi fr="Bordereaux" en="Slips" /></div>
          <div className="page__sub">Tous les bordereaux de livraison de toutes les cargaisons</div>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost"><I.Download />Export PDF lot</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
        {loading ? [1,2,3,4].map(i => (
          <div key={i} className="kpi"><Skel w="60%" h={11} style={{ marginBottom: 10 }} /><Skel w="40%" h={26} /></div>
        )) : <>
          <div className="kpi">
            <div className="kpi__label">Total bordereaux</div>
            <div className="kpi__value">{slips.length}</div>
          </div>
          <div className="kpi">
            <div className="kpi__label">À vérifier</div>
            <div className="kpi__value">{counts.pending}</div>
          </div>
          <div className="kpi" style={{ background: 'var(--ok-50)', borderColor: 'var(--ok-100)' }}>
            <div className="kpi__label" style={{ color: 'var(--ok-700)' }}>Validés</div>
            <div className="kpi__value" style={{ color: 'var(--ok-700)' }}>{counts.validated}</div>
          </div>
          <div className="kpi">
            <div className="kpi__label">Libérés</div>
            <div className="kpi__value">{counts.released}</div>
          </div>
        </>}
      </div>

      <div className="toolbar">
        <div className="tabs">
          {[
            { id: 'all',       l: 'Tous',      n: counts.all },
            { id: 'pending',   l: 'À vérifier', n: counts.pending },
            { id: 'validated', l: 'Validés',    n: counts.validated },
            { id: 'released',  l: 'Libérés',   n: counts.released },
          ].map(t => (
            <button key={t.id} className={'tab ' + (tab === t.id ? 'is-active' : '')} onClick={() => { setTab(t.id); setPage(1); }}>
              {t.l} <span className="count">{t.n}</span>
            </button>
          ))}
        </div>
        <div className="spacer" />
        <div style={{ position: 'relative' }}>
          <I.Search style={{ position: 'absolute', left: 10, top: 9, width: 14, height: 14, color: 'var(--ink-400)' }} />
          <input
            className="input input--sm"
            placeholder="Code BL, client, tracking..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ width: 240, paddingLeft: 32 }}
          />
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 6px 4px 10px', border: '1px solid var(--border)', borderRadius: 7, background: 'white', fontSize: 12 }}>
          <I.Plane style={{ width: 12, height: 12, color: 'var(--ink-400)' }} />
          <select value={campaignFilter} onChange={e => { setCampaignFilter(e.target.value); setPage(1); }} style={{ border: 0, background: 'transparent', fontWeight: 600 }}>
            <option value="all">Toutes cargaisons</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
        </div>
      </div>

      <table className="tbl" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <thead>
          <tr>
            <th style={{ width: 32, borderRadius: 0 }}><input type="checkbox" style={{ accentColor: 'var(--brand-500)' }} /></th>
            <th>Bordereau</th>
            <th>Cargaison</th>
            <th>Client</th>
            <th>Colis</th>
            <th style={{ textAlign: 'center' }}>Pièces</th>
            <th style={{ textAlign: 'right' }}>Poids</th>
            <th>Statut BL</th>
            <th>Paiement</th>
            <th style={{ borderRadius: 0, width: 70 }}></th>
          </tr>
        </thead>
        <tbody>
          {loading && [1,2,3,4,5].map(i => (
            <tr key={i}>
              <td><Skel w={16} h={16} r={3} /></td>
              <td><Skel w={100} h={13} /></td>
              <td><Skel w={70} h={13} /></td>
              <td><Skel w={110} h={13} style={{ marginBottom: 4 }} /><Skel w={70} h={10} /></td>
              <td><Skel w={80} h={13} /></td>
              <td><Skel w={30} h={13} style={{ margin: '0 auto' }} /></td>
              <td><Skel w={50} h={13} style={{ marginLeft: 'auto' }} /></td>
              <td><Skel w={70} h={20} r={999} /></td>
              <td><Skel w={70} h={20} r={999} /></td>
              <td></td>
            </tr>
          ))}
          {!loading && paged.map(s => {
            const st  = SLIP_STATUS[s.status] ?? { l: s.status, cls: 'neutral' };
            const pay = PAY_STATUS[s.paid]    ?? { l: s.paid,   cls: 'neutral' };
            return (
              <tr key={s.id}>
                <td><input type="checkbox" style={{ accentColor: 'var(--brand-500)' }} /></td>
                <td>
                  <span className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--brand-700)', cursor: 'pointer' }}
                    onClick={() => onNav('/slip/' + s.code)}>{s.code}</span>
                </td>
                <td>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', cursor: 'pointer' }}
                    onClick={() => onNav('/admin/campaigns/' + s.campaignId)}>{s.campaign}</span>
                </td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{s.clientName}</div>
                  {s.clientCity && <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>{s.clientCity}</div>}
                </td>
                <td>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-700)', cursor: 'pointer' }}
                    onClick={() => onNav('/admin/parcels/' + s.parcelId)}>{s.trackingCode}</span>
                </td>
                <td className="mono" style={{ textAlign: 'center', fontWeight: 600 }}>{s.nbPieces}</td>
                <td style={{ textAlign: 'right' }}>
                  {s.weightKg ? <><span className="mono" style={{ fontWeight: 600 }}>{s.weightKg}</span><span style={{ fontSize: 11, color: 'var(--ink-400)', marginLeft: 2 }}>kg</span></> : '—'}
                </td>
                <td><span className={'badge badge--dot badge--' + st.cls}>{st.l}</span></td>
                <td><span className={'badge badge--dot badge--' + pay.cls}>{pay.l}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <button className="icon-btn" onClick={() => onNav('/admin/parcels/' + s.parcelId)}><I.Eye /></button>
                  </div>
                </td>
              </tr>
            );
          })}
          {!loading && filtered.length === 0 && (
            <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-400)', fontSize: 13 }}>
              Aucun bordereau trouvé.
            </td></tr>
          )}
        </tbody>
      </table>

      <Pagination total={filtered.length} page={page} pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
    </div>
  );
}
