// ── Legacy exports (backwards compat) ──────────────────────────────────────
export type ProductType = 'standard' | 'biere' | 'manioc_huile' | 'cosmetique' | 'vetements';

export interface PricingInput {
  weightKg: number;
  productType: ProductType;
  nbCartons: number;
  nbPetitsSacs: number;
  nbSacsMoyens: number;
  nbGrandsSacs: number;
  nbPlastiques: number;
  nbPlastiquesBiere: number;
  nbCasiers24x65: number;
  nbCasiers24x33: number;
  nbCasiers12x50: number;
  marginPct: number;
}

export interface PricingBreakdown {
  transport: number;
  cartons: number;
  sacs: number;
  manutention: number;
  douane: number;
  formalites: number;
  conditionnement: number;
  fraisSAQ: number;
  sousTotal: number;
  marge: number;
  prixClient: number;
}

// ── New unified types ───────────────────────────────────────────────────────
export type ProductCategory =
  | 'standard'
  | 'vetements'
  | 'cosmetique'
  | 'alimentaire'
  | 'biere'
  | 'electronique'
  | 'documents'
  | 'manioc_huile';

export type BeerFormat = '24x65' | '24x33' | '12x50';

export interface LineItem {
  description?: string;
  category: ProductCategory;
  weightKg: number;
  beerFormat?: BeerFormat;
  nbCasiers?: number;
}

export interface Addons {
  nbCartons?: number;
  nbPetitsSacs?: number;
  nbSacsMoyens?: number;
  nbGrandsSacs?: number;
  nbPlastiques?: number;
}

export interface RouteTier {
  from: number;
  to: number;
  transportFlat?: number;
  transportPerKg?: number;
  cartonFlat?: number;
  cartonPerUnit?: number;
  manutentionFlat?: number;
  manutentionPerUnit?: number;
  manutentionMin?: number;
  douaneFlat?: number;
  douanePerKg?: number;
  formalitesFlat?: number;
  formalitesPerKg?: number;
}

export interface RouteFees {
  tiers: RouteTier[];
  bags: { small: number; medium: number; large: number };
  plastic: number;
  saq: { casier24x65: number; casier24x33: number; casier12x50: number };
  supplements: {
    vetements: number;
    cosmetique: number;
    biere: number;
    electronique: number;
    documents: number;
  };
  marginPct: number;
  deliveryFee: number;
}

export interface PriceBreakdown {
  totalKg: number;
  tier: RouteTier | null;
  transport: number;
  supplements: { category: ProductCategory; kg: number; rate: number; amount: number }[];
  supplementTotal: number;
  carton: number;
  sacs: number;
  manutention: number;
  douane: number;
  formalites: number;
  plastic: number;
  saqLines: { format: BeerFormat; nbCasiers: number; rate: number; amount: number }[];
  saqTotal: number;
  sousTotal: number;
  marginPct: number;
  marge: number;
  prixClient: number;
}

// ── Default route fees (8 tiers per business rules) ─────────────────────────
export const DEFAULT_ROUTE_FEES: RouteFees = {
  tiers: [
    // 0.5–3 kg : flat everything
    { from: 0.5,   to: 3,        transportFlat: 50,   cartonFlat: 1,              manutentionFlat: 4,                     douaneFlat: 5,      formalitesFlat: 5 },
    // 3.5–9.5 kg
    { from: 3.5,   to: 9.5,      transportPerKg: 13,  cartonPerUnit: 1.5,         manutentionFlat: 5,                     douanePerKg: 3,     formalitesPerKg: 2 },
    // 10–22.5 kg
    { from: 10,    to: 22.5,     transportPerKg: 12,  cartonPerUnit: 1.5,         manutentionFlat: 10,                    douanePerKg: 3,     formalitesPerKg: 2 },
    // 23.5–69.5 kg
    { from: 23.5,  to: 69.5,     transportPerKg: 11,  cartonPerUnit: 1.5,         manutentionFlat: 15,                    douanePerKg: 2,     formalitesPerKg: 1.5 },
    // 70–115 kg
    { from: 70,    to: 115,      transportPerKg: 10,  cartonPerUnit: 1.5,         manutentionPerUnit: 5, manutentionMin: 20,  douanePerKg: 2.5,  formalitesPerKg: 1 },
    // 115.5–199.5 kg
    { from: 115.5, to: 199.5,    transportPerKg: 9,   cartonPerUnit: 1.5,         manutentionPerUnit: 4.5, manutentionMin: 27, douanePerKg: 1.5, formalitesPerKg: 1 },
    // 200–250 kg
    { from: 200,   to: 250,      transportPerKg: 8,   cartonPerUnit: 1.5,         manutentionPerUnit: 4,   manutentionMin: 40, douanePerKg: 1.5, formalitesPerKg: 1 },
    // 250.5+ kg
    { from: 250.5, to: 99999, transportPerKg: 7.5, cartonPerUnit: 1.5,         manutentionPerUnit: 3,   manutentionMin: 60, douanePerKg: 1.5, formalitesPerKg: 1 },
  ],
  bags:        { small: 5, medium: 7.5, large: 10 },
  plastic:     0.6,
  saq:         { casier24x65: 24.50, casier24x33: 35.83, casier12x50: 21.34 },
  supplements: { vetements: 2, cosmetique: 3, biere: 6, electronique: 5, documents: -2 },
  marginPct:   30,
  deliveryFee: 25,
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function r2(value: number): number {
  return Math.round(value * 100) / 100;
}

function findTier(tiers: RouteTier[], totalKg: number): RouteTier | null {
  if (!tiers || tiers.length === 0) return null;
  // Exact match
  const match = tiers.find(t => totalKg >= t.from && totalKg <= t.to);
  if (match) return match;
  // In a gap between tiers: use the next tier (round up)
  const next = tiers.find(t => t.from > totalKg);
  if (next) return next;
  // Below minimum: use first tier
  if (totalKg < tiers[0].from) return tiers[0];
  // Beyond all tiers: use last
  return tiers[tiers.length - 1];
}

// ── Main new calculation function ────────────────────────────────────────────
export function calculateFromFees(
  items: LineItem[],
  fees: RouteFees,
  addons: Addons,
  marginPctOverride?: number,
): PriceBreakdown {
  const totalKg = r2(items.reduce((s, it) => s + (it.weightKg || 0), 0));
  const tier = findTier(fees.tiers, totalKg);

  // ── Transport ────────────────────────────────────────────────────────────
  let transport = 0;
  if (tier) {
    if (tier.transportFlat !== undefined) {
      transport = tier.transportFlat;
    } else if (tier.transportPerKg !== undefined) {
      transport = r2(tier.transportPerKg * totalKg);
    }
  }

  // ── Supplements grouped by category ──────────────────────────────────────
  const catKgMap: Partial<Record<ProductCategory, number>> = {};
  for (const item of items) {
    if (item.weightKg > 0) {
      catKgMap[item.category] = (catKgMap[item.category] || 0) + item.weightKg;
    }
  }

  const supplements: PriceBreakdown['supplements'] = [];
  for (const [cat, kg] of Object.entries(catKgMap) as [ProductCategory, number][]) {
    const rate = (fees.supplements as Record<string, number>)[cat] ?? 0;
    if (rate !== 0) {
      supplements.push({ category: cat, kg: r2(kg), rate, amount: r2(rate * kg) });
    }
  }
  const supplementTotal = r2(supplements.reduce((s, l) => s + l.amount, 0));

  // ── Carton ───────────────────────────────────────────────────────────────
  const nbCartons = addons.nbCartons || 0;
  let carton = 0;
  if (tier) {
    if (tier.cartonFlat !== undefined) {
      carton = tier.cartonFlat;
    } else if (tier.cartonPerUnit !== undefined) {
      carton = r2(tier.cartonPerUnit * nbCartons);
    }
  }

  // ── Sacs ─────────────────────────────────────────────────────────────────
  const nbPetits  = addons.nbPetitsSacs || 0;
  const nbMoyens  = addons.nbSacsMoyens || 0;
  const nbGrands  = addons.nbGrandsSacs || 0;
  const totalSacs = nbPetits + nbMoyens + nbGrands;
  const sacs = r2(nbPetits * fees.bags.small + nbMoyens * fees.bags.medium + nbGrands * fees.bags.large);

  // ── Manutention ──────────────────────────────────────────────────────────
  let manutention = 0;
  if (tier) {
    if (tier.manutentionFlat !== undefined) {
      manutention = tier.manutentionFlat;
    } else if (tier.manutentionPerUnit !== undefined) {
      const nbEmballages = nbCartons + totalSacs;
      const raw = tier.manutentionPerUnit * nbEmballages;
      manutention = r2(Math.max(tier.manutentionMin ?? 0, raw));
    }
  }

  // ── Douane ───────────────────────────────────────────────────────────────
  let douane = 0;
  if (tier) {
    if (tier.douaneFlat !== undefined) {
      douane = tier.douaneFlat;
    } else if (tier.douanePerKg !== undefined) {
      douane = r2(tier.douanePerKg * totalKg);
    }
  }

  // ── Formalités ───────────────────────────────────────────────────────────
  let formalites = 0;
  if (tier) {
    if (tier.formalitesFlat !== undefined) {
      formalites = tier.formalitesFlat;
    } else if (tier.formalitesPerKg !== undefined) {
      formalites = r2(tier.formalitesPerKg * totalKg);
    }
  }

  // ── Plastique ────────────────────────────────────────────────────────────
  const nbPlastiques = addons.nbPlastiques || 0;
  const plastic = r2(fees.plastic * nbPlastiques);

  // ── SAQ (beer lines only) ─────────────────────────────────────────────────
  const saqLines: PriceBreakdown['saqLines'] = [];
  for (const item of items) {
    if (item.category === 'biere' && item.beerFormat && (item.nbCasiers || 0) > 0) {
      const fmt  = item.beerFormat;
      const nb   = item.nbCasiers!;
      const key  = ('casier' + fmt) as keyof typeof fees.saq;
      const rate = fees.saq[key] ?? 0;
      saqLines.push({ format: fmt, nbCasiers: nb, rate, amount: r2(rate * nb) });
    }
  }
  const saqTotal = r2(saqLines.reduce((s, l) => s + l.amount, 0));

  // ── Totals ────────────────────────────────────────────────────────────────
  const sousTotal  = r2(transport + supplementTotal + carton + sacs + manutention + douane + formalites + plastic + saqTotal);
  const marginPct  = marginPctOverride ?? fees.marginPct;
  const marge      = r2(sousTotal * (marginPct / 100));
  const prixClient = r2(sousTotal + marge);

  return {
    totalKg, tier, transport,
    supplements, supplementTotal,
    carton, sacs, manutention, douane, formalites,
    plastic, saqLines, saqTotal,
    sousTotal, marginPct, marge, prixClient,
  };
}

// ── Legacy calculatePrice (kept for backwards compat) ────────────────────────
function r2L(value: number): number {
  return Math.round(value * 100) / 100;
}

function legacyTransport(weightKg: number, productType: ProductType): number {
  if (productType === 'biere') return 6 * weightKg;
  if (productType === 'manioc_huile') {
    if (weightKg <= 3) return 50;
    if (weightKg <= 9.5) return 13 * weightKg;
    return 6 * weightKg;
  }
  if (weightKg <= 3) return 50;
  let baseRate: number;
  if (weightKg <= 9.5)   baseRate = 13;
  else if (weightKg <= 22.5)  baseRate = 12;
  else if (weightKg <= 69.5)  baseRate = 11;
  else if (weightKg <= 115)   baseRate = 10;
  else if (weightKg <= 199.5) baseRate = 9;
  else if (weightKg <= 250)   baseRate = 8;
  else                        baseRate = 7.5;
  let supplement = 0;
  if (productType === 'cosmetique') supplement = 3;
  if (productType === 'vetements')  supplement = 2;
  return (baseRate + supplement) * weightKg;
}

export function calculatePrice(input: PricingInput): PricingBreakdown {
  const {
    weightKg, productType, nbCartons, nbPetitsSacs, nbSacsMoyens, nbGrandsSacs,
    nbPlastiques, nbPlastiquesBiere, nbCasiers24x65, nbCasiers24x33, nbCasiers12x50, marginPct,
  } = input;

  const isFlat = (weightKg <= 3 && productType === 'standard') || (productType === 'manioc_huile' && weightKg <= 3);

  let transport: number, cartons: number, manutention: number, douane: number, formalites: number;

  if (isFlat) {
    transport = 50; cartons = 1; manutention = 4; douane = 5; formalites = 5;
  } else {
    transport = r2L(legacyTransport(weightKg, productType));
    cartons   = r2L(weightKg <= 3 ? 1 : 1.5 * nbCartons);
    const nbE = nbCartons + nbPetitsSacs + nbSacsMoyens + nbGrandsSacs;
    if (productType === 'manioc_huile' && weightKg > 9.5) {
      manutention = weightKg;
    } else if (weightKg <= 9.5)  { manutention = 5; }
    else if (weightKg <= 22.5)   { manutention = 10; }
    else if (weightKg <= 69.5)   { manutention = 15; }
    else if (weightKg <= 115)    { manutention = r2L(Math.max(20, 5 * nbE)); }
    else if (weightKg <= 199.5)  { manutention = r2L(Math.max(27, 4.5 * nbE)); }
    else if (weightKg <= 250)    { manutention = r2L(Math.max(40, 4 * nbE)); }
    else                         { manutention = r2L(Math.max(60, 3 * nbE)); }

    if (productType === 'manioc_huile' && weightKg > 9.5) {
      douane = 0; formalites = 0;
    } else {
      if (weightKg <= 22.5)     { douane = r2L(3 * weightKg); formalites = r2L(2 * weightKg); }
      else if (weightKg <= 69.5){ douane = r2L(2 * weightKg); formalites = r2L(1.5 * weightKg); }
      else if (weightKg <= 115) { douane = r2L(2.5 * weightKg); formalites = r2L(weightKg); }
      else                      { douane = r2L(1.5 * weightKg); formalites = r2L(weightKg); }
    }
  }

  const sacs           = r2L(5 * nbPetitsSacs + 7.5 * nbSacsMoyens + 10 * nbGrandsSacs);
  const conditionnement = r2L(0.6 * nbPlastiques + 1.5 * nbPlastiquesBiere);
  const fraisSAQ       = r2L(24.5 * nbCasiers24x65 + 35.83 * nbCasiers24x33 + 21.34 * nbCasiers12x50);
  const sousTotal      = r2L(transport + cartons + sacs + manutention + douane + formalites + conditionnement + fraisSAQ);
  const marge          = r2L(sousTotal * (marginPct / 100));
  const prixClient     = r2L(sousTotal * (1 + marginPct / 100));

  return { transport, cartons, sacs, manutention, douane, formalites, conditionnement, fraisSAQ, sousTotal, marge, prixClient };
}
