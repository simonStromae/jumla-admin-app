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

  const dashHref = role === 'admin' || role === 'agent' ? '/admin/dashboard' : '/client/dashboard';
  const initials = user?.name
    ? user.name.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="jnav">
      <div className="jc">
        <div className="jnav__inner">
          <button className="jnav__logo" onClick={() => mode === 'landing' ? window.scrollTo({ top: 0, behavior: 'smooth' }) : onNav?.('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: 0 }}>
            <div className="jnav__logo-mark">J</div>
            Jumla Shipping
          </button>
          <div className="jnav__right" style={{ marginLeft: 'auto' }}>
            {status === 'loading' ? null : user ? (
              <>
                <button className="jnav__signin" onClick={() => onNav?.(dashHref)}>
                  Mon espace
                </button>
                <button className="jbtn-nav" onClick={() => onNav?.(dashHref)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--brand-500)', color: '#fff',
                    fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{initials}</div>
                  {user.name?.split(' ')[0]}
                </button>
              </>
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
              <div className="jfoot__brand-mark">J</div>
              Jumla Shipping
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
