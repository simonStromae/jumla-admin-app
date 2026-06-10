import { useState } from 'react';
import I from '../components/Icons.jsx';
import { Avatar, Modal } from '../components/Shell.jsx';

const PERMISSION_MODULES = [
  {
    id: 'cargaisons', label: 'Cargaisons', Icon: I.Plane,
    perms: [
      { id: 'view',   label: 'Voir',           sub: 'Lecture de toutes les cargaisons' },
      { id: 'create', label: 'Créer',           sub: 'Ouvrir de nouvelles cargaisons' },
      { id: 'edit',   label: 'Modifier',        sub: 'Changer les paramètres' },
      { id: 'status', label: 'Changer statut',  sub: 'Avancer dans le workflow' },
      { id: 'close',  label: 'Clôturer',        sub: 'Action irréversible' },
    ],
  },
  {
    id: 'parcels', label: 'Colis', Icon: I.Box,
    perms: [
      { id: 'view',   label: 'Voir' },
      { id: 'create', label: 'Créer' },
      { id: 'edit',   label: 'Modifier' },
      { id: 'delete', label: 'Supprimer' },
    ],
  },
  {
    id: 'payments', label: 'Paiements', Icon: I.Wallet,
    perms: [
      { id: 'view',     label: 'Voir' },
      { id: 'validate', label: 'Valider',    sub: 'Marquer comme reçu' },
      { id: 'refund',   label: 'Rembourser' },
    ],
  },
  {
    id: 'slips', label: 'Bordereaux', Icon: I.FileText,
    perms: [
      { id: 'view',     label: 'Voir' },
      { id: 'create',   label: 'Créer' },
      { id: 'validate', label: 'Valider', sub: 'Libérer le colis' },
    ],
  },
  {
    id: 'clients', label: 'Clients', Icon: I.Users,
    perms: [
      { id: 'view',   label: 'Voir' },
      { id: 'create', label: 'Créer' },
      { id: 'edit',   label: 'Modifier' },
    ],
  },
  {
    id: 'whatsapp', label: 'WhatsApp', Icon: I.Chat,
    perms: [
      { id: 'send',      label: 'Envoyer' },
      { id: 'templates', label: 'Modifier modèles' },
    ],
  },
  {
    id: 'admin', label: 'Administration', Icon: I.Settings,
    perms: [
      { id: 'analytics', label: 'Voir analyses' },
      { id: 'routes',    label: 'Gérer routes' },
      { id: 'agents',    label: 'Gérer agents' },
      { id: 'settings',  label: 'Modifier paramètres' },
    ],
  },
];

const ROLE_PRESETS = {
  admin: {
    cargaisons: ['view', 'create', 'edit', 'status', 'close'],
    parcels: ['view', 'create', 'edit', 'delete'],
    payments: ['view', 'validate', 'refund'],
    slips: ['view', 'create', 'validate'],
    clients: ['view', 'create', 'edit'],
    whatsapp: ['send', 'templates'],
    admin: ['analytics', 'routes', 'agents', 'settings'],
  },
  agent: {
    cargaisons: ['view', 'status'],
    parcels: ['view', 'create', 'edit'],
    payments: ['view', 'validate'],
    slips: ['view', 'create', 'validate'],
    clients: ['view', 'create', 'edit'],
    whatsapp: ['send'],
    admin: [],
  },
  readonly: {
    cargaisons: ['view'],
    parcels: ['view'],
    payments: ['view'],
    slips: ['view'],
    clients: ['view'],
    whatsapp: [],
    admin: ['analytics'],
  },
};

export default function AgentFormModal({ mode = 'create', agent, onClose, onSave }) {
  const isEdit = mode === 'edit';
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [whatsappSent, setWhatsappSent] = useState(false);
  const [data, setData] = useState(() => ({
    name: agent?.name || '',
    initials: agent?.initials || '',
    email: agent?.email || '',
    phone: agent?.phone || '',
    city: agent?.city || 'Douala',
    role: agent?.role || 'agent',
    color: agent?.color || 1,
    status: agent?.status || 'active',
    perms: agent?.permsDetailed || JSON.parse(JSON.stringify(ROLE_PRESETS[agent?.role || 'agent'])),
    sendInvite: !isEdit,
  }));

  const upd = (k, v) => setData(d => ({ ...d, [k]: v }));

  const togglePerm = (modId, permId) => {
    const cur = data.perms[modId] || [];
    const next = cur.includes(permId) ? cur.filter(p => p !== permId) : [...cur, permId];
    upd('perms', { ...data.perms, [modId]: next });
  };

  const applyRolePreset = (role) => {
    upd('role', role);
    upd('perms', JSON.parse(JSON.stringify(ROLE_PRESETS[role])));
  };

  const onNameBlur = () => {
    if (!data.initials && data.name) {
      const inits = data.name.split(' ').map(x => x[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
      upd('initials', inits);
    }
  };

  const totalPerms = Object.values(data.perms).reduce((a, p) => a + p.length, 0);

  const handleSave = async () => {
    if (!data.name.trim() || !data.email.trim()) { setSaveErr('Nom et email requis'); return; }
    setSaving(true); setSaveErr('');
    try {
      const url    = isEdit ? `/api/users/${agent.id}` : '/api/users';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        data.name.trim(),
          email:       data.email.trim(),
          phone:       data.phone?.trim() || null,
          city:        data.city  || null,
          role:        data.role,
          permissions: data.perms,
          status:      data.status,
          sendInvite:  data.sendInvite,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setSaveErr(json.error || 'Erreur'); setSaving(false); return; }
      if (!isEdit && json.tempPassword) {
        setTempPassword(json.tempPassword);
        setWhatsappSent(json.whatsappSent ?? false);
        setSaving(false);
        return; // Stay open to show temp password
      }
      onSave();
    } catch {
      setSaveErr('Erreur réseau');
      setSaving(false);
    }
  };

  return (
    <Modal width={920} onClose={onClose}
      title={
        <span>{isEdit ? "Modifier l'agent" : 'Inviter un nouvel agent'}
          <span style={{ color: 'var(--ink-400)', fontWeight: 400, fontSize: '.85em', marginLeft: 6 }}>
            / {isEdit ? 'Edit agent' : 'New agent'}
          </span>
        </span>
      }
      sub={isEdit ? `${data.name} · ${data.city}` : "Définissez les informations et le niveau d'accès"}
      footer={
        <>
          {isEdit && (
            <button className="btn btn--ghost" style={{ color: 'var(--bad-600)' }}
              onClick={async () => {
                if (!confirm('Supprimer cet agent ?')) return;
                await fetch(`/api/users/${agent.id}`, { method: 'DELETE' });
                onSave();
              }}>
              <I.Trash />Supprimer
            </button>
          )}
          <div style={{ flex: 1 }} />
          {saveErr && <span style={{ fontSize: 12, color: 'var(--bad-600)' }}>{saveErr}</span>}
          <button className="btn btn--ghost" onClick={onClose}>Annuler</button>
          <button className="btn btn--brand" onClick={handleSave} disabled={saving}>
            <I.Check />{saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : "Créer l'agent"}
          </button>
        </>
      }>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 22 }}>
        {/* Left: identity */}
        <div>
          <div className="section-title">Identité</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, padding: 14, background: 'var(--bg-soft)', borderRadius: 10 }}>
            <Avatar initials={data.initials || '••'} color={data.color} size="xl" />
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Couleur</div>
              <div style={{ display: 'flex', gap: 5 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(c => (
                  <button key={c} onClick={() => upd('color', c)} style={{
                    width: 22, height: 22, borderRadius: 999,
                    background: ['', '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6', '#EC4899', '#14B8A6'][c],
                    border: data.color === c ? '2.5px solid var(--ink-900)' : '2px solid white',
                    cursor: 'pointer',
                  }} />
                ))}
              </div>
            </div>
          </div>

          <div className="field-row field-row--2">
            <div className="field">
              <label className="label">Nom complet</label>
              <input className="input" value={data.name} onChange={e => upd('name', e.target.value)} onBlur={onNameBlur} placeholder="Aïcha Mbarga" />
            </div>
            <div className="field">
              <label className="label">Initiales <span className="opt">/ Initials</span></label>
              <input className="input mono" value={data.initials} onChange={e => upd('initials', e.target.value.toUpperCase().slice(0, 2))} maxLength={2} placeholder="AM" style={{ textAlign: 'center', fontWeight: 700 }} />
            </div>
          </div>

          <div className="field-row field-row--2">
            <div className="field">
              <label className="label">Email professionnel</label>
              <input className="input" type="email" value={data.email} onChange={e => upd('email', e.target.value)} placeholder="prenom.nom@jumla.cargo" />
            </div>
            <div className="field">
              <label className="label">Téléphone</label>
              <input className="input mono" value={data.phone} onChange={e => upd('phone', e.target.value)} placeholder="+237 6** ** ** **" />
            </div>
          </div>

          <div className="field-row field-row--2">
            <div className="field">
              <label className="label">Ville / Site</label>
              <select className="select" value={data.city} onChange={e => upd('city', e.target.value)}>
                <option>Douala</option><option>Lagos</option>
                <option>Montréal</option><option>Bruxelles</option><option>Paris</option>
              </select>
            </div>
            <div className="field">
              <label className="label">Statut du compte</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: data.status !== 'suspended' ? 'var(--ok-50)' : 'var(--bg-soft)', borderRadius: 7, border: '1px solid ' + (data.status !== 'suspended' ? 'var(--ok-100)' : 'var(--border)'), height: 36 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: data.status !== 'suspended' ? 'var(--ok-500)' : 'var(--ink-300)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: data.status !== 'suspended' ? 'var(--ok-700)' : 'var(--ink-500)' }}>
                  {data.status !== 'suspended' ? 'Actif' : 'Suspendu'}
                </span>
                <button className="btn btn--ghost btn--xs" onClick={() => upd('status', data.status !== 'suspended' ? 'suspended' : 'active')}>
                  {data.status !== 'suspended' ? 'Suspendre' : 'Réactiver'}
                </button>
              </div>
            </div>
          </div>

          <div className="divider" />

          <div className="section-title">Rôle <span className="section-title__count">{totalPerms} permissions</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
            {[
              { id: 'admin',    label: 'Administrateur',    desc: 'Accès complet',      icon: '👑', count: 25 },
              { id: 'agent',    label: 'Agent opérationnel', desc: 'Cargaisons & clients', icon: '🚚', count: 13 },
              { id: 'readonly', label: 'Lecture seule',     desc: 'Consultation uniquement', icon: '👁', count: 6  },
            ].map(r => {
              const sel = data.role === r.id;
              return (
                <button key={r.id} onClick={() => applyRolePreset(r.id)} style={{
                  padding: 14, border: '1.5px solid ' + (sel ? 'var(--brand-500)' : 'var(--border)'),
                  background: sel ? 'var(--brand-50)' : 'white',
                  borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 20 }}>{r.icon}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: sel ? 'var(--brand-700)' : 'var(--ink-800)' }}>{r.label}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-500)', marginBottom: 6 }}>{r.desc}</div>
                  <div className="mono" style={{ fontSize: 10.5, color: sel ? 'var(--brand-700)' : 'var(--ink-400)', fontWeight: 600 }}>{r.count} permissions par défaut</div>
                </button>
              );
            })}
          </div>

          <div className="section-title">Permissions détaillées <span style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 500, marginLeft: 6 }}>Ajustez si besoin</span></div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {PERMISSION_MODULES.map((m, mi) => {
              const Ic = m.Icon;
              const enabled = (data.perms[m.id] || []).length;
              return (
                <div key={m.id} style={{ borderBottom: mi < PERMISSION_MODULES.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-soft)' }}>
                    {Ic && <Ic style={{ width: 14, height: 14, color: 'var(--brand-600)' }} />}
                    <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700 }}>{m.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--ink-500)', fontFamily: 'var(--ff-mono)' }}>{enabled}/{m.perms.length}</span>
                  </div>
                  <div style={{ padding: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 6 }}>
                    {m.perms.map(p => {
                      const checked = (data.perms[m.id] || []).includes(p.id);
                      return (
                        <label key={p.id} style={{
                          display: 'flex', alignItems: 'flex-start', gap: 8,
                          padding: '7px 10px', borderRadius: 6,
                          background: checked ? 'var(--brand-50)' : 'white',
                          border: '1px solid ' + (checked ? 'var(--brand-200)' : 'var(--border-soft)'),
                          cursor: 'pointer',
                        }}>
                          <input type="checkbox" checked={checked} onChange={() => togglePerm(m.id, p.id)} style={{ accentColor: 'var(--brand-500)', marginTop: 2 }} />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: checked ? 'var(--brand-700)' : 'var(--ink-700)' }}>{p.label}</div>
                            {p.sub && <div style={{ fontSize: 10.5, color: 'var(--ink-400)', marginTop: 1 }}>{p.sub}</div>}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: summary */}
        <div>
          <div style={{ position: 'sticky', top: 0 }}>
            {!isEdit && !tempPassword && (
              <div className="card" style={{ overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-soft)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Invitation par WhatsApp</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-400)', marginTop: 2 }}>Un mot de passe temporaire sera généré et envoyé au numéro de l'agent</div>
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--ink-400)', marginBottom: 6 }}>WhatsApp → {data.phone || '(numéro non renseigné)'}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-700)', lineHeight: 1.6 }}>
                      Bonjour <strong>{data.name?.split(' ')[0] || '...'}</strong> 👋<br />
                      Vous êtes invité(e) à rejoindre <strong>Jumla Shipping</strong> en tant qu'<strong>{data.role === 'admin' ? 'Administrateur' : 'Agent'}</strong>.<br />
                      🔑 Mot de passe temporaire : <strong>Jumla#XXXX</strong><br />
                      <span style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>À changer à la première connexion.</span>
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, marginTop: 10, cursor: 'pointer' }}>
                    <input type="checkbox" checked={data.sendInvite} onChange={() => upd('sendInvite', !data.sendInvite)} style={{ accentColor: 'var(--brand-500)' }} />
                    Envoyer l'invitation par WhatsApp
                    {!data.phone && <span style={{ fontSize: 11, color: 'var(--bad-600)' }}>(numéro requis)</span>}
                  </label>
                </div>
              </div>
            )}

            {tempPassword && (
              <div className="card" style={{ overflow: 'hidden', marginBottom: 14, border: '1.5px solid var(--ok-200)' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--ok-100)', background: 'var(--ok-50)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ok-800)' }}>Agent créé avec succès ✓</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ok-700)', marginTop: 2 }}>
                    {whatsappSent ? 'Mot de passe envoyé par WhatsApp' : 'WhatsApp indisponible — copiez le mot de passe ci-dessous'}
                  </div>
                </div>
                <div style={{ padding: 14 }}>
                  {!whatsappSent && (
                    <>
                      <div style={{ fontSize: 12, color: 'var(--ink-600)', marginBottom: 8 }}>Communiquez ce mot de passe temporaire à l'agent :</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-soft)', borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'var(--ff-mono)', fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>
                        <span style={{ flex: 1 }}>{tempPassword}</span>
                        <button className="btn btn--ghost btn--xs" onClick={() => navigator.clipboard?.writeText(tempPassword)}>Copier</button>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 8 }}>L'agent devra le changer à la première connexion.</div>
                    </>
                  )}
                  <button className="btn btn--brand" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }} onClick={onSave}>
                    Terminer
                  </button>
                </div>
              </div>
            )}

            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600, marginBottom: 10 }}>
                Résumé d'accès
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {PERMISSION_MODULES.map(m => {
                  const granted = data.perms[m.id] || [];
                  const Ic = m.Icon;
                  return (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      {Ic && <Ic style={{ width: 12, height: 12, color: 'var(--ink-400)', flexShrink: 0 }} />}
                      <span style={{ flex: 1, color: 'var(--ink-700)' }}>{m.label}</span>
                      {granted.length === m.perms.length
                        ? <span style={{ color: 'var(--ok-600)', fontWeight: 700, fontSize: 11 }}>✓ tout</span>
                        : granted.length === 0
                          ? <span style={{ color: 'var(--ink-300)', fontSize: 11 }}>—</span>
                          : <span className="mono" style={{ color: 'var(--brand-700)', fontWeight: 700, fontSize: 11 }}>{granted.length}/{m.perms.length}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
