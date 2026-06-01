'use client';
import { useNav } from '@/src/lib/nav';
import PaymentsScreen from '@/src/screens/Payments';

export default function PaymentsPage() {
  const onNav = useNav();
  return <PaymentsScreen onNav={onNav} />;
}
