'use client';
import { useNav } from '@/src/lib/nav';
import SlipDetailScreen from '@/src/screens/SlipDetail';

export default function SlipDetailPage({ params }) {
  const onNav = useNav();
  return <SlipDetailScreen id={params.code} onNav={onNav} />;
}
