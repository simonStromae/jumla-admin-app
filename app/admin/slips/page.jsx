'use client';
import { useNav } from '@/src/lib/nav';
import AllSlipsScreen from '@/src/screens/AllSlips';

export default function SlipsPage() {
  const onNav = useNav();
  return <AllSlipsScreen onNav={onNav} />;
}
