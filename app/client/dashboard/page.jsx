'use client';
import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import I from '@/src/components/Icons.jsx';
import { useT, useLocale } from '@/src/lib/i18n';

const JOURNEY = [
  { key: 'enr', labelKey: 'statuses.enr',  icon: '📝', color: 'var(--ink-500)' },
  { key: 'rec', labelKey: 'statuses.rec',  icon: '📥', color: 'var(--brand-700)' },
  { key: 'pre', labelKey: 'statuses.pre',  icon: '🔍', color: 'var(--brand-700)' },
  { key: 'exp', labelKey: 'statuses.exp',  icon: '🚀', color: 'var(--info-700)' },
  { key: 'tra', labelKey: 'statuses.tra',  icon: '✈️', color: 'var(--info-700)' },
  { key: 'apd', labelKey: 'statuses.apd',  icon: '🛬', color: 'var(--ok-700)' },
  { key: 'dou', labelKey: 'statuses.dou',  icon: '🛃', color: 'var(--ink-500)' },
  { key: 'lib', labelKey: 'statuses.lib',  icon: '✅', color: 'var(--ok-700)' },
  { key: 'ard', labelKey: 'statuses.ard',  icon: '🏭', color: 'var(--ok-700)' },
  { key: 'pdl', labelKey: 'statuses.pdl',  icon: '📦', color: 'var(--info-700)' },
  { key: 'liv', labelKey: 'statuses.liv',  icon: '🚚', color: 'var(--info-700)' },
  { key: 'ok',  labelKey: 'statuses.ok',   icon: '🎉', color: '#111827' },
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
            width: i === current ? 8 : 6, height: i === current ? 8 : 6,
            borderRadius: '50%',
            background: i <= current ? (i === current ? s.color : 'var(--brand-200)') : '#e5e7eb',
            transition: 'all .2s',
          }} />
          {i < JOURNEY.length - 2 && (
            <div style={{ width: 12, height: 2, background: i < current ? 'var(--brand-100)' : '#e5e7eb', borderRadius: 1 }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Standard: individual parcel card ────────────────────────────────────────
function ParcelCard({ parcel, onClick, onRebook }) {
  const t   = useT();
  const s   = JOURNEY[getJourneyStep(parcel.status)] ?? JOURNEY[0];
  const paid = parcel.payment?.status === 'completed';
  const partial = parcel.payment?.status === 'partial';
  const hasUnconfirmedBl = parcel.bordereaux?.some(b => !b.clientConfirmed);
  const hasBl = parcel.bordereaux?.length > 0;
  const isLivré = parcel.status === 'ok';
  const { locale } = useLocale();
  const needsAction = hasUnconfirmedBl || (!paid && parcel.payment);

  function fmt(date) {
    if (!date) return null;
    return new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-CA', { day: 'numeric', month: 'short' });
  }

  return (
    <div onClick={onClick} style={{
      background: 'white', border: `1.5px solid ${needsAction ? 'var(--bad-100)' : 'var(--border)'}`,
      borderRadius: 14, padding: '16px', cursor: 'pointer',
      transition: 'box-shadow .15s, border-color .15s', position: 'relative', overflow: 'hidden',
    }}
    onTouchStart={e => e.currentTarget.style.background = 'var(--bg-soft)'}
    onTouchEnd={e => e.currentTarget.style.background = 'white'}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: s.color, borderRadius: '14px 0 0 14px' }} />
      <div style={{ paddingLeft: 8 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--ff-mono, monospace)', fontWeight: 700, fontSize: 15, color: '#111827', letterSpacing: '.02em' }}>
                {parcel.trackingCode}
              </span>
              {needsAction && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'var(--bad-100)', color: 'var(--bad-700)', border: '1px solid var(--bad-100)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  {t('dashboard.parcel.actionRequired')}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              {parcel.campaign?.from} → {parcel.campaign?.to}
              {parcel.campaign?.code && <span style={{ marginLeft: 4, color: '#9ca3af' }}>· {parcel.campaign.code}</span>}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            {(() => {
              const cur = parcel.campaign?.currency ?? 'CAD';
              const raw = parcel.payment?.amount ?? parcel.priceXaf;
              return (
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>
                  {raw?.toLocaleString('fr') ?? '—'} <span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af' }}>{cur}</span>
                </div>
              );
            })()}
            <div style={{ fontSize: 11.5, fontWeight: 600, marginTop: 1, color: paid ? 'var(--ok-600)' : 'var(--bad-600)' }}>
              {paid ? `✓ ${t('dashboard.payment.paid')}` : partial ? t('dashboard.payment.partial') : t('dashboard.payment.pending')}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>{s.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: s.color }}>{t(s.labelKey)}</span>
        </div>
        <ProgressDots status={parcel.status} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
          <div style={{ fontSize: 11.5, color: '#9ca3af' }}>
            {parcel.campaign?.departureDate && !isLivré && <span>{t('dashboard.parcel.departure').replace('{date}', fmt(parcel.campaign.departureDate))}</span>}
            {parcel.campaign?.arrivalDate && !isLivré && <span> · {t('dashboard.parcel.arrival').replace('{date}', fmt(parcel.campaign.arrivalDate))}</span>}
            {parcel.weightKg && <span> · {parcel.weightKg} kg</span>}
          </div>
          {hasBl && (
            <div style={{ fontSize: 11, color: hasUnconfirmedBl ? 'var(--bad-600)' : '#6b7280', fontWeight: hasUnconfirmedBl ? 700 : 400 }}>
              {hasUnconfirmedBl ? t('dashboard.parcel.borderauWarning') : t('dashboard.parcel.borderauOK')}
            </div>
          )}
        </div>
        {hasUnconfirmedBl && (
          <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: 'var(--bad-50)', border: '1px solid var(--bad-100)', fontSize: 12.5, color: 'var(--bad-700)', fontWeight: 600 }}>
            {t('dashboard.parcel.borderauPendingAction')}
          </div>
        )}
        {isLivré && onRebook && (
          <button
            onClick={e => { e.stopPropagation(); onRebook(); }}
            style={{
              marginTop: 10, width: '100%', padding: '8px', borderRadius: 8,
              border: '1.5px solid var(--brand-200)', background: 'var(--brand-50)',
              color: 'var(--brand-700)', fontSize: 12.5, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            ↻ Réserver à nouveau
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Business: campaign card ─────────────────────────────────────────────────
function CampaignCard({ campaignId, campaign, parcels, router }) {
  const t = useT();
  const { locale } = useLocale();
  const [expanded, setExpanded] = useState(false);

  const totalAmount  = parcels.reduce((s, p) => s + (p.payment?.amount ?? p.priceXaf ?? 0), 0);
  const totalWeight  = parcels.reduce((s, p) => s + (p.weightKg ?? 0), 0);
  const allocated    = parcels.reduce((s, p) => s + (p.payment?.allocated ?? 0), 0);
  const remaining    = parcels.reduce((s, p) => s + (p.payment?.remaining ?? 0), 0);
  const allPaid      = parcels.every(p => p.payment?.status === 'completed');
  const anyPartial   = !allPaid && allocated > 0;
  const anyUnconfirmedBl = parcels.some(p => p.bordereaux?.some(b => !b.clientConfirmed));
  const needsAction  = anyUnconfirmedBl || (!allPaid && parcels.some(p => p.payment));

  // Most advanced status across all parcels in this campaign
  const leadStatus = parcels.reduce((lead, p) => {
    return getJourneyStep(p.status) > getJourneyStep(lead) ? p.status : lead;
  }, 'enr');
  const s = JOURNEY[getJourneyStep(leadStatus)] ?? JOURNEY[0];

  function fmt(date) {
    if (!date) return null;
    return new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-CA', { day: 'numeric', month: 'short' });
  }

  return (
    <div style={{
      background: 'white', border: `1.5px solid ${needsAction ? 'var(--bad-100)' : 'var(--border)'}`,
      borderRadius: 16, overflow: 'hidden',
    }}>
      {/* Campaign header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ padding: '16px 18px', cursor: 'pointer', position: 'relative' }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: s.color, borderRadius: '16px 0 0 16px' }} />
        <div style={{ paddingLeft: 8 }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--ff-mono, monospace)', fontWeight: 800, fontSize: 15, color: '#111827', letterSpacing: '.02em' }}>
                  {campaign?.code ?? campaignId}
                </span>
                {needsAction && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'var(--bad-100)', color: 'var(--bad-700)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                    {t('dashboard.parcel.actionRequired')}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                {campaign?.from} → {campaign?.to}
                {campaign?.departureDate && (
                  <span style={{ marginLeft: 6, color: '#9ca3af' }}>
                    · {fmt(campaign.departureDate)}{campaign.arrivalDate ? ` → ${fmt(campaign.arrivalDate)}` : ''}
                  </span>
                )}
              </div>
            </div>
            {(() => {
              const cur = campaign?.currency ?? 'CAD';
              return (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>
                    {totalAmount.toLocaleString('fr')} <span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af' }}>{cur}</span>
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, marginTop: 1, color: allPaid ? 'var(--ok-600)' : 'var(--bad-600)' }}>
                    {allPaid ? '✓ Tout soldé' : anyPartial ? `${allocated.toLocaleString('fr')} reçu · ${remaining.toLocaleString('fr')} ${cur} restant` : 'En attente de paiement'}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Status + progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 15 }}>{s.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: s.color }}>{t(s.labelKey)}</span>
          </div>
          <ProgressDots status={leadStatus} />

          {/* Stats row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b7280' }}>
              <span>📦 <strong style={{ color: '#374151' }}>{parcels.length}</strong> colis</span>
              <span>⚖️ <strong style={{ color: '#374151' }}>{Math.round(totalWeight * 10) / 10}</strong> kg</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--brand-600)', fontWeight: 600 }}>
              {expanded ? 'Réduire' : 'Voir les colis'}
              <span style={{ fontSize: 14, transition: 'transform .2s', display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'none' }}>▾</span>
            </div>
          </div>
        </div>
      </div>

      {/* Re-book CTA for delivered campaigns */}
      {allPaid && leadStatus === 'ok' && (
        <div style={{ padding: '0 18px 14px' }}>
          <button
            onClick={e => { e.stopPropagation(); router.push('/client/booking?prefill=' + parcels[0]?.id); }}
            style={{
              width: '100%', padding: '8px', borderRadius: 8,
              border: '1.5px solid var(--brand-200)', background: 'var(--brand-50)',
              color: 'var(--brand-700)', fontSize: 12.5, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            ↻ Réserver à nouveau sur cette route
          </button>
        </div>
      )}

      {/* Expanded: individual parcels */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-soft)' }}>
          {parcels.map((p, i) => {
            const ps  = JOURNEY[getJourneyStep(p.status)] ?? JOURNEY[0];
            const paid = p.payment?.status === 'completed';
            const hasUncBl = p.bordereaux?.some(b => !b.clientConfirmed);
            return (
              <div key={p.id}
                onClick={() => router.push('/client/colis/' + p.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 18px', cursor: 'pointer',
                  borderBottom: i < parcels.length - 1 ? '1px solid var(--border-soft)' : 'none',
                  background: hasUncBl ? 'var(--bad-50)' : 'white',
                  transition: 'background .1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = hasUncBl ? 'var(--bad-50)' : 'var(--bg-soft)'}
                onMouseLeave={e => e.currentTarget.style.background = hasUncBl ? 'var(--bad-50)' : 'white'}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: ps.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--ff-mono, monospace)', fontWeight: 700, fontSize: 13, color: '#111827' }}>{p.trackingCode}</span>
                    {hasUncBl && <span style={{ fontSize: 10, color: 'var(--bad-700)', fontWeight: 700 }}>• BL à confirmer</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 1 }}>
                    {t(ps.labelKey)} {p.weightKg ? `· ${p.weightKg} kg` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                    {(p.payment?.amount ?? p.priceXaf ?? 0).toLocaleString('fr')} <span style={{ fontSize: 10, color: '#9ca3af' }}>{campaign?.currency ?? 'CAD'}</span>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: paid ? 'var(--ok-600)' : 'var(--bad-600)' }}>
                    {paid ? '✓ Soldé' : p.payment?.status === 'partial' ? 'Partiel' : 'En attente'}
                  </div>
                </div>
                <I.ChevronRight style={{ width: 14, height: 14, color: '#9ca3af', flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
function ClientDashboardInner() {
  const { data: session } = useSession();
  const router      = useRouter();
  const suspended   = session?.user?.status === 'suspended';
  const clientType  = session?.user?.clientType;
  const isBusiness  = clientType === 'commercial' || clientType === 'partenaire';
  const searchParams = useSearchParams();
  const bookedCode  = searchParams.get('booked');
  const [parcels,  setParcels]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('active');
  const [showBooked, setShowBooked] = useState(!!bookedCode);
  const t = useT();

  const name = session?.user?.name?.split(' ')[0];

  const load = useCallback(async () => {
    try {
      const res  = await fetch('/api/me/parcels');
      const data = await res.json();
      setParcels(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const onVisible = () => { if (!document.hidden) load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  const active    = parcels.filter(p => p.status !== 'ok' && p.status !== 'ann');
  const done      = parcels.filter(p => p.status === 'ok');
  const cancelled = parcels.filter(p => p.status === 'ann');
  const actions   = active.filter(p =>
    p.bordereaux?.some(b => !b.clientConfirmed) ||
    (p.payment && p.payment.status !== 'completed')
  );

  // Group by campaign for business clients
  const campaignGroups = useMemo(() => {
    const list = tab === 'active' ? active : done;
    if (!isBusiness) return null;
    const map = {};
    list.forEach(p => {
      const cid = p.campaign?.id ?? '__unknown__';
      if (!map[cid]) map[cid] = { campaignId: cid, campaign: p.campaign, parcels: [] };
      map[cid].parcels.push(p);
    });
    return Object.values(map).sort((a, b) => {
      const aMax = Math.max(...a.parcels.map(p => new Date(p.createdAt).getTime()));
      const bMax = Math.max(...b.parcels.map(p => new Date(p.createdAt).getTime()));
      return bMax - aMax;
    });
  }, [parcels, tab, isBusiness]);

  const displayed = tab === 'active' ? active : tab === 'done' ? done : cancelled;

  return (
    <div>
      {/* Booking success banner */}
      {showBooked && bookedCode && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--ok-50)', border: '1px solid var(--ok-100)', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>🎉</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ok-700)' }}>{t('dashboard.success.booking')}</div>
              <div style={{ fontSize: 12.5, color: 'var(--ok-600)', marginTop: 1 }}>
                {t('dashboard.success.trackingNumber')} <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{bookedCode}</span> · {t('dashboard.parcel.paymentPending')}
              </div>
            </div>
          </div>
          <button onClick={() => setShowBooked(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--ok-600)', lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Welcome + CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 2px', color: '#111827' }}>
            {t('dashboard.greeting').replace('{name}', name)}
          </h1>
          <p style={{ fontSize: 13.5, color: '#6b7280', margin: 0 }}>
            {loading ? t('loading') : isBusiness
              ? `${campaignGroups?.length ?? 0} cargaison${(campaignGroups?.length ?? 0) > 1 ? 's' : ''} · ${parcels.length} colis`
              : `${active.length} en cours · ${done.length} livré${done.length > 1 ? 's' : ''}${cancelled.length > 0 ? ` · ${cancelled.length} annulé${cancelled.length > 1 ? 's' : ''}` : ''}`}
          </p>
        </div>
        {!suspended && (
          <button onClick={() => router.push('/client/booking')} style={{
            flexShrink: 0, padding: '10px 18px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(90deg, #00B4D8 0%, #1B4FD8 100%)',
            color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 7,
            boxShadow: '0 3px 10px rgba(27,79,216,.25)',
          }}>
            <I.Plus style={{ width: 16, height: 16 }} />
            {t('dashboard.book')}
          </button>
        )}
      </div>

      {/* Action required banner */}
      {actions.length > 0 && !loading && (
        <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 12, background: 'var(--bad-50)', border: '1.5px solid var(--bad-100)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>🔔</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--bad-700)' }}>
              {t('dashboard.alert.actionsRequired').replace('{n}', actions.length)}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--bad-600)', marginTop: 1 }}>
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
            { key: 'active', label: isBusiness ? `En cours (${active.length})` : t('dashboard.tabs.active').replace('{n}', active.length) },
            { key: 'done',   label: isBusiness ? `Livrées (${done.length})`    : t('dashboard.tabs.delivered').replace('{n}', done.length) },
            ...(cancelled.length > 0 ? [{ key: 'cancelled', label: `Annulés (${cancelled.length})` }] : []),
          ].map(tabItem => (
            <button key={tabItem.key} onClick={() => setTab(tabItem.key)} style={{
              flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontWeight: tab === tabItem.key ? 700 : 500, fontSize: 13.5,
              background: tab === tabItem.key ? 'white' : 'transparent',
              color: tab === tabItem.key ? (tabItem.key === 'cancelled' ? '#dc2626' : '#111827') : '#6b7280',
              boxShadow: tab === tabItem.key ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
            }}>{tabItem.label}</button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2].map(i => (
            <div key={i} style={{ height: 160, borderRadius: 16, background: 'white', border: '1.5px solid #e5e7eb', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : tab === 'cancelled' ? (
        /* Cancelled tab */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cancelled.map(p => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              padding: '14px 16px', borderRadius: 14, background: 'white',
              border: '1px solid #fca5a5', cursor: 'pointer',
            }} onClick={() => router.push('/client/colis/' + p.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff1f2', display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0 }}>🚫</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#374151' }}>{p.trackingCode}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{p.campaign?.from} → {p.campaign?.to} · {p.campaign?.code}</div>
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); router.push('/client/booking?prefill=' + p.id); }}
                style={{
                  flexShrink: 0, padding: '7px 14px', borderRadius: 8, border: 'none',
                  background: 'linear-gradient(90deg,#00B4D8,#1B4FD8)',
                  color: 'white', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                ↻ Réserver à nouveau
              </button>
            </div>
          ))}
        </div>
      ) : isBusiness ? (
        /* Business view: campaign cards */
        campaignGroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#6b7280' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{tab === 'done' ? '🎉' : '🚢'}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              {tab === 'done' ? 'Aucune cargaison livrée' : 'Aucune cargaison en cours'}
            </div>
            {tab === 'active' && !suspended && (
              <>
                <div style={{ fontSize: 13, marginBottom: 16 }}>Réservez vos prochains colis pour les voir apparaître ici.</div>
                <button onClick={() => router.push('/client/booking')} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(90deg, #00B4D8 0%, #1B4FD8 100%)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                  Réserver un envoi
                </button>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {campaignGroups.map(g => (
              <CampaignCard key={g.campaignId} {...g} router={router} />
            ))}
          </div>
        )
      ) : (
        /* Standard view: individual parcel cards */
        displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#6b7280' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{tab === 'done' ? '🎉' : '📦'}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              {tab === 'done' ? t('dashboard.empty.delivered') : t('dashboard.empty.active')}
            </div>
            {tab === 'active' && !suspended && (
              <>
                <div style={{ fontSize: 13, marginBottom: 16 }}>{t('dashboard.empty.activeHint')}</div>
                <button onClick={() => router.push('/client/booking')} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(90deg, #00B4D8 0%, #1B4FD8 100%)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                  {t('button.bookNow')}
                </button>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {displayed.map(p => (
              <ParcelCard key={p.id} parcel={p} onClick={() => router.push('/client/colis/' + p.id)} onRebook={() => router.push('/client/booking?prefill=' + p.id)} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

export default function ClientDashboard() {
  return <Suspense><ClientDashboardInner /></Suspense>;
}
