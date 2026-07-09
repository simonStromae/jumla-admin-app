'use client';
import { useState, useEffect, useRef } from 'react';
import { useLocale } from '@/src/lib/i18n';

const LANGS = [
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
];

export default function LanguageSwitcher({ dark = false }) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const active = LANGS.find(l => l.code === locale) ?? LANGS[0];

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const triggerStyle = dark ? {
    background: 'rgba(255,255,255,.12)',
    border: '1px solid rgba(255,255,255,.22)',
  } : {
    background: 'rgba(0,0,0,.05)',
    border: '1px solid var(--border, #E5E7EB)',
  };

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      {/* Trigger — circle flag + chevron */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Changer de langue"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          height: 36, padding: '0 10px 0 6px',
          borderRadius: 99,
          cursor: 'pointer',
          transition: 'background .15s',
          fontFamily: 'inherit',
          ...triggerStyle,
        }}
      >
        <span style={{ fontSize: 20, lineHeight: 1, display: 'flex', alignItems: 'center' }}>{active.flag}</span>
        <svg
          width="12" height="12" fill="none" viewBox="0 0 24 24"
          stroke={dark ? 'rgba(255,255,255,.7)' : 'var(--ink-500, #6B7280)'}
          strokeWidth="2.5"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: 'white', borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,.16)',
          border: '1px solid rgba(0,0,0,.07)',
          overflow: 'hidden', minWidth: 160, zIndex: 1000,
          fontFamily: "'Inter', system-ui, sans-serif",
        }}>
          {LANGS.map(l => {
            const isActive = l.code === locale;
            return (
              <button
                key={l.code}
                onClick={() => { setLocale(l.code); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '11px 16px',
                  background: isActive ? '#EFF6FF' : 'transparent',
                  border: 0, cursor: 'pointer', textAlign: 'left',
                  fontSize: 14, fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#1B4FD8' : '#374151',
                  fontFamily: 'inherit',
                  transition: 'background .12s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#F9FAFB'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 20, lineHeight: 1 }}>{l.flag}</span>
                {l.label}
                {isActive && (
                  <svg style={{ marginLeft: 'auto', flexShrink: 0 }} width="14" height="14" fill="none" stroke="#1B4FD8" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
