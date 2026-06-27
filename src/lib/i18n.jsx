'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import fr from './locales/fr.json';
import en from './locales/en.json';

const MESSAGES = { fr, en };

function get(obj, path) {
  const val = path.split('.').reduce((o, k) => o?.[k], obj);
  return val !== undefined ? val : path;
}

function detectLocale() {
  try {
    const m = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
    const saved = m?.[1];
    if (saved === 'fr' || saved === 'en') return saved;
  } catch {}
  try {
    return (navigator.language || 'fr').startsWith('fr') ? 'fr' : 'en';
  } catch {}
  return 'fr';
}

const Ctx = createContext({
  locale: 'fr',
  t: (k) => get(fr, k),
  setLocale: () => {},
});

export function LocaleProvider({ children }) {
  const [locale, setLocale_] = useState('fr');

  useEffect(() => {
    const detected = detectLocale();
    setLocale_(detected);
  }, []);

  const setLocale = useCallback((loc) => {
    setLocale_(loc);
    document.cookie = `locale=${loc}; max-age=${365 * 24 * 3600}; path=/; samesite=lax`;
  }, []);

  const t = useCallback((key) => get(MESSAGES[locale] ?? fr, key), [locale]);

  return <Ctx.Provider value={{ locale, t, setLocale }}>{children}</Ctx.Provider>;
}

export const useLocale = () => useContext(Ctx);
export const useT = () => useContext(Ctx).t;
