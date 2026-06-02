'use client';
import { useState } from 'react';
import { TopBar, SiteNav, SiteFooter } from './SiteLayout.jsx';
import '@/src/styles/client-omega.css';
import '@/src/styles/booking.css';

const ROUTES_DATA = [
  { id: 'dla-yul', label: 'Douala → Montréal', code: 'DLA → YUL', base: 18, currency: 'CAD', transit: 14 },
  { id: 'yul-dla', label: 'Montréal → Douala', code: 'YUL → DLA', base: 16, currency: 'CAD', transit: 14 },
];

const DEPARTURES = {
  'dla-yul': [
    { id: 'd1', label: 'Mar 9 Juin',  spots: 12 },
    { id: 'd2', label: 'Mar 16 Juin', spots: 8  },
    { id: 'd3', label: 'Mar 23 Juin', spots: 15 },
    { id: 'd4', label: 'Mar 30 Juin', spots: 3  },
    { id: 'd5', label: 'Mar 7 Juil',  spots: 18 },
    { id: 'd6', label: 'Mar 14 Juil', spots: 20 },
  ],
  'yul-dla': [
    { id: 'd1', label: 'Jeu 11 Juin', spots: 10 },
    { id: 'd2', label: 'Jeu 18 Juin', spots: 5  },
    { id: 'd3', label: 'Jeu 25 Juin', spots: 14 },
    { id: 'd4', label: 'Jeu 2 Juil',  spots: 20 },
    { id: 'd5', label: 'Jeu 9 Juil',  spots: 17 },
    { id: 'd6', label: 'Jeu 16 Juil', spots: 20 },
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
  { label: 'Itinéraire' },
  { label: 'Personnes' },
  { label: 'Colis' },
  { label: 'Validation' },
];

/* ── Shared form atoms ── */
function Field({ label, children, full }) {
  return (
    <div className={`co-field${full ? ' co-field--full' : ''}`}>
      <label className="co-label">{label}</label>
      {children}
    </div>
  );
}

/* ── Right panel: always-visible order summary ── */
function Summary({ route, departure, parcels, delivery, isDone }) {
  const deliveryFee = delivery === 'home' ? 25 : 0;
  const parcelsTotal = parcels.reduce((sum, p) => {
    const cat = CATS.find(c => c.id === p.category);
    return sum + (parseFloat(p.qty) || 1) * (parseFloat(p.weight) || 0) * (route.base + (cat?.surcharge || 0));
  }, 0);
  const total = parcelsTotal + deliveryFee;

  return (
    <div className="co-summary">
      <div className="co-summary__head">Votre réservation</div>

      {/* Route */}
      <div className="co-summary__section">
        <div className="co-summary__label">Itinéraire</div>
        <div className={`co-summary__row${route ? '' : ' co-summary__row--muted'}`}>
          <span>Route</span>
          <span>{route?.label ?? '—'}</span>
        </div>
        <div className={`co-summary__row${departure ? '' : ' co-summary__row--muted'}`}>
          <span>Date de départ</span>
          <span>{departure?.label ?? 'Non sélectionnée'}</span>
        </div>
        <div className="co-summary__row co-summary__row--muted">
          <span>Transit estimé</span>
          <span>~{route?.transit ?? '—'} jours</span>
        </div>
      </div>

      {/* Colis */}
      <div className="co-summary__section">
        <div className="co-summary__label">
          Colis {parcels.filter(p => p.weight).length > 0 && `· ${parcels.filter(p => p.weight).length} article(s)`}
        </div>
        {parcels.filter(p => parseFloat(p.weight) > 0).length === 0 ? (
          <div className="co-summary__row co-summary__row--muted">
            <span>Aucun article ajouté</span><span>—</span>
          </div>
        ) : (
          parcels.filter(p => parseFloat(p.weight) > 0).map(p => {
            const cat = CATS.find(c => c.id === p.category);
            const w = parseFloat(p.weight) || 0;
            const q = parseFloat(p.qty) || 1;
            const lp = q * w * (route.base + (cat?.surcharge || 0));
            return (
              <div key={p.id} className="co-summary__row">
                <span>{q}× {cat?.label}</span>
                <span>{lp.toFixed(0)} {route.currency}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Livraison */}
      <div className="co-summary__section">
        <div className="co-summary__label">Livraison</div>
        <div className="co-summary__row">
          <span>{delivery === 'home' ? 'Domicile' : 'Retrait entrepôt'}</span>
          <span>{delivery === 'home' ? '25 CAD' : 'Gratuit'}</span>
        </div>
      </div>

      {/* Total */}
      <div className="co-summary__total">
        <span className="co-summary__total-label">Total estimé</span>
        <span className="co-summary__total-price">{total > 0 ? total.toFixed(0) + ' CAD' : '—'}</span>
      </div>
    </div>
  );
}

/* ── Main component ── */
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
  const departure = DEPARTURES[form.route].find(d => d.id === form.departure);
  const isDone = step === STEPS.length;

  const prev = () => step > 0 ? setStep(s => s - 1) : onNav?.('/');
  const next = () => setStep(s => s + 1);

  const onBook = () => {};

  return (
    <div className="co-wrap">

      {/* ── SHARED HEADER (même que la landing) ── */}
      <TopBar />
      <SiteNav onNav={onNav} onBook={onBook} mode="booking" />

      {/* ── Sous-header : breadcrumb ── */}
      <div className="co-subhead">
        <div className="co-subhead__inner">
          <span className="co-subhead__title">Réservation</span>
          <nav className="co-crumbs">
            {STEPS.map((s, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {i > 0 && <span className="co-crumb__sep">›</span>}
                <span className={`co-crumb${i === step && !isDone ? ' is-active' : i < step || isDone ? ' is-done' : ''}`}>
                  <span className="co-crumb__num">{i < step || isDone ? '✓' : i + 1}</span>
                  {s.label}
                </span>
              </span>
            ))}
          </nav>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="co-body">

        {/* ── LEFT: form ── */}
        <div className="co-main">
          {isDone ? (
            /* ── CONFIRMATION ── */
            <div className="co-done">
              <div className="co-done__icon">✓</div>
              <h2 className="co-done__title">Réservation confirmée !</h2>
              <p className="co-done__sub">
                Votre demande a été enregistrée. Notre équipe vous contactera dans les 2h pour confirmer les détails et organiser la collecte.
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button className="co-btn co-btn--ghost" onClick={() => onNav?.('/')}>← Retour à l'accueil</button>
              </div>
            </div>
          ) : (
            <>
              {/* ── Step 0 : Itinéraire ── */}
              {step === 0 && (
                <div className="co-section">
                  <div className="co-section__title">Itinéraire</div>

                  <div style={{ marginBottom: 22 }}>
                    <div className="co-label" style={{ marginBottom: 10 }}>Direction</div>
                    <div className="co-opts">
                      {ROUTES_DATA.map(r => (
                        <button key={r.id} className={`co-opt${form.route === r.id ? ' is-sel' : ''}`}
                          onClick={() => { upd('route', r.id); upd('departure', ''); }}>
                          <div className="co-opt__radio" />
                          <div className="co-opt__body">
                            <div className="co-opt__label">✈️ {r.label}</div>
                            <div className="co-opt__sub">{r.code} · Transit ~{r.transit} jours</div>
                          </div>
                          <span className="co-opt__badge">dès {r.base} {r.currency}/kg</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="co-label" style={{ marginBottom: 10 }}>Date de départ — {route.label}</div>
                    <div className="co-dates">
                      {DEPARTURES[form.route].map(d => (
                        <button key={d.id} className={`co-date${form.departure === d.id ? ' is-sel' : ''}`}
                          onClick={() => upd('departure', d.id)}>
                          <div className="co-date__day">{d.label}</div>
                          <div className={`co-date__spots${d.spots <= 5 ? ' co-date__spots--low' : ''}`}>
                            {d.spots <= 5 ? `⚠ ${d.spots} places` : `${d.spots} places`}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 1 : Personnes ── */}
              {step === 1 && (
                <div className="co-section">
                  <div className="co-section__title">Coordonnées des parties</div>

                  <div className="co-split">
                    <div className="co-split-block">
                      <div className="co-split-block__title">Expéditeur</div>
                      <Field label="Nom complet">
                        <input className="co-input" value={form.senderName} onChange={e => upd('senderName', e.target.value)} placeholder="Awa Nkemdirim" />
                      </Field>
                      <Field label="Téléphone">
                        <input className="co-input" value={form.senderPhone} onChange={e => upd('senderPhone', e.target.value)} placeholder="+237 6** ** ** **" />
                      </Field>
                      <Field label="Email">
                        <input className="co-input" type="email" value={form.senderEmail} onChange={e => upd('senderEmail', e.target.value)} placeholder="vous@email.com" />
                      </Field>
                    </div>

                    <div className="co-split-block">
                      <div className="co-split-block__title">Destinataire</div>
                      <Field label="Nom complet">
                        <input className="co-input" value={form.recipName} onChange={e => upd('recipName', e.target.value)} placeholder="Jean Mbarga" />
                      </Field>
                      <Field label="Téléphone">
                        <input className="co-input" value={form.recipPhone} onChange={e => upd('recipPhone', e.target.value)} placeholder="+1 514 *** ****" />
                      </Field>
                      <Field label="Ville">
                        <select className="co-select" value={form.recipCity} onChange={e => upd('recipCity', e.target.value)}>
                          {['Montréal','Laval','Longueuil','Brossard','Gatineau','Québec','Toronto'].map(c => <option key={c}>{c}</option>)}
                        </select>
                      </Field>
                    </div>
                  </div>

                  <div style={{ marginTop: 20 }}>
                    <div className="co-label" style={{ marginBottom: 10 }}>Mode de livraison</div>
                    <div className="co-opts co-opts--2">
                      {[
                        { id: 'pickup', label: 'Retrait entrepôt', sub: 'Lachine, QC', badge: 'Gratuit' },
                        { id: 'home',   label: 'Livraison domicile', sub: 'Partout au Québec', badge: '+25 CAD' },
                      ].map(d => (
                        <button key={d.id} className={`co-opt${form.delivery === d.id ? ' is-sel' : ''}`}
                          onClick={() => upd('delivery', d.id)}>
                          <div className="co-opt__radio" />
                          <div className="co-opt__body">
                            <div className="co-opt__label">{d.label}</div>
                            <div className="co-opt__sub">{d.sub}</div>
                          </div>
                          <span className="co-opt__badge">{d.badge}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="co-account" style={{ marginTop: 16 }}>
                    <input type="checkbox" checked={createAccount} onChange={e => setCreateAccount(e.target.checked)} />
                    <div>
                      <div className="co-account__title">Créer un compte Jumla avec ces informations</div>
                      <div className="co-account__sub">Suivez vos envois en ligne et accédez à votre historique de commandes.</div>
                    </div>
                  </label>
                </div>
              )}

              {/* ── Step 2 : Colis ── */}
              {step === 2 && (
                <div className="co-section">
                  <div className="co-section__title">Articles à envoyer</div>

                  <div className="co-table-wrap">
                    <div className="co-table-head">
                      <div>Qté</div>
                      <div>Poids (kg)</div>
                      <div>Catégorie</div>
                      <div>Nomination / Description</div>
                      <div></div>
                    </div>
                    {parcels.map(p => (
                      <div key={p.id} className="co-table-row">
                        <input className="co-input" type="number" min="1" value={p.qty}
                          onChange={e => updParcel(p.id, 'qty', e.target.value)} />
                        <input className="co-input" type="number" min="0" step="0.5" value={p.weight}
                          onChange={e => updParcel(p.id, 'weight', e.target.value)} placeholder="0" />
                        <select className="co-select" value={p.category}
                          onChange={e => updParcel(p.id, 'category', e.target.value)}>
                          {CATS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                        </select>
                        <input className="co-input" value={p.desc}
                          onChange={e => updParcel(p.id, 'desc', e.target.value)}
                          placeholder="Ex: habits enfants, thym séché..." />
                        <button className="co-table-del" disabled={parcels.length === 1}
                          onClick={() => removeParcel(p.id)}>×</button>
                      </div>
                    ))}
                  </div>

                  <button className="co-add-row" onClick={addParcel}>+ Ajouter un article</button>
                </div>
              )}

              {/* ── Step 3 : Validation ── */}
              {step === 3 && (
                <div className="co-section">
                  <div className="co-section__title">Vérifiez votre réservation</div>
                  <p style={{ fontSize: 13.5, color: 'var(--ink-500)', marginBottom: 20, lineHeight: 1.6 }}>
                    Vérifiez les informations ci-contre avant de valider. Notre équipe vous contactera pour confirmer les détails et organiser la collecte.
                  </p>

                  <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', padding: '16px 20px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>
                      Récapitulatif
                    </div>
                    {[
                      ['Route', route.label],
                      ['Date de départ', departure?.label ?? 'Non sélectionnée'],
                      ['Expéditeur', form.senderName || '—'],
                      ['Tél. expéditeur', form.senderPhone || '—'],
                      ['Destinataire', form.recipName || '—'],
                      ['Ville', form.recipCity],
                      ['Livraison', form.delivery === 'home' ? 'Domicile (+25 CAD)' : 'Retrait entrepôt (gratuit)'],
                      ['Nb. articles', parcels.length.toString()],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: '1px solid var(--border-soft)' }}>
                        <span style={{ color: 'var(--ink-500)' }}>{k}</span>
                        <span style={{ fontWeight: 600 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Navigation ── */}
              <div className="co-nav">
                <button className="co-btn co-btn--ghost" onClick={prev}>
                  ← {step === 0 ? "Retour à l'accueil" : 'Précédent'}
                </button>
                <button className={`co-btn ${step === STEPS.length - 1 ? 'co-btn--brand' : 'co-btn--primary'}`} onClick={next}>
                  {step === STEPS.length - 1 ? 'Confirmer la réservation' : 'Continuer →'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT: summary ── */}
        <aside className="co-aside">
          <Summary
            route={route}
            departure={departure}
            parcels={parcels}
            delivery={form.delivery}
            isDone={isDone}
          />
        </aside>

      </div>

      {/* ── SHARED FOOTER (même que la landing) ── */}
      <SiteFooter />
    </div>
  );
}
