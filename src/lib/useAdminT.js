'use client';
import { useLocale } from './i18n';
import { adminTranslations } from './admin-i18n';

export function useAdminT() {
  const { locale } = useLocale();
  return adminTranslations[locale === 'en' ? 'en' : 'fr'];
}
