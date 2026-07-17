'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const STATUS_META = {
  enr: { label: 'Enregistré',          color: '#6B7280', bg: '#F4F5F7', pill: 'pill--gray'   },
  rec: { label: 'Reçu entrepôt',       color: '#0087A8', bg: '#E0F9FF', pill: 'pill--blue'   },
  pre: { label: 'Préparé',             color: '#059669', bg: '#ECFDF5', pill: 'pill--green'  },
  exp: { label: 'Expédié',             color: '#7C3AED', bg: '#EDE9FE', pill: 'pill--blue'   },
  tra: { label: 'En transit',          color: '#B45309', bg: '#FFFBEB', pill: 'pill--orange' },
  apd: { label: 'Arrivé au pays',      color: '#0D9488', bg: '#F0FDFA', pill: 'pill--green'  },
  dou: { label: 'En douane',           color: '#DC2626', bg: '#FEF2F2', pill: 'pill--red'    },
  ins: { label: 'Inspection douane',   color: '#DC2626', bg: '#FEF2F2', pill: 'pill--red'    },
  ret: { label: 'Retenu douane',       color: '#DC2626', bg: '#FEF2F2', pill: 'pill--red'    },
  ard: { label: 'Entrepôt dest.',      color: '#1B4FD8', bg: '#EFF6FF', pill: 'pill--blue'   },
  lib: { label: 'Libéré douane',       color: '#059669', bg: '#ECFDF5', pill: 'pill--green'  },
  ver: { label: 'Vérification',        color: '#1B4FD8', bg: '#EFF6FF', pill: 'pill--blue'   },
  pdl: { label: 'Prêt pour livraison', color: '#10B981', bg: '#ECFDF5', pill: 'pill--green'  },
  liv: { label: 'En livraison',        color: '#1B4FD8', bg: '#EFF6FF', pill: 'pill--blue'   },
  ok:  { label: 'Livré',              color: '#6B7280', bg: '#F4F5F7', pill: 'pill--gray'   },
  tdl: { label: 'Tentative échouée',  color: '#DC2626', bg: '#FEF2F2', pill: 'pill--red'    },
};

function StatCard({ label, value, color }) {
  return (
    <div style={{ flex: 1, minWidth: 0, background: 'white', borderRadius: 12, padding: '14px 10px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,.07)' }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: color ?? '#111827', lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ fontSize: 10.5, color: '#6B7280', marginTop: 4, fontWeight: 500, lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

export default function DriverDashboard() {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [acting,     setActing]     = useState({});
  const [msgs,       setMsgs]       = useState({});
  const [photoFor,   setPhotoFor]   = useState(null); // parcelId awaiting photo confirm
  const [uploading,  setUploading]  = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0] ?? 'Livreur';

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/driver/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (parcelId, status, note, photoUrl) => {
    setActing(a => ({ ...a, [parcelId]: status }));
    try {
      const res = await fetch(`/api/driver/parcels/${parcelId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note: note || null, photoUrl: photoUrl || null }),
      });
      if (res.ok) {
        setMsgs(m => ({ ...m, [parcelId]: status === 'ok' ? '✓ Livré !' : status === 'liv' ? '🚚 En route' : '↩ Tentative notée' }));
        setTimeout(() => { load(); setMsgs(m => { const n = {...m}; delete n[parcelId]; return n; }); }, 1500);
      } else {
        const d = await res.json();
        setMsgs(m => ({ ...m, [parcelId]: `✗ ${d.error}` }));
      }
    } catch {
      setMsgs(m => ({ ...m, [parcelId]: '✗ Erreur réseau' }));
    } finally {
      setActing(a => { const n = {...a}; delete n[parcelId]; return n; });
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

  const confirmDelivery = async (parcelId, file) => {
    setUploading(true);
    try {
      let photoUrl = null;
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('parcelId', parcelId);
        const up = await fetch('/api/driver/upload-proof', { method: 'POST', body: fd });
        if (up.ok) { const d = await up.json(); photoUrl = d.url; }
      }
      await updateStatus(parcelId, 'ok', null, photoUrl);
    } finally {
      setUploading(false);
      setPhotoFor(null);
    }
  };

  const active  = data?.active  ?? [];
  const pending = data?.pending ?? [];
  const recent  = data?.recentDeliveries ?? [];
  const stats   = data?.stats ?? {};

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* Gradient header */}
      <div style={{ background: 'linear-gradient(135deg, #0D2E6E 0%, #1B4FD8 100%)', padding: '20px 18px 18px' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>
          Espace livreur
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'white', letterSpacing: '-.01em' }}>
          Bonjour {firstName} 🚚
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', marginTop: 2 }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '14px 14px 0' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <StatCard label="À livrer"     value={stats.pending}        color="#1B4FD8" />
          <StatCard label="Livrés auj."  value={stats.deliveredToday} color="#10B981" />
          <StatCard label="Échecs auj."  value={stats.failedToday}    color="#DC2626" />
        </div>
      </div>

      {/* Refresh */}
      <div style={{ padding: '10px 14px 0', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={load} disabled={loading} style={{
          background: 'none', border: '1px solid #E5E7EB', borderRadius: 8,
          padding: '6px 12px', fontSize: 12, color: '#6B7280', cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {loading ? 'Chargement…' : '↻ Actualiser'}
        </button>
      </div>

      {/* Active deliveries */}
      {active.length > 0 ? (
        <div style={{ padding: '14px 14px 0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 10 }}>
            Mes livraisons — {active.length}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {active.map(p => {
              const m   = STATUS_META[p.status] ?? STATUS_META.pdl;
              const tel = p.recipPhone || p.client?.phone;
              const msg = msgs[p.id];
              const act = acting[p.id];
              return (
                <div key={p.id} className="drv-card" style={{ padding: '14px' }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#111827' }}>{p.trackingCode}</span>
                    <span className={`pill ${m.pill}`}>{m.label}</span>
                  </div>

                  {/* Recipient */}
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 2 }}>
                    {p.recipName || p.client?.name}
                  </div>
                  {p.recipCity && (
                    <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>📍 {p.recipCity}</div>
                  )}
                  {tel && (
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                      <span style={{ fontSize: 12, color: '#6B7280', lineHeight: '28px' }}>{tel}</span>
                      <a href={`https://wa.me/${tel.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', background: '#25D366', color: 'white', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
                        WA
                      </a>
                      <a href={`tel:${tel}`}
                        style={{ display: 'inline-flex', alignItems: 'center', background: '#F4F5F7', color: '#374151', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                        📞
                      </a>
                    </div>
                  )}

                  {/* Feedback */}
                  {msg && (
                    <div style={{ marginBottom: 8, padding: '6px 10px', borderRadius: 7, background: msg.startsWith('✓') || msg.startsWith('🚚') || msg.startsWith('↩') ? '#ECFDF5' : '#FEF2F2', fontSize: 12.5, fontWeight: 600, color: msg.startsWith('✗') ? '#DC2626' : '#047857' }}>
                      {msg}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['ard', 'lib', 'ver', 'pdl'].includes(p.status) && (
                      <button
                        onClick={() => updateStatus(p.id, 'liv')}
                        disabled={!!act}
                        className="drv-btn drv-btn--brand drv-btn--full"
                        style={{ height: 40, fontSize: 13 }}
                      >
                        {act === 'liv' ? '…' : '🚚 Prendre en charge'}
                      </button>
                    )}
                    {p.status === 'liv' && photoFor !== p.id && (
                      <>
                        <button
                          onClick={() => setPhotoFor(p.id)}
                          disabled={!!act}
                          className="drv-btn drv-btn--green"
                          style={{ flex: 1, height: 40, fontSize: 13 }}
                        >
                          {act === 'ok' ? '…' : '✓ Livré'}
                        </button>
                        <button
                          onClick={() => {
                            const note = window.prompt('Raison de l\'échec (obligatoire) :');
                            if (note) updateStatus(p.id, 'tdl', note);
                          }}
                          disabled={!!act}
                          className="drv-btn drv-btn--danger"
                          style={{ flex: 1, height: 40, fontSize: 13 }}
                        >
                          {act === 'tdl' ? '…' : '↩ Échec'}
                        </button>
                      </>
                    )}
                    {p.status === 'liv' && photoFor === p.id && (
                      <div style={{ width: '100%' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                          📷 Photo de livraison
                        </div>
                        <label style={{
                          display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
                          border: '2px dashed #D1D5DB', borderRadius: 10, padding: '12px', cursor: 'pointer',
                          background: '#F9FAFB', marginBottom: 10, fontSize: 13, color: '#6B7280',
                        }}>
                          <span style={{ fontSize: 20 }}>📸</span>
                          Prendre une photo
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            style={{ display: 'none' }}
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) confirmDelivery(p.id, f);
                            }}
                          />
                        </label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => setPhotoFor(null)}
                            disabled={uploading}
                            className="drv-btn drv-btn--ghost"
                            style={{ flex: 1, height: 36, fontSize: 12 }}
                          >
                            Annuler
                          </button>
                          <button
                            onClick={() => confirmDelivery(p.id, null)}
                            disabled={uploading}
                            className="drv-btn drv-btn--green"
                            style={{ flex: 2, height: 36, fontSize: 12 }}
                          >
                            {uploading ? '…' : '✓ Confirmer sans photo'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : !loading && active.length === 0 && pending.length === 0 && (
        <div style={{ padding: '48px 20px', textAlign: 'center', color: '#9CA3AF' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Aucune livraison assignée</div>
          <div style={{ fontSize: 13 }}>Vos livraisons apparaîtront ici dès qu'un colis vous sera assigné.</div>
        </div>
      )}

      {/* Pending assignments — cargo not yet ready */}
      {pending.length > 0 && (
        <div style={{ padding: '16px 14px 0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 10 }}>
            Assignations en attente — {pending.length}
          </div>
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px', marginBottom: 10, fontSize: 12, color: '#B45309' }}>
            ⏳ Ces colis vous sont pré-assignés mais ne sont pas encore prêts pour la livraison. Ils passeront en livraisons actives dès leur arrivée à l'entrepôt.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pending.map(p => {
              const m   = STATUS_META[p.status] ?? STATUS_META.enr;
              const tel = p.recipPhone || p.client?.phone;
              return (
                <div key={p.id} className="drv-card" style={{ padding: '12px 14px', opacity: .85 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 700, color: '#111827' }}>{p.trackingCode}</span>
                    <span className={`pill ${m.pill}`}>{m.label}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{p.recipName || p.client?.name}</div>
                  {p.recipCity && <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 2 }}>📍 {p.recipCity}</div>}
                  {p.campaign?.code && (
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                      Cargaison {p.campaign.code} · Statut : {STATUS_META[p.campaign.status]?.label ?? p.campaign.status}
                    </div>
                  )}
                  {tel && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <a href={`https://wa.me/${tel.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', background: '#25D366', color: 'white', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
                        WA
                      </a>
                      <a href={`tel:${tel}`}
                        style={{ display: 'inline-flex', alignItems: 'center', background: '#F4F5F7', color: '#374151', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                        📞
                      </a>
                      <span style={{ fontSize: 11.5, color: '#6B7280', lineHeight: '26px' }}>{tel}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent deliveries */}
      {recent.length > 0 && (
        <div style={{ padding: '16px 14px 0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 10 }}>
            Livraisons récentes
          </div>
          <div className="drv-card" style={{ overflow: 'hidden' }}>
            {recent.map((p, i) => (
              <div key={p.id} style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i < recent.length - 1 ? '1px solid #F4F5F7' : 'none' }}>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 700, color: '#111827' }}>{p.trackingCode}</div>
                  <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 1 }}>{p.client?.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="pill pill--green">Livré</span>
                  <div style={{ fontSize: 10.5, color: '#9CA3AF', marginTop: 3 }}>{fmtDate(p.deliveredAt)}</div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => router.push('/livreur/historique')} style={{ marginTop: 8, width: '100%', background: 'none', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px', fontSize: 13, color: '#1B4FD8', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            Voir tout l'historique →
          </button>
        </div>
      )}
    </div>
  );
}
