'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useT, useLocale } from '@/src/lib/i18n';

const STATUS_META = {
  enr: { color: 'var(--ink-500)',   bg: 'var(--bg-soft)',   icon: '📝' },
  rec: { color: 'var(--brand-700)', bg: 'var(--brand-50)', icon: '📥' },
  pre: { color: '#7c3aed',          bg: '#f5f3ff',          icon: '🔍' },
  exp: { color: 'var(--info-700)',  bg: 'var(--info-50)',   icon: '🚀' },
  tra: { color: 'var(--info-700)',  bg: 'var(--info-50)',   icon: '✈️' },
  apd: { color: 'var(--ok-700)',    bg: 'var(--ok-50)',     icon: '🛬' },
  dou: { color: 'var(--warn-700)', bg: 'var(--warn-50)',   icon: '🛃' },
  ins: { color: 'var(--warn-700)', bg: 'var(--warn-50)',   icon: '🔎' },
  ret: { color: 'var(--bad-700)',   bg: 'var(--bad-50)',    icon: '⚠️' },
  lib: { color: 'var(--ok-700)',    bg: 'var(--ok-50)',     icon: '✅' },
  ard: { color: 'var(--ok-700)',    bg: 'var(--ok-50)',     icon: '🏭' },
  ver: { color: '#7c3aed',          bg: '#f5f3ff',          icon: '🔬' },
  pdl: { color: 'var(--info-700)',  bg: 'var(--info-50)',   icon: '📦' },
  liv: { color: 'var(--info-700)',  bg: 'var(--info-50)',   icon: '🚚' },
  ok:  { color: 'var(--ok-700)',    bg: 'var(--ok-50)',     icon: '🎉' },
  adr: { color: 'var(--bad-700)',   bg: 'var(--bad-50)',    icon: '📍' },
  tdl: { color: 'var(--warn-700)', bg: 'var(--warn-50)',   icon: '🔔' },
  rte: { color: 'var(--bad-700)',   bg: 'var(--bad-50)',    icon: '↩️' },
  dom: { color: 'var(--bad-700)',   bg: 'var(--bad-50)',    icon: '💥' },
  cla: { color: 'var(--bad-700)',   bg: 'var(--bad-50)',    icon: '📋' },
};

function SuiviContent() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [input, setInput]   = useState(searchParams.get('code') ?? '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const fmt = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-CA', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  const fmtFull = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-CA', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const search = async (code) => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/public/track?code=' + encodeURIComponent(code.trim().toUpperCase()));
      const json = await res.json();
      if (!res.ok) { setError('not_found'); }
      else setResult(json);
    } catch { setError('network'); }
    setLoading(false);
  };

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) { setInput(code); search(code); }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    router.push('/client/suivi?code=' + encodeURIComponent(input.trim()));
    search(input);
  };

  const s = result
    ? { ...( STATUS_META[result.status] ?? { color: 'var(--ink-400)', bg: 'var(--bg-soft)', icon: '📦' }), label: t('statuses.' + result.status) || result.status }
    : null;

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{t('tracking.title')}</h2>
      <p style={{ color: 'var(--ink-400)', fontSize: 13.5, marginBottom: 24 }}>
        {t('tracking.subtitle')}
      </p>

      {/* Search bar */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value.toUpperCase())}
          placeholder="JMS-12345"
          className="input"
          style={{ flex: 1, fontFamily: 'var(--ff-mono)', fontSize: 15, fontWeight: 600, letterSpacing: '.04em' }}
        />
        <button type="submit" className="btn btn--brand" disabled={loading} style={{ minWidth: 90 }}>
          {loading ? '…' : t('tracking.track')}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div style={{ padding: '14px 18px', background: 'var(--bad-50)', border: '1px solid var(--bad-100)', borderRadius: 10, color: 'var(--bad-700)', fontSize: 13, fontWeight: 500, marginBottom: 20 }}>
          {error === 'not_found'
            ? <>{t('tracking.notFoundDetail').replace('{code}', input)}</>
            : t('error.network')}
        </div>
      )}

      {/* Result */}
      {result && s && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Status banner */}
          <div style={{ background: s.bg, border: '1px solid', borderColor: s.color + '33', borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 36 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: s.color, opacity: .8, marginBottom: 3 }}>{t('tracking.currentStatus')}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.label}</div>
              <div style={{ fontSize: 12, color: s.color, opacity: .7, marginTop: 2 }}>
                {result.campaign.from} → {result.campaign.to} · {t('tracking.campaign').replace('{code}', result.campaign.code)}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 17, fontWeight: 700, color: 'var(--ink-900)' }}>{result.trackingCode}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 2 }}>
                {result.paid
                  ? <span style={{ color: 'var(--ok-600)', fontWeight: 600 }}>{t('tracking.paid')}</span>
                  : <span style={{ color: 'var(--warn-700)', fontWeight: 600 }}>{t('tracking.paymentPending')}</span>}
              </div>
            </div>
          </div>

          {/* Info card */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-400)', marginBottom: 14 }}>{t('tracking.details.title')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
              {[
                { l: t('tracking.details.description'), v: result.description || '—' },
                { l: t('tracking.details.weight'),       v: result.weightKg ? result.weightKg + ' kg' : '—' },
                { l: t('tracking.details.departure'),    v: fmt(result.campaign.departureDate) },
                { l: t('tracking.details.arrival'),      v: fmt(result.campaign.arrivalDate) },
              ].map(r => (
                <div key={r.l}>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 3 }}>{r.l}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)' }}>{r.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-400)', marginBottom: 16 }}>{t('tracking.timeline.title')}</div>
            {result.tracking.length === 0 ? (
              <div style={{ color: 'var(--ink-300)', fontSize: 13, fontStyle: 'italic' }}>{t('tracking.timeline.empty')}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[...result.tracking].reverse().map((e, i, arr) => {
                  const es = {
                    ...(STATUS_META[e.status] ?? { color: 'var(--ink-500)', icon: '📦', bg: 'var(--bg-soft)' }),
                    label: t('statuses.' + e.status) || e.status,
                  };
                  const isLatest = i === 0;
                  return (
                    <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: i < arr.length - 1 ? 18 : 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                          width: isLatest ? 38 : 32, height: isLatest ? 38 : 32,
                          borderRadius: '50%',
                          background: isLatest ? es.bg : 'var(--bg-soft)',
                          display: 'grid', placeItems: 'center',
                          fontSize: isLatest ? 18 : 14,
                          flexShrink: 0,
                          border: `2px solid ${isLatest ? es.color : 'var(--border)'}`,
                          boxShadow: isLatest ? `0 0 0 4px ${es.color}18` : 'none',
                          transition: 'all .2s',
                        }}>{isLatest ? es.icon : '✓'}</div>
                        {i < arr.length - 1 && (
                          <div style={{ width: 2, flex: 1, background: 'var(--ok-200)', marginTop: 4, minHeight: 20 }} />
                        )}
                      </div>
                      <div style={{ paddingTop: isLatest ? 7 : 4 }}>
                        <div style={{
                          fontWeight: isLatest ? 700 : 500,
                          fontSize: isLatest ? 14 : 13,
                          color: isLatest ? es.color : 'var(--ink-700)',
                        }}>
                          {es.label}
                          {isLatest && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, background: es.color, color: 'white', padding: '2px 7px', borderRadius: 99, verticalAlign: 'middle' }}>{t('tracking.timeline.current')}</span>}
                        </div>
                        {e.location && <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>📍 {e.location}</div>}
                        {e.note     && <div style={{ fontSize: 12, color: 'var(--ink-500)', fontStyle: 'italic', marginTop: 2 }}>{e.note}</div>}
                        <div style={{ fontSize: 11, color: 'var(--ink-300)', marginTop: 3 }}>{fmtFull(e.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export default function ClientSuiviPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100%' }}>
      <Suspense><SuiviContent /></Suspense>
    </div>
  );
}
