'use client';
import { useNav } from '@/src/lib/nav';
import NewCampaignScreen from '@/src/screens/NewCampaign';

export default function NewCampaignPage() {
  const onNav = useNav();
  return <NewCampaignScreen onNav={onNav} />;
}
