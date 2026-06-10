'use client';
import { useNav } from '@/src/lib/nav';
import LogsScreen from '@/src/screens/Logs';
import { PermGuard } from '@/src/components/Shell';

export default function LogsPage() {
  const onNav = useNav();
  return <PermGuard adminOnly><LogsScreen onNav={onNav} /></PermGuard>;
}
