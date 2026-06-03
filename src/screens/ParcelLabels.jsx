import { DATA, PARCEL_CATEGORIES } from '../data.js';
import I from '../components/Icons.jsx';

function getPrefix(cat) {
  return cat === 'food' ? 'A' : 'E';
}

export default function ParcelLabelsScreen({ id, onNav }) {
  const parcel   = DATA.PARCELS.find(p => p.id === id) || DATA.PARCELS[0];
  const campaign = DATA.CAMPAIGNS.find(c => c.code === parcel.campaign) || DATA.CAMPAIGNS[0];
  const items    = parcel.items || [];

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7' }}>
      {/* Toolbar — masqué à l'impression */}
      <div className="labels-toolbar">
        <button className="btn btn--ghost btn--sm" onClick={() => onNav('/parcels/' + id)}>
          <I.ArrowLeft />Retour
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>
            Colis {parcel.code} — Étiquettes articles
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-400)' }}>
            {items.length} étiquette{items.length > 1 ? 's' : ''} · {parcel.senderName} → {parcel.recipName}
          </div>
        </div>
        <button className="btn btn--ghost btn--sm" onClick={() => window.print()}>
          <I.Print />Imprimer
        </button>
      </div>

      {/* Grid d'étiquettes */}
      <div className="item-labels-grid">
        {items.map((item, idx) => {
          const catDef = PARCEL_CATEGORIES.find(c => c.id === item.cat) || PARCEL_CATEGORIES[0];
          const prefix = getPrefix(item.cat);
          const labelCode = prefix + '-' + parcel.code;

          return (
            <div key={item.id} className="item-label-card">
              {/* En-tête */}
              <div className="item-label-head">
                <span className="item-label-brand">JUMLA CARGO</span>
                <span className="item-label-campaign">{campaign.code}</span>
              </div>

              {/* Code préfixé — gros */}
              <div className="item-label-code">{labelCode}</div>

              {/* Libellé */}
              <div className="item-label-desc">{item.desc}</div>

              {/* Catégorie */}
              <div className="item-label-cat">
                <span className="item-label-cat-icon">{catDef.icon}</span>
                <span className="item-label-cat-label">{catDef.label}</span>
              </div>

              {/* Qty + index */}
              <div className="item-label-foot">
                <span>Qté : <strong>{item.qty}</strong></span>
                <span className="item-label-idx">{String(idx + 1).padStart(2, '0')}/{String(items.length).padStart(2, '0')}</span>
              </div>
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--ink-400)' }}>
          <I.Box style={{ width: 40, height: 40, margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>Aucun article dans ce colis</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Renseignez les lignes du bordereau pour générer les étiquettes.</div>
        </div>
      )}

      <style>{`
        /* ── Toolbar ── */
        .labels-toolbar {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 24px;
          background: white;
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        /* ── Grid : 3 par ligne en écran, 4 par ligne à l'impression ── */
        .item-labels-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          padding: 24px;
          max-width: 860px;
          margin: 0 auto;
        }

        /* ── Label card ── */
        .item-label-card {
          background: white;
          border: 1.5px solid #E5E7EB;
          border-radius: 8px;
          overflow: hidden;
          font-family: 'Inter', system-ui, sans-serif;
          page-break-inside: avoid;
          display: flex;
          flex-direction: column;
        }

        .item-label-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 10px;
          background: #0B1220;
          color: white;
        }
        .item-label-brand {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .1em;
          color: white;
        }
        .item-label-campaign {
          font-family: 'JetBrains Mono', monospace;
          font-size: 8.5px;
          color: rgba(255,255,255,.45);
        }

        .item-label-code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 42px;
          font-weight: 800;
          text-align: center;
          padding: 14px 10px 4px;
          color: #0B1220;
          letter-spacing: .04em;
          line-height: 1;
        }

        .item-label-desc {
          font-size: 13px;
          font-weight: 700;
          text-align: center;
          padding: 6px 12px 10px;
          color: #374151;
          line-height: 1.3;
        }

        .item-label-cat {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 10px;
          border-top: 1.5px solid #E5E7EB;
          background: #F9FAFB;
        }
        .item-label-cat-icon {
          font-size: 16px;
        }
        .item-label-cat-label {
          font-size: 12px;
          font-weight: 700;
          color: #6B7280;
          text-transform: uppercase;
          letter-spacing: .05em;
        }

        .item-label-foot {
          display: flex;
          justify-content: space-between;
          padding: 6px 10px;
          border-top: 1px solid #F3F4F6;
          font-size: 11px;
          color: #9CA3AF;
          font-family: 'JetBrains Mono', monospace;
        }
        .item-label-idx {
          color: #D1D5DB;
        }

        /* ── Print ── */
        @media print {
          body { margin: 0; background: white; }
          .labels-toolbar { display: none !important; }
          .item-labels-grid {
            grid-template-columns: repeat(4, 1fr);
            padding: 6mm;
            gap: 5mm;
            max-width: none;
          }
          .item-label-card {
            border: 1px solid #ccc;
          }
        }
      `}</style>
    </div>
  );
}
