import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import I from './Icons.jsx';

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
  const [stats, setStats] = useState({ campaigns: 0, clients: 0, verifyPending: 0, unpaidPayments: 0 });

  useEffect(() => {
    fetch('/api/stats/sidebar').then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  const user     = session?.user;
  const name     = user?.name ?? '…';
  const role     = (user)?.role ?? '';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const items = [
    { id: 'home',      label: 'Cargaisons',   en: 'Shipments',    icon: I.Plane,    route: '/admin/campaigns', count: stats.campaigns || null },
    { id: 'analytics', label: 'Analyses',     en: 'Analytics',    icon: I.Activity, route: '/admin/analytics' },
    { id: 'parcels',   label: 'Colis',        en: 'Parcels',      icon: I.Box,      route: '/admin/parcels' },
    { id: 'verify',    label: 'Vérification', en: 'Arrival check',icon: I.Check,    route: '/admin/verify',    badge: stats.verifyPending || null },
    { id: 'clients',   label: 'Clients',      en: 'Clients',      icon: I.Users,    route: '/admin/clients',   count: stats.clients || null },
    { id: 'payments',  label: 'Paiements',    en: 'Payments',     icon: I.Wallet,   route: '/admin/payments',  badge: stats.unpaidPayments || null },
    { id: 'costs',     label: 'Coûts',        en: 'Cost tracking',icon: I.Coins,    route: '/admin/costs' },
    { id: 'messaging', label: 'Messagerie',   en: 'Messaging',    icon: I.Chat,     route: '/admin/messaging' },
  ];
  const admin = [
    { id: 'agents',   label: 'Agents',      en: 'Agents',    icon: I.Users,    route: '/admin/agents' },
    { id: 'logs',     label: 'Journal',     en: 'Activity',  icon: I.Activity, route: '/admin/logs' },
    { id: 'settings', label: 'Paramètres',  en: 'Settings',  icon: I.Settings, route: '/admin/settings' },
  ];
  const isActive = (r) => route === r || route.startsWith(r + '/');
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo">J</div>
        <div>
          <div className="sidebar__name">Jumla Shipping</div>
          <div className="sidebar__org">Fret international</div>
        </div>
      </div>
      <nav className="sidebar__nav">
        <div className="sidebar__section">Opérations</div>
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
        <div className="sidebar__section">Administration</div>
        {admin.map(it => {
          const Ic = it.icon;
          return (
            <a key={it.id} className={'sidebar__link' + (isActive(it.route) ? ' is-active' : '')} onClick={() => onNav(it.route)}>
              <Ic /> <span>{it.label}</span>
            </a>
          );
        })}
      </nav>
      <div className="sidebar__footer">
        <div className="sidebar__avatar" onClick={() => onNav('/admin/profile')} style={{ cursor: 'pointer' }}>{initials}</div>
        <div className="sidebar__userinfo" onClick={() => onNav('/admin/profile')} style={{ cursor: 'pointer' }}>
          <span className="sidebar__username">{name}</span>
          <span className="sidebar__userrole">{role === 'admin' ? 'Admin' : role === 'agent' ? 'Agent' : role}</span>
        </div>
        <button className="icon-btn" title="Déconnexion" onClick={() => signOut({ callbackUrl: '/login' })}>
          <I.Logout />
        </button>
      </div>
    </aside>
  );
}

export function Topbar({ title, sub, actions, onNav }) {
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
        {title && <div><span className="topbar__title">{title}</span>{sub && <span className="topbar__subtitle">· {sub}</span>}</div>}
        <div className="topbar__spacer" />
        <div className="topbar__search" onClick={() => setSearchOpen(true)} style={{ cursor: 'pointer' }}>
          <I.Search style={{ width: 14, height: 14 }} />
          <span>Rechercher cargaisons, clients, colis…</span>
          <kbd>⌘K</kbd>
        </div>
        <button className="icon-btn" title="Voir le site public" onClick={() => onNav?.('/')}><I.Globe /></button>
        <button className="icon-btn" title="Aide"><I.Help /></button>
        <button className="icon-btn" title="Paiements en attente" onClick={() => onNav?.('/admin/payments')}><I.Bell /></button>
        {actions}
      </header>

      {searchOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 600, display: 'flex', justifyContent: 'center', paddingTop: 80 }}
          onClick={e => e.target === e.currentTarget && (setSearchOpen(false), setSearchQ(''))}>
          <div style={{ width: 580, height: 'fit-content', borderRadius: 14, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,.28)' }}>
            <div style={{ background: 'white', padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <I.Search style={{ width: 18, height: 18, color: 'var(--ink-400)', flexShrink: 0 }} />
              <input ref={inputRef} value={searchQ} onChange={e => setSearchQ(e.target.value)} onKeyDown={handleKey}
                placeholder="Colis, client, cargaison… (Entrée pour chercher)"
                style={{ flex: 1, border: 0, outline: 0, fontSize: 16, color: 'var(--ink-900)', background: 'transparent' }} />
              <kbd style={{ fontSize: 11, color: 'var(--ink-400)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px' }}>Esc</kbd>
            </div>
            <div style={{ background: 'var(--bg-soft)', padding: '10px 18px', borderTop: '1px solid var(--border-soft)', fontSize: 12, color: 'var(--ink-400)' }}>
              Appuyez sur <strong>Entrée</strong> pour chercher dans les colis · <strong>Échap</strong> pour fermer
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function Shell({ route, onNav, title, sub, actions, children, hideChrome }) {
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

export function ParcelActionsMenu({ parcel, onNav, isLocked }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const payLink = `/payer/pay-${parcel.id}-demo`;

  const sections = [
    [
      { icon: I.Eye,  label: 'Voir le détail',  onClick: () => onNav('/parcels/' + parcel.id) },
      { icon: I.Edit, label: 'Modifier',         onClick: () => onNav('/parcels/' + parcel.id + '/edit'), disabled: isLocked },
    ],
    [
      { icon: I.Whatsapp, label: 'Lien paiement — WhatsApp', onClick: () => {}, green: true },
      { icon: I.Send,     label: 'Lien paiement — Email',    onClick: () => {} },
      { icon: I.Copy,     label: 'Copier le lien',           onClick: () => navigator.clipboard?.writeText(window.location.origin + payLink) },
    ],
    [
      { icon: I.Print, label: 'Imprimer le bordereau', onClick: () => {} },
    ],
    [
      { icon: I.Trash, label: 'Supprimer', onClick: () => {}, danger: true, disabled: isLocked },
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

