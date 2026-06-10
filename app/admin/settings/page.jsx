'use client';
import { useNav } from '@/src/lib/nav';
import SettingsScreen from '@/src/screens/Settings';
import { PermGuard } from '@/src/components/Shell';

export default function SettingsPage() {
  const onNav = useNav();
  return <PermGuard adminOnly><SettingsScreen onNav={onNav} /></PermGuard>;
}
