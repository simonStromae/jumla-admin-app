'use client';
import { useNav } from '@/src/lib/nav';
import BookingScreen from '@/src/client/Booking';

export default function BookingPage() {
  const onNav = useNav();
  return <BookingScreen onNav={onNav} />;
}
