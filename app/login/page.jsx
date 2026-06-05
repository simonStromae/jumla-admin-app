'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab]       = useState('login');
  const [fields, setFields] = useState({ email: '', name: '', password: '', confirm: '' });
  const [code, setCode]     = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

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
    const role    = session?.user?.role;
    if (role === 'client') router.push('/client/dashboard');
    else router.push('/admin/campaigns');
  }

  async function doRegister(e) {
    e.preventDefault();
    setError('');
    if (fields.password !== fields.confirm) { setError('Les mots de passe ne correspondent pas'); return; }
    setLoading(true);
    const res  = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fields.email, name: fields.name, password: fields.password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setDemoCode(data.demoCode);
    setTab('verify');
  }

  async function doVerify(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    const res  = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fields.email, code }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setDemoCode('');
    setTab('login');
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-soft)', padding: 20,
    }}>
      <div style={{
        background: 'white', borderRadius: 12, padding: 40, width: '100%', maxWidth: 400,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'var(--brand-500)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 18,
          }}>J</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Jumla Shipping</div>
            <div style={{ fontSize: 12, color: 'var(--ink-400)' }}>Fret international</div>
          </div>
        </div>

        {tab !== 'verify' && (
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
            {['login', 'register'].map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); }}
                style={{
                  flex: 1, padding: '8px 0', background: 'none', border: 'none',
                  borderBottom: tab === t ? '2px solid var(--brand-500)' : '2px solid transparent',
                  color: tab === t ? 'var(--brand-600)' : 'var(--ink-400)',
                  fontWeight: tab === t ? 600 : 400, fontSize: 14, cursor: 'pointer', marginBottom: -1,
                }}>
                {t === 'login' ? 'Se connecter' : 'Créer un compte'}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div style={{
            background: 'var(--bad-50)', color: 'var(--bad-600)',
            padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16,
          }}>{error}</div>
        )}

        {tab === 'login' && (
          <form onSubmit={doLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>
              Adresse email
              <input type="email" value={fields.email} onChange={e => set('email', e.target.value)}
                required placeholder="vous@exemple.com"
                style={{ display: 'block', width: '100%', marginTop: 6, padding: '10px 12px',
                  border: '1px solid var(--border)', borderRadius: 8, fontSize: 14,
                  outline: 'none', boxSizing: 'border-box' }} />
            </label>
            <label style={{ fontSize: 13, fontWeight: 500 }}>
              Mot de passe
              <input type="password" value={fields.password} onChange={e => set('password', e.target.value)}
                required placeholder="••••••••"
                style={{ display: 'block', width: '100%', marginTop: 6, padding: '10px 12px',
                  border: '1px solid var(--border)', borderRadius: 8, fontSize: 14,
                  outline: 'none', boxSizing: 'border-box' }} />
            </label>
            <button type="submit" disabled={loading}
              style={{
                marginTop: 8, padding: '11px', borderRadius: 8, border: 'none',
                background: 'var(--brand-500)', color: 'white',
                fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              }}>
              {loading ? 'Connexion…' : 'Se connecter →'}
            </button>
          </form>
        )}

        {tab === 'register' && (
          <form onSubmit={doRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>
              Nom complet
              <input type="text" value={fields.name} onChange={e => set('name', e.target.value)}
                required placeholder="Jean Dupont"
                style={{ display: 'block', width: '100%', marginTop: 6, padding: '10px 12px',
                  border: '1px solid var(--border)', borderRadius: 8, fontSize: 14,
                  outline: 'none', boxSizing: 'border-box' }} />
            </label>
            <label style={{ fontSize: 13, fontWeight: 500 }}>
              Adresse email
              <input type="email" value={fields.email} onChange={e => set('email', e.target.value)}
                required placeholder="vous@exemple.com"
                style={{ display: 'block', width: '100%', marginTop: 6, padding: '10px 12px',
                  border: '1px solid var(--border)', borderRadius: 8, fontSize: 14,
                  outline: 'none', boxSizing: 'border-box' }} />
            </label>
            <label style={{ fontSize: 13, fontWeight: 500 }}>
              Mot de passe
              <input type="password" value={fields.password} onChange={e => set('password', e.target.value)}
                required placeholder="6 caractères minimum"
                style={{ display: 'block', width: '100%', marginTop: 6, padding: '10px 12px',
                  border: '1px solid var(--border)', borderRadius: 8, fontSize: 14,
                  outline: 'none', boxSizing: 'border-box' }} />
            </label>
            <label style={{ fontSize: 13, fontWeight: 500 }}>
              Confirmer le mot de passe
              <input type="password" value={fields.confirm} onChange={e => set('confirm', e.target.value)}
                required placeholder="••••••••"
                style={{ display: 'block', width: '100%', marginTop: 6, padding: '10px 12px',
                  border: '1px solid var(--border)', borderRadius: 8, fontSize: 14,
                  outline: 'none', boxSizing: 'border-box' }} />
            </label>
            <button type="submit" disabled={loading}
              style={{
                marginTop: 8, padding: '11px', borderRadius: 8, border: 'none',
                background: 'var(--brand-500)', color: 'white',
                fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              }}>
              {loading ? 'Création…' : 'Créer mon compte →'}
            </button>
          </form>
        )}

        {tab === 'verify' && (
          <form onSubmit={doVerify} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Vérification email</div>
            <div style={{ fontSize: 13, color: 'var(--ink-500)', marginBottom: 8 }}>
              Code envoyé à <strong>{fields.email}</strong>
            </div>
            {demoCode && (
              <div style={{
                background: 'var(--warn-50)', border: '1px solid var(--warn-200)',
                borderRadius: 8, padding: '10px 14px', fontSize: 13,
              }}>
                <span style={{ color: 'var(--warn-700)' }}>
                  Mode démo — code : <strong style={{ fontSize: 18 }}>{demoCode}</strong>
                </span>
              </div>
            )}
            <input type="text" value={code} onChange={e => setCode(e.target.value)}
              required maxLength={6} placeholder="123456"
              style={{
                padding: '12px', border: '1px solid var(--border)', borderRadius: 8,
                fontSize: 24, fontWeight: 700, letterSpacing: 10, textAlign: 'center', outline: 'none',
              }} />
            <button type="submit" disabled={loading}
              style={{
                padding: '11px', borderRadius: 8, border: 'none',
                background: 'var(--brand-500)', color: 'white',
                fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              }}>
              {loading ? 'Vérification…' : 'Vérifier →'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
