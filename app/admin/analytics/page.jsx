'use client';
import { useNav } from '@/src/lib/nav';
import AnalyticsScreen from '@/src/screens/Analytics';
import { PermGuard } from '@/src/components/Shell';

export default function AnalyticsPage() {
  const onNav = useNav();
  return <PermGuard perm="analytics"><AnalyticsScreen onNav={onNav} /></PermGuard>;
}
