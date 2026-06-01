'use client';
import { useNav } from '@/src/lib/nav';
import ClientsScreen from '@/src/screens/Clients';

export default function ClientsPage() {
  const onNav = useNav();
  return <ClientsScreen onNav={onNav} />;
}
