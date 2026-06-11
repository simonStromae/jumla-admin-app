'use client';
import { useState, useEffect } from 'react';
import I from '../components/Icons.jsx';
import { Skel } from '../components/Shell.jsx';

const cell  = { padding: '7px 10px', borderBottom: '1px solid #E5E7EB', borderRight: '1px solid #E5E7EB', verticalAlign: 'top' };
const cellH = (w, align) => ({ ...cell, fontSize: 9.5, fontWeight: 700, letterSpacing: '.04em', color: '#374151', textAlign: align || 'center', width: w || 'auto', borderBottom: '1px solid #D1D5DB' });

function fmt(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SlipPrintScreen({ code, onNav }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!code) { setError('Code manquant'); setLoading(false); return; }
    fetch('/api/bordereaux/' + encodeURIComponent(code))
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
        setLoading(false);
      })
      .catch(() => { setError('Erreur réseau'); setLoading(false); });
  }, [code]);

  const PRODUCT_LABELS = {
    standard: 'Standard', biere: 'Bière', manioc_huile: 'Manioc / Huile',
    cosmetique: 'Cosmétique', vetements: 'Vêtements',
  };
  const TYPE_LABELS = { carton: 'Carton', paquet: 'Paquet', sachet: 'Sachet', bouteille: 'Bouteille' };

  const paid = data?.payment?.status === 'completed';
  const blItems     = data?.items ?? [];                    // bordereau lines
  const parcelItems = data?.parcel?.items ?? [];            // declared content
  const totalPieces = blItems.reduce((s, i) => s + (Number(i.nbPieces) || 0), 0) || data?.nbPieces || 0;

  return (
    <div style={{ background: '#E5E7EB', minHeight: '100vh', padding: '24px 0', fontFamily: 'var(--ff-sans)' }}>
      {/* Toolbar */}
      <div className="no-print" style={{
        position: 'sticky', top: 0, zIndex: 10,
        maxWidth: 920, margin: '0 auto 18px',
        background: 'white', border: '1px solid var(--border)',
        borderRadius: 10, padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: 'var(--sh-sm)',
      }}>
        <button className="btn btn--ghost btn--sm" onClick={() => onNav && onNav('/admin/slips/' + code)}>
          <I.ArrowLeft />Retour
        </button>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Aperçu avant impression</span>
        <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>— A4 portrait, marges 12 mm</span>
        <div style={{ flex: 1 }} />
        <button className="btn btn--brand btn--sm" onClick={() => window.print()}><I.Print />Imprimer</button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ width: 794, margin: '0 auto', background: 'white', padding: '44px 48px', borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skel w="40%" h={24} />
          <Skel w="100%" h={60} />
          <Skel w="100%" h={120} />
          <Skel w="100%" h={200} />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ width: 794, margin: '0 auto', background: 'white', padding: '60px', textAlign: 'center', borderRadius: 4 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--bad-700)', marginBottom: 8 }}>Bordereau introuvable</div>
          <div style={{ fontSize: 13, color: 'var(--ink-400)' }}>{error}</div>
        </div>
      )}

      {/* Document */}
      {!loading && data && (
        <div style={{ width: 794, margin: '0 auto', background: 'white', padding: '44px 48px', boxShadow: 'var(--sh-md)', borderRadius: 4, color: '#0F172A', fontSize: 12 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '2px solid #0F172A', paddingBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: 'linear-gradient(135deg, #F5A524, #D97706)', color: 'white', display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 700 }}>J</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em' }}>Jumla Shipping</div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>Fret aérien international</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', border: '1px solid #D1D5DB', borderRadius: 4, fontFamily: 'monospace', fontSize: 11, fontWeight: 600 }}>
                <span>{data.campaign.from}</span> ✈ <span>{data.campaign.to}</span>
              </div>
              <div style={{ fontSize: 10.5, color: '#6B7280', marginTop: 6 }}>
                {data.campaign.from} → {data.campaign.to}
              </div>
            </div>
          </div>

          {/* Title */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, marginTop: 18, marginBottom: 20, alignItems: 'start' }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.02em' }}>Bordereau du colis</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Delivery slip · for inspection on arrival</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10.5, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>N° bordereau</div>
              <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700 }}>{data.code}</div>
            </div>
          </div>

          {/* Meta row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid #D1D5DB', borderRadius: 4, marginBottom: 18 }}>
            {[
              { l: 'Cargaison',    v: data.campaign.code },
              { l: 'Code colis',   v: data.parcel.trackingCode },
              { l: 'Date départ',  v: fmt(data.campaign.departureDate) },
              { l: 'Date arrivée', v: fmt(data.campaign.arrivalDate) },
            ].map((k, i) => (
              <div key={i} style={{ padding: '10px 14px', borderRight: i < 3 ? '1px solid #E5E7EB' : 'none' }}>
                <div style={{ fontSize: 9.5, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>{k.l}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, marginTop: 2 }}>{k.v}</div>
              </div>
            ))}
          </div>

          {/* Parties */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
            {[
              {
                kind: 'CLIENT / EXPÉDITEUR',
                name: data.client.name,
                phone: data.client.phone,
                addr: data.client.city ?? '—',
              },
              {
                kind: 'DESTINATION',
                name: 'Jumla Shipping — ' + data.campaign.to,
                phone: 'paiement@jumla.cargo',
                addr: data.campaign.to + ', Canada',
              },
            ].map((p, i) => (
              <div key={i} style={{ border: '1px solid #D1D5DB', borderRadius: 4 }}>
                <div style={{ padding: '6px 12px', background: '#F4F5F7', borderBottom: '1px solid #D1D5DB', fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em' }}>{p.kind}</div>
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: 11.5, color: '#374151', marginTop: 4, lineHeight: 1.55 }}>{p.addr}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 11.5, color: '#374151', marginTop: 2 }}>{p.phone}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Section 1 : Contenu déclaré */}
          {parcelItems.length > 0 && (
            <>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', marginBottom: 8, color: '#374151' }}>CONTENU DÉCLARÉ / DECLARED CONTENT</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #D1D5DB', fontSize: 12, marginBottom: 18 }}>
                <thead>
                  <tr style={{ background: '#F4F5F7' }}>
                    <th style={cellH(40)}>#</th>
                    <th style={cellH(null, 'left')}>Description</th>
                    <th style={cellH(120, 'left')}>Catégorie</th>
                    <th style={cellH(70)}>Poids</th>
                    <th style={cellH(60)}>Qté</th>
                  </tr>
                </thead>
                <tbody>
                  {parcelItems.map((it, idx) => (
                    <tr key={idx}>
                      <td style={{ ...cell, fontFamily: 'monospace', color: '#6B7280' }}>{idx + 1}</td>
                      <td style={{ ...cell, fontWeight: 500 }}>{it.description || it.designation || '—'}</td>
                      <td style={{ ...cell, color: '#374151' }}>{PRODUCT_LABELS[it.productType] || it.type || '—'}</td>
                      <td style={{ ...cell, textAlign: 'center', fontFamily: 'monospace' }}>{it.weightKg ? it.weightKg + ' kg' : '—'}</td>
                      <td style={{ ...cell, textAlign: 'center', fontFamily: 'monospace' }}>{it.nbPieces || it.count || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* Section 2 : Détail du bordereau */}
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', marginBottom: 8, color: '#374151' }}>DÉTAIL DU BORDEREAU / CONTENT INSPECTION</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #D1D5DB', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#F4F5F7' }}>
                <th style={cellH(40)}>#</th>
                <th style={cellH(null, 'left')}>Désignation</th>
                <th style={cellH(null, 'left')}>Description</th>
                <th style={cellH(70, 'left')}>Type</th>
                <th style={cellH(50)}>Nb</th>
                <th style={cellH(60)}>Pièces</th>
                <th style={cellH(110)}>Vérification</th>
                <th style={cellH(null, 'left')}>Note</th>
              </tr>
            </thead>
            <tbody>
              {blItems.length > 0 ? blItems.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ ...cell, fontFamily: 'monospace', color: '#6B7280' }}>{idx + 1}</td>
                  <td style={{ ...cell, fontWeight: 500 }}>{item.designation || '—'}</td>
                  <td style={{ ...cell, fontSize: 11, color: '#374151' }}>{item.description || '—'}</td>
                  <td style={{ ...cell }}>{TYPE_LABELS[item.type] || item.type || '—'}</td>
                  <td style={{ ...cell, textAlign: 'center', fontFamily: 'monospace' }}>{item.count ?? '—'}</td>
                  <td style={{ ...cell, textAlign: 'center', fontFamily: 'monospace' }}>{item.nbPieces ?? '—'}</td>
                  <td style={{ ...cell, textAlign: 'center' }}>□ À vérifier</td>
                  <td style={{ ...cell, fontSize: 11, color: '#374151' }}></td>
                </tr>
              )) : (
                <tr>
                  <td style={{ ...cell, fontFamily: 'monospace', color: '#6B7280' }}>1</td>
                  <td colSpan={2} style={{ ...cell, fontWeight: 500 }}>{data.description || data.parcel.description || '—'}</td>
                  <td style={cell}>—</td>
                  <td style={{ ...cell, textAlign: 'center', fontFamily: 'monospace' }}>1</td>
                  <td style={{ ...cell, textAlign: 'center', fontFamily: 'monospace' }}>{data.nbPieces ?? '—'}</td>
                  <td style={{ ...cell, textAlign: 'center' }}>□ À vérifier</td>
                  <td style={cell}></td>
                </tr>
              )}
              <tr style={{ background: '#F4F5F7', fontWeight: 700 }}>
                <td colSpan={4} style={{ ...cell, fontSize: 11.5 }}>TOTAL</td>
                <td style={{ ...cell, textAlign: 'center', fontFamily: 'monospace' }}>{blItems.reduce((s, it) => s + (Number(it.count) || 0), 0) || blItems.length || 1}</td>
                <td style={{ ...cell, textAlign: 'center', fontFamily: 'monospace' }}>{totalPieces || '—'}</td>
                <td style={{ ...cell, textAlign: 'center', fontSize: 11 }}></td>
                <td style={cell}></td>
              </tr>
            </tbody>
          </table>

          {/* Payment + observations */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginTop: 20 }}>
            <div style={{ border: '1px solid #D1D5DB', borderRadius: 4, padding: 12 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', color: '#6B7280', marginBottom: 6 }}>OBSERVATIONS</div>
              <div style={{ fontSize: 11.5, color: '#374151', lineHeight: 1.6, minHeight: 60 }}>
                {data.notes || <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Aucune observation. Zone à compléter lors de la livraison.</span>}
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #D1D5DB', fontSize: 12 }}>
              <tbody>
                <tr>
                  <td style={{ ...cell, fontSize: 11 }}>Poids</td>
                  <td style={{ ...cell, textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                    {data.weightKg ?? data.parcel.weightKg ?? '—'} kg
                  </td>
                </tr>
                <tr style={{ background: '#0F172A', color: 'white', fontWeight: 700 }}>
                  <td style={{ ...cell, color: 'white', fontSize: 12, borderColor: '#0F172A' }}>TOTAL DÛ</td>
                  <td style={{ ...cell, color: 'white', textAlign: 'right', fontFamily: 'monospace', fontSize: 14, borderColor: '#0F172A' }}>
                    {(data.payment?.amount ?? data.parcel.priceXaf ?? 0).toLocaleString('fr')} CAD
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} style={{ ...cell, fontSize: 11, color: paid ? '#059669' : '#D97706', fontWeight: 600 }}>
                    {paid
                      ? '✓ Réglé · ' + (data.payment?.paidAt ? fmt(data.payment.paidAt) : '') + (data.payment?.interacRef ? ' · ' + data.payment.interacRef : '')
                      : '⏳ Paiement en attente'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 26 }}>
            {['Agent Jumla', 'Client / Destinataire'].map((lbl, i) => (
              <div key={i}>
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', color: '#6B7280', marginBottom: 36 }}>
                  SIGNATURE — {lbl.toUpperCase()}
                </div>
                <div style={{ borderBottom: '1px solid #0F172A', marginBottom: 6 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#374151' }}>
                  <span>{i === 1 ? data.client.name : '_______________'}</span>
                  <span>Date : ____ / ____ / ____</span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ marginTop: 32, paddingTop: 14, borderTop: '1px solid #D1D5DB', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6B7280' }}>
            <span>Jumla Shipping · Douala · Cameroun</span>
            <span>{data.campaign.to}, Canada</span>
            <span>contact@jumla.cargo</span>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body { margin: 0; background: white; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
