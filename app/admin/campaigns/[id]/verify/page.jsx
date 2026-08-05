'use client';
import { useState, useEffect } from 'react';
import { useNav } from '@/src/lib/nav';
import CampaignVerifyPanel from '@/src/screens/CampaignVerify';
import I from '@/src/components/Icons';

function capitalize(s) {
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function mapParcel(p) {
  const bls = Array.isArray(p.bordereaux) ? p.bordereaux : [];

  let rows = [];
  bls.forEach(bl => {
    const blItems = Array.isArray(bl.items) && bl.items.length > 0 ? bl.items : null;
    if (blItems) {
      blItems.forEach((it, idx) => {
        rows.push({
          id:           `${bl.id}-${idx}`,
          blId:         bl.id,
          blCode:       bl.code,
          blStatus:     bl.status,
          origItem:     it,
          // Per-item saved verification state (stored in items JSON)
          verifStatus:  it._verifStatus ?? null,
          verifEcart:   it._verifEcart  ?? 0,
          verifNote:    it._verifNote   ?? '',
          designation:  it.designation || bl.description || '—',
          description:  it.description || '—',
          type:         capitalize(it.type),
          nb:           Number(it.count) || 1,
          pieces:       it.nbPieces != null ? Number(it.nbPieces) : null,
        });
      });
    } else {
      rows.push({
        id:          `${bl.id}-0`,
        blId:        bl.id,
        blCode:      bl.code,
        blStatus:    bl.status,
        origItem:    null,
        verifStatus: null,
        verifEcart:  0,
        verifNote:   '',
        designation: bl.description || '—',
        description: '—',
        type:        '—',
        nb:          1,
        pieces:      bl.nbPieces != null ? Number(bl.nbPieces) : null,
      });
    }
  });

  if (rows.length === 0) {
    const parcelItems = Array.isArray(p.items) && p.items.length > 0 ? p.items : null;
    if (parcelItems) {
      parcelItems.forEach((it, idx) => {
        rows.push({
          id:          `${p.id}-item-${idx}`,
          blId:        null,
          blCode:      null,
          blStatus:    null,
          origItem:    it,
          verifStatus: it._verifStatus ?? null,
          verifEcart:  it._verifEcart  ?? 0,
          verifNote:   it._verifNote   ?? '',
          designation: it.designation || p.description || 'Colis',
          description: it.description || '—',
          type:        capitalize(it.type),
          nb:          Number(it.count) || 1,
          pieces:      it.nbPieces != null ? Number(it.nbPieces) : null,
        });
      });
    } else {
      rows = [{
        id: `${p.id}-fallback`,
        blId: null, blCode: null, blStatus: null, origItem: null,
        verifStatus: null, verifEcart: 0, verifNote: '',
        designation: p.description || 'Colis',
        description: '—', type: '—', nb: 1, pieces: null,
      }];
    }
  }

  return {
    id:          p.id,
    code:        p.trackingCode,
    senderName:  p.client?.name  ?? '—',
    senderPhone: p.client?.phone ?? '',
    recipName:   p.client?.name  ?? '—',
    recipCity:   p.client?.city  ?? '—',
    actualKg:    p.weightKg      ?? 0,
    rows,
  };
}

export default function CampaignVerifyPage({ params }) {
  const onNav = useNav();
  const [campaign, setCampaign] = useState(null);
  const [parcels,  setParcels]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [closing,  setClosing]  = useState(false);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    fetch(`/api/campaigns/${params.id}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        setCampaign(data);
        setParcels((data.parcels || []).filter(p => p.status !== 'ann').map(mapParcel));
        setLoading(false);
      })
      .catch(() => { setError('Impossible de charger la cargaison.'); setLoading(false); });
  }, [params.id]);

  // Save one parcel's verifications.
  // Bordereaux rows → PUT /api/bordereaux/:id (status + embedded items JSON)
  // No-bordereau rows (declared at booking) → PUT /api/parcels/:id (items JSON only)
  async function saveParcel(parcel, verifs) {
    const byBl = {};
    const blStatusMap = {};
    for (const r of parcel.rows) {
      if (!r.blId) continue;
      if (!byBl[r.blId]) byBl[r.blId] = [];
      byBl[r.blId].push(r);
    }

    const saves = [];

    // --- Bordereau rows ---
    for (const [blId, blRows] of Object.entries(byBl)) {
      const statuses = blRows.map(r => verifs[parcel.id]?.[r.id]?.status ?? 'pending');
      let blStatus;
      if (statuses.includes('missing') || statuses.includes('issue')) blStatus = 'ecart';
      else if (statuses.every(s => s === 'ok'))                        blStatus = 'verifie';
      else                                                              blStatus = 'en_attente';

      blStatusMap[blId] = blStatus;

      const updatedItems = blRows
        .filter(r => r.origItem)
        .map(r => {
          const v = verifs[parcel.id]?.[r.id] ?? { status: 'pending', ecart: 0, note: '' };
          return { ...r.origItem, _verifStatus: v.status, _verifEcart: v.ecart ?? 0, _verifNote: v.note ?? '' };
        });

      saves.push(fetch(`/api/bordereaux/${blId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: blStatus, ...(updatedItems.length > 0 ? { items: updatedItems } : {}) }),
      }));
    }

    // --- Parcel-level rows (no bordereau, items from booking declaration) ---
    const parcelRows = parcel.rows.filter(r => !r.blId && r.origItem);
    if (parcelRows.length > 0) {
      const updatedItems = parcelRows.map(r => {
        const v = verifs[parcel.id]?.[r.id] ?? { status: 'pending', ecart: 0, note: '' };
        return { ...r.origItem, _verifStatus: v.status, _verifEcart: v.ecart ?? 0, _verifNote: v.note ?? '' };
      });
      saves.push(fetch(`/api/parcels/${parcel.id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ items: updatedItems }),
      }));
    }

    if (saves.length === 0) return;

    const responses = await Promise.all(saves);

    const failed = responses.find(r => !r.ok);
    if (failed) {
      const body = await failed.json().catch(() => ({}));
      throw new Error(body.error || `Erreur ${failed.status}`);
    }

    setParcels(prev => prev.map(p => {
      if (p.id !== parcel.id) return p;
      return {
        ...p,
        rows: p.rows.map(r => {
          const v = verifs[parcel.id]?.[r.id];
          if (r.blId && r.blId in blStatusMap) {
            return {
              ...r,
              blStatus:    blStatusMap[r.blId],
              verifStatus: v?.status ?? r.verifStatus,
              verifEcart:  v?.ecart  ?? r.verifEcart,
              verifNote:   v?.note   ?? r.verifNote,
              origItem: r.origItem ? { ...r.origItem, _verifStatus: v?.status ?? r.verifStatus, _verifEcart: v?.ecart ?? 0, _verifNote: v?.note ?? '' } : null,
            };
          }
          if (!r.blId && r.origItem) {
            return {
              ...r,
              verifStatus: v?.status ?? r.verifStatus,
              verifEcart:  v?.ecart  ?? r.verifEcart,
              verifNote:   v?.note   ?? r.verifNote,
              origItem: { ...r.origItem, _verifStatus: v?.status ?? r.verifStatus, _verifEcart: v?.ecart ?? 0, _verifNote: v?.note ?? '' },
            };
          }
          return r;
        }),
      };
    }));
  }

  async function handleClose() {
    setClosing(true);
    try {
      await fetch(`/api/campaigns/${params.id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: 'ard' }),
      });
      onNav('/admin/campaigns/' + params.id);
    } catch {
      setClosing(false);
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
        closing={closing}
        onSaveParcel={saveParcel}
        onClose={handleClose}
        onExit={() => onNav('/admin/campaigns/' + params.id)}
      />
    </div>
  );
}
