'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import I from '@/src/components/Icons.jsx';

const PARCEL_STATUS = {
  en_attente: { label: 'En attente',   color: 'var(--ink-400)',   bg: 'var(--bg-soft)',   icon: '⏳' },
  recu:       { label: 'Reçu',         color: 'var(--brand-600)', bg: 'var(--brand-50)',  icon: '✅' },
  en_transit: { label: 'En transit',   color: 'var(--info-600)',  bg: 'var(--info-50)',   icon: '✈️' },
  en_douane:  { label: 'En douane',    color: 'var(--warn-600)',  bg: 'var(--warn-50)',   icon: '🛃' },
  arrive:     { label: 'Arrivé',       color: 'var(--ok-600)',    bg: 'var(--ok-50)',     icon: '📦' },
  livre:      { label: 'Livré',        color: 'var(--ok-700)',    bg: 'var(--ok-50)',     icon: '🎉' },
};

const CAMPAIGN_STATUS = {
  open:       { label: 'Ouverte',   color: 'var(--brand-600)' },
  in_transit: { label: 'En transit', color: 'var(--info-600)'  },
  arrived:    { label: 'Arrivée',   color: 'var(--ok-600)'    },
  closed:     { label: 'Clôturée', color: 'var(--ink-400)'   },
};

function ParcelCard({ parcel, onSelect }) {
  const s   = PARCEL_STATUS[parcel.status] ?? { label: parcel.status, color: 'var(--ink-400)', bg: 'var(--bg-soft)', icon: '📦' };
  const cs  = CAMPAIGN_STATUS[parcel.campaign?.status] ?? {};
  const paid = parcel.payment?.status === 'completed';

  return (
    <div onClick={onSelect} style={{
      background: 'white', border: '1px solid var(--border)', borderRadius: 12,
      padding: '16px 18px', cursor: 'pointer', transition: 'box-shadow .15s',
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--sh-md)'}
    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>
            {parcel.trackingCode}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>
            {parcel.campaign?.from} → {parcel.campaign?.to} · <span style={{ fontWeight: 600 }}>{parcel.campaign?.code}</span>
          </div>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px',
          borderRadius: 999, background: s.bg, color: s.color, fontSize: 12, fontWeight: 600,
        }}>
          {s.icon} {s.label}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
        <div>
          <div style={{ fontSize: 10.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>Poids</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2, fontFamily: 'var(--font-mono)' }}>
            {parcel.weightKg ?? '—'} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--ink-400)' }}>kg</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>Montant</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2, fontFamily: 'var(--font-mono)' }}>
            {(parcel.priceXaf ?? 0).toLocaleString('fr')} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--ink-400)' }}>CAD</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>Paiement</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2, color: paid ? 'var(--ok-600)' : 'var(--bad-500)' }}>
            {paid ? '✓ Payé' : '⏳ En attente'}
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackingTimeline({ events }) {
  if (!events?.length) return (
    <div style={{ padding: '20px 0', color: 'var(--ink-400)', fontSize: 13, textAlign: 'center' }}>
      Aucun événement de suivi enregistré.
    </div>
  );

  const steps = ['en_attente', 'recu', 'en_transit', 'en_douane', 'arrive', 'livre'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {events.map((e, i) => {
        const s = PARCEL_STATUS[e.status] ?? { label: e.status, color: 'var(--ink-400)', icon: '•' };
        return (
          <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: i < events.length - 1 ? 16 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: s.bg ?? 'var(--bg-soft)',
                display: 'grid', placeItems: 'center', fontSize: 16, flexShrink: 0,
              }}>{s.icon}</div>
              {i < events.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--border-soft)', marginTop: 4 }} />}
            </div>
            <div style={{ paddingTop: 4 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: s.color }}>{s.label}</div>
              {e.location && <div style={{ fontSize: 12, color: 'var(--ink-400)' }}>{e.location}</div>}
              {e.note     && <div style={{ fontSize: 12, color: 'var(--ink-500)', fontStyle: 'italic' }}>{e.note}</div>}
              <div style={{ fontSize: 11, color: 'var(--ink-300)', marginTop: 2 }}>
                {new Date(e.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ClientDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [parcels, setParcels]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch('/api/me/parcels').then(r => r.json()).then(data => {
      setParcels(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const active   = parcels.filter(p => !['livre'].includes(p.status));
  const done     = parcels.filter(p => p.status === 'livre');
  const unpaid   = parcels.filter(p => !p.payment || p.payment.status !== 'completed');

  const detail = selected ? parcels.find(p => p.id === selected) : null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: 'var(--ink-900)' }}>
            Bonjour, {session?.user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-400)', margin: 0 }}>
            Suivez vos colis et gérez vos paiements.
          </p>
        </div>
        <button
          onClick={() => router.push('/booking')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #F5A524, #D97706)',
            color: 'white', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(217,119,6,.3)',
          }}>
          <span style={{ fontSize: 16 }}>📦</span> Réserver un envoi
        </button>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Colis en cours',   value: active.length,  color: 'var(--brand-600)', icon: '✈️' },
          { label: 'Colis livrés',     value: done.length,    color: 'var(--ok-600)',    icon: '🎉' },
          { label: 'Paiements dus',    value: unpaid.length,  color: 'var(--bad-500)',   icon: '💳' },
        ].map((k, i) => (
          <div key={i} style={{
            background: 'white', border: '1px solid var(--border)', borderRadius: 12,
            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{ fontSize: 28 }}>{k.icon}</div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 3 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {detail && (
        <div style={{
          background: 'white', border: '1px solid var(--border)', borderRadius: 12,
          padding: 20, marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{detail.trackingCode}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-400)' }}>{detail.description ?? '—'}</div>
            </div>
            <button onClick={() => setSelected(null)} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-400)', fontSize: 20,
            }}>✕</button>
          </div>

          {/* Payment banner if unpaid */}
          {(!detail.payment || detail.payment.status !== 'completed') && (
            <div style={{
              background: 'var(--warn-50)', border: '1px solid var(--warn-200)',
              borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13,
            }}>
              <strong style={{ color: 'var(--warn-700)' }}>Paiement en attente</strong>
              <div style={{ color: 'var(--warn-600)', marginTop: 4 }}>
                Montant : <strong>{(detail.priceXaf ?? 0).toLocaleString('fr')} CAD</strong> par Virement Interac
              </div>
            </div>
          )}

          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: 'var(--ink-600)' }}>
            Historique de suivi
          </div>
          <TrackingTimeline events={detail.tracking} />
        </div>
      )}

      {/* Parcels list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-400)' }}>Chargement…</div>
      ) : parcels.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--ink-400)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: 'var(--ink-700)' }}>Aucun colis enregistré</div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>Commencez par réserver votre premier envoi.</div>
          <button onClick={() => router.push('/booking')} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #F5A524, #D97706)',
            color: 'white', fontWeight: 700, fontSize: 14,
            boxShadow: '0 4px 12px rgba(217,119,6,.25)',
          }}>
            📦 Réserver mon premier envoi
          </button>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-600)', marginBottom: 12 }}>
                Colis en cours — {active.length}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {active.map(p => (
                  <ParcelCard key={p.id} parcel={p} onSelect={() => setSelected(p.id === selected ? null : p.id)} />
                ))}
              </div>
            </div>
          )}

          {done.length > 0 && (
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-600)', marginBottom: 12 }}>
                Colis livrés — {done.length}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {done.map(p => (
                  <ParcelCard key={p.id} parcel={p} onSelect={() => setSelected(p.id === selected ? null : p.id)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
