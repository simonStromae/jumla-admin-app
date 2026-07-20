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

  // Standalone pages — no sidebar/topbar (print, labels, receipts)
  if (
    pathname === '/admin/change-password' ||
    pathname.includes('/labels') ||
    pathname.endsWith('/print') ||
    pathname.startsWith('/admin/receipts/')
  ) {
    return <>{children}</>;
  }

  return (
    <Shell route={pathname} onNav={(path) => router.push(path)}>
      {children}
    </Shell>
  );
}
