'use client';
import { useRouter } from 'next/navigation';
import LandingPage from '@/src/client/Landing';

export default function RootPage() {
  const router = useRouter();
  return <LandingPage onNav={(path) => router.push(path)} />;
}
