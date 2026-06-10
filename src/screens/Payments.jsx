import { useState, useEffect, useRef } from 'react';
import I from '../components/Icons.jsx';
import { Bi, Avatar, Modal, Progress, Skel, useCan } from '../components/Shell.jsx';

const METHOD_LABELS = {
  interac:     'Virement Interac',
  cash:        'Espèces',
  mobilemoney: 'Mobile Money',
  cheque:      'Chèque',
  virement:    'Virement bancaire',
};

const TYPE_LABELS = {
  payment: 'Paiement',
  credit:  'Crédit accordé',
};

const PAY_STATUS = {
  completed: { label: 'Payé',       cls: 'ok'      },
  pending:   { label: 'En attente', cls: 'warn'    },
  partial:   { label: 'Partiel',    cls: 'warn'    },
  failed:    { label: 'Échoué',     cls: 'bad'     },
  refunded:  { label: 'Remboursé',  cls: 'neutral' },
};

/* ─── Record Payment Modal ───────────────────────────────── */

function RecordPaymentModal({ preselectedClient, preselectedPaymentId, onClose, onSave }) {
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
    const t = setTimeout(() => {
      fetch(`/api/clients?search=${encodeURIComponent(clientQuery)}&limit=8`)
        .then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : []));
    }, 250);
    return () => clearTimeout(t);
  }, [clientQuery, selectedClient]);

  // Load balance when client selected
  useEffect(() => {
    if (!selectedClient) { setBalance(null); return; }
    fetch(`/api/clients/${selectedClient.id}/balance`)
      .then(r => r.json())
      .then(d => {
        setBalance(d);
        if (preselectedPaymentId) {
          const inv = d.unpaidInvoices?.find(i => i.id === preselectedPaymentId);
          if (inv) {
            setAllocations({ [preselectedPaymentId]: String(inv.remaining) });
            setForm(f => ({ ...f, amount: String(inv.remaining) }));
          }
        }
      });
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
    if (!selectedClient) { setErr('Sélectionnez un client'); return; }
    if (!totalAmount)    { setErr('Montant requis'); return; }
    if (credit < 0)      { setErr('Le montant alloué dépasse le montant reçu'); return; }
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
      const json = await res.json();
      if (json.ok) onSave();
      else { setErr(json.error || 'Erreur'); setSaving(false); }
    } catch { setErr('Erreur réseau'); setSaving(false); }
  };

  const unpaid = balance?.unpaidInvoices ?? [];

  return (
    <Modal width={740} onClose={onClose}
      title="Enregistrer un paiement reçu"
      sub="Associez le règlement aux factures impayées du client"
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Annuler</button>
          <div style={{ flex: 1 }} />
          {err && <span style={{ fontSize: 12, color: 'var(--bad-600)' }}>{err}</span>}
          {totalAmount > 0 && totalAllocated === 0 && (
            <span style={{ fontSize: 11.5, color: 'var(--warn-600)' }}>⚠️ Aucune facture allouée → crédit client</span>
          )}
          <button className="btn btn--brand" onClick={handleSave} disabled={saving || !selectedClient || !totalAmount}>
            <I.Check />{saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </>
      }>

      <div style={{ display: 'grid', gridTemplateColumns: '290px 1fr', gap: 20 }}>
        {/* ── Left: Payment info ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
            Informations du paiement
          </div>

          {/* Client */}
          <div className="field">
            <label className="label">Client <span style={{ color: 'var(--bad-500)' }}>*</span></label>
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
                  placeholder="Rechercher par nom, email, tél…" />
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
                <div style={{ fontSize: 10, color: 'var(--ink-400)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Total dû</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: balance.totalDue > 0 ? 'var(--bad-600)' : 'var(--ok-600)', fontFamily: 'var(--font-mono)' }}>
                  {balance.totalDue.toLocaleString('fr')} <span style={{ fontSize: 10, fontWeight: 400 }}>CAD</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--ink-400)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Crédit disponible</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: balance.creditBalance > 0 ? 'var(--brand-600)' : 'var(--ink-400)', fontFamily: 'var(--font-mono)' }}>
                  {balance.creditBalance.toLocaleString('fr')} <span style={{ fontSize: 10, fontWeight: 400 }}>CAD</span>
                </div>
              </div>
            </div>
          )}

          {/* Type */}
          <div className="field">
            <label className="label">Type de mouvement</label>
            <select className="select" value={form.type} onChange={e => upd('type', e.target.value)}>
              <option value="payment">Paiement reçu du client</option>
              <option value="credit">Crédit accordé (geste commercial)</option>
            </select>
          </div>

          {/* Amount */}
          <div className="field">
            <label className="label">Montant <span style={{ color: 'var(--bad-500)' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <input className="input mono" type="number" min="0" value={form.amount}
                onChange={e => upd('amount', e.target.value)} placeholder="0" style={{ paddingRight: 48 }} />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--ink-400)', pointerEvents: 'none' }}>CAD</span>
            </div>
          </div>

          {/* Method */}
          <div className="field">
            <label className="label">Méthode</label>
            <select className="select" value={form.method} onChange={e => upd('method', e.target.value)}>
              <option value="interac">Virement Interac</option>
              <option value="cash">Espèces</option>
              <option value="mobilemoney">Mobile Money</option>
              <option value="cheque">Chèque</option>
              <option value="virement">Virement bancaire</option>
            </select>
          </div>

          {/* Reference */}
          <div className="field">
            <label className="label">Référence <span className="opt">optionnel</span></label>
            <input className="input mono" value={form.reference} onChange={e => upd('reference', e.target.value)} placeholder="ex: XK7F2A" />
          </div>

          {/* Note */}
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Note interne <span className="opt">optionnel</span></label>
            <input className="input" value={form.note} onChange={e => upd('note', e.target.value)} placeholder="Contentieux, accord, …" />
          </div>
        </div>

        {/* ── Right: Invoice allocation ── */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Affecter aux factures impayées
            </div>
            {unpaid.length > 0 && totalAmount > 0 && (
              <button className="btn btn--soft btn--xs" onClick={autoAllocate} style={{ fontSize: 11.5 }}>
                ✨ Auto-répartir
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
                Sélectionnez un client pour voir ses factures
              </div>
            </div>
          ) : !balance ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-400)', fontSize: 13 }}>Chargement…</div>
          ) : unpaid.length === 0 ? (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8,
              background: 'var(--ok-50)', borderRadius: 10, border: '1px solid var(--ok-100)', minHeight: 120,
            }}>
              <div style={{ fontSize: 26 }}>✅</div>
              <div style={{ color: 'var(--ok-700)', fontWeight: 600, fontSize: 13 }}>Toutes les factures sont réglées</div>
              <div style={{ color: 'var(--ok-600)', fontSize: 12 }}>Ce montant sera crédité au compte client</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1, maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
                {unpaid.map(inv => {
                  const alloc   = Number(allocations[inv.id] || 0);
                  const checked = alloc > 0;
                  return (
                    <div key={inv.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 8,
                      border: `1px solid ${checked ? 'var(--brand-300)' : 'var(--border)'}`,
                      background: checked ? 'var(--brand-50)' : 'white',
                      transition: 'all .12s',
                    }}>
                      <input type="checkbox" checked={checked}
                        style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--brand-600)', flexShrink: 0 }}
                        onChange={e => {
                          if (e.target.checked) setAllocations(a => ({ ...a, [inv.id]: String(inv.remaining) }));
                          else setAllocations(a => { const n = { ...a }; delete n[inv.id]; return n; });
                        }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--ink-900)' }}>
                          {inv.trackingCode}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 1 }}>
                          Cargaison <strong>{inv.campaignCode}</strong> · solde dû : <strong style={{ color: 'var(--bad-600)' }}>{inv.remaining.toLocaleString('fr')} CAD</strong>
                        </div>
                      </div>
                      {checked && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                          <input type="number" min="0" max={inv.remaining}
                            value={allocations[inv.id] || ''}
                            onChange={e => setAllocations(a => ({ ...a, [inv.id]: e.target.value }))}
                            style={{ width: 88, padding: '4px 8px', border: '1px solid var(--brand-300)', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 13, textAlign: 'right' }} />
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

function TransactionsTab({ onRecord }) {
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    fetch('/api/transactions').then(r => r.json()).then(d => {
      setRows(Array.isArray(d) ? d : []);
      setLoading(false);
    });
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
          <input className="input input--sm" placeholder="Client, référence, colis…" style={{ width: 260, paddingLeft: 32 }}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <table className="tbl" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <thead>
          <tr>
            <th style={{ borderRadius: 0 }}>Date</th>
            <th>Client</th>
            <th>Type</th>
            <th style={{ textAlign: 'right' }}>Montant</th>
            <th>Méthode</th>
            <th>Référence</th>
            <th>Colis soldés</th>
            <th>Crédit généré</th>
            <th>Agent</th>
            <th style={{ borderRadius: 0 }}>Note</th>
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
            </tr>
          ))}
          {!loading && filtered.length === 0 && (
            <tr>
              <td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-400)', fontSize: 13 }}>
                {search ? 'Aucun résultat' : 'Aucune transaction enregistrée'}
              </td>
            </tr>
          )}
          {!loading && filtered.map(r => {
            const allocs = Array.isArray(r.allocations) ? r.allocations : [];
            const credit = r.amount - r.totalAllocated;
            const dateStr = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(r.createdAt));
            return (
              <tr key={r.id}>
                <td className="mono" style={{ fontSize: 12, color: 'var(--ink-500)' }}>{dateStr}</td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{r.clientName}</div>
                  <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>{r.clientPhone ?? '—'}</div>
                </td>
                <td>
                  <span className={'badge badge--dot badge--' + (r.type === 'credit' ? 'brand' : 'ok')}>
                    {TYPE_LABELS[r.type] ?? r.type}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span className="mono" style={{ fontWeight: 700, color: 'var(--ok-700)', fontSize: 13 }}>
                    {r.amount.toLocaleString('fr')}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--ok-600)', marginLeft: 3 }}>CAD</span>
                </td>
                <td style={{ fontSize: 12, color: 'var(--ink-600)' }}>{METHOD_LABELS[r.method] ?? r.method}</td>
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

/* ─── Invoices list tab (existing payments) ──────────────── */

function InvoicesTab({ onSettle }) {
  const can = useCan();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('all');
  const [search, setSearch]     = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/payments').then(r => r.json()).then(d => {
      setPayments(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, []);

  const tabs = [
    { id: 'all',     l: 'Toutes',      n: payments.length },
    { id: 'paid',    l: 'Payées',      n: payments.filter(p => p.status === 'paid').length,    cls: 'ok'  },
    { id: 'pending', l: 'En attente',  n: payments.filter(p => p.status === 'pending').length, cls: 'warn' },
    { id: 'unpaid',  l: 'Impayées',    n: payments.filter(p => p.status === 'unpaid').length,  cls: 'bad'  },
  ];

  const filtered = payments
    .filter(p => tab === 'all' || p.status === tab)
    .filter(p => {
      if (!search) return true;
      const q = search.toLowerCase();
      return p.recipName?.toLowerCase().includes(q) || p.parcel?.toLowerCase().includes(q) || p.campaign?.toLowerCase().includes(q);
    });

  return (
    <>
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
          <input className="input input--sm" placeholder="Client, colis, cargaison…" style={{ width: 240, paddingLeft: 32 }}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <table className="tbl" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <thead>
          <tr>
            <th style={{ borderRadius: 0 }}>Date</th>
            <th>Client</th>
            <th>Cargaison</th>
            <th>Colis</th>
            <th style={{ textAlign: 'right' }}>Facturé</th>
            <th>Statut</th>
            <th>Référence</th>
            <th style={{ borderRadius: 0, width: 100 }}></th>
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
            <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-400)', fontSize: 13 }}>Aucune facture</td></tr>
          )}
          {!loading && filtered.map(p => {
            const s = PAY_STATUS[p.status] ?? { label: p.status, cls: 'neutral' };
            return (
              <tr key={p.id}>
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
                  {p.status === 'paid'
                    ? <span style={{ fontSize: 12, color: 'var(--ok-600)' }}>✓ Réglé</span>
                    : can('payments', 'validate')
                      ? <button className="btn btn--brand btn--xs" style={{ width: '100%', justifyContent: 'center' }}
                          onClick={() => onSettle({ clientId: p.clientId, paymentId: p.id, clientName: p.recipName, clientPhone: p.recipPhone })}>
                          <I.Wallet />Régler
                        </button>
                      : <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>En attente</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

/* ─── Main Payments screen ───────────────────────────────── */

export default function PaymentsScreen({ onNav }) {
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

  const facture     = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const percu       = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);
  const impayes     = payments.filter(p => p.status !== 'paid' && p.status !== 'refunded').reduce((s, p) => s + (p.amount || 0), 0);
  const taux        = Math.round(percu / (facture || 1) * 100);

  const openSettle = (info) => {
    setModal({
      preselectedClient: { id: info.clientId, name: info.clientName, phone: info.clientPhone },
      preselectedPaymentId: info.paymentId,
    });
  };

  const reloadKpi = () => {
    fetch('/api/payments').then(r => r.json()).then(d => setPayments(Array.isArray(d) ? d : []));
  };

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__title"><Bi fr="Paiements" en="Payments" /></div>
          <div className="page__sub">Transactions reçues et suivi des factures</div>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost"><I.Download />Export comptable</button>
          {can('payments', 'validate') && (
            <button className="btn btn--brand" onClick={() => setModal({})}>
              <I.Plus />Enregistrer paiement
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
        <div className="kpi">
          <div className="kpi__label">Facturé <span style={{ textTransform: 'none', color: 'var(--ink-300)' }}>/ Invoiced</span></div>
          <div className="kpi__value">{facture.toLocaleString('fr')} <span style={{ fontSize: 14, color: 'var(--ink-400)' }}>CAD</span></div>
          <div className="kpi__delta">{payments.length} facture{payments.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="kpi" style={{ background: 'var(--ok-50)', borderColor: 'var(--ok-100)' }}>
          <div className="kpi__label" style={{ color: 'var(--ok-700)' }}>Perçu <span style={{ textTransform: 'none', opacity: .6 }}>/ Collected</span></div>
          <div className="kpi__value" style={{ color: 'var(--ok-700)' }}>{percu.toLocaleString('fr')} <span style={{ fontSize: 14, opacity: .6 }}>CAD</span></div>
          <Progress pct={taux} />
        </div>
        <div className="kpi" style={{ background: 'var(--bad-50)', borderColor: 'var(--bad-100)' }}>
          <div className="kpi__label" style={{ color: 'var(--bad-700)' }}>Impayés <span style={{ textTransform: 'none', opacity: .6 }}>/ Outstanding</span></div>
          <div className="kpi__value" style={{ color: 'var(--bad-700)' }}>{impayes.toLocaleString('fr')} <span style={{ fontSize: 14, opacity: .6 }}>CAD</span></div>
          <div className="kpi__delta" style={{ color: 'var(--bad-600)' }}>
            {payments.filter(p => p.status !== 'paid').length} en attente
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
        {[
          { id: 'transactions', label: 'Paiements reçus', icon: '💳' },
          { id: 'invoices',     label: 'Factures',         icon: '📄' },
        ].map(t => (
          <button key={t.id}
            onClick={() => setMainTab(t.id)}
            style={{
              padding: '11px 20px', border: 'none', cursor: 'pointer',
              background: 'none', fontSize: 13.5, fontWeight: mainTab === t.id ? 700 : 400,
              color: mainTab === t.id ? 'var(--brand-700)' : 'var(--ink-500)',
              borderBottom: mainTab === t.id ? '2px solid var(--brand-500)' : '2px solid transparent',
              marginBottom: -1,
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {mainTab === 'transactions' && (
        <TransactionsTab key="tx" onRecord={() => setModal({})} />
      )}
      {mainTab === 'invoices' && (
        <InvoicesTab key="inv" onSettle={openSettle} />
      )}

      {modal !== null && (
        <RecordPaymentModal
          preselectedClient={modal.preselectedClient || null}
          preselectedPaymentId={modal.preselectedPaymentId || null}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); reloadKpi(); }}
        />
      )}
    </div>
  );
}
