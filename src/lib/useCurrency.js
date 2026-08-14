'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CURRENCY_LABELS = {
  CAD: 'CAD', USD: 'USD', EUR: 'EUR', XAF: 'XAF', CNY: 'CNY',
};

const DEFAULT_CTX = {
  currency: 'CAD',
  rates: {},
  convert: (amount) => amount,
  fmt: (amount) => `${Math.round(amount).toLocaleString('fr')} CAD`,
  fmtFull: (amount) => `${Math.round(amount).toLocaleString('fr')} CAD`,
  setCurrency: () => {},
};

const CurrencyCtx = createContext(DEFAULT_CTX);

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState('CAD');
  const [rates, setRates]           = useState({}); // { USD: 0.73, ... } = 1 foreign → X CAD

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        const cur = d.default_currency ?? 'CAD';
        setCurrencyState(cur);
        const loaded = {};
        for (const [k, v] of Object.entries(d)) {
          if (k.startsWith('exchange_rate_') && k.endsWith('_CAD') && v) {
            const foreign = k.replace('exchange_rate_', '').replace('_CAD', '');
            loaded[foreign] = parseFloat(v);
          }
        }
        setRates(loaded);
      })
      .catch(() => {});
  }, []);

  // Convert `amount` (in `fromCurrency`) to the display currency
  const convert = useCallback((amount, fromCurrency = 'CAD') => {
    if (!amount && amount !== 0) return 0;
    const n = Number(amount);
    if (fromCurrency === currency) return n;

    // Convert fromCurrency → CAD first
    const toCad = fromCurrency === 'CAD' ? n
      : (rates[fromCurrency] ? n * rates[fromCurrency] : n);

    // Then CAD → display currency
    if (currency === 'CAD') return toCad;
    const cadToDisplay = rates[currency] ? 1 / rates[currency] : 1;
    return toCad * cadToDisplay;
  }, [currency, rates]);

  // Format with label, converting from fromCurrency to display currency
  const fmt = useCallback((amount, fromCurrency = 'CAD', decimals = 0) => {
    const val = convert(amount, fromCurrency);
    const label = CURRENCY_LABELS[currency] ?? currency;
    return `${Math.round(val).toLocaleString('fr')} ${label}`;
  }, [convert, currency]);

  // Same but shows decimals for small amounts
  const fmtFull = useCallback((amount, fromCurrency = 'CAD') => {
    const val = convert(amount, fromCurrency);
    const label = CURRENCY_LABELS[currency] ?? currency;
    if (Math.abs(val) < 100) {
      return `${val.toFixed(2)} ${label}`;
    }
    return `${Math.round(val).toLocaleString('fr')} ${label}`;
  }, [convert, currency]);

  const setCurrency = useCallback((cur) => {
    setCurrencyState(cur);
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ default_currency: cur }),
    }).catch(() => {});
  }, []);

  return (
    <CurrencyCtx.Provider value={{ currency, rates, convert, fmt, fmtFull, setCurrency }}>
      {children}
    </CurrencyCtx.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyCtx);
