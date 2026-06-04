'use client';
import { useNav } from '@/src/lib/nav';
import TrackingScreen from '@/src/client/Tracking';

export default function SuiviPage() {
  const onNav = useNav();
  return <TrackingScreen onNav={onNav} />;
}
