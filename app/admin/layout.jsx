'use client';
import { usePathname, useRouter } from 'next/navigation';
import { Shell } from '@/src/components/Shell';
import { adminPath } from '@/src/lib/nav';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <Shell route={pathname} onNav={(path) => router.push(adminPath(path))}>
      {children}
    </Shell>
  );
}
