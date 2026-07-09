'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const STATUS_META = {
  enr: { label: 'Enregistré',     color: '#1B4FD8', bg: '#EFF6FF' },
  rec: { label: "Entrepôt",       color: '#0087A8', bg: '#E0F9FF' },
  pre: { label: 'Préparé',        color: '#059669', bg: '#ECFDF5' },
  exp: { label: 'Expédié',        color: '#7C3AED', bg: '#EDE9FE' },
  tra: { label: 'Transit',        color: '#B45309', bg: '#FFFBEB' },
  apd: { label: 'Arrivée pays',   color: '#0D9488', bg: '#F0FDFA' },
  dou: { label: 'Douane',         color: '#DC2626', bg: '#FEF2F2' },
  lib: { label: 'Libéré',         color: '#059669', bg: '#ECFDF5' },
  ard: { label: 'Entrepôt dest.', color: '#1B4FD8', bg: '#EFF6FF' },
  pdl: { label: 'Prêt retrait',   color: '#10B981', bg: '#ECFDF5' },
  ok:  { label: 'Livré',          color: '#6B7280', bg: '#F4F5F7' },
};

const FILTER_TABS = [
  { key: '',    label: 'Tous'        },
  { key: 'rec', label: "Entrepôt"   },
  { key: 'pdl', label: 'Prêt'       },
  { key: 'ok',  label: 'Livrés'     },
];

function StatusPill({ status }) {
  const m = STATUS_META[status] ?? { label: status, color: '#6B7280', bg: '#F4F5F7' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 999, fontSize: 11, fontWeight: 700, color: m.color, background: m.bg }}>
      {m.label}
    </span>
  );
}

function ParcelList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [parcels,  setParcels]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState(searchParams.get('status') ?? '');
  const inputRef = useRef(null);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set('status', filter);
    if (search) params.set('q', search);
    fetch(`/api/agent/parcels?${params}`)
      .then(r => r.json())
      .then(d => { setParcels(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);
  useEffect(() => {
    const t = setTimeout(() => { if (search.length !== 1) load(); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '';

  return (
    <div>
      {/* Topbar */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '12px 14px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 10 }}>Colis</div>
        <input
          ref={inputRef}
          className="agent-input"
          placeholder="Rechercher code, client, téléphone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 10 }}
        />
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {FILTER_TABS.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)} style={{
              flexShrink: 0, padding: '5px 13px', borderRadius: 999, border: 'none',
              background: filter === t.key ? '#1B4FD8' : '#F4F5F7',
              color:      filter === t.key ? 'white'   : '#374151',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ padding: '8px 14px' }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 76, background: '#F4F5F7', borderRadius: 12, marginBottom: 8, animation: 'pulse 1.5s infinite' }} />
          ))
        ) : parcels.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#9CA3AF' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
            <div style={{ fontSize: 14 }}>Aucun colis trouvé</div>
          </div>
        ) : (
          parcels.map(p => (
            <div key={p.id} onClick={() => router.push(`/agent/parcels/${p.id}`)}
              style={{
                background: 'white', borderRadius: 12, padding: '12px 14px', marginBottom: 8,
                boxShadow: '0 1px 3px rgba(0,0,0,.07)', cursor: 'pointer',
                borderLeft: `3px solid ${(STATUS_META[p.status] ?? {}).color ?? '#E5E7EB'}`,
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#111827' }}>{p.trackingCode}</span>
                <StatusPill status={p.status} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937', marginBottom: 2 }}>
                {p.recipName || p.client.name}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#6B7280' }}>
                  {p.campaign.code} · {p.weightKg ? `${p.weightKg} kg` : '—'}
                </span>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>{fmtDate(p.createdAt)}</span>
              </div>
              {p.payment && p.payment.status !== 'completed' && (
                <div style={{ marginTop: 5, fontSize: 11, color: '#DC2626', fontWeight: 600 }}>
                  ⚠ Paiement en attente · {(p.payment.amount ?? 0).toLocaleString('fr')} CAD
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function AgentParcelsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20, color: '#9CA3AF' }}>Chargement…</div>}>
      <ParcelList />
    </Suspense>
  );
}
