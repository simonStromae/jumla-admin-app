import { useState, useEffect, useRef } from 'react';
import I from '../components/Icons.jsx';
import { Bi, Avatar, Modal, Progress, Skel, useCan } from '../components/Shell.jsx';
import { useAdminT } from '../lib/useAdminT.js';

// TODO: i18n — module-level constants cannot use hooks; labels translated inline in components via t.payments.methods / t.paymentStatus
const METHOD_LABELS = {
  interac:     'Virement Interac',   // → t.payments.methods.interac
  cash:        'Espèces',            // → t.payments.methods.cash
  mobilemoney: 'Mobile Money',       // TODO: i18n — no translation key
  cheque:      'Chèque',             // TODO: i18n — no translation key
  virement:    'Virement bancaire',  // → t.payments.methods.virement
};

// TODO: i18n — no translation keys for type labels
const TYPE_LABELS = {
  payment: 'Paiement',
  credit:  'Crédit accordé',
};

const PAY_STATUS = {
  completed: { label: 'Payé',       cls: 'ok'      }, // → t.paymentStatus.completed
  paid:      { label: 'Payé',       cls: 'ok'      }, // → t.paymentStatus.completed
  pending:   { label: 'En cours',   cls: 'warn'    }, // → t.paymentStatus.pending
  partial:   { label: 'Partiel',    cls: 'warn'    }, // TODO: i18n — no translation key
  unpaid:    { label: 'En cours',   cls: 'warn'    }, // → same as pending
  failed:    { label: 'Échoué',     cls: 'bad'     }, // TODO: i18n — no translation key
  refunded:  { label: 'Remboursé',  cls: 'neutral' }, // TODO: i18n — no translation key
};

/* ─── Record Payment Modal ───────────────────────────────── */

function RecordPaymentModal({ preselectedClient, preselectedPaymentId, onClose, onSave }) {
  const t = useAdminT();
  const [form, setForm]             = useState({ type: 'payment', amount: '', method: 'interac', reference: '', note: '' });
  const [clientQuery, setClientQuery] = useState(preselectedClient?.name || '');
  const [clients, setClients]       = useState([]);
  const [selectedClient, setSelectedClient] = useState(preselectedClient || null);
  const [balance, setBalance]       = useState(null);
  const [allocations, setAllocations] = useState({});  // paymentId → amount string
  const [saving, setSaving]         = useState(false);
  const [err, setErr]               = useState('');
  const searchRef = useRef(null);

  // Client autocomplete
  useEffect(() => {
    if (!clientQuery || clientQuery.length < 2 || selectedClient) { setClients([]); return; }
    const timer = setTimeout(() => {
      fetch(`/api/clients?search=${encodeURIComponent(clientQuery)}&limit=8`)
        .then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : []));
    }, 250);
    return () => clearTimeout(timer);
  }, [clientQuery, selectedClient]);

  // Load balance when client selected
  useEffect(() => {
    if (!selectedClient) { setBalance(null); return; }
    fetch(`/api/clients/${selectedClient.id}/balance`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => {
        setBalance(d);
        if (preselectedPaymentId) {
          const inv = d.unpaidInvoices?.find(i => i.id === preselectedPaymentId);
          if (inv) {
            setAllocations({ [preselectedPaymentId]: String(inv.remaining) });
            setForm(f => ({ ...f, amount: String(inv.remaining) }));
          }
        }
      })
      .catch(() => setBalance({ totalDue: 0, creditBalance: 0, unpaidInvoices: [], allInvoices: [] }));
  }, [selectedClient, preselectedPaymentId]);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const totalAmount    = Number(form.amount) || 0;
  const totalAllocated = Object.values(allocations).reduce((s, a) => s + (Number(a) || 0), 0);
  const credit         = totalAmount - totalAllocated;

  const autoAllocate = () => {
    if (!balance?.unpaidInvoices?.length || !totalAmount) return;
    let left = totalAmount;
    const allocs = {};
    for (const inv of balance.unpaidInvoices) {
      if (left <= 0) break;
      const amt = Math.min(left, inv.remaining);
      allocs[inv.id] = String(amt);
      left -= amt;
    }
    setAllocations(allocs);
  };

  const clearClient = () => { setSelectedClient(null); setClientQuery(''); setBalance(null); setAllocations({}); };

  const handleSave = async () => {
    if (!selectedClient) { setErr(/* TODO: i18n — no translation key */ 'Sélectionnez un client'); return; }
    if (!totalAmount)    { setErr(/* TODO: i18n — no translation key */ 'Montant requis'); return; }
    if (credit < 0)      { setErr(/* TODO: i18n — no translation key */ 'Le montant alloué dépasse le montant reçu'); return; }
    setSaving(true); setErr('');
    const allocs = Object.entries(allocations)
      .filter(([, a]) => Number(a) > 0)
      .map(([paymentId, amount]) => ({ paymentId, amount: Number(amount) }));
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId:    selectedClient.id,
          amount:      totalAmount,
          type:        form.type,
          method:      form.method,
          reference:   form.reference || null,
          note:        form.note || null,
          allocations: allocs,
        }),
      });
      let json = {};
      try { json = await res.json(); } catch { /* non-JSON body */ }
      if (res.ok && json.ok) {
        onSave(json.transactionId);
      } else {
        setErr(json.error || /* TODO: i18n — no translation key */ `Erreur ${res.status} — vérifiez que /api/db-migrate a été lancé.`);
        setSaving(false);
      }
    } catch {
      setErr(t.common.networkError);
      setSaving(false);
    }
  };

  const unpaid = balance?.unpaidInvoices ?? [];

  return (
    <Modal width={740} onClose={onClose}
      title={/* TODO: i18n — no translation key */ "Enregistrer un paiement reçu"}
      sub={/* TODO: i18n — no translation key */ "Associez le règlement aux factures impayées du client"}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>{t.common.cancel}</button>
          <div style={{ flex: 1 }} />
          {err && <span style={{ fontSize: 12, color: 'var(--bad-600)' }}>{err}</span>}
          {totalAmount > 0 && totalAllocated === 0 && (
            <span style={{ fontSize: 11.5, color: 'var(--warn-600)' }}>{/* TODO: i18n — no translation key */}⚠️ Aucune facture allouée → crédit client</span>
          )}
          <button className="btn btn--brand" onClick={handleSave} disabled={saving || !selectedClient || !totalAmount}>
            <I.Check />{saving ? t.common.saving : t.common.save}
          </button>
        </>
      }>

      <div style={{ display: 'grid', gridTemplateColumns: '290px 1fr', gap: 20 }}>
        {/* ── Left: Payment info ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
            {/* TODO: i18n — no translation key */}Informations du paiement
          </div>

          {/* Client */}
          <div className="field">
            <label className="label">{t.payments.table.client} <span style={{ color: 'var(--bad-500)' }}>*</span></label>
            {selectedClient ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', border: '1px solid var(--brand-200)', borderRadius: 8,
                background: 'var(--brand-50)',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{selectedClient.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-500)' }}>{selectedClient.phone || selectedClient.email}</div>
                </div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-400)', fontSize: 17, lineHeight: 1 }} onClick={clearClient}>✕</button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <input ref={searchRef} className="input" value={clientQuery}
                  onChange={e => setClientQuery(e.target.value)}
                  placeholder={'Rechercher un client, colis…'} />
                {clients.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                    background: 'white', border: '1px solid var(--border)', borderRadius: 8,
                    boxShadow: 'var(--sh-lg)', marginTop: 4, overflow: 'hidden',
                  }}>
                    {clients.map(c => (
                      <div key={c.id} style={{ padding: '9px 12px', cursor: 'pointer', fontSize: 13 }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-soft)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                        onClick={() => { setSelectedClient(c); setClientQuery(c.name); setClients([]); }}>
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>{c.phone || c.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Balance mini-card */}
          {balance && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14, padding: '10px 12px', background: 'var(--bg-soft)', borderRadius: 8, fontSize: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--ink-400)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>{/* TODO: i18n — no translation key */}Total dû</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: balance.totalDue > 0 ? 'var(--bad-600)' : 'var(--ok-600)', fontFamily: 'var(--font-mono)' }}>
                  {balance.totalDue.toLocaleString('fr')} <span style={{ fontSize: 10, fontWeight: 400 }}>CAD</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--ink-400)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>{/* TODO: i18n — no translation key */}Crédit disponible</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: balance.creditBalance > 0 ? 'var(--brand-600)' : 'var(--ink-400)', fontFamily: 'var(--font-mono)' }}>
                  {balance.creditBalance.toLocaleString('fr')} <span style={{ fontSize: 10, fontWeight: 400 }}>CAD</span>
                </div>
              </div>
            </div>
          )}

          {/* Type */}
          <div className="field">
            <label className="label">{/* TODO: i18n — no translation key */}Type de mouvement</label>
            <select className="select" value={form.type} onChange={e => upd('type', e.target.value)}>
              <option value="payment">{/* TODO: i18n — no translation key */}Paiement reçu du client</option>
              <option value="credit">{/* TODO: i18n — no translation key */}Crédit accordé (geste commercial)</option>
            </select>
          </div>

          {/* Amount */}
          <div className="field">
            <label className="label">{t.payments.table.amount} <span style={{ color: 'var(--bad-500)' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <input className="input mono" type="number" min="0" value={form.amount}
                onChange={e => upd('amount', e.target.value)} placeholder="0" style={{ paddingRight: 48 }} />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--ink-400)', pointerEvents: 'none' }}>CAD</span>
            </div>
          </div>

          {/* Method */}
          <div className="field">
            <label className="label">{t.payments.table.method}</label>
            <select className="select" value={form.method} onChange={e => upd('method', e.target.value)}>
              <option value="interac">{t.payments.methods.interac}</option>
              <option value="cash">{t.payments.methods.cash}</option>
              <option value="mobilemoney">{/* TODO: i18n — no translation key */}Mobile Money</option>
              <option value="cheque">{/* TODO: i18n — no translation key */}Chèque</option>
              <option value="virement">{t.payments.methods.transfer}</option>
            </select>
          </div>

          {/* Reference */}
          <div className="field">
            <label className="label">{t.payments.table.reference} <span className="opt">{t.common.optional}</span></label>
            <input className="input mono" value={form.reference} onChange={e => upd('reference', e.target.value)} placeholder="ex: XK7F2A" />
          </div>

          {/* Note */}
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">{/* TODO: i18n — no key for "Note interne", using closest match */}{t.common.note} <span className="opt">{t.common.optional}</span></label>
            <input className="input" value={form.note} onChange={e => upd('note', e.target.value)} placeholder={/* TODO: i18n — no translation key */ "Contentieux, accord, …"} />
          </div>
        </div>

        {/* ── Right: Invoice allocation ── */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              {/* TODO: i18n — no translation key */}Affecter aux factures impayées
            </div>
            {unpaid.length > 0 && totalAmount > 0 && (
              <button className="btn btn--soft btn--xs" onClick={autoAllocate} style={{ fontSize: 11.5 }}>
                {/* TODO: i18n — no translation key */}✨ Auto-répartir
              </button>
            )}
          </div>

          {!selectedClient ? (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg-soft)', borderRadius: 10, border: '2px dashed var(--border)',
              color: 'var(--ink-400)', fontSize: 13, minHeight: 180,
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>👤</div>
                {/* TODO: i18n — no translation key */}Sélectionnez un client pour voir ses factures
              </div>
            </div>
          ) : !balance ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-400)', fontSize: 13 }}>{t.common.loading}</div>
          ) : unpaid.length === 0 ? (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8,
              background: 'var(--ok-50)', borderRadius: 10, border: '1px solid var(--ok-100)', minHeight: 120,
            }}>
              <div style={{ fontSize: 26 }}>✅</div>
              <div style={{ color: 'var(--ok-700)', fontWeight: 600, fontSize: 13 }}>{/* TODO: i18n — no translation key */}Toutes les factures sont réglées</div>
              <div style={{ color: 'var(--ok-600)', fontSize: 12 }}>{/* TODO: i18n — no translation key */}Ce montant sera crédité au compte client</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1, maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
                {unpaid.map(inv => {
                  const alloc   = Number(allocations[inv.id] || 0);
                  const checked = alloc > 0;
                  const isSupp  = inv.isSupplement;
                  return (
                    <div key={inv.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 8,
                      border: `1px solid ${checked ? (isSupp ? 'var(--info-600)' : 'var(--brand-300)') : (isSupp ? 'var(--info-100)' : 'var(--border)')}`,
                      background: checked ? (isSupp ? 'var(--info-50)' : 'var(--brand-50)') : (isSupp ? 'var(--info-50)' : 'white'),
                      transition: 'all .12s',
                    }}>
                      <input type="checkbox" checked={checked}
                        style={{ width: 15, height: 15, cursor: 'pointer', accentColor: isSupp ? 'var(--info-600)' : 'var(--brand-600)', flexShrink: 0 }}
                        onChange={e => {
                          if (e.target.checked) setAllocations(a => ({ ...a, [inv.id]: String(inv.remaining) }));
                          else setAllocations(a => { const n = { ...a }; delete n[inv.id]; return n; });
                        }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--ink-900)' }}>
                            {inv.trackingCode}
                          </span>
                          {isSupp && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'var(--info-100)', color: 'var(--info-700)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                              {/* TODO: i18n — no translation key */}Supplément
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 1 }}>
                          {/* TODO: i18n — mixed dynamic/static content, no translation keys for "Cargaison", "supplément dû", "solde dû" */}
                          Cargaison <strong>{inv.campaignCode}</strong> · {isSupp ? 'supplément dû' : 'solde dû'} : <strong style={{ color: isSupp ? 'var(--info-700)' : 'var(--bad-600)' }}>{inv.remaining.toLocaleString('fr')} CAD</strong>
                        </div>
                      </div>
                      {checked && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                          <input type="number" min="0" max={inv.remaining}
                            value={allocations[inv.id] || ''}
                            onChange={e => setAllocations(a => ({ ...a, [inv.id]: e.target.value }))}
                            style={{ width: 88, padding: '4px 8px', border: `1px solid ${isSupp ? 'var(--info-600)' : 'var(--brand-300)'}`, borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 13, textAlign: 'right' }} />
                          <span style={{ fontSize: 11, color: 'var(--ink-400)' }}>CAD</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Running totals bar */}
              {totalAmount > 0 && (
                <div style={{ marginTop: 12, background: 'var(--bg-soft)', borderRadius: 8, padding: '12px 14px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {/* TODO: i18n — no translation keys for 'Reçu', 'Alloué', 'Crédit client', 'Dépassement' */}
                  {[
                    { label: 'Reçu',     val: totalAmount,    color: 'var(--ink-800)' },
                    { label: 'Alloué',   val: totalAllocated, color: 'var(--ok-700)' },
                    { label: credit >= 0 ? 'Crédit client' : 'Dépassement', val: Math.abs(credit), color: credit > 0 ? 'var(--brand-600)' : credit < 0 ? 'var(--bad-600)' : 'var(--ink-400)' },
                  ].map(k => (
                    <div key={k.label}>
                      <div style={{ fontSize: 10, color: 'var(--ink-400)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>{k.label}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color: k.color }}>
                        {k.val.toLocaleString('fr')} <span style={{ fontSize: 10, fontWeight: 400, opacity: .7 }}>CAD</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {credit > 0 && totalAmount > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--brand-700)', background: 'var(--brand-50)', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--brand-100)' }}>
                  {/* TODO: i18n — no translation key */}
                  💳 {credit.toLocaleString('fr')} CAD non alloués seront crédités sur le compte de {selectedClient?.name?.split(' ')[0]}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ─── Transactions list tab ──────────────────────────────── */

function TransactionsTab({ onRecord, onNav }) {
  const t = useAdminT();
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    fetch('/api/transactions').then(r => r.json()).then(d => {
      setRows(Array.isArray(d) ? d : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = rows.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.clientName?.toLowerCase().includes(q)
      || r.reference?.toLowerCase().includes(q)
      || r.allocations?.some(a => a.trackingCode?.toLowerCase().includes(q));
  });

  return (
    <>
      <div className="toolbar">
        <div style={{ position: 'relative' }}>
          <I.Search style={{ position: 'absolute', left: 10, top: 9, width: 14, height: 14, color: 'var(--ink-400)' }} />
          <input className="input input--sm" placeholder={'Rechercher un client, colis…'} style={{ width: 260, paddingLeft: 32 }}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <table className="tbl" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <thead>
          <tr>
            <th style={{ borderRadius: 0 }}>{t.common.date}</th>
            <th>{t.payments.table.client}</th>
            <th>{t.common.type}</th>
            <th style={{ textAlign: 'right' }}>{t.payments.table.amount}</th>
            <th>{t.payments.table.method}</th>
            <th>{t.payments.table.reference}</th>
            <th>{/* TODO: i18n — no translation key */}Colis soldés</th>
            <th>{/* TODO: i18n — no translation key */}Crédit généré</th>
            <th>{/* TODO: i18n — no translation key */}Agent</th>
            <th style={{ borderRadius: 0 }}>{t.common.note}</th>
            <th style={{ borderRadius: 0 }}></th>
          </tr>
        </thead>
        <tbody>
          {loading && [1,2,3,4].map(i => (
            <tr key={i}>
              <td><Skel w={72} h={12} /></td>
              <td><Skel w={110} h={13} style={{ marginBottom: 4 }} /><Skel w={80} h={10} /></td>
              <td><Skel w={70} h={20} r={999} /></td>
              <td><Skel w={70} h={13} style={{ marginLeft: 'auto' }} /></td>
              <td><Skel w={80} h={12} /></td>
              <td><Skel w={60} h={12} /></td>
              <td><Skel w={120} h={12} /></td>
              <td><Skel w={60} h={12} /></td>
              <td><Skel w={28} h={28} r={999} /></td>
              <td><Skel w={80} h={12} /></td>
              <td></td>
            </tr>
          ))}
          {!loading && filtered.length === 0 && (
            <tr>
              <td colSpan={11} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-400)', fontSize: 13 }}>
                {search ? t.common.noData : /* TODO: i18n — no translation key */ 'Aucune transaction enregistrée'}
              </td>
            </tr>
          )}
          {!loading && filtered.map(r => {
            const allocs = Array.isArray(r.allocations) ? r.allocations : [];
            const credit = r.amount - r.totalAllocated;
            const dateStr = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(r.createdAt));
            return (
              <tr key={r.id} style={r.isLegacy ? { background: 'var(--surface-soft, #fafafa)', color: 'var(--ink-600)' } : undefined}>
                <td className="mono" style={{ fontSize: 12, color: 'var(--ink-500)' }}>{dateStr}</td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{r.clientName}</div>
                  <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>{r.clientPhone ?? '—'}</div>
                </td>
                <td>
                  <span className={'badge badge--dot badge--' + (r.isLegacy ? 'neutral' : r.type === 'credit' ? 'brand' : 'ok')}>
                    {/* TODO: i18n — TYPE_LABELS has no translation keys; 'Direct (ancien)' also has no key */}
                    {r.isLegacy ? 'Direct (ancien)' : (TYPE_LABELS[r.type] ?? r.type)}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span className="mono" style={{ fontWeight: 700, color: 'var(--ok-700)', fontSize: 13 }}>
                    {r.amount.toLocaleString('fr')}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--ok-600)', marginLeft: 3 }}>CAD</span>
                </td>
                <td style={{ fontSize: 12, color: 'var(--ink-600)' }}>{t.payments.methods?.[r.method] ?? METHOD_LABELS[r.method] ?? r.method}</td>
                <td className="mono" style={{ fontSize: 12, color: 'var(--ink-600)' }}>{r.reference ?? '—'}</td>
                <td style={{ fontSize: 12 }}>
                  {allocs.length === 0 ? (
                    <span style={{ color: 'var(--ink-300)' }}>—</span>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {allocs.map((a, i) => (
                        <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--ok-50)', color: 'var(--ok-700)', padding: '2px 7px', borderRadius: 999, border: '1px solid var(--ok-100)', fontWeight: 600 }}>
                          {a.trackingCode}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td>
                  {credit > 0 ? (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--brand-600)' }}>+{credit.toLocaleString('fr')} CAD</span>
                  ) : (
                    <span style={{ color: 'var(--ink-300)' }}>—</span>
                  )}
                </td>
                <td>
                  {r.recordedByName
                    ? <Avatar initials={r.recordedByName.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()} size="sm" />
                    : <span style={{ color: 'var(--ink-300)', fontSize: 12 }}>—</span>}
                </td>
                <td style={{ fontSize: 12, color: 'var(--ink-500)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.note ?? '—'}
                </td>
                <td>
                  {!r.isLegacy && onNav && (
                    <button
                      className="btn btn--ghost btn--xs"
                      onClick={() => onNav('/admin/receipts/' + r.id)}
                      title="Voir le reçu"
                    >
                      📄
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

/* ─── Invoice preview modal ──────────────────────────────── */

function fmt(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function InvoicePreviewModal({ parcelId, onClose }) {
  const t = useAdminT();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [paymentEmail, setPaymentEmail] = useState('incjumla@gmail.com');
  const [adjMode, setAdjMode] = useState(false);

  useEffect(() => {
    fetch('/api/public/config').then(r => r.json()).then(d => {
      if (d.paymentEmail) setPaymentEmail(d.paymentEmail);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/admin/invoice/' + parcelId)
      .then(r => r.json())
      .then(json => { if (json.error) setError(json.error); else setData(json); setLoading(false); })
      .catch(() => { setError(t.common.networkError); setLoading(false); });
  }, [parcelId]);

  function printInvoice() {
    const el = document.getElementById('invoice-print-area');
    if (!el) return;
    const win = window.open('', '_blank', 'width=860,height=900');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Facture</title>
      <style>
        body { font-family: system-ui, sans-serif; margin: 0; background: white; }
        * { box-sizing: border-box; }
      </style>
    </head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  }

  const paid = data?.payment?.status === 'completed' || data?.payment?.status === 'paid';
  const hasAdj = data?.confirmedPriceXaf != null && data?.adjustmentStatus !== 'none';
  const supplement = hasAdj ? (data.confirmedPriceXaf - (data.priceXaf ?? 0)) : 0;

  return (
    <Modal title={adjMode ? 'Facture — Supplément' : 'Facture'} onClose={onClose} width={780}>
      {loading && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-400)' }}>{t.common.loading}</div>
      )}
      {error && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--bad-600)' }}>{error}</div>
      )}
      {data && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 8, alignItems: 'center' }}>
            {hasAdj ? (
              <div style={{ display: 'flex', background: 'var(--bg-soft)', borderRadius: 8, padding: 3, gap: 3 }}>
                <button
                  className={'btn btn--xs ' + (!adjMode ? 'btn--brand' : 'btn--ghost')}
                  onClick={() => setAdjMode(false)}
                >{/* TODO: i18n — no translation key */}Facture principale</button>
                <button
                  className={'btn btn--xs ' + (adjMode ? 'btn--brand' : 'btn--ghost')}
                  onClick={() => setAdjMode(true)}
                >{/* TODO: i18n — no translation key */}Facture supplément</button>
              </div>
            ) : <div />}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn--ghost btn--sm" onClick={onClose}>{t.common.close}</button>
              <button className="btn btn--brand btn--sm" onClick={printInvoice}>
                <I.Print style={{ width: 14, height: 14 }} />
                {t.common.print}{/* TODO: i18n — "/ PDF" suffix has no translation key */} / PDF
              </button>
            </div>
          </div>

          {/* TODO: i18n — invoice print body below is a customer-facing document template; all labels within use French and are not translated via t.* */}
          <div id="invoice-print-area" style={{ background: 'white', borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            {/* Header */}
            <div style={{ background: adjMode ? 'var(--info-700)' : '#1e3a5f', color: 'white', padding: '28px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.02em' }}>Jumla Shipping</div>
                <div style={{ fontSize: 12, opacity: .7, marginTop: 3 }}>Fret international · Douala · Montréal</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>
                  {adjMode ? data.invoiceNumber + '-SUP' : data.invoiceNumber}
                </div>
                <div style={{ fontSize: 12, opacity: .7, marginTop: 3 }}>Émis le {fmt(data.issueDate)}</div>
                {adjMode && <div style={{ fontSize: 11, opacity: .8, marginTop: 2 }}>Facture de supplément</div>}
                <div style={{
                  display: 'inline-block', marginTop: 8, padding: '3px 10px', borderRadius: 999,
                  background: paid ? '#16a34a' : '#f59e0b', fontSize: 11, fontWeight: 700,
                }}>
                  {paid ? '✓ PAYÉ' : '⏳ EN ATTENTE'}
                </div>
              </div>
            </div>

            <div style={{ padding: '28px 36px' }}>
              {/* Bill to / Campaign */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 28 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6b7280', marginBottom: 6 }}>Facturé à</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{data.client.name}</div>
                  {data.client.city  && <div style={{ fontSize: 13, color: '#4b5563', marginTop: 2 }}>{data.client.city}</div>}
                  {data.client.phone && <div style={{ fontSize: 13, color: '#4b5563', fontFamily: 'monospace' }}>{data.client.phone}</div>}
                  {data.client.email && <div style={{ fontSize: 13, color: '#4b5563' }}>{data.client.email}</div>}
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6b7280', marginBottom: 6 }}>Cargaison</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>{data.campaign.code}</div>
                  <div style={{ fontSize: 13, color: '#4b5563', marginTop: 2 }}>{data.campaign.from} → {data.campaign.to}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Départ : {fmt(data.campaign.departureDate)}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Arrivée estimée : {fmt(data.campaign.arrivalDate)}</div>
                </div>
              </div>

              {/* Items table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Description', 'Poids', 'Montant'].map(h => (
                      <th key={h} style={{ padding: '9px 12px', textAlign: h === 'Montant' ? 'right' : 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {adjMode ? (
                    <>
                      <tr>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6', color: '#111827', fontSize: 13 }}>
                          <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--info-700)', marginBottom: 2 }}>{data.trackingCode}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>Estimation initiale (réservation)</div>
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6', color: '#9ca3af', fontFamily: 'monospace', fontSize: 13 }}>—</td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right', fontFamily: 'monospace', fontSize: 13, color: '#9ca3af', textDecoration: 'line-through' }}>
                          {(data.priceXaf ?? 0).toLocaleString('fr')} CAD
                        </td>
                      </tr>
                      <tr style={{ background: 'var(--info-50)' }}>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6', color: 'var(--info-700)', fontSize: 13 }}>
                          <div style={{ fontWeight: 700 }}>Ajustement de prix</div>
                          <div style={{ fontSize: 12, color: 'var(--info-600)', marginTop: 2 }}>Poids réel mesuré à l'entrepôt — supplément dû</div>
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6', color: 'var(--info-600)', fontFamily: 'monospace', fontSize: 13 }}>
                          {data.weightKg ? data.weightKg + ' kg' : '—'}
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right', fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: 'var(--info-700)' }}>
                          +{supplement.toLocaleString('fr')} CAD
                        </td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6', color: '#111827', fontSize: 13 }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e3a5f', marginBottom: 2 }}>{data.trackingCode}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{data.description || 'Fret international'}</div>
                        {data.bordereaux.length > 0 && (
                          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
                            {data.bordereaux.length} bordereau{data.bordereaux.length > 1 ? 'x' : ''} · {data.bordereaux.reduce((s, b) => s + (b.nbPieces || 0), 0)} pièce{data.bordereaux.reduce((s, b) => s + (b.nbPieces || 0), 0) > 1 ? 's' : ''}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6', color: '#374151', fontFamily: 'monospace', fontSize: 13 }}>
                        {data.weightKg ? data.weightKg + ' kg' : '—'}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right', fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#111827' }}>
                        {data.amount.toLocaleString('fr')} CAD
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
                <div style={{ minWidth: 240 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: adjMode ? 'var(--info-700)' : '#1e3a5f', borderRadius: 8, color: 'white' }}>
                    <span style={{ fontWeight: 700 }}>{adjMode ? 'Supplément dû' : 'Total'}</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 16 }}>
                      {adjMode ? supplement.toLocaleString('fr') : data.amount.toLocaleString('fr')} CAD
                    </span>
                  </div>
                  {paid && data.payment?.paidAt && (
                    <div style={{ textAlign: 'right', fontSize: 11, color: '#16a34a', marginTop: 5, fontWeight: 600 }}>
                      Payé le {fmt(data.payment.paidAt)}
                      {data.payment.interacRef && <span> · Réf. {data.payment.interacRef}</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment instructions if unpaid */}
              {!paid && (
                <div style={{ background: 'var(--info-50)', border: '1px solid var(--info-100)', borderRadius: 8, padding: '14px 18px', marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, color: 'var(--info-700)', marginBottom: 5, fontSize: 13 }}>Modalités de paiement</div>
                  <div style={{ fontSize: 12, color: '#78350f', lineHeight: 1.6 }}>
                    Effectuez un virement Interac e-Transfert à <strong>{paymentEmail}</strong> pour le montant de{' '}
                    <strong>{adjMode ? supplement.toLocaleString('fr') : data.amount.toLocaleString('fr')} CAD</strong>.
                    Indiquez le code <strong style={{ fontFamily: 'monospace' }}>{data.trackingCode}</strong> en message.
                  </div>
                </div>
              )}

              {/* Footer */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af' }}>
                <span>Jumla Shipping Inc. · info@jumlas.com</span>
                <span>Douala · Montréal · Lagos · Bruxelles</span>
              </div>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

/* ─── Invoice Settle Modal (focused per-invoice) ─────────── */

function InvoiceSettleModal({ invoice, onClose, onSave }) {
  const t = useAdminT();
  const [balance, setBalance] = useState(null);
  const [mode, setMode]       = useState('full');
  const [form, setForm]       = useState({ method: 'interac', reference: '', note: '', amount: '' });
  const [checked, setChecked] = useState({});
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState('');

  useEffect(() => {
    fetch(`/api/clients/${invoice.clientId}/balance`)
      .then(r => r.json())
      .then(d => {
        setBalance(d);
        const init = {};
        if (d.unpaidInvoices?.find(i => i.id === invoice.id)) init[invoice.id] = true;
        const suppId = 'sup_' + invoice.parcelId;
        if (d.unpaidInvoices?.find(i => i.id === suppId)) init[suppId] = true;
        setChecked(init);
      })
      .catch(() => setBalance({ unpaidInvoices: [] }));
  }, [invoice.clientId, invoice.id, invoice.parcelId]);

  const allLines     = balance?.unpaidInvoices ?? [];
  const lines        = allLines.filter(l => l.id === invoice.id || l.id === 'sup_' + invoice.parcelId);
  const selected     = lines.filter(l => checked[l.id]);
  const totalDue     = selected.reduce((s, l) => s + l.remaining, 0);
  const amount       = mode === 'full' ? totalDue : (Number(form.amount) || 0);

  const handleSave = async () => {
    if (!amount) { setErr(/* TODO: i18n — no translation key */ 'Montant requis'); return; }
    if (selected.length === 0) { setErr(/* TODO: i18n — no translation key */ 'Sélectionnez au moins une ligne'); return; }
    setSaving(true); setErr('');
    let left = amount;
    const allocs = [];
    for (const line of selected) {
      if (left <= 0) break;
      const a = Math.min(left, line.remaining);
      allocs.push({ paymentId: line.id, amount: a });
      left -= a;
    }
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: invoice.clientId, amount,
        type: 'payment', method: form.method,
        reference: form.reference || null,
        note: form.note || null,
        allocations: allocs,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.ok) onSave(json.transactionId);
    else {
      const msg = json.error || /* TODO: i18n — no translation key */ 'Erreur serveur';
      setErr(msg.includes('non initialisées') || msg.includes('does not exist')
        ? 'Tables manquantes — visitez /api/db-migrate dans votre navigateur puis réessayez.'
        : msg);
      setSaving(false);
    }
  };

  return (
    <Modal width={500} onClose={onClose}
      title={/* TODO: i18n — "Règlement" has no translation key */ `Règlement · ${invoice.parcel}`}
      sub={`${invoice.recipName} · Cargaison ${invoice.campaign}`}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>{t.common.cancel}</button>
          <div style={{ flex: 1 }} />
          {err && <span style={{ fontSize: 12, color: 'var(--bad-600)' }}>{err}</span>}
          <button className="btn btn--brand" onClick={handleSave}
            disabled={saving || !amount || selected.length === 0}>
            <I.Check />{saving ? t.common.saving : t.common.save}
          </button>
        </>
      }
    >
      {!balance ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--ink-400)', fontSize: 13 }}>{t.common.loading}</div>
      ) : lines.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--ok-600)', fontSize: 14, fontWeight: 600 }}>{/* TODO: i18n — no translation key */}✓ Toutes les lignes sont réglées</div>
      ) : (
        <>
          {/* Lines */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-400)', marginBottom: 10 }}>{/* TODO: i18n — no translation key */}Lignes à régler</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lines.map(line => {
                const on = !!checked[line.id];
                const sup = line.isSupplement;
                return (
                  <label key={line.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    borderRadius: 8, cursor: 'pointer', transition: 'all .12s',
                    border: `1px solid ${on ? (sup ? 'var(--info-600)' : 'var(--brand-300)') : 'var(--border)'}`,
                    background: on ? (sup ? 'var(--info-50)' : 'var(--brand-50)') : 'white',
                  }}>
                    <input type="checkbox" checked={on}
                      style={{ width: 15, height: 15, accentColor: sup ? 'var(--info-600)' : 'var(--brand-600)', flexShrink: 0 }}
                      onChange={e => setChecked(c => ({ ...c, [line.id]: e.target.checked }))} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: sup ? 'var(--info-700)' : 'var(--ink-900)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {/* TODO: i18n — no translation keys for 'Supplément — ajustement de prix' / 'Facture principale' */}
                        {sup ? 'Supplément — ajustement de prix' : 'Facture principale'}
                        {sup && <span style={{ fontSize: 10, padding: '1px 6px', background: 'var(--info-100)', color: 'var(--info-700)', borderRadius: 4, fontWeight: 700 }}>SUP</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 2 }}>{/* TODO: i18n — no translation key */}Solde restant</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color: sup ? 'var(--info-700)' : 'var(--ink-900)' }}>
                        {line.remaining.toLocaleString('fr')}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--ink-400)', marginLeft: 3 }}>CAD</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Mode toggle */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-400)', marginBottom: 8 }}>{/* TODO: i18n — no translation key */}Mode de règlement</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {/* TODO: i18n — no translation keys for 'Intégral', 'Acompte / Partiel', 'Montant à saisir' */}
              {[
                { id: 'full',    label: 'Intégral',         sub: `${totalDue.toLocaleString('fr')} CAD` },
                { id: 'partial', label: 'Acompte / Partiel', sub: 'Montant à saisir' },
              ].map(m => (
                <button key={m.id} onClick={() => setMode(m.id)} style={{
                  flex: 1, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                  border: `1px solid ${mode === m.id ? 'var(--brand-400)' : 'var(--border)'}`,
                  background: mode === m.id ? 'var(--brand-50)' : 'white',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: mode === m.id ? 'var(--brand-700)' : 'var(--ink-800)' }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: mode === m.id ? 'var(--brand-500)' : 'var(--ink-400)', marginTop: 2 }}>{m.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Partial amount */}
          {mode === 'partial' && (
            <div className="field" style={{ marginBottom: 16 }}>
              <label className="label">{/* TODO: i18n — no translation key */}Montant reçu</label>
              <div style={{ position: 'relative' }}>
                <input className="input mono" type="number" min="0" max={totalDue}
                  value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0" style={{ paddingRight: 48 }} />
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--ink-400)', pointerEvents: 'none' }}>CAD</span>
              </div>
            </div>
          )}

          {/* Total recap */}
          <div style={{ background: 'var(--bg-soft)', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: 'var(--ink-600)', fontWeight: 600 }}>
              {/* TODO: i18n — no translation keys for 'Montant à enregistrer' / 'Versement' */}
              {mode === 'full' ? 'Montant à enregistrer' : 'Versement'}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 16, color: 'var(--ink-900)' }}>
              {(amount || 0).toLocaleString('fr')} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--ink-400)' }}>CAD</span>
            </span>
          </div>

          {/* Method + Reference */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="field">
              <label className="label">{t.payments.table.method}</label>
              <select className="input" value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
                {Object.entries(METHOD_LABELS).map(([v, l]) => <option key={v} value={v}>{t.payments.methods?.[v] ?? l}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label">{t.payments.table.reference} <span style={{ color: 'var(--ink-400)', fontWeight: 400 }}>{t.common.optional}</span></label>
              <input className="input" value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} placeholder="ex: XK7F2A" />
            </div>
          </div>
          <div className="field">
            <label className="label">{/* TODO: i18n — no key for "Note interne", using closest match */}{t.common.note} <span style={{ color: 'var(--ink-400)', fontWeight: 400 }}>{t.common.optional}</span></label>
            <input className="input" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder={/* TODO: i18n — no translation key */ "Contentieux, accord, …"} />
          </div>
        </>
      )}
    </Modal>
  );
}

/* ─── Invoices list tab (existing payments) ──────────────── */

function InvoicesTab({ onReload, onNav }) {
  const t = useAdminT();
  const can = useCan();
  const [payments, setPayments]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState('all');
  const [search, setSearch]             = useState('');
  const [invoiceParcelId, setInvoiceParcelId] = useState(null);
  const [settleInvoice, setSettleInvoice] = useState(null);

  const loadPayments = () => {
    setLoading(true);
    fetch('/api/payments').then(r => r.json()).then(d => {
      setPayments(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  };

  useEffect(() => { loadPayments(); }, []);

  const isEnCours = p => p.status === 'pending' || p.status === 'unpaid' || p.status === 'partial';

  const tabs = [
    { id: 'all',      l: 'Tous',     n: payments.length },
    { id: 'paid',     l: 'Payés',    n: payments.filter(p => p.status === 'paid').length,  cls: 'ok'   },
    { id: 'encours',  l: 'En cours', n: payments.filter(isEnCours).length,                 cls: 'warn' },
    { id: 'partial',  l: 'Partiel',  n: payments.filter(p => p.status === 'partial').length, cls: 'warn' },
  ];

  const filtered = payments
    .filter(p => tab === 'all' || (tab === 'encours' ? isEnCours(p) : p.status === tab))
    .filter(p => {
      if (!search) return true;
      const q = search.toLowerCase();
      return p.recipName?.toLowerCase().includes(q) || p.parcel?.toLowerCase().includes(q) || p.campaign?.toLowerCase().includes(q);
    });

  return (
    <>
      <div className="toolbar">
        <div className="tabs">
          {tabs.map(tabItem => (
            <button key={tabItem.id} className={'tab ' + (tab === tabItem.id ? 'is-active' : '')} onClick={() => setTab(tabItem.id)}>
              {tabItem.l} <span className="count">{tabItem.n}</span>
            </button>
          ))}
        </div>
        <div className="spacer" />
        <div style={{ position: 'relative' }}>
          <I.Search style={{ position: 'absolute', left: 10, top: 9, width: 14, height: 14, color: 'var(--ink-400)' }} />
          <input className="input input--sm" placeholder={'Rechercher un client, colis…'} style={{ width: 240, paddingLeft: 32 }}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {invoiceParcelId && (
        <InvoicePreviewModal parcelId={invoiceParcelId} onClose={() => setInvoiceParcelId(null)} />
      )}
      {settleInvoice && (
        <InvoiceSettleModal
          invoice={settleInvoice}
          onClose={() => setSettleInvoice(null)}
          onSave={(txId) => { setSettleInvoice(null); loadPayments(); onReload?.(); if (txId && onNav) onNav('/admin/receipts/' + txId); }}
        />
      )}

      <table className="tbl" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <thead>
          <tr>
            <th style={{ borderRadius: 0 }}>{t.common.date}</th>
            <th>{t.payments.table.client}</th>
            <th>{/* TODO: i18n — no "Cargaison" key in t.payments.table */}Cargaison</th>
            <th>{/* TODO: i18n — no "Colis" key in t.payments.table */}Colis</th>
            <th style={{ textAlign: 'right' }}>{/* TODO: i18n — no "Facturé" key, closest is t.payments.table.amount */}Facturé</th>
            <th>{t.common.status}</th>
            <th>{t.payments.table.reference}</th>
            <th style={{ borderRadius: 0, width: 140 }}></th>
          </tr>
        </thead>
        <tbody>
          {loading && [1,2,3,4,5].map(i => (
            <tr key={i}>
              <td><Skel w={72} h={12} /></td>
              <td><Skel w={100} h={13} style={{ marginBottom: 4 }} /><Skel w={80} h={10} /></td>
              <td><Skel w={64} h={13} /></td>
              <td><Skel w={80} h={13} /></td>
              <td><Skel w={60} h={13} style={{ marginLeft: 'auto' }} /></td>
              <td><Skel w={70} h={20} r={999} /></td>
              <td><Skel w={60} h={12} /></td>
              <td><Skel w={80} h={26} r={6} /></td>
            </tr>
          ))}
          {!loading && filtered.length === 0 && (
            <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-400)', fontSize: 13 }}>Aucun paiement</td></tr>
          )}
          {!loading && filtered.flatMap(p => {
            const s = PAY_STATUS[p.status] ?? { label: p.status, cls: 'neutral' };
            const suppAmt = p.confirmedPriceXaf != null && p.adjustmentStatus === 'pending'
              ? Math.max(0, p.confirmedPriceXaf - (p.priceXaf ?? p.amount ?? 0))
              : 0;
            const suppAmtPaid = p.confirmedPriceXaf != null && p.adjustmentStatus === 'paid'
              ? Math.max(0, p.confirmedPriceXaf - (p.priceXaf ?? p.amount ?? 0))
              : 0;
            const hasChildRow = suppAmt > 0 || suppAmtPaid > 0;

            const mainRow = (
              <tr key={p.id} style={{ borderBottom: hasChildRow ? 'none' : undefined }}>
                <td className="mono" style={{ fontSize: 12, color: 'var(--ink-500)' }}>{p.date}</td>
                <td>
                  <div style={{ fontWeight: 600 }}>{p.recipName}</div>
                  <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>{p.recipPhone}</div>
                </td>
                <td className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{p.campaign}</td>
                <td className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{p.parcel}</td>
                <td style={{ textAlign: 'right' }}>
                  <span className="mono" style={{ fontWeight: 700 }}>{(p.due || 0).toLocaleString('fr')}</span>
                  <span style={{ fontSize: 11, color: 'var(--ink-400)', marginLeft: 3 }}>CAD</span>
                </td>
                <td><span className={'badge badge--dot badge--' + s.cls}>{s.label}</span></td>
                <td className="mono" style={{ fontSize: 12, color: 'var(--ink-500)' }}>{p.interacRef ?? '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
                    <button className="btn btn--ghost btn--xs" title={/* TODO: i18n — no translation key */ "Voir la facture"}
                      onClick={() => setInvoiceParcelId(p.parcelId)} style={{ padding: '4px 8px' }}>
                      <I.FileText style={{ width: 13, height: 13 }} />
                    </button>
                    {p.status === 'paid'
                      ? <span style={{ fontSize: 12, color: 'var(--ok-600)' }}>✓ {t.paymentStatus.completed}</span>
                      : can('payments', 'validate')
                        ? <button className="btn btn--brand btn--xs" onClick={() => setSettleInvoice(p)}>
                            <I.Wallet />{t.payments.settle}
                          </button>
                        : <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>{t.paymentStatus.pending}</span>}
                  </div>
                </td>
              </tr>
            );

            if (!hasChildRow) return [mainRow];

            // Supplement child row
            const suppRow = suppAmt > 0
              ? (
              <tr key={'sup_' + p.parcelId} style={{ background: 'var(--info-50)', borderBottom: '1px solid var(--info-100)' }}>
                <td style={{ paddingLeft: 24, fontSize: 13, color: 'var(--info-600)' }}>↳</td>
                <td>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--info-700)' }}>
                    {/* TODO: i18n — no translation key */}Ajustement de prix
                  </span>
                  <span style={{ marginLeft: 6, fontSize: 10, padding: '1px 6px', background: 'var(--info-100)', color: 'var(--info-700)', borderRadius: 4, fontWeight: 700 }}>SUP</span>
                </td>
                <td className="mono" style={{ fontSize: 12, color: 'var(--ink-400)' }}>{p.campaign}</td>
                <td className="mono" style={{ fontSize: 12, color: 'var(--info-700)' }}>{p.parcel}</td>
                <td style={{ textAlign: 'right' }}>
                  <span className="mono" style={{ fontWeight: 700, color: 'var(--info-700)' }}>{suppAmt.toLocaleString('fr')}</span>
                  <span style={{ fontSize: 11, color: 'var(--ink-400)', marginLeft: 3 }}>CAD</span>
                </td>
                <td><span className="badge badge--dot badge--warn">{t.paymentStatus.pending}</span></td>
                <td style={{ color: 'var(--ink-300)', fontSize: 12 }}>—</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button className="btn btn--ghost btn--xs" title={/* TODO: i18n — no translation key */ "Facture supplément"}
                      onClick={() => setInvoiceParcelId(p.parcelId)} style={{ padding: '4px 8px' }}>
                      <I.FileText style={{ width: 13, height: 13 }} />
                    </button>
                    {can('payments', 'validate') && (
                      <button
                        onClick={() => setSettleInvoice({ ...p, id: 'sup_' + p.parcelId, due: suppAmt, status: 'pending' })}
                        style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid var(--info-600)', background: 'var(--info-50)', color: 'var(--info-700)', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <I.Wallet style={{ width: 12, height: 12 }} />{/* TODO: i18n — no translation key */}Régler suppl.
                      </button>
                    )}
                  </div>
                </td>
              </tr>
              ) : (
              // Paid supplement — green "Réglé" row
              <tr key={'sup_' + p.parcelId} style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
                <td style={{ paddingLeft: 24, fontSize: 13, color: 'var(--ok-600)' }}>↳</td>
                <td>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ok-700)' }}>
                    {/* TODO: i18n — no translation key */}Ajustement de prix
                  </span>
                  <span style={{ marginLeft: 6, fontSize: 10, padding: '1px 6px', background: '#dcfce7', color: 'var(--ok-700)', borderRadius: 4, fontWeight: 700 }}>SUP</span>
                </td>
                <td className="mono" style={{ fontSize: 12, color: 'var(--ink-400)' }}>{p.campaign}</td>
                <td className="mono" style={{ fontSize: 12, color: 'var(--ok-700)' }}>{p.parcel}</td>
                <td style={{ textAlign: 'right' }}>
                  <span className="mono" style={{ fontWeight: 700, color: 'var(--ok-700)' }}>{suppAmtPaid.toLocaleString('fr')}</span>
                  <span style={{ fontSize: 11, color: 'var(--ink-400)', marginLeft: 3 }}>CAD</span>
                </td>
                <td><span className="badge badge--dot badge--ok">{t.paymentStatus.completed}</span></td>
                <td style={{ color: 'var(--ink-300)', fontSize: 12 }}>—</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button className="btn btn--ghost btn--xs" title={/* TODO: i18n — no translation key */ "Facture supplément"}
                      onClick={() => setInvoiceParcelId(p.parcelId)} style={{ padding: '4px 8px' }}>
                      <I.FileText style={{ width: 13, height: 13 }} />
                    </button>
                    <span style={{ fontSize: 12, color: 'var(--ok-600)' }}>✓ {t.paymentStatus.completed}</span>
                  </div>
                </td>
              </tr>
              );

            return [mainRow, suppRow];
          })}
        </tbody>
      </table>
    </>
  );
}

/* ─── Main Payments screen ───────────────────────────────── */

export default function PaymentsScreen({ onNav }) {
  const t = useAdminT();
  const can = useCan();
  const [mainTab, setMainTab]   = useState('transactions');
  const [modal, setModal]       = useState(null);
  const [payments, setPayments] = useState([]);
  const [loadingKpi, setLoadingKpi] = useState(true);

  useEffect(() => {
    fetch('/api/payments').then(r => r.json()).then(d => {
      setPayments(Array.isArray(d) ? d : []);
      setLoadingKpi(false);
    });
  }, []);

  // KPIs using enriched data from API (allocated, invoiced, collected, remaining)
  const facture = payments.reduce((s, p) => s + (p.invoiced ?? p.amount ?? 0), 0);
  const percu   = payments.reduce((s, p) => s + (p.collected ?? (p.status === 'paid' ? p.amount : 0)), 0);
  const impayes = payments.reduce((s, p) => s + (p.remaining ?? (p.status !== 'paid' && p.status !== 'refunded' ? p.amount : 0)), 0);
  const taux    = facture > 0 ? Math.round(percu / facture * 100) : 0;
  const nbImpayes = payments.filter(p => (p.remaining ?? 0) > 0).length;

  const reloadKpi = () => {
    fetch('/api/payments').then(r => r.json()).then(d => setPayments(Array.isArray(d) ? d : []));
  };

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__title">{t.payments.title}</div>
          <div className="page__sub">{/* TODO: i18n — no translation key */}Transactions reçues et suivi des factures</div>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost"><I.Download />{t.parcels.exportCsv}</button>
          {can('payments', 'validate') && (
            <button className="btn btn--brand" onClick={() => setModal({})}>
              <I.Plus />{/* TODO: i18n — no "Record payment" key; t.payments.settle is closest */}Enregistrer paiement
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
        {/* TODO: i18n — KPI labels 'Facturé', 'Perçu', 'Impayés', 'Taux recouvrement' have no keys in t.payments or t.analytics.kpi */}
        <div className="kpi">
          <div className="kpi__label">Facturé <span style={{ textTransform: 'none', color: 'var(--ink-300)' }}>/ Invoiced</span></div>
          <div className="kpi__value">{facture.toLocaleString('fr')} <span style={{ fontSize: 14, color: 'var(--ink-400)' }}>CAD</span></div>
          <div className="kpi__delta">{payments.length} {/* TODO: i18n — no translation key for "facture(s)" */}facture{payments.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="kpi" style={{ background: 'var(--ok-50)', borderColor: 'var(--ok-100)' }}>
          <div className="kpi__label" style={{ color: 'var(--ok-700)' }}>Perçu <span style={{ textTransform: 'none', opacity: .6 }}>/ Collected</span></div>
          <div className="kpi__value" style={{ color: 'var(--ok-700)' }}>{percu.toLocaleString('fr')} <span style={{ fontSize: 14, opacity: .6 }}>CAD</span></div>
          <Progress pct={taux} />
        </div>
        <div className="kpi" style={{ background: 'var(--warn-50)', borderColor: 'var(--warn-100)' }}>
          <div className="kpi__label" style={{ color: 'var(--warn-700)' }}>En cours <span style={{ textTransform: 'none', opacity: .6 }}>/ Outstanding</span></div>
          <div className="kpi__value" style={{ color: 'var(--warn-700)' }}>{impayes.toLocaleString('fr')} <span style={{ fontSize: 14, opacity: .6 }}>CAD</span></div>
          <div className="kpi__delta" style={{ color: 'var(--warn-600)' }}>
            {nbImpayes} {t.paymentStatus.pending}
          </div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Taux recouvrement</div>
          <div className="kpi__value">{taux}<span style={{ fontSize: 14, color: 'var(--ink-400)' }}>%</span></div>
          <Progress pct={taux} />
        </div>
      </div>

      {/* Main tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
        {/* TODO: i18n — no translation keys for tab labels 'Paiements reçus' / 'Factures' */}
        {[
          { id: 'transactions', label: 'Paiements reçus', icon: '💳' },
          { id: 'invoices',     label: 'Factures',         icon: '📄' },
        ].map(tabItem => (
          <button key={tabItem.id}
            onClick={() => setMainTab(tabItem.id)}
            style={{
              padding: '11px 20px', border: 'none', cursor: 'pointer',
              background: 'none', fontSize: 13.5, fontWeight: mainTab === tabItem.id ? 700 : 400,
              color: mainTab === tabItem.id ? 'var(--brand-700)' : 'var(--ink-500)',
              borderBottom: mainTab === tabItem.id ? '2px solid var(--brand-500)' : '2px solid transparent',
              marginBottom: -1,
            }}>
            {tabItem.icon} {tabItem.label}
          </button>
        ))}
      </div>

      {mainTab === 'transactions' && (
        <TransactionsTab key="tx" onRecord={() => setModal({})} onNav={onNav} />
      )}
      {mainTab === 'invoices' && (
        <InvoicesTab key="inv" onReload={reloadKpi} onNav={onNav} />
      )}

      {modal !== null && (
        <RecordPaymentModal
          preselectedClient={modal.preselectedClient || null}
          preselectedPaymentId={modal.preselectedPaymentId || null}
          onClose={() => setModal(null)}
          onSave={(txId) => { setModal(null); reloadKpi(); if (txId && onNav) onNav('/admin/receipts/' + txId); }}
        />
      )}
    </div>
  );
}
