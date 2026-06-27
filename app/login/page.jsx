'use client';
import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import I from '@/src/components/Icons.jsx';
import { useCompanyAssets } from '@/src/lib/useCompanyAssets.js';
import { useT, useLocale } from '@/src/lib/i18n';
import LanguageSwitcher from '@/src/components/LanguageSwitcher.jsx';

const DEFAULT_SLIDES = {
  fr: [
    'Chaque colis, tracé du départ jusqu\'à la remise.',
    'Réservez en ligne, déposez à Douala — livré à Montréal en 14 jours.',
    'Suivi en temps réel et notifications WhatsApp à chaque étape.',
    'Vérification article par article, bordereau signé au départ.',
  ],
  en: [
    'Every parcel, tracked from departure to delivery.',
    'Book online, drop off in Douala — delivered to Montréal in 14 days.',
    'Real-time tracking with WhatsApp notifications at every step.',
    'Item-by-item verification, signed manifest at departure.',
  ],
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';
  const { logoIconUrl, logoIconSize } = useCompanyAssets();
  const t = useT();
  const { locale } = useLocale();
  const [tab, setTab]     = useState(initialTab); // 'login' | 'register' | 'verify'
  const [fields, setFields] = useState({ email: '', name: '', password: '', confirm: '' });
  const [code, setCode]     = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow]     = useState(false);

  const lang = locale === 'en' ? 'en' : 'fr';
  const [slides, setSlides] = useState(DEFAULT_SLIDES.fr);
  const [slideIdx, setSlideIdx] = useState(0);
  const [slideFade, setSlideFade] = useState(true);

  useEffect(() => {
    fetch('/api/public/config')
      .then(r => r.json())
      .then(d => {
        const fetched = d.landingContent?.[lang]?.loginSlides;
        if (Array.isArray(fetched) && fetched.length > 0) {
          setSlides(fetched);
        } else {
          setSlides(DEFAULT_SLIDES[lang]);
        }
        setSlideIdx(0);
      })
      .catch(() => setSlides(DEFAULT_SLIDES[lang]));
  }, [lang]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setSlideFade(false);
      setTimeout(() => {
        setSlideIdx(i => (i + 1) % slides.length);
        setSlideFade(true);
      }, 450);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (i) => {
    setSlideFade(false);
    setTimeout(() => { setSlideIdx(i); setSlideFade(true); }, 450);
  };

  const set = (k, v) => setFields(f => ({ ...f, [k]: v }));

  async function doLogin(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await signIn('credentials', {
      email: fields.email, password: fields.password, redirect: false,
    });
    setLoading(false);
    if (res?.error) { setError(t('error.credentials')); return; }
    const session = await fetch('/api/auth/session').then(r => r.json());
    const role = session?.user?.role;
    if (role === 'client') router.push('/client/dashboard');
    else router.push('/admin/campaigns');
  }

  async function doRegister(e) {
    e.preventDefault();
    setError('');
    if (fields.password !== fields.confirm) { setError(t('error.passwordMismatch')); return; }
    setLoading(true);
    const res  = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fields.email, name: fields.name, password: fields.password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    if (data.verified) { setTab('login'); return; } // email verification disabled — go straight to login
    setDemoCode(data.demoCode);
    setTab('verify');
  }

  async function doVerify(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    const res  = await fetch('/api/auth/verify-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fields.email, code }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setDemoCode(''); setTab('login');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--bg-page)' }}>

      {/* Left — visual */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(155deg, #1A1A2E 0%, #0D2E6E 55%, #1B4FD8 100%)',
        color: 'white', padding: '48px 56px',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(0,180,216,.2), transparent 50%), radial-gradient(circle at 20% 80%, rgba(27,79,216,.25), transparent 50%)',
          pointerEvents: 'none',
        }} />
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: .06 }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0v40" fill="none" stroke="white" strokeWidth=".5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <button onClick={() => router.push('/')} style={{
          display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 2,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit',
        }}>
          {logoIconUrl
            ? <img src={logoIconUrl} alt="Logo" style={{ width: logoIconSize + 12, height: logoIconSize + 12, objectFit: 'contain' }} />
            : <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
                <defs><linearGradient id="llg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#00B4D8"/><stop offset="100%" stopColor="#1B4FD8"/></linearGradient></defs>
                <path d="M8 8 C8 6 10 4 12 5 L38 20 C40 21 40 27 38 28 L12 43 C10 44 8 42 8 40 Z" fill="url(#llg)"/>
              </svg>
          }
          <div>
            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: '.03em', textTransform: 'uppercase' }}>JUMLA Shipping</div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.55)', marginTop: 1 }}>Fret international · Douala</div>
          </div>
        </button>

        <div style={{ marginTop: 'auto', position: 'relative', zIndex: 2 }}>
          <div className="route-pill" style={{
            background: 'rgba(255,255,255,.08)', border: '1px solid rgba(0,180,216,.3)',
            color: 'rgba(255,255,255,.85)', padding: '6px 14px', fontSize: 12, marginBottom: 24,
          }}>
            <span>DOUALA</span><I.Plane style={{ color: '#00B4D8' }} /><span>MONTRÉAL</span>
          </div>
          <div style={{ minHeight: 148, transition: 'opacity 0.45s ease', opacity: slideFade ? 1 : 0 }}>
            <h1 style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 36, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.2, margin: 0, color: 'white' }}>
              {slides[slideIdx] ?? ''}
            </h1>
          </div>
          {slides.length > 1 && (
            <div style={{ display: 'flex', gap: 6, marginTop: 24 }}>
              {slides.map((_, i) => (
                <div key={i} onClick={() => goToSlide(i)} style={{
                  width: i === slideIdx ? 20 : 6, height: 6, borderRadius: 3,
                  background: i === slideIdx ? 'rgba(0,180,216,.9)' : 'rgba(255,255,255,.25)',
                  transition: 'all 0.35s ease', cursor: 'pointer',
                }} />
              ))}
            </div>
          )}
        </div>
        <div style={{ position: 'absolute', bottom: 20, left: 56, right: 56, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,.4)', zIndex: 2 }}>
          <span>© 2026 Jumla Shipping</span><span>v2.4</span>
        </div>
      </div>

      {/* Right — form */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: '36px 56px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
          <LanguageSwitcher />
          <button className="btn btn--ghost btn--sm"><I.Help />{t('button.help')}</button>
        </div>

        <div style={{ margin: 'auto 0', maxWidth: 380, width: '100%', alignSelf: 'center' }}>

          {/* Tabs — login / register */}
          {tab !== 'verify' && (
            <>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
                {[['login', t('auth.login.title')], ['register', t('auth.register.title')]].map(([tabKey, label]) => (
                  <button key={tabKey} onClick={() => { setTab(tabKey); setError(''); }}
                    style={{
                      flex: 1, paddingBottom: 12, background: 'none', border: 'none',
                      borderBottom: tab === tabKey ? '2px solid var(--brand-500)' : '2px solid transparent',
                      color: tab === tabKey ? 'var(--ink-900)' : 'var(--ink-400)',
                      fontWeight: tab === tabKey ? 700 : 400, fontSize: 15, cursor: 'pointer',
                      marginBottom: -1, textAlign: 'left',
                    }}>
                    {label}
                  </button>
                ))}
              </div>
              <p style={{ color: 'var(--ink-400)', fontSize: 13.5, marginTop: 0, marginBottom: 20 }}>
                {tab === 'login' ? t('auth.login.subtitle') : t('auth.register.subtitle')}
              </p>
            </>
          )}

          {error && (
            <div style={{
              background: 'var(--bad-50)', color: 'var(--bad-600)',
              padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, border: '1px solid var(--bad-200)',
            }}>{error}</div>
          )}

          {/* Login form */}
          {tab === 'login' && (
            <form onSubmit={doLogin} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div className="field">
                <label className="label">{t('form.email')} </label>
                <input className="input" type="email" value={fields.email}
                  onChange={e => set('email', e.target.value)} required placeholder={t('form.emailPlaceholder')} />
              </div>
              <div className="field">
                <label className="label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{t('form.password')}</span>
                  <a href="/forgot-password" style={{ fontSize: 12, color: 'var(--brand-600)', textDecoration: 'none', fontWeight: 500 }}>{t('auth.login.forgotPassword')}</a>
                </label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={show ? 'text' : 'password'} value={fields.password}
                    onChange={e => set('password', e.target.value)} required placeholder={t('form.passwordPlaceholder')}
                    style={{ paddingRight: 38 }} />
                  <button type="button" className="icon-btn" style={{ position: 'absolute', right: 3, top: 3 }}
                    onClick={() => setShow(!show)}>
                    {show ? <I.EyeOff /> : <I.Eye />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="btn btn--brand btn--lg"
                style={{ width: '100%', justifyContent: 'center', fontSize: 14, fontWeight: 600, marginTop: 8, opacity: loading ? 0.7 : 1 }}>
                {loading ? t('button.signingIn') : <><span>{t('button.signIn')}</span><I.ArrowRight /></>}
              </button>
            </form>
          )}

          {/* Register form */}
          {tab === 'register' && (
            <form onSubmit={doRegister} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div className="field">
                <label className="label">{t('form.fullName')}</label>
                <input className="input" type="text" value={fields.name}
                  onChange={e => set('name', e.target.value)} required placeholder={t('form.fullNamePlaceholder')} />
              </div>
              <div className="field">
                <label className="label">{t('form.email')} </label>
                <input className="input" type="email" value={fields.email}
                  onChange={e => set('email', e.target.value)} required placeholder={t('form.emailPlaceholder')} />
              </div>
              <div className="field">
                <label className="label">{t('form.password')}</label>
                <input className="input" type="password" value={fields.password}
                  onChange={e => set('password', e.target.value)} required placeholder={t('form.passwordHint')} />
              </div>
              <div className="field">
                <label className="label">{t('form.passwordConfirm')}</label>
                <input className="input" type="password" value={fields.confirm}
                  onChange={e => set('confirm', e.target.value)} required placeholder={t('form.passwordPlaceholder')} />
              </div>
              <button type="submit" disabled={loading}
                className="btn btn--brand btn--lg"
                style={{ width: '100%', justifyContent: 'center', fontSize: 14, fontWeight: 600, marginTop: 8, opacity: loading ? 0.7 : 1 }}>
                {loading ? t('button.registering') : <><span>{t('button.register')}</span><I.ArrowRight /></>}
              </button>
            </form>
          )}

          {/* Verify form */}
          {tab === 'verify' && (
            <form onSubmit={doVerify} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', color: 'var(--ink-900)' }}>
                  {t('auth.verify.title')}
                </h2>
                <p style={{ color: 'var(--ink-400)', fontSize: 13.5, margin: 0 }}>
                  {t('auth.verify.sentTo')} <strong style={{ color: 'var(--ink-700)' }}>{fields.email}</strong>
                </p>
              </div>
              {demoCode && (
                <div style={{
                  background: 'var(--warn-50)', border: '1px solid var(--warn-200)',
                  borderRadius: 8, padding: '10px 14px', fontSize: 13,
                }}>
                  <span style={{ color: 'var(--warn-700)' }}>
                    {t('auth.verify.demoCode')} <strong style={{ fontSize: 18, letterSpacing: 2 }}>{demoCode}</strong>
                  </span>
                </div>
              )}
              {error && (
                <div style={{
                  background: 'var(--bad-50)', color: 'var(--bad-600)',
                  padding: '10px 14px', borderRadius: 8, fontSize: 13, border: '1px solid var(--bad-200)',
                }}>{error}</div>
              )}
              <input type="text" value={code} onChange={e => setCode(e.target.value)}
                required maxLength={6} placeholder="123456"
                style={{
                  padding: '14px', border: '1px solid var(--border)', borderRadius: 8,
                  fontSize: 26, fontWeight: 700, letterSpacing: 12, textAlign: 'center', outline: 'none',
                  width: '100%', boxSizing: 'border-box',
                }} />
              <button type="submit" disabled={loading}
                className="btn btn--brand btn--lg"
                style={{ width: '100%', justifyContent: 'center', fontSize: 14, fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
                {loading ? t('button.verifying') : <><span>{t('button.verify')}</span><I.ArrowRight /></>}
              </button>
            </form>
          )}

          <div style={{ marginTop: 28, padding: 14, background: 'var(--bg-soft)', border: '1px solid var(--border-soft)', borderRadius: 10, display: 'flex', gap: 10 }}>
            <I.Info style={{ flex: '0 0 16px', color: 'var(--ink-400)', marginTop: 1 }} />
            <div style={{ fontSize: 12, color: 'var(--ink-500)', lineHeight: 1.45 }}>
              {tab === 'register'
                ? <span dangerouslySetInnerHTML={{ __html: t('auth.info.register') }} />
                : <span dangerouslySetInnerHTML={{ __html: t('auth.info.login') }} />
              }
            </div>
          </div>
        </div>

        <div style={{ fontSize: 11, color: 'var(--ink-400)', display: 'flex', justifyContent: 'space-between' }}>
          <span>{t('auth.footer.legal')}</span><span>{t('auth.footer.support')}</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
