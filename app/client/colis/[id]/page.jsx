'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const JOURNEY = [
  { key: 'en_attente', label: 'Réservé',         icon: '📝', desc: 'Votre envoi a été enregistré' },
  { key: 'recu',       label: 'Pris en charge',  icon: '✅', desc: 'Jumla a réceptionné votre colis' },
  { key: 'en_transit', label: 'En transit',       icon: '✈️', desc: 'Votre colis est en route' },
  { key: 'en_douane',  label: 'En douane',        icon: '🛃', desc: 'Passage en douane en cours' },
  { key: 'arrive',     label: 'Arrivé',           icon: '📦', desc: 'Votre colis est arrivé à destination' },
  { key: 'livre',      label: 'Livré',            icon: '🎉', desc: 'Colis remis au destinataire' },
];

function fmt(date, opts) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', opts ?? { day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtFull(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}

function Section({ title, children, badge }) {
  return (
    <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid #f3f4f6',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#374151', textTransform: 'uppercase', letterSpacing: '.06em' }}>{title}</span>
        {badge}
      </div>
      <div style={{ padding: '14px 16px' }}>{children}</div>
    </div>
  );
}

export default function ParcelDetailPage({ params }) {
  const router = useRouter();
  const [parcel,       setParcel]       = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [editing,      setEditing]      = useState(false);
  const [editForm,     setEditForm]     = useState({});
  const [saving,       setSaving]       = useState(false);
  const [blConfirm,    setBlConfirm]    = useState({});
  const [contact,      setContact]      = useState({ whatsapp: '', companyName: 'Jumla Shipping' });

  useEffect(() => {
    fetch('/api/me/parcels/' + params.id)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => { setParcel(d); setLoading(false); })
      .catch(() => { setError('Colis introuvable ou accès refusé.'); setLoading(false); });
    fetch('/api/public/contact').then(r => r.json()).then(setContact).catch(() => {});
  }, [params.id]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
      <div style={{ width: 36, height: 36, border: '3px solid #F5A524', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ fontSize: 13, color: '#6b7280' }}>Chargement…</div>
    </div>
  );

  if (error || !parcel) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 16 }}>{error || 'Colis introuvable'}</div>
      <button onClick={() => router.push('/client/dashboard')} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
        ← Mes colis
      </button>
    </div>
  );

  const currentStep = JOURNEY.findIndex(s => s.key === parcel.status);
  const s           = JOURNEY[currentStep] ?? JOURNEY[0];
  const paid        = parcel.payment?.status === 'completed';
  const partial     = parcel.payment?.status === 'partial';
  const canEdit     = ['en_attente', 'recu'].includes(parcel.status);
  const unconfirmedBl = parcel.bordereaux?.filter(b => b.status === 'valide' && !b.clientConfirmed) ?? [];

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch('/api/me/parcels/' + parcel.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    const json = await res.json();
    setSaving(false);
    if (res.ok) { setParcel(p => ({ ...p, ...json.parcel })); setEditing(false); }
  };

  const confirmBl = async (blId) => {
    setBlConfirm(c => ({ ...c, [blId]: { ...c[blId], confirming: true } }));
    const res = await fetch('/api/me/bordereau/' + blId, { method: 'PATCH' });
    if (res.ok) {
      setBlConfirm(c => ({ ...c, [blId]: { checked: true, confirming: false, done: true } }));
      setParcel(p => ({
        ...p,
        bordereaux: p.bordereaux.map(b => b.id === blId ? { ...b, clientConfirmed: true } : b),
      }));
    } else {
      setBlConfirm(c => ({ ...c, [blId]: { ...c[blId], confirming: false } }));
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      {/* Back */}
      <button onClick={() => router.push('/client/dashboard')} style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16,
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        color: '#6b7280', fontSize: 13.5, fontWeight: 500,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m5 5-5-5 5-5" /></svg>
        Mes colis
      </button>

      {/* Hero status card */}
      <div style={{
        background: `linear-gradient(135deg, ${s.icon === '🎉' ? '#dcfce7, #bbf7d0' : '#f0f9ff, #e0f2fe'})`,
        border: `1.5px solid ${s.icon === '🎉' ? '#86efac' : '#bae6fd'}`,
        borderRadius: 16, padding: '20px', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 32, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 13, color: '#4b5563' }}>{s.desc}</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 4 }}>
              {parcel.trackingCode}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              {parcel.campaign?.from} → {parcel.campaign?.to}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>
              {parcel.campaign?.code}
            </div>
          </div>
        </div>

        {/* Journey stepper */}
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', overflowX: 'auto', paddingBottom: 4 }}>
          {JOURNEY.map((step, i) => {
            const done    = i <= currentStep;
            const current = i === currentStep;
            return (
              <div key={step.key} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: current ? 34 : 28, height: current ? 34 : 28,
                    borderRadius: '50%', display: 'grid', placeItems: 'center',
                    background: done ? (current ? 'white' : 'rgba(255,255,255,.6)') : 'rgba(255,255,255,.3)',
                    fontSize: current ? 18 : 14,
                    border: current ? '2.5px solid rgba(0,0,0,.15)' : '1px solid rgba(255,255,255,.5)',
                    boxShadow: current ? '0 2px 8px rgba(0,0,0,.1)' : 'none',
                  }}>
                    {done ? step.icon : '○'}
                  </div>
                  <span style={{ fontSize: 9, fontWeight: current ? 700 : 400, color: done ? '#374151' : '#9ca3af', textAlign: 'center', maxWidth: 44, lineHeight: 1.2 }}>
                    {step.label}
                  </span>
                </div>
                {i < JOURNEY.length - 1 && (
                  <div style={{ width: 20, height: 2, background: i < currentStep ? '#86efac' : 'rgba(255,255,255,.4)', margin: '0 2px', marginBottom: 16, flexShrink: 0 }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action required: bordereau to confirm */}
      {unconfirmedBl.map(bl => {
        const conf = blConfirm[bl.id] ?? {};
        return conf.done ? null : (
          <div key={bl.id} style={{
            marginBottom: 16, padding: '14px 16px', borderRadius: 12,
            background: '#fffbeb', border: '1.5px solid #fbbf24',
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#92400e', marginBottom: 6 }}>
              ⚠️ Bordereau {bl.code} — Confirmation requise
            </div>
            <div style={{ fontSize: 13, color: '#b45309', marginBottom: 12, lineHeight: 1.5 }}>
              Jumla a confirmé votre bordereau. Vérifiez le contenu déclaré et acceptez-le avant l&apos;expédition.
            </div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 12 }}>
              <input type="checkbox" checked={conf.checked ?? false}
                onChange={e => setBlConfirm(c => ({ ...c, [bl.id]: { ...c[bl.id], checked: e.target.checked } }))}
                style={{ marginTop: 2, width: 16, height: 16, accentColor: '#d97706', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.5 }}>
                Je confirme avoir vérifié le contenu déclaré et atteste que les informations sont exactes. Cette confirmation vaut signature électronique.
              </span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => router.push('/client/bordereau/' + bl.id)} style={{
                padding: '8px 14px', borderRadius: 8, border: '1px solid #d97706',
                background: 'white', color: '#92400e', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                Voir le bordereau
              </button>
              <button onClick={() => confirmBl(bl.id)} disabled={!conf.checked || conf.confirming} style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: conf.checked ? '#d97706' : '#e5e7eb',
                color: 'white', fontSize: 13, fontWeight: 700, cursor: conf.checked ? 'pointer' : 'not-allowed',
              }}>
                {conf.confirming ? 'Confirmation…' : 'Confirmer'}
              </button>
            </div>
          </div>
        );
      })}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Parcel info */}
        <Section title="Détails du colis" badge={
          canEdit && !editing ? (
            <button onClick={() => { setEditing(true); setEditForm({ description: parcel.description ?? '', weightKg: parcel.weightKg ?? '' }); }} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', color: '#374151', fontWeight: 600 }}>
              ✏️ Modifier
            </button>
          ) : null
        }>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Description</label>
                <input className="input" value={editForm.description ?? ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} placeholder="Vêtements, électronique…" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Poids estimé (kg)</label>
                <input className="input" type="number" step="0.1" value={editForm.weightKg ?? ''} onChange={e => setEditForm(f => ({ ...f, weightKg: e.target.value }))} placeholder="5.0" />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEditing(false)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Annuler</button>
                <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: '#F5A524', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                  {saving ? 'Enregistrement…' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { l: 'Description',   v: parcel.description || '—' },
                { l: 'Poids',         v: parcel.weightKg ? `${parcel.weightKg} kg` : '—' },
                { l: 'Départ prévu',  v: fmt(parcel.campaign?.departureDate) },
                { l: 'Arrivée prévu', v: fmt(parcel.campaign?.arrivalDate) },
              ].map(({ l, v }) => (
                <div key={l}>
                  <div style={{ fontSize: 10.5, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{v}</div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Payment */}
        <Section title="Paiement" badge={
          <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: paid ? '#dcfce7' : partial ? '#fef3c7' : '#fee2e2', color: paid ? '#16a34a' : partial ? '#92400e' : '#dc2626' }}>
            {paid ? '✓ Payé' : partial ? 'Partiel' : 'En attente'}
          </span>
        }>
          {parcel.payment ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#6b7280' }}>Montant total</span>
                <span style={{ fontWeight: 700, fontSize: 15, fontFamily: 'monospace' }}>{parcel.payment.amount.toLocaleString('fr')} CAD</span>
              </div>
              {(partial || !paid) && parcel.payment.allocated > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>Déjà reçu</span>
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#16a34a', fontFamily: 'monospace' }}>
                    {parcel.payment.allocated.toLocaleString('fr')} CAD
                  </span>
                </div>
              )}
              {!paid && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>Reste à régler</span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#dc2626', fontFamily: 'monospace' }}>
                    {parcel.payment.remaining.toLocaleString('fr')} CAD
                  </span>
                </div>
              )}
              {paid && parcel.payment.paidAt && (
                <div style={{ fontSize: 12.5, color: '#6b7280' }}>Payé le {fmt(parcel.payment.paidAt)}</div>
              )}
              {!paid && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef3c7', border: '1px solid #fde68a', fontSize: 12.5, color: '#92400e', marginTop: 8 }}>
                  💸 Envoyez <strong>{parcel.payment.remaining.toLocaleString('fr')} CAD</strong> par Virement Interac.
                  Indiquez <strong>{parcel.trackingCode}</strong> comme référence.
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>Aucune facture générée pour l&apos;instant.</div>
          )}
        </Section>

        {/* Bordereaux */}
        {parcel.bordereaux?.length > 0 && (
          <Section title="Bordereaux">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {parcel.bordereaux.map(bl => {
                const conf = blConfirm[bl.id];
                const confirmed = bl.clientConfirmed || conf?.done;
                const statusColors = { valide: '#16a34a', en_attente: '#6b7280', discordance: '#dc2626' };
                return (
                  <div key={bl.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 9, border: '1px solid #e5e7eb', background: '#f9fafb',
                  }}>
                    <div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#111827' }}>{bl.code}</div>
                      <div style={{ fontSize: 11.5, color: statusColors[bl.status] ?? '#6b7280', marginTop: 1, fontWeight: 600 }}>
                        {bl.status === 'valide' ? '✓ Confirmé par Jumla' : bl.status === 'discordance' ? '⚠️ Discordance' : '⏳ En attente'}
                        {confirmed && ' · ✅ Signé par vous'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => router.push('/client/bordereau/' + bl.id)} style={{
                        padding: '6px 12px', borderRadius: 7, border: '1px solid #d1d5db',
                        background: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#374151',
                      }}>Voir</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Tracking timeline */}
        <Section title="Historique de suivi">
          {parcel.tracking.length === 0 ? (
            <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>
              Aucun événement enregistré pour l&apos;instant.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {parcel.tracking.map((e, i, arr) => {
                const step    = JOURNEY.find(st => st.key === e.status) ?? { icon: '•', label: e.status, desc: '' };
                const isLast  = i === arr.length - 1;
                return (
                  <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: isLast ? 0 : 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: isLast ? 36 : 30, height: isLast ? 36 : 30,
                        borderRadius: '50%',
                        background: isLast ? '#f0fdf4' : '#f9fafb',
                        border: `2px solid ${isLast ? '#86efac' : '#e5e7eb'}`,
                        display: 'grid', placeItems: 'center', fontSize: isLast ? 18 : 14, flexShrink: 0,
                        boxShadow: isLast ? '0 0 0 3px #dcfce7' : 'none',
                      }}>
                        {step.icon}
                      </div>
                      {!isLast && <div style={{ width: 2, flex: 1, background: '#e5e7eb', marginTop: 4, minHeight: 16 }} />}
                    </div>
                    <div style={{ paddingTop: isLast ? 6 : 3, paddingBottom: isLast ? 0 : 4 }}>
                      <div style={{ fontWeight: isLast ? 700 : 500, fontSize: isLast ? 14 : 13, color: isLast ? '#111827' : '#374151', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {step.label}
                        {isLast && <span style={{ fontSize: 10, background: '#16a34a', color: 'white', padding: '1px 7px', borderRadius: 99, fontWeight: 700 }}>ACTUEL</span>}
                      </div>
                      {e.location && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>📍 {e.location}</div>}
                      {e.note     && <div style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic', marginTop: 2 }}>{e.note}</div>}
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{fmtFull(e.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Contact */}
        <div style={{ background: 'white', borderRadius: 14, padding: '16px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>Une question sur votre colis ?</div>
          {contact.whatsapp ? (
            <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 10, textDecoration: 'none',
              background: '#25D366', color: 'white', fontWeight: 700, fontSize: 14,
            }}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.5 14.4c-.3-.1-1.7-.9-2-1s-.5-.1-.7.1c-.2.3-.7 1-.9 1.1-.2.2-.3.2-.6 0-.3-.1-1.2-.5-2.3-1.4-.8-.7-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5 0-.2 0-.4-.1-.5 0-.1-.7-1.6-1-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.4-.3.3-1 1-1 2.4s1 2.8 1.2 3.1c.2.2 2 3 4.8 4.3.7.3 1.2.4 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.3.3-.7.3-1.2.2-1.3-.1-.2-.3-.3-.6-.4zM12 21a9 9 0 0 1-4.6-1.3L3 21l1.3-4.3A9 9 0 1 1 12 21z" /></svg>
              Contacter {contact.companyName} sur WhatsApp
            </a>
          ) : (
            <div style={{ fontSize: 13, color: '#9ca3af' }}>Contactez-nous via le formulaire ou par email.</div>
          )}
        </div>

        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}
