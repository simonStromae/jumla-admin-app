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
            <a href="mailto:contact@jumla.cargo" className="jtop-bar__item" style={{ textDecoration:'none', color:'inherit' }}>
              <I.Send style={{ width: 13, height: 13 }} />
              contact@jumla.cargo
            </a>
          </div>
          <div className="jtop-bar__right">
            <a href="https://wa.me/15149980709" target="_blank" rel="noreferrer" className="jtop-bar__item" style={{ textDecoration:'none', color:'inherit' }}>
              <I.Phone style={{ width: 13, height: 13 }} />
              +1 514 998-0709 · WhatsApp
            </a>
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
const ANCHOR_TO_ROUTE = {
  '#jfaq':  '/faq',
  '#jfoot': '/contact',
  '#jest':  '/suivi',
};
const LABEL_TO_ROUTE = {
  'Réserver': '/login', 'Book': '/login',
  'CGU': '/cgu', 'Terms of use': '/cgu',
  'CGV': '/cgv', 'Terms of sale': '/cgv',
  'Politique de confidentialité': '/politique-de-confidentialite', 'Privacy policy': '/politique-de-confidentialite',
  'Cookies': '/cookies',
};
function normalizeLinks(links) {
  if (!links) return null;
  return links.map(lk => ({
    ...lk,
    href: ANCHOR_TO_ROUTE[lk.href]
      ?? (lk.href === '#' ? (LABEL_TO_ROUTE[lk.label] ?? lk.href) : lk.href),
  }));
}

const DEFAULT_COL_LINKS = {
  col1: [
    { label: 'Fret aérien', href: '#services' },
    { label: 'Livraison à domicile', href: '#services' },
    { label: 'Suivi de colis', href: '/suivi' },
    { label: 'Tarifs', href: '#estimator' },
  ],
  col2: [
    { label: 'À propos', href: '#features' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact', href: '/contact' },
    { label: 'Réserver', href: '/login' },
  ],
  col3: [
    { label: 'CGU', href: '/cgu' },
    { label: 'CGV', href: '/cgv' },
    { label: 'Politique de confidentialité', href: '/politique-de-confidentialite' },
    { label: 'Cookies', href: '/cookies' },
  ],
};

export function SiteFooter({ content }) {
  const { logoUrl, logoHeight } = useCompanyAssets();
  const t = useT();
  const fc = content?.footer ?? {};

  const col1Links = normalizeLinks(fc.col1Links) ?? DEFAULT_COL_LINKS.col1;
  const col2Links = normalizeLinks(fc.col2Links) ?? DEFAULT_COL_LINKS.col2;
  const col3Links = normalizeLinks(fc.col3Links) ?? DEFAULT_COL_LINKS.col3;
  const cols = [
    { title: fc.col1Title ?? t('footer.cols.services'), links: col1Links },
    { title: fc.col2Title ?? t('footer.cols.company'),  links: col2Links },
    { title: fc.col3Title ?? t('footer.cols.legal'),    links: col3Links },
  ];

  return (
    <footer className="jfoot" id="jfoot">
      <div className="jc">
        <div className="jfoot__grid">
          <div>
            <a href="/" style={{ textDecoration: 'none' }}>
              <div className="jfoot__brand">
                {logoUrl
                  ? <img src={logoUrl} alt="Logo" style={{ height: logoHeight, maxWidth: 200, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                  : <>
                      <div className="jfoot__brand-mark" style={{ background: 'none', fontSize: 0 }}>
                        <svg width="34" height="34" viewBox="0 0 48 48" fill="none">
                          <defs><linearGradient id="ftlg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#00B4D8"/><stop offset="100%" stopColor="#1B4FD8"/></linearGradient></defs>
                          <path d="M8 8 C8 6 10 4 12 5 L38 20 C40 21 40 27 38 28 L12 43 C10 44 8 42 8 40 Z" fill="url(#ftlg)"/>
                        </svg>
                      </div>
                      <span style={{ fontFamily: "'Inter',system-ui,sans-serif", fontWeight: 800, letterSpacing: '.03em', textTransform: 'uppercase', background: 'linear-gradient(90deg,#00B4D8,#1B4FD8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>JUMLA</span>
                      <span style={{ fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,.6)' }}>Shipping</span>
                    </>
                }
              </div>
            </a>
            <p className="jfoot__desc">{fc.description ?? t('footer.description')}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:16 }}>
              <a href={`mailto:${fc.email ?? 'contact@jumla.cargo'}`}
                style={{ display:'inline-flex', alignItems:'center', gap:7, fontSize:12.5, color:'rgba(255,255,255,.6)', textDecoration:'none' }}>
                <I.Send style={{ width:13, height:13 }} />
                {fc.email ?? 'contact@jumla.cargo'}
              </a>
              <a href="https://wa.me/15149980709" target="_blank" rel="noreferrer"
                style={{ display:'inline-flex', alignItems:'center', gap:7, fontSize:12.5, color:'#25D366', textDecoration:'none', fontWeight:600 }}>
                <I.Whatsapp style={{ width:14, height:14 }} />
                +1 514 998-0709 · WhatsApp
              </a>
            </div>
          </div>
          {cols.map(col => (
            <div key={col.title}>
              <div className="jfoot__col-title">{col.title}</div>
              <div className="jfoot__col">
                {col.links.map(lk => <a key={lk.label} href={lk.href}>{lk.label}</a>)}
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
