'use client';
import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import I from '@/src/components/Icons.jsx';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';
  const [tab, setTab]     = useState(initialTab); // 'login' | 'register' | 'verify'
  const [fields, setFields] = useState({ email: '', name: '', password: '', confirm: '' });
  const [code, setCode]     = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow]     = useState(false);
  const [lang, setLang]     = useState('FR');

  const set = (k, v) => setFields(f => ({ ...f, [k]: v }));

  async function doLogin(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await signIn('credentials', {
      email: fields.email, password: fields.password, redirect: false,
    });
    setLoading(false);
    if (res?.error) { setError('Email ou mot de passe incorrect'); return; }
    const session = await fetch('/api/auth/session').then(r => r.json());
    const role = session?.user?.role;
    if (role === 'client') router.push('/client/dashboard');
    else router.push('/admin/campaigns');
  }

  async function doRegister(e) {
    e.preventDefault();
    setError('');
    if (fields.password !== fields.confirm) { setError('Les mots de passe ne correspondent pas'); return; }
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
        background: 'linear-gradient(155deg, #1a1408 0%, #2a1d0c 45%, #432a0d 100%)',
        color: 'white', padding: '48px 56px',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(245,165,36,.25), transparent 50%), radial-gradient(circle at 20% 80%, rgba(217,119,6,.2), transparent 50%)',
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
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #F5A524, #D97706)',
            display: 'grid', placeItems: 'center',
            fontWeight: 700, fontSize: 19, color: 'white',
            boxShadow: 'inset 0 -2px 4px rgba(0,0,0,.2), 0 6px 16px rgba(217,119,6,.35)',
          }}>J</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-.01em' }}>Jumla Shipping</div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.55)', marginTop: 1 }}>Fret international · Douala</div>
          </div>
        </button>

        <div style={{ marginTop: 'auto', position: 'relative', zIndex: 2 }}>
          <div className="route-pill" style={{
            background: 'rgba(255,255,255,.08)', border: '1px solid rgba(245,165,36,.25)',
            color: 'rgba(255,255,255,.85)', padding: '6px 14px', fontSize: 12, marginBottom: 24,
          }}>
            <span>DOUALA</span><I.Plane style={{ color: '#F5A524' }} /><span>MONTRÉAL</span>
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-.025em', lineHeight: 1.1, margin: 0, color: 'white' }}>
            Chaque colis,<br />tracé du départ<br />jusqu'à la remise.
          </h1>
          <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,.6)', marginTop: 18, marginBottom: 0, maxWidth: 420, lineHeight: 1.55 }}>
            Plateforme opérationnelle pour gérer vos cargaisons, vos bordereaux et vos paiements depuis l'Afrique vers le Canada.
          </p>
          <div style={{ display: 'flex', gap: 32, marginTop: 36, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,.08)' }}>
            {[{ k: '4', l: 'Routes actives' }, { k: '22', l: 'Cargaisons / an' }, { k: '312', l: 'Clients fidèles' }].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.02em' }}>{s.k}</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 20, left: 56, right: 56, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,.4)', zIndex: 2 }}>
          <span>© 2026 Jumla Shipping</span><span>v2.4</span>
        </div>
      </div>

      {/* Right — form */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: '36px 56px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center' }}>
          <div className="topbar__lang">
            <button className={lang === 'FR' ? 'is-active' : ''} onClick={() => setLang('FR')}>FR</button>
            <button className={lang === 'EN' ? 'is-active' : ''} onClick={() => setLang('EN')}>EN</button>
          </div>
          <button className="btn btn--ghost btn--sm"><I.Help />Besoin d'aide ?</button>
        </div>

        <div style={{ margin: 'auto 0', maxWidth: 380, width: '100%', alignSelf: 'center' }}>

          {/* Tabs — login / register */}
          {tab !== 'verify' && (
            <>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
                {[['login', 'Connexion', 'Sign in'], ['register', 'Créer un compte', 'Register']].map(([t, fr, en]) => (
                  <button key={t} onClick={() => { setTab(t); setError(''); }}
                    style={{
                      flex: 1, paddingBottom: 12, background: 'none', border: 'none',
                      borderBottom: tab === t ? '2px solid var(--brand-500)' : '2px solid transparent',
                      color: tab === t ? 'var(--ink-900)' : 'var(--ink-400)',
                      fontWeight: tab === t ? 700 : 400, fontSize: 15, cursor: 'pointer',
                      marginBottom: -1, textAlign: 'left',
                    }}>
                    {fr} <span style={{ color: 'var(--ink-400)', fontWeight: 400, fontSize: '.72em' }}>/ {en}</span>
                  </button>
                ))}
              </div>
              <p style={{ color: 'var(--ink-400)', fontSize: 13.5, marginTop: 0, marginBottom: 20 }}>
                {tab === 'login' ? 'Accédez à votre espace opérations.' : 'Créez votre compte client Jumla.'}
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
                <label className="label">Email <span className="opt">/ Email</span></label>
                <input className="input" type="email" value={fields.email}
                  onChange={e => set('email', e.target.value)} required placeholder="vous@exemple.com" />
              </div>
              <div className="field">
                <label className="label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Mot de passe <span className="opt">/ Password</span></span>
                  <a href="/forgot-password" style={{ fontSize: 12, color: 'var(--brand-600)', textDecoration: 'none', fontWeight: 500 }}>Mot de passe oublié ?</a>
                </label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={show ? 'text' : 'password'} value={fields.password}
                    onChange={e => set('password', e.target.value)} required placeholder="••••••••"
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
                {loading ? 'Connexion…' : <><span>Se connecter</span><I.ArrowRight /></>}
              </button>
            </form>
          )}

          {/* Register form */}
          {tab === 'register' && (
            <form onSubmit={doRegister} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div className="field">
                <label className="label">Nom complet <span className="opt">/ Full name</span></label>
                <input className="input" type="text" value={fields.name}
                  onChange={e => set('name', e.target.value)} required placeholder="Jean Dupont" />
              </div>
              <div className="field">
                <label className="label">Email <span className="opt">/ Email</span></label>
                <input className="input" type="email" value={fields.email}
                  onChange={e => set('email', e.target.value)} required placeholder="vous@exemple.com" />
              </div>
              <div className="field">
                <label className="label">Mot de passe <span className="opt">/ Password</span></label>
                <input className="input" type="password" value={fields.password}
                  onChange={e => set('password', e.target.value)} required placeholder="6 caractères minimum" />
              </div>
              <div className="field">
                <label className="label">Confirmer <span className="opt">/ Confirm password</span></label>
                <input className="input" type="password" value={fields.confirm}
                  onChange={e => set('confirm', e.target.value)} required placeholder="••••••••" />
              </div>
              <button type="submit" disabled={loading}
                className="btn btn--brand btn--lg"
                style={{ width: '100%', justifyContent: 'center', fontSize: 14, fontWeight: 600, marginTop: 8, opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Création…' : <><span>Créer mon compte</span><I.ArrowRight /></>}
              </button>
            </form>
          )}

          {/* Verify form */}
          {tab === 'verify' && (
            <form onSubmit={doVerify} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', color: 'var(--ink-900)' }}>
                  Vérification email <span style={{ color: 'var(--ink-400)', fontWeight: 400, fontSize: '.7em' }}>/ Verify email</span>
                </h2>
                <p style={{ color: 'var(--ink-400)', fontSize: 13.5, margin: 0 }}>
                  Code envoyé à <strong style={{ color: 'var(--ink-700)' }}>{fields.email}</strong>
                </p>
              </div>
              {demoCode && (
                <div style={{
                  background: 'var(--warn-50)', border: '1px solid var(--warn-200)',
                  borderRadius: 8, padding: '10px 14px', fontSize: 13,
                }}>
                  <span style={{ color: 'var(--warn-700)' }}>
                    Mode démo — votre code : <strong style={{ fontSize: 18, letterSpacing: 2 }}>{demoCode}</strong>
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
                {loading ? 'Vérification…' : <><span>Vérifier mon email</span><I.ArrowRight /></>}
              </button>
            </form>
          )}

          <div style={{ marginTop: 28, padding: 14, background: 'var(--bg-soft)', border: '1px solid var(--border-soft)', borderRadius: 10, display: 'flex', gap: 10 }}>
            <I.Info style={{ flex: '0 0 16px', color: 'var(--ink-400)', marginTop: 1 }} />
            <div style={{ fontSize: 12, color: 'var(--ink-500)', lineHeight: 1.45 }}>
              {tab === 'register'
                ? <><strong style={{ color: 'var(--ink-700)' }}>Compte client.</strong> Pour réserver et suivre vos colis Jumla.</>
                : <><strong style={{ color: 'var(--ink-700)' }}>Accès sécurisé.</strong> Plateforme Jumla — agents, admins et clients.</>
              }
            </div>
          </div>
        </div>

        <div style={{ fontSize: 11, color: 'var(--ink-400)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Conditions · Confidentialité</span><span>support@jumla.cargo</span>
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
