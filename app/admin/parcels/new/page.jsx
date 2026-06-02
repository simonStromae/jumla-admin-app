'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useNav } from '@/src/lib/nav';
import { DATA } from '@/src/data';
import ParcelFormPage from '@/src/screens/ParcelForm';

function NewParcelContent() {
  const onNav = useNav();
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaign');
  const campaign = campaignId ? DATA.CAMPAIGNS.find(c => c.id === campaignId) || null : null;
  return <ParcelFormPage mode="create" campaign={campaign} onNav={onNav} />;
}

export default function NewParcelPage() {
  return <Suspense><NewParcelContent /></Suspense>;
}
