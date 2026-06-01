'use client';
import { useNav } from '@/src/lib/nav';
import LoginScreen from '@/src/screens/Login';

export default function LoginPage() {
  const onNav = useNav();
  return <LoginScreen onNav={onNav} />;
}
