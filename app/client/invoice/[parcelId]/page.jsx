'use client';
import { useState, useEffect } from 'react';

function fmt(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function InvoicePage({ params }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    fetch('/api/me/invoice/' + params.parcelId)
      .then(r => r.json())
      .then(json => {
        if (json.error) setError(json.error);
        else setData(json);
        setLoading(false);
      })
      .catch(() => { setError('Erreur réseau'); setLoading(false); });
  }, [params.parcelId]);

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#6b7280', fontFamily: 'system-ui, sans-serif' }}>
      Chargement…
    </div>
  );

  if (error || !data) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#dc2626', fontFamily: 'system-ui, sans-serif' }}>
      {error || 'Facture introuvable.'}
    </div>
  );

  const paid = data.payment?.status === 'completed';
  const details = data.pricingDetails;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
        body { font-family: system-ui, -apple-system, sans-serif; background: #f3f4f6; margin: 0; }
        .invoice-wrap { max-width: 780px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.09); }
        @media print { .invoice-wrap { margin: 0; border-radius: 0; box-shadow: none; } }
      `}</style>

      {/* Actions bar — hidden on print */}
      <div className="no-print" style={{ maxWidth: 780, margin: '0 auto', padding: '16px 0', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={() => window.history.back()} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: 14 }}>
          ← Retour
        </button>
        <button onClick={() => window.print()} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1e3a5f', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          🖨 Imprimer / PDF
        </button>
      </div>

      <div className="invoice-wrap">
        {/* Header */}
        <div style={{ background: '#1e3a5f', color: 'white', padding: '32px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.02em' }}>Jumla Shipping</div>
            <div style={{ fontSize: 12, opacity: .7, marginTop: 4 }}>Fret international · Douala · Montréal</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'monospace' }}>{data.invoiceNumber}</div>
            <div style={{ fontSize: 12, opacity: .7, marginTop: 4 }}>Émis le {fmt(data.issueDate)}</div>
            <div style={{
              display: 'inline-block', marginTop: 10, padding: '4px 12px', borderRadius: 999,
              background: paid ? '#16a34a' : '#f59e0b',
              fontSize: 12, fontWeight: 700,
            }}>
              {paid ? '✓ PAYÉ' : '⏳ EN ATTENTE'}
            </div>
          </div>
        </div>

        <div style={{ padding: '32px 40px' }}>
          {/* Bill to */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6b7280', marginBottom: 8 }}>Facturé à</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{data.client.name}</div>
              {data.client.city  && <div style={{ fontSize: 13, color: '#4b5563', marginTop: 3 }}>{data.client.city}</div>}
              {data.client.phone && <div style={{ fontSize: 13, color: '#4b5563', fontFamily: 'monospace' }}>{data.client.phone}</div>}
              {data.client.email && <div style={{ fontSize: 13, color: '#4b5563' }}>{data.client.email}</div>}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6b7280', marginBottom: 8 }}>Cargaison</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>{data.campaign.code}</div>
              <div style={{ fontSize: 13, color: '#4b5563', marginTop: 3 }}>{data.campaign.from} → {data.campaign.to}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>Départ : {fmt(data.campaign.departureDate)}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Arrivée : {fmt(data.campaign.arrivalDate)}</div>
            </div>
          </div>

          {/* Items table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Description', 'Poids', 'Montant'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Montant' ? 'right' : 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '14px', borderBottom: '1px solid #f3f4f6', color: '#111827', fontSize: 14 }}>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e3a5f', marginBottom: 3 }}>{data.trackingCode}</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>{data.description || 'Fret international'}</div>
                  {data.bordereaux.length > 0 && (
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                      {data.bordereaux.length} bordereau{data.bordereaux.length > 1 ? 'x' : ''} · {data.bordereaux.reduce((s, b) => s + (b.nbPieces || 0), 0)} pièce{data.bordereaux.reduce((s, b) => s + (b.nbPieces || 0), 0) > 1 ? 's' : ''}
                    </div>
                  )}
                </td>
                <td style={{ padding: '14px', borderBottom: '1px solid #f3f4f6', color: '#374151', fontFamily: 'monospace', fontSize: 14 }}>
                  {data.weightKg ? data.weightKg + ' kg' : '—'}
                </td>
                <td style={{ padding: '14px', borderBottom: '1px solid #f3f4f6', textAlign: 'right', fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#111827' }}>
                  {data.amount.toLocaleString('fr')} CAD
                </td>
              </tr>
            </tbody>
          </table>

          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
            <div style={{ minWidth: 260 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#1e3a5f', borderRadius: 8, color: 'white' }}>
                <span style={{ fontWeight: 700 }}>Total</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 18 }}>{data.amount.toLocaleString('fr')} CAD</span>
              </div>
              {paid && data.payment?.paidAt && (
                <div style={{ textAlign: 'right', fontSize: 12, color: '#16a34a', marginTop: 6, fontWeight: 600 }}>
                  Payé le {fmt(data.payment.paidAt)}
                  {data.payment.interacRef && <span> · Réf. {data.payment.interacRef}</span>}
                </div>
              )}
            </div>
          </div>

          {/* Payment instructions if unpaid */}
          {!paid && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '16px 20px', marginBottom: 24 }}>
              <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 6 }}>Modalités de paiement</div>
              <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.6 }}>
                Effectuez un virement Interac e-Transfert à <strong>paiement@jumla.cargo</strong> pour le montant exact de <strong>{data.amount.toLocaleString('fr')} CAD</strong>.
                Indiquez le code <strong style={{ fontFamily: 'monospace' }}>{data.trackingCode}</strong> en message.
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 20, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af' }}>
            <span>Jumla Shipping SARL · contact@jumla.cargo</span>
            <span>Douala · Montréal · Lagos · Bruxelles</span>
          </div>
        </div>
      </div>
    </>
  );
}
