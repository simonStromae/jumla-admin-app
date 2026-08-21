'use client';
import { useState, useEffect } from 'react';

const COUNTRIES = [
  { dial: '+1',   label: '🇨🇦 Canada / USA' },
  { dial: '+33',  label: '🇫🇷 France' },
  { dial: '+32',  label: '🇧🇪 Belgique' },
  { dial: '+41',  label: '🇨🇭 Suisse' },
  { dial: '+44',  label: '🇬🇧 Royaume-Uni' },
  { dial: '+237', label: '🇨🇲 Cameroun' },
  { dial: '+225', label: '🇨🇮 Côte d\'Ivoire' },
  { dial: '+221', label: '🇸🇳 Sénégal' },
  { dial: '+243', label: '🇨🇩 RD Congo' },
  { dial: '+241', label: '🇬🇦 Gabon' },
  { dial: '+261', label: '🇲🇬 Madagascar' },
  { dial: '+234', label: '🇳🇬 Nigeria' },
  { dial: '+86',  label: '🇨🇳 Chine' },
];

// Sort by length desc so +237 matches before +23
const SORTED = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);

function parsePhone(v) {
  if (!v) return { dial: '+1', local: '' };
  const str = String(v).trim();
  for (const c of SORTED) {
    if (str.startsWith(c.dial)) {
      return { dial: c.dial, local: str.slice(c.dial.length).replace(/\D/g, '') };
    }
  }
  return { dial: '+1', local: str.replace(/\D/g, '') };
}

// value: full E.164 string ("+15141234567") or empty
// onChange: called with full E.164 string or empty string
export default function PhoneInput({ value, onChange, placeholder, disabled = false, inputStyle = {} }) {
  const parsed = parsePhone(value);
  const [dial,  setDial]  = useState(parsed.dial);
  const [local, setLocal] = useState(parsed.local);

  useEffect(() => {
    const p = parsePhone(value);
    setDial(p.dial);
    setLocal(p.local);
  }, [value]);

  const emit = (d, localStr) => {
    const digits = localStr.replace(/\D/g, '');
    onChange(digits ? d + digits : '');
  };

  const handleDialChange = (e) => {
    setDial(e.target.value);
    emit(e.target.value, local);
  };

  const handleLocalChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    setLocal(digits);
    emit(dial, digits);
  };

  const selectStyle = {
    height: 36, padding: '0 8px', borderRadius: 7,
    border: '1px solid var(--border, #E5E7EB)',
    background: 'white', fontSize: 13, fontFamily: 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer',
    flexShrink: 0, color: 'var(--ink-800, #1F2937)',
    transition: 'border-color .15s',
  };
  const numStyle = {
    flex: 1, height: 36, padding: '0 11px',
    border: '1px solid var(--border, #E5E7EB)',
    borderRadius: 7, fontSize: 13, fontFamily: 'monospace',
    background: 'white', color: 'var(--ink-800, #1F2937)',
    outline: 'none', transition: 'border-color .15s',
    ...inputStyle,
  };

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <select value={dial} onChange={handleDialChange} disabled={disabled} style={selectStyle}>
        {COUNTRIES.map(c => (
          <option key={c.dial} value={c.dial}>{c.label} ({c.dial})</option>
        ))}
      </select>
      <input
        type="tel"
        value={local}
        onChange={handleLocalChange}
        disabled={disabled}
        placeholder={placeholder ?? (dial === '+1' ? '514 123 4567' : '6 12 34 56 78')}
        style={numStyle}
        onFocus={e => { e.target.style.borderColor = 'var(--brand-400, #60A5FA)'; e.target.style.boxShadow = '0 0 0 3px var(--brand-50, #EFF6FF)'; }}
        onBlur={e  => { e.target.style.borderColor = 'var(--border, #E5E7EB)';   e.target.style.boxShadow = 'none'; }}
      />
    </div>
  );
}
