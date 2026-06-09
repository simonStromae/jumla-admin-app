'use client';
import { useState, useEffect } from 'react';
import '@/src/styles/tokens.css';
import '@/src/styles/payment.css';

export default function PaymentScreen({ token }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!token) { setError('Lien invalide.'); setLoading(false); return; }
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
      .catch(() => { setError('Erreur réseau — réessayez.'); setLoading(false); });
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
          <div className="pay-header__badge">Paiement sécurisé</div>
        </div>
      </header>

      <main className="pay-main">
        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--ink-400)', fontSize: 14 }}>
            Chargement…
          </div>
        )}
        {!loading && error && (
          <div style={{ maxWidth: 480, margin: '60px auto', padding: '24px 28px', background: 'var(--bad-50)', border: '1px solid var(--bad-100)', borderRadius: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--bad-700)', marginBottom: 8 }}>Lien invalide</div>
            <div style={{ fontSize: 13, color: 'var(--bad-600)' }}>{error}</div>
          </div>
        )}
        {!loading && data && (
          confirmed
            ? <ConfirmationView data={data} />
            : <PaymentView data={data} onConfirm={handleConfirm} />
        )}
      </main>

      <footer className="pay-footer">
        <span>© 2026 Jumla Shipping SARL</span>
        <span>Douala · Montréal · Lagos · Bruxelles</span>
      </footer>
    </div>
  );
}

function PaymentView({ data, onConfirm }) {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div className="pay-grid">
      {/* Left: instructions */}
      <div className="pay-card">
        <div className="pay-card__head">Comment effectuer votre paiement</div>
        <div className="pay-card__body">
          <div className="pay-step">
            <div className="pay-step__num">1</div>
            <div>
              <div className="pay-step__title">Ouvrez votre application bancaire</div>
              <div className="pay-step__sub">Toute banque canadienne supporte le virement Interac e-Transfert.</div>
            </div>
          </div>
          <div className="pay-step">
            <div className="pay-step__num">2</div>
            <div>
              <div className="pay-step__title">Envoyez le montant exact</div>
              <div className="pay-step__sub">Le montant doit être exact. En cas de doute, contactez-nous avant d'envoyer.</div>
            </div>
          </div>
          <div className="pay-step">
            <div className="pay-step__num">3</div>
            <div>
              <div className="pay-step__title">Utilisez la bonne adresse de contact</div>
              <div className="pay-step__sub">
                Votre compte bancaire doit avoir l'e-mail ou le téléphone ci-dessous. Sinon, le paiement ne pourra pas être identifié.
              </div>
            </div>
          </div>

          <div className="pay-interac-box">
            <div className="pay-interac-box__title">Envoyez votre Interac à</div>
            <div className="pay-interac-box__contact">paiement@jumla.cargo</div>
            <div className="pay-interac-box__or">ou</div>
            <div className="pay-interac-box__contact">+1 514 000 0000</div>
          </div>

          <div className="pay-warn-box">
            <div className="pay-warn-box__icon">!</div>
            <div>
              <div className="pay-warn-box__title">Important — correspondance obligatoire</div>
              <div className="pay-warn-box__text">
                Le numéro de téléphone ou l'adresse e-mail associé à votre compte Interac doit correspondre exactement à celui enregistré dans notre système :
                <span className="pay-warn-box__phone">{data.clientPhone ?? data.clientEmail}</span>
                Si ce n'est pas le cas, votre paiement ne pourra pas être automatiquement attribué à votre dossier. Contactez-nous.
              </div>
            </div>
          </div>

          <div className="pay-message-hint">
            <strong>Message de transfert :</strong> Indiquez le code colis <span className="mono" style={{ fontWeight: 700 }}>{data.trackingCode}</span> dans le message Interac pour faciliter le traitement.
          </div>
        </div>
      </div>

      {/* Right: summary */}
      <div>
        <div className="pay-summary">
          <div className="pay-summary__head">Récapitulatif du colis</div>

          <div className="pay-summary__section">
            <div className="pay-summary__label">Client</div>
            <div className="pay-summary__value">{data.clientName}</div>
            <div className="pay-summary__sub">{data.clientPhone}{data.clientCity ? ' · ' + data.clientCity : ''}</div>
          </div>

          <div className="pay-summary__section">
            <div className="pay-summary__label">Cargaison</div>
            <div className="pay-summary__value">{data.campaign.code}</div>
            <div className="pay-summary__sub">{data.campaign.from} → {data.campaign.to}</div>
          </div>

          {data.description && (
            <div className="pay-summary__section">
              <div className="pay-summary__label">Contenu</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-700)', lineHeight: 1.5 }}>{data.description}</div>
              {data.weightKg && (
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--ink-500)' }}>
                  Poids : <strong>{data.weightKg} kg</strong>
                </div>
              )}
            </div>
          )}

          <div className="pay-summary__total">
            <span className="pay-summary__total-label">Total à payer</span>
            <span className="pay-summary__total-amount">
              {data.amount.toLocaleString('fr')} <span style={{ fontSize: 14, color: 'var(--ink-400)', fontWeight: 500 }}>CAD</span>
            </span>
          </div>
        </div>

        <label className="pay-acknowledge">
          <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} />
          <span>
            J'ai lu les instructions et je confirme que mon compte Interac est bien associé à{' '}
            <strong>{data.clientPhone ?? data.clientEmail}</strong>
          </span>
        </label>

        <button
          className={'pay-cta' + (acknowledged ? ' pay-cta--active' : '')}
          disabled={!acknowledged}
          onClick={onConfirm}
        >
          J'ai effectué mon virement Interac
        </button>

        <div className="pay-support">
          Besoin d'aide ? Contactez-nous sur WhatsApp :<br />
          <strong>+1 514 000 0000</strong> (Montréal) · <strong>+237 6XX XX XX XX</strong> (Douala)
        </div>
      </div>
    </div>
  );
}

function ConfirmationView({ data }) {
  return (
    <div className="pay-confirm">
      <div className="pay-confirm__icon">✓</div>
      <div className="pay-confirm__title">Notification reçue</div>
      <div className="pay-confirm__sub">
        Merci ! Nous avons bien enregistré votre confirmation de virement pour le colis{' '}
        <strong>{data?.trackingCode}</strong>.
        Notre équipe vérifiera la réception du paiement et mettra à jour votre dossier sous <strong>24h ouvrées</strong>.
      </div>
      <div className="pay-confirm__sub" style={{ marginTop: 8 }}>
        En cas de question : <strong>contact@jumla.cargo</strong> ou WhatsApp <strong>+1 514 000 0000</strong>
      </div>
    </div>
  );
}
