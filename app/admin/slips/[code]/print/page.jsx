'use client';
import { useNav } from '@/src/lib/nav';
import SlipPrintScreen from '@/src/screens/SlipPrint';

export default function SlipPrintPage({ params }) {
  const onNav = useNav();
  return <SlipPrintScreen code={params.code} onNav={onNav} />;
}
