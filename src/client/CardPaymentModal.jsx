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

const inp = {
  width: '100%', boxSizing: 'border-box',
  padding: '10px 12px', borderRadius: 9,
  border: '1.5px solid #e5e7eb', background: '#ffffff',
  fontSize: 14, color: '#111827', outline: 'none',
  fontFamily: 'inherit',
};
const inpMono = { ...inp, fontFamily: 'ui-monospace, monospace', fontSize: 15 };
const lbl = { display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4, letterSpacing: '.02em' };

export default function CardPaymentModal({ amountCad, currency = 'CAD', amountOriginal, exchangeRate, parcelId, type = 'booking', onSuccess, onClose }) {
  const [gateway,    setGateway]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [processing, setProcessing] = useState(false);
  const [err,        setErr]        = useState('');
  const [paid,       setPaid]       = useState(null);

  // Card refs
  const cardRef = useRef(null);
  const expRef  = useRef(null);
  const cvcRef  = useRef(null);

  // Billing address state
  const [bill, setBill] = useState({
    firstName: '', lastName: '', address: '', city: '', province: 'QC', zip: '',
  });
  const setField = (k, v) => setBill(b => ({ ...b, [k]: v }));

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

  const fmtCard = e => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 16);
    e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
  };
  const fmtExp = e => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0,2) + '/' + v.slice(2);
    e.target.value = v;
  };

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
    if (!bill.firstName.trim())                { setErr('Prénom requis.'); return; }
    if (!bill.lastName.trim())                 { setErr('Nom requis.'); return; }
    if (!bill.address.trim())                  { setErr('Adresse requise.'); return; }
    if (!bill.city.trim())                     { setErr('Ville requise.'); return; }
    if (!bill.zip.trim())                      { setErr('Code postal requis.'); return; }

    setProcessing(true);
    window.Accept.dispatchData({
      authData: { clientKey: gateway.clientKey, apiLoginID: gateway.loginId },
      cardData:  { cardNumber, month: expMonth.padStart(2,'0'), year: expYear.length === 2 ? '20'+expYear : expYear, cardCode: cvv },
    }, async response => {
      if (response.messages.resultCode === 'Error') {
        setErr(response.messages.message?.[0]?.text ?? 'Erreur carte.');
        setProcessing(false);
        return;
      }
      try {
        let res, json;
        try {
          res  = await fetch('/api/pay/charge', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              opaqueData: response.opaqueData,
              amountCad,
              parcelId,
              type,
              billTo: {
                firstName: bill.firstName.trim(),
                lastName:  bill.lastName.trim(),
                address:   bill.address.trim(),
                city:      bill.city.trim(),
                state:     bill.province.trim(),
                zip:       bill.zip.trim(),
                country:   'CA',
              },
            }),
          });
          json = await res.json();
        } catch (fetchErr) {
          console.error('[CardPaymentModal] fetch error:', fetchErr);
          setErr('Erreur réseau. Vérifiez votre connexion et réessayez.');
          setProcessing(false);
          return;
        }
        if (!res.ok || !json.ok) {
          setErr(json.error ?? 'Paiement refusé.');
          setProcessing(false);
          return;
        }
        setPaid(json);
        onSuccess?.(json);
    });
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div style={{ background: '#ffffff', borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,.25)', width: '100%', maxWidth: 440, padding: '28px 28px 24px', border: '1px solid #e5e7eb', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>Payer par carte</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>
              Montant :{' '}
              {currency !== 'CAD' && amountOriginal != null ? (
                <>
                  <strong style={{ color: '#111827' }}>{Number(amountOriginal).toFixed(2)} {currency}</strong>
                  <span style={{ color: '#9ca3af', fontSize: 12 }}>{' '}(≈ {Number(amountCad).toFixed(2)} CAD)</span>
                </>
              ) : (
                <strong style={{ color: '#111827' }}>{Number(amountCad).toFixed(2)} CAD</strong>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#9ca3af', lineHeight: 1, padding: 2 }}>×</button>
        </div>

        {paid ? (
          /* Success */
          <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'grid', placeItems: 'center', fontSize: 22, margin: '0 auto 12px' }}>✓</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#15803d', marginBottom: 6 }}>Paiement accepté</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>{paid.cardType} •••• {paid.last4}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>Réf : {paid.transactionId}</div>
            <button onClick={onClose} style={{ marginTop: 20, padding: '10px 28px', borderRadius: 10, background: '#15803d', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
              Fermer
            </button>
          </div>

        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af', fontSize: 14 }}>Chargement…</div>

        ) : err && !gateway ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: '#dc2626', fontSize: 13 }}>{err}</div>

        ) : (
          <>
            <div style={{ display: 'flex', gap: 6, marginBottom: 18, fontSize: 11, color: '#9ca3af', alignItems: 'center' }}>
              <span>🔒</span> Paiement sécurisé · Authorize.net · Visa · Mastercard · Amex
            </div>

            {/* ── Card fields ── */}
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Numéro de carte</label>
              <input ref={cardRef} type="text" inputMode="numeric" placeholder="1234 5678 9012 3456"
                maxLength={19} onInput={fmtCard} disabled={processing} style={inpMono} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
              <div>
                <label style={lbl}>Expiration</label>
                <input ref={expRef} type="text" inputMode="numeric" placeholder="MM / AA"
                  maxLength={7} onInput={fmtExp} disabled={processing} style={inpMono} />
              </div>
              <div>
                <label style={lbl}>CVV</label>
                <input ref={cvcRef} type="password" inputMode="numeric" placeholder="•••"
                  maxLength={4} disabled={processing} style={inpMono} />
              </div>
            </div>

            {/* ── Billing address ── */}
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>
              Adresse de facturation
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={lbl}>Prénom</label>
                <input type="text" placeholder="Jean" value={bill.firstName} disabled={processing}
                  onChange={e => setField('firstName', e.target.value)} style={inp} />
              </div>
              <div>
                <label style={lbl}>Nom</label>
                <input type="text" placeholder="Dupont" value={bill.lastName} disabled={processing}
                  onChange={e => setField('lastName', e.target.value)} style={inp} />
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={lbl}>Adresse</label>
              <input type="text" placeholder="123 rue Principale" value={bill.address} disabled={processing}
                onChange={e => setField('address', e.target.value)} style={inp} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 18 }}>
              <div>
                <label style={lbl}>Ville</label>
                <input type="text" placeholder="Montréal" value={bill.city} disabled={processing}
                  onChange={e => setField('city', e.target.value)} style={inp} />
              </div>
              <div>
                <label style={lbl}>Province</label>
                <select value={bill.province} disabled={processing}
                  onChange={e => setField('province', e.target.value)}
                  style={{ ...inp, appearance: 'none', backgroundImage: 'none' }}>
                  {['AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Code postal</label>
                <input type="text" placeholder="H1A 1A1" value={bill.zip} disabled={processing}
                  onChange={e => setField('zip', e.target.value.toUpperCase())} style={{ ...inp, fontFamily: 'ui-monospace, monospace' }} />
              </div>
            </div>

            {err && (
              <div style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
                {err}
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={processing}
              style={{ width: '100%', padding: '13px 0', background: processing ? '#d1d5db' : 'linear-gradient(90deg,#00B4D8,#1B4FD8)', color: 'white', fontWeight: 700, fontSize: 15, border: 'none', borderRadius: 12, cursor: processing ? 'not-allowed' : 'pointer', transition: 'opacity .15s' }}
            >
              {processing ? 'Traitement…' : (
                currency !== 'CAD' && amountOriginal != null
                  ? `Payer ${Number(amountOriginal).toFixed(2)} ${currency} (${Number(amountCad).toFixed(2)} CAD)`
                  : `Payer ${Number(amountCad).toFixed(2)} CAD`
              )}
            </button>

            <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
              Vos données bancaires ne transitent pas par nos serveurs.<br />
              Chiffrement SSL · Authorize.net
            </div>
          </>
        )}
      </div>
    </div>
  );
}
