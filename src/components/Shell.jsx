import { useState, useEffect, useRef, Fragment } from 'react';
import { useSession, signOut } from 'next-auth/react';
import I from './Icons.jsx';
import { useCompanyAssets } from '../lib/useCompanyAssets.js';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import AdminOnboarding from './AdminOnboarding.jsx';
import HelpCenter from './HelpCenter.jsx';
import { useAdminT } from '../lib/useAdminT.js';

function useOnlineStatus() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  useEffect(() => {
    const up = () => setOnline(true);
    const dn = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', dn);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', dn); };
  }, []);
  return online;
}

const PERM_ALIAS = { campaigns: 'cargaisons' };

export function useCan() {
  const { data: session } = useSession();
  const role  = session?.user?.role ?? '';
  const perms = session?.user?.permissions ?? {};
  const isAdmin = role === 'admin';
  return (key, action) => {
    if (isAdmin) return true;
    if (perms[key] === true) return true;
    const nk = PERM_ALIAS[key] || key;
    const arr = perms[nk];
    if (Array.isArray(arr) && arr.length > 0) {
      if (!action) return true;
      return arr.includes(action);
    }
    // Fall back to admin sub-permissions (e.g. analytics/agents/settings stored in perms.admin[])
    if (Array.isArray(perms.admin) && perms.admin.includes(key)) return true;
    return false;
  };
}

function ForbiddenView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', gap: 14, padding: 40 }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--bad-50)', border: '1px solid var(--bad-100)', display: 'grid', placeItems: 'center' }}>
        <I.Lock style={{ width: 28, height: 28, color: 'var(--bad-500)' }} />
      </div>
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-900)', marginBottom: 8 }}>Accès restreint</div>
        <div style={{ fontSize: 13.5, color: 'var(--ink-500)', lineHeight: 1.6 }}>
          Vous ne disposez pas des permissions nécessaires pour accéder à cette section.
          Contactez un administrateur pour obtenir l'accès.
        </div>
      </div>
      <span style={{ fontSize: 11, fontFamily: 'var(--ff-mono)', color: 'var(--ink-300)', background: 'var(--bg-soft)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
        HTTP 403 — Forbidden
      </span>
    </div>
  );
}

export function PermGuard({ perm, action, adminOnly, children }) {
  const { data: session, status } = useSession();
  const can = useCan();
  if (status === 'loading') return null;
  if (adminOnly && session?.user?.role !== 'admin') return <ForbiddenView />;
  if (perm && !can(perm, action)) return <ForbiddenView />;
  return children;
}

export function Skel({ w = '100%', h = 14, r = 5, style = {} }) {
  return <span className="skel" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

export function Bi({ fr, en, sep = '/' }) {
  return (
    <span className="bi">
      <span>{fr}</span>
      {en && <span className="bi-en">{sep} {en}</span>}
    </span>
  );
}

export function Sidebar({ route, onNav }) {
  const { data: session } = useSession();
  const { logoIconUrl, logoIconSize } = useCompanyAssets();
  const t = useAdminT();
  const [stats, setStats] = useState({ campaigns: 0, clients: 0, verifyPending: 0, unpaidPayments: 0 });

  useEffect(() => {
    fetch('/api/stats/sidebar').then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  const user        = session?.user;
  const name        = user?.name ?? '…';
  const role        = user?.role ?? '';
  const perms       = user?.permissions ?? {};
  const isAdmin     = role === 'admin';
  const can = (key) => {
    if (isAdmin) return true;
    if (perms[key] === true) return true;
    const nk = PERM_ALIAS[key] || key;
    if (Array.isArray(perms[nk]) && perms[nk].length > 0) return true;
    if (Array.isArray(perms.admin) && perms.admin.includes(key)) return true;
    return false;
  };
  const initials    = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const allItems = [
    { id: 'dashboard', label: t.nav.dashboard,  icon: I.Home,   route: '/admin/dashboard',                                       perm: null },
    { id: 'home',      label: t.nav.campaigns,  icon: I.Plane,  route: '/admin/campaigns', count: stats.campaigns || null,      perm: 'campaigns' },
    { id: 'analytics', label: t.nav.analytics,  icon: I.Activity, route: '/admin/analytics',                                    perm: 'analytics' },
    { id: 'parcels',   label: t.nav.parcels,    icon: I.Box,    route: '/admin/parcels',                                        perm: 'parcels' },
    { id: 'livraison',    label: t.nav.livraison,    icon: I.Truck,    route: '/admin/livraison',    perm: 'parcels' },
    { id: 'partenaires', label: t.nav.partenaires, icon: I.Building, route: '/admin/partenaires', perm: 'parcels' },
    { id: 'verify',      label: t.nav.verify,      icon: I.Check,    route: '/admin/verify',      badge: stats.verifyPending || null, perm: 'campaigns' },
    { id: 'clients',   label: t.nav.clients,    icon: I.Users,  route: '/admin/clients',   count: stats.clients || null,        perm: null },
    { id: 'payments',  label: t.nav.payments,   icon: I.Wallet, route: '/admin/payments',  badge: stats.unpaidPayments || null, perm: 'payments' },
    { id: 'costs',     label: t.nav.costs,      icon: I.Coins,  route: '/admin/costs',                                          perm: 'costs' },
    { id: 'airlines',  label: t.nav.airlines,   icon: I.Plane,  route: '/admin/airlines',                                       perm: 'campaigns' },
    { id: 'messaging', label: t.nav.messaging,  icon: I.Chat,   route: '/admin/messaging',                                      perm: 'whatsapp' },
  ];
  const items = allItems.filter(it => it.perm === null || can(it.perm));

  const admin = [
    { id: 'agents',   label: t.nav.agents,   icon: I.Users,    route: '/admin/agents',   perm: 'agents' },
    { id: 'logs',     label: t.nav.logs,     icon: I.Activity, route: '/admin/logs',     perm: 'analytics' },
    { id: 'settings', label: t.nav.settings, icon: I.Settings, route: '/admin/settings', perm: 'settings' },
  ];
  // An agent with any admin sub-permission should see the Administration section
  const hasAdminSubPerm = !isAdmin && Array.isArray(perms.admin) && perms.admin.length > 0;
  const visibleAdmin = isAdmin ? admin : admin.filter(it => (perms.admin || []).includes(it.perm));

  const isActive = (r) => route === r || route.startsWith(r + '/');
  const onSettings = isActive('/admin/settings');

  const [settingsTab, setSettingsTab] = useState(() =>
    typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('tab') ?? 'company') : 'company'
  );

  useEffect(() => {
    const handler = (e) => setSettingsTab(e.detail ?? 'company');
    window.addEventListener('jumla:nav-settings', handler);
    return () => window.removeEventListener('jumla:nav-settings', handler);
  }, []);

  const settingsSubs = [
    { id: 'company',   label: t.settingsTabs.company,   icon: I.Building },
    { id: 'landing',   label: t.settingsTabs.landing,   icon: I.Globe },
    { id: 'routes',    label: t.settingsTabs.routes,    icon: I.Route },
    { id: 'whatsapp',  label: t.settingsTabs.whatsapp,  icon: I.Chat },
    { id: 'auto',      label: t.settingsTabs.auto,      icon: I.Bell },
    { id: 'campaigns', label: t.settingsTabs.campaigns, icon: I.Plane },
    { id: 'codes',     label: t.settingsTabs.codes,     icon: I.Tag },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo" style={logoIconUrl ? { background: 'white', border: '1px solid var(--border-soft)' } : {}}>
          {logoIconUrl
            ? <img src={logoIconUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }} />
            : <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                <defs><linearGradient id="slg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#00B4D8"/><stop offset="100%" stopColor="#1B4FD8"/></linearGradient></defs>
                <path d="M8 8 C8 6 10 4 12 5 L38 20 C40 21 40 27 38 28 L12 43 C10 44 8 42 8 40 Z" fill="url(#slg)"/>
              </svg>
          }
        </div>
        <div>
          <div className="sidebar__name">Jumla Shipping</div>
          <div className="sidebar__org">Fret international</div>
        </div>
      </div>
      <nav className="sidebar__nav">
        <div className="sidebar__section">{t.nav.operations}</div>
        {items.map(it => {
          const Ic = it.icon;
          return (
            <a key={it.id} className={'sidebar__link' + (isActive(it.route) ? ' is-active' : '')} onClick={() => onNav(it.route)}>
              <Ic /> <span>{it.label}</span>
              {it.count != null && <span className="count">{it.count}</span>}
              {it.badge != null && (
                <span style={{ marginLeft: 'auto', minWidth: 18, height: 18, borderRadius: 999, background: 'var(--bad-500)', color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                  {it.badge}
                </span>
              )}
            </a>
          );
        })}
        {(isAdmin || hasAdminSubPerm) && <>
          <div className="sidebar__section">{t.nav.administration}</div>
          {visibleAdmin.map(it => {
            const Ic = it.icon;
            if (it.id === 'settings') {
              return (
                <Fragment key={it.id}>
                  <a className={'sidebar__link' + (onSettings ? ' is-active' : '')} onClick={() => onNav(it.route)}>
                    <Ic /> <span style={{ flex: 1 }}>Paramètres</span>
                    <span style={{ fontSize: 10, color: 'var(--ink-400)', transition: 'transform .2s', display: 'inline-block', transform: onSettings ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                  </a>
                  {onSettings && settingsSubs.map(sub => {
                    const SubIc = sub.icon;
                    const active = settingsTab === sub.id;
                    return (
                      <a key={sub.id}
                         className={'sidebar__link' + (active ? ' is-active' : '')}
                         style={{ paddingLeft: 30, fontSize: 12.5 }}
                         onClick={() => {
                           if (onSettings) {
                             setSettingsTab(sub.id);
                             window.dispatchEvent(new CustomEvent('jumla:nav-settings', { detail: sub.id }));
                             history.pushState({}, '', `/admin/settings?tab=${sub.id}`);
                           } else {
                             onNav(`/admin/settings?tab=${sub.id}`);
                           }
                         }}>
                        <SubIc style={{ width: 14, height: 14 }} />
                        <span>{sub.label}</span>
                      </a>
                    );
                  })}
                </Fragment>
              );
            }
            return (
              <a key={it.id} className={'sidebar__link' + (isActive(it.route) ? ' is-active' : '')} onClick={() => onNav(it.route)}>
                <Ic /> <span>{it.label}</span>
              </a>
            );
          })}
        </>}
      </nav>
      <div className="sidebar__footer">
        <div className="sidebar__avatar" onClick={() => onNav('/admin/profile')} style={{ cursor: 'pointer' }}>{initials}</div>
        <div className="sidebar__userinfo" onClick={() => onNav('/admin/profile')} style={{ cursor: 'pointer' }}>
          <span className="sidebar__username">{name}</span>
          <span className="sidebar__userrole">{role === 'admin' ? 'Admin' : role === 'agent' ? 'Agent' : role}</span>
        </div>
        <button className="icon-btn" title={t.topbar.logout} onClick={() => signOut({ callbackUrl: '/login' })}>
          <I.Logout />
        </button>
      </div>
    </aside>
  );
}

export function Topbar({ title, sub, actions, onNav, onToggleSidebar, sidebarOpen }) {
  const t = useAdminT();
  const { data: session } = useSession();
  const isAgentOnly = session?.user?.role === 'agent';
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ]     = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [searchOpen]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleKey = (e) => {
    if (e.key === 'Enter' && searchQ.trim()) {
      onNav?.('/admin/parcels?q=' + encodeURIComponent(searchQ.trim()));
      setSearchOpen(false); setSearchQ('');
    }
    if (e.key === 'Escape') { setSearchOpen(false); setSearchQ(''); }
  };

  return (
    <>
      <header className="topbar">
        <button className="icon-btn sidebar-toggle-btn" onClick={onToggleSidebar} title={sidebarOpen ? t.topbar.closeSidebar : t.topbar.openSidebar}>
          <I.Menu />
        </button>
        {title && <div><span className="topbar__title">{title}</span>{sub && <span className="topbar__subtitle">· {sub}</span>}</div>}
        <div className="topbar__spacer" />
        <div className="topbar__search" onClick={() => setSearchOpen(true)} style={{ cursor: 'pointer' }}>
          <I.Search style={{ width: 14, height: 14 }} />
          <span>{t.topbar.search}</span>
          <kbd>⌘K</kbd>
        </div>
        <LanguageSwitcher />
        {isAgentOnly && (
          <button className="icon-btn" title={t.topbar.fieldView ?? 'Vue terrain'} onClick={() => onNav?.('/agent/dashboard')}>
            <I.Scan />
          </button>
        )}
        <button className="icon-btn" title={t.topbar.viewSite} onClick={() => onNav?.('/')}><I.Globe /></button>
        <button className="icon-btn" title={t.topbar.help}><I.Help /></button>
        <button className="icon-btn" title={t.topbar.pendingPayments} onClick={() => onNav?.('/admin/payments')}><I.Bell /></button>
        {actions}
      </header>

      {searchOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 600, display: 'flex', justifyContent: 'center', paddingTop: 80 }}
          onClick={e => e.target === e.currentTarget && (setSearchOpen(false), setSearchQ(''))}>
          <div style={{ width: 580, height: 'fit-content', borderRadius: 14, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,.28)' }}>
            <div style={{ background: 'white', padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <I.Search style={{ width: 18, height: 18, color: 'var(--ink-400)', flexShrink: 0 }} />
              <input ref={inputRef} value={searchQ} onChange={e => setSearchQ(e.target.value)} onKeyDown={handleKey}
                placeholder={t.topbar.searchPlaceholder}
                style={{ flex: 1, border: 0, outline: 0, fontSize: 16, color: 'var(--ink-900)', background: 'transparent' }} />
              <kbd style={{ fontSize: 11, color: 'var(--ink-400)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px' }}>Esc</kbd>
            </div>
            <div style={{ background: 'var(--bg-soft)', padding: '10px 18px', borderTop: '1px solid var(--border-soft)', fontSize: 12, color: 'var(--ink-400)' }}>
              {t.topbar.searchHint}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AdminMobileBlock() {
  return (
    <>
      <style>{`
        @media (max-width: 599px) { .admin-mobile-block { display: flex !important; } .app { display: none !important; } }
        @media (min-width: 600px) { .admin-mobile-block { display: none !important; } }
        @media print { .admin-mobile-block { display: none !important; } .app { display: grid !important; } }
      `}</style>
      <div className="admin-mobile-block" style={{
        display: 'none', position: 'fixed', inset: 0, zIndex: 9999,
        background: 'linear-gradient(155deg, #1A1A2E 0%, #0D2E6E 55%, #1B4FD8 100%)',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 32, textAlign: 'center', color: 'white',
      }}>
        <div style={{ fontSize: 56, marginBottom: 24 }}>💻</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.01em', marginBottom: 12 }}>
          Interface non disponible sur mobile
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,.65)', lineHeight: 1.7, maxWidth: 340, marginBottom: 32 }}>
          L'espace d'administration Jumla est optimisé pour les tablettes et les grands écrans.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 280 }}>
          {[
            { icon: '🖥️', label: 'Ordinateur de bureau' },
            { icon: '💻', label: 'Ordinateur portable' },
            { icon: '📱', label: 'Tablette (≥ 600px)' },
          ].map(({ icon, label }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(255,255,255,.1)', borderRadius: 10,
              padding: '12px 16px', fontSize: 13.5, color: 'rgba(255,255,255,.9)',
            }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <a href="/" style={{
          marginTop: 32, fontSize: 13, color: 'rgba(255,255,255,.5)',
          textDecoration: 'underline', cursor: 'pointer',
        }}>
          Retour au site public →
        </a>
      </div>
    </>
  );
}

export function Shell({ route, onNav, title, sub, actions, children, hideChrome }) {
  const online = useOnlineStatus();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('jumla_sidebar');
    if (saved !== null) return saved === 'open';
    return window.innerWidth >= 900;
  });

  const toggleSidebar = () => {
    setSidebarOpen(v => {
      const next = !v;
      localStorage.setItem('jumla_sidebar', next ? 'open' : 'closed');
      return next;
    });
  };

  // Auto-close sidebar on tablet after navigation
  const handleNav = (path) => {
    onNav(path);
    if (typeof window !== 'undefined' && window.innerWidth < 900) {
      setSidebarOpen(false);
      localStorage.setItem('jumla_sidebar', 'closed');
    }
  };

  if (hideChrome) return children;
  return (
    <>
      <AdminMobileBlock />
      <AdminOnboarding />
      <HelpCenter variant="admin" />
      <div className={'app' + (sidebarOpen ? ' sidebar--open' : '')}>
        {/* Backdrop — visible on tablet only via CSS */}
        {sidebarOpen && (
          <div className="sidebar-backdrop" onClick={() => { setSidebarOpen(false); localStorage.setItem('jumla_sidebar', 'closed'); }} />
        )}
        <Sidebar route={route} onNav={handleNav} />
        <main style={{ minWidth: 0 }}>
          <Topbar title={title} sub={sub} actions={actions} onNav={onNav} onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
          {!online && (
            <div style={{
              background: '#1f2937', color: 'white',
              padding: '9px 20px', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 10,
              borderBottom: '1px solid #374151',
            }}>
              <span style={{ fontSize: 15 }}>⚡</span>
              <span style={{ flex: 1 }}>Pas de connexion réseau — les sauvegardes sont suspendues jusqu'au retour du réseau.</span>
            </div>
          )}
          {children}
        </main>
      </div>
    </>
  );
}

export function RoutePill({ from, to, size }) {
  return (
    <span className="route-pill" style={size === 'lg' ? { padding: '5px 12px', fontSize: 12 } : {}}>
      <span>{from}</span>
      <I.Plane />
      <span>{to}</span>
    </span>
  );
}

export function Modal({ width = 720, onClose, title, sub, children, footer, ariaLabel }) {
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

export function Drawer({ width = 540, onClose, children }) {
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

export function StatusDot({ kind, label }) {
  return <span className={'dot-status dot-status--' + kind}>{label}</span>;
}

export function Avatar({ initials, color = 1, size }) {
  const sz = size === 'sm' ? 'avatar--sm' : size === 'lg' ? 'avatar--lg' : size === 'xl' ? 'avatar--xl' : '';
  return <span className={'avatar c-' + color + ' ' + sz}>{initials}</span>;
}

export function Progress({ pct, kind }) {
  const cls = kind === 'warn' ? 'prog--warn' : kind === 'bad' ? 'prog--bad' : '';
  return (
    <div className={'prog ' + cls}>
      <div className="prog__fill" style={{ width: Math.min(100, Math.max(0, pct)) + '%' }}></div>
    </div>
  );
}

export function ParcelActionsMenu({ parcel, onNav, isLocked, onDelete, onCancel }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const payLink = `/payer/${parcel.id}`;

  const sections = [
    [
      { icon: I.Eye,   label: 'Voir le détail',          onClick: () => onNav('/parcels/' + parcel.id) },
      { icon: I.Edit,  label: 'Modifier',                onClick: () => onNav('/parcels/' + parcel.id + '/edit'), disabled: isLocked },
    ],
    [
      { icon: I.Print, label: 'Bordereau du colis',      onClick: () => onNav('/admin/slips/' + parcel.id) },
    ],
    [
      ...(onCancel ? [{ icon: I.Ban, label: 'Annuler la réservation', onClick: () => onCancel(), disabled: isLocked }] : []),
      { icon: I.Trash, label: 'Supprimer', onClick: () => onDelete?.(), danger: true, disabled: isLocked || !onDelete },
    ],
  ];

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        className="icon-btn"
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        style={{ background: open ? 'var(--bg-soft)' : undefined }}
      >
        <I.More />
      </button>

      {open && (
        <div onClick={e => e.stopPropagation()} style={{
          position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 200,
          background: 'white', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', boxShadow: 'var(--sh-lg)',
          minWidth: 220, padding: '4px 0',
        }}>
          {sections.map((group, gi) => (
            <div key={gi}>
              {gi > 0 && <div style={{ height: 1, background: 'var(--border-soft)', margin: '4px 0' }} />}
              {group.map((item, ii) => (
                <button key={ii}
                  disabled={item.disabled}
                  onClick={() => { setOpen(false); item.onClick(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '8px 14px',
                    background: 'none', border: 'none',
                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                    fontSize: 13, fontWeight: 500, textAlign: 'left',
                    color: item.danger ? 'var(--bad-600)' : item.green ? 'var(--ok-600)' : item.disabled ? 'var(--ink-300)' : 'var(--ink-700)',
                  }}
                  onMouseEnter={e => { if (!item.disabled) e.currentTarget.style.background = 'var(--bg-soft)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                >
                  <item.icon style={{ width: 14, height: 14, opacity: item.disabled ? 0.4 : 1, flexShrink: 0 }} />
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

