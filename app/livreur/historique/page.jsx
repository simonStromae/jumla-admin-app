'use client';
import { useState, useEffect } from 'react';

const FILTERS = [
  { key: 'ok',  label: 'Livrés'           },
  { key: 'tdl', label: 'Tentatives'       },
  { key: '',    label: 'Tous'             },
];

export default function DriverHistoriquePage() {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('ok');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/driver/parcels${filter ? `?status=${filter}` : ''}`)
      .then(r => r.json())
      .then(d => { setParcels(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filter]);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

  const STATUS_STYLE = {
    ok:  { label: 'Livré',             color: '#059669', bg: '#ECFDF5' },
    tdl: { label: 'Tentative échouée', color: '#DC2626', bg: '#FEF2F2' },
    liv: { label: 'En livraison',       color: '#1B4FD8', bg: '#EFF6FF' },
    pdl: { label: 'Prêt',              color: '#10B981', bg: '#ECFDF5' },
  };

  return (
    <div style={{ padding: '0 0 16px' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '14px 14px 0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#111827', marginBottom: 10 }}>Historique</div>
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10 }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: 'none',
                fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                background: filter === f.key ? '#1B4FD8' : '#F4F5F7',
                color:      filter === f.key ? 'white'   : '#374151',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '10px 14px 0' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
            Chargement…
          </div>
        ) : parcels.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#9CA3AF' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Aucun résultat</div>
            <div style={{ fontSize: 13 }}>Aucun colis pour ce filtre.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {parcels.map(p => {
              const s   = STATUS_STYLE[p.status] ?? { label: p.status, color: '#6B7280', bg: '#F4F5F7' };
              const tel = p.recipPhone || p.client?.phone;
              const dateRef = p.deliveredAt ?? p.createdAt;
              return (
                <div key={p.id} className="drv-card" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#111827' }}>{p.trackingCode}</span>
                      {p.campaign?.code && (
                        <span style={{ marginLeft: 6, fontSize: 11, color: '#9CA3AF' }}>{p.campaign.code}</span>
                      )}
                    </div>
                    <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, color: s.color, background: s.bg }}>
                      {s.label}
                    </span>
                  </div>

                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827', marginBottom: 2 }}>
                    {p.recipName || p.client?.name}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      {p.recipCity && <span style={{ fontSize: 12, color: '#6B7280' }}>📍 {p.recipCity}</span>}
                      {tel && (
                        <a href={`tel:${tel}`} style={{ marginLeft: 8, fontSize: 12, color: '#6B7280', textDecoration: 'none' }}>
                          {tel}
                        </a>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0, marginLeft: 8 }}>{fmtDate(dateRef)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
