'use client';
import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import I from '../components/Icons.jsx';
import { Skel } from '../components/Shell.jsx';

const PRODUCT_TYPE = {
  standard:     { icon: '📦', label: 'Standard' },
  vetements:    { icon: '👗', label: 'Vêtements' },
  cosmetique:   { icon: '💄', label: 'Cosmétiques' },
  alimentaire:  { icon: '🥘', label: 'Alimentaire' },
  biere:        { icon: '🍺', label: 'Bière' },
  manioc_huile: { icon: '🌿', label: 'Manioc / Huile' },
  electronique: { icon: '📱', label: 'Électronique' },
  documents:    { icon: '📄', label: 'Documents' },
  // anciens codes
  food:         { icon: '🍲', label: 'Alimentaire' },
  fragile:      { icon: '⚠️', label: 'Fragile' },
  clothes:      { icon: '👕', label: 'Vêtements' },
  electronics:  { icon: '📱', label: 'Électronique' },
  cosmetics:    { icon: '💄', label: 'Cosmétiques' },
};

export default function ParcelLabelsScreen({ id, onNav }) {
  const [parcel,  setParcel]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    fetch('/api/parcels/' + id)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setParcel(d);
        setLoading(false);
      })
      .catch(() => { setError('Erreur réseau'); setLoading(false); });
  }, [id]);

  // Prefer bordereau items (physically verified) over reservation items
  const bordereaux   = Array.isArray(parcel?.bordereaux) ? parcel.bordereaux : [];
  const bl           = bordereaux.find(b => b.status === 'valide') ?? bordereaux[0] ?? null;
  const blItems      = Array.isArray(bl?.items) ? bl.items : [];
  const parcelItems  = Array.isArray(parcel?.items) ? parcel.items : [];
  const items        = blItems.length > 0 ? blItems : parcelItems;
  const fromBordereau = blItems.length > 0;

  const campaignCode = parcel?.campaign?.code ?? '—';

  return (
    <div className="labels-page">
      <div className="labels-toolbar">
        <button className="btn btn--ghost btn--sm" onClick={() => onNav('/admin/parcels/' + id)}>
          <I.ArrowLeft />Retour
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>
            {loading ? '…' : 'Colis ' + (parcel?.trackingCode ?? '—') + ' — Étiquettes articles'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-400)' }}>
            {loading ? '…' : items.length + ' étiquette' + (items.length > 1 ? 's' : '')
              + (parcel?.client?.name ? ' · ' + parcel.client.name : '')
              + (fromBordereau ? ' · données bordereau' : ' · données réservation')}
          </div>
        </div>
        {!loading && !fromBordereau && parcelItems.length > 0 && (
          <div style={{ fontSize: 11, color: '#B45309', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 6, padding: '4px 10px' }}>
            Aucun bordereau — affichage déclaration initiale
          </div>
        )}
        <button className="btn btn--ghost btn--sm" onClick={() => window.print()}>
          <I.Print />Imprimer
        </button>
      </div>

      {error && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--bad-700)', fontSize: 14 }}>{error}</div>
      )}

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, padding: 24, maxWidth: 860, margin: '0 auto' }}>
          {[1,2,3].map(i => <Skel key={i} w="100%" h={160} />)}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--ink-400)' }}>
          <I.Box style={{ width: 40, height: 40, margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>Aucun article dans ce colis</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            Renseignez les articles dans le bordereau pour générer les étiquettes.
          </div>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="item-labels-grid">
          {items.map((item, idx) => {
            const type      = PRODUCT_TYPE[item.cat ?? item.productType] ?? PRODUCT_TYPE.standard;
            const labelCode = parcel.trackingCode + '-' + String(idx + 1).padStart(2, '0');

            return (
              <div key={idx} className="item-label-card">
                <div className="item-label-head">
                  <span className="item-label-brand">JUMLA MARKET</span>
                  <span className="item-label-campaign">{campaignCode}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 10px 0', gap: 6 }}>
                  <div className="item-label-code" style={{ padding: 0, fontSize: 22, flex: 1, textAlign: 'left' }}>{labelCode}</div>
                  <div style={{ flexShrink: 0, background: 'white', padding: 3, borderRadius: 3 }}>
                    <QRCode value={labelCode} size={56} level="M" />
                  </div>
                </div>

                <div className="item-label-desc">
                  {item.description || type.label}
                </div>

                <div className="item-label-cat">
                  <span className="item-label-cat-icon">{type.icon}</span>
                  <span className="item-label-cat-label">{type.label}</span>
                </div>

                <div className="item-label-foot">
                  <span>
                    {item.nbPieces ? 'Qté : ' + item.nbPieces : ''}
                    {item.weightKg ? (item.nbPieces ? ' · ' : '') + item.weightKg + ' kg' : ''}
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
        .labels-page {
          min-height: 100vh;
          background: #f4f5f7;
        }
        .labels-toolbar {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 24px; background: white;
          border-bottom: 1px solid var(--border);
          position: sticky; top: 0; z-index: 10;
        }
        .item-labels-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 14px; padding: 24px; max-width: 860px; margin: 0 auto;
        }
        .item-label-card {
          background: white; border: 1.5px solid #E5E7EB; border-radius: 8px;
          overflow: hidden; font-family: 'Inter', system-ui, sans-serif;
          page-break-inside: avoid; break-inside: avoid;
          display: flex; flex-direction: column;
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
          padding: 6px 12px 10px; color: #374151; line-height: 1.3;
          flex: 1;
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
          /* Hide all shell chrome — sidebar, topbar, mobile overlay */
          .sidebar,
          .topbar,
          .admin-mobile-block,
          .labels-toolbar { display: none !important; }

          /* Let the main content fill the full A4 width */
          body, html { margin: 0; padding: 0; background: white; }
          .app { display: block !important; }
          .labels-page { min-height: unset; background: white; }

          .item-labels-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            padding: 8mm;
            gap: 5mm;
            max-width: none;
            margin: 0;
            width: 100%;
            box-sizing: border-box;
          }
          .item-label-card {
            border: 1px solid #ccc;
            border-radius: 4px;
          }
          .item-label-code { font-size: 20px; padding: 8px 6px 2px; }
          .item-label-desc { font-size: 11px; padding: 4px 8px 6px; }
          .item-label-cat  { padding: 5px 8px; }
          .item-label-foot { padding: 4px 8px; }
        }
      `}</style>
    </div>
  );
}
