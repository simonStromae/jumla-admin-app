import { useState, Fragment } from 'react';
import { DATA } from '../data.js';
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

function SectionCompany() {
  return (
    <>
      <SettingsCard title="Identité de l'entreprise" sub="Ces informations apparaissent sur vos bordereaux et messages clients.">
        <div className="field-row field-row--2">
          <div className="field"><label className="label">Nom commercial</label><input className="input" defaultValue="Jumla Shipping" /></div>
          <div className="field"><label className="label">Raison sociale</label><input className="input" defaultValue="Jumla Shipping SARL" /></div>
        </div>
        <div className="field-row field-row--2">
          <div className="field"><label className="label">Téléphone Douala</label><input className="input mono" defaultValue="+237 6** ** ** 00" /></div>
          <div className="field"><label className="label">Téléphone Montréal</label><input className="input mono" defaultValue="+1 514 *** ****" /></div>
        </div>
        <div className="field">
          <label className="label">Adresse entrepôt arrivée</label>
          <input className="input" defaultValue="5500 Place de la Savane, Lachine, QC H4S 1V8, Canada" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <button className="btn btn--brand btn--sm"><I.Check />Enregistrer</button>
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

function SectionRoutes({ onEdit, onDetail }) {
  return (
    <SettingsCard
      title="Routes commerciales"
      sub="Définissez les trajets que vous opérez. Chaque cargaison est rattachée à une route."
      actions={<button className="btn btn--brand btn--sm" onClick={() => onEdit('new')}><I.Plus />Nouvelle route</button>}>
      <div style={{ display: 'grid', gap: 10 }}>
        {DATA.ROUTES.map(r => (
          <div key={r.id} className="card" style={{ padding: 16, cursor: 'pointer', borderColor: r.active ? 'var(--border)' : 'var(--border-soft)' }} onClick={() => onDetail(r)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: r.active ? 'var(--brand-50)' : 'var(--bg-soft)', color: r.active ? 'var(--brand-700)' : 'var(--ink-400)', display: 'grid', placeItems: 'center' }}>
                  <I.Plane style={{ width: 20, height: 20 }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{r.fromCity} → {r.toCity}</span>
                    <RoutePill from={r.fromIATA} to={r.toIATA} />
                    {r.active
                      ? <span className="badge badge--dot badge--ok">Active</span>
                      : <span className="badge badge--dot badge--neutral">Archivée</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>
                    {r.fromCountry} → {r.toCountry}
                    <span style={{ color: 'var(--ink-300)', margin: '0 8px' }}>·</span>
                    Transit <strong>{r.transitDays} j</strong>
                    <span style={{ color: 'var(--ink-300)', margin: '0 8px' }}>·</span>
                    Devise <strong>{r.currency}</strong>
                    {r.fees && (
                      <>
                        <span style={{ color: 'var(--ink-300)', margin: '0 8px' }}>·</span>
                        Forfait 0-3 kg : <strong>{r.fees.flatUpTo3kg} {r.currency}</strong>
                        <span style={{ color: 'var(--ink-300)', margin: '0 8px' }}>·</span>
                        +{r.fees.perHalfKgRate} {r.currency}/0,5 kg
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{r.cargosCount}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>Cargaisons</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ok-600)' }}>{(r.revenueTotal / 1000).toFixed(0)}k</div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>CA · {r.currency}</div>
                </div>
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

function SectionPricing() {
  return (
    <SettingsCard title="Grille tarifaire" sub="Tarifs par tranche de poids, frais supplémentaires et règles d'arrondi.">
      <table className="tbl">
        <thead>
          <tr>
            <th style={{ borderRadius: 0 }}>Route</th>
            <th>De (kg)</th>
            <th>À (kg)</th>
            <th style={{ textAlign: 'right' }}>Prix / kg</th>
            <th>Devise</th>
            <th style={{ borderRadius: 0 }}></th>
          </tr>
        </thead>
        <tbody>
          {DATA.ROUTES.filter(r => r.active).flatMap(r =>
            r.pricing.map((p, i) => (
              <tr key={r.id + '-' + i}>
                <td className="mono" style={{ fontWeight: 600, fontSize: 12 }}>
                  <RoutePill from={r.fromIATA} to={r.toIATA} />
                </td>
                <td className="mono">{p.from}</td>
                <td className="mono">{p.to || '∞'}</td>
                <td style={{ textAlign: 'right' }}><span className="mono" style={{ fontWeight: 700 }}>{p.rate}</span></td>
                <td><span className="badge badge--neutral">{r.currency}</span></td>
                <td><button className="icon-btn"><I.Edit /></button></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <button className="btn btn--ghost btn--sm" style={{ marginTop: 12 }}><I.Plus />Ajouter une tranche</button>
    </SettingsCard>
  );
}

function SectionWhatsapp() {
  const [connected, setConnected] = useState(true);
  const [autoToggles, setAutoToggles] = useState({ arrival: true, reminder: true, confirm: false, pickup: false });
  const toggle = (k) => setAutoToggles(t => ({ ...t, [k]: !t[k] }));
  return (
    <>
      <SettingsCard title="Connexion API Twilio" sub="Connectez votre compte Twilio pour l'envoi de messages WhatsApp.">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: connected ? 'var(--ok-50)' : 'var(--bg-soft)', border: '1px solid ' + (connected ? 'var(--ok-100)' : 'var(--border)'), borderRadius: 8, marginBottom: 16 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: connected ? 'var(--ok-500)' : 'var(--ink-300)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: connected ? 'var(--ok-700)' : 'var(--ink-600)' }}>{connected ? 'API connectée · opérationnelle' : 'Non connecté'}</div>
            {connected && <div style={{ fontSize: 12, color: 'var(--ok-600)', marginTop: 2 }}>Twilio · +237 6** ** ** 00 · Quota : 842 / 1 000 messages/mois</div>}
          </div>
          <button className="btn btn--ghost btn--sm" onClick={() => setConnected(!connected)}>{connected ? 'Déconnecter' : 'Connecter'}</button>
        </div>
        <div className="field-row field-row--2">
          <div className="field"><label className="label">Account SID</label><input className="input mono" type="password" defaultValue="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" /></div>
          <div className="field"><label className="label">Auth Token</label><input className="input mono" type="password" defaultValue="••••••••••••••••••••••••••••••••" /></div>
        </div>
        <div className="field"><label className="label">Numéro WhatsApp Business</label><input className="input mono" defaultValue="+237 6** ** ** 00" /></div>
      </SettingsCard>
      <SettingsCard title="Automatisations WhatsApp" sub="Déclencheurs automatiques pour les notifications clients.">
        <ToggleRow label="Avis d'arrivée automatique"    sub="Envoyé dès que la cargaison passe au statut Arrivé"   checked={autoToggles.arrival}  onChange={() => toggle('arrival')} />
        <ToggleRow label="Relance paiement J+3"          sub="Si le colis reste impayé 3 jours après la notification" checked={autoToggles.reminder} onChange={() => toggle('reminder')} />
        <ToggleRow label="Confirmation de livraison"     sub="Envoyé après validation du bordereau"                   checked={autoToggles.confirm}  onChange={() => toggle('confirm')} />
        <ToggleRow label="Rappel retrait entrepôt J+7"   sub="Si le colis n'est pas retiré après 7 jours"             checked={autoToggles.pickup}   onChange={() => toggle('pickup')} />
      </SettingsCard>
    </>
  );
}

function SectionSecurity({ onNav }) {
  const [secToggles, setSecToggles] = useState({ twofa: false, session: true, alerts: true });
  const toggle = (k) => setSecToggles(t => ({ ...t, [k]: !t[k] }));
  return (
    <>
      <SettingsCard title="Authentification" sub="Sécurisez l'accès à votre plateforme.">
        <ToggleRow label="Double authentification (2FA)"          sub="Par SMS ou application TOTP"                          checked={secToggles.twofa}   onChange={() => toggle('twofa')} />
        <ToggleRow label="Session expirée après 8h d'inactivité"  sub="Reconnexion requise automatiquement"                  checked={secToggles.session} onChange={() => toggle('session')} />
        <ToggleRow label="Alertes connexion suspecte"              sub="Email lors d'une connexion depuis un nouvel appareil" checked={secToggles.alerts}  onChange={() => toggle('alerts')} />
      </SettingsCard>
      <div className="card" style={{ marginBottom: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>Journal d'activité</div>
          <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 3 }}>Historique complet des actions réalisées par les agents.</div>
        </div>
        <a onClick={() => onNav?.('/admin/logs')} style={{ fontSize: 13, color: 'var(--brand-700)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Voir le journal →
        </a>
      </div>
    </>
  );
}

function SectionCodes() {
  return (
    <SettingsCard title="Format des codes" sub="Personnalisez le format des codes générés automatiquement.">
      {[
        { label: 'Code cargaison',  ex: 'DLA-YUL-APR-02', pattern: '{ORIG}-{DEST}-{MMM}-{NN}' },
        { label: 'Code colis',      ex: 'P-0142',          pattern: 'P-{NNNN}' },
        { label: 'Code bordereau',  ex: 'BL-2604-01',      pattern: 'BL-{YYMM}-{NN}' },
        { label: 'Code client',     ex: 'CL-0418',         pattern: 'CL-{NNNN}' },
      ].map((c, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: '1px solid var(--border-soft)' }}>
          <span style={{ width: 140, fontSize: 13, fontWeight: 600, color: 'var(--ink-700)', flexShrink: 0 }}>{c.label}</span>
          <input className="input input--sm mono" defaultValue={c.pattern} style={{ flex: 1 }} />
          <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-400)', padding: '2px 8px', background: 'var(--bg-soft)', borderRadius: 4 }}>→ {c.ex}</span>
        </div>
      ))}
      <button className="btn btn--brand btn--sm" style={{ marginTop: 14 }}><I.Check />Enregistrer</button>
    </SettingsCard>
  );
}

function SectionCampaigns() {
  return (
    <SettingsCard title="Paramètres des cargaisons" sub="Valeurs par défaut appliquées à la création d'une cargaison.">
      <div className="field-row field-row--2">
        <div className="field"><label className="label">Durée de transit par défaut</label><input className="input" defaultValue="14" type="number" /><div className="hint">jours</div></div>
        <div className="field"><label className="label">Devise par défaut</label><select className="select"><option>CAD</option><option>EUR</option><option>USD</option><option>XAF</option></select></div>
      </div>
      <div className="field-row field-row--2">
        <div className="field"><label className="label">Arrondi poids facturé</label><select className="select"><option>0,5 kg</option><option>1 kg</option><option>Exact</option></select></div>
      </div>
    </SettingsCard>
  );
}

function SectionAutoNotif() {
  const [toggles, setToggles] = useState({ arrival: true, reminder: true, delivery: true, overrun: false, invoice: true, broadcast: false });
  const toggle = k => setToggles(t => ({ ...t, [k]: !t[k] }));

  const triggers = [
    { id: 'arrival',   l: "Avis d'arrivée",            d: 'Envoyé automatiquement quand la cargaison passe à "Arrivée"' },
    { id: 'reminder',  l: 'Relance paiement J+3',       d: "Envoyé 3 jours après l'arrivée si paiement non confirmé" },
    { id: 'delivery',  l: 'Confirmation de livraison',  d: 'Envoyé à la validation du bordereau et libération du colis' },
    { id: 'overrun',   l: 'Alerte dépassement de poids',d: "Envoyé à l'expéditeur si le poids réel > poids réservé" },
    { id: 'invoice',   l: 'Facture automatique',        d: 'Envoyée au destinataire à la création du colis' },
    { id: 'broadcast', l: 'Annonce nouvelle cargaison', d: "Notifie les clients fidèles à l'ouverture d'une cargaison" },
  ];

  return (
    <SettingsCard title="Notifications automatiques" sub="Activez ou désactivez chaque déclencheur. Les modèles correspondants sont gérés dans la messagerie.">
      <div style={{ display: 'grid', gap: 8 }}>
        {triggers.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.l}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>{t.d}</div>
            </div>
            <a style={{ fontSize: 11.5, color: 'var(--brand-700)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Voir modèle →</a>
            <button onClick={() => toggle(t.id)} style={{
              width: 36, height: 20, borderRadius: 999,
              background: toggles[t.id] ? 'var(--brand-500)' : 'var(--ink-200)',
              border: 'none', cursor: 'pointer',
              position: 'relative', transition: 'background .15s', flexShrink: 0,
            }}>
              <span style={{
                position: 'absolute', left: toggles[t.id] ? 18 : 2, top: 2,
                width: 16, height: 16, borderRadius: 999, background: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                transition: 'left .15s',
              }} />
            </button>
          </div>
        ))}
      </div>
    </SettingsCard>
  );
}

const PROVINCES = [
  { v: 'QC', l: 'Québec' }, { v: 'ON', l: 'Ontario' }, { v: 'BC', l: 'Colombie-Britannique' },
  { v: 'AB', l: 'Alberta' }, { v: 'MB', l: 'Manitoba' }, { v: 'SK', l: 'Saskatchewan' },
];

function RouteEditModal({ editRoute, onClose }) {
  const isNew = editRoute === 'new';
  const r = isNew ? null : editRoute;
  const currency = r?.currency || 'CAD';

  const defaultBreakdown = (fees) => [
    { id: 1, label: 'Frais de base',          amount: fees?.base      ?? 50 },
    { id: 2, label: 'Frais de douane',         amount: fees?.customs   ?? 5  },
    { id: 3, label: 'Carton / manutention',    amount: fees?.carton    ?? 1  },
    { id: 4, label: "Formalités d'expédition", amount: fees?.formality ?? 4  },
    { id: 5, label: 'Frais de service',        amount: fees?.service   ?? 5  },
  ];

  const [tiers, setTiers] = useState(() => r?.fees ? [
    { id: 1, from: '0', to: '3',   flat: String(r.fees.flatUpTo3kg),    expanded: false, breakdown: defaultBreakdown(r.fees) },
    { id: 2, from: '3.5', to: '9.5', flat: String(r.fees.perHalfKgRate), expanded: false, breakdown: [] },
  ] : [
    { id: 1, from: '0', to: '3',   flat: '65', expanded: false, breakdown: defaultBreakdown(null) },
  ]);

  const toggleTier = id => setTiers(ts => ts.map(t => t.id === id ? { ...t, expanded: !t.expanded } : t));
  const delTier    = id => setTiers(ts => ts.filter(t => t.id !== id));
  const updTier    = (id, k, v) => setTiers(ts => ts.map(t => t.id === id ? { ...t, [k]: v } : t));
  const addTier    = () => setTiers(ts => [...ts, { id: Date.now(), from: '', to: '', flat: '', expanded: true, breakdown: [] }]);

  const addBRow  = tid => setTiers(ts => ts.map(t => t.id === tid ? { ...t, breakdown: [...t.breakdown, { id: Date.now(), label: '', amount: '' }] } : t));
  const delBRow  = (tid, rid) => setTiers(ts => ts.map(t => t.id === tid ? { ...t, breakdown: t.breakdown.filter(b => b.id !== rid) } : t));
  const updBRow  = (tid, rid, k, v) => setTiers(ts => ts.map(t => t.id === tid ? { ...t, breakdown: t.breakdown.map(b => b.id === rid ? { ...b, [k]: v } : b) } : t));

  const tierTotal = tier => tier.breakdown.length > 0
    ? tier.breakdown.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0)
    : parseFloat(tier.flat) || 0;

  return (
    <Modal width={740} onClose={onClose} title={isNew ? 'Nouvelle route' : `Modifier la route — ${r?.fromCity ?? ''} → ${r?.toCity ?? ''}`}>
      {/* ── Infos générales ── */}
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-400)', marginBottom: 10 }}>Informations générales</div>
      <div className="field-row field-row--2">
        <div className="field"><label className="label">Ville départ</label><input className="input" defaultValue={r?.fromCity || ''} /></div>
        <div className="field"><label className="label">Ville arrivée</label><input className="input" defaultValue={r?.toCity || ''} /></div>
      </div>
      <div className="field-row field-row--2">
        <div className="field"><label className="label">Code IATA départ</label><input className="input mono" defaultValue={r?.fromIATA || ''} placeholder="DLA" /></div>
        <div className="field"><label className="label">Code IATA arrivée</label><input className="input mono" defaultValue={r?.toIATA || ''} placeholder="YUL" /></div>
      </div>
      <div className="field-row field-row--2">
        <div className="field"><label className="label">Transit (jours)</label><input className="input" type="number" defaultValue={r?.transitDays || 14} /></div>
        <div className="field"><label className="label">Devise</label>
          <select className="select" defaultValue={r?.currency || 'CAD'}><option>CAD</option><option>EUR</option><option>XAF</option></select>
        </div>
      </div>

      {/* ── Grille tarifaire ── */}
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
                  <td>
                    <input className="input input--sm mono" type="number" value={tier.from}
                      onChange={e => updTier(tier.id, 'from', e.target.value)}
                      style={{ width: 60 }} />
                  </td>
                  <td>
                    <input className="input input--sm mono" type="number" value={tier.to}
                      onChange={e => updTier(tier.id, 'to', e.target.value)}
                      style={{ width: 60 }} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input className="input input--sm mono" type="number" value={tier.flat}
                        onChange={e => updTier(tier.id, 'flat', e.target.value)}
                        style={{ width: 80 }} />
                      <span style={{ fontSize: 11.5, color: 'var(--ink-400)' }}>{currency}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="mono" style={{ fontWeight: 700, color: tierTotal(tier) > 0 ? 'var(--ok-600)' : 'var(--ink-300)' }}>
                      {tierTotal(tier)} {currency}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn btn--ghost btn--sm" onClick={() => toggleTier(tier.id)} style={{ fontSize: 11.5, padding: '3px 8px' }}>
                      {tier.expanded ? '▴ Masquer' : '▾ Voir'}
                    </button>
                  </td>
                  <td>
                    <button className="icon-btn" onClick={() => delTier(tier.id)}
                      disabled={tiers.length === 1}
                      style={{ color: tiers.length === 1 ? 'var(--ink-200)' : 'var(--bad-400)' }}>
                      <I.Trash />
                    </button>
                  </td>
                </tr>
                {tier.expanded && (
                  <tr>
                    <td colSpan={6} style={{ padding: '8px 0 12px 24px', background: 'var(--bg-soft)' }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-500)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                        Composition du forfait {tier.from} – {tier.to} kg
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
                            <tr>
                              <td colSpan={3} style={{ fontSize: 12, color: 'var(--ink-400)', textAlign: 'center', padding: '10px 0' }}>
                                Aucun détail. Cliquez &laquo; + Ajouter &raquo; pour décomposer ce forfait.
                              </td>
                            </tr>
                          )}
                          {tier.breakdown.map(row => (
                            <tr key={row.id}>
                              <td>
                                <input className="input input--sm" value={row.label}
                                  onChange={e => updBRow(tier.id, row.id, 'label', e.target.value)}
                                  placeholder="Libellé…"
                                  style={{ border: 'none', background: 'transparent', width: '100%' }} />
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <input className="input input--sm mono" type="number" value={row.amount}
                                  onChange={e => updBRow(tier.id, row.id, 'amount', e.target.value)}
                                  style={{ width: 80, textAlign: 'right' }} />
                              </td>
                              <td>
                                <button className="icon-btn" onClick={() => delBRow(tier.id, row.id)}
                                  style={{ color: 'var(--bad-400)' }}>
                                  <I.Trash />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', border: '1px solid var(--border)', borderTop: 'none', background: 'white' }}>
                        <button className="btn btn--ghost btn--sm" onClick={() => addBRow(tier.id)}><I.Plus />Ajouter une ligne</button>
                        {tier.breakdown.length > 0 && (
                          <div style={{ fontSize: 12, fontWeight: 700 }}>
                            Total :&nbsp;
                            <span className="mono" style={{ color: 'var(--ok-600)' }}>
                              {tier.breakdown.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0)} {currency}
                            </span>
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

        {/* Delivery + bags */}
        <div style={{ marginTop: 20 }}>
          <div className="field-row field-row--2">
            <div className="field">
              <label className="label">Livraison Grand Montréal</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input className="input mono" type="number" defaultValue={r?.fees?.montrealDelivery ?? 25} style={{ flex: 1 }} />
                <span style={{ fontSize: 12, color: 'var(--ink-400)', whiteSpace: 'nowrap' }}>{currency}</span>
              </div>
            </div>
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 8 }}>Prix des sacs</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { label: 'Petit sac',  key: 'smallBag',  def: 3  },
              { label: 'Moyen sac', key: 'mediumBag', def: 5  },
              { label: 'Grand sac', key: 'largeBag',  def: 10 },
            ].map(s => (
              <div key={s.key} className="field" style={{ marginBottom: 0 }}>
                <label className="label">{s.label}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input className="input mono" type="number" defaultValue={r?.fees?.addons?.[s.key] ?? s.def} style={{ flex: 1 }} />
                  <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>{currency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        <button className="btn btn--ghost" onClick={onClose}>Annuler</button>
        <button className="btn btn--brand" onClick={onClose}><I.Check />Enregistrer</button>
      </div>
    </Modal>
  );
}

export default function SettingsScreen({ onNav }) {
  const [section, setSection] = useState('company');
  const [editRoute, setEditRoute] = useState(null);
  const [routeDetail, setRouteDetail] = useState(null);

  const nav = [
    { id: 'company',   l: 'Entreprise',           icon: I.Building },
    { id: 'routes',    l: 'Routes & tarifs',      icon: I.Route },
    { id: 'whatsapp',  l: 'WhatsApp',             icon: I.Chat },
    { id: 'auto',      l: 'Auto-notifications',   icon: I.Bell,     badge: 'Nouveau' },
    { id: 'campaigns', l: 'Cargaisons',           icon: I.Plane },
    { id: 'codes',     l: 'Codes & numérotation', icon: I.Tag },
    { id: 'security',  l: 'Sécurité',             icon: I.Lock },
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
          {section === 'routes'    && <SectionRoutes onEdit={setEditRoute} onDetail={setRouteDetail} />}
          {section === 'whatsapp'  && <SectionWhatsapp />}
          {section === 'auto'      && <SectionAutoNotif />}
          {section === 'campaigns' && <SectionCampaigns />}
          {section === 'codes'     && <SectionCodes />}
          {section === 'security'  && <SectionSecurity onNav={onNav} />}
        </div>
      </div>

      {editRoute && <RouteEditModal editRoute={editRoute} onClose={() => setEditRoute(null)} />}

      {routeDetail && (
        <Drawer onClose={() => setRouteDetail(null)}>
          <div className="drawer__head">
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{routeDetail.fromCity} → {routeDetail.toCity}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 4, display: 'flex', gap: 8 }}>
                <RoutePill from={routeDetail.fromIATA} to={routeDetail.toIATA} />
                <span>{routeDetail.active ? '✓ Active' : 'Archivée'}</span>
              </div>
            </div>
            <button className="btn btn--ghost btn--sm" onClick={() => { setRouteDetail(null); setEditRoute(routeDetail); }}><I.Edit />Modifier</button>
          </div>
          <div className="drawer__body" style={{ padding: 22 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { l: 'Cargaisons', v: routeDetail.cargosCount },
                { l: 'Colis total', v: routeDetail.parcelsTotal.toLocaleString('fr') },
                { l: 'CA total', v: (routeDetail.revenueTotal / 1000).toFixed(0) + 'k ' + routeDetail.currency },
                { l: 'Transit', v: routeDetail.transitDays + ' jours' },
              ].map((k, i) => (
                <div key={i} className="kpi" style={{ padding: 12 }}>
                  <div className="kpi__label">{k.l}</div>
                  <div className="kpi__value" style={{ fontSize: 18 }}>{k.v}</div>
                </div>
              ))}
            </div>
            <div className="section-title">Tarification</div>
            {routeDetail.fees ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-soft)', fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>Forfait 0 – 3 kg</span>
                  <span className="mono" style={{ fontWeight: 700 }}>{routeDetail.fees.flatUpTo3kg} {routeDetail.currency}</span>
                </div>
                {[
                  ['Frais de base', routeDetail.fees.base],
                  ['Frais de douane', routeDetail.fees.customs],
                  ['Carton / manutention', routeDetail.fees.carton],
                  ['Formalités', routeDetail.fees.formality],
                  ['Service', routeDetail.fees.service],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0 5px 14px', borderBottom: '1px solid var(--border-soft)', fontSize: 12, color: 'var(--ink-500)' }}>
                    <span>{k}</span><span>{v} {routeDetail.currency}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-soft)', fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>Au-delà de 3 kg (par 0,5 kg)</span>
                  <span className="mono" style={{ fontWeight: 700 }}>+{routeDetail.fees.perHalfKgRate} {routeDetail.currency}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-soft)', fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>Livraison Grand Montréal</span>
                  <span className="mono" style={{ fontWeight: 700 }}>{routeDetail.fees.montrealDelivery} {routeDetail.currency}</span>
                </div>
                <div style={{ padding: '8px 0', fontSize: 12, color: 'var(--ink-500)' }}>
                  Sacs : petit {routeDetail.fees.addons.smallBag} · moyen {routeDetail.fees.addons.mediumBag} · grand {routeDetail.fees.addons.largeBag} {routeDetail.currency}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--ink-400)' }}>Aucune tarification configurée.</p>
            )}
          </div>
        </Drawer>
      )}
    </div>
  );
}
