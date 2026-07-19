'use client';
import { useEffect, useRef, useState } from 'react';

let idCounter = 0;

export default function QrScanner({ onScan, onClose, debug = false }) {
  const [status,  setStatus]  = useState('loading'); // loading | ready | error
  const [err,     setErr]     = useState('');
  const [scanMsg, setScanMsg] = useState('');
  const [scanOk,  setScanOk]  = useState(null);
  const [rawText, setRawText] = useState('');

  const instanceRef  = useRef(null);
  const mountedRef   = useRef(true);
  const handledRef   = useRef(false);   // prevents multi-fire at high fps
  const msgTimerRef  = useRef(null);
  const scannerIdRef = useRef(`qr-scanner-${++idCounter}`);

  const flashMsg = (msg, ok) => {
    setScanMsg(msg);
    setScanOk(ok);
    clearTimeout(msgTimerRef.current);
    msgTimerRef.current = setTimeout(() => { setScanMsg(''); setScanOk(null); }, 2500);
  };

  useEffect(() => {
    mountedRef.current = true;
    handledRef.current = false;
    const id = scannerIdRef.current;
    let cleanedUp = false;

    const doInit = async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');

        if (cleanedUp || !mountedRef.current) return;

        const el = document.getElementById(id);
        if (!el) {
          setStatus('error');
          setErr('Élément scanner introuvable.');
          return;
        }

        const instance = new Html5Qrcode(id, {
          verbose: false,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        });
        instanceRef.current = instance;

        const side = Math.min(Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.75), 300);

        await instance.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: side, height: side } },
          (text) => {
            // Ignore duplicate fires while we are already handling a scan
            if (handledRef.current) return;

            if (debug) setRawText(text);

            const code = text.split('/').pop().replace(/[^A-Z0-9-]/gi, '').toUpperCase();
            if (!code) {
              flashMsg('QR code illisible — réessayez', false);
              return;
            }

            // Lock immediately so subsequent frames are dropped
            handledRef.current = true;
            flashMsg('Code détecté : ' + code, true);

            // Stop the camera then hand off — await-in-callback safe via then()
            instance.stop()
              .catch(() => {})
              .finally(() => {
                if (mountedRef.current) onScan(code);
              });
          },
          () => { /* per-frame decode failures are normal — ignore */ },
        );

        if (mountedRef.current) setStatus('ready');
      } catch (e) {
        if (!mountedRef.current) return;
        const msg = e?.message ?? String(e);
        if (/permission|denied|notallowed/i.test(msg)) {
          setErr('Accès caméra refusé. Autorisez la caméra dans les paramètres de votre navigateur.');
        } else if (/notfound|no camera/i.test(msg)) {
          setErr('Aucune caméra détectée sur cet appareil.');
        } else {
          setErr('Impossible de démarrer le scanner. ' + msg);
        }
        setStatus('error');
      }
    };

    doInit();

    return () => {
      cleanedUp = true;
      mountedRef.current = false;
      clearTimeout(msgTimerRef.current);
      if (instanceRef.current) {
        instanceRef.current.stop().catch(() => {});
        instanceRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,.95)', display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'white' }}>Scanner un colis</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>
            Pointez la caméra vers le QR code ou code-barres
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: '50%',
            width: 36, height: 36, cursor: 'pointer', fontSize: 18, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
          ✕
        </button>
      </div>

      {/* Scanner area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', position: 'relative' }}>
        {status === 'loading' && (
          <div style={{ position: 'absolute', color: 'rgba(255,255,255,.5)', fontSize: 13, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>📷</div>
            Initialisation caméra…
          </div>
        )}
        <div
          id={scannerIdRef.current}
          style={{
            width: '100%', maxWidth: 380,
            borderRadius: 16, overflow: 'hidden',
            opacity: status === 'ready' ? 1 : 0,
            transition: 'opacity .3s',
          }}
        />
      </div>

      {/* Error state */}
      {status === 'error' && (
        <div style={{ margin: '0 20px 16px', padding: '14px 16px', background: '#FEF2F2', borderRadius: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>📵</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', marginBottom: 12 }}>{err}</div>
          <button onClick={onClose} style={{ background: '#DC2626', color: 'white', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Fermer
          </button>
        </div>
      )}

      {status !== 'error' && (
        <div style={{ padding: '12px 20px 32px', textAlign: 'center' }}>
          {scanMsg ? (
            <div style={{
              display: 'inline-block', padding: '8px 18px', borderRadius: 20,
              background: scanOk ? 'rgba(16,185,129,.25)' : 'rgba(220,38,38,.25)',
              border: `1px solid ${scanOk ? 'rgba(16,185,129,.5)' : 'rgba(220,38,38,.5)'}`,
              color: scanOk ? '#6EE7B7' : '#FCA5A5',
              fontSize: 13, fontWeight: 600,
            }}>
              {scanMsg}
            </div>
          ) : (
            <span style={{ color: 'rgba(255,255,255,.35)', fontSize: 11 }}>
              Centrez le QR code dans le cadre
            </span>
          )}

          {debug && rawText && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(255,255,0,.1)', border: '1px solid rgba(255,255,0,.3)', borderRadius: 8, textAlign: 'left' }}>
              <div style={{ color: 'rgba(255,255,0,.7)', fontSize: 10, fontWeight: 700, marginBottom: 4 }}>DEBUG — texte brut lu :</div>
              <div style={{ color: '#FFF', fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all' }}>{rawText}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
