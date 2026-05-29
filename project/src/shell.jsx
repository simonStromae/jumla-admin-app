// ============================================
// ZENDIT — Shell: Sidebar + Topbar + helpers
// ============================================
const { useState, useEffect, useMemo, useCallback, useRef } = React;

// Bilingual label helper
const Bi = ({ fr, en, sep = '/' }) => (
  <span className="bi">
    <span>{fr}</span>
    {en && <span className="bi-en">{sep} {en}</span>}
  </span>
);

// Sidebar
function Sidebar({ route, onNav }) {
  const items = [
    { id: 'home',       label: 'Cargaisons',   en: 'Shipments',   icon: I.Plane,   route: '/' , count: 22 },
    { id: 'analytics',  label: 'Analyses',     en: 'Analytics',   icon: I.Activity, route: '/analytics' },
    { id: 'parcels',    label: 'Colis',        en: 'Parcels',     icon: I.Box,     route: '/parcels' },
    { id: 'slips',      label: 'Bordereaux',   en: 'Slips',       icon: I.FileText, route: '/slips' },
    { id: 'clients',    label: 'Clients',      en: 'Clients',     icon: I.Users,   route: '/clients', count: 312 },
    { id: 'payments',   label: 'Paiements',    en: 'Payments',    icon: I.Wallet,  route: '/payments', count: null },
    { id: 'messaging',  label: 'Messagerie',   en: 'Messaging',   icon: I.Chat,    route: '/messaging', count: null },
  ];
  const admin = [
    { id: 'agents',     label: 'Agents',       en: 'Agents',      icon: I.Users,     route: '/agents' },
    { id: 'settings',   label: 'Paramètres',   en: 'Settings',    icon: I.Settings,  route: '/settings' },
  ];
  const isActive = (r) => {
    if (r === '/') return route === '/' || route === '';
    return route.startsWith(r.split('/').slice(0,2).join('/'));
  };
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo">Z</div>
        <div>
          <div className="sidebar__name">Zendit</div>
          <div className="sidebar__org">Fret international</div>
        </div>
      </div>
      <nav className="sidebar__nav">
        <div className="sidebar__section">Opérations</div>
        {items.map(it => {
          const Ic = it.icon;
          return (
            <a key={it.id}
               className={'sidebar__link' + (isActive(it.route) ? ' is-active' : '')}
               onClick={() => onNav(it.route)}>
              <Ic /> <span>{it.label}</span>
              {it.count != null && <span className="count">{it.count}</span>}
            </a>
          );
        })}
        <div className="sidebar__section">Administration</div>
        {admin.map(it => {
          const Ic = it.icon;
          return (
            <a key={it.id}
               className={'sidebar__link' + (isActive(it.route) ? ' is-active' : '')}
               onClick={() => onNav(it.route)}>
              <Ic /> <span>{it.label}</span>
            </a>
          );
        })}
      </nav>
      <div className="sidebar__footer">
        <div className="sidebar__avatar">AM</div>
        <div className="sidebar__userinfo">
          <span className="sidebar__username">Aïcha Mbarga</span>
          <span className="sidebar__userrole">Admin · Douala</span>
        </div>
        <button className="icon-btn" title="Déconnexion" onClick={() => onNav('/login')}>
          <I.Logout />
        </button>
      </div>
    </aside>
  );
}

// Topbar
function Topbar({ title, sub, actions, onNav }) {
  const [lang, setLang] = useState('FR');
  return (
    <header className="topbar">
      <div>
        <span className="topbar__title">{title}</span>
        {sub && <span className="topbar__subtitle">· {sub}</span>}
      </div>
      <div className="topbar__spacer" />
      <div className="topbar__search">
        <I.Search style={{width:14,height:14}} />
        <span>Rechercher cargaisons, clients, bordereaux…</span>
        <kbd>⌘K</kbd>
      </div>
      <div className="topbar__lang">
        <button className={lang==='FR'?'is-active':''} onClick={() => setLang('FR')}>FR</button>
        <button className={lang==='EN'?'is-active':''} onClick={() => setLang('EN')}>EN</button>
      </div>
      <button className="icon-btn"><I.Help/></button>
      <button className="icon-btn"><I.Bell/><span className="dot"/></button>
      {actions}
    </header>
  );
}

// Shell layout
function Shell({ route, onNav, title, sub, actions, children, hideChrome }) {
  if (hideChrome) return children;
  return (
    <div className="app">
      <Sidebar route={route} onNav={onNav} />
      <main style={{ minWidth: 0 }}>
        <Topbar title={title} sub={sub} actions={actions} onNav={onNav} />
        {children}
      </main>
    </div>
  );
}

// Route pill — DLA → YUL
function RoutePill({ from, to, size }) {
  return (
    <span className="route-pill" style={size==='lg'?{padding:'5px 12px', fontSize:12}:{}}>
      <span>{from}</span>
      <I.Plane />
      <span>{to}</span>
    </span>
  );
}

// Modal helper
function Modal({ width = 720, onClose, title, sub, children, footer, ariaLabel }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width }} onClick={(e) => e.stopPropagation()} aria-label={ariaLabel}>
        {(title || sub) && (
          <div className="modal__head">
            <div style={{ flex: 1 }}>
              <div className="modal__title">{title}</div>
              {sub && <div className="modal__sub">{sub}</div>}
            </div>
            <button className="icon-btn" onClick={onClose}><I.Cross /></button>
          </div>
        )}
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </div>
  );
}

// Drawer (right-side)
function Drawer({ width = 540, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer" style={{ width }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// Status dot
function StatusDot({ kind, label }) {
  return <span className={'dot-status dot-status--'+kind}>{label}</span>;
}

// Avatar
function Avatar({ initials, color = 1, size }) {
  const sz = size === 'sm' ? 'avatar--sm' : size === 'lg' ? 'avatar--lg' : size === 'xl' ? 'avatar--xl' : '';
  return <span className={'avatar c-'+color+' '+sz}>{initials}</span>;
}

// Progress bar
function Progress({ pct, kind }) {
  const cls = kind === 'warn' ? 'prog--warn' : kind === 'bad' ? 'prog--bad' : '';
  return (
    <div className={'prog '+cls}>
      <div className="prog__fill" style={{ width: Math.min(100, Math.max(0, pct)) + '%' }}></div>
    </div>
  );
}

// Hash router
function useHashRoute() {
  const [route, setRoute] = useState(() => window.location.hash.replace(/^#/, '') || '/');
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash.replace(/^#/, '') || '/');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const nav = useCallback((r) => { window.location.hash = r; }, []);
  return [route, nav];
}

Object.assign(window, { Bi, Sidebar, Topbar, Shell, RoutePill, Modal, Drawer, StatusDot, Avatar, Progress, useHashRoute });
