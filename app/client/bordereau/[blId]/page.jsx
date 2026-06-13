'use client';
import { useState, useEffect } from 'react';

const PRODUCT_TYPES = {
  standard:     'Standard',
  vetements:    'Vêtements',
  cosmetique:   'Cosmétiques',
  alimentaire:  'Alimentaire',
  biere:        'Bière',
  manioc_huile: 'Manioc / Huile',
  electronique: 'Électronique',
  documents:    'Documents',
};

function fmt(date, opts) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', opts ?? { day: 'numeric', month: 'long', year: 'numeric' });
}

const TH = ({ children, left, w }) => (
  <th style={{
    padding: '8px 12px', textAlign: left ? 'left' : 'center',
    fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em',
    color: '#6b7280', border: '1px solid #e5e7eb', background: '#f9fafb',
    whiteSpace: 'nowrap', width: w,
  }}>{children}</th>
);

const TD = ({ children, center, mono, bold, muted }) => (
  <td style={{
    padding: '9px 12px', border: '1px solid #e5e7eb',
    color: muted ? '#9ca3af' : '#111827', fontSize: 13,
    fontFamily: mono ? 'monospace' : 'inherit',
    fontWeight: bold ? 700 : 400,
    textAlign: center ? 'center' : 'left',
  }}>{children ?? '—'}</td>
);

export default function BordereauPage({ params }) {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [checked,    setChecked]    = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed,  setConfirmed]  = useState(false);

  useEffect(() => {
    fetch('/api/me/bordereau/' + params.blId)
      .then(r => r.json())
      .then(json => {
        if (json.error) setError(json.error);
        else { setData(json); if (json.clientConfirmed) setConfirmed(true); }
        setLoading(false);
      })
      .catch(() => { setError('Erreur réseau'); setLoading(false); });
  }, [params.blId]);

  const handleConfirm = async () => {
    if (!checked || confirming) return;
    setConfirming(true);
    try {
      const res  = await fetch('/api/me/bordereau/' + params.blId, { method: 'PATCH' });
      const json = await res.json();
      if (!res.ok) alert(json.error || 'Erreur');
      else setConfirmed(true);
    } catch { alert('Erreur réseau'); }
    setConfirming(false);
  };

  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: '#6b7280', fontFamily: 'system-ui' }}>Chargement…</div>;
  if (error || !data) return <div style={{ padding: 80, textAlign: 'center', color: '#dc2626', fontFamily: 'system-ui' }}>{error || 'Bordereau introuvable.'}</div>;

  const needsConf   = data.status === 'valide' && !confirmed;
  const canSubmit   = checked && needsConf;
  const blItems     = Array.isArray(data.items)         ? data.items         : [];
  const parcelItems = Array.isArray(data.parcel?.items) ? data.parcel.items  : [];
  const totalNb     = blItems.reduce((s, it) => s + (Number(it.count) || Number(it.nbPieces) || 0), 0);
  const weight      = data.weightKg ?? data.parcel?.weightKg;
  const route       = `${data.campaign.from} → ${data.campaign.to}`;

  return (
    <>
      <style>{`* { box-sizing: border-box; }`}</style>

      {/* ── Top bar ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'white', borderBottom: '1px solid #e5e7eb',
        padding: '11px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0,0,0,.06)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => window.history.back()} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#374151', fontSize: 13.5, fontWeight: 500, padding: 0,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5m5 5-5-5 5-5"/></svg>
            Retour
          </button>
          <div style={{ width: 1, height: 18, background: '#e5e7eb' }} />
          <span style={{ fontSize: 13, color: '#6b7280' }}>Bordereau</span>
          <span style={{ fontFamily: 'monospace', fontSize: 13.5, fontWeight: 700, color: '#111827' }}>{data.code}</span>
        </div>

        {/* Right: validation CTA or confirmed status */}
        {confirmed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #86efac' }}>
            <span style={{ fontSize: 16 }}>✅</span>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#15803d' }}>Bordereau validé</div>
              {data.clientConfirmedAt && <div style={{ fontSize: 11, color: '#166534' }}>{fmt(data.clientConfirmedAt)}</div>}
            </div>
          </div>
        ) : needsConf ? (
          <button onClick={handleConfirm} disabled={!canSubmit || confirming} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 20px', borderRadius: 9, border: 'none',
            background: canSubmit ? '#16a34a' : '#d1d5db',
            color: 'white', fontWeight: 700, fontSize: 14,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            transition: 'background .15s',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
            {confirming ? 'Validation…' : 'Je valide ce bordereau'}
          </button>
        ) : null}
      </div>

      {/* ── Document ── */}
      <div style={{
        maxWidth: 740, margin: '24px auto 60px',
        background: 'white', borderRadius: 10,
        boxShadow: '0 4px 28px rgba(0,0,0,.10)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{ padding: '18px 32px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F5A524', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 21, color: 'white', flexShrink: 0 }}>J</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#111827' }}>Jumla Shipping</div>
              <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 1 }}>Fret aérien international</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 6, background: '#f3f4f6', fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: 'monospace' }}>{route}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 5 }}>{data.campaign.from} → {data.campaign.to}</div>
          </div>
        </div>

        <div style={{ padding: '28px 32px' }}>

          {/* Title + BL number */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 18, marginBottom: 20, borderBottom: '2px solid #111827' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827' }}>Bordereau du colis</h1>
              <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 5 }}>Delivery slip · for inspection on arrival</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9ca3af' }}>N° Bordereau</div>
              <div style={{ fontFamily: 'monospace', fontSize: 17, fontWeight: 800, color: '#111827', marginTop: 3 }}>{data.code}</div>
            </div>
          </div>

          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
            {[
              { label: 'Cargaison',    value: data.campaign.code,         mono: true },
              { label: 'Code Colis',   value: data.parcel.trackingCode,   mono: true },
              { label: 'Date Départ',  value: fmt(data.campaign.departureDate, { day: 'numeric', month: 'long', year: 'numeric' }) },
              { label: 'Date Arrivée', value: fmt(data.campaign.arrivalDate,   { day: 'numeric', month: 'long', year: 'numeric' }) },
            ].map((cell, i) => (
              <div key={i} style={{ padding: '10px 14px', borderRight: i < 3 ? '1px solid #e5e7eb' : 'none', background: '#f9fafb' }}>
                <div style={{ fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9ca3af', marginBottom: 5 }}>{cell.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', fontFamily: cell.mono ? 'monospace' : 'inherit' }}>{cell.value}</div>
              </div>
            ))}
          </div>

          {/* Client / Destination */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Client / Expéditeur', content: (
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{data.client.name}</div>
                  {data.client.city  && <div style={{ fontSize: 12.5, color: '#4b5563' }}>{data.client.city}</div>}
                  {data.client.phone && <div style={{ fontSize: 12.5, color: '#4b5563', fontFamily: 'monospace' }}>{data.client.phone}</div>}
                </div>
              )},
              { label: 'Destination', content: (
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Jumla Shipping — {data.campaign.to}</div>
                  <div style={{ fontSize: 12.5, color: '#4b5563' }}>{data.campaign.to}, Canada</div>
                  <div style={{ fontSize: 12.5, color: '#4b5563' }}>paiement@jumla.cargo</div>
                </div>
              )},
            ].map((col, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '6px 14px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6b7280' }}>{col.label}</div>
                <div style={{ padding: '12px 14px' }}>{col.content}</div>
              </div>
            ))}
          </div>

          {/* CONTENU DÉCLARÉ */}
          {parcelItems.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#374151', marginBottom: 8 }}>Contenu déclaré / Declared Content</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <TH w={32}>#</TH>
                    <TH left>Description</TH>
                    <TH left>Catégorie</TH>
                    <TH w={90}>Poids</TH>
                    <TH w={60}>Qté</TH>
                  </tr>
                </thead>
                <tbody>
                  {parcelItems.map((it, i) => (
                    <tr key={i}>
                      <TD center muted>{i + 1}</TD>
                      <TD bold>{it.description || it.desc}</TD>
                      <TD>{PRODUCT_TYPES[it.cat || it.productType]}</TD>
                      <TD center mono>{(it.kg || it.weightKg) ? `${it.kg || it.weightKg} kg` : null}</TD>
                      <TD center mono bold>{it.pieces ?? it.nbPieces}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* DÉTAIL DU BORDEREAU */}
          {blItems.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#374151', marginBottom: 8 }}>Détail du bordereau / Content Inspection</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <TH w={32}>#</TH>
                    <TH left>Désignation</TH>
                    <TH left>Description</TH>
                    <TH left w={100}>Type</TH>
                    <TH w={70}>Nb</TH>
                    <TH w={70}>Pièces</TH>
                  </tr>
                </thead>
                <tbody>
                  {blItems.map((it, i) => {
                    const qty = it.count ?? it.nbPieces ?? null;
                    return (
                      <tr key={i}>
                        <TD center muted>{i + 1}</TD>
                        <TD bold>{it.designation || it.label}</TD>
                        <TD muted>{it.description}</TD>
                        <TD>{it.type || it.packaging}</TD>
                        <TD center mono>{qty}</TD>
                        <TD center mono>{qty}</TD>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f9fafb' }}>
                    <td colSpan={4} style={{ padding: '9px 12px', border: '1px solid #e5e7eb', fontWeight: 700, fontSize: 13 }}>Total</td>
                    <td style={{ padding: '9px 12px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 700, fontFamily: 'monospace', fontSize: 13 }}>{totalNb || '—'}</td>
                    <td style={{ padding: '9px 12px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 700, fontFamily: 'monospace', fontSize: 13 }}>{totalNb || '—'}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Fallback — no structured items */}
          {blItems.length === 0 && data.description && (
            <div style={{ marginBottom: 24, padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb', fontSize: 13, color: '#374151' }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9ca3af', marginBottom: 6 }}>Contenu</div>
              {data.description}
            </div>
          )}

          {/* Poids + Total Dû */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9ca3af', marginBottom: 8 }}>Observations</div>
              <div style={{ fontSize: 12.5, color: data.notes ? '#374151' : '#d1d5db', fontStyle: data.notes ? 'normal' : 'italic', minHeight: 56, lineHeight: 1.5 }}>
                {data.notes || 'Aucune observation.'}
              </div>
            </div>
            <div>
              <div style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#6b7280' }}>Poids total</span>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>{weight ? `${weight} kg` : '—'}</span>
              </div>
              <div style={{ background: '#111827', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#9ca3af' }}>Total Dû</span>
                <span style={{ fontSize: 19, fontWeight: 800, color: 'white', fontFamily: 'monospace', letterSpacing: '.02em' }}>
                  {data.payment?.amount ? `${data.payment.amount.toLocaleString('fr')} CAD` : '—'}
                </span>
              </div>
              <div style={{ padding: '9px 14px', borderRadius: '0 0 8px 8px', border: '1px solid #e5e7eb', borderTop: 'none', background: data.paid ? '#f0fdf4' : '#fef3c7' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: data.paid ? '#16a34a' : '#d97706' }}>
                  {data.paid ? `✅ Payé${data.paidAt ? ' le ' + fmt(data.paidAt) : ''}` : '⏳ Paiement en attente'}
                </span>
              </div>
            </div>
          </div>

          {/* ── Attestation / Confirmation zone ── */}
          {confirmed ? (
            <div style={{ padding: '20px 24px', borderRadius: 10, background: '#f0fdf4', border: '1.5px solid #86efac', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 32, flexShrink: 0 }}>✅</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#15803d' }}>Bordereau validé par {data.client.name}</div>
                <div style={{ fontSize: 13, color: '#166534', marginTop: 3, lineHeight: 1.5 }}>
                  Vous avez attesté avoir vérifié et accepté le contenu de ce bordereau.
                  {data.clientConfirmedAt && <> Validé le <strong>{fmt(data.clientConfirmedAt)}</strong>.</>}
                </div>
              </div>
            </div>
          ) : needsConf ? (
            <div style={{ padding: '20px 24px', borderRadius: 10, background: '#fefce8', border: '1.5px solid #fbbf24' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#92400e', marginBottom: 4 }}>⚠️ Attestation requise</div>
              <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.6, marginBottom: 16 }}>
                Jumla Shipping a validé ce bordereau. Veuillez vérifier l&apos;ensemble des informations ci-dessus et confirmer votre accord avant l&apos;expédition de votre colis.
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', marginBottom: 18 }}>
                <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)}
                  style={{ marginTop: 3, width: 17, height: 17, accentColor: '#16a34a', flexShrink: 0, cursor: 'pointer' }} />
                <span style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.6, fontWeight: 500 }}>
                  J&apos;atteste avoir pris connaissance du contenu de ce bordereau, vérifier que les articles, quantités et informations mentionnées sont exacts, et confirme que ce bordereau est conforme.
                  <br />
                  <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 400 }}>Cette validation tient lieu de signature électronique et vaut acceptation formelle du bordereau.</span>
                </span>
              </label>
              <button onClick={handleConfirm} disabled={!checked || confirming} style={{
                padding: '11px 28px', borderRadius: 9, border: 'none',
                background: checked ? '#16a34a' : '#d1d5db',
                color: 'white', fontSize: 14, fontWeight: 700,
                cursor: checked ? 'pointer' : 'not-allowed',
                transition: 'background .15s',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                {confirming ? 'Validation en cours…' : 'Je valide ce bordereau'}
              </button>
            </div>
          ) : (
            <div style={{ padding: '14px 18px', borderRadius: 8, background: '#f3f4f6', border: '1px solid #e5e7eb', fontSize: 13, color: '#6b7280' }}>
              Ce bordereau est en attente de confirmation par Jumla Shipping avant de pouvoir être validé.
            </div>
          )}

          {/* Footer */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 14, marginTop: 28, display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#9ca3af' }}>
            <span>Jumla Shipping · Douala · Cameroun</span>
            <span>{data.campaign.to}, Canada</span>
            <span>contact@jumla.cargo</span>
          </div>
        </div>
      </div>
    </>
  );
}
