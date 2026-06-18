import { NextRequest, NextResponse } from 'next/server';
import {
  calculatePrice, calculateFromFees,
  DEFAULT_ROUTE_FEES,
  PricingInput, ProductType,
  LineItem, Addons, RouteFees, RouteTier,
} from '@/src/lib/pricing';
import { prisma } from '@/src/lib/prisma';

export const dynamic = 'force-dynamic';

const VALID_LEGACY_TYPES: ProductType[] = ['standard', 'biere', 'manioc_huile', 'cosmetique', 'vetements'];

function mergeRouteFees(base: RouteFees, override: Partial<RouteFees>): RouteFees {
  return {
    tiers:       override.tiers?.length        ? override.tiers       : base.tiers,
    bags:        override.bags                  ? { ...base.bags,        ...override.bags }        : base.bags,
    plastic:     override.plastic    !== undefined ? override.plastic    : base.plastic,
    saq:         override.saq                   ? { ...base.saq,         ...override.saq }         : base.saq,
    supplements: override.supplements           ? { ...base.supplements, ...override.supplements } : base.supplements,
    marginPct:   override.marginPct  !== undefined ? override.marginPct  : base.marginPct,
    deliveryFee: override.deliveryFee !== undefined ? override.deliveryFee : base.deliveryFee,
  };
}

function normalizeTier(raw: Record<string, unknown>): RouteTier {
  const from = parseFloat(raw.from as string) || 0;
  // null/undefined/empty = open-ended tier → 99999
  const to   = raw.to == null || raw.to === '' ? 99999 : (parseFloat(raw.to as string) || 99999);
  // Old format used { flat } — treat as transportFlat only
  if (raw.flat !== undefined && raw.transportFlat === undefined && raw.transportPerKg === undefined) {
    return { from, to, transportFlat: parseFloat(raw.flat as string) || 0 };
  }
  return {
    from, to,
    ...(raw.transportFlat      !== undefined ? { transportFlat:      Number(raw.transportFlat)      } : {}),
    ...(raw.transportPerKg     !== undefined ? { transportPerKg:     Number(raw.transportPerKg)     } : {}),
    ...(raw.cartonFlat         !== undefined ? { cartonFlat:         Number(raw.cartonFlat)         } : {}),
    ...(raw.cartonPerUnit      !== undefined ? { cartonPerUnit:      Number(raw.cartonPerUnit)      } : {}),
    ...(raw.manutentionFlat    !== undefined ? { manutentionFlat:    Number(raw.manutentionFlat)    } : {}),
    ...(raw.manutentionPerUnit !== undefined ? { manutentionPerUnit: Number(raw.manutentionPerUnit) } : {}),
    ...(raw.manutentionMin     !== undefined ? { manutentionMin:     Number(raw.manutentionMin)     } : {}),
    ...(raw.douaneFlat         !== undefined ? { douaneFlat:         Number(raw.douaneFlat)         } : {}),
    ...(raw.douanePerKg        !== undefined ? { douanePerKg:        Number(raw.douanePerKg)        } : {}),
    ...(raw.formalitesFlat     !== undefined ? { formalitesFlat:     Number(raw.formalitesFlat)     } : {}),
    ...(raw.formalitesPerKg    !== undefined ? { formalitesPerKg:    Number(raw.formalitesPerKg)    } : {}),
  };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const data = body as Record<string, unknown>;

  const routeId         = data.routeId    as string | undefined;
  const campaignId      = data.campaignId as string | undefined;
  const marginPctInput  = data.marginPct !== undefined ? Number(data.marginPct) : undefined;

  // ── Fetch route fees ─────────────────────────────────────────────────────
  let rawRouteFees: Record<string, unknown> | null = null;
  if (routeId || campaignId) {
    try {
      let rows: { fees: unknown }[] = [];
      if (routeId) {
        rows = await prisma.$queryRawUnsafe<{ fees: unknown }[]>(
          `SELECT fees FROM routes WHERE id = $1`, routeId,
        );
      } else if (campaignId) {
        rows = await prisma.$queryRawUnsafe<{ fees: unknown }[]>(
          `SELECT r.fees FROM campaigns c JOIN routes r ON r.id = c."routeId" WHERE c.id = $1`, campaignId,
        );
      }
      if (rows[0]?.fees) {
        rawRouteFees = typeof rows[0].fees === 'string'
          ? JSON.parse(rows[0].fees)
          : rows[0].fees as Record<string, unknown>;
      }
    } catch {
      // Column not yet migrated — fall back to defaults
    }
  }

  // ── Merge route fees over defaults ───────────────────────────────────────
  let effectiveFees: RouteFees = DEFAULT_ROUTE_FEES;
  if (rawRouteFees) {
    const partial: Partial<RouteFees> = {};
    if (Array.isArray(rawRouteFees.tiers) && rawRouteFees.tiers.length > 0) {
      partial.tiers = (rawRouteFees.tiers as Record<string, unknown>[])
        .map(normalizeTier)
        .filter(t => t.to >= t.from)
        .sort((a, b) => a.from - b.from);
    }
    if (rawRouteFees.bags)         partial.bags         = rawRouteFees.bags as RouteFees['bags'];
    if (rawRouteFees.supplements)  partial.supplements  = rawRouteFees.supplements as RouteFees['supplements'];
    if (rawRouteFees.saq)          partial.saq          = rawRouteFees.saq as RouteFees['saq'];
    if (rawRouteFees.plastic    !== undefined) partial.plastic    = Number(rawRouteFees.plastic);
    if (rawRouteFees.marginPct  !== undefined) partial.marginPct  = Number(rawRouteFees.marginPct);
    if (rawRouteFees.deliveryFee !== undefined) partial.deliveryFee = Number(rawRouteFees.deliveryFee);
    effectiveFees = mergeRouteFees(DEFAULT_ROUTE_FEES, partial);
  }

  // ── New API: items[] ─────────────────────────────────────────────────────
  if (Array.isArray(data.items) && data.items.length > 0) {
    const items = data.items as LineItem[];
    const addonsRaw = (data.addons as Record<string, unknown>) ?? {};
    const addons: Addons = {
      nbCartons:    Number(addonsRaw.nbCartons    ?? data.nbCartons    ?? 0),
      nbPetitsSacs: Number(addonsRaw.nbPetitsSacs ?? data.nbPetitsSacs ?? 0),
      nbSacsMoyens: Number(addonsRaw.nbSacsMoyens ?? data.nbSacsMoyens ?? 0),
      nbGrandsSacs: Number(addonsRaw.nbGrandsSacs ?? data.nbGrandsSacs ?? 0),
      nbPlastiques: Number(addonsRaw.nbPlastiques ?? data.nbPlastiques ?? 0),
    };
    const breakdown = calculateFromFees(items, effectiveFees, addons, marginPctInput);
    return NextResponse.json(breakdown);
  }

  // ── Legacy API: weightKg + productType ───────────────────────────────────
  if (data.weightKg === undefined || data.weightKg === null) {
    return NextResponse.json({ error: 'items[] or weightKg is required' }, { status: 400 });
  }

  const weightKg = Number(data.weightKg);
  if (isNaN(weightKg) || weightKg <= 0) {
    return NextResponse.json({ error: 'weightKg must be a positive number' }, { status: 400 });
  }

  const productType = (data.productType as string) || 'standard';

  // Convert legacy type to new category
  const legacyCatMap: Record<string, LineItem['category']> = {
    standard: 'standard', biere: 'biere', manioc_huile: 'manioc_huile',
    cosmetique: 'cosmetique', vetements: 'vetements',
    alimentaire: 'standard', electronique: 'electronique', documents: 'documents',
  };
  const mappedCat = legacyCatMap[productType] ?? 'standard';

  const legacyItem: LineItem = {
    category:   mappedCat,
    weightKg,
    beerFormat: data.beerFormat as LineItem['beerFormat'] | undefined,
    nbCasiers:  data.nbCasiers ? Number(data.nbCasiers) : undefined,
  };

  const addons: Addons = {
    nbCartons:    Number(data.nbCartons    ?? 0),
    nbPetitsSacs: Number(data.nbPetitsSacs ?? 0),
    nbSacsMoyens: Number(data.nbSacsMoyens ?? 0),
    nbGrandsSacs: Number(data.nbGrandsSacs ?? 0),
    nbPlastiques: Number(data.nbPlastiques ?? 0),
  };

  // If route fees were found, always use new engine
  if (rawRouteFees) {
    const breakdown = calculateFromFees([legacyItem], effectiveFees, addons, marginPctInput);
    return NextResponse.json(breakdown);
  }

  // Pure legacy fallback
  if (!VALID_LEGACY_TYPES.includes(productType as ProductType)) {
    return NextResponse.json(
      { error: `productType must be one of: ${VALID_LEGACY_TYPES.join(', ')}` },
      { status: 400 },
    );
  }

  const input: PricingInput = {
    weightKg,
    productType: productType as ProductType,
    nbCartons:         Number(data.nbCartons         ?? 0),
    nbPetitsSacs:      Number(data.nbPetitsSacs      ?? 0),
    nbSacsMoyens:      Number(data.nbSacsMoyens      ?? 0),
    nbGrandsSacs:      Number(data.nbGrandsSacs      ?? 0),
    nbPlastiques:      Number(data.nbPlastiques      ?? 0),
    nbPlastiquesBiere: Number(data.nbPlastiquesBiere ?? 0),
    nbCasiers24x65:    Number(data.nbCasiers24x65    ?? 0),
    nbCasiers24x33:    Number(data.nbCasiers24x33    ?? 0),
    nbCasiers12x50:    Number(data.nbCasiers12x50    ?? 0),
    marginPct:         marginPctInput ?? 30,
  };

  return NextResponse.json(calculatePrice(input));
}
