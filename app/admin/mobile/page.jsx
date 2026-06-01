'use client';
import { useNav } from '@/src/lib/nav';
import MobileScreen from '@/src/screens/Mobile';

export default function MobilePage() {
  const onNav = useNav();
  return <MobileScreen onNav={onNav} />;
}
