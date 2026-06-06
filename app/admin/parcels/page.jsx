'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useNav } from '@/src/lib/nav';
import AllParcelsScreen from '@/src/screens/AllParcels';

function ParcelsContent() {
  const onNav = useNav();
  const params = useSearchParams();
  const initialSearch = params.get('q') || '';
  return <AllParcelsScreen onNav={onNav} initialSearch={initialSearch} />;
}

export default function ParcelsPage() {
  return <Suspense><ParcelsContent /></Suspense>;
}
