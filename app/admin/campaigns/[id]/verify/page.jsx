'use client';
import { useState, useEffect } from 'react';
import { useNav } from '@/src/lib/nav';
import CampaignVerifyPanel from '@/src/screens/CampaignVerify';
import I from '@/src/components/Icons';

function mapParcel(p) {
  const rawItems = Array.isArray(p.items) ? p.items : [];
  const items = rawItems.length > 0
    ? rawItems.map((it, idx) => ({
        id:   `${p.id}-${idx}`,
        desc: it.description || it.productType || 'Article',
        qty:  it.nbPieces   || 1,
      }))
    : [{ id: `${p.id}-0`, desc: p.description || 'Colis', qty: 1 }];

  return {
    id:         p.id,
    code:       p.trackingCode,
    senderName: p.client?.name ?? '—',
    recipName:  p.recipientName ?? p.client?.name ?? '—',
    recipCity:  p.client?.city  ?? '—',
    actualKg:   p.weightKg ?? 0,
    delivery:   'pickup',
    items,
  };
}

export default function CampaignVerifyPage({ params }) {
  const onNav = useNav();
  const [campaign, setCampaign] = useState(null);
  const [parcels,  setParcels]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    fetch(`/api/campaigns/${params.id}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        setCampaign(data);
        setParcels((data.parcels || []).map(mapParcel));
        setLoading(false);
      })
      .catch(() => { setError('Impossible de charger la cargaison.'); setLoading(false); });
  }, [params.id]);

  async function handleValidate({ itemVerifs, parcelObs, parcels: pList }) {
    setSaving(true);
    try {
      await Promise.all(pList.map(async p => {
        const verifs = itemVerifs[p.id] || {};
        const obs    = parcelObs[p.id] || '';
        const itemNotes = Object.entries(verifs)
          .filter(([, v]) => v.note)
          .map(([, v]) => v.note)
          .join('; ');
        const notes = [obs, itemNotes].filter(Boolean).join(' | ') || undefined;

        await fetch(`/api/parcels/${p.id}`, {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ status: 'arrive', ...(notes && { notes }) }),
        });
      }));

      await fetch(`/api/campaigns/${params.id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: 'arrived' }),
      });

      onNav('/admin/campaigns/' + params.id);
    } catch {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: 'var(--ink-400)', fontSize: 14 }}>
          Chargement en cours…
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="page">
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--bad-600)' }}>{error || 'Cargaison introuvable.'}</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ink-400)', marginBottom: 14 }}>
        <a style={{ cursor: 'pointer' }} onClick={() => onNav('/admin/verify')}>Vérification</a>
        <I.ChevronRight style={{ width: 12, height: 12 }} />
        <a style={{ cursor: 'pointer' }} onClick={() => onNav('/admin/campaigns/' + params.id)}>{campaign.code}</a>
        <I.ChevronRight style={{ width: 12, height: 12 }} />
        <span style={{ color: 'var(--ink-600)', fontWeight: 600 }}>Contrôle arrivée</span>
      </div>

      <CampaignVerifyPanel
        parcels={parcels}
        campaign={campaign}
        saving={saving}
        onValidate={handleValidate}
        onExit={() => onNav('/admin/campaigns/' + params.id)}
      />
    </div>
  );
}
