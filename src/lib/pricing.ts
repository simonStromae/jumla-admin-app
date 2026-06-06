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

function r2(value: number): number {
  return Math.round(value * 100) / 100;
}

function calcTransport(weightKg: number, productType: ProductType): number {
  if (productType === 'biere') {
    return 6 * weightKg;
  }

  if (productType === 'manioc_huile') {
    if (weightKg <= 3) return 50;
    if (weightKg <= 9.5) return 13 * weightKg;
    return 6 * weightKg;
  }

  let baseRate: number;
  if (weightKg <= 3) {
    return 50; // part of flat $65
  } else if (weightKg <= 9.5) {
    baseRate = 13;
  } else if (weightKg <= 22.5) {
    baseRate = 12;
  } else if (weightKg <= 69.5) {
    baseRate = 11;
  } else if (weightKg <= 115) {
    baseRate = 10;
  } else if (weightKg <= 199.5) {
    baseRate = 9;
  } else if (weightKg <= 250) {
    baseRate = 8;
  } else {
    baseRate = 7.5;
  }

  let supplement = 0;
  if (productType === 'cosmetique') supplement = 3;
  if (productType === 'vetements') supplement = 2;

  return (baseRate + supplement) * weightKg;
}

function calcCartons(weightKg: number, nbCartons: number): number {
  if (weightKg <= 3) return 1; // included in flat
  return 1.5 * nbCartons;
}

function calcSacs(nbPetitsSacs: number, nbSacsMoyens: number, nbGrandsSacs: number): number {
  return 5 * nbPetitsSacs + 7.5 * nbSacsMoyens + 10 * nbGrandsSacs;
}

function calcManutention(
  weightKg: number,
  productType: ProductType,
  nbCartons: number,
  nbPetitsSacs: number,
  nbSacsMoyens: number,
  nbGrandsSacs: number
): number {
  if (productType === 'manioc_huile' && weightKg > 9.5) {
    return weightKg; // $1/kg
  }

  if (weightKg <= 3) return 4; // flat, included in $65
  if (weightKg <= 9.5) return 5;
  if (weightKg <= 22.5) return 10;
  if (weightKg <= 69.5) return 15;

  const nbEmballages = nbCartons + nbPetitsSacs + nbSacsMoyens + nbGrandsSacs;

  if (weightKg <= 115) return Math.max(20, 5 * nbEmballages);
  if (weightKg <= 199.5) return Math.max(27, 4.5 * nbEmballages);
  if (weightKg <= 250) return Math.max(40, 5 * nbEmballages);
  return Math.max(60, 5 * nbEmballages);
}

function calcDouane(weightKg: number, productType: ProductType): number {
  if (productType === 'manioc_huile' && weightKg > 9.5) return 0;

  if (weightKg <= 3) return 5; // flat, included in $65
  if (weightKg <= 22.5) return 3 * weightKg;
  if (weightKg <= 69.5) return 2 * weightKg;
  if (weightKg <= 115) return 2.5 * weightKg;
  return 1.5 * weightKg;
}

function calcFormalites(weightKg: number, productType: ProductType): number {
  if (productType === 'manioc_huile' && weightKg > 9.5) return 0;

  if (weightKg <= 3) return 5; // flat, included in $65
  if (weightKg <= 22.5) return 2 * weightKg;
  if (weightKg <= 69.5) return 1.5 * weightKg;
  return 1 * weightKg;
}

function calcConditionnement(nbPlastiques: number, nbPlastiquesBiere: number): number {
  return 0.6 * nbPlastiques + 1.5 * nbPlastiquesBiere;
}

function calcFraisSAQ(
  nbCasiers24x65: number,
  nbCasiers24x33: number,
  nbCasiers12x50: number
): number {
  return 24.5 * nbCasiers24x65 + 35.83 * nbCasiers24x33 + 21.34 * nbCasiers12x50;
}

export function calculatePrice(input: PricingInput): PricingBreakdown {
  const {
    weightKg,
    productType,
    nbCartons,
    nbPetitsSacs,
    nbSacsMoyens,
    nbGrandsSacs,
    nbPlastiques,
    nbPlastiquesBiere,
    nbCasiers24x65,
    nbCasiers24x33,
    nbCasiers12x50,
    marginPct,
  } = input;

  const isFlat65 = weightKg <= 3 && productType === 'standard';
  const isManiocHuileFlat = productType === 'manioc_huile' && weightKg <= 3;

  let transport: number;
  let cartons: number;
  let manutention: number;
  let douane: number;
  let formalites: number;

  if (isFlat65 || isManiocHuileFlat) {
    // $65 flat breakdown: transport=50, cartons=1, manutention=4, douane=5, formalites=5
    transport = 50;
    cartons = 1;
    manutention = 4;
    douane = 5;
    formalites = 5;
  } else {
    transport = r2(calcTransport(weightKg, productType));
    cartons = r2(calcCartons(weightKg, nbCartons));
    manutention = r2(
      calcManutention(weightKg, productType, nbCartons, nbPetitsSacs, nbSacsMoyens, nbGrandsSacs)
    );
    douane = r2(calcDouane(weightKg, productType));
    formalites = r2(calcFormalites(weightKg, productType));
  }

  const sacs = r2(calcSacs(nbPetitsSacs, nbSacsMoyens, nbGrandsSacs));
  const conditionnement = r2(calcConditionnement(nbPlastiques, nbPlastiquesBiere));
  const fraisSAQ = r2(calcFraisSAQ(nbCasiers24x65, nbCasiers24x33, nbCasiers12x50));

  const sousTotal = r2(
    transport + cartons + sacs + manutention + douane + formalites + conditionnement + fraisSAQ
  );

  const marge = r2(sousTotal * (marginPct / 100));
  const prixClient = r2(sousTotal * (1 + marginPct / 100));

  return {
    transport,
    cartons,
    sacs,
    manutention,
    douane,
    formalites,
    conditionnement,
    fraisSAQ,
    sousTotal,
    marge,
    prixClient,
  };
}
