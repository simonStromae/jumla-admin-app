import { NextRequest, NextResponse } from 'next/server';
import { calculatePrice, PricingInput, ProductType } from '@/src/lib/pricing';
import { prisma } from '@/src/lib/prisma';

export const dynamic = 'force-dynamic';

const VALID_PRODUCT_TYPES: ProductType[] = [
  'standard',
  'biere',
  'manioc_huile',
  'cosmetique',
  'vetements',
];

// Extra per kg by product type (matches Booking.jsx ITEM_CATEGORIES)
const EXTRA_PER_KG: Record<string, number> = {
  standard:    0,
  vetements:   2,
  cosmetique:  3,
  alimentaire: 0,
  biere:       6,
  manioc_huile: 0,
  electronique: 5,
  documents:   -2,
};

function roundUpToHalfKg(kg: number): number {
  return Math.ceil(kg * 2) / 2;
}

function calcBaseShipping(tiers: { from: number; to: number; flat: number }[], billedKg: number): number {
  const tier = tiers.find(t => billedKg >= t.from && billedKg <= t.to);
  if (tier) return tier.flat;
  // Weight exceeds all defined tiers — extrapolate from marginal rate of last two tiers
  const last = tiers[tiers.length - 1];
  const prev = tiers[tiers.length - 2];
  const ratePerHalfKg = prev && (last.to - last.from) > 0
    ? Math.max(1, (last.flat - prev.flat) / ((last.to - last.from) / 0.5))
    : 9;
  const extraIncrements = Math.ceil((billedKg - last.to) / 0.5);
  return last.flat + extraIncrements * ratePerHalfKg;
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const data = body as Record<string, unknown>;

  if (data.weightKg === undefined || data.weightKg === null) {
    return NextResponse.json({ error: 'weightKg is required' }, { status: 400 });
  }

  const weightKg = Number(data.weightKg);
  if (isNaN(weightKg) || weightKg <= 0) {
    return NextResponse.json({ error: 'weightKg must be a positive number' }, { status: 400 });
  }

  if (!data.productType) {
    return NextResponse.json({ error: 'productType is required' }, { status: 400 });
  }

  const productType = data.productType as string;
  const marginPct   = Number(data.marginPct ?? 0);

  // Try to fetch route fees if routeId or campaignId provided
  let routeFees: any = null;
  const routeId    = data.routeId    as string | undefined;
  const campaignId = data.campaignId as string | undefined;

  if (routeId || campaignId) {
    try {
      let rows: any[] = [];
      if (routeId) {
        rows = await prisma.$queryRawUnsafe<any[]>(
          `SELECT fees FROM routes WHERE id = $1`,
          routeId,
        );
      } else if (campaignId) {
        rows = await prisma.$queryRawUnsafe<any[]>(
          `SELECT r.fees FROM campaigns c JOIN routes r ON r.id = c."routeId" WHERE c.id = $1`,
          campaignId,
        );
      }
      if (rows[0]?.fees) {
        routeFees = typeof rows[0].fees === 'string' ? JSON.parse(rows[0].fees) : rows[0].fees;
      }
    } catch {
      // Column not yet migrated — fall back to hardcoded pricing
    }
  }

  // ── Route-fee-based calculation ──
  if (routeFees?.tiers?.length) {
    const tiers = [...routeFees.tiers]
      .map((t: any) => ({ from: parseFloat(t.from) || 0, to: parseFloat(t.to) || 0, flat: parseFloat(t.flat) || 0 }))
      .filter((t: any) => t.to >= t.from)
      .sort((a: any, b: any) => a.from - b.from);

    const bags        = routeFees.bags ?? {};
    const billedKg    = weightKg <= 3 ? weightKg : roundUpToHalfKg(weightKg);
    const baseShip    = r2(calcBaseShipping(tiers, billedKg));
    const catExtra    = r2((EXTRA_PER_KG[productType] ?? 0) * weightKg);
    const transport   = r2(baseShip + catExtra);

    const nbPetitsSacs  = Number(data.nbPetitsSacs  ?? 0);
    const nbSacsMoyens  = Number(data.nbSacsMoyens  ?? 0);
    const nbGrandsSacs  = Number(data.nbGrandsSacs  ?? 0);
    const nbCartons     = Number(data.nbCartons     ?? 0);

    const smallRate  = bags.small  ?? 5;
    const mediumRate = bags.medium ?? 7.5;
    const largeRate  = bags.large  ?? 10;
    const cartonRate = weightKg <= 3 ? 1 : 1.5;

    const sacs    = r2(nbPetitsSacs * smallRate + nbSacsMoyens * mediumRate + nbGrandsSacs * largeRate);
    const cartons = r2(nbCartons * cartonRate);

    // Keep beer/plastic fees from hardcoded system (not in route fees grid)
    const nbPlastiques      = Number(data.nbPlastiques      ?? 0);
    const nbPlastiquesBiere = Number(data.nbPlastiquesBiere ?? 0);
    const nbCasiers24x65    = Number(data.nbCasiers24x65    ?? 0);
    const nbCasiers24x33    = Number(data.nbCasiers24x33    ?? 0);
    const nbCasiers12x50    = Number(data.nbCasiers12x50    ?? 0);
    const conditionnement   = r2(0.6 * nbPlastiques + 1.5 * nbPlastiquesBiere);
    const fraisSAQ          = r2(24.5 * nbCasiers24x65 + 35.83 * nbCasiers24x33 + 21.34 * nbCasiers12x50);

    const sousTotal  = r2(transport + cartons + sacs + conditionnement + fraisSAQ);
    const marge      = r2(sousTotal * (marginPct / 100));
    const prixClient = r2(sousTotal + marge);

    return NextResponse.json({
      transport,
      cartons,
      sacs,
      manutention:    0,
      douane:         0,
      formalites:     0,
      conditionnement,
      fraisSAQ,
      sousTotal,
      marge,
      prixClient,
    });
  }

  // ── Fallback: hardcoded pricing system ──
  if (!VALID_PRODUCT_TYPES.includes(productType as ProductType)) {
    return NextResponse.json(
      { error: `productType must be one of: ${VALID_PRODUCT_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  const input: PricingInput = {
    weightKg,
    productType: productType as ProductType,
    nbCartons:          Number(data.nbCartons         ?? 0),
    nbPetitsSacs:       Number(data.nbPetitsSacs      ?? 0),
    nbSacsMoyens:       Number(data.nbSacsMoyens      ?? 0),
    nbGrandsSacs:       Number(data.nbGrandsSacs      ?? 0),
    nbPlastiques:       Number(data.nbPlastiques      ?? 0),
    nbPlastiquesBiere:  Number(data.nbPlastiquesBiere ?? 0),
    nbCasiers24x65:     Number(data.nbCasiers24x65    ?? 0),
    nbCasiers24x33:     Number(data.nbCasiers24x33    ?? 0),
    nbCasiers12x50:     Number(data.nbCasiers12x50    ?? 0),
    marginPct,
  };

  return NextResponse.json(calculatePrice(input));
}
