'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Shell } from '@/src/components/Shell';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;
    if (session?.user?.mustChangePassword && pathname !== '/admin/change-password') {
      router.replace('/admin/change-password');
    }
  }, [session, status, pathname, router]);

  // Change-password page renders standalone, no sidebar
  if (pathname === '/admin/change-password') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-soft)' }}>
        {children}
      </div>
    );
  }

  return (
    <Shell route={pathname} onNav={(path) => router.push(path)}>
      {children}
    </Shell>
  );
}
