'use client';
import { useState } from 'react';
import { useNav } from '@/src/lib/nav';
import CampaignDetailScreen from '@/src/screens/CampaignDetail';
import NewCampaignWizard from '@/src/screens/NewCampaign';
import { DATA } from '@/src/data';

export default function CampaignDetailPage({ params }) {
  const onNav = useNav();
  const [editing, setEditing] = useState(false);
  const campaign = DATA.CAMPAIGNS.find(c => c.id === params.id) || DATA.CAMPAIGNS[0];

  return (
    <>
      <CampaignDetailScreen
        id={params.id}
        onNav={onNav}
        onEdit={() => setEditing(true)}
      />
      {editing && (
        <NewCampaignWizard
          mode="edit"
          initial={campaign}
          onClose={() => setEditing(false)}
          onCreated={() => setEditing(false)}
        />
      )}
    </>
  );
}
