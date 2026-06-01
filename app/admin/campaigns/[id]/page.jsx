'use client';
import { useNav } from '@/src/lib/nav';
import CampaignDetailScreen from '@/src/screens/CampaignDetail';

export default function CampaignDetailPage({ params }) {
  const onNav = useNav();
  return <CampaignDetailScreen id={params.id} onNav={onNav} />;
}
