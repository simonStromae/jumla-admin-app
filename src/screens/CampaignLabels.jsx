import { DATA, getRoute } from '../data.js';
import I from '../components/Icons.jsx';

export default function CampaignLabelsScreen({ id, onNav }) {
  const campaign = DATA.CAMPAIGNS.find(c => c.id === id) || DATA.CAMPAIGNS[0];
  const route = getRoute(campaign.route);
  const parcels = DATA.PARCELS;

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7' }}>
      {/* Toolbar — masqué à l'impression */}
      <div className="labels-toolbar">
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => onNav('/campaign/' + id)}
        >
          <I.ArrowLeft />Retour
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{campaign.code} — Étiquettes colis</div>
          <div style={{ fontSize: 12, color: 'var(--ink-400)' }}>
            {parcels.length} étiquettes · Format A6 · 2 par ligne A4
          </div>
        </div>
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => window.print()}
        >
          <I.Print />Imprimer tout
        </button>
      </div>

      {/* Grille d'étiquettes */}
      <div className="labels-grid">
        {parcels.map((p, idx) => (
          <div key={p.id} className="label-card">
            {/* En-tête */}
            <div className="label-head">
              <span className="label-brand">JUMLA CARGO</span>
              <span className="label-campaign">{campaign.code}</span>
            </div>

            {/* Code colis — gros */}
            <div className="label-code">{p.code}</div>

            {/* Route */}
            <div className="label-route">
              <span>{route?.fromCity || 'Douala'}</span>
              <span className="label-route-plane">✈</span>
              <span>{route?.toCity || 'Montréal'}</span>
            </div>

            {/* Expéditeur / Destinataire */}
            <div className="label-parties">
              <div className="label-party">
                <div className="label-party-tag">EXPÉDITEUR</div>
                <div className="label-party-name">{p.senderName}</div>
                <div className="label-party-detail">{p.senderPhone}</div>
                <div className="label-party-detail">Douala, Cameroun</div>
              </div>
              <div className="label-arrow">→</div>
              <div className="label-party label-party--right">
                <div className="label-party-tag">DESTINATAIRE</div>
                <div className="label-party-name">{p.recipName}</div>
                <div className="label-party-detail">{p.recipPhone}</div>
                <div className="label-party-detail">{p.recipCity}, Canada</div>
              </div>
            </div>

            {/* Pied */}
            <div className="label-foot">
              <span><strong>{p.actualKg} kg</strong></span>
              <span>{p.delivery === 'home' ? '🏠 Livraison domicile' : '🏭 Retrait entrepôt'}</span>
              <span style={{ marginLeft: 'auto' }}><strong>{p.amount} CAD</strong></span>
            </div>

            {/* Numéro d'ordre — discret */}
            <div className="label-idx">{String(idx + 1).padStart(2, '0')}/{String(parcels.length).padStart(2, '0')}</div>
          </div>
        ))}
      </div>

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

        /* ── Grid ── */
        .labels-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          padding: 24px;
          max-width: 960px;
          margin: 0 auto;
        }

        /* ── Label card ── */
        .label-card {
          background: white;
          border: 1.5px solid #E5E7EB;
          border-radius: 8px;
          overflow: hidden;
          font-family: 'Inter', system-ui, sans-serif;
          page-break-inside: avoid;
          position: relative;
        }

        .label-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #0B1220;
          color: white;
        }
        .label-brand {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .1em;
          color: white;
        }
        .label-campaign {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(255,255,255,.5);
        }

        .label-code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 36px;
          font-weight: 700;
          text-align: center;
          padding: 18px 12px 6px;
          color: #0B1220;
          letter-spacing: .06em;
        }

        .label-route {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 11px;
          font-weight: 600;
          color: #6B7280;
          text-transform: uppercase;
          letter-spacing: .06em;
          padding: 0 12px 14px;
        }
        .label-route-plane {
          color: #D97706;
          font-size: 16px;
        }

        .label-parties {
          display: flex;
          align-items: stretch;
          border-top: 1.5px solid #E5E7EB;
          border-bottom: 1.5px solid #E5E7EB;
        }
        .label-party {
          flex: 1;
          padding: 10px 12px;
        }
        .label-party--right {
          border-left: 1px solid #E5E7EB;
        }
        .label-arrow {
          display: flex;
          align-items: center;
          padding: 0 2px;
          font-size: 18px;
          color: #D1D5DB;
          flex-shrink: 0;
        }
        .label-party-tag {
          font-size: 8px;
          font-weight: 700;
          letter-spacing: .08em;
          color: #9CA3AF;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .label-party-name {
          font-size: 12.5px;
          font-weight: 700;
          color: #0B1220;
          margin-bottom: 3px;
          line-height: 1.2;
        }
        .label-party-detail {
          font-size: 10.5px;
          color: #6B7280;
          line-height: 1.4;
          font-family: 'JetBrains Mono', monospace;
        }

        .label-foot {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: #F7F8FA;
          font-size: 11.5px;
          color: #4B5563;
        }

        .label-idx {
          position: absolute;
          bottom: 8px;
          right: 12px;
          font-size: 9px;
          color: #D1D5DB;
          font-family: 'JetBrains Mono', monospace;
        }

        /* ── Print ── */
        @media print {
          body { margin: 0; background: white; }
          .labels-toolbar { display: none !important; }
          .labels-grid {
            padding: 8mm;
            gap: 6mm;
            max-width: none;
          }
          .label-card {
            border: 1px solid #ccc;
          }
        }
      `}</style>
    </div>
  );
}
