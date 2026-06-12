'use client';
import { useNav } from '@/src/lib/nav';
import { useSearchParams } from 'next/navigation';
import MessagingScreen from '@/src/screens/Messaging';
import { PermGuard } from '@/src/components/Shell';

export default function MessagingPage() {
  const onNav = useNav();
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaignId') ?? undefined;
  return <PermGuard perm="whatsapp"><MessagingScreen onNav={onNav} campaignId={campaignId} /></PermGuard>;
}
