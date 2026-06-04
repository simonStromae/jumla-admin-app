'use client';
import { useNav } from '@/src/lib/nav';
import LogsScreen from '@/src/screens/Logs';

export default function LogsPage() {
  const onNav = useNav();
  return <LogsScreen onNav={onNav} />;
}
