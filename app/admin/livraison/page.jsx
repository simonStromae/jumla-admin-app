'use client';
import { useNav } from '@/src/lib/nav';
import LivraisonScreen from '@/src/screens/Livraison';
import { PermGuard } from '@/src/components/Shell';

export default function LivraisonPage() {
  const onNav = useNav();
  return <PermGuard perm="parcels"><LivraisonScreen onNav={onNav} /></PermGuard>;
}
