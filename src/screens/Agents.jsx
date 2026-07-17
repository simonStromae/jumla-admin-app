import { useState, useEffect } from 'react';
import I from '../components/Icons.jsx';
import { Bi, Avatar, Skel, Modal } from '../components/Shell.jsx';
import PhoneInput from '../components/PhoneInput.jsx';
import { Pagination, ViewToggle } from '../components/Pagination.jsx';
import AgentFormModal from './AgentForm.jsx';
import { useAdminT } from '../lib/useAdminT.js';

// TODO: no translation keys for individual permission labels
const permLabels = {
  campaigns:  'Créer cargaisons',
  parcels:    'Modifier colis',
  payments:   'Valider paiements',
  agents:     'Gérer agents',
  whatsapp:   'Envoyer WhatsApp',
  analytics:  'Voir analyses',
};

// Total individual permission actions across all modules (mirrors AgentForm PERMISSION_MODULES)
const PERM_MAX = { cargaisons: 5, parcels: 4, payments: 3, slips: 3, clients: 3, costs: 2, whatsapp: 2, admin: 4 };
const TOTAL_ACTIONS = Object.values(PERM_MAX).reduce((a, b) => a + b, 0); // 26

function countGranted(perms) {
  return Object.values(perms).reduce((sum, v) =>
    sum + (Array.isArray(v) ? v.length : (v === true ? 1 : 0)), 0);
}

function StatusBadge({ status }) {
  const t = useAdminT();
  if (status === 'suspended') {
    return <span className="badge" style={{ background: 'var(--bad-50)', color: 'var(--bad-700)', border: '1px solid var(--bad-200)' }}>{t.common.inactive}</span>;
  }
  return <span className="badge" style={{ background: 'var(--ok-50)', color: 'var(--ok-700)', border: '1px solid var(--ok-100)' }}>{t.common.active}</span>;
}

function Mini({ label, v, unit }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>
        {v}{unit && <span style={{ fontSize: 9.5, color: 'var(--ink-400)', marginLeft: 1 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 9.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function AgentsGridView({ agents, setEditing, onToggleStatus, onDelete }) {
  const t = useAdminT();
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12,
      padding: 14, background: 'white', border: '1px solid var(--border)',
      borderRadius: '0 0 12px 12px',
    }}>
      {agents.map(a => {
        const perms = a.permissions || a.perms || {};
        const suspended = a.status === 'suspended';
        return (
          <div key={a.id} className="card" style={{ padding: 0, overflow: 'hidden', opacity: suspended ? .7 : 1 }}>
            <div style={{ padding: 14, borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <Avatar initials={a.initials} color={a.color} size="lg" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{a.name}</span>
                  {a.role === 'admin'    && <span className="badge badge--brand">Admin</span>}
                  {a.role === 'agent'    && <span className="badge badge--info">Agent</span>}
                  {/* TODO: no translation key for 'readonly' role label */}
                  {a.role === 'readonly' && <span className="badge badge--neutral">Lecture seule</span>}
                  <StatusBadge status={a.status} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-500)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <I.Pin style={{ width: 11, height: 11 }} />
                  {a.city}
                  <span style={{ color: 'var(--ink-300)', margin: '0 4px' }}>·</span>
                  <span style={{ color: 'var(--ink-400)' }}>{a.lastLogin}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                <button className="icon-btn" onClick={() => setEditing(a)}><I.Edit /></button>
                <button className="icon-btn" style={{ color: 'var(--bad-500)' }} onClick={() => onDelete(a)} title={t.common.delete}><I.Trash /></button>
              </div>
            </div>

            <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, background: 'var(--bg-soft)', borderBottom: '1px solid var(--border-soft)' }}>
              <Mini label={t.nav.campaigns} v={a.campaigns} />
              <Mini label={t.nav.parcels} v={a.parcels} />
              {/* TODO: no translation key for 'Encaissé' */}
              <Mini label="Encaissé" v={(a.collected / 1000).toFixed(0) + 'k'} unit="CAD" />
            </div>

            <div style={{ padding: 14 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: 'var(--ink-400)', textTransform: 'uppercase', marginBottom: 8 }}>{'Permissions'}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {Object.entries(perms).map(([k, v]) => {
                  const active = Array.isArray(v) ? v.length > 0 : Boolean(v);
                  return (
                    <span key={k} style={{
                      padding: '3px 8px', fontSize: 10.5, fontWeight: 600, borderRadius: 4,
                      background: active ? 'var(--ok-50)' : 'var(--bg-soft)',
                      color: active ? 'var(--ok-700)' : 'var(--ink-300)',
                      border: '1px solid ' + (active ? 'var(--ok-100)' : 'var(--border-soft)'),
                      textDecoration: active ? 'none' : 'line-through',
                    }}>
                      {active ? '✓ ' : '✗ '}{permLabels[k]}
                    </span>
                  );
                })}
              </div>
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                <button
                  className="btn btn--ghost btn--xs"
                  style={suspended ? { color: 'var(--ok-700)' } : { color: 'var(--bad-600)' }}
                  onClick={() => onToggleStatus(a)}>
                  {/* TODO: no translation keys for 'Réactiver'/'Suspendre' */}
                  {suspended ? 'Réactiver' : 'Suspendre'}
                </button>
                <button
                  className="btn btn--ghost btn--xs"
                  style={{ color: 'var(--bad-600)' }}
                  onClick={() => onDelete(a)}>
                  <I.Trash style={{ width: 11, height: 11 }} />{t.common.delete}
                </button>
              </div>
            </div>
          </div>
        );
      })}

      <div onClick={() => setEditing('new')} style={{
        border: '2px dashed var(--border)', borderRadius: 12, padding: 28,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        color: 'var(--ink-400)', cursor: 'pointer',
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 999, background: 'var(--bg-soft)', display: 'grid', placeItems: 'center', marginBottom: 10 }}>
          <I.UserPlus />
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-700)' }}>{t.agents.invite}</div>
        {/* TODO: no translation key for temporary password WhatsApp message */}
        <div style={{ fontSize: 11.5, marginTop: 4, textAlign: 'center' }}>Un mot de passe temporaire sera envoyé par WhatsApp.</div>
      </div>
    </div>
  );
}

function AgentsListView({ agents, setEditing, onToggleStatus, onDelete, page, pageSize }) {
  const t = useAdminT();
  const paged = agents.slice((page - 1) * pageSize, page * pageSize);
  return (
    <table className="tbl" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
      <thead>
        <tr>
          <th style={{ width: 32, borderRadius: 0 }}><input type="checkbox" style={{ accentColor: 'var(--brand-500)' }} /></th>
          <th>{t.agents.listHeaders.name}</th>
          <th>{t.agents.listHeaders.role}</th>
          <th>{t.agents.listHeaders.status}</th>
          {/* TODO: no translation key for 'Site' */}
          <th>Site</th>
          <th style={{ textAlign: 'center' }}>{t.nav.campaigns}</th>
          <th style={{ textAlign: 'center' }}>{t.nav.parcels}</th>
          <th>{'Permissions'}</th>
          {/* TODO: no translation key for 'Créé le' */}
          <th>Créé le</th>
          <th style={{ borderRadius: 0, width: 100 }}></th>
        </tr>
      </thead>
      <tbody>
        {paged.map(a => {
          const perms = a.permissions || a.perms || {};
          const enabledPerms = countGranted(perms);
          const totalPerms = TOTAL_ACTIONS;
          const suspended = a.status === 'suspended';
          return (
            <tr key={a.id} style={{ opacity: suspended ? .7 : 1 }}>
              <td><input type="checkbox" style={{ accentColor: 'var(--brand-500)' }} /></td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar initials={a.initials} color={a.color} size="sm" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>{a.email}</div>
                  </div>
                </div>
              </td>
              <td>
                {a.role === 'admin'    && <span className="badge badge--brand">Admin</span>}
                {a.role === 'agent'    && <span className="badge badge--info">Agent</span>}
                {/* TODO: no translation key for 'readonly' role label */}
                {a.role === 'readonly' && <span className="badge badge--neutral">Lecture seule</span>}
              </td>
              <td><StatusBadge status={a.status} /></td>
              <td style={{ fontSize: 12.5 }}>
                <I.Pin style={{ width: 11, height: 11, color: 'var(--ink-400)', verticalAlign: -1, marginRight: 3 }} />
                {a.city}
              </td>
              <td className="mono" style={{ textAlign: 'center', fontWeight: 600 }}>{a.campaigns}</td>
              <td className="mono" style={{ textAlign: 'center', fontWeight: 600 }}>{a.parcels}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 60, height: 4, background: 'var(--ink-100)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: (totalPerms > 0 ? enabledPerms / totalPerms * 100 : 0) + '%', height: '100%', background: 'var(--brand-500)', borderRadius: 999 }} />
                  </div>
                  <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-600)', fontWeight: 600 }}>{enabledPerms}/{totalPerms}</span>
                </div>
              </td>
              <td style={{ fontSize: 12, color: 'var(--ink-500)' }}>{a.lastLogin}</td>
              <td>
                <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <button className="icon-btn" onClick={() => setEditing(a)} title={t.common.edit}><I.Edit /></button>
                  <button
                    className="btn btn--ghost btn--xs"
                    style={suspended ? { color: 'var(--ok-700)', fontSize: 11 } : { color: 'var(--bad-600)', fontSize: 11 }}
                    onClick={() => onToggleStatus(a)}>
                    {/* TODO: no translation keys for 'Réactiver'/'Suspendre' */}
                    {suspended ? 'Réactiver' : 'Suspendre'}
                  </button>
                  <button
                    className="icon-btn"
                    style={{ color: 'var(--bad-500)' }}
                    onClick={() => onDelete(a)}
                    title={t.common.delete}>
                    <I.Trash />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function DriverFormModal({ onClose, onSave }) {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [phone, setPhone]     = useState('');
  const [city, setCity]       = useState('');
  const [invite, setInvite]   = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [tempPwd, setTempPwd] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) { setError('Nom et email requis'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, city, role: 'driver', permissions: {}, sendInvite: invite }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Erreur'); setSaving(false); return; }
      if (d.tempPassword) { setTempPwd(d.tempPassword); return; }
      onSave();
    } catch { setError('Erreur réseau'); }
    finally { setSaving(false); }
  };

  if (tempPwd) {
    return (
      <Modal onClose={onSave} title="Livreur créé" width={420}>
        <div style={{ padding: '24px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 13, marginBottom: 12, color: 'var(--ink-600)' }}>Mot de passe temporaire (à communiquer au livreur) :</div>
          <div className="mono" style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2, color: 'var(--brand-700)', background: 'var(--brand-50)', border: '1px solid var(--brand-100)', borderRadius: 8, padding: '10px 20px', display: 'inline-block' }}>{tempPwd}</div>
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-400)' }}>Le livreur devra changer ce mot de passe à la première connexion.</div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} title="Nouveau livreur" sub="Crée un compte livreur avec accès à l'application mobile" width={480}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 0' }}>
        {error && <div style={{ padding: '8px 12px', background: 'var(--bad-50)', border: '1px solid var(--bad-200)', borderRadius: 7, fontSize: 12.5, color: 'var(--bad-700)' }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label className="label">Nom complet *</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Jean Dupont" required />
          </div>
          <div>
            <label className="label">Email *</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jean@exemple.com" required />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label className="label">Téléphone</label>
            <PhoneInput value={phone} onChange={setPhone} />
          </div>
          <div>
            <label className="label">Ville</label>
            <input className="input" value={city} onChange={e => setCity(e.target.value)} placeholder="Montréal" />
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', padding: '8px 12px', background: 'var(--bg-soft)', borderRadius: 7 }}>
          <input type="checkbox" checked={invite} onChange={e => setInvite(e.target.checked)} style={{ accentColor: 'var(--brand-500)' }} />
          Envoyer le mot de passe temporaire par WhatsApp
        </label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn--brand" disabled={saving}>
            {saving ? 'Création…' : 'Créer le livreur'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DriversView({ drivers, onDelete, onNew, loading }) {
  if (loading) {
    return (
      <table className="tbl" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <thead><tr>
          <th style={{ borderRadius: 0 }}>Nom</th>
          <th>Email</th>
          <th>Téléphone</th>
          <th>Ville</th>
          <th style={{ borderRadius: 0, width: 80 }}></th>
        </tr></thead>
        <tbody>{[1,2,3].map(i => (
          <tr key={i}>
            <td><Skel w={130} h={13} /></td>
            <td><Skel w={160} h={13} /></td>
            <td><Skel w={110} h={13} /></td>
            <td><Skel w={80} h={13} /></td>
            <td></td>
          </tr>
        ))}</tbody>
      </table>
    );
  }
  if (drivers.length === 0) {
    return (
      <div style={{ background: 'white', border: '1px solid var(--border)', borderTopLeftRadius: 0, borderTopRightRadius: 0, borderRadius: 12, padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🚚</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>Aucun livreur</div>
        <div style={{ fontSize: 13, color: 'var(--ink-400)', marginBottom: 16 }}>Ajoutez un premier livreur pour commencer les livraisons à domicile.</div>
        <button className="btn btn--brand" onClick={onNew}><I.UserPlus />Nouveau livreur</button>
      </div>
    );
  }
  return (
    <table className="tbl" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
      <thead>
        <tr>
          <th style={{ borderRadius: 0 }}>Nom</th>
          <th>Email</th>
          <th>Téléphone</th>
          <th>Ville</th>
          <th style={{ borderRadius: 0, width: 80 }}></th>
        </tr>
      </thead>
      <tbody>
        {drivers.map(d => (
          <tr key={d.id}>
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 999, background: 'var(--brand-100)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, color: 'var(--brand-700)', flexShrink: 0 }}>
                  {d.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{d.name}</span>
              </div>
            </td>
            <td className="mono" style={{ fontSize: 12.5, color: 'var(--ink-600)' }}>{d.email}</td>
            <td style={{ fontSize: 12.5 }}>{d.phone || '—'}</td>
            <td style={{ fontSize: 12.5 }}>{d.city || '—'}</td>
            <td>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                <button className="icon-btn" style={{ color: 'var(--bad-500)' }} onClick={() => onDelete(d)} title="Supprimer"><I.Trash /></button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function AgentsScreen({ onNav }) {
  const t = useAdminT();
  const [agents, setAgents]         = useState([]);
  const [drivers, setDrivers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [driverLoading, setDriverLoading] = useState(false);
  const [tab, setTab]               = useState('all');
  const [editing, setEditing]       = useState(null);
  const [driverEditing, setDriverEditing] = useState(false);
  const [view, setView]             = useState('list');
  const [page, setPage]             = useState(1);
  const [pageSize, setPageSize]     = useState(10);

  const loadAgents = () => {
    fetch('/api/users')
      .then(r => r.json())
      .then(data => { setAgents(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const loadDrivers = () => {
    setDriverLoading(true);
    fetch('/api/admin/drivers')
      .then(r => r.json())
      .then(data => { setDrivers(Array.isArray(data) ? data : []); setDriverLoading(false); })
      .catch(() => setDriverLoading(false));
  };

  useEffect(() => { loadAgents(); }, []);
  useEffect(() => { if (tab === 'livreur') loadDrivers(); }, [tab]);

  const handleToggleStatus = async (agent) => {
    const newStatus = agent.status === 'suspended' ? 'active' : 'suspended';
    // TODO: no translation keys for 'Suspendre'/'Réactiver'
    const label = newStatus === 'suspended' ? 'Suspendre' : 'Réactiver';
    if (!confirm(`${label} ${agent.name} ?`)) return;
    await fetch(`/api/users/${agent.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    loadAgents();
  };

  const handleDeleteAgent = async (agent) => {
    // TODO: no translation key for delete confirmation message
    if (!confirm(`Supprimer définitivement ${agent.name} ? Cette action est irréversible.`)) return;
    const res = await fetch(`/api/users/${agent.id}`, { method: 'DELETE' });
    const d = await res.json();
    if (!res.ok) {
      alert(d.error || t.common.error);
      return;
    }
    loadAgents();
  };

  const handleDeleteDriver = async (driver) => {
    if (!confirm(`Supprimer définitivement ${driver.name} ? Cette action est irréversible.`)) return;
    const res = await fetch(`/api/users/${driver.id}`, { method: 'DELETE' });
    const d = await res.json();
    if (!res.ok) { alert(d.error || t.common.error); return; }
    loadDrivers();
  };

  const filtered = tab === 'all' ? agents : agents.filter(a => a.role === tab);

  const adminCount     = agents.filter(a => a.role === 'admin').length;
  const agentCount     = agents.filter(a => a.role === 'agent').length;
  const readonlyCount  = agents.filter(a => a.role === 'readonly').length;
  const suspendedCount = agents.filter(a => a.status === 'suspended').length;

  if (loading) {
    return (
      <div className="page">
        <div className="page__head">
          <div>
            <div className="page__title"><Bi fr="Agents & permissions" en="Agents & permissions" /></div>
            <div className="page__sub"><Skel w={220} h={13} /></div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12, padding: 14, background: 'white', border: '1px solid var(--border)', borderRadius: '0 0 12px 12px', marginTop: 40 }}>
          {[1,2,3].map(i => (
            <div key={i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: 14, borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <Skel w={44} h={44} r={999} />
                <div style={{ flex: 1 }}>
                  <Skel w="55%" h={15} style={{ marginBottom: 8 }} />
                  <Skel w="70%" h={12} />
                </div>
              </div>
              <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, background: 'var(--bg-soft)', borderBottom: '1px solid var(--border-soft)' }}>
                {[1,2,3].map(j => <div key={j}><Skel w="60%" h={16} style={{ marginBottom: 4 }} /><Skel w="80%" h={10} /></div>)}
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {[80,100,90,70,85,60].map((w,j) => <Skel key={j} w={w} h={22} r={4} />)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__title"><Bi fr="Agents & permissions" en="Agents & permissions" /></div>
          <div className="page__sub">
            {agents.length} membres · {adminCount} admins · {agentCount} agents
            {/* TODO: no translation keys for 'lecture seule' / 'suspendu(s)' in subtitle */}
            {readonlyCount > 0 ? ` · ${readonlyCount} lecture seule` : ''}
            {suspendedCount > 0 ? ` · ${suspendedCount} suspendu${suspendedCount > 1 ? 's' : ''}` : ''}
          </div>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost"><I.Download />{t.common.export}</button>
          {tab === 'livreur'
            ? <button className="btn btn--brand" onClick={() => setDriverEditing(true)}><I.UserPlus />Nouveau livreur</button>
            : <button className="btn btn--brand" onClick={() => setEditing('new')}><I.UserPlus />{t.agents.invite}</button>
          }
        </div>
      </div>

      <div className="toolbar">
        <div className="tabs">
          {/* TODO: no translation key for 'Tous' tab */}
          <button className={'tab ' + (tab === 'all'      ? 'is-active' : '')} onClick={() => { setTab('all'); setPage(1); }}>Tous <span className="count">{agents.length}</span></button>
          <button className={'tab ' + (tab === 'admin'    ? 'is-active' : '')} onClick={() => { setTab('admin'); setPage(1); }}>Admins <span className="count">{adminCount}</span></button>
          <button className={'tab ' + (tab === 'agent'    ? 'is-active' : '')} onClick={() => { setTab('agent'); setPage(1); }}>{t.nav.agents} <span className="count">{agentCount}</span></button>
          {/* TODO: no translation key for 'Lecture seule' role tab */}
          <button className={'tab ' + (tab === 'readonly' ? 'is-active' : '')} onClick={() => { setTab('readonly'); setPage(1); }}>Lecture seule <span className="count">{readonlyCount}</span></button>
          <button className={'tab ' + (tab === 'livreur'  ? 'is-active' : '')} onClick={() => { setTab('livreur'); setPage(1); }}>Livreurs <span className="count">{drivers.length}</span></button>
        </div>
        <div className="spacer" />
        {tab !== 'livreur' && <>
          <div style={{ position: 'relative' }}>
            <I.Search style={{ position: 'absolute', left: 10, top: 9, width: 14, height: 14, color: 'var(--ink-400)' }} />
            <input className="input input--sm" placeholder="Rechercher un agent…" style={{ width: 220, paddingLeft: 32 }} />
          </div>
          <ViewToggle value={view} onChange={setView} />
        </>}
      </div>

      {tab === 'livreur'
        ? <DriversView drivers={drivers} loading={driverLoading} onDelete={handleDeleteDriver} onNew={() => setDriverEditing(true)} />
        : view === 'grid'
          ? <AgentsGridView agents={filtered} setEditing={setEditing} onToggleStatus={handleToggleStatus} onDelete={handleDeleteAgent} />
          : <AgentsListView agents={filtered} setEditing={setEditing} onToggleStatus={handleToggleStatus} onDelete={handleDeleteAgent} page={page} pageSize={pageSize} />
      }

      {tab !== 'livreur' && view === 'list' && (
        <Pagination total={filtered.length} page={page} pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      )}

      {editing && (
        <AgentFormModal
          mode={editing === 'new' ? 'create' : 'edit'}
          agent={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={() => { setEditing(null); loadAgents(); }}
        />
      )}

      {driverEditing && (
        <DriverFormModal
          onClose={() => setDriverEditing(false)}
          onSave={() => { setDriverEditing(false); loadDrivers(); }}
        />
      )}
    </div>
  );
}
