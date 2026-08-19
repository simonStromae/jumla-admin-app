'use client';
import { useState, useEffect, useRef } from 'react';
import { useAdminT } from '../lib/useAdminT.js';
import { useCurrency } from '../lib/useCurrency.js';
import '@/src/styles/tokens.css';
import '@/src/styles/payment.css';

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
  const t = useAdminT();
  const { currency } = useCurrency();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!token) { setError(t.common.error); setLoading(false); return; } // TODO: was 'Lien invalide.' — using t.common.error as close match
    fetch('/api/public/payment/' + token)
      .then(r => r.json())
      .then(json => {
        if (json.error) { setError(json.error); }
        else {
          setData(json);
          if (json.paymentStatus === 'completed') setConfirmed(true);
        }
        setLoading(false);
      })
      .catch(() => { setError(t.common.networkError); setLoading(false); });
  }, [token]);

  const handleConfirm = async () => {
    await fetch('/api/public/payment/' + token, { method: 'POST' });
    setConfirmed(true);
  };

  return (
    <div className="pay-wrap">
      <header className="pay-header">
        <div className="pay-header__inner">
          <div className="pay-brand">
            <div className="pay-brand__mark">J</div>
            Jumla Shipping
          </div>
          {/* TODO: no translation key for 'Paiement sécurisé' */}
          <div className="pay-header__badge">Paiement sécurisé</div>
        </div>
      </header>

      <main className="pay-main">
        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--ink-400)', fontSize: 14 }}>
            {t.common.loading}
          </div>
        )}
        {!loading && error && (
          <div style={{ maxWidth: 480, margin: '60px auto', padding: '24px 28px', background: 'var(--bad-50)', border: '1px solid var(--bad-100)', borderRadius: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            {/* TODO: was 'Lien invalide' — using t.common.error as close match */}
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--bad-700)', marginBottom: 8 }}>{t.common.error}</div>
            <div style={{ fontSize: 13, color: 'var(--bad-600)' }}>{error}</div>
          </div>
        )}
        {!loading && data && (
          confirmed
            ? <ConfirmationView data={data} cardPaid={confirmed?.card} />
            : <PaymentView data={data} token={token} onConfirm={handleConfirm} onCardPaid={result => setConfirmed({ card: result })} />
        )}
      </main>

      <footer className="pay-footer">
        <span>© 2026 Jumla Shipping Inc.</span>
        <span>Douala · Montréal · Lagos · Bruxelles</span>
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
    <div className="pay-grid">
      {/* Left: instructions */}
      <div className="pay-card">
        {/* TODO: no translation key for 'Comment effectuer votre paiement' */}
        <div className="pay-card__head">Comment effectuer votre paiement</div>
        <div className="pay-card__body">
          <div className="pay-step">
            <div className="pay-step__num">1</div>
            <div>
              {/* TODO: no translation key for 'Ouvrez votre application bancaire' */}
              <div className="pay-step__title">Ouvrez votre application bancaire</div>
              {/* TODO: no translation key for step 1 subtitle */}
              <div className="pay-step__sub">Toute banque canadienne supporte le virement Interac e-Transfert.</div>
            </div>
          </div>
          <div className="pay-step">
            <div className="pay-step__num">2</div>
            <div>
              {/* TODO: no translation key for 'Envoyez le montant exact' */}
              <div className="pay-step__title">Envoyez le montant exact</div>
              {/* TODO: no translation key for step 2 subtitle */}
              <div className="pay-step__sub">Le montant doit être exact. En cas de doute, contactez-nous avant d'envoyer.</div>
            </div>
          </div>
          <div className="pay-step">
            <div className="pay-step__num">3</div>
            <div>
              {/* TODO: no translation key for 'Utilisez la bonne adresse de contact' */}
              <div className="pay-step__title">Utilisez la bonne adresse de contact</div>
              {/* TODO: no translation key for step 3 subtitle */}
              <div className="pay-step__sub">
                Votre compte bancaire doit avoir l'e-mail ou le téléphone ci-dessous. Sinon, le paiement ne pourra pas être identifié.
              </div>
            </div>
          </div>

          <div className="pay-interac-box">
            {/* TODO: no translation key for 'Envoyez votre Interac à' */}
            <div className="pay-interac-box__title">Envoyez votre Interac à</div>
            <div className="pay-interac-box__contact">{paymentEmail}</div>
            {/* TODO: no translation key for 'ou' */}
            <div className="pay-interac-box__or">ou</div>
            <div className="pay-interac-box__contact">+1 514 000 0000</div>
          </div>

          <div className="pay-warn-box">
            <div className="pay-warn-box__icon">!</div>
            <div>
              {/* TODO: no translation key for 'Important — correspondance obligatoire' */}
              <div className="pay-warn-box__title">Important — correspondance obligatoire</div>
              {/* TODO: no translation key for warn box body text */}
              <div className="pay-warn-box__text">
                Le numéro de téléphone ou l'adresse e-mail associé à votre compte Interac doit correspondre exactement à celui enregistré dans notre système :
                <span className="pay-warn-box__phone">{data.clientPhone ?? data.clientEmail}</span>
                Si ce n'est pas le cas, votre paiement ne pourra pas être automatiquement attribué à votre dossier. Contactez-nous.
              </div>
            </div>
          </div>

          {/* TODO: no translation key for 'Message de transfert' hint */}
          <div className="pay-message-hint">
            <strong>Message de transfert :</strong> Indiquez le code colis <span className="mono" style={{ fontWeight: 700 }}>{data.trackingCode}</span> dans le message Interac pour faciliter le traitement.
          </div>
        </div>
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

          <div className="pay-summary__section">
            {/* TODO: no translation key for 'Cargaison' */}
            <div className="pay-summary__label">Cargaison</div>
            <div className="pay-summary__value">{data.campaign.code}</div>
            <div className="pay-summary__sub">{data.campaign.from} → {data.campaign.to}</div>
          </div>

          {data.description && (
            <div className="pay-summary__section">
              {/* TODO: using t.common.description as close match for 'Contenu' */}
              <div className="pay-summary__label">{t.common.description}</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-700)', lineHeight: 1.5 }}>{data.description}</div>
              {data.weightKg && (
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--ink-500)' }}>
                  {t.common.weight} : <strong>{data.weightKg} kg</strong>
                </div>
              )}
            </div>
          )}

          <div className="pay-summary__total">
            <span className="pay-summary__total-label">{t.common.total}</span>
            <span className="pay-summary__total-amount">
              {data.amount.toLocaleString('fr')} <span style={{ fontSize: 14, color: 'var(--ink-400)', fontWeight: 500 }}>{currency}</span>
            </span>
          </div>
        </div>

        <label className="pay-acknowledge">
          <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} />
          {/* TODO: no translation key for acknowledgement text */}
          <span>
            J'ai lu les instructions et je confirme que mon compte Interac est bien associé à{' '}
            <strong>{data.clientPhone ?? data.clientEmail}</strong>
          </span>
        </label>

        {/* TODO: no translation key for 'J'ai effectué mon virement Interac' — using t.payments.sendInterac as close match */}
        <button
          className={'pay-cta' + (acknowledged ? ' pay-cta--active' : '')}
          disabled={!acknowledged}
          onClick={onConfirm}
        >
          {'Payer par Interac'}
        </button>

        {/* TODO: no translation key for support/help text */}
        <div className="pay-support">
          Besoin d'aide ? Contactez-nous sur WhatsApp :<br />
          <strong>+1 514 000 0000</strong> (Montréal) · <strong>+237 6XX XX XX XX</strong> (Douala)
        </div>
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
