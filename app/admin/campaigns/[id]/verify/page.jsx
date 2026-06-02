'use client';
import { useNav } from '@/src/lib/nav';
import { DATA, getCampaign } from '@/src/data';
import CampaignVerifyPanel from '@/src/screens/CampaignVerify';
import I from '@/src/components/Icons';

export default function CampaignVerifyPage({ params }) {
  const onNav = useNav();
  const campaign = getCampaign(params.id) || DATA.CAMPAIGNS[0];
  const parcels  = DATA.PARCELS;

  return (
    <div className="page">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ink-400)', marginBottom: 14 }}>
        <a style={{ cursor: 'pointer' }} onClick={() => onNav('/verify')}>Vérification</a>
        <I.ChevronRight style={{ width: 12, height: 12 }} />
        <a style={{ cursor: 'pointer' }} onClick={() => onNav('/campaign/' + params.id)}>{campaign.code}</a>
        <I.ChevronRight style={{ width: 12, height: 12 }} />
        <span style={{ color: 'var(--ink-600)', fontWeight: 600 }}>Contrôle arrivée</span>
      </div>

      <CampaignVerifyPanel
        parcels={parcels}
        campaign={campaign}
        onExit={() => onNav('/campaign/' + params.id)}
      />
    </div>
  );
}
