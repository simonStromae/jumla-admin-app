'use client';
import { useState, useEffect } from 'react';
import I from '../components/Icons.jsx';
import { Skel } from '../components/Shell.jsx';

export default function CampaignLabelsScreen({ id, onNav }) {
  const [campaign, setCampaign] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    fetch('/api/campaigns/' + id)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setCampaign(d);
        setLoading(false);
      })
      .catch(() => { setError('Erreur réseau'); setLoading(false); });
  }, [id]);

  const parcels = campaign?.parcels ?? [];
  const from    = campaign?.route?.origin      ?? '—';
  const to      = campaign?.route?.destination ?? '—';

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7' }}>
      <div className="labels-toolbar">
        <button className="btn btn--ghost btn--sm" onClick={() => onNav('/admin/campaigns/' + id)}>
          <I.ArrowLeft />Retour
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>
            {loading ? '…' : campaign?.code ?? '—'} — Étiquettes colis
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-400)' }}>
            {loading ? '…' : parcels.length + ' étiquette' + (parcels.length > 1 ? 's' : '') + ' · Format A6 · 2 par ligne A4'}
          </div>
        </div>
        <button className="btn btn--ghost btn--sm" onClick={() => window.print()}>
          <I.Print />Imprimer tout
        </button>
      </div>

      {error && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--bad-700)', fontSize: 14 }}>{error}</div>
      )}

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 24, maxWidth: 960, margin: '0 auto' }}>
          {[1,2,3,4].map(i => <Skel key={i} w="100%" h={180} />)}
        </div>
      )}

      {!loading && !error && parcels.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--ink-400)' }}>
          <I.Box style={{ width: 40, height: 40, margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>Aucun colis dans cette cargaison</div>
        </div>
      )}

      {!loading && !error && parcels.length > 0 && (
        <div className="labels-grid">
          {parcels.map((p, idx) => (
            <div key={p.id} className="label-card">
              <div className="label-head">
                <span className="label-brand">JUMLA CARGO</span>
                <span className="label-campaign">{campaign.code}</span>
              </div>

              <div className="label-code">{p.trackingCode}</div>

              <div className="label-route">
                <span>{from}</span>
                <span className="label-route-plane">✈</span>
                <span>{to}</span>
              </div>

              <div className="label-parties">
                <div className="label-party">
                  <div className="label-party-tag">CLIENT / EXPÉDITEUR</div>
                  <div className="label-party-name">{p.client?.name ?? '—'}</div>
                  <div className="label-party-detail">{p.client?.phone ?? '—'}</div>
                  {p.client?.city && <div className="label-party-detail">{p.client.city}</div>}
                </div>
                <div className="label-arrow">→</div>
                <div className="label-party label-party--right">
                  <div className="label-party-tag">DESTINATION</div>
                  <div className="label-party-name">{to}</div>
                  <div className="label-party-detail">Jumla Shipping</div>
                </div>
              </div>

              <div className="label-foot">
                <span><strong>{p.weightKg ? p.weightKg + ' kg' : '—'}</strong></span>
                {p.description && <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginLeft: 8, fontSize: 10.5, color: '#9CA3AF' }}>{p.description}</span>}
                <span style={{ marginLeft: 'auto' }}><strong>{p.priceXaf ? p.priceXaf.toLocaleString('fr') + ' CAD' : '—'}</strong></span>
              </div>

              <div className="label-idx">{String(idx + 1).padStart(2, '0')}/{String(parcels.length).padStart(2, '0')}</div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .labels-toolbar {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 24px; background: white;
          border-bottom: 1px solid var(--border);
          position: sticky; top: 0; z-index: 10;
        }
        .labels-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 16px; padding: 24px; max-width: 960px; margin: 0 auto;
        }
        .label-card {
          background: white; border: 1.5px solid #E5E7EB; border-radius: 8px;
          overflow: hidden; font-family: 'Inter', system-ui, sans-serif;
          page-break-inside: avoid; position: relative;
        }
        .label-head {
          display: flex; justify-content: space-between; align-items: center;
          padding: 8px 12px; background: #0B1220; color: white;
        }
        .label-brand { font-size: 10px; font-weight: 800; letter-spacing: .1em; }
        .label-campaign { font-family: monospace; font-size: 10px; color: rgba(255,255,255,.5); }
        .label-code {
          font-family: monospace; font-size: 32px; font-weight: 700;
          text-align: center; padding: 16px 12px 6px; color: #0B1220; letter-spacing: .06em;
        }
        .label-route {
          display: flex; align-items: center; justify-content: center; gap: 12px;
          font-size: 11px; font-weight: 600; color: #6B7280;
          text-transform: uppercase; letter-spacing: .06em; padding: 0 12px 14px;
        }
        .label-route-plane { color: #D97706; font-size: 16px; }
        .label-parties {
          display: flex; align-items: stretch;
          border-top: 1.5px solid #E5E7EB; border-bottom: 1.5px solid #E5E7EB;
        }
        .label-party { flex: 1; padding: 10px 12px; }
        .label-party--right { border-left: 1px solid #E5E7EB; }
        .label-arrow {
          display: flex; align-items: center; padding: 0 2px;
          font-size: 18px; color: #D1D5DB; flex-shrink: 0;
        }
        .label-party-tag {
          font-size: 8px; font-weight: 700; letter-spacing: .08em;
          color: #9CA3AF; text-transform: uppercase; margin-bottom: 4px;
        }
        .label-party-name { font-size: 12.5px; font-weight: 700; color: #0B1220; margin-bottom: 3px; }
        .label-party-detail { font-size: 10.5px; color: #6B7280; font-family: monospace; }
        .label-foot {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 12px; background: #F7F8FA; font-size: 11.5px; color: #4B5563;
        }
        .label-idx {
          position: absolute; bottom: 8px; right: 12px;
          font-size: 9px; color: #D1D5DB; font-family: monospace;
        }
        @media print {
          body { margin: 0; background: white; }
          .labels-toolbar { display: none !important; }
          .labels-grid { padding: 8mm; gap: 6mm; max-width: none; }
          .label-card { border: 1px solid #ccc; }
        }
      `}</style>
    </div>
  );
}
