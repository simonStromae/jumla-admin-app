'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import '@/src/styles/tokens.css';
import { useCompanyAssets } from '@/src/lib/useCompanyAssets';

const NAV = [
  { label: 'Tableau', icon: HomeIcon,   href: '/agent/dashboard' },
  { label: 'Colis',   icon: BoxIcon,    href: '/agent/parcels'   },
  { label: 'Scan',    icon: ScanIcon,   href: '/agent/scan'      },
  { label: 'Admin',   icon: AdminIcon,  href: '/admin/dashboard' },
];

function HomeIcon({ style }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function BoxIcon({ style }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
}
function ScanIcon({ style }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/>
      <rect x="2" y="14" width="8" height="8" rx="1"/>
      <path d="M14 14h2v2h-2zM18 14h2M14 18h2M18 18h2v2h-2zM14 22h2M20 14v2"/>
    </svg>
  );
}
function AdminIcon({ style }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  );
}

export default function AgentLayout({ children }) {
  const { data: session, status } = useSession();
  const router   = useRouter();
  const pathname = usePathname();
  const { logoUrl, logoIconUrl, logoHeight, logoIconSize } = useCompanyAssets();

  const userName = session?.user?.name ?? session?.user?.email ?? 'Agent';
  const initials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') {
      const role = session?.user?.role;
      if (role !== 'admin' && role !== 'agent') router.push('/client/dashboard');
    }
  }, [status, session, router]);

  if (status === 'loading') return (
    <div style={{ minHeight: '100svh', display: 'grid', placeItems: 'center', background: '#F7F8FA' }}>
      <div style={{ color: '#6B7280', fontSize: 14 }}>Chargement…</div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100svh', display: 'flex', flexDirection: 'column',
      background: '#F7F8FA', maxWidth: 520, margin: '0 auto',
      position: 'relative',
    }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Inter', -apple-system, sans-serif; }
        .agent-card {
          background: white; border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.04);
        }
        .agent-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 7px;
          padding: 0 18px; height: 44px; border-radius: 10px; border: none;
          font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit;
          transition: opacity .15s;
        }
        .agent-btn:active { opacity: .75; }
        .agent-btn--brand  { background: #1B4FD8; color: white; }
        .agent-btn--green  { background: #10B981; color: white; }
        .agent-btn--ghost  { background: #F4F5F7; color: #374151; }
        .agent-btn--danger { background: #FEE2E2; color: #DC2626; }
        .agent-btn--wa     { background: #25D366; color: white; }
        .agent-btn--full   { width: 100%; }
        .agent-input {
          width: 100%; padding: 12px 14px; border-radius: 10px;
          border: 1.5px solid #E5E7EB; font-size: 15px; font-family: inherit;
          background: white; outline: none; transition: border-color .15s;
        }
        .agent-input:focus { border-color: #1B4FD8; }
        .pill {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600;
        }
        .pill--green  { background: #ECFDF5; color: #047857; }
        .pill--blue   { background: #EFF6FF; color: #1d4ed8; }
        .pill--orange { background: #FFFBEB; color: #B45309; }
        .pill--red    { background: #FEF2F2; color: #B91C1C; }
        .pill--gray   { background: #F4F5F7; color: #4B5563; }
        .pill--cyan   { background: #E0F9FF; color: #0087A8; }
        @media (prefers-color-scheme: dark) {
          body { background: #111827; color: #F9FAFB; }
        }
      `}</style>

      {/* Top header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: 52, background: 'white',
        borderBottom: '1px solid #E5E7EB', flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {(logoIconUrl || logoUrl) ? (
            <img
              src={logoIconUrl || logoUrl}
              alt="Logo"
              style={{ height: logoIconUrl ? logoIconSize : logoHeight, maxHeight: 36, objectFit: 'contain' }}
            />
          ) : (
            <span style={{ fontWeight: 700, fontSize: 16, color: '#1B4FD8', letterSpacing: '-0.3px' }}>Jumla</span>
          )}
        </div>

        {/* Right: avatar + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Avatar / initials */}
          <div style={{
            width: 34, height: 34, borderRadius: '50%', background: '#EFF6FF',
            color: '#1B4FD8', fontWeight: 700, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {initials}
          </div>

          {/* Logout */}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Se déconnecter"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 34, height: 34, borderRadius: 8, border: 'none',
              background: '#FEE2E2', color: '#DC2626', cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 17, height: 17 }}>
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Main scrollable content */}
      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 72 }}>
        {children}
      </main>

      {/* Bottom navigation */}
      <nav style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 520,
        background: 'white', borderTop: '1px solid #E5E7EB',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        height: 60, paddingBottom: 'env(safe-area-inset-bottom, 0)',
        zIndex: 100,
      }}>
        {NAV.map(({ label, icon: Icon, href }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <button key={href} onClick={() => router.push(href)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              background: 'none', border: 'none', cursor: 'pointer', padding: '6px 16px',
              color: active ? '#1B4FD8' : '#6B7280', minWidth: 60,
            }}>
              <Icon style={{ width: 22, height: 22 }} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
