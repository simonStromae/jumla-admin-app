import { useState, useEffect } from 'react';
import I from '../components/Icons.jsx';
import { Bi, Avatar, Skel } from '../components/Shell.jsx';
import { Pagination, ViewToggle } from '../components/Pagination.jsx';
import AgentFormModal from './AgentForm.jsx';

const permLabels = {
  campaigns: 'Créer cargaisons',
  parcels:   'Modifier colis',
  payments:  'Valider paiements',
  agents:    'Gérer agents',
  whatsapp:  'Envoyer WhatsApp',
  analytics: 'Voir analyses',
};

function StatusBadge({ status }) {
  if (status === 'suspended') {
    return <span className="badge" style={{ background: 'var(--bad-50)', color: 'var(--bad-700)', border: '1px solid var(--bad-200)' }}>Suspendu</span>;
  }
  return <span className="badge" style={{ background: 'var(--ok-50)', color: 'var(--ok-700)', border: '1px solid var(--ok-100)' }}>Actif</span>;
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

function AgentsGridView({ agents, setEditing, onToggleStatus }) {
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
              </div>
            </div>

            <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, background: 'var(--bg-soft)', borderBottom: '1px solid var(--border-soft)' }}>
              <Mini label="Cargaisons" v={a.campaigns} />
              <Mini label="Colis gérés" v={a.parcels} />
              <Mini label="Encaissé" v={(a.collected / 1000).toFixed(0) + 'k'} unit="CAD" />
            </div>

            <div style={{ padding: 14 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: 'var(--ink-400)', textTransform: 'uppercase', marginBottom: 8 }}>Permissions</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {Object.entries(perms).map(([k, v]) => (
                  <span key={k} style={{
                    padding: '3px 8px', fontSize: 10.5, fontWeight: 600, borderRadius: 4,
                    background: v ? 'var(--ok-50)' : 'var(--bg-soft)',
                    color: v ? 'var(--ok-700)' : 'var(--ink-300)',
                    border: '1px solid ' + (v ? 'var(--ok-100)' : 'var(--border-soft)'),
                    textDecoration: v ? 'none' : 'line-through',
                  }}>
                    {v ? '✓ ' : '✗ '}{permLabels[k]}
                  </span>
                ))}
              </div>
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn--ghost btn--xs"
                  style={suspended ? { color: 'var(--ok-700)' } : { color: 'var(--bad-600)' }}
                  onClick={() => onToggleStatus(a)}>
                  {suspended ? 'Réactiver' : 'Suspendre'}
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
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-700)' }}>Inviter un agent</div>
        <div style={{ fontSize: 11.5, marginTop: 4, textAlign: 'center' }}>Un mot de passe temporaire sera envoyé par WhatsApp.</div>
      </div>
    </div>
  );
}

function AgentsListView({ agents, setEditing, onToggleStatus, page, pageSize }) {
  const paged = agents.slice((page - 1) * pageSize, page * pageSize);
  return (
    <table className="tbl" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
      <thead>
        <tr>
          <th style={{ width: 32, borderRadius: 0 }}><input type="checkbox" style={{ accentColor: 'var(--brand-500)' }} /></th>
          <th>Agent</th>
          <th>Rôle</th>
          <th>Statut</th>
          <th>Site</th>
          <th style={{ textAlign: 'center' }}>Cargaisons</th>
          <th style={{ textAlign: 'center' }}>Colis gérés</th>
          <th>Permissions</th>
          <th>Créé le</th>
          <th style={{ borderRadius: 0, width: 100 }}></th>
        </tr>
      </thead>
      <tbody>
        {paged.map(a => {
          const perms = a.permissions || a.perms || {};
          const enabledPerms = Object.values(perms).filter(Boolean).length;
          const totalPerms = Object.keys(perms).length;
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
                  <button className="icon-btn" onClick={() => setEditing(a)} title="Modifier"><I.Edit /></button>
                  <button
                    className="btn btn--ghost btn--xs"
                    style={suspended ? { color: 'var(--ok-700)', fontSize: 11 } : { color: 'var(--bad-600)', fontSize: 11 }}
                    onClick={() => onToggleStatus(a)}>
                    {suspended ? 'Réactiver' : 'Suspendre'}
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

export default function AgentsScreen({ onNav }) {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState('list');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadAgents = () => {
    fetch('/api/users')
      .then(r => r.json())
      .then(data => { setAgents(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadAgents(); }, []);

  const handleToggleStatus = async (agent) => {
    const newStatus = agent.status === 'suspended' ? 'active' : 'suspended';
    const label = newStatus === 'suspended' ? 'Suspendre' : 'Réactiver';
    if (!confirm(`${label} ${agent.name} ?`)) return;
    await fetch(`/api/users/${agent.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    loadAgents();
  };

  const filtered = tab === 'all' ? agents : agents.filter(a => a.role === tab);

  const adminCount    = agents.filter(a => a.role === 'admin').length;
  const agentCount    = agents.filter(a => a.role === 'agent').length;
  const readonlyCount = agents.filter(a => a.role === 'readonly').length;
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
            {readonlyCount > 0 ? ` · ${readonlyCount} lecture seule` : ''}
            {suspendedCount > 0 ? ` · ${suspendedCount} suspendu${suspendedCount > 1 ? 's' : ''}` : ''}
          </div>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost"><I.Download />Export liste</button>
          <button className="btn btn--brand" onClick={() => setEditing('new')}><I.UserPlus />Inviter un agent</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="tabs">
          <button className={'tab ' + (tab === 'all'      ? 'is-active' : '')} onClick={() => setTab('all')}>Tous <span className="count">{agents.length}</span></button>
          <button className={'tab ' + (tab === 'admin'    ? 'is-active' : '')} onClick={() => setTab('admin')}>Admins <span className="count">{adminCount}</span></button>
          <button className={'tab ' + (tab === 'agent'    ? 'is-active' : '')} onClick={() => setTab('agent')}>Agents <span className="count">{agentCount}</span></button>
          <button className={'tab ' + (tab === 'readonly' ? 'is-active' : '')} onClick={() => setTab('readonly')}>Lecture seule <span className="count">{readonlyCount}</span></button>
        </div>
        <div className="spacer" />
        <div style={{ position: 'relative' }}>
          <I.Search style={{ position: 'absolute', left: 10, top: 9, width: 14, height: 14, color: 'var(--ink-400)' }} />
          <input className="input input--sm" placeholder="Rechercher..." style={{ width: 220, paddingLeft: 32 }} />
        </div>
        <ViewToggle value={view} onChange={setView} />
      </div>

      {view === 'grid'
        ? <AgentsGridView agents={filtered} setEditing={setEditing} onToggleStatus={handleToggleStatus} />
        : <AgentsListView agents={filtered} setEditing={setEditing} onToggleStatus={handleToggleStatus} page={page} pageSize={pageSize} />}

      {view === 'list' && (
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
    </div>
  );
}
