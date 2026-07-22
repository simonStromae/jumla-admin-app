'use client';
import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import I from '../components/Icons.jsx';
import { Skel } from '../components/Shell.jsx';

const PRODUCT_TYPE = {
  standard:     'Standard',
  vetements:    'Vêtements',
  cosmetique:   'Cosmétiques',
  alimentaire:  'Alimentaire',
  biere:        'Bière',
  manioc_huile: 'Manioc / Huile',
  electronique: 'Électronique',
  documents:    'Documents',
  food:         'Alimentaire',
  fragile:      'Fragile',
  clothes:      'Vêtements',
  electronics:  'Électronique',
  cosmetics:    'Cosmétiques',
};

const PACK_TYPE = {
  carton:    'Carton',
  paquet:    'Paquet',
  sachet:    'Sachet',
  bouteille: 'Bouteille',
};

export default function ParcelLabelsScreen({ id, onNav }) {
  const [parcel,   setParcel]   = useState(null);
  const [company,  setCompany]  = useState('');
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/parcels/' + id).then(r => r.json()),
      fetch('/api/public/config').then(r => r.json()),
    ]).then(([pData, cfg]) => {
      if (pData.error) { setError(pData.error); }
      else setParcel(pData);
      setCompany(cfg.companyLegal || cfg.companyName || 'Jumla Shipping SARL');
      setLoading(false);
    }).catch(() => { setError('Erreur réseau'); setLoading(false); });
  }, [id]);

  const bordereaux  = Array.isArray(parcel?.bordereaux) ? parcel.bordereaux : [];
  const bl          = bordereaux.find(b => b.status === 'valide') ?? bordereaux[0] ?? null;
  const blItems     = Array.isArray(bl?.items) ? bl.items : [];
  const parcelItems = Array.isArray(parcel?.items) ? parcel.items : [];
  const fromBL      = blItems.length > 0;
  const items       = fromBL ? blItems : parcelItems;

  const code = parcel?.trackingCode ?? '—';
  const camp = parcel?.campaign?.code ?? '—';

  // Normalise an item into label fields
  const toLabel = (item, idx) => {
    if (fromBL) {
      return {
        designation: (item.designation ?? item.name ?? 'Article').toUpperCase(),
        type:        item.description?.trim() || PACK_TYPE[item.type] || item.type || '',
        quantite:    item.nbPieces ? item.nbPieces + ' pièces' : item.count ? item.count + ' colis' : '',
      };
    }
    return {
      designation: (PRODUCT_TYPE[item.cat ?? item.productType] ?? item.description ?? 'Article').toUpperCase(),
      type:        item.description ?? '',
      quantite:    item.nbPieces ? item.nbPieces + ' pièces' : '',
    };
  };

  return (
    <div className="lp-page">
      <div className="lp-toolbar no-print">
        <button className="btn btn--ghost btn--sm" onClick={() => onNav('/admin/parcels/' + id)}>
          <I.ArrowLeft />Retour
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>
            {loading ? '…' : 'Colis ' + code + ' — Étiquettes'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-400)' }}>
            {loading ? '…' : items.length + ' étiquette' + (items.length > 1 ? 's' : '')
              + (fromBL ? ' · données bordereau' : ' · données déclaration')}
          </div>
        </div>
        {!loading && !fromBL && parcelItems.length > 0 && (
          <div style={{ fontSize: 11, color: '#B45309', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 6, padding: '4px 10px' }}>
            Sans bordereau validé
          </div>
        )}
        <button className="btn btn--brand btn--sm" onClick={() => window.print()}>
          <I.Print />Exporter PDF
        </button>
      </div>

      {error && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--bad-700)', fontSize: 14 }}>{error}</div>
      )}

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, padding: 24, maxWidth: 800, margin: '0 auto' }}>
          {[1,2,3,4].map(i => <Skel key={i} w="100%" h={200} />)}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--ink-400)' }}>
          <I.Box style={{ width: 40, height: 40, margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>Aucun article dans ce colis</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Renseignez les articles dans le bordereau pour générer les étiquettes.</div>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="lp-grid">
          {items.map((item, idx) => {
            const lbl = toLabel(item, idx);
            return (
              <div key={idx} className="lp-card">
                {/* Header */}
                <div className="lp-head">
                  <span className="lp-brand">JUMLA MARKET</span>
                  <span className="lp-camp">{camp}</span>
                  <span className="lp-idx">{String(idx + 1).padStart(2, '0')}/{String(items.length).padStart(2, '0')}</span>
                </div>

                {/* Body */}
                <div className="lp-body">
                  <div className="lp-left">
                    <div className="lp-designation">{lbl.designation}</div>
                    <div className="lp-lines">
                      {lbl.type     && <div><span className="lp-key">Type</span><span className="lp-sep">:</span><span className="lp-val">{lbl.type}</span></div>}
                      {lbl.quantite && <div><span className="lp-key">Quantite</span><span className="lp-sep">:</span><span className="lp-val">{lbl.quantite}</span></div>}
                      <div><span className="lp-key">Emballe par</span><span className="lp-sep">:</span><span className="lp-val">{company}</span></div>
                      <div><span className="lp-key">Made in</span><span className="lp-sep">:</span><span className="lp-val">Cameroun</span></div>
                    </div>
                    <div className="lp-code">{code}</div>
                  </div>
                  <div className="lp-qr">
                    <QRCode value={code} size={110} level="L" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .lp-page { min-height: 100vh; background: #f4f5f7; }
        .lp-toolbar {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 24px; background: white;
          border-bottom: 1px solid var(--border);
          position: sticky; top: 0; z-index: 10;
        }
        .lp-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 16px; padding: 24px; max-width: 900px; margin: 0 auto;
        }
        .lp-card {
          background: white; border: 1.5px solid #D1D5DB;
          border-radius: 8px; overflow: hidden;
          font-family: 'Inter', system-ui, sans-serif;
          page-break-inside: avoid; break-inside: avoid;
        }
        .lp-head {
          display: flex; align-items: center; gap: 10;
          padding: 7px 12px; background: #0B1220; color: white;
        }
        .lp-brand { font-size: 10px; font-weight: 800; letter-spacing: .1em; flex: 1; }
        .lp-camp  { font-family: monospace; font-size: 9px; color: rgba(255,255,255,.5); margin-right: 6px; }
        .lp-idx   { font-family: monospace; font-size: 9px; color: rgba(255,255,255,.35); }
        .lp-body  {
          display: flex; align-items: flex-start; gap: 12;
          padding: 14px 14px 14px 16px;
        }
        .lp-left  { flex: 1; min-width: 0; }
        .lp-qr    { flex-shrink: 0; padding: 4px; background: white; border: 1px solid #E5E7EB; border-radius: 4px; align-self: flex-end; }
        .lp-designation {
          font-size: 18px; font-weight: 900; color: #0B1220;
          text-transform: uppercase; letter-spacing: .02em;
          margin-bottom: 10px; line-height: 1.2;
        }
        .lp-lines { display: flex; flex-direction: column; gap: 3; margin-bottom: 14px; }
        .lp-key   { font-size: 12px; font-weight: 600; color: #374151; min-width: 90px; display: inline-block; }
        .lp-sep   { font-size: 12px; color: #6B7280; margin: 0 4px; }
        .lp-val   { font-size: 12px; color: #111827; }
        .lp-code  {
          font-family: monospace; font-size: 20px; font-weight: 800;
          color: #0B1220; letter-spacing: .06em; margin-top: 4px;
          border-top: 1.5px dashed #E5E7EB; padding-top: 10px;
        }

        @media print {
          @page { size: 57mm 32mm; margin: 0; }
          .no-print { display: none !important; }
          body, html { margin: 0; padding: 0; background: white; }
          .lp-page { min-height: unset !important; background: white !important; }

          .lp-grid {
            display: block !important;
            padding: 0 !important; margin: 0 !important;
            max-width: none !important; width: 57mm !important;
          }

          /* One label = one Dymo page */
          .lp-card {
            width: 57mm !important; height: 32mm !important;
            page-break-after: always !important; break-after: page !important;
            border: none !important; border-radius: 0 !important;
            overflow: hidden !important; margin: 0 !important;
            display: flex !important; flex-direction: column !important;
          }

          /* Header */
          .lp-head { padding: 1mm 2.5mm !important; flex-shrink: 0 !important; }
          .lp-brand { font-size: 5pt !important; }
          .lp-camp  { font-size: 5pt !important; }
          .lp-idx   { font-size: 5pt !important; }

          /* Body */
          .lp-body { padding: 1.5mm 2.5mm !important; gap: 2mm !important; flex: 1 !important; align-items: flex-start !important; }

          /* Left column */
          .lp-left { display: flex !important; flex-direction: column !important; justify-content: space-between !important; min-width: 0 !important; }
          .lp-designation { font-size: 9pt !important; margin-bottom: 1mm !important; line-height: 1.15 !important; }
          .lp-lines { gap: 0.5mm !important; margin-bottom: 1mm !important; }
          .lp-key { font-size: 5.5pt !important; min-width: 40px !important; }
          .lp-sep { font-size: 5.5pt !important; }
          .lp-val { font-size: 5.5pt !important; }
          .lp-code { font-size: 8pt !important; padding-top: 0.8mm !important; letter-spacing: .03em !important; }

          /* QR */
          .lp-qr { padding: 1px !important; align-self: center !important; }
          .lp-qr svg { width: 11mm !important; height: 11mm !important; }
        }
      `}</style>
    </div>
  );
}
