// Shared exchange-rate fetcher (no auth required).
// Returns { [foreignCurrency]: rateToCAD } — e.g. { USD: 1.38, EUR: 1.48 }
// Cached 1 hour in-process to avoid hammering the free API.

let cache: { rates: Record<string, number>; ts: number } | null = null;
const TTL = 60 * 60 * 1000;

export async function getExchangeRatesToCAD(): Promise<Record<string, number>> {
  if (cache && Date.now() - cache.ts < TTL) return cache.rates;
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/CAD', {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.result !== 'success') throw new Error(data['error-type'] ?? 'API error');
    const rates: Record<string, number> = {};
    for (const [cur, raw] of Object.entries(data.rates as Record<string, number>)) {
      if (raw > 0) rates[cur] = Math.round((1 / raw) * 100000) / 100000;
    }
    rates['CAD'] = 1;
    cache = { rates, ts: Date.now() };
    return rates;
  } catch {
    return { ...(cache?.rates ?? {}), CAD: 1 };
  }
}

export function rateForCurrency(rates: Record<string, number>, currency: string): number {
  if (currency === 'CAD') return 1;
  return rates[currency] ?? 1;
}
