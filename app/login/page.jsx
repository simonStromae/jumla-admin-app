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
  const [show, setShow]         = useState(false);
  const [remember, setRemember] = useState(false);
  const [verifyFromLogin, setVerifyFromLogin] = useState(false);

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
      email: fields.email, password: fields.password, remember: String(remember), redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      // Check remaining attempts
      const status = await fetch('/api/auth/login-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fields.email }),
      }).then(r => r.json()).catch(() => ({ remaining: null, suspended: false }));

      if (status.suspended) {
        setError('Compte suspendu suite à trop de tentatives. Contactez un administrateur.');
        return;
      }
      // Check if the account exists but email is not verified yet
      const check = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fields.email }),
      }).then(r => r.json()).catch(() => ({}));
      if (check.needsVerification) {
        setDemoCode('');
        setError('');
        setVerifyFromLogin(true);
        setTab('verify');
        return;
      }
      if (status.remaining !== null && status.remaining <= 4) {
        setError(`Email ou mot de passe incorrect. ${status.remaining} tentative${status.remaining > 1 ? 's' : ''} restante${status.remaining > 1 ? 's' : ''} avant suspension.`);
      } else {
        setError(t('error.credentials'));
      }
      return;
    }
    const session = await fetch('/api/auth/session').then(r => r.json());
    const role = session?.user?.role;
    if (role === 'client') router.push('/client/dashboard');
    else if (role === 'driver') router.push('/livreur/dashboard');
    else if (role === 'agent') {
      const isMobile = window.innerWidth < 768;
      router.push(isMobile ? '/agent/dashboard' : '/admin/dashboard');
    } else router.push('/admin/campaigns');
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
    setDemoCode(''); setVerifyFromLogin(false); setTab('login');
  }

  const doOAuth = (provider) => {
    signIn(provider, { callbackUrl: '/client/dashboard' });
  };

  return (
    <>
    <style>{`
      @media (max-width: 767px) {
        .login-layout { grid-template-columns: 1fr !important; }
        .login-hero { display: none !important; }
        .login-form-panel { padding: 32px 24px 24px !important; }
      }
    `}</style>
    <div className="login-layout" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--bg-page)' }}>

      {/* Left — visual */}
      <div className="login-hero" style={{
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
      <div className="login-form-panel" style={{ display: 'flex', flexDirection: 'column', padding: '36px 56px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
          <LanguageSwitcher />
          <button className="btn btn--ghost btn--sm"><I.Help />{t('button.help')}</button>
        </div>

        {/* Mobile logo — only visible when hero panel is hidden */}
        <div className="mobile-login-logo" style={{ display: 'none', flexDirection: 'column', alignItems: 'center', marginTop: 24, marginBottom: 8 }}>
          <style>{`.mobile-login-logo { display: none !important; } @media (max-width: 767px) { .mobile-login-logo { display: flex !important; } }`}</style>
          <button onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, overflow: 'hidden',
              background: 'linear-gradient(135deg, #0D2E6E, #1B4FD8)',
              display: 'grid', placeItems: 'center', flexShrink: 0,
            }}>
              {logoIconUrl
                ? <img src={logoIconUrl} alt="Logo" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                : <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
                    <defs><linearGradient id="mllg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#00B4D8"/><stop offset="100%" stopColor="white"/></linearGradient></defs>
                    <path d="M8 8 C8 6 10 4 12 5 L38 20 C40 21 40 27 38 28 L12 43 C10 44 8 42 8 40 Z" fill="url(#mllg)"/>
                  </svg>
              }
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--ink-900)', letterSpacing: '.02em' }}>Jumla Shipping</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-400)', marginTop: 1 }}>Douala → Montréal</div>
            </div>
          </button>
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

          {/* OAuth buttons */}
          {tab !== 'verify' && (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <button
                  type="button"
                  onClick={() => doOAuth('google')}
                  className="btn btn--ghost"
                  style={{ flex: 1, justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                  <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.332 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
                    <path d="M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
                    <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.316 0-9.817-3.58-11.296-8.42l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
                    <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => doOAuth('facebook')}
                  className="btn btn--ghost"
                  style={{ flex: 1, justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                  <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 4C12.954 4 4 12.954 4 24c0 9.893 6.835 18.185 16 20.473V30h-5v-6h5v-4.5C20 15.014 22.716 12 27.5 12c2.291 0 4.5.2 4.5.2V17h-2.535C27.034 17 26 18.168 26 19.75V24h6l-1 6h-5v14.473C35.165 42.185 42 33.893 42 24c0-11.046-8.954-20-18-20z" fill="#1877F2"/>
                    <path d="M31 30l1-6h-6v-4.25C26 18.168 27.034 17 29.465 17H32v-4.8S29.791 12 27.5 12C22.716 12 20 15.014 20 19.5V24h-5v6h5v14.473a20.1 20.1 0 0 0 8 0V30h-5z" fill="white"/>
                  </svg>
                  Facebook
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 12, color: 'var(--ink-400)', whiteSpace: 'nowrap' }}>
                  {tab === 'login' ? 'ou se connecter avec email' : 'ou s\'inscrire avec email'}
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
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
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-600)', cursor: 'pointer', marginTop: 4 }}>
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: 'var(--brand-500)', cursor: 'pointer' }} />
                Rester connecté pendant 30 jours
              </label>
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
              {verifyFromLogin && (
                <div style={{
                  background: 'var(--info-50)', border: '1px solid var(--info-200)',
                  borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--info-700)',
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                }}>
                  <I.Info style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
                  <span>Votre email n'est pas encore vérifié. Un nouveau code vient d'être envoyé à <strong>{fields.email}</strong>.</span>
                </div>
              )}
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

        </div>

        <div style={{ fontSize: 11, color: 'var(--ink-400)', display: 'flex', justifyContent: 'space-between' }}>
          <span>{t('auth.footer.legal')}</span><span>{t('auth.footer.support')}</span>
        </div>
      </div>
    </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
