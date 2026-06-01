'use client';
import { useNav } from '@/src/lib/nav';
import CampaignsScreen from '@/src/screens/Campaigns';

export default function CampaignsPage() {
  const onNav = useNav();
  return <CampaignsScreen onNav={onNav} />;
}
