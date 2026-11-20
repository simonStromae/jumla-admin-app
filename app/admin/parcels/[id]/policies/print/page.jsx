'use client';
import { useNav } from '@/src/lib/nav';
import PolicyPrintScreen from '@/src/screens/PolicyPrint';

export default function PolicyPrintPage({ params }) {
  const onNav = useNav();
  return <PolicyPrintScreen id={params.id} onNav={onNav} />;
}
