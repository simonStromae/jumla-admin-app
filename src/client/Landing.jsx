'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import I from '../components/Icons.jsx';
import { ROUTES, PARCEL_CATEGORIES, getRoute } from '../data.js';
import { TopBar, SiteNav, SiteFooter } from './SiteLayout.jsx';
import { useT, useLocale } from '@/src/lib/i18n';
import '@/src/styles/client-omega.css';

const DEFAULT_CONTENT_FR = {
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
  sectionTitles: {
    services:  { eyebrow: 'Ce que nous proposons', title: 'Nos services', subtitle: "Un seul interlocuteur de Douala jusqu'au Canada. Transparence totale, zéro mauvaise surprise." },
    features:  { eyebrow: 'Pourquoi Jumla', title1: 'Un service conçu pour', title2: 'la diaspora africaine', description: 'Depuis 2021, nous connectons les familles entre l\'Afrique et le Canada grâce à un service de fret aérien simple, transparent et fiable.' },
    estimator: { eyebrow: 'Simulateur de prix', title: 'Combien coûte mon envoi ?', subtitle: 'Calculez en quelques secondes. Sans inscription, sans engagement.' },
    faq:       { eyebrow: 'FAQ', title: 'Questions fréquentes', subtitle: 'Une autre question ? WhatsApp nous répond en moins d\'une heure.' },
  },
  trackingCard: {
    title: 'Suivre mon colis', label: 'Numéro de suivi', placeholder: 'JMS-12345', button: 'Suivre mon colis →',
    badge: 'Transit 14 jours · Notification WhatsApp incluse',
    cityFrom: 'DOUALA', cityFromSub: 'DLA · Cameroun', cityTo: 'MONTRÉAL', cityToSub: 'YUL · Canada',
    ctaText: 'Pas encore client ?', ctaLink: 'Créer un envoi maintenant',
  },
  footer: {
    description: "Spécialiste du fret aérien international entre l'Afrique et le Canada depuis 2021. Suivi, sécurité et transparence à chaque étape.",
    copyright: '© 2026 Jumla Shipping SARL — Tous droits réservés',
    offices: 'Douala · Montréal · Lagos · Bruxelles',
    col1Title: 'Services', col2Title: 'Entreprise', col3Title: 'Légal',
    email: 'contact@jumla.cargo',
  },
};

const DEFAULT_CONTENT_EN = {
  hero: {
    eyebrow:  'Air freight specialist · Douala → Montréal',
    line1:    'Every parcel,',
    line2:    'shipped from Douala',
    line3:    'to Montréal',
    subtitle: 'Book online, drop off your parcels in Douala — your recipient receives them in Montréal within 14 days. Real-time tracking and WhatsApp notification at every step.',
    stats: [
      { value: '14 days',  label: 'Average transit' },
      { value: '12,000+',  label: 'Parcels delivered' },
      { value: '98%',      label: 'Success rate' },
    ],
  },
  services: [
    { title: 'Express air freight',  description: 'Direct transport Douala → Montréal via our certified partners (Air France Cargo, Ethiopian Airlines). Guaranteed 14-day door-to-door delivery.' },
    { title: 'Home delivery',        description: 'Your recipient receives their parcel directly at home, anywhere in Quebec. Appointment-based time slot, signature required, payment at the door.' },
    { title: 'Real-time tracking',   description: 'Automatic WhatsApp & SMS notifications at every step — pickup, departure, transit, arrival, delivery. Sender and recipient always informed.' },
  ],
  features: [
    { title: 'Item-by-item verification',           description: 'Each parcel is photographed and listed on a signed manifest at departure. Upon arrival in Montréal, our agents verify each item. Any discrepancy triggers an immediate WhatsApp alert.' },
    { title: 'Reliable airline partner network',     description: 'Air France Cargo, Ethiopian Airlines, Turkish Cargo — we choose the most regular rotations to guarantee punctuality regardless of the season.' },
    { title: 'Automatic notifications at every step', description: 'From pickup to final delivery: you and your recipient receive a WhatsApp notification at every status change. No action required on your part.' },
    { title: 'Flexible payment on delivery',         description: 'Interac, bank transfer, Mobile Money (Orange Money, MTN) or cash — choose what works for you. No hidden fees, instant quote with our simulator.' },
    { title: 'Coverage across Canada',               description: 'Home delivery throughout Quebec or pickup at our Montréal warehouse. We also serve Toronto, Ottawa and Vancouver on group orders.' },
  ],
  faq: [
    { question: 'How long does a Douala → Montréal shipment take?', answer: 'The average transit is 14 days door to door. You receive a precise estimate at booking, then WhatsApp notifications at every stage of the journey.' },
    { question: 'How is the price calculated?', answer: 'The rate is per kilogram with a bracket-based grid (0–5 kg, 5–10 kg, 10–25 kg…). Some categories apply a surcharge: fragile +8%, electronics +5%. Documents get a 10% discount. Use our simulator for an instant quote.' },
    { question: 'How is the content verified on arrival?', answer: 'Each item is photographed and listed on a manifest at departure. Upon arrival in Montréal, our agents verify item by item. Any discrepancy triggers an immediate WhatsApp alert.' },
    { question: 'What can I send?', answer: 'Clothing, dry food items, electronics, cosmetics, documents, light furniture. Dangerous products, liquids and goods prohibited in air transport are excluded.' },
    { question: 'How does my recipient collect the parcel?', answer: 'Choose: home delivery anywhere in Quebec (appointment-based, signature required) or pickup at our Montréal warehouse. Payment on delivery — Interac, bank transfer, cash or Mobile Money.' },
    { question: 'Can I send from other cities?', answer: 'We primarily operate from Douala. We also have routes from Lagos (Nigeria) and to Brussels. Contact us for a custom quote from other origins.' },
  ],
  cta: {
    line1:    'Send your',
    line2:    'first parcel',
    line3:    'today',
    subtitle: 'Join 2,500+ customers who trust Jumla Shipping for their shipments between Africa and Canada.',
  },
  sectionTitles: {
    services:  { eyebrow: 'What we offer', title: 'Our services', subtitle: 'One contact from Douala to Canada. Complete transparency, zero surprises.' },
    features:  { eyebrow: 'Why Jumla', title1: 'A service built for', title2: 'the African diaspora', description: 'Since 2021, we connect families between Africa and Canada through a simple, transparent and reliable air freight service.' },
    estimator: { eyebrow: 'Price simulator', title: 'How much does my shipment cost?', subtitle: 'Calculate in seconds. No registration, no commitment.' },
    faq:       { eyebrow: 'FAQ', title: 'Frequently asked questions', subtitle: 'Another question? WhatsApp us — we reply in under an hour.' },
  },
  trackingCard: {
    title: 'Track my parcel', label: 'Tracking number', placeholder: 'JMS-12345', button: 'Track my parcel →',
    badge: '14-day transit · WhatsApp notification included',
    cityFrom: 'DOUALA', cityFromSub: 'DLA · Cameroon', cityTo: 'MONTRÉAL', cityToSub: 'YUL · Canada',
    ctaText: 'Not a customer yet?', ctaLink: 'Create a shipment now',
  },
  footer: {
    description: 'International air freight specialist between Africa and Canada since 2021. Tracking, security and transparency at every step.',
    copyright: '© 2026 Jumla Shipping SARL — All rights reserved',
    offices: 'Douala · Montréal · Lagos · Brussels',
    col1Title: 'Services', col2Title: 'Company', col3Title: 'Legal',
    email: 'contact@jumla.cargo',
  },
};

const DEFAULTS = { fr: DEFAULT_CONTENT_FR, en: DEFAULT_CONTENT_EN };

function merge(base, override) {
  if (!override) return base;
  const mergeObj = (b, o) => o ? { ...b, ...o } : b;
  return {
    hero:          mergeObj(base.hero, override.hero),
    services:      override.services ?? base.services,
    features:      override.features ?? base.features,
    faq:           override.faq      ?? base.faq,
    cta:           mergeObj(base.cta, override.cta),
    sectionTitles: override.sectionTitles ? {
      services:  mergeObj(base.sectionTitles.services,  override.sectionTitles.services),
      features:  mergeObj(base.sectionTitles.features,  override.sectionTitles.features),
      estimator: mergeObj(base.sectionTitles.estimator, override.sectionTitles.estimator),
      faq:       mergeObj(base.sectionTitles.faq,       override.sectionTitles.faq),
    } : base.sectionTitles,
    trackingCard:  mergeObj(base.trackingCard, override.trackingCard),
    footer:        mergeObj(base.footer, override.footer),
    loginSlides:   override.loginSlides ?? base.loginSlides,
  };
}

function useLandingContent() {
  const { locale } = useLocale();
  const [raw, setRaw] = useState(null);

  useEffect(() => {
    fetch('/api/public/config').then(r => r.json()).then(d => {
      if (d.landingContent) setRaw(d.landingContent);
    }).catch(() => {});
  }, []);

  if (!raw) return DEFAULTS[locale] ?? DEFAULTS.fr;
  // Bilingual structure { fr: {...}, en: {...} }
  if (raw.fr || raw.en) return merge(DEFAULTS[locale] ?? DEFAULTS.fr, raw[locale] ?? raw.fr);
  // Legacy single-language structure — treat as FR
  return locale === 'fr' ? merge(DEFAULTS.fr, raw) : DEFAULTS.en;
}

const IMGS = {
  hero:    'https://images.pexels.com/photos/46148/aircraft-jet-landing-cloud-46148.jpeg?auto=compress&cs=tinysrgb&w=1600',
  cargo:   'https://images.pexels.com/photos/2026324/pexels-photo-2026324.jpeg?auto=compress&cs=tinysrgb&w=1600',
  airport: 'https://images.pexels.com/photos/358319/pexels-photo-358319.jpeg?auto=compress&cs=tinysrgb&w=1600',
};

const WA_SUPPORT = 'https://wa.me/15149980709?text=Bonjour%20Jumla%20Shipping%2C%20j%27ai%20une%20question.';

/* ─── Photo strip + floating stat cards ─── */
function JStatsPhoto({ content }) {
  const heroStats = content.hero?.stats ?? [];
  const DEFAULTS = [
    { value: '12 000+', label: 'Colis livrés' },
    { value: '14 jours', label: 'Transit moyen' },
    { value: '98%',      label: 'Taux de succès' },
    { value: '2 500+',   label: 'Clients actifs' },
  ];
  const stats = DEFAULTS.map((d, i) => heroStats[i] ?? d);

  return (
    <section style={{ background: '#F7F8FA' }}>
      <style>{`
        .jsp-imgs { display: flex; height: clamp(160px, 28vw, 300px); gap: 3px; overflow: hidden; }
        .jsp-img  { flex: 1; position: relative; overflow: hidden; }
        .jsp-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .jsp-img::after { content:''; position:absolute; inset:0; background:rgba(13,46,110,.32); }
        .jsp-cards { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-top:-26px; position:relative; z-index:2; padding-bottom:56px; }
        @media(max-width:600px){
          .jsp-cards { grid-template-columns:repeat(2,1fr); margin-top:-18px; }
          .jsp-imgs  { height:140px; }
        }
      `}</style>
      <div className="jsp-imgs">
        {[IMGS.hero, IMGS.airport, IMGS.cargo].map((src, i) => (
          <div key={i} className="jsp-img"><img src={src} alt="" /></div>
        ))}
      </div>
      <div className="jc">
        <div className="jsp-cards">
          {stats.map(s => (
            <div key={s.label} style={{ background:'white', borderRadius:14, padding:'18px 12px', textAlign:'center', boxShadow:'0 4px 20px rgba(0,0,0,.08)' }}>
              <div style={{ fontSize:'clamp(20px,4vw,26px)', fontWeight:800, color:'#1B4FD8', lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:11.5, color:'#6B7280', marginTop:5, fontWeight:500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 4-step zigzag "Comment ça marche" ─── */
const STEPS_DATA = [
  {
    num: '1', duration: '3 min', side: 'left', bg: '#F2FBF4',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="19" height="19" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
    title: 'Réservez en ligne',
    desc: 'Créez votre envoi en 3 minutes. Renseignez les colis et obtenez votre code de suivi instantanément.',
  },
  {
    num: '2', duration: '1 jour', side: 'right', bg: 'white',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="19" height="19" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    title: 'Déposez à Douala',
    desc: 'Apportez vos colis à notre entrepôt. Vérification article par article, bordereau signé au départ.',
  },
  {
    num: '3', duration: '~14 jours', side: 'left', bg: 'white',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="19" height="19" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>,
    title: 'Transit aérien',
    desc: 'Vos colis voyagent avec nos compagnies partenaires certifiées. Notifications WhatsApp à chaque étape.',
  },
  {
    num: '4', duration: 'Sur RDV', side: 'right', bg: '#F2FBF4',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="19" height="19" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    title: 'Livraison à Montréal',
    desc: 'Retrait à notre entrepôt ou livraison à domicile partout au Québec. Paiement à la remise.',
  },
];

function JSteps({ onBook }) {
  return (
    <section id="jsteps" style={{ padding: '80px 0', background: '#F9FAF8' }}>
      <style>{`
        .js2-wrap { position: relative; max-width: 780px; margin: 0 auto; }
        .js2-row  { display: flex; margin-bottom: 60px; position: relative; }
        .js2-row:last-child { margin-bottom: 0; }
        .js2-row--left  { justify-content: flex-start; }
        .js2-row--right { justify-content: flex-end; }

        /* Card + badge assembly */
        .js2-card-wrap { width: 58%; position: relative; }
        .js2-badge-outer {
          position: absolute;
          left: -17px; top: 50%;
          transform: translateY(-50%);
          z-index: 2;
        }
        .js2-badge {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          background: #1B3A2D;
          color: white;
          padding: 10px 5px;
          border-radius: 99px;
          font-size: 9px; font-weight: 700;
          letter-spacing: .06em; white-space: nowrap;
          font-family: inherit;
        }
        .js2-inner {
          border-radius: 14px;
          padding: 22px 20px 22px 26px;
          border: 1px solid rgba(0,0,0,.07);
          box-shadow: 0 1px 6px rgba(0,0,0,.04);
        }
        .js2-head {
          display: flex; align-items: center; gap: 9px;
          margin-bottom: 10px;
        }
        .js2-icon  { color: #1F3A2D; flex-shrink: 0; }
        .js2-title { font-size: 15px; font-weight: 700; color: #111827; margin: 0; line-height: 1.3; }
        .js2-desc  { font-size: 13px; color: #6B7280; line-height: 1.7; margin: 0; }

        /* Connecting arrows — centred in the gap between left & right halves */
        .js2-arrow { position: absolute; bottom: -52px; pointer-events: none; z-index: 1; }
        .js2-row--left  .js2-arrow { left:  54%; }
        .js2-row--right .js2-arrow { right: 54%; }

        /* Mobile: stack single column */
        @media (max-width: 620px) {
          .js2-card-wrap { width: 100%; padding-left: 36px; }
          .js2-badge-outer { left: 2px; }
          .js2-row--right { justify-content: flex-start; }
          .js2-arrow  { display: none; }
          .js2-row    { margin-bottom: 20px; }
        }
      `}</style>

      <div className="jc">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', background: '#DCFCE7', color: '#16A34A', padding: '4px 14px', borderRadius: 99, fontSize: 11.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 14 }}>
            Comment ça marche
          </div>
          <h2 style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(26px,6vw,36px)', fontWeight: 800, color: '#111827', letterSpacing: '-.03em', margin: 0, lineHeight: 1.2 }}>
            Simple comme <span style={{ color: '#1B4FD8' }}>4 étapes</span>
          </h2>
          <p style={{ fontSize: 15, color: '#6B7280', marginTop: 14, lineHeight: 1.65, maxWidth: 380, margin: '14px auto 0' }}>
            De Douala à Montréal — on s'occupe de tout, vous suivez en temps réel.
          </p>
        </div>

        {/* Steps */}
        <div className="js2-wrap">
          {STEPS_DATA.map((step, i) => (
            <div key={step.num} className={`js2-row js2-row--${step.side}`}>

              {/* Card */}
              <div className="js2-card-wrap">
                <div className="js2-badge-outer">
                  <div className="js2-badge">{step.duration}</div>
                </div>
                <div className="js2-inner" style={{ background: step.bg }}>
                  <div className="js2-head">
                    <span className="js2-icon">{step.icon}</span>
                    <h3 className="js2-title">{step.num} {step.title}</h3>
                  </div>
                  <p className="js2-desc">{step.desc}</p>
                </div>
              </div>

              {/* Dashed connecting arrow to next step */}
              {i < STEPS_DATA.length - 1 && (
                <div className="js2-arrow">
                  {step.side === 'left' ? (
                    /* left card → curves right-down toward right card */
                    <svg width="88" height="58" viewBox="0 0 88 58" fill="none">
                      <path d="M 6 6 C 30 6, 82 24, 82 52" stroke="#BDC9B1" strokeDasharray="5,4" strokeWidth="1.5" fill="none"/>
                      <path d="M 75 45 L 82 52 L 86 44" stroke="#BDC9B1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                  ) : (
                    /* right card → curves left-down toward left card */
                    <svg width="88" height="58" viewBox="0 0 88 58" fill="none">
                      <path d="M 82 6 C 58 6, 6 24, 6 52" stroke="#BDC9B1" strokeDasharray="5,4" strokeWidth="1.5" fill="none"/>
                      <path d="M 13 45 L 6 52 L 2 44" stroke="#BDC9B1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 56 }}>
          <button onClick={onBook} style={{ background: 'linear-gradient(135deg,#00B4D8,#1B4FD8)', color: 'white', border: 'none', borderRadius: 10, padding: '14px 36px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(27,79,216,.25)' }}>
            Commencer maintenant →
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─── Floating chatbot ─── */
const CHAT_QS = [
  { emoji:'⏱️', label:'Délai de livraison ?',   answer:"Le transit moyen est de 14 jours porte à porte Douala → Montréal. Vous recevez une notification WhatsApp à chaque étape clé." },
  { emoji:'📦', label:'Comment ça marche ?',     answer:"1. Réservez en ligne → 2. Déposez à Douala → 3. Transit ~14 jours → 4. Livraison à Montréal. Simple et transparent !" },
  { emoji:'💰', label:'Tarifs & devis ?',        answer:"Les tarifs sont calculés au kilo. Notre simulateur sur cette page vous donne un devis instantané et gratuit.", scrollTo:'jest' },
  { emoji:'🔍', label:'Suivre mon colis',        link:'/suivi' },
  { emoji:'💬', label:'Autre question',          wa:true },
];

function JChatBot() {
  const [open, setOpen]       = useState(false);
  const [current, setCurrent] = useState(null);

  const handleQ = (q) => {
    if (q.link)    { window.location.href = q.link; return; }
    if (q.wa)      { window.open(WA_SUPPORT, '_blank'); return; }
    if (q.scrollTo){ document.getElementById(q.scrollTo)?.scrollIntoView({ behavior:'smooth' }); setOpen(false); return; }
    setCurrent(q);
  };

  return (
    <>
      <button
        onClick={() => { setOpen(v => !v); setCurrent(null); }}
        aria-label="Chat"
        style={{
          position:'fixed', bottom:24, right:24, zIndex:1000,
          width:56, height:56, borderRadius:'50%',
          background:'linear-gradient(135deg,#00B4D8,#1B4FD8)',
          border:'none', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 4px 24px rgba(27,79,216,.4)',
        }}>
        {open
          ? <span style={{ color:'white', fontSize:18 }}>✕</span>
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        }
      </button>

      {open && (
        <div style={{ position:'fixed', bottom:90, right:24, zIndex:1000, width:'min(320px, calc(100vw - 48px))', background:'white', borderRadius:16, boxShadow:'0 8px 48px rgba(0,0,0,.15)', overflow:'hidden' }}>
          <div style={{ background:'linear-gradient(135deg,#0D2E6E,#1B4FD8)', padding:'14px 18px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,.15)', display:'grid', placeItems:'center', fontSize:18 }}>✈️</div>
              <div>
                <div style={{ color:'white', fontWeight:700, fontSize:13.5 }}>Jumla Shipping</div>
                <div style={{ color:'rgba(255,255,255,.65)', fontSize:11 }}>Répond en moins d'une heure</div>
              </div>
            </div>
          </div>
          <div style={{ padding:'14px 14px 18px' }}>
            {!current ? (
              <>
                <div style={{ background:'#F4F5F7', borderRadius:12, padding:'11px 14px', fontSize:13.5, color:'#374151', marginBottom:12, lineHeight:1.5 }}>
                  👋 Bonjour ! Comment puis-je vous aider ?
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                  {CHAT_QS.map(q => (
                    <button key={q.label} onClick={() => handleQ(q)}
                      style={{ display:'flex', alignItems:'center', gap:9, background:'white', border:'1.5px solid #E5E7EB', borderRadius:10, padding:'9px 12px', fontSize:13, fontWeight:500, color:'#374151', cursor:'pointer', textAlign:'left', fontFamily:'inherit', width:'100%' }}>
                      <span style={{ fontSize:15 }}>{q.emoji}</span>
                      <span style={{ flex:1 }}>{q.label}</span>
                      <span style={{ color:'#C4C9D4', fontSize:12 }}>→</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div style={{ background:'#F4F5F7', borderRadius:12, padding:'11px 14px', fontSize:13.5, color:'#374151', marginBottom:12, lineHeight:1.6 }}>
                  {current.answer}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => setCurrent(null)} style={{ flex:1, padding:'9px', border:'1.5px solid #E5E7EB', borderRadius:10, background:'white', fontSize:12.5, fontWeight:600, color:'#374151', cursor:'pointer', fontFamily:'inherit' }}>
                    ← Retour
                  </button>
                  <a href={WA_SUPPORT} target="_blank" rel="noreferrer"
                    style={{ flex:1, padding:'9px', borderRadius:10, background:'#25D366', color:'white', fontSize:12.5, fontWeight:700, textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                    💬 WhatsApp
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Hero split layout ─── */
function JHero({ onBook, onNav, content }) {
  const t = useT();
  const [code, setCode] = useState('');
  const h = content.hero;
  const tc = content.trackingCard ?? {};

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
                {t('hero.button.book')}
              </button>
              <button className="jhero2__btn-ghost" onClick={() => document.getElementById('jest')?.scrollIntoView({ behavior: 'smooth' })}>
                {t('hero.button.estimate')}
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
                <span className="jhero2__card-title">{tc.title ?? t('hero.tracking.title')}</span>
              </div>

              <form onSubmit={handleTrack}>
                <label className="jhero2__card-label">{tc.label ?? t('hero.tracking.label')}</label>
                <input
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder={tc.placeholder ?? t('hero.tracking.placeholder')}
                  className="jhero2__card-input"
                />
                <button type="submit" className="jhero2__card-btn">
                  {tc.button ?? t('hero.tracking.button')}
                </button>
              </form>

              <div className="jhero2__card-divider" />

              <div className="jhero2__card-route">
                <div className="jhero2__card-city">
                  <div className="jhero2__card-city-label">{tc.cityFromLabel ?? t('hero.route.departure')}</div>
                  <div className="jhero2__card-city-name">{tc.cityFrom ?? 'DOUALA'}</div>
                  <div className="jhero2__card-city-sub">{tc.cityFromSub ?? 'DLA · Cameroun'}</div>
                </div>
                <div className="jhero2__card-plane">
                  <I.Plane style={{ width: 20, height: 20, color: '#00B4D8' }} />
                </div>
                <div className="jhero2__card-city" style={{ textAlign: 'right' }}>
                  <div className="jhero2__card-city-label">{tc.cityToLabel ?? t('hero.route.arrival')}</div>
                  <div className="jhero2__card-city-name">{tc.cityTo ?? 'MONTRÉAL'}</div>
                  <div className="jhero2__card-city-sub">{tc.cityToSub ?? 'YUL · Canada'}</div>
                </div>
              </div>

              <div className="jhero2__card-badge">
                <span className="jhero2__card-badge-dot" />
                {tc.badge ?? t('hero.route.badge')}
              </div>
            </div>

            <div className="jhero2__card-book">
              {tc.ctaText ?? t('hero.cta.newCustomer')}{' '}
              <button onClick={onBook} className="jhero2__card-book-link">
                {tc.ctaLink ?? t('hero.cta.bookNow')}
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
  const t = useT();
  const st = content.sectionTitles?.services ?? {};
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
          <div className="jsvc3__eyebrow">{st.eyebrow ?? t('services.eyebrow')}</div>
          <h2 className="jsvc3__title">
            {st.title ?? t('services.title')}
          </h2>
          <p className="jsvc3__subtitle">
            {st.subtitle ?? t('services.subtitle')}
          </p>
        </div>
        <div className="jsvc3__grid">
          {svcs.map(({ Icon, num, t: title, d }) => (
            <div key={title} className="jsvc3__item">
              <div className="jsvc3__item-top">
                <div className="jsvc3__num">{num}</div>
                <div className="jsvc3__icon-wrap">
                  <Icon style={{ width: 24, height: 24 }} />
                </div>
              </div>
              <h3 className="jsvc3__item-title">{title}</h3>
              <p className="jsvc3__item-desc">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Features accordion ─── */
function JFeats({ onBook, content }) {
  const t = useT();
  const st = content.sectionTitles?.features ?? {};
  const [open, setOpen] = useState(0);
  const feats = content.features.map(f => ({ t: f.title, d: f.description }));

  return (
    <section className="jfeats3" id="jabout">
      <div className="jc">
        <div className="jfeats3__grid">

          {/* Left */}
          <div className="jfeats3__left">
            <div className="jfeats3__eyebrow">{st.eyebrow ?? t('features.eyebrow')}</div>
            <h2 className="jfeats3__title">
              {st.title1 ?? t('features.title1')}<br />
              <span className="cy">{st.title2 ?? t('features.title2')}</span>
            </h2>
            <p className="jfeats3__body">
              {st.description ?? t('features.description')}
            </p>
            <button className="jfeats3__btn" onClick={onBook}>
              {t('features.button')} <I.ArrowRight style={{ width: 15, height: 15 }} />
            </button>
            <div className="jfeats3__stats">
              {(st.stats ?? [
                { value: '2 500+', label: t('features.stats.clients') },
                { value: '4',      label: t('features.stats.routes') },
                { value: '22',     label: t('features.stats.cargo') },
              ]).map(({ value, label }) => (
                <div key={label} className="jfeats3__stat">
                  <div className="jfeats3__stat-n">{value}</div>
                  <div className="jfeats3__stat-l">{label}</div>
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
function JEstimator({ onBook, content }) {
  const t = useT();
  const st = content?.sectionTitles?.estimator ?? {};
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
          <div className="jsvc3__eyebrow" style={{ display: 'block', marginBottom: 10 }}>{st.eyebrow ?? t('estimator.eyebrow')}</div>
          <h2 style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 'clamp(26px, 7.5vw, 36px)', color: 'var(--ink-900)', fontWeight: 800, letterSpacing: '-.03em' }}>
            {st.title ?? t('estimator.title')}
          </h2>
          <p style={{ fontSize: 15, color: 'var(--ink-400)', marginTop: 12, lineHeight: 1.65, maxWidth: 440, margin: '12px auto 0' }}>
            {st.subtitle ?? t('estimator.subtitle')}
          </p>
        </div>
        <div className="jest">
          <div className="jest__head">
            <I.Calculator style={{ width: 16, height: 16, color: 'var(--brand-400)' }} />
            <span className="jest__title">{t('estimator.header')}</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink-400)' }}>{t('estimator.hint')}</span>
          </div>
          <div className="jest__route">
            <div className="jest__f">
              <label>{t('estimator.field.origin')}</label>
              <select value={routeId} onChange={e => setRouteId(e.target.value)}>
                {routes.map(rr => <option key={rr.id} value={rr.id}>{rr.fromCity} ({rr.fromIATA})</option>)}
              </select>
            </div>
            <I.ArrowRight style={{ width: 18, height: 18, color: 'var(--ink-300)', alignSelf: 'flex-end', marginBottom: 11 }} />
            <div className="jest__f">
              <label>{t('estimator.field.destination')}</label>
              <select>{routes.map(rr => <option key={rr.id}>{rr.toCity} ({rr.toIATA})</option>)}</select>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ alignSelf: 'flex-end', marginBottom: 11, fontSize: 13, color: 'var(--ink-400)' }}>
              {t('estimator.field.transit')} <strong style={{ color: 'var(--ink-900)' }}>{r?.transitDays} {t('estimator.field.transitUnit')}</strong>
              {' · '}{t('estimator.field.rate')} <strong style={{ color: 'var(--ink-900)' }}>{r?.currency}</strong>
            </div>
          </div>
          <div className="jest__lines">
            <div className="jest__lhead">
              <span>{t('estimator.table.category')}</span><span>{t('estimator.table.weight')}</span>
              <span style={{ textAlign: 'right' }}>{t('estimator.table.base')}</span>
              <span style={{ textAlign: 'right' }}>{t('estimator.table.surcharge')}</span>
              <span style={{ textAlign: 'right' }}>{t('estimator.table.subtotal')}</span>
              <span />
            </div>
            {lines.map((ln, i) => {
              const c = computed[i];
              return (
                <div className="jest__line" key={ln.id}>
                  <div className="jest__f">
                    <select value={ln.cat} onChange={e => updLine(ln.id, 'cat', e.target.value)}>
                      {cats.map(ct => <option key={ct.id} value={ct.id}>{ct.icon} {ct.label}</option>)}
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
              <I.Plus style={{ width: 14, height: 14 }} /> {t('estimator.addItem')}
            </button>
          </div>
          <div className="jest__res">
            <div>
              <div className="jest__total-label">
                {`${lines.length} ${lines.length > 1 ? t('estimator.items') : t('estimator.item')}`} · {totalWeight} kg · {r?.fromIATA} → {r?.toIATA}
              </div>
              <span className="jest__total-n">{grandTotal}</span>
              <span className="jest__total-cur">{r?.currency}</span>
            </div>
            <button className="jbtn-nav" style={{ marginLeft: 'auto' }} onClick={onBook}>
              {t('estimator.book')} <I.ArrowRight style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
function JFAQ({ content }) {
  const t = useT();
  const st = content.sectionTitles?.faq ?? {};
  const faqs = content.faq.map(f => ({ q: f.question, a: f.answer }));
  const [open, setOpen] = useState(0);
  return (
    <section className="jfaq-section" id="jfaq">
      <div className="jc">
        <div className="jfaq-grid">
          <div>
            <div className="jsvc3__eyebrow" style={{ display: 'block', marginBottom: 12 }}>{st.eyebrow ?? t('faq.eyebrow')}</div>
            <h2 style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 'clamp(26px, 7.5vw, 36px)', fontWeight: 800, letterSpacing: '-.03em', color: 'var(--ink-900)', marginBottom: 16 }}>
              {st.title ?? t('faq.title')}
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--ink-400)' }}>
              {st.subtitle ?? t('faq.subtitle')}
            </p>
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
  const t = useT();
  const c = content.cta;
  return (
    <section className="jcta3">
      <img className="jcta3__bg" src={IMGS.cargo} alt="" />
      <div className="jcta3__overlay" />
      <div className="jc" style={{ position: 'relative', zIndex: 2, height: '100%' }}>
        <div className="jcta3__grid">

          {/* Left */}
          <div className="jcta3__left">
            <div className="jcta3__eyebrow">{t('cta.eyebrow')}</div>
            <h2 className="jcta3__title">
              {c.line1}<br />
              {c.line2}<br />
              <span style={{ color: '#00B4D8' }}>{c.line3}</span>
            </h2>
            <p className="jcta3__sub">{c.subtitle}</p>
            <button className="jcta3__btn" onClick={onBook}>
              {t('cta.button')} <I.ArrowRight style={{ width: 17, height: 17 }} />
            </button>
          </div>

          {/* Right — floating card */}
          <div className="jcta3__card">
            <div className="jcta3__card-title">{content.ctaCard?.title ?? t('cta.card.title')}</div>
            <div className="jcta3__items">
              {(content.ctaCard?.reasons ?? t('cta.card.reasons')).map(reason => (
                <div key={reason} className="jcta3__item">
                  <span className="jcta3__check">✓</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
            <div className="jcta3__card-footer">
              <div style={{ fontSize: 12, color: 'var(--ink-400)', marginBottom: 8 }}>{content.ctaCard?.footerQuestion ?? t('cta.card.footer.question')}</div>
              <a href="https://wa.me/15149980709" target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, color: '#25D366', fontWeight: 700, textDecoration: 'none' }}>
                <I.Whatsapp style={{ width: 18, height: 18 }} /> {content.ctaCard?.footerWhatsapp ?? t('cta.card.footer.whatsapp')}
              </a>
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
      <JStatsPhoto content={content} />
      <JSteps onBook={onBook} />
      <JEstimator onBook={onBook} content={content} />
      <JFAQ content={content} />
      <JCTA onBook={onBook} content={content} />
      <SiteFooter content={content} />
      <JChatBot />
    </div>
  );
}
