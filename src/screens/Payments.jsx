import { useState } from 'react';
import { DATA, STATUS } from '../data.js';
import I from '../components/Icons.jsx';
import { Bi, Avatar, Modal } from '../components/Shell.jsx';
import { Progress } from '../components/Shell.jsx';

function PaymentModal({ payment, onClose, onSave }) {
  const isNew = !payment;
  const [data, setData] = useState({
    parcel:    payment?.parcel    || '',
    campaign:  payment?.campaign  || '',
    recipName: payment?.recipName || '',
    due:       payment?.due       || '',
    received:  payment?.received  || '',
    method:    payment?.method    || 'Virement',
    note:      payment?.note      || '',
  });
  const upd = (k, v) => setData(d => ({ ...d, [k]: v }));
  const remaining = (parseFloat(data.due) || 0) - (parseFloat(data.received) || 0);

  return (
    <Modal width={580} onClose={onClose}
      title={<span>{isNew ? 'Enregistrer un paiement' : 'Modifier le paiement'} <span style={{ color: 'var(--ink-400)', fontWeight: 400, fontSize: '.85em', marginLeft: 6 }}>/ Record payment</span></span>}
      sub={isNew ? 'Associez un règlement à un colis' : `Colis ${payment.parcel} · ${payment.recipName}`}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Annuler</button>
          <button className="btn btn--brand" onClick={onSave}><I.Check />{isNew ? 'Enregistrer' : 'Mettre à jour'}</button>
        </>
      }>

      <div className="field-row field-row--2">
        <div className="field">
          <label className="label">Cargaison</label>
          <select className="select" value={data.campaign} onChange={e => upd('campaign', e.target.value)}>
            <option value="">— Sélectionner</option>
            {DATA.CAMPAIGNS.map(c => <option key={c.id} value={c.code}>{c.code}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label">Code colis</label>
          <input className="input mono" value={data.parcel} onChange={e => upd('parcel', e.target.value)} placeholder="#01" />
        </div>
      </div>

      <div className="field">
        <label className="label">Destinataire</label>
        <input className="input" value={data.recipName} onChange={e => upd('recipName', e.target.value)} placeholder="Nom du destinataire" />
      </div>

      <div className="field-row field-row--2">
        <div className="field">
          <label className="label">Montant dû <span className="opt">CAD</span></label>
          <input className="input mono" type="number" value={data.due} onChange={e => upd('due', e.target.value)} placeholder="0" />
        </div>
        <div className="field">
          <label className="label">Montant reçu <span className="opt">CAD</span></label>
          <input className="input mono" type="number" value={data.received} onChange={e => upd('received', e.target.value)} placeholder="0" />
        </div>
      </div>

      {data.due && data.received && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, marginBottom: 14,
          background: remaining <= 0 ? 'var(--ok-50)' : 'var(--warn-50)',
          border: '1px solid ' + (remaining <= 0 ? 'var(--ok-100)' : 'var(--warn-100)'),
          fontSize: 13,
        }}>
          {remaining <= 0
            ? <><I.Check style={{ color: 'var(--ok-600)', width: 14, height: 14 }} /><span style={{ color: 'var(--ok-700)', fontWeight: 600 }}>Solde réglé intégralement</span></>
            : <><I.Alert style={{ color: 'var(--warn-700)', width: 14, height: 14 }} /><span style={{ color: 'var(--warn-700)', fontWeight: 600 }}>Reste à percevoir : <span className="mono">{remaining.toLocaleString('fr')} CAD</span></span></>}
        </div>
      )}

      <div className="field-row field-row--2">
        <div className="field">
          <label className="label">Méthode de paiement</label>
          <select className="select" value={data.method} onChange={e => upd('method', e.target.value)}>
            <option>Virement</option>
            <option>Interac</option>
            <option>Espèces</option>
            <option>Mobile Money</option>
            <option>Chèque</option>
          </select>
        </div>
        <div className="field">
          <label className="label">Agent</label>
          <select className="select">
            {DATA.AGENTS.map(a => <option key={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>

      <div className="field" style={{ marginBottom: 0 }}>
        <label className="label">Note <span className="opt">/ Optionnel</span></label>
        <input className="input" value={data.note} onChange={e => upd('note', e.target.value)} placeholder="Référence virement, remarque..." />
      </div>
    </Modal>
  );
}

export default function PaymentsScreen({ onNav }) {
  const [tab, setTab] = useState('all');
  const [modal, setModal] = useState(null);
  const payments = DATA.PAYMENTS;
  const tabs = [
    { id: 'all',     l: 'Tous',     n: payments.length },
    { id: 'paid',    l: 'Payés',    n: payments.filter(p => p.status === 'paid').length,    cls: 'ok' },
    { id: 'pending', l: 'En cours', n: payments.filter(p => p.status === 'pending').length, cls: 'warn' },
    { id: 'unpaid',  l: 'Impayés',  n: payments.filter(p => p.status === 'unpaid').length,  cls: 'bad' },
  ];

  const filtered = tab === 'all' ? payments : payments.filter(p => p.status === tab);

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__title"><Bi fr="Paiements" en="Payments" /></div>
          <div className="page__sub">Journal chronologique — tous les règlements et leurs statuts</div>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost"><I.Download />Export comptable</button>
          <button className="btn btn--brand" onClick={() => setModal({ new: true })}><I.Plus />Enregistrer paiement</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
        <div className="kpi">
          <div className="kpi__label">Facturé <span style={{ textTransform: 'none', color: 'var(--ink-300)' }}>/ Invoiced</span></div>
          <div className="kpi__value">2 380 <span style={{ fontSize: 14, color: 'var(--ink-400)' }}>CAD</span></div>
          <div className="kpi__delta">8 colis</div>
        </div>
        <div className="kpi" style={{ background: 'var(--ok-50)', borderColor: 'var(--ok-100)' }}>
          <div className="kpi__label" style={{ color: 'var(--ok-700)' }}>Perçu <span style={{ textTransform: 'none', opacity: .6 }}>/ Collected</span></div>
          <div className="kpi__value" style={{ color: 'var(--ok-700)' }}>1 855 <span style={{ fontSize: 14, opacity: .6 }}>CAD</span></div>
          <Progress pct={78} />
        </div>
        <div className="kpi" style={{ background: 'var(--bad-50)', borderColor: 'var(--bad-100)' }}>
          <div className="kpi__label" style={{ color: 'var(--bad-700)' }}>Impayés <span style={{ textTransform: 'none', opacity: .6 }}>/ Outstanding</span></div>
          <div className="kpi__value" style={{ color: 'var(--bad-700)' }}>525 <span style={{ fontSize: 14, opacity: .6 }}>CAD</span></div>
          <div className="kpi__delta" style={{ color: 'var(--bad-600)' }}>2 colis · 2 clients</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Acomptes / Crédits</div>
          <div className="kpi__value">200 <span style={{ fontSize: 14, color: 'var(--ink-400)' }}>CAD</span></div>
          <div className="kpi__delta">1 acompte</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="tabs">
          {tabs.map(t => (
            <button key={t.id} className={'tab ' + (tab === t.id ? 'is-active' : '')} onClick={() => setTab(t.id)}>
              {t.l} <span className="count">{t.n}</span>
            </button>
          ))}
        </div>
        <div className="spacer" />
        <div style={{ position: 'relative' }}>
          <I.Search style={{ position: 'absolute', left: 10, top: 9, width: 14, height: 14, color: 'var(--ink-400)' }} />
          <input className="input input--sm" placeholder="Destinataire, colis, agent..." style={{ width: 260, paddingLeft: 32 }} />
        </div>
        <button className="btn btn--soft btn--sm"><I.Plane />Cargaison</button>
        <button className="btn btn--soft btn--sm"><I.Users />Agent</button>
        <button className="btn btn--soft btn--sm"><I.Calendar />Période</button>
      </div>

      <table className="tbl" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <thead>
          <tr>
            <th style={{ borderRadius: 0 }}>Date</th>
            <th>Destinataire</th>
            <th>Cargaison</th>
            <th>Colis</th>
            <th style={{ textAlign: 'right' }}>Dû</th>
            <th style={{ textAlign: 'right' }}>Reçu</th>
            <th>Statut</th>
            <th>Méthode</th>
            <th>Agent</th>
            <th>Note</th>
            <th style={{ borderRadius: 0, width: 90 }}></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(p => (
            <tr key={p.id}>
              <td className="mono" style={{ fontSize: 12, color: 'var(--ink-500)' }}>{p.date}</td>
              <td>
                <div style={{ fontWeight: 600 }}>{p.recipName}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-400)' }}>{p.recipPhone}</div>
              </td>
              <td className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{p.campaign}</td>
              <td className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{p.parcel}</td>
              <td style={{ textAlign: 'right' }}>
                <span className="mono" style={{ fontWeight: 600 }}>{p.due}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-400)', marginLeft: 3 }}>CAD</span>
              </td>
              <td style={{ textAlign: 'right' }}>
                <span className="mono" style={{ fontWeight: 700, color: p.received > 0 ? 'var(--ok-700)' : 'var(--ink-300)' }}>
                  {p.received > 0 ? p.received : '—'}
                </span>
                {p.received > 0 && <span style={{ fontSize: 11, color: 'var(--ok-700)', opacity: .7, marginLeft: 3 }}>CAD</span>}
              </td>
              <td>
                <span className={'badge badge--dot badge--' + STATUS.payment[p.status].cls}>
                  {STATUS.payment[p.status].label}
                </span>
              </td>
              <td style={{ fontSize: 12, color: 'var(--ink-600)' }}>{p.method}</td>
              <td><Avatar initials={p.agent} color={p.agent === 'AM' ? 1 : 2} size="sm" /></td>
              <td style={{ fontSize: 12, color: 'var(--ink-500)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.note}</td>
              <td>
                {p.status === 'paid'
                  ? <button className="btn btn--ghost btn--xs" style={{ justifyContent: 'center', width: '100%' }} onClick={() => setModal(p)}><I.Eye />Voir</button>
                  : <button className="btn btn--brand btn--xs" style={{ justifyContent: 'center', width: '100%' }} onClick={() => setModal(p)}><I.Wallet />Régler</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-400)' }}>
        {filtered.length} entrées · Période : 24 → 26 avril 2026
      </div>

      {modal && (
        <PaymentModal
          payment={modal?.new ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => setModal(null)}
        />
      )}
    </div>
  );
}
