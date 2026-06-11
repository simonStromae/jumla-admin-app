'use client';
import { useState, useEffect } from 'react';

function fmt(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const BL_STATUS = {
  en_attente:  { label: 'En attente de vérification', color: '#6b7280' },
  recu:        { label: 'Reçu',                        color: '#2563eb' },
  valide:      { label: 'Confirmé par Jumla',          color: '#16a34a' },
  discordance: { label: 'Discordance signalée',        color: '#dc2626' },
};

export default function BordereauPage({ params }) {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [checked, setChecked]     = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    fetch('/api/me/bordereau/' + params.blId)
      .then(r => r.json())
      .then(json => {
        if (json.error) setError(json.error);
        else {
          setData(json);
          if (json.clientConfirmed) setConfirmed(true);
        }
        setLoading(false);
      })
      .catch(() => { setError('Erreur réseau'); setLoading(false); });
  }, [params.blId]);

  const handleConfirm = async () => {
    if (!checked || confirming) return;
    setConfirming(true);
    try {
      const res = await fetch('/api/me/bordereau/' + params.blId, { method: 'PATCH' });
      const json = await res.json();
      if (!res.ok) { alert(json.error || 'Erreur'); }
      else setConfirmed(true);
    } catch { alert('Erreur réseau'); }
    setConfirming(false);
  };

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#6b7280', fontFamily: 'system-ui, sans-serif' }}>
      Chargement…
    </div>
  );
  if (error || !data) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#dc2626', fontFamily: 'system-ui, sans-serif' }}>
      {error || 'Bordereau introuvable.'}
    </div>
  );

  const st = BL_STATUS[data.status] ?? { label: data.status, color: '#6b7280' };
  const needsConfirmation = data.status === 'valide' && !confirmed;

  return (
    <>
      <style>{`
        @media print { .no-print { display: none !important; } body { margin: 0; } }
        body { font-family: system-ui, -apple-system, sans-serif; background: #f3f4f6; margin: 0; }
        .bl-wrap { max-width: 720px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.09); }
        @media print { .bl-wrap { margin: 0; border-radius: 0; box-shadow: none; } }
      `}</style>

      <div className="no-print" style={{ maxWidth: 720, margin: '0 auto', padding: '16px 0', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={() => window.history.back()} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: 14 }}>
          ← Retour
        </button>
        <button onClick={() => window.print()} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1e3a5f', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          🖨 Imprimer / PDF
        </button>
      </div>

      <div className="bl-wrap">
        {/* Header */}
        <div style={{ background: '#1e3a5f', color: 'white', padding: '28px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>Jumla Shipping</div>
            <div style={{ fontSize: 11, opacity: .7, marginTop: 3 }}>Bordereau de livraison</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>{data.code}</div>
            <div style={{ fontSize: 11, opacity: .7, marginTop: 3 }}>Émis le {fmt(data.createdAt)}</div>
            <div style={{
              display: 'inline-block', marginTop: 8, padding: '3px 10px', borderRadius: 999,
              background: data.status === 'valide' ? '#16a34a' : 'rgba(255,255,255,.2)',
              fontSize: 11, fontWeight: 700,
            }}>{st.label}</div>
          </div>
        </div>

        <div style={{ padding: '28px 36px' }}>
          {/* Client + Campaign */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #e5e7eb' }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6b7280', marginBottom: 6 }}>Destinataire</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{data.client.name}</div>
              {data.client.city  && <div style={{ fontSize: 13, color: '#4b5563', marginTop: 2 }}>{data.client.city}</div>}
              {data.client.phone && <div style={{ fontSize: 13, color: '#4b5563', fontFamily: 'monospace' }}>{data.client.phone}</div>}
            </div>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6b7280', marginBottom: 6 }}>Cargaison</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>{data.campaign.code}</div>
              <div style={{ fontSize: 13, color: '#4b5563', marginTop: 2 }}>{data.campaign.from} → {data.campaign.to}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Arrivée prévue : {fmt(data.campaign.arrivalDate)}</div>
            </div>
          </div>

          {/* Colis ref */}
          <div style={{ background: '#f9fafb', borderRadius: 8, padding: '12px 16px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', letterSpacing: '.06em' }}>Colis</div>
              <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: '#1e3a5f', marginTop: 2 }}>{data.parcel.trackingCode}</div>
              {data.parcel.description && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{data.parcel.description}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', letterSpacing: '.06em' }}>Paiement</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2, color: data.paid ? '#16a34a' : '#f59e0b' }}>
                {data.paid ? `✓ Payé${data.paidAt ? ' le ' + fmt(data.paidAt) : ''}` : '⏳ En attente'}
              </div>
            </div>
          </div>

          {/* BL details */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Description', 'Poids', 'Pièces'].map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: h === 'Poids' || h === 'Pièces' ? 'center' : 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#6b7280', border: '1px solid #e5e7eb' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items && data.items.length > 0 ? data.items.map((item, i) => (
                <tr key={i}>
                  <td style={{ padding: '12px 14px', border: '1px solid #e5e7eb', color: '#111827', fontSize: 14 }}>
                    <div style={{ fontWeight: 600 }}>{item.designation || '—'}</div>
                    {item.description && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{item.description}</div>}
                  </td>
                  <td style={{ padding: '12px 14px', border: '1px solid #e5e7eb', textAlign: 'center', fontFamily: 'monospace', fontSize: 14 }}>—</td>
                  <td style={{ padding: '12px 14px', border: '1px solid #e5e7eb', textAlign: 'center', fontFamily: 'monospace', fontSize: 14, fontWeight: 600 }}>
                    {item.nbPieces ?? item.count ?? '—'}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td style={{ padding: '12px 14px', border: '1px solid #e5e7eb', color: '#111827', fontSize: 14 }}>{data.description || '—'}</td>
                  <td style={{ padding: '12px 14px', border: '1px solid #e5e7eb', textAlign: 'center', fontFamily: 'monospace', fontSize: 14, fontWeight: 600 }}>
                    {data.weightKg ? data.weightKg + ' kg' : '—'}
                  </td>
                  <td style={{ padding: '12px 14px', border: '1px solid #e5e7eb', textAlign: 'center', fontFamily: 'monospace', fontSize: 14, fontWeight: 600 }}>
                    {data.nbPieces ?? '—'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {data.notes && (
            <div style={{ padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 13, color: '#92400e', marginBottom: 24 }}>
              <strong>Note :</strong> {data.notes}
            </div>
          )}

          {/* Client confirmation section — only shown when bordereau is validated */}
          {(needsConfirmation || confirmed) && (
            <div className="no-print" style={{
              marginTop: 28,
              padding: '20px 24px',
              borderRadius: 10,
              background: confirmed ? '#f0fdf4' : '#fefce8',
              border: `1px solid ${confirmed ? '#86efac' : '#fde68a'}`,
            }}>
              {confirmed ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 28 }}>✅</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#15803d' }}>Contenu accepté</div>
                    <div style={{ fontSize: 13, color: '#166534', marginTop: 2 }}>
                      Vous avez confirmé le contenu de ce bordereau.
                      {data.clientConfirmedAt && ` Accepté le ${fmt(data.clientConfirmedAt)}.`}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#92400e', marginBottom: 6 }}>
                    ⚠️ Action requise — Confirmation du contenu
                  </div>
                  <div style={{ fontSize: 13, color: '#78350f', marginBottom: 16, lineHeight: 1.6 }}>
                    Jumla Shipping a confirmé votre bordereau. Veuillez vérifier le contenu déclaré ci-dessus et l'accepter avant l'expédition de votre colis.
                  </div>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={e => setChecked(e.target.checked)}
                      style={{ marginTop: 2, width: 16, height: 16, accentColor: '#1e3a5f', flexShrink: 0, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                      En cochant cette case, je confirme avoir vérifié le contenu déclaré dans ce bordereau et j'atteste que les informations sont exactes.
                      Cette confirmation tient lieu de signature électronique et vaut acceptation des conditions d'expédition.
                    </span>
                  </label>
                  <button
                    onClick={handleConfirm}
                    disabled={!checked || confirming}
                    style={{
                      marginTop: 16,
                      padding: '10px 24px',
                      borderRadius: 8,
                      border: 'none',
                      background: checked ? '#1e3a5f' : '#d1d5db',
                      color: 'white',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: checked ? 'pointer' : 'not-allowed',
                      transition: 'background .15s',
                    }}
                  >
                    {confirming ? 'Confirmation…' : 'Confirmer le contenu du colis'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Signature zones — print only */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 40 }}>
            {['Signature Jumla Shipping', 'Signature destinataire'].map(label => (
              <div key={label}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 40 }}>{label}</div>
                <div style={{ borderBottom: '1px solid #d1d5db' }} />
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>Date : _______________</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16, marginTop: 28, display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#9ca3af' }}>
            <span>Jumla Shipping SARL · contact@jumla.cargo</span>
            <span>Douala · Montréal · Lagos · Bruxelles</span>
          </div>
        </div>
      </div>
    </>
  );
}
