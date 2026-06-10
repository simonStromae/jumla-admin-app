'use client';
import { useNav } from '@/src/lib/nav';
import CostsScreen from '@/src/screens/Costs';
import { PermGuard } from '@/src/components/Shell';

export default function CostsPage() {
  const onNav = useNav();
  return <PermGuard perm="costs"><CostsScreen onNav={onNav} /></PermGuard>;
}
