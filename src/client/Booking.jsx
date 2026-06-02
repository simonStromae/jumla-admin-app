'use client';
import { useState } from 'react';
import I from '../components/Icons.jsx';
import '@/src/styles/booking.css';

const ROUTES_DATA = [
  { id: 'dla-yul', label: 'Douala → Montréal', code: 'DLA → YUL', base: 18, currency: 'CAD', transit: 14 },
  { id: 'yul-dla', label: 'Montréal → Douala', code: 'YUL → DLA', base: 16, currency: 'CAD', transit: 14 },
];

const CATS = [
  { id: 'clothing',    label: 'Vêtements & textiles',   icon: '👗', surcharge: 0 },
  { id: 'food',        label: 'Épices & denrées sèches', icon: '🌿', surcharge: 2 },
  { id: 'electronics', label: 'Électronique',            icon: '💻', surcharge: 5 },
  { id: 'cosmetics',   label: 'Cosmétiques',             icon: '💄', surcharge: 3 },
  { id: 'documents',   label: 'Documents',               icon: '📄', surcharge: 0 },
  { id: 'other',       label: 'Autre',                   icon: '📦', surcharge: 1 },
];

const STEPS = [
  {
    label: 'Route',
    title: 'Votre Itinéraire',
    question: 'Choisissez votre route',
    desc: 'Sélectionnez la direction de votre envoi. Nous opérons sur les axes Douala–Montréal et Montréal–Douala via fret aérien.',
    tip: 'Jumla Shipping utilise exclusivement le fret aérien pour garantir des délais fiables — votre colis arrive en 14 jours ouvrés.',
    icon: '✈️',
  },
  {
    label: 'Expéditeur',
    title: "L'Expéditeur",
    question: "Informations de l'expéditeur",
    desc: 'Renseignez les coordonnées de la personne qui remet le colis au point de départ.',
    tip: 'Vos données personnelles sont chiffrées et ne sont jamais partagées avec des tiers.',
    icon: '👤',
  },
  {
    label: 'Destinataire',
    title: 'Le Destinataire',
    question: 'Informations du destinataire',
    desc: 'Renseignez les coordonnées de la personne qui recevra le colis à destination.',
    tip: 'Nous livrons actuellement à Montréal, Laval, Longueuil, Gatineau, Québec et Toronto.',
    icon: '📍',
  },
  {
    label: 'Colis',
    title: 'Votre Colis',
    question: 'Contenu et poids du colis',
    desc: 'Décrivez ce que vous envoyez pour obtenir une tarification précise et conforme aux règles douanières.',
    tip: 'Certains articles sont soumis à des restrictions douanières. Contactez notre équipe pour toute question.',
    icon: '📦',
  },
];

export default function BookingScreen({ onNav }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    route: 'dla-yul',
    senderName: '', senderPhone: '', senderEmail: '',
    recipName: '', recipPhone: '', recipCity: 'Montréal',
    delivery: 'pickup',
    weight: '', category: 'clothing', items: '',
  });

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const route = ROUTES_DATA.find(r => r.id === form.route);
  const cat = CATS.find(c => c.id === form.category);
  const w = parseFloat(form.weight) || 0;
  const price = w * (route.base + (cat?.surcharge || 0));
  const deliveryFee = form.delivery === 'home' ? 25 : 0;
  const total = price + deliveryFee;
  const isDone = step === STEPS.length;

  const si = STEPS[Math.min(step, STEPS.length - 1)];

  return (
    <div className="bwrap">

      {/* ── LEFT SIDEBAR ── */}
      <aside className="bside">
        <button className="bside__logo" onClick={() => onNav?.('/')}>
          <span className="bside__logomark">J</span>
          <span className="bside__logoname">Jumla</span>
        </button>

        <div className="bside__pic">{si.icon}</div>

        <div>
          <div className="bside__eyebrow">Étape {Math.min(step + 1, STEPS.length)} sur {STEPS.length}</div>
          <h3 className="bside__title">{si.title}</h3>
          <p className="bside__desc">{si.desc}</p>
        </div>

        <div className="bside__tip">
          <div className="bside__tip-label">Le saviez-vous ?</div>
          <p className="bside__tip-text">{si.tip}</p>
        </div>

        <div className="bside__contact">
          Questions ?{' '}
          <a href="mailto:support@jumla.ca" className="bside__contact-link">Contacter le support</a>
        </div>
      </aside>

      {/* ── STEP RAIL ── */}
      <div className="brail">
        {STEPS.map((s, i) => (
          <div key={i} className="brail__item">
            {i > 0 && <div className={`brail__line${i <= step ? ' is-done' : ''}`} />}
            <div className={`brail__dot${i === step && !isDone ? ' is-active' : (i < step || isDone) ? ' is-done' : ''}`}>
              {(i < step || isDone) ? '✓' : i + 1}
            </div>
          </div>
        ))}
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="bmain">
        {!isDone ? (
          <>
            <div className="bmain__head">
              <h2 className="bmain__q">{si.question}</h2>
            </div>

            <div className="bmain__body">

              {/* Step 0 — Route */}
              {step === 0 && (
                <div className="bopt-grid bopt-grid--2">
                  {ROUTES_DATA.map(r => (
                    <button
                      key={r.id}
                      className={`bopt-card${form.route === r.id ? ' is-sel' : ''}`}
                      onClick={() => upd('route', r.id)}
                    >
                      <div className="bopt-card__icon">✈️</div>
                      <div className="bopt-card__label">{r.label}</div>
                      <div className="bopt-card__sub">{r.code} · ~{r.transit} jours · dès {r.base} {r.currency}/kg</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 1 — Expéditeur */}
              {step === 1 && (
                <div className="bform">
                  <div className="bform__row bform__row--full">
                    <label className="blabel">Nom complet</label>
                    <input className="binput" value={form.senderName} onChange={e => upd('senderName', e.target.value)} placeholder="Awa Nkemdirim" />
                  </div>
                  <div className="bform__row">
                    <label className="blabel">Téléphone</label>
                    <input className="binput" value={form.senderPhone} onChange={e => upd('senderPhone', e.target.value)} placeholder="+237 6** ** ** **" />
                  </div>
                  <div className="bform__row">
                    <label className="blabel">Email</label>
                    <input className="binput" type="email" value={form.senderEmail} onChange={e => upd('senderEmail', e.target.value)} placeholder="vous@email.com" />
                  </div>
                </div>
              )}

              {/* Step 2 — Destinataire */}
              {step === 2 && (
                <div className="bform">
                  <div className="bform__row bform__row--full">
                    <label className="blabel">Nom complet</label>
                    <input className="binput" value={form.recipName} onChange={e => upd('recipName', e.target.value)} placeholder="Jean Mbarga" />
                  </div>
                  <div className="bform__row">
                    <label className="blabel">Téléphone</label>
                    <input className="binput" value={form.recipPhone} onChange={e => upd('recipPhone', e.target.value)} placeholder="+1 514 *** ****" />
                  </div>
                  <div className="bform__row">
                    <label className="blabel">Ville</label>
                    <select className="bselect" value={form.recipCity} onChange={e => upd('recipCity', e.target.value)}>
                      {['Montréal','Laval','Longueuil','Brossard','Gatineau','Québec','Toronto'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="bform__row bform__row--full">
                    <label className="blabel">Mode de livraison</label>
                    <div className="bopt-grid bopt-grid--2" style={{ marginTop: 8 }}>
                      {[
                        { id: 'pickup', icon: '🏭', label: 'Retrait entrepôt',   sub: 'Lachine, QC — Gratuit' },
                        { id: 'home',   icon: '🚚', label: 'Livraison domicile', sub: 'Québec — +25 CAD' },
                      ].map(d => (
                        <button key={d.id} className={`bopt-card${form.delivery === d.id ? ' is-sel' : ''}`} onClick={() => upd('delivery', d.id)}>
                          <div className="bopt-card__icon">{d.icon}</div>
                          <div className="bopt-card__label">{d.label}</div>
                          <div className="bopt-card__sub">{d.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 — Colis */}
              {step === 3 && (
                <div className="bform">
                  <div className="bform__row">
                    <label className="blabel">Poids estimé (kg)</label>
                    <input className="binput" type="number" min="0" step="0.5" value={form.weight} onChange={e => upd('weight', e.target.value)} placeholder="14" />
                  </div>
                  <div className="bform__row">
                    <label className="blabel">Catégorie principale</label>
                    <select className="bselect" value={form.category} onChange={e => upd('category', e.target.value)}>
                      {CATS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                    </select>
                  </div>
                  <div className="bform__row bform__row--full">
                    <label className="blabel">Description du contenu</label>
                    <textarea className="btextarea" rows={4} value={form.items} onChange={e => upd('items', e.target.value)} placeholder="Ex: 2 valises vêtements, 1 carton épices, 1 sachet cosmétiques..." />
                  </div>
                  {w > 0 && (
                    <div className="bprice">
                      <div className="bprice__label">Estimation du prix</div>
                      <div className="bprice__row">
                        <span>{w} kg × {route.base + (cat?.surcharge || 0)} {route.currency}/kg</span>
                        <span>{price.toFixed(0)} {route.currency}</span>
                      </div>
                      {form.delivery === 'home' && (
                        <div className="bprice__row"><span>Livraison domicile</span><span>25 CAD</span></div>
                      )}
                      <div className="bprice__total">
                        <span>Total estimé</span>
                        <span>{total.toFixed(0)} {route.currency}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="bmain__nav">
              <button className="bbtn bbtn--ghost" onClick={() => step > 0 ? setStep(s => s - 1) : onNav?.('/')}>
                ← {step === 0 ? 'Retour' : 'Question précédente'}
              </button>
              <button className="bbtn bbtn--primary" onClick={() => setStep(s => s + 1)}>
                {step === STEPS.length - 1 ? 'Confirmer la réservation' : 'Question suivante'} →
              </button>
            </div>
          </>
        ) : (
          /* ── CONFIRMATION ── */
          <div className="bdone">
            <div className="bdone__icon">✓</div>
            <h2 className="bdone__title">Réservation confirmée !</h2>
            <p className="bdone__sub">
              Votre demande a été enregistrée. Notre équipe vous contactera dans les 2h pour confirmer les détails et organiser la collecte.
            </p>
            <div className="bdone__recap">
              <div className="bdone__row">
                <span>Route</span><span>{route.label}</span>
              </div>
              <div className="bdone__row">
                <span>Expéditeur</span><span>{form.senderName || '—'}</span>
              </div>
              <div className="bdone__row">
                <span>Destinataire</span><span>{form.recipName || '—'}</span>
              </div>
              <div className="bdone__row bdone__row--total">
                <span>Total estimé</span>
                <span>{total > 0 ? total.toFixed(0) + ' CAD' : '—'}</span>
              </div>
            </div>
            <button className="bbtn bbtn--ghost" onClick={() => onNav?.('/')}>
              ← Retour à l'accueil
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
