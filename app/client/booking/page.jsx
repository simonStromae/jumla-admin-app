'use client';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BookingScreen from '@/src/client/Booking';

function BookingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillId = searchParams.get('prefill') || undefined;
  return <BookingScreen embedded prefillId={prefillId} onNav={(path) => router.push(path)} />;
}

export default function ClientBookingPage() {
  return (
    <Suspense>
      <BookingPageInner />
    </Suspense>
  );
}
