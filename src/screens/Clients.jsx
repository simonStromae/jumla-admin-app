import { useState, useEffect } from 'react';

import I from '../components/Icons.jsx';
import { Avatar, Drawer, Skel, Modal, useCan } from '../components/Shell.jsx';
import { HelpTip } from '../components/HelpCenter.jsx';
import { Pagination, ViewToggle } from '../components/Pagination.jsx';
import ClientFormModal from './ClientForm.jsx';
import { useAdminT } from '../lib/useAdminT.js';

export default function ClientsScreen({ onNav }) {
  const can = useCan();
  const t = useAdminT();
  const [open, setOpen] = useState(null);
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState('list');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState([]);

  const loadClients = () => {
    setLoading(true);
    setFetchError('');
    fetch('/api/clients')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          setClients(d);
        } else {
          setFetchError(d?.error || t.common.error);
        }
        setLoading(false);
      })
      .catch(() => {
        setFetchError(t.common.networkError);
        setLoading(false);
      });
  };

  useEffect(() => { loadClients(); }, []);
  useEffect(() => { setSelected([]); }, [statusFilter, search]);

  const filteredClients = clients.filter(cl => {
    if (statusFilter === 'active'    && cl.status === 'suspended') return false;
    if (statusFilter === 'suspended' && cl.status !== 'suspended') return false;
    if (statusFilter === 'unverified' && cl.emailVerified) return false;
    if (search) {
      const q = search.toLowerCase();
      return cl.name.toLowerCase().includes(q)
          || (cl.phone ?? '').includes(q)
          || (cl.email ?? '').toLowerCase().includes(q)
          || (cl.city  ?? '').toLowerCase().includes(q)
          || (cl.code  ?? '').toLowerCase().includes(q);
    }
    return true;
  });

  const handleSelectOne = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const handleSelectAll = (ids, checked) => {
    if (checked) setSelected(prev => [...new Set([...prev, ...ids])]);
    else setSelected(prev => prev.filter(x => !ids.includes(x)));
  };
  const handleBatchToggleStatus = async (newStatus) => {
    const label = newStatus === 'suspended' ? 'Suspendre' : 'Réactiver';
    if (!confirm(`${label} ${selected.length} client(s) ?`)) return;
    await Promise.all(selected.map(id =>
      fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
    ));
    setClients(cs => cs.map(c => selected.includes(c.id) ? { ...c, status: newStatus } : c));
    setSelected([]);
  };

  const handleToggleStatus = async (cl) => {
    const newStatus = cl.status === 'suspended' ? 'active' : 'suspended';
    // TODO: no i18n key for 'Suspendre'/'Réactiver'
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
          <div className="page__title">{t.clients.title}</div>
          {/* TODO: no i18n key for page subtitle */}
          <div className="page__sub">Expéditeurs enregistrés — basés à Douala, Lagos et autres villes d'origine</div>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost"><I.Download />{t.parcels.exportCsv}</button>
          {can('clients', 'create') && <button className="btn btn--brand" onClick={() => setEditing('new')}><I.UserPlus />{t.clients.new}</button>}
        </div>
      </div>

      <div className="toolbar">
        <div className="tabs" style={{ marginBottom: 0 }}>
          {[
            { id: 'all',        l: 'Tous',           n: clients.length },
            { id: 'active',     l: 'Actifs',         n: clients.filter(c => c.status !== 'suspended').length },
            { id: 'suspended',  l: 'Suspendus',      n: clients.filter(c => c.status === 'suspended').length },
            { id: 'unverified', l: 'Non vérifiés',   n: clients.filter(c => !c.emailVerified).length },
          ].map(tab => (
            <button
              key={tab.id}
              className={'tab ' + (statusFilter === tab.id ? 'is-active' : '')}
              onClick={() => { setStatusFilter(tab.id); setPage(1); }}
            >
              {tab.l} {tab.n > 0 && <span className="count">{tab.n}</span>}
            </button>
          ))}
        </div>
        <div className="spacer" />
        <div style={{ position: 'relative' }}>
          <I.Search style={{ position: 'absolute', left: 10, top: 9, width: 14, height: 14, color: 'var(--ink-400)' }} />
          <input
            className="input input--sm"
            placeholder="Rechercher un client…"
            style={{ width: 240, paddingLeft: 32 }}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setPage(1); }}
              style={{ position: 'absolute', right: 8, top: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-400)', fontSize: 14, lineHeight: 1 }}
            >✕</button>
          )}
        </div>
        <ViewToggle value={view} onChange={setView} />
      </div>

      {selected.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
          background: 'var(--brand-50)', border: '1px solid var(--brand-200)',
          borderBottom: 0, borderRadius: '8px 8px 0 0', fontSize: 13,
        }}>
          <span style={{ fontWeight: 600, color: 'var(--brand-700)' }}>{selected.length} sélectionné(s)</span>
          <div style={{ flex: 1 }} />
          <button className="btn btn--ghost btn--sm" onClick={() => handleBatchToggleStatus('suspended')}
            style={{ fontSize: 12, color: 'var(--bad-600)' }}>Suspendre</button>
          <button className="btn btn--ghost btn--sm" onClick={() => handleBatchToggleStatus('active')}
            style={{ fontSize: 12, color: 'var(--ok-700)' }}>Réactiver</button>
          <button className="btn btn--ghost btn--sm" onClick={() => setSelected([])}
            style={{ fontSize: 12 }}>✕ Désélectionner</button>
        </div>
      )}

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
          {t.common.error} : {fetchError}
        </div>
      ) : filteredClients.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--ink-400)', fontSize: 14 }}>
          <I.Users style={{ width: 32, height: 32, marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            {search || statusFilter !== 'all' ? 'Aucun client ne correspond à ce filtre.' : t.clients.empty}
          </div>
          {!search && statusFilter === 'all' && <div style={{ fontSize: 12 }}>Les clients qui se créent un compte apparaissent ici.</div>}
        </div>
      ) : view === 'grid'
        ? <ClientsGridView clients={filteredClients} setOpen={setOpen} />
        : <ClientsListView clients={filteredClients} setOpen={setOpen} onToggleStatus={handleToggleStatus} page={page} pageSize={pageSize} selected={selected} onSelect={handleSelectOne} onSelectAll={handleSelectAll} />
      }

      <Pagination total={filteredClients.length} page={page} pageSize={pageSize}
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
  const t = useAdminT();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, background: 'white', border: '1px solid var(--border)', borderTop: 0, padding: 14 }}>
      {clients.map(cl => (
        <div key={cl.id} className="card" style={{ padding: 14, position: 'relative', cursor: 'pointer', opacity: cl.status === 'suspended' ? .7 : 1 }} onClick={() => setOpen(cl)}>
          <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 4 }}>
            {cl.status === 'suspended' && <span className="badge" style={{ background: 'var(--bad-50)', color: 'var(--bad-700)', border: '1px solid var(--bad-200)', fontSize: 10 }}>{t.common.inactive}</span>}
            {/* TODO: no i18n key for 'Non vérifié' badge */}
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
            {/* TODO: no i18n key for 'Cargaisons' mini label */}
            <Mini label="Cargaisons" v={cl.campaigns} />
            <Mini label={t.common.weight} v={cl.weight + ' kg'} />
            {/* TODO: no i18n key for 'CA' (chiffre d'affaires) */}
            <Mini label="CA" v={(cl.amount / 1000).toFixed(1) + 'k'} unit="CAD" />
          </div>

          <div style={{ fontSize: 11.5, color: 'var(--ink-500)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <I.Calendar style={{ width: 11, height: 11 }} />
            {/* TODO: no i18n key for 'Dernière :' label */}
            Dernière : <span className="mono" style={{ color: 'var(--ink-700)', fontWeight: 600 }}>{cl.lastCampaign}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ClientsListView({ clients, setOpen, onToggleStatus, page, pageSize, selected = [], onSelect, onSelectAll }) {
  const t = useAdminT();
  const paged = clients.slice((page - 1) * pageSize, page * pageSize);
  const pagedIds = paged.map(cl => cl.id);
  const allChecked = pagedIds.length > 0 && pagedIds.every(id => selected.includes(id));
  const someChecked = pagedIds.some(id => selected.includes(id));
  return (
    <table className="tbl" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
      <thead>
        <tr>
          <th style={{ width: 32, borderRadius: 0 }}>
            <input type="checkbox"
              checked={allChecked}
              ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
              onChange={e => onSelectAll?.(pagedIds, e.target.checked)}
              style={{ accentColor: 'var(--brand-500)' }} />
          </th>
          <th>{t.common.name}</th>
          <th>{t.common.status}</th>
          <th>{t.common.city}</th>
          <th>{t.common.phone}</th>
          <th style={{ textAlign: 'center' }}>{t.nav.parcels}</th>
          <th style={{ textAlign: 'right' }}>{t.common.weight}</th>
          {/* TODO: no i18n key for 'CA total' */}
          <th style={{ textAlign: 'right' }}>CA total</th>
          {/* TODO: no i18n key for 'Dernière' column */}
          <th>Dernière</th>
          <th style={{ borderRadius: 0, width: 110 }}></th>
        </tr>
      </thead>
      <tbody>
        {paged.map(cl => {
          const suspended = cl.status === 'suspended';
          return (
            <tr key={cl.id} style={{ cursor: 'pointer', opacity: suspended ? .7 : 1 }} onClick={() => setOpen(cl)}>
              <td onClick={e => e.stopPropagation()}>
                <input type="checkbox"
                  checked={selected.includes(cl.id)}
                  onChange={() => onSelect?.(cl.id)}
                  style={{ accentColor: 'var(--brand-500)' }} />
              </td>
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
                    ? <span className="badge" style={{ background: 'var(--bad-50)', color: 'var(--bad-700)', border: '1px solid var(--bad-200)' }}>{t.common.inactive}</span>
                    : <span className="badge" style={{ background: 'var(--ok-50)', color: 'var(--ok-700)', border: '1px solid var(--ok-100)' }}>{t.common.active}</span>}
                  {/* TODO: no i18n key for 'Email non vérifié' badge */}
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
                    {/* TODO: no i18n key for 'Réactiver'/'Suspendre' */}
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
  const t = useAdminT();
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
  const [resettingPwd, setResettingPwd] = useState(false);
  const [resetPwdResult, setResetPwdResult] = useState('');
  const [loginLogs, setLoginLogs] = useState(null);
  const [logsLoading, setLogsLoading] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteErr('');
    try {
      const res = await fetch(`/api/clients/${cl.id}`, { method: 'DELETE' });
      const d = await res.json();
      if (!res.ok) {
        setDeleteErr(d.error || t.common.error);
        setDeleting(false);
        return;
      }
      onDeleted?.(cl.id);
      onClose();
    } catch {
      setDeleteErr(t.common.networkError);
      setDeleting(false);
    }
  };

  const loadLoginLogs = async () => {
    if (loginLogs) return;
    setLogsLoading(true);
    const rows = await fetch(`/api/admin/login-logs?userId=${cl.id}&limit=20`).then(r => r.json()).catch(() => []);
    setLoginLogs(rows);
    setLogsLoading(false);
  };

  const handleResetPassword = async () => {
    if (!confirm('Débloquer ce compte et générer un nouveau mot de passe temporaire ?')) return;
    setResettingPwd(true);
    setResetPwdResult('');
    try {
      const res = await fetch(`/api/admin/users/${cl.id}/reset-password`, { method: 'POST' });
      const d = await res.json();
      if (!res.ok) { setResetPwdResult('Erreur : ' + (d.error || 'inconnue')); }
      else {
        setResetPwdResult(`MDP temporaire : ${d.tempPassword}`);
        onStatusChange?.(cl.id, 'active');
      }
    } catch { setResetPwdResult('Erreur réseau'); }
    setResettingPwd(false);
  };

  const handleResendVerification = async () => {
    setResending(true);
    setResendOk(false);
    setResendErr('');
    try {
      const res = await fetch(`/api/admin/clients/${cl.id}/resend-verification`, { method: 'POST' });
      const d = await res.json();
      if (!res.ok) { setResendErr(d.error || t.common.error); }
      else { setResendOk(true); }
    } catch { setResendErr(t.common.networkError); }
    setResending(false);
  };

  const handleToggleStatus = async () => {
    const newStatus = cl.status === 'suspended' ? 'active' : 'suspended';
    // TODO: no i18n key for 'Suspendre'/'Réactiver'
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

  const parcels        = detail?.parcels ?? [];
  const cancelledCount = parcels.filter(p => p.paid === 'ann').length;
  const activeParcels  = parcels.filter(p => p.paid !== 'ann');
  const totalAmt  = activeParcels.reduce((s, p) => s + (p.invoiced ?? p.amount ?? 0), 0);
  const unpaidAmt = activeParcels.reduce((s, p) => s + (p.remaining ?? (p.paid ? 0 : p.amount ?? 0)), 0);
  const since     = detail?.createdAt
    ? new Date(detail.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : '—';

  return (
    <Drawer width={560} onClose={onClose}>
      <div className="drawer__head">
        <div style={{ flex: 1 }}>
          {/* TODO: no i18n key for 'Profil client' drawer heading */}
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
                <span className="badge" style={{ background: 'var(--bad-50)', color: 'var(--bad-700)', border: '1px solid var(--bad-200)' }}>{t.common.inactive}</span>
              )}
              {!cl.emailVerified && (
                <span className="badge" style={{ background: 'var(--warn-50)', color: 'var(--warn-700)', border: '1px solid var(--warn-200)' }}>
                  {/* TODO: no i18n key for 'Email non vérifié' */}
                  Email non vérifié
                  <HelpTip text="Le client n'a pas encore confirmé son adresse email. Utilisez le bouton ci-dessous pour renvoyer le code de vérification." position="left" />
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>
              {'Membre depuis'} {since}
            </div>
            {cl.city && cl.city !== '—' && (
              <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--ink-600)', fontWeight: 500 }}>{cl.city}</div>
            )}
          </div>
        </div>

        <div style={{ padding: '16px 22px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, borderBottom: '1px solid var(--border-soft)' }}>
          {loading ? [1,2,3,4].map(i => (
            <div key={i}><Skel w="50%" h={10} style={{ marginBottom: 6 }} /><Skel w="70%" h={20} /></div>
          )) : [
            { label: 'Total colis', value: activeParcels.length },
            // TODO: no i18n key for 'CA total'; using analytics.kpi.revenue as closest match
            { label: t.analytics.kpi.revenue,             value: totalAmt.toLocaleString('fr') + ' CAD', color: 'var(--ok-600)' },
            // TODO: no i18n key for 'Impayés'
            { label: 'Impayés',                           value: unpaidAmt > 0 ? unpaidAmt.toLocaleString('fr') + ' CAD' : '0 CAD', color: unpaidAmt > 0 ? 'var(--bad-600)' : 'var(--ink-400)' },
            { label: 'Annulés',                           value: cancelledCount, color: cancelledCount > 0 ? 'var(--warn-700)' : 'var(--ink-300)' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>{label}</div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: color || 'var(--ink-900)', marginTop: 4 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border-soft)' }}>
          {/* TODO: no i18n key for 'Contact' section title */}
          <div className="section-title" style={{ marginBottom: 10 }}>Contact</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <DrawerRow icon={<I.Phone />}    label={t.common.phone}  value={cl.phone !== '—' ? cl.phone : '—'} mono />
            <DrawerRow icon={<I.Pin />}      label={t.common.city}   value={cl.city  !== '—' ? cl.city  : '—'} />
            <DrawerRow icon={<I.Whatsapp />} label="WhatsApp"        value={detail?.whatsapp ?? cl.phone ?? '—'} mono />
            <DrawerRow icon={<I.Mail />}     label={t.common.email}  value={detail?.email    ?? '—'} />
          </div>
        </div>

        {detail?.savedRecipients?.length > 0 && (
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border-soft)' }}>
            <div className="section-title" style={{ marginBottom: 10 }}>
              <I.Users style={{ width: 13, height: 13, color: 'var(--brand-600)', marginRight: 4 }} />
              {/* TODO: no i18n key for 'Destinataires fréquents' */}
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
              {/* TODO: no i18n key for 'Adresses de livraison' */}
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

        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border-soft)' }}>
          <div className="section-title" style={{ marginBottom: 10, cursor: 'pointer' }} onClick={loadLoginLogs}>
            🔐 Connexions récentes
            {!loginLogs && <span style={{ fontSize: 11, color: 'var(--brand-500)', marginLeft: 8, fontWeight: 500 }}>Voir ▾</span>}
          </div>
          {logsLoading && <div style={{ fontSize: 12, color: 'var(--ink-400)' }}>Chargement…</div>}
          {loginLogs && loginLogs.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--ink-400)' }}>Aucun log disponible</div>
          )}
          {loginLogs && loginLogs.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {loginLogs.map(log => (
                <div key={log.id} style={{
                  padding: '8px 10px', borderRadius: 7,
                  background: log.success ? 'var(--ok-50)' : 'var(--bad-50)',
                  border: `1px solid ${log.success ? 'var(--ok-200)' : 'var(--bad-200)'}`,
                  fontSize: 12,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, color: log.success ? 'var(--ok-700)' : 'var(--bad-700)' }}>
                      {log.success ? '✓ Connexion réussie' : '✗ Tentative échouée'}
                    </span>
                    <span style={{ color: 'var(--ink-400)', fontFamily: 'monospace', fontSize: 11 }}>
                      {new Date(log.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ color: 'var(--ink-600)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {(log.city || log.country) && <span>📍 {[log.city, log.country].filter(Boolean).join(', ')}</span>}
                    {log.ip && <span style={{ fontFamily: 'monospace', fontSize: 11 }}>IP: {log.ip}</span>}
                  </div>
                  {log.userAgent && (
                    <div style={{ color: 'var(--ink-400)', fontSize: 11, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.userAgent}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '16px 22px' }}>
          <div className="section-title">
            {t.clients.tabs.history} <span className="section-title__count">{parcels.length}</span>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[1,2,3].map(i => <Skel key={i} w="100%" h={36} />)}
            </div>
          ) : parcels.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--ink-400)', padding: '12px 0' }}>
              {t.clients.emptyHistory}
            </div>
          ) : (
            <table className="tbl tbl--compact">
              <thead>
                <tr>
                  {/* TODO: no i18n key for 'Code' (tracking code column) */}
                  <th style={{ borderRadius: 0 }}>Code</th>
                  {/* TODO: no i18n key for 'Cargaison' column */}
                  <th>Cargaison</th>
                  <th style={{ textAlign: 'right' }}>{t.common.weight}</th>
                  <th style={{ textAlign: 'right' }}>{t.common.amount}</th>
                  {/* TODO: no i18n key for 'Paiement' column header */}
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
                      {p.paid === 'ann' && (
                        <span className="badge badge--dot" style={{ background: 'var(--warn-50)', color: 'var(--warn-700)', borderColor: 'var(--warn-200)' }}>Annulé</span>
                      )}
                      {p.paid !== 'ann' && p.displayStatus === 'paid' && (
                        <span className="badge badge--dot badge--ok">{t.paymentStatus.completed}</span>
                      )}
                      {/* TODO: no i18n key for 'Payé · Suppl.' */}
                      {p.paid !== 'ann' && p.displayStatus === 'paid_supp_pending' && (
                        <span className="badge badge--dot" style={{ background: 'var(--info-100)', color: 'var(--info-700)', borderColor: 'var(--info-100)' }}>Payé · Suppl.</span>
                      )}
                      {/* TODO: no i18n key for 'Partiel' */}
                      {p.paid !== 'ann' && p.displayStatus === 'partial' && (
                        <span className="badge badge--dot badge--warn">Partiel</span>
                      )}
                      {p.paid !== 'ann' && p.displayStatus === 'pending' && (
                        <span className="badge badge--dot badge--warn">{t.paymentStatus.pending}</span>
                      )}
                      {/* TODO: no i18n key for 'Sans facture' */}
                      {p.paid !== 'ann' && (!p.displayStatus || p.displayStatus === 'none') && (
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
          <button className="btn btn--ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onEdit}><I.Edit />{t.common.edit}</button>
          <button className="btn btn--soft" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowWa(true)}>
            <I.Whatsapp style={{ color: 'var(--ok-600)' }} />WhatsApp
          </button>
          <button
            className="btn btn--ghost"
            style={{ flex: 1, justifyContent: 'center', color: cl.status === 'suspended' ? 'var(--ok-700)' : 'var(--bad-600)' }}
            onClick={handleToggleStatus}
            disabled={togglingStatus}>
            {/* TODO: no i18n key for 'Réactiver'/'Suspendre' */}
            {cl.status === 'suspended' ? 'Réactiver' : 'Suspendre'}
          </button>
        </div>
        {cl.status === 'suspended' && (
          <div>
            <button
              className="btn btn--ghost"
              style={{ width: '100%', justifyContent: 'center', fontSize: 12, color: 'var(--bad-700)', borderColor: 'var(--bad-200)' }}
              onClick={handleResetPassword}
              disabled={resettingPwd}>
              🔑 {resettingPwd ? 'Réinitialisation…' : 'Débloquer + Réinitialiser le mot de passe'}
            </button>
            {resetPwdResult && (
              <div style={{
                fontSize: 13, fontWeight: 600, background: 'var(--ok-50)', border: '1px solid var(--ok-200)',
                color: 'var(--ok-700)', borderRadius: 6, padding: '8px 12px', marginTop: 6,
                fontFamily: 'monospace', wordBreak: 'break-all',
              }}>
                {resetPwdResult}
              </div>
            )}
          </div>
        )}
        {!cl.emailVerified && (
          <div>
            <button
              className="btn btn--ghost"
              style={{ width: '100%', justifyContent: 'center', fontSize: 12, color: 'var(--warn-700)' }}
              onClick={handleResendVerification}
              disabled={resending || resendOk}>
              <I.Mail style={{ width: 13, height: 13 }} />
              {/* TODO: no i18n key for resend verification labels */}
              {resending ? t.common.sending : resendOk ? 'Email envoyé ✓' : 'Renvoyer l\'email de vérification'}
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
            <I.Trash style={{ width: 13, height: 13 }} />{t.common.delete}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn"
              style={{ flex: 1, justifyContent: 'center', background: 'var(--bad-600)', color: 'white', fontSize: 12 }}
              onClick={handleDelete}
              disabled={deleting}>
              <I.Trash style={{ width: 13, height: 13 }} />
              {/* TODO: no i18n key for 'Suppression...' */}
              {deleting ? 'Suppression...' : t.common.confirm}
            </button>
            <button className="btn btn--ghost" style={{ fontSize: 12 }} onClick={() => { setDeleteConfirm(false); setDeleteErr(''); }}>
              {t.common.cancel}
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
  const t = useAdminT();
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
      const loaded = WA_TEMPLATE_DEFAULTS.map(tmpl => ({
        ...tmpl,
        label: d[`wa_tmpl_${tmpl.id}_label`] ?? tmpl.label,
        body:  d[`wa_tmpl_${tmpl.id}_body`]  ?? tmpl.body,
      }));
      setTemplates(loaded);
      const current = loaded.find(tmpl => tmpl.id === 'arrival');
      if (current) setBody(current.body);
    }).catch(() => {});
  }, []);

  const onTemplateChange = (id) => {
    setTemplateId(id);
    const found = templates.find(tmpl => tmpl.id === id);
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
      setResult({ ok: false, error: t.common.networkError });
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
            {/* TODO: no i18n key for sent/failure message */}
            {result.sentCount > 0 ? `✓ ${result.sentCount} message(s) envoyé(s)` : `Échec : ${result.error || t.common.error}`}
          </div>
          <button className="btn btn--ghost" onClick={onClose}>{t.common.close}</button>
        </>
      ) : (
        <>
          <div style={{ flex: 1 }} />
          <button className="btn btn--ghost" onClick={onClose}>{t.common.cancel}</button>
          <button className="btn btn--brand" onClick={handleSend} disabled={sending || !selectedParcelIds.length}>
            <I.Whatsapp style={{ width: 14, height: 14 }} />
            {sending ? t.common.sending : t.common.send}
          </button>
        </>
      )}>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {parcels.length === 0 ? (
          <div style={{ padding: 16, background: 'var(--bg-soft)', borderRadius: 8, fontSize: 13, color: 'var(--ink-500)', textAlign: 'center' }}>
            {t.clients.emptyHistory}
          </div>
        ) : (
          <div>
            {/* TODO: no i18n key for 'Colis concerné(s)' */}
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
                    {p.paid ? t.paymentStatus.completed : t.paymentStatus.pending}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          {/* TODO: no i18n key for 'Modèle' */}
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Modèle</div>
          <select className="select" value={templateId} onChange={e => onTemplateChange(e.target.value)} style={{ marginBottom: 10 }}>
            {templates.map(tmpl => <option key={tmpl.id} value={tmpl.id}>{tmpl.label}</option>)}
          </select>
          <textarea className="textarea" rows={8} value={body} onChange={e => setBody(e.target.value)}
            style={{ fontSize: 12.5, fontFamily: 'var(--ff-mono)', lineHeight: 1.6 }} />
          {/* TODO: no i18n key for 'Variables disponibles :' */}
          <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 6 }}>
            Variables disponibles : {'{first_name}'} {'{parcel_code}'} {'{amount}'} {'{weight}'} {'{arrival_date}'}
          </div>
        </div>
      </div>
    </Modal>
  );
}
