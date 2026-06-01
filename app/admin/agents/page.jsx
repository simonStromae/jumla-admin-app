'use client';
import { useNav } from '@/src/lib/nav';
import AgentsScreen from '@/src/screens/Agents';

export default function AgentsPage() {
  const onNav = useNav();
  return <AgentsScreen onNav={onNav} />;
}
