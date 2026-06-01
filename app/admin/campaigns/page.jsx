'use client';
import { useState } from 'react';
import { useNav } from '@/src/lib/nav';
import CampaignsScreen from '@/src/screens/Campaigns';
import NewCampaignWizard from '@/src/screens/NewCampaign';

export default function CampaignsPage() {
  const onNav = useNav();
  const [showWizard, setShowWizard] = useState(false);

  return (
    <>
      <CampaignsScreen onNav={onNav} onNewCampaign={() => setShowWizard(true)} />
      {showWizard && (
        <NewCampaignWizard
          onClose={() => setShowWizard(false)}
          onCreated={() => { setShowWizard(false); }}
        />
      )}
    </>
  );
}
