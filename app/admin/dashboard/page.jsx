'use client';
import { useState, useEffect } from 'react';
import { useNav } from '@/src/lib/nav';

function formatCAD(amount) {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(Number(amount) || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-CA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function ageDays(dateStr) {
  if (!dateStr) return 0;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function KpiCard({ label, value, warn, neutral }) {
  const color = warn
    ? 'var(--bad-500)'
    : neutral
    ? 'var(--ink-700)'
    : 'var(--ok-600)';

  const bg = warn
    ? 'var(--bad-50, #fff5f5)'
    : neutral
    ? 'white'
    : 'white';

  return (
    <div
      style={{
        flex: 1,
        background: bg,
        border: warn ? '1px solid var(--bad-200, #fecaca)' : '1px solid var(--border)',
        borderRadius: 12,
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const isPartial = status === 'partial';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 10px',
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 700,
      background: isPartial ? 'var(--warn-100, #fff7ed)' : 'var(--bad-100, #fef2f2)',
      color: isPartial ? 'var(--warn-700, #c2410c)' : 'var(--bad-600, #dc2626)',
      border: isPartial ? '1px solid var(--warn-300, #fdba74)' : '1px solid var(--bad-200, #fecaca)',
    }}>
      {isPartial ? 'Partiel' : 'En attente'}
    </span>
  );
}

export default function DashboardPage() {
  const onNav = useNav();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/urgences')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('fr-CA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const unconfirmed = data?.unconfirmedBordereaux ?? [];
  const unpaid = data?.unpaidInvoices ?? [];
  const missingWeight = data?.missingWeightCount ?? 0;
  const totalUnpaid = unpaid.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const hasUrgences = unconfirmed.length > 0 || unpaid.length > 0;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--ink-900)' }}>
            Tableau de bord
          </h1>
          <div style={{ marginTop: 4, fontSize: 13, color: 'var(--ink-400)', textTransform: 'capitalize' }}>
            {today}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        <KpiCard
          label="Bordereaux à confirmer"
          value={loading ? '…' : unconfirmed.length}
          warn={!loading && unconfirmed.length > 0}
        />
        <KpiCard
          label="Factures en attente"
          value={loading ? '…' : unpaid.length}
          warn={!loading && unpaid.length > 0}
        />
        <KpiCard
          label="Colis sans poids"
          value={loading ? '…' : missingWeight}
          neutral
        />
        <KpiCard
          label="Total impayé"
          value={loading ? '…' : formatCAD(totalUnpaid)}
          warn={!loading && totalUnpaid > 0}
        />
      </div>

      {/* Urgences Section */}
      <div
        style={{
          background: 'white',
          border: '1px solid var(--border)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-900)' }}>
            ⚡ Actions requises aujourd'hui
          </span>
        </div>

        {loading && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-400)', fontSize: 14 }}>
            Chargement…
          </div>
        )}

        {!loading && !hasUrgences && (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: 'var(--ok-600)',
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            Rien à traiter — tout est en ordre ✓
          </div>
        )}

        {!loading && unconfirmed.length > 0 && (
          <div>
            <div
              style={{
                padding: '10px 24px',
                background: 'var(--bad-50, #fff5f5)',
                borderBottom: '1px solid var(--bad-100, #fee2e2)',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--bad-600, #dc2626)',
                textTransform: 'uppercase',
                letterSpacing: '.05em',
              }}
            >
              Bordereaux non confirmés par le client ({unconfirmed.length})
            </div>
            {unconfirmed.map((bl, i) => (
              <div
                key={bl.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '14px 24px',
                  borderBottom: i < unconfirmed.length - 1 ? '1px solid var(--border-soft, #f1f5f9)' : undefined,
                }}
              >
                <div style={{ flex: '0 0 120px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-900)', fontFamily: 'var(--ff-mono)' }}>
                    {bl.code}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)' }}>{bl.clientName}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>{bl.trackingCode}</div>
                </div>
                <div style={{ flex: '0 0 auto', fontSize: 12, color: 'var(--ink-400)' }}>
                  {formatDate(bl.createdAt)}
                </div>
                <button
                  onClick={() => onNav('/parcels/' + bl.parcelId)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'white',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--brand-500)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Voir colis
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && unpaid.length > 0 && (
          <div>
            <div
              style={{
                padding: '10px 24px',
                background: 'var(--warn-50, #fffbeb)',
                borderBottom: '1px solid var(--warn-100, #fef3c7)',
                borderTop: unconfirmed.length > 0 ? '1px solid var(--border)' : undefined,
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--warn-700, #b45309)',
                textTransform: 'uppercase',
                letterSpacing: '.05em',
              }}
            >
              Factures impayées ({unpaid.length})
            </div>
            {unpaid.map((inv, i) => (
              <div
                key={inv.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '14px 24px',
                  borderBottom: i < unpaid.length - 1 ? '1px solid var(--border-soft, #f1f5f9)' : undefined,
                }}
              >
                <div style={{ flex: '0 0 140px', fontFamily: 'var(--ff-mono)', fontSize: 13, fontWeight: 700, color: 'var(--ink-900)' }}>
                  {inv.trackingCode}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)' }}>{inv.clientName}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>
                  {formatCAD(inv.amount)}
                </div>
                <StatusBadge status={inv.status} />
                <div style={{ fontSize: 12, color: 'var(--ink-400)', whiteSpace: 'nowrap' }}>
                  {ageDays(inv.createdAt)}j
                </div>
                <button
                  onClick={() => onNav('/parcels/' + inv.parcelId)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'white',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--brand-500)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Voir colis
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
