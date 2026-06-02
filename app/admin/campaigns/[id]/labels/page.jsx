'use client';
import { useNav } from '@/src/lib/nav';
import CampaignLabelsScreen from '@/src/screens/CampaignLabels';

export default function LabelsPage({ params }) {
  const onNav = useNav();
  return <CampaignLabelsScreen id={params.id} onNav={onNav} />;
}
