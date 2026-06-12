'use client';
import { Suspense } from 'react';
import { useNav } from '@/src/lib/nav';
import { useSearchParams } from 'next/navigation';
import MessagingScreen from '@/src/screens/Messaging';
import { PermGuard } from '@/src/components/Shell';

function MessagingContent() {
  const onNav = useNav();
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaignId') ?? undefined;
  return <PermGuard perm="whatsapp"><MessagingScreen onNav={onNav} campaignId={campaignId} /></PermGuard>;
}

export default function MessagingPage() {
  return (
    <Suspense>
      <MessagingContent />
    </Suspense>
  );
}
