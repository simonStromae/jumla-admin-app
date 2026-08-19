'use client';
import { useState, useEffect, useRef } from 'react';

const ACCEPT_JS = {
  sandbox:    'https://jstest.authorize.net/v1/Accept.js',
  production: 'https://js.authorize.net/v1/Accept.js',
};

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.charset = 'utf-8';
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

export default function CardPaymentModal({ amountCad, parcelId, type = 'booking', onSuccess, onClose }) {
  const [gateway, setGateway] = useState(null);   // { loginId, clientKey, environment }
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [err, setErr] = useState('');
  const [paid, setPaid] = useState(null);          // { transactionId, last4, cardType }

  const cardRef   = useRef(null);
  const expRef    = useRef(null);
  const cvcRef    = useRef(null);

  useEffect(() => {
    fetch('/api/public/payment-gateway')
      .then(r => r.json())
      .then(async d => {
        if (!d.enabled) { setErr('Paiement par carte non configuré.'); setLoading(false); return; }
        setGateway(d);
        await loadScript(ACCEPT_JS[d.environment] ?? ACCEPT_JS.sandbox);
        setLoading(false);
      })
      .catch(() => { setErr('Impossible de charger le module de paiement.'); setLoading(false); });
  }, []);

  const handlePay = () => {
    setErr('');
    if (!gateway) return;
    const cardNumber = cardRef.current?.value?.replace(/\s/g, '') ?? '';
    const exp        = expRef.current?.value ?? '';
    const cvv        = cvcRef.current?.value ?? '';
    const [expMonth, expYear] = exp.split('/').map(s => s.trim());

    if (!cardNumber || cardNumber.length < 13) { setErr('Numéro de carte invalide.'); return; }
    if (!expMonth || !expYear)                 { setErr("Date d'expiration invalide."); return; }
    if (!cvv)                                  { setErr('CVV requis.'); return; }

    const secureData = {
      authData:  { clientKey: gateway.clientKey, apiLoginID: gateway.loginId },
      cardData:  { cardNumber, month: expMonth.padStart(2,'0'), year: expYear.length === 2 ? '20'+expYear : expYear, cardCode: cvv },
    };

    setProcessing(true);
    window.Accept.dispatchData(secureData, async response => {
      if (response.messages.resultCode === 'Error') {
        setErr(response.messages.message?.[0]?.text ?? 'Erreur carte.');
        setProcessing(false);
        return;
      }
      try {
        const res = await fetch('/api/pay/charge', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            opaqueData: response.opaqueData,
            amountCad,
            parcelId,
            type,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          setErr(json.error ?? 'Paiement refusé.');
          setProcessing(false);
          return;
        }
        setPaid(json);
        onSuccess?.(json);
      } catch {
        setErr('Erreur réseau. Réessayez.');
        setProcessing(false);
      }
    });
  };

  // ── Formatting helpers ──
  const fmtCard = e => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 16);
    e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
  };
  const fmtExp = e => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0,2) + '/' + v.slice(2);
    e.target.value = v;
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div style={{
        background: 'var(--bg)', borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,.25)',
        width: '100%', maxWidth: 420, padding: '28px 28px 24px',
        border: '1px solid var(--border)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink-900)' }}>Payer par carte</div>
            <div style={{ fontSize: 13, color: 'var(--ink-400)', marginTop: 3 }}>
              Montant : <strong style={{ color: 'var(--ink-900)' }}>{Number(amountCad).toFixed(2)} CAD</strong>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--ink-400)', lineHeight: 1, padding: 2 }}>×</button>
        </div>

        {paid ? (
          /* ── Success ── */
          <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ok-700)', marginBottom: 6 }}>Paiement accepté</div>
            <div style={{ fontSize: 13, color: 'var(--ink-400)', marginBottom: 4 }}>
              {paid.cardType} •••• {paid.last4}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-300)', fontFamily: 'monospace' }}>
              Réf : {paid.transactionId}
            </div>
            <button
              onClick={onClose}
              style={{ marginTop: 20, padding: '10px 28px', borderRadius: 10, background: 'var(--ok-600)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}
            >
              Fermer
            </button>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--ink-400)', fontSize: 14 }}>Chargement…</div>
        ) : err && !gateway ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--bad-700)', fontSize: 13 }}>{err}</div>
        ) : (
          /* ── Card form ── */
          <>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, fontSize: 11, color: 'var(--ink-400)', alignItems: 'center' }}>
              <span>🔒</span> Paiement sécurisé · Authorize.net · Visa · Mastercard · Amex
            </div>

            {/* Card number */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', display: 'block', marginBottom: 5 }}>
                Numéro de carte
              </label>
              <input
                ref={cardRef}
                type="text"
                inputMode="numeric"
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                onInput={fmtCard}
                disabled={processing}
                style={inputStyle}
              />
            </div>

            {/* Exp + CVV */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', display: 'block', marginBottom: 5 }}>
                  Expiration
                </label>
                <input
                  ref={expRef}
                  type="text"
                  inputMode="numeric"
                  placeholder="MM / AA"
                  maxLength={7}
                  onInput={fmtExp}
                  disabled={processing}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', display: 'block', marginBottom: 5 }}>
                  CVV
                </label>
                <input
                  ref={cvcRef}
                  type="password"
                  inputMode="numeric"
                  placeholder="•••"
                  maxLength={4}
                  disabled={processing}
                  style={inputStyle}
                />
              </div>
            </div>

            {err && (
              <div style={{ fontSize: 13, color: 'var(--bad-700)', background: 'var(--bad-50)', border: '1px solid var(--bad-200)', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
                {err}
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={processing}
              style={{
                width: '100%', padding: '13px 0',
                background: processing ? 'var(--ink-200)' : 'linear-gradient(90deg,#00B4D8,#1B4FD8)',
                color: 'white', fontWeight: 700, fontSize: 15,
                border: 'none', borderRadius: 12, cursor: processing ? 'not-allowed' : 'pointer',
                transition: 'opacity .15s',
              }}
            >
              {processing ? 'Traitement…' : `Payer ${Number(amountCad).toFixed(2)} CAD`}
            </button>

            <div style={{ fontSize: 11, color: 'var(--ink-300)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
              Vos données bancaires ne transitent pas par nos serveurs.<br />
              Chiffrement SSL · Authorize.net
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '11px 13px', borderRadius: 10,
  border: '1.5px solid var(--border)', background: 'var(--bg-soft)',
  fontSize: 15, color: 'var(--ink-900)', fontFamily: 'ui-monospace, monospace',
  outline: 'none',
};
