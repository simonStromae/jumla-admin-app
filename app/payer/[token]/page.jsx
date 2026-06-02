'use client';
import PaymentScreen from '@/src/screens/Payment';

export default function PayerPage({ params }) {
  return <PaymentScreen token={params.token} />;
}
