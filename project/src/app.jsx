// ============================================
// ZENDIT — Main app + router
// ============================================

function App() {
  const [route, nav] = useHashRoute();
  const [showWizard, setShowWizard] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [closingCampaign, setClosingCampaign] = useState(null);

  // route parsing
  let screen = null;
  let title = '';
  let sub = '';
  let hideChrome = false;

  if (route === '/login' || route === '') {
    if (route === '/login') {
      hideChrome = true;
      screen = <LoginScreen onNav={nav} />;
    }
  }

  if (route === '/') {
    title = <Bi fr="Cargaisons" en="Shipments" />;
    sub = '2026';
    screen = <CampaignsScreen onNav={nav} onNewCampaign={() => setShowWizard(true)} />;
  } else if (route === '/analytics') {
    title = <Bi fr="Analyses" en="Analytics" />;
    sub = '2026';
    screen = <AnalyticsScreen onNav={nav} />;
  } else if (route === '/parcels') {
    title = <Bi fr="Tous les colis" en="All parcels" />;
    screen = <AllParcelsScreen onNav={nav} />;
  } else if (route === '/slips') {
    title = <Bi fr="Bordereaux" en="Slips" />;
    screen = <AllSlipsScreen onNav={nav} />;
  } else if (route.startsWith('/campaign/')) {
    const id = route.split('/')[2];
    const c = window.getCampaign(id);
    title = c?.code || 'Cargaison';
    sub = 'Détail';
    screen = <CampaignDetailScreen id={id} onNav={nav} onEdit={() => setEditingCampaign(c)} onClose={() => setClosingCampaign(c)} />;
  } else if (route.startsWith('/slip/')) {
    const id = route.split('/')[2];
    if (route.endsWith('/print')) {
      hideChrome = true;
      screen = <SlipPrintScreen onNav={nav} />;
    } else {
      title = 'Bordereau de livraison';
      sub = id;
      screen = <SlipDetailScreen id={id} onNav={nav} onPrint={() => nav('/slip/'+id+'/print')} />;
    }
  } else if (route === '/clients') {
    title = <Bi fr="Clients" en="Clients" />;
    screen = <ClientsScreen onNav={nav} />;
  } else if (route === '/payments') {
    title = <Bi fr="Paiements" en="Payments" />;
    screen = <PaymentsScreen onNav={nav} />;
  } else if (route === '/messaging') {
    title = <Bi fr="Messagerie" en="Messaging" />;
    screen = <MessagingScreen onNav={nav} />;
  } else if (route === '/agents') {
    title = <Bi fr="Agents" en="Agents" />;
    screen = <AgentsScreen onNav={nav} />;
  } else if (route.startsWith('/settings')) {
    const section = route.split('/')[2];
    title = <Bi fr="Paramètres" en="Settings" />;
    screen = <SettingsScreen onNav={nav} initialSection={section} />;
  } else if (route === '/mobile') {
    hideChrome = true;
    screen = <MobileScreen onNav={nav} />;
  } else if (route === '/login') {
    hideChrome = true;
    screen = <LoginScreen onNav={nav} />;
  }

  if (!screen) {
    title = '404';
    screen = <div className="page"><div className="card" style={{padding:30, textAlign:'center'}}>Écran non trouvé : {route}</div></div>;
  }

  return (
    <>
      <Shell route={route} onNav={nav} title={title} sub={sub} hideChrome={hideChrome}>
        {screen}
      </Shell>

      {showWizard && (
        <NewCampaignWizard
          onClose={() => setShowWizard(false)}
          onCreated={() => { setShowWizard(false); nav('/campaign/c1'); }}
        />
      )}
      {editingCampaign && (
        <NewCampaignWizard
          mode="edit"
          initial={{ code: editingCampaign.code, routeId: editingCampaign.route }}
          onClose={() => setEditingCampaign(null)}
          onCreated={() => setEditingCampaign(null)}
        />
      )}
      {closingCampaign && (
        <CloseCampaignModal
          id={closingCampaign.id}
          onClose={() => setClosingCampaign(null)}
          onConfirm={() => setClosingCampaign(null)}
        />
      )}

      {/* Quick-jump screen picker */}
      <ScreenPicker route={route} onNav={nav} />
    </>
  );
}

// ====== Screen Picker — floating ======
function ScreenPicker({ route, onNav }) {
  const [open, setOpen] = useState(false);

  const screens = [
    { sec: 'Auth',         items: [['Connexion', '/login']] },
    { sec: 'Opérations',   items: [
      ['Cargaisons (dashboard)', '/'],
      ['Analyses / Tableau de bord', '/analytics'],
      ['Détail cargaison', '/campaign/c1'],
      ['Tous les colis', '/parcels'],
      ['Tous les bordereaux', '/slips'],
      ['Bordereau (vue web)', '/slip/BL-2604-01'],
      ['Bordereau (imprimable)', '/slip/BL-2604-01/print'],
      ['Clients', '/clients'],
      ['Paiements', '/payments'],
      ['Messagerie WhatsApp', '/messaging'],
    ]},
    { sec: 'Administration', items: [
      ['Agents & permissions', '/agents'],
      ['Paramètres — Entreprise', '/settings/company'],
      ['Paramètres — Routes', '/settings/routes'],
      ['Paramètres — Tarifs', '/settings/pricing'],
      ['Paramètres — WhatsApp', '/settings/whatsapp'],
      ['Paramètres — Auto-notifs', '/settings/auto'],
    ]},
    { sec: 'Mobile', items: [
      ['Vue mobile — colis', '/mobile'],
    ]},
  ];

  return (
    <>
      <button onClick={() => setOpen(!open)} style={{
        position: 'fixed', right: 18, bottom: 18, zIndex: 100,
        background: 'var(--ink-900)', color: 'white',
        border: 'none', borderRadius: 12,
        padding: '10px 14px',
        fontSize: 12.5, fontWeight: 600,
        boxShadow: 'var(--sh-lg)',
        display: 'flex', alignItems: 'center', gap: 8,
        cursor: 'pointer',
      }}>
        <I.Menu style={{width:14, height:14}}/>
        Écrans
        <span style={{ fontSize: 10, background: 'rgba(255,255,255,.15)', padding: '1px 6px', borderRadius: 999, fontWeight: 700 }}>16</span>
      </button>
      {open && (
        <div style={{
          position: 'fixed', right: 18, bottom: 64, zIndex: 100,
          width: 280, maxHeight: 'calc(100vh - 100px)',
          background: 'white', borderRadius: 12,
          boxShadow: 'var(--sh-xl)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <I.Map style={{ width: 14, height: 14, color: 'var(--brand-600)' }} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>Navigation rapide</span>
            <div style={{flex:1}}/>
            <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => setOpen(false)}><I.Cross style={{ width: 12, height: 12 }}/></button>
          </div>
          <div style={{ overflowY: 'auto', padding: 6 }}>
            {screens.map(g => (
              <div key={g.sec} style={{ marginBottom: 6 }}>
                <div style={{ padding: '6px 10px', fontSize: 9.5, color: 'var(--ink-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>{g.sec}</div>
                {g.items.map(([l, r]) => (
                  <a key={r} onClick={() => { onNav(r); setOpen(false); }} style={{
                    display: 'flex', alignItems: 'center', padding: '6px 10px', borderRadius: 6,
                    fontSize: 12.5, cursor: 'pointer',
                    background: route === r ? 'var(--brand-50)' : 'transparent',
                    color: route === r ? 'var(--brand-700)' : 'var(--ink-700)',
                    fontWeight: route === r ? 600 : 500,
                  }}>
                    {l}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', fontSize: 10.5, color: 'var(--ink-400)' }}>
            Prototype cliquable · Zendit v2.4
          </div>
        </div>
      )}
    </>
  );
}

// ====== Mount ======
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
