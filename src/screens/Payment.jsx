'use client';
import { useState, useEffect, useRef } from 'react';
import { useAdminT } from '../lib/useAdminT.js';
import { useCurrency } from '../lib/useCurrency.js';
import '@/src/styles/tokens.css';

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

function CardForm({ token, amountCad, onPaid }) {
  const [gateway,    setGateway]    = useState(null);
  const [loadErr,    setLoadErr]    = useState('');
  const [ready,      setReady]      = useState(false);
  const [processing, setProcessing] = useState(false);
  const [err,        setErr]        = useState('');
  const cardRef = useRef(null);
  const expRef  = useRef(null);
  const cvcRef  = useRef(null);

  useEffect(() => {
    fetch('/api/public/payment-gateway').then(r => r.json()).then(async d => {
      if (!d.enabled) { setLoadErr('non-configuré'); return; }
      setGateway(d);
      await loadScript(ACCEPT_JS[d.environment] ?? ACCEPT_JS.sandbox);
      setReady(true);
    }).catch(() => setLoadErr('erreur réseau'));
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
    const cardNumber = cardRef.current?.value?.replace(/\s/g, '') ?? '';
    const exp        = expRef.current?.value ?? '';
    const cvv        = cvcRef.current?.value ?? '';
    const [expMonth, expYear] = exp.split('/').map(s => s.trim());

    if (!cardNumber || cardNumber.length < 13) { setErr('Numéro de carte invalide.'); return; }
    if (!expMonth || !expYear)                 { setErr("Date d'expiration invalide."); return; }
    if (!cvv)                                  { setErr('CVV requis.'); return; }

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
        const res = await fetch(`/api/public/payment/${token}/charge`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ opaqueData: response.opaqueData }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          setErr(json.error ?? 'Paiement refusé.');
          setProcessing(false);
          return;
        }
        onPaid(json);
      } catch {
        setErr('Erreur réseau. Réessayez.');
        setProcessing(false);
      }
    });
  };

  if (loadErr) return null; // if gateway not configured, don't show the form

  const inp = {
    display: 'block', width: '100%', boxSizing: 'border-box',
    padding: '11px 13px', borderRadius: 10,
    border: '1.5px solid var(--border)', background: 'white',
    fontSize: 15, color: '#111827', fontFamily: 'ui-monospace, monospace',
    outline: 'none', marginTop: 5,
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        💳 Payer par carte bancaire
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ok-700)', background: 'var(--ok-50)', border: '1px solid var(--ok-200)', borderRadius: 99, padding: '3px 10px' }}>Recommandé</span>
      </div>

      <div style={{ background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 14, padding: '20px 20px 16px' }}>
        <div style={{ fontSize: 11, color: '#6b7280', display: 'flex', gap: 6, alignItems: 'center', marginBottom: 16 }}>
          🔒 Paiement sécurisé · Authorize.net · Visa · Mastercard · Amex
        </div>

        {!ready ? (
          <div style={{ fontSize: 13, color: '#9ca3af', padding: '8px 0' }}>Chargement du module de paiement…</div>
        ) : (
          <>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Numéro de carte</label>
              <input ref={cardRef} type="text" inputMode="numeric" placeholder="1234 5678 9012 3456" maxLength={19} onInput={fmtCard} disabled={processing} style={inp} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Expiration</label>
                <input ref={expRef} type="text" inputMode="numeric" placeholder="MM / AA" maxLength={7} onInput={fmtExp} disabled={processing} style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>CVV</label>
                <input ref={cvcRef} type="password" inputMode="numeric" placeholder="•••" maxLength={4} disabled={processing} style={inp} />
              </div>
            </div>
            {err && (
              <div style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>{err}</div>
            )}
            <button
              onClick={handlePay}
              disabled={processing}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 12,
                background: processing ? '#d1d5db' : 'linear-gradient(90deg,#00B4D8,#1B4FD8)',
                color: 'white', fontWeight: 700, fontSize: 15,
                border: 'none', cursor: processing ? 'not-allowed' : 'pointer',
              }}>
              {processing ? 'Traitement en cours…' : `Payer ${Number(amountCad).toLocaleString('fr')} CAD par carte`}
            </button>
            <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
              Vos données bancaires ne transitent pas par nos serveurs · Chiffrement SSL
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0 4px', color: '#9ca3af', fontSize: 12 }}>
        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        <span>ou payer par Interac ci-dessous</span>
        <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
      </div>
    </div>
  );
}

export default function PaymentScreen({ token }) {
  const { data: session, status } = useSession();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [paidResult, setPaidResult] = useState(null);

  useEffect(() => {
    if (!token) { setError('Lien de paiement invalide.'); setLoading(false); return; }
    fetch('/api/public/payment/' + token)
      .then(r => r.json())
      .then(json => {
        if (json.error) setError(json.error);
        else {
          setData(json);
          if (json.paymentStatus === 'completed') setPaidResult({ alreadyPaid: true });
        }
        setLoading(false);
      })
      .catch(() => { setError('Erreur réseau. Réessayez.'); setLoading(false); });
  }, [token]);

  if (status === 'loading' || loading) return <Shell><Spinner /></Shell>;

  if (status === 'unauthenticated') {
    return (
      <Shell>
        <div style={centerCard}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🔒</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#111827', marginBottom: 8 }}>
            Connexion requise
          </div>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 1.6 }}>
            Ce lien de paiement est réservé aux clients Jumla Cargo.<br />
            Connectez-vous pour accéder à votre paiement.
          </div>
          <button
            onClick={() => signIn(undefined, { callbackUrl: `/payer/${token}` })}
            style={brandBtn}>
            Se connecter →
          </button>
        </div>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <div style={centerCard}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#dc2626', marginBottom: 8 }}>Lien invalide</div>
          <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{error}</div>
        </div>
      </Shell>
    );
  }

  if (paidResult?.alreadyPaid) {
    return (
      <Shell>
        <div style={centerCard}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--ok-100)', color: 'var(--ok-700)', display: 'grid', placeItems: 'center', fontSize: 24, margin: '0 auto 16px' }}>✓</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#111827', marginBottom: 8 }}>Colis déjà payé</div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Ce colis a déjà été réglé. Aucun paiement supplémentaire n'est requis.</div>
        </div>
      </Shell>
    );
  }

  if (paidResult) {
    return (
      <Shell>
        <div style={centerCard}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--ok-100)', color: 'var(--ok-700)', display: 'grid', placeItems: 'center', fontSize: 24, margin: '0 auto 16px' }}>✓</div>
          <div style={{ fontWeight: 700, fontSize: 20, color: '#111827', marginBottom: 8 }}>
            {paidResult.method === 'card' ? 'Paiement accepté' : 'Virement enregistré'}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 16 }}>
            {paidResult.method === 'card'
              ? <span>Votre paiement par carte pour <strong>{data?.trackingCode}</strong> a été traité avec succès.</span>
              : <span>Merci ! Nous avons enregistré votre confirmation de virement pour <strong>{data?.trackingCode}</strong>. Notre équipe vérifiera sous 24h.</span>
            }
          </div>
        )}
        {!loading && data && (
          confirmed
            ? <ConfirmationView data={data} cardPaid={confirmed?.card} />
            : <PaymentView data={data} token={token} onConfirm={handleConfirm} onCardPaid={result => setConfirmed({ card: result })} />
        )}
      </main>

/* ── Shell — header + footer wrapper ────────────────────── */
function Shell({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#00B4D8,#1B4FD8)', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 800, fontSize: 16 }}>J</div>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Jumla Cargo</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280', fontWeight: 500 }}>
          <span style={{ fontSize: 14 }}>🔒</span> Paiement sécurisé · SSL
        </div>
      </header>
      <main style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 'clamp(24px,4vh,48px) 16px' }}>
        {children}
      </main>
      <footer style={{ textAlign: 'center', padding: '16px 24px', fontSize: 12, color: '#9ca3af', borderTop: '1px solid #f3f4f6' }}>
        © 2026 Jumla Shipping Inc. · Douala · Montréal · Lagos · Bruxelles
      </footer>
    </div>
  );
}

function PaymentView({ data, token, onConfirm, onCardPaid }) {
  const t = useAdminT();
  const { currency } = useCurrency();
  const [acknowledged, setAcknowledged] = useState(false);
  const [paymentEmail, setPaymentEmail] = useState('incjumla@gmail.com');
  useEffect(() => {
    fetch('/api/public/config').then(r => r.json()).then(d => {
      if (d.paymentEmail) setPaymentEmail(d.paymentEmail);
    }).catch(() => {});
  }, []);

  return (
    <div style={{ width: '100%', maxWidth: 900, display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
      <style>{`
        @media (max-width: 720px) {
          .pay-grid-wrap { grid-template-columns: 1fr !important; }
          .pay-summary-col { order: -1; }
        }
        .pay-input:focus { border-color: #1B4FD8 !important; box-shadow: 0 0 0 3px rgba(27,79,216,.08); }
        .pay-tab { cursor: pointer; padding: 10px 16px; border: 1.5px solid #e5e7eb; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #374151; background: white; flex: 1; transition: all .15s; }
        .pay-tab.active { border-color: #1B4FD8; background: #eff6ff; color: #1B4FD8; }
        .pay-tab:not(.active):hover { border-color: #d1d5db; background: #f9fafb; }
      `}</style>

      {/* ── Left: Form ──────────────────────────────────────── */}
      <div className="pay-grid-wrap" style={{ display: 'contents' }}>
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e5e7eb', padding: '28px 28px 24px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>

        {/* Billed to */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8 }}>Facturé à</div>
          <div style={{ padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#f9fafb' }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{data.clientName}</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{data.clientPhone ?? data.clientEmail}</div>
          </div>
        </div>

        {/* Method tabs */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 10 }}>Détails de paiement</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={'pay-tab' + (method === 'card' ? ' active' : '')} onClick={() => setMethod('card')}>
              <span style={{ fontSize: 16 }}>💳</span> Carte
            </button>
            <button className={'pay-tab' + (method === 'interac' ? ' active' : '')} onClick={() => setMethod('interac')}>
              <span style={{ fontSize: 16 }}>🏦</span> Interac
            </button>
          </div>
        </div>

        {method === 'card'
          ? <CardFields token={token} amountCad={data.amount} onPaid={onPaid} />
          : <InteracFields data={data} token={token} onPaid={onPaid} />
        }
      </div>

      {/* Right: card form + summary */}
      <div>
        {/* Card payment — shown if gateway configured */}
        <CardForm token={token} amountCad={data.amount} onPaid={onCardPaid} />

        <div className="pay-summary">
          {/* TODO: no translation key for 'Récapitulatif du colis' */}
          <div className="pay-summary__head">Récapitulatif du colis</div>

          <div className="pay-summary__section">
            {/* TODO: using t.payments.table.client as closest match for 'Client' label */}
            <div className="pay-summary__label">{t.payments.table.client}</div>
            <div className="pay-summary__value">{data.clientName}</div>
            <div className="pay-summary__sub">{data.clientPhone}{data.clientCity ? ' · ' + data.clientCity : ''}</div>
          </div>
        </div>
        <div style={{ padding: '16px 22px', background: '#f9fafb', fontSize: 11, color: '#9ca3af', lineHeight: 1.6 }}>
          🔒 Paiement sécurisé · Données chiffrées SSL · Authorize.net
        </div>
      </div>
      </div>
    </div>
  );
}

/* ── Summary row ─────────────────────────────────────────── */
function Row({ label, value, sub }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

/* ── Card payment fields ─────────────────────────────────── */
function CardFields({ token, amountCad, onPaid }) {
  const [gateway, setGateway]     = useState(null);
  const [gwErr,   setGwErr]       = useState('');
  const [ready,   setReady]       = useState(false);
  const [err,     setErr]         = useState('');
  const [busy,    setBusy]        = useState(false);
  const numRef = useRef(); const expRef = useRef(); const cvcRef = useRef();

  useEffect(() => {
    fetch('/api/public/payment-gateway').then(r => r.json()).then(async d => {
      if (!d.enabled) { setGwErr('Le paiement par carte n\'est pas encore disponible.'); return; }
      setGateway(d);
      await loadScript(ACCEPT_JS_SRC[d.environment] ?? ACCEPT_JS_SRC.sandbox);
      setReady(true);
    }).catch(() => setGwErr('Impossible de charger le module de paiement.'));
  }, []);

  const fmtNum = e => {
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
    const cardNumber = numRef.current?.value?.replace(/\s/g, '') ?? '';
    const [expM, expY] = (expRef.current?.value ?? '').split('/').map(s => s.trim());
    const cvv = cvcRef.current?.value ?? '';
    if (cardNumber.length < 13) { setErr('Numéro de carte invalide.'); return; }
    if (!expM || !expY) { setErr("Date d'expiration invalide."); return; }
    if (!cvv) { setErr('CVV requis.'); return; }

    setBusy(true);
    window.Accept.dispatchData({
      authData: { clientKey: gateway.clientKey, apiLoginID: gateway.loginId },
      cardData:  { cardNumber, month: expM.padStart(2,'0'), year: expY.length === 2 ? '20'+expY : expY, cardCode: cvv },
    }, async res => {
      if (res.messages.resultCode === 'Error') {
        setErr(res.messages.message?.[0]?.text ?? 'Erreur carte.');
        setBusy(false); return;
      }
      try {
        const r = await fetch(`/api/public/payment/${token}/charge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ opaqueData: res.opaqueData }),
        });
        const json = await r.json();
        if (!r.ok || !json.ok) { setErr(json.error ?? 'Paiement refusé.'); setBusy(false); return; }
        onPaid({ method: 'card', ...json });
      } catch { setErr('Erreur réseau.'); setBusy(false); }
    });
  };

  if (gwErr) {
    return <div style={{ fontSize: 13, color: '#6b7280', padding: '12px 0', lineHeight: 1.6 }}>{gwErr}</div>;
  }

  if (!ready) {
    return <div style={{ fontSize: 13, color: '#9ca3af', padding: '12px 0' }}>Chargement…</div>;
  }

  return (
    <div>
      {/* Card number */}
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Numéro de carte</label>
        <div style={{ position: 'relative' }}>
          <input ref={numRef} type="text" inputMode="numeric" placeholder="1234 5678 9012 3456"
            maxLength={19} onInput={fmtNum} disabled={busy}
            className="pay-input" style={{ ...inputStyle, paddingRight: 100 }} />
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 4 }}>
            <CardBadge label="VISA"   color="#1a1f71" bg="#eef0fb" />
            <CardBadge label="MC"     color="#eb001b" bg="#fff0f0" />
            <CardBadge label="AMEX"   color="#007bc1" bg="#eff7fd" />
          </div>
        </div>
      </div>

      {/* Expiry + CVV */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div>
          <label style={labelStyle}>Expiration</label>
          <input ref={expRef} type="text" inputMode="numeric" placeholder="MM / AA"
            maxLength={7} onInput={fmtExp} disabled={busy}
            className="pay-input" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>CVV</label>
          <input ref={cvcRef} type="password" inputMode="numeric" placeholder="•••"
            maxLength={4} disabled={busy}
            className="pay-input" style={inputStyle} />
        </div>
      </div>

      {err && (
        <div style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>{err}</div>
      )}

      <button onClick={handlePay} disabled={busy} style={{ ...brandBtn, width: '100%', justifyContent: 'center', opacity: busy ? .7 : 1 }}>
        {busy ? 'Traitement…' : `Payer ${Number(amountCad).toLocaleString('fr')} CAD →`}
      </button>

      <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 12, lineHeight: 1.6 }}>
        En soumettant ce formulaire, vous autorisez Jumla Cargo à débiter votre carte du montant indiqué.<br />
        Vos données bancaires sont tokenisées par Authorize.net et ne transitent pas par nos serveurs.
      </div>
    </div>
  );
}

function ConfirmationView({ data, cardPaid }) {
  const t = useAdminT();
  return (
    <div className="pay-confirm">
      <div className="pay-confirm__icon">✓</div>
      <div className="pay-confirm__title">{cardPaid ? 'Paiement accepté' : 'Notification reçue'}</div>
      {cardPaid ? (
        <>
          <div className="pay-confirm__sub">
            Votre paiement par carte pour le colis <strong>{data?.trackingCode}</strong> a été traité avec succès.
          </div>
          <div className="pay-confirm__sub" style={{ marginTop: 6, fontFamily: 'monospace', fontSize: 13, color: '#6b7280' }}>
            {cardPaid.cardType} •••• {cardPaid.last4} · Réf : {cardPaid.transactionId}
          </div>
        </>
      ) : (
        <>
          <div className="pay-confirm__sub">
            Merci ! Nous avons bien enregistré votre confirmation de virement pour le colis{' '}
            <strong>{data?.trackingCode}</strong>.
            Notre équipe vérifiera la réception du paiement et mettra à jour votre dossier sous <strong>24h ouvrées</strong>.
          </div>
          <div className="pay-confirm__sub" style={{ marginTop: 8 }}>
            En cas de question : <strong>info@jumlas.com</strong> ou WhatsApp <strong>+1 514 000 0000</strong>
          </div>
        </>
      )}
    </div>
  );
}

const centerCard = {
  background: 'white', borderRadius: 14, border: '1px solid #e5e7eb',
  padding: '40px 36px', maxWidth: 420, width: '100%', textAlign: 'center',
  boxShadow: '0 1px 3px rgba(0,0,0,.06)',
};

const brandBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '13px 24px', borderRadius: 10,
  background: 'linear-gradient(90deg,#00B4D8,#1B4FD8)',
  color: 'white', fontWeight: 700, fontSize: 15,
  border: 'none', cursor: 'pointer',
  fontFamily: "'Inter', system-ui, sans-serif",
};

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5,
};
