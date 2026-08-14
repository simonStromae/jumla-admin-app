export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/src/lib/api-auth';

const CURRENCIES = ['USD', 'EUR', 'XAF', 'CNY'];

// Cache in-memory for 1 hour to avoid hammering the free API
let cache: { rates: Record<string, number>; updatedAt: string; ts: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  // Serve from cache if fresh
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json({ ...cache, cached: true });
  }

  try {
    // Base = CAD → rates give "1 CAD = X foreign"
    // We invert to get "1 foreign = X CAD"
    const res = await fetch('https://open.er-api.com/v6/latest/CAD', {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`Exchange rate API returned ${res.status}`);
    }

    const data = await res.json();

    if (data.result !== 'success') {
      throw new Error(data['error-type'] || 'Unknown error from exchange rate API');
    }

    const rawRates: Record<string, number> = data.rates ?? {};
    // Convert: 1 foreign → CAD = 1 / (1 CAD → foreign)
    const rates: Record<string, number> = {};
    for (const cur of CURRENCIES) {
      if (rawRates[cur] && rawRates[cur] > 0) {
        rates[cur] = Math.round((1 / rawRates[cur]) * 100000) / 100000;
      }
    }

    const updatedAt = data.time_last_update_utc ?? new Date().toUTCString();
    cache = { rates, updatedAt, ts: Date.now() };

    return NextResponse.json({ rates, updatedAt, cached: false });
  } catch (e: any) {
    // If we have a stale cache, return it with a warning rather than failing
    if (cache) {
      return NextResponse.json({ ...cache, cached: true, stale: true });
    }
    return NextResponse.json(
      { error: e?.message ?? 'Impossible de récupérer les taux de change' },
      { status: 502 }
    );
  }
}
