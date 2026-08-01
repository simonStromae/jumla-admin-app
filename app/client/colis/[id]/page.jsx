'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useT, useLocale } from '@/src/lib/i18n';

const PRODUCT_TYPES = [
  { id: 'standard',     labelKey: 'productTypes.standard' },
  { id: 'vetements',    labelKey: 'productTypes.vetements' },
  { id: 'cosmetique',   labelKey: 'productTypes.cosmetique' },
  { id: 'alimentaire',  labelKey: 'productTypes.alimentaire' },
  { id: 'biere',        labelKey: 'productTypes.biere' },
  { id: 'manioc_huile', labelKey: 'productTypes.manioc' },
  { id: 'electronique', labelKey: 'productTypes.electronique' },
  { id: 'documents',    labelKey: 'productTypes.documents' },
];

const JOURNEY_KEYS = ['enr','rec','pre','exp','tra','apd','dou','ins','ret','lib','ard','ver','pdl','liv','ok'];

const JOURNEY_ICONS = { enr:'📝',rec:'📥',pre:'🔍',exp:'🚀',tra:'✈️',apd:'🛬',dou:'🛃',ins:'🔎',ret:'⚠️',lib:'✅',ard:'🏭',ver:'🔬',pdl:'📦',liv:'🚚',ok:'🎉' };

function InfoCell({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{value || '—'}</div>
    </div>
  );
}

function Section({ title, children, badge, col }) {
  return (
    <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', border: '1px solid #e5e7eb', gridColumn: col }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: 11.5, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.07em' }}>{title}</span>
        {badge}
      </div>
      <div style={{ padding: '14px 16px' }}>{children}</div>
    </div>
  );
}

function NumInput({ label, value, onChange }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 3 }}>{label}</label>
      <input type="number" min="0" value={value ?? 0}
        onChange={e => onChange(parseInt(e.target.value) || 0)}
        style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #d1d5db', borderRadius: 7, fontSize: 13, fontWeight: 600 }} />
    </div>
  );
}

export default function ParcelDetailPage({ params }) {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const [parcel,    setParcel]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [paymentEmail, setPaymentEmail] = useState('incjumla@gmail.com');
  const [editing,   setEditing]   = useState(false);
  const [editForm,  setEditForm]  = useState({});
  const [saving,    setSaving]    = useState(false);
  const [saveErr,   setSaveErr]   = useState('');
  const [blConfirm,    setBlConfirm]    = useState({});
  const [showCancel,        setShowCancel]        = useState(false);
  const [cancelling,        setCancelling]        = useState(false);
  const [cancelError,       setCancelError]       = useState('');
  const [cancelReason,      setCancelReason]      = useState('');
  const [cancelCustom,      setCancelCustom]      = useState('');

  const fmt = (date, opts) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-CA', opts ?? { day: 'numeric', month: 'long', year: 'numeric' });
  };
  const fmtFull = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-CA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  };

  const ptLabel = (id) => {
    const pt = PRODUCT_TYPES.find(p => p.id === id);
    if (!pt) return id;
    const key = pt.labelKey;
    const v = t(key);
    return v === key ? (locale === 'fr' ? productTypesFR[id] : productTypesEN[id]) || id : v;
  };

  useEffect(() => {
    fetch('/api/public/config').then(r => r.json()).then(d => {
      if (d.paymentEmail) setPaymentEmail(d.paymentEmail);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/me/parcels/' + params.id)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => { setParcel(d); setLoading(false); })
      .catch(() => { setError(t('error.notFound') + ' — ' + t('error.network').split(' — ')[1] || 'Accès refusé.'); setLoading(false); });
  }, [params.id]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--brand-400)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ fontSize: 13, color: '#6b7280' }}>{t('loading')}</div>
    </div>
  );

  if (error || !parcel) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 16 }}>{error || t('error.notFound')}</div>
      <button onClick={() => router.push('/client/dashboard')} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
        ← {t('parcel.back')}
      </button>
    </div>
  );

  const currentStep   = JOURNEY_KEYS.findIndex(k => k === parcel.status);
  const visibleTracking = parcel.tracking.filter(e => {
    const pos = JOURNEY_KEYS.findIndex(k => k === e.status);
    return pos === -1 || pos <= currentStep;
  });
  const journeyIcon   = JOURNEY_ICONS[parcel.status] ?? '📦';
  const journeyLabel  = t('statuses.' + parcel.status) || parcel.status;
  const journeyDesc   = t('journey.' + parcel.status) || '';
  const paid          = parcel.payment?.status === 'completed';
  const partial       = parcel.payment?.status === 'partial';
  const canEdit       = ['enr', 'rec'].includes(parcel.status);
  const unconfirmedBl = parcel.bordereaux?.filter(b => !b.clientConfirmed) ?? [];

  const startEdit = () => {
    setEditForm({
      description:       parcel.description ?? '',
      weightKg:          parcel.weightKg ?? '',
      notes:             parcel.notes ?? '',
      productType:       parcel.productType ?? 'standard',
      nbCartons:         parcel.nbCartons ?? 0,
      nbPetitsSacs:      parcel.nbPetitsSacs ?? 0,
      nbSacsMoyens:      parcel.nbSacsMoyens ?? 0,
      nbGrandsSacs:      parcel.nbGrandsSacs ?? 0,
      nbPlastiques:      parcel.nbPlastiques ?? 0,
      nbPlastiquesBiere: parcel.nbPlastiquesBiere ?? 0,
      nbCasiers24x65:    parcel.nbCasiers24x65 ?? 0,
      nbCasiers24x33:    parcel.nbCasiers24x33 ?? 0,
      nbCasiers12x50:    parcel.nbCasiers12x50 ?? 0,
      items:             Array.isArray(parcel.items) ? parcel.items.map(i => ({ ...i, _id: Math.random() })) : [],
    });
    setSaveErr('');
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true); setSaveErr('');
    const payload = { ...editForm };
    delete payload.items;
    if (editForm.items?.length) payload.items = editForm.items.map(({ _id, ...i }) => i);
    const res = await fetch('/api/me/parcels/' + parcel.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSaving(false);
    if (res.ok) {
      setParcel(p => ({ ...p, ...json.parcel, ...payload }));
      setEditing(false);
    } else {
      setSaveErr(json.error || t('error.network'));
    }
  };

  const confirmBl = async (blId) => {
    setBlConfirm(c => ({ ...c, [blId]: { ...c[blId], confirming: true, error: null } }));
    try {
      const res  = await fetch('/api/me/bordereau/' + blId, { method: 'PATCH' });
      const json = await res.json();
      if (res.ok) {
        setBlConfirm(c => ({ ...c, [blId]: { checked: true, confirming: false, done: true } }));
        setParcel(p => ({ ...p, bordereaux: p.bordereaux.map(b => b.id === blId ? { ...b, clientConfirmed: true } : b) }));
      } else {
        setBlConfirm(c => ({ ...c, [blId]: { ...c[blId], confirming: false, error: json.error || t('error.network') } }));
      }
    } catch {
      setBlConfirm(c => ({ ...c, [blId]: { ...c[blId], confirming: false, error: t('error.network') } }));
    }
  };

  const addItem  = () => setEditForm(f => ({ ...f, items: [...(f.items || []), { _id: Math.random(), cat: 'standard', description: '', pieces: 1, weightKg: '' }] }));
  const delItem  = (_id) => setEditForm(f => ({ ...f, items: f.items.filter(i => i._id !== _id) }));
  const updItem  = (_id, k, v) => setEditForm(f => ({ ...f, items: f.items.map(i => i._id === _id ? { ...i, [k]: v } : i) }));

  const packagingFields = [
    { key: 'nbCartons',         label: 'Cartons' },
    { key: 'nbPetitsSacs',      label: locale === 'fr' ? 'Petits sacs' : 'Small bags' },
    { key: 'nbSacsMoyens',      label: locale === 'fr' ? 'Sacs moyens' : 'Medium bags' },
    { key: 'nbGrandsSacs',      label: locale === 'fr' ? 'Grands sacs' : 'Large bags' },
    { key: 'nbPlastiques',      label: locale === 'fr' ? 'Plastiques' : 'Plastics' },
    { key: 'nbPlastiquesBiere', label: locale === 'fr' ? 'Plastiques bière' : 'Beer plastics' },
    { key: 'nbCasiers24x65',    label: 'Casiers 24×65' },
    { key: 'nbCasiers24x33',    label: 'Casiers 24×33' },
    { key: 'nbCasiers12x50',    label: 'Casiers 12×50' },
  ];

  const deliveryLabel = parcel.delivery === 'home'
    ? t('parcel.delivery.home')
    : parcel.delivery === 'ship'
    ? t('parcel.delivery.ship')
    : t('parcel.delivery.warehouse');

  return (
    <div>
      {/* Back */}
      <button onClick={() => router.push('/client/dashboard')} style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16,
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        color: '#6b7280', fontSize: 13.5, fontWeight: 500,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m5 5-5-5 5-5" /></svg>
        {t('parcel.back')}
      </button>

      {/* Hero status card */}
      <div style={{
        background: 'white', border: '1px solid #e5e7eb',
        borderLeft: `4px solid ${parcel.status === 'ok' ? 'var(--ok-500)' : 'var(--brand-400)'}`,
        borderRadius: 16, padding: '20px', marginBottom: 20,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, flexShrink: 0,
            background: parcel.status === 'ok' ? 'var(--ok-100)' : 'var(--brand-50)',
            display: 'grid', placeItems: 'center', fontSize: 22,
          }}>{journeyIcon}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 2 }}>{journeyLabel}</div>
            <div style={{ fontSize: 12.5, color: '#6b7280' }}>{journeyDesc}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 3 }}>{parcel.trackingCode}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{parcel.campaign?.from} → {parcel.campaign?.to}</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{parcel.campaign?.code}</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
            {locale === 'fr' ? 'Créé le ' : 'Created '}{fmt(parcel.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          <button
              onClick={() => router.push('/client/colis/' + parcel.id + '/labels')}
              style={{
                marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 7,
                border: '1px solid #d1d5db', background: 'white',
                fontSize: 11.5, fontWeight: 600, color: '#374151', cursor: 'pointer',
              }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              {locale === 'fr' ? 'Étiquettes' : 'Labels'}
            </button>
            {parcel.status === 'enr' && !parcel.payment && (
              <button
                onClick={() => { setCancelError(''); setShowCancel(true); }}
                style={{
                  marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 7,
                  border: '1px solid #fca5a5', background: '#fff1f2',
                  fontSize: 11.5, fontWeight: 600, color: '#dc2626', cursor: 'pointer',
                }}>
                ✕ {locale === 'fr' ? 'Annuler réservation' : 'Cancel booking'}
              </button>
            )}
        </div>
      </div>

      {/* Unconfirmed bordereaux */}
      {unconfirmedBl.map(bl => {
        const conf = blConfirm[bl.id] ?? {};
        return conf.done ? null : (
          <div key={bl.id} style={{ marginBottom: 16, padding: '14px 16px', borderRadius: 12, background: 'var(--bad-50)', border: '1.5px solid var(--bad-100)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--bad-700)', marginBottom: 6 }}>
              {t('parcel.bordereau.confirmRequired').replace('{code}', bl.code)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--bad-600)', marginBottom: 12, lineHeight: 1.5 }}>
              {t('parcel.bordereau.confirmDesc')}
            </div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 12 }}>
              <input type="checkbox" checked={conf.checked ?? false}
                onChange={e => setBlConfirm(c => ({ ...c, [bl.id]: { ...c[bl.id], checked: e.target.checked } }))}
                style={{ marginTop: 2, width: 16, height: 16, accentColor: 'var(--brand-500)', cursor: 'pointer' }} />
              <span style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.5 }}>
                {t('parcel.bordereau.confirmCheck')}
              </span>
            </label>
            {conf.error && (
              <div style={{ marginBottom: 10, padding: '7px 12px', background: '#fee2e2', borderRadius: 7, fontSize: 12.5, color: '#dc2626', fontWeight: 600 }}>
                ✕ {conf.error}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => router.push('/client/bordereau/' + bl.id)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'white', color: 'var(--ink-700)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {t('parcel.bordereau.view')}
              </button>
              <button onClick={() => confirmBl(bl.id)} disabled={!conf.checked || conf.confirming} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: conf.checked ? 'var(--brand-500)' : '#e5e7eb', color: 'white', fontSize: 13, fontWeight: 700, cursor: conf.checked ? 'pointer' : 'not-allowed' }}>
                {conf.confirming ? t('parcel.bordereau.confirming') : t('parcel.bordereau.confirm')}
              </button>
            </div>
          </div>
        );
      })}

      {/* Grid layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 14 }}>

        {/* Parcel details + edit */}
        <Section title={t('parcel.details')} col="1 / -1" badge={
          canEdit && !editing ? (
            <button onClick={startEdit} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', color: '#374151', fontWeight: 600 }}>
              {t('parcel.edit')}
            </button>
          ) : editing ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setEditing(false)} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', color: '#374151', fontWeight: 600 }}>{t('parcel.cancel')}</button>
              <button onClick={handleSave} disabled={saving} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, border: 'none', background: 'var(--brand-500)', color: 'white', cursor: 'pointer', fontWeight: 700 }}>
                {saving ? t('parcel.saving') : t('parcel.save')}
              </button>
            </div>
          ) : null
        }>
          {saveErr && <div style={{ marginBottom: 12, padding: '8px 12px', background: '#fee2e2', color: '#dc2626', borderRadius: 7, fontSize: 12.5 }}>{saveErr}</div>}

          {!editing ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 14 }}>
                <InfoCell label={t('parcel.info.description')} value={parcel.description} />
                <InfoCell label={t('parcel.info.weight')}      value={parcel.weightKg ? `${parcel.weightKg} kg` : null} />
                <InfoCell label={t('parcel.info.type')}        value={ptLabel(parcel.productType)} />
                <InfoCell label={t('parcel.info.price')}       value={parcel.priceXaf ? `${parcel.priceXaf.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-CA')} CAD` : null} />
                <InfoCell label={t('parcel.info.departurePlanned')} value={fmt(parcel.campaign?.departureDate)} />
                <InfoCell label={t('parcel.info.arrivalPlanned')}   value={fmt(parcel.campaign?.arrivalDate)} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#9ca3af', marginBottom: 8 }}>{t('parcel.info.recipient')}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                  <InfoCell label={t('parcel.info.mode')} value={deliveryLabel} />
                  {parcel.recipName  && <InfoCell label={t('parcel.info.name')}  value={parcel.recipName} />}
                  {parcel.recipPhone && <InfoCell label={t('parcel.info.phone')} value={parcel.recipPhone} />}
                  {parcel.recipCity  && <InfoCell label={t('parcel.info.city')}  value={parcel.recipCity} />}
                </div>
              </div>

              {packagingFields.some(f => (parcel[f.key] ?? 0) > 0) && (
                <>
                  <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#9ca3af', marginBottom: 8 }}>{t('parcel.info.packaging')}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                    {packagingFields.filter(f => (parcel[f.key] ?? 0) > 0).map(f => (
                      <span key={f.key} style={{ padding: '4px 10px', borderRadius: 99, background: '#f3f4f6', fontSize: 12.5, fontWeight: 600, color: '#374151' }}>
                        {f.label} × {parcel[f.key]}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {Array.isArray(parcel.items) && parcel.items.length > 0 && (
                <>
                  <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#9ca3af', marginBottom: 8 }}>{t('parcel.info.items')}</div>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px', gap: 0, padding: '7px 12px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 10.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6b7280' }}>
                      <div>{t('parcel.info.description')} / {t('parcel.info.type')}</div>
                      <div>{locale === 'fr' ? 'Pièces' : 'Units'}</div>
                      <div>{locale === 'fr' ? 'Poids (kg)' : 'Weight (kg)'}</div>
                    </div>
                    {parcel.items.map((it, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px', padding: '9px 12px', borderBottom: i < parcel.items.length - 1 ? '1px solid #f3f4f6' : 'none', fontSize: 13, color: '#111827' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{it.description || it.desc || '—'}</div>
                          {(it.cat || it.productType) && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{ptLabel(it.cat || it.productType)}</div>}
                        </div>
                        <div style={{ fontWeight: 600 }}>{it.pieces ?? it.nbPieces ?? '—'}</div>
                        <div style={{ fontWeight: 600 }}>{it.kg ?? it.weightKg ?? '—'} {(it.kg || it.weightKg) ? 'kg' : ''}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {parcel.notes && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: '#fafafa', borderRadius: 8, border: '1px solid #f3f4f6' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: '#9ca3af', marginBottom: 4 }}>{t('parcel.info.notes')}</div>
                  <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{parcel.notes}</div>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>{t('parcel.info.description')}</label>
                  <input value={editForm.description ?? ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                    placeholder={t('parcel.descPlaceholder')}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>{t('parcel.info.weight')} (kg)</label>
                  <input type="number" step="0.1" value={editForm.weightKg ?? ''} onChange={e => setEditForm(f => ({ ...f, weightKg: e.target.value }))}
                    placeholder="5.0"
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13 }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>{t('parcel.info.type')}</label>
                <select value={editForm.productType ?? 'standard'} onChange={e => setEditForm(f => ({ ...f, productType: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13 }}>
                  {PRODUCT_TYPES.map(p => <option key={p.id} value={p.id}>{ptLabel(p.id)}</option>)}
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: '#6b7280' }}>{t('parcel.info.items')}</label>
                  <button onClick={addItem} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontWeight: 600 }}>{t('parcel.addItem')}</button>
                </div>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 9, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px 80px 32px', gap: 0, padding: '7px 10px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 10.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6b7280' }}>
                    <div>{t('parcel.info.description')}</div><div>{t('parcel.info.type')}</div><div>{locale === 'fr' ? 'Pièces' : 'Units'}</div><div>{locale === 'fr' ? 'Poids kg' : 'Weight kg'}</div><div></div>
                  </div>
                  {(editForm.items ?? []).map((it, idx) => (
                    <div key={it._id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px 80px 32px', gap: 0, padding: '6px 10px', borderBottom: idx < editForm.items.length - 1 ? '1px solid #f3f4f6' : 'none', alignItems: 'center', background: 'white' }}>
                      <input value={it.description ?? it.desc ?? ''} onChange={e => updItem(it._id, 'description', e.target.value)} placeholder={t('parcel.info.description') + '…'}
                        style={{ padding: '6px 8px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 12.5, marginRight: 6, width: '100%' }} />
                      <select value={it.cat ?? it.productType ?? 'standard'} onChange={e => updItem(it._id, 'cat', e.target.value)}
                        style={{ padding: '6px 6px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 12, marginRight: 6, width: '100%' }}>
                        {PRODUCT_TYPES.map(p => <option key={p.id} value={p.id}>{ptLabel(p.id)}</option>)}
                      </select>
                      <input type="number" min="1" value={it.pieces ?? 1} onChange={e => updItem(it._id, 'pieces', e.target.value)}
                        style={{ padding: '6px 8px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 12.5, marginRight: 6, width: '100%' }} />
                      <input type="number" min="0" step="0.5" value={it.kg ?? it.weightKg ?? ''} onChange={e => updItem(it._id, 'kg', e.target.value)} placeholder="0"
                        style={{ padding: '6px 8px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: 12.5, marginRight: 4, width: '100%' }} />
                      <button onClick={() => delItem(it._id)} disabled={(editForm.items?.length ?? 0) <= 1}
                        style={{ background: 'none', border: 'none', color: '#d1d5db', fontSize: 18, cursor: 'pointer', opacity: editForm.items?.length <= 1 ? .3 : 1 }}>×</button>
                    </div>
                  ))}
                  {(editForm.items ?? []).length === 0 && (
                    <div style={{ padding: '16px', textAlign: 'center', fontSize: 12.5, color: '#9ca3af' }}>{t('parcel.noItems')}</div>
                  )}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 8 }}>{t('parcel.info.packaging')}</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                  {packagingFields.map(f => (
                    <NumInput key={f.key} label={f.label} value={editForm[f.key] ?? 0}
                      onChange={v => setEditForm(ef => ({ ...ef, [f.key]: v }))} />
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>{t('parcel.info.notes')}</label>
                <textarea value={editForm.notes ?? ''} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder={t('parcel.notesPlaceholder')} rows={3}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13, resize: 'vertical' }} />
              </div>
            </div>
          )}
        </Section>

        {/* Price adjustment */}
        {parcel.confirmedPriceXaf != null && (parcel.adjustmentStatus === 'pending' || parcel.adjustmentStatus === 'discount') && (() => {
          const isPending  = parcel.adjustmentStatus === 'pending';
          const diff       = parcel.confirmedPriceXaf - (parcel.priceXaf ?? 0);
          const supplement = Math.abs(diff);
          return (
            <Section title={t('parcel.adjustment.title')} col="1 / -1" badge={
              isPending
                ? <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: 'var(--info-100)', color: 'var(--info-700)' }}>{t('parcel.adjustment.pendingBadge')}</span>
                : <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: '#dcfce7', color: '#15803d' }}>{t('parcel.adjustment.discountBadge')}</span>
            }>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px', lineHeight: 1.5 }}>
                {isPending ? t('parcel.adjustment.pendingDesc') : t('parcel.adjustment.discountDesc')}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                <div style={{ padding: '14px 16px', background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>{t('parcel.adjustment.estimate')}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: '#9ca3af', textDecoration: 'line-through' }}>{parcel.priceXaf?.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-CA') ?? '—'}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>CAD</div>
                </div>
                <div style={{ padding: '14px 16px', background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>{t('parcel.adjustment.actual')}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 800, color: '#111827' }}>{parcel.confirmedPriceXaf.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-CA')}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>CAD</div>
                </div>
                <div style={{ padding: '14px 16px', borderRadius: 12, border: isPending ? '1.5px solid var(--info-100)' : '1.5px solid #86efac', background: isPending ? 'var(--info-50)' : '#f0fdf4' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: isPending ? 'var(--info-700)' : '#15803d', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
                    {isPending ? t('parcel.adjustment.supplement') : t('parcel.adjustment.discount')}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 800, color: isPending ? 'var(--info-700)' : '#15803d' }}>
                    {isPending ? '+' : '−'}{supplement.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-CA')}
                  </div>
                  <div style={{ fontSize: 11, color: isPending ? 'var(--info-600)' : '#16a34a', marginTop: 2 }}>CAD</div>
                </div>
              </div>
              {isPending && supplement > 0 && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: 'white', border: '1px solid var(--border)', borderLeft: '3px solid var(--brand-400)', borderRadius: 10 }}>
                  <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>💸</span>
                  <div style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.6 }}>
                    {t('parcel.adjustment.interacInfo')
                      .replace('{email}', paymentEmail)
                      .replace('{amount}', supplement.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-CA'))
                      .replace('{code}', parcel.trackingCode)}
                  </div>
                </div>
              )}
            </Section>
          );
        })()}

        {/* Payment */}
        {(() => {
          const adjPending = parcel.adjustmentStatus === 'pending' && parcel.confirmedPriceXaf != null;
          const supplement = adjPending ? Math.max(0, parcel.confirmedPriceXaf - (parcel.priceXaf ?? 0)) : 0;
          const badgeLabel = paid && adjPending
            ? t('parcel.payment.status.paidAndSuppl')
            : paid ? t('parcel.payment.status.paid')
            : partial ? t('parcel.payment.status.partial')
            : t('parcel.payment.status.pending');
          const badgeColor = paid ? 'var(--ok-700)' : 'var(--bad-700)';
          const badgeBg    = paid ? 'var(--ok-100)' : 'var(--bad-100)';
          return (
            <Section title={t('parcel.payment.title')} col="1 / -1" badge={
              <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: badgeBg, color: badgeColor }}>
                {badgeLabel}
              </span>
            }>
              {parcel.payment ? (
                <div>
                  {paid && adjPending ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 13, color: '#6b7280' }}>{locale === 'fr' ? 'Facture initiale' : 'Initial invoice'}</span>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: 15, fontFamily: 'monospace', color: '#16a34a' }}>✓ {parcel.payment.amount.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-CA')} CAD</div>
                          {parcel.payment.paidAt && <div style={{ fontSize: 11, color: '#9ca3af' }}>{t('parcel.payment.paidOn').replace('{date}', fmt(parcel.payment.paidAt))}</div>}
                        </div>
                      </div>
                      {supplement > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--info-50)', border: '1.5px solid var(--info-100)', borderRadius: 9, marginBottom: 10 }}>
                          <span style={{ fontSize: 13, color: 'var(--info-700)', fontWeight: 600 }}>{t('parcel.adjustment.supplement')}</span>
                          <span style={{ fontWeight: 800, fontSize: 15, fontFamily: 'monospace', color: 'var(--info-700)' }}>+{supplement.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-CA')} CAD</span>
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>{t('parcel.adjustment.seeAbove')}</div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: '#6b7280' }}>{t('parcel.payment.total')}</span>
                        <span style={{ fontWeight: 700, fontSize: 15, fontFamily: 'monospace' }}>{parcel.payment.amount.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-CA')} CAD</span>
                      </div>
                      {(partial || !paid) && parcel.payment.allocated > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 13, color: '#6b7280' }}>{t('parcel.payment.received')}</span>
                          <span style={{ fontWeight: 600, fontSize: 14, color: '#16a34a', fontFamily: 'monospace' }}>{parcel.payment.allocated.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-CA')} CAD</span>
                        </div>
                      )}
                      {!paid && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                          <span style={{ fontSize: 13, color: '#6b7280' }}>{t('parcel.payment.remaining')}</span>
                          <span style={{ fontWeight: 700, fontSize: 15, color: '#dc2626', fontFamily: 'monospace' }}>{parcel.payment.remaining.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-CA')} CAD</span>
                        </div>
                      )}
                      {paid && parcel.payment.paidAt && (
                        <div style={{ fontSize: 12.5, color: '#6b7280' }}>{t('parcel.payment.paidOn').replace('{date}', fmt(parcel.payment.paidAt))}</div>
                      )}
                      {!paid && (
                        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--info-50)', border: '1px solid var(--info-100)', fontSize: 12.5, color: 'var(--info-700)', marginTop: 8 }}>
                          {t('parcel.payment.interac')
                            .replace('{amount}', parcel.payment.remaining.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-CA'))
                            .replace('{code}', parcel.trackingCode)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>{t('parcel.payment.none')}</div>
              )}
            </Section>
          );
        })()}

        {/* Bordereaux */}
        {parcel.bordereaux?.length > 0 && (
          <Section title={t('parcel.bordereau.title')} col="1 / -1">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {parcel.bordereaux.map(bl => {
                const conf = blConfirm[bl.id];
                const confirmed = bl.clientConfirmed || conf?.done;
                const statusColors = { valide: '#16a34a', en_attente: '#6b7280', discordance: '#dc2626' };
                const blStatusLabel = bl.status === 'valide'
                  ? t('parcel.bordereau.status.confirmed')
                  : bl.status === 'discordance'
                  ? t('parcel.bordereau.status.discordance')
                  : t('parcel.bordereau.status.pending');
                return (
                  <div key={bl.id} style={{ padding: '10px 14px', borderRadius: 9, border: '1px solid #e5e7eb', background: '#f9fafb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: bl.items?.length ? 8 : 0 }}>
                      <div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#111827' }}>{bl.code}</div>
                        <div style={{ fontSize: 11.5, color: statusColors[bl.status] ?? '#6b7280', marginTop: 1, fontWeight: 600 }}>
                          {blStatusLabel}
                          {confirmed && t('parcel.bordereau.status.signedByYou')}
                        </div>
                        {(bl.weightKg || bl.nbPieces) && (
                          <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>
                            {bl.nbPieces ? `${bl.nbPieces} ${locale === 'fr' ? 'pièce(s)' : 'unit(s)'}` : ''}
                            {bl.weightKg ? ` · ${bl.weightKg} kg` : ''}
                          </div>
                        )}
                      </div>
                      <button onClick={() => router.push('/client/bordereau/' + bl.id)} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #d1d5db', background: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>{t('parcel.bordereau.view')}</button>
                    </div>
                    {Array.isArray(bl.items) && bl.items.length > 0 && (
                      <div style={{ border: '1px solid #e5e7eb', borderRadius: 7, overflow: 'hidden', fontSize: 12 }}>
                        {bl.items.map((it, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderBottom: i < bl.items.length - 1 ? '1px solid #f3f4f6' : 'none', background: 'white' }}>
                            <span style={{ color: '#374151', fontWeight: 500 }}>{it.description || it.label || '—'}</span>
                            <span style={{ color: '#9ca3af' }}>{it.pieces ?? it.nbPieces ?? ''}{(it.pieces || it.nbPieces) ? ` ${locale === 'fr' ? 'pcs' : 'units'}` : ''} {it.weightKg ? `· ${it.weightKg} kg` : ''}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Timeline */}
        <Section title={t('parcel.timeline')} col="1 / -1">
          {visibleTracking.length === 0 ? (
            <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>
              {t('parcel.noEvents')}
            </div>
          ) : (
            <div>
              {visibleTracking.map((e, i, arr) => {
                const icon  = JOURNEY_ICONS[e.status] ?? '📦';
                const label = t('statuses.' + e.status) || e.status;
                const isLast = i === arr.length - 1;
                return (
                  <div key={i} style={{ display: 'flex', gap: 14, position: 'relative', paddingBottom: isLast ? 0 : 20 }}>
                    {!isLast && (
                      <div style={{ position: 'absolute', left: 16, top: 34, bottom: 0, width: 1.5, background: '#e5e7eb' }} />
                    )}
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      background: isLast ? 'var(--brand-50)' : '#f9fafb',
                      border: `2px solid ${isLast ? 'var(--brand-400)' : '#e5e7eb'}`,
                      display: 'grid', placeItems: 'center',
                      fontSize: isLast ? 17 : 14,
                      boxShadow: isLast ? '0 0 0 3px var(--brand-50)' : 'none',
                    }}>
                      {isLast ? icon : '✓'}
                    </div>
                    <div style={{ flex: 1, paddingTop: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontWeight: isLast ? 700 : 500, fontSize: isLast ? 14 : 13, color: isLast ? '#111827' : '#374151' }}>
                          {label}
                        </span>
                        {isLast && (
                          <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--brand-500)', color: 'white', padding: '1px 7px', borderRadius: 3, letterSpacing: '.04em' }}>
                            {t('parcel.statusCurrent')}
                          </span>
                        )}
                      </div>
                      {e.location && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>📍 {e.location}</div>}
                      {e.note     && <div style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic', marginTop: 1 }}>{e.note}</div>}
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
                        {e.createdBy ? `${e.createdBy} · ` : ''}{fmtFull(e.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      {/* Annulation modal */}
      {showCancel && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 18, width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,.22)', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 4 }}>
                Annuler ma réservation
              </div>
              <div style={{ fontSize: 12.5, color: '#9ca3af', fontFamily: 'monospace' }}>{parcel.trackingCode}</div>
            </div>

            <div style={{ padding: '16px 22px 20px' }}>
              {/* Reason question */}
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>
                Pourquoi souhaitez-vous annuler ?
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {[
                  { key: 'price',         label: 'Prix trop élevé' },
                  { key: 'date_change',   label: 'Changement de date de départ' },
                  { key: 'parcel_issue',  label: 'Problème avec mon colis' },
                  { key: 'other_service', label: "J'utilise un autre transporteur" },
                  { key: 'other',         label: 'Autre raison' },
                ].map(opt => (
                  <label key={opt.key} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 9, cursor: 'pointer',
                    border: `1.5px solid ${cancelReason === opt.key ? '#fca5a5' : '#e5e7eb'}`,
                    background: cancelReason === opt.key ? '#fff1f2' : 'white',
                    transition: 'all .12s',
                  }}>
                    <input
                      type="radio"
                      name="cancelReason"
                      value={opt.key}
                      checked={cancelReason === opt.key}
                      onChange={() => setCancelReason(opt.key)}
                      style={{ accentColor: '#dc2626', width: 16, height: 16, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{opt.label}</span>
                  </label>
                ))}
              </div>

              {/* Custom reason text when "Autre" selected */}
              {cancelReason === 'other' && (
                <textarea
                  value={cancelCustom}
                  onChange={e => setCancelCustom(e.target.value)}
                  placeholder="Précisez votre raison…"
                  rows={2}
                  style={{
                    width: '100%', padding: '9px 12px', marginBottom: 14,
                    border: '1.5px solid #e5e7eb', borderRadius: 8,
                    fontFamily: 'inherit', fontSize: 13, resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              )}

              {cancelError && (
                <div style={{ padding: '8px 12px', background: '#fee2e2', borderRadius: 7, fontSize: 12.5, color: '#dc2626', marginBottom: 12 }}>
                  {cancelError}
                </div>
              )}

              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fff7ed', border: '1px solid #fed7aa', fontSize: 12, color: '#92400e', marginBottom: 16, lineHeight: 1.5 }}>
                ⚠️ Cette action est définitive. Le colis sera supprimé de votre espace.
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setShowCancel(false); setCancelReason(''); setCancelCustom(''); setCancelError(''); }}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 9, border: '1px solid #d1d5db', background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}
                >
                  Retour
                </button>
                <button
                  disabled={!cancelReason || (cancelReason === 'other' && !cancelCustom.trim()) || cancelling}
                  onClick={async () => {
                    setCancelling(true);
                    setCancelError('');
                    const reason = cancelReason === 'other'
                      ? `other: ${cancelCustom.trim()}`
                      : cancelReason;
                    const res = await fetch('/api/me/parcels/' + parcel.id, {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ reason }),
                    });
                    const json = await res.json();
                    setCancelling(false);
                    if (res.ok) {
                      router.push('/client/dashboard');
                    } else {
                      setCancelError(json.error || 'Erreur, veuillez réessayer.');
                    }
                  }}
                  style={{
                    flex: 2, padding: '10px 14px', borderRadius: 9, border: 'none',
                    background: (!cancelReason || (cancelReason === 'other' && !cancelCustom.trim()) || cancelling)
                      ? '#e5e7eb' : '#dc2626',
                    color: (!cancelReason || (cancelReason === 'other' && !cancelCustom.trim())) ? '#9ca3af' : 'white',
                    fontSize: 13, fontWeight: 700,
                    cursor: (!cancelReason || (cancelReason === 'other' && !cancelCustom.trim()) || cancelling) ? 'not-allowed' : 'pointer',
                    transition: 'background .15s',
                  }}
                >
                  {cancelling ? 'Annulation…' : 'Confirmer l\'annulation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Fallback labels for product types (if t() key not found)
const productTypesFR = { standard:'Standard', vetements:'Vêtements / Chaussures / Sacs', cosmetique:'Cosmétiques / Compléments', alimentaire:'Alimentaire / Épices', biere:'Bière', manioc_huile:'Bâton de manioc / Huile rouge', electronique:'Électronique', documents:'Documents' };
const productTypesEN = { standard:'Standard', vetements:'Clothing / Shoes / Bags', cosmetique:'Cosmetics / Supplements', alimentaire:'Food / Spices', biere:'Beer', manioc_huile:'Manioc / Palm oil', electronique:'Electronics', documents:'Documents' };
