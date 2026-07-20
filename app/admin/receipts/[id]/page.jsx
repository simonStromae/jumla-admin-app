'use client';
import { useState, useEffect } from 'react';

const METHOD_LABELS = {
  interac:     'Virement Interac',
  cash:        'Espèces',
  mobilemoney: 'Mobile Money',
  cheque:      'Chèque',
  virement:    'Virement bancaire',
};

function fmt(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtTime(date) {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function TransactionReceiptPage({ params }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    fetch('/api/admin/transactions/' + params.id)
      .then(r => r.json())
      .then(json => {
        if (json.error) setError(json.error);
        else setData(json);
        setLoading(false);
      })
      .catch(() => { setError('Erreur réseau'); setLoading(false); });
  }, [params.id]);

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#6b7280', fontFamily: 'system-ui, sans-serif' }}>
      Chargement…
    </div>
  );

  if (error || !data) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#dc2626', fontFamily: 'system-ui, sans-serif' }}>
      {error || 'Reçu introuvable.'}
    </div>
  );

  const allocs  = Array.isArray(data.allocations) ? data.allocations : [];
  const isCredit = data.type === 'credit';
  const receiptNumber = 'REC-' + data.id.slice(0, 8).toUpperCase();

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .receipt-wrap { margin: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
        }
        @page { margin: 1cm; }
        body { font-family: system-ui, -apple-system, sans-serif; background: #f3f4f6; margin: 0; }
        .receipt-wrap { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.09); }
      `}</style>

      <div className="no-print" style={{ maxWidth: 600, margin: '0 auto', padding: '16px 0', display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => window.history.back()} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: 14 }}>
          ← Retour
        </button>
        <button onClick={() => window.print()} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1e3a5f', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          ⬇ Exporter PDF
        </button>
      </div>

      <div className="receipt-wrap">
        {/* Header */}
        <div style={{ background: isCredit ? '#4338ca' : '#1e3a5f', color: 'white', padding: '28px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.02em' }}>Jumla Shipping</div>
            <div style={{ fontSize: 11, opacity: .7, marginTop: 3 }}>Fret international · Douala · Montréal</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', opacity: .9 }}>{receiptNumber}</div>
            <div style={{ fontSize: 11, opacity: .7, marginTop: 3 }}>
              {isCredit ? 'Avoir / Crédit client' : 'Reçu de paiement'}
            </div>
            <div style={{ fontSize: 11, opacity: .7, marginTop: 2 }}>
              {fmt(data.createdAt)} à {fmtTime(data.createdAt)}
            </div>
          </div>
        </div>

        <div style={{ padding: '28px 36px' }}>
          {/* Amount — centred, prominent */}
          <div style={{ textAlign: 'center', margin: '8px 0 28px', padding: '20px', background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6b7280', marginBottom: 6 }}>
              {isCredit ? 'Crédit accordé' : 'Montant reçu'}
            </div>
            <div style={{ fontSize: 40, fontWeight: 800, fontFamily: 'monospace', color: isCredit ? '#4338ca' : '#16a34a', letterSpacing: '.02em' }}>
              {data.amount.toLocaleString('fr')}
              <span style={{ fontSize: 18, fontWeight: 600, marginLeft: 6, opacity: .7 }}>CAD</span>
            </div>
            <div style={{ display: 'inline-block', marginTop: 10, padding: '4px 14px', borderRadius: 999, background: '#d1fae5', color: '#065f46', fontSize: 12, fontWeight: 700 }}>
              ✓ ENREGISTRÉ
            </div>
          </div>

          {/* Details grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6b7280', marginBottom: 6 }}>Client</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{data.client.name}</div>
              {data.client.city  && <div style={{ fontSize: 12, color: '#4b5563', marginTop: 2 }}>{data.client.city}</div>}
              {data.client.phone && <div style={{ fontSize: 12, color: '#4b5563', fontFamily: 'monospace' }}>{data.client.phone}</div>}
              {data.client.email && <div style={{ fontSize: 12, color: '#4b5563' }}>{data.client.email}</div>}
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6b7280', marginBottom: 6 }}>Paiement</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{METHOD_LABELS[data.method] ?? data.method}</div>
              {data.reference && (
                <div style={{ fontSize: 12, color: '#4b5563', fontFamily: 'monospace', marginTop: 3 }}>Réf : {data.reference}</div>
              )}
              {data.recordedByName && (
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>Par : {data.recordedByName}</div>
              )}
              {data.note && (
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3, fontStyle: 'italic' }}>{data.note}</div>
              )}
            </div>
          </div>

          {/* Allocations */}
          {allocs.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6b7280', marginBottom: 8 }}>
                Colis soldés ({allocs.length})
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Colis', 'Cargaison', 'Montant imputé'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Montant imputé' ? 'right' : 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allocs.map((a, i) => (
                    <tr key={i}>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', fontFamily: 'monospace', fontWeight: 700, color: '#1e3a5f', fontSize: 13 }}>
                        {a.trackingCode}
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 12, color: '#4b5563' }}>
                        {a.campaignCode ?? '—'}
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>
                        {Number(a.amount).toLocaleString('fr')} CAD
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f9fafb' }}>
                    <td colSpan={2} style={{ padding: '10px 12px', fontWeight: 700, fontSize: 12 }}>Total imputé</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, fontSize: 13 }}>
                      {allocs.reduce((s, a) => s + Number(a.amount), 0).toLocaleString('fr')} CAD
                    </td>
                  </tr>
                  {data.amount - allocs.reduce((s, a) => s + Number(a.amount), 0) > 0.01 && (
                    <tr>
                      <td colSpan={2} style={{ padding: '10px 12px', fontSize: 12, color: '#4338ca', fontWeight: 600 }}>Crédit résiduel (solde client)</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#4338ca' }}>
                        +{(data.amount - allocs.reduce((s, a) => s + Number(a.amount), 0)).toLocaleString('fr')} CAD
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          )}

          {allocs.length === 0 && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#1e40af' }}>
              Ce montant a été crédité au compte du client (aucune facture allouée).
            </div>
          )}

          {/* Footer */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af' }}>
            <span>Jumla Shipping Inc. · info@jumlas.com</span>
            <span>Douala · Montréal · Lagos · Bruxelles</span>
          </div>
        </div>
      </div>
    </>
  );
}
