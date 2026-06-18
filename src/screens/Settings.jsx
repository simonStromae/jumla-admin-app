import { useState, useEffect, Fragment } from 'react';
import I from '../components/Icons.jsx';
import { Bi, RoutePill, Modal, Drawer } from '../components/Shell.jsx';

// Grille tarifaire par défaut (miroir de DEFAULT_ROUTE_FEES dans pricing.ts)
const DEFAULT_TIERS = [
  { from: 0.5,  to: 3,     transportFlat: 50,  cartonFlat: 1,    manutentionFlat: 4,                   douaneFlat: 5,    formalitesFlat: 5 },
  { from: 3.5,  to: 9.5,   transportPerKg: 13, cartonPerUnit: 1.5, manutentionFlat: 5,                 douanePerKg: 3,   formalitesPerKg: 2 },
  { from: 10,   to: 22.5,  transportPerKg: 12, cartonPerUnit: 1.5, manutentionFlat: 10,                douanePerKg: 3,   formalitesPerKg: 2 },
  { from: 23.5, to: 69.5,  transportPerKg: 11, cartonPerUnit: 1.5, manutentionFlat: 15,                douanePerKg: 2,   formalitesPerKg: 1.5 },
  { from: 70,   to: 115,   transportPerKg: 10, cartonPerUnit: 1.5, manutentionPerUnit: 5,  manutentionMin: 20, douanePerKg: 2.5, formalitesPerKg: 1 },
  { from: 115.5,to: 199.5, transportPerKg: 9,  cartonPerUnit: 1.5, manutentionPerUnit: 4.5,manutentionMin: 27, douanePerKg: 1.5, formalitesPerKg: 1 },
  { from: 200,  to: 250,   transportPerKg: 8,  cartonPerUnit: 1.5, manutentionPerUnit: 4,  manutentionMin: 40, douanePerKg: 1.5, formalitesPerKg: 1 },
  { from: 250.5,to: 99999, transportPerKg: 7.5, cartonPerUnit: 1.5, manutentionPerUnit: 3, manutentionMin: 60, douanePerKg: 1.5, formalitesPerKg: 1 },
];
const DEFAULT_FEES_META = {
  bags: { small: 5, medium: 7.5, large: 10 },
  saq:  { casier24x65: 24.50, casier24x33: 35.83, casier12x50: 21.34 },
  supplements: { vetements: 2, cosmetique: 3, biere: 6, electronique: 5, documents: -2 },
  marginPct: 30,
  deliveryFee: 25,
};

function fmtTransport(t) {
  if (t.transportFlat  !== undefined) return `${t.transportFlat} $ (forfait)`;
  if (t.transportPerKg !== undefined) return `${t.transportPerKg} $/kg`;
  return '—';
}
function fmtManut(t) {
  if (t.manutentionFlat !== undefined) return `${t.manutentionFlat} $ (forfait)`;
  if (t.manutentionPerUnit !== undefined) return `${t.manutentionPerUnit} $/unité · min ${t.manutentionMin ?? 0} $`;
  return '—';
}
function fmtRate(flat, perKg) {
  if (flat   !== undefined) return `${flat} $ (forfait)`;
  if (perKg  !== undefined) return `${perKg} $/kg`;
  return '—';
}

function TarifGrid({ tiers, fees, currency = 'CAD', isDefault = false }) {
  const cur = currency;
  return (
    <div>
      {isDefault && (
        <div style={{ fontSize: 11.5, color: 'var(--ink-400)', background: 'var(--bg-soft)', padding: '6px 10px', borderRadius: 6, marginBottom: 12, fontStyle: 'italic' }}>
          Grille par défaut — aucune personnalisation configurée pour cette route
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table className="tbl" style={{ marginBottom: 12, fontSize: 12 }}>
          <thead>
            <tr>
              <th>Tranche</th>
              <th>Transport</th>
              <th>Manutention</th>
              <th>Douane/Term.</th>
              <th>Formalités</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((t, i) => (
              <tr key={i}>
                <td className="mono" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {t.to >= 99999 ? `> ${t.from} kg` : `${t.from} – ${t.to} kg`}
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>{fmtTransport(t)}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{fmtManut(t)}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{fmtRate(t.douaneFlat, t.douanePerKg)}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{fmtRate(t.formalitesFlat, t.formalitesPerKg)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
        <div style={{ background: 'var(--bg-soft)', borderRadius: 6, padding: '10px 12px' }}>
          <div style={{ fontWeight: 700, color: 'var(--ink-600)', marginBottom: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>Emballages</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, color: 'var(--ink-700)' }}>
            <span>Carton : <strong>1,50 {cur}/carton</strong></span>
            <span>Petit sac : <strong>{fees.bags?.small ?? 5} {cur}</strong></span>
            <span>Moyen sac : <strong>{fees.bags?.medium ?? 7.5} {cur}</strong></span>
            <span>Grand sac : <strong>{fees.bags?.large ?? 10} {cur}</strong></span>
          </div>
        </div>
        <div style={{ background: 'var(--bg-soft)', borderRadius: 6, padding: '10px 12px' }}>
          <div style={{ fontWeight: 700, color: 'var(--ink-600)', marginBottom: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>Frais SAQ (bière)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, color: 'var(--ink-700)' }}>
            <span>Casier 24×65cl : <strong>{fees.saq?.casier24x65 ?? 24.5} {cur}</strong></span>
            <span>Casier 24×33cl : <strong>{fees.saq?.casier24x33 ?? 35.83} {cur}</strong></span>
            <span>Casier 12×50cl : <strong>{fees.saq?.casier12x50 ?? 21.34} {cur}</strong></span>
          </div>
        </div>
        <div style={{ background: 'var(--bg-soft)', borderRadius: 6, padding: '10px 12px' }}>
          <div style={{ fontWeight: 700, color: 'var(--ink-600)', marginBottom: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>Suppléments catégorie</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, color: 'var(--ink-700)' }}>
            <span>Vêtements : <strong>+{fees.supplements?.vetements ?? 2} {cur}/kg</strong></span>
            <span>Cosmétiques : <strong>+{fees.supplements?.cosmetique ?? 3} {cur}/kg</strong></span>
            <span>Bière : <strong>+{fees.supplements?.biere ?? 6} {cur}/kg</strong></span>
            <span>Électronique : <strong>+{fees.supplements?.electronique ?? 5} {cur}/kg</strong></span>
            <span>Documents : <strong>{fees.supplements?.documents ?? -2} {cur}/kg</strong></span>
          </div>
        </div>
        <div style={{ background: 'var(--bg-soft)', borderRadius: 6, padding: '10px 12px' }}>
          <div style={{ fontWeight: 700, color: 'var(--ink-600)', marginBottom: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>Autres frais</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, color: 'var(--ink-700)' }}>
            <span>Conditionnement : <strong>0,60 {cur}/plastique</strong></span>
            <span>Livraison Mtl île : <strong>{fees.deliveryFee ?? 25} {cur}</strong></span>
            <span>Livraison Grand Mtl : <strong>{Math.round((fees.deliveryFee ?? 25) * 1.2)} {cur}</strong></span>
            <span>Marge par défaut : <strong>{fees.marginPct ?? 30} %</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    company_name:      'Jumla Shipping',
    company_legal:     'Jumla Shipping SARL',
    phone_douala:      '',
    phone_montreal:    '',
    contact_whatsapp:  '',
    warehouse_addr:    '5500 Place de la Savane, Lachine, QC H4S 1V8, Canada',
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      setFields(f => ({
        company_name:     d.company_name     ?? f.company_name,
        company_legal:    d.company_legal    ?? f.company_legal,
        phone_douala:     d.phone_douala     ?? f.phone_douala,
        phone_montreal:   d.phone_montreal   ?? f.phone_montreal,
        contact_whatsapp: d.contact_whatsapp ?? f.contact_whatsapp,
        warehouse_addr:   d.warehouse_addr   ?? f.warehouse_addr,
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
          <label className="label">WhatsApp contact client <span className="opt">/ numéro affiché aux clients pour support</span></label>
          <input className="input mono" value={fields.contact_whatsapp} onChange={set('contact_whatsapp')} placeholder="+1 514 *** ****" />
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
function MigrationBanner({ onDone }) {
  const [status, setStatus] = useState('idle'); // idle | running | done | error
  const run = async () => {
    setStatus('running');
    try {
      const res = await fetch('/api/db-migrate');
      const d   = await res.json();
      if (d.ok) { setStatus('done'); onDone?.(); }
      else setStatus('error');
    } catch { setStatus('error'); }
  };
  if (status === 'done') return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px', background: 'var(--ok-50)', border: '1px solid var(--ok-100)', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
      <span style={{ color: 'var(--ok-600)', fontWeight: 700 }}>✓ Migration réussie — vous pouvez maintenant cliquer Enregistrer.</span>
    </div>
  );
  if (status === 'error') return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px', background: 'var(--bad-50)', border: '1px solid var(--bad-200)', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
      <span style={{ color: 'var(--bad-700)', fontWeight: 700 }}>✕ Échec de la migration — contactez le support.</span>
      <button className="btn btn--ghost btn--sm" onClick={run}>Réessayer</button>
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

function SectionPricing({ routes, onEdit }) {
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {r.fees?.tiers?.length > 0
                      ? <span style={{ fontSize: 12, color: 'var(--ok-700)', fontWeight: 600 }}>✓ {r.fees.tiers.length} tranche{r.fees.tiers.length > 1 ? 's' : ''}</span>
                      : <span style={{ fontSize: 12, color: 'var(--ink-400)', fontStyle: 'italic' }}>À configurer</span>}
                    <button className="btn btn--ghost btn--sm" onClick={() => onEdit(r)} style={{ fontSize: 11.5 }}>
                      {r.fees?.tiers?.length > 0 ? '· Voir / Modifier' : '+ Configurer'}
                    </button>
                  </div>
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

/* ── Éditeur route plein écran ───────────────────────────── */
function SectionTitle({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-400)', marginBottom: 10, marginTop: 4 }}>{children}</div>;
}

const DEFAULT_TIERS_EDITOR = [
  { id:1, from:'0.5', to:'3',     transportType:'flat',  transportValue:'50',  cartonType:'flat',    cartonValue:'1',   manutentionType:'flat',    manutentionValue:'4',   manutentionMin:'',   douaneType:'flat',  douaneValue:'5',   formalitesType:'flat',  formalitesValue:'5'  },
  { id:2, from:'3.5', to:'9.5',   transportType:'perKg', transportValue:'13',  cartonType:'perUnit', cartonValue:'1.5', manutentionType:'flat',    manutentionValue:'5',   manutentionMin:'',   douaneType:'perKg', douaneValue:'3',   formalitesType:'perKg', formalitesValue:'2'  },
  { id:3, from:'10',  to:'22.5',  transportType:'perKg', transportValue:'12',  cartonType:'perUnit', cartonValue:'1.5', manutentionType:'flat',    manutentionValue:'10',  manutentionMin:'',   douaneType:'perKg', douaneValue:'3',   formalitesType:'perKg', formalitesValue:'2'  },
  { id:4, from:'23.5',to:'69.5',  transportType:'perKg', transportValue:'11',  cartonType:'perUnit', cartonValue:'1.5', manutentionType:'flat',    manutentionValue:'15',  manutentionMin:'',   douaneType:'perKg', douaneValue:'2',   formalitesType:'perKg', formalitesValue:'1.5'},
  { id:5, from:'70',  to:'115',   transportType:'perKg', transportValue:'10',  cartonType:'perUnit', cartonValue:'1.5', manutentionType:'perUnit', manutentionValue:'5',   manutentionMin:'20', douaneType:'perKg', douaneValue:'2.5', formalitesType:'perKg', formalitesValue:'1'  },
  { id:6, from:'115.5',to:'199.5',transportType:'perKg', transportValue:'9',   cartonType:'perUnit', cartonValue:'1.5', manutentionType:'perUnit', manutentionValue:'4.5', manutentionMin:'27', douaneType:'perKg', douaneValue:'1.5', formalitesType:'perKg', formalitesValue:'1'  },
  { id:7, from:'200', to:'250',   transportType:'perKg', transportValue:'8',   cartonType:'perUnit', cartonValue:'1.5', manutentionType:'perUnit', manutentionValue:'4',   manutentionMin:'40', douaneType:'perKg', douaneValue:'1.5', formalitesType:'perKg', formalitesValue:'1'  },
  { id:8, from:'250.5',to:'',     transportType:'perKg', transportValue:'7.5', cartonType:'perUnit', cartonValue:'1.5', manutentionType:'perUnit', manutentionValue:'3',   manutentionMin:'60', douaneType:'perKg', douaneValue:'1.5', formalitesType:'perKg', formalitesValue:'1'  },
];

function initTiers(fees) {
  if (!fees?.tiers?.length) return DEFAULT_TIERS_EDITOR.map(t => ({ ...t }));
  return fees.tiers.map((t, i) => ({
    id: i + 1,
    from: String(t.from ?? ''),
    to:   t.to >= 99999 ? '' : String(t.to ?? ''),
    transportType:     t.transportFlat !== undefined ? 'flat'    : 'perKg',
    transportValue:    String(t.transportFlat   ?? t.transportPerKg   ?? ''),
    cartonType:        t.cartonFlat    !== undefined ? 'flat'    : 'perUnit',
    cartonValue:       String(t.cartonFlat       ?? t.cartonPerUnit    ?? 1.5),
    manutentionType:   t.manutentionFlat !== undefined ? 'flat'  : 'perUnit',
    manutentionValue:  String(t.manutentionFlat  ?? t.manutentionPerUnit ?? ''),
    manutentionMin:    String(t.manutentionMin   ?? ''),
    douaneType:        t.douaneFlat    !== undefined ? 'flat'    : 'perKg',
    douaneValue:       String(t.douaneFlat        ?? t.douanePerKg     ?? ''),
    formalitesType:    t.formalitesFlat !== undefined ? 'flat'   : 'perKg',
    formalitesValue:   String(t.formalitesFlat   ?? t.formalitesPerKg ?? ''),
  }));
}

function tierToApi(t) {
  const to = t.to === '' ? 99999 : parseFloat(t.to) || 0;
  return {
    from: parseFloat(t.from) || 0,
    to,
    ...(t.transportType === 'flat'
      ? { transportFlat:   parseFloat(t.transportValue)   || 0 }
      : { transportPerKg:  parseFloat(t.transportValue)   || 0 }),
    ...(t.cartonType === 'flat'
      ? { cartonFlat:      parseFloat(t.cartonValue)      || 0 }
      : { cartonPerUnit:   parseFloat(t.cartonValue)      || 0 }),
    ...(t.manutentionType === 'flat'
      ? { manutentionFlat: parseFloat(t.manutentionValue) || 0 }
      : { manutentionPerUnit: parseFloat(t.manutentionValue) || 0, manutentionMin: parseFloat(t.manutentionMin) || 0 }),
    ...(t.douaneType === 'flat'
      ? { douaneFlat:      parseFloat(t.douaneValue)      || 0 }
      : { douanePerKg:     parseFloat(t.douaneValue)      || 0 }),
    ...(t.formalitesType === 'flat'
      ? { formalitesFlat:  parseFloat(t.formalitesValue)  || 0 }
      : { formalitesPerKg: parseFloat(t.formalitesValue)  || 0 }),
  };
}

function RouteEditModal({ editRoute, onClose, onSaved }) {
  const isNew = editRoute === 'new';
  const r = isNew ? null : editRoute;
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  // Informations de base
  const [origin, setOrigin]           = useState(r?.fromIATA || '');
  const [destination, setDestination] = useState(r?.toIATA || '');
  const [label, setLabel]             = useState(r?.label || '');
  const [transitDays, setTransitDays] = useState(String(r?.transitDays ?? 14));
  const [currency, setCurrency]       = useState(r?.currency ?? 'CAD');
  const [active, setActive]           = useState(r?.active ?? true);

  // Paliers
  const [tiers, setTiers] = useState(() => initTiers(r?.fees));

  // Emballages & conditionnement
  const [bagSmall,   setBagSmall]   = useState(String(r?.fees?.bags?.small    ?? 5));
  const [bagMedium,  setBagMedium]  = useState(String(r?.fees?.bags?.medium   ?? 7.5));
  const [bagLarge,   setBagLarge]   = useState(String(r?.fees?.bags?.large    ?? 10));
  const [plastic,    setPlastic]    = useState(String(r?.fees?.plastic        ?? 0.6));

  // SAQ
  const [saq24x65,   setSaq24x65]   = useState(String(r?.fees?.saq?.casier24x65 ?? 24.50));
  const [saq24x33,   setSaq24x33]   = useState(String(r?.fees?.saq?.casier24x33 ?? 35.83));
  const [saq12x50,   setSaq12x50]   = useState(String(r?.fees?.saq?.casier12x50 ?? 21.34));

  // Suppléments
  const [suppVetements,    setSuppVetements]    = useState(String(r?.fees?.supplements?.vetements   ?? 2));
  const [suppCosmetique,   setSuppCosmetique]   = useState(String(r?.fees?.supplements?.cosmetique  ?? 3));
  const [suppBiere,        setSuppBiere]        = useState(String(r?.fees?.supplements?.biere        ?? 6));
  const [suppElectronique, setSuppElectronique] = useState(String(r?.fees?.supplements?.electronique ?? 5));
  const [suppDocuments,    setSuppDocuments]    = useState(String(r?.fees?.supplements?.documents    ?? -2));

  // Marge & livraison
  const [marginPct,      setMarginPct]      = useState(String(r?.fees?.marginPct  ?? 30));
  const [deliveryFeeIle, setDeliveryFeeIle] = useState(String(r?.fees?.deliveryFee ?? 25));

  // Helpers paliers
  const updTier = (id, k, v) => setTiers(ts => ts.map(t => t.id === id ? { ...t, [k]: v } : t));
  const delTier = (id) => setTiers(ts => ts.filter(t => t.id !== id));
  const addTier = () => setTiers(ts => [...ts, {
    id: Date.now(), from: '', to: '',
    transportType: 'perKg', transportValue: '',
    cartonType: 'perUnit', cartonValue: '1.5',
    manutentionType: 'flat', manutentionValue: '', manutentionMin: '',
    douaneType: 'perKg', douaneValue: '',
    formalitesType: 'perKg', formalitesValue: '',
  }]);

  const handleSave = async () => {
    if (!origin.trim() || !destination.trim()) { setErr('Codes IATA obligatoires'); return; }
    setSaving(true); setErr('');
    try {
      const fees = {
        tiers:       tiers.map(tierToApi),
        bags:        { small: parseFloat(bagSmall)||5, medium: parseFloat(bagMedium)||7.5, large: parseFloat(bagLarge)||10 },
        plastic:     parseFloat(plastic) || 0.6,
        saq:         { casier24x65: parseFloat(saq24x65)||24.5, casier24x33: parseFloat(saq24x33)||35.83, casier12x50: parseFloat(saq12x50)||21.34 },
        supplements: { vetements: parseFloat(suppVetements)||2, cosmetique: parseFloat(suppCosmetique)||3, biere: parseFloat(suppBiere)||6, electronique: parseFloat(suppElectronique)||5, documents: parseFloat(suppDocuments)||-2 },
        marginPct:   parseFloat(marginPct) || 30,
        deliveryFee: parseFloat(deliveryFeeIle) || 25,
      };
      const payload = {
        origin: origin.toUpperCase().trim(),
        destination: destination.toUpperCase().trim(),
        label: label.trim() || `${origin.toUpperCase()} → ${destination.toUpperCase()}`,
        transitDays: parseInt(transitDays) || 14,
        currency, active, fees,
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'white', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Header sticky */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'white', borderBottom: '1px solid var(--border)', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <button className="btn btn--ghost btn--sm" onClick={onClose}><I.ArrowLeft />Retour</button>
        <div style={{ flex: 1, fontSize: 15, fontWeight: 700 }}>{isNew ? 'Nouvelle route' : `Modifier — ${r?.label ?? r?.code ?? ''}`}</div>
        {err && <span style={{ fontSize: 12, color: 'var(--bad-700)' }}>{err}</span>}
        <button className="btn btn--brand" onClick={handleSave} disabled={saving}><I.Check />{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 24px', width: '100%' }}>

        {/* Section 1 — Infos de base */}
        <SectionTitle>Informations de base</SectionTitle>
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
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
        </div>

        {/* Section 2 — Paliers de poids */}
        <SectionTitle>Paliers de poids</SectionTitle>
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: 'var(--ink-400)', marginBottom: 14 }}>
            Le palier est sélectionné en fonction du poids total du colis. Les taux s'appliquent aux composantes de prix correspondantes.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 900 }}>
              <thead>
                <tr style={{ background: 'var(--bg-soft)' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--ink-500)', fontSize: 11, textTransform: 'uppercase' }}>De (kg)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--ink-500)', fontSize: 11, textTransform: 'uppercase' }}>À (kg)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--ink-500)', fontSize: 11, textTransform: 'uppercase' }}>Transport</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--ink-500)', fontSize: 11, textTransform: 'uppercase' }}>Carton</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--ink-500)', fontSize: 11, textTransform: 'uppercase' }}>Manutention</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--ink-500)', fontSize: 11, textTransform: 'uppercase' }}>Douane/Terminal</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--ink-500)', fontSize: 11, textTransform: 'uppercase' }}>Formalités</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier) => (
                  <tr key={tier.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: '6px 8px' }}><input className="input input--sm mono" type="number" value={tier.from} onChange={e => updTier(tier.id, 'from', e.target.value)} style={{ width: 65 }} /></td>
                    <td style={{ padding: '6px 8px' }}><input className="input input--sm mono" type="number" value={tier.to} onChange={e => updTier(tier.id, 'to', e.target.value)} placeholder="∞" style={{ width: 65 }} /></td>
                    <td style={{ padding: '6px 8px' }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <select className="select input--sm" value={tier.transportType} onChange={e => updTier(tier.id, 'transportType', e.target.value)} style={{ fontSize: 11, padding: '2px 4px', width: 70 }}>
                          <option value="flat">Forfait</option>
                          <option value="perKg">$/kg</option>
                        </select>
                        <input className="input input--sm mono" type="number" value={tier.transportValue} onChange={e => updTier(tier.id, 'transportValue', e.target.value)} style={{ width: 55 }} />
                      </div>
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <select className="select input--sm" value={tier.cartonType} onChange={e => updTier(tier.id, 'cartonType', e.target.value)} style={{ fontSize: 11, padding: '2px 4px', width: 70 }}>
                          <option value="flat">Forfait</option>
                          <option value="perUnit">$/carton</option>
                        </select>
                        <input className="input input--sm mono" type="number" value={tier.cartonValue} onChange={e => updTier(tier.id, 'cartonValue', e.target.value)} style={{ width: 55 }} />
                      </div>
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                        <select className="select input--sm" value={tier.manutentionType} onChange={e => updTier(tier.id, 'manutentionType', e.target.value)} style={{ fontSize: 11, padding: '2px 4px', width: 80 }}>
                          <option value="flat">Forfait</option>
                          <option value="perUnit">$/unité</option>
                        </select>
                        <input className="input input--sm mono" type="number" value={tier.manutentionValue} onChange={e => updTier(tier.id, 'manutentionValue', e.target.value)} style={{ width: 50 }} />
                        {tier.manutentionType === 'perUnit' && (
                          <><span style={{ fontSize: 11, color: 'var(--ink-400)' }}>min</span>
                          <input className="input input--sm mono" type="number" value={tier.manutentionMin} onChange={e => updTier(tier.id, 'manutentionMin', e.target.value)} style={{ width: 45 }} /></>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <select className="select input--sm" value={tier.douaneType} onChange={e => updTier(tier.id, 'douaneType', e.target.value)} style={{ fontSize: 11, padding: '2px 4px', width: 70 }}>
                          <option value="flat">Forfait</option>
                          <option value="perKg">$/kg</option>
                        </select>
                        <input className="input input--sm mono" type="number" value={tier.douaneValue} onChange={e => updTier(tier.id, 'douaneValue', e.target.value)} style={{ width: 55 }} />
                      </div>
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <select className="select input--sm" value={tier.formalitesType} onChange={e => updTier(tier.id, 'formalitesType', e.target.value)} style={{ fontSize: 11, padding: '2px 4px', width: 70 }}>
                          <option value="flat">Forfait</option>
                          <option value="perKg">$/kg</option>
                        </select>
                        <input className="input input--sm mono" type="number" value={tier.formalitesValue} onChange={e => updTier(tier.id, 'formalitesValue', e.target.value)} style={{ width: 55 }} />
                      </div>
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                      <button className="icon-btn" onClick={() => delTier(tier.id)} disabled={tiers.length === 1} style={{ color: tiers.length === 1 ? 'var(--ink-200)' : 'var(--bad-400)' }}><I.Trash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn btn--ghost btn--sm" style={{ marginTop: 10 }} onClick={addTier}><I.Plus />Ajouter un palier</button>
        </div>

        {/* Section 3 — Emballages & conditionnement */}
        <SectionTitle>Emballages & conditionnement</SectionTitle>
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {[
              { label: 'Carton', sub: '(1er palier : forfait)', val: '1', readOnly: true },
              { label: 'Petit sac', val: bagSmall, set: setBagSmall },
              { label: 'Moyen sac', val: bagMedium, set: setBagMedium },
              { label: 'Grand sac', val: bagLarge, set: setBagLarge },
              { label: 'Plastique', sub: '$/unité (conditionnement)', val: plastic, set: setPlastic },
            ].map(f => (
              <div key={f.label} className="field" style={{ marginBottom: 0 }}>
                <label className="label">{f.label}{f.sub && <span className="opt"> {f.sub}</span>}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input className="input mono" type="number" step="0.1" value={f.val} onChange={f.set ? e => f.set(e.target.value) : undefined} readOnly={f.readOnly} style={{ flex: 1, background: f.readOnly ? 'var(--bg-soft)' : undefined }} />
                  <span style={{ fontSize: 12, color: 'var(--ink-400)', whiteSpace: 'nowrap' }}>{currency}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-400)' }}>
            Le carton est configuré par palier (forfait sur le 1er palier, 1,50 {currency}/carton sur les suivants par défaut).
          </div>
        </div>

        {/* Section 4 — Frais SAQ */}
        <SectionTitle>Frais SAQ (bière)</SectionTitle>
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Casier 24 × 65cl', val: saq24x65, set: setSaq24x65 },
              { label: 'Casier 24 × 33cl', val: saq24x33, set: setSaq24x33 },
              { label: 'Casier 12 × 50cl', val: saq12x50, set: setSaq12x50 },
            ].map(f => (
              <div key={f.label} className="field" style={{ marginBottom: 0 }}>
                <label className="label">{f.label}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input className="input mono" type="number" step="0.01" value={f.val} onChange={e => f.set(e.target.value)} style={{ flex: 1 }} />
                  <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>{currency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5 — Suppléments */}
        <SectionTitle>Suppléments par catégorie</SectionTitle>
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {[
              { label: 'Vêtements',    icon: '👗', val: suppVetements,    set: setSuppVetements    },
              { label: 'Cosmétiques',  icon: '💄', val: suppCosmetique,   set: setSuppCosmetique   },
              { label: 'Bière',        icon: '🍺', val: suppBiere,        set: setSuppBiere        },
              { label: 'Électronique', icon: '📱', val: suppElectronique, set: setSuppElectronique },
              { label: 'Documents',    icon: '📄', val: suppDocuments,    set: setSuppDocuments    },
            ].map(f => (
              <div key={f.label} className="field" style={{ marginBottom: 0 }}>
                <label className="label">{f.icon} {f.label}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input className="input mono" type="number" step="0.5" value={f.val} onChange={e => f.set(e.target.value)} style={{ flex: 1 }} />
                  <span style={{ fontSize: 12, color: 'var(--ink-400)', whiteSpace: 'nowrap' }}>{currency}/kg</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-400)' }}>
            Les suppléments s'ajoutent au transport pour chaque ligne de colis de cette catégorie. Un montant négatif est une réduction.
          </div>
        </div>

        {/* Section 6 — Marge & livraison */}
        <SectionTitle>Marge & livraison</SectionTitle>
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Marge par défaut (%)</label>
              <input className="input mono" type="number" step="1" value={marginPct} onChange={e => setMarginPct(e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Livraison île de Montréal</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input className="input mono" type="number" step="1" value={deliveryFeeIle} onChange={e => setDeliveryFeeIle(e.target.value)} style={{ flex: 1 }} />
                <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>{currency}</span>
              </div>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Livraison Grand Montréal</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input className="input mono" type="number" step="1" value={String(Math.round((parseFloat(deliveryFeeIle) || 25) * 1.2))} readOnly style={{ flex: 1, background: 'var(--bg-soft)' }} />
                <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>{currency} <span style={{ fontSize: 11, color: 'var(--ink-300)' }}>(auto)</span></span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
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
  const [openGroup, setOpenGroup]     = useState(initialTab === 'whatsapp' || initialTab === 'auto' ? 'messagerie' : null);

  const loadRoutes = () =>
    fetch('/api/routes').then(r => r.json()).then(data => setRoutes(Array.isArray(data) ? data : [])).catch(() => {});

  useEffect(() => { loadRoutes(); }, []);

  const nav = [
    { id: 'company',   l: 'Entreprise',           icon: I.Building },
    { id: 'routes',    l: 'Routes & tarifs',       icon: I.Route },
    { id: 'whatsapp',  l: 'WhatsApp',              icon: I.Chat },
    { id: 'auto',      l: 'Auto-notifications',    icon: I.Bell, badge: 'Nouveau' },
    { id: 'campaigns', l: 'Cargaisons',            icon: I.Plane },
    { id: 'codes',     l: 'Codes & numérotation',  icon: I.Tag },
  ];

  const navItemStyle = (id) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
    background: section === id ? 'var(--brand-50)' : 'transparent',
    color: section === id ? 'var(--brand-700)' : 'var(--ink-600)',
    fontWeight: section === id ? 600 : 500,
    fontSize: 13, marginBottom: 2,
  });

  const subItemStyle = (id) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '7px 10px 7px 30px', borderRadius: 6, cursor: 'pointer',
    background: section === id ? 'var(--brand-50)' : 'transparent',
    color: section === id ? 'var(--brand-700)' : 'var(--ink-500)',
    fontWeight: section === id ? 600 : 400,
    fontSize: 12.5, marginBottom: 1,
  });

  const messageriGroupOpen = openGroup === 'messagerie' || section === 'whatsapp' || section === 'auto';

  useEffect(() => {
    const handler = (e) => {
      const id = e.detail;
      setSection(id);
      setOpenGroup(['whatsapp', 'auto'].includes(id) ? 'messagerie' : null);
    };
    window.addEventListener('jumla:nav-settings', handler);
    return () => window.removeEventListener('jumla:nav-settings', handler);
  }, []);

  const handleNavFlat = (id) => {
    setSection(id);
    setOpenGroup(null);
    history.pushState({}, '', `/admin/settings?tab=${id}`);
    window.dispatchEvent(new CustomEvent('jumla:nav-settings', { detail: id }));
  };

  const handleNavSub = (id) => {
    setSection(id);
    setOpenGroup('messagerie');
    history.pushState({}, '', `/admin/settings?tab=${id}`);
    window.dispatchEvent(new CustomEvent('jumla:nav-settings', { detail: id }));
  };

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
          {/* Entreprise */}
          <a onClick={() => handleNavFlat('company')} style={navItemStyle('company')}>
            <I.Building style={{ width: 15, height: 15, opacity: .85 }} />
            <span style={{ flex: 1 }}>Entreprise</span>
          </a>
          {/* Routes & tarifs */}
          <a onClick={() => handleNavFlat('routes')} style={navItemStyle('routes')}>
            <I.Route style={{ width: 15, height: 15, opacity: .85 }} />
            <span style={{ flex: 1 }}>Routes & tarifs</span>
          </a>
          {/* Groupe dépliable : Messagerie & alertes */}
          <div style={{ marginBottom: 2 }}>
            <a onClick={() => setOpenGroup(messageriGroupOpen ? null : 'messagerie')} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
              background: (section === 'whatsapp' || section === 'auto') ? 'var(--brand-50)' : 'transparent',
              color: (section === 'whatsapp' || section === 'auto') ? 'var(--brand-700)' : 'var(--ink-600)',
              fontWeight: (section === 'whatsapp' || section === 'auto') ? 600 : 500,
              fontSize: 13,
            }}>
              <I.Chat style={{ width: 15, height: 15, opacity: .85 }} />
              <span style={{ flex: 1 }}>Messagerie & alertes</span>
              <span style={{ fontSize: 10, color: 'var(--ink-400)', transition: 'transform .15s', display: 'inline-block', transform: messageriGroupOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
            </a>
            {messageriGroupOpen && (
              <div style={{ marginTop: 2 }}>
                <a onClick={() => handleNavSub('whatsapp')} style={subItemStyle('whatsapp')}>
                  <I.Chat style={{ width: 13, height: 13, opacity: .75 }} />
                  <span style={{ flex: 1 }}>WhatsApp</span>
                </a>
                <a onClick={() => handleNavSub('auto')} style={subItemStyle('auto')}>
                  <I.Bell style={{ width: 13, height: 13, opacity: .75 }} />
                  <span style={{ flex: 1 }}>Auto-notifications</span>
                  <span style={{ fontSize: 9.5, padding: '1px 6px', borderRadius: 999, background: 'var(--brand-500)', color: 'white', fontWeight: 700 }}>Nouveau</span>
                </a>
              </div>
            )}
          </div>
          {/* Cargaisons */}
          <a onClick={() => handleNavFlat('campaigns')} style={navItemStyle('campaigns')}>
            <I.Plane style={{ width: 15, height: 15, opacity: .85 }} />
            <span style={{ flex: 1 }}>Cargaisons</span>
          </a>
          {/* Codes & numérotation */}
          <a onClick={() => handleNavFlat('codes')} style={navItemStyle('codes')}>
            <I.Tag style={{ width: 15, height: 15, opacity: .85 }} />
            <span style={{ flex: 1 }}>Codes & numérotation</span>
          </a>
        </div>

        {/* Content */}
        <div>
          {section === 'company'   && <SectionCompany />}
          {section === 'routes'    && (
            <>
              <SectionRoutes routes={routes} onEdit={setEditRoute} onDetail={setRouteDetail} />
              <SectionPricing routes={routes} onEdit={setEditRoute} />
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
            <div className="section-title" style={{ marginBottom: 12 }}>Grille tarifaire</div>
            {routeDetail.fees?.tiers?.length > 0 ? (
              <TarifGrid
                tiers={routeDetail.fees.tiers}
                fees={{ ...DEFAULT_FEES_META, ...routeDetail.fees }}
                currency={routeDetail.currency ?? 'CAD'}
                isDefault={false}
              />
            ) : (
              <TarifGrid
                tiers={DEFAULT_TIERS}
                fees={DEFAULT_FEES_META}
                currency={routeDetail.currency ?? 'CAD'}
                isDefault={true}
              />
            )}
          </div>
        </Drawer>
      )}
    </div>
  );
}
