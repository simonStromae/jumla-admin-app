'use client';
import { useNav } from '@/src/lib/nav';
import AnalyticsScreen from '@/src/screens/Analytics';

export default function AnalyticsPage() {
  const onNav = useNav();
  return <AnalyticsScreen onNav={onNav} />;
}
