'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import '@/src/styles/tokens.css';
import I from '@/src/components/Icons.jsx';

const NAV_ALL = [
  { label: 'Mes colis',      icon: I.Box,        href: '/client/dashboard', suspendedOk: true  },
  { label: 'Réserver',       icon: I.Plus,       href: '/client/booking',   suspendedOk: false },
  { label: 'Suivi',          icon: I.Search,     href: '/client/suivi',     suspendedOk: true  },
  { label: 'Paiements',      icon: I.CreditCard, href: '/client/invoices',  suspendedOk: true  },
  { label: 'Profil',         icon: I.Users,      href: '/client/profile',   suspendedOk: true  },
];

function NotificationBell({ router }) {
  const [notifs, setNotifs]   = useState([]);
  const [open, setOpen]       = useState(false);
  const dropRef               = useRef(null);

  const load = async () => {
    try {
      const res  = await fetch('/api/me/notifications');
      const json = await res.json();
      if (json.notifications) setNotifs(json.notifications);
    } catch {}
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const unread = notifs.filter(n => !n.read).length;

  const handleOpen = async () => {
    setOpen(o => !o);
    if (!open && unread > 0) {
      await fetch('/api/me/notifications', { method: 'PATCH' });
      setNotifs(ns => ns.map(n => ({ ...n, read: true })));
    }
  };

  const fmtTime = (d) => {
    const diff = (Date.now() - new Date(d).getTime()) / 1000;
    if (diff < 60)    return 'À l\'instant';
    if (diff < 3600)  return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      <button onClick={handleOpen} style={{
        position: 'relative', width: 36, height: 36, borderRadius: 9,
        border: '1px solid var(--border)', background: open ? 'var(--brand-50)' : 'white',
        cursor: 'pointer', display: 'grid', placeItems: 'center',
        color: open ? 'var(--brand-600)' : 'var(--ink-500)',
      }}>
        <I.Bell style={{ width: 17, height: 17 }} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4, width: 17, height: 17,
            borderRadius: '50%', background: 'var(--bad-500)', color: 'white',
            fontSize: 10, fontWeight: 700, display: 'grid', placeItems: 'center',
            border: '2px solid white',
          }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 320,
          background: 'white', border: '1px solid var(--border)', borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,.12)', zIndex: 200, overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-soft)', fontWeight: 700, fontSize: 13 }}>
            Notifications
          </div>
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--ink-400)', fontSize: 13 }}>
                Aucune notification.
              </div>
            ) : notifs.map(n => (
              <div key={n.id} onClick={() => { setOpen(false); if (n.parcelId) router.push('/client/dashboard'); }}
                style={{
                  padding: '11px 16px', borderBottom: '1px solid var(--border-soft)',
                  background: n.read ? 'transparent' : 'var(--brand-50)',
                  cursor: 'pointer',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--ink-900)' }}>
                    {!n.read && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-500)', marginRight: 6, verticalAlign: 'middle' }} />}
                    {n.title}
                  </div>
                  <span style={{ fontSize: 10.5, color: 'var(--ink-400)', whiteSpace: 'nowrap' }}>{fmtTime(n.createdAt)}</span>
                </div>
                {n.body && <div style={{ fontSize: 11.5, color: 'var(--ink-500)', marginTop: 2, lineHeight: 1.4 }}>{n.body}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientLayout({ children }) {
  const { data: session, status } = useSession();
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  if (status === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-soft)' }}>
      <div style={{ color: 'var(--ink-400)', fontSize: 14 }}>Chargement…</div>
    </div>
  );

  // Print pages: no chrome
  if (pathname.startsWith('/client/invoice/') || pathname.startsWith('/client/bordereau/')) {
    return <>{children}</>;
  }

  const user      = session?.user;
  const suspended = user?.status === 'suspended';
  const NAV       = NAV_ALL.filter(n => !suspended || n.suspendedOk);
  const initials  = (user?.name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const sidebarNav = (
    <aside style={{
      width: 220, flexShrink: 0,
      background: 'white', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh',
    }}>
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--border-soft)' }}>
        <button onClick={() => router.push('/')} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'linear-gradient(135deg, #F5A524, #D97706)',
            display: 'grid', placeItems: 'center',
            fontWeight: 800, fontSize: 15, color: 'white',
          }}>J</div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink-900)' }}>Jumla Shipping</div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>Espace client</div>
          </div>
        </button>
      </div>
      <nav style={{ flex: 1, padding: '10px 8px' }}>
        {NAV.map(({ label, icon: Icon, href }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <button key={href} onClick={() => router.push(href)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '9px 10px', marginBottom: 2,
              borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
              background: active ? 'var(--brand-50)' : 'transparent',
              color:      active ? 'var(--brand-700)' : 'var(--ink-600)',
              fontWeight: active ? 600 : 400, fontSize: 13.5,
            }}>
              <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
              {label}
            </button>
          );
        })}
      </nav>
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px', borderRadius: 8, marginBottom: 6, background: 'var(--bg-soft)' }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg, #F5A524, #D97706)',
            display: 'grid', placeItems: 'center',
            fontWeight: 700, fontSize: 11, color: 'white', flexShrink: 0,
          }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: '/login' })} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          width: '100%', padding: '7px 10px', borderRadius: 7,
          border: '1px solid var(--border)', background: 'white',
          fontSize: 12.5, fontWeight: 500, cursor: 'pointer', color: 'var(--ink-600)',
        }}>
          <I.Logout style={{ width: 14, height: 14 }} />
          Déconnexion
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .desktop-sidebar { display: none !important; }
          .mobile-bottomnav { display: flex !important; }
          .main-content { padding-bottom: 72px !important; }
          .topbar-greeting { display: none !important; }
        }
        @media (min-width: 768px) {
          .desktop-sidebar { display: flex !important; }
          .mobile-bottomnav { display: none !important; }
        }
      `}</style>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-soft)' }}>
        <div className="desktop-sidebar">{sidebarNav}</div>

        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Topbar */}
          <header style={{
            height: 52, background: 'white', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12,
            position: 'sticky', top: 0, zIndex: 50,
          }}>
            {/* Mobile: logo */}
            <div className="mobile-logo" style={{ display: 'none' }}>
              <style>{`.mobile-logo { display: block; } @media (min-width: 768px) { .mobile-logo { display: none !important; } }`}</style>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: 'linear-gradient(135deg, #F5A524, #D97706)',
                display: 'grid', placeItems: 'center',
                fontWeight: 800, fontSize: 14, color: 'white',
              }}>J</div>
            </div>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--ink-700)' }}>
              {NAV.find(n => pathname === n.href || pathname.startsWith(n.href + '/'))?.label ?? 'Espace client'}
            </div>
            <NotificationBell router={router} />
            <span className="topbar-greeting" style={{ fontSize: 12.5, color: 'var(--ink-500)' }}>
              Bonjour, <span style={{ fontWeight: 600, color: 'var(--ink-800)' }}>{user?.name?.split(' ')[0]}</span>
            </span>
          </header>

          {suspended && (
            <div style={{
              background: 'var(--warn-50)', borderBottom: '1px solid var(--warn-200)',
              padding: '10px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>⚠️</span>
              <span style={{ color: 'var(--warn-700)', fontWeight: 600 }}>Compte suspendu</span>
              <span style={{ color: 'var(--warn-600)' }}>— Contactez-nous pour régulariser.</span>
            </div>
          )}

          <div className="main-content" style={{ flex: 1, padding: '24px 20px' }}>
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="mobile-bottomnav" style={{
          display: 'none',
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          background: 'white', borderTop: '1px solid var(--border)',
          padding: '8px 0 env(safe-area-inset-bottom, 8px)',
          justifyContent: 'space-around', alignItems: 'center',
        }}>
          {NAV.map(({ label, icon: Icon, href }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <button key={href} onClick={() => router.push(href)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px 12px',
                color: active ? 'var(--brand-600)' : 'var(--ink-400)',
                minWidth: 56,
              }}>
                <Icon style={{ width: 20, height: 20 }} />
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 400 }}>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
