'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function CampaignInvoicePage() {
  const { campaignId } = useParams();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [config, setConfig] = useState({});

  useEffect(() => {
    fetch('/api/public/config').then(r => r.json()).then(d => setConfig(d)).catch(() => {});
    fetch('/api/me/invoice/campaign/' + campaignId)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); setLoading(false); })
      .catch(() => { setError('Erreur réseau'); setLoading(false); });
  }, [campaignId]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Chargement…</div>;
  if (error)   return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>{error}</div>;

  const { campaign, client, items, totalInvoiced, totalAllocated, totalRemaining, totalWeight, allPaid, invoiceNumber, issueDate } = data;
  const cur = campaign?.currency ?? 'CAD';

  const STATUS_LABEL = {
    completed: { label: 'Soldé',       color: '#047857', bg: '#ecfdf5' },
    partial:   { label: 'Partiel',     color: '#b45309', bg: '#fffbeb' },
    pending:   { label: 'En attente',  color: '#b91c1c', bg: '#fef2f2' },
  };

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '24px 16px 60px' }}>
      {/* Print button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20, gap: 8 }}>
        <button
          onClick={() => window.print()}
          style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: '#374151' }}
        >
          🖨 Imprimer / PDF
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }} id="invoice-print">
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #00B4D8 0%, #1B4FD8 100%)', padding: '28px 32px', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', opacity: .8, marginBottom: 6 }}>
                Facture groupée
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.01em', marginBottom: 4 }}>
                {invoiceNumber}
              </div>
              <div style={{ fontSize: 13, opacity: .85 }}>
                Cargaison {campaign.code} · {campaign.from} → {campaign.to}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, opacity: .7, marginBottom: 4 }}>Émise le</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {new Date(issueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div style={{
                marginTop: 10, padding: '4px 14px', borderRadius: 99,
                background: allPaid ? 'rgba(255,255,255,.25)' : 'rgba(255,100,100,.35)',
                fontSize: 12, fontWeight: 700,
              }}>
                {allPaid ? '✓ Tout soldé' : `${totalRemaining.toLocaleString('fr')} ${cur} restant`}
              </div>
            </div>
          </div>
        </div>

        {/* Client + campaign info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ padding: '20px 32px', borderRight: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9ca3af', marginBottom: 10 }}>Expéditeur</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{client.name}</div>
            {client.phone && <div style={{ fontSize: 13, color: '#6b7280' }}>📱 {client.phone}</div>}
            {client.email && <div style={{ fontSize: 13, color: '#6b7280' }}>✉ {client.email}</div>}
            {client.city  && <div style={{ fontSize: 13, color: '#6b7280' }}>📍 {client.city}</div>}
          </div>
          <div style={{ padding: '20px 32px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9ca3af', marginBottom: 10 }}>Cargaison</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{campaign.code}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              {campaign.from} → {campaign.to}
            </div>
            {campaign.departureDate && (
              <div style={{ fontSize: 13, color: '#6b7280' }}>
                Départ : {new Date(campaign.departureDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
              </div>
            )}
            {campaign.arrivalDate && (
              <div style={{ fontSize: 13, color: '#6b7280' }}>
                Arrivée : {new Date(campaign.arrivalDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
              </div>
            )}
          </div>
        </div>

        {/* Summary totals */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid #e5e7eb' }}>
          {[
            { label: 'Total colis', value: items.length, mono: false },
            { label: 'Poids total', value: `${totalWeight} kg`, mono: true },
            { label: 'Montant total', value: `${totalInvoiced.toLocaleString('fr')} ${cur}`, mono: true },
          ].map((stat, i) => (
            <div key={stat.label} style={{ padding: '16px 24px', borderRight: i < 2 ? '1px solid #e5e7eb' : 'none' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9ca3af', marginBottom: 6 }}>{stat.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#111827', fontFamily: stat.mono ? 'monospace' : 'inherit' }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Items table */}
        <div style={{ padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Code colis', 'Description', 'Poids', 'Montant', 'Statut paiement'].map((h, i) => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: i >= 2 ? 'right' : 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const ps = STATUS_LABEL[item.paymentStatus] ?? { label: 'Non facturé', color: '#6b7280', bg: '#f9fafb' };
                return (
                  <tr key={item.id} style={{ borderBottom: i < items.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#111827' }}>
                      {item.trackingCode}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12.5, color: '#6b7280', maxWidth: 200 }}>
                      {item.description ?? '—'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontSize: 13, color: '#374151' }}>
                      {item.weightKg ? `${item.weightKg} kg` : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: 13.5, color: '#111827' }}>
                      {item.invoiced.toLocaleString('fr')} <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 400 }}>{cur}</span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, background: ps.bg, color: ps.color, fontSize: 11.5, fontWeight: 600 }}>
                        {ps.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer totals */}
        <div style={{ borderTop: '2px solid #e5e7eb', padding: '20px 24px', background: '#f9fafb' }}>
          <div style={{ maxWidth: 300, marginLeft: 'auto' }}>
            {[
              { label: 'Total facturé', value: totalInvoiced, bold: false },
              { label: 'Montant reçu', value: totalAllocated, bold: false, color: '#047857' },
              { label: 'Solde restant', value: totalRemaining, bold: true, color: totalRemaining > 0 ? '#b91c1c' : '#047857' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: row.bold ? 'none' : '1px solid #e5e7eb' }}>
                <span style={{ fontSize: row.bold ? 15 : 13, fontWeight: row.bold ? 800 : 500, color: '#374151' }}>{row.label}</span>
                <span style={{ fontFamily: 'monospace', fontSize: row.bold ? 18 : 14, fontWeight: row.bold ? 800 : 600, color: row.color ?? '#111827' }}>
                  {row.value.toLocaleString('fr')} {cur}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment instructions if remaining > 0 */}
        {totalRemaining > 0 && config.paymentEmail && (
          <div style={{ padding: '16px 32px', borderTop: '1px solid #e5e7eb', background: '#eff6ff', fontSize: 13, color: '#1e40af' }}>
            <strong>Paiement par Virement Interac :</strong> {config.paymentEmail}
            {config.paymentNote && <span> · {config.paymentNote}</span>}
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print, #invoice-print * { visibility: visible; }
          #invoice-print { position: absolute; top: 0; left: 0; width: 100%; border: none !important; border-radius: 0 !important; }
          button { display: none !important; }
        }
      `}</style>
    </div>
  );
}
