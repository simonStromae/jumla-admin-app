import { useState, useEffect } from 'react';

import I from '../components/Icons.jsx';
import { Bi, Avatar, Drawer, Skel, Modal, useCan } from '../components/Shell.jsx';
import { HelpTip } from '../components/HelpCenter.jsx';
import { Pagination, ViewToggle } from '../components/Pagination.jsx';
import ClientFormModal from './ClientForm.jsx';

export default function ClientsScreen({ onNav }) {
  const can = useCan();
  const [open, setOpen] = useState(null);
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState('grid');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const loadClients = () => {
    setLoading(true);
    setFetchError('');
    fetch('/api/clients')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          setClients(d);
        } else {
          setFetchError(d?.error || 'Erreur de chargement');
        }
        setLoading(false);
      })
      .catch(() => {
        setFetchError('Erreur réseau');
        setLoading(false);
      });
  };

  useEffect(() => { loadClients(); }, []);

  const handleToggleStatus = async (cl) => {
    const newStatus = cl.status === 'suspended' ? 'active' : 'suspended';
    const label = newStatus === 'suspended' ? 'Suspendre' : 'Réactiver';
    if (!confirm(`${label} ${cl.name} ?`)) return;
    await fetch(`/api/users/${cl.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setClients(cs => cs.map(c => c.id === cl.id ? { ...c, status: newStatus } : c));
  };

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__title"><Bi fr="Expéditeurs" en="Senders" /></div>
          <div className="page__sub">Expéditeurs enregistrés — basés à Douala, Lagos et autres villes d'origine</div>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost"><I.Download />Exporter CSV</button>
          {can('clients', 'create') && <button className="btn btn--brand" onClick={() => setEditing('new')}><I.UserPlus />Nouvel expéditeur</button>}
        </div>
      </div>

      <div className="toolbar">
        <div className="spacer" />
        <div style={{ position: 'relative' }}>
          <I.Search style={{ position: 'absolute', left: 10, top: 9, width: 14, height: 14, color: 'var(--ink-400)' }} />
          <input className="input input--sm" placeholder="Nom, téléphone, code client..." style={{ width: 260, paddingLeft: 32 }} />
        </div>
        <button className="btn btn--ghost btn--sm"><I.Filter />Filtres</button>
        <ViewToggle value={view} onChange={setView} />
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, padding: 14, background: 'white', border: '1px solid var(--border)', borderRadius: 12 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Skel w={40} h={40} r={999} />
                <div style={{ flex: 1 }}>
                  <Skel w="60%" h={14} style={{ marginBottom: 6 }} />
                  <Skel w="80%" h={11} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
                <div><Skel w="50%" h={10} style={{ marginBottom: 5 }} /><Skel w="70%" h={14} /></div>
                <div><Skel w="50%" h={10} style={{ marginBottom: 5 }} /><Skel w="70%" h={14} /></div>
              </div>
            </div>
          ))}
        </div>
      ) : fetchError ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--err-600)', fontSize: 14 }}>
          Erreur : {fetchError}
        </div>
      ) : clients.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--ink-400)', fontSize: 14 }}>
          <I.Users style={{ width: 32, height: 32, marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Aucun expéditeur enregistré</div>
          <div style={{ fontSize: 12 }}>Les clients qui se créent un compte apparaissent ici.</div>
        </div>
      ) : view === 'grid'
        ? <ClientsGridView clients={clients} setOpen={setOpen} />
        : <ClientsListView clients={clients} setOpen={setOpen} onToggleStatus={handleToggleStatus} page={page} pageSize={pageSize} />
      }

      <Pagination total={clients.length} page={page} pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        sizes={view === 'grid' ? [12, 24, 48] : [10, 25, 50, 100]} />

      {open && (
        <ClientDrawer
          cl={open}
          onClose={() => setOpen(null)}
          onEdit={() => { setEditing(open); setOpen(null); }}
          onNav={onNav}
          onStatusChange={(id, newStatus) => {
            setClients(cs => cs.map(c => c.id === id ? { ...c, status: newStatus } : c));
            setOpen(cl => cl?.id === id ? { ...cl, status: newStatus } : cl);
          }}
          onDeleted={(id) => {
            setClients(cs => cs.filter(c => c.id !== id));
            setOpen(null);
          }}
        />
      )}

      {editing && (
        <ClientFormModal
          mode={editing === 'new' ? 'create' : 'edit'}
          client={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(andNew) => {
            loadClients();
            if (andNew) setEditing('new');
            else setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function ClientsGridView({ clients, setOpen }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, background: 'white', border: '1px solid var(--border)', borderTop: 0, padding: 14 }}>
      {clients.map(cl => (
        <div key={cl.id} className="card" style={{ padding: 14, position: 'relative', cursor: 'pointer', opacity: cl.status === 'suspended' ? .7 : 1 }} onClick={() => setOpen(cl)}>
          <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 4 }}>
            {cl.status === 'suspended' && <span className="badge" style={{ background: 'var(--bad-50)', color: 'var(--bad-700)', border: '1px solid var(--bad-200)', fontSize: 10 }}>Suspendu</span>}
            {!cl.emailVerified && <span className="badge" style={{ background: 'var(--warn-50)', color: 'var(--warn-700)', border: '1px solid var(--warn-200)', fontSize: 10 }}>Non vérifié</span>}
            {cl.loyal && <I.Star style={{ width: 14, height: 14, color: 'var(--brand-500)' }} />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Avatar initials={cl.name.split(' ').map(x => x[0]).join('').slice(0, 2)} color={cl.color} size="lg" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{cl.name}</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-400)' }}>{cl.code}</div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--ink-600)', marginBottom: 8, fontWeight: 500 }}>
            {cl.city}, Cameroun
          </div>

          <div style={{ fontSize: 12, color: 'var(--ink-500)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }} className="mono">
            <I.Phone style={{ width: 12, height: 12 }} />
            {cl.phone}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, padding: '10px 0', borderTop: '1px solid var(--border-soft)', borderBottom: '1px solid var(--border-soft)', marginBottom: 10 }}>
            <Mini label="Cargaisons" v={cl.campaigns} />
            <Mini label="Poids" v={cl.weight + ' kg'} />
            <Mini label="CA" v={(cl.amount / 1000).toFixed(1) + 'k'} unit="CAD" />
          </div>

          <div style={{ fontSize: 11.5, color: 'var(--ink-500)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <I.Calendar style={{ width: 11, height: 11 }} />
            Dernière : <span className="mono" style={{ color: 'var(--ink-700)', fontWeight: 600 }}>{cl.lastCampaign}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ClientsListView({ clients, setOpen, onToggleStatus, page, pageSize }) {
  const paged = clients.slice((page - 1) * pageSize, page * pageSize);
  return (
    <table className="tbl" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
      <thead>
        <tr>
          <th style={{ width: 32, borderRadius: 0 }}><input type="checkbox" style={{ accentColor: 'var(--brand-500)' }} /></th>
          <th>Expéditeur</th>
          <th>Statut</th>
          <th>Ville</th>
          <th>Téléphone</th>
          <th style={{ textAlign: 'center' }}>Nb d'envois</th>
          <th style={{ textAlign: 'right' }}>Poids</th>
          <th style={{ textAlign: 'right' }}>CA total</th>
          <th>Dernière</th>
          <th style={{ borderRadius: 0, width: 110 }}></th>
        </tr>
      </thead>
      <tbody>
        {paged.map(cl => {
          const suspended = cl.status === 'suspended';
          return (
            <tr key={cl.id} style={{ cursor: 'pointer', opacity: suspended ? .7 : 1 }} onClick={() => setOpen(cl)}>
              <td onClick={e => e.stopPropagation()}><input type="checkbox" style={{ accentColor: 'var(--brand-500)' }} /></td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar initials={cl.name.split(' ').map(x => x[0]).join('').slice(0, 2)} color={cl.color} size="sm" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {cl.name}
                      {cl.loyal && <I.Star style={{ width: 11, height: 11, color: 'var(--brand-500)' }} />}
                    </div>
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>{cl.code}</div>
                  </div>
                </div>
              </td>
              <td>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                  {suspended
                    ? <span className="badge" style={{ background: 'var(--bad-50)', color: 'var(--bad-700)', border: '1px solid var(--bad-200)' }}>Suspendu</span>
                    : <span className="badge" style={{ background: 'var(--ok-50)', color: 'var(--ok-700)', border: '1px solid var(--ok-100)' }}>Actif</span>}
                  {!cl.emailVerified && <span className="badge" style={{ background: 'var(--warn-50)', color: 'var(--warn-700)', border: '1px solid var(--warn-200)', fontSize: 10 }}>Email non vérifié</span>}
                </div>
              </td>
              <td style={{ fontSize: 12.5 }}>{cl.city}, Cameroun</td>
              <td className="mono" style={{ fontSize: 12 }}>{cl.phone}</td>
              <td className="mono" style={{ textAlign: 'center', fontWeight: 600 }}>{cl.campaigns}</td>
              <td className="mono" style={{ textAlign: 'right' }}>{cl.weight}<span style={{ fontSize: 10.5, color: 'var(--ink-400)', marginLeft: 2 }}>kg</span></td>
              <td style={{ textAlign: 'right' }}>
                <span className="mono" style={{ fontWeight: 700 }}>{(cl.amount / 1000).toFixed(1)}k</span>
                <span style={{ fontSize: 10.5, color: 'var(--ink-400)', marginLeft: 2 }}>CAD</span>
              </td>
              <td className="mono" style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>{cl.lastCampaign}</td>
              <td onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn--ghost btn--xs"
                    style={{ fontSize: 11, color: suspended ? 'var(--ok-700)' : 'var(--bad-600)' }}
                    onClick={() => onToggleStatus(cl)}>
                    {suspended ? 'Réactiver' : 'Suspendre'}
                  </button>
                  <button className="icon-btn" onClick={() => setOpen(cl)}><I.ChevronRight /></button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Mini({ label, v, unit }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-900)' }}>
        {v}{unit && <span style={{ fontSize: 10, color: 'var(--ink-400)', marginLeft: 2 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 10, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

const CAMP_STATUS_CLS = {
  enr: 'brand', exp: 'info', tra: 'warn',
  apd: 'ok',    dou: 'warn', lib: 'ok',
  ard: 'ok',    pdl: 'info', ok:  'neutral',
};
const CAMP_STATUS_LBL = {
  enr: 'Ouverte',        exp: 'Expédiée',    tra: 'En transit',
  apd: 'Arrivée pays',   dou: 'En douane',   lib: 'Libérée douanes',
  ard: 'Entrepôt dest.', pdl: 'Prête livr.', ok:  'Clôturée',
};

function ClientDrawer({ cl, onClose, onEdit, onNav, onStatusChange, onDeleted }) {
  const [detail,  setDetail]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [showWa, setShowWa] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState('');
  const [resending, setResending] = useState(false);
  const [resendOk, setResendOk] = useState(false);
  const [resendErr, setResendErr] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteErr('');
    try {
      const res = await fetch(`/api/clients/${cl.id}`, { method: 'DELETE' });
      const d = await res.json();
      if (!res.ok) {
        setDeleteErr(d.error || 'Erreur lors de la suppression');
        setDeleting(false);
        return;
      }
      onDeleted?.(cl.id);
      onClose();
    } catch {
      setDeleteErr('Erreur réseau');
      setDeleting(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    setResendOk(false);
    setResendErr('');
    try {
      const res = await fetch(`/api/admin/clients/${cl.id}/resend-verification`, { method: 'POST' });
      const d = await res.json();
      if (!res.ok) { setResendErr(d.error || 'Erreur'); }
      else { setResendOk(true); }
    } catch { setResendErr('Erreur réseau'); }
    setResending(false);
  };

  const handleToggleStatus = async () => {
    const newStatus = cl.status === 'suspended' ? 'active' : 'suspended';
    const label = newStatus === 'suspended' ? 'Suspendre' : 'Réactiver';
    if (!confirm(`${label} ce client ?`)) return;
    setTogglingStatus(true);
    try {
      await fetch(`/api/users/${cl.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      onStatusChange?.(cl.id, newStatus);
    } finally {
      setTogglingStatus(false);
    }
  };

  useEffect(() => {
    fetch('/api/clients/' + cl.id)
      .then(r => r.json())
      .then(d => { setDetail(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [cl.id]);

  const parcels   = detail?.parcels ?? [];
  const totalAmt  = parcels.reduce((s, p) => s + (p.invoiced ?? p.amount ?? 0), 0);
  const unpaidAmt = parcels.reduce((s, p) => s + (p.remaining ?? (p.paid ? 0 : p.amount ?? 0)), 0);
  const since     = detail?.createdAt
    ? new Date(detail.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : '—';

  return (
    <Drawer width={560} onClose={onClose}>
      <div className="drawer__head">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>Profil client</div>
        </div>
        <button className="icon-btn" onClick={onClose}><I.Cross /></button>
      </div>

      <div className="drawer__body">
        <div style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid var(--border-soft)' }}>
          <Avatar initials={cl.name.split(' ').map(x => x[0]).join('').slice(0, 2)} color={cl.color} size="xl" />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-.01em' }}>
                {cl.name}
                {cl.loyal && <I.Star style={{ width: 14, height: 14, color: 'var(--brand-500)', marginLeft: 6, verticalAlign: -1 }} />}
              </div>
              {cl.status === 'suspended' && (
                <span className="badge" style={{ background: 'var(--bad-50)', color: 'var(--bad-700)', border: '1px solid var(--bad-200)' }}>Suspendu</span>
              )}
              {!cl.emailVerified && (
                <span className="badge" style={{ background: 'var(--warn-50)', color: 'var(--warn-700)', border: '1px solid var(--warn-200)' }}>
                  Email non vérifié
                  <HelpTip text="Le client n'a pas encore confirmé son adresse email. Utilisez le bouton ci-dessous pour renvoyer le code de vérification." position="left" />
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>
              Client depuis {since}
            </div>
            {cl.city && cl.city !== '—' && (
              <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--ink-600)', fontWeight: 500 }}>{cl.city}</div>
            )}
          </div>
        </div>

        <div style={{ padding: '16px 22px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, borderBottom: '1px solid var(--border-soft)' }}>
          {loading ? [1,2,3].map(i => (
            <div key={i}><Skel w="50%" h={10} style={{ marginBottom: 6 }} /><Skel w="70%" h={20} /></div>
          )) : [
            { label: 'Colis',      value: parcels.length },
            { label: 'CA total',   value: totalAmt.toLocaleString('fr') + ' CAD', color: 'var(--ok-600)' },
            { label: 'Impayés',    value: unpaidAmt > 0 ? unpaidAmt.toLocaleString('fr') + ' CAD' : '0 CAD', color: unpaidAmt > 0 ? 'var(--bad-600)' : 'var(--ink-400)' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>{label}</div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: color || 'var(--ink-900)', marginTop: 4 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border-soft)' }}>
          <div className="section-title" style={{ marginBottom: 10 }}>Contact</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <DrawerRow icon={<I.Phone />}    label="Téléphone" value={cl.phone !== '—' ? cl.phone : '—'} mono />
            <DrawerRow icon={<I.Pin />}      label="Ville"     value={cl.city  !== '—' ? cl.city  : '—'} />
            <DrawerRow icon={<I.Whatsapp />} label="WhatsApp"  value={detail?.whatsapp ?? cl.phone ?? '—'} mono />
            <DrawerRow icon={<I.Mail />}     label="Email"     value={detail?.email    ?? '—'} />
          </div>
        </div>

        {detail?.savedRecipients?.length > 0 && (
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border-soft)' }}>
            <div className="section-title" style={{ marginBottom: 10 }}>
              <I.Users style={{ width: 13, height: 13, color: 'var(--brand-600)', marginRight: 4 }} />
              Destinataires fréquents
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {detail.savedRecipients.map((r, i) => (
                <div key={r.id ?? i} style={{
                  padding: '8px 12px', background: 'var(--bg-soft)',
                  borderRadius: 8, border: '1px solid var(--border-soft)',
                }}>
                  {r.label && <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>{r.label}</div>}
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)' }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 1 }}>
                    {[r.phone, r.city].filter(Boolean).join(' · ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(detail?.deliveryAddress || detail?.deliveryPhone || (detail?.savedAddresses?.length > 0)) && (
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border-soft)' }}>
            <div className="section-title" style={{ marginBottom: 10 }}>
              <I.Truck style={{ width: 13, height: 13, color: 'var(--brand-600)', marginRight: 4 }} />
              Adresses de livraison
            </div>
            {(detail?.deliveryAddress || detail?.deliveryPhone) && (
              <div style={{ fontSize: 13, color: 'var(--ink-700)', lineHeight: 1.6, marginBottom: detail?.savedAddresses?.length > 0 ? 10 : 0 }}>
                {detail.deliveryName && <div style={{ fontWeight: 600 }}>{detail.deliveryName}</div>}
                {detail.deliveryAddress && <div>{detail.deliveryAddress}</div>}
                {detail.deliveryPhone  && <div className="mono" style={{ fontSize: 12, color: 'var(--ink-500)' }}>{detail.deliveryPhone}</div>}
              </div>
            )}
            {detail?.savedAddresses?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {detail.savedAddresses.map((a, i) => (
                  <div key={a.id ?? i} style={{
                    padding: '8px 12px', background: 'var(--bg-soft)',
                    borderRadius: 8, border: '1px solid var(--border-soft)',
                  }}>
                    {a.label && <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>{a.label}</div>}
                    <div style={{ fontSize: 12.5, color: 'var(--ink-800)' }}>
                      {a.address}{a.apt ? `, apt. ${String(a.apt).replace(/^apt\.?\s*/i, '')}` : ''}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-400)', marginTop: 1 }}>
                      {[a.city, a.province, a.postal].filter(Boolean).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ padding: '16px 22px' }}>
          <div className="section-title">
            Historique de colis <span className="section-title__count">{parcels.length}</span>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[1,2,3].map(i => <Skel key={i} w="100%" h={36} />)}
            </div>
          ) : parcels.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--ink-400)', padding: '12px 0' }}>
              Aucun colis enregistré.
            </div>
          ) : (
            <table className="tbl tbl--compact">
              <thead>
                <tr>
                  <th style={{ borderRadius: 0 }}>Code</th>
                  <th>Cargaison</th>
                  <th style={{ textAlign: 'right' }}>Poids</th>
                  <th style={{ textAlign: 'right' }}>Montant</th>
                  <th style={{ borderRadius: 0 }}>Paiement</th>
                </tr>
              </thead>
              <tbody>
                {parcels.map(p => (
                  <tr key={p.id} style={{ cursor: onNav ? 'pointer' : 'default' }}
                    onClick={() => onNav?.('/admin/parcels/' + p.id)}>
                    <td className="mono" style={{ fontWeight: 700, fontSize: 12, color: 'var(--brand-700)' }}>{p.trackingCode}</td>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{p.campaign.code}</div>
                      <span className={'badge badge--dot badge--' + (CAMP_STATUS_CLS[p.campaign.status] ?? 'neutral')} style={{ fontSize: 10.5 }}>
                        {CAMP_STATUS_LBL[p.campaign.status] ?? p.campaign.status}
                      </span>
                    </td>
                    <td className="mono" style={{ textAlign: 'right', fontSize: 12 }}>
                      {p.weightKg ? p.weightKg + ' kg' : '—'}
                    </td>
                    <td className="mono" style={{ textAlign: 'right', fontSize: 12, fontWeight: 600 }}>
                      {(p.invoiced ?? p.amount) ? (p.invoiced ?? p.amount).toLocaleString('fr') + ' CAD' : '—'}
                    </td>
                    <td>
                      {p.displayStatus === 'paid' && (
                        <span className="badge badge--dot badge--ok">Payé</span>
                      )}
                      {p.displayStatus === 'paid_supp_pending' && (
                        <span className="badge badge--dot" style={{ background: 'var(--info-100)', color: 'var(--info-700)', borderColor: 'var(--info-100)' }}>Payé · Suppl.</span>
                      )}
                      {p.displayStatus === 'partial' && (
                        <span className="badge badge--dot badge--warn">Partiel</span>
                      )}
                      {p.displayStatus === 'pending' && (
                        <span className="badge badge--dot badge--warn">En attente</span>
                      )}
                      {(!p.displayStatus || p.displayStatus === 'none') && (
                        <span className="badge badge--dot badge--neutral">Sans facture</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="drawer__foot" style={{ flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn--ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onEdit}><I.Edit />Modifier</button>
          <button className="btn btn--soft" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowWa(true)}>
            <I.Whatsapp style={{ color: 'var(--ok-600)' }} />WhatsApp
          </button>
          <button
            className="btn btn--ghost"
            style={{ flex: 1, justifyContent: 'center', color: cl.status === 'suspended' ? 'var(--ok-700)' : 'var(--bad-600)' }}
            onClick={handleToggleStatus}
            disabled={togglingStatus}>
            {cl.status === 'suspended' ? 'Réactiver' : 'Suspendre'}
          </button>
        </div>
        {!cl.emailVerified && (
          <div>
            <button
              className="btn btn--ghost"
              style={{ width: '100%', justifyContent: 'center', fontSize: 12, color: 'var(--warn-700)' }}
              onClick={handleResendVerification}
              disabled={resending || resendOk}>
              <I.Mail style={{ width: 13, height: 13 }} />
              {resending ? 'Envoi en cours…' : resendOk ? 'Email envoyé ✓' : 'Renvoyer l\'email de vérification'}
            </button>
            {resendErr && (
              <div style={{ fontSize: 12, color: 'var(--bad-700)', background: 'var(--bad-50)', border: '1px solid var(--bad-200)', borderRadius: 6, padding: '6px 10px', marginTop: 4 }}>
                {resendErr}
              </div>
            )}
          </div>
        )}
        {deleteErr && (
          <div style={{ fontSize: 12, color: 'var(--bad-700)', background: 'var(--bad-50)', border: '1px solid var(--bad-200)', borderRadius: 6, padding: '6px 10px' }}>
            {deleteErr}
          </div>
        )}
        {!deleteConfirm ? (
          <button
            className="btn btn--ghost"
            style={{ justifyContent: 'center', color: 'var(--bad-600)', fontSize: 12 }}
            onClick={() => setDeleteConfirm(true)}>
            <I.Trash style={{ width: 13, height: 13 }} />Supprimer ce client
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn"
              style={{ flex: 1, justifyContent: 'center', background: 'var(--bad-600)', color: 'white', fontSize: 12 }}
              onClick={handleDelete}
              disabled={deleting}>
              <I.Trash style={{ width: 13, height: 13 }} />
              {deleting ? 'Suppression...' : 'Confirmer la suppression'}
            </button>
            <button className="btn btn--ghost" style={{ fontSize: 12 }} onClick={() => { setDeleteConfirm(false); setDeleteErr(''); }}>
              Annuler
            </button>
          </div>
        )}
      </div>

      {showWa && detail && (
        <WhatsappModal
          client={cl}
          parcels={detail.parcels ?? []}
          onClose={() => setShowWa(false)}
        />
      )}
    </Drawer>
  );
}

function DrawerRow({ icon, label, value, mono, ok }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: ok ? 'var(--ok-600)' : 'var(--ink-800)', fontWeight: 500 }}>
        <span style={{ color: 'var(--ink-400)', display: 'flex' }}>{icon}</span>
        <span className={mono ? 'mono' : ''}>{value}</span>
      </div>
    </div>
  );
}

const WA_TEMPLATE_DEFAULTS = [
  { id: 'arrival',   label: "Avis d'arrivée",    body: `Bonjour {first_name} 👋\n\nVotre colis ({parcel_code}) est arrivé à Montréal.\n\n📦 Poids : {weight} kg\n💰 Montant dû : {amount} CAD\n\n📍 Retrait : {warehouse_address}\n📞 Contact : {agent_phone}\n\nMerci,\nJumla Shipping` },
  { id: 'reminder',  label: 'Relance paiement',  body: `Bonjour {first_name},\n\nNous n'avons pas encore reçu votre paiement pour le colis {parcel_code} — montant dû : {amount} CAD.\n\nMerci de régulariser votre situation au plus vite.\n\nJumla Shipping` },
  { id: 'delivery',  label: 'Livraison confirmée', body: `Bonjour {first_name},\n\nVotre colis {parcel_code} a été livré. Merci de votre confiance !\n\nJumla Shipping` },
  { id: 'invoice',   label: 'Facture / Récap',   body: `Bonjour {first_name},\n\nVoici le récapitulatif de votre colis {parcel_code} :\n• Poids : {weight} kg\n• Montant : {amount} CAD\n\nJumla Shipping` },
  { id: 'broadcast', label: 'Annonce cargaison', body: `Bonjour {first_name} 👋\n\nNouvelle cargaison disponible — départ prévu le {arrival_date}.\n\nRéservez votre place dès maintenant.\n\nJumla Shipping` },
];

function WhatsappModal({ client, parcels, onClose }) {
  const activeParcels = parcels.filter(p => p.status !== 'livre');
  const [selectedParcelIds, setSelectedParcelIds] = useState(
    activeParcels.length > 0 ? [activeParcels[0].id] : parcels.slice(0, 1).map(p => p.id)
  );
  const [templates,   setTemplates]   = useState(WA_TEMPLATE_DEFAULTS);
  const [templateId,  setTemplateId]  = useState('arrival');
  const [body,        setBody]        = useState(WA_TEMPLATE_DEFAULTS[0].body);
  const [sending,     setSending]     = useState(false);
  const [result,      setResult]      = useState(null);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      const loaded = WA_TEMPLATE_DEFAULTS.map(t => ({
        ...t,
        label: d[`wa_tmpl_${t.id}_label`] ?? t.label,
        body:  d[`wa_tmpl_${t.id}_body`]  ?? t.body,
      }));
      setTemplates(loaded);
      const current = loaded.find(t => t.id === 'arrival');
      if (current) setBody(current.body);
    }).catch(() => {});
  }, []);

  const onTemplateChange = (id) => {
    setTemplateId(id);
    const found = templates.find(t => t.id === id);
    if (found) setBody(found.body);
  };

  const toggleParcel = (id) => {
    setSelectedParcelIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  };

  const handleSend = async () => {
    if (!selectedParcelIds.length) return;
    setSending(true);
    try {
      const res = await fetch('/api/messaging/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parcelIds: selectedParcelIds, body }),
      });
      const json = await res.json();
      setResult(json);
    } catch {
      setResult({ ok: false, error: 'Erreur réseau' });
    }
    setSending(false);
  };

  return (
    <Modal width={540} onClose={onClose}
      title={<span>WhatsApp — {client.name}</span>}
      sub={`Envoyer un message au ${client.phone ?? '—'}`}
      footer={result ? (
        <>
          <div style={{ flex: 1, fontSize: 13, color: result.sentCount > 0 ? 'var(--ok-700)' : 'var(--bad-700)' }}>
            {result.sentCount > 0 ? `✓ ${result.sentCount} message(s) envoyé(s)` : `Échec : ${result.error || 'Erreur'}`}
          </div>
          <button className="btn btn--ghost" onClick={onClose}>Fermer</button>
        </>
      ) : (
        <>
          <div style={{ flex: 1 }} />
          <button className="btn btn--ghost" onClick={onClose}>Annuler</button>
          <button className="btn btn--brand" onClick={handleSend} disabled={sending || !selectedParcelIds.length}>
            <I.Whatsapp style={{ width: 14, height: 14 }} />
            {sending ? 'Envoi…' : 'Envoyer'}
          </button>
        </>
      )}>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {parcels.length === 0 ? (
          <div style={{ padding: 16, background: 'var(--bg-soft)', borderRadius: 8, fontSize: 13, color: 'var(--ink-500)', textAlign: 'center' }}>
            Ce client n'a pas de colis enregistré.
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Colis concerné(s)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {parcels.map(p => (
                <label key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                  borderRadius: 7, cursor: 'pointer',
                  border: '1px solid ' + (selectedParcelIds.includes(p.id) ? 'var(--brand-300)' : 'var(--border)'),
                  background: selectedParcelIds.includes(p.id) ? 'var(--brand-50)' : 'white',
                }}>
                  <input type="checkbox" checked={selectedParcelIds.includes(p.id)} onChange={() => toggleParcel(p.id)} style={{ accentColor: 'var(--brand-500)' }} />
                  <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-700)' }}>{p.trackingCode}</span>
                  <span style={{ fontSize: 12, color: 'var(--ink-500)', flex: 1 }}>{p.campaign.code}</span>
                  <span className={'badge badge--dot badge--' + (p.paid ? 'ok' : 'warn')} style={{ fontSize: 10.5 }}>
                    {p.paid ? 'Payé' : 'Impayé'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Modèle</div>
          <select className="select" value={templateId} onChange={e => onTemplateChange(e.target.value)} style={{ marginBottom: 10 }}>
            {templates.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <textarea className="textarea" rows={8} value={body} onChange={e => setBody(e.target.value)}
            style={{ fontSize: 12.5, fontFamily: 'var(--ff-mono)', lineHeight: 1.6 }} />
          <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 6 }}>
            Variables disponibles : {'{first_name}'} {'{parcel_code}'} {'{amount}'} {'{weight}'} {'{arrival_date}'}
          </div>
        </div>
      </div>
    </Modal>
  );
}
