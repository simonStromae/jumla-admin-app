'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { TopBar, SiteNav, SiteFooter } from './SiteLayout.jsx';
import '@/src/styles/client-omega.css';
import '@/src/styles/booking.css';

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

// ── Tarifs par défaut (règles d'affaires) ──
const DEFAULT_FEES = {
  base: 50, customs: 5, carton: 1, formality: 4, service: 5,
  flatUpTo3kg: 65, perHalfKgRate: 9,
  cartonBase: 1, cartonPerUnit: 1.5,
  addons: { smallBag: 3, mediumBag: 5, largeBag: 10 },
  montrealIleDelivery: 25,
  montrealGrandDelivery: 30,
};

// Convert stored route fees (admin grille tarifaire) → calcPrice-compatible format
function routeFeesToCalcFees(storedFees) {
  if (!storedFees?.tiers?.length) return DEFAULT_FEES;
  const sorted = [...storedFees.tiers].sort((a, b) => parseFloat(a.from) - parseFloat(b.from));
  const firstTier  = sorted[0];
  const secondTier = sorted[1];
  const flatUpTo3kg = parseFloat(firstTier?.flat) || DEFAULT_FEES.flatUpTo3kg;
  let perHalfKgRate = DEFAULT_FEES.perHalfKgRate;
  if (secondTier) {
    const rangeKg = parseFloat(secondTier.to) - parseFloat(secondTier.from);
    const tierFlat = parseFloat(secondTier.flat) || 0;
    if (rangeKg > 0 && tierFlat > 0) {
      perHalfKgRate = Math.round((tierFlat / rangeKg / 2) * 10) / 10;
    }
  }
  const bags = storedFees.bags ?? {};
  const deliveryFee = storedFees.deliveryFee ?? DEFAULT_FEES.montrealIleDelivery;
  return {
    ...DEFAULT_FEES,
    flatUpTo3kg,
    perHalfKgRate,
    addons: {
      smallBag:  bags.small  ?? DEFAULT_FEES.addons.smallBag,
      mediumBag: bags.medium ?? DEFAULT_FEES.addons.mediumBag,
      largeBag:  bags.large  ?? DEFAULT_FEES.addons.largeBag,
    },
    montrealIleDelivery:   deliveryFee,
    montrealGrandDelivery: Math.round(deliveryFee * 1.2),
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

const STEPS = [
  { label: 'Route & Départ' },
  { label: 'Votre colis' },
  { label: 'Coordonnées' },
  { label: 'Paiement' },
];

// ── Helpers ──
function roundUpToHalfKg(kg) { return Math.ceil(kg * 2) / 2; }

function calcPrice(items, fees, addons, delivery, cityZone) {
  const totalKg = items.reduce((s, i) => s + (parseFloat(i.kg) || 0), 0);
  if (totalKg <= 0) return null;

  const billedKg = totalKg <= 3 ? totalKg : roundUpToHalfKg(totalKg);
  const surplusIncrements = billedKg > 3 ? (billedKg - 3) / 0.5 : 0;
  const baseShipping = fees.flatUpTo3kg + surplusIncrements * fees.perHalfKgRate;

  // Group kg by category
  const catGroups = {};
  items.forEach(item => {
    const kg = parseFloat(item.kg) || 0;
    if (kg <= 0) return;
    const cat = item.cat || 'standard';
    catGroups[cat] = (catGroups[cat] || 0) + kg;
  });

  // Surcharge par catégorie (extraPerKg × kg de la catégorie)
  const catSurchargeLines = Object.entries(catGroups).map(([catId, kg]) => {
    const def = ITEM_CATEGORIES.find(c => c.id === catId);
    const extra = def?.extraPerKg || 0;
    return { catId, label: def?.label || catId, kg, extra, amount: kg * extra };
  }).filter(l => l.extra !== 0);
  const catSurchargeTotal = catSurchargeLines.reduce((s, l) => s + l.amount, 0);

  const addonSmall  = (addons.smallBag  || 0) * fees.addons.smallBag;
  const addonMedium = (addons.mediumBag || 0) * fees.addons.mediumBag;
  const addonLarge  = (addons.largeBag  || 0) * fees.addons.largeBag;
  const cartonRate  = totalKg <= 3 ? (fees.cartonBase || 1) : (fees.cartonPerUnit || 1.5);
  const cartonFee   = (addons.cartons || 0) * cartonRate;
  const addonTotal  = addonSmall + addonMedium + addonLarge + cartonFee;

  const isExpedition      = delivery === 'expedition';
  const isMontrealIle     = !isExpedition && delivery === 'home' && cityZone === 'montreal-ile';
  const isMontrealGrand   = !isExpedition && delivery === 'home' && cityZone === 'montreal-grand';
  const isOutsideDelivery = !isExpedition && delivery === 'home' && cityZone === 'other';
  const deliveryFee       = isMontrealIle   ? (fees.montrealIleDelivery   || 25)
                          : isMontrealGrand ? (fees.montrealGrandDelivery || 30) : 0;

  const shipping = baseShipping + catSurchargeTotal;

  return {
    totalKg, billedKg, surplusIncrements,
    baseShipping, catSurchargeLines, catSurchargeTotal, catGroups,
    breakdown: { base: fees.base, customs: fees.customs, carton: fees.carton, formality: fees.formality, service: fees.service },
    shipping, addonSmall, addonMedium, addonLarge, cartonFee, cartonRate, addonTotal,
    deliveryFee, isExpedition, isMontrealIle, isMontrealGrand, isOutsideDelivery,
    total: shipping + addonTotal + (isExpedition || isOutsideDelivery ? 0 : deliveryFee),
  };
}

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
  const city     = CITIES.find(c => c.label === form.recipCity);
  const cityZone = city?.zone || 'montreal-ile';
  const filledItems = items.filter(i => i.desc || parseFloat(i.kg) > 0);

  return (
    <div className="co-summary">
      <div className="co-summary__head">Votre réservation</div>

      {filledItems.length > 0 && (
        <div className="co-summary__items">
          {filledItems.map(item => (
            <div key={item.id} className="co-summary__item">
              <div className="co-summary__item-thumb">
                {itemIcon(item.desc, item.cat)}
                {item.pieces > 1 && <span className="co-summary__item-qty">{item.pieces}</span>}
              </div>
              <div className="co-summary__item-info">
                <div className="co-summary__item-name">{item.desc || 'Article'}</div>
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
        <div className="co-summary__label">Itinéraire</div>
        <div className={`co-summary__row${route ? '' : ' co-summary__row--muted'}`}>
          <span>Route</span><span>{route?.label ?? '—'}</span>
        </div>
        <div className={`co-summary__row${departure ? '' : ' co-summary__row--muted'}`}>
          <span>Départ</span><span>{departure?.departureDate ? new Date(departure.departureDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : departure?.code ?? 'Non sélectionné'}</span>
        </div>
        {route && <div className="co-summary__row co-summary__row--muted"><span>Transit estimé</span><span>~{route.transit} jours</span></div>}
      </div>

      {step >= 1 && (
        <div className="co-summary__section">
          <div className="co-summary__label">Frais</div>
          {price ? (
            <>
              <div className="co-summary__row">
                <span>Transport {price.billedKg} kg{price.billedKg !== price.totalKg ? ` (déclaré ${price.totalKg} kg)` : ''}</span>
                <span>{price.baseShipping.toFixed(0)} {route.currency}</span>
              </div>
              {price.catSurchargeLines.map(l => (
                <div key={l.catId} className="co-summary__row">
                  <span>Suppl. {l.label}</span>
                  <span>{l.amount >= 0 ? '+' : ''}{l.amount.toFixed(0)} {route.currency}</span>
                </div>
              ))}
              {price.addonTotal > 0 && <div className="co-summary__row"><span>Accessoires</span><span>+{price.addonTotal} {route.currency}</span></div>}
              {step >= 2 && (
                price.isExpedition ? (
                  <div className="co-summary__row co-summary__row--muted"><span>Expédition</span><span>À évaluer</span></div>
                ) : form.delivery === 'pickup' ? (
                  <div className="co-summary__row"><span>Livraison</span><span>Gratuit</span></div>
                ) : price.isMontrealIle ? (
                  <div className="co-summary__row"><span>Livraison île de Mtl</span><span>+{price.deliveryFee} {route.currency}</span></div>
                ) : price.isMontrealGrand ? (
                  <div className="co-summary__row"><span>Livraison Grand Mtl</span><span>+{price.deliveryFee} {route.currency}</span></div>
                ) : (
                  <div className="co-summary__row co-summary__row--muted"><span>Livraison hors région</span><span>À évaluer</span></div>
                )
              )}
              {step < 2 && <div className="co-summary__row co-summary__row--muted"><span>Livraison</span><span>Étape suivante</span></div>}
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
          <span className="co-summary__total-price">{price ? `${price.total.toFixed(0)}` : '—'}</span>
        </div>
      </div>
    </div>
  );
}

// ── Auth gate ──
function AuthGate({ onAuth, onNav }) {
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
    if (fields.password !== fields.confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
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
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink-900)' }}>Réserver un envoi</div>
            <div style={{ fontSize: 13, color: 'var(--ink-400)', marginTop: 3 }}>Connectez-vous ou créez un compte pour continuer</div>
          </div>

          {tab !== 'verify' && (
            <div style={{ display: 'flex', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 22 }}>
              {[['login', 'Se connecter'], ['register', 'Créer un compte']].map(([t, l]) => (
                <button key={t} onClick={() => { setTab(t); setError(''); }}
                  style={{ flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                    background: tab === t ? 'var(--ink-900)' : 'white',
                    color: tab === t ? 'white' : 'var(--ink-500)' }}>
                  {l}
                </button>
              ))}
            </div>
          )}

          {tab === 'login' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label="Adresse email">
                <input className="co-input" type="email" value={fields.email} onChange={e => upd('email', e.target.value)}
                  placeholder="vous@email.com" onKeyDown={e => e.key === 'Enter' && doLogin()} autoFocus />
              </Field>
              <Field label="Mot de passe">
                <input className="co-input" type="password" value={fields.password} onChange={e => upd('password', e.target.value)}
                  placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && doLogin()} />
              </Field>
              {errBox}
              <button className="co-btn co-btn--brand" onClick={doLogin} disabled={loading} style={{ marginTop: 4 }}>
                {loading ? '…' : 'Se connecter →'}
              </button>
            </div>
          )}

          {tab === 'register' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label="Nom complet">
                <input className="co-input" value={fields.name} onChange={e => upd('name', e.target.value)} placeholder="Awa Nkemdirim" autoFocus />
              </Field>
              <Field label="Adresse email">
                <input className="co-input" type="email" value={fields.email} onChange={e => upd('email', e.target.value)} placeholder="vous@email.com" />
              </Field>
              <Field label="Mot de passe">
                <input className="co-input" type="password" value={fields.password} onChange={e => upd('password', e.target.value)} placeholder="6 caractères min." />
              </Field>
              <Field label="Confirmer le mot de passe">
                <input className="co-input" type="password" value={fields.confirm} onChange={e => upd('confirm', e.target.value)}
                  placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && doRegister()} />
              </Field>
              {errBox}
              <button className="co-btn co-btn--brand" onClick={doRegister} style={{ marginTop: 4 }}>
                Créer mon compte →
              </button>
            </div>
          )}

          {tab === 'verify' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 38, marginBottom: 2 }}>📧</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>Vérifiez votre boîte mail</div>
              <p style={{ fontSize: 13, color: 'var(--ink-500)', lineHeight: 1.65 }}>
                Un code a été envoyé à<br /><strong>{fields.email}</strong>
              </p>
              <div style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-100)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 12.5, color: 'var(--brand-700)' }}>
                Code de démonstration : <strong style={{ fontFamily: 'ui-monospace, monospace', fontSize: 15 }}>{expected}</strong>
              </div>
              <input className="co-input" value={code} onChange={e => { setCode(e.target.value); setError(''); }}
                placeholder="· · · · · ·" maxLength={6} autoFocus
                style={{ textAlign: 'center', fontSize: 24, fontFamily: 'ui-monospace, monospace', letterSpacing: '.2em', fontWeight: 700 }}
                onKeyDown={e => e.key === 'Enter' && doVerify()} />
              {errBox}
              <button className="co-btn co-btn--brand" onClick={doVerify} disabled={loading}>
                {loading ? '…' : 'Vérifier →'}
              </button>
              <button style={{ background: 'none', border: 'none', color: 'var(--ink-400)', fontSize: 12.5, cursor: 'pointer', marginTop: 2 }}
                onClick={() => { setTab('register'); setCode(''); setError(''); }}>
                ← Retour
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

export default function BookingScreen({ onNav, embedded = false }) {
  const { data: sessionData } = useSession();
  const [step, setStep] = useState(0);
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
  const [items, setItems] = useState([
    { id: 1, cat: 'standard', desc: '', pieces: 1, kg: '' },
  ]);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  // 'idle' | 'interac' | 'processing' | 'pending' | 'error'
  const [payStatus, setPayStatus]   = useState('idle');
  const [bookingRef, setBookingRef] = useState('');
  const [bookingErr, setBookingErr] = useState('');
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jumla_user')); } catch { return null; }
  });
  // When embedded in client layout, fall back to NextAuth session data
  const effectiveUser = user ?? (embedded && sessionData?.user ? { name: sessionData.user.name ?? '', email: sessionData.user.email ?? '' } : null);

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

  // Pre-fill sender phone from profile API when embedded
  useEffect(() => {
    if (!embedded) return;
    fetch('/api/me/profile')
      .then(r => r.ok ? r.json() : null)
      .then(profile => {
        if (profile?.phone) {
          setForm(f => ({ ...f, senderPhone: f.senderPhone || profile.phone }));
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
  const addItem    = () => setItems(is => [...is, { id: Date.now(), cat: 'standard', desc: '', pieces: 1, kg: '' }]);
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

  const handlePay = () => setPayStatus('interac');

  // Interac — save booking then mark as pending
  const confirmInterac = async () => {
    setPayStatus('processing');
    setBookingErr('');
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
          delivery:        form.delivery,
          totalPrice:      price?.total ?? null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setBookingErr(json.error || 'Erreur lors de la réservation');
        setPayStatus('interac');
        return;
      }
      setBookingRef(json.trackingCode);
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

      {/* Breadcrumb */}
      <div className="co-subhead">
        <div className="co-subhead__inner">
          <span className="co-subhead__title">Réservation</span>
          <span style={{ fontSize: 12, color: 'var(--ink-400)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 24, height: 24, borderRadius: 999, background: 'var(--brand-100)', color: 'var(--brand-700)', fontSize: 11, fontWeight: 800, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              {effectiveUser?.name?.charAt(0).toUpperCase()}
            </span>
            {effectiveUser?.name} · {effectiveUser?.email}
            {!embedded && (
              <button onClick={() => { localStorage.removeItem('jumla_user'); setUser(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--ink-300)', fontSize: 11, cursor: 'pointer', marginLeft: 4 }}>
                Déconnexion
              </button>
            )}
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

      <div className="co-body">
        <div className="co-main">
          {isDone ? (
            <div className="co-done">
              {payStatus === 'pending' && (
                <>
                  <div className="co-done__icon" style={{ background: 'var(--warn-100)', color: 'var(--warn-700)' }}>⏳</div>
                  <h2 className="co-done__title">Virement en attente de confirmation</h2>
                  <p className="co-done__sub">
                    Réservation enregistrée. Dès que votre virement Interac est reçu et vérifié par notre équipe, vous recevrez une confirmation à <strong>{effectiveUser?.email}</strong>.
                  </p>
                  {refCode && (
                    <div style={{ background: 'white', border: '2px solid var(--brand-200)', borderRadius: 'var(--radius)', padding: '14px 24px', marginBottom: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink-400)', marginBottom: 4 }}>Numéro de suivi</div>
                      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'ui-monospace, monospace', color: 'var(--ink-900)', letterSpacing: '.04em' }}>{refCode}</div>
                    </div>
                  )}
                  <div style={{ background: 'var(--warn-50)', border: '1px solid var(--warn-200)', borderRadius: 'var(--radius)', padding: '14px 18px', fontSize: 13, color: 'var(--warn-700)', maxWidth: 420, textAlign: 'left', lineHeight: 1.7, marginBottom: 8 }}>
                    <strong>Important :</strong> votre colis ne sera pris en charge qu'après confirmation du paiement. Incluez la référence <strong>{refCode}</strong> dans le message du virement.
                  </div>
                </>
              )}
              {(price?.isOutsideDelivery || price?.isExpedition) && (
                <div style={{ background: 'var(--warn-50)', border: '1px solid var(--warn-200)', borderRadius: 'var(--radius)', padding: '14px 18px', fontSize: 13, color: 'var(--warn-700)', maxWidth: 420, textAlign: 'left', lineHeight: 1.6, marginBottom: 8 }}>
                  <strong>Frais de livraison :</strong> les frais vers <strong>{form.recipCity === 'Hors région' ? form.recipCityCustom : form.recipCity}</strong> seront évalués à l'arrivée à Montréal.
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
                  {routesLoading ? (
                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-400)' }}>Chargement des routes…</div>
                  ) : dbRoutes.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-400)' }}>Aucune route disponible pour le moment.</div>
                  ) : (
                    <>
                      <div style={{ marginBottom: 24 }}>
                        <div className="co-label" style={{ marginBottom: 10 }}>Direction</div>
                        <div className="co-opts">
                          {dbRoutes.map(r => (
                            <button key={r.id} className={`co-opt${form.route === r.id ? ' is-sel' : ''}`}
                              onClick={() => upd('route', r.id)}>
                              <div className="co-opt__radio" />
                              <div className="co-opt__body">
                                <div className="co-opt__label">✈️ {r.label}</div>
                                <div className="co-opt__sub">{r.code} · Transit ~14 jours</div>
                              </div>
                              <span className="co-opt__badge">dès 65 CAD</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="co-label" style={{ marginBottom: 10 }}>Date de départ</div>
                        {campaigns.length === 0 ? (
                          <p style={{ fontSize: 13, color: 'var(--ink-400)', padding: '12px 0' }}>
                            Aucune cargaison ouverte sur cette route pour le moment.
                          </p>
                        ) : (
                          <div className="co-dates">
                            {campaigns.map(c => {
                              const dep = c.departureDate ? new Date(c.departureDate).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : c.code;
                              const low = c.spotsKg !== null && c.spotsKg < 50;
                              return (
                                <button key={c.id} className={`co-date${form.departure === c.id ? ' is-sel' : ''}`}
                                  onClick={() => upd('departure', c.id)}>
                                  <div className="co-date__day">{dep}</div>
                                  <div className={`co-date__spots${low ? ' co-date__spots--low' : ''}`}>
                                    {c.spotsKg !== null
                                      ? low ? `⚠ ${c.spotsKg} kg restants` : `${c.spotsKg} kg dispo`
                                      : c.code}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {!form.departure && campaigns.length > 0 && (
                          <p style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 10 }}>Sélectionnez une date pour continuer.</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── Step 1 : Contenu du colis ── */}
              {step === 1 && (
                <div className="co-section">
                  <div className="co-section__title">Contenu du colis</div>

                  {/* Info hint */}
                  <div style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-100)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 12.5, color: 'var(--brand-700)', marginBottom: 16, lineHeight: 1.6 }}>
                    💡 Créez <strong>une ligne par produit</strong>. Si votre produit n'apparaît pas dans les catégories, choisissez <strong>Standard</strong>.
                  </div>

                  {/* Articles table */}
                  <div className="co-label" style={{ marginBottom: 10 }}>Articles</div>
                  <div className="co-table-wrap">
                    <div className="co-table-head" style={{ gridTemplateColumns: '160px 1fr 76px 96px 38px' }}>
                      <div>Catégorie</div>
                      <div>Description</div>
                      <div>Pièces</div>
                      <div>Poids (kg)</div>
                      <div></div>
                    </div>
                    {items.map(item => {
                      const isStd = item.cat === 'standard';
                      return (
                        <div key={item.id} className="co-table-row" style={{ gridTemplateColumns: '160px 1fr 76px 96px 38px' }}>
                          <select
                            className="co-input"
                            value={item.cat}
                            onChange={e => updItem(item.id, 'cat', e.target.value)}
                            style={{ fontSize: 12.5 }}
                          >
                            {ITEM_CATEGORIES.map(c => (
                              <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                            ))}
                          </select>
                          <input className="co-input" value={item.desc}
                            onChange={e => updItem(item.id, 'desc', e.target.value)}
                            placeholder={ITEM_CATEGORIES.find(c => c.id === item.cat)?.hint || 'Description…'} />
                          <input className="co-input" type="number" min="1" value={item.pieces}
                            disabled={isStd}
                            onChange={e => updItem(item.id, 'pieces', e.target.value)}
                            style={{ opacity: isStd ? .35 : 1, cursor: isStd ? 'not-allowed' : 'text' }}
                            title={isStd ? 'Non requis pour Standard' : ''} />
                          <input className="co-input" type="number" min="0" step="0.5" value={item.kg}
                            onChange={e => updItem(item.id, 'kg', e.target.value)} placeholder="0" />
                          <button className="co-table-del" disabled={items.length === 1}
                            onClick={() => removeItem(item.id)}>×</button>
                        </div>
                      );
                    })}
                  </div>
                  <button className="co-add-row" onClick={addItem}>+ Ajouter un article</button>

                  {/* Poids total */}
                  {totalKg > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '10px 4px 0', fontSize: 13 }}>
                      <span style={{ color: 'var(--ink-500)' }}>Poids total :</span>
                      <strong style={{ color: 'var(--ink-900)' }}>{totalKg} kg</strong>
                      {totalKg > 3 && (
                        <span style={{ color: 'var(--ink-400)', fontSize: 12 }}>
                          → facturé {roundUpToHalfKg(totalKg)} kg
                        </span>
                      )}
                      {totalKg <= 3 && (
                        <span style={{ color: 'var(--ok-600)', fontSize: 12, fontWeight: 600 }}>
                          ≤ 3 kg — forfait {route.fees.flatUpTo3kg} {route.currency}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Accessoires */}
                  <div style={{ marginTop: 20, marginBottom: price ? 20 : 0 }}>
                    <div className="co-label" style={{ marginBottom: 10 }}>Accessoires (optionnel)</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { key: 'smallBag',  label: 'Petit sac',   unitPrice: route.fees.addons.smallBag,  icon: '🛍️' },
                        { key: 'mediumBag', label: 'Moyen sac',   unitPrice: route.fees.addons.mediumBag, icon: '🛍️' },
                        { key: 'largeBag',  label: 'Grand sac',   unitPrice: route.fees.addons.largeBag,  icon: '🛍️' },
                        { key: 'cartons',   label: 'Carton',      unitPrice: totalKg <= 3 ? route.fees.cartonBase : route.fees.cartonPerUnit, icon: '📦',
                          sub: totalKg <= 3 ? `${route.fees.cartonBase} ${route.currency} / carton` : `${route.fees.cartonPerUnit} ${route.currency} / carton (> 3 kg)` },
                      ].map(({ key, label, unitPrice, icon, sub }) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-soft)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)' }}>
                          <div>
                            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-800)' }}>{icon} {label}</span>
                            <span style={{ fontSize: 12, color: 'var(--ink-400)', marginLeft: 8 }}>
                              {sub || `${unitPrice} ${route.currency} / unité`}
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
                          Estimation : {price.total.toFixed(0)} {route.currency}
                        </span>
                        <button onClick={() => setShowBreakdown(b => !b)}
                          style={{ fontSize: 11.5, color: 'var(--brand-600)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                          {showBreakdown ? 'Masquer ▴' : 'Voir le détail ▾'}
                        </button>
                      </div>
                      {showBreakdown && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {/* Base forfait */}
                          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--brand-500)', marginBottom: 4 }}>
                            Transport — {price.billedKg} kg — {price.baseShipping.toFixed(0)} {route.currency}
                          </div>
                          {[
                            ['Frais de base',           price.breakdown.base],
                            ['Frais de douane',          price.breakdown.customs],
                            ['Carton / manutention',     price.breakdown.carton],
                            ['Formalités',               price.breakdown.formality],
                            ['Frais de service',         price.breakdown.service],
                          ].map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-600)', paddingLeft: 10 }}>
                              <span>{k}</span><span>{v} {route.currency}</span>
                            </div>
                          ))}

                          {/* Surcharges catégories */}
                          {price.catSurchargeLines.length > 0 && (
                            <>
                              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--brand-500)', marginTop: 6, marginBottom: 2 }}>
                                Suppléments catégories — {price.catSurchargeTotal >= 0 ? '+' : ''}{price.catSurchargeTotal.toFixed(0)} {route.currency}
                              </div>
                              {price.catSurchargeLines.map(l => (
                                <div key={l.catId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-600)', paddingLeft: 10 }}>
                                  <span>{l.label} ({l.kg} kg × {l.extra >= 0 ? '+' : ''}{l.extra} {route.currency}/kg)</span>
                                  <span>{l.amount >= 0 ? '+' : ''}{l.amount.toFixed(0)} {route.currency}</span>
                                </div>
                              ))}
                            </>
                          )}

                          {/* Accessoires */}
                          {price.addonTotal > 0 && (
                            <>
                              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--brand-500)', marginTop: 6, marginBottom: 2 }}>
                                Accessoires — {price.addonTotal} {route.currency}
                              </div>
                              {price.addonSmall  > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-600)', paddingLeft: 10 }}><span>Petits sacs × {form.addons.smallBag}</span><span>{price.addonSmall} {route.currency}</span></div>}
                              {price.addonMedium > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-600)', paddingLeft: 10 }}><span>Moyens sacs × {form.addons.mediumBag}</span><span>{price.addonMedium} {route.currency}</span></div>}
                              {price.addonLarge  > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-600)', paddingLeft: 10 }}><span>Grands sacs × {form.addons.largeBag}</span><span>{price.addonLarge} {route.currency}</span></div>}
                              {price.cartonFee  > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-600)', paddingLeft: 10 }}><span>Cartons × {form.addons.cartons} ({price.cartonRate} {route.currency}/u)</span><span>{price.cartonFee.toFixed(2)} {route.currency}</span></div>}
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
                          <optgroup label="Île de Montréal (+25 CAD livraison)">
                            {montréalIleCities.map(c => <option key={c.label}>{c.label}</option>)}
                          </optgroup>
                          <optgroup label="Grand Montréal (+30 CAD livraison)">
                            {montréalGrandCities.map(c => <option key={c.label}>{c.label}</option>)}
                          </optgroup>
                          <optgroup label="Partout ailleurs">
                            <option value="Hors région">Hors région</option>
                          </optgroup>
                        </select>
                      </Field>
                      {form.recipCity === 'Hors région' && (
                        <Field label="Votre ville">
                          <input className="co-input" value={form.recipCityCustom}
                            onChange={e => upd('recipCityCustom', e.target.value)}
                            placeholder="Ex : Québec, Ottawa, Toronto…" />
                        </Field>
                      )}
                    </div>
                  </div>

                  {/* Mode de livraison */}
                  <div style={{ marginTop: 22 }}>
                    <div className="co-label" style={{ marginBottom: 10 }}>Mode de livraison</div>
                    <div className="co-opts" style={{ flexDirection: 'column', gap: 8 }}>
                      {/* Retrait */}
                      <button className={`co-opt${form.delivery === 'pickup' ? ' is-sel' : ''}`} onClick={() => upd('delivery', 'pickup')}>
                        <div className="co-opt__radio" />
                        <div className="co-opt__body">
                          <div className="co-opt__label">Retrait à l'entrepôt</div>
                          <div className="co-opt__sub">Lachine, Montréal · Sur rendez-vous</div>
                        </div>
                        <span className="co-opt__badge">Gratuit</span>
                      </button>

                      {/* Livraison domicile */}
                      <button
                        className={`co-opt${form.delivery === 'home' ? ' is-sel' : ''}`}
                        onClick={() => upd('delivery', 'home')}
                        disabled={form.recipCity === 'Hors région' && !form.recipCityCustom}
                      >
                        <div className="co-opt__radio" />
                        <div className="co-opt__body">
                          <div className="co-opt__label">Livraison à domicile</div>
                          <div className="co-opt__sub">
                            {cityZone === 'montreal-ile'   ? 'Île de Montréal'    :
                             cityZone === 'montreal-grand' ? 'Grand Montréal'     : 'Hors région'}
                          </div>
                        </div>
                        <span className="co-opt__badge">
                          {cityZone === 'montreal-ile'   ? `+${route.fees.montrealIleDelivery} ${route.currency}`   :
                           cityZone === 'montreal-grand' ? `+${route.fees.montrealGrandDelivery} ${route.currency}` : 'À évaluer'}
                        </span>
                      </button>

                      {/* Expédition postale */}
                      <button className={`co-opt${form.delivery === 'expedition' ? ' is-sel' : ''}`} onClick={() => upd('delivery', 'expedition')}>
                        <div className="co-opt__radio" />
                        <div className="co-opt__body">
                          <div className="co-opt__label">Expédition par la poste</div>
                          <div className="co-opt__sub">Colis envoyé par Postes Canada vers votre adresse</div>
                        </div>
                        <span className="co-opt__badge">Frais évalués</span>
                      </button>
                    </div>
                  </div>

                  {/* Adresse de livraison */}
                  {(form.delivery === 'home' || form.delivery === 'expedition') && (
                    <div style={{ marginTop: 18, padding: '16px 18px', background: 'var(--bg-soft)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)' }}>
                      <div className="co-label" style={{ marginBottom: 14 }}>
                        {form.delivery === 'expedition' ? 'Adresse d\'expédition' : 'Adresse de livraison'}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div className="co-field" style={{ marginBottom: 0 }}>
                          <label className="co-label">Adresse (numéro et rue)</label>
                          <input className="co-input" value={form.recipAddress} onChange={e => upd('recipAddress', e.target.value)} placeholder="123 rue Sainte-Catherine" />
                        </div>
                        <div className="co-field" style={{ marginBottom: 0 }}>
                          <label className="co-label">Appartement, bureau, suite (optionnel)</label>
                          <input className="co-input" value={form.recipApt} onChange={e => upd('recipApt', e.target.value)} placeholder="Apt 4B" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div className="co-field" style={{ marginBottom: 0 }}>
                            <label className="co-label">Ville</label>
                            <div className="co-input" style={{ background: 'var(--ink-50)', color: 'var(--ink-500)', cursor: 'default', display: 'flex', alignItems: 'center' }}>
                              {form.recipCity === 'Hors région' ? (form.recipCityCustom || 'Hors région') : form.recipCity}
                            </div>
                          </div>
                          <div className="co-field" style={{ marginBottom: 0 }}>
                            <label className="co-label">Province / Territoire</label>
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
                          <label className="co-label">Code postal</label>
                          <input className="co-input" value={form.recipPostal} onChange={e => upd('recipPostal', e.target.value)} placeholder="H3H 1A1" style={{ maxWidth: 160 }} />
                        </div>
                      </div>

                      {(form.delivery === 'expedition' || cityZone === 'other') && (
                        <div style={{ marginTop: 12, background: 'var(--warn-50)', border: '1px solid var(--warn-200)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 12.5, color: 'var(--warn-700)', lineHeight: 1.6 }}>
                          ℹ️ Les frais vers <strong>{form.recipCity === 'Hors région' ? (form.recipCityCustom || 'votre ville') : form.recipCity}</strong> seront évalués à l'arrivée à Montréal. Vous recevrez une facture et un lien de paiement par email.
                        </div>
                      )}

                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 14, cursor: 'pointer', fontSize: 12.5 }}>
                        <input type="checkbox" style={{ marginTop: 2, flexShrink: 0 }} />
                        <span style={{ color: 'var(--ink-600)' }}>Enregistrer cette adresse pour mes prochaines réservations</span>
                      </label>
                    </div>
                  )}

                  {!embedded && (
                    <label className="co-account" style={{ marginTop: 16 }}>
                      <input type="checkbox" checked={createAccount} onChange={e => setCreateAccount(e.target.checked)} />
                      <div>
                        <div className="co-account__title">Créer un compte Jumla</div>
                        <div className="co-account__sub">Suivez vos envois en ligne et accédez à votre historique.</div>
                      </div>
                    </label>
                  )}
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
                      {/* Transport */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 6 }}>
                          <span>Frais de transport — {price.billedKg} kg</span>
                          <span>{price.baseShipping.toFixed(0)} {route.currency}</span>
                        </div>
                        {[
                          ['Frais de base',           price.breakdown.base],
                          ['Frais de douane',          price.breakdown.customs],
                          ['Carton / manutention',     price.breakdown.carton],
                          ["Formalités d'expédition",  price.breakdown.formality],
                          ['Frais de service',         price.breakdown.service],
                        ].map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-500)', paddingLeft: 14, marginBottom: 2 }}>
                            <span>{k}</span><span>{v} {route.currency}</span>
                          </div>
                        ))}
                      </div>

                      {/* Suppléments catégories */}
                      {price.catSurchargeLines.length > 0 && (
                        <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 12, marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 4 }}>
                            <span>Suppléments catégories</span>
                            <span>{price.catSurchargeTotal >= 0 ? '+' : ''}{price.catSurchargeTotal.toFixed(0)} {route.currency}</span>
                          </div>
                          {price.catSurchargeLines.map(l => (
                            <div key={l.catId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-500)', paddingLeft: 14, marginBottom: 2 }}>
                              <span>{l.label} — {l.kg} kg × {l.extra >= 0 ? '+' : ''}{l.extra} {route.currency}/kg</span>
                              <span>{l.amount >= 0 ? '+' : ''}{l.amount.toFixed(0)} {route.currency}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Accessoires */}
                      {price.addonTotal > 0 && (
                        <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 12, marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 4 }}>
                            <span>Accessoires</span><span>{price.addonTotal.toFixed(2)} {route.currency}</span>
                          </div>
                          {price.addonSmall  > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-500)', paddingLeft: 14, marginBottom: 2 }}><span>Petits sacs × {form.addons.smallBag}</span><span>{price.addonSmall} {route.currency}</span></div>}
                          {price.addonMedium > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-500)', paddingLeft: 14, marginBottom: 2 }}><span>Moyens sacs × {form.addons.mediumBag}</span><span>{price.addonMedium} {route.currency}</span></div>}
                          {price.addonLarge  > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-500)', paddingLeft: 14, marginBottom: 2 }}><span>Grands sacs × {form.addons.largeBag}</span><span>{price.addonLarge} {route.currency}</span></div>}
                          {price.cartonFee   > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-500)', paddingLeft: 14 }}><span>Cartons × {form.addons.cartons} ({price.cartonRate} {route.currency}/u)</span><span>{price.cartonFee.toFixed(2)} {route.currency}</span></div>}
                        </div>
                      )}

                      {/* Livraison */}
                      <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 12, paddingBottom: 16 }}>
                        {form.delivery === 'pickup' ? (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, color: 'var(--ink-800)' }}>
                            <span>Retrait entrepôt</span><span>Gratuit</span>
                          </div>
                        ) : price.isExpedition || price.isOutsideDelivery ? (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, color: 'var(--warn-700)' }}>
                              <span>{price.isExpedition ? 'Expédition postale' : 'Livraison hors région'}</span><span>À évaluer</span>
                            </div>
                            <p style={{ fontSize: 11.5, color: 'var(--ink-400)', marginTop: 4, lineHeight: 1.5 }}>
                              Facture envoyée par email à l'arrivée de votre colis à Montréal.
                            </p>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, color: 'var(--ink-800)' }}>
                            <span>{price.isMontrealIle ? 'Livraison île de Montréal' : 'Livraison Grand Montréal'}</span>
                            <span>{price.deliveryFee} {route.currency}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ padding: '14px 16px', borderTop: '2px solid var(--ink-900)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-700)' }}>Total à payer maintenant</span>
                      <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-900)' }}>{price.total.toFixed(0)} {route.currency}</span>
                    </div>
                  </div>

                  <div style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-100)', borderRadius: 'var(--radius)', padding: '12px 16px', fontSize: 13, color: 'var(--brand-700)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>🏦</span>
                    <div>
                      <div style={{ fontWeight: 700 }}>Paiement par virement Interac</div>
                      <div style={{ fontSize: 12, marginTop: 2, color: 'var(--brand-600)' }}>Vous recevrez les instructions à l'étape suivante.</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Payment flow: Interac ── */}
              {step === 3 && payStatus === 'interac' && (
                <div className="co-section">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ fontSize: 26 }}>🏦</div>
                    <div>
                      <div className="co-section__title" style={{ marginBottom: 0 }}>Virement Interac</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>Envoyez le montant exact depuis votre banque en ligne.</div>
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-soft)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 18 }}>
                    {[
                      ['Envoyer à',            'paiement@jumla.cargo',             false],
                      ['Depuis votre adresse', effectiveUser?.email ?? '',            true ],
                      ['Montant',              `${price?.total.toFixed(0)} ${route?.currency}`, false],
                      ['Message / Référence',  refCode,                             false],
                    ].map(([k, v, highlight], idx) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', borderBottom: idx < 3 ? '1px solid var(--border-soft)' : 'none', background: highlight ? 'var(--brand-50)' : 'transparent' }}>
                        <span style={{ fontSize: 12.5, color: 'var(--ink-400)', fontWeight: 500 }}>{k}</span>
                        <span style={{ fontWeight: 700, color: highlight ? 'var(--brand-700)' : 'var(--ink-900)', fontFamily: 'ui-monospace, monospace', fontSize: k === 'Montant' ? 17 : 13 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'var(--warn-50)', border: '1px solid var(--warn-200)', borderRadius: 'var(--radius)', padding: '12px 16px', fontSize: 12.5, color: 'var(--warn-700)', lineHeight: 1.65, marginBottom: 20 }}>
                    ⚠️ Votre colis ne sera traité qu'<strong>après réception et confirmation</strong> du virement. Incluez la référence <strong>{refCode}</strong> dans le message du virement.
                  </div>
                  {bookingErr && (
                    <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', fontSize: 12.5, color: '#DC2626', marginBottom: 12 }}>
                      {bookingErr}
                    </div>
                  )}
                  <button className="co-btn co-btn--brand" onClick={confirmInterac} style={{ width: '100%' }}>
                    J'ai effectué mon virement →
                  </button>
                  <button className="co-btn co-btn--ghost" onClick={() => setPayStatus('idle')} style={{ marginTop: 8, width: '100%' }}>
                    ← Retour à la facture
                  </button>
                </div>
              )}

              {/* ── Payment flow: Processing ── */}
              {step === 3 && payStatus === 'processing' && (
                <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <div style={{ width: 52, height: 52, border: '4px solid var(--border)', borderTopColor: 'var(--brand-500)', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 0.8s linear infinite' }} />
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-800)', marginBottom: 6 }}>Enregistrement de votre virement…</div>
                  <p style={{ fontSize: 13, color: 'var(--ink-400)' }}>Merci de patienter quelques instants.</p>
                </div>
              )}

              {/* Navigation — hidden during payment sub-flows */}
              {payStatus === 'idle' && (
                <div className="co-nav">
                  <button className="co-btn co-btn--ghost" onClick={prev}>
                    ← {step === 0 ? "Retour à l'accueil" : 'Précédent'}
                  </button>
                  <button
                    className={`co-btn ${step === STEPS.length - 1 ? 'co-btn--brand' : 'co-btn--primary'}`}
                    onClick={step === STEPS.length - 1 ? handlePay : next}
                    disabled={!canNext()}
                    style={{ opacity: canNext() ? 1 : 0.4, cursor: canNext() ? 'pointer' : 'default' }}
                  >
                    {step === STEPS.length - 1
                      ? `Payer ${price ? price.total.toFixed(0) + ' ' + route.currency : ''} →`
                      : 'Continuer →'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <aside className="co-aside">
          <Summary
            route={route} departure={departure}
            items={items} price={price} form={form} step={step} isDone={isDone}
          />
        </aside>
      </div>

      {!embedded && <SiteFooter />}
    </div>
  );
}
