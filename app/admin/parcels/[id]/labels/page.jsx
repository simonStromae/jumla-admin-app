'use client';
import { useNav } from '@/src/lib/nav';
import ParcelLabelsScreen from '@/src/screens/ParcelLabels';

export default function ParcelLabelsPage({ params }) {
  const onNav = useNav();
  return <ParcelLabelsScreen id={params.id} onNav={onNav} />;
}
