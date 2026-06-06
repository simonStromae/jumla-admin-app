import { NextRequest, NextResponse } from 'next/server';
import { calculatePrice, PricingInput, ProductType } from '@/src/lib/pricing';

export const dynamic = 'force-dynamic';

const VALID_PRODUCT_TYPES: ProductType[] = [
  'standard',
  'biere',
  'manioc_huile',
  'cosmetique',
  'vetements',
];

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

  if (!VALID_PRODUCT_TYPES.includes(data.productType as ProductType)) {
    return NextResponse.json(
      { error: `productType must be one of: ${VALID_PRODUCT_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  const input: PricingInput = {
    weightKg,
    productType: data.productType as ProductType,
    nbCartons: Number(data.nbCartons ?? 0),
    nbPetitsSacs: Number(data.nbPetitsSacs ?? 0),
    nbSacsMoyens: Number(data.nbSacsMoyens ?? 0),
    nbGrandsSacs: Number(data.nbGrandsSacs ?? 0),
    nbPlastiques: Number(data.nbPlastiques ?? 0),
    nbPlastiquesBiere: Number(data.nbPlastiquesBiere ?? 0),
    nbCasiers24x65: Number(data.nbCasiers24x65 ?? 0),
    nbCasiers24x33: Number(data.nbCasiers24x33 ?? 0),
    nbCasiers12x50: Number(data.nbCasiers12x50 ?? 0),
    marginPct: Number(data.marginPct ?? 0),
  };

  const breakdown = calculatePrice(input);

  return NextResponse.json(breakdown);
}
