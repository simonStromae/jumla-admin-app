'use client';
import { useNav } from '@/src/lib/nav';
import PartenaireDetailScreen from '@/src/screens/PartenaireDetail';
import { PermGuard } from '@/src/components/Shell';

export default function PartenaireDetailPage({ params }) {
  const onNav = useNav();
  return <PermGuard perm="parcels"><PartenaireDetailScreen id={params.id} onNav={onNav} /></PermGuard>;
}
