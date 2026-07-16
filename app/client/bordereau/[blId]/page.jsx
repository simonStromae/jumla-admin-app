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
  const [paymentEmail, setPaymentEmail] = useState('incjumla@gmail.com');

  useEffect(() => {
    fetch('/api/public/config').then(r => r.json()).then(d => {
      if (d.paymentEmail) setPaymentEmail(d.paymentEmail);
    }).catch(() => {});
  }, []);

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

  const needsConf   = !confirmed;
  const canSubmit   = checked && needsConf;
  const blItems     = Array.isArray(data.items)         ? data.items         : [];
  const parcelItems = Array.isArray(data.parcel?.items) ? data.parcel.items  : [];
  const totalNb     = blItems.reduce((s, it) => s + (Number(it.count) || 0), 0);
  const totalPieces = blItems.reduce((s, it) => s + (Number(it.nbPieces ?? it.pieces) || 0), 0);
  const weight      = data.weightKg ?? data.parcel?.weightKg;
  const route       = `${data.campaign.from} → ${data.campaign.to}`;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .bl-topbar {
          position: sticky; top: 0; z-index: 20;
          background: white; border-bottom: 1px solid #e5e7eb;
          padding: 11px 20px;
          display: flex; align-items: center; justify-content: space-between;
          box-shadow: 0 1px 4px rgba(0,0,0,.06);
          font-family: system-ui, -apple-system, sans-serif;
          gap: 10px; flex-wrap: wrap;
        }
        .bl-topbar__left { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .bl-topbar__code { font-family: monospace; font-size: 13.5px; font-weight: 700; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
        .bl-doc {
          max-width: 740px; margin: 20px auto 60px;
          background: white; border-radius: 10px;
          box-shadow: 0 4px 28px rgba(0,0,0,.10);
          font-family: system-ui, -apple-system, sans-serif;
          overflow: hidden;
        }
        .bl-header { padding: 16px 24px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
        .bl-body { padding: 24px 24px; }
        .bl-title-row { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; margin-bottom: 18px; border-bottom: 2px solid #111827; gap: 12px; }
        .bl-info-grid { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 18px; }
        .bl-info-cell { padding: 10px 12px; background: #f9fafb; }
        .bl-info-cell:not(:last-child) { border-right: 1px solid #e5e7eb; }
        .bl-parties { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 22px; }
        .bl-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; margin-bottom: 22px; }
        .bl-section-label { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #374151; margin-bottom: 8px; }
        .bl-amounts { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 26px; }
        .bl-footer-row { border-top: 1px solid #e5e7eb; padding-top: 14px; margin-top: 26px; display: flex; justify-content: space-between; font-size: 10.5px; color: #9ca3af; flex-wrap: wrap; gap: 4px; }
        .bl-confirm-btn {
          padding: 12px 24px; border-radius: 9px; border: none;
          color: white; font-size: 14px; font-weight: 700;
          cursor: pointer; transition: background .15s;
          display: flex; align-items: center; gap: 8px;
          width: 100%;
        }
        @media (max-width: 600px) {
          .bl-topbar { padding: 10px 14px; }
          .bl-topbar__code { max-width: 120px; font-size: 12px; }
          .bl-doc { margin: 10px 10px 60px; border-radius: 8px; }
          .bl-header { padding: 12px 14px; }
          .bl-body { padding: 16px 14px; }
          .bl-title-row { flex-direction: column; gap: 8px; }
          .bl-info-grid { grid-template-columns: 1fr 1fr; }
          .bl-info-cell:nth-child(2) { border-right: none; }
          .bl-info-cell:nth-child(1),
          .bl-info-cell:nth-child(2) { border-bottom: 1px solid #e5e7eb; }
          .bl-parties { grid-template-columns: 1fr; }
          .bl-amounts { grid-template-columns: 1fr; }
          .bl-footer-row { flex-direction: column; gap: 2px; }
        }
      `}</style>

      {/* ── Top bar ── */}
      <div className="bl-topbar">
        <div className="bl-topbar__left">
          <button onClick={() => window.history.back()} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#374151', fontSize: 13.5, fontWeight: 500, padding: 0, flexShrink: 0,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5m5 5-5-5 5-5"/></svg>
            Retour
          </button>
          <div style={{ width: 1, height: 18, background: '#e5e7eb', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#6b7280', flexShrink: 0 }}>Bordereau</span>
          <span className="bl-topbar__code">{data.code}</span>
        </div>

        {confirmed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #86efac', flexShrink: 0 }}>
            <span style={{ fontSize: 14 }}>✅</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>Bordereau validé</div>
              {data.clientConfirmedAt && <div style={{ fontSize: 10.5, color: '#166534' }}>{fmt(data.clientConfirmedAt)}</div>}
            </div>
          </div>
        ) : needsConf ? (
          <button onClick={handleConfirm} disabled={!canSubmit || confirming} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 9, border: 'none',
            background: canSubmit ? '#16a34a' : '#d1d5db',
            color: 'white', fontWeight: 700, fontSize: 13,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
            {confirming ? 'Validation…' : 'Valider'}
          </button>
        ) : null}
      </div>

      {/* ── Document ── */}
      <div className="bl-doc">

        {/* Header */}
        <div className="bl-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 9, background: '#F5A524', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 20, color: 'white', flexShrink: 0 }}>J</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#111827' }}>Jumla Shipping</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>Fret aérien international</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 6, background: '#f3f4f6', fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: 'monospace' }}>{route}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{data.campaign.from} → {data.campaign.to}</div>
          </div>
        </div>

        <div className="bl-body">

          {/* Title + BL number */}
          <div className="bl-title-row">
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111827' }}>Bordereau du colis</h1>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Delivery slip · for inspection on arrival</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9ca3af' }}>N° Bordereau</div>
              <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 800, color: '#111827', marginTop: 3 }}>{data.code}</div>
            </div>
          </div>

          {/* Info grid — 4 cols desktop, 2×2 mobile */}
          <div className="bl-info-grid">
            {[
              { label: 'Cargaison',    value: data.campaign.code,         mono: true },
              { label: 'Code Colis',   value: data.parcel.trackingCode,   mono: true },
              { label: 'Date Départ',  value: fmt(data.campaign.departureDate, { day: 'numeric', month: 'long', year: 'numeric' }) },
              { label: 'Date Arrivée', value: fmt(data.campaign.arrivalDate,   { day: 'numeric', month: 'long', year: 'numeric' }) },
            ].map((cell, i) => (
              <div key={i} className="bl-info-cell">
                <div style={{ fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9ca3af', marginBottom: 5 }}>{cell.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', fontFamily: cell.mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>{cell.value}</div>
              </div>
            ))}
          </div>

          {/* Client / Destination */}
          <div className="bl-parties">
            {[
              { label: 'Client / Expéditeur', content: (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{data.client.name}</div>
                  {data.client.city  && <div style={{ fontSize: 12.5, color: '#4b5563' }}>{data.client.city}</div>}
                  {data.client.phone && <div style={{ fontSize: 12.5, color: '#4b5563', fontFamily: 'monospace' }}>{data.client.phone}</div>}
                </div>
              )},
              { label: 'Destination', content: (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Jumla Shipping — {data.campaign.to}</div>
                  <div style={{ fontSize: 12.5, color: '#4b5563' }}>{data.campaign.to}, Canada</div>
                  <div style={{ fontSize: 12, color: '#4b5563', wordBreak: 'break-all' }}>{paymentEmail}</div>
                </div>
              )},
            ].map((col, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '6px 12px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6b7280' }}>{col.label}</div>
                <div style={{ padding: '10px 12px' }}>{col.content}</div>
              </div>
            ))}
          </div>

          {/* CONTENU DÉCLARÉ */}
          {parcelItems.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <div className="bl-section-label">Contenu déclaré / Declared Content</div>
              <div className="bl-table-wrap">
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 320 }}>
                  <thead>
                    <tr>
                      <TH w={28}>#</TH>
                      <TH left>Description</TH>
                      <TH left>Catégorie</TH>
                      <TH w={80}>Poids</TH>
                      <TH w={50}>Qté</TH>
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
            </div>
          )}

          {/* DÉTAIL DU BORDEREAU */}
          {blItems.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <div className="bl-section-label">Détail du bordereau / Content Inspection</div>
              <div className="bl-table-wrap">
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
                  <thead>
                    <tr>
                      <TH w={28}>#</TH>
                      <TH left>Désignation</TH>
                      <TH left>Description</TH>
                      <TH left w={90}>Type</TH>
                      <TH w={55}>Nb</TH>
                      <TH w={60}>Pièces</TH>
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
                          <td style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'center', fontFamily: 'monospace', fontSize: 13 }}>{qty != null ? qty : ''}</td>
                          <td style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'center', fontFamily: 'monospace', fontSize: 13, color: '#6b7280' }}>{(it.nbPieces ?? it.pieces) || ''}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f9fafb' }}>
                      <td colSpan={4} style={{ padding: '8px 10px', border: '1px solid #e5e7eb', fontWeight: 700, fontSize: 13 }}>Total</td>
                      <td style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 700, fontFamily: 'monospace', fontSize: 13 }}>{totalNb > 0 ? totalNb : ''}</td>
                      <td style={{ padding: '8px 10px', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 700, fontFamily: 'monospace', fontSize: 13 }}>{totalPieces > 0 ? totalPieces : ''}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Fallback */}
          {blItems.length === 0 && data.description && (
            <div style={{ marginBottom: 22, padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb', fontSize: 13, color: '#374151' }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9ca3af', marginBottom: 6 }}>Contenu</div>
              {data.description}
            </div>
          )}

          {/* Poids + Total Dû */}
          <div className="bl-amounts">
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9ca3af', marginBottom: 8 }}>Observations</div>
              <div style={{ fontSize: 12.5, color: data.notes ? '#374151' : '#d1d5db', fontStyle: data.notes ? 'normal' : 'italic', minHeight: 48, lineHeight: 1.5 }}>
                {data.notes || 'Aucune observation.'}
              </div>
            </div>
            <div>
              <div style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#6b7280' }}>Poids total</span>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>{weight ? `${weight} kg` : '—'}</span>
              </div>
              <div style={{ background: '#111827', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#9ca3af' }}>Total Dû</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'white', fontFamily: 'monospace' }}>
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
            <div style={{ padding: '18px 20px', borderRadius: 10, background: '#f0fdf4', border: '1.5px solid #86efac', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>✅</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#15803d' }}>Bordereau validé par {data.client.name}</div>
                <div style={{ fontSize: 12.5, color: '#166534', marginTop: 3, lineHeight: 1.5 }}>
                  Vous avez attesté avoir vérifié et accepté le contenu de ce bordereau.
                  {data.clientConfirmedAt && <> Validé le <strong>{fmt(data.clientConfirmedAt)}</strong>.</>}
                </div>
              </div>
            </div>
          ) : needsConf ? (
            <div style={{ padding: '18px 18px', borderRadius: 10, background: '#fefce8', border: '1.5px solid #fbbf24' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#92400e', marginBottom: 6 }}>✍️ Votre signature est requise avant l&apos;expédition</div>
              <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.65, marginBottom: 16 }}>
                Jumla Shipping a établi ce bordereau à partir de votre déclaration de contenu. <strong>Votre colis ne partira pas tant que vous n&apos;aurez pas signé ce document.</strong>
                <br />Vérifiez que les articles et quantités correspondent bien à ce que vous expédiez, puis confirmez.
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', marginBottom: 18, padding: '12px 14px', background: 'white', borderRadius: 8, border: '1px solid #fde68a' }}>
                <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)}
                  style={{ marginTop: 3, width: 18, height: 18, accentColor: '#16a34a', flexShrink: 0, cursor: 'pointer' }} />
                <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.65, fontWeight: 500 }}>
                  Je soussigné(e) <strong>{data.client.name}</strong> atteste avoir vérifié le contenu de ce bordereau et confirme que les articles et quantités mentionnés sont exacts et complets.
                  <br />
                  <span style={{ fontSize: 11.5, color: '#9ca3af', fontWeight: 400 }}>Cette validation vaut signature électronique et autorise Jumla Shipping à procéder à l&apos;expédition.</span>
                </span>
              </label>
              <button onClick={handleConfirm} disabled={!checked || confirming}
                className="bl-confirm-btn"
                style={{ background: checked ? '#16a34a' : '#d1d5db', cursor: checked ? 'pointer' : 'not-allowed' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                {confirming ? 'Validation en cours…' : 'Je valide et autorise l\'expédition'}
              </button>
            </div>
          ) : (
            <div style={{ padding: '14px 16px', borderRadius: 8, background: '#f3f4f6', border: '1px solid #e5e7eb', fontSize: 13, color: '#6b7280' }}>
              Ce bordereau est en attente de confirmation par Jumla Shipping avant de pouvoir être validé.
            </div>
          )}

          {/* Footer */}
          <div className="bl-footer-row">
            <span>Jumla Shipping · Douala · Cameroun</span>
            <span>{data.campaign.to}, Canada</span>
            <span>info@jumlas.com</span>
          </div>
        </div>
      </div>
    </>
  );
}
