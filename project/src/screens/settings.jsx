// ============================================
// ZENDIT — Screen: Settings (incl. Routes)
// ============================================

function SettingsScreen({ onNav, initialSection }) {
  const [section, setSection] = useState(initialSection || 'company');
  const [editRoute, setEditRoute] = useState(null);
  const [routeDetail, setRouteDetail] = useState(null);

  const nav = [
    { id: 'company',  l: 'Entreprise',          en: 'Company',          icon: I.Building },
    { id: 'routes',   l: 'Routes',              en: 'Routes',           icon: I.Route,    badge: 'Nouveau' },
    { id: 'pricing',  l: 'Tarifs & facturation',en: 'Pricing',          icon: I.Coins },
    { id: 'whatsapp', l: 'WhatsApp',            en: 'WhatsApp',         icon: I.Whatsapp },
    { id: 'auto',     l: 'Auto-notifications',  en: 'Auto-notifs',      icon: I.Bell },
    { id: 'campaigns',l: 'Cargaisons',          en: 'Shipments',        icon: I.Plane },
    { id: 'codes',    l: 'Codes & numérotation',en: 'Code format',      icon: I.Tag },
    { id: 'security', l: 'Sécurité',            en: 'Security',         icon: I.Lock },
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
                padding: '8px 10px',
                borderRadius: 6,
                cursor: 'pointer',
                background: section === n.id ? 'var(--brand-50)' : 'transparent',
                color: section === n.id ? 'var(--brand-700)' : 'var(--ink-600)',
                fontWeight: section === n.id ? 600 : 500,
                fontSize: 13,
                marginBottom: 2,
              }}>
                <Ic style={{ width: 15, height: 15, opacity: .85 }} />
                <span style={{flex:1}}>{n.l}</span>
                {n.badge && <span style={{ fontSize: 9.5, padding: '1px 6px', borderRadius: 999, background: 'var(--brand-500)', color: 'white', fontWeight: 700 }}>{n.badge}</span>}
              </a>
            );
          })}
        </div>

        {/* Content */}
        <div>
          {section === 'company'  && <SectionCompany />}
          {section === 'routes'   && <SectionRoutes onEdit={setEditRoute} onDetail={setRouteDetail} />}
          {section === 'pricing'  && <SectionPricing />}
          {section === 'whatsapp' && <SectionWhatsapp />}
          {section === 'auto'     && <SectionAutoNotif />}
          {section === 'campaigns'&& <SectionCampaigns />}
          {section === 'codes'    && <SectionCodes />}
          {section === 'security' && <SectionSecurity />}
        </div>
      </div>

      {editRoute && <RouteEditModal route={editRoute === 'new' ? null : editRoute} onClose={() => setEditRoute(null)} />}
      {routeDetail && <RouteDetailDrawer route={routeDetail} onClose={() => setRouteDetail(null)} />}
    </div>
  );
}

// === Sections ===

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

function SectionCompany() {
  return (
    <>
      <SettingsCard title="Identité de l'entreprise" sub="Ces informations apparaissent sur vos bordereaux et messages clients.">
        <div className="field-row field-row--2">
          <div className="field">
            <label className="label">Nom commercial</label>
            <input className="input" defaultValue="Zendit Cargo" />
          </div>
          <div className="field">
            <label className="label">Raison sociale</label>
            <input className="input" defaultValue="Zendit International SARL" />
          </div>
        </div>
        <div className="field-row field-row--2">
          <div className="field">
            <label className="label">Téléphone Douala</label>
            <input className="input mono" defaultValue="+237 6** ** ** 00" />
          </div>
          <div className="field">
            <label className="label">Téléphone Montréal</label>
            <input className="input mono" defaultValue="+1 514 *** ****" />
          </div>
        </div>
        <div className="field">
          <label className="label">Adresse entrepôt arrivée <span className="opt">— utilisée dans <code style={{background:'var(--bg-soft)', padding:'1px 5px', borderRadius:3, fontSize:11}}>{'{warehouse_address}'}</code></span></label>
          <input className="input" defaultValue="5500 Place de la Savane, Lachine, QC H4S 1V8, Canada" />
        </div>
      </SettingsCard>
    </>
  );
}

function SectionRoutes({ onEdit, onDetail }) {
  return (
    <>
      <SettingsCard
        title="Routes commerciales"
        sub="Définissez les trajets que vous opérez. Chaque cargaison est rattachée à une route."
        actions={<button className="btn btn--brand btn--sm" onClick={() => onEdit('new')}><I.Plus />Nouvelle route</button>}>

        <div style={{ display: 'grid', gap: 10 }}>
          {window.DATA.ROUTES.map(r => (
            <div key={r.id} className="card" style={{ padding: 16, cursor: 'pointer', borderColor: r.active ? 'var(--border)' : 'var(--border-soft)' }}
                 onClick={() => onDetail(r)}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: r.active ? 'var(--brand-50)' : 'var(--bg-soft)',
                    color: r.active ? 'var(--brand-700)' : 'var(--ink-400)',
                    display: 'grid', placeItems: 'center',
                  }}>
                    <I.Plane style={{ width: 20, height: 20 }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-.01em' }}>{r.fromCity} → {r.toCity}</span>
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
                    <div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{r.parcelsTotal.toLocaleString('fr')}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>Colis</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ok-600)' }}>{(r.revenueTotal/1000).toFixed(0)}k</div>
                    <div style={{ fontSize: 10.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>CA · {r.currency}</div>
                  </div>
                  <button className="btn btn--ghost btn--sm" onClick={(e) => { e.stopPropagation(); onEdit(r); }}><I.Edit />Modifier</button>
                  <I.ChevronRight style={{ color: 'var(--ink-300)' }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, padding: 12, marginTop: 14, background: 'var(--info-50)', border: '1px solid var(--info-100)', borderRadius: 8 }}>
          <I.Info style={{ flex: '0 0 16px', color: 'var(--info-600)', marginTop: 1 }} />
          <div style={{ fontSize: 12.5, color: 'var(--ink-700)', lineHeight: 1.5 }}>
            <strong>Routes & cargaisons.</strong> Une route définit le trajet, la grille tarifaire par défaut, les entrepôts et les agents.
            Lors de la création d'une cargaison, ces valeurs sont héritées puis ajustables.
          </div>
        </div>
      </SettingsCard>
    </>
  );
}

function SectionPricing() {
  return (
    <SettingsCard title="Tarification globale" sub="Les routes peuvent surcharger ces valeurs. Modifiez ici les valeurs par défaut.">
      <div className="field-row field-row--3">
        <div className="field"><label className="label">Devise principale</label>
          <select className="select" defaultValue="CAD"><option>CAD</option><option>EUR</option><option>USD</option><option>XAF</option></select>
        </div>
        <div className="field"><label className="label">Tarif dépassement</label>
          <div style={{ position: 'relative' }}>
            <input className="input mono" defaultValue="22" style={{paddingRight:60}}/>
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)', fontSize: 11 }}>CAD/kg</span>
          </div>
        </div>
        <div className="field"><label className="label">Livraison domicile</label>
          <div style={{ position: 'relative' }}>
            <input className="input mono" defaultValue="25" style={{paddingRight:50}}/>
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)', fontSize: 11 }}>CAD</span>
          </div>
        </div>
      </div>
      <div className="section-title" style={{ marginTop: 16 }}>Taux de change <span className="section-title__count">3</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[['CAD/XAF', '447'], ['CAD/EUR', '0,68'], ['CAD/USD', '0,74']].map(([k, v]) => (
          <div key={k} style={{ padding: 12, background: 'var(--bg-soft)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>{k}</div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{v}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 2 }}>Mis à jour il y a 1 h</div>
          </div>
        ))}
      </div>
    </SettingsCard>
  );
}

function SectionWhatsapp() {
  return (
    <SettingsCard title="Intégration WhatsApp Business" sub="Connectez votre compte WhatsApp Business pour envoyer notifications et factures." actions={<span className="badge badge--dot badge--ok">Connecté</span>}>
      <div className="field-row field-row--2">
        <div className="field"><label className="label">Numéro Business</label><input className="input mono" defaultValue="+237 6** ** ** 00" /></div>
        <div className="field"><label className="label">Gateway / Provider</label>
          <select className="select" defaultValue="twilio"><option value="twilio">Twilio</option><option value="meta">Meta WhatsApp Cloud</option><option value="custom">Personnalisé</option></select>
        </div>
      </div>
      <div className="field"><label className="label">API Token <span className="opt">/ Auth token</span></label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input className="input mono" type="password" defaultValue="ACa0f7d2e9c8b1f5a3e0d8c2b9a1e5f7d3" style={{flex:1}}/>
          <button className="btn btn--ghost"><I.Eye/></button>
          <button className="btn btn--soft"><I.Copy/>Copier</button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, padding: 12, marginTop: 8, background: 'var(--ok-50)', border: '1px solid var(--ok-100)', borderRadius: 8 }}>
        <I.Check style={{ flex: '0 0 16px', color: 'var(--ok-600)', marginTop: 1 }} />
        <div style={{ flex: 1, fontSize: 12.5, color: 'var(--ok-700)' }}>
          <strong>Connexion établie.</strong> Dernier test : 26 avr. 14:30 — latence 240 ms · solde 4 218 messages
        </div>
        <button className="btn btn--ghost btn--sm">Tester</button>
      </div>
    </SettingsCard>
  );
}

function SectionAutoNotif() {
  const triggers = [
    { id: 'arrival',  l: 'Avis d\'arrivée',          d: 'Envoyé automatiquement quand la cargaison passe à "Arrivée"',     a: true },
    { id: 'reminder', l: 'Relance paiement J+3',    d: 'Envoyé 3 jours après l\'arrivée si paiement non confirmé',         a: true },
    { id: 'delivery', l: 'Confirmation de livraison',d: 'Envoyé à la validation du bordereau et libération du colis',      a: true },
    { id: 'overrun',  l: 'Alerte dépassement de poids', d: 'Envoyé à l\'expéditeur si le poids réel > poids réservé',      a: false },
    { id: 'invoice',  l: 'Facture automatique',     d: 'Envoyée au destinataire à la création du colis',                   a: true },
    { id: 'broadcast',l: 'Annonce nouvelle cargaison', d: 'Notifie les clients fidèles à l\'ouverture d\'une cargaison',   a: false },
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
            <a style={{ fontSize: 11.5, color: 'var(--brand-700)', fontWeight: 600 }}>Voir modèle →</a>
            <Toggle on={t.a} />
          </div>
        ))}
      </div>
    </SettingsCard>
  );
}

function Toggle({ on }) {
  const [val, setVal] = useState(on);
  return (
    <button onClick={() => setVal(!val)} style={{
      width: 36, height: 20, borderRadius: 999,
      background: val ? 'var(--brand-500)' : 'var(--ink-200)',
      border: 'none', cursor: 'pointer',
      position: 'relative', transition: 'background .15s',
    }}>
      <span style={{
        position: 'absolute', left: val ? 18 : 2, top: 2,
        width: 16, height: 16, borderRadius: 999, background: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,.2)',
        transition: 'left .15s',
      }} />
    </button>
  );
}

function SectionCampaigns() {
  return (
    <SettingsCard title="Cargaisons — règles globales" sub="Configurez le comportement par défaut à la création.">
      <div className="field-row field-row--2">
        <div className="field"><label className="label">Période moyenne</label>
          <select className="select"><option>2 cargaisons / mois (recommandé)</option><option>1 / mois</option><option>Hebdomadaire</option></select>
        </div>
        <div className="field"><label className="label">Capacité par défaut (kg)</label>
          <input className="input mono" defaultValue="2200" />
        </div>
      </div>
      <div className="field"><label className="label">Avant clôture, exiger</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
          {[
            'Tous les bordereaux validés',
            'Tous les paiements perçus ou tagués',
            'Vérification finale par un admin',
          ].map((t, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-700)' }}>
              <input type="checkbox" defaultChecked={i < 2} style={{accentColor:'var(--brand-500)'}}/>
              {t}
            </label>
          ))}
        </div>
      </div>
    </SettingsCard>
  );
}

function SectionCodes() {
  return (
    <SettingsCard title="Format des codes" sub="Personnalisez les codes auto-générés.">
      <div className="field-row field-row--2">
        <div className="field">
          <label className="label">Code cargaison</label>
          <input className="input mono" defaultValue="{ROUTE}-{MOIS3}-{NN}" />
          <div className="hint">Aperçu : <span className="mono" style={{color:'var(--ink-700)', fontWeight:600}}>DLA-YUL-MAY-01</span></div>
        </div>
        <div className="field">
          <label className="label">Code client</label>
          <input className="input mono" defaultValue="CL-{NNNN}" />
          <div className="hint">Aperçu : <span className="mono" style={{color:'var(--ink-700)', fontWeight:600}}>CL-0521</span></div>
        </div>
        <div className="field">
          <label className="label">Code bordereau</label>
          <input className="input mono" defaultValue="BL-{JJMM}-{NN}" />
          <div className="hint">Aperçu : <span className="mono" style={{color:'var(--ink-700)', fontWeight:600}}>BL-2604-01</span></div>
        </div>
        <div className="field">
          <label className="label">Code colis</label>
          <input className="input mono" defaultValue="#{NN}" />
          <div className="hint">Aperçu : <span className="mono" style={{color:'var(--ink-700)', fontWeight:600}}>#42</span></div>
        </div>
      </div>
    </SettingsCard>
  );
}

function SectionSecurity() {
  return (
    <SettingsCard title="Sécurité" sub="Authentification à deux facteurs, sessions et journaux d'audit.">
      <div style={{ display: 'flex', alignItems: 'center', padding: 14, background: 'var(--bg-soft)', borderRadius: 8, gap: 12, marginBottom: 12 }}>
        <I.Lock style={{ color: 'var(--brand-600)' }}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Authentification à deux facteurs (2FA)</div>
          <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>Code à 6 chiffres requis à la connexion sur un nouvel appareil.</div>
        </div>
        <Toggle on={true} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', padding: 14, background: 'var(--bg-soft)', borderRadius: 8, gap: 12, marginBottom: 12 }}>
        <I.Activity style={{ color: 'var(--brand-600)' }}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Journal d'audit</div>
          <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>Enregistre toutes les actions sensibles (paiements, clôtures, suppressions).</div>
        </div>
        <a className="btn btn--ghost btn--sm">Voir le journal →</a>
      </div>
    </SettingsCard>
  );
}

// === Route edit modal ===
function RouteEditModal({ route, onClose }) {
  const isNew = !route;
  const r = route || {
    fromCity: '', toCity: '', fromIATA: '', toIATA: '',
    transitDays: 14, currency: 'CAD', active: true,
    warehouseFrom: '', warehouseTo: '',
    agentFrom: 'Aïcha M.', agentTo: 'Marc L.',
    pricing: [{ from: 0, to: 5, rate: 18 }, { from: 5, to: 25, rate: 14 }],
  };

  return (
    <Modal width={760} onClose={onClose}
      title={<span>{isNew ? 'Nouvelle route' : 'Modifier la route'} <span style={{color:'var(--ink-400)', fontWeight:400, fontSize:'.85em', marginLeft:6}}>/ {isNew ? 'New route' : 'Edit route'}</span></span>}
      sub={isNew ? 'Définissez le trajet et ses paramètres par défaut' : `${r.fromCity} → ${r.toCity}`}
      footer={
        <>
          {!isNew && <button className="btn btn--ghost" style={{color:'var(--bad-600)'}}><I.Trash/>Archiver</button>}
          <div className="spacer" style={{flex:1}}/>
          <button className="btn btn--ghost" onClick={onClose}>Annuler</button>
          <button className="btn btn--brand" onClick={onClose}><I.Check />{isNew ? 'Créer' : 'Enregistrer'}</button>
        </>
      }>

      <div className="section-title">Trajet</div>
      <div className="field-row field-row--2">
        <div className="field"><label className="label">Ville de départ</label><input className="input" defaultValue={r.fromCity} placeholder="Douala"/></div>
        <div className="field"><label className="label">Ville d'arrivée</label><input className="input" defaultValue={r.toCity} placeholder="Montréal"/></div>
      </div>
      <div className="field-row field-row--3">
        <div className="field"><label className="label">Code IATA départ</label><input className="input mono" defaultValue={r.fromIATA} placeholder="DLA" maxLength={3}/></div>
        <div className="field"><label className="label">Code IATA arrivée</label><input className="input mono" defaultValue={r.toIATA} placeholder="YUL" maxLength={3}/></div>
        <div className="field"><label className="label">Transit (jours)</label><input className="input mono" type="number" defaultValue={r.transitDays}/></div>
      </div>
      <div className="field">
        <label className="label">Code route <span className="opt">/ Auto</span></label>
        <input className="input mono" defaultValue={r.code || (r.fromIATA && r.toIATA ? `${r.fromIATA} → ${r.toIATA}` : '')} readOnly style={{ background: 'var(--bg-soft)' }}/>
      </div>

      <div className="divider"></div>

      <div className="section-title">Entrepôts & équipe</div>
      <div className="field-row field-row--2">
        <div className="field"><label className="label">Entrepôt départ</label><input className="input" defaultValue={r.warehouseFrom} placeholder="Akwa, Douala"/></div>
        <div className="field"><label className="label">Entrepôt arrivée</label><input className="input" defaultValue={r.warehouseTo} placeholder="Lachine, Montréal"/></div>
      </div>
      <div className="field-row field-row--2">
        <div className="field"><label className="label">Agent par défaut origine</label>
          <select className="select" defaultValue={r.agentFrom}>
            <option>Aïcha M. — Douala</option><option>Tunde A. — Lagos</option><option>Karim O. — Douala</option>
          </select>
        </div>
        <div className="field"><label className="label">Agent par défaut destination</label>
          <select className="select" defaultValue={r.agentTo}>
            <option>Marc L. — Montréal</option><option>Sophie D. — Bruxelles</option>
          </select>
        </div>
      </div>

      <div className="divider"></div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div className="section-title" style={{ margin: 0 }}>Grille tarifaire par défaut</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>Devise</span>
          <select className="select input--sm" style={{ width: 90, height: 28 }} defaultValue={r.currency}>
            <option>CAD</option><option>EUR</option><option>USD</option><option>XAF</option>
          </select>
        </div>
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <table className="tbl tbl--compact" style={{borderRadius:0}}>
          <thead>
            <tr><th style={{borderRadius:0}}>De (kg)</th><th>À (kg)</th><th>Tarif / kg</th><th style={{borderRadius:0, width:30}}></th></tr>
          </thead>
          <tbody>
            {r.pricing.map((p, i) => (
              <tr key={i}>
                <td><input className="input input--sm mono" defaultValue={p.from}/></td>
                <td><input className="input input--sm mono" defaultValue={p.to}/></td>
                <td><input className="input input--sm mono" defaultValue={p.rate}/></td>
                <td><button className="icon-btn"><I.Trash style={{width:14, height:14}}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn btn--ghost btn--sm" style={{ marginTop: 8 }}><I.Plus />Ajouter une tranche</button>

      <div className="divider"></div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        <input type="checkbox" defaultChecked={r.active} style={{accentColor:'var(--brand-500)'}}/>
        <span>Route <strong>active</strong> — disponible à la création d'une cargaison</span>
      </label>
    </Modal>
  );
}

// === Route detail drawer ===
function RouteDetailDrawer({ route, onClose }) {
  const r = route;
  const cargos = window.DATA.CAMPAIGNS.filter(c => c.route === r.id);
  return (
    <Drawer width={580} onClose={onClose}>
      <div className="drawer__head">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>
            Détail route / Route detail
          </div>
        </div>
        <button className="icon-btn" onClick={onClose}><I.Cross /></button>
      </div>
      <div className="drawer__body">
        {/* Header */}
        <div style={{ padding: 22, borderBottom: '1px solid var(--border-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 12,
              background: 'var(--brand-50)', color: 'var(--brand-700)',
              display: 'grid', placeItems: 'center',
            }}><I.Plane style={{ width: 26, height: 26 }} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em' }}>{r.fromCity} → {r.toCity}</span>
                {r.active ? <span className="badge badge--dot badge--ok">Active</span> : <span className="badge badge--dot badge--neutral">Archivée</span>}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 4 }}>
                <RoutePill from={r.fromIATA} to={r.toIATA} /> <span style={{marginLeft: 8}}>{r.fromCountry} → {r.toCountry}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <Mini2 label="Transit" v={r.transitDays + ' j'} />
            <Mini2 label="Cargaisons" v={r.cargosCount} />
            <Mini2 label="Colis" v={r.parcelsTotal.toLocaleString('fr')} />
            <Mini2 label="CA cumulé" v={(r.revenueTotal/1000).toFixed(0)+'k'} unit={r.currency} />
          </div>
        </div>

        {/* Pricing */}
        <div style={{ padding: 22, borderBottom: '1px solid var(--border-soft)' }}>
          <div className="section-title">Grille tarifaire</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {r.pricing.map((p, i) => (
              <span key={i} className="mono" style={{ padding: '5px 10px', background: 'var(--bg-soft)', borderRadius: 999, fontSize: 11.5, fontWeight: 600 }}>
                {p.from}–{p.to} kg → {p.rate} {r.currency}/kg
              </span>
            ))}
          </div>
        </div>

        {/* Warehouses */}
        <div style={{ padding: 22, borderBottom: '1px solid var(--border-soft)' }}>
          <div className="section-title">Entrepôts & équipe</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Départ</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <I.Warehouse style={{ width: 14, height: 14, color: 'var(--ink-400)' }}/>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{r.warehouseFrom}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <Avatar initials={r.agentFrom.split(' ').map(x=>x[0]).join('')} color={1} size="sm" />
                <span style={{ fontSize: 12, color: 'var(--ink-600)' }}>{r.agentFrom}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Arrivée</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <I.Warehouse style={{ width: 14, height: 14, color: 'var(--ink-400)' }}/>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{r.warehouseTo}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <Avatar initials={r.agentTo.split(' ').map(x=>x[0]).join('')} color={2} size="sm" />
                <span style={{ fontSize: 12, color: 'var(--ink-600)' }}>{r.agentTo}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent cargos */}
        <div style={{ padding: 22 }}>
          <div className="section-title">Cargaisons récentes <span className="section-title__count">{cargos.length}</span></div>
          <table className="tbl tbl--compact">
            <thead>
              <tr><th style={{borderRadius:0}}>Code</th><th>Départ</th><th>Colis</th><th style={{borderRadius:0}}>Statut</th></tr>
            </thead>
            <tbody>
              {cargos.slice(0, 6).map(c => {
                const s = window.STATUS.campaign[c.status];
                return (
                  <tr key={c.id}>
                    <td className="mono" style={{ fontWeight: 600 }}>{c.code}</td>
                    <td style={{ fontSize: 12 }}>{c.dep}</td>
                    <td className="mono">{c.parcels}</td>
                    <td><StatusDot kind={s.dot} label={s.label} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="drawer__foot">
        <button className="btn btn--ghost" style={{flex:1, justifyContent:'center'}}><I.Edit />Modifier</button>
        <button className="btn btn--brand" style={{flex:1, justifyContent:'center'}}><I.Plus />Nouvelle cargaison</button>
      </div>
    </Drawer>
  );
}

window.SettingsScreen = SettingsScreen;
