'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import I from '@/src/components/Icons.jsx';

const JOURNEY = [
  { key: 'enr', label: 'Enregistré',   icon: '📝', color: '#6b7280' },
  { key: 'rec', label: 'Reçu',         icon: '📥', color: '#2563eb' },
  { key: 'pre', label: 'Préparé',      icon: '🔍', color: '#7c3aed' },
  { key: 'exp', label: 'Expédié',      icon: '🚀', color: '#0e7490' },
  { key: 'tra', label: 'En transit',   icon: '✈️', color: '#0891b2' },
  { key: 'apd', label: 'Arrivé pays',  icon: '🛬', color: '#16a34a' },
  { key: 'dou', label: 'Douanes',      icon: '🛃', color: '#d97706' },
  { key: 'lib', label: 'Libéré',       icon: '✅', color: '#16a34a' },
  { key: 'ard', label: 'Entrepôt',    icon: '🏭', color: '#16a34a' },
  { key: 'pdl', label: 'Prêt',        icon: '📦', color: '#0e7490' },
  { key: 'liv', label: 'En chemin',   icon: '🚚', color: '#0891b2' },
  { key: 'ok',  label: 'Livré',       icon: '🎉', color: '#15803d' },
];

function getJourneyStep(status) {
  const idx = JOURNEY.findIndex(s => s.key === status);
  return idx >= 0 ? idx : 0;
}

function ProgressDots({ status }) {
  const current = getJourneyStep(status);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 6 }}>
      {JOURNEY.slice(0, -1).map((s, i) => (
        <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div style={{
            width: i === current ? 8 : 6,
            height: i === current ? 8 : 6,
            borderRadius: '50%',
            background: i <= current ? (i === current ? s.color : '#86efac') : '#e5e7eb',
            transition: 'all .2s',
          }} />
          {i < JOURNEY.length - 2 && (
            <div style={{ width: 12, height: 2, background: i < current ? '#86efac' : '#e5e7eb', borderRadius: 1 }} />
          )}
        </div>
      ))}
    </div>
  );
}

function fmt(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function ParcelCard({ parcel, onClick }) {
  const s        = JOURNEY[getJourneyStep(parcel.status)] ?? JOURNEY[0];
  const paid     = parcel.payment?.status === 'completed';
  const partial  = parcel.payment?.status === 'partial';
  const hasUnconfirmedBl = parcel.bordereaux?.some(b => b.status === 'valide' && !b.clientConfirmed);
  const hasBl    = parcel.bordereaux?.length > 0;
  const isLivré  = parcel.status === 'ok';

  const needsAction = hasUnconfirmedBl || (!paid && parcel.payment);

  return (
    <div onClick={onClick} style={{
      background: 'white',
      border: `1.5px solid ${needsAction ? '#fbbf24' : 'var(--border)'}`,
      borderRadius: 14,
      padding: '16px',
      cursor: 'pointer',
      transition: 'box-shadow .15s, border-color .15s',
      position: 'relative',
      overflow: 'hidden',
    }}
    onTouchStart={e => e.currentTarget.style.background = 'var(--bg-soft)'}
    onTouchEnd={e => e.currentTarget.style.background = 'white'}
    >
      {/* Left accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
        background: isLivré ? '#16a34a' : s.color,
        borderRadius: '14px 0 0 14px',
      }} />

      <div style={{ paddingLeft: 8 }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--ff-mono, monospace)', fontWeight: 700, fontSize: 15, color: '#111827', letterSpacing: '.02em' }}>
                {parcel.trackingCode}
              </span>
              {needsAction && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                  background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a',
                  textTransform: 'uppercase', letterSpacing: '.04em',
                }}>Action requise</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              {parcel.campaign?.from} → {parcel.campaign?.to}
              {parcel.campaign?.code && <span style={{ marginLeft: 4, color: '#9ca3af' }}>· {parcel.campaign.code}</span>}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>
              {(parcel.payment?.amount ?? parcel.priceXaf)?.toLocaleString('fr') ?? '—'} <span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af' }}>CAD</span>
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 600, marginTop: 1, color: paid ? '#16a34a' : partial ? '#d97706' : '#dc2626' }}>
              {paid ? '✓ Payé' : partial ? '⏳ Partiel' : '⚡ À régler'}
            </div>
          </div>
        </div>

        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>{s.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: s.color }}>{s.label}</span>
        </div>

        {/* Progress */}
        <ProgressDots status={parcel.status} />

        {/* Bottom info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
          <div style={{ fontSize: 11.5, color: '#9ca3af' }}>
            {parcel.campaign?.departureDate && !isLivré && (
              <span>Départ {fmt(parcel.campaign.departureDate)}</span>
            )}
            {parcel.campaign?.arrivalDate && !isLivré && (
              <span> · Arrivée ~{fmt(parcel.campaign.arrivalDate)}</span>
            )}
            {parcel.weightKg && <span> · {parcel.weightKg} kg</span>}
          </div>
          {hasBl && (
            <div style={{ fontSize: 11, color: hasUnconfirmedBl ? '#92400e' : '#6b7280', fontWeight: hasUnconfirmedBl ? 700 : 400 }}>
              {hasUnconfirmedBl ? '⚠️ Bordereau à signer' : '📋 Bordereau OK'}
            </div>
          )}
        </div>

        {/* Action banners */}
        {hasUnconfirmedBl && (
          <div style={{
            marginTop: 10, padding: '8px 12px', borderRadius: 8,
            background: '#fffbeb', border: '1px solid #fde68a',
            fontSize: 12.5, color: '#92400e', fontWeight: 600,
          }}>
            ⚠️ Votre bordereau attend votre confirmation avant l&apos;expédition
          </div>
        )}
      </div>
    </div>
  );
}

function ClientDashboardInner() {
  const { data: session } = useSession();
  const router    = useRouter();
  const suspended  = session?.user?.status === 'suspended';
  const searchParams = useSearchParams();
  const bookedCode   = searchParams.get('booked');
  const [parcels,  setParcels]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('active'); // 'active' | 'done'
  const [showBooked, setShowBooked] = useState(!!bookedCode);

  const load = useCallback(async () => {
    try {
      const res  = await fetch('/api/me/parcels');
      const data = await res.json();
      setParcels(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const active  = parcels.filter(p => p.status !== 'ok');
  const done    = parcels.filter(p => p.status === 'ok');
  const actions = active.filter(p =>
    p.bordereaux?.some(b => b.status === 'valide' && !b.clientConfirmed) ||
    (p.payment && p.payment.status !== 'completed')
  );

  const displayed = tab === 'active' ? active : done;

  return (
    <div>
      {/* Booking success banner */}
      {showBooked && bookedCode && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#f0fdf4', border: '1px solid #86efac',
          padding: '14px 18px', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>✅</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#15803d' }}>Réservation enregistrée !</div>
              <div style={{ fontSize: 12.5, color: '#166534', marginTop: 1 }}>
                Numéro de suivi : <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{bookedCode}</span> · En attente de confirmation du paiement.
              </div>
            </div>
          </div>
          <button onClick={() => setShowBooked(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#16a34a', lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Welcome */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 2px', color: '#111827' }}>
          Bonjour {session?.user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ fontSize: 13.5, color: '#6b7280', margin: 0 }}>
          {loading ? '…' : `${active.length} colis en cours · ${done.length} livré${done.length > 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Action required banner */}
      {actions.length > 0 && !loading && (
        <div style={{
          marginBottom: 20, padding: '12px 16px', borderRadius: 12,
          background: '#fffbeb', border: '1.5px solid #fbbf24',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>⚡</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#92400e' }}>
              {actions.length} action{actions.length > 1 ? 's' : ''} requise{actions.length > 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: 12.5, color: '#b45309', marginTop: 1 }}>
              {actions.some(p => p.bordereaux?.some(b => b.status === 'valide' && !b.clientConfirmed))
                ? 'Des bordereaux attendent votre confirmation avant expédition'
                : 'Des paiements sont en attente de règlement'}
            </div>
          </div>
        </div>
      )}

      {/* New booking CTA */}
      {!suspended && (
        <button onClick={() => router.push('/client/booking')} style={{
          width: '100%', padding: '14px 20px', borderRadius: 12, border: 'none',
          background: 'linear-gradient(135deg, #F5A524, #D97706)',
          color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          marginBottom: 24, boxShadow: '0 4px 14px rgba(217,119,6,.3)',
        }}>
          <I.Plus style={{ width: 18, height: 18 }} />
          Réserver un nouvel envoi
        </button>
      )}

      {/* Tabs */}
      {!loading && parcels.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#f3f4f6', borderRadius: 10, padding: 4 }}>
          {[
            { key: 'active', label: `En cours (${active.length})` },
            { key: 'done',   label: `Livrés (${done.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontWeight: tab === t.key ? 700 : 500,
              fontSize: 13.5,
              background: tab === t.key ? 'white' : 'transparent',
              color: tab === t.key ? '#111827' : '#6b7280',
              boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
            }}>{t.label}</button>
          ))}
        </div>
      )}

      {/* Cards */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2].map(i => (
            <div key={i} style={{ height: 140, borderRadius: 14, background: 'white', border: '1.5px solid #e5e7eb', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: '#6b7280' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{tab === 'done' ? '🎉' : '📦'}</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            {tab === 'done' ? 'Aucun colis livré' : 'Aucun colis en cours'}
          </div>
          {tab === 'active' && !suspended && (
            <>
              <div style={{ fontSize: 13, marginBottom: 16 }}>Commencez par réserver votre premier envoi.</div>
              <button onClick={() => router.push('/client/booking')} style={{
                padding: '10px 20px', borderRadius: 10, border: 'none',
                background: '#F5A524', color: 'white', fontWeight: 700, cursor: 'pointer',
              }}>Réserver maintenant</button>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {displayed.map(p => (
            <ParcelCard
              key={p.id}
              parcel={p}
              onClick={() => router.push('/client/colis/' + p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClientDashboard() {
  return <Suspense><ClientDashboardInner /></Suspense>;
}
