'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import I from '../components/Icons.jsx';
import { ROUTES, PARCEL_CATEGORIES, getRoute } from '../data.js';
import { TopBar, SiteNav, SiteFooter } from './SiteLayout.jsx';
import '@/src/styles/client-omega.css';

const DEFAULT_CONTENT = {
  hero: {
    eyebrow:  'Spécialiste du fret aérien · Douala → Montréal',
    line1:    'Chaque colis,',
    line2:    'livré de Douala',
    line3:    'à Montréal',
    subtitle: 'Réservez en ligne, déposez vos colis à Douala — votre destinataire les reçoit à Montréal en 14 jours. Suivi en temps réel et notification WhatsApp à chaque étape.',
    stats: [
      { value: '14 jours', label: 'Transit moyen' },
      { value: '12 000+',  label: 'Colis livrés' },
      { value: '98%',      label: 'Taux de succès' },
    ],
  },
  services: [
    { title: 'Fret aérien express',   description: 'Transport direct Douala → Montréal via nos partenaires certifiés (Air France Cargo, Ethiopian Airlines). Délai garanti 14 jours porte à porte.' },
    { title: 'Livraison à domicile',  description: 'Votre destinataire reçoit son colis directement chez lui, partout au Québec. Créneau sur rendez-vous, signature requise, paiement à la porte.' },
    { title: 'Suivi en temps réel',   description: 'Notifications WhatsApp & SMS automatiques à chaque étape — prise en charge, départ, transit, arrivée, livraison. Expéditeur et destinataire toujours informés.' },
  ],
  features: [
    { title: 'Vérification article par article',           description: "Chaque colis est photographié et listé sur un bordereau signé au départ. À l'arrivée à Montréal, nos agents vérifient chaque article. En cas d'écart, vous êtes alertés immédiatement par WhatsApp." },
    { title: 'Réseau de partenaires aériens fiables',      description: 'Air France Cargo, Ethiopian Airlines, Turkish Cargo — nous choisissons les rotations les plus régulières pour garantir la ponctualité de vos livraisons quelles que soient les saisons.' },
    { title: 'Notifications automatiques à chaque étape', description: "Dès la prise en charge jusqu'à la remise finale : vous et votre destinataire recevez une notification WhatsApp à chaque changement de statut. Aucune démarche nécessaire de votre côté." },
    { title: 'Paiement flexible à la livraison',           description: 'Interac, virement bancaire, Mobile Money (Orange Money, MTN) ou espèces — choisissez le mode qui vous convient. Aucun frais caché, devis instantané avec notre simulateur.' },
    { title: 'Couverture dans tout le Canada',             description: "Livraison à domicile dans tout le Québec ou retrait à notre entrepôt de Montréal. Nous desservons également Toronto, Ottawa et Vancouver sur commande groupée." },
  ],
  faq: [
    { question: 'Combien de temps dure un envoi Douala → Montréal ?', answer: 'Le transit moyen est de 14 jours porte à porte. Vous recevez une estimation précise dès la réservation, puis des notifications WhatsApp à chaque étape du voyage.' },
    { question: 'Comment est calculé le prix ?', answer: "Le tarif est au kilo avec une grille par tranche (0–5 kg, 5–10 kg, 10–25 kg…). Certaines catégories appliquent un supplément : fragile +8%, électronique +5%. Les documents bénéficient d'une réduction de 10%. Utilisez notre simulateur pour un devis instantané." },
    { question: "Comment est vérifié le contenu à l'arrivée ?", answer: "Chaque article est photographié et listé sur un bordereau au départ. À l'arrivée à Montréal, nos agents vérifient article par article. En cas d'écart, vous êtes alertés immédiatement par WhatsApp." },
    { question: 'Que puis-je envoyer ?', answer: 'Vêtements, denrées alimentaires sèches, électronique, cosmétiques, documents, mobilier léger. Les produits dangereux, liquides et marchandises prohibées au transport aérien sont exclus.' },
    { question: 'Comment mon destinataire récupère-t-il le colis ?', answer: "Au choix : livraison à domicile partout au Québec (créneau sur rendez-vous, signature requise) ou retrait à notre entrepôt de Montréal. Paiement à la livraison — Interac, virement, espèces ou Mobile Money." },
    { question: "Peut-on envoyer depuis d'autres villes ?", answer: "Nous opérons principalement depuis Douala. Nous avons également des routes depuis Lagos (Nigeria) et vers Bruxelles. Contactez-nous pour un devis personnalisé sur d'autres origines." },
  ],
  cta: {
    line1:    'Envoyez votre',
    line2:    'premier colis',
    line3:    "aujourd'hui",
    subtitle: "Rejoignez 2 500+ clients qui font confiance à Jumla Shipping pour leurs envois entre l'Afrique et le Canada.",
  },
};

function useLandingContent() {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  useEffect(() => {
    fetch('/api/public/config').then(r => r.json()).then(d => {
      if (d.landingContent) {
        setContent(c => ({
          hero:     { ...c.hero,     ...d.landingContent.hero },
          services: d.landingContent.services ?? c.services,
          features: d.landingContent.features ?? c.features,
          faq:      d.landingContent.faq      ?? c.faq,
          cta:      { ...c.cta,      ...d.landingContent.cta },
        }));
      }
    }).catch(() => {});
  }, []);
  return content;
}

const IMGS = {
  hero:    'https://images.pexels.com/photos/46148/aircraft-jet-landing-cloud-46148.jpeg?auto=compress&cs=tinysrgb&w=1600',
  cargo:   'https://images.pexels.com/photos/2026324/pexels-photo-2026324.jpeg?auto=compress&cs=tinysrgb&w=1600',
  airport: 'https://images.pexels.com/photos/358319/pexels-photo-358319.jpeg?auto=compress&cs=tinysrgb&w=1600',
};

/* ─── Hero split layout ─── */
function JHero({ onBook, onNav, content }) {
  const [code, setCode] = useState('');
  const h = content.hero;

  const handleTrack = (e) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c) onNav?.('/suivi?code=' + encodeURIComponent(c));
  };

  return (
    <section className="jhero2">
      <div className="jc">
        <div className="jhero2__grid">

          {/* Left — headline */}
          <div className="jhero2__left">
            <div className="jhero2__eyebrow">
              <span className="jhero2__eyebrow-dot" />
              {h.eyebrow}
            </div>
            <h1 className="jhero2__title">
              {h.line1}<br />
              {h.line2.includes('Douala')
                ? <>{h.line2.split('Douala')[0]}<span className="cy">Douala</span>{h.line2.split('Douala')[1]}</>
                : h.line2}<br />
              {h.line3.includes('Montréal')
                ? <>{h.line3.split('Montréal')[0]}<span className="cy">Montréal</span>{h.line3.split('Montréal')[1]}</>
                : <span className="cy">{h.line3}</span>}
            </h1>
            <p className="jhero2__sub">{h.subtitle}</p>
            <div className="jhero2__btns">
              <button className="jhero2__btn-primary" onClick={onBook}>
                Réserver un envoi
              </button>
              <button className="jhero2__btn-ghost" onClick={() => document.getElementById('jest')?.scrollIntoView({ behavior: 'smooth' })}>
                Calculer mon tarif →
              </button>
            </div>
            <div className="jhero2__stats">
              {h.stats.map(({ value: n, label: l }, i) => (
                <div key={l} className="jhero2__stat">
                  {i > 0 && <div className="jhero2__stat-sep" />}
                  <div className="jhero2__stat-n">{n}</div>
                  <div className="jhero2__stat-l">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — tracking card */}
          <div className="jhero2__right">
            <div className="jhero2__card">
              <div className="jhero2__card-header">
                <div className="jhero2__card-icon">
                  <I.Search style={{ width: 16, height: 16 }} />
                </div>
                <span className="jhero2__card-title">Suivre mon colis</span>
              </div>

              <form onSubmit={handleTrack}>
                <label className="jhero2__card-label">Numéro de suivi</label>
                <input
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="JMS-12345"
                  className="jhero2__card-input"
                />
                <button type="submit" className="jhero2__card-btn">
                  Suivre mon colis →
                </button>
              </form>

              <div className="jhero2__card-divider" />

              <div className="jhero2__card-route">
                <div className="jhero2__card-city">
                  <div className="jhero2__card-city-label">Départ</div>
                  <div className="jhero2__card-city-name">DOUALA</div>
                  <div className="jhero2__card-city-sub">DLA · Cameroun</div>
                </div>
                <div className="jhero2__card-plane">
                  <I.Plane style={{ width: 20, height: 20, color: '#00B4D8' }} />
                </div>
                <div className="jhero2__card-city" style={{ textAlign: 'right' }}>
                  <div className="jhero2__card-city-label">Arrivée</div>
                  <div className="jhero2__card-city-name">MONTRÉAL</div>
                  <div className="jhero2__card-city-sub">YUL · Canada</div>
                </div>
              </div>

              <div className="jhero2__card-badge">
                <span className="jhero2__card-badge-dot" />
                Transit 14 jours · Notification WhatsApp incluse
              </div>
            </div>

            <div className="jhero2__card-book">
              Pas encore client ?{' '}
              <button onClick={onBook} className="jhero2__card-book-link">
                Créer un envoi maintenant
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

const SVC_ICONS = [I.Plane, I.Box, I.Search];

/* ─── Services 3-column text grid ─── */
function JServices({ onBook, content }) {
  const svcs = content.services.map((s, i) => ({
    Icon: SVC_ICONS[i] ?? I.Box,
    num: `0${i + 1}`,
    t: s.title,
    d: s.description,
  }));

  return (
    <section className="jsvc3" id="jsvc">
      <div className="jc">
        <div className="jsvc3__head">
          <div className="jsvc3__eyebrow">Ce que nous proposons</div>
          <h2 className="jsvc3__title">
            Nos <span className="cy">services</span>
          </h2>
          <p className="jsvc3__subtitle">
            Un seul interlocuteur de Douala jusqu'au Canada. Transparence totale, zéro mauvaise surprise.
          </p>
        </div>
        <div className="jsvc3__grid">
          {svcs.map(({ Icon, num, t, d }) => (
            <div key={t} className="jsvc3__item">
              <div className="jsvc3__item-top">
                <div className="jsvc3__num">{num}</div>
                <div className="jsvc3__icon-wrap">
                  <Icon style={{ width: 24, height: 24 }} />
                </div>
              </div>
              <h3 className="jsvc3__item-title">{t}</h3>
              <p className="jsvc3__item-desc">{d}</p>
              <button className="jsvc3__more" onClick={onBook}>En savoir plus →</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Features accordion ─── */
function JFeats({ onBook, content }) {
  const [open, setOpen] = useState(0);
  const feats = content.features.map(f => ({ t: f.title, d: f.description }));

  return (
    <section className="jfeats3" id="jabout">
      <div className="jc">
        <div className="jfeats3__grid">

          {/* Left */}
          <div className="jfeats3__left">
            <div className="jfeats3__eyebrow">Pourquoi Jumla</div>
            <h2 className="jfeats3__title">
              Un service conçu pour<br />
              la <span className="cy">diaspora africaine</span>
            </h2>
            <p className="jfeats3__body">
              Depuis 2021, nous connectons les familles entre l'Afrique et le Canada grâce à un service
              de fret aérien simple, transparent et fiable.
            </p>
            <button className="jfeats3__btn" onClick={onBook}>
              Réserver maintenant <I.ArrowRight style={{ width: 15, height: 15 }} />
            </button>
            <div className="jfeats3__stats">
              {[{ n: '2 500+', l: 'Clients fidèles' }, { n: '4', l: 'Routes actives' }, { n: '22', l: 'Cargaisons / an' }].map(({ n, l }) => (
                <div key={l} className="jfeats3__stat">
                  <div className="jfeats3__stat-n">{n}</div>
                  <div className="jfeats3__stat-l">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — accordion */}
          <div className="jfeats3__right">
            {feats.map((f, i) => (
              <div key={i} className={'jfeats3__item' + (open === i ? ' is-open' : '')}
                onClick={() => setOpen(open === i ? -1 : i)}>
                <div className="jfeats3__item-head">
                  <span className="jfeats3__item-num">0{i + 1}</span>
                  <span className="jfeats3__item-title">{f.t}</span>
                  <span className="jfeats3__item-ic">{open === i ? '−' : '+'}</span>
                </div>
                {open === i && <div className="jfeats3__item-body">{f.d}</div>}
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}

/* ─── Estimator ─── */
function JEstimator({ onBook }) {
  const cats = PARCEL_CATEGORIES;
  const routes = ROUTES.filter(r => r.active);
  const [routeId, setRouteId] = useState(routes[0]?.id || 'r-dla-yul');
  const [lines, setLines] = useState([{ id: 1, cat: 'standard', weight: 12 }]);

  const r = getRoute(routeId) || routes[0];
  const tierFor = (w) => r.pricing.find(p => w > p.from && w <= p.to) || r.pricing[r.pricing.length - 1];
  const calc = (ln) => {
    const tier = tierFor(+ln.weight || 0);
    const base = Math.round((+ln.weight || 0) * tier.rate);
    const cat = cats.find(c => c.id === ln.cat) || cats[0];
    const surcharge = Math.round(base * cat.pct / 100);
    return { tier, base, cat, surcharge, total: base + surcharge };
  };
  const computed = lines.map(calc);
  const grandTotal = computed.reduce((a, c) => a + c.total, 0);
  const totalWeight = lines.reduce((a, l) => a + (+l.weight || 0), 0);

  const addLine = () => setLines([...lines, { id: Date.now(), cat: 'standard', weight: 5 }]);
  const removeLine = (id) => setLines(lines.length > 1 ? lines.filter(l => l.id !== id) : lines);
  const updLine = (id, k, v) => setLines(lines.map(l => l.id === id ? { ...l, [k]: v } : l));

  return (
    <section className="jest-wrap" id="jest">
      <div className="jc">
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="jsvc3__eyebrow" style={{ display: 'block', marginBottom: 10 }}>Simulateur de prix</div>
          <h2 style={{ fontFamily: "'Barlow', 'Helvetica Neue', Arial, sans-serif", fontSize: '36px', color: 'var(--ink-900)', fontWeight: 700, letterSpacing: '-.03em' }}>
            Combien coûte mon envoi ?
          </h2>
          <p style={{ fontSize: 15, color: 'var(--ink-400)', marginTop: 12, lineHeight: 1.65, maxWidth: 440, margin: '12px auto 0' }}>
            Calculez en quelques secondes. Sans inscription, sans engagement.
          </p>
        </div>
        <div className="jest">
          <div className="jest__head">
            <I.Calculator style={{ width: 16, height: 16, color: 'var(--brand-400)' }} />
            <span className="jest__title">Estimateur d'envoi</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink-400)' }}>Ajoutez autant d'articles que nécessaire</span>
          </div>
          <div className="jest__route">
            <div className="jest__f">
              <label>Départ</label>
              <select value={routeId} onChange={e => setRouteId(e.target.value)}>
                {routes.map(rr => <option key={rr.id} value={rr.id}>{rr.fromCity} ({rr.fromIATA})</option>)}
              </select>
            </div>
            <I.ArrowRight style={{ width: 18, height: 18, color: 'var(--ink-300)', alignSelf: 'flex-end', marginBottom: 11 }} />
            <div className="jest__f">
              <label>Destination</label>
              <select>{routes.map(rr => <option key={rr.id}>{rr.toCity} ({rr.toIATA})</option>)}</select>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ alignSelf: 'flex-end', marginBottom: 11, fontSize: 13, color: 'var(--ink-400)' }}>
              Transit <strong style={{ color: 'var(--ink-900)' }}>{r?.transitDays} j</strong>
              {' · '}Tarif en <strong style={{ color: 'var(--ink-900)' }}>{r?.currency}</strong>
            </div>
          </div>
          <div className="jest__lines">
            <div className="jest__lhead">
              <span>Catégorie</span><span>Poids (kg)</span>
              <span style={{ textAlign: 'right' }}>Base</span>
              <span style={{ textAlign: 'right' }}>Supplément</span>
              <span style={{ textAlign: 'right' }}>Sous-total</span>
              <span />
            </div>
            {lines.map((ln, i) => {
              const c = computed[i];
              return (
                <div className="jest__line" key={ln.id}>
                  <div className="jest__f">
                    <select value={ln.cat} onChange={e => updLine(ln.id, 'cat', e.target.value)}>
                      {cats.map(ct => <option key={ct.id} value={ct.id}>{ct.icon} {ct.label} ({ct.pct > 0 ? '+' : ''}{ct.pct}%)</option>)}
                    </select>
                  </div>
                  <div className="jest__f">
                    <input type="number" min="0.5" step="0.5" value={ln.weight} onChange={e => updLine(ln.id, 'weight', e.target.value)} />
                  </div>
                  <div className="jest__cell" style={{ textAlign: 'right' }}>
                    {c.base} <span className="jest__cur">{r?.currency}</span>
                    <div className="jest__tier">{c.tier.from}–{c.tier.to}kg · {c.tier.rate}/kg</div>
                  </div>
                  <div className="jest__cell" style={{ textAlign: 'right', color: c.surcharge > 0 ? 'var(--brand-600)' : c.surcharge < 0 ? '#059669' : 'var(--ink-300)' }}>
                    {c.surcharge > 0 ? '+' : ''}{c.surcharge} <span className="jest__cur">{r?.currency}</span>
                    <div className="jest__tier">{c.cat.label} {c.cat.pct > 0 ? '+' : ''}{c.cat.pct}%</div>
                  </div>
                  <div className="jest__cell" style={{ fontWeight: 800, color: 'var(--ink-900)', textAlign: 'right' }}>
                    {c.total} <span className="jest__cur">{r?.currency}</span>
                  </div>
                  <button className="jest__del" onClick={() => removeLine(ln.id)} disabled={lines.length <= 1}>
                    <I.Trash style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              );
            })}
            <button className="jest__add" onClick={addLine}>
              <I.Plus style={{ width: 14, height: 14 }} /> Ajouter un article
            </button>
          </div>
          <div className="jest__res">
            <div>
              <div className="jest__total-label">
                {lines.length} article{lines.length > 1 ? 's' : ''} · {totalWeight} kg · {r?.fromIATA} → {r?.toIATA}
              </div>
              <span className="jest__total-n">{grandTotal}</span>
              <span className="jest__total-cur">{r?.currency}</span>
            </div>
            <button className="jbtn-nav" style={{ marginLeft: 'auto' }} onClick={onBook}>
              Réserver cet envoi <I.ArrowRight style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
function JFAQ({ content }) {
  const faqs = content.faq.map(f => ({ q: f.question, a: f.answer }));
  const [open, setOpen] = useState(0);
  return (
    <section style={{ padding: '96px 0', background: 'var(--bg-soft)' }} id="jfaq">
      <div className="jc">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 72, alignItems: 'start' }}>
          <div>
            <div className="jsvc3__eyebrow" style={{ display: 'block', marginBottom: 12 }}>FAQ</div>
            <h2 style={{ fontFamily: "'Barlow', 'Helvetica Neue', Arial, sans-serif", fontSize: '36px', fontWeight: 700, letterSpacing: '-.03em', color: 'var(--ink-900)', marginBottom: 16 }}>
              Questions fréquentes
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--ink-400)' }}>
              Une autre question ? WhatsApp nous répond en moins d'une heure.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, color: '#25D366', fontWeight: 600, marginTop: 20 }}>
              <I.Whatsapp style={{ width: 18, height: 18 }} /> Écrire sur WhatsApp
            </div>
          </div>
          <div className="jfaq">
            {faqs.map((f, i) => (
              <div key={i} className={'jfaq__item' + (open === i ? ' is-open' : '')}>
                <button className="jfaq__q" onClick={() => setOpen(open === i ? -1 : i)}>
                  <span>{f.q}</span>
                  <span className="jfaq__ic">
                    {open === i ? <I.ChevronUp style={{ width: 18, height: 18 }} /> : <I.ChevronDown style={{ width: 18, height: 18 }} />}
                  </span>
                </button>
                {open === i && <div className="jfaq__a">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── CTA with photo ─── */
function JCTA({ onBook, content }) {
  const c = content.cta;
  return (
    <section className="jcta3">
      <img className="jcta3__bg" src={IMGS.cargo} alt="" />
      <div className="jcta3__overlay" />
      <div className="jc" style={{ position: 'relative', zIndex: 2, height: '100%' }}>
        <div className="jcta3__grid">

          {/* Left */}
          <div className="jcta3__left">
            <div className="jcta3__eyebrow">Prêt à commencer ?</div>
            <h2 className="jcta3__title">
              {c.line1}<br />
              {c.line2}<br />
              <span style={{ color: '#00B4D8' }}>{c.line3}</span>
            </h2>
            <p className="jcta3__sub">{c.subtitle}</p>
            <button className="jcta3__btn" onClick={onBook}>
              Réserver un envoi <I.ArrowRight style={{ width: 17, height: 17 }} />
            </button>
          </div>

          {/* Right — floating card */}
          <div className="jcta3__card">
            <div className="jcta3__card-title">Pourquoi Jumla ?</div>
            <div className="jcta3__items">
              {[
                'Transit garanti 14 jours',
                'Suivi WhatsApp à chaque étape',
                'Vérification article par article',
                'Livraison à domicile au Canada',
                'Paiement flexible à la livraison',
              ].map(t => (
                <div key={t} className="jcta3__item">
                  <span className="jcta3__check">✓</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
            <div className="jcta3__card-footer">
              <div style={{ fontSize: 12, color: 'var(--ink-400)', marginBottom: 8 }}>Une question ?</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, color: '#25D366', fontWeight: 700 }}>
                <I.Whatsapp style={{ width: 18, height: 18 }} /> WhatsApp · Réponse en 1h
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

/* ─── Root ─── */
export default function LandingPage({ onNav }) {
  const { data: session } = useSession();
  const role    = session?.user?.role;
  const content = useLandingContent();

  const onBook = () => {
    if (!onNav) return;
    if (session && (role === 'client' || !role)) {
      onNav('/client/booking');
    } else if (session && (role === 'admin' || role === 'agent')) {
      onNav('/admin');
    } else {
      onNav('/login');
    }
  };

  return (
    <div className="jpage">
      <TopBar />
      <SiteNav onNav={onNav} onBook={onBook} mode="landing" />
      <JHero onBook={onBook} onNav={onNav} content={content} />
      <JServices onBook={onBook} content={content} />
      <JFeats onBook={onBook} content={content} />
      <JEstimator onBook={onBook} />
      <JFAQ content={content} />
      <JCTA onBook={onBook} content={content} />
      <SiteFooter />
    </div>
  );
}
