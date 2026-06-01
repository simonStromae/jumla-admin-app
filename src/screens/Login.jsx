import { useState } from 'react';
import I from '../components/Icons.jsx';

export default function LoginScreen({ onNav }) {
  const [lang, setLang] = useState('FR');
  const [show, setShow] = useState(false);

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
          backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(245, 165, 36, .25), transparent 50%), radial-gradient(circle at 20% 80%, rgba(217, 119, 6, .2), transparent 50%)',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 2 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #F5A524, #D97706)',
            display: 'grid', placeItems: 'center',
            fontWeight: 700, fontSize: 19, color: 'white',
            boxShadow: 'inset 0 -2px 4px rgba(0,0,0,.2), 0 6px 16px rgba(217, 119, 6, .35)',
          }}>J</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-.01em' }}>Jumla Shipping</div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.55)', marginTop: 1 }}>Fret international · Douala</div>
          </div>
        </div>

        <div style={{ marginTop: 'auto', position: 'relative', zIndex: 2 }}>
          <div className="route-pill" style={{
            background: 'rgba(255,255,255,.08)', border: '1px solid rgba(245, 165, 36, .25)',
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
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.02em', margin: 0, color: 'var(--ink-900)' }}>
            Connexion <span style={{ color: 'var(--ink-400)', fontWeight: 400, fontSize: '.7em', marginLeft: 4 }}>/ Sign in</span>
          </h2>
          <p style={{ color: 'var(--ink-400)', fontSize: 13.5, marginTop: 6 }}>Accédez à votre espace opérations.</p>

          <div style={{ marginTop: 28 }}>
            <div className="field">
              <label className="label">Email <span className="opt">/ Email</span></label>
              <input className="input" defaultValue="aicha.m@jumla.cargo" placeholder="vous@jumla.cargo" />
            </div>
            <div className="field">
              <label className="label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Mot de passe <span className="opt">/ Password</span></span>
                <a style={{ color: 'var(--brand-600)', fontWeight: 600, fontSize: 11.5, cursor: 'pointer' }}>Mot de passe oublié ?</a>
              </label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={show ? 'text' : 'password'} defaultValue="••••••••••" style={{ paddingRight: 38 }} />
                <button className="icon-btn" style={{ position: 'absolute', right: 3, top: 3 }} onClick={() => setShow(!show)}>
                  {show ? <I.EyeOff /> : <I.Eye />}
                </button>
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-600)', cursor: 'pointer', margin: '6px 0 22px' }}>
              <input type="checkbox" defaultChecked style={{ accentColor: 'var(--brand-500)' }} />
              <span>Rester connecté <span className="muted">/ Remember me</span></span>
            </label>
            <button className="btn btn--brand btn--lg" style={{ width: '100%', justifyContent: 'center', fontSize: 14, fontWeight: 600 }} onClick={() => onNav('/')}>
              Se connecter <I.ArrowRight />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '24px 0', color: 'var(--ink-300)', fontSize: 11 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} /><span>OU</span><div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            <button className="btn btn--ghost btn--lg" style={{ width: '100%', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 1 1-3.4-13l5.7-5.7A20 20 0 1 0 44 24c0-1.3-.1-2.6-.4-3.9z" /><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8a12 12 0 0 1 20-4.7l5.7-5.7A20 20 0 0 0 6.3 14.7z" /><path fill="#4CAF50" d="M24 44a20 20 0 0 0 13.5-5.2L31.3 34a12 12 0 0 1-18-6L7 32.8A20 20 0 0 0 24 44z" /><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 0 1-4 5.6l6 5A19 19 0 0 0 44 24c0-1.3-.1-2.6-.4-3.9z" /></svg>
              Continuer avec Google Workspace
            </button>
          </div>

          <div style={{ marginTop: 32, padding: 14, background: 'var(--bg-soft)', border: '1px solid var(--border-soft)', borderRadius: 10, display: 'flex', gap: 10 }}>
            <I.Info style={{ flex: '0 0 16px', color: 'var(--ink-400)', marginTop: 1 }} />
            <div style={{ fontSize: 12, color: 'var(--ink-500)', lineHeight: 1.45 }}>
              <strong style={{ color: 'var(--ink-700)' }}>Accès réservé.</strong> Cette plateforme est destinée aux agents et administrateurs Jumla.
            </div>
          </div>
        </div>

        <div style={{ fontSize: 11, color: 'var(--ink-400)', textAlign: 'center', display: 'flex', justifyContent: 'space-between' }}>
          <span>Conditions · Confidentialité</span><span>support@jumla.cargo</span>
        </div>
      </div>
    </div>
  );
}
