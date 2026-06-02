'use client';
import { useState } from 'react';
import '@/src/styles/booking.css';

const ROUTES_DATA = [
  { id: 'dla-yul', label: 'Douala → Montréal', code: 'DLA → YUL', base: 18, currency: 'CAD', transit: 14 },
  { id: 'yul-dla', label: 'Montréal → Douala', code: 'YUL → DLA', base: 16, currency: 'CAD', transit: 14 },
];

const DEPARTURES = {
  'dla-yul': [
    { id: 'd1', label: 'Mar 9 Juin',   spots: 12 },
    { id: 'd2', label: 'Mar 16 Juin',  spots: 8  },
    { id: 'd3', label: 'Mar 23 Juin',  spots: 15 },
    { id: 'd4', label: 'Mar 30 Juin',  spots: 3  },
    { id: 'd5', label: 'Mar 7 Juil',   spots: 18 },
    { id: 'd6', label: 'Mar 14 Juil',  spots: 20 },
  ],
  'yul-dla': [
    { id: 'd1', label: 'Jeu 11 Juin',  spots: 10 },
    { id: 'd2', label: 'Jeu 18 Juin',  spots: 5  },
    { id: 'd3', label: 'Jeu 25 Juin',  spots: 14 },
    { id: 'd4', label: 'Jeu 2 Juil',   spots: 20 },
    { id: 'd5', label: 'Jeu 9 Juil',   spots: 17 },
    { id: 'd6', label: 'Jeu 16 Juil',  spots: 20 },
  ],
};

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
    label: 'Itinéraire',
    title: 'Votre Itinéraire',
    question: 'Choisissez la route et la date',
    desc: 'Sélectionnez la direction puis votre date de départ parmi les prochains vols disponibles.',
    tip: 'Jumla opère via fret aérien exclusivement — vos colis arrivent en 14 jours ouvrés.',
    icon: '✈️',
  },
  {
    label: 'Personnes',
    title: 'Expéditeur & Destinataire',
    question: 'Coordonnées des deux parties',
    desc: 'Renseignez les contacts de la personne qui envoie et de celle qui reçoit le colis.',
    tip: 'Vos données sont chiffrées et ne sont jamais partagées avec des tiers sans votre accord.',
    icon: '👥',
  },
  {
    label: 'Colis',
    title: 'Vos Colis',
    question: 'Détail des articles à envoyer',
    desc: 'Ajoutez chaque article séparément pour une tarification précise et une déclaration douanière correcte.',
    tip: 'Médicaments, denrées périssables et matières dangereuses sont soumis à restrictions. Contactez-nous si besoin.',
    icon: '📦',
  },
  {
    label: 'Récapitulatif',
    title: 'Validation',
    question: 'Vérifiez votre commande',
    desc: 'Relisez les informations avant de valider. Notre équipe vous contactera pour organiser la collecte.',
    tip: 'Un numéro de suivi vous sera envoyé par email dès que votre colis est pris en charge.',
    icon: '✅',
  },
];

export default function BookingScreen({ onNav }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    route: 'dla-yul',
    departure: '',
    senderName: '', senderPhone: '', senderEmail: '',
    recipName: '', recipPhone: '', recipCity: 'Montréal',
    delivery: 'pickup',
  });
  const [parcels, setParcels] = useState([
    { id: 1, qty: '1', weight: '', category: 'clothing', desc: '' },
  ]);
  const [createAccount, setCreateAccount] = useState(false);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const addParcel = () => setParcels(ps => [...ps, { id: Date.now(), qty: '1', weight: '', category: 'clothing', desc: '' }]);
  const removeParcel = id => setParcels(ps => ps.filter(p => p.id !== id));
  const updParcel = (id, k, v) => setParcels(ps => ps.map(p => p.id === id ? { ...p, [k]: v } : p));

  const route = ROUTES_DATA.find(r => r.id === form.route);
  const departures = DEPARTURES[form.route];
  const selectedDep = departures.find(d => d.id === form.departure);

  const parcelsTotal = parcels.reduce((sum, p) => {
    const pCat = CATS.find(c => c.id === p.category);
    const w = parseFloat(p.weight) || 0;
    const q = parseFloat(p.qty) || 1;
    return sum + q * w * (route.base + (pCat?.surcharge || 0));
  }, 0);
  const deliveryFee = form.delivery === 'home' ? 25 : 0;
  const total = parcelsTotal + deliveryFee;

  const isDone = step === STEPS.length;
  const si = STEPS[Math.min(step, STEPS.length - 1)];

  return (
    <div className="bwrap">

      {/* ── SIDEBAR ── */}
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

      {/* ── MAIN ── */}
      <main className="bmain">
        {!isDone ? (
          <>
            <div className="bmain__head">
              <h2 className="bmain__q">{si.question}</h2>
            </div>

            <div className="bmain__body">

              {/* ── Step 0 : Route + Date ── */}
              {step === 0 && (
                <>
                  <div className="bopt-grid bopt-grid--2">
                    {ROUTES_DATA.map(r => (
                      <button key={r.id} className={`bopt-card${form.route === r.id ? ' is-sel' : ''}`} onClick={() => { upd('route', r.id); upd('departure', ''); }}>
                        <div className="bopt-card__icon">✈️</div>
                        <div className="bopt-card__label">{r.label}</div>
                        <div className="bopt-card__sub">{r.code} · ~{r.transit} jours · dès {r.base} {r.currency}/kg</div>
                      </button>
                    ))}
                  </div>

                  <div className="bdate-section">
                    <div className="bdate-label">Date de départ — {route.label}</div>
                    <div className="bdate-grid">
                      {DEPARTURES[form.route].map(d => (
                        <button key={d.id} className={`bdate-card${form.departure === d.id ? ' is-sel' : ''}`} onClick={() => upd('departure', d.id)}>
                          <div className="bdate-card__day">{d.label}</div>
                          <div className={`bdate-card__spots${d.spots <= 5 ? ' bdate-card__spots--low' : ''}`}>
                            {d.spots <= 5 ? `⚠ ${d.spots} places` : `${d.spots} places dispo.`}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── Step 1 : Expéditeur & Destinataire ── */}
              {step === 1 && (
                <>
                  <div className="bsplit">
                    <div className="bsplit__section">
                      <div className="bsplit__head">Expéditeur</div>
                      <div className="bform__row">
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

                    <div className="bsplit__section">
                      <div className="bsplit__head">Destinataire</div>
                      <div className="bform__row">
                        <label className="blabel">Nom complet</label>
                        <input className="binput" value={form.recipName} onChange={e => upd('recipName', e.target.value)} placeholder="Jean Mbarga" />
                      </div>
                      <div className="bform__row">
                        <label className="blabel">Téléphone</label>
                        <input className="binput" value={form.recipPhone} onChange={e => upd('recipPhone', e.target.value)} placeholder="+1 514 *** ****" />
                      </div>
                      <div className="bform__row">
                        <label className="blabel">Ville de livraison</label>
                        <select className="bselect" value={form.recipCity} onChange={e => upd('recipCity', e.target.value)}>
                          {['Montréal','Laval','Longueuil','Brossard','Gatineau','Québec','Toronto'].map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="bform__row">
                        <label className="blabel">Mode de livraison</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 2 }}>
                          {[
                            { id: 'pickup', label: 'Retrait entrepôt', sub: 'Lachine, QC — Gratuit' },
                            { id: 'home',   label: 'Domicile',         sub: '+25 CAD' },
                          ].map(d => (
                            <button key={d.id} className={`bopt-card bopt-card--sm${form.delivery === d.id ? ' is-sel' : ''}`} onClick={() => upd('delivery', d.id)}>
                              <div className="bopt-card__label">{d.label}</div>
                              <div className="bopt-card__sub">{d.sub}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <label className="baccount-opt">
                    <input type="checkbox" checked={createAccount} onChange={e => setCreateAccount(e.target.checked)} />
                    <div>
                      <div className="baccount-opt__title">Créer un compte Jumla avec ces informations</div>
                      <div className="baccount-opt__sub">Suivez vos envois en ligne, recevez des notifications et accédez à votre historique de commandes.</div>
                    </div>
                  </label>
                </>
              )}

              {/* ── Step 2 : Colis ── */}
              {step === 2 && (
                <>
                  <div className="bparcels">
                    <div className="bparcel-header">
                      <div>Qté</div>
                      <div>Poids (kg)</div>
                      <div>Catégorie</div>
                      <div>Nomination / Description</div>
                      <div></div>
                    </div>
                    {parcels.map(p => (
                      <div key={p.id} className="bparcel-row">
                        <input
                          className="binput" type="number" min="1"
                          value={p.qty} onChange={e => updParcel(p.id, 'qty', e.target.value)}
                        />
                        <input
                          className="binput" type="number" min="0" step="0.5"
                          value={p.weight} onChange={e => updParcel(p.id, 'weight', e.target.value)}
                          placeholder="0"
                        />
                        <select className="bselect" value={p.category} onChange={e => updParcel(p.id, 'category', e.target.value)}>
                          {CATS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                        </select>
                        <input
                          className="binput" value={p.desc}
                          onChange={e => updParcel(p.id, 'desc', e.target.value)}
                          placeholder="Ex: habits enfants, thym séché..."
                        />
                        <button className="bparcel-del" disabled={parcels.length === 1} onClick={() => removeParcel(p.id)}>×</button>
                      </div>
                    ))}
                  </div>

                  <button className="bparcel-add" onClick={addParcel}>+ Ajouter un article</button>

                  {parcelsTotal > 0 && (
                    <div className="bprice" style={{ marginTop: 16 }}>
                      <div className="bprice__label">Estimation du prix</div>
                      {parcels.map(p => {
                        const pCat = CATS.find(c => c.id === p.category);
                        const w = parseFloat(p.weight) || 0;
                        const q = parseFloat(p.qty) || 1;
                        const lp = q * w * (route.base + (pCat?.surcharge || 0));
                        if (!lp) return null;
                        return (
                          <div key={p.id} className="bprice__row">
                            <span>{q}× {pCat?.label} · {w} kg</span>
                            <span>{lp.toFixed(0)} {route.currency}</span>
                          </div>
                        );
                      })}
                      {form.delivery === 'home' && (
                        <div className="bprice__row"><span>Livraison domicile</span><span>25 CAD</span></div>
                      )}
                      <div className="bprice__total">
                        <span>Total estimé</span>
                        <span>{total.toFixed(0)} {route.currency}</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── Step 3 : Récapitulatif ── */}
              {step === 3 && (
                <div className="brecap">
                  <div className="brecap__section">
                    <div className="brecap__section-title">Itinéraire</div>
                    <div className="brecap__row"><span>Route</span><span>{route.label}</span></div>
                    <div className="brecap__row"><span>Date de départ</span><span>{selectedDep?.label || 'Non sélectionnée'}</span></div>
                    <div className="brecap__row"><span>Transit estimé</span><span>~{route.transit} jours</span></div>
                  </div>

                  <div className="brecap__section">
                    <div className="brecap__section-title">Expéditeur & Destinataire</div>
                    <div className="brecap__row"><span>Expéditeur</span><span>{form.senderName || '—'}</span></div>
                    <div className="brecap__row"><span>Tél. expéditeur</span><span>{form.senderPhone || '—'}</span></div>
                    <div className="brecap__row"><span>Destinataire</span><span>{form.recipName || '—'}</span></div>
                    <div className="brecap__row"><span>Ville</span><span>{form.recipCity}</span></div>
                    <div className="brecap__row">
                      <span>Livraison</span>
                      <span>{form.delivery === 'home' ? 'Domicile (+25 CAD)' : 'Retrait entrepôt (gratuit)'}</span>
                    </div>
                  </div>

                  <div className="brecap__section">
                    <div className="brecap__section-title">
                      Colis · {parcels.length} article{parcels.length > 1 ? 's' : ''}
                    </div>
                    {parcels.map(p => {
                      const pCat = CATS.find(c => c.id === p.category);
                      const w = parseFloat(p.weight) || 0;
                      const q = parseFloat(p.qty) || 1;
                      const lp = q * w * (route.base + (pCat?.surcharge || 0));
                      return (
                        <div key={p.id} className="brecap__row">
                          <span>{q}× {pCat?.label}{p.desc ? ` — ${p.desc}` : ''} ({w} kg)</span>
                          <span>{lp > 0 ? lp.toFixed(0) + ' CAD' : '—'}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="brecap__total">
                    <span>Total estimé</span>
                    <span>{total > 0 ? total.toFixed(0) + ' CAD' : '—'}</span>
                  </div>
                </div>
              )}

            </div>

            <div className="bmain__nav">
              <button className="bbtn bbtn--ghost" onClick={() => step > 0 ? setStep(s => s - 1) : onNav?.('/')}>
                ← {step === 0 ? 'Retour' : 'Précédent'}
              </button>
              <button className="bbtn bbtn--primary" onClick={() => setStep(s => s + 1)}>
                {step === STEPS.length - 1 ? 'Valider la réservation' : 'Continuer'} →
              </button>
            </div>
          </>
        ) : (
          <div className="bdone">
            <div className="bdone__icon">✓</div>
            <h2 className="bdone__title">Réservation confirmée !</h2>
            <p className="bdone__sub">
              Notre équipe vous contactera dans les 2h pour confirmer les détails et organiser la collecte.
            </p>
            <div className="bdone__recap">
              <div className="bdone__row"><span>Route</span><span>{route.label}</span></div>
              <div className="bdone__row"><span>Départ</span><span>{selectedDep?.label || '—'}</span></div>
              <div className="bdone__row"><span>Expéditeur</span><span>{form.senderName || '—'}</span></div>
              <div className="bdone__row"><span>Destinataire</span><span>{form.recipName || '—'}</span></div>
              <div className="bdone__row"><span>Articles</span><span>{parcels.length}</span></div>
              <div className="bdone__row bdone__row--total">
                <span>Total estimé</span>
                <span>{total > 0 ? total.toFixed(0) + ' CAD' : '—'}</span>
              </div>
            </div>
            <button className="bbtn bbtn--ghost" onClick={() => onNav?.('/')}>← Retour à l'accueil</button>
          </div>
        )}
      </main>
    </div>
  );
}
