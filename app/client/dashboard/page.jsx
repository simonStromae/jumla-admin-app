'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/src/components/Shell.jsx';
import I from '@/src/components/Icons.jsx';

const PARCEL_STATUS = {
  en_attente: { label: 'En attente', color: 'var(--ink-500)',    bg: 'var(--bg-soft)',   icon: '⏳' },
  recu:       { label: 'Reçu',       color: 'var(--brand-700)', bg: 'var(--brand-50)',  icon: '✅' },
  en_transit: { label: 'En transit', color: 'var(--info-700)',   bg: 'var(--info-50)',   icon: '✈️' },
  en_douane:  { label: 'En douane',  color: 'var(--warn-700)',   bg: 'var(--warn-50)',   icon: '🛃' },
  arrive:     { label: 'Arrivé',     color: 'var(--ok-700)',     bg: 'var(--ok-50)',     icon: '📦' },
  livre:      { label: 'Livré',      color: 'var(--ok-700)',     bg: 'var(--ok-50)',     icon: '🎉' },
};

function StatusBadge({ status }) {
  const s = PARCEL_STATUS[status] ?? { label: status, color: 'var(--ink-500)', bg: 'var(--bg-soft)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 999,
      background: s.bg, color: s.color,
      fontSize: 12, fontWeight: 600,
    }}>
      {s.icon} {s.label}
    </span>
  );
}

function TrackingTimeline({ events }) {
  if (!events?.length) return (
    <div style={{ padding: '16px 0', color: 'var(--ink-400)', fontSize: 13, textAlign: 'center' }}>
      Aucun événement enregistré.
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {events.map((e, i) => {
        const s = PARCEL_STATUS[e.status] ?? { label: e.status, color: 'var(--ink-400)', bg: 'var(--bg-soft)', icon: '•' };
        return (
          <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: i < events.length - 1 ? 14 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: s.bg, display: 'grid', placeItems: 'center', fontSize: 14, flexShrink: 0 }}>
                {s.icon}
              </div>
              {i < events.length - 1 && (
                <div style={{ width: 1, flex: 1, background: 'var(--border)', marginTop: 3 }} />
              )}
            </div>
            <div style={{ paddingTop: 3 }}>
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

function ParcelModal({ parcel, onClose }) {
  const paid = parcel.payment?.status === 'completed';
  const s    = PARCEL_STATUS[parcel.status] ?? { label: parcel.status, color: 'var(--ink-500)', bg: 'var(--bg-soft)' };
  return (
    <Modal
      width={540}
      onClose={onClose}
      title={<span className="mono" style={{ fontWeight: 700 }}>{parcel.trackingCode}</span>}
      sub={`${parcel.campaign?.from} → ${parcel.campaign?.to} · ${parcel.campaign?.code}`}
      footer={
        <>
          <a href={'/client/invoice/' + parcel.id} target="_blank" rel="noreferrer" className="btn btn--ghost">
            📄 Voir la facture
          </a>
          <div style={{ flex: 1 }} />
          <button className="btn btn--ghost" onClick={onClose}>Fermer</button>
        </>
      }
    >
      {/* Status + payment row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div style={{ background: 'var(--bg-soft)', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: 10.5, color: 'var(--ink-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Statut colis</div>
          <StatusBadge status={parcel.status} />
        </div>
        <div style={{ background: 'var(--bg-soft)', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: 10.5, color: 'var(--ink-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Paiement</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: paid ? 'var(--ok-700)' : 'var(--bad-600)' }}>
            {paid ? '✓ Réglé' : `${(parcel.priceXaf ?? 0).toLocaleString('fr')} CAD dû`}
          </span>
        </div>
      </div>

      {/* Info row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Poids',    val: parcel.weightKg != null ? `${parcel.weightKg} kg` : '—' },
          { label: 'Montant',  val: parcel.priceXaf  != null ? `${parcel.priceXaf.toLocaleString('fr')} CAD` : '—' },
          { label: 'Cargaison', val: parcel.campaign?.code ?? '—' },
        ].map(({ label, val }) => (
          <div key={label} style={{ background: 'var(--bg-soft)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 10.5, color: 'var(--ink-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>{label}</div>
            <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-800)' }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Payment pending banner */}
      {!paid && (
        <div style={{ background: 'var(--warn-50)', border: '1px solid var(--warn-200)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
          <strong style={{ color: 'var(--warn-700)' }}>Paiement en attente</strong>
          <div style={{ color: 'var(--warn-600)', marginTop: 3 }}>
            Envoyez <strong>{(parcel.priceXaf ?? 0).toLocaleString('fr')} CAD</strong> par Virement Interac · indiquez votre numéro de colis dans le message.
          </div>
        </div>
      )}

      {/* Bordereaux */}
      {parcel.bordereaux?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Bordereaux</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {parcel.bordereaux.map(bl => (
              <a key={bl.id} href={'/client/bordereau/' + bl.id} target="_blank" rel="noreferrer"
                className="btn btn--ghost btn--xs" style={{ textDecoration: 'none', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                📋 {bl.code}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
        Historique de suivi
      </div>
      <TrackingTimeline events={parcel.tracking} />
    </Modal>
  );
}

function ParcelRow({ parcel, onSelect }) {
  const paid = parcel.payment?.status === 'completed';
  return (
    <div
      onClick={onSelect}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '13px 16px', background: 'white',
        border: '1px solid var(--border)', borderRadius: 8,
        cursor: 'pointer', transition: 'border-color .12s, background .12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-300)'; e.currentTarget.style.background = 'var(--brand-50)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'white'; }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span className="mono" style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink-900)' }}>{parcel.trackingCode}</span>
          <StatusBadge status={parcel.status} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-400)' }}>
          {parcel.campaign?.from} → {parcel.campaign?.to} · <strong>{parcel.campaign?.code}</strong>
          {parcel.weightKg != null && <> · {parcel.weightKg} kg</>}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div className="mono" style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink-800)' }}>
          {(parcel.priceXaf ?? 0).toLocaleString('fr')} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--ink-400)' }}>CAD</span>
        </div>
        <div style={{ fontSize: 12, marginTop: 2, color: paid ? 'var(--ok-600)' : 'var(--bad-500)', fontWeight: 600 }}>
          {paid ? '✓ Payé' : 'À régler'}
        </div>
      </div>
      <I.ChevronRight style={{ width: 16, height: 16, color: 'var(--ink-300)', flexShrink: 0 }} />
    </div>
  );
}

export default function ClientDashboard() {
  const { data: session } = useSession();
  const router    = useRouter();
  const suspended = session?.user?.status === 'suspended';
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch('/api/me/parcels').then(r => r.json()).then(data => {
      setParcels(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const active  = parcels.filter(p => p.status !== 'livre');
  const done    = parcels.filter(p => p.status === 'livre');
  const unpaid  = parcels.filter(p => !p.payment || p.payment.status !== 'completed');
  const detail  = selected ? parcels.find(p => p.id === selected) : null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 3px', color: 'var(--ink-900)' }}>
            Bonjour, {session?.user?.name?.split(' ')[0]}
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--ink-400)', margin: 0 }}>
            Suivez vos colis et gérez vos paiements.
          </p>
        </div>
        {!suspended && (
          <button onClick={() => router.push('/client/booking')} className="btn btn--brand">
            <I.Plus /> Réserver un envoi
          </button>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Colis en cours',  value: active.length,  color: 'var(--brand-700)', icon: <I.Plane  style={{ width: 18, height: 18 }} /> },
          { label: 'Colis livrés',    value: done.length,    color: 'var(--ok-700)',    icon: <I.Check  style={{ width: 18, height: 18 }} /> },
          { label: 'Paiements dus',   value: unpaid.length,  color: 'var(--bad-600)',   icon: <I.Wallet style={{ width: 18, height: 18 }} /> },
        ].map((k, i) => (
          <div key={i} className="kpi">
            <div className="kpi__label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ color: k.color }}>{k.icon}</span> {k.label}
            </div>
            <div className="kpi__value" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Parcels */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-400)', fontSize: 13 }}>Chargement…</div>
      ) : parcels.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--ink-400)' }}>
          <I.Box style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: .3 }} />
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: 'var(--ink-700)' }}>Aucun colis enregistré</div>
          {suspended ? (
            <div style={{ fontSize: 13, color: 'var(--warn-600)' }}>Votre compte est suspendu. Contactez-nous pour régulariser.</div>
          ) : (
            <>
              <div style={{ fontSize: 13, marginBottom: 16 }}>Commencez par réserver votre premier envoi.</div>
              <button onClick={() => router.push('/client/booking')} className="btn btn--brand">
                <I.Plus /> Réserver mon premier envoi
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
                Colis en cours — {active.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {active.map(p => (
                  <ParcelRow key={p.id} parcel={p} onSelect={() => setSelected(p.id)} />
                ))}
              </div>
            </div>
          )}
          {done.length > 0 && (
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
                Colis livrés — {done.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {done.map(p => (
                  <ParcelRow key={p.id} parcel={p} onSelect={() => setSelected(p.id)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {detail && <ParcelModal parcel={detail} onClose={() => setSelected(null)} />}
    </div>
  );
}
