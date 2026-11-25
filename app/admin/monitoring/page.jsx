'use client';
import { useNav } from '@/src/lib/nav';
import MonitoringScreen from '@/src/screens/Monitoring';
import { PermGuard } from '@/src/components/Shell';

export default function MonitoringPage() {
  const onNav = useNav();
  return <PermGuard adminOnly><MonitoringScreen onNav={onNav} /></PermGuard>;
}
