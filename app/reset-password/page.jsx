'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import '@/src/styles/tokens.css';

function ResetForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token') ?? '';

  const [pw,       setPw]       = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [status,   setStatus]   = useState('idle'); // idle | loading | done | error
  const [errMsg,   setErrMsg]   = useState('');
  const [show,     setShow]     = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrMsg('');
    if (pw.length < 8) { setErrMsg('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    if (pw !== confirm) { setErrMsg('Les mots de passe ne correspondent pas.'); return; }
    setStatus('loading');
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: pw }),
      });
      const json = await res.json();
      if (!res.ok) { setErrMsg(json.error || 'Erreur'); setStatus('error'); return; }
      setStatus('done');
    } catch {
      setErrMsg('Erreur réseau. Réessayez.');
      setStatus('error');
    }
  }

  const input = {
    width: '100%', height: 42, padding: '0 12px', fontSize: 14,
    border: '1.5px solid #d1d5db', background: 'white',
    outline: 'none', boxSizing: 'border-box',
  };
  const btn = {
    width: '100%', height: 44, background: '#1a1408', color: 'white',
    border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer',
    opacity: status === 'loading' ? .6 : 1,
  };

  if (!token) return (
    <div style={{ textAlign: 'center', padding: 40, color: '#dc2626' }}>
      Lien invalide. <button onClick={() => router.push('/forgot-password')} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}>Demander un nouveau lien</button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 16px' }}>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', padding: '40px 36px' }}>
          <div style={{ marginBottom: 28, textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#F5A524,#D97706)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 16, color: 'white' }}>J</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#1a1408' }}>Jumla Shipping</div>
            </div>
          </div>

          {status === 'done' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
              <h2 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 700, color: '#111827' }}>Mot de passe mis à jour</h2>
              <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6b7280' }}>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
              <button onClick={() => router.push('/login')} style={btn}>Se connecter</button>
            </div>
          ) : (
            <>
              <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#111827' }}>Nouveau mot de passe</h2>
              <p style={{ margin: '0 0 24px', fontSize: 13.5, color: '#6b7280' }}>Choisissez un mot de passe d'au moins 8 caractères.</p>
              {errMsg && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#dc2626' }}>{errMsg}</div>
              )}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Nouveau mot de passe</label>
                  <div style={{ position: 'relative' }}>
                    <input type={show ? 'text' : 'password'} required value={pw} onChange={e => setPw(e.target.value)}
                      placeholder="••••••••" style={{ ...input, paddingRight: 40 }} autoFocus />
                    <button type="button" onClick={() => setShow(s => !s)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 13 }}>
                      {show ? 'Cacher' : 'Voir'}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Confirmer</label>
                  <input type={show ? 'text' : 'password'} required value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••" style={input} />
                </div>
                <button type="submit" disabled={status === 'loading'} style={btn}>
                  {status === 'loading' ? 'Mise à jour…' : 'Mettre à jour'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense><ResetForm /></Suspense>;
}
