'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const STATUS_LABEL = {
  enr: 'Enregistré', rec: 'Reçu entrepôt', pre: 'Préparé',
  exp: 'Expédié',    tra: 'En transit',     apd: 'Arrivé pays dest.',
  dou: 'Aux douanes', ins: 'Inspection',    ret: 'Retenu',
  lib: 'Libéré',     del: 'En livraison',   liv: 'Livré',
};

const PAYMENT_COLOR = {
  completed: { bg: 'var(--ok-50)',   color: 'var(--ok-700)',   label: 'Payé' },
  pending:   { bg: 'var(--warn-50)', color: 'var(--warn-700)', label: 'En attente' },
};

function Row({ parcel }) {
  const router   = useRouter();
  const pay      = parcel.payment;
  const ps       = PAYMENT_COLOR[pay?.status] ?? { bg: 'var(--bg-soft)', color: 'var(--ink-500)', label: 'Non facturé' };
  const amount   = pay?.amount ?? parcel.priceXaf ?? 0;
  const paidAt   = pay?.paidAt ? new Date(pay.paidAt).toLocaleDateString('fr-FR') : null;

  return (
    <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
      <td style={{ padding: '14px 16px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13.5, color: 'var(--ink-900)' }}>
          {parcel.trackingCode}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-400)', marginTop: 2 }}>
          {parcel.campaign?.code} · {new Date(parcel.createdAt).toLocaleDateString('fr-FR')}
        </div>
      </td>
      <td style={{ padding: '14px 16px' }}>
        <span style={{ fontSize: 12, color: 'var(--ink-600)' }}>
          {STATUS_LABEL[parcel.status] ?? parcel.status}
        </span>
      </td>
      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--ink-900)' }}>
          {amount.toLocaleString('fr')}
        </span>
        <span style={{ fontSize: 11, color: 'var(--ink-400)', marginLeft: 4 }}>CAD</span>
      </td>
      <td style={{ padding: '14px 16px' }}>
        <span style={{
          display: 'inline-block', padding: '3px 10px', borderRadius: 999,
          background: ps.bg, color: ps.color, fontSize: 12, fontWeight: 600,
        }}>
          {ps.label}
        </span>
        {paidAt && <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 2 }}>le {paidAt}</div>}
        {pay?.interacRef && <div style={{ fontSize: 10.5, color: 'var(--ink-400)', fontFamily: 'var(--font-mono)' }}>{pay.interacRef}</div>}
      </td>
      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
        <button
          onClick={() => router.push('/client/invoice/' + parcel.id)}
          style={{
            padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)',
            background: 'white', cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
            color: 'var(--ink-700)',
          }}>
          📄 Facture
        </button>
      </td>
    </tr>
  );
}

export default function ClientInvoices() {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me/parcels').then(r => r.json()).then(data => {
      setParcels(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const totalDue  = parcels.filter(p => !p.payment || p.payment.status !== 'completed')
    .reduce((s, p) => s + (p.payment?.amount ?? p.priceXaf ?? 0), 0);
  const totalPaid = parcels.filter(p => p.payment?.status === 'completed')
    .reduce((s, p) => s + (p.payment?.amount ?? 0), 0);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: 'var(--ink-900)' }}>
        Paiements &amp; Factures
      </h1>
      <p style={{ fontSize: 14, color: 'var(--ink-400)', margin: '0 0 24px' }}>
        Historique de vos paiements et accès à vos factures.
      </p>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
        <div style={{
          background: 'white', border: '1px solid var(--border)', borderRadius: 12,
          padding: '20px 24px',
        }}>
          <div style={{ fontSize: 11.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600, marginBottom: 8 }}>
            Montant dû
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: totalDue > 0 ? 'var(--bad-500)' : 'var(--ok-600)', fontFamily: 'var(--font-mono)' }}>
            {totalDue.toLocaleString('fr')}
            <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--ink-400)', marginLeft: 6 }}>CAD</span>
          </div>
          {totalDue > 0 && (
            <div style={{ fontSize: 12, color: 'var(--warn-600)', marginTop: 6 }}>
              Paiement par Virement Interac
            </div>
          )}
        </div>
        <div style={{
          background: 'white', border: '1px solid var(--border)', borderRadius: 12,
          padding: '20px 24px',
        }}>
          <div style={{ fontSize: 11.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600, marginBottom: 8 }}>
            Total payé
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--ok-600)', fontFamily: 'var(--font-mono)' }}>
            {totalPaid.toLocaleString('fr')}
            <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--ink-400)', marginLeft: 6 }}>CAD</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 6 }}>
            {parcels.filter(p => p.payment?.status === 'completed').length} envoi(s) soldé(s)
          </div>
        </div>
      </div>

      {/* Interac info box */}
      {totalDue > 0 && (
        <div style={{
          background: 'var(--info-50)', border: '1px solid var(--info-200)',
          borderRadius: 10, padding: '14px 18px', marginBottom: 20, fontSize: 13,
        }}>
          <div style={{ fontWeight: 700, color: 'var(--info-700)', marginBottom: 6 }}>Comment payer ?</div>
          <div style={{ color: 'var(--info-600)', lineHeight: 1.6 }}>
            Envoyez votre virement Interac à <strong>paiement@jumlashipping.ca</strong>.<br />
            Indiquez votre numéro de colis dans le message. Notre équipe confirmera votre paiement sous 24h.
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-400)' }}>Chargement…</div>
      ) : parcels.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-400)', fontSize: 14 }}>
          Aucun colis enregistré.
        </div>
      ) : (
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-soft)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Colis</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Statut</th>
                <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11.5, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Montant</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Paiement</th>
                <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11.5, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {parcels.map(p => <Row key={p.id} parcel={p} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
