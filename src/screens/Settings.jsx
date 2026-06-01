import { useState } from 'react';
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
                    <span style={{ color: 'var(--ink-300)', margin: '0 8px' }}>·</span>
                    {r.pricing.length} tranches tarifaires
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

function SectionSecurity() {
  const [secToggles, setSecToggles] = useState({ twofa: false, session: true, alerts: true });
  const toggle = (k) => setSecToggles(t => ({ ...t, [k]: !t[k] }));
  return (
    <>
      <SettingsCard title="Authentification" sub="Sécurisez l'accès à votre plateforme.">
        <ToggleRow label="Double authentification (2FA)"          sub="Par SMS ou application TOTP"                          checked={secToggles.twofa}   onChange={() => toggle('twofa')} />
        <ToggleRow label="Session expirée après 8h d'inactivité"  sub="Reconnexion requise automatiquement"                  checked={secToggles.session} onChange={() => toggle('session')} />
        <ToggleRow label="Alertes connexion suspecte"              sub="Email lors d'une connexion depuis un nouvel appareil" checked={secToggles.alerts}  onChange={() => toggle('alerts')} />
      </SettingsCard>
      <SettingsCard title="Journal d'activité" sub="Historique des actions réalisées par les agents.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { t: '14:48', u: 'Aïcha M.', a: 'Paiement validé', obj: 'CLI-0418 · #01', kind: 'ok' },
            { t: '14:32', u: 'Marc L.',  a: 'Bordereau créé',  obj: 'BL-2604-01',     kind: 'info' },
            { t: '13:55', u: 'Aïcha M.', a: 'Cargaison clôturée', obj: 'DLA-YUL-APR-01', kind: 'warn' },
            { t: '13:21', u: 'Admin',    a: 'Agent invité',    obj: 'Thomas D.',      kind: 'neutral' },
          ].map((e, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-soft)', fontSize: 12.5 }}>
              <span className="mono" style={{ color: 'var(--ink-400)', width: 40, flexShrink: 0 }}>{e.t}</span>
              <span style={{ fontWeight: 600, color: 'var(--ink-700)', width: 80, flexShrink: 0 }}>{e.u}</span>
              <span className={'badge badge--' + e.kind} style={{ flexShrink: 0 }}>{e.a}</span>
              <span style={{ color: 'var(--ink-500)', fontFamily: 'var(--ff-mono)', fontSize: 12 }}>{e.obj}</span>
            </div>
          ))}
        </div>
        <a style={{ fontSize: 12, color: 'var(--brand-700)', fontWeight: 600, cursor: 'pointer', marginTop: 8, display: 'inline-block' }}>Voir journal complet →</a>
      </SettingsCard>
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
        <div className="field"><label className="label">Capacité max par défaut</label><input className="input" defaultValue="2000" type="number" /><div className="hint">kg</div></div>
      </div>
      <div className="field-row field-row--2">
        <div className="field"><label className="label">Devise par défaut</label><select className="select"><option>CAD</option><option>EUR</option><option>USD</option><option>XAF</option></select></div>
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

export default function SettingsScreen({ onNav }) {
  const [section, setSection] = useState('company');
  const [editRoute, setEditRoute] = useState(null);
  const [routeDetail, setRouteDetail] = useState(null);

  const nav = [
    { id: 'company',   l: 'Entreprise',           icon: I.Building },
    { id: 'routes',    l: 'Routes',               icon: I.Route,    badge: 'Nouveau' },
    { id: 'pricing',   l: 'Tarifs & facturation',  icon: I.Coins },
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
          {section === 'pricing'   && <SectionPricing />}
          {section === 'whatsapp'  && <SectionWhatsapp />}
          {section === 'auto'      && <SectionAutoNotif />}
          {section === 'campaigns' && <SectionCampaigns />}
          {section === 'codes'     && <SectionCodes />}
          {section === 'security'  && <SectionSecurity />}
        </div>
      </div>

      {editRoute && (
        <Modal width={600} onClose={() => setEditRoute(null)} title={editRoute === 'new' ? 'Nouvelle route' : 'Modifier la route'}>
          <div className="field-row field-row--2">
            <div className="field"><label className="label">Ville départ</label><input className="input" defaultValue={editRoute?.fromCity || ''} /></div>
            <div className="field"><label className="label">Ville arrivée</label><input className="input" defaultValue={editRoute?.toCity || ''} /></div>
          </div>
          <div className="field-row field-row--2">
            <div className="field"><label className="label">Code IATA départ</label><input className="input mono" defaultValue={editRoute?.fromIATA || ''} placeholder="DLA" /></div>
            <div className="field"><label className="label">Code IATA arrivée</label><input className="input mono" defaultValue={editRoute?.toIATA || ''} placeholder="YUL" /></div>
          </div>
          <div className="field-row field-row--2">
            <div className="field"><label className="label">Transit (jours)</label><input className="input" type="number" defaultValue={editRoute?.transitDays || 14} /></div>
            <div className="field"><label className="label">Devise</label><select className="select" defaultValue={editRoute?.currency || 'CAD'}><option>CAD</option><option>EUR</option><option>XAF</option></select></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button className="btn btn--ghost" onClick={() => setEditRoute(null)}>Annuler</button>
            <button className="btn btn--brand" onClick={() => setEditRoute(null)}><I.Check />Enregistrer</button>
          </div>
        </Modal>
      )}

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
            <div className="section-title">Grille tarifaire</div>
            <table className="tbl tbl--compact">
              <thead><tr><th style={{ borderRadius: 0 }}>De</th><th>À</th><th style={{ textAlign: 'right' }}>Prix/kg</th></tr></thead>
              <tbody>
                {routeDetail.pricing.map((p, i) => (
                  <tr key={i}>
                    <td className="mono">{p.from} kg</td>
                    <td className="mono">{p.to ? p.to + ' kg' : '∞'}</td>
                    <td style={{ textAlign: 'right' }}><span className="mono" style={{ fontWeight: 700 }}>{p.rate}</span> {routeDetail.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Drawer>
      )}
    </div>
  );
}
