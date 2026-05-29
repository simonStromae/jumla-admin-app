// ============================================
// ZENDIT — Modal: Client create/edit
// ============================================

function ClientFormModal({ mode = 'create', client, onClose, onSave }) {
  const isEdit = mode === 'edit';
  const [data, setData] = useState(() => ({
    name: client?.name || '',
    code: client?.code || 'CL-' + String(700 + Math.floor(Math.random() * 99)).padStart(4, '0'),
    color: client?.color || ((Math.floor(Math.random() * 8)) + 1),
    role: client?.role || 'recipient',
    // Sender side
    senderPhone: client?.senderPhone || '',
    senderCity: client?.senderCity || 'Douala',
    senderAddress: client?.senderAddress || '',
    // Recipient side
    recipPhone: client?.phone || '',
    recipCity: client?.city || 'Montréal',
    recipAddress: client?.address || '',
    whatsapp: client?.whatsapp || client?.phone || '',
    email: client?.email || '',
    language: client?.language || 'fr',
    loyal: client?.loyal || false,
    notes: client?.notes || '',
    linkedClient: client?.linkedClient || '',
  }));
  const [tab, setTab] = useState('contact');

  const upd = (k, v) => setData(d => ({ ...d, [k]: v }));

  return (
    <Modal width={820} onClose={onClose}
      title={
        <span>{isEdit ? 'Modifier le client' : 'Nouveau client'}
          <span style={{color:'var(--ink-400)', fontWeight:400, fontSize:'.85em', marginLeft:6}}>/ {isEdit ? 'Edit client' : 'New client'}</span>
        </span>
      }
      sub={isEdit ? <><span className="mono">{data.code}</span> · {data.name}</> : 'Fiche client utilisée pour expédier ou recevoir des colis'}
      footer={
        <>
          {isEdit && <button className="btn btn--ghost" style={{ color: 'var(--bad-600)' }}><I.Trash />Supprimer</button>}
          <div className="spacer" style={{flex:1}}/>
          <button className="btn btn--ghost" onClick={onClose}>Annuler</button>
          {!isEdit && <button className="btn btn--soft" onClick={onSave}>Enregistrer & nouveau</button>}
          <button className="btn btn--brand" onClick={onSave}><I.Check />{isEdit ? 'Enregistrer' : 'Créer le client'}</button>
        </>
      }>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 22 }}>
        <div>
          {/* Identity */}
          <div className="section-title">Identité</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, padding: 14, background: 'var(--bg-soft)', borderRadius: 10 }}>
            <Avatar initials={data.name ? data.name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase() : '••'} color={data.color} size="xl" />
            <div style={{ flex: 1 }}>
              <div className="field-row field-row--2" style={{ marginBottom: 0 }}>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="label">Nom complet</label>
                  <input className="input" value={data.name} onChange={e => upd('name', e.target.value)} placeholder="Ex: Client M" />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="label">Code client <span className="opt">/ Auto</span></label>
                  <input className="input mono" value={data.code} onChange={e => upd('code', e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 5, marginTop: 10 }}>
                {[1,2,3,4,5,6,7,8].map(c => (
                  <button key={c} onClick={() => upd('color', c)} style={{
                    width: 20, height: 20, borderRadius: 999,
                    background: ['', '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6', '#EC4899', '#14B8A6'][c],
                    border: data.color === c ? '2px solid var(--ink-900)' : '2px solid white',
                    boxShadow: data.color === c ? '0 0 0 1.5px white' : 'none',
                    cursor: 'pointer',
                  }} />
                ))}
              </div>
            </div>
          </div>

          {/* Role */}
          <div className="field">
            <label className="label">Type de client <span className="opt">/ Role</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { id: 'sender',    l: 'Expéditeur',   sub: 'Envoie depuis le pays d\'origine', color: 'var(--brand-500)' },
                { id: 'recipient', l: 'Destinataire', sub: 'Reçoit dans le pays d\'arrivée', color: 'var(--info-500)' },
                { id: 'both',      l: 'Mixte',        sub: 'Envoie et reçoit', color: 'var(--ok-500)' },
              ].map(r => {
                const sel = data.role === r.id;
                return (
                  <button key={r.id} onClick={() => upd('role', r.id)} style={{
                    padding: 12, textAlign: 'left',
                    border: '1.5px solid ' + (sel ? r.color : 'var(--border)'),
                    background: sel ? r.color + '12' : 'white',
                    borderRadius: 8, cursor: 'pointer',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: sel ? r.color : 'var(--ink-800)' }}>{r.l}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>{r.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tabs for contact info */}
          <div style={{ marginTop: 18 }}>
            <div className="tabs" style={{ marginBottom: 14 }}>
              <button className={'tab '+(tab==='contact'?'is-active':'')} onClick={() => setTab('contact')}>Contact</button>
              {(data.role === 'sender' || data.role === 'both') && <button className={'tab '+(tab==='sender'?'is-active':'')} onClick={() => setTab('sender')}>Expédition · Douala</button>}
              {(data.role === 'recipient' || data.role === 'both') && <button className={'tab '+(tab==='recip'?'is-active':'')} onClick={() => setTab('recip')}>Réception · Canada</button>}
              <button className={'tab '+(tab==='prefs'?'is-active':'')} onClick={() => setTab('prefs')}>Préférences</button>
            </div>

            {tab === 'contact' && (
              <div>
                <div className="field-row field-row--2">
                  <div className="field">
                    <label className="label">Téléphone principal</label>
                    <input className="input mono" value={data.recipPhone} onChange={e => upd('recipPhone', e.target.value)} placeholder="+1 514 *** ****" />
                  </div>
                  <div className="field">
                    <label className="label">WhatsApp <span className="opt">/ Si différent</span></label>
                    <input className="input mono" value={data.whatsapp} onChange={e => upd('whatsapp', e.target.value)} placeholder="+1 514 *** ****" />
                  </div>
                </div>
                <div className="field">
                  <label className="label">Email <span className="opt">/ Optionnel</span></label>
                  <input className="input" type="email" value={data.email} onChange={e => upd('email', e.target.value)} placeholder="client@example.com" />
                </div>
              </div>
            )}

            {tab === 'sender' && (
              <div>
                <div className="field-row field-row--2">
                  <div className="field">
                    <label className="label">Téléphone Douala</label>
                    <input className="input mono" value={data.senderPhone} onChange={e => upd('senderPhone', e.target.value)} placeholder="+237 6** ** ** **" />
                  </div>
                  <div className="field">
                    <label className="label">Ville</label>
                    <select className="select" value={data.senderCity} onChange={e => upd('senderCity', e.target.value)}>
                      <option>Douala</option><option>Yaoundé</option><option>Lagos</option><option>Bafoussam</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label className="label">Adresse</label>
                  <input className="input" value={data.senderAddress} onChange={e => upd('senderAddress', e.target.value)} placeholder="BP 1842, Akwa, Douala — Cameroun" />
                </div>
              </div>
            )}

            {tab === 'recip' && (
              <div>
                <div className="field-row field-row--2">
                  <div className="field">
                    <label className="label">Téléphone Canada</label>
                    <input className="input mono" value={data.recipPhone} onChange={e => upd('recipPhone', e.target.value)} placeholder="+1 514 *** ****" />
                  </div>
                  <div className="field">
                    <label className="label">Ville</label>
                    <select className="select" value={data.recipCity} onChange={e => upd('recipCity', e.target.value)}>
                      <option>Montréal</option><option>Laval</option><option>Longueuil</option>
                      <option>Brossard</option><option>Gatineau</option><option>Québec</option><option>Toronto</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label className="label">Adresse de livraison</label>
                  <input className="input" value={data.recipAddress} onChange={e => upd('recipAddress', e.target.value)} placeholder="N°, rue, code postal..." />
                </div>
                {data.role === 'recipient' && (
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label className="label">Lié à un expéditeur <span className="opt">/ Optionnel</span></label>
                    <select className="select" value={data.linkedClient} onChange={e => upd('linkedClient', e.target.value)}>
                      <option value="">— Aucun</option>
                      {window.DATA.CLIENTS.filter(c => c.role === 'sender' || c.role === 'both').map(c => (
                        <option key={c.id} value={c.id}>{c.name} · {c.code}</option>
                      ))}
                    </select>
                    <div className="hint">Pour faciliter le rapprochement quand l'expéditeur crée un colis.</div>
                  </div>
                )}
              </div>
            )}

            {tab === 'prefs' && (
              <div>
                <div className="field-row field-row--2">
                  <div className="field">
                    <label className="label">Langue préférée</label>
                    <select className="select" value={data.language} onChange={e => upd('language', e.target.value)}>
                      <option value="fr">Français</option><option value="en">English</option>
                    </select>
                    <div className="hint">Utilisé dans les messages WhatsApp automatiques.</div>
                  </div>
                  <div className="field">
                    <label className="label">Client fidèle</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: data.loyal ? 'var(--brand-50)' : 'var(--bg-soft)', border: '1px solid ' + (data.loyal ? 'var(--brand-200)' : 'var(--border)'), borderRadius: 7 }}>
                      <I.Star style={{ width: 14, height: 14, color: data.loyal ? 'var(--brand-500)' : 'var(--ink-300)' }}/>
                      <span style={{ flex: 1, fontSize: 13, color: data.loyal ? 'var(--brand-700)' : 'var(--ink-500)', fontWeight: 600 }}>
                        {data.loyal ? 'Marqué comme fidèle' : 'Non marqué'}
                      </span>
                      <button className="btn btn--ghost btn--xs" onClick={() => upd('loyal', !data.loyal)}>{data.loyal ? 'Retirer' : 'Marquer'}</button>
                    </div>
                    <div className="hint">Notifié en priorité à l'ouverture d'une cargaison.</div>
                  </div>
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="label">Notes internes <span className="opt">/ Visible aux agents uniquement</span></label>
                  <textarea className="textarea" rows={3} value={data.notes} onChange={e => upd('notes', e.target.value)} placeholder="Particularités, instructions de livraison, historique..." />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: live preview */}
        <div>
          <div style={{ position: 'sticky', top: 0 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', background: 'var(--bg-soft)', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 700 }}>Aperçu fiche</div>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <Avatar initials={data.name ? data.name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase() : '••'} color={data.color} size="lg" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{data.name || 'Sans nom'}
                      {data.loyal && <I.Star style={{ width: 12, height: 12, color: 'var(--brand-500)', marginLeft: 4, verticalAlign: -1 }}/>}
                    </div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--ink-400)' }}>{data.code}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--ink-600)' }}>
                  {data.role === 'sender' && <span className="badge badge--brand" style={{ alignSelf: 'flex-start' }}>Expéditeur</span>}
                  {data.role === 'recipient' && <span className="badge badge--info" style={{ alignSelf: 'flex-start' }}>Destinataire</span>}
                  {data.role === 'both' && <span className="badge badge--ok" style={{ alignSelf: 'flex-start' }}>Expéditeur + Destinataire</span>}

                  {data.recipPhone && <div className="mono">📱 {data.recipPhone}</div>}
                  {data.email && <div>✉ {data.email}</div>}
                  {data.recipCity && <div>📍 {data.recipCity}</div>}
                  {data.recipAddress && <div style={{ fontSize: 11 }}>{data.recipAddress}</div>}
                </div>
              </div>

              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-soft)', background: 'var(--bg-soft)', fontSize: 11.5, color: 'var(--ink-500)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <I.Info style={{ width: 12, height: 12, color: 'var(--ink-400)' }}/>
                {isEdit ? 'Modifications enregistrées et propagées aux colis liés' : 'Le client sera disponible pour les nouveaux colis'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

window.ClientFormModal = ClientFormModal;
