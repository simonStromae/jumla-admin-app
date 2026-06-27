'use client';
import { useSession } from 'next-auth/react';
import I from '../components/Icons.jsx';
import { useCompanyAssets } from '../lib/useCompanyAssets.js';
import { useT } from '@/src/lib/i18n';
import LanguageSwitcher from '@/src/components/LanguageSwitcher.jsx';

/* ─── Top info bar ─── */
export function TopBar() {
  const t = useT();
  return (
    <div className="jtop-bar">
      <div className="jc">
        <div className="jtop-bar__inner">
          <div className="jtop-bar__left">
            <span className="jtop-bar__item">
              <I.Calendar style={{ width: 13, height: 13 }} />
              {t('topbar.hours')}
            </span>
            <span className="jtop-bar__item">
              <I.Send style={{ width: 13, height: 13 }} />
              contact@jumla.cargo
            </span>
          </div>
          <div className="jtop-bar__right">
            <span className="jtop-bar__item">
              <I.Phone style={{ width: 13, height: 13 }} />
              {t('topbar.availability')}
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
  const { logoUrl, logoIconUrl, logoHeight } = useCompanyAssets();
  const t = useT();
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
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ height: logoHeight, maxWidth: 200, objectFit: 'contain' }} />
            ) : (
              <>
                <div className="jnav__logo-mark" style={{ background: 'none', fontSize: 0 }}>
                  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
                    <defs><linearGradient id="navlg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#00B4D8"/><stop offset="100%" stopColor="#1B4FD8"/></linearGradient></defs>
                    <path d="M8 8 C8 6 10 4 12 5 L38 20 C40 21 40 27 38 28 L12 43 C10 44 8 42 8 40 Z" fill="url(#navlg)"/>
                  </svg>
                </div>
                <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800, letterSpacing: '.03em', textTransform: 'uppercase', background: 'linear-gradient(90deg,#00B4D8,#1B4FD8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>JUMLA</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-500)', letterSpacing: 0, textTransform: 'none' }}>Shipping</span>
              </>
            )}
          </button>
          <div className="jnav__right" style={{ marginLeft: 'auto' }}>
            {status === 'loading' ? null : user ? (
              <>
                <button onClick={() => onNav?.(dashHref)} style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--brand-500)', color: '#fff',
                  fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{initials}</button>
                <LanguageSwitcher />
              </>
            ) : (
              <>
                <LanguageSwitcher />
                <button className="jbtn-nav" onClick={() => onNav?.('/login')}>{t('nav.signIn')} <I.ArrowRight style={{ width: 15, height: 15 }} /></button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Footer ─── */
export function SiteFooter({ content }) {
  const t = useT();
  const fc = content?.footer ?? {};
  return (
    <footer className="jfoot2" id="jfoot">
      <div className="jc">

        {/* Info row */}
        <div className="jfoot2__top">
          <div className="jfoot2__info">
            <span className="jfoot2__label">Adresse</span>
            <span className="jfoot2__val">{fc.address ?? 'Douala, Cameroun · Montréal, Canada'}</span>
          </div>
          <div className="jfoot2__info">
            <span className="jfoot2__label">Contact</span>
            <span className="jfoot2__val">{fc.email ?? 'support@jumla.cargo'}</span>
          </div>
          <div className="jfoot2__info">
            <span className="jfoot2__label">Itinéraire</span>
            <span className="jfoot2__val">{fc.route ?? 'Afrique → Canada · Actif depuis 2020'}</span>
          </div>
        </div>

        {/* Giant brand name */}
        <div className="jfoot2__brand">JUMLA SHIPPING</div>

        {/* Bottom legal bar */}
        <div className="jfoot2__bottom">
          <span>{fc.copyright ?? t('footer.copyright')}</span>
          <div className="jfoot2__links">
            <a href="#">CGU</a>
            <a href="#">CGV</a>
            <a href="#">Politique de confidentialité</a>
            <a href="#">Cookies</a>
          </div>
          <div className="jfoot2__social">
            <a href="#" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            <a href="#" aria-label="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
              </svg>
            </a>
            <a href="#" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
              </svg>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
