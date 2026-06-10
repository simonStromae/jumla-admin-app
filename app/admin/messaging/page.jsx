'use client';
import { useNav } from '@/src/lib/nav';
import MessagingScreen from '@/src/screens/Messaging';
import { PermGuard } from '@/src/components/Shell';

export default function MessagingPage() {
  const onNav = useNav();
  return <PermGuard perm="whatsapp"><MessagingScreen onNav={onNav} /></PermGuard>;
}
