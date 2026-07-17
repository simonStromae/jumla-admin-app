'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const QrScanner = dynamic(() => import('@/src/components/QrScanner.jsx'), { ssr: false });

export default function AgentScanPage() {
  const router = useRouter();
  const [query,       setQuery]       = useState('');
  const [result,      setResult]      = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [history,     setHistory]     = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      const h = JSON.parse(localStorage.getItem('agent_scan_history') || '[]');
      setHistory(h);
    } catch {}
    inputRef.current?.focus();
  }, []);

  const pushHistory = (code) => {
    setHistory(prev => {
      const next = [code, ...prev.filter(c => c !== code)].slice(0, 10);
      try { localStorage.setItem('agent_scan_history', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const search = async (code) => {
    const q = (code ?? query).trim().toUpperCase();
    if (!q) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`/api/agent/parcels?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        setError(`Aucun colis trouvé pour « ${q} »`);
      } else if (data.length === 1) {
        pushHistory(q);
        router.push(`/agent/parcels/${data[0].id}`);
        return;
      } else {
        setResult(data);
        pushHistory(q);
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') search();
  };

  const STATUS_META = {
    enr: { label: 'Enregistré', color: '#1B4FD8', bg: '#EFF6FF' },
    rec: { label: 'Entrepôt',   color: '#0087A8', bg: '#E0F9FF' },
    pre: { label: 'Préparé',    color: '#059669', bg: '#ECFDF5' },
    exp: { label: 'Expédié',    color: '#7C3AED', bg: '#EDE9FE' },
    tra: { label: 'Transit',    color: '#B45309', bg: '#FFFBEB' },
    apd: { label: 'Arrivée',    color: '#0D9488', bg: '#F0FDFA' },
    dou: { label: 'Douane',     color: '#DC2626', bg: '#FEF2F2' },
    lib: { label: 'Libéré',     color: '#059669', bg: '#ECFDF5' },
    ard: { label: 'Entrepôt.',  color: '#1B4FD8', bg: '#EFF6FF' },
    pdl: { label: 'Prêt',       color: '#10B981', bg: '#ECFDF5' },
    ok:  { label: 'Livré',      color: '#6B7280', bg: '#F4F5F7' },
  };

  return (
    <div>
      {/* Camera scanner overlay */}
      {showScanner && (
        <QrScanner
          debug
          onScan={(code) => { setShowScanner(false); setQuery(code); search(code); }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Topbar */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '12px 14px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 10 }}>Scan / Recherche</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowScanner(true)}
            className="agent-btn agent-btn--ghost"
            style={{ flexShrink: 0, minWidth: 48, fontSize: 18, padding: '0 12px' }}
            title="Scanner avec la caméra"
          >
            📷
          </button>
          <input
            ref={inputRef}
            className="agent-input"
            placeholder="Code de suivi…"
            value={query}
            onChange={e => setQuery(e.target.value.toUpperCase())}
            onKeyDown={handleKey}
            style={{ flex: 1, marginBottom: 0, textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '.05em' }}
          />
          <button
            onClick={() => search()}
            disabled={loading || !query.trim()}
            className="agent-btn agent-btn--brand"
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

        {/* Multiple results */}
        {result && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>
              {result.length} résultats
            </div>
            {result.map(p => {
              const m = STATUS_META[p.status] ?? { label: p.status, color: '#6B7280', bg: '#F4F5F7' };
              return (
                <div key={p.id}
                  onClick={() => router.push(`/agent/parcels/${p.id}`)}
                  style={{
                    background: 'white', borderRadius: 12, padding: '12px 14px', marginBottom: 8,
                    boxShadow: '0 1px 3px rgba(0,0,0,.07)', cursor: 'pointer',
                    borderLeft: `3px solid ${m.color}`,
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#111827' }}>{p.trackingCode}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 999, fontSize: 11, fontWeight: 700, color: m.color, background: m.bg }}>{m.label}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>{p.recipName || p.client?.name}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{p.campaign?.code}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* History */}
        {!result && !error && history.length > 0 && (
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
            <button onClick={() => { setHistory([]); localStorage.removeItem('agent_scan_history'); }}
              style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: 12, cursor: 'pointer', marginTop: 8, fontFamily: 'inherit' }}>
              Effacer l'historique
            </button>
          </div>
        )}

        {/* Empty state */}
        {!result && !error && history.length === 0 && (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#9CA3AF' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Rechercher un colis</div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>Entrez un code de suivi, le nom du client ou son numéro de téléphone</div>
          </div>
        )}
      </div>
    </div>
  );
}
