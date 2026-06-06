'use client';
import { useNav } from '@/src/lib/nav';
import ProfileScreen from '@/src/screens/Profile';

export default function ProfilePage() {
  const onNav = useNav();
  return <ProfileScreen onNav={onNav} />;
}
