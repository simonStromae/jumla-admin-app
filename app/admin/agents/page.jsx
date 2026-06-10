'use client';
import { useNav } from '@/src/lib/nav';
import AgentsScreen from '@/src/screens/Agents';
import { PermGuard } from '@/src/components/Shell';

export default function AgentsPage() {
  const onNav = useNav();
  return <PermGuard adminOnly><AgentsScreen onNav={onNav} /></PermGuard>;
}
