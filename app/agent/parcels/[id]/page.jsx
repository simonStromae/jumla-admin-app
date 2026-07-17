'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

const STATUSES = [
  { group: 'Réception',    items: [
    { id: 'rec', label: 'Reçu à l\'entrepôt',     icon: '📥' },
    { id: 'pre', label: 'Vérifié et préparé',      icon: '🔍' },
    { id: 'ard', label: 'Arrivé côté destination', icon: '🏭' },
    { id: 'pdl', label: 'Prêt pour retrait',       icon: '✅' },
  ]},
  { group: 'Livraison',    items: [
    { id: 'ok',  label: 'Livré / Retiré',          icon: '🎉' },
    { id: 'tdl', label: 'Tentative échouée',        icon: '🔁' },
  ]},
  { group: 'Expédition',   items: [
    { id: 'exp', label: 'Expédié',                  icon: '🚀' },
    { id: 'tra', label: 'En transit',               icon: '✈️' },
    { id: 'apd', label: 'Arrivée au pays',          icon: '🛬' },
  ]},
  { group: 'Douanes',      items: [
    { id: 'dou', label: 'Présenté aux douanes',     icon: '🛃' },
    { id: 'lib', label: 'Libéré par douanes',       icon: '🔓' },
    { id: 'ret', label: 'Retenu',                   icon: '⛔' },
  ]},
  { group: 'Exceptionnel', items: [
    { id: 'adr', label: 'Adresse incomplète',       icon: '🏠' },
    { id: 'rte', label: 'Retour entrepôt',          icon: '↩️' },
  ]},
];

const STATUS_LABELS = {};
STATUSES.forEach(g => g.items.forEach(s => { STATUS_LABELS[s.id] = s.label; }));

const DRIVER_WARNINGS = {
  enr: { color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB', icon: '📝', msg: 'La cargaison n\'a pas encore été expédiée.' },
  exp: { color: '#92400E', bg: '#FFFBEB', border: '#FCD34D', icon: '🚀', msg: 'La cargaison est en cours d\'expédition — le colis n\'est pas encore arrivé.' },
  tra: { color: '#92400E', bg: '#FFFBEB', border: '#FCD34D', icon: '✈️', msg: 'La cargaison est en transit — en vol ou en route.' },
  apd: { color: '#92400E', bg: '#FFFBEB', border: '#FCD34D', icon: '🛬', msg: 'Arrivée au pays — dédouanement pas encore effectué.' },
  dou: { color: '#92400E', bg: '#FFFBEB', border: '#FCD34D', icon: '🛃', msg: 'En dédouanement — livraison possible après libération uniquement.' },
  ins: { color: '#92400E', bg: '#FFFBEB', border: '#FCD34D', icon: '🔎', msg: 'En inspection douanière — date de libération incertaine.' },
  ret: { color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA', icon: '⚠️', msg: 'Retenu aux douanes — livraison bloquée.' },
};

const STATUS_COLOR = {
  enr: '#1B4FD8', rec: '#0087A8', pre: '#059669', exp: '#7C3AED',
  tra: '#B45309', apd: '#0D9488', dou: '#DC2626', lib: '#059669',
  ard: '#1B4FD8', pdl: '#10B981', ok: '#6B7280',
};

function formatPhone(p) {
  if (!p) return null;
  return p.replace(/\D/g, '');
}

export default function AgentParcelPage() {
  const router = useRouter();
  const { id } = useParams();
  const [parcel,   setParcel]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [note,      setNote]      = useState('');
  const [location,  setLocation]  = useState('');
  const [showStatus,  setShowStatus]  = useState(false);
  const [drivers,     setDrivers]     = useState([]);
  const [driverId,    setDriverId]    = useState('');
  const [savingDriver, setSavingDriver] = useState(false);

  useEffect(() => {
    fetch(`/api/parcels/${id}`)
      .then(r => r.json())
      .then(d => { setParcel(d); setDriverId(d.driverId ?? ''); setLoading(false); })
      .catch(() => setLoading(false));
    fetch('/api/admin/drivers')
      .then(r => r.json())
      .then(d => Array.isArray(d) && setDrivers(d))
      .catch(() => {});
  }, [id]);

  const handleDriverAssign = async (newDriverId) => {
    setSavingDriver(true); setError(''); setSuccess('');
    try {
      const body = { driverId: newDriverId || null };
      if (newDriverId) {
        body.delivery = 'home';
        // Auto-promote to 'pdl' so driver sees it immediately in their dashboard
        if (['ard', 'lib', 'ver', 'tdl'].includes(parcel?.status)) {
          body.status = 'pdl';
          body.eventNote = 'Prêt pour livraison — livreur assigné';
        }
      }
      const res = await fetch(`/api/parcels/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Erreur'); setSavingDriver(false); return; }
      setDriverId(newDriverId);
      setParcel(p => ({
        ...p,
        driverId: newDriverId || null,
        delivery: newDriverId ? 'home' : null,
        ...(body.status ? { status: body.status } : {}),
      }));
      const driverName = drivers.find(d => d.id === newDriverId)?.name;
      setSuccess(newDriverId ? `Livreur assigné : ${driverName}` : 'Livreur désassigné');
    } catch { setError('Erreur réseau'); }
    finally { setSavingDriver(false); }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`/api/parcels/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, eventNote: note || null, eventLocation: location || null }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Erreur'); setSaving(false); return; }
      const updated = await res.json();
      setParcel(updated.parcel ?? parcel);
      setSuccess(`Statut mis à jour → ${STATUS_LABELS[newStatus] ?? newStatus}`);
      setNewStatus(''); setNote(''); setLocation('');
      setShowStatus(false);
    } catch { setError('Erreur réseau'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9CA3AF' }}>
      <div style={{ fontSize: 20, marginBottom: 8 }}>⏳</div>Chargement…
    </div>
  );

  if (!parcel || parcel.error) return (
    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9CA3AF' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>❌</div>
      <div style={{ marginBottom: 12 }}>Colis introuvable</div>
      <button onClick={() => router.back()} style={{ background: '#F4F5F7', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>← Retour</button>
    </div>
  );

  const contactPhone = parcel.recipPhone || parcel.client?.phone;
  const contactName  = parcel.recipName  || parcel.client?.name;
  const waLink       = contactPhone ? `https://wa.me/${formatPhone(contactPhone)}?text=${encodeURIComponent(`Bonjour, votre colis ${parcel.trackingCode} est prêt. Merci de vous présenter pour le retrait. — Jumla Shipping`)}` : null;
  const currentColor = STATUS_COLOR[parcel.status] ?? '#6B7280';

  return (
    <div>
      {/* Back + header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#374151' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: '#111827' }}>{parcel.trackingCode}</div>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 999,
          fontSize: 11.5, fontWeight: 700, background: currentColor + '20', color: currentColor,
        }}>
          {STATUS_LABELS[parcel.status] ?? parcel.status}
        </span>
      </div>

      <div style={{ padding: '14px 14px 0' }}>

        {/* Success / error banner */}
        {success && (
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: '10px 14px', marginBottom: 12, color: '#047857', fontSize: 13, fontWeight: 600 }}>
            ✓ {success}
          </div>
        )}
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 12, color: '#DC2626', fontSize: 13, fontWeight: 600 }}>
            ✗ {error}
          </div>
        )}

        {/* Contact card */}
        <div className="agent-card" style={{ padding: '14px', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Destinataire</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{contactName ?? '—'}</div>
          {contactPhone && (
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>{contactPhone}</div>
          )}
          {parcel.recipCity && (
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12 }}>📍 {parcel.recipCity}</div>
          )}
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {waLink && (
              <a href={waLink} target="_blank" rel="noreferrer" className="agent-btn agent-btn--wa" style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.099 1.523 5.824L0 24l6.326-1.499A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.373l-.36-.213-3.751.889.905-3.651-.233-.374A9.818 9.818 0 0112 2.182c5.424 0 9.818 4.394 9.818 9.818S17.424 21.818 12 21.818z"/></svg>
                WhatsApp
              </a>
            )}
            {contactPhone && (
              <a href={`tel:${contactPhone}`} className="agent-btn agent-btn--ghost" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                📞
              </a>
            )}
          </div>
        </div>

        {/* Parcel info */}
        <div className="agent-card" style={{ padding: '14px', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Détails colis</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Cargaison',    value: parcel.campaign?.code },
              { label: 'Poids',        value: parcel.weightKg ? `${parcel.weightKg} kg` : '—' },
              { label: 'Contenu',      value: parcel.description },
              { label: 'Montant',      value: parcel.priceXaf ? `${parcel.priceXaf?.toLocaleString('fr')} CAD` : '—' },
              { label: 'Livraison',    value: parcel.delivery === 'home' ? 'Domicile' : 'Retrait' },
              { label: 'Expéditeur',   value: parcel.client?.name },
            ].map(({ label, value }) => value ? (
              <div key={label}>
                <div style={{ fontSize: 10.5, color: '#9CA3AF', fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: 13, color: '#1F2937', fontWeight: 500, marginTop: 1 }}>{value}</div>
              </div>
            ) : null)}
          </div>
          {parcel.notes && (
            <div style={{ marginTop: 10, padding: '8px 10px', background: '#FFFBEB', borderRadius: 7, fontSize: 12, color: '#B45309' }}>
              📝 {parcel.notes}
            </div>
          )}
        </div>

        {/* Payment status */}
        {parcel.payment && (
          <div className="agent-card" style={{ padding: '12px 14px', marginBottom: 12, borderLeft: `3px solid ${parcel.payment.status === 'completed' ? '#10B981' : '#EF4444'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: parcel.payment.status === 'completed' ? '#047857' : '#DC2626' }}>
                {parcel.payment.status === 'completed' ? '✓ Payé' : '⚠ Paiement en attente'}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                {(parcel.payment.amount ?? 0).toLocaleString('fr')} CAD
              </span>
            </div>
            {parcel.payment.interacRef && (
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 3 }}>Réf: {parcel.payment.interacRef}</div>
            )}
          </div>
        )}

        {/* Driver assignment — always shown when drivers exist */}
        {drivers.length > 0 && (
          <div className="agent-card" style={{ padding: '14px', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                🚚 Livreur
              </div>
              {parcel.delivery === 'home'
                ? <span style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 999, background: '#EFF6FF', color: '#1B4FD8', fontWeight: 700 }}>Domicile</span>
                : <span style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 999, background: '#F4F5F7', color: '#6B7280', fontWeight: 700 }}>Retrait entrepôt</span>
              }
            </div>

            {/* Campaign status warning */}
            {DRIVER_WARNINGS[parcel.campaign?.status] && (() => {
              const w = DRIVER_WARNINGS[parcel.campaign.status];
              return (
                <div style={{
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                  padding: '8px 10px', borderRadius: 8, marginBottom: 10,
                  background: w.bg, border: `1px solid ${w.border}`,
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{w.icon}</span>
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: w.color, marginBottom: 2 }}>
                      Cargaison {parcel.campaign?.code} en cours
                    </div>
                    <div style={{ fontSize: 11, color: w.color, lineHeight: 1.4 }}>{w.msg}</div>
                    <div style={{ fontSize: 10.5, color: w.color, opacity: .75, marginTop: 3 }}>
                      Vous pouvez pré-assigner, la livraison démarrera à la libération.
                    </div>
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                value={driverId}
                onChange={e => handleDriverAssign(e.target.value)}
                disabled={savingDriver}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 9, border: '1.5px solid #E5E7EB',
                  fontSize: 14, fontFamily: 'inherit', background: 'white', outline: 'none',
                  color: driverId ? '#111827' : '#9CA3AF',
                }}
              >
                <option value="">— Aucun livreur —</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              {savingDriver && <span style={{ fontSize: 12, color: '#9CA3AF', flexShrink: 0 }}>…</span>}
            </div>
            {!driverId && !savingDriver && (
              <div style={{ marginTop: 6, fontSize: 11, color: '#9CA3AF' }}>
                Assigner un livreur bascule automatiquement en livraison à domicile.
              </div>
            )}
          </div>
        )}

        {/* Quick status buttons */}
        <div className="agent-card" style={{ padding: '14px', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Mise à jour rapide</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            {[
              { id: 'rec', label: '📥 Reçu',         color: '#0087A8' },
              { id: 'pdl', label: '✅ Prêt retrait', color: '#10B981' },
              { id: 'ok',  label: '🎉 Livré',         color: '#6B7280' },
              { id: 'ard', label: '🏭 Entrepôt dest.',color: '#1B4FD8' },
            ].map(s => (
              <button key={s.id} onClick={() => { setNewStatus(s.id); setShowStatus(false); }}
                style={{
                  padding: '10px 8px', borderRadius: 9, border: `2px solid ${newStatus === s.id ? s.color : '#E5E7EB'}`,
                  background: newStatus === s.id ? s.color + '15' : 'white',
                  color: newStatus === s.id ? s.color : '#374151',
                  fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  textAlign: 'center',
                }}>
                {s.label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowStatus(v => !v)} style={{
            background: 'none', border: '1px solid #E5E7EB', borderRadius: 8,
            padding: '7px 12px', fontSize: 12, color: '#6B7280', cursor: 'pointer', fontFamily: 'inherit', width: '100%',
          }}>
            {showStatus ? '▲ Moins de statuts' : '▼ Tous les statuts'}
          </button>

          {showStatus && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {STATUSES.map(g => (
                <div key={g.group}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.05em', padding: '6px 0 3px' }}>{g.group}</div>
                  {g.items.map(s => (
                    <button key={s.id} onClick={() => setNewStatus(s.id)} style={{
                      width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 7, border: 'none',
                      background: newStatus === s.id ? '#EFF6FF' : 'transparent',
                      color: newStatus === s.id ? '#1B4FD8' : '#374151',
                      fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: newStatus === s.id ? 700 : 400,
                    }}>
                      {s.icon} {s.label}
                      {parcel.status === s.id && <span style={{ fontSize: 10, color: '#9CA3AF', marginLeft: 6 }}>(actuel)</span>}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

          {newStatus && (
            <div style={{ marginTop: 12 }}>
              <input className="agent-input" placeholder="Note (optionnel)" value={note} onChange={e => setNote(e.target.value)} style={{ marginBottom: 8 }} />
              <input className="agent-input" placeholder="Lieu (optionnel, ex: Bureau DLA)" value={location} onChange={e => setLocation(e.target.value)} style={{ marginBottom: 10 }} />
              <button onClick={handleStatusUpdate} disabled={saving} className="agent-btn agent-btn--brand agent-btn--full">
                {saving ? 'Enregistrement…' : `Confirmer → ${STATUS_LABELS[newStatus] ?? newStatus}`}
              </button>
            </div>
          )}
        </div>

        {/* Tracking history */}
        {parcel.trackingEvents?.length > 0 && (
          <div className="agent-card" style={{ padding: '14px', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Historique</div>
            {[...parcel.trackingEvents].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((e, i) => (
              <div key={e.id ?? i} style={{ display: 'flex', gap: 10, paddingBottom: 10, borderBottom: i < parcel.trackingEvents.length - 1 ? '1px solid #F4F5F7' : 'none', marginBottom: i < parcel.trackingEvents.length - 1 ? 10 : 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[e.status] ?? '#9CA3AF', marginTop: 5, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1F2937' }}>{STATUS_LABELS[e.status] ?? e.status}</div>
                  {e.location && <div style={{ fontSize: 11.5, color: '#6B7280' }}>📍 {e.location}</div>}
                  {e.note && <div style={{ fontSize: 11.5, color: '#6B7280', fontStyle: 'italic' }}>{e.note}</div>}
                  <div style={{ fontSize: 10.5, color: '#9CA3AF', marginTop: 2 }}>
                    {new Date(e.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {e.createdBy?.name && ` · ${e.createdBy.name}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
