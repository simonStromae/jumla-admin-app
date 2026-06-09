'use client';
import { useState, useEffect } from 'react';

function fmt(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const BL_STATUS = {
  en_attente:  { label: 'En attente de vérification', color: '#6b7280' },
  recu:        { label: 'Reçu',                        color: '#2563eb' },
  verifie:     { label: 'Vérifié',                     color: '#16a34a' },
  discordance: { label: 'Discordance signalée',        color: '#dc2626' },
};

export default function BordereauPage({ params }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    fetch('/api/me/bordereau/' + params.blId)
      .then(r => r.json())
      .then(json => {
        if (json.error) setError(json.error);
        else setData(json);
        setLoading(false);
      })
      .catch(() => { setError('Erreur réseau'); setLoading(false); });
  }, [params.blId]);

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#6b7280', fontFamily: 'system-ui, sans-serif' }}>
      Chargement…
    </div>
  );
  if (error || !data) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#dc2626', fontFamily: 'system-ui, sans-serif' }}>
      {error || 'Bordereau introuvable.'}
    </div>
  );

  const st = BL_STATUS[data.status] ?? { label: data.status, color: '#6b7280' };

  return (
    <>
      <style>{`
        @media print { .no-print { display: none !important; } body { margin: 0; } }
        body { font-family: system-ui, -apple-system, sans-serif; background: #f3f4f6; margin: 0; }
        .bl-wrap { max-width: 720px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.09); }
        @media print { .bl-wrap { margin: 0; border-radius: 0; box-shadow: none; } }
      `}</style>

      <div className="no-print" style={{ maxWidth: 720, margin: '0 auto', padding: '16px 0', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={() => window.history.back()} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: 14 }}>
          ← Retour
        </button>
        <button onClick={() => window.print()} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1e3a5f', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          🖨 Imprimer / PDF
        </button>
      </div>

      <div className="bl-wrap">
        {/* Header */}
        <div style={{ background: '#1e3a5f', color: 'white', padding: '28px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>Jumla Shipping</div>
            <div style={{ fontSize: 11, opacity: .7, marginTop: 3 }}>Bordereau de livraison</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>{data.code}</div>
            <div style={{ fontSize: 11, opacity: .7, marginTop: 3 }}>Émis le {fmt(data.createdAt)}</div>
            <div style={{
              display: 'inline-block', marginTop: 8, padding: '3px 10px', borderRadius: 999,
              background: data.status === 'verifie' ? '#16a34a' : 'rgba(255,255,255,.2)',
              fontSize: 11, fontWeight: 700,
            }}>{st.label}</div>
          </div>
        </div>

        <div style={{ padding: '28px 36px' }}>
          {/* Client + Campaign */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #e5e7eb' }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6b7280', marginBottom: 6 }}>Destinataire</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{data.client.name}</div>
              {data.client.city  && <div style={{ fontSize: 13, color: '#4b5563', marginTop: 2 }}>{data.client.city}</div>}
              {data.client.phone && <div style={{ fontSize: 13, color: '#4b5563', fontFamily: 'monospace' }}>{data.client.phone}</div>}
            </div>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6b7280', marginBottom: 6 }}>Cargaison</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>{data.campaign.code}</div>
              <div style={{ fontSize: 13, color: '#4b5563', marginTop: 2 }}>{data.campaign.from} → {data.campaign.to}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Arrivée prévue : {fmt(data.campaign.arrivalDate)}</div>
            </div>
          </div>

          {/* Colis ref */}
          <div style={{ background: '#f9fafb', borderRadius: 8, padding: '12px 16px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', letterSpacing: '.06em' }}>Colis</div>
              <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: '#1e3a5f', marginTop: 2 }}>{data.parcel.trackingCode}</div>
              {data.parcel.description && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{data.parcel.description}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', letterSpacing: '.06em' }}>Paiement</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2, color: data.paid ? '#16a34a' : '#f59e0b' }}>
                {data.paid ? `✓ Payé${data.paidAt ? ' le ' + fmt(data.paidAt) : ''}` : '⏳ En attente'}
              </div>
            </div>
          </div>

          {/* BL details */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Description', 'Poids', 'Pièces'].map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: h === 'Poids' || h === 'Pièces' ? 'center' : 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#6b7280', border: '1px solid #e5e7eb' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '12px 14px', border: '1px solid #e5e7eb', color: '#111827', fontSize: 14 }}>
                  {data.description || '—'}
                </td>
                <td style={{ padding: '12px 14px', border: '1px solid #e5e7eb', textAlign: 'center', fontFamily: 'monospace', fontSize: 14, fontWeight: 600 }}>
                  {data.weightKg ? data.weightKg + ' kg' : '—'}
                </td>
                <td style={{ padding: '12px 14px', border: '1px solid #e5e7eb', textAlign: 'center', fontFamily: 'monospace', fontSize: 14, fontWeight: 600 }}>
                  {data.nbPieces ?? '—'}
                </td>
              </tr>
            </tbody>
          </table>

          {data.notes && (
            <div style={{ padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 13, color: '#92400e', marginBottom: 24 }}>
              <strong>Note :</strong> {data.notes}
            </div>
          )}

          {/* Signature zones */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 40 }}>
            {['Signature Jumla Shipping', 'Signature destinataire'].map(label => (
              <div key={label}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 40 }}>{label}</div>
                <div style={{ borderBottom: '1px solid #d1d5db' }} />
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>Date : _______________</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16, marginTop: 28, display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#9ca3af' }}>
            <span>Jumla Shipping SARL · contact@jumla.cargo</span>
            <span>Douala · Montréal · Lagos · Bruxelles</span>
          </div>
        </div>
      </div>
    </>
  );
}
