'use client';
import { useNav } from '@/src/lib/nav';
import CampaignFormPage from '@/src/screens/CampaignForm';

export default function NewCampaignPage() {
  const onNav = useNav();
  return <CampaignFormPage mode="create" onNav={onNav} />;
}
