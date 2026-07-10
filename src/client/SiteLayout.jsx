'use client';
import { useState, useEffect, useRef } from 'react';
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
            <a href="mailto:info@jumlas.com" className="jtop-bar__item" style={{ textDecoration:'none', color:'inherit' }}>
              <I.Send style={{ width: 13, height: 13 }} />
              info@jumlas.com
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

const POLICY_LINKS = [
  { label: 'CGU',                          href: '/cgu' },
  { label: 'CGV',                          href: '/cgv' },
  { label: 'Politique de réclamation',     href: '/politique-de-reclamation' },
  { label: 'Déclaration objets de valeur', href: '/declaration-objets-valeur' },
  { label: 'Politique de confidentialité', href: '/politique-de-confidentialite' },
  { label: 'Cookies',                      href: '/cookies' },
];

const NAV_LINKS = [
  { label: 'Besoin d\'aide ?',  href: '/faq' },
  { label: 'Suivre mon colis', href: '/suivi' },
  { label: 'Nos politiques',   href: null, dropdown: POLICY_LINKS },
];

/* ─── Desktop policies dropdown ─── */
function PoliciesDropdown({ isLanding, onNav }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`jnav__link${isLanding ? ' jnav__link--landing' : ''}`}
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}
      >
        Nos politiques
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
          style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
          background: 'white', border: '1.5px solid var(--border)',
          borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,.13)',
          padding: '6px 0', minWidth: 230, zIndex: 200,
        }}>
          {POLICY_LINKS.map(lk => (
            <a key={lk.href} href={lk.href}
              onClick={(e) => { e.preventDefault(); setOpen(false); onNav?.(lk.href); }}
              style={{ display: 'block', padding: '9px 16px', fontSize: 13.5, color: 'var(--ink-700)', textDecoration: 'none', fontWeight: 500 }}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--brand-50)'; e.currentTarget.style.color = 'var(--brand-700)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-700)'; }}
            >
              {lk.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Mobile menu drawer ─── */
function MobileMenu({ open, onClose, onNav, onBook, isPublic, user, dashHref, t }) {
  const [policiesOpen, setPoliciesOpen] = useState(false);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const go = (href) => { onClose(); onNav?.(href); };

  return (
    <div className={`jnav-mobile${open ? ' is-open' : ''}`}>
      <div className="jnav-mobile__backdrop" onClick={onClose} />
      <div className="jnav-mobile__panel">
        <button className="jnav-mobile__close" onClick={onClose}>✕</button>

        {/* Logo */}
        <div className="jnav-mobile__logo" style={{ marginBottom: 28 }}>
          <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
            <defs><linearGradient id="mmlg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#00B4D8"/><stop offset="100%" stopColor="#1B4FD8"/></linearGradient></defs>
            <path d="M8 8 C8 6 10 4 12 5 L38 20 C40 21 40 27 38 28 L12 43 C10 44 8 42 8 40 Z" fill="url(#mmlg)"/>
          </svg>
          <span style={{ fontWeight: 800, letterSpacing: '.03em', textTransform: 'uppercase', background: 'linear-gradient(90deg,#00B4D8,#1B4FD8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>JUMLA</span>
        </div>

        {/* Nav links */}
        <a className="jnav-mobile__link" href="/faq" onClick={(e) => { e.preventDefault(); go('/faq'); }}>
          Besoin d'aide ?
        </a>
        <a className="jnav-mobile__link" href="/suivi" onClick={(e) => { e.preventDefault(); go('/suivi'); }}>
          Suivre mon colis
        </a>

        {/* Policies accordion */}
        <button className="jnav-mobile__link" onClick={() => setPoliciesOpen(o => !o)}>
          Nos politiques
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none"
            style={{ transition: 'transform .2s', transform: policiesOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {policiesOpen && (
          <div className="jnav-mobile__sub">
            {POLICY_LINKS.map(lk => (
              <a key={lk.href} href={lk.href} onClick={(e) => { e.preventDefault(); go(lk.href); }}>
                {lk.label}
              </a>
            ))}
          </div>
        )}

        {/* CTA buttons */}
        <div className="jnav-mobile__btns">
          {user ? (
            <button className="jbtn-nav" onClick={() => go(dashHref)}>
              Mon espace
            </button>
          ) : (
            <>
              <button className="jbtn-nav jbtn-nav--secondary" onClick={() => go('/login')}>
                {t('nav.signIn')}
              </button>
              {isPublic && (
                <button className="jbtn-nav" onClick={() => { onClose(); onBook?.(); }}>
                  Réserver
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Nav ─── */
export function SiteNav({ onNav, onBook, mode = 'landing' }) {
  const { data: session, status } = useSession();
  const { logoUrl, logoHeight } = useCompanyAssets();
  const t = useT();
  const user = session?.user;
  const role = user?.role;
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (mode !== 'landing') return;
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [mode]);

  const dashHref = role === 'admin' || role === 'agent' ? '/admin' : '/client/dashboard';
  const initials = user?.name
    ? user.name.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const isLanding = mode === 'landing';
  const isPublic  = mode === 'landing' || mode === 'public';
  const navClass  = isLanding
    ? `jnav jnav--landing${scrolled ? ' jnav--scrolled' : ''}`
    : 'jnav';

  const burgerColor = isLanding && !scrolled ? 'white' : 'var(--ink-800)';

  const handleNav = (e, href) => {
    if (!href) return;
    if (href.startsWith('#')) {
      e.preventDefault();
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      e.preventDefault();
      onNav?.(href);
    }
  };

  return (
    <>
      <div className={navClass}>
        <div className="jc">
          <div className="jnav__inner">
            {/* Logo */}
            <button className="jnav__logo" onClick={() => isLanding ? window.scrollTo({ top: 0, behavior: 'smooth' }) : onNav?.('/')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: 0 }}>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" style={{ height: logoHeight, maxWidth: 200, objectFit: 'contain', ...(isLanding && !scrolled ? { filter: 'brightness(0) invert(1)' } : {}) }} />
              ) : (
                <>
                  <div style={{ width: 34, height: 34, fontSize: 0 }}>
                    <svg width="34" height="34" viewBox="0 0 48 48" fill="none">
                      <defs><linearGradient id="navlg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#00B4D8"/><stop offset="100%" stopColor="#1B4FD8"/></linearGradient></defs>
                      <path d="M8 8 C8 6 10 4 12 5 L38 20 C40 21 40 27 38 28 L12 43 C10 44 8 42 8 40 Z" fill="url(#navlg)"/>
                    </svg>
                  </div>
                  <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800, letterSpacing: '.03em', textTransform: 'uppercase', background: 'linear-gradient(90deg,#00B4D8,#1B4FD8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>JUMLA</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: isLanding ? 'rgba(255,255,255,.55)' : 'var(--ink-500)', letterSpacing: 0, textTransform: 'none' }}>Shipping</span>
                </>
              )}
            </button>

            {/* Center nav — desktop */}
            <nav className="jnav__links jnav__links--center">
              {NAV_LINKS.map(lk =>
                lk.dropdown ? (
                  <PoliciesDropdown key={lk.label} isLanding={isLanding} onNav={onNav} />
                ) : (
                  <a key={lk.label} href={lk.href}
                    className={`jnav__link${isLanding ? ' jnav__link--landing' : ''}`}
                    onClick={(e) => handleNav(e, lk.href)}>
                    {lk.label}
                  </a>
                )
              )}
            </nav>

            {/* Right */}
            <div className="jnav__right" style={{ marginLeft: 'auto' }}>
              <LanguageSwitcher dark={isLanding && !scrolled} />

              {status !== 'loading' && (
                <>
                  {user ? (
                    <button onClick={() => onNav?.(dashHref)} style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'var(--brand-500)', color: '#fff',
                      fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{initials}</button>
                  ) : (
                    <>
                      <button className="jbtn-nav jbtn-nav--secondary" onClick={() => onNav?.('/login')}>
                        {t('nav.signIn')}
                      </button>
                      {isPublic && (
                        <button className="jbtn-nav" onClick={onBook}>Réserver</button>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Hamburger — mobile only */}
              <button className="jnav__burger" onClick={() => setMenuOpen(true)}
                style={{ color: burgerColor }} aria-label="Menu">
                <span /><span /><span />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNav={onNav}
        onBook={onBook}
        isPublic={isPublic}
        user={user}
        dashHref={dashHref}
        t={t}
      />
    </>
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
    { label: 'Besoin d\'aide ?',   href: '/faq' },
    { label: 'Suivre mon colis',   href: '/suivi' },
    { label: 'Contact',            href: '/contact' },
    { label: 'Réserver',           href: '/login' },
  ],
  col2: [
    { label: 'CGU',                          href: '/cgu' },
    { label: 'CGV',                          href: '/cgv' },
    { label: 'Politique de réclamation',     href: '/politique-de-reclamation' },
    { label: 'Déclaration objets de valeur', href: '/declaration-objets-valeur' },
    { label: 'Politique de confidentialité', href: '/politique-de-confidentialite' },
    { label: 'Cookies',                      href: '/cookies' },
  ],
};

export function SiteFooter({ content }) {
  const { logoUrl, logoHeight } = useCompanyAssets();
  const t = useT();
  const fc = content?.footer ?? {};

  const col1Links = DEFAULT_COL_LINKS.col1;
  const col2Links = DEFAULT_COL_LINKS.col2;
  const cols = [
    { title: 'Navigation',  links: col1Links },
    { title: 'Politiques', links: col2Links },
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
              <a href="mailto:info@jumlas.com"
                style={{ display:'inline-flex', alignItems:'center', gap:7, fontSize:12.5, color:'rgba(255,255,255,.6)', textDecoration:'none' }}>
                <I.Send style={{ width:13, height:13 }} />
                info@jumlas.com
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
