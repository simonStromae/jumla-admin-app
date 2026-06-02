'use client';
import { useState } from 'react';
import { DATA } from '../data.js';
import '@/src/styles/tokens.css';
import '@/src/styles/payment.css';

/* Token format (mock): pay-<parcelId>-<random> */
function resolveParcel(token) {
  if (!token) return DATA.PARCELS[0];
  const parts = token.split('-');
  if (parts.length >= 2) {
    const parcelId = parts[1];
    const found = DATA.PARCELS.find(p => p.id === parcelId);
    if (found) return found;
  }
  return DATA.PARCELS[0];
}

const ARTICLES = [
  { name: '2 valises — vêtements adulte', packs: 2, pieces: 2 },
  { name: 'Carton — ndolè, épices, café', packs: 1, pieces: 8 },
];

export default function PaymentScreen({ token }) {
  const parcel = resolveParcel(token);
  const deliveryFee = parcel.delivery === 'home' ? 25 : 0;
  const overrunFee = parcel.overrun ? (parcel.actualKg - parcel.reservedKg) * 22 : 0;
  const [confirmed, setConfirmed] = useState(false);

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
        {confirmed ? (
          <ConfirmationView parcel={parcel} />
        ) : (
          <PaymentView parcel={parcel} deliveryFee={deliveryFee} overrunFee={overrunFee} onConfirm={() => setConfirmed(true)} />
        )}
      </main>

      <footer className="pay-footer">
        <span>© 2026 Jumla Shipping SARL</span>
        <span>Douala · Montréal · Lagos · Bruxelles</span>
      </footer>
    </div>
  );
}

function PaymentView({ parcel, deliveryFee, overrunFee, onConfirm }) {
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
                <span className="pay-warn-box__phone">{parcel.recipPhone}</span>
                Si ce n'est pas le cas, votre paiement ne pourra pas être automatiquement attribué à votre dossier. Contactez-nous.
              </div>
            </div>
          </div>

          <div className="pay-message-hint">
            <strong>Message de transfert :</strong> Indiquez le code colis <span className="mono" style={{ fontWeight: 700 }}>{parcel.code}</span> dans le message Interac pour faciliter le traitement.
          </div>
        </div>
      </div>

      {/* Right: summary */}
      <div>
        <div className="pay-summary">
          <div className="pay-summary__head">Récapitulatif du colis</div>

          <div className="pay-summary__section">
            <div className="pay-summary__label">Expéditeur</div>
            <div className="pay-summary__value">{parcel.senderName}</div>
            <div className="pay-summary__sub">{parcel.senderPhone} · Douala, Cameroun</div>
          </div>

          <div className="pay-summary__section">
            <div className="pay-summary__label">Destinataire</div>
            <div className="pay-summary__value">{parcel.recipName}</div>
            <div className="pay-summary__sub">{parcel.recipPhone} · {parcel.recipCity}, Canada</div>
          </div>

          <div className="pay-summary__section">
            <div className="pay-summary__label">Contenu</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-700)', lineHeight: 1.5 }}>{parcel.contents}</div>
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--ink-500)' }}>
              Poids : <strong>{parcel.actualKg} kg</strong> ·
              Livraison : <strong>{parcel.delivery === 'home' ? 'Domicile' : 'Retrait entrepôt'}</strong>
            </div>
          </div>

          <div className="pay-summary__section">
            <div className="pay-summary__label">Détail des frais</div>
            <div className="pay-lines">
              <PayLine l={'Fret ' + parcel.actualKg + ' kg × 18 CAD'} v={Math.round(parcel.actualKg * 18)} />
              {overrunFee > 0 && <PayLine l={'Dépassement ×22 CAD'} v={overrunFee} />}
              {deliveryFee > 0 && <PayLine l="Livraison à domicile" v={deliveryFee} />}
            </div>
          </div>

          <div className="pay-summary__total">
            <span className="pay-summary__total-label">Total à payer</span>
            <span className="pay-summary__total-amount">{parcel.amount} <span style={{ fontSize: 14, color: 'var(--ink-400)', fontWeight: 500 }}>CAD</span></span>
          </div>
        </div>

        <label className="pay-acknowledge">
          <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} />
          <span>J'ai lu les instructions et je confirme que mon compte Interac est bien associé au numéro <strong>{parcel.recipPhone}</strong></span>
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

function ConfirmationView({ parcel }) {
  return (
    <div className="pay-confirm">
      <div className="pay-confirm__icon">✓</div>
      <div className="pay-confirm__title">Notification reçue</div>
      <div className="pay-confirm__sub">
        Merci ! Nous avons bien enregistré votre confirmation de virement pour le colis <strong>{parcel.code}</strong>.
        Notre équipe vérifiera la réception du paiement et mettra à jour votre dossier sous <strong>24h ouvrées</strong>.
      </div>
      <div className="pay-confirm__sub" style={{ marginTop: 8 }}>
        En cas de question : <strong>contact@jumla.cargo</strong> ou WhatsApp <strong>+1 514 000 0000</strong>
      </div>
    </div>
  );
}

function PayLine({ l, v }) {
  return (
    <div className="pay-line">
      <span>{l}</span>
      <span className="mono" style={{ fontWeight: 600 }}>{v} CAD</span>
    </div>
  );
}
