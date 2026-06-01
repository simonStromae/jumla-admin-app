'use client';
import { useNav } from '@/src/lib/nav';
import AllParcelsScreen from '@/src/screens/AllParcels';

export default function ParcelsPage() {
  const onNav = useNav();
  return <AllParcelsScreen onNav={onNav} />;
}
