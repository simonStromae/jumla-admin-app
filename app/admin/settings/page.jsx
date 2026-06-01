'use client';
import { useNav } from '@/src/lib/nav';
import SettingsScreen from '@/src/screens/Settings';

export default function SettingsPage() {
  const onNav = useNav();
  return <SettingsScreen onNav={onNav} />;
}
