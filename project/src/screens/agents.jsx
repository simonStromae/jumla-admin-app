// ============================================
// ZENDIT — Screen: Agents & permissions
// ============================================

function AgentsScreen({ onNav }) {
  const agents = window.DATA.AGENTS;
  const [tab, setTab] = useState('all');
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState('grid');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const permLabels = {
    campaigns: 'Créer cargaisons',
    parcels:   'Modifier colis',
    payments:  'Valider paiements',
    agents:    'Gérer agents',
    whatsapp:  'Envoyer WhatsApp',
    analytics: 'Voir analyses',
  };

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__title"><Bi fr="Agents & permissions" en="Agents & permissions" /></div>
          <div className="page__sub">{agents.length} membres · 2 admins · 3 agents · 1 lecture seule</div>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost"><I.Download />Export liste</button>
          <button className="btn btn--brand" onClick={() => setEditing('new')}><I.UserPlus />Inviter un agent</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="tabs">
          <button className={'tab '+(tab==='all'?'is-active':'')} onClick={()=>setTab('all')}>Tous <span className="count">{agents.length}</span></button>
          <button className={'tab '+(tab==='admin'?'is-active':'')} onClick={()=>setTab('admin')}>Admins <span className="count">2</span></button>
          <button className={'tab '+(tab==='agent'?'is-active':'')} onClick={()=>setTab('agent')}>Agents <span className="count">3</span></button>
          <button className={'tab '+(tab==='readonly'?'is-active':'')} onClick={()=>setTab('readonly')}>Lecture seule <span className="count">1</span></button>
        </div>
        <div className="spacer" />
        <div style={{ position: 'relative' }}>
          <I.Search style={{ position: 'absolute', left: 10, top: 9, width: 14, height: 14, color: 'var(--ink-400)' }} />
          <input className="input input--sm" placeholder="Rechercher..." style={{ width: 220, paddingLeft: 32 }} />
        </div>
        <ViewToggle value={view} onChange={setView} />
      </div>

      {view === 'grid' ? (
        <AgentsGridView agents={agents} setEditing={setEditing} />
      ) : (
        <AgentsListView agents={agents} setEditing={setEditing} page={page} pageSize={pageSize} />
      )}

      {view === 'list' && (
        <Pagination total={agents.length} page={page} pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      )}

      {editing && (
        <AgentFormModal
          mode={editing === 'new' ? 'create' : 'edit'}
          agent={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function Mini2({ label, v, unit }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>
        {v}{unit && <span style={{ fontSize: 9.5, color: 'var(--ink-400)', marginLeft: 1 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 9.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

// === Grid view ===
function AgentsGridView({ agents, setEditing }) {
  const permLabels = {
    campaigns: 'Créer cargaisons',
    parcels:   'Modifier colis',
    payments:  'Valider paiements',
    agents:    'Gérer agents',
    whatsapp:  'Envoyer WhatsApp',
    analytics: 'Voir analyses',
  };
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12,
      padding: 14, background: 'white', borderTop: 0, border: '1px solid var(--border)',
      borderRadius: '0 0 12px 12px',
    }}>
      {agents.map(a => (
        <div key={a.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 14, borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <Avatar initials={a.initials} color={a.color} size="lg" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{a.name}</span>
                {a.role === 'admin' && <span className="badge badge--brand">Admin</span>}
                {a.role === 'agent' && <span className="badge badge--info">Agent</span>}
                {a.role === 'readonly' && <span className="badge badge--neutral">Lecture seule</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <I.Pin style={{ width: 11, height: 11 }} />
                {a.city}
                <span style={{ color: 'var(--ink-300)', margin: '0 4px' }}>·</span>
                <span style={{ color: 'var(--ink-400)' }}>{a.lastLogin}</span>
              </div>
            </div>
            <button className="icon-btn" onClick={() => setEditing(a)}><I.Edit /></button>
          </div>

          <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, background: 'var(--bg-soft)', borderBottom: '1px solid var(--border-soft)' }}>
            <Mini2 label="Cargaisons" v={a.campaigns} />
            <Mini2 label="Colis gérés" v={a.parcels} />
            <Mini2 label="Encaissé" v={(a.collected/1000).toFixed(0)+'k'} unit="CAD" />
          </div>

          <div style={{ padding: 14 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: 'var(--ink-400)', textTransform: 'uppercase', marginBottom: 8 }}>
              Permissions
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {Object.entries(a.perms).map(([k, v]) => (
                <span key={k} style={{
                  padding: '3px 8px', fontSize: 10.5, fontWeight: 600, borderRadius: 4,
                  background: v ? 'var(--ok-50)' : 'var(--bg-soft)',
                  color: v ? 'var(--ok-700)' : 'var(--ink-300)',
                  border: '1px solid '+(v ? 'var(--ok-100)' : 'var(--border-soft)'),
                  textDecoration: v ? 'none' : 'line-through',
                }}>
                  {v ? '✓ ' : '✗ '}{permLabels[k]}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Invite card */}
      <div onClick={() => setEditing('new')} style={{
        border: '2px dashed var(--border)', borderRadius: 12, padding: 28,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        color: 'var(--ink-400)', cursor: 'pointer',
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 999, background: 'var(--bg-soft)', display: 'grid', placeItems: 'center', marginBottom: 10 }}>
          <I.UserPlus />
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-700)' }}>Inviter un agent</div>
        <div style={{ fontSize: 11.5, marginTop: 4, textAlign: 'center' }}>Envoyez un lien par email — l'agent crée son mot de passe.</div>
      </div>
    </div>
  );
}

// === List view (table) ===
function AgentsListView({ agents, setEditing, page, pageSize }) {
  const paged = agents.slice((page - 1) * pageSize, page * pageSize);
  return (
    <table className="tbl" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
      <thead>
        <tr>
          <th style={{ width: 32, borderRadius: 0 }}><input type="checkbox" style={{accentColor:'var(--brand-500)'}}/></th>
          <th>Agent</th>
          <th>Rôle</th>
          <th>Site</th>
          <th style={{textAlign:'center'}}>Cargaisons</th>
          <th style={{textAlign:'center'}}>Colis gérés</th>
          <th style={{textAlign:'right'}}>Encaissé</th>
          <th>Permissions</th>
          <th>Dernière activité</th>
          <th style={{borderRadius:0, width:60}}></th>
        </tr>
      </thead>
      <tbody>
        {paged.map(a => {
          const enabledPerms = Object.values(a.perms).filter(Boolean).length;
          const totalPerms = Object.keys(a.perms).length;
          return (
            <tr key={a.id}>
              <td><input type="checkbox" style={{accentColor:'var(--brand-500)'}}/></td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar initials={a.initials} color={a.color} size="sm" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>{a.initials.toLowerCase()}@zendit.cargo</div>
                  </div>
                </div>
              </td>
              <td>
                {a.role === 'admin' && <span className="badge badge--brand">Admin</span>}
                {a.role === 'agent' && <span className="badge badge--info">Agent</span>}
                {a.role === 'readonly' && <span className="badge badge--neutral">Lecture seule</span>}
              </td>
              <td style={{ fontSize: 12.5 }}>
                <I.Pin style={{ width: 11, height: 11, color: 'var(--ink-400)', verticalAlign: -1, marginRight: 3 }} />
                {a.city}
              </td>
              <td className="mono" style={{ textAlign: 'center', fontWeight: 600 }}>{a.campaigns}</td>
              <td className="mono" style={{ textAlign: 'center', fontWeight: 600 }}>{a.parcels}</td>
              <td style={{ textAlign: 'right' }}>
                <span className="mono" style={{ fontWeight: 700 }}>{(a.collected/1000).toFixed(0)}k</span>
                <span style={{ fontSize: 11, color: 'var(--ink-400)', marginLeft: 3 }}>CAD</span>
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 60, height: 4, background: 'var(--ink-100)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: (enabledPerms / totalPerms * 100) + '%', height: '100%', background: 'var(--brand-500)', borderRadius: 999 }}/>
                  </div>
                  <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-600)', fontWeight: 600 }}>{enabledPerms}/{totalPerms}</span>
                </div>
              </td>
              <td style={{ fontSize: 12, color: 'var(--ink-500)' }}>{a.lastLogin}</td>
              <td>
                <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <button className="icon-btn" onClick={() => setEditing(a)} title="Modifier"><I.Edit /></button>
                  <button className="icon-btn"><I.More /></button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

window.AgentsScreen = AgentsScreen;
