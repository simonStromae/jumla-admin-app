'use client';
import { useNav } from '@/src/lib/nav';
import StatusWorkflowScreen from '@/src/screens/StatusWorkflow';

export default function StatusPage() {
  const onNav = useNav();
  return <StatusWorkflowScreen onNav={onNav} />;
}
