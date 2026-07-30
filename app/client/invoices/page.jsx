'use client';
import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useT } from '@/src/lib/i18n';

// ─── Standard: one row per parcel ────────────────────────────────────────────
function ParcelRow({ parcel }) {
  const t      = useT();
  const router = useRouter();
  const pay    = parcel.payment;
  const partial = pay?.status === 'partial';

  const PAYMENT_COLOR = {
    completed: { bg: 'var(--ok-50)',   color: 'var(--ok-700)',   label: t('invoices.status.paid') },
    partial:   { bg: 'var(--bad-100)', color: 'var(--bad-700)',  label: t('invoices.status.partial') },
    pending:   { bg: 'var(--bad-50)',  color: 'var(--bad-700)',  label: t('invoices.status.pending') },
  };

  const ps      = PAYMENT_COLOR[pay?.status] ?? { bg: 'var(--bg-soft)', color: 'var(--ink-500)', label: t('invoices.status.unbilled') };
  const amount  = pay?.amount ?? parcel.priceXaf ?? 0;
  const paidAt  = pay?.paidAt ? new Date(pay.paidAt).toLocaleDateString('fr-FR') : null;
  const hasAdj  = parcel.confirmedPriceXaf != null && parcel.adjustmentStatus !== 'none';
  const supplement = hasAdj ? (parcel.confirmedPriceXaf - (parcel.priceXaf ?? 0)) : 0;

  return (
    <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
      <td style={{ padding: '14px 16px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13.5, color: 'var(--ink-900)' }}>{parcel.trackingCode}</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-400)', marginTop: 2 }}>
          {parcel.campaign?.code} · {new Date(parcel.createdAt).toLocaleDateString('fr-FR')}
        </div>
      </td>
      <td style={{ padding: '14px 16px' }}>
        <span style={{ fontSize: 12, color: 'var(--ink-600)' }}>{parcel.status}</span>
      </td>
      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--ink-900)' }}>{amount.toLocaleString('fr')}</span>
        <span style={{ fontSize: 11, color: 'var(--ink-400)', marginLeft: 4 }}>CAD</span>
        {partial && pay.allocated > 0 && (
          <div style={{ fontSize: 11, color: 'var(--bad-600)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
            Reçu : {pay.allocated.toLocaleString('fr')} · Reste : {pay.remaining.toLocaleString('fr')}
          </div>
        )}
      </td>
      <td style={{ padding: '14px 16px' }}>
        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, background: ps.bg, color: ps.color, fontSize: 12, fontWeight: 600 }}>
          {ps.label}
        </span>
        {paidAt && <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 2 }}>le {paidAt}</div>}
        {pay?.interacRef && <div style={{ fontSize: 10.5, color: 'var(--ink-400)', fontFamily: 'var(--font-mono)' }}>{pay.interacRef}</div>}
      </td>
      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/client/invoice/' + parcel.id)} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: 'var(--ink-700)' }}>
            {t('invoices.button.invoice')}
          </button>
          {hasAdj && supplement > 0 && (
            <button onClick={() => router.push('/client/invoice/' + parcel.id + '?adj=1')} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--brand-50)', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: 'var(--brand-700)' }}>
              {t('invoices.button.supplement')}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Business: one row per campaign, expandable ───────────────────────────────
function CampaignRow({ campaignId, campaign, parcels }) {
  const router    = useRouter();
  const [open, setOpen] = useState(false);

  const totalAmount  = parcels.reduce((s, p) => s + (p.payment?.amount ?? p.priceXaf ?? 0), 0);
  const totalWeight  = parcels.reduce((s, p) => s + (p.weightKg ?? 0), 0);
  const allocated    = parcels.reduce((s, p) => s + (p.payment?.allocated ?? 0), 0);
  const remaining    = parcels.reduce((s, p) => s + (p.payment?.remaining ?? 0), 0);
  const allPaid      = parcels.every(p => p.payment?.status === 'completed');
  const anyPartial   = !allPaid && parcels.some(p => (p.payment?.allocated ?? 0) > 0);

  const payStatus = allPaid ? 'completed' : anyPartial ? 'partial' : 'pending';
  const COLORS = {
    completed: { bg: 'var(--ok-50)',   color: 'var(--ok-700)',   label: 'Soldé' },
    partial:   { bg: 'var(--bad-100)', color: 'var(--bad-700)',  label: 'Partiel' },
    pending:   { bg: 'var(--bad-50)',  color: 'var(--bad-700)',  label: 'En attente' },
  };
  const ps = COLORS[payStatus];

  return (
    <>
      {/* Campaign summary row */}
      <tr
        onClick={() => setOpen(o => !o)}
        style={{ borderBottom: '1px solid var(--border-soft)', cursor: 'pointer', background: open ? 'var(--brand-50)' : 'white' }}
      >
        <td style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, transition: 'transform .2s', display: 'inline-block', transform: open ? 'rotate(90deg)' : 'none', color: 'var(--ink-400)' }}>▶</span>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 14, color: 'var(--ink-900)' }}>
                {campaign?.code ?? campaignId}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-400)', marginTop: 2 }}>
                {campaign?.from} → {campaign?.to} · {parcels.length} colis · {Math.round(totalWeight * 10) / 10} kg
              </div>
            </div>
          </div>
        </td>
        <td style={{ padding: '14px 16px' }}>
          <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>
            {parcels.length} colis
          </span>
        </td>
        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 15, color: 'var(--ink-900)' }}>
            {totalAmount.toLocaleString('fr')}
          </span>
          <span style={{ fontSize: 11, color: 'var(--ink-400)', marginLeft: 4 }}>CAD</span>
          {anyPartial && (
            <div style={{ fontSize: 11, color: 'var(--bad-600)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
              Reçu : {allocated.toLocaleString('fr')} · Reste : {remaining.toLocaleString('fr')}
            </div>
          )}
        </td>
        <td style={{ padding: '14px 16px' }}>
          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, background: ps.bg, color: ps.color, fontSize: 12, fontWeight: 600 }}>
            {ps.label}
          </span>
        </td>
        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
          <button
            onClick={e => { e.stopPropagation(); router.push('/client/invoice/campaign/' + campaignId); }}
            style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: 'var(--ink-700)' }}
          >
            Facture groupée
          </button>
        </td>
      </tr>

      {/* Expanded: individual parcel rows */}
      {open && parcels.map((p, i) => {
        const pay    = p.payment;
        const paid   = pay?.status === 'completed';
        const partial = pay?.status === 'partial';
        const amount = pay?.amount ?? p.priceXaf ?? 0;
        const pColor = paid ? 'var(--ok-700)' : 'var(--bad-600)';
        return (
          <tr key={p.id} style={{ borderBottom: i < parcels.length - 1 ? '1px solid var(--border-soft)' : 'none', background: 'var(--bg-soft)' }}>
            <td style={{ padding: '10px 16px 10px 40px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12.5, color: 'var(--ink-700)' }}>{p.trackingCode}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 1 }}>{p.status} {p.weightKg ? `· ${p.weightKg} kg` : ''}</div>
            </td>
            <td style={{ padding: '10px 16px' }}>
              <span style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>{p.status}</span>
            </td>
            <td style={{ padding: '10px 16px', textAlign: 'right' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13, color: 'var(--ink-800)' }}>
                {amount.toLocaleString('fr')}
              </span>
              <span style={{ fontSize: 10, color: 'var(--ink-400)', marginLeft: 3 }}>CAD</span>
            </td>
            <td style={{ padding: '10px 16px' }}>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: pColor }}>
                {paid ? '✓ Soldé' : partial ? 'Partiel' : 'En attente'}
              </span>
            </td>
            <td style={{ padding: '10px 16px', textAlign: 'right' }}>
              <button onClick={() => router.push('/client/invoice/' + p.id)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: 11.5, color: 'var(--ink-600)' }}>
                Facture
              </button>
            </td>
          </tr>
        );
      })}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ClientInvoices() {
  const t = useT();
  const { data: session } = useSession();
  const clientType  = session?.user?.clientType;
  const isBusiness  = clientType === 'commercial' || clientType === 'partenaire';
  const [parcels, setParcels]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [paymentEmail, setPaymentEmail] = useState('incjumla@gmail.com');

  useEffect(() => {
    fetch('/api/public/config').then(r => r.json()).then(d => {
      if (d.paymentEmail) setPaymentEmail(d.paymentEmail);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/me/parcels').then(r => r.json()).then(data => {
      setParcels(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Group by campaign for business clients
  const campaignGroups = useMemo(() => {
    if (!isBusiness) return null;
    const map = {};
    parcels.forEach(p => {
      const cid = p.campaign?.id ?? '__unknown__';
      if (!map[cid]) map[cid] = { campaignId: cid, campaign: p.campaign, parcels: [] };
      map[cid].parcels.push(p);
    });
    return Object.values(map).sort((a, b) => {
      const aMax = Math.max(...a.parcels.map(p => new Date(p.createdAt).getTime()));
      const bMax = Math.max(...b.parcels.map(p => new Date(p.createdAt).getTime()));
      return bMax - aMax;
    });
  }, [parcels, isBusiness]);

  const totalDue  = parcels.reduce((s, p) => s + (p.payment?.remaining ?? (p.payment?.status !== 'completed' ? (p.priceXaf ?? 0) : 0)), 0);
  const totalPaid = parcels.reduce((s, p) => s + (p.payment?.allocated ?? (p.payment?.status === 'completed' ? (p.payment?.amount ?? 0) : 0)), 0);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: 'var(--ink-900)' }}>
        {t('invoices.title')}
      </h1>
      <p style={{ fontSize: 14, color: 'var(--ink-400)', margin: '0 0 24px' }}>
        {isBusiness ? 'Récapitulatif de vos cargaisons et paiements' : t('invoices.subtitle')}
      </p>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ fontSize: 11.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600, marginBottom: 8 }}>
            {t('invoices.amountDue')}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: totalDue > 0 ? 'var(--bad-500)' : 'var(--ink-900)', fontFamily: 'var(--font-mono)' }}>
            {totalDue.toLocaleString('fr')}
            <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--ink-400)', marginLeft: 6 }}>CAD</span>
          </div>
          {totalDue > 0 && <div style={{ fontSize: 12, color: 'var(--bad-600)', marginTop: 6 }}>{t('invoices.paymentMethod')}</div>}
        </div>
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ fontSize: 11.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600, marginBottom: 8 }}>
            {t('invoices.totalPaid')}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink-900)', fontFamily: 'var(--font-mono)' }}>
            {totalPaid.toLocaleString('fr')}
            <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--ink-400)', marginLeft: 6 }}>CAD</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 6 }}>
            {isBusiness
              ? `${campaignGroups?.filter(g => g.parcels.every(p => p.payment?.status === 'completed')).length ?? 0} cargaison(s) soldée(s)`
              : `${parcels.filter(p => p.payment?.status === 'completed').length} soldé(s)${parcels.some(p => p.payment?.status === 'partial') ? ` · ${parcels.filter(p => p.payment?.status === 'partial').length} partiel(s)` : ''}`}
          </div>
        </div>
      </div>

      {/* Interac info box */}
      {totalDue > 0 && (
        <div style={{ background: 'var(--info-50)', border: '1px solid var(--info-100)', borderRadius: 10, padding: '14px 18px', marginBottom: 20, fontSize: 13 }}>
          <div style={{ fontWeight: 700, color: 'var(--info-700)', marginBottom: 6 }}>{t('invoices.howToPay.title')}</div>
          <div style={{ color: 'var(--info-600)', lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: t('invoices.howToPay.description').replace('{email}', `<strong>${paymentEmail}</strong>`) }}
          />
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-400)' }}>{t('loading')}</div>
      ) : parcels.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-400)', fontSize: 14 }}>{t('invoices.empty')}</div>
      ) : (
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-soft)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  {isBusiness ? 'Cargaison' : t('invoices.table.parcel')}
                </th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  {isBusiness ? 'Colis' : t('invoices.table.status')}
                </th>
                <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11.5, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  {t('invoices.table.amount')}
                </th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  {t('invoices.table.payment')}
                </th>
                <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11.5, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  {t('invoices.table.action')}
                </th>
              </tr>
            </thead>
            <tbody>
              {isBusiness
                ? campaignGroups.map(g => <CampaignRow key={g.campaignId} {...g} />)
                : parcels.map(p => <ParcelRow key={p.id} parcel={p} />)
              }
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
