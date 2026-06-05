'use client';
import { useNav } from '@/src/lib/nav';
import CostsScreen from '@/src/screens/Costs';

export default function CostsPage() {
  const onNav = useNav();
  return <CostsScreen onNav={onNav} />;
}
