'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import '@/src/styles/tokens.css';
import I from '@/src/components/Icons.jsx';

function ResetForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token') ?? '';

  const [pw,      setPw]      = useState('');
  const [confirm, setConfirm] = useState('');
  const [show,    setShow]    = useState(false);
  const [status,  setStatus]  = useState('idle'); // idle | loading | done | error
  const [errMsg,  setErrMsg]  = useState('');

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

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--bg-page)' }}>

      {/* Left — same visual as login */}
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
          <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0v40" fill="none" stroke="white" strokeWidth=".5" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        <button onClick={() => router.push('/')} style={{
          display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 2,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit',
        }}>
          <div style={{
            width: 44, height: 44, background: 'linear-gradient(135deg, #F5A524, #D97706)',
            display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 19, color: 'white',
          }}>J</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Jumla Shipping</div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.55)', marginTop: 1 }}>Fret international · Douala</div>
          </div>
        </button>
        <div style={{ marginTop: 'auto', position: 'relative', zIndex: 2 }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-.025em', lineHeight: 1.2, margin: '0 0 16px', color: 'white' }}>
            Réinitialisation<br />de mot de passe
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', margin: 0, lineHeight: 1.55 }}>
            Choisissez un nouveau mot de passe sécurisé pour accéder à votre espace Jumla.
          </p>
        </div>
        <div style={{ position: 'absolute', bottom: 20, left: 56, right: 56, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,.4)', zIndex: 2 }}>
          <span>© 2026 Jumla Shipping</span><span>v2.4</span>
        </div>
      </div>

      {/* Right — form */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: '36px 56px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn--ghost btn--sm" onClick={() => router.push('/login')}><I.ArrowRight style={{ transform: 'rotate(180deg)' }} />Retour</button>
        </div>

        <div style={{ margin: 'auto 0', maxWidth: 380, width: '100%', alignSelf: 'center' }}>
          {!token ? (
            <div>
              <p style={{ color: 'var(--bad-600)', marginBottom: 20 }}>Lien invalide ou expiré.</p>
              <button className="btn btn--brand" onClick={() => router.push('/forgot-password')}>Demander un nouveau lien</button>
            </div>
          ) : status === 'done' ? (
            <div>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
              <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: 'var(--ink-900)' }}>Mot de passe mis à jour</h2>
              <p style={{ color: 'var(--ink-400)', fontSize: 14, marginBottom: 24 }}>
                Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
              </p>
              <button className="btn btn--brand btn--lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => router.push('/login')}>
                <span>Se connecter</span><I.ArrowRight />
              </button>
            </div>
          ) : (
            <>
              <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 24, paddingBottom: 12 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--ink-900)' }}>Nouveau mot de passe</h2>
              </div>
              <p style={{ color: 'var(--ink-400)', fontSize: 13.5, marginTop: 0, marginBottom: 20 }}>
                Choisissez un mot de passe d'au moins 8 caractères.
              </p>

              {errMsg && (
                <div style={{ background: 'var(--bad-50)', color: 'var(--bad-600)', padding: '10px 14px', fontSize: 13, marginBottom: 16, border: '1px solid var(--bad-200)' }}>
                  {errMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div className="field">
                  <label className="label">Nouveau mot de passe</label>
                  <div style={{ position: 'relative' }}>
                    <input className="input" type={show ? 'text' : 'password'} required
                      value={pw} onChange={e => setPw(e.target.value)}
                      placeholder="8 caractères minimum" style={{ paddingRight: 38 }} autoFocus />
                    <button type="button" className="icon-btn" style={{ position: 'absolute', right: 3, top: 3 }}
                      onClick={() => setShow(s => !s)}>
                      {show ? <I.EyeOff /> : <I.Eye />}
                    </button>
                  </div>
                </div>
                <div className="field">
                  <label className="label">Confirmer</label>
                  <input className="input" type={show ? 'text' : 'password'} required
                    value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••" />
                </div>
                <button type="submit" disabled={status === 'loading'}
                  className="btn btn--brand btn--lg"
                  style={{ width: '100%', justifyContent: 'center', fontSize: 14, fontWeight: 600, marginTop: 8, opacity: status === 'loading' ? .7 : 1 }}>
                  {status === 'loading' ? 'Mise à jour…' : <><span>Mettre à jour</span><I.ArrowRight /></>}
                </button>
              </form>

              <div style={{ marginTop: 28, padding: 14, background: 'var(--bg-soft)', border: '1px solid var(--border-soft)', display: 'flex', gap: 10 }}>
                <I.Info style={{ flex: '0 0 16px', color: 'var(--ink-400)', marginTop: 1 }} />
                <div style={{ fontSize: 12, color: 'var(--ink-500)', lineHeight: 1.45 }}>
                  <strong style={{ color: 'var(--ink-700)' }}>Accès sécurisé.</strong> Ce lien expire après utilisation.
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ fontSize: 11, color: 'var(--ink-400)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Conditions · Confidentialité</span><span>support@jumla.cargo</span>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense><ResetForm /></Suspense>;
}
