'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import '@/src/styles/tokens.css';
import I from '@/src/components/Icons.jsx';

const NAV = [
  { label: 'Mes colis',      icon: I.Box,    href: '/client/dashboard' },
  { label: 'Réserver',       icon: I.Plus,   href: '/client/booking'   },
  { label: 'Suivi de colis', icon: I.Search, href: '/client/suivi'     },
  { label: 'Mon profil',     icon: I.Users,  href: '/client/profile'   },
];

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

  const user     = session?.user;
  const initials = (user?.name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-soft)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: 'white', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Brand */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--border-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: 'linear-gradient(135deg, #F5A524, #D97706)',
              display: 'grid', placeItems: 'center',
              fontWeight: 800, fontSize: 15, color: 'white',
              boxShadow: '0 3px 8px rgba(217,119,6,.3)',
            }}>J</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink-900)' }}>Jumla Shipping</div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>Espace client</div>
            </div>
          </div>
        </div>

        {/* Nav */}
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
                fontWeight: active ? 600 : 400,
                fontSize: 13.5,
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-soft)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Footer user */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px', borderRadius: 8, marginBottom: 6, background: 'var(--bg-soft)' }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg, #F5A524, #D97706)',
              display: 'grid', placeItems: 'center',
              fontWeight: 700, fontSize: 11, color: 'white', flexShrink: 0,
            }}>{initials}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
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

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <header style={{
          height: 52, background: 'white', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 28px', gap: 12,
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--ink-700)' }}>
            {NAV.find(n => pathname === n.href || pathname.startsWith(n.href + '/'))?.label ?? 'Espace client'}
          </div>
          <span style={{ fontSize: 12.5, color: 'var(--ink-500)' }}>
            Bonjour, <span style={{ fontWeight: 600, color: 'var(--ink-800)' }}>{user?.name?.split(' ')[0]}</span> 👋
          </span>
        </header>

        <div style={{ flex: 1, padding: '28px 32px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
