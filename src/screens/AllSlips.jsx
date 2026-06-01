import { useState } from 'react';
import { DATA, STATUS } from '../data.js';
import I from '../components/Icons.jsx';
import { Bi, Avatar } from '../components/Shell.jsx';
import { Pagination } from '../components/Pagination.jsx';

export default function AllSlipsScreen({ onNav }) {
  const [tab, setTab] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const slips = DATA.CAMPAIGNS.flatMap(c =>
    Array.from({ length: Math.min(c.parcels, 6) }).map((_, i) => ({
      id: c.id + '-bl-' + i,
      code: `BL-${c.dep.replace(/\D/g, '').slice(0, 4)}-${String(i + 1).padStart(2, '0')}`,
      campaign: c.code,
      campaignId: c.id,
      sender: 'Client ' + String.fromCharCode(65 + i),
      recipient: 'Client ' + String.fromCharCode(74 + i),
      recipientCity: ['Montréal', 'Laval', 'Longueuil', 'Brossard', 'Gatineau', 'Québec'][i % 6],
      items: 2 + (i % 4),
      pieces: 5 + (i * 3) % 12,
      status: ['pending', 'partial', 'validated', 'released', 'pending'][i % 5],
      discrepancy: [0, 0, 2, 1, 0][i % 5],
      amount: 100 + (i * 65) % 500,
      paid: ['paid', 'unpaid', 'pending'][i % 3],
      agent: i % 2 === 0 ? 'AM' : 'ML',
    }))
  );

  const slipStatusMap = {
    pending:   { l: 'À vérifier', cls: 'neutral' },
    partial:   { l: 'En cours',   cls: 'warn' },
    validated: { l: 'Validé',     cls: 'ok' },
    released:  { l: 'Libéré',     cls: 'ok' },
  };

  const filtered = slips.filter(s => {
    if (campaignFilter !== 'all' && s.campaignId !== campaignFilter) return false;
    if (tab === 'pending')   return s.status === 'pending';
    if (tab === 'validated') return s.status === 'validated' || s.status === 'released';
    if (tab === 'discr')     return s.discrepancy > 0;
    if (tab === 'released')  return s.status === 'released';
    return true;
  });
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__title"><Bi fr="Bordereaux" en="Slips" /></div>
          <div className="page__sub">Tous les bordereaux de livraison de toutes les cargaisons</div>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost"><I.Download />Export PDF lot</button>
          <button className="btn btn--brand"><I.Plus />Nouveau bordereau</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 18 }}>
        <div className="kpi">
          <div className="kpi__label">Total bordereaux</div>
          <div className="kpi__value">{slips.length}</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">À vérifier</div>
          <div className="kpi__value">{slips.filter(s => s.status === 'pending').length}</div>
        </div>
        <div className="kpi" style={{ background: 'var(--ok-50)', borderColor: 'var(--ok-100)' }}>
          <div className="kpi__label" style={{ color: 'var(--ok-700)' }}>Validés</div>
          <div className="kpi__value" style={{ color: 'var(--ok-700)' }}>{slips.filter(s => s.status === 'validated' || s.status === 'released').length}</div>
        </div>
        <div className="kpi" style={{ background: 'var(--bad-50)', borderColor: 'var(--bad-100)' }}>
          <div className="kpi__label" style={{ color: 'var(--bad-700)' }}>Avec écarts</div>
          <div className="kpi__value" style={{ color: 'var(--bad-700)' }}>{slips.filter(s => s.discrepancy > 0).length}</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Libérés</div>
          <div className="kpi__value">{slips.filter(s => s.status === 'released').length}</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="tabs">
          <button className={'tab ' + (tab === 'all' ? 'is-active' : '')} onClick={() => setTab('all')}>Tous <span className="count">{slips.length}</span></button>
          <button className={'tab ' + (tab === 'pending' ? 'is-active' : '')} onClick={() => setTab('pending')}>À vérifier</button>
          <button className={'tab ' + (tab === 'validated' ? 'is-active' : '')} onClick={() => setTab('validated')}>Validés</button>
          <button className={'tab ' + (tab === 'discr' ? 'is-active' : '')} onClick={() => setTab('discr')}>Avec écarts <span className="count">{slips.filter(s => s.discrepancy > 0).length}</span></button>
          <button className={'tab ' + (tab === 'released' ? 'is-active' : '')} onClick={() => setTab('released')}>Libérés</button>
        </div>
        <div className="spacer" />
        <div style={{ position: 'relative' }}>
          <I.Search style={{ position: 'absolute', left: 10, top: 9, width: 14, height: 14, color: 'var(--ink-400)' }} />
          <input className="input input--sm" placeholder="Code BL, destinataire..." style={{ width: 240, paddingLeft: 32 }} />
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 6px 4px 10px', border: '1px solid var(--border)', borderRadius: 7, background: 'white', fontSize: 12 }}>
          <I.Plane style={{ width: 12, height: 12, color: 'var(--ink-400)' }} />
          <select value={campaignFilter} onChange={e => setCampaignFilter(e.target.value)} style={{ border: 0, background: 'transparent', fontWeight: 600 }}>
            <option value="all">Toutes cargaisons</option>
            {DATA.CAMPAIGNS.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
        </div>
      </div>

      <table className="tbl" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <thead>
          <tr>
            <th style={{ width: 32, borderRadius: 0 }}><input type="checkbox" style={{ accentColor: 'var(--brand-500)' }} /></th>
            <th>Bordereau</th>
            <th>Cargaison</th>
            <th>Expéditeur</th>
            <th>Destinataire</th>
            <th style={{ textAlign: 'center' }}>Articles</th>
            <th style={{ textAlign: 'center' }}>Pièces</th>
            <th>Écart</th>
            <th>Statut BL</th>
            <th>Paiement</th>
            <th>Agent</th>
            <th style={{ borderRadius: 0, width: 80 }}></th>
          </tr>
        </thead>
        <tbody>
          {paged.map(s => {
            const st = slipStatusMap[s.status];
            return (
              <tr key={s.id}>
                <td><input type="checkbox" style={{ accentColor: 'var(--brand-500)' }} /></td>
                <td>
                  <a className="mono" onClick={() => onNav('/slip/' + s.code)} style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--brand-700)', cursor: 'pointer' }}>{s.code}</a>
                </td>
                <td>
                  <a className="mono" onClick={() => onNav('/campaign/' + s.campaignId)} style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', cursor: 'pointer' }}>{s.campaign}</a>
                </td>
                <td style={{ fontSize: 13, fontWeight: 500 }}>{s.sender}</td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{s.recipient}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>{s.recipientCity}</div>
                </td>
                <td className="mono" style={{ textAlign: 'center', fontWeight: 600 }}>{s.items}</td>
                <td className="mono" style={{ textAlign: 'center', fontWeight: 600 }}>{s.pieces}</td>
                <td>
                  {s.discrepancy > 0
                    ? <span className="badge badge--bad badge--dot">−{s.discrepancy}</span>
                    : <span style={{ color: 'var(--ink-300)', fontSize: 13 }} className="mono">—</span>}
                </td>
                <td><span className={'badge badge--dot badge--' + st.cls}>{st.l}</span></td>
                <td>
                  <span className={'badge badge--dot badge--' + STATUS.payment[s.paid].cls}>
                    {STATUS.payment[s.paid].label}
                  </span>
                </td>
                <td><Avatar initials={s.agent} color={s.agent === 'AM' ? 1 : 2} size="sm" /></td>
                <td>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <button className="icon-btn" onClick={() => onNav('/slip/' + s.code + '/print')}><I.Print /></button>
                    <button className="icon-btn" onClick={() => onNav('/slip/' + s.code)}><I.Eye /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Pagination total={filtered.length} page={page} pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
    </div>
  );
}
