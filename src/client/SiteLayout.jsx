'use client';
import { useSession } from 'next-auth/react';
import I from '../components/Icons.jsx';

/* ─── Top info bar ─── */
export function TopBar() {
  return (
    <div className="jtop-bar">
      <div className="jc">
        <div className="jtop-bar__inner">
          <div className="jtop-bar__left">
            <span className="jtop-bar__item">
              <I.Calendar style={{ width: 13, height: 13 }} />
              Lundi–Vendredi · 09h à 20h
            </span>
            <span className="jtop-bar__item">
              <I.Send style={{ width: 13, height: 13 }} />
              contact@jumla.cargo
            </span>
          </div>
          <div className="jtop-bar__right">
            <span className="jtop-bar__item">
              <I.Phone style={{ width: 13, height: 13 }} />
              Disponible 24h/7j · +1 514 000 0000
            </span>
            <span className="jtop-bar__item" style={{ fontWeight: 700, color: 'var(--ink-600)' }}>
              🇫🇷 Français
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Nav ─── */
export function SiteNav({ onNav, onBook, mode = 'landing' }) {
  const { data: session, status } = useSession();
  const user = session?.user;
  const role = user?.role;

  const dashHref = role === 'admin' || role === 'agent' ? '/admin' : '/client/dashboard';
  const initials = user?.name
    ? user.name.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="jnav">
      <div className="jc">
        <div className="jnav__inner">
          <button className="jnav__logo" onClick={() => mode === 'landing' ? window.scrollTo({ top: 0, behavior: 'smooth' }) : onNav?.('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: 0 }}>
            <div className="jnav__logo-mark" style={{ background: 'none', fontSize: 0 }}>
              <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
                <defs><linearGradient id="navlg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#00B4D8"/><stop offset="100%" stopColor="#1B4FD8"/></linearGradient></defs>
                <path d="M8 8 C8 6 10 4 12 5 L38 20 C40 21 40 27 38 28 L12 43 C10 44 8 42 8 40 Z" fill="url(#navlg)"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif", fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', background: 'linear-gradient(90deg,#00B4D8,#1B4FD8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>JUMLA</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-500)', letterSpacing: 0, textTransform: 'none' }}>Shipping</span>
          </button>
          <div className="jnav__right" style={{ marginLeft: 'auto' }}>
            {status === 'loading' ? null : user ? (
              <button onClick={() => onNav?.(dashHref)} style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--brand-500)', color: '#fff',
                fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{initials}</button>
            ) : (
              <>
                <button className="jnav__signin" onClick={() => onNav?.('/login')}>Se connecter</button>
                <button className="jbtn-nav" onClick={() => onNav?.('/login?tab=register')}>
                  Créer un compte <I.ArrowRight style={{ width: 15, height: 15 }} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Footer ─── */
export function SiteFooter() {
  const cols = [
    { l: 'Services',   items: ['Fret aérien Douala → Montréal', 'Livraison à domicile', 'Retrait entrepôt', 'Suivi en temps réel'] },
    { l: 'Entreprise', items: ['À propos', 'Blog', 'Carrières', 'Contact'] },
    { l: 'Légal',      items: ['Conditions générales', 'Confidentialité', 'Cookies', 'FAQ'] },
  ];
  return (
    <footer className="jfoot" id="jfoot">
      <div className="jc">
        <div className="jfoot__grid">
          <div>
            <div className="jfoot__brand">
              <div className="jfoot__brand-mark" style={{ background: 'none', fontSize: 0 }}>
                <svg width="34" height="34" viewBox="0 0 48 48" fill="none">
                  <defs><linearGradient id="ftlg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#00B4D8"/><stop offset="100%" stopColor="#1B4FD8"/></linearGradient></defs>
                  <path d="M8 8 C8 6 10 4 12 5 L38 20 C40 21 40 27 38 28 L12 43 C10 44 8 42 8 40 Z" fill="url(#ftlg)"/>
                </svg>
              </div>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', background: 'linear-gradient(90deg,#00B4D8,#1B4FD8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>JUMLA</span>
              <span style={{ fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,.6)' }}>Shipping</span>
            </div>
            <p className="jfoot__desc">
              Spécialiste du fret aérien international entre l'Afrique et le Canada depuis 2021.
              Suivi, sécurité et transparence à chaque étape.
            </p>
            <div className="jfoot__contact">
              <I.Whatsapp style={{ width: 16, height: 16 }} /> WhatsApp · Douala &amp; Montréal
            </div>
          </div>
          {cols.map(c => (
            <div key={c.l}>
              <div className="jfoot__col-title">{c.l}</div>
              <div className="jfoot__col">
                {c.items.map(item => <a key={item}>{item}</a>)}
              </div>
            </div>
          ))}
        </div>
        <div className="jfoot__bottom">
          <span>© 2026 Jumla Shipping SARL — Tous droits réservés</span>
          <span>Douala · Montréal · Lagos · Bruxelles</span>
        </div>
      </div>
    </footer>
  );
}
