'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import I from '@/src/components/Icons.jsx';
import { useT, useLocale } from '@/src/lib/i18n';

const JOURNEY = [
  { key: 'enr', labelKey: 'statuses.enr',  label: '', icon: '📝', color: '#6b7280' },
  { key: 'rec', labelKey: 'statuses.rec',  label: '', icon: '📥', color: '#D97706' },
  { key: 'pre', labelKey: 'statuses.pre',  label: '', icon: '🔍', color: '#D97706' },
  { key: 'exp', labelKey: 'statuses.exp',  label: '', icon: '🚀', color: '#D97706' },
  { key: 'tra', labelKey: 'statuses.tra',  label: '', icon: '✈️', color: '#D97706' },
  { key: 'apd', labelKey: 'statuses.apd',  label: '', icon: '🛬', color: '#B45309' },
  { key: 'dou', labelKey: 'statuses.dou',  label: '', icon: '🛃', color: '#B45309' },
  { key: 'lib', labelKey: 'statuses.lib',  label: '', icon: '✅', color: '#B45309' },
  { key: 'ard', labelKey: 'statuses.ard',  label: '', icon: '🏭', color: '#B45309' },
  { key: 'pdl', labelKey: 'statuses.pdl',  label: '', icon: '📦', color: '#92400e' },
  { key: 'liv', labelKey: 'statuses.liv',  label: '', icon: '🚚', color: '#92400e' },
  { key: 'ok',  labelKey: 'statuses.ok',   label: '', icon: '🎉', color: '#111827' },
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
            background: i <= current ? (i === current ? s.color : '#fcd34d') : '#e5e7eb',
            transition: 'all .2s',
          }} />
          {i < JOURNEY.length - 2 && (
            <div style={{ width: 12, height: 2, background: i < current ? '#fcd34d' : '#e5e7eb', borderRadius: 1 }} />
          )}
        </div>
      ))}
    </div>
  );
}

function ParcelCard({ parcel, onClick }) {
  const t         = useT();
  const s         = JOURNEY[getJourneyStep(parcel.status)] ?? JOURNEY[0];
  const paid      = parcel.payment?.status === 'completed';
  const partial   = parcel.payment?.status === 'partial';
  const hasUnconfirmedBl = parcel.bordereaux?.some(b => !b.clientConfirmed);
  const hasBl     = parcel.bordereaux?.length > 0;
  const isLivré   = parcel.status === 'ok';
  const { locale } = useLocale();

  const needsAction = hasUnconfirmedBl || (!paid && parcel.payment);

  function fmt(date) {
    if (!date) return null;
    return new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-CA', { day: 'numeric', month: 'short' });
  }

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
        background: s.color,
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
                }}>{t('dashboard.parcel.actionRequired')}</span>
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
              {paid ? `✓ ${t('dashboard.payment.paid')}` : partial ? `⏳ ${t('dashboard.payment.partial')}` : `⚡ ${t('dashboard.payment.pending')}`}
            </div>
          </div>
        </div>

        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>{s.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: s.color }}>{t(s.labelKey)}</span>
        </div>

        {/* Progress */}
        <ProgressDots status={parcel.status} />

        {/* Bottom info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
          <div style={{ fontSize: 11.5, color: '#9ca3af' }}>
            {parcel.campaign?.departureDate && !isLivré && (
              <span>{t('dashboard.parcel.departure').replace('{date}', fmt(parcel.campaign.departureDate))}</span>
            )}
            {parcel.campaign?.arrivalDate && !isLivré && (
              <span> · {t('dashboard.parcel.arrival').replace('{date}', fmt(parcel.campaign.arrivalDate))}</span>
            )}
            {parcel.weightKg && <span> · {parcel.weightKg} kg</span>}
          </div>
          {hasBl && (
            <div style={{ fontSize: 11, color: hasUnconfirmedBl ? '#92400e' : '#6b7280', fontWeight: hasUnconfirmedBl ? 700 : 400 }}>
              {hasUnconfirmedBl ? t('dashboard.parcel.borderauWarning') : t('dashboard.parcel.borderauOK')}
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
            {t('dashboard.parcel.borderauPendingAction')}
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
  const t = useT();
  const { locale } = useLocale();

  const name = session?.user?.name?.split(' ')[0];

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
    p.bordereaux?.some(b => !b.clientConfirmed) ||
    (p.payment && p.payment.status !== 'completed')
  );

  const displayed = tab === 'active' ? active : done;

  return (
    <div>
      {/* Booking success banner */}
      {showBooked && bookedCode && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#fffbeb', border: '1px solid #fbbf24',
          padding: '14px 18px', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>🎉</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#92400e' }}>{t('dashboard.success.booking')}</div>
              <div style={{ fontSize: 12.5, color: '#b45309', marginTop: 1 }}>
                {t('dashboard.success.trackingNumber')} <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{bookedCode}</span> · {t('dashboard.parcel.paymentPending')}
              </div>
            </div>
          </div>
          <button onClick={() => setShowBooked(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#b45309', lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Welcome + CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 2px', color: '#111827' }}>
            {t('dashboard.greeting').replace('{name}', name)}
          </h1>
          <p style={{ fontSize: 13.5, color: '#6b7280', margin: 0 }}>
            {loading ? t('loading') : `${active.length} colis en cours · ${done.length} livré${done.length > 1 ? 's' : ''}`}
          </p>
        </div>
        {!suspended && (
          <button onClick={() => router.push('/client/booking')} style={{
            flexShrink: 0, padding: '10px 18px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #F5A524, #D97706)',
            color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 7,
            boxShadow: '0 3px 10px rgba(217,119,6,.3)',
          }}>
            <I.Plus style={{ width: 16, height: 16 }} />
            {t('dashboard.book')}
          </button>
        )}
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
              {t('dashboard.alert.actionsRequired').replace('{n}', actions.length)}
            </div>
            <div style={{ fontSize: 12.5, color: '#b45309', marginTop: 1 }}>
              {actions.some(p => p.bordereaux?.some(b => !b.clientConfirmed))
                ? t('dashboard.alert.borderauPending')
                : t('dashboard.alert.paymentOverdue')}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      {!loading && parcels.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#f3f4f6', borderRadius: 10, padding: 4 }}>
          {[
            { key: 'active', label: t('dashboard.tabs.active').replace('{n}', active.length) },
            { key: 'done',   label: t('dashboard.tabs.delivered').replace('{n}', done.length) },
          ].map(tabItem => (
            <button key={tabItem.key} onClick={() => setTab(tabItem.key)} style={{
              flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontWeight: tab === tabItem.key ? 700 : 500,
              fontSize: 13.5,
              background: tab === tabItem.key ? 'white' : 'transparent',
              color: tab === tabItem.key ? '#111827' : '#6b7280',
              boxShadow: tab === tabItem.key ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
            }}>{tabItem.label}</button>
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
            {tab === 'done' ? t('dashboard.empty.delivered') : t('dashboard.empty.active')}
          </div>
          {tab === 'active' && !suspended && (
            <>
              <div style={{ fontSize: 13, marginBottom: 16 }}>{t('dashboard.empty.activeHint')}</div>
              <button onClick={() => router.push('/client/booking')} style={{
                padding: '10px 20px', borderRadius: 10, border: 'none',
                background: '#F5A524', color: 'white', fontWeight: 700, cursor: 'pointer',
              }}>{t('button.bookNow')}</button>
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
