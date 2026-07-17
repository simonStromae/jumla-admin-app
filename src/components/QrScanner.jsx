'use client';
import { useEffect, useRef, useState } from 'react';

// Unique ID to avoid collisions when mounted multiple times
let idCounter = 0;

export default function QrScanner({ onScan, onClose }) {
  const [err,   setErr]   = useState('');
  const [ready, setReady] = useState(false);
  const instanceRef = useRef(null);
  const idRef = useRef(`qr-scan-${++idCounter}`);

  useEffect(() => {
    const id = idRef.current;
    let instance;

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      instance = new Html5Qrcode(id);
      instanceRef.current = instance;

      instance.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1.0 },
        (text) => {
          // Extract just the tracking code if a URL was encoded
          const code = text.split('/').pop().toUpperCase();
          instance.stop().catch(() => {});
          onScan(code);
        },
        () => { /* ignore per-frame errors */ },
      ).then(() => setReady(true))
       .catch(() => setErr('Impossible d\'accéder à la caméra. Vérifiez les permissions.'));
    });

    return () => { instance?.stop().catch(() => {}); };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,.95)', display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'white' }}>Scanner un colis</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>
            Pointez la caméra vers le QR code ou code-barres
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: 18, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ✕
        </button>
      </div>

      {/* Scanner viewport */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
        {!ready && !err && (
          <div style={{ position: 'absolute', color: 'rgba(255,255,255,.5)', fontSize: 14 }}>
            Initialisation caméra…
          </div>
        )}
        <div
          id={idRef.current}
          style={{ width: '100%', maxWidth: 400, borderRadius: 16, overflow: 'hidden' }}
        />
      </div>

      {err && (
        <div style={{ margin: '0 20px 16px', padding: '12px 14px', background: '#FEF2F2', borderRadius: 12, color: '#DC2626', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
          {err}
        </div>
      )}

      <div style={{ padding: '12px 20px 32px', textAlign: 'center', color: 'rgba(255,255,255,.4)', fontSize: 12 }}>
        Compatible QR code · Code-barres 1D · Code 128 · EAN
      </div>
    </div>
  );
}
