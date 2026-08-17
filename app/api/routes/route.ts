export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api-auth';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  let routes: any[];
  try {
    routes = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, origin, destination, label, active, "transitDays", currency, fees FROM routes ORDER BY origin`
    );
  } catch (e: any) {
    // Only fall back for missing-column errors (pre-migration environments)
    if (e?.code !== '42703' && !e?.message?.includes('does not exist') && !e?.message?.includes('column')) {
      return NextResponse.json({ error: e?.message ?? 'Erreur serveur' }, { status: 500 });
    }
    routes = await prisma.route.findMany({ orderBy: { origin: 'asc' } });
  }

  const parseFees = (raw: any) => {
    if (!raw) return null;
    if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return null; } }
    return raw;
  };

  return NextResponse.json(routes.map(r => ({
    id:          r.id,
    code:        `${r.origin} → ${r.destination}`,
    fromIATA:    r.origin,
    toIATA:      r.destination,
    label:       r.label ?? `${r.origin} → ${r.destination}`,
    active:      r.active,
    transitDays: r.transitDays ?? 14,
    currency:    r.currency ?? 'CAD',
    fees:        parseFees(r.fees),
  })));
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { origin, destination, label, transitDays, currency, fees } = await req.json();
  if (!origin || !destination) {
    return NextResponse.json({ error: 'Origine et destination obligatoires' }, { status: 400 });
  }

  const org  = origin.toUpperCase().trim();
  const dest = destination.toUpperCase().trim();
  const lbl  = label?.trim() || `${org} → ${dest}`;

  let r: any;
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO routes (id, origin, destination, label, active, "transitDays", currency, fees)
       VALUES (gen_random_uuid()::text, $1, $2, $3, true, $4, $5, $6::jsonb)
       RETURNING id, origin, destination, label, active, "transitDays", currency, fees`,
      org, dest, lbl,
      transitDays ?? 14,
      currency    ?? 'CAD',
      fees        ? JSON.stringify(fees) : null,
    );
    r = rows[0];
  } catch (e: any) {
    if (e?.message?.includes('column') || e?.message?.includes('does not exist') || e?.code === '42703') {
      return NextResponse.json(
        { error: 'Migration requise — visitez /api/db-migrate puis réessayez.' },
        { status: 500 }
      );
    }
    // Unique constraint on (origin, destination) — two routes with same IATA pair
    if (e?.code === '23505' || e?.message?.toLowerCase().includes('unique') || e?.message?.toLowerCase().includes('duplicate')) {
      return NextResponse.json(
        { error: `Une route ${org} → ${dest} existe déjà. Pour créer une route maritime avec le même trajet, ajoutez un suffixe au code d'origine (ex: ${org}M pour maritime) et précisez le mode dans le libellé.` },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: e?.message ?? 'Erreur serveur' }, { status: 500 });
  }

  return NextResponse.json({
    id:          r.id,
    code:        `${r.origin} → ${r.destination}`,
    fromIATA:    r.origin,
    toIATA:      r.destination,
    label:       r.label ?? `${r.origin} → ${r.destination}`,
    active:      r.active,
    transitDays: r.transitDays ?? 14,
    currency:    r.currency ?? 'CAD',
    fees:        r.fees ?? null,
  });
}
