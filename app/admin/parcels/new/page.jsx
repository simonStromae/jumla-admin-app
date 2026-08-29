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
  // Pass a stub so the form pre-fills campaignId; full details come from the API-loaded campaigns list
  const campaign = campaignId ? { id: campaignId } : null;
  return <ParcelFormPage mode="create" campaign={campaign} onNav={onNav} />;
}

export default function NewParcelPage() {
  return <Suspense><NewParcelContent /></Suspense>;
}
