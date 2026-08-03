'use client';
import { useNav } from '@/src/lib/nav';
import PartenairesScreen from '@/src/screens/Partenaires';
import { PermGuard } from '@/src/components/Shell';

export default function PartenairesPage() {
  const onNav = useNav();
  return <PermGuard perm="parcels"><PartenairesScreen onNav={onNav} /></PermGuard>;
}
