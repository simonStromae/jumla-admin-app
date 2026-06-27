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
  const { logoUrl, logoIconUrl, logoHeight } = useCompanyAssets();
  const t = useT();
  const fc = content?.footer ?? {};
  const cols = [
    { l: fc.col1Title ?? t('footer.cols.services'), items: [t('footer.links.airFreight'), t('footer.links.homeDelivery'), t('footer.links.warehousePickup'), t('footer.links.tracking')] },
    { l: fc.col2Title ?? t('footer.cols.company'), items: [t('footer.links.about'), t('footer.links.blog'), t('footer.links.careers'), t('footer.links.contact')] },
    { l: fc.col3Title ?? t('footer.cols.legal'), items: [t('footer.links.tos'), t('footer.links.privacy'), t('footer.links.cookies'), t('footer.links.faq')] },
  ];
  return (
    <footer className="jfoot" id="jfoot">
      <div className="jc">
        <div className="jfoot__grid">
          <div>
            <div className="jfoot__brand">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" style={{ height: logoHeight, maxWidth: 200, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
              ) : (
                <>
                  <div className="jfoot__brand-mark" style={{ background: 'none', fontSize: 0 }}>
                    <svg width="34" height="34" viewBox="0 0 48 48" fill="none">
                      <defs><linearGradient id="ftlg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#00B4D8"/><stop offset="100%" stopColor="#1B4FD8"/></linearGradient></defs>
                      <path d="M8 8 C8 6 10 4 12 5 L38 20 C40 21 40 27 38 28 L12 43 C10 44 8 42 8 40 Z" fill="url(#ftlg)"/>
                    </svg>
                  </div>
                  <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800, letterSpacing: '.03em', textTransform: 'uppercase', background: 'linear-gradient(90deg,#00B4D8,#1B4FD8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>JUMLA</span>
                  <span style={{ fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,.6)' }}>Shipping</span>
                </>
              )}
            </div>
            <p className="jfoot__desc">
              {fc.description ?? t('footer.description')}
            </p>
          </div>
          {cols.map(c => (
            <div key={c.l}>
              <div className="jfoot__col-title">{c.l}</div>
              <div className="jfoot__col">
                {c.items.map(item => <a key={item} href="#">{item}</a>)}
              </div>
            </div>
          ))}
        </div>
        <div className="jfoot__bottom">
          <span>{fc.copyright ?? t('footer.copyright')}</span>
          <span>{fc.offices ?? t('footer.offices')}</span>
        </div>
      </div>
    </footer>
  );
}
