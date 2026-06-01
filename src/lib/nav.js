'use client';
import { useRouter } from 'next/navigation';

export function adminPath(path) {
  if (!path || path === '/') return '/admin/campaigns';
  if (path === '/login') return '/login';
  if (path.startsWith('/campaign/')) return `/admin/campaigns/${path.slice(10)}`;
  if (path.startsWith('/slip/')) return `/admin/slips/${path.slice(6)}`;
  if (path.startsWith('/agent/')) return `/admin/agents/${path.slice(7)}`;
  return '/admin' + path;
}

export function useNav() {
  const router = useRouter();
  return (path) => router.push(adminPath(path));
}
