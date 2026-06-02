'use client';
import { useNav } from '@/src/lib/nav';
import ParcelDetailScreen from '@/src/screens/ParcelDetail';

export default function ParcelDetailPage({ params }) {
  const onNav = useNav();
  return <ParcelDetailScreen id={params.id} onNav={onNav} />;
}
