'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/src/lib/i18n';

function Row({ parcel }) {
  const t        = useT();
  const router   = useRouter();
  const pay      = parcel.payment;
  const partial  = pay?.status === 'partial';

  const PAYMENT_COLOR = {
    completed: { bg: 'var(--ok-50)',   color: 'var(--ok-700)',   label: t('invoices.status.paid') },
    partial:   { bg: '#fef3c7',        color: '#92400e',          label: t('invoices.status.partial') },
    pending:   { bg: 'var(--warn-50)', color: 'var(--warn-700)', label: t('invoices.status.pending') },
  };

  const ps       = PAYMENT_COLOR[pay?.status] ?? { bg: 'var(--bg-soft)', color: 'var(--ink-500)', label: t('invoices.status.unbilled') };
  const amount   = pay?.amount ?? parcel.priceXaf ?? 0;
  const paidAt   = pay?.paidAt ? new Date(pay.paidAt).toLocaleDateString('fr-FR') : null;
  const hasAdj   = parcel.confirmedPriceXaf != null && parcel.adjustmentStatus !== 'none';
  const supplement = hasAdj ? (parcel.confirmedPriceXaf - (parcel.priceXaf ?? 0)) : 0;

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
          {parcel.status}
        </span>
      </td>
      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--ink-900)' }}>
          {amount.toLocaleString('fr')}
        </span>
        <span style={{ fontSize: 11, color: 'var(--ink-400)', marginLeft: 4 }}>CAD</span>
        {partial && pay.allocated > 0 && (
          <div style={{ fontSize: 11, color: '#92400e', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
            Reçu : {pay.allocated.toLocaleString('fr')} · Reste : {pay.remaining.toLocaleString('fr')}
          </div>
        )}
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
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            onClick={() => router.push('/client/invoice/' + parcel.id)}
            style={{
              padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)',
              background: 'white', cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
              color: 'var(--ink-700)',
            }}>
            {t('invoices.button.invoice')}
          </button>
          {hasAdj && supplement > 0 && (
            <button
              onClick={() => router.push('/client/invoice/' + parcel.id + '?adj=1')}
              style={{
                padding: '5px 12px', borderRadius: 7, border: '1px solid #d97706',
                background: '#fffbeb', cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
                color: '#92400e',
              }}>
              {t('invoices.button.supplement')}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function ClientInvoices() {
  const t = useT();
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentEmail, setPaymentEmail] = useState('paiement@jumla.cargo');

  useEffect(() => {
    fetch('/api/public/config').then(r => r.json()).then(d => {
      if (d.paymentEmail) setPaymentEmail(d.paymentEmail);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/me/parcels').then(r => r.json()).then(data => {
      setParcels(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const totalDue  = parcels.reduce((s, p) => s + (p.payment?.remaining ?? (p.payment?.status !== 'completed' ? (p.priceXaf ?? 0) : 0)), 0);
  const totalPaid = parcels.reduce((s, p) => s + (p.payment?.allocated ?? (p.payment?.status === 'completed' ? (p.payment?.amount ?? 0) : 0)), 0);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: 'var(--ink-900)' }}>
        {t('invoices.title')}
      </h1>
      <p style={{ fontSize: 14, color: 'var(--ink-400)', margin: '0 0 24px' }}>
        {t('invoices.subtitle')}
      </p>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
        <div style={{
          background: 'white', border: '1px solid var(--border)', borderRadius: 12,
          padding: '20px 24px',
        }}>
          <div style={{ fontSize: 11.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600, marginBottom: 8 }}>
            {t('invoices.amountDue')}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: totalDue > 0 ? 'var(--bad-500)' : 'var(--ink-900)', fontFamily: 'var(--font-mono)' }}>
            {totalDue.toLocaleString('fr')}
            <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--ink-400)', marginLeft: 6 }}>CAD</span>
          </div>
          {totalDue > 0 && (
            <div style={{ fontSize: 12, color: 'var(--warn-600)', marginTop: 6 }}>
              {t('invoices.paymentMethod')}
            </div>
          )}
        </div>
        <div style={{
          background: 'white', border: '1px solid var(--border)', borderRadius: 12,
          padding: '20px 24px',
        }}>
          <div style={{ fontSize: 11.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600, marginBottom: 8 }}>
            {t('invoices.totalPaid')}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink-900)', fontFamily: 'var(--font-mono)' }}>
            {totalPaid.toLocaleString('fr')}
            <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--ink-400)', marginLeft: 6 }}>CAD</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 6 }}>
            {parcels.filter(p => p.payment?.status === 'completed').length} soldé(s)
            {parcels.some(p => p.payment?.status === 'partial') && (
              <> · {parcels.filter(p => p.payment?.status === 'partial').length} partiel(s)</>
            )}
          </div>
        </div>
      </div>

      {/* Interac info box */}
      {totalDue > 0 && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: 10, padding: '14px 18px', marginBottom: 20, fontSize: 13,
        }}>
          <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 6 }}>{t('invoices.howToPay.title')}</div>
          <div style={{ color: '#b45309', lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{
              __html: t('invoices.howToPay.description').replace('{email}', `<strong>${paymentEmail}</strong>`),
            }}
          />
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-400)' }}>{t('loading')}</div>
      ) : parcels.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-400)', fontSize: 14 }}>
          {t('invoices.empty')}
        </div>
      ) : (
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-soft)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{t('invoices.table.parcel')}</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{t('invoices.table.status')}</th>
                <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11.5, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{t('invoices.table.amount')}</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{t('invoices.table.payment')}</th>
                <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11.5, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{t('invoices.table.action')}</th>
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
