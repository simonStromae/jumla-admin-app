'use client';
import { useNav } from '@/src/lib/nav';
import VerifyHubScreen from '@/src/screens/VerifyHub';

export default function VerifyPage() {
  const onNav = useNav();
  return <VerifyHubScreen onNav={onNav} />;
}
