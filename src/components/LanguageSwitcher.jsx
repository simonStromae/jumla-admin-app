'use client';
import { useLocale } from '@/src/lib/i18n';

export default function LanguageSwitcher({ style = {} }) {
  const { locale, setLocale } = useLocale();
  return (
    <button
      onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
      title={locale === 'fr' ? 'Switch to English' : 'Passer en français'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '5px 10px',
        border: '1px solid var(--border)',
        borderRadius: 6,
        background: 'transparent',
        fontSize: 12.5, fontWeight: 600,
        cursor: 'pointer',
        color: 'var(--ink-600)',
        letterSpacing: '.02em',
        transition: 'background .15s, color .15s',
        ...style,
      }}
    >
      {locale === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR'}
    </button>
  );
}
