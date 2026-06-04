'use client';
import { useState } from 'react';
import { TopBar, SiteNav, SiteFooter } from './SiteLayout.jsx';
import '@/src/styles/client-omega.css';
import '@/src/styles/booking.css';

// ── Routes with configurable fee structure ──
const ROUTES_DATA = [
  {
    id: 'dla-yul', label: 'Douala → Montréal', code: 'DLA → YUL',
    currency: 'CAD', transit: 14,
    fees: {
      base: 50, customs: 5, carton: 1, formality: 4, service: 5,
      flatUpTo3kg: 65, perHalfKgRate: 9,
      addons: { smallBag: 3, mediumBag: 5, largeBag: 10 },
      montrealDelivery: 25,
    },
  },
  {
    id: 'los-yul', label: 'Lagos → Montréal', code: 'LOS → YUL',
    currency: 'CAD', transit: 16,
    fees: {
      base: 55, customs: 6, carton: 1, formality: 4, service: 4,
      flatUpTo3kg: 70, perHalfKgRate: 10,
      addons: { smallBag: 3, mediumBag: 5, largeBag: 10 },
      montrealDelivery: 25,
    },
  },
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
  'los-yul': [
    { id: 'd1', label: 'Jeu 11 Juin',  spots: 10 },
    { id: 'd2', label: 'Jeu 18 Juin',  spots: 5  },
    { id: 'd3', label: 'Jeu 25 Juin',  spots: 14 },
    { id: 'd4', label: 'Jeu 2 Juil',   spots: 20 },
  ],
};

const CITIES = [
  { label: 'Montréal',              zone: 'montreal' },
  { label: 'Laval',                 zone: 'montreal' },
  { label: 'Longueuil',             zone: 'montreal' },
  { label: 'Brossard',              zone: 'montreal' },
  { label: 'Saint-Lambert',         zone: 'montreal' },
  { label: 'Westmount',             zone: 'montreal' },
  { label: 'Outremont',             zone: 'montreal' },
  { label: 'Côte-Saint-Luc',        zone: 'montreal' },
  { label: 'LaSalle',               zone: 'montreal' },
  { label: 'Verdun',                zone: 'montreal' },
  { label: 'Lachine',               zone: 'montreal' },
  { label: 'Dorval',                zone: 'montreal' },
  { label: 'Pointe-Claire',         zone: 'montreal' },
  { label: 'Dollard-des-Ormeaux',   zone: 'montreal' },
  { label: 'Mont-Royal',            zone: 'montreal' },
  { label: 'Gatineau',   zone: 'other' },
  { label: 'Québec',     zone: 'other' },
  { label: 'Ottawa',     zone: 'other' },
  { label: 'Toronto',    zone: 'other' },
  { label: 'Vancouver',  zone: 'other' },
  { label: 'Calgary',    zone: 'other' },
  { label: 'Edmonton',   zone: 'other' },
  { label: 'Winnipeg',   zone: 'other' },
];

const STEPS = [
  { label: 'Route & Départ' },
  { label: 'Votre colis' },
  { label: 'Coordonnées' },
  { label: 'Paiement' },
];

// ── Pricing helpers ──
function roundUpToHalfKg(kg) {
  return Math.ceil(kg * 2) / 2;
}

function calcPrice(kg, fees, addons, delivery, cityZone) {
  if (kg <= 0) return null;
  const billedKg = kg <= 3 ? kg : roundUpToHalfKg(kg);
  const surplusKg = billedKg > 3 ? billedKg - 3 : 0;
  const surplusIncrements = surplusKg / 0.5;
  const shipping = fees.flatUpTo3kg + surplusIncrements * fees.perHalfKgRate;

  const addonSmall  = (addons.smallBag  || 0) * fees.addons.smallBag;
  const addonMedium = (addons.mediumBag || 0) * fees.addons.mediumBag;
  const addonLarge  = (addons.largeBag  || 0) * fees.addons.largeBag;
  const addonTotal  = addonSmall + addonMedium + addonLarge;

  const isMontrealDelivery = delivery === 'home' && cityZone === 'montreal';
  const isOutsideDelivery  = delivery === 'home' && cityZone === 'other';
  const deliveryFee        = isMontrealDelivery ? fees.montrealDelivery : 0;

  return {
    rawKg: kg, billedKg, surplusKg, surplusIncrements,
    perHalfKgRate: fees.perHalfKgRate,
    breakdown: { base: fees.base, customs: fees.customs, carton: fees.carton, formality: fees.formality, service: fees.service },
    shipping, addonSmall, addonMedium, addonLarge, addonTotal,
    deliveryFee, isOutsideDelivery,
    total: shipping + addonTotal + deliveryFee,
  };
}

// ── Shared atoms ──
function Field({ label, children }) {
  return (
    <div className="co-field">
      <label className="co-label">{label}</label>
      {children}
    </div>
  );
}

function Stepper({ value, onChange, min = 0 }) {
  const btnBase = { width: 32, height: 32, border: '1.5px solid var(--border)', background: 'var(--bg-soft)', cursor: 'pointer', fontSize: 20, lineHeight: 1, fontWeight: 700, color: 'var(--ink-500)', display: 'grid', placeItems: 'center' };
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
        style={{ ...btnBase, borderRight: 'none', borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)', opacity: value <= min ? .35 : 1 }}>−</button>
      <div style={{ width: 40, height: 32, border: '1.5px solid var(--border)', display: 'grid', placeItems: 'center', fontSize: 13.5, fontWeight: 700, background: 'white' }}>{value}</div>
      <button onClick={() => onChange(value + 1)}
        style={{ ...btnBase, borderLeft: 'none', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}>+</button>
    </div>
  );
}

// ── Item icon by content keyword ──
function itemIcon(desc) {
  const d = (desc || '').toLowerCase();
  if (d.match(/valise|sac|bag|vêt|habit|cloth/)) return '👜';
  if (d.match(/carton|colis|box/)) return '📦';
  if (d.match(/chaussure|sandale|shoe/)) return '👟';
  if (d.match(/téléphone|phone|élec|laptop|ordi/)) return '📱';
  if (d.match(/ndolè|épice|food|alim|congel/)) return '🥘';
  if (d.match(/docu|papier|paper/)) return '📄';
  return '📦';
}

// ── Right panel ──
function Summary({ route, departure, items, totalKg, price, form, step, isDone }) {
  const [promoCode, setPromoCode] = useState('');
  const city     = CITIES.find(c => c.label === form.recipCity);
  const cityZone = city?.zone || 'montreal';

  const filledItems = items.filter(i => i.desc || parseFloat(i.kg) > 0);

  return (
    <div className="co-summary">
      <div className="co-summary__head">Votre réservation</div>

      {/* ── Articles du colis (like Shopify product rows) ── */}
      {filledItems.length > 0 && (
        <div className="co-summary__items">
          {filledItems.map(item => (
            <div key={item.id} className="co-summary__item">
              <div className="co-summary__item-thumb">
                {itemIcon(item.desc)}
                <span className="co-summary__item-qty">{item.paquets || 1}</span>
              </div>
              <div className="co-summary__item-info">
                <div className="co-summary__item-name">{item.desc || 'Article'}</div>
                <div className="co-summary__item-sub">
                  {item.paquets > 1 ? `${item.paquets} paquets` : '1 paquet'}
                  {item.pieces > 1 ? ` · ${item.pieces} pièces` : ''}
                </div>
              </div>
              <span className="co-summary__item-kg">{item.kg || '—'} kg</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Code promo ── */}
      <div className="co-summary__promo">
        <input
          className="co-summary__promo-input"
          placeholder="Code promo ou bon de réduction"
          value={promoCode}
          onChange={e => setPromoCode(e.target.value)}
        />
        <button className="co-summary__promo-btn">Appliquer</button>
      </div>

      {/* ── Itinéraire ── */}
      <div className="co-summary__section">
        <div className="co-summary__label">Itinéraire</div>
        <div className={`co-summary__row${route ? '' : ' co-summary__row--muted'}`}>
          <span>Route</span><span>{route?.label ?? '—'}</span>
        </div>
        <div className={`co-summary__row${departure ? '' : ' co-summary__row--muted'}`}>
          <span>Départ</span><span>{departure?.label ?? 'Non sélectionné'}</span>
        </div>
        {route && <div className="co-summary__row co-summary__row--muted"><span>Transit estimé</span><span>~{route.transit} jours</span></div>}
      </div>

      {/* ── Frais ── */}
      {step >= 1 && (
        <div className="co-summary__section">
          <div className="co-summary__label">Frais</div>
          {price ? (
            <>
              <div className="co-summary__row">
                <span>Envoi {price.billedKg} kg{price.billedKg !== price.rawKg ? ` (déclaré ${price.rawKg} kg)` : ''}</span>
                <span>{price.shipping.toFixed(0)} {route.currency}</span>
              </div>
              {price.addonTotal > 0 && <div className="co-summary__row"><span>Sacs</span><span>+{price.addonTotal} {route.currency}</span></div>}
              {step >= 2 && (
                form.delivery === 'pickup' ? (
                  <div className="co-summary__row"><span>Livraison</span><span>Gratuit</span></div>
                ) : cityZone === 'montreal' ? (
                  <div className="co-summary__row"><span>Livraison domicile</span><span>+{route?.fees.montrealDelivery} {route?.currency}</span></div>
                ) : (
                  <div className="co-summary__row co-summary__row--muted"><span>Livraison hors région</span><span>À évaluer</span></div>
                )
              )}
              {step < 2 && (
                <div className="co-summary__row co-summary__row--muted"><span>Livraison</span><span>Calculé à l'étape suivante</span></div>
              )}
            </>
          ) : (
            <div className="co-summary__row co-summary__row--muted"><span>Aucun article renseigné</span><span>—</span></div>
          )}
        </div>
      )}

      <div className="co-summary__total">
        <div>
          <div className="co-summary__total-label">Total</div>
          {price && <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 2 }}>TVA non applicable</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          {route && <div style={{ fontSize: 11, color: 'var(--ink-400)', marginBottom: 2 }}>{route.currency}</div>}
          <span className="co-summary__total-price">
            {price ? `${price.total.toFixed(0)}` : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main component ──
export default function BookingScreen({ onNav }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    route: 'dla-yul',
    departure: '',
    addons: { smallBag: 0, mediumBag: 0, largeBag: 0 },
    senderName: '', senderPhone: '', senderEmail: '',
    recipName: '', recipPhone: '', recipCity: 'Montréal',
    delivery: 'pickup',
    address: '',
    payMethod: 'card',
  });
  const [items, setItems] = useState([
    { id: 1, desc: '', paquets: 1, pieces: 1, kg: '' },
  ]);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);

  const upd      = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const updAddon = (k, v) => setForm(f => ({ ...f, addons: { ...f.addons, [k]: v } }));
  const addItem    = () => setItems(is => [...is, { id: Date.now(), desc: '', paquets: 1, pieces: 1, kg: '' }]);
  const removeItem = id => setItems(is => is.filter(i => i.id !== id));
  const updItem    = (id, k, v) => setItems(is => is.map(i => i.id === id ? { ...i, [k]: v } : i));

  const route     = ROUTES_DATA.find(r => r.id === form.route);
  const departure = DEPARTURES[form.route]?.find(d => d.id === form.departure);
  const isDone    = step === STEPS.length;

  const city     = CITIES.find(c => c.label === form.recipCity);
  const cityZone = city?.zone || 'montreal';

  const totalKg = items.reduce((sum, i) => sum + (parseFloat(i.kg) || 0), 0);
  const price   = route && totalKg > 0 ? calcPrice(totalKg, route.fees, form.addons, form.delivery, cityZone) : null;

  const canNext = () => {
    if (step === 0) return !!form.departure;
    if (step === 1) return totalKg > 0;
    if (step === 2) return !!form.senderName && !!form.recipName;
    return true;
  };

  const prev = () => step > 0 ? setStep(s => s - 1) : onNav?.('/');
  const next = () => setStep(s => s + 1);

  const montréalCities = CITIES.filter(c => c.zone === 'montreal');
  const otherCities    = CITIES.filter(c => c.zone === 'other');

  const [refCode] = useState(() => `#${Math.random().toString(36).slice(2, 7).toUpperCase()}`);

  return (
    <div className="co-wrap">
      <TopBar />
      <SiteNav onNav={onNav} onBook={() => {}} mode="booking" />

      {/* Breadcrumb */}
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

      <div className="co-body">
        <div className="co-main">
          {isDone ? (
            /* ── CONFIRMATION ── */
            <div className="co-done">
              <div className="co-done__icon">✓</div>
              <h2 className="co-done__title">Réservation confirmée !</h2>
              <p className="co-done__sub">
                Votre colis a été enregistré sous la référence <strong>{refCode}</strong>.
                Vous recevrez un email de confirmation et notre équipe vous contactera pour organiser la collecte.
              </p>
              {price?.isOutsideDelivery && (
                <div style={{ background: 'var(--warn-50)', border: '1px solid var(--warn-200)', borderRadius: 'var(--radius)', padding: '14px 18px', fontSize: 13, color: 'var(--warn-700)', maxWidth: 400, textAlign: 'left', lineHeight: 1.6 }}>
                  <strong>Livraison hors région :</strong> les frais vers <strong>{form.recipCity}</strong> seront évalués à l'arrivée à Montréal. Vous recevrez une facture et un lien de paiement par email.
                </div>
              )}
              <button className="co-btn co-btn--ghost" style={{ marginTop: 8 }} onClick={() => onNav?.('/')}>← Retour à l'accueil</button>
            </div>
          ) : (
            <>
              {/* ── Step 0 : Route & Départ ── */}
              {step === 0 && (
                <div className="co-section">
                  <div className="co-section__title">Route & Date de départ</div>

                  <div style={{ marginBottom: 24 }}>
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
                          <span className="co-opt__badge">dès {r.fees.flatUpTo3kg} {r.currency}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="co-label" style={{ marginBottom: 10 }}>Date de départ</div>
                    <div className="co-dates">
                      {(DEPARTURES[form.route] || []).map(d => (
                        <button key={d.id} className={`co-date${form.departure === d.id ? ' is-sel' : ''}`}
                          onClick={() => upd('departure', d.id)}>
                          <div className="co-date__day">{d.label}</div>
                          <div className={`co-date__spots${d.spots <= 5 ? ' co-date__spots--low' : ''}`}>
                            {d.spots <= 5 ? `⚠ ${d.spots} places` : `${d.spots} places`}
                          </div>
                        </button>
                      ))}
                    </div>
                    {!form.departure && (
                      <p style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 10 }}>Sélectionnez une date pour continuer.</p>
                    )}
                  </div>
                </div>
              )}

              {/* ── Step 1 : Votre colis ── */}
              {step === 1 && (
                <div className="co-section">
                  <div className="co-section__title">Contenu du colis</div>

                  {/* Items table */}
                  <div style={{ marginBottom: 20 }}>
                    <div className="co-label" style={{ marginBottom: 10 }}>Articles</div>
                    <div className="co-table-wrap">
                      <div className="co-table-head" style={{ gridTemplateColumns: '1fr 76px 76px 96px 38px' }}>
                        <div>Description</div>
                        <div>Paquets</div>
                        <div>Pièces</div>
                        <div>Poids (kg)</div>
                        <div></div>
                      </div>
                      {items.map(item => (
                        <div key={item.id} className="co-table-row" style={{ gridTemplateColumns: '1fr 76px 76px 96px 38px' }}>
                          <input className="co-input" value={item.desc}
                            onChange={e => updItem(item.id, 'desc', e.target.value)}
                            placeholder="Ex : valise vêtements, carton ndolè…" />
                          <input className="co-input" type="number" min="1" value={item.paquets}
                            onChange={e => updItem(item.id, 'paquets', e.target.value)} />
                          <input className="co-input" type="number" min="1" value={item.pieces}
                            onChange={e => updItem(item.id, 'pieces', e.target.value)} />
                          <input className="co-input" type="number" min="0" step="0.5" value={item.kg}
                            onChange={e => updItem(item.id, 'kg', e.target.value)} placeholder="0" />
                          <button className="co-table-del" disabled={items.length === 1}
                            onClick={() => removeItem(item.id)}>×</button>
                        </div>
                      ))}
                    </div>
                    <button className="co-add-row" onClick={addItem}>+ Ajouter un article</button>

                    {/* Total weight */}
                    {totalKg > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '10px 4px 0', fontSize: 13 }}>
                        <span style={{ color: 'var(--ink-500)' }}>Poids total :</span>
                        <strong style={{ color: 'var(--ink-900)' }}>{totalKg} kg</strong>
                        {totalKg > 3 && (
                          <span style={{ color: 'var(--ink-400)', fontSize: 12 }}>
                            → facturé {roundUpToHalfKg(totalKg)} kg (arrondi au 0,5 kg supérieur)
                          </span>
                        )}
                        {totalKg <= 3 && (
                          <span style={{ color: 'var(--ok-600)', fontSize: 12, fontWeight: 600 }}>
                            ≤ 3 kg — forfait {route.fees.flatUpTo3kg} {route.currency}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Addons */}
                  <div style={{ marginBottom: price ? 20 : 0 }}>
                    <div className="co-label" style={{ marginBottom: 10 }}>Sacs (optionnel)</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { key: 'smallBag',  label: 'Petit sac',  unitPrice: route.fees.addons.smallBag },
                        { key: 'mediumBag', label: 'Moyen sac',  unitPrice: route.fees.addons.mediumBag },
                        { key: 'largeBag',  label: 'Grand sac',  unitPrice: route.fees.addons.largeBag },
                      ].map(({ key, label, unitPrice }) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-soft)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)' }}>
                          <div>
                            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-800)' }}>{label}</span>
                            <span style={{ fontSize: 12, color: 'var(--ink-400)', marginLeft: 8 }}>{unitPrice} {route.currency} / unité</span>
                          </div>
                          <Stepper value={form.addons[key]} onChange={v => updAddon(key, v)} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Live fee preview */}
                  {price && (
                    <div style={{ background: 'var(--brand-50)', border: '1.5px solid var(--brand-100)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showBreakdown ? 12 : 0 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--brand-700)' }}>
                          Estimation : {price.total.toFixed(0)} {route.currency}
                        </span>
                        <button onClick={() => setShowBreakdown(b => !b)}
                          style={{ fontSize: 11.5, color: 'var(--brand-600)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                          {showBreakdown ? 'Masquer ▴' : 'Voir le détail ▾'}
                        </button>
                      </div>
                      {showBreakdown && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--brand-500)', marginBottom: 4 }}>
                            Frais d'envoi — {price.billedKg} kg — {price.shipping.toFixed(0)} {route.currency}
                          </div>
                          {[
                            ['Frais de base', price.breakdown.base],
                            ['Frais de douane', price.breakdown.customs],
                            ['Carton / manutention', price.breakdown.carton],
                            ['Formalités', price.breakdown.formality],
                            ['Frais de service', price.breakdown.service],
                          ].map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-600)', paddingLeft: 10 }}>
                              <span>{k}</span><span>{v} {route.currency}</span>
                            </div>
                          ))}
                          {price.surplusKg > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-600)', paddingLeft: 10 }}>
                              <span>Surplus {price.surplusKg} kg ({price.surplusIncrements}× 0,5 kg)</span>
                              <span>+{(price.surplusIncrements * price.perHalfKgRate).toFixed(0)} {route.currency}</span>
                            </div>
                          )}
                          {price.addonTotal > 0 && (
                            <>
                              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--brand-500)', marginTop: 6, marginBottom: 2 }}>
                                Sacs — {price.addonTotal} {route.currency}
                              </div>
                              {price.addonSmall  > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-600)', paddingLeft: 10 }}><span>Petits sacs × {form.addons.smallBag}</span><span>{price.addonSmall} {route.currency}</span></div>}
                              {price.addonMedium > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-600)', paddingLeft: 10 }}><span>Moyens sacs × {form.addons.mediumBag}</span><span>{price.addonMedium} {route.currency}</span></div>}
                              {price.addonLarge  > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-600)', paddingLeft: 10 }}><span>Grands sacs × {form.addons.largeBag}</span><span>{price.addonLarge} {route.currency}</span></div>}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 2 : Coordonnées ── */}
              {step === 2 && (
                <div className="co-section">
                  <div className="co-section__title">Expéditeur & Destinataire</div>

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
                          <optgroup label="Grand Montréal">
                            {montréalCities.map(c => <option key={c.label}>{c.label}</option>)}
                          </optgroup>
                          <optgroup label="Hors région">
                            {otherCities.map(c => <option key={c.label}>{c.label}</option>)}
                          </optgroup>
                        </select>
                      </Field>
                    </div>
                  </div>

                  <div style={{ marginTop: 22 }}>
                    <div className="co-label" style={{ marginBottom: 10 }}>Mode de livraison</div>
                    <div className="co-opts co-opts--2">
                      <button className={`co-opt${form.delivery === 'pickup' ? ' is-sel' : ''}`} onClick={() => upd('delivery', 'pickup')}>
                        <div className="co-opt__radio" />
                        <div className="co-opt__body">
                          <div className="co-opt__label">Retrait entrepôt</div>
                          <div className="co-opt__sub">Lachine, Montréal</div>
                        </div>
                        <span className="co-opt__badge">Gratuit</span>
                      </button>
                      <button className={`co-opt${form.delivery === 'home' ? ' is-sel' : ''}`} onClick={() => upd('delivery', 'home')}>
                        <div className="co-opt__radio" />
                        <div className="co-opt__body">
                          <div className="co-opt__label">Livraison à domicile</div>
                          <div className="co-opt__sub">{cityZone === 'montreal' ? 'Grand Montréal' : 'Hors région'}</div>
                        </div>
                        <span className="co-opt__badge">
                          {cityZone === 'montreal' ? `+${route.fees.montrealDelivery} ${route.currency}` : 'À évaluer'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {form.delivery === 'home' && cityZone === 'montreal' && (
                    <div className="co-field" style={{ marginTop: 14 }}>
                      <label className="co-label">Adresse de livraison</label>
                      <input className="co-input" value={form.address} onChange={e => upd('address', e.target.value)} placeholder="123 rue Sainte-Catherine, Montréal, QC H3H 1A1" />
                    </div>
                  )}

                  {form.delivery === 'home' && cityZone === 'other' && (
                    <div style={{ marginTop: 12, background: 'var(--warn-50)', border: '1px solid var(--warn-200)', borderRadius: 'var(--radius)', padding: '12px 16px', fontSize: 13, color: 'var(--warn-700)', lineHeight: 1.6 }}>
                      ℹ️ Les frais de livraison vers <strong>{form.recipCity}</strong> seront évalués à l'arrivée à l'entrepôt de Montréal. Vous recevrez une facture et un lien de paiement par email.
                    </div>
                  )}

                  <label className="co-account" style={{ marginTop: 16 }}>
                    <input type="checkbox" checked={createAccount} onChange={e => setCreateAccount(e.target.checked)} />
                    <div>
                      <div className="co-account__title">Créer un compte Jumla</div>
                      <div className="co-account__sub">Suivez vos envois en ligne et accédez à votre historique.</div>
                    </div>
                  </label>
                </div>
              )}

              {/* ── Step 3 : Paiement ── */}
              {step === 3 && price && (
                <div className="co-section">
                  <div className="co-section__title">Paiement</div>

                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 24 }}>
                    <div style={{ padding: '10px 16px', background: 'var(--ink-900)', color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                      Détail de la facture
                    </div>

                    <div style={{ padding: '16px 16px 0' }}>
                      {/* Shipping */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 6 }}>
                          <span>Frais d'envoi{price.billedKg !== price.rawKg ? ` (${price.billedKg} kg facturés)` : ` (${price.billedKg} kg)`}</span>
                          <span>{price.shipping.toFixed(0)} {route.currency}</span>
                        </div>
                        {[
                          ['Frais de base',           price.breakdown.base],
                          ['Frais de douane',          price.breakdown.customs],
                          ['Carton / manutention',     price.breakdown.carton],
                          ["Formalités d'expédition", price.breakdown.formality],
                          ['Frais de service',         price.breakdown.service],
                        ].map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-500)', paddingLeft: 14, marginBottom: 2 }}>
                            <span>{k}</span><span>{v} {route.currency}</span>
                          </div>
                        ))}
                        {price.surplusKg > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-500)', paddingLeft: 14 }}>
                            <span>Surplus {price.surplusKg} kg ({price.surplusIncrements}× 0,5 kg @ {price.perHalfKgRate} {route.currency})</span>
                            <span>+{(price.surplusIncrements * price.perHalfKgRate).toFixed(0)} {route.currency}</span>
                          </div>
                        )}
                      </div>

                      {/* Addons */}
                      {price.addonTotal > 0 && (
                        <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 12, marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 4 }}>
                            <span>Sacs</span><span>{price.addonTotal} {route.currency}</span>
                          </div>
                          {price.addonSmall  > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-500)', paddingLeft: 14, marginBottom: 2 }}><span>Petits sacs × {form.addons.smallBag}</span><span>{price.addonSmall} {route.currency}</span></div>}
                          {price.addonMedium > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-500)', paddingLeft: 14, marginBottom: 2 }}><span>Moyens sacs × {form.addons.mediumBag}</span><span>{price.addonMedium} {route.currency}</span></div>}
                          {price.addonLarge  > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-500)', paddingLeft: 14 }}><span>Grands sacs × {form.addons.largeBag}</span><span>{price.addonLarge} {route.currency}</span></div>}
                        </div>
                      )}

                      {/* Delivery */}
                      <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 12, paddingBottom: 16 }}>
                        {form.delivery === 'pickup' ? (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, color: 'var(--ink-800)' }}>
                            <span>Livraison (retrait entrepôt)</span><span>Gratuit</span>
                          </div>
                        ) : cityZone === 'montreal' ? (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, color: 'var(--ink-800)' }}>
                            <span>Livraison à domicile — Grand Montréal</span>
                            <span>{price.deliveryFee} {route.currency}</span>
                          </div>
                        ) : (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, color: 'var(--warn-700)' }}>
                              <span>Livraison hors région</span><span>À évaluer</span>
                            </div>
                            <p style={{ fontSize: 11.5, color: 'var(--ink-400)', marginTop: 4, lineHeight: 1.5 }}>
                              Facture envoyée par email à l'arrivée de votre colis à Montréal.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ padding: '14px 16px', borderTop: '2px solid var(--ink-900)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-700)' }}>Total à payer maintenant</span>
                      <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-900)' }}>{price.total.toFixed(0)} {route.currency}</span>
                    </div>
                  </div>

                  <div className="co-label" style={{ marginBottom: 10 }}>Mode de paiement</div>
                  <div className="co-opts">
                    {[
                      { id: 'card',    label: 'Carte bancaire',     sub: 'Visa, Mastercard, Amex' },
                      { id: 'interac', label: 'Virement Interac',   sub: 'Paiement sécurisé par courriel' },
                      { id: 'cash',    label: "Espèces à l'agence", sub: "À régler avant l'expédition" },
                    ].map(m => (
                      <button key={m.id} className={`co-opt${form.payMethod === m.id ? ' is-sel' : ''}`} onClick={() => upd('payMethod', m.id)}>
                        <div className="co-opt__radio" />
                        <div className="co-opt__body">
                          <div className="co-opt__label">{m.label}</div>
                          <div className="co-opt__sub">{m.sub}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Navigation ── */}
              <div className="co-nav">
                <button className="co-btn co-btn--ghost" onClick={prev}>
                  ← {step === 0 ? "Retour à l'accueil" : 'Précédent'}
                </button>
                <button
                  className={`co-btn ${step === STEPS.length - 1 ? 'co-btn--brand' : 'co-btn--primary'}`}
                  onClick={next}
                  disabled={!canNext()}
                  style={{ opacity: canNext() ? 1 : 0.4, cursor: canNext() ? 'pointer' : 'default' }}
                >
                  {step === STEPS.length - 1
                    ? `Payer ${price ? price.total.toFixed(0) + ' ' + route.currency : ''} →`
                    : 'Continuer →'}
                </button>
              </div>
            </>
          )}
        </div>

        <aside className="co-aside">
          <Summary
            route={route}
            departure={departure}
            items={items}
            totalKg={totalKg}
            price={price}
            form={form}
            step={step}
            isDone={isDone}
          />
        </aside>
      </div>

      <SiteFooter />
    </div>
  );
}
