'use client';
import { useRouter } from 'next/navigation';
import BookingScreen from '@/src/client/Booking';

export default function ClientBookingPage() {
  const router = useRouter();
  return <BookingScreen embedded onNav={(path) => router.push(path)} />;
}
