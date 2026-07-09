'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const STATUS_META = {
  enr: { label: 'Enregistré',      color: '#1B4FD8', bg: '#EFF6FF' },
  rec: { label: "À l'entrepôt",    color: '#0087A8', bg: '#E0F9FF' },
  pre: { label: 'Préparé',         color: '#059669', bg: '#ECFDF5' },
  exp: { label: 'Expédié',         color: '#7C3AED', bg: '#EDE9FE' },
  tra: { label: 'En transit',      color: '#B45309', bg: '#FFFBEB' },
  apd: { label: 'Arrivée pays',    color: '#0D9488', bg: '#F0FDFA' },
  dou: { label: 'En douane',       color: '#DC2626', bg: '#FEF2F2' },
  lib: { label: 'Libéré douane',   color: '#059669', bg: '#ECFDF5' },
  ard: { label: 'Entrepôt dest.',  color: '#1B4FD8', bg: '#EFF6FF' },
  pdl: { label: 'Prêt retrait',    color: '#10B981', bg: '#ECFDF5' },
  ok:  { label: 'Livré',          color: '#6B7280', bg: '#F4F5F7' },
};

function StatusPill({ status }) {
  const m = STATUS_META[status] ?? { label: status, color: '#6B7280', bg: '#F4F5F7' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: 999, fontSize: 11, fontWeight: 700,
      color: m.color, background: m.bg,
    }}>{m.label}</span>
  );
}

function CountCard({ label, value, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, minWidth: 0, background: 'white', borderRadius: 12, padding: '14px 12px',
      border: 'none', cursor: onClick ? 'pointer' : 'default', textAlign: 'center',
      boxShadow: '0 1px 3px rgba(0,0,0,.07)',
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: color ?? '#111827', lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4, fontWeight: 500, lineHeight: 1.3 }}>{label}</div>
    </button>
  );
}

export default function AgentDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const router   = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  const load = () => {
    setLoading(true);
    fetch('/api/agent/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const counts = data?.counts ?? {};
  const pending = data?.pendingPickupList ?? [];
  const campaigns = data?.activeCampaigns ?? [];
  const activity  = data?.recentActivity  ?? [];

  const fmtTime = (d) => {
    if (!d) return '';
    const diff = (Date.now() - new Date(d).getTime()) / 1000;
    if (diff < 60)    return 'à l\'instant';
    if (diff < 3600)  return `${Math.floor(diff/60)} min`;
    if (diff < 86400) return `${Math.floor(diff/3600)} h`;
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div style={{ padding: '0 0 16px' }}>
      {/* Header */}
      <div style={{
        padding: '20px 18px 14px',
        background: 'linear-gradient(135deg, #0D2E6E 0%, #1B4FD8 100%)',
      }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>
          Espace agent
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'white', letterSpacing: '-.01em' }}>
          Bonjour {user?.name?.split(' ')[0] ?? 'Agent'} 👋
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', marginTop: 2 }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* Count cards */}
      <div style={{ padding: '14px 14px 0' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <CountCard
            label="En attente de retrait"
            value={counts.pendingPickup}
            color="#1B4FD8"
            onClick={() => router.push('/agent/parcels?status=pdl')}
          />
          <CountCard
            label="À traiter"
            value={counts.toProcess}
            color="#B45309"
            onClick={() => router.push('/agent/parcels?status=rec')}
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <CountCard label="Reçus aujourd'hui"   value={counts.receivedToday}  color="#0087A8" />
          <CountCard label="Livrés aujourd'hui"  value={counts.deliveredToday} color="#10B981" />
        </div>
      </div>

      {/* Refresh button */}
      <div style={{ padding: '10px 14px 0', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={load} disabled={loading} style={{
          background: 'none', border: '1px solid #E5E7EB', borderRadius: 8,
          padding: '6px 12px', fontSize: 12, color: '#6B7280', cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
          {loading ? 'Chargement…' : '↻ Actualiser'}
        </button>
      </div>

      {/* Pending pickups */}
      {pending.length > 0 && (
        <div style={{ padding: '14px 14px 0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 10 }}>
            En attente de retrait — {pending.length}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pending.slice(0, 10).map(p => (
              <div key={p.id} className="agent-card" style={{ padding: '13px 14px' }}
                onClick={() => router.push(`/agent/parcels/${p.id}`)}
                role="button" style={{ cursor: 'pointer', padding: '13px 14px', background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#111827' }}>{p.trackingCode}</span>
                    <StatusPill status={p.status} />
                  </div>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>{fmtTime(p.createdAt)}</span>
                </div>
                <div style={{ fontSize: 13, color: '#374151', fontWeight: 600, marginBottom: 2 }}>
                  {p.recipName || p.client.name}
                </div>
                {(p.recipPhone || p.client.phone) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>{p.recipPhone || p.client.phone}</span>
                    <a href={`https://wa.me/${(p.recipPhone || p.client.phone || '').replace(/\D/g, '')}`}
                      onClick={e => e.stopPropagation()}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: '#25D366', color: 'white', borderRadius: 6, padding: '2px 8px',
                        fontSize: 11, fontWeight: 600, textDecoration: 'none',
                      }}>
                      WA
                    </a>
                  </div>
                )}
                {p.payment && (
                  <div style={{ marginTop: 6, fontSize: 11, color: p.payment.status === 'completed' ? '#059669' : '#DC2626', fontWeight: 600 }}>
                    {p.payment.status === 'completed' ? '✓ Payé' : `⚠ ${(p.payment.amount ?? 0).toLocaleString('fr')} CAD dû`}
                  </div>
                )}
              </div>
            ))}
            {pending.length > 10 && (
              <button onClick={() => router.push('/agent/parcels?status=pdl')}
                style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px', fontSize: 13, color: '#1B4FD8', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                Voir les {pending.length - 10} autres →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active campaigns */}
      {campaigns.length > 0 && (
        <div style={{ padding: '16px 14px 0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 10 }}>
            Cargaisons actives
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {campaigns.map(c => (
              <div key={c.id} className="agent-card" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{c.code}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                    {c.from} → {c.to} · {c.parcelCount} colis
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <StatusPill status={c.status} />
                  {c.arrivalDate && (
                    <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>
                      arr. {new Date(c.arrivalDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {activity.length > 0 && (
        <div style={{ padding: '16px 14px 0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 10 }}>
            Activité récente
          </div>
          <div className="agent-card" style={{ overflow: 'hidden' }}>
            {activity.map((a, i) => (
              <div key={i} style={{
                padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start',
                borderBottom: i < activity.length - 1 ? '1px solid #F4F5F7' : 'none',
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: (STATUS_META[a.status] ?? {}).bg ?? '#F4F5F7', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 13 }}>📦</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827' }}>{a.parcelCode} — {a.clientName}</div>
                  <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 1 }}>
                    <StatusPill status={a.status} /> {a.note ? `· ${a.note}` : ''}
                  </div>
                </div>
                <span style={{ fontSize: 10.5, color: '#9CA3AF', flexShrink: 0 }}>{fmtTime(a.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !data && (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9CA3AF' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📡</div>
          <div>Impossible de charger les données</div>
          <button onClick={load} style={{ marginTop: 12, background: '#1B4FD8', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Réessayer</button>
        </div>
      )}
    </div>
  );
}
