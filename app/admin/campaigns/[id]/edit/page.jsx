'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useNav } from '@/src/lib/nav';
import CampaignFormPage from '@/src/screens/CampaignForm';

export default function EditCampaignPage() {
  const { id }    = useParams();
  const onNav     = useNav();
  const [campaign, setCampaign] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetch('/api/campaigns/' + id)
      .then(r => r.json())
      .then(d => { setCampaign(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320, color: 'var(--ink-400)', fontSize: 14 }}>
        Chargement…
      </div>
    );
  }

  if (!campaign) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 12 }}>
        <div style={{ fontSize: 28 }}>📦</div>
        <div style={{ fontSize: 14, color: 'var(--ink-500)' }}>Cargaison introuvable</div>
        <button className="btn btn--ghost" onClick={() => onNav('/')}>← Retour</button>
      </div>
    );
  }

  return <CampaignFormPage mode="edit" campaign={campaign} onNav={onNav} />;
}
