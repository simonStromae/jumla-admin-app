'use client';
import { useNav } from '@/src/lib/nav';
import AgentsScreen from '@/src/screens/Agents';

export default function AgentDetailPage({ params }) {
  const onNav = useNav();
  return <AgentsScreen agentId={params.id} onNav={onNav} />;
}
