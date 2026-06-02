'use client';
import { useRouter } from 'next/navigation';
import BookingScreen from '@/src/client/Booking';

export default function BookingPage() {
  const router = useRouter();
  return <BookingScreen onNav={(path) => router.push(path)} />;
}
