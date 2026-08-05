'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import '@/src/styles/tokens.css';
import I from '@/src/components/Icons.jsx';
import { useCompanyAssets } from '@/src/lib/useCompanyAssets.js';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { logoIconUrl, logoIconSize } = useCompanyAssets();
  const [email, setEmail]   = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | sent | error
  const [errMsg, setErrMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setErrMsg('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrMsg(data.error || 'Erreur serveur. Réessayez.');
        setStatus('error');
        return;
      }
      setStatus('sent');
    } catch {
      setErrMsg('Erreur réseau. Vérifiez votre connexion.');
      setStatus('error');
    }
  }

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .fp-layout { grid-template-columns: 1fr !important; }
          .fp-hero   { display: none !important; }
          .fp-panel  { padding: 32px 24px 24px !important; }
        }
      `}</style>
      <div className="fp-layout" style={{
        minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr',
        background: 'var(--bg-page)',
      }}>

        {/* Left — hero */}
        <div className="fp-hero" style={{
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
            <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0v40" fill="none" stroke="white" strokeWidth=".5" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          <button onClick={() => router.push('/')} style={{
            display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 2,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit',
          }}>
            {logoIconUrl
              ? <img src={logoIconUrl} alt="Logo" style={{ width: logoIconSize + 12, height: logoIconSize + 12, objectFit: 'contain' }} />
              : <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
                  <defs><linearGradient id="fplg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#00B4D8"/><stop offset="100%" stopColor="#1B4FD8"/></linearGradient></defs>
                  <path d="M8 8 C8 6 10 4 12 5 L38 20 C40 21 40 27 38 28 L12 43 C10 44 8 42 8 40 Z" fill="url(#fplg)"/>
                </svg>
            }
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '.03em', textTransform: 'uppercase' }}>JUMLA Shipping</div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.55)', marginTop: 1 }}>Fret international · Douala</div>
            </div>
          </button>

          <div style={{ marginTop: 'auto', position: 'relative', zIndex: 2 }}>
            <div style={{
              background: 'rgba(255,255,255,.08)', border: '1px solid rgba(0,180,216,.3)',
              color: 'rgba(255,255,255,.85)', padding: '6px 14px', fontSize: 12,
              marginBottom: 24, display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              <span>DOUALA</span><I.Plane style={{ color: '#00B4D8' }} /><span>MONTRÉAL</span>
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.2, margin: '0 0 16px', color: 'white' }}>
              Accès sécurisé<br />à votre espace
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', margin: 0, lineHeight: 1.55 }}>
              Un lien de réinitialisation vous sera envoyé par email. Valable 1 heure.
            </p>
          </div>

          <div style={{ position: 'absolute', bottom: 20, left: 56, right: 56, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,.4)', zIndex: 2 }}>
            <span>© 2026 Jumla Shipping</span><span>v2.4</span>
          </div>
        </div>

        {/* Right — form */}
        <div className="fp-panel" style={{
          display: 'flex', flexDirection: 'column', padding: '36px 56px', position: 'relative',
        }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn--ghost btn--sm" onClick={() => router.push('/login')}>
              <I.ArrowRight style={{ transform: 'rotate(180deg)' }} />Retour à la connexion
            </button>
          </div>

          <div style={{ margin: 'auto 0', maxWidth: 380, width: '100%', alignSelf: 'center' }}>

            {status === 'sent' ? (
              <div>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
                <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: 'var(--ink-900)' }}>
                  Email envoyé
                </h2>
                <p style={{ color: 'var(--ink-400)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
                  Si un compte existe pour <strong style={{ color: 'var(--ink-700)' }}>{email}</strong>, vous recevrez un lien de réinitialisation dans quelques minutes. Vérifiez aussi vos spams.
                </p>
                <button className="btn btn--brand btn--lg" style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => router.push('/login')}>
                  <span>Retour à la connexion</span><I.ArrowRight />
                </button>
              </div>
            ) : (
              <>
                <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 24, paddingBottom: 12 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--ink-900)' }}>
                    Mot de passe oublié
                  </h2>
                </div>
                <p style={{ color: 'var(--ink-400)', fontSize: 13.5, marginTop: 0, marginBottom: 20 }}>
                  Entrez votre adresse email et nous vous enverrons un lien pour choisir un nouveau mot de passe.
                </p>

                {errMsg && (
                  <div style={{
                    background: 'var(--bad-50)', color: 'var(--bad-600)',
                    padding: '10px 14px', borderRadius: 8, fontSize: 13,
                    marginBottom: 16, border: '1px solid var(--bad-200)',
                  }}>{errMsg}</div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <div className="field">
                    <label className="label">Adresse email</label>
                    <input
                      className="input" type="email" required autoFocus
                      value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="vous@exemple.com"
                    />
                  </div>
                  <button type="submit" disabled={status === 'loading'}
                    className="btn btn--brand btn--lg"
                    style={{ width: '100%', justifyContent: 'center', fontSize: 14, fontWeight: 600, marginTop: 8, opacity: status === 'loading' ? .7 : 1 }}>
                    {status === 'loading'
                      ? 'Envoi en cours…'
                      : <><span>Envoyer le lien</span><I.ArrowRight /></>}
                  </button>
                </form>

                <div style={{ marginTop: 28, padding: 14, background: 'var(--bg-soft)', border: '1px solid var(--border-soft)', borderRadius: 8, display: 'flex', gap: 10 }}>
                  <I.Info style={{ flex: '0 0 16px', color: 'var(--ink-400)', marginTop: 1 }} />
                  <div style={{ fontSize: 12, color: 'var(--ink-500)', lineHeight: 1.45 }}>
                    Le lien expire dans <strong style={{ color: 'var(--ink-700)' }}>1 heure</strong>. Si vous ne recevez rien, vérifiez vos spams ou contactez le support.
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={{ fontSize: 11, color: 'var(--ink-400)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Conditions · Confidentialité</span><span>info@jumlas.com</span>
          </div>
        </div>
      </div>
    </>
  );
}
