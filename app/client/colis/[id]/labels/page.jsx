'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const PRODUCT_TYPE = {
  standard:     { icon: '📦', label: 'Standard' },
  vetements:    { icon: '👗', label: 'Vêtements' },
  cosmetique:   { icon: '💄', label: 'Cosmétiques' },
  alimentaire:  { icon: '🥘', label: 'Alimentaire' },
  biere:        { icon: '🍺', label: 'Bière' },
  manioc_huile: { icon: '🌿', label: 'Manioc / Huile' },
  electronique: { icon: '📱', label: 'Électronique' },
  documents:    { icon: '📄', label: 'Documents' },
  food:         { icon: '🍲', label: 'Alimentaire' },
  fragile:      { icon: '⚠️', label: 'Fragile' },
  clothes:      { icon: '👕', label: 'Vêtements' },
  electronics:  { icon: '📱', label: 'Électronique' },
  cosmetics:    { icon: '💄', label: 'Cosmétiques' },
};

export default function ClientParcelLabelsPage({ params }) {
  const router = useRouter();
  const [parcel,  setParcel]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    fetch('/api/me/parcels/' + params.id)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => { setParcel(d); setLoading(false); })
      .catch(() => { setError('Colis introuvable ou accès refusé.'); setLoading(false); });
  }, [params.id]);

  const items        = Array.isArray(parcel?.items) ? parcel.items : [];
  const campaignCode = parcel?.campaign?.code ?? '—';

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7' }}>
      <div className="labels-toolbar">
        <button className="lbl-back-btn" onClick={() => router.push('/client/colis/' + params.id)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m5 5-5-5 5-5"/></svg>
          Retour
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
            {loading ? '…' : `Colis ${parcel?.trackingCode ?? '—'} — Étiquettes articles`}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            {loading ? '…' : `${items.length} étiquette${items.length > 1 ? 's' : ''}`}
          </div>
        </div>
        <button className="lbl-print-btn" onClick={() => window.print()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Imprimer
        </button>
      </div>

      {error && (
        <div style={{ padding: 40, textAlign: 'center', color: '#dc2626', fontSize: 14 }}>{error}</div>
      )}

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, padding: 24, maxWidth: 860, margin: '0 auto' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 160, background: '#e5e7eb', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: '#6b7280' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Aucun article dans ce colis</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            Renseignez les articles lors de la réservation pour générer les étiquettes.
          </div>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="item-labels-grid">
          {items.map((item, idx) => {
            const catId     = item.cat ?? item.productType ?? 'standard';
            const type      = PRODUCT_TYPE[catId] ?? PRODUCT_TYPE.standard;
            const labelCode = (parcel?.trackingCode ?? '—') + '-' + String(idx + 1).padStart(2, '0');

            return (
              <div key={idx} className="item-label-card">
                <div className="item-label-head">
                  <span className="item-label-brand">JUMLA CARGO</span>
                  <span className="item-label-campaign">{campaignCode}</span>
                </div>
                <div className="item-label-code">{labelCode}</div>
                <div className="item-label-desc">{item.description ?? item.desc ?? type.label}</div>
                <div className="item-label-cat">
                  <span className="item-label-cat-icon">{type.icon}</span>
                  <span className="item-label-cat-label">{type.label}</span>
                </div>
                <div className="item-label-foot">
                  <span>
                    {(item.pieces || item.nbPieces) ? `Qté : ${item.pieces ?? item.nbPieces}` : ''}
                    {(item.kg || item.weightKg)     ? `${(item.pieces || item.nbPieces) ? ' · ' : ''}${item.kg ?? item.weightKg} kg` : ''}
                  </span>
                  <span className="item-label-idx">
                    {String(idx + 1).padStart(2, '0')}/{String(items.length).padStart(2, '0')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        .labels-toolbar {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 24px; background: white;
          border-bottom: 1px solid #e5e7eb;
          position: sticky; top: 0; z-index: 10;
        }
        .lbl-back-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 12px; border-radius: 7px;
          border: 1px solid #d1d5db; background: white;
          cursor: pointer; font-size: 13px; font-weight: 600; color: #374151;
        }
        .lbl-print-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 7px;
          border: none; background: #111827;
          cursor: pointer; font-size: 13px; font-weight: 600; color: white;
        }
        .item-labels-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 14px; padding: 24px; max-width: 860px; margin: 0 auto;
        }
        .item-label-card {
          background: white; border: 1.5px solid #E5E7EB; border-radius: 8px;
          overflow: hidden; font-family: 'Inter', system-ui, sans-serif;
          page-break-inside: avoid; display: flex; flex-direction: column;
        }
        .item-label-head {
          display: flex; justify-content: space-between; align-items: center;
          padding: 6px 10px; background: #0B1220; color: white;
        }
        .item-label-brand { font-size: 9px; font-weight: 800; letter-spacing: .1em; }
        .item-label-campaign { font-family: monospace; font-size: 8.5px; color: rgba(255,255,255,.45); }
        .item-label-code {
          font-family: monospace; font-size: 28px; font-weight: 800;
          text-align: center; padding: 14px 10px 4px; color: #0B1220;
          letter-spacing: .04em; line-height: 1;
        }
        .item-label-desc {
          font-size: 13px; font-weight: 700; text-align: center;
          padding: 6px 12px 10px; color: #374151; line-height: 1.3; flex: 1;
        }
        .item-label-cat {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 8px 10px; border-top: 1.5px solid #E5E7EB; background: #F9FAFB;
        }
        .item-label-cat-icon { font-size: 16px; }
        .item-label-cat-label {
          font-size: 12px; font-weight: 700; color: #6B7280;
          text-transform: uppercase; letter-spacing: .05em;
        }
        .item-label-foot {
          display: flex; justify-content: space-between;
          padding: 6px 10px; border-top: 1px solid #F3F4F6;
          font-size: 11px; color: #9CA3AF; font-family: monospace;
        }
        .item-label-idx { color: #D1D5DB; }
        @media print {
          body { margin: 0; background: white; }
          .labels-toolbar { display: none !important; }
          .item-labels-grid {
            grid-template-columns: repeat(4, 1fr);
            padding: 6mm; gap: 5mm; max-width: none;
          }
          .item-label-card { border: 1px solid #ccc; }
        }
      `}</style>
    </div>
  );
}
