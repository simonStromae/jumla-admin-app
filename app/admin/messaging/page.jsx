'use client';
import { useNav } from '@/src/lib/nav';
import MessagingScreen from '@/src/screens/Messaging';

export default function MessagingPage() {
  const onNav = useNav();
  return <MessagingScreen onNav={onNav} />;
}
