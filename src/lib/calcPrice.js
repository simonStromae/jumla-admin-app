'use client';

// Shared pricing engine — used by Booking.jsx AND JEstimator in Landing.jsx
// Must stay in sync with pricing.ts (server-side mirror)

export const ITEM_CATEGORIES = [
  { id: 'standard',     label: 'Autre',                         icon: '📦', extraPerKg: 0  },
  { id: 'vetements',    label: 'Vêtements / Chaussures / Sacs', icon: '👗', extraPerKg: 2  },
  { id: 'cosmetique',   label: 'Cosmétiques / Compléments',     icon: '💄', extraPerKg: 3  },
  { id: 'alimentaire',  label: 'Alimentaire / Épices',          icon: '🥘', extraPerKg: 0  },
  { id: 'biere',        label: 'Bière',                         icon: '🍺', extraPerKg: 6  },
  { id: 'manioc_huile', label: 'Bâton de manioc / Huile rouge', icon: '🌿', extraPerKg: 0  },
  { id: 'electronique', label: 'Électronique',                  icon: '📱', extraPerKg: 5  },
  { id: 'documents',    label: 'Documents',                     icon: '📄', extraPerKg: -2 },
];

export const DEFAULT_TIERS = [
  { from: 0.5,   to: 3,      transportFlat: 50,   cartonFlat: 1,      manutentionFlat: 4,                       douaneFlat: 5,        formalitesFlat: 5    },
  { from: 3.5,   to: 9.5,    transportPerKg: 13,  cartonPerUnit: 1.5, manutentionFlat: 5,                       douanePerKg: 3,       formalitesPerKg: 2   },
  { from: 10,    to: 22.5,   transportPerKg: 12,  cartonPerUnit: 1.5, manutentionFlat: 10,                      douanePerKg: 3,       formalitesPerKg: 2   },
  { from: 23.5,  to: 69.5,   transportPerKg: 11,  cartonPerUnit: 1.5, manutentionFlat: 15,                      douanePerKg: 2,       formalitesPerKg: 1.5 },
  { from: 70,    to: 115,    transportPerKg: 10,  cartonPerUnit: 1.5, manutentionPerUnit: 5,  manutentionMin: 20, douanePerKg: 2.5,   formalitesPerKg: 1   },
  { from: 115.5, to: 199.5,  transportPerKg: 9,   cartonPerUnit: 1.5, manutentionPerUnit: 4.5, manutentionMin: 27, douanePerKg: 1.5, formalitesPerKg: 1   },
  { from: 200,   to: 250,    transportPerKg: 8,   cartonPerUnit: 1.5, manutentionPerUnit: 4,   manutentionMin: 40, douanePerKg: 1.5, formalitesPerKg: 1   },
  { from: 250.5, to: 99999,  transportPerKg: 7.5, cartonPerUnit: 1.5, manutentionPerUnit: 3,   manutentionMin: 60, douanePerKg: 1.5, formalitesPerKg: 1   },
];

export const DEFAULT_FEES = {
  tiers: DEFAULT_TIERS,
  bags: { small: 5, medium: 7.5, large: 10 },
  saq: { casier24x65: 24.50, casier24x33: 35.83, casier12x50: 21.34 },
  supplements: { vetements: 2, cosmetique: 3, biere: 6, electronique: 5, documents: -2 },
  marginPct: 0,
  montrealIleDelivery: 25,
  montrealGrandDelivery: 30,
};

export function r2(v) { return Math.round(v * 100) / 100; }

export function findTier(tiers, totalKg) {
  if (!tiers || tiers.length === 0) return null;
  const match = tiers.find(t => totalKg >= t.from && totalKg <= t.to);
  if (match) return match;
  const next = tiers.find(t => t.from > totalKg);
  if (next) return next;
  if (totalKg < tiers[0].from) return tiers[0];
  return tiers[tiers.length - 1];
}

export function routeFeesToCalcFees(storedFees) {
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
        if (t.flat !== undefined && t.transportFlat === undefined && t.transportPerKg === undefined) {
          return { from, to, transportFlat: parseFloat(t.flat) || 0 };
        }
        return { ...t, from, to };
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
  };
}

/* ─── Sea freight ─── */

export const DEFAULT_SEA_TIERS = [
  { from: 1,      to: 10,    transportFlat: 100,                         douaneFlat: 10,    formalitesFlat: 10   },
  { from: 10.5,   to: 50,    transportPerKg: 9.5,  manutentionFlat: 15, douanePerKg: 2,    formalitesPerKg: 1.5 },
  { from: 50.5,   to: 100,   transportPerKg: 8,    manutentionFlat: 20, douanePerKg: 1.5,  formalitesPerKg: 1   },
  { from: 100.5,  to: 200,   transportPerKg: 6.5,  manutentionFlat: 30, douanePerKg: 1.5,  formalitesPerKg: 1   },
  { from: 200.5,  to: 300,   transportPerKg: 5.5,  manutentionFlat: 40, douanePerKg: 1,    formalitesPerKg: 0.75},
  { from: 300.5,  to: 1000,  transportPerKg: 4.5,  manutentionFlat: 60, douanePerKg: 1,    formalitesPerKg: 0.75},
  { from: 1000.5, to: 99999, transportPerKg: 3.5,  manutentionFlat: 80, douanePerKg: 0.75, formalitesPerKg: 0.5 },
];

export const DEFAULT_SEA_FEES = {
  ...DEFAULT_FEES,
  tiers: DEFAULT_SEA_TIERS,
  transportMode: 'sea',
  bulkyPerCbm: 800,
  highValueThreshold: 500,
  highValuePct: 2,
};

// L × W × H in cm → cubic metres
export function calcCbm(lengthCm, widthCm, heightCm) {
  return (parseFloat(lengthCm) * parseFloat(widthCm) * parseFloat(heightCm)) / 1_000_000;
}

// Sea freight pricing: chargeable weight = max(actual kg, CBM × 500)
// items: [{ cat, kg, lengthCm?, widthCm?, heightCm?, declaredValue? }]
export function calcSeaPrice(items, fees) {
  const f = fees || DEFAULT_SEA_FEES;
  const tiers = f.tiers?.length ? f.tiers : DEFAULT_SEA_TIERS;
  const CBM_TO_KG = 500;
  const bulkyPerCbm = f.bulkyPerCbm ?? 800;

  let totalChargeableKg = 0;
  let totalCbm = 0;
  let bulkyCharge = 0;

  const itemDetails = items.map(item => {
    const kg = parseFloat(item.kg) || 0;
    const l = parseFloat(item.lengthCm) || 0;
    const w = parseFloat(item.widthCm)  || 0;
    const h = parseFloat(item.heightCm) || 0;
    const cbm       = (l && w && h) ? r2(l * w * h / 1_000_000) : 0;
    const volWeight = r2(cbm * CBM_TO_KG);
    const chargeableKg = cbm > 0 ? Math.max(kg, volWeight) : kg;
    const isBulky   = cbm > 0 && volWeight > kg;
    totalChargeableKg += chargeableKg;
    totalCbm          += cbm;
    if (isBulky) bulkyCharge = r2(bulkyCharge + cbm * bulkyPerCbm);
    return { ...item, kg, cbm, volWeight, chargeableKg, isBulky };
  });

  totalChargeableKg = r2(totalChargeableKg);
  totalCbm          = r2(totalCbm);
  if (totalChargeableKg <= 0) return null;

  const tier = findTier(tiers, totalChargeableKg);
  if (!tier) return null;

  let transport = 0;
  if (tier.transportFlat !== undefined)       transport = tier.transportFlat;
  else if (tier.transportPerKg !== undefined) transport = r2(tier.transportPerKg * totalChargeableKg);

  const suppRates = f.supplements || DEFAULT_FEES.supplements;
  const catKgMap = {};
  itemDetails.forEach(item => {
    if (item.chargeableKg <= 0) return;
    const cat = item.cat || 'standard';
    catKgMap[cat] = (catKgMap[cat] || 0) + item.chargeableKg;
  });
  const catSurchargeLines = Object.entries(catKgMap).map(([catId, kg]) => {
    const def  = ITEM_CATEGORIES.find(c => c.id === catId);
    const rate = suppRates[catId] ?? def?.extraPerKg ?? 0;
    return { catId, label: def?.label || catId, kg, rate, amount: r2(kg * rate) };
  }).filter(l => l.rate !== 0);
  const catSurchargeTotal = r2(catSurchargeLines.reduce((s, l) => s + l.amount, 0));

  let manutention = 0;
  if (tier.manutentionFlat !== undefined) manutention = tier.manutentionFlat;
  else if (tier.manutentionPerUnit !== undefined) {
    manutention = r2(Math.max(tier.manutentionMin || 0, tier.manutentionPerUnit * items.length));
  }

  let douane = 0;
  if (tier.douaneFlat !== undefined)       douane = tier.douaneFlat;
  else if (tier.douanePerKg !== undefined) douane = r2(tier.douanePerKg * totalChargeableKg);

  let formalites = 0;
  if (tier.formalitesFlat !== undefined)       formalites = tier.formalitesFlat;
  else if (tier.formalitesPerKg !== undefined) formalites = r2(tier.formalitesPerKg * totalChargeableKg);

  const highValueThreshold = f.highValueThreshold ?? 500;
  const highValuePct       = f.highValuePct ?? 2;
  const totalDeclared      = itemDetails.reduce((s, i) => s + (parseFloat(i.declaredValue) || 0), 0);
  const highValueSurcharge = totalDeclared > highValueThreshold ? r2(totalDeclared * highValuePct / 100) : 0;

  const sousTotal  = r2(transport + catSurchargeTotal + manutention + douane + formalites + bulkyCharge + highValueSurcharge);
  const marginPct  = f.marginPct ?? DEFAULT_FEES.marginPct;
  const marge      = r2(sousTotal * (marginPct / 100));
  const prixClient = r2(sousTotal + marge);

  return {
    totalChargeableKg, totalCbm, tier,
    transport, catSurchargeLines, catSurchargeTotal,
    bulkyCharge, highValueSurcharge, totalDeclared,
    manutention, douane, formalites,
    sousTotal, marginPct, marge, prixClient, total: prixClient,
    itemDetails,
  };
}

/* ─── Air freight ─── */

export function calcPrice(items, fees, addons = {}, delivery = 'expedition', cityZone = null) {
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

  // Category supplements (per-kg absolute)
  const catKgMap = {};
  items.forEach(item => {
    const kg = parseFloat(item.kg) || 0;
    if (kg <= 0) return;
    catKgMap[item.cat || 'standard'] = (catKgMap[item.cat || 'standard'] || 0) + kg;
  });
  const suppRates = fees.supplements || DEFAULT_FEES.supplements;
  const catSurchargeLines = Object.entries(catKgMap).map(([catId, kg]) => {
    const def  = ITEM_CATEGORIES.find(c => c.id === catId);
    const rate = suppRates[catId] ?? def?.extraPerKg ?? 0;
    return { catId, label: def?.label || catId, kg, rate, amount: r2(kg * rate) };
  }).filter(l => l.rate !== 0);
  const catSurchargeTotal = r2(catSurchargeLines.reduce((s, l) => s + l.amount, 0));

  // SAQ
  const saqRates = fees.saq || DEFAULT_FEES.saq;
  const saqLines = items
    .filter(item => item.cat === 'biere' && item.beerFormat && Number(item.nbCasiers) > 0)
    .map(item => {
      const key = 'casier' + item.beerFormat;
      const nb  = Number(item.nbCasiers);
      return { format: item.beerFormat, nbCasiers: nb, rate: saqRates[key] ?? 0, amount: r2((saqRates[key] ?? 0) * nb) };
    });
  const saqTotal = r2(saqLines.reduce((s, l) => s + l.amount, 0));

  // Carton & sacs
  const nbCartons   = addons.cartons   || 0;
  const totalSacs   = (addons.smallBag || 0) + (addons.mediumBag || 0) + (addons.largeBag || 0);
  let carton = 0;
  if (tier.cartonFlat !== undefined)       carton = r2(tier.cartonFlat);
  else if (tier.cartonPerUnit !== undefined) carton = r2(tier.cartonPerUnit * nbCartons);
  const bagRates   = fees.bags || DEFAULT_FEES.bags;
  const addonSmall  = (addons.smallBag  || 0) * bagRates.small;
  const addonMedium = (addons.mediumBag || 0) * bagRates.medium;
  const addonLarge  = (addons.largeBag  || 0) * bagRates.large;
  const sacs = r2(addonSmall + addonMedium + addonLarge);

  // Manutention
  let manutention = 0;
  if (tier.manutentionFlat !== undefined) {
    manutention = tier.manutentionFlat;
  } else if (tier.manutentionPerUnit !== undefined) {
    const nbEmballages = nbCartons + totalSacs;
    manutention = r2(Math.max(tier.manutentionMin || 0, tier.manutentionPerUnit * nbEmballages));
  }

  // Douane & formalités
  let douane = 0;
  if (tier.douaneFlat !== undefined)       douane = tier.douaneFlat;
  else if (tier.douanePerKg !== undefined) douane = r2(tier.douanePerKg * totalKg);

  let formalites = 0;
  if (tier.formalitesFlat !== undefined)       formalites = tier.formalitesFlat;
  else if (tier.formalitesPerKg !== undefined) formalites = r2(tier.formalitesPerKg * totalKg);

  const addonTotal  = r2(sacs + carton);
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
  const total      = r2(prixClient + (isExpedition || isOutsideDelivery ? 0 : deliveryFee));

  return {
    totalKg, tier,
    transport, catSurchargeLines, catSurchargeTotal,
    saqLines, saqTotal, carton, addonSmall, addonMedium, addonLarge, addonTotal, sacs,
    manutention, douane, formalites,
    sousTotal, marginPct, marge, prixClient, deliveryFee,
    isExpedition, isMontrealIle, isMontrealGrand, isOutsideDelivery, total,
    cartonRate: tier.cartonFlat !== undefined ? tier.cartonFlat : (tier.cartonPerUnit || 1.5),
    billedKg: totalKg, baseShipping: transport,
  };
}
