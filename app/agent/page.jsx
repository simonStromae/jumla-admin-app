'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AgentRoot() {
  const router = useRouter();
  useEffect(() => { router.replace('/agent/dashboard'); }, [router]);
  return null;
}
