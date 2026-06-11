import { useState, useEffect, Fragment } from 'react';
import I from '../components/Icons.jsx';
import { Bi, RoutePill, Modal, Drawer } from '../components/Shell.jsx';

function SettingsCard({ title, sub, children, actions }) {
  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>{title}</div>
          {sub && <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 3 }}>{sub}</div>}
        </div>
        {actions}
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

function ToggleRow({ label, sub, checked, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-soft)' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)' }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: 'var(--ink-400)', marginTop: 2 }}>{sub}</div>}
      </div>
      <label style={{ position: 'relative', width: 40, height: 22, cursor: 'pointer', flexShrink: 0 }}>
        <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0 }} />
        <span style={{
          position: 'absolute', inset: 0, borderRadius: 999,
          background: checked ? 'var(--brand-500)' : 'var(--ink-200)',
          transition: '.2s',
        }}>
          <span style={{
            position: 'absolute', top: 3, left: checked ? 21 : 3,
            width: 16, height: 16, borderRadius: 999,
            background: 'white', transition: '.2s',
            boxShadow: '0 1px 2px rgba(0,0,0,.2)',
          }} />
        </span>
      </label>
    </div>
  );
}

/* ── Entreprise ──────────────────────────────────────────── */
function SectionCompany() {
  const [fields, setFields] = useState({
    company_name:    'Jumla Shipping',
    company_legal:   'Jumla Shipping SARL',
    phone_douala:    '',
    phone_montreal:  '',
    warehouse_addr:  '5500 Place de la Savane, Lachine, QC H4S 1V8, Canada',
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      setFields(f => ({
        company_name:   d.company_name   ?? f.company_name,
        company_legal:  d.company_legal  ?? f.company_legal,
        phone_douala:   d.phone_douala   ?? f.phone_douala,
        phone_montreal: d.phone_montreal ?? f.phone_montreal,
        warehouse_addr: d.warehouse_addr ?? f.warehouse_addr,
      }));
    }).catch(() => {});
  }, []);

  const set = (k) => (e) => setFields(f => ({ ...f, [k]: e.target.value }));

  async function handleSave() {
    setSaving(true);
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  return (
    <>
      <SettingsCard title="Identité de l'entreprise" sub="Ces informations apparaissent sur vos bordereaux et messages clients.">
        <div className="field-row field-row--2">
          <div className="field"><label className="label">Nom commercial</label><input className="input" value={fields.company_name} onChange={set('company_name')} /></div>
          <div className="field"><label className="label">Raison sociale</label><input className="input" value={fields.company_legal} onChange={set('company_legal')} /></div>
        </div>
        <div className="field-row field-row--2">
          <div className="field"><label className="label">Téléphone Douala</label><input className="input mono" value={fields.phone_douala} onChange={set('phone_douala')} placeholder="+237 6** ** ** **" /></div>
          <div className="field"><label className="label">Téléphone Montréal</label><input className="input mono" value={fields.phone_montreal} onChange={set('phone_montreal')} placeholder="+1 514 *** ****" /></div>
        </div>
        <div className="field">
          <label className="label">Adresse entrepôt arrivée</label>
          <input className="input" value={fields.warehouse_addr} onChange={set('warehouse_addr')} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center', marginTop: 4 }}>
          {saved && <span style={{ fontSize: 12, color: 'var(--ok-700)', fontWeight: 600 }}>✓ Sauvegardé</span>}
          <button className="btn btn--brand btn--sm" disabled={saving} onClick={handleSave}><I.Check />{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </SettingsCard>
      <SettingsCard title="Apparence & marque" sub="Logo, couleurs et pied de page des documents.">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', background: 'var(--bg-soft)', borderRadius: 8 }}>
          <div style={{ width: 60, height: 60, borderRadius: 12, background: 'linear-gradient(135deg, #F5A524, #D97706)', color: 'white', display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 700 }}>J</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Logo actuel</div>
            <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>PNG/SVG · max 2 Mo · fond transparent recommandé</div>
          </div>
          <button className="btn btn--ghost btn--sm"><I.Upload />Changer le logo</button>
        </div>
      </SettingsCard>
    </>
  );
}

/* ── Routes ──────────────────────────────────────────────── */
function MigrationBanner() {
  const [status, setStatus] = useState('idle'); // idle | running | done | error
  const run = async () => {
    setStatus('running');
    try {
      const res = await fetch('/api/_migrate');
      const d   = await res.json();
      setStatus(d.ok ? 'done' : 'error');
      if (d.ok) setTimeout(() => window.location.reload(), 800);
    } catch { setStatus('error'); }
  };
  if (status === 'done') return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px', background: 'var(--ok-50)', border: '1px solid var(--ok-100)', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
      <span style={{ color: 'var(--ok-600)', fontWeight: 700 }}>✓ Migration réussie — rechargement…</span>
    </div>
  );
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', background: 'var(--warn-50)', border: '1px solid var(--warn-200)', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
      <span style={{ fontSize: 18 }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: 'var(--warn-800)', marginBottom: 2 }}>Migration de base de données requise</div>
        <div style={{ color: 'var(--warn-700)', fontSize: 12 }}>
          Les colonnes <code style={{ fontFamily: 'var(--ff-mono)', background: 'var(--warn-100)', padding: '1px 5px', borderRadius: 4 }}>fees</code>, <code style={{ fontFamily: 'var(--ff-mono)', background: 'var(--warn-100)', padding: '1px 5px', borderRadius: 4 }}>transitDays</code> et <code style={{ fontFamily: 'var(--ff-mono)', background: 'var(--warn-100)', padding: '1px 5px', borderRadius: 4 }}>currency</code> n'existent pas encore en base. La grille tarifaire ne peut pas être sauvegardée.
        </div>
      </div>
      <button className="btn btn--warn btn--sm" onClick={run} disabled={status === 'running'}>
        {status === 'running' ? 'En cours…' : '⚡ Lancer la migration'}
      </button>
    </div>
  );
}

function SectionRoutes({ routes, onEdit, onDetail }) {
  return (
    <SettingsCard
      title="Routes commerciales"
      sub="Définissez les trajets que vous opérez. Chaque cargaison est rattachée à une route."
      actions={<button className="btn btn--brand btn--sm" onClick={() => onEdit('new')}><I.Plus />Nouvelle route</button>}>
      <div style={{ display: 'grid', gap: 10 }}>
        {routes.length === 0 && (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--ink-400)', fontSize: 13 }}>
            Aucune route configurée. Créez votre première route pour commencer.
          </div>
        )}
        {routes.map(r => (
          <div key={r.id} className="card" style={{ padding: 16, cursor: 'pointer', borderColor: r.active ? 'var(--border)' : 'var(--border-soft)' }} onClick={() => onDetail(r)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: r.active ? 'var(--brand-50)' : 'var(--bg-soft)', color: r.active ? 'var(--brand-700)' : 'var(--ink-400)', display: 'grid', placeItems: 'center' }}>
                  <I.Plane style={{ width: 20, height: 20 }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{r.label || r.code}</span>
                    <RoutePill from={r.fromIATA} to={r.toIATA} />
                    {r.active
                      ? <span className="badge badge--dot badge--ok">Active</span>
                      : <span className="badge badge--dot badge--neutral">Archivée</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>
                    Transit {r.transitDays ?? 14} j · {r.currency ?? 'CAD'}
                    {r.fees?.tiers?.length > 0 && ` · ${r.fees.tiers.length} tranche${r.fees.tiers.length > 1 ? 's' : ''} tarifaire${r.fees.tiers.length > 1 ? 's' : ''}`}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <button className="btn btn--ghost btn--sm" onClick={e => { e.stopPropagation(); onEdit(r); }}><I.Edit />Modifier</button>
                <I.ChevronRight style={{ color: 'var(--ink-300)' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </SettingsCard>
  );
}

function SectionPricing({ routes }) {
  return (
    <SettingsCard title="Grille tarifaire" sub="Résumé de la tarification par route active.">
      {routes.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--ink-400)', fontSize: 13 }}>
          Configurez vos routes d'abord pour définir les tarifs.
        </div>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ borderRadius: 0 }}>Route</th>
              <th style={{ borderRadius: 0 }}>Devise</th>
              <th style={{ borderRadius: 0 }}>Transit</th>
              <th style={{ borderRadius: 0 }}>Tarification</th>
            </tr>
          </thead>
          <tbody>
            {routes.filter(r => r.active).map(r => (
              <tr key={r.id}>
                <td>
                  <RoutePill from={r.fromIATA} to={r.toIATA} />
                  <span style={{ marginLeft: 8, fontSize: 12.5, fontWeight: 600 }}>{r.label || r.code}</span>
                </td>
                <td className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>{r.currency ?? 'CAD'}</td>
                <td style={{ fontSize: 12.5 }}>{r.transitDays ?? 14} jours</td>
                <td>
                  {r.fees?.tiers?.length > 0
                    ? <span style={{ fontSize: 12, color: 'var(--ok-700)', fontWeight: 600 }}>✓ {r.fees.tiers.length} tranche{r.fees.tiers.length > 1 ? 's' : ''}</span>
                    : <span style={{ fontSize: 12, color: 'var(--ink-400)', fontStyle: 'italic' }}>À configurer</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </SettingsCard>
  );
}

/* ── WhatsApp ─────────────────────────────────────────────── */
function SectionWhatsapp() {
  const [status,     setStatus]     = useState(null);
  const [accountSid, setAccountSid] = useState('');
  const [authToken,  setAuthToken]  = useState('');
  const [fromNumber, setFromNumber] = useState('');
  const [showSid,    setShowSid]    = useState(false);
  const [showToken,  setShowToken]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [testing,    setTesting]    = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetch('/api/settings/whatsapp').then(r => r.json()).then(d => {
      setStatus(d);
      setAccountSid(d.accountSid ?? '');
      setAuthToken(d.authToken ?? '');
      setFromNumber(d.fromNumber ?? '');
    }).catch(() => {});
  }, []);

  async function handleTest() {
    setTesting(true); setTestResult(null);
    const res = await fetch('/api/messaging/test').catch(() => null);
    const data = res ? await res.json() : { ok: false, error: 'Erreur réseau' };
    setTestResult(data); setTesting(false);
    if (data.ok) {
      const s = await fetch('/api/settings/whatsapp').then(r => r.json()).catch(() => null);
      if (s) setStatus(s);
    }
  }

  async function handleSave() {
    setSaving(true); setSaved(false); setTestResult(null);
    await fetch('/api/settings/whatsapp', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountSid, authToken, fromNumber }),
    });
    const updated = await fetch('/api/settings/whatsapp').then(r => r.json()).catch(() => null);
    if (updated) { setStatus(updated); setAccountSid(updated.accountSid); setAuthToken(updated.authToken); setFromNumber(updated.fromNumber); }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  const configured = status?.configured;

  return (
    <SettingsCard title="Connexion API Twilio" sub="Connectez votre compte Twilio pour l'envoi de messages WhatsApp.">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: configured ? 'var(--ok-50)' : 'var(--bg-soft)', border: '1px solid ' + (configured ? 'var(--ok-100)' : 'var(--border)'), borderRadius: 8, marginBottom: 16 }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: configured ? 'var(--ok-500)' : 'var(--ink-300)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: configured ? 'var(--ok-700)' : 'var(--ink-600)' }}>
            {configured ? 'API connectée · opérationnelle' : 'Non configuré — renseignez vos identifiants Twilio ci-dessous'}
          </div>
          {configured && <div style={{ fontSize: 12, color: 'var(--ok-600)', marginTop: 2 }}>Twilio · {status.fromNumber}</div>}
        </div>
      </div>
      <div className="field-row field-row--2">
        <div className="field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <label className="label" style={{ margin: 0 }}>Account SID</label>
            {accountSid && <button type="button" className="btn btn--ghost btn--xs" onClick={() => setAccountSid('')}>Effacer</button>}
          </div>
          <div style={{ position: 'relative' }}>
            <input className="input mono" type={showSid ? 'text' : 'password'} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={accountSid} onChange={e => setAccountSid(e.target.value)} style={{ paddingRight: 36 }} />
            <button type="button" onClick={() => setShowSid(v => !v)}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-400)', display: 'flex', alignItems: 'center', padding: 2 }}>
              {showSid ? <I.EyeOff style={{ width: 16, height: 16 }} /> : <I.Eye style={{ width: 16, height: 16 }} />}
            </button>
          </div>
        </div>
        <div className="field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <label className="label" style={{ margin: 0 }}>Auth Token</label>
            {authToken && <button type="button" className="btn btn--ghost btn--xs" onClick={() => setAuthToken('')}>Effacer</button>}
          </div>
          <div style={{ position: 'relative' }}>
            <input className="input mono" type={showToken ? 'text' : 'password'} placeholder="Auth token Twilio"
              value={authToken} onChange={e => setAuthToken(e.target.value)} style={{ paddingRight: 36 }} />
            <button type="button" onClick={() => setShowToken(v => !v)}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-400)', display: 'flex', alignItems: 'center', padding: 2 }}>
              {showToken ? <I.EyeOff style={{ width: 16, height: 16 }} /> : <I.Eye style={{ width: 16, height: 16 }} />}
            </button>
          </div>
        </div>
      </div>
      <div className="field" style={{ marginBottom: 8 }}>
        <label className="label">Numéro expéditeur WhatsApp</label>
        <input className="input mono" placeholder="+14155238886" value={fromNumber} onChange={e => setFromNumber(e.target.value)} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-500)', background: 'var(--info-50)', border: '1px solid var(--info-100)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, lineHeight: 1.6 }}>
        <strong>Sandbox Twilio (phase de test) :</strong> le numéro est toujours <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>+14155238886</span>.<br />
        Trouve-le dans <strong>Twilio Console → Messaging → Try it out → Send a WhatsApp message</strong>.<br />
        ⚠️ Chaque destinataire doit d'abord envoyer le mot-clé du sandbox à ce numéro avant de recevoir tes messages.<br />
        <strong>Production :</strong> enregistre un numéro WhatsApp Business dans <strong>Messaging → Senders → WhatsApp Senders</strong>.
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn--brand btn--sm" disabled={saving} onClick={handleSave}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button className="btn btn--ghost btn--sm" disabled={testing} onClick={handleTest}>
          {testing ? 'Test en cours…' : '⚡ Tester la connexion'}
        </button>
        {saved && <span style={{ fontSize: 12, color: 'var(--ok-700)', fontWeight: 600 }}>✓ Sauvegardé</span>}
      </div>
      {testResult && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: testResult.ok ? 'var(--ok-50)' : 'var(--bad-50)', border: '1px solid ' + (testResult.ok ? 'var(--ok-200)' : 'var(--bad-200)') }}>
          {testResult.ok ? (
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ok-700)' }}>
              ✓ Connexion réussie — compte : <span style={{ fontFamily: 'monospace' }}>{testResult.accountName}</span> ({testResult.status})
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--bad-700)', marginBottom: 6 }}>
                ✕ Échec — code {testResult.code} : {testResult.error}
              </div>
              {(testResult.sidPreview || testResult.tokenPreview) && (
                <div style={{ fontSize: 11.5, fontFamily: 'monospace', color: 'var(--ink-600)', marginBottom: 8, background: 'white', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--bad-100)' }}>
                  <div>SID stocké&nbsp;&nbsp;: <strong>{testResult.sidPreview}</strong></div>
                  <div>Token stocké : <strong>{testResult.tokenPreview}</strong></div>
                </div>
              )}
              <div style={{ fontSize: 12, color: 'var(--ink-600)', lineHeight: 1.6 }}>
                Vérifiez que ces valeurs correspondent à <strong>Twilio Console → Account → Account Info</strong>.
              </div>
            </>
          )}
        </div>
      )}
    </SettingsCard>
  );
}

/* ── Auto-notifications ──────────────────────────────────── */
function SectionAutoNotif() {
  const DEFAULTS = { notif_arrival: true, notif_reminder: true, notif_delivery: true, notif_overrun: false, notif_invoice: true, notif_broadcast: false };
  const [toggles, setToggles] = useState(DEFAULTS);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      const loaded = {};
      for (const k of Object.keys(DEFAULTS)) {
        if (d[k] !== undefined) loaded[k] = d[k] === 'true';
      }
      setToggles(t => ({ ...t, ...loaded }));
    }).catch(() => {});
  }, []);

  const toggle = async (k) => {
    const next = { ...toggles, [k]: !toggles[k] };
    setToggles(next);
    const payload = {};
    for (const [key, val] of Object.entries(next)) payload[key] = String(val);
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  };

  const triggers = [
    { id: 'notif_arrival',   l: "Avis d'arrivée",             d: 'Envoyé automatiquement quand la cargaison passe à "Arrivée"' },
    { id: 'notif_reminder',  l: 'Relance paiement J+3',        d: "Envoyé 3 jours après l'arrivée si paiement non confirmé" },
    { id: 'notif_delivery',  l: 'Confirmation de livraison',   d: 'Envoyé à la validation du bordereau et libération du colis' },
    { id: 'notif_overrun',   l: 'Alerte dépassement de poids', d: "Envoyé à l'expéditeur si le poids réel > poids réservé" },
    { id: 'notif_invoice',   l: 'Facture automatique',         d: 'Envoyée au destinataire à la création du colis' },
    { id: 'notif_broadcast', l: 'Annonce nouvelle cargaison',  d: "Notifie les clients fidèles à l'ouverture d'une cargaison" },
  ];

  return (
    <SettingsCard title="Notifications automatiques" sub="Activez ou désactivez chaque déclencheur. Les modèles sont gérés dans la Messagerie.">
      <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
        {triggers.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.l}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>{t.d}</div>
            </div>
            <span style={{ fontSize: 11, color: toggles[t.id] ? 'var(--ok-700)' : 'var(--ink-400)', fontWeight: 600, minWidth: 60, textAlign: 'right' }}>
              {toggles[t.id] ? 'Activé' : 'Désactivé'}
            </span>
            <button onClick={() => toggle(t.id)} style={{
              width: 36, height: 20, borderRadius: 999,
              background: toggles[t.id] ? 'var(--brand-500)' : 'var(--ink-200)',
              border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .15s', flexShrink: 0,
            }}>
              <span style={{ position: 'absolute', left: toggles[t.id] ? 18 : 2, top: 2, width: 16, height: 16, borderRadius: 999, background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .15s' }} />
            </button>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: 'var(--warn-700)', background: 'var(--warn-50)', border: '1px solid var(--warn-100)', borderRadius: 8, padding: '10px 14px' }}>
        ⚠️ Les envois automatiques nécessitent que l'API WhatsApp soit configurée dans l'onglet <strong>WhatsApp</strong>.
      </div>
    </SettingsCard>
  );
}

/* ── Paramètres cargaisons ───────────────────────────────── */
function SectionCampaigns() {
  const [fields, setFields] = useState({ default_transit_days: '14', default_currency: 'CAD', weight_rounding: '0.5' });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      setFields(f => ({
        default_transit_days: d.default_transit_days ?? f.default_transit_days,
        default_currency:     d.default_currency     ?? f.default_currency,
        weight_rounding:      d.weight_rounding      ?? f.weight_rounding,
      }));
    }).catch(() => {});
  }, []);

  const set = (k) => (e) => setFields(f => ({ ...f, [k]: e.target.value }));

  async function handleSave() {
    setSaving(true);
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  return (
    <SettingsCard title="Paramètres des cargaisons" sub="Valeurs par défaut appliquées à la création d'une cargaison.">
      <div className="field-row field-row--2">
        <div className="field">
          <label className="label">Durée de transit par défaut</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input className="input" value={fields.default_transit_days} onChange={set('default_transit_days')} type="number" min="1" style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: 'var(--ink-400)', whiteSpace: 'nowrap' }}>jours</span>
          </div>
        </div>
        <div className="field">
          <label className="label">Devise par défaut</label>
          <select className="select" value={fields.default_currency} onChange={set('default_currency')}>
            <option value="CAD">CAD</option><option value="EUR">EUR</option>
            <option value="USD">USD</option><option value="XAF">XAF</option>
          </select>
        </div>
      </div>
      <div className="field-row field-row--2">
        <div className="field">
          <label className="label">Arrondi poids facturé</label>
          <select className="select" value={fields.weight_rounding} onChange={set('weight_rounding')}>
            <option value="0.5">0,5 kg</option><option value="1">1 kg</option><option value="exact">Exact</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center', marginTop: 4 }}>
        {saved && <span style={{ fontSize: 12, color: 'var(--ok-700)', fontWeight: 600 }}>✓ Sauvegardé</span>}
        <button className="btn btn--brand btn--sm" disabled={saving} onClick={handleSave}><I.Check />{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
      </div>
    </SettingsCard>
  );
}

/* ── Codes & numérotation ────────────────────────────────── */
function SectionCodes() {
  const DEFAULTS = {
    code_campaign: '{ORIG}-{DEST}-{MMM}-{NN}',
    code_parcel:   'P-{NNNN}',
    code_slip:     'BL-{YYMM}-{NN}',
    code_client:   'CL-{NNNN}',
  };
  const EXAMPLES = {
    code_campaign: 'DLA-YUL-APR-02',
    code_parcel:   'P-0142',
    code_slip:     'BL-2604-01',
    code_client:   'CL-0418',
  };
  const LABELS = {
    code_campaign: 'Code cargaison',
    code_parcel:   'Code colis',
    code_slip:     'Code bordereau',
    code_client:   'Code client',
  };

  const [fields, setFields] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      const loaded = {};
      for (const k of Object.keys(DEFAULTS)) {
        if (d[k]) loaded[k] = d[k];
      }
      setFields(f => ({ ...f, ...loaded }));
    }).catch(() => {});
  }, []);

  const set = (k) => (e) => setFields(f => ({ ...f, [k]: e.target.value }));

  async function handleSave() {
    setSaving(true);
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  return (
    <SettingsCard title="Format des codes" sub="Personnalisez le format des codes générés automatiquement.">
      {Object.keys(DEFAULTS).map(k => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: '1px solid var(--border-soft)' }}>
          <span style={{ width: 140, fontSize: 13, fontWeight: 600, color: 'var(--ink-700)', flexShrink: 0 }}>{LABELS[k]}</span>
          <input className="input input--sm mono" value={fields[k]} onChange={set(k)} style={{ flex: 1 }} />
          <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-400)', padding: '2px 8px', background: 'var(--bg-soft)', borderRadius: 4, whiteSpace: 'nowrap' }}>→ {EXAMPLES[k]}</span>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center', marginTop: 14 }}>
        {saved && <span style={{ fontSize: 12, color: 'var(--ok-700)', fontWeight: 600 }}>✓ Sauvegardé</span>}
        <button className="btn btn--brand btn--sm" disabled={saving} onClick={handleSave}><I.Check />{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
      </div>
    </SettingsCard>
  );
}

/* ── Modal édition route ─────────────────────────────────── */
function RouteEditModal({ editRoute, onClose, onSaved }) {
  const isNew = editRoute === 'new';
  const r = isNew ? null : editRoute;
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');
  const [origin, setOrigin]           = useState(r?.fromIATA || '');
  const [destination, setDestination] = useState(r?.toIATA  || '');
  const [label, setLabel]             = useState(r?.label   || '');
  const [transitDays, setTransitDays] = useState(String(r?.transitDays ?? 14));
  const [currency, setCurrency]       = useState(r?.currency ?? 'CAD');
  const [active, setActive]           = useState(r?.active ?? true);

  const defaultBreakdown = () => [
    { id: 1, label: 'Frais de base',          amount: '50' },
    { id: 2, label: 'Frais de douane',         amount: '5'  },
    { id: 3, label: 'Carton / manutention',    amount: '1'  },
    { id: 4, label: "Formalités d'expédition", amount: '4'  },
    { id: 5, label: 'Frais de service',        amount: '5'  },
  ];

  const [tiers, setTiers] = useState(() => {
    if (r?.fees?.tiers?.length) {
      return r.fees.tiers.map((t, i) => ({ ...t, id: i + 1, expanded: false }));
    }
    return [{ id: 1, from: '0', to: '3', flat: '65', expanded: false, breakdown: defaultBreakdown() }];
  });

  const [deliveryFee,  setDeliveryFee]  = useState(String(r?.fees?.deliveryFee  ?? 25));
  const [bagSmall,     setBagSmall]     = useState(String(r?.fees?.bags?.small   ?? 3));
  const [bagMedium,    setBagMedium]    = useState(String(r?.fees?.bags?.medium  ?? 5));
  const [bagLarge,     setBagLarge]     = useState(String(r?.fees?.bags?.large   ?? 10));

  const toggleTier = id => setTiers(ts => ts.map(t => t.id === id ? { ...t, expanded: !t.expanded } : t));
  const delTier    = id => setTiers(ts => ts.filter(t => t.id !== id));
  const updTier    = (id, k, v) => setTiers(ts => ts.map(t => t.id === id ? { ...t, [k]: v } : t));
  const addTier    = () => setTiers(ts => [...ts, { id: Date.now(), from: '', to: '', flat: '', expanded: true, breakdown: [] }]);
  const addBRow    = tid => setTiers(ts => ts.map(t => t.id === tid ? { ...t, breakdown: [...t.breakdown, { id: Date.now(), label: '', amount: '' }] } : t));
  const delBRow    = (tid, rid) => setTiers(ts => ts.map(t => t.id === tid ? { ...t, breakdown: t.breakdown.filter(b => b.id !== rid) } : t));
  const updBRow    = (tid, rid, k, v) => setTiers(ts => ts.map(t => t.id === tid ? { ...t, breakdown: t.breakdown.map(b => b.id === rid ? { ...b, [k]: v } : b) } : t));

  const tierTotal = tier => tier.breakdown.length > 0
    ? tier.breakdown.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0)
    : parseFloat(tier.flat) || 0;

  const handleSave = async () => {
    if (!origin.trim() || !destination.trim()) { setErr('Codes IATA obligatoires'); return; }
    setSaving(true); setErr('');
    try {
      const fees = {
        tiers:       tiers.map(({ id: _id, expanded: _exp, ...t }) => t),
        deliveryFee: parseFloat(deliveryFee) || 0,
        bags:        { small: parseFloat(bagSmall) || 0, medium: parseFloat(bagMedium) || 0, large: parseFloat(bagLarge) || 0 },
      };
      const payload = {
        origin:      origin.toUpperCase().trim(),
        destination: destination.toUpperCase().trim(),
        label:       label.trim() || `${origin.toUpperCase()} → ${destination.toUpperCase()}`,
        transitDays: parseInt(transitDays) || 14,
        currency,
        active,
        fees,
      };
      const url    = isNew ? '/api/routes' : `/api/routes/${r.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json(); setErr(d.error || 'Erreur'); setSaving(false); return; }
      onSaved?.();
      onClose();
    } catch { setErr('Erreur réseau'); setSaving(false); }
  };

  return (
    <Modal width={740} onClose={onClose} title={isNew ? 'Nouvelle route' : `Modifier — ${r?.label ?? r?.code ?? ''}`}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-400)', marginBottom: 10 }}>Informations générales</div>
      {err && (
        err.includes('Migration requise') ? (
          <div style={{ padding: '12px 14px', background: 'var(--warn-50)', border: '1px solid var(--warn-200)', borderRadius: 8, marginBottom: 14 }}>
            <div style={{ fontWeight: 700, color: 'var(--warn-800)', fontSize: 13, marginBottom: 6 }}>⚠️ Migration de base de données requise</div>
            <div style={{ fontSize: 12, color: 'var(--warn-700)', marginBottom: 10 }}>
              Les colonnes de tarification n'existent pas encore. Lancez la migration puis réessayez.
            </div>
            <MigrationBanner />
          </div>
        ) : (
          <div style={{ padding: '8px 12px', background: 'var(--bad-50)', color: 'var(--bad-700)', borderRadius: 6, fontSize: 12.5, marginBottom: 12 }}>{err}</div>
        )
      )}
      <div className="field-row field-row--2">
        <div className="field"><label className="label">Code IATA départ</label><input className="input mono" value={origin} onChange={e => setOrigin(e.target.value.toUpperCase())} placeholder="DLA" maxLength={3} /></div>
        <div className="field"><label className="label">Code IATA arrivée</label><input className="input mono" value={destination} onChange={e => setDestination(e.target.value.toUpperCase())} placeholder="YUL" maxLength={3} /></div>
      </div>
      <div className="field">
        <label className="label">Libellé <span className="opt">/ optionnel</span></label>
        <input className="input" value={label} onChange={e => setLabel(e.target.value)} placeholder="ex: Douala → Montréal" />
      </div>
      <div className="field-row field-row--2">
        <div className="field">
          <label className="label">Transit (jours)</label>
          <input className="input" type="number" value={transitDays} onChange={e => setTransitDays(e.target.value)} min="1" />
        </div>
        <div className="field">
          <label className="label">Devise</label>
          <select className="select" value={currency} onChange={e => setCurrency(e.target.value)}>
            <option value="CAD">CAD</option><option value="EUR">EUR</option><option value="XAF">XAF</option>
          </select>
        </div>
      </div>
      {!isNew && (
        <div className="field-row field-row--2">
          <div className="field">
            <label className="label">Statut</label>
            <select className="select" value={active ? 'active' : 'archived'} onChange={e => setActive(e.target.value === 'active')}>
              <option value="active">Active</option><option value="archived">Archivée</option>
            </select>
          </div>
        </div>
      )}

      {/* Grille tarifaire */}
      <div style={{ borderTop: '1px solid var(--border-soft)', margin: '18px 0 14px', paddingTop: 18 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-400)', marginBottom: 14 }}>Grille tarifaire</div>
        <table className="tbl" style={{ marginBottom: 0 }}>
          <thead>
            <tr>
              <th style={{ width: 90 }}>De (kg)</th>
              <th style={{ width: 90 }}>À (kg)</th>
              <th>Forfait ({currency})</th>
              <th style={{ textAlign: 'right', width: 130 }}>Total calculé</th>
              <th style={{ textAlign: 'center', width: 100 }}>Détail</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {tiers.map(tier => (
              <Fragment key={tier.id}>
                <tr>
                  <td><input className="input input--sm mono" type="number" value={tier.from} onChange={e => updTier(tier.id, 'from', e.target.value)} style={{ width: 60 }} /></td>
                  <td><input className="input input--sm mono" type="number" value={tier.to} onChange={e => updTier(tier.id, 'to', e.target.value)} style={{ width: 60 }} /></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input className="input input--sm mono" type="number" value={tier.flat} onChange={e => updTier(tier.id, 'flat', e.target.value)} style={{ width: 80 }} />
                      <span style={{ fontSize: 11.5, color: 'var(--ink-400)' }}>{currency}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="mono" style={{ fontWeight: 700, color: tierTotal(tier) > 0 ? 'var(--ok-600)' : 'var(--ink-300)' }}>{tierTotal(tier)} {currency}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn btn--ghost btn--sm" onClick={() => toggleTier(tier.id)} style={{ fontSize: 11.5, padding: '3px 8px' }}>
                      {tier.expanded ? '▴ Masquer' : '▾ Voir'}
                    </button>
                  </td>
                  <td>
                    <button className="icon-btn" onClick={() => delTier(tier.id)} disabled={tiers.length === 1} style={{ color: tiers.length === 1 ? 'var(--ink-200)' : 'var(--bad-400)' }}>
                      <I.Trash />
                    </button>
                  </td>
                </tr>
                {tier.expanded && (
                  <tr>
                    <td colSpan={6} style={{ padding: '8px 0 12px 24px', background: 'var(--bg-soft)' }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-500)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                        Composition — {tier.from}–{tier.to} kg
                      </div>
                      <table className="tbl" style={{ marginBottom: 0, background: 'white' }}>
                        <thead>
                          <tr>
                            <th style={{ borderRadius: 0 }}>Libellé du frais</th>
                            <th style={{ textAlign: 'right', width: 130 }}>Montant ({currency})</th>
                            <th style={{ width: 40, borderRadius: 0 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {tier.breakdown.length === 0 && (
                            <tr><td colSpan={3} style={{ fontSize: 12, color: 'var(--ink-400)', textAlign: 'center', padding: '10px 0' }}>Cliquez « + Ajouter » pour décomposer ce forfait.</td></tr>
                          )}
                          {tier.breakdown.map(row => (
                            <tr key={row.id}>
                              <td>
                                <input className="input input--sm" value={row.label} onChange={e => updBRow(tier.id, row.id, 'label', e.target.value)} placeholder="Libellé…" style={{ border: 'none', background: 'transparent', width: '100%' }} />
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <input className="input input--sm mono" type="number" value={row.amount} onChange={e => updBRow(tier.id, row.id, 'amount', e.target.value)} style={{ width: 80, textAlign: 'right' }} />
                              </td>
                              <td>
                                <button className="icon-btn" onClick={() => delBRow(tier.id, row.id)} style={{ color: 'var(--bad-400)' }}><I.Trash /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', border: '1px solid var(--border)', borderTop: 'none', background: 'white' }}>
                        <button className="btn btn--ghost btn--sm" onClick={() => addBRow(tier.id)}><I.Plus />Ajouter une ligne</button>
                        {tier.breakdown.length > 0 && (
                          <div style={{ fontSize: 12, fontWeight: 700 }}>
                            Total :&nbsp;<span className="mono" style={{ color: 'var(--ok-600)' }}>{tier.breakdown.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0)} {currency}</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        <button className="btn btn--ghost btn--sm" style={{ marginTop: 8 }} onClick={addTier}><I.Plus />Ajouter une tranche</button>

        <div style={{ marginTop: 20 }}>
          <div className="field-row field-row--2">
            <div className="field">
              <label className="label">Livraison Grand Montréal</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input className="input mono" type="number" value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} style={{ flex: 1 }} />
                <span style={{ fontSize: 12, color: 'var(--ink-400)', whiteSpace: 'nowrap' }}>{currency}</span>
              </div>
            </div>
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 8 }}>Prix des sacs</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { label: 'Petit sac',  val: bagSmall,  set: setBagSmall  },
              { label: 'Moyen sac', val: bagMedium, set: setBagMedium },
              { label: 'Grand sac', val: bagLarge,  set: setBagLarge  },
            ].map(s => (
              <div key={s.label} className="field" style={{ marginBottom: 0 }}>
                <label className="label">{s.label}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input className="input mono" type="number" value={s.val} onChange={e => s.set(e.target.value)} style={{ flex: 1 }} />
                  <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>{currency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        <button className="btn btn--ghost" onClick={onClose}>Annuler</button>
        <button className="btn btn--brand" onClick={handleSave} disabled={saving}><I.Check />{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
      </div>
    </Modal>
  );
}

/* ── Main screen ──────────────────────────────────────────── */
export default function SettingsScreen({ onNav }) {
  const initialTab = typeof window !== 'undefined'
    ? (new URLSearchParams(window.location.search).get('tab') ?? 'company')
    : 'company';
  const [section, setSection]         = useState(initialTab);
  const [editRoute, setEditRoute]     = useState(null);
  const [routeDetail, setRouteDetail] = useState(null);
  const [routes, setRoutes]           = useState([]);

  const loadRoutes = () =>
    fetch('/api/routes').then(r => r.json()).then(data => setRoutes(Array.isArray(data) ? data : [])).catch(() => {});

  useEffect(() => { loadRoutes(); }, []);

  const nav = [
    { id: 'company',   l: 'Entreprise',         icon: I.Building },
    { id: 'routes',    l: 'Routes & tarifs',    icon: I.Route },
    { id: 'whatsapp',  l: 'WhatsApp',           icon: I.Chat },
    { id: 'auto',      l: 'Auto-notifications', icon: I.Bell, badge: 'Nouveau' },
    { id: 'campaigns', l: 'Cargaisons',         icon: I.Plane },
    { id: 'codes',     l: 'Codes & numérotation', icon: I.Tag },
  ];

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__title"><Bi fr="Paramètres" en="Settings" /></div>
          <div className="page__sub">Configurez votre entreprise, vos routes, vos tarifs et vos automatisations</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 18 }}>
        {/* Side nav */}
        <div className="card" style={{ padding: 8, height: 'fit-content', position: 'sticky', top: 76 }}>
          {nav.map(n => {
            const Ic = n.icon;
            return (
              <a key={n.id} onClick={() => setSection(n.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
                background: section === n.id ? 'var(--brand-50)' : 'transparent',
                color: section === n.id ? 'var(--brand-700)' : 'var(--ink-600)',
                fontWeight: section === n.id ? 600 : 500,
                fontSize: 13, marginBottom: 2,
              }}>
                <Ic style={{ width: 15, height: 15, opacity: .85 }} />
                <span style={{ flex: 1 }}>{n.l}</span>
                {n.badge && <span style={{ fontSize: 9.5, padding: '1px 6px', borderRadius: 999, background: 'var(--brand-500)', color: 'white', fontWeight: 700 }}>{n.badge}</span>}
              </a>
            );
          })}
        </div>

        {/* Content */}
        <div>
          {section === 'company'   && <SectionCompany />}
          {section === 'routes'    && (
            <>
              <SectionRoutes routes={routes} onEdit={setEditRoute} onDetail={setRouteDetail} />
              <SectionPricing routes={routes} />
            </>
          )}
          {section === 'whatsapp'  && <SectionWhatsapp />}
          {section === 'auto'      && <SectionAutoNotif />}
          {section === 'campaigns' && <SectionCampaigns />}
          {section === 'codes'     && <SectionCodes />}
        </div>
      </div>

      {editRoute && (
        <RouteEditModal
          editRoute={editRoute}
          onClose={() => setEditRoute(null)}
          onSaved={loadRoutes}
        />
      )}

      {routeDetail && (
        <Drawer onClose={() => setRouteDetail(null)}>
          <div className="drawer__head">
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{routeDetail.label || routeDetail.code}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 4, display: 'flex', gap: 8 }}>
                <RoutePill from={routeDetail.fromIATA} to={routeDetail.toIATA} />
                <span>{routeDetail.active ? '✓ Active' : 'Archivée'}</span>
                <span>· Transit {routeDetail.transitDays ?? 14} j · {routeDetail.currency ?? 'CAD'}</span>
              </div>
            </div>
            <button className="btn btn--ghost btn--sm" onClick={() => { setRouteDetail(null); setEditRoute(routeDetail); }}><I.Edit />Modifier</button>
          </div>
          <div className="drawer__body" style={{ padding: 22 }}>
            {routeDetail.fees?.tiers?.length > 0 ? (
              <>
                <div className="section-title">Grille tarifaire</div>
                <table className="tbl" style={{ marginBottom: 16 }}>
                  <thead>
                    <tr>
                      <th>Tranche</th>
                      <th style={{ textAlign: 'right' }}>Forfait</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routeDetail.fees.tiers.map((t, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: 12.5 }}>{t.from} – {t.to} kg</td>
                        <td className="mono" style={{ textAlign: 'right', fontWeight: 700 }}>{t.flat} {routeDetail.currency ?? 'CAD'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {routeDetail.fees.deliveryFee > 0 && (
                  <div style={{ fontSize: 12.5, color: 'var(--ink-600)', marginBottom: 8 }}>
                    Livraison Grand Montréal : <strong>{routeDetail.fees.deliveryFee} {routeDetail.currency ?? 'CAD'}</strong>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="section-title">Grille tarifaire</div>
                <p style={{ fontSize: 12, color: 'var(--ink-400)' }}>Aucune tarification configurée.</p>
              </>
            )}
          </div>
        </Drawer>
      )}
    </div>
  );
}
