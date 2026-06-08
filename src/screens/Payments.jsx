import { useState, useEffect } from 'react';
import I from '../components/Icons.jsx';
import { Bi, Avatar, Modal, Progress, Skel } from '../components/Shell.jsx';

const PAY_STATUS = {
  completed: { label: 'Payé',       cls: 'ok' },
  pending:   { label: 'En attente', cls: 'warn' },
  failed:    { label: 'Échoué',     cls: 'bad' },
  refunded:  { label: 'Remboursé',  cls: 'neutral' },
};

function PaymentModal({ payment, onClose, onSave, campaigns = [] }) {
  const isNew = !payment;
  const [interacRef, setInteracRef] = useState(payment?.interacRef || '');
  const [method, setMethod]         = useState('Virement Interac');
  const [saving, setSaving]         = useState(false);
  const [err, setErr]               = useState('');

  const handleSave = async () => {
    if (isNew) { onSave(); return; }
    setSaving(true);
    setErr('');
    try {
      const res = await fetch(`/api/payments/${payment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed', interacRef: interacRef || undefined }),
      });
      const json = await res.json();
      if (!res.ok) { setErr(json.error || 'Erreur'); setSaving(false); return; }
      onSave();
    } catch {
      setErr('Erreur réseau');
      setSaving(false);
    }
  };

  return (
    <Modal width={480} onClose={onClose}
      title={<span>{isNew ? 'Enregistrer un paiement' : 'Régler le paiement'} <span style={{ color: 'var(--ink-400)', fontWeight: 400, fontSize: '.85em', marginLeft: 6 }}>/ Record payment</span></span>}
      sub={isNew ? 'Associez un règlement à un colis' : `${payment.recipName} · ${payment.parcel}`}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Annuler</button>
          {err && <span style={{ fontSize: 12, color: 'var(--bad-600)' }}>{err}</span>}
          <button className="btn btn--brand" onClick={handleSave} disabled={saving}>
            <I.Check />{saving ? 'Enregistrement…' : isNew ? 'Enregistrer' : 'Marquer comme payé'}
          </button>
        </>
      }>

      {!isNew && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: 14, background: 'var(--bg-soft)', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600, marginBottom: 3 }}>Client</div>
            <div style={{ fontWeight: 600, color: 'var(--ink-800)' }}>{payment.recipName}</div>
            <div style={{ color: 'var(--ink-400)', fontSize: 11.5 }}>{payment.recipPhone}</div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600, marginBottom: 3 }}>Montant</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--ok-700)' }}>{(payment.due || 0).toLocaleString('fr')} <span style={{ fontSize: 12, fontWeight: 400 }}>CAD</span></div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600, marginBottom: 3 }}>Colis</div>
            <div className="mono" style={{ fontWeight: 600 }}>{payment.parcel}</div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600, marginBottom: 3 }}>Cargaison</div>
            <div className="mono" style={{ fontWeight: 600 }}>{payment.campaign}</div>
          </div>
        </div>
      )}

      <div className="field">
        <label className="label">Méthode de paiement</label>
        <select className="select" value={method} onChange={e => setMethod(e.target.value)}>
          <option>Virement Interac</option>
          <option>Espèces</option>
          <option>Mobile Money</option>
          <option>Chèque</option>
          <option>Virement bancaire</option>
        </select>
      </div>

      <div className="field" style={{ marginBottom: 0 }}>
        <label className="label">Référence Interac <span className="opt">/ Optionnel</span></label>
        <input className="input mono" value={interacRef} onChange={e => setInteracRef(e.target.value)}
          placeholder="ex: XK7F2A" />
      </div>
    </Modal>
  );
}

export default function PaymentsScreen({ onNav }) {
  const [tab, setTab]         = useState('all');
  const [modal, setModal]     = useState(null);
  const [payments, setPayments] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPayments = () => {
    Promise.all([
      fetch('/api/payments').then(r => r.json()),
      fetch('/api/campaigns').then(r => r.json()),
    ]).then(([pData, cData]) => {
      setPayments(Array.isArray(pData) ? pData : []);
      setCampaigns(Array.isArray(cData) ? cData : []);
      setLoading(false);
    });
  };

  useEffect(() => { loadPayments(); }, []);
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

      {(() => {
        const facture = payments.reduce((s, p) => s + (p.amount || 0), 0);
        const percu   = payments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);
        const impayesAmt = payments.filter(p => p.status === 'pending' || p.status === 'failed').reduce((s, p) => s + (p.amount || 0), 0);
        const impayesCount = payments.filter(p => p.status === 'pending' || p.status === 'failed').length;
        const percuPct = Math.round(percu / (facture || 1) * 100) || 0;
        const tauxRecouvrement = Math.round(percu / (facture || 1) * 100) || 0;
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
            <div className="kpi">
              <div className="kpi__label">Facturé <span style={{ textTransform: 'none', color: 'var(--ink-300)' }}>/ Invoiced</span></div>
              <div className="kpi__value">{facture.toLocaleString('fr')} <span style={{ fontSize: 14, color: 'var(--ink-400)' }}>CAD</span></div>
              <div className="kpi__delta">{payments.length} colis</div>
            </div>
            <div className="kpi" style={{ background: 'var(--ok-50)', borderColor: 'var(--ok-100)' }}>
              <div className="kpi__label" style={{ color: 'var(--ok-700)' }}>Perçu <span style={{ textTransform: 'none', opacity: .6 }}>/ Collected</span></div>
              <div className="kpi__value" style={{ color: 'var(--ok-700)' }}>{percu.toLocaleString('fr')} <span style={{ fontSize: 14, opacity: .6 }}>CAD</span></div>
              <Progress pct={percuPct} />
            </div>
            <div className="kpi" style={{ background: 'var(--bad-50)', borderColor: 'var(--bad-100)' }}>
              <div className="kpi__label" style={{ color: 'var(--bad-700)' }}>Impayés <span style={{ textTransform: 'none', opacity: .6 }}>/ Outstanding</span></div>
              <div className="kpi__value" style={{ color: 'var(--bad-700)' }}>{impayesAmt.toLocaleString('fr')} <span style={{ fontSize: 14, opacity: .6 }}>CAD</span></div>
              <div className="kpi__delta" style={{ color: 'var(--bad-600)' }}>{impayesCount} paiement{impayesCount !== 1 ? 's' : ''}</div>
            </div>
            <div className="kpi">
              <div className="kpi__label">Taux recouvrement</div>
              <div className="kpi__value">{tauxRecouvrement}<span style={{ fontSize: 14, color: 'var(--ink-400)' }}>%</span></div>
              <Progress pct={tauxRecouvrement} />
            </div>
          </div>
        );
      })()}

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
          {loading && [1,2,3,4,5].map(i => (
            <tr key={i}>
              <td><Skel w={72} h={12} /></td>
              <td><Skel w={100} h={13} style={{ marginBottom: 4 }} /><Skel w={80} h={10} /></td>
              <td><Skel w={64} h={13} /></td>
              <td><Skel w={80} h={13} /></td>
              <td><Skel w={50} h={13} style={{ marginLeft: 'auto' }} /></td>
              <td><Skel w={50} h={13} style={{ marginLeft: 'auto' }} /></td>
              <td><Skel w={70} h={20} r={999} /></td>
              <td><Skel w={60} h={12} /></td>
              <td><Skel w={28} h={28} r={999} /></td>
              <td><Skel w={80} h={12} /></td>
              <td><Skel w={60} h={26} r={6} /></td>
            </tr>
          ))}
          {!loading && filtered.map(p => (
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
                {(() => { const s = PAY_STATUS[p.status] || { label: p.status, cls: 'neutral' }; return (
                  <span className={'badge badge--dot badge--' + s.cls}>{s.label}</span>
                ); })()}
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
          campaigns={campaigns}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); loadPayments(); }}
        />
      )}
    </div>
  );
}
