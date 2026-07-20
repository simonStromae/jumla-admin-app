'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { TopBar, SiteNav, SiteFooter } from './SiteLayout.jsx';
import { useT, useLocale } from '@/src/lib/i18n';
import '@/src/styles/client-omega.css';
import '@/src/styles/booking.css';
import PhoneInput from '@/src/components/PhoneInput.jsx';

// ── Catégories d'articles (alignées avec l'admin) ──
const ITEM_CATEGORIES = [
  { id: 'standard',     label: 'Standard',                      icon: '📦', extraPerKg: 0,  hint: 'Savons, épices, cube Maggi, arachides, pagnes…' },
  { id: 'vetements',    label: 'Vêtements / Chaussures / Sacs', icon: '👗', extraPerKg: 2,  hint: 'Robes, pantalons, chaussures, sacs à main…' },
  { id: 'cosmetique',   label: 'Cosmétiques / Compléments',     icon: '💄', extraPerKg: 3,  hint: 'Crèmes, parfums, produits capillaires…' },
  { id: 'alimentaire',  label: 'Alimentaire / Épices',          icon: '🥘', extraPerKg: 0,  hint: 'Ndolè, poisson fumé, café, cacao, safou…' },
  { id: 'biere',        label: 'Bière',                         icon: '🍺', extraPerKg: 6,  hint: 'Bouteilles ou canettes — frais SAQ inclus' },
  { id: 'manioc_huile', label: 'Bâton de manioc / Huile rouge', icon: '🌿', extraPerKg: 0,  hint: 'Bâtons de manioc, huile de palme rouge…' },
  { id: 'electronique', label: 'Électronique',                  icon: '📱', extraPerKg: 5,  hint: 'Téléphones, ordinateurs, accessoires…' },
  { id: 'documents',    label: 'Documents',                     icon: '📄', extraPerKg: -2, hint: 'Papiers administratifs, courrier officiel…' },
];

// ── Tarifs par défaut (règles d'affaires) — 8 paliers ──
const DEFAULT_TIERS = [
  { from: 0.5,   to: 3,        transportFlat: 50,   cartonFlat: 1,    manutentionFlat: 4,                    douaneFlat: 5,      formalitesFlat: 5 },
  { from: 3.5,   to: 9.5,      transportPerKg: 13,  cartonPerUnit: 1.5, manutentionFlat: 5,                  douanePerKg: 3,     formalitesPerKg: 2 },
  { from: 10,    to: 22.5,     transportPerKg: 12,  cartonPerUnit: 1.5, manutentionFlat: 10,                 douanePerKg: 3,     formalitesPerKg: 2 },
  { from: 23.5,  to: 69.5,     transportPerKg: 11,  cartonPerUnit: 1.5, manutentionFlat: 15,                 douanePerKg: 2,     formalitesPerKg: 1.5 },
  { from: 70,    to: 115,      transportPerKg: 10,  cartonPerUnit: 1.5, manutentionPerUnit: 5,  manutentionMin: 20, douanePerKg: 2.5, formalitesPerKg: 1 },
  { from: 115.5, to: 199.5,    transportPerKg: 9,   cartonPerUnit: 1.5, manutentionPerUnit: 4.5, manutentionMin: 27, douanePerKg: 1.5, formalitesPerKg: 1 },
  { from: 200,   to: 250,      transportPerKg: 8,   cartonPerUnit: 1.5, manutentionPerUnit: 4,   manutentionMin: 40, douanePerKg: 1.5, formalitesPerKg: 1 },
  { from: 250.5, to: 99999, transportPerKg: 7.5, cartonPerUnit: 1.5, manutentionPerUnit: 3,   manutentionMin: 60, douanePerKg: 1.5, formalitesPerKg: 1 },
];

const DEFAULT_FEES = {
  tiers: DEFAULT_TIERS,
  bags: { small: 5, medium: 7.5, large: 10 },
  plastic: 0.6,
  saq: { casier24x65: 24.50, casier24x33: 35.83, casier12x50: 21.34 },
  supplements: { vetements: 2, cosmetique: 3, biere: 6, electronique: 5, documents: -2 },
  marginPct: 0,
  montrealIleDelivery: 25,
  montrealGrandDelivery: 30,
  // legacy compat
  flatUpTo3kg: 65, perHalfKgRate: 9,
  cartonBase: 1, cartonPerUnit: 1.5,
  addons: { smallBag: 5, mediumBag: 7.5, largeBag: 10 },
};

// Convert stored route fees (admin grille tarifaire) → calcPrice-compatible format
function routeFeesToCalcFees(storedFees) {
  if (!storedFees) return DEFAULT_FEES;

  const bags        = storedFees.bags        ?? {};
  const supplements = storedFees.supplements ?? {};
  const saq         = storedFees.saq         ?? {};
  const deliveryFee = storedFees.deliveryFee ?? DEFAULT_FEES.montrealIleDelivery;

  let tiers = DEFAULT_FEES.tiers;
  if (Array.isArray(storedFees.tiers) && storedFees.tiers.length > 0) {
    tiers = storedFees.tiers
      .map(t => {
        const from = parseFloat(t.from) || 0;
        const to   = parseFloat(t.to)   || 0;
        // Old flat-only format
        if (t.flat !== undefined && t.transportFlat === undefined && t.transportPerKg === undefined) {
          return { from, to, transportFlat: parseFloat(t.flat) || 0 };
        }
        return { from, to, ...t, from: undefined, to: undefined, ...{ from, to } };
      })
      .filter(t => t.to >= t.from)
      .sort((a, b) => a.from - b.from);
  }

  return {
    ...DEFAULT_FEES,
    tiers,
    marginPct: storedFees.marginPct ?? DEFAULT_FEES.marginPct,
    bags: {
      small:  bags.small  ?? DEFAULT_FEES.bags.small,
      medium: bags.medium ?? DEFAULT_FEES.bags.medium,
      large:  bags.large  ?? DEFAULT_FEES.bags.large,
    },
    supplements: { ...DEFAULT_FEES.supplements, ...supplements },
    saq: { ...DEFAULT_FEES.saq, ...saq },
    montrealIleDelivery:   deliveryFee,
    montrealGrandDelivery: storedFees.montrealGrandDelivery ?? Math.round(deliveryFee * 1.2),
    addons: {
      smallBag:  bags.small  ?? DEFAULT_FEES.bags.small,
      mediumBag: bags.medium ?? DEFAULT_FEES.bags.medium,
      largeBag:  bags.large  ?? DEFAULT_FEES.bags.large,
    },
  };
}

// ── Pure-JS unified pricing engine (mirrors calculateFromFees in pricing.ts) ──
function r2(v) { return Math.round(v * 100) / 100; }

function findTier(tiers, totalKg) {
  if (!tiers || tiers.length === 0) return null;
  // Exact match
  const match = tiers.find(t => totalKg >= t.from && totalKg <= t.to);
  if (match) return match;
  // In a gap: use the next tier (round up to nearest tier)
  const next = tiers.find(t => t.from > totalKg);
  if (next) return next;
  // Below minimum: first tier
  if (totalKg < tiers[0].from) return tiers[0];
  // Beyond all tiers: last tier
  return tiers[tiers.length - 1];
}

function calcPrice(items, fees, addons, delivery, cityZone) {
  const totalKg = r2(items.reduce((s, i) => s + (parseFloat(i.kg) || 0), 0));
  if (totalKg <= 0) return null;

  const tiers = (fees.tiers && fees.tiers.length > 0) ? fees.tiers : DEFAULT_TIERS;
  const tier  = findTier(tiers, totalKg);
  if (!tier) return null;

  // Transport
  let transport = 0;
  if (tier.transportFlat !== undefined) {
    transport = tier.transportFlat;
  } else if (tier.transportPerKg !== undefined) {
    transport = r2(tier.transportPerKg * totalKg);
  }

  // Supplements grouped by category
  const catKgMap = {};
  items.forEach(item => {
    const kg = parseFloat(item.kg) || 0;
    if (kg <= 0) return;
    const cat = item.cat || 'standard';
    catKgMap[cat] = (catKgMap[cat] || 0) + kg;
  });

  const suppRates = fees.supplements || DEFAULT_FEES.supplements;
  const catSurchargeLines = Object.entries(catKgMap).map(([catId, kg]) => {
    const def   = ITEM_CATEGORIES.find(c => c.id === catId);
    const rate  = suppRates[catId] ?? def?.extraPerKg ?? 0;
    return { catId, label: def?.label || catId, kg, rate, amount: r2(kg * rate) };
  }).filter(l => l.rate !== 0);
  const catSurchargeTotal = r2(catSurchargeLines.reduce((s, l) => s + l.amount, 0));

  // SAQ (beer items)
  const saqRates = fees.saq || DEFAULT_FEES.saq;
  const saqLines = items
    .filter(item => item.cat === 'biere' && item.beerFormat && Number(item.nbCasiers) > 0)
    .map(item => {
      const key  = 'casier' + item.beerFormat;
      const rate = saqRates[key] ?? 0;
      const nb   = Number(item.nbCasiers);
      return { format: item.beerFormat, nbCasiers: nb, rate, amount: r2(rate * nb) };
    });
  const saqTotal = r2(saqLines.reduce((s, l) => s + l.amount, 0));

  // Carton
  const nbCartons = addons.cartons || 0;
  let carton = 0;
  if (tier.cartonFlat !== undefined) {
    carton = tier.cartonFlat;
  } else if (tier.cartonPerUnit !== undefined) {
    carton = r2(tier.cartonPerUnit * nbCartons);
  }

  // Sacs
  const bagRates = fees.bags || DEFAULT_FEES.bags;
  const addonSmall  = (addons.smallBag  || 0) * bagRates.small;
  const addonMedium = (addons.mediumBag || 0) * bagRates.medium;
  const addonLarge  = (addons.largeBag  || 0) * bagRates.large;
  const sacs = r2(addonSmall + addonMedium + addonLarge);

  // Manutention
  const totalSacs = (addons.smallBag || 0) + (addons.mediumBag || 0) + (addons.largeBag || 0);
  let manutention = 0;
  if (tier.manutentionFlat !== undefined) {
    manutention = tier.manutentionFlat;
  } else if (tier.manutentionPerUnit !== undefined) {
    const nbEmballages = nbCartons + totalSacs;
    manutention = r2(Math.max(tier.manutentionMin || 0, tier.manutentionPerUnit * nbEmballages));
  }

  // Douane
  let douane = 0;
  if (tier.douaneFlat !== undefined) {
    douane = tier.douaneFlat;
  } else if (tier.douanePerKg !== undefined) {
    douane = r2(tier.douanePerKg * totalKg);
  }

  // Formalites
  let formalites = 0;
  if (tier.formalitesFlat !== undefined) {
    formalites = tier.formalitesFlat;
  } else if (tier.formalitesPerKg !== undefined) {
    formalites = r2(tier.formalitesPerKg * totalKg);
  }

  const addonTotal = r2(sacs + carton);

  // Delivery
  const isExpedition      = delivery === 'expedition';
  const isMontrealIle     = !isExpedition && delivery === 'home' && cityZone === 'montreal-ile';
  const isMontrealGrand   = !isExpedition && delivery === 'home' && cityZone === 'montreal-grand';
  const isOutsideDelivery = !isExpedition && delivery === 'home' && cityZone === 'other';
  const deliveryFee       = isMontrealIle   ? (fees.montrealIleDelivery   || 25)
                          : isMontrealGrand ? (fees.montrealGrandDelivery || 30) : 0;

  const sousTotal  = r2(transport + catSurchargeTotal + carton + sacs + manutention + douane + formalites + saqTotal);
  const marginPct  = fees.marginPct ?? DEFAULT_FEES.marginPct;
  const marge      = r2(sousTotal * (marginPct / 100));
  const prixClient = r2(sousTotal + marge);

  const total = r2(prixClient + (isExpedition || isOutsideDelivery ? 0 : deliveryFee));

  return {
    totalKg, tier,
    transport,
    catSurchargeLines, catSurchargeTotal,
    saqLines, saqTotal,
    carton, cartonRate: tier.cartonFlat !== undefined ? tier.cartonFlat : (tier.cartonPerUnit || 1.5),
    addonSmall, addonMedium, addonLarge, addonTotal, sacs,
    manutention, douane, formalites,
    sousTotal, marginPct, marge, prixClient,
    deliveryFee, isExpedition, isMontrealIle, isMontrealGrand, isOutsideDelivery,
    total,
    // legacy compat
    billedKg: totalKg,
    baseShipping: transport,
  };
}

// ── Villes avec 3 zones ──
const CITIES = [
  // Île de Montréal
  { label: 'Montréal',            zone: 'montreal-ile' },
  { label: 'Westmount',           zone: 'montreal-ile' },
  { label: 'Outremont',           zone: 'montreal-ile' },
  { label: 'Côte-Saint-Luc',      zone: 'montreal-ile' },
  { label: 'LaSalle',             zone: 'montreal-ile' },
  { label: 'Verdun',              zone: 'montreal-ile' },
  { label: 'Lachine',             zone: 'montreal-ile' },
  { label: 'Dorval',              zone: 'montreal-ile' },
  { label: 'Pointe-Claire',       zone: 'montreal-ile' },
  { label: 'Dollard-des-Ormeaux', zone: 'montreal-ile' },
  { label: 'Mont-Royal',          zone: 'montreal-ile' },
  // Grand Montréal
  { label: 'Laval',               zone: 'montreal-grand' },
  { label: 'Longueuil',           zone: 'montreal-grand' },
  { label: 'Brossard',            zone: 'montreal-grand' },
  { label: 'Saint-Lambert',       zone: 'montreal-grand' },
  { label: 'Boucherville',        zone: 'montreal-grand' },
  { label: 'Repentigny',          zone: 'montreal-grand' },
  { label: 'Terrebonne',          zone: 'montreal-grand' },
  // Hors région
  { label: 'Hors région',         zone: 'other' },
];

// ── Atoms ──
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

function itemIcon(desc, cat) {
  const def = ITEM_CATEGORIES.find(c => c.id === cat);
  if (def?.icon) return def.icon;
  const d = (desc || '').toLowerCase();
  if (d.match(/valise|sac|bag|vêt|habit|cloth/)) return '👜';
  if (d.match(/chaussure|sandale|shoe/)) return '👟';
  if (d.match(/téléphone|phone|élec|laptop|ordi/)) return '📱';
  if (d.match(/ndolè|épice|food|alim|congel/)) return '🥘';
  if (d.match(/docu|papier|paper/)) return '📄';
  return '📦';
}

// ── Summary panel ──
function Summary({ route, departure, items, price, form, step, isDone }) {
  const t = useT();
  const { locale } = useLocale();
  const city     = CITIES.find(c => c.label === form.recipCity);
  const cityZone = city?.zone || 'montreal-ile';
  const filledItems = items.filter(i => i.desc || parseFloat(i.kg) > 0);
  const dateLocale = locale === 'fr' ? 'fr-FR' : 'en-CA';

  return (
    <div className="co-summary">
      <div className="co-summary__head">{t('booking.summary.title')}</div>

      {filledItems.length > 0 && (
        <div className="co-summary__items">
          {filledItems.map(item => (
            <div key={item.id} className="co-summary__item">
              <div className="co-summary__item-thumb">
                {itemIcon(item.desc, item.cat)}
                {item.pieces > 1 && <span className="co-summary__item-qty">{item.pieces}</span>}
              </div>
              <div className="co-summary__item-info">
                <div className="co-summary__item-name">{item.desc || t('booking.summary.article')}</div>
                <div className="co-summary__item-sub">
                  {ITEM_CATEGORIES.find(c => c.id === item.cat)?.label || 'Standard'}
                  {item.cat !== 'standard' && item.pieces > 1 ? ` · ${item.pieces} pièces` : ''}
                </div>
              </div>
              <span className="co-summary__item-kg">{item.kg || '—'} kg</span>
            </div>
          ))}
        </div>
      )}

      <div className="co-summary__section">
        <div className="co-summary__label">{t('booking.summary.itinerary')}</div>
        <div className={`co-summary__row${route ? '' : ' co-summary__row--muted'}`}>
          <span>{t('booking.summary.route')}</span><span>{route?.label ?? '—'}</span>
        </div>
        <div className={`co-summary__row${departure ? '' : ' co-summary__row--muted'}`}>
          <span>{t('booking.summary.departure')}</span><span>{departure?.departureDate ? new Date(departure.departureDate).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', timeZone: 'UTC' }) : departure?.code ?? '—'}</span>
        </div>
        {route && <div className="co-summary__row co-summary__row--muted"><span>{t('booking.summary.transitEst')}</span><span>~{route.transit} {t('unit.days')}</span></div>}
      </div>

      {step >= 1 && (
        <div className="co-summary__section">
          <div className="co-summary__label">{t('booking.summary.fees')}</div>
          {price ? (
            <>
              <div className="co-summary__row">
                <span>Transport {price.totalKg} kg</span>
                <span>{price.transport.toFixed(0)} {route.currency}</span>
              </div>
              {price.catSurchargeLines.map(l => (
                <div key={l.catId} className="co-summary__row">
                  <span>{t('booking.summary.suppl')} {l.label}</span>
                  <span>{l.amount >= 0 ? '+' : ''}{l.amount.toFixed(0)} {route.currency}</span>
                </div>
              ))}
              {price.saqLines?.length > 0 && (
                <div className="co-summary__row">
                  <span>{t('booking.summary.saq')}</span>
                  <span>+{price.saqTotal.toFixed(2)} {route.currency}</span>
                </div>
              )}
              {price.addonTotal > 0 && <div className="co-summary__row"><span>{t('booking.summary.accessories')}</span><span>+{price.addonTotal.toFixed(0)} {route.currency}</span></div>}
              {step >= 2 && (
                price.isExpedition ? (
                  <div className="co-summary__row co-summary__row--muted"><span>{t('booking.coords.pickup')}</span><span>{t('booking.summary.toEvaluate')}</span></div>
                ) : form.delivery === 'pickup' ? (
                  <div className="co-summary__row"><span>{t('booking.summary.delivery')}</span><span>{t('booking.summary.deliveryFree')}</span></div>
                ) : price.isMontrealIle ? (
                  <div className="co-summary__row"><span>{t('booking.summary.deliveryIsle')}</span><span>+{price.deliveryFee} {route.currency}</span></div>
                ) : price.isMontrealGrand ? (
                  <div className="co-summary__row"><span>{t('booking.summary.deliveryGrand')}</span><span>+{price.deliveryFee} {route.currency}</span></div>
                ) : (
                  <div className="co-summary__row co-summary__row--muted"><span>{t('booking.summary.deliveryOther')}</span><span>{t('booking.summary.toEvaluate')}</span></div>
                )
              )}
              {step < 2 && <div className="co-summary__row co-summary__row--muted"><span>{t('booking.summary.delivery')}</span><span>{t('booking.summary.nextStep')}</span></div>}
            </>
          ) : (
            <div className="co-summary__row co-summary__row--muted"><span>{t('booking.summary.noItems')}</span><span>—</span></div>
          )}
        </div>
      )}

      <div className="co-summary__total">
        <div>
          <div className="co-summary__total-label">{t('booking.summary.total')}</div>
          {price && <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 2 }}>{t('booking.summary.noTax')}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          {route && <div style={{ fontSize: 11, color: 'var(--ink-400)', marginBottom: 2 }}>{route.currency}</div>}
          <span className="co-summary__total-price">{price ? `${price.total.toFixed(0)}` : '—'}</span>

        </div>
      </div>
    </div>
  );
}

// ── Auth gate ──
function AuthGate({ onAuth, onNav }) {
  const t = useT();
  const [tab, setTab]       = useState('login');
  const [fields, setFields] = useState({ email: '', name: '', password: '', confirm: '' });
  const [code, setCode]     = useState('');
  const [expected, setExpected] = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const upd = (k, v) => { setFields(f => ({ ...f, [k]: v })); setError(''); };

  const doLogin = () => {
    if (!fields.email || !fields.password) { setError('Remplissez tous les champs.'); return; }
    setLoading(true);
    setTimeout(() => {
      const user = { name: fields.email.split('@')[0], email: fields.email };
      localStorage.setItem('jumla_user', JSON.stringify(user));
      onAuth(user);
    }, 800);
  };

  const doRegister = () => {
    if (!fields.name || !fields.email || !fields.password) { setError('Remplissez tous les champs.'); return; }
    if (fields.password !== fields.confirm) { setError(t('error.passwordMismatch')); return; }
    if (fields.password.length < 6) { setError('Mot de passe trop court (6 caractères min.).'); return; }
    const gen = Math.floor(100000 + Math.random() * 900000).toString();
    setExpected(gen);
    setTab('verify');
    setError('');
  };

  const doVerify = () => {
    if (code !== expected) { setError('Code incorrect, réessayez.'); return; }
    setLoading(true);
    setTimeout(() => {
      const user = { name: fields.name, email: fields.email };
      localStorage.setItem('jumla_user', JSON.stringify(user));
      onAuth(user);
    }, 600);
  };

  const errBox = error && (
    <div style={{ fontSize: 12.5, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>{error}</div>
  );

  return (
    <div className="co-wrap">
      <TopBar />
      <SiteNav onNav={onNav} onBook={() => {}} mode="booking" />
      <div style={{ minHeight: '72vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px' }}>
        <div style={{ width: '100%', maxWidth: 440, background: 'white', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px 36px', boxShadow: '0 4px 32px rgba(0,0,0,.07)' }}>

          <div style={{ textAlign: 'center', marginBottom: 26 }}>
            <div style={{ width: 48, height: 48, background: 'var(--brand-500)', borderRadius: 'var(--radius)', display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 900, color: 'white', margin: '0 auto 10px' }}>J</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink-900)' }}>{t('booking.auth.title')}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-400)', marginTop: 3 }}>{t('booking.auth.subtitle')}</div>
          </div>

          {tab !== 'verify' && (
            <div style={{ display: 'flex', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 22 }}>
              {[['login', t('booking.auth.login')], ['register', t('booking.auth.register')]].map(([tabKey, l]) => (
                <button key={tabKey} onClick={() => { setTab(tabKey); setError(''); }}
                  style={{ flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                    background: tab === tabKey ? 'var(--ink-900)' : 'white',
                    color: tab === tabKey ? 'white' : 'var(--ink-500)' }}>
                  {l}
                </button>
              ))}
            </div>
          )}

          {tab === 'login' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label={t('booking.auth.emailLabel')}>
                <input className="co-input" type="email" value={fields.email} onChange={e => upd('email', e.target.value)}
                  placeholder="vous@email.com" onKeyDown={e => e.key === 'Enter' && doLogin()} autoFocus />
              </Field>
              <Field label={t('booking.auth.passwordLabel')}>
                <input className="co-input" type="password" value={fields.password} onChange={e => upd('password', e.target.value)}
                  placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && doLogin()} />
              </Field>
              {errBox}
              <button className="co-btn co-btn--brand" onClick={doLogin} disabled={loading} style={{ marginTop: 4 }}>
                {loading ? '…' : t('booking.auth.loginBtn')}
              </button>
            </div>
          )}

          {tab === 'register' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label={t('booking.auth.nameLabel')}>
                <input className="co-input" value={fields.name} onChange={e => upd('name', e.target.value)} placeholder="Awa Nkemdirim" autoFocus />
              </Field>
              <Field label={t('booking.auth.emailLabel')}>
                <input className="co-input" type="email" value={fields.email} onChange={e => upd('email', e.target.value)} placeholder="vous@email.com" />
              </Field>
              <Field label={t('booking.auth.passwordLabel')}>
                <input className="co-input" type="password" value={fields.password} onChange={e => upd('password', e.target.value)} placeholder="6 caractères min." />
              </Field>
              <Field label={t('booking.auth.confirmLabel')}>
                <input className="co-input" type="password" value={fields.confirm} onChange={e => upd('confirm', e.target.value)}
                  placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && doRegister()} />
              </Field>
              {errBox}
              <button className="co-btn co-btn--brand" onClick={doRegister} style={{ marginTop: 4 }}>
                {t('booking.auth.registerBtn')}
              </button>
            </div>
          )}

          {tab === 'verify' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 38, marginBottom: 2 }}>📧</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>{t('booking.auth.verifyTitle')}</div>
              <p style={{ fontSize: 13, color: 'var(--ink-500)', lineHeight: 1.65 }}>
                {t('booking.auth.verifyDesc')}<br /><strong>{fields.email}</strong>
              </p>
              <div style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-100)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 12.5, color: 'var(--brand-700)' }}>
                {t('booking.auth.demoCode')} <strong style={{ fontFamily: 'ui-monospace, monospace', fontSize: 15 }}>{expected}</strong>
              </div>
              <input className="co-input" value={code} onChange={e => { setCode(e.target.value); setError(''); }}
                placeholder="· · · · · ·" maxLength={6} autoFocus
                style={{ textAlign: 'center', fontSize: 24, fontFamily: 'ui-monospace, monospace', letterSpacing: '.2em', fontWeight: 700 }}
                onKeyDown={e => e.key === 'Enter' && doVerify()} />
              {errBox}
              <button className="co-btn co-btn--brand" onClick={doVerify} disabled={loading}>
                {loading ? '…' : t('booking.auth.verifyBtn')}
              </button>
              <button style={{ background: 'none', border: 'none', color: 'var(--ink-400)', fontSize: 12.5, cursor: 'pointer', marginTop: 2 }}
                onClick={() => { setTab('register'); setCode(''); setError(''); }}>
                {t('booking.auth.backToRegister')}
              </button>
            </div>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

// ── Main ──

// ── Calendar campaign picker ──
function getUTCDateKey(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
}

function CampaignCalendar({ campaigns, selected, onSelect, routeLabel }) {
  const t = useT();
  const { locale } = useLocale();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstWithDate = campaigns.find(c => c.departureDate);
  const [viewYear,  setViewYear]  = useState(() => firstWithDate ? new Date(firstWithDate.departureDate).getUTCFullYear()  : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => firstWithDate ? new Date(firstWithDate.departureDate).getUTCMonth()     : today.getMonth());

  const campaignsByDate = {};
  campaigns.forEach(c => {
    const key = getUTCDateKey(c.departureDate);
    if (!key) return;
    if (!campaignsByDate[key]) campaignsByDate[key] = [];
    campaignsByDate[key].push(c);
  });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth     = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedCampaign = campaigns.find(c => c.id === selected);

  const fmtShort = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-CA', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  };

  return (
    <div>
      {/* Calendar */}
      <div style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border-soft)' }}>
          <button onClick={prevMonth} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: 15, display: 'grid', placeItems: 'center', color: 'var(--ink-600)' }}>←</button>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-900)' }}>{t('booking.months')[viewMonth]} {viewYear}</span>
          <button onClick={nextMonth} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: 15, display: 'grid', placeItems: 'center', color: 'var(--ink-600)' }}>→</button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border-soft)' }}>
          {t('booking.days').map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.05em', padding: '8px 0' }}>{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '1fr' }}>
          {cells.map((day, i) => {
            if (!day) return (
              <div key={i} style={{ borderRight: '1px solid var(--border-soft)', borderBottom: '1px solid var(--border-soft)', minHeight: 80 }} />
            );
            const dateStr  = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const dayCamps = campaignsByDate[dateStr] ?? [];
            const c        = dayCamps[0];
            const has      = dayCamps.length > 0;
            const isPast   = new Date(viewYear, viewMonth, day) < today;
            const isSel    = has && c.id === selected;
            const isLow    = has && c.spotsKg !== null && c.spotsKg < 50;
            const isFull   = has && c.spotsKg !== null && c.spotsKg === 0;

            return (
              <button
                key={i}
                disabled={!has || isPast || isFull}
                onClick={() => has && !isPast && !isFull && onSelect(c.id)}
                style={{
                  border: 'none',
                  borderRight: '1px solid var(--border-soft)',
                  borderBottom: '1px solid var(--border-soft)',
                  borderRadius: 0,
                  background: isSel
                    ? 'var(--brand-600)'
                    : has && !isPast && !isFull
                      ? isLow ? 'var(--info-50)' : 'var(--brand-50)'
                      : 'white',
                  cursor: has && !isPast && !isFull ? 'pointer' : 'default',
                  padding: '8px 6px',
                  minHeight: 80,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 4,
                  transition: 'background .12s',
                  textAlign: 'left',
                  outline: isSel ? '2px solid var(--brand-700)' : 'none',
                  outlineOffset: -2,
                  position: 'relative',
                }}
              >
                {/* Day number */}
                <span style={{
                  fontSize: 13,
                  fontWeight: has && !isPast ? 700 : 400,
                  color: isSel ? 'white' : isPast ? 'var(--ink-200)' : has ? (isLow ? 'var(--info-700)' : 'var(--brand-800)') : 'var(--ink-600)',
                  lineHeight: 1,
                }}>
                  {day}
                </span>

                {/* Departure info */}
                {has && !isPast && !isFull && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                    {/* Route */}
                    {routeLabel && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, lineHeight: 1,
                        color: isSel ? 'rgba(255,255,255,.85)' : isLow ? 'var(--info-700)' : 'var(--brand-600)',
                        textTransform: 'uppercase', letterSpacing: '.03em',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>✈ {routeLabel}</span>
                    )}
                    {/* Arrival */}
                    {c.arrivalDate && (
                      <span style={{
                        fontSize: 9, lineHeight: 1,
                        color: isSel ? 'rgba(255,255,255,.75)' : 'var(--ink-400)',
                        whiteSpace: 'nowrap',
                      }}>→ {fmtShort(c.arrivalDate)}</span>
                    )}
                    {/* Capacity badge */}
                    {c.spotsKg !== null && (
                      <span style={{
                        marginTop: 2,
                        display: 'inline-block',
                        fontSize: 9, fontWeight: 700, lineHeight: 1,
                        padding: '2px 5px', borderRadius: 4,
                        background: isSel
                          ? 'rgba(255,255,255,.2)'
                          : isLow ? 'var(--info-100)' : 'var(--brand-100)',
                        color: isSel
                          ? 'white'
                          : isLow ? 'var(--info-700)' : 'var(--brand-700)',
                        whiteSpace: 'nowrap',
                      }}>
                        {isLow ? `⚠ ${c.spotsKg} kg` : `${c.spotsKg} kg`}
                      </span>
                    )}
                  </div>
                )}

                {/* Full */}
                {isFull && (
                  <span style={{ fontSize: 9, color: 'var(--ink-300)', fontWeight: 600 }}>{t('booking.route.full')}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected campaign summary */}
      {selectedCampaign && (
        <div style={{ marginTop: 14, padding: '14px 16px', background: 'var(--brand-50)', border: '2px solid var(--brand-200)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>✈️</span>
            <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--brand-900)' }}>{t('booking.route.selected')}</span>
            <span style={{ marginLeft: 'auto', fontSize: 11.5, fontWeight: 700, background: 'var(--brand-600)', color: 'white', padding: '3px 10px', borderRadius: 99 }}>
              {selectedCampaign.code}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: 'white', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--brand-100)' }}>
              <div style={{ fontSize: 10.5, color: 'var(--ink-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{t('booking.route.dep')}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink-900)' }}>
                {selectedCampaign.departureDate
                  ? new Date(selectedCampaign.departureDate).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-CA', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
                  : '—'}
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--brand-100)' }}>
              <div style={{ fontSize: 10.5, color: 'var(--ink-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{t('booking.route.arr')}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink-900)' }}>
                {selectedCampaign.arrivalDate
                  ? new Date(selectedCampaign.arrivalDate).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-CA', { day: 'numeric', month: 'long', timeZone: 'UTC' })
                  : '—'}
              </div>
            </div>
          </div>
          {selectedCampaign.spotsKg !== null && (
            <div style={{ fontSize: 12.5, color: selectedCampaign.spotsKg < 50 ? 'var(--info-700)' : 'var(--brand-600)', fontWeight: 600 }}>
              {selectedCampaign.spotsKg < 50
                ? t('booking.route.spotsLow').replace('{n}', selectedCampaign.spotsKg)
                : t('booking.route.spotsAvail').replace('{n}', selectedCampaign.spotsKg)
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BookingScreen({ onNav, embedded = false }) {
  const { data: sessionData } = useSession();
  const t = useT();
  const { locale } = useLocale();
  const [step, setStep] = useState(0);

  const STEPS = [
    { label: t('booking.steps.route') },
    { label: t('booking.steps.parcel') },
    { label: t('booking.steps.coordinates') },
    { label: t('booking.steps.payment') },
  ];
  const [dbRoutes, setDbRoutes]         = useState([]);
  const [campaigns, setCampaigns]       = useState([]);
  const [routesLoading, setRoutesLoading] = useState(true);

  const [form, setForm] = useState({
    route: '', departure: '',
    addons: { smallBag: 0, mediumBag: 0, largeBag: 0, cartons: 0 },
    senderName: '', senderPhone: '', senderEmail: '',
    recipName: '', recipPhone: '', recipCity: 'Montréal', recipCityCustom: '',
    delivery: 'pickup',
    recipAddress: '', recipApt: '', recipProvince: 'QC', recipPostal: '',
    payMethod: 'card',
  });
  const [simLines] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem('sim_data');
      if (!raw) return null;
      sessionStorage.removeItem('sim_data');
      return JSON.parse(raw)?.lines ?? null;
    } catch { return null; }
  });

  const [items, setItems] = useState(() =>
    simLines?.length > 0
      ? simLines.map((l, i) => ({
          id: i + 1,
          cat: l.cat ?? 'standard',
          desc: '',
          pieces: 1,
          kg: l.weight ?? '',
          beerFormat: '24x65',
          nbCasiers: '',
        }))
      : [{ id: 1, cat: 'standard', desc: '', pieces: 1, kg: '', beerFormat: '24x65', nbCasiers: '' }]
  );
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [savedRecipients, setSavedRecipients] = useState([]);
  const [saveAddr, setSaveAddr] = useState(false);
  const [saveRecip, setSaveRecip] = useState(false);
  // Disclaimer modal
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [hasValuable, setHasValuable]       = useState(null); // null | true | false
  const [declaredValueCad, setDeclaredValueCad] = useState('');
  const [waiverAccepted, setWaiverAccepted]     = useState(false);
  const [forbiddenAcknowledged, setForbiddenAcknowledged] = useState(false);
  const coverageFee = hasValuable && declaredValueCad ? Math.round(Number(declaredValueCad) * 0.20) : 0;
  const disclaimerReady = forbiddenAcknowledged && (
    hasValuable === false ? waiverAccepted :
    hasValuable === true  ? (Number(declaredValueCad) > 0) : false
  );

  // 'idle' | 'interac' | 'processing' | 'pending' | 'error'
  const [payStatus, setPayStatus]   = useState('idle');
  const [bookingRef, setBookingRef] = useState('');
  const [bookingErr, setBookingErr] = useState('');
  const [dropoffInfo, setDropoffInfo] = useState(null);
  const [paymentEmail, setPaymentEmail] = useState('incjumla@gmail.com');
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jumla_user')); } catch { return null; }
  });
  // When embedded in client layout, fall back to NextAuth session data
  const effectiveUser = user ?? (embedded && sessionData?.user ? { name: sessionData.user.name ?? '', email: sessionData.user.email ?? '' } : null);

  useEffect(() => {
    fetch('/api/public/config').then(r => r.json()).then(d => {
      if (d.paymentEmail) setPaymentEmail(d.paymentEmail);
    }).catch(() => {});
  }, []);

  // Pre-fill sender name + email from session when embedded
  useEffect(() => {
    if (!embedded || !effectiveUser) return;
    setForm(f => ({
      ...f,
      senderName:  f.senderName  || effectiveUser.name  || '',
      senderEmail: f.senderEmail || effectiveUser.email || '',
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embedded, effectiveUser?.name, effectiveUser?.email]);

  // Pre-fill sender phone + load saved addresses from profile API when embedded
  useEffect(() => {
    if (!embedded) return;
    fetch('/api/me/profile')
      .then(r => r.ok ? r.json() : null)
      .then(profile => {
        if (profile?.phone) {
          setForm(f => ({ ...f, senderPhone: f.senderPhone || profile.phone }));
        }
        if (Array.isArray(profile?.savedAddresses)  && profile.savedAddresses.length  > 0) {
          setSavedAddresses(profile.savedAddresses);
        }
        if (Array.isArray(profile?.savedRecipients) && profile.savedRecipients.length > 0) {
          setSavedRecipients(profile.savedRecipients);
        }
      })
      .catch(() => {});
  }, [embedded]);

  useEffect(() => {
    fetch('/api/public/routes').then(r => r.json()).then(data => {
      const routes = Array.isArray(data) ? data : [];
      setDbRoutes(routes);
      if (routes.length > 0) setForm(f => ({ ...f, route: routes[0].id }));
      setRoutesLoading(false);
    }).catch(() => setRoutesLoading(false));
  }, []);

  useEffect(() => {
    if (!form.route) return;
    fetch('/api/public/campaigns?routeId=' + form.route).then(r => r.json()).then(data => {
      setCampaigns(Array.isArray(data) ? data : []);
      setForm(f => ({ ...f, departure: '' }));
    }).catch(() => {});
  }, [form.route]);

  const upd      = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const updAddon = (k, v) => setForm(f => ({ ...f, addons: { ...f.addons, [k]: v } }));
  const addItem    = () => setItems(is => [...is, { id: Date.now(), cat: 'standard', desc: '', pieces: 1, kg: '', beerFormat: '24x65', nbCasiers: '' }]);
  const removeItem = id => setItems(is => is.filter(i => i.id !== id));
  const updItem    = (id, k, v) => setItems(is => is.map(i => i.id === id ? { ...i, [k]: v } : i));

  const routeData  = dbRoutes.find(r => r.id === form.route);
  const route      = routeData ? {
    ...routeData,
    currency: routeData.currency ?? 'CAD',
    transit:  routeData.transitDays ?? 14,
    fees:     routeFeesToCalcFees(routeData.fees),
  } : null;
  const departure  = campaigns.find(c => c.id === form.departure);
  const isDone    = payStatus === 'pending';

  const city     = CITIES.find(c => c.label === form.recipCity);
  const cityZone = city?.zone || 'montreal-ile';

  const totalKg = items.reduce((sum, i) => sum + (parseFloat(i.kg) || 0), 0);
  const price   = route && totalKg > 0 ? calcPrice(items, route.fees, form.addons, form.delivery, cityZone) : null;

  const montréalIleCities    = CITIES.filter(c => c.zone === 'montreal-ile');
  const montréalGrandCities  = CITIES.filter(c => c.zone === 'montreal-grand');

  const canNext = () => {
    if (step === 0) return !!form.departure;
    if (step === 1) return totalKg > 0;
    if (step === 2) return !!form.senderName && !!form.recipName;
    return true;
  };

  const prev = () => {
    if (payStatus !== 'idle') { setPayStatus('idle'); return; }
    if (step > 0) setStep(s => s - 1); else onNav?.('/');
  };
  const next = () => setStep(s => s + 1);

  const handlePay = () => setShowDisclaimer(true);

  // Interac — save booking then mark as pending
  const confirmInterac = async () => {
    setPayStatus('processing');
    setBookingErr('');

    // Save recipient to profile if checkbox is checked
    if (saveRecip && embedded && form.recipName) {
      const city = form.recipCity === 'Hors région' ? (form.recipCityCustom || '') : form.recipCity;
      const newRecip = { id: Date.now().toString(), label: '', name: form.recipName, phone: form.recipPhone || '', city };
      const updatedRecips = [...savedRecipients, newRecip];
      setSavedRecipients(updatedRecips);
      fetch('/api/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ savedRecipients: updatedRecips }),
      }).catch(() => {});
    }

    // Save address to profile if checkbox is checked
    if (saveAddr && embedded && form.recipAddress) {
      const newAddr = {
        id: Date.now().toString(),
        label: '',
        address: form.recipAddress,
        apt:      form.recipApt || '',
        city:     form.recipCity === 'Hors région' ? (form.recipCityCustom || '') : form.recipCity,
        province: form.recipProvince,
        postal:   form.recipPostal,
      };
      const updated = [...savedAddresses, newAddr];
      setSavedAddresses(updated);
      fetch('/api/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ savedAddresses: updated }),
      }).catch(() => {});
    }

    try {
      const res = await fetch('/api/client/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId:      form.departure,
          items,
          addons:          form.addons,
          senderPhone:     form.senderPhone,
          recipName:       form.recipName,
          recipPhone:      form.recipPhone,
          recipCity:       form.recipCity,
          recipCityCustom: form.recipCityCustom,
          recipAddress:    form.recipAddress,
          recipApt:        form.recipApt,
          recipProvince:   form.recipProvince,
          recipPostal:     form.recipPostal,
          delivery:              form.delivery,
          totalPrice:            price?.total ?? null,
          hasValuable:           !!hasValuable,
          declaredValueCad:      hasValuable ? Number(declaredValueCad) : null,
          waiverAccepted:        !hasValuable && waiverAccepted,
          forbiddenAcknowledged: forbiddenAcknowledged,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setBookingErr(json.error || 'Erreur lors de la réservation');
        setPayStatus('interac');
        return;
      }
      setBookingRef(json.trackingCode);
      setDropoffInfo(json.dropoff ?? null);
      setPayStatus('pending');
    } catch {
      setBookingErr('Erreur réseau. Réessayez.');
      setPayStatus('interac');
    }
  };

  const refCode = bookingRef || '';

  if (!user && !embedded) return <AuthGate onAuth={setUser} onNav={onNav} />;

  return (
    <div className={embedded ? '' : 'co-wrap'}>
      {!embedded && <TopBar />}
      {!embedded && <SiteNav onNav={onNav} onBook={() => {}} mode="booking" />}

      {/* Breadcrumb — public site only */}
      {!embedded && (
        <div className="co-subhead">
          <div className="co-subhead__inner">
            <span className="co-subhead__title">{t('booking.misc.title')}</span>
            <span style={{ fontSize: 12, color: 'var(--ink-400)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 24, height: 24, borderRadius: 999, background: 'var(--brand-100)', color: 'var(--brand-700)', fontSize: 11, fontWeight: 800, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                {effectiveUser?.name?.charAt(0).toUpperCase()}
              </span>
              {effectiveUser?.name} · {effectiveUser?.email}
              <button onClick={() => { localStorage.removeItem('jumla_user'); setUser(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--ink-300)', fontSize: 11, cursor: 'pointer', marginLeft: 4 }}>
                {t('booking.misc.logout')}
              </button>
            </span>
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
      )}

      {/* Embedded: step indicator */}
      {embedded && !isDone && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24, maxWidth: 900 }}>
          {STEPS.map((s, i) => {
            const done    = i < step;
            const current = i === step;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center',
                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                    background: done ? 'var(--brand-400)' : current ? '#111827' : '#f3f4f6',
                    color: done || current ? 'white' : '#6b7280',
                    border: `2px solid ${done ? 'var(--brand-400)' : current ? '#111827' : '#e5e7eb'}`,
                  }}>{done ? '✓' : i + 1}</div>
                  <span className="co-step-label" style={{ fontSize: 12.5, fontWeight: current ? 700 : 500, color: current ? '#111827' : done ? 'var(--brand-600)' : '#9ca3af', whiteSpace: 'nowrap' }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: done ? 'var(--brand-200)' : '#e5e7eb', margin: '0 12px' }} />
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className={embedded ? 'co-body-embedded' : 'co-body'}>
        <div className="co-main">
          {isDone ? (
            <div className="co-done">
              <div className="co-done__icon" style={{ background: 'var(--brand-50)', color: 'var(--brand-600)' }}>✓</div>
              <h2 className="co-done__title">{t('booking.confirm.title')}</h2>
              <p className="co-done__sub">{t('booking.confirm.sub')}</p>

              {refCode && (
                <div style={{ background: 'white', border: '2px solid var(--brand-200)', borderRadius: 'var(--radius)', padding: '14px 24px', marginBottom: 16, textAlign: 'center', width: '100%', maxWidth: 380 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink-400)', marginBottom: 4 }}>{t('booking.confirm.trackingNumber')}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'ui-monospace, monospace', color: 'var(--ink-900)', letterSpacing: '.04em' }}>{refCode}</div>
                </div>
              )}

              {/* Interac instructions */}
              <div style={{ width: '100%', maxWidth: 420, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>🏦</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-800)' }}>{t('booking.confirm.interacTitle')}</span>
                </div>
                <div style={{ background: 'var(--bg-soft)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 10 }}>
                  {[
                    [t('booking.confirm.sendTo'),    paymentEmail,                                                    false],
                    [t('booking.confirm.from'),      effectiveUser?.email ?? '',                                       true ],
                    [t('booking.confirm.amount'),    `${price?.total?.toFixed(0) ?? '—'} ${route?.currency ?? 'CAD'}`, false],
                    [t('booking.confirm.reference'), refCode,                                                          false],
                  ].map(([k, v, highlight], idx) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: idx < 3 ? '1px solid var(--border-soft)' : 'none', background: highlight ? 'var(--brand-50)' : 'transparent' }}>
                      <span style={{ fontSize: 12, color: 'var(--ink-400)', fontWeight: 500 }}>{k}</span>
                      <span style={{ fontWeight: 700, color: highlight ? 'var(--brand-700)' : 'var(--ink-900)', fontFamily: 'ui-monospace, monospace', fontSize: 12.5 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'var(--info-50)', border: '1px solid var(--info-100)', borderRadius: 'var(--radius)', padding: '12px 14px', fontSize: 12.5, color: 'var(--info-700)', lineHeight: 1.65 }}>
                  {t('booking.confirm.warning').replace('{code}', refCode)}
                </div>
              </div>

              {/* Dropoff contact & instructions */}
              {dropoffInfo && (dropoffInfo.address || dropoffInfo.phone || dropoffInfo.whatsapp || dropoffInfo.instructions) && (
                <div style={{ width: '100%', maxWidth: 420, marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 20 }}>📦</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-800)' }}>{t('booking.confirm.dropoffTitle')}</span>
                  </div>
                  <div style={{ background: 'var(--bg-soft)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 10 }}>
                    {dropoffInfo.address && (
                      <div style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border-soft)' }}>
                        <span style={{ fontSize: 13, flexShrink: 0 }}>📍</span>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 600, marginBottom: 2 }}>{t('booking.confirm.dropoffAddress')}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>{dropoffInfo.address}</div>
                        </div>
                      </div>
                    )}
                    {dropoffInfo.hours && (
                      <div style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border-soft)' }}>
                        <span style={{ fontSize: 13, flexShrink: 0 }}>🕐</span>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 600, marginBottom: 2 }}>{t('booking.confirm.dropoffHours')}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>{dropoffInfo.hours}</div>
                        </div>
                      </div>
                    )}
                    {(dropoffInfo.phone || dropoffInfo.whatsapp) && (
                      <div style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: dropoffInfo.instructions ? '1px solid var(--border-soft)' : 'none' }}>
                        <span style={{ fontSize: 13, flexShrink: 0 }}>📞</span>
                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                          {dropoffInfo.phone && (
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 600, marginBottom: 2 }}>{t('booking.confirm.dropoffPhone')}</div>
                              <a href={`tel:${dropoffInfo.phone}`} style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-700)', textDecoration: 'none' }}>{dropoffInfo.phone}</a>
                            </div>
                          )}
                          {dropoffInfo.whatsapp && (
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 600, marginBottom: 2 }}>WhatsApp</div>
                              <a href={`https://wa.me/${dropoffInfo.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 700, color: '#25D366', textDecoration: 'none' }}>{dropoffInfo.whatsapp}</a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {dropoffInfo.instructions && (
                      <div style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--ink-700)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                        {dropoffInfo.instructions}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Adjustment notice */}
              <div style={{ width: '100%', maxWidth: 420, background: 'var(--brand-50)', border: '1px solid var(--brand-100)', borderRadius: 'var(--radius)', padding: '12px 14px', fontSize: 12.5, color: 'var(--brand-700)', lineHeight: 1.65, marginBottom: 8 }}>
                {t('booking.confirm.estimate')}
              </div>

              {(price?.isOutsideDelivery || price?.isExpedition) && (
                <div style={{ width: '100%', maxWidth: 420, background: 'var(--info-50)', border: '1px solid var(--info-100)', borderRadius: 'var(--radius)', padding: '12px 14px', fontSize: 12.5, color: 'var(--info-700)', lineHeight: 1.6, marginBottom: 8 }}>
                  {t('booking.confirm.outside').replace('{city}', form.recipCity === 'Hors région' ? form.recipCityCustom : form.recipCity)}
                </div>
              )}

              <button className="co-btn co-btn--ghost" style={{ marginTop: 8 }} onClick={() => onNav?.(embedded ? '/client/dashboard?booked=' + refCode : '/')}>
                {embedded ? t('booking.confirm.viewParcels') : t('booking.confirm.backHome')}
              </button>
            </div>
          ) : (
            <>
              {/* ── Step 0 : Route & Departure ── */}
              {step === 0 && (
                <div className="co-section">
                  <div className="co-section__title">{t('booking.route.title')}</div>
                  {routesLoading ? (
                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-400)' }}>{t('booking.route.loading')}</div>
                  ) : dbRoutes.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-400)' }}>{t('booking.route.noRoutes')}</div>
                  ) : (
                    <>
                      <div style={{ marginBottom: 24 }}>
                        <div className="co-label" style={{ marginBottom: 10 }}>{t('booking.route.direction')}</div>
                        <div className="co-opts">
                          {dbRoutes.map(r => (
                            <button key={r.id} className={`co-opt${form.route === r.id ? ' is-sel' : ''}`}
                              onClick={() => upd('route', r.id)}>
                              <div className="co-opt__radio" />
                              <div className="co-opt__body">
                                <div className="co-opt__label">✈️ {r.label}</div>
                                <div className="co-opt__sub">{r.code} · {t('booking.misc.transitDays').replace('{n}', r.transitDays ?? 14)}</div>
                              </div>
                              <span className="co-opt__badge">{t('booking.route.badge')}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="co-label" style={{ marginBottom: 12 }}>{t('booking.route.departure')}</div>
                        {campaigns.length === 0 ? (
                          <p style={{ fontSize: 13, color: 'var(--ink-400)', padding: '12px 0' }}>
                            {t('booking.route.noCampaigns')}
                          </p>
                        ) : (
                          <CampaignCalendar
                            campaigns={campaigns}
                            selected={form.departure}
                            onSelect={(id) => upd('departure', id)}
                            routeLabel={routeData ? `${routeData.origin} → ${routeData.destination}` : null}
                          />
                        )}
                        {!form.departure && campaigns.length > 0 && (
                          <p style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 10 }}>{t('booking.route.clickHint')}</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── Step 1 : Parcel content ── */}
              {step === 1 && (
                <div className="co-section">
                  <div className="co-section__title">{t('booking.parcel.title')}</div>

                  {simLines?.length > 0 && (
                    <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 'var(--radius)', padding: '9px 14px', fontSize: 12.5, color: '#065F46', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>✓</span>
                      <span>Contenu pré-rempli depuis votre simulation — modifiez si nécessaire.</span>
                    </div>
                  )}

                  {/* Info hint */}
                  <div style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-100)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 12.5, color: 'var(--brand-700)', marginBottom: 16, lineHeight: 1.6 }}>
                    💡 {t('booking.parcel.hint').split(t('booking.parcel.hintBold1')).map((part, i, arr) =>
                      i < arr.length - 1
                        ? <span key={i}>{part}<strong>{t('booking.parcel.hintBold1')}</strong></span>
                        : part.split(t('booking.parcel.hintBold2')).map((p, j, a) =>
                            j < a.length - 1
                              ? <span key={j}>{p}<strong>{t('booking.parcel.hintBold2')}</strong></span>
                              : p
                          )
                    )}
                  </div>

                  {/* Items */}
                  <div className="co-label" style={{ marginBottom: 10 }}>{t('booking.parcel.items')}</div>
                  <div className="co-items-table" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                    <div className="co-items-head" style={{ display: 'grid', gridTemplateColumns: '180px 1fr 80px 100px 36px', gap: 0, padding: '8px 12px', background: 'var(--bg-soft)', borderBottom: '1px solid var(--border)', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>
                      <div>{t('booking.parcel.category')}</div>
                      <div>{t('booking.parcel.desc')}</div>
                      <div>{t('booking.parcel.pieces')}</div>
                      <div>{t('booking.parcel.weight')}</div>
                      <div></div>
                    </div>
                    {items.map((item, idx) => {
                      const isStd  = item.cat === 'standard';
                      const isBeer = item.cat === 'biere';
                      const isLast = idx === items.length - 1;
                      return (
                        <div key={item.id}>
                          <div className="co-item-row" style={{
                            display: 'grid', gridTemplateColumns: '180px 1fr 80px 100px 36px', gap: 0,
                            padding: '8px 12px', borderBottom: (!isBeer && !isLast) ? '1px solid var(--border-soft)' : 'none',
                            alignItems: 'center', background: 'white',
                          }}>
                            <select
                              className="co-input co-item-cat"
                              value={item.cat}
                              onChange={e => updItem(item.id, 'cat', e.target.value)}
                              style={{ fontSize: 12.5, marginRight: 6 }}
                            >
                              {ITEM_CATEGORIES.map(c => (
                                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                              ))}
                            </select>
                            <input className="co-input co-item-desc" value={item.desc}
                              onChange={e => updItem(item.id, 'desc', e.target.value)}
                              placeholder={ITEM_CATEGORIES.find(c => c.id === item.cat)?.hint || 'Description…'}
                              style={{ marginRight: 6 }} />
                            <input className="co-input co-item-pieces" type="number" min="1" value={item.pieces}
                              disabled={isStd}
                              onChange={e => updItem(item.id, 'pieces', e.target.value)}
                              style={{ opacity: isStd ? .35 : 1, cursor: isStd ? 'not-allowed' : 'text', marginRight: 6 }}
                              title={isStd ? 'Non requis pour Standard' : ''} />
                            <input className="co-input co-item-kg" type="number" min="0" step="0.5" value={item.kg}
                              onChange={e => updItem(item.id, 'kg', e.target.value)} placeholder="0"
                              style={{ marginRight: 6 }} />
                            <button className="co-item-del" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-300)', fontSize: 20, display: 'grid', placeItems: 'center', opacity: items.length === 1 ? .25 : 1 }}
                              disabled={items.length === 1}
                              onClick={() => removeItem(item.id)}>×</button>
                          </div>
                          {isBeer && (
                            <div style={{ background: '#fffbeb', borderBottom: isLast ? 'none' : '1px solid var(--border-soft)', padding: '6px 12px 8px 28px', display: 'flex', gap: 10, alignItems: 'center' }}>
                              <span style={{ fontSize: 11.5, color: '#92400e', fontWeight: 600, whiteSpace: 'nowrap' }}>🍺 {t('booking.parcel.saqFees')}</span>
                              <select className="co-input" value={item.beerFormat} onChange={e => updItem(item.id, 'beerFormat', e.target.value)} style={{ fontSize: 12, flex: '0 0 auto', width: 190 }}>
                                <option value="24x65">Casier 24×65 cl (24.50$)</option>
                                <option value="24x33">Casier 24×33 cl (35.83$)</option>
                                <option value="12x50">Casier 12×50 cl (21.34$)</option>
                              </select>
                              <input className="co-input" type="number" min="0" step="1" value={item.nbCasiers}
                                onChange={e => updItem(item.id, 'nbCasiers', e.target.value)}
                                placeholder={t('booking.parcel.nbCasiers')} style={{ width: 100 }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <button style={{
                    width: '100%', padding: '10px', marginTop: 6,
                    background: 'none', border: '2px dashed var(--border)',
                    borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600,
                    color: 'var(--ink-400)', cursor: 'pointer',
                  }} onClick={addItem}>{t('booking.parcel.addItem')}</button>

                  {/* Total weight */}
                  {totalKg > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '10px 4px 0', fontSize: 13 }}>
                      <span style={{ color: 'var(--ink-500)' }}>{t('booking.parcel.totalWeight')} :</span>
                      <strong style={{ color: 'var(--ink-900)' }}>{totalKg} kg</strong>
                      {totalKg > 3 && (
                        <span style={{ color: 'var(--ink-400)', fontSize: 12 }}>
                          → facturé {Math.ceil(totalKg * 2) / 2} kg
                        </span>
                      )}
                      {totalKg <= 3 && (
                        <span style={{ color: 'var(--ok-600)', fontSize: 12, fontWeight: 600 }}>
                          ≤ 3 kg — forfait {(route.fees.tiers?.[0]?.transportFlat ?? route.fees.flatUpTo3kg ?? 50)} {route.currency}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Accessories */}
                  <div style={{ marginTop: 20, marginBottom: price ? 20 : 0 }}>
                    <div className="co-label" style={{ marginBottom: 10 }}>{t('booking.parcel.addons')}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { key: 'smallBag',  label: t('booking.parcel.smallBag'),  unitPrice: route.fees.bags?.small  ?? route.fees.addons?.smallBag  ?? 5,   icon: '🛍️' },
                        { key: 'mediumBag', label: t('booking.parcel.mediumBag'), unitPrice: route.fees.bags?.medium ?? route.fees.addons?.mediumBag ?? 7.5, icon: '🛍️' },
                        { key: 'largeBag',  label: t('booking.parcel.largeBag'),  unitPrice: route.fees.bags?.large  ?? route.fees.addons?.largeBag  ?? 10,  icon: '🛍️' },
                        { key: 'cartons',   label: t('booking.parcel.cartons'),   unitPrice: totalKg <= 3 ? (route.fees.tiers?.[0]?.cartonFlat ?? 1) : (route.fees.tiers?.[1]?.cartonPerUnit ?? 1.5), icon: '📦',
                          sub: totalKg <= 3 ? `${route.fees.tiers?.[0]?.cartonFlat ?? 1} ${route.currency} / carton` : `${route.fees.tiers?.[1]?.cartonPerUnit ?? 1.5} ${route.currency} / carton (> 3 kg)` },
                      ].map(({ key, label, unitPrice, icon, sub }) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-soft)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)' }}>
                          <div>
                            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-800)' }}>{icon} {label}</span>
                            <span style={{ fontSize: 12, color: 'var(--ink-400)', marginLeft: 8 }}>
                              {sub || `${unitPrice} ${route.currency} / ${locale === 'fr' ? 'unité' : 'unit'}`}
                            </span>
                          </div>
                          <Stepper value={form.addons[key]} onChange={v => updAddon(key, v)} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Estimation */}
                  {price && (
                    <div style={{ background: 'var(--brand-50)', border: '1.5px solid var(--brand-100)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showBreakdown ? 12 : 0 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--brand-700)' }}>
                          {t('booking.parcel.estimation')} : {price.prixClient.toFixed(0)} {route.currency}
                        </span>
                        <button onClick={() => setShowBreakdown(b => !b)}
                          style={{ fontSize: 11.5, color: 'var(--brand-600)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                          {showBreakdown ? t('booking.parcel.hideBreakdown') : t('booking.parcel.showBreakdown')}
                        </button>
                      </div>
                      {showBreakdown && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--ink-700)', fontWeight: 600 }}>
                            <span>{t('booking.payment.transport')} ({price.totalKg} kg)</span><span>{price.transport.toFixed(0)} {route.currency}</span>
                          </div>
                          {price.catSurchargeLines.length > 0 && (
                            <>
                              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--brand-500)', marginTop: 4, marginBottom: 2 }}>
                                {t('booking.parcel.supplements')}
                              </div>
                              {price.catSurchargeLines.map(l => (
                                <div key={l.catId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-600)', paddingLeft: 10 }}>
                                  <span>{l.label} ({l.kg} kg × {l.rate >= 0 ? '+' : ''}{l.rate} {route.currency}/kg)</span>
                                  <span>{l.amount >= 0 ? '+' : ''}{l.amount.toFixed(0)} {route.currency}</span>
                                </div>
                              ))}
                            </>
                          )}
                          {price.saqLines?.length > 0 && (
                            <>
                              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--brand-500)', marginTop: 4, marginBottom: 2 }}>
                                {t('booking.payment.saq')}
                              </div>
                              {price.saqLines.map((l, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-600)', paddingLeft: 10 }}>
                                  <span>Casier {l.format} × {l.nbCasiers}</span>
                                  <span>+{l.amount.toFixed(2)} {route.currency}</span>
                                </div>
                              ))}
                            </>
                          )}
                          {price.addonTotal > 0 && (
                            <>
                              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--brand-500)', marginTop: 4, marginBottom: 2 }}>
                                {t('booking.payment.accessories')}
                              </div>
                              {price.addonSmall  > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-600)', paddingLeft: 10 }}><span>{t('booking.parcel.smallBag')} × {form.addons.smallBag}</span><span>{price.addonSmall.toFixed(0)} {route.currency}</span></div>}
                              {price.addonMedium > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-600)', paddingLeft: 10 }}><span>{t('booking.parcel.mediumBag')} × {form.addons.mediumBag}</span><span>{price.addonMedium.toFixed(0)} {route.currency}</span></div>}
                              {price.addonLarge  > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-600)', paddingLeft: 10 }}><span>{t('booking.parcel.largeBag')} × {form.addons.largeBag}</span><span>{price.addonLarge.toFixed(0)} {route.currency}</span></div>}
                              {price.carton > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-600)', paddingLeft: 10 }}><span>{t('booking.parcel.cartons')} × {form.addons.cartons} ({price.cartonRate} {route.currency}/u)</span><span>{price.carton.toFixed(2)} {route.currency}</span></div>}
                            </>
                          )}
                          {price.manutention > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-600)' }}>
                              <span>{t('booking.payment.handling')}</span><span>{price.manutention.toFixed(2)} {route.currency}</span>
                            </div>
                          )}
                          {price.douane > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-600)' }}>
                              <span>{t('booking.payment.customs')}</span><span>{price.douane.toFixed(2)} {route.currency}</span>
                            </div>
                          )}
                          {price.formalites > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-600)' }}>
                              <span>{t('booking.payment.formalities')}</span><span>{price.formalites.toFixed(2)} {route.currency}</span>
                            </div>
                          )}
                        </div>
                      )}
                      <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--brand-600)', fontStyle: 'italic' }}>
                        {t('booking.parcel.indicative')}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 2 : Sender & Recipient ── */}
              {step === 2 && (
                <div className="co-section">
                  <div className="co-section__title">{t('booking.coords.title')}</div>

                  <div className="co-split">
                    <div className="co-split-block">
                      <div className="co-split-block__title">{t('booking.coords.sender')}</div>
                      <Field label={t('booking.coords.name')}>
                        <input className="co-input" value={form.senderName} onChange={e => upd('senderName', e.target.value)} placeholder="Awa Nkemdirim" />
                      </Field>
                      <Field label={t('booking.coords.phone')}>
                        <PhoneInput value={form.senderPhone} onChange={v => upd('senderPhone', v)} />
                      </Field>
                      <Field label={t('booking.coords.email')}>
                        <input className="co-input" type="email" value={form.senderEmail} onChange={e => upd('senderEmail', e.target.value)} placeholder="vous@email.com" />
                      </Field>
                    </div>

                    <div className="co-split-block">
                      <div className="co-split-block__title">{t('booking.coords.recipient')}</div>
                      {savedRecipients.length > 0 && (
                        <Field label={t('booking.coords.frequentRecipient')}>
                          <select className="co-select" defaultValue="" onChange={e => {
                            const r = savedRecipients.find(x => x.id === e.target.value);
                            if (r) {
                              upd('recipName',  r.name  || '');
                              upd('recipPhone', r.phone || '');
                              if (r.city) upd('recipCity', r.city);
                            }
                          }}>
                            <option value="">{t('booking.coords.chooseRecipient')}</option>
                            {savedRecipients.map(r => (
                              <option key={r.id} value={r.id}>
                                {r.label ? `${r.label} — ` : ''}{r.name}{r.city ? ` (${r.city})` : ''}
                              </option>
                            ))}
                          </select>
                        </Field>
                      )}
                      <Field label={t('booking.coords.name')}>
                        <input className="co-input" value={form.recipName} onChange={e => upd('recipName', e.target.value)} placeholder="Jean Mbarga" />
                      </Field>
                      <Field label={t('booking.coords.phone')}>
<PhoneInput value={form.recipPhone} onChange={v => upd('recipPhone', v)} />
                      </Field>
                      <Field label={t('booking.coords.city')}>
                        <select className="co-select" value={form.recipCity} onChange={e => upd('recipCity', e.target.value)}>
                          <optgroup label={t('booking.coords.montrealIleOption')}>
                            {montréalIleCities.map(c => <option key={c.label}>{c.label}</option>)}
                          </optgroup>
                          <optgroup label={t('booking.coords.montrealGrandOption')}>
                            {montréalGrandCities.map(c => <option key={c.label}>{c.label}</option>)}
                          </optgroup>
                          <optgroup label={t('booking.coords.elsewhere')}>
                            <option value="Hors région">Hors région</option>
                          </optgroup>
                        </select>
                      </Field>
                      {form.recipCity === 'Hors région' && (
                        <Field label={t('booking.coords.yourCity')}>
                          <input className="co-input" value={form.recipCityCustom}
                            onChange={e => upd('recipCityCustom', e.target.value)}
                            placeholder="Ex : Québec, Ottawa, Toronto…" />
                        </Field>
                      )}
                      {embedded && (
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginTop: 10, cursor: 'pointer', fontSize: 12.5 }}>
                          <input type="checkbox" style={{ marginTop: 2, flexShrink: 0, accentColor: 'var(--brand-500)' }} checked={saveRecip} onChange={e => setSaveRecip(e.target.checked)} />
                          <span style={{ color: 'var(--ink-600)' }}>{t('booking.coords.saveRecipient')}</span>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Delivery method */}
                  <div style={{ marginTop: 22 }}>
                    <div className="co-label" style={{ marginBottom: 10 }}>{t('booking.coords.delivery')}</div>
                    <div className="co-opts" style={{ flexDirection: 'column', gap: 8 }}>
                      <button className={`co-opt${form.delivery === 'pickup' ? ' is-sel' : ''}`} onClick={() => upd('delivery', 'pickup')}>
                        <div className="co-opt__radio" />
                        <div className="co-opt__body">
                          <div className="co-opt__label">{t('booking.coords.pickup')}</div>
                          <div className="co-opt__sub">{t('booking.coords.pickupSub')}</div>
                        </div>
                        <span className="co-opt__badge">{t('booking.summary.deliveryFree')}</span>
                      </button>

                      <button
                        className={`co-opt${form.delivery === 'home' ? ' is-sel' : ''}`}
                        onClick={() => upd('delivery', 'home')}
                        disabled={form.recipCity === 'Hors région' && !form.recipCityCustom}
                      >
                        <div className="co-opt__radio" />
                        <div className="co-opt__body">
                          <div className="co-opt__label">{t('booking.coords.home')}</div>
                          <div className="co-opt__sub">
                            {cityZone === 'montreal-ile'   ? t('booking.coords.montrealIle')    :
                             cityZone === 'montreal-grand' ? t('booking.coords.montrealGrand')   : 'Hors région'}
                          </div>
                        </div>
                        <span className="co-opt__badge">
                          {cityZone === 'montreal-ile'   ? `+${route.fees.montrealIleDelivery   ?? 25} ${route.currency}`   :
                           cityZone === 'montreal-grand' ? `+${route.fees.montrealGrandDelivery ?? 30} ${route.currency}` : t('booking.summary.toEvaluate')}
                        </span>
                      </button>

                      <button className={`co-opt${form.delivery === 'expedition' ? ' is-sel' : ''}`} onClick={() => upd('delivery', 'expedition')}>
                        <div className="co-opt__radio" />
                        <div className="co-opt__body">
                          <div className="co-opt__label">{t('booking.coords.postalService')}</div>
                          <div className="co-opt__sub">{t('booking.coords.postSub')}</div>
                        </div>
                        <span className="co-opt__badge">{t('booking.coords.postalFees')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Delivery address */}
                  {(form.delivery === 'home' || form.delivery === 'expedition') && (
                    <div style={{ marginTop: 18, padding: '16px 18px', background: 'var(--bg-soft)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)' }}>
                      <div className="co-label" style={{ marginBottom: 14 }}>
                        {form.delivery === 'expedition' ? t('booking.coords.shippingAddr') : t('booking.coords.deliveryAddr')}
                      </div>
                      {savedAddresses.length > 0 && (
                        <div className="co-field" style={{ marginBottom: 12 }}>
                          <label className="co-label">{t('booking.coords.useSaved')}</label>
                          <select className="co-select" defaultValue="" onChange={e => {
                            const addr = savedAddresses.find(a => a.id === e.target.value);
                            if (addr) {
                              upd('recipAddress', addr.address || '');
                              upd('recipApt', addr.apt || '');
                              upd('recipProvince', addr.province || 'QC');
                              upd('recipPostal', addr.postal || '');
                            }
                          }}>
                            <option value="">{t('booking.coords.chooseSaved')}</option>
                            {savedAddresses.map(a => (
                              <option key={a.id} value={a.id}>
                                {a.label ? `${a.label} — ` : ''}{a.address}{a.city ? `, ${a.city}` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div className="co-field" style={{ marginBottom: 0 }}>
                          <label className="co-label">{t('booking.coords.addressLine')}</label>
                          <input className="co-input" value={form.recipAddress} onChange={e => upd('recipAddress', e.target.value)} placeholder="123 rue Sainte-Catherine" />
                        </div>
                        <div className="co-field" style={{ marginBottom: 0 }}>
                          <label className="co-label">{t('booking.coords.aptOptional')}</label>
                          <input className="co-input" value={form.recipApt} onChange={e => upd('recipApt', e.target.value)} placeholder="Apt 4B" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div className="co-field" style={{ marginBottom: 0 }}>
                            <label className="co-label">{t('booking.coords.city')}</label>
                            <div className="co-input" style={{ background: 'var(--ink-50)', color: 'var(--ink-500)', cursor: 'default', display: 'flex', alignItems: 'center' }}>
                              {form.recipCity === 'Hors région' ? (form.recipCityCustom || 'Hors région') : form.recipCity}
                            </div>
                          </div>
                          <div className="co-field" style={{ marginBottom: 0 }}>
                            <label className="co-label">{t('booking.coords.provinceTerritoire')}</label>
                            <select className="co-select" value={form.recipProvince} onChange={e => upd('recipProvince', e.target.value)}>
                              <option value="QC">Québec</option>
                              <option value="ON">Ontario</option>
                              <option value="BC">Colombie-Britannique</option>
                              <option value="AB">Alberta</option>
                              <option value="MB">Manitoba</option>
                              <option value="SK">Saskatchewan</option>
                              <option value="NS">Nouvelle-Écosse</option>
                              <option value="NB">Nouveau-Brunswick</option>
                            </select>
                          </div>
                        </div>
                        <div className="co-field" style={{ marginBottom: 0 }}>
                          <label className="co-label">{t('booking.coords.postal')}</label>
                          <input className="co-input" value={form.recipPostal} onChange={e => upd('recipPostal', e.target.value)} placeholder="H3H 1A1" style={{ maxWidth: 160 }} />
                        </div>
                      </div>

                      {(form.delivery === 'expedition' || cityZone === 'other') && (
                        <div style={{ marginTop: 12, background: 'var(--info-50)', border: '1px solid var(--info-100)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 12.5, color: 'var(--info-700)', lineHeight: 1.6 }}>
                          {t('booking.coords.outsideNote').replace('{city}', form.recipCity === 'Hors région' ? (form.recipCityCustom || 'votre ville') : form.recipCity)}
                        </div>
                      )}

                      {embedded && (
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 14, cursor: 'pointer', fontSize: 12.5 }}>
                          <input type="checkbox" style={{ marginTop: 2, flexShrink: 0 }} checked={saveAddr} onChange={e => setSaveAddr(e.target.checked)} />
                          <span style={{ color: 'var(--ink-600)' }}>{t('booking.coords.saveAddress')}</span>
                        </label>
                      )}
                    </div>
                  )}

                  {!embedded && (
                    <label className="co-account" style={{ marginTop: 16 }}>
                      <input type="checkbox" checked={createAccount} onChange={e => setCreateAccount(e.target.checked)} />
                      <div>
                        <div className="co-account__title">{t('booking.coords.createAccount')}</div>
                        <div className="co-account__sub">{t('booking.coords.createAccountSub')}</div>
                      </div>
                    </label>
                  )}
                </div>
              )}

              {/* ── Step 3 : Payment ── */}
              {step === 3 && price && (
                <div className="co-section">
                  <div className="co-section__title">{t('booking.steps.payment')}</div>

                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 24 }}>
                    <div style={{ padding: '10px 16px', background: 'var(--ink-900)', color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                      {t('booking.payment.invoiceDetail')}
                    </div>

                    <div style={{ padding: '16px 16px 0' }}>
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 6 }}>
                          <span>{t('booking.payment.transport')} — {price.totalKg} kg</span>
                          <span>{price.transport.toFixed(0)} {route.currency}</span>
                        </div>
                        {price.manutention > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-500)', paddingLeft: 14, marginBottom: 2 }}>
                            <span>{t('booking.payment.handling')}</span><span>{price.manutention.toFixed(2)} {route.currency}</span>
                          </div>
                        )}
                        {price.douane > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-500)', paddingLeft: 14, marginBottom: 2 }}>
                            <span>{t('booking.payment.customs')}</span><span>{price.douane.toFixed(2)} {route.currency}</span>
                          </div>
                        )}
                        {price.formalites > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-500)', paddingLeft: 14, marginBottom: 2 }}>
                            <span>{t('booking.payment.formalities')}</span><span>{price.formalites.toFixed(2)} {route.currency}</span>
                          </div>
                        )}
                      </div>

                      {price.catSurchargeLines.length > 0 && (
                        <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 12, marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 4 }}>
                            <span>{t('booking.payment.categorySupp')}</span>
                            <span>{price.catSurchargeTotal >= 0 ? '+' : ''}{price.catSurchargeTotal.toFixed(0)} {route.currency}</span>
                          </div>
                          {price.catSurchargeLines.map(l => (
                            <div key={l.catId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-500)', paddingLeft: 14, marginBottom: 2 }}>
                              <span>{l.label} — {l.kg} kg × {l.rate >= 0 ? '+' : ''}{l.rate} {route.currency}/kg</span>
                              <span>{l.amount >= 0 ? '+' : ''}{l.amount.toFixed(0)} {route.currency}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {price.saqLines?.length > 0 && (
                        <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 12, marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 4 }}>
                            <span>{t('booking.payment.saq')}</span>
                            <span>+{price.saqTotal.toFixed(2)} {route.currency}</span>
                          </div>
                          {price.saqLines.map((l, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-500)', paddingLeft: 14, marginBottom: 2 }}>
                              <span>Casier {l.format} × {l.nbCasiers}</span>
                              <span>+{l.amount.toFixed(2)} {route.currency}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {price.addonTotal > 0 && (
                        <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 12, marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 4 }}>
                            <span>{t('booking.payment.accessories')}</span><span>{price.addonTotal.toFixed(2)} {route.currency}</span>
                          </div>
                          {price.addonSmall  > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-500)', paddingLeft: 14, marginBottom: 2 }}><span>{t('booking.parcel.smallBag')} × {form.addons.smallBag}</span><span>{price.addonSmall.toFixed(0)} {route.currency}</span></div>}
                          {price.addonMedium > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-500)', paddingLeft: 14, marginBottom: 2 }}><span>{t('booking.parcel.mediumBag')} × {form.addons.mediumBag}</span><span>{price.addonMedium.toFixed(0)} {route.currency}</span></div>}
                          {price.addonLarge  > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-500)', paddingLeft: 14, marginBottom: 2 }}><span>{t('booking.parcel.largeBag')} × {form.addons.largeBag}</span><span>{price.addonLarge.toFixed(0)} {route.currency}</span></div>}
                          {price.carton > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-500)', paddingLeft: 14 }}><span>{t('booking.parcel.cartons')} × {form.addons.cartons} ({price.cartonRate} {route.currency}/u)</span><span>{price.carton.toFixed(2)} {route.currency}</span></div>}
                        </div>
                      )}

                      <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 12, paddingBottom: 16 }}>
                        {form.delivery === 'pickup' ? (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, color: 'var(--ink-800)' }}>
                            <span>{t('booking.payment.pickupFree')}</span><span>{t('booking.summary.deliveryFree')}</span>
                          </div>
                        ) : price.isExpedition || price.isOutsideDelivery ? (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, color: 'var(--info-700)' }}>
                              <span>{price.isExpedition ? t('booking.payment.postalDelivery') : t('booking.payment.outsideDelivery')}</span><span>{t('booking.payment.toEvaluate')}</span>
                            </div>
                            <p style={{ fontSize: 11.5, color: 'var(--ink-400)', marginTop: 4, lineHeight: 1.5 }}>
                              {t('booking.payment.invoiceNote')}
                            </p>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, color: 'var(--ink-800)' }}>
                            <span>{price.isMontrealIle ? t('booking.payment.montrealIle') : t('booking.payment.montrealGrand')}</span>
                            <span>{price.deliveryFee} {route.currency}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ padding: '14px 16px', borderTop: '2px solid var(--ink-900)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-700)' }}>{t('booking.payment.totalNow')}</span>
                      <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-900)' }}>{price.total.toFixed(0)} {route.currency}</span>
                    </div>
                  </div>

                  <div style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-100)', borderRadius: 'var(--radius)', padding: '12px 16px', fontSize: 13, color: 'var(--brand-700)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>🏦</span>
                    <div>
                      <div style={{ fontWeight: 700 }}>{t('booking.payment.interacTitle')}</div>
                      <div style={{ fontSize: 12, marginTop: 4, color: 'var(--brand-600)', lineHeight: 1.6 }}>
                        {t('booking.payment.interacNote')}
                      </div>
                    </div>
                  </div>
                </div>
              )}


              {/* ── Payment flow: Processing ── */}
              {step === 3 && payStatus === 'processing' && (
                <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <div style={{ width: 52, height: 52, border: '4px solid var(--border)', borderTopColor: 'var(--brand-500)', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 0.8s linear infinite' }} />
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 6 }}>{t('booking.payment.processing')}</div>
                  <p style={{ fontSize: 13, color: 'var(--ink-400)' }}>{t('booking.payment.processingNote')}</p>
                </div>
              )}

              {/* Navigation */}
              {payStatus === 'idle' && (
                <div className="co-nav">
                  <button className="co-btn co-btn--ghost" onClick={prev}>
                    {step === 0 ? t('booking.nav.backHome') : t('booking.nav.back')}
                  </button>
                  <button
                    className={`co-btn ${step === STEPS.length - 1 ? 'co-btn--brand' : 'co-btn--primary'}`}
                    onClick={step === STEPS.length - 1 ? handlePay : next}
                    disabled={!canNext()}
                    style={{ opacity: canNext() ? 1 : 0.4, cursor: canNext() ? 'pointer' : 'default' }}
                  >
                    {step === STEPS.length - 1 ? t('booking.nav.pay') : t('booking.nav.continue')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {!embedded && (
          <aside className="co-aside">
            <Summary
              route={route} departure={departure}
              items={items} price={price} form={form} step={step} isDone={isDone}
            />
          </aside>
        )}
      </div>

      {!embedded && <SiteFooter />}

      {/* ── Disclaimer modal ── */}
      {showDisclaimer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(9,15,30,.6)', backdropFilter: 'blur(4px)' }} onClick={() => setShowDisclaimer(false)} />
          <div style={{ position: 'relative', background: 'white', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,.22)' }}>

            {/* Header */}
            <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--brand-500)', marginBottom: 6 }}>Avant de confirmer</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink-900)' }}>Déclaration obligatoire</div>
            </div>

            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Section 1 — Objets de valeur */}
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)', marginBottom: 4 }}>💎 Avez-vous des objets de valeur dans votre envoi ?</div>
                <div style={{ fontSize: 13, color: 'var(--ink-500)', marginBottom: 14, lineHeight: 1.6 }}>
                  Tout article d'une valeur supérieure à <strong>100 $ CAD</strong> (bijoux, vêtements de marque, téléphones, ordinateurs, montres…) doit être déclaré.{' '}
                  <a href="/declaration-objets-valeur" target="_blank" rel="noreferrer" style={{ color: 'var(--brand-600)', fontWeight: 600, textDecoration: 'underline' }}>
                    Voir notre politique de déclaration ↗
                  </a>
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                  {[{ v: true, label: 'Oui, j\'ai des objets de valeur' }, { v: false, label: 'Non, aucun objet de valeur' }].map(opt => (
                    <button key={String(opt.v)} onClick={() => { setHasValuable(opt.v); setWaiverAccepted(false); setDeclaredValueCad(''); }}
                      style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: `2px solid ${hasValuable === opt.v ? 'var(--brand-500)' : 'var(--border)'}`, background: hasValuable === opt.v ? 'var(--brand-50)' : 'white', color: hasValuable === opt.v ? 'var(--brand-700)' : 'var(--ink-700)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>

                {hasValuable === true && (
                  <div style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-100)', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)', marginBottom: 10 }}>Valeur déclarée (CAD)</div>
                    <input type="number" min="100" step="1" value={declaredValueCad}
                      onChange={e => setDeclaredValueCad(e.target.value)}
                      placeholder="ex. 500"
                      style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    {Number(declaredValueCad) > 0 && (
                      <div style={{ marginTop: 10, fontSize: 13, color: 'var(--brand-700)', fontWeight: 600 }}>
                        Frais de couverture (20 %) : <strong>{Math.round(Number(declaredValueCad) * 0.20)} $ CAD</strong>
                        <div style={{ fontSize: 12, color: 'var(--ink-500)', fontWeight: 400, marginTop: 2 }}>Sera ajouté à votre total.</div>
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 10, lineHeight: 1.6 }}>
                      Le client doit déclarer la valeur réelle et fournir une facture ou preuve d'achat lors du dépôt.
                    </div>
                  </div>
                )}

                {hasValuable === false && (
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '14px 16px' }}>
                    <input type="checkbox" checked={waiverAccepted} onChange={e => setWaiverAccepted(e.target.checked)}
                      style={{ marginTop: 2, flexShrink: 0, width: 16, height: 16, accentColor: 'var(--brand-500)' }} />
                    <span style={{ fontSize: 13, color: '#991B1B', lineHeight: 1.6 }}>
                      Je confirme qu'aucun article de mon envoi ne dépasse 100 $ CAD et je renonce expressément à toute réclamation contre Jumla en cas de perte, vol ou dommage sur ces articles.{' '}
                      <a href="/politique-de-reclamation" target="_blank" rel="noreferrer" style={{ color: '#991B1B', fontWeight: 700, textDecoration: 'underline' }}>
                        Lire la politique de réclamation ↗
                      </a>
                    </span>
                  </label>
                )}
              </div>

              {/* Section 2 — Marchandises interdites */}
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)', marginBottom: 4 }}>🚫 Marchandises interdites</div>
                <div style={{ fontSize: 13, color: 'var(--ink-500)', marginBottom: 10, lineHeight: 1.6 }}>
                  Les marchandises suivantes sont strictement interdites : viande/volaille, produits laitiers, médicaments sur ordonnance, drogues, armes, explosifs, argent comptant, animaux vivants, produits contrefaits…{' '}
                  <a href="/cgv" target="_blank" rel="noreferrer" style={{ color: 'var(--brand-600)', fontWeight: 600, textDecoration: 'underline' }}>
                    Voir la liste complète dans nos CGV ↗
                  </a>
                </div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
                  <input type="checkbox" checked={forbiddenAcknowledged} onChange={e => setForbiddenAcknowledged(e.target.checked)}
                    style={{ marginTop: 2, flexShrink: 0, width: 16, height: 16, accentColor: 'var(--brand-500)' }} />
                  <span style={{ fontSize: 13, color: 'var(--ink-700)', lineHeight: 1.6 }}>
                    Je certifie que mon envoi ne contient aucune marchandise interdite et j'accepte que tout colis non conforme puisse être saisi ou détruit sans remboursement.
                  </span>
                </label>
              </div>

              {/* Liens politiques */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', padding: '12px 16px', background: 'var(--bg-soft)', borderRadius: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.06em', width: '100%', marginBottom: 4 }}>Documents applicables</span>
                {[
                  { label: 'CGU',                          href: '/cgu' },
                  { label: 'CGV',                          href: '/cgv' },
                  { label: 'Politique de réclamation',     href: '/politique-de-reclamation' },
                  { label: 'Déclaration objets de valeur', href: '/declaration-objets-valeur' },
                  { label: 'Politique de confidentialité', href: '/politique-de-confidentialite' },
                ].map(({ label, href }) => (
                  <a key={href} href={href} target="_blank" rel="noreferrer"
                    style={{ fontSize: 12, color: 'var(--brand-600)', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}>
                    {label} <span style={{ fontSize: 10 }}>↗</span>
                  </a>
                ))}
              </div>

            </div>

            {/* Footer */}
            <div style={{ padding: '16px 28px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12 }}>
              <button onClick={() => setShowDisclaimer(false)}
                style={{ flex: 1, padding: '11px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'white', color: 'var(--ink-700)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Annuler
              </button>
              <button onClick={() => { setShowDisclaimer(false); confirmInterac(); }}
                disabled={!disclaimerReady}
                style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: disclaimerReady ? 'var(--brand-500)' : 'var(--border)', color: disclaimerReady ? 'white' : 'var(--ink-400)', fontSize: 14, fontWeight: 700, cursor: disclaimerReady ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'background .15s' }}>
                Confirmer et réserver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
