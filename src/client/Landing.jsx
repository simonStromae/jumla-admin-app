'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import I from '../components/Icons.jsx';
import { ITEM_CATEGORIES, calcPrice, routeFeesToCalcFees, DEFAULT_FEES } from '../lib/calcPrice.js';
import { TopBar, SiteNav, SiteFooter } from './SiteLayout.jsx';
import ChinaComingSoon from './ChinaComingSoon.jsx';
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
  comingSoon: {
    eyebrow:     'Bientôt disponible',
    originFlag:  '🇨🇳',
    destFlag:    '🇨🇦',
    title:       'Chine → Montréal',
    subtitle:    'Nouvelle route cargo directe · Guangzhou · Shenzhen · Shanghai → Canada',
    launchDate:  '2026-08-31',
    ctaTitle:    'Nos cargaisons Cameroun → Montréal sont ouvertes.',
    ctaSubtitle: 'Expédiez dès aujourd\'hui avec Jumla Cargo.',
    ctaButton:   'Réserver une expédition →',
    launchLabel: 'Lancement prévu : 31 août 2026',
  },
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
    steps:     { eyebrow: 'Comment ça marche', title: 'Simple comme ', titleHighlight: '4 étapes', subtitle: "De Douala à Montréal — on s'occupe de tout, vous suivez en temps réel.", button: 'Créer une nouvelle expédition →' },
  },
  storyCard: {
    badge:       'Notre histoire',
    title:       "Le pont aérien entre l'Afrique et le Canada.",
    description: "Depuis 2021, nous connectons des familles entre Douala et Montréal. Chaque colis photographié, suivi à chaque étape et livré en 14 jours chrono.",
    button:      'Suivre mon colis →',
  },
  steps: [
    { duration: '3 min',   title: 'Réservez en ligne',    description: 'Créez votre envoi en 3 minutes. Renseignez les colis et obtenez votre code de suivi instantanément.' },
    { duration: '1 jour',  title: 'Déposez à Douala',     description: "Apportez vos colis à notre entrepôt. Vérification article par article, bordereau signé au départ." },
    { duration: '~14 jrs', title: 'Transit aérien',       description: 'Vos colis voyagent avec nos compagnies partenaires certifiées. Notifications WhatsApp à chaque étape.' },
    { duration: 'Sur RDV', title: 'Livraison à Montréal', description: 'Retrait à notre entrepôt ou livraison à domicile partout au Québec. Paiement à la remise.' },
  ],
  widePhoto: {
    title:          'De Douala à Montréal,',
    titleHighlight: 'en 14 jours max.',
    description:    "Rejoignez 2 500+ clients qui nous font confiance pour leurs envois entre l'Afrique et le Canada. Sécurité, transparence et notification WhatsApp à chaque étape.",
    button:         'Réserver un envoi',
  },
  trackingCard: {
    title: 'Suivre mon colis', label: 'Numéro de suivi', placeholder: 'JMS-12345', button: 'Suivre mon colis →',
    badge: 'Transit 14 jours · Notification WhatsApp incluse',
    cityFrom: 'DOUALA', cityFromSub: 'DLA · Cameroun', cityTo: 'MONTRÉAL', cityToSub: 'YUL · Canada',
    ctaText: 'Pas encore client ?', ctaLink: 'Créer un envoi maintenant',
  },
  footer: {
    description: "Spécialiste du fret aérien international entre l'Afrique et le Canada depuis 2021. Suivi, sécurité et transparence à chaque étape.",
    copyright: '© 2026 Jumla Shipping Inc. — Tous droits réservés',
    offices: 'Douala · Montréal · Lagos · Bruxelles',
    col1Title: 'Navigation', col2Title: 'Politiques',
    email: 'info@jumlas.com',
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
  comingSoon: {
    eyebrow:     'Coming soon',
    originFlag:  '🇨🇳',
    destFlag:    '🇨🇦',
    title:       'China → Montréal',
    subtitle:    'New direct cargo route · Guangzhou · Shenzhen · Shanghai → Canada',
    launchDate:  '2026-08-31',
    ctaTitle:    'Our Cameroon → Montréal shipments are open.',
    ctaSubtitle: 'Ship today with Jumla Cargo.',
    ctaButton:   'Book a shipment →',
    launchLabel: 'Launch date: August 31, 2026',
  },
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
    steps:     { eyebrow: 'How it works', title: 'Simple in ', titleHighlight: '4 steps', subtitle: 'From Douala to Montréal — we handle everything, you track in real time.', button: 'Create a new shipment →' },
  },
  storyCard: {
    badge:       'Our story',
    title:       'The air bridge between Africa and Canada.',
    description: 'Since 2021, we connect families between Douala and Montréal. Every parcel photographed, tracked at every step and delivered in 14 days.',
    button:      'Track my parcel →',
  },
  steps: [
    { duration: '3 min',    title: 'Book online',          description: 'Create your shipment in 3 minutes. Enter the parcels and get your tracking code instantly.' },
    { duration: '1 day',    title: 'Drop off in Douala',   description: 'Bring your parcels to our warehouse. Item-by-item verification, signed manifest at departure.' },
    { duration: '~14 days', title: 'Air transit',          description: 'Your parcels travel with our certified partner airlines. WhatsApp notifications at every step.' },
    { duration: 'By appt',  title: 'Delivery in Montréal', description: 'Pickup at our warehouse or home delivery anywhere in Quebec. Payment on handover.' },
  ],
  widePhoto: {
    title:          'From Douala to Montréal,',
    titleHighlight: 'in 14 days max.',
    description:    'Join 2,500+ customers who trust Jumla Shipping for their shipments between Africa and Canada. Security, transparency and WhatsApp notifications at every step.',
    button:         'Book a shipment',
  },
  trackingCard: {
    title: 'Track my parcel', label: 'Tracking number', placeholder: 'JMS-12345', button: 'Track my parcel →',
    badge: '14-day transit · WhatsApp notification included',
    cityFrom: 'DOUALA', cityFromSub: 'DLA · Cameroon', cityTo: 'MONTRÉAL', cityToSub: 'YUL · Canada',
    ctaText: 'Not a customer yet?', ctaLink: 'Create a shipment now',
  },
  footer: {
    description: 'International air freight specialist between Africa and Canada since 2021. Tracking, security and transparency at every step.',
    copyright: '© 2026 Jumla Shipping Inc. — All rights reserved',
    offices: 'Douala · Montréal · Lagos · Brussels',
    col1Title: 'Navigation', col2Title: 'Policies',
    email: 'info@jumlas.com',
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
    storyCard:     mergeObj(base.storyCard, override.storyCard),
    steps:         override.steps    ?? base.steps,
    widePhoto:     mergeObj(base.widePhoto, override.widePhoto),
    sectionTitles: override.sectionTitles ? {
      services:  mergeObj(base.sectionTitles.services,  override.sectionTitles.services),
      features:  mergeObj(base.sectionTitles.features,  override.sectionTitles.features),
      estimator: mergeObj(base.sectionTitles.estimator, override.sectionTitles.estimator),
      faq:       mergeObj(base.sectionTitles.faq,       override.sectionTitles.faq),
      steps:     mergeObj(base.sectionTitles.steps,     override.sectionTitles.steps),
    } : base.sectionTitles,
    comingSoon:    mergeObj(base.comingSoon, override.comingSoon),
    trackingCard:  mergeObj(base.trackingCard, override.trackingCard),
    footer:        mergeObj(base.footer, override.footer),
    loginSlides:   override.loginSlides ?? base.loginSlides,
  };
}

const DEFAULT_SECTIONS = {
  china_coming_soon: true,
  hero:              true,
  estimator:         true,
  story_card:        true,
  steps:             true,
  wide_photo:        true,
};

function useLandingContent() {
  const { locale } = useLocale();
  const [raw, setRaw]           = useState(null);
  const [sections, setSections] = useState(DEFAULT_SECTIONS);

  useEffect(() => {
    fetch('/api/public/config').then(r => r.json()).then(d => {
      if (d.landingContent) setRaw(d.landingContent);
      if (d.sections) setSections({ ...DEFAULT_SECTIONS, ...d.sections });
    }).catch(() => {});
  }, []);

  let content;
  if (!raw) {
    content = DEFAULTS[locale] ?? DEFAULTS.fr;
  } else if (raw.fr || raw.en) {
    content = merge(DEFAULTS[locale] ?? DEFAULTS.fr, raw[locale] ?? raw.fr);
  } else {
    content = locale === 'fr' ? merge(DEFAULTS.fr, raw) : DEFAULTS.en;
  }

  return { ...content, sections };
}

const IMGS = {
  // Hero background — palettes cargo tons chauds, format paysage
  airport: 'https://images.pexels.com/photos/33824580/pexels-photo-33824580.jpeg?auto=compress&cs=tinysrgb&w=1920',
  // JStoryCard split left — Air France cargo N&B, très cinématique
  cargo:   'https://images.pexels.com/photos/32689680/pexels-photo-32689680.jpeg?auto=compress&cs=tinysrgb&w=1200',
  // JWidePhoto full-bleed overlay — Lufthansa Jettainer containers
  hero:    'https://images.pexels.com/photos/19854581/pexels-photo-19854581.jpeg?auto=compress&cs=tinysrgb&w=1920',
};

const WA_SUPPORT = 'https://wa.me/15149980709?text=Bonjour%20Jumla%20Shipping%2C%20j%27ai%20une%20question.';

/* ─── Dark story section — split grid photo left / content right ─── */
function JStoryCard({ onBook, onNav, content }) {
  const heroStats = content.hero?.stats ?? [];
  const sc = content.storyCard ?? {};
  const STAT_DEFAULTS = [
    { value: '12 000+', label: 'Colis livrés' },
    { value: '14 jours', label: 'Transit moyen' },
    { value: '98%',      label: 'Taux de succès' },
  ];
  const stats = STAT_DEFAULTS.map((d, i) => heroStats[i] ?? d);

  return (
    <section id="jstory" style={{ display: 'grid' }}>
      <style>{`
        #jstory { grid-template-columns: 1fr 1fr; min-height: 80vh; }
        @media (max-width: 768px) {
          #jstory { grid-template-columns: 1fr; min-height: auto; }
          .jsc-photo { min-height: 260px; }
          .jsc-wa-card { display: none; }
          .jsc-content { padding: 40px 20px !important; }
          .jsc-h2 { font-size: 35px !important; }
          .jsc-content p { font-size: 14px !important; }
          .jsc-stats-row { margin-bottom: 24px !important; gap: 16px !important; }
        }
        .jsc-stats-row { display: flex; gap: clamp(20px,3vw,40px); flex-wrap: wrap; margin-bottom: 40px; }
        .jsc-stat-item { display: flex; flex-direction: column; gap: 5px; }
        .jsc-stat-val  { font-family:'Inter',system-ui,sans-serif; font-size: clamp(26px,3vw,36px); font-weight: 800; color: white; line-height: 1; }
        .jsc-stat-lbl  { font-size: 13px; color: rgba(255,255,255,.45); font-weight: 500; }
      `}</style>

      {/* Left — photo */}
      <div className="jsc-photo" style={{ position: 'relative', overflow: 'hidden' }}>
        <img src={IMGS.cargo} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(9,15,30,.18) 0%, rgba(9,15,30,.05) 100%)' }} />
        {/* Floating WhatsApp notification card */}
        <div className="jsc-wa-card" style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(12px)', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 32px rgba(0,0,0,.18)', minWidth: 240, whiteSpace: 'nowrap' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#25D366', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>Jumla Shipping</div>
            <div style={{ fontSize: 13, color: '#111827', fontWeight: 500 }}>📦 Colis JMS-4829 arrivé à Montréal</div>
          </div>
        </div>
      </div>

      {/* Right — dark content */}
      <div className="jsc-content" style={{ background: '#0B1220', display: 'flex', alignItems: 'center', padding: 'clamp(56px,7vw,96px) clamp(32px,5vw,72px)' }}>
        <div style={{ maxWidth: 480 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(147,197,253,.1)', color: '#93C5FD', border: '1px solid rgba(147,197,253,.18)', padding: '5px 14px', borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 28 }}>
            {sc.badge ?? 'Notre histoire'}
          </div>
          <h2 className="jsc-h2" style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(38px,5.5vw,50px)', fontWeight: 800, color: 'white', letterSpacing: '-.04em', lineHeight: 1.1, marginBottom: 20 }}>
            {sc.title ?? "Le pont aérien entre l'Afrique et le Canada."}
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,.55)', lineHeight: 1.8, marginBottom: 40 }}>
            {sc.description ?? "Depuis 2021, nous connectons des familles entre Douala et Montréal. Chaque colis photographié, suivi à chaque étape et livré en 14 jours chrono."}
          </p>
          {/* Stats row */}
          <div className="jsc-stats-row">
            {stats.map(s => (
              <div key={s.label} className="jsc-stat-item">
                <span className="jsc-stat-val">{s.value}</span>
                <span className="jsc-stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>
          <button className="jbtn-nav jbtn-nav--lg" onClick={() => onNav?.('/suivi')}>
            {sc.button ?? 'Suivre mon colis →'}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─── 4-step zigzag "Comment ça marche" ─── */
const STEP_ICONS = [
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="19" height="19" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="19" height="19" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="19" height="19" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="19" height="19" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
];
const STEP_SIDE = ['left', 'right', 'left', 'right'];
const STEP_BG   = ['#EFF6FF', 'white', 'white', '#EFF6FF'];

function JSteps({ onBook, content }) {
  const st = content?.sectionTitles?.steps ?? {};
  const stepsData = (content?.steps ?? []).map((s, i) => ({
    num: String(i + 1), duration: s.duration,
    side: STEP_SIDE[i] ?? 'left', bg: STEP_BG[i] ?? 'white',
    icon: STEP_ICONS[i], title: s.title, desc: s.description,
  }));
  return (
    <section id="jsteps" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'rgb(253,253,255)', padding: '80px 0 100px' }}>
      <style>{`
        .js2-wrap { position: relative; max-width: 820px; margin: 0 auto; }
        .js2-row  { display: flex; margin-bottom: 64px; position: relative; }
        .js2-row:last-child { margin-bottom: 0; }
        .js2-row--left  { justify-content: flex-start; }
        .js2-row--right { justify-content: flex-end; }
        .js2-card-wrap { width: 58%; position: relative; }
        .js2-badge-outer { position: absolute; left: -17px; top: 50%; transform: translateY(-50%); z-index: 2; }
        .js2-badge { writing-mode: vertical-rl; transform: rotate(180deg); background: #00B4D8; color: white; padding: 10px 5px; border-radius: 99px; font-size: 9px; font-weight: 700; letter-spacing: .06em; white-space: nowrap; font-family: inherit; }
        .js2-inner { border-radius: 16px; padding: 28px 24px 28px 32px; border: 1px solid rgba(0,0,0,.07); box-shadow: 0 2px 12px rgba(0,0,0,.05); }
        .js2-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .js2-icon  { color: #00B4D8; flex-shrink: 0; }
        .js2-title { font-size: 19px; font-weight: 700; color: #111827; margin: 0; line-height: 1.3; }
        .js2-desc  { font-size: 15px; color: #6B7280; line-height: 1.75; margin: 0; }
        .js2-arrow { position: absolute; bottom: -52px; pointer-events: none; z-index: 1; }
        .js2-row--left  .js2-arrow { left: 54%; }
        .js2-row--right .js2-arrow { right: 54%; }
        @media (max-width: 768px) {
          #jsteps { padding: 48px 0 64px !important; min-height: auto !important; }
          .js2-steps-hd { margin-bottom: 36px !important; }
          .js2-steps-hd h2 { font-size: 35px !important; }
          .js2-steps-hd p { font-size: 14px !important; }
          .js2-steps-cta { margin-top: 32px !important; }
        }
        @media (max-width: 620px) {
          .js2-card-wrap { width: 100%; padding-left: 36px; }
          .js2-badge-outer { left: 2px; }
          .js2-row--right { justify-content: flex-start; }
          .js2-arrow  { display: none; }
          .js2-row    { margin-bottom: 24px; }
          .js2-title  { font-size: 14px; }
          .js2-desc   { font-size: 12px; }
          .js2-inner  { padding: 20px 16px 20px 24px; }
        }
      `}</style>

      <div className="jc">
        {/* Header */}
        <div className="js2-steps-hd" data-reveal style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(0,180,216,.1)', color: '#00B4D8', border: '1px solid rgba(0,180,216,.25)', padding: '5px 16px', borderRadius: 99, fontSize: 12, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 18 }}>
            {st.eyebrow ?? 'Comment ça marche'}
          </div>
          <h2 style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(38px,5.5vw,50px)', fontWeight: 800, color: '#111827', letterSpacing: '-.04em', margin: 0, lineHeight: 1.1 }}>
            {st.title ?? 'Simple comme '}<span style={{ color: '#00B4D8' }}>{st.titleHighlight ?? '4 étapes'}</span>
          </h2>
          <p style={{ fontSize: 18, color: '#6B7280', marginTop: 16, lineHeight: 1.65, maxWidth: 420, margin: '16px auto 0' }}>
            {st.subtitle ?? "De Douala à Montréal — on s'occupe de tout, vous suivez en temps réel."}
          </p>
        </div>

        {/* Steps */}
        <div className="js2-wrap">
          {stepsData.map((step, i) => (
            <div key={step.num} className={`js2-row js2-row--${step.side}`} data-reveal data-delay={i + 1}>

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
              {i < stepsData.length - 1 && (
                <div className="js2-arrow">
                  {step.side === 'left' ? (
                    /* left card → curves right-down toward right card */
                    <svg width="88" height="58" viewBox="0 0 88 58" fill="none">
                      <path d="M 6 6 C 30 6, 82 24, 82 52" stroke="#00B4D8" strokeDasharray="5,4" strokeWidth="1.5" fill="none"/>
                      <path d="M 75 45 L 82 52 L 86 44" stroke="#00B4D8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                  ) : (
                    /* right card → curves left-down toward left card */
                    <svg width="88" height="58" viewBox="0 0 88 58" fill="none">
                      <path d="M 82 6 C 58 6, 6 24, 6 52" stroke="#00B4D8" strokeDasharray="5,4" strokeWidth="1.5" fill="none"/>
                      <path d="M 13 45 L 6 52 L 2 44" stroke="#00B4D8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="js2-steps-cta" style={{ textAlign: 'center', marginTop: 56 }}>
          <button className="jbtn-nav jbtn-nav--lg" onClick={onBook}>
            {st.button ?? 'Créer une nouvelle expédition →'}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─── Scroll reveal hook ─── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('sr-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ─── Floating chatbot ─── */
const CHAT_QS = [
  { emoji:'⏱️', label:'Délai de livraison ?',      answer:"Le transit moyen est de 14 jours porte à porte Douala → Montréal. Vous recevez une notification WhatsApp à chaque étape clé du voyage." },
  { emoji:'📦', label:'Comment ça marche ?',        answer:"1. Réservez en ligne en 3 min → 2. Déposez à notre entrepôt de Douala → 3. Transit aérien ~14 jours → 4. Livraison ou retrait à Montréal. Simple et transparent !" },
  { emoji:'💰', label:'Tarifs & devis ?',           answer:"Les tarifs sont calculés au kilo par tranche (0–5 kg, 5–10 kg, 10–25 kg…). Fragile +8%, électronique +5%, documents –10%. Utilisez le simulateur sur cette page pour un devis instantané.", scrollTo:'jest' },
  { emoji:'💳', label:'Moyens de paiement ?',       answer:"Paiement à la livraison à Montréal : Interac, virement bancaire, Mobile Money (Orange Money, MTN) ou espèces. Aucun paiement requis à l'envoi depuis Douala. Zéro frais caché." },
  { emoji:'🎁', label:'Que puis-je envoyer ?',      answer:"Vêtements, denrées sèches, électronique, cosmétiques, documents, mobilier léger. Sont exclus : produits dangereux, liquides, marchandises prohibées au transport aérien." },
  { emoji:'🏠', label:'Livraison ou retrait ?',     answer:"Au choix : livraison à domicile partout au Québec (créneau sur RDV, signature requise) ou retrait à notre entrepôt de Montréal. Paiement à la remise." },
  { emoji:'🔍', label:'Suivre mon colis',           link:'/suivi' },
  { emoji:'💬', label:'Autre question',             wa:true },
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
        className="jchat-btn"
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
        <div className="jchat-panel" style={{ position:'fixed', bottom:90, right:24, zIndex:1000, width:'min(320px, calc(100vw - 48px))', background:'white', borderRadius:16, boxShadow:'0 8px 48px rgba(0,0,0,.15)', overflow:'hidden' }}>
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

/* ─── Hero — DHL-style: background image + left text + right action panel ─── */
function JHero({ onBook, onNav, content }) {
  const h = content.hero;
  return (
    <section style={{ position: 'relative', overflow: 'hidden' }}>
      <img src={IMGS.airport} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 42%', zIndex: 0 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(9,15,30,.58) 0%, rgba(3,24,74,.68) 100%)', zIndex: 1 }} />

      <style>{`
        .jhero-wrap { display: grid; grid-template-columns: 1fr 1.25fr; align-items: center; gap: 48px; position: relative; z-index: 2; padding: 130px 0 90px; min-height: 80vh; }
        .jhero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.22); border-radius: 99px; padding: 7px 18px; font-size: 13px; font-weight: 600; color: rgba(255,255,255,.85); margin-bottom: 24px; backdrop-filter: blur(8px); }
        .jhero-h1 { font-family:'Inter',system-ui,sans-serif; font-size: clamp(32px,4.5vw,48px); font-weight: 800; color: white; letter-spacing: -.04em; line-height: 1.1; margin: 0 0 18px; width: 70%; }
        .jhero-sub { font-size: 16px; color: rgba(255,255,255,.62); line-height: 1.7; margin: 0; max-width: 400px; }
        .jhero-panel { background: rgba(11,18,32,.82); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,.1); border-radius: 16px; padding: 28px 28px 24px; }
        .jhero-panel-hd { font-size: 11px; font-weight: 700; color: rgba(255,255,255,.45); text-transform: uppercase; letter-spacing: .1em; margin-bottom: 16px; }
        .jhero-tiles { display: flex; background: white; border-radius: 10px; overflow: hidden; }
        .jhero-tile { flex: 1; background: white; padding: 22px 14px; display: flex; align-items: center; justify-content: center; text-align: center; cursor: pointer; border: none; color: #111827; font-family: inherit; transition: background .15s; position: relative; }
        .jhero-tile + .jhero-tile::before { content: ''; position: absolute; left: 0; top: 12%; height: 76%; width: 1px; background: #E5E7EB; }
        .jhero-tile:hover { background: #F3F4F6; }
        .jhero-tile-label { font-size: 13px; font-weight: 600; line-height: 1.4; color: #111827; }
        @media (max-width: 820px) {
          .jhero-wrap { grid-template-columns: 1fr; padding: 56px 0 48px; gap: 32px; min-height: 90vh; align-content: end; }
          .jhero-h1 { font-size: 35px !important; }
          .jhero-sub { max-width: 100%; font-size: 14px; }
          .jhero-tiles { flex-direction: column; border-radius: 10px; }
          .jhero-tile { justify-content: flex-start; text-align: left; padding: 16px 20px; }
          .jhero-tile + .jhero-tile::before { top: 0; left: 16px; width: calc(100% - 32px); height: 1px; }
        }
      `}</style>

      <div className="jc">
        <div className="jhero-wrap">

          {/* Left — branding */}
          <div>
            <div className="jhero-badge">
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00B4D8', flexShrink: 0 }} />
              Spécialiste fret aérien · Douala → Montréal
            </div>
            <h1 className="jhero-h1">
              {h.line1}{' '}
              {h.line2.includes('Douala')
                ? <>{h.line2.split('Douala')[0]}<span style={{ color: '#00B4D8' }}>Douala</span>{h.line2.split('Douala')[1]}</>
                : h.line2}{' '}
              <span style={{ color: '#00B4D8' }}>
                {h.line3.includes('Montréal') ? 'Montréal.' : h.line3}
              </span>
            </h1>
            <p className="jhero-sub">{h.subtitle}</p>
          </div>

          {/* Right — action panel */}
          <div className="jhero-panel">
            <div className="jhero-panel-hd">Pour expédier</div>
            <div className="jhero-tiles">
              <button className="jhero-tile" onClick={onBook}>
                <span className="jhero-tile-label">Créer une nouvelle expédition</span>
              </button>
              <button className="jhero-tile" onClick={() => document.getElementById('jest')?.scrollIntoView({ behavior: 'smooth' })}>
                <span className="jhero-tile-label">Obtenir un tarif et une estimation de délai</span>
              </button>
              <button className="jhero-tile" onClick={() => onNav?.('/suivi')}>
                <span className="jhero-tile-label">Suivre mon colis</span>
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
        <div className="jsvc3__head" data-reveal>
          <div className="jsvc3__eyebrow">{st.eyebrow ?? t('services.eyebrow')}</div>
          <h2 className="jsvc3__title">
            {st.title ?? t('services.title')}
          </h2>
          <p className="jsvc3__subtitle">
            {st.subtitle ?? t('services.subtitle')}
          </p>
        </div>
        <div className="jsvc3__grid">
          {svcs.map(({ Icon, num, t: title, d }, i) => (
            <div key={title} className="jsvc3__item" data-reveal data-delay={i + 1}>
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
          <div className="jfeats3__left" data-reveal>
            <div className="jfeats3__eyebrow">{st.eyebrow ?? t('features.eyebrow')}</div>
            <h2 className="jfeats3__title">
              {st.title1 ?? t('features.title1')}{' '}
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
          <div className="jfeats3__right" data-reveal data-delay="2">
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
  const cats = ITEM_CATEGORIES;
  const [liveRoutes, setLiveRoutes] = useState([]);
  const [routeId, setRouteId] = useState('');
  const [lines, setLines] = useState([{ id: 1, cat: 'standard', weight: 12 }]);

  useEffect(() => {
    fetch('/api/public/routes')
      .then(r => r.json())
      .then(data => {
        const active = Array.isArray(data) ? data : data.routes ?? [];
        setLiveRoutes(active);
        if (active.length > 0 && !routeId) setRouteId(active[0].id);
      })
      .catch(() => {});
  }, []);

  const currentRoute = liveRoutes.find(r => r.id === routeId) || liveRoutes[0];
  const fees = currentRoute ? routeFeesToCalcFees(currentRoute.fees) : DEFAULT_FEES;

  const totalWeight = lines.reduce((a, l) => a + (parseFloat(l.weight) || 0), 0);
  const allItems = lines.map(l => ({ cat: l.cat, kg: parseFloat(l.weight) || 0 }));
  // Calculate once for all items combined — uses the correct tier based on total weight
  const combined = totalWeight > 0 ? calcPrice(allItems, fees, {}, 'expedition', null) : null;

  const calcLine = (ln) => {
    const kg = parseFloat(ln.weight) || 0;
    if (!combined || !combined.tier) return { transport: 0, extras: 0, rateLabel: '—' };
    const tier = combined.tier;
    const transport = tier.transportFlat !== undefined
      ? (totalWeight > 0 ? combined.transport * (kg / totalWeight) : 0)
      : (tier.transportPerKg || 0) * kg;
    const suppRates = fees.supplements || DEFAULT_FEES.supplements;
    const catDef = ITEM_CATEGORIES.find(c => c.id === ln.cat);
    const catRate = suppRates[ln.cat] ?? catDef?.extraPerKg ?? 0;
    const catSurcharge = catRate * kg;
    const sharedExtras = combined.douane + combined.formalites + combined.manutention;
    const extras = catSurcharge + (totalWeight > 0 ? sharedExtras * (kg / totalWeight) : 0);
    const rateLabel = tier.transportPerKg
      ? tier.transportPerKg + ' CAD/kg'
      : tier.transportFlat
        ? tier.transportFlat + ' CAD forfait'
        : '—';
    return { transport, extras, rateLabel };
  };

  const computed = lines.map(calcLine);
  const grandTotal = Math.round(combined?.prixClient ?? 0);

  const addLine = () => setLines([...lines, { id: Date.now(), cat: 'standard', weight: 5 }]);
  const removeLine = (id) => setLines(lines.length > 1 ? lines.filter(l => l.id !== id) : lines);
  const updLine = (id, k, v) => setLines(lines.map(l => l.id === id ? { ...l, [k]: v } : l));

  return (
    <section className="jest-wrap" id="jest">
      <div className="jc">
        <div data-reveal style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="jsvc3__eyebrow" style={{ display: 'block', marginBottom: 10 }}>{st.eyebrow ?? t('estimator.eyebrow')}</div>
          <h2 style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 'clamp(22px, 5vw, 36px)', color: 'var(--ink-900)', fontWeight: 800, letterSpacing: '-.03em' }}>
            {st.title ?? t('estimator.title')}
          </h2>
          <p style={{ fontSize: 15, color: 'var(--ink-400)', marginTop: 12, lineHeight: 1.65, maxWidth: 440, margin: '12px auto 0' }}>
            {st.subtitle ?? t('estimator.subtitle')}
          </p>
        </div>

        <div className="jest" data-reveal data-delay="1">
          {/* ── Header: title + route selector ── */}
          <div className="jest__head">
            <I.Calculator style={{ width: 16, height: 16, color: 'var(--brand-400)' }} />
            <span className="jest__title">Simulateur de prix</span>
            <div style={{ marginLeft: 'auto' }}>
              {liveRoutes.length > 1 ? (
                <select
                  value={routeId}
                  onChange={e => setRouteId(e.target.value)}
                  className="jest__route-select"
                >
                  {liveRoutes.map(rr => (
                    <option key={rr.id} value={rr.id}>
                      {rr.label ?? `${rr.origin} → ${rr.destination}`}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="jest__route-pill">
                  {currentRoute?.label ?? `${currentRoute?.origin} → ${currentRoute?.destination}`}
                </span>
              )}
            </div>
          </div>

          {/* ── Lines ── */}
          <div className="jest__lines">
            <div className="jest__lhead">
              <span>Catégorie</span>
              <span>Poids (kg)</span>
              <span style={{ textAlign: 'right' }}>Transport</span>
              <span style={{ textAlign: 'right' }}>Autres frais</span>
              <span />
            </div>
            {lines.map((ln, i) => {
              const c = computed[i];
              return (
                <div className="jest__line" key={ln.id}>
                  {/* Category */}
                  <div className="jest__f">
                    <select value={ln.cat} onChange={e => updLine(ln.id, 'cat', e.target.value)}>
                      {cats.map(ct => <option key={ct.id} value={ct.id}>{ct.icon} {ct.label}</option>)}
                    </select>
                  </div>
                  {/* Weight */}
                  <div className="jest__f">
                    <input type="number" min="0.5" step="0.5" value={ln.weight} onChange={e => updLine(ln.id, 'weight', e.target.value)} />
                  </div>
                  {/* Transport */}
                  <div className="jest__cell" style={{ textAlign: 'right' }}>
                    <div>{Math.round(c.transport)} <span className="jest__cur">CAD</span></div>
                    <div className="jest__tier">{c.rateLabel}</div>
                  </div>
                  {/* Autres frais (douane + formalités + manutention + suppléments) */}
                  <div className="jest__cell" style={{ textAlign: 'right', color: c.extras > 0 ? 'var(--brand-600)' : c.extras < 0 ? '#059669' : 'var(--ink-300)' }}>
                    <div>{c.extras !== 0 ? (c.extras > 0 ? '+' : '') + Math.round(c.extras) + ' ' : '—'}{c.extras !== 0 && <span className="jest__cur">CAD</span>}</div>
                    <div className="jest__tier">douane · formalités · manut.</div>
                  </div>
                  {/* Delete */}
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

          {/* ── Result ── */}
          <div className="jest__res">
            <div>
              <div className="jest__total-label">
                {lines.length} article{lines.length > 1 ? 's' : ''} · {totalWeight} kg
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span className="jest__total-n">{grandTotal}</span>
                <span className="jest__total-cur">CAD</span>
                <span className="jest__transit">· max 10 jrs</span>
              </div>
            </div>
            <button className="jbtn-nav jbtn-nav--lg" style={{ marginLeft: 'auto' }} onClick={() => {
              try { sessionStorage.setItem('sim_data', JSON.stringify({ lines })); } catch {}
              onBook();
            }}>
              Réserver <I.ArrowRight style={{ width: 15, height: 15 }} />
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
          <div data-reveal>
            <div className="jsvc3__eyebrow" style={{ display: 'block', marginBottom: 12 }}>{st.eyebrow ?? t('faq.eyebrow')}</div>
            <h2 style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 'clamp(22px, 5vw, 36px)', fontWeight: 800, letterSpacing: '-.03em', color: 'var(--ink-900)', marginBottom: 16 }}>
              {st.title ?? t('faq.title')}
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--ink-400)' }}>
              {st.subtitle ?? t('faq.subtitle')}
            </p>
          </div>
          <div className="jfaq" data-reveal data-delay="2">
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
              {c.line1}{' '}{c.line2}{' '}
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

/* ─── Split promo — photo left / dark text right — full-bleed 80vh ─── */
function JSplitPromo({ onBook }) {
  return (
    <section className="jsp2-section" style={{ display: 'grid' }}>
      <style>{`
        .jsp2-section { grid-template-columns: 1fr 1fr; min-height: 80vh; }
        .jsp2-left { position: relative; overflow: hidden; min-height: 480px; }
        .jsp2-left img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
        .jsp2-left::after { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(13,46,110,.5) 0%,rgba(13,46,110,.08) 65%); }
        .jsp2-right { background: #0B1220; padding: clamp(48px,7vw,96px); display: flex; flex-direction: column; justify-content: center; }
        @media (max-width: 768px) {
          .jsp2-section { grid-template-columns: 1fr; min-height: auto; }
          .jsp2-left { min-height: 300px; }
        }
      `}</style>

      {/* Left — photo + floating cards */}
      <div className="jsp2-left">
        <img src={IMGS.cargo} alt="" />
        <div style={{ position: 'absolute', bottom: 36, left: 32, zIndex: 2, background: 'rgba(255,255,255,.96)', borderRadius: 16, padding: '16px 20px', boxShadow: '0 8px 32px rgba(0,0,0,.25)', backdropFilter: 'blur(10px)', minWidth: 230 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ background: '#EFF6FF', color: '#1B4FD8', borderRadius: 6, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>EN TRANSIT ✈️</span>
            <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace' }}>JMS-2847</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Douala → Montréal</div>
          <div style={{ fontSize: 12.5, color: '#6B7280', marginTop: 3 }}>Arrivée estimée : 14 jan.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 12 }}>
            <div style={{ height: 4, flex: 1, background: '#E5E7EB', borderRadius: 2 }}>
              <div style={{ width: '65%', height: '100%', background: 'linear-gradient(90deg,#00B4D8,#1B4FD8)', borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 11, color: '#1B4FD8', fontWeight: 700 }}>65%</span>
          </div>
        </div>
        <div style={{ position: 'absolute', top: 32, right: 32, zIndex: 2, background: 'rgba(255,255,255,.96)', borderRadius: 14, padding: '12px 16px', boxShadow: '0 4px 16px rgba(0,0,0,.2)', display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(10px)' }}>
          <span style={{ fontSize: 22 }}>📦</span>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#111827' }}>Colis reçu à Douala</div>
            <div style={{ fontSize: 11.5, color: '#6B7280' }}>Vérification en cours…</div>
          </div>
        </div>
      </div>

      {/* Right — dark text + simulator CTA */}
      <div className="jsp2-right">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 99, padding: '6px 16px', fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,.65)', marginBottom: 32, alignSelf: 'flex-start' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00B4D8' }} />
          2 500+ clients actifs
        </div>
        <h2 style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 'clamp(36px,4vw,58px)', fontWeight: 800, color: 'white', letterSpacing: '-.04em', lineHeight: 1.05, marginBottom: 20 }}>
          Le service d'envoi préféré de la <span style={{ color: '#00B4D8' }}>diaspora africaine.</span>
        </h2>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,.52)', lineHeight: 1.75, maxWidth: 400, marginBottom: 40 }}>
          Réservez en 3 minutes, déposez à Douala — votre famille reçoit à Montréal. Suivi WhatsApp inclus, paiement à la livraison.
        </p>
        <button onClick={() => document.getElementById('jest')?.scrollIntoView({ behavior: 'smooth' })} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.1)', border: '1.5px solid rgba(255,255,255,.2)', borderRadius: 10, padding: '14px 26px', fontSize: 15, fontWeight: 600, color: 'white', cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start' }}>
          <svg width="17" height="17" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          Simuler mon tarif
        </button>
      </div>
    </section>
  );
}

/* ─── Wide photo section — full-bleed with text overlay ─── */
function JWidePhoto({ onBook, content }) {
  const wp = content?.widePhoto ?? {};
  return (
    <section style={{ position: 'relative', minHeight: '80vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
      <style>{`
        .jwp-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 35%; }
        .jwp-overlay { position: absolute; inset: 0; background: linear-gradient(100deg, rgba(9,15,30,.82) 0%, rgba(9,15,30,.58) 55%, rgba(9,15,30,.38) 100%); }
        .jwp-inner { position: relative; z-index: 2; display: grid; grid-template-columns: 1fr 1fr; align-items: start; gap: 64px; width: 100%; max-width: var(--w); margin: 0 auto; padding: clamp(64px,8vh,120px) clamp(20px,5vw,72px); }
        .jwp-title { font-family:'Inter',system-ui,sans-serif; font-size: clamp(38px,5.5vw,50px); font-weight: 800; color: white; letter-spacing: -.03em; line-height: 1.1; width: 85%; }
        .jwp-right { display: flex; flex-direction: column; align-items: flex-start; gap: 24px; }
        .jwp-desc { font-size: 17px; color: rgba(255,255,255,.7); line-height: 1.75; max-width: 420px; }
        @media (max-width: 768px) {
          .jwp-inner { grid-template-columns: 1fr; gap: 28px; padding: 56px 20px; }
          .jwp-title { font-size: 35px; }
          .jwp-right { display: flex; }
          .jwp-desc { font-size: 14px; }
        }
      `}</style>
      <img className="jwp-img" src={IMGS.hero} alt="" />
      <div className="jwp-overlay" />
      <div className="jwp-inner">
        <h2 className="jwp-title">
          {wp.title ?? 'De Douala à Montréal,'} <span style={{ color: '#00B4D8' }}>{wp.titleHighlight ?? 'en 14 jours max.'}</span>
        </h2>
        <div className="jwp-right">
          <p className="jwp-desc">
            {wp.description ?? "Rejoignez 2 500+ clients qui nous font confiance pour leurs envois entre l'Afrique et le Canada. Sécurité, transparence et notification WhatsApp à chaque étape."}
          </p>
          <button className="jbtn-nav jbtn-nav--lg" onClick={onBook}>
            {wp.button ?? 'Réserver un envoi'}
            <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
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
  useScrollReveal();

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

  const { sections } = content;

  return (
    <div className="jpage">
      <style>{`
        /* ── Scroll reveal ── */
        [data-reveal] {
          opacity: 0;
          transform: translateY(36px);
          transition: opacity 0.65s cubic-bezier(.22,1,.36,1), transform 0.65s cubic-bezier(.22,1,.36,1);
        }
        [data-reveal].sr-visible { opacity: 1; transform: none; }
        [data-reveal][data-delay="1"] { transition-delay: 0.10s; }
        [data-reveal][data-delay="2"] { transition-delay: 0.20s; }
        [data-reveal][data-delay="3"] { transition-delay: 0.30s; }
        [data-reveal][data-delay="4"] { transition-delay: 0.40s; }
        [data-reveal][data-delay="5"] { transition-delay: 0.50s; }
        /* ── Chatbot animation ── */
        .jchat-panel {
          transform-origin: bottom right;
          animation: chatOpen 0.28s cubic-bezier(.34,1.56,.64,1) both;
        }
        @keyframes chatOpen {
          from { opacity: 0; transform: scale(0.88) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .jchat-btn {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .jchat-btn:hover { transform: scale(1.08); box-shadow: 0 6px 32px rgba(27,79,216,.55) !important; }
        /* ── FAQ/accordion smooth open ── */
        .jfaq__a   { animation: fadeSlide 0.25s ease both; }
        .jfeats3__item-body { animation: fadeSlide 0.25s ease both; }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>
      <SiteNav onNav={onNav} onBook={onBook} mode="landing" />
      {sections.china_coming_soon && <ChinaComingSoon onBook={onBook} content={content.comingSoon} />}
      {sections.hero && <JHero onBook={onBook} onNav={onNav} content={content} />}
      {sections.estimator  && <JEstimator onBook={onBook} content={content} />}
      {sections.story_card && <JStoryCard onBook={onBook} onNav={onNav} content={content} />}
      {sections.steps      && <JSteps onBook={onBook} content={content} />}
      {sections.wide_photo && <JWidePhoto onBook={onBook} content={content} />}
      <SiteFooter content={content} />
      <JChatBot />
    </div>
  );
}
