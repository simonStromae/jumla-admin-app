import { useState, useEffect } from 'react';
import I from '../components/Icons.jsx';

const DEFAULTS = {
  fr: {
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
      col1Links: [
        { label: 'Fret aérien', href: '#services' },
        { label: 'Livraison à domicile', href: '#services' },
        { label: 'Suivi de colis', href: '#jest' },
        { label: 'Tarifs', href: '#jest' },
      ],
      col2Links: [
        { label: 'À propos', href: '#features' },
        { label: 'FAQ', href: '#jfaq' },
        { label: 'Contact', href: '#jfoot' },
        { label: 'Réserver', href: '#' },
      ],
      col3Links: [
        { label: 'CGU', href: '#' },
        { label: 'CGV', href: '#' },
        { label: 'Politique de confidentialité', href: '#' },
        { label: 'Cookies', href: '#' },
      ],
    },
    ctaCard: {
      title: 'Pourquoi Jumla ?',
      reasons: [
        'Transit garanti 14 jours',
        'Suivi WhatsApp à chaque étape',
        'Vérification article par article',
        'Livraison à domicile au Canada',
        'Paiement flexible à la livraison',
      ],
      footerQuestion: 'Une question ?',
      footerWhatsapp: 'WhatsApp · Réponse en 1h',
    },
    loginSlides: [
      "Chaque colis, tracé du départ jusqu'à la remise.",
      'Réservez en ligne, déposez à Douala — livré à Montréal en 14 jours.',
      'Suivi en temps réel et notifications WhatsApp à chaque étape.',
      'Vérification article par article, bordereau signé au départ.',
    ],
  },
  en: {
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
      { title: 'Express air freight', description: 'Direct transport Douala → Montréal via our certified partners (Air France Cargo, Ethiopian Airlines). Guaranteed 14-day door-to-door delivery.' },
      { title: 'Home delivery',       description: 'Your recipient receives their parcel directly at home, anywhere in Quebec. Appointment-based time slot, signature required, payment at the door.' },
      { title: 'Real-time tracking',  description: 'Automatic WhatsApp & SMS notifications at every step — pickup, departure, transit, arrival, delivery. Sender and recipient always informed.' },
    ],
    features: [
      { title: 'Item-by-item verification',            description: 'Each parcel is photographed and listed on a signed manifest at departure. Upon arrival in Montréal, our agents verify each item. Any discrepancy triggers an immediate WhatsApp alert.' },
      { title: 'Reliable airline partner network',      description: 'Air France Cargo, Ethiopian Airlines, Turkish Cargo — we choose the most regular rotations to guarantee punctuality regardless of the season.' },
      { title: 'Automatic notifications at every step', description: 'From pickup to final delivery: you and your recipient receive a WhatsApp notification at every status change. No action required on your part.' },
      { title: 'Flexible payment on delivery',          description: 'Interac, bank transfer, Mobile Money (Orange Money, MTN) or cash — choose what works for you. No hidden fees, instant quote with our simulator.' },
      { title: 'Coverage across Canada',                description: 'Home delivery throughout Quebec or pickup at our Montréal warehouse. We also serve Toronto, Ottawa and Vancouver on group orders.' },
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
      col1Links: [
        { label: 'Air freight', href: '#services' },
        { label: 'Home delivery', href: '#services' },
        { label: 'Parcel tracking', href: '#jest' },
        { label: 'Rates', href: '#jest' },
      ],
      col2Links: [
        { label: 'About', href: '#features' },
        { label: 'FAQ', href: '#jfaq' },
        { label: 'Contact', href: '#jfoot' },
        { label: 'Book', href: '#' },
      ],
      col3Links: [
        { label: 'Terms of use', href: '#' },
        { label: 'Terms of sale', href: '#' },
        { label: 'Privacy policy', href: '#' },
        { label: 'Cookies', href: '#' },
      ],
    },
    ctaCard: {
      title: 'Why Jumla?',
      reasons: [
        '14-day guaranteed transit',
        'WhatsApp tracking at every step',
        'Item-by-item verification',
        'Home delivery across Canada',
        'Flexible payment on delivery',
      ],
      footerQuestion: 'A question?',
      footerWhatsapp: 'WhatsApp · Reply in 1h',
    },
    loginSlides: [
      'Every parcel, tracked from departure to delivery.',
      'Book online, drop off in Douala — delivered to Montréal in 14 days.',
      'Real-time tracking with WhatsApp notifications at every step.',
      'Item-by-item verification, signed manifest at departure.',
    ],
  },
};

function EditorCard({ title, icon: Icon, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer',
          borderBottom: open ? '1px solid var(--border-soft)' : 'none',
        }}>
        {Icon && <Icon style={{ width: 15, height: 15, color: 'var(--brand-500)' }} />}
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)', flex: 1, textAlign: 'left' }}>{title}</span>
        <span style={{ fontSize: 16, color: 'var(--ink-400)', lineHeight: 1 }}>{open ? '−' : '+'}</span>
      </button>
      {open && <div style={{ padding: 20 }}>{children}</div>}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="field">
      <label className="label">
        {label}
        {hint && <span className="opt" style={{ marginLeft: 6 }}>/ {hint}</span>}
      </label>
      {children}
    </div>
  );
}

export default function LandingEditor() {
  const [content, setContent] = useState(DEFAULTS);
  const [tab, setTab]         = useState('hero');
  const [langTab, setLangTab] = useState('fr');
  const [saving, setSaving]   = useState(false);
  const [saved,  setSaved]    = useState(false);
  const [loaded, setLoaded]   = useState(false);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d.landing_content) {
        try {
          const parsed = JSON.parse(d.landing_content);
          if (parsed.fr || parsed.en) {
            // Bilingual structure — merge each language
            setContent({
              fr: parsed.fr ? deepMerge(DEFAULTS.fr, parsed.fr) : DEFAULTS.fr,
              en: parsed.en ? deepMerge(DEFAULTS.en, parsed.en) : DEFAULTS.en,
            });
          } else {
            // Legacy flat structure — treat as FR, keep EN as default
            setContent(c => ({ ...c, fr: deepMerge(DEFAULTS.fr, parsed) }));
          }
        } catch {}
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const set = (path, value) => {
    setContent(prev => {
      const next = structuredClone(prev);
      const keys = [langTab, ...path.split('.')];
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!isNaN(k)) obj = obj[parseInt(k)];
        else obj = obj[k];
      }
      const last = keys[keys.length - 1];
      if (!isNaN(last)) obj[parseInt(last)] = value;
      else obj[last] = value;
      return next;
    });
  };

  const addFaq = () => setContent(c => ({
    ...c,
    [langTab]: { ...c[langTab], faq: [...c[langTab].faq, { question: '', answer: '' }] },
  }));

  const removeFaq = (i) => setContent(c => ({
    ...c,
    [langTab]: { ...c[langTab], faq: c[langTab].faq.filter((_, idx) => idx !== i) },
  }));

  async function handleSave() {
    setSaving(true);
    await fetch('/api/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ landing_content: JSON.stringify({ fr: content.fr, en: content.en }) }),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const TABS = [
    { id: 'hero',     label: 'Héro' },
    { id: 'services', label: 'Services' },
    { id: 'features', label: 'Points forts' },
    { id: 'faq',      label: 'FAQ' },
    { id: 'cta',      label: 'CTA' },
    { id: 'headings', label: 'En-têtes' },
    { id: 'tracking', label: 'Carte suivi' },
    { id: 'footer',   label: 'Pied de page' },
    { id: 'slides',   label: 'Slides login' },
  ];

  const addColLink = (col) => setContent(c => ({
    ...c,
    [langTab]: {
      ...c[langTab],
      footer: { ...c[langTab].footer, [col]: [...(c[langTab].footer[col] || []), { label: '', href: '#' }] },
    },
  }));

  const removeColLink = (col, i) => setContent(c => ({
    ...c,
    [langTab]: {
      ...c[langTab],
      footer: { ...c[langTab].footer, [col]: c[langTab].footer[col].filter((_, idx) => idx !== i) },
    },
  }));

  const addCtaReason = () => setContent(c => ({
    ...c,
    [langTab]: { ...c[langTab], ctaCard: { ...c[langTab].ctaCard, reasons: [...(c[langTab].ctaCard?.reasons || []), ''] } },
  }));

  const removeCtaReason = (i) => setContent(c => ({
    ...c,
    [langTab]: { ...c[langTab], ctaCard: { ...c[langTab].ctaCard, reasons: c[langTab].ctaCard.reasons.filter((_, idx) => idx !== i) } },
  }));

  const addSlide = () => setContent(c => ({
    ...c,
    [langTab]: { ...c[langTab], loginSlides: [...(c[langTab].loginSlides || []), ''] },
  }));

  const removeSlide = (i) => setContent(c => ({
    ...c,
    [langTab]: { ...c[langTab], loginSlides: (c[langTab].loginSlides || []).filter((_, idx) => idx !== i) },
  }));

  const c = content[langTab];

  if (!loaded) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-400)', fontSize: 14 }}>Chargement…</div>
  );

  return (
    <div>
      {/* Header */}
      <div className="card" style={{ marginBottom: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <I.Globe style={{ width: 18, height: 18, color: 'var(--brand-500)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>Éditeur de page d'accueil</div>
          <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>
            Modifiez les textes affichés sur la page publique. Les changements sont visibles instantanément après sauvegarde.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {saved && <span style={{ fontSize: 12, color: 'var(--ok-700)', fontWeight: 600 }}>✓ Sauvegardé</span>}
          <a href="/" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--brand-600)', textDecoration: 'none', fontWeight: 600 }}>
            Voir la page →
          </a>
          <button className="btn btn--brand btn--sm" disabled={saving} onClick={handleSave}>
            <I.Check />{saving ? 'Enregistrement…' : 'Enregistrer tout'}
          </button>
        </div>
      </div>

      {/* Language toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: 'var(--ink-500)', fontWeight: 600 }}>Langue éditée :</span>
        {[{ id: 'fr', flag: '🇫🇷', label: 'Français' }, { id: 'en', flag: '🇬🇧', label: 'English' }].map(l => (
          <button
            key={l.id}
            onClick={() => setLangTab(l.id)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', border: '1px solid',
              borderColor: langTab === l.id ? 'var(--brand-500)' : 'var(--border)',
              borderRadius: 8, cursor: 'pointer',
              background: langTab === l.id ? 'var(--brand-50, #eff6ff)' : 'transparent',
              color: langTab === l.id ? 'var(--brand-700)' : 'var(--ink-500)',
              fontWeight: langTab === l.id ? 700 : 400, fontSize: 13,
            }}>
            {l.flag} {l.label}
          </button>
        ))}
        <span style={{ fontSize: 11, color: 'var(--ink-400)', marginLeft: 4 }}>
          — Chaque modification s'applique uniquement à la langue sélectionnée
        </span>
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 10, padding: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '8px 12px', border: 'none', borderRadius: 7, cursor: 'pointer',
            background: tab === t.id ? 'white' : 'transparent',
            boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
            color: tab === t.id ? 'var(--ink-900)' : 'var(--ink-500)',
            fontWeight: tab === t.id ? 700 : 400, fontSize: 13,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Hero */}
      {tab === 'hero' && (
        <>
          <EditorCard title="Bandeau d'accroche" icon={I.Plane}>
            <Field label="Phrase d'accroche" hint="petite ligne au-dessus du titre">
              <input className="input" value={c.hero.eyebrow} onChange={e => set('hero.eyebrow', e.target.value)} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <Field label="Titre — ligne 1">
                <input className="input" value={c.hero.line1} onChange={e => set('hero.line1', e.target.value)} />
              </Field>
              <Field label="Titre — ligne 2">
                <input className="input" value={c.hero.line2} onChange={e => set('hero.line2', e.target.value)} />
              </Field>
              <Field label="Titre — ligne 3">
                <input className="input" value={c.hero.line3} onChange={e => set('hero.line3', e.target.value)} />
              </Field>
            </div>
            <Field label="Sous-titre" hint="texte descriptif sous le titre">
              <textarea className="input" rows={3} value={c.hero.subtitle} onChange={e => set('hero.subtitle', e.target.value)} style={{ resize: 'vertical' }} />
            </Field>
          </EditorCard>

          <EditorCard title="Statistiques" icon={I.Activity}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {c.hero.stats.map((s, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px', background: 'var(--bg-soft)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-500)' }}>Stat {i + 1}</div>
                  <Field label="Valeur">
                    <input className="input" value={s.value} onChange={e => set(`hero.stats.${i}.value`, e.target.value)} placeholder="14 jours" />
                  </Field>
                  <Field label="Label">
                    <input className="input" value={s.label} onChange={e => set(`hero.stats.${i}.label`, e.target.value)} placeholder="Transit moyen" />
                  </Field>
                </div>
              ))}
            </div>
          </EditorCard>
        </>
      )}

      {/* Services */}
      {tab === 'services' && c.services.map((svc, i) => (
        <EditorCard key={i} title={`Service ${i + 1} — ${svc.title || '(sans titre)'}`} icon={I.Box}>
          <Field label="Titre">
            <input className="input" value={svc.title} onChange={e => set(`services.${i}.title`, e.target.value)} />
          </Field>
          <Field label="Description">
            <textarea className="input" rows={3} value={svc.description} onChange={e => set(`services.${i}.description`, e.target.value)} style={{ resize: 'vertical' }} />
          </Field>
        </EditorCard>
      ))}

      {/* Features */}
      {tab === 'features' && c.features.map((feat, i) => (
        <EditorCard key={i} title={`Point fort ${i + 1} — ${feat.title || '(sans titre)'}`} icon={I.Sparkle}>
          <Field label="Titre (affiché dans l'accordéon)">
            <input className="input" value={feat.title} onChange={e => set(`features.${i}.title`, e.target.value)} />
          </Field>
          <Field label="Explication (visible quand ouvert)">
            <textarea className="input" rows={3} value={feat.description} onChange={e => set(`features.${i}.description`, e.target.value)} style={{ resize: 'vertical' }} />
          </Field>
        </EditorCard>
      ))}

      {/* FAQ */}
      {tab === 'faq' && (
        <>
          {c.faq.map((item, i) => (
            <div key={i} className="card" style={{ marginBottom: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Q{i + 1}</span>
                <div style={{ flex: 1 }} />
                {c.faq.length > 1 && (
                  <button onClick={() => removeFaq(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bad-500)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <I.Trash style={{ width: 13, height: 13 }} /> Supprimer
                  </button>
                )}
              </div>
              <Field label="Question">
                <input className="input" value={item.question} onChange={e => set(`faq.${i}.question`, e.target.value)} />
              </Field>
              <Field label="Réponse">
                <textarea className="input" rows={3} value={item.answer} onChange={e => set(`faq.${i}.answer`, e.target.value)} style={{ resize: 'vertical' }} />
              </Field>
            </div>
          ))}
          <button onClick={addFaq} className="btn btn--ghost btn--sm" style={{ marginTop: 4 }}>
            <I.Plus style={{ width: 14, height: 14 }} /> Ajouter une question
          </button>
        </>
      )}

      {tab === 'headings' && (
        <>
          <EditorCard title="Section Services" icon={I.Plane}>
            <Field label="Accroche (eyebrow)"><input className="input" value={c.sectionTitles.services.eyebrow} onChange={e => set('sectionTitles.services.eyebrow', e.target.value)} /></Field>
            <Field label="Titre"><input className="input" value={c.sectionTitles.services.title} onChange={e => set('sectionTitles.services.title', e.target.value)} /></Field>
            <Field label="Sous-titre"><textarea className="input" rows={2} value={c.sectionTitles.services.subtitle} onChange={e => set('sectionTitles.services.subtitle', e.target.value)} style={{ resize: 'vertical' }} /></Field>
          </EditorCard>
          <EditorCard title="Section Points forts" icon={I.Sparkle}>
            <Field label="Accroche (eyebrow)"><input className="input" value={c.sectionTitles.features.eyebrow} onChange={e => set('sectionTitles.features.eyebrow', e.target.value)} /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Titre ligne 1"><input className="input" value={c.sectionTitles.features.title1} onChange={e => set('sectionTitles.features.title1', e.target.value)} /></Field>
              <Field label="Titre ligne 2 (en cyan)"><input className="input" value={c.sectionTitles.features.title2} onChange={e => set('sectionTitles.features.title2', e.target.value)} /></Field>
            </div>
            <Field label="Description"><textarea className="input" rows={2} value={c.sectionTitles.features.description} onChange={e => set('sectionTitles.features.description', e.target.value)} style={{ resize: 'vertical' }} /></Field>
          </EditorCard>
          <EditorCard title="Section Simulateur" icon={I.Calculator}>
            <Field label="Accroche (eyebrow)"><input className="input" value={c.sectionTitles.estimator.eyebrow} onChange={e => set('sectionTitles.estimator.eyebrow', e.target.value)} /></Field>
            <Field label="Titre"><input className="input" value={c.sectionTitles.estimator.title} onChange={e => set('sectionTitles.estimator.title', e.target.value)} /></Field>
            <Field label="Sous-titre"><textarea className="input" rows={2} value={c.sectionTitles.estimator.subtitle} onChange={e => set('sectionTitles.estimator.subtitle', e.target.value)} style={{ resize: 'vertical' }} /></Field>
          </EditorCard>
          <EditorCard title="Section FAQ" icon={I.Help}>
            <Field label="Accroche (eyebrow)"><input className="input" value={c.sectionTitles.faq.eyebrow} onChange={e => set('sectionTitles.faq.eyebrow', e.target.value)} /></Field>
            <Field label="Titre"><input className="input" value={c.sectionTitles.faq.title} onChange={e => set('sectionTitles.faq.title', e.target.value)} /></Field>
            <Field label="Sous-titre"><textarea className="input" rows={2} value={c.sectionTitles.faq.subtitle} onChange={e => set('sectionTitles.faq.subtitle', e.target.value)} style={{ resize: 'vertical' }} /></Field>
          </EditorCard>
        </>
      )}

      {tab === 'tracking' && (
        <EditorCard title="Carte de suivi (colonne droite du héro)" icon={I.Search}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Titre de la carte"><input className="input" value={c.trackingCard.title} onChange={e => set('trackingCard.title', e.target.value)} /></Field>
            <Field label="Label du champ"><input className="input" value={c.trackingCard.label} onChange={e => set('trackingCard.label', e.target.value)} /></Field>
            <Field label="Placeholder"><input className="input" value={c.trackingCard.placeholder} onChange={e => set('trackingCard.placeholder', e.target.value)} /></Field>
            <Field label="Texte du bouton"><input className="input" value={c.trackingCard.button} onChange={e => set('trackingCard.button', e.target.value)} /></Field>
          </div>
          <Field label="Badge (ligne sous la route)"><input className="input" value={c.trackingCard.badge} onChange={e => set('trackingCard.badge', e.target.value)} /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Ville de départ (ex: DOUALA)"><input className="input" value={c.trackingCard.cityFrom} onChange={e => set('trackingCard.cityFrom', e.target.value)} /></Field>
            <Field label="Sous-titre départ (ex: DLA · Cameroun)"><input className="input" value={c.trackingCard.cityFromSub} onChange={e => set('trackingCard.cityFromSub', e.target.value)} /></Field>
            <Field label="Ville d'arrivée (ex: MONTRÉAL)"><input className="input" value={c.trackingCard.cityTo} onChange={e => set('trackingCard.cityTo', e.target.value)} /></Field>
            <Field label="Sous-titre arrivée (ex: YUL · Canada)"><input className="input" value={c.trackingCard.cityToSub} onChange={e => set('trackingCard.cityToSub', e.target.value)} /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Texte CTA (ex: Pas encore client ?)"><input className="input" value={c.trackingCard.ctaText} onChange={e => set('trackingCard.ctaText', e.target.value)} /></Field>
            <Field label="Lien CTA (ex: Créer un envoi)"><input className="input" value={c.trackingCard.ctaLink} onChange={e => set('trackingCard.ctaLink', e.target.value)} /></Field>
          </div>
        </EditorCard>
      )}

      {tab === 'footer' && (
        <>
          <div className="card" style={{ marginBottom: 14, padding: '14px 20px', background: 'var(--brand-50)', border: '1px solid var(--brand-200)' }}>
            <div style={{ fontSize: 13, color: 'var(--brand-700)' }}>
              Le logo du pied de page utilise le logo principal configuré dans <strong>Paramètres → Apparence</strong>.
            </div>
          </div>
          <EditorCard title="Textes du pied de page" icon={I.Globe}>
            <Field label="Description (sous le logo)">
              <textarea className="input" rows={3} value={c.footer.description} onChange={e => set('footer.description', e.target.value)} style={{ resize: 'vertical' }} />
            </Field>
            <Field label="Email de contact"><input className="input" value={c.footer.email} onChange={e => set('footer.email', e.target.value)} /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Copyright"><input className="input" value={c.footer.copyright} onChange={e => set('footer.copyright', e.target.value)} /></Field>
              <Field label="Bureaux / Villes"><input className="input" value={c.footer.offices} onChange={e => set('footer.offices', e.target.value)} /></Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 4 }}>
              <Field label="Titre colonne 1"><input className="input" value={c.footer.col1Title} onChange={e => set('footer.col1Title', e.target.value)} /></Field>
              <Field label="Titre colonne 2"><input className="input" value={c.footer.col2Title} onChange={e => set('footer.col2Title', e.target.value)} /></Field>
              <Field label="Titre colonne 3"><input className="input" value={c.footer.col3Title} onChange={e => set('footer.col3Title', e.target.value)} /></Field>
            </div>
          </EditorCard>

          {[
            { key: 'col1Links', label: `Liens colonne 1 — ${c.footer.col1Title}` },
            { key: 'col2Links', label: `Liens colonne 2 — ${c.footer.col2Title}` },
            { key: 'col3Links', label: `Liens colonne 3 — ${c.footer.col3Title}` },
          ].map(({ key, label }) => (
            <EditorCard key={key} title={label} icon={I.Globe}>
              {(c.footer[key] || []).map((link, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end', marginBottom: 8 }}>
                  <Field label={i === 0 ? 'Libellé' : undefined}>
                    <input className="input" value={link.label} onChange={e => {
                      setContent(prev => {
                        const next = structuredClone(prev);
                        next[langTab].footer[key][i].label = e.target.value;
                        return next;
                      });
                    }} placeholder="Nom du lien" />
                  </Field>
                  <Field label={i === 0 ? 'URL / ancre' : undefined}>
                    <input className="input" value={link.href} onChange={e => {
                      setContent(prev => {
                        const next = structuredClone(prev);
                        next[langTab].footer[key][i].href = e.target.value;
                        return next;
                      });
                    }} placeholder="#section ou /page" />
                  </Field>
                  <button onClick={() => removeColLink(key, i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bad-500)', padding: '8px 6px', alignSelf: 'flex-end' }}>
                    <I.Trash style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              ))}
              <button onClick={() => addColLink(key)} className="btn btn--ghost btn--sm" style={{ marginTop: 4 }}>
                <I.Plus style={{ width: 14, height: 14 }} /> Ajouter un lien
              </button>
            </EditorCard>
          ))}
        </>
      )}

      {/* Login Slides */}
      {tab === 'slides' && (
        <>
          <div className="card" style={{ marginBottom: 14, padding: '14px 20px', background: 'var(--brand-50)', border: '1px solid var(--brand-200)' }}>
            <div style={{ fontSize: 13, color: 'var(--brand-700)', lineHeight: 1.5 }}>
              Ces messages s'affichent en rotation automatique (fade toutes les 4,5 s) dans la colonne gauche de la page connexion / inscription. Chaque message remplace le titre principal.
            </div>
          </div>
          {(c.loginSlides || []).map((slide, i) => (
            <div key={i} className="card" style={{ marginBottom: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Message {i + 1}</span>
                <div style={{ flex: 1 }} />
                {(c.loginSlides || []).length > 1 && (
                  <button onClick={() => removeSlide(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bad-500)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <I.Trash style={{ width: 13, height: 13 }} /> Supprimer
                  </button>
                )}
              </div>
              <textarea className="input" rows={2}
                value={slide}
                onChange={e => {
                  setContent(prev => {
                    const next = structuredClone(prev);
                    next[langTab].loginSlides[i] = e.target.value;
                    return next;
                  });
                }}
                placeholder="Entrez un message marketing..."
                style={{ resize: 'vertical' }}
              />
            </div>
          ))}
          <button onClick={addSlide} className="btn btn--ghost btn--sm" style={{ marginTop: 4 }}>
            <I.Plus style={{ width: 14, height: 14 }} /> Ajouter un message
          </button>
        </>
      )}

      {/* CTA */}
      {tab === 'cta' && (
        <>
          <EditorCard title="Section appel à l'action" icon={I.ArrowRight}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <Field label="Titre — ligne 1">
                <input className="input" value={c.cta.line1} onChange={e => set('cta.line1', e.target.value)} />
              </Field>
              <Field label="Titre — ligne 2">
                <input className="input" value={c.cta.line2} onChange={e => set('cta.line2', e.target.value)} />
              </Field>
              <Field label="Titre — ligne 3 (en cyan)">
                <input className="input" value={c.cta.line3} onChange={e => set('cta.line3', e.target.value)} />
              </Field>
            </div>
            <Field label="Sous-titre">
              <textarea className="input" rows={2} value={c.cta.subtitle} onChange={e => set('cta.subtitle', e.target.value)} style={{ resize: 'vertical' }} />
            </Field>
          </EditorCard>

          <EditorCard title="Carte flottante (colonne droite)" icon={I.Check}>
            <Field label="Titre de la carte">
              <input className="input" value={c.ctaCard?.title ?? ''} onChange={e => set('ctaCard.title', e.target.value)} />
            </Field>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-600)', margin: '12px 0 8px' }}>Points de réassurance</div>
            {(c.ctaCard?.reasons || []).map((reason, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <input className="input" value={reason} onChange={e => {
                  setContent(prev => {
                    const next = structuredClone(prev);
                    if (!next[langTab].ctaCard) next[langTab].ctaCard = {};
                    if (!next[langTab].ctaCard.reasons) next[langTab].ctaCard.reasons = [];
                    next[langTab].ctaCard.reasons[i] = e.target.value;
                    return next;
                  });
                }} placeholder="Ex: Transit garanti 14 jours" />
                <button onClick={() => removeCtaReason(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bad-500)', padding: '8px 6px' }}>
                  <I.Trash style={{ width: 14, height: 14 }} />
                </button>
              </div>
            ))}
            <button onClick={addCtaReason} className="btn btn--ghost btn--sm" style={{ marginTop: 4, marginBottom: 16 }}>
              <I.Plus style={{ width: 14, height: 14 }} /> Ajouter une raison
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Question pied de carte">
                <input className="input" value={c.ctaCard?.footerQuestion ?? ''} onChange={e => set('ctaCard.footerQuestion', e.target.value)} />
              </Field>
              <Field label="Lien WhatsApp (texte)">
                <input className="input" value={c.ctaCard?.footerWhatsapp ?? ''} onChange={e => set('ctaCard.footerWhatsapp', e.target.value)} />
              </Field>
            </div>
          </EditorCard>
        </>
      )}

      {/* Floating save */}
      <div style={{ position: 'sticky', bottom: 20, display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 16px', boxShadow: '0 4px 20px rgba(0,0,0,.1)', display: 'flex', alignItems: 'center', gap: 12 }}>
          {saved && <span style={{ fontSize: 12, color: 'var(--ok-700)', fontWeight: 600 }}>✓ Sauvegardé</span>}
          <button className="btn btn--brand btn--sm" disabled={saving} onClick={handleSave}>
            <I.Check />{saving ? 'Enregistrement…' : 'Enregistrer tout'}
          </button>
        </div>
      </div>
    </div>
  );
}

function deepMerge(target, source) {
  if (typeof source !== 'object' || source === null) return source;
  if (Array.isArray(source)) return source;
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (key in result && typeof result[key] === 'object' && !Array.isArray(result[key])) {
      result[key] = deepMerge(result[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
