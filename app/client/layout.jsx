'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import '@/src/styles/tokens.css';
import I from '@/src/components/Icons.jsx';

export default function ClientLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  if (status === 'loading') return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-soft)' }}>
      <header style={{
        background: 'white', borderBottom: '1px solid var(--border)',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', gap: 16,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #F5A524, #D97706)',
            display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 14, color: 'white',
          }}>J</div>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Jumla Shipping</span>
        </div>

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: 13, color: 'var(--ink-500)' }}>
          {session?.user?.name}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border)',
            background: 'white', fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
            color: 'var(--ink-600)',
          }}>
          <I.Logout style={{ width: 14, height: 14 }} />
          Déconnexion
        </button>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px' }}>
        {children}
      </div>
    </div>
  );
}
