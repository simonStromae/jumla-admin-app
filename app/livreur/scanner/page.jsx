'use client';
import { useState, useEffect, useRef } from 'react';

const STATUS_META = {
  pdl: { label: 'Prêt pour livraison', color: '#10B981', bg: '#ECFDF5' },
  liv: { label: 'En livraison',         color: '#1B4FD8', bg: '#EFF6FF' },
  ok:  { label: 'Livré',               color: '#6B7280', bg: '#F4F5F7' },
  tdl: { label: 'Tentative échouée',   color: '#DC2626', bg: '#FEF2F2' },
  enr: { label: 'Enregistré',          color: '#1B4FD8', bg: '#EFF6FF' },
  rec: { label: 'Entrepôt',            color: '#0087A8', bg: '#E0F9FF' },
  pre: { label: 'Préparé',             color: '#059669', bg: '#ECFDF5' },
  exp: { label: 'Expédié',             color: '#7C3AED', bg: '#EDE9FE' },
  ard: { label: 'Entrepôt dest.',      color: '#1B4FD8', bg: '#EFF6FF' },
};

export default function DriverScannerPage() {
  const [query,   setQuery]   = useState('');
  const [parcel,  setParcel]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [acting,  setActing]  = useState('');
  const [success, setSuccess] = useState('');
  const [failNote, setFailNote] = useState('');
  const [showFail, setShowFail] = useState(false);
  const [history, setHistory]  = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    try { setHistory(JSON.parse(localStorage.getItem('driver_scan_history') || '[]')); } catch {}
    inputRef.current?.focus();
  }, []);

  const pushHistory = (code) => {
    setHistory(prev => {
      const next = [code, ...prev.filter(c => c !== code)].slice(0, 8);
      try { localStorage.setItem('driver_scan_history', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const search = async (code) => {
    const q = (code ?? query).trim().toUpperCase();
    if (!q) return;
    setLoading(true); setError(''); setParcel(null); setSuccess(''); setShowFail(false); setFailNote('');
    try {
      const res  = await fetch(`/api/driver/scan/${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Colis introuvable'); }
      else { setParcel(data); pushHistory(q); }
    } catch { setError('Erreur de connexion'); }
    finally  { setLoading(false); }
  };

  const act = async (status, note) => {
    if (!parcel) return;
    setActing(status);
    try {
      const res = await fetch(`/api/driver/parcels/${parcel.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note: note || null }),
      });
      const data = await res.json();
      if (res.ok) {
        const labels = { liv: '🚚 Prise en charge enregistrée', ok: '✓ Livraison confirmée !', tdl: '↩ Tentative de livraison notée' };
        setSuccess(labels[status] ?? 'Mis à jour');
        setParcel(p => ({ ...p, status, isMyDelivery: true }));
        setShowFail(false); setFailNote('');
      } else {
        setError(data.error || 'Erreur');
      }
    } catch { setError('Erreur réseau'); }
    finally  { setActing(''); }
  };

  const reset = () => {
    setParcel(null); setError(''); setSuccess('');
    setQuery(''); setShowFail(false); setFailNote('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const m = parcel ? (STATUS_META[parcel.status] ?? { label: parcel.status, color: '#6B7280', bg: '#F4F5F7' }) : null;
  const tel = parcel ? (parcel.recipPhone || parcel.client?.phone) : null;

  return (
    <div>
      {/* Sticky search bar */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '12px 14px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 10 }}>Scanner un colis</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            ref={inputRef}
            className="drv-input"
            placeholder="Code de suivi…"
            value={query}
            onChange={e => setQuery(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && search()}
            style={{ flex: 1, marginBottom: 0, textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '.05em' }}
          />
          <button
            onClick={() => search()}
            disabled={loading || !query.trim()}
            className="drv-btn drv-btn--brand"
            style={{ flexShrink: 0, minWidth: 56 }}
          >
            {loading ? '…' : '→'}
          </button>
        </div>
      </div>

      <div style={{ padding: '12px 14px' }}>
        {/* Error */}
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 14px', color: '#DC2626', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: '12px 14px', color: '#047857', fontSize: 13, fontWeight: 700, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{success}</span>
            <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#047857', fontFamily: 'inherit', fontWeight: 600, padding: 0 }}>
              Scanner un autre →
            </button>
          </div>
        )}

        {/* Parcel card */}
        {parcel && (
          <div>
            {/* Info card */}
            <div className="drv-card" style={{ padding: '14px', marginBottom: 10, borderLeft: `3px solid ${m.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#111827' }}>{parcel.trackingCode}</span>
                <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, color: m.color, background: m.bg }}>
                  {m.label}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                {[
                  { label: 'Destinataire', value: parcel.recipName || parcel.client?.name },
                  { label: 'Cargaison',    value: parcel.campaign?.code },
                  { label: 'Ville',        value: parcel.recipCity },
                  { label: 'Livreur',      value: parcel.driver?.name ?? (parcel.isMyDelivery ? 'Vous' : '—') },
                ].map(({ label, value }) => value ? (
                  <div key={label}>
                    <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, marginBottom: 1 }}>{label}</div>
                    <div style={{ fontSize: 13, color: '#111827', fontWeight: 600 }}>{value}</div>
                  </div>
                ) : null)}
              </div>

              {tel && (
                <div style={{ display: 'flex', gap: 6 }}>
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

              {!parcel.isMyDelivery && (
                <div style={{ marginTop: 10, padding: '7px 10px', background: '#FFFBEB', borderRadius: 7, fontSize: 12, color: '#B45309', fontWeight: 600 }}>
                  ⚠ Ce colis n'est pas assigné à vous
                </div>
              )}
            </div>

            {/* Actions */}
            {parcel.isMyDelivery && !parcel.status.match(/^ok$/) && (
              <div className="drv-card" style={{ padding: '14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>
                  Action
                </div>

                {parcel.status === 'pdl' && (
                  <button
                    onClick={() => act('liv')}
                    disabled={!!acting}
                    className="drv-btn drv-btn--brand drv-btn--full"
                  >
                    {acting === 'liv' ? '…' : '🚚 Prendre en charge'}
                  </button>
                )}

                {parcel.status === 'liv' && !showFail && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => act('ok')}
                      disabled={!!acting}
                      className="drv-btn drv-btn--green"
                      style={{ flex: 1 }}
                    >
                      {acting === 'ok' ? '…' : '✓ Livré'}
                    </button>
                    <button
                      onClick={() => setShowFail(true)}
                      disabled={!!acting}
                      className="drv-btn drv-btn--danger"
                      style={{ flex: 1 }}
                    >
                      ↩ Tentative échouée
                    </button>
                  </div>
                )}

                {showFail && (
                  <div>
                    <textarea
                      className="drv-input"
                      placeholder="Raison de l'échec (obligatoire)…"
                      value={failNote}
                      onChange={e => setFailNote(e.target.value)}
                      rows={3}
                      style={{ resize: 'none', marginBottom: 8 }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setShowFail(false)} className="drv-btn drv-btn--ghost" style={{ flex: 1 }}>
                        Annuler
                      </button>
                      <button
                        onClick={() => { if (failNote.trim()) act('tdl', failNote); }}
                        disabled={!failNote.trim() || !!acting}
                        className="drv-btn drv-btn--danger"
                        style={{ flex: 1 }}
                      >
                        {acting === 'tdl' ? '…' : 'Confirmer'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {parcel.status === 'ok' && (
              <div style={{ padding: '12px 14px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>✓</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#047857' }}>Colis déjà livré</div>
                  {parcel.deliveredAt && (
                    <div style={{ fontSize: 11, color: '#047857' }}>
                      {new Date(parcel.deliveredAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            )}

            <button onClick={reset} style={{ marginTop: 10, width: '100%', background: 'none', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px', fontSize: 13, color: '#6B7280', cursor: 'pointer', fontFamily: 'inherit' }}>
              ← Scanner un autre colis
            </button>
          </div>
        )}

        {/* History */}
        {!parcel && !error && history.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>
              Recherches récentes
            </div>
            <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.07)' }}>
              {history.map((code, i) => (
                <button key={code} onClick={() => { setQuery(code); search(code); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer',
                    borderBottom: i < history.length - 1 ? '1px solid #F4F5F7' : 'none',
                    fontFamily: 'inherit', textAlign: 'left',
                  }}>
                  <span style={{ fontSize: 16, color: '#9CA3AF' }}>↺</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: '#111827', letterSpacing: '.04em' }}>{code}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!parcel && !error && history.length === 0 && (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#9CA3AF' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Scanner un colis</div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>Entrez le code de suivi pour confirmer la prise en charge ou la livraison.</div>
          </div>
        )}
      </div>
    </div>
  );
}
