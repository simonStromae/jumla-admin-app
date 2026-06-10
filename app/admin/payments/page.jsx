'use client';
import { useNav } from '@/src/lib/nav';
import PaymentsScreen from '@/src/screens/Payments';
import { PermGuard } from '@/src/components/Shell';

export default function PaymentsPage() {
  const onNav = useNav();
  return <PermGuard perm="payments"><PaymentsScreen onNav={onNav} /></PermGuard>;
}
