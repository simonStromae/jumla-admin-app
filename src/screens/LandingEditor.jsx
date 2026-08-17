import { useState, useEffect } from 'react';
import I from '../components/Icons.jsx';
import { useAdminT } from '../lib/useAdminT.js';

const SECTION_DEFS = [
  { key: 'china_coming_soon', label: '🇨🇳 Chine → Montréal',   desc: 'Section "Bientôt disponible" avec carte animée et compte à rebours' },
  { key: 'hero',              label: '🏠 Héros principal',      desc: 'Section d\'accroche avec titre, sous-titre et statistiques' },
  { key: 'estimator',         label: '💰 Simulateur de prix',   desc: 'Calculateur de tarif en ligne avec résultat instantané' },
  { key: 'story_card',        label: '✈️ Notre histoire',       desc: 'Bloc photo + stats + bouton de suivi colis' },
  { key: 'steps',             label: '📋 Comment ça marche',    desc: 'Les 4 étapes du processus d\'expédition' },
  { key: 'wide_photo',        label: '🖼️ Photo pleine largeur', desc: 'Section photo immersive avec CTA de réservation' },
  { key: 'world_expansion', label: '🌍 Expansion mondiale', desc: 'Carte monde animée avec les nouvelles routes cargo' },
];

const DEFAULT_SECTIONS = {
  china_coming_soon: true,
  hero:              true,
  estimator:         true,
  story_card:        true,
  steps:             true,
  wide_photo:        true,
  world_expansion:   true,
};

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
      bgImage:     '',
    },
    worldExpansion: {
      eyebrow:  'Expansion mondiale',
      title:    "Jumla s'ouvre au monde",
      subtitle: 'Nos nouvelles routes cargo connectent l\'Asie, l\'Afrique et le Canada.',
      routes: [
        { from: 'Chine',   to: 'Montréal', status: 'Bientôt disponible', detail: 'Guangzhou · Shenzhen · Shanghai' },
        { from: 'Chine',   to: 'Cameroun', status: 'Bientôt disponible', detail: 'Douala · Yaoundé' },
        { from: 'Nigeria', to: 'Montréal', status: 'Bientôt disponible', detail: 'Lagos · Abuja' },
      ],
    },
    sectionTitles: {
      estimator: { eyebrow: 'Simulateur de prix', title: 'Combien coûte mon envoi ?', subtitle: 'Calculez en quelques secondes. Sans inscription, sans engagement.' },
      steps:     { eyebrow: 'Comment ça marche', title: 'Simple comme ', titleHighlight: '4 étapes', subtitle: "De Douala à Montréal — on s'occupe de tout, vous suivez en temps réel.", button: 'Créer une nouvelle expédition →' },
    },
    footer: {
      description: "Spécialiste du fret aérien international entre l'Afrique et le Canada depuis 2021. Suivi, sécurité et transparence à chaque étape.",
      copyright: '© 2026 Jumla Shipping Inc. — Tous droits réservés',
      offices: 'Douala · Montréal · Lagos · Bruxelles',
      col1Title: 'Navigation', col2Title: 'Politiques',
      email: 'info@jumlas.com',
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
      bgImage:     '',
    },
    worldExpansion: {
      eyebrow:  'Global expansion',
      title:    'Jumla goes global',
      subtitle: 'Our new cargo routes connect Asia, Africa and Canada.',
      routes: [
        { from: 'China',   to: 'Montréal', status: 'Coming soon', detail: 'Guangzhou · Shenzhen · Shanghai' },
        { from: 'China',   to: 'Cameroon', status: 'Coming soon', detail: 'Douala · Yaoundé' },
        { from: 'Nigeria', to: 'Montréal', status: 'Coming soon', detail: 'Lagos · Abuja' },
      ],
    },
    sectionTitles: {
      estimator: { eyebrow: 'Price simulator', title: 'How much does my shipment cost?', subtitle: 'Calculate in seconds. No registration, no commitment.' },
      steps:     { eyebrow: 'How it works', title: 'Simple in ', titleHighlight: '4 steps', subtitle: 'From Douala to Montréal — we handle everything, you track in real time.', button: 'Create a new shipment →' },
    },
    footer: {
      description: 'International air freight specialist between Africa and Canada since 2021. Tracking, security and transparency at every step.',
      copyright: '© 2026 Jumla Shipping Inc. — All rights reserved',
      offices: 'Douala · Montréal · Lagos · Brussels',
      col1Title: 'Navigation', col2Title: 'Policies',
      email: 'info@jumlas.com',
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

function InfoBanner({ children }) {
  return (
    <div style={{ marginBottom: 14, padding: '12px 16px', background: 'var(--brand-50)', border: '1px solid var(--brand-200)', borderRadius: 10, fontSize: 13, color: 'var(--brand-700)', lineHeight: 1.5 }}>
      {children}
    </div>
  );
}

export default function LandingEditor() {
  const [content, setContent]   = useState(DEFAULTS);
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [tab, setTab]           = useState('hero');
  const [langTab, setLangTab]   = useState('fr');
  const [saving, setSaving]     = useState(false);
  const [saved,  setSaved]      = useState(false);
  const [loaded, setLoaded]     = useState(false);
  const t = useAdminT();

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d.landing_content) {
        try {
          const parsed = JSON.parse(d.landing_content);
          if (parsed.fr || parsed.en) {
            setContent({
              fr: parsed.fr ? deepMerge(DEFAULTS.fr, parsed.fr) : DEFAULTS.fr,
              en: parsed.en ? deepMerge(DEFAULTS.en, parsed.en) : DEFAULTS.en,
            });
          } else {
            setContent(c => ({ ...c, fr: deepMerge(DEFAULTS.fr, parsed) }));
          }
        } catch {}
      }
      if (d.section_visibility) {
        try { setSections({ ...DEFAULT_SECTIONS, ...JSON.parse(d.section_visibility) }); } catch {}
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  function toggleSection(key) {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

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

  async function handleSave() {
    setSaving(true);
    await fetch('/api/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        landing_content:    JSON.stringify({ fr: content.fr, en: content.en }),
        section_visibility: JSON.stringify(sections),
      }),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const addSlide = () => setContent(c => ({
    ...c,
    [langTab]: { ...c[langTab], loginSlides: [...(c[langTab].loginSlides || []), ''] },
  }));

  const removeSlide = (i) => setContent(c => ({
    ...c,
    [langTab]: { ...c[langTab], loginSlides: (c[langTab].loginSlides || []).filter((_, idx) => idx !== i) },
  }));

  // TODO: i18n — tab labels below have no matching keys in admin-i18n.js
  const TABS = [
    { id: 'chine',     label: '🇨🇳 Chine',        icon: I.Plane },
    { id: 'expansion', label: '🌍 Expansion', icon: I.Globe },
    { id: 'hero',      label: 'Héro',             icon: I.Plane },
    { id: 'story',     label: 'Notre histoire',   icon: I.Globe },
    { id: 'steps',     label: '4 étapes',         icon: I.ArrowRight },
    { id: 'widephoto', label: 'Section photo',    icon: I.Map },
    { id: 'headings',  label: 'En-têtes',         icon: I.Tag },
    { id: 'footer',    label: 'Pied de page',     icon: I.Building },
    { id: 'slides',    label: 'Slides login',     icon: I.Eye },
  ];

  const c = content[langTab];

  if (!loaded) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-400)', fontSize: 14 }}>{t.common.loading}…</div>
  );

  return (
    <div>
      {/* Header */}
      <div className="card" style={{ marginBottom: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <I.Globe style={{ width: 18, height: 18, color: 'var(--brand-500)' }} />
        <div style={{ flex: 1 }}>
          {/* TODO: i18n — no key for 'Éditeur de page d'accueil' */}
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>Éditeur de page d'accueil</div>
          {/* TODO: i18n — no key for the subtitle description below */}
          <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>
            Modifiez les textes affichés sur la page publique. Les changements sont visibles instantanément après sauvegarde.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {saved && <span style={{ fontSize: 12, color: 'var(--ok-700)', fontWeight: 600 }}>✓ {t.common.success}</span>}
          <a href="/" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--brand-600)', textDecoration: 'none', fontWeight: 600 }}>
            {t.topbar.viewSite} →
          </a>
          <button className="btn btn--brand btn--sm" disabled={saving} onClick={handleSave}>
            <I.Check />{saving ? `${t.common.saving}…` : t.common.save}
          </button>
        </div>
      </div>

      {/* Section visibility toggles */}
      <div className="card" style={{ marginBottom: 14, padding: '16px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 14 }}>
          Sections visibles sur la page d'accueil
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {SECTION_DEFS.map(sec => (
            <label
              key={sec.key}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                border: '1px solid',
                borderColor: sections[sec.key] ? 'var(--brand-400)' : 'var(--border)',
                background: sections[sec.key] ? 'var(--brand-50, #eff6ff)' : 'var(--bg-soft)',
                transition: 'border-color .15s, background .15s',
              }}
            >
              <div style={{ marginTop: 2, flexShrink: 0 }}>
                <input
                  type="checkbox"
                  checked={!!sections[sec.key]}
                  onChange={() => toggleSection(sec.key)}
                  style={{ accentColor: 'var(--brand-500)', width: 15, height: 15, cursor: 'pointer' }}
                />
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: sections[sec.key] ? 'var(--brand-700)' : 'var(--ink-600)' }}>
                  {sec.label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 2, lineHeight: 1.4 }}>
                  {sec.desc}
                </div>
              </div>
            </label>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 10 }}>
          Le héros et le pied de page sont toujours visibles. Sauvegardez pour appliquer les changements.
        </div>
      </div>

      {/* Language toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        {/* TODO: i18n — no key for 'Langue éditée' */}
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
        {/* TODO: i18n — no key for the language scope note */}
        <span style={{ fontSize: 11, color: 'var(--ink-400)', marginLeft: 4 }}>
          — Chaque modification s'applique uniquement à la langue sélectionnée
        </span>
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '8px 10px', border: 'none', borderRadius: 7, cursor: 'pointer',
            background: tab === t.id ? 'white' : 'transparent',
            boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
            color: tab === t.id ? 'var(--ink-900)' : 'var(--ink-500)',
            fontWeight: tab === t.id ? 700 : 400, fontSize: 12.5,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, whiteSpace: 'nowrap',
          }}>
            {t.icon && <t.icon style={{ width: 13, height: 13 }} />}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Chine coming soon ── */}
      {tab === 'chine' && (
        <>
          <InfoBanner>
            Section "Bientôt disponible" affichée en premier sur la page d'accueil. Modifiez les textes, les drapeaux, la date de lancement et le CTA.
          </InfoBanner>

          <EditorCard title="Visuel de fond" icon={I.Map}>
            <Field label="URL de l'image de fond" hint="laisser vide pour le fond dégradé par défaut">
              <input className="input" placeholder="https://..." value={c.comingSoon.bgImage || ''} onChange={e => set('comingSoon.bgImage', e.target.value)} />
            </Field>
            {c.comingSoon.bgImage && (
              <div style={{ borderRadius: 8, overflow: 'hidden', height: 120 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.comingSoon.bgImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </EditorCard>

          <EditorCard title="Annonce route" icon={I.Plane}>
            <Field label="Texte de l'eyebrow" hint="petit badge en haut">
              <input className="input" value={c.comingSoon.eyebrow} onChange={e => set('comingSoon.eyebrow', e.target.value)} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Emoji pays d'origine">
                <input className="input" value={c.comingSoon.originFlag} onChange={e => set('comingSoon.originFlag', e.target.value)} style={{ fontSize: 22, textAlign: 'center' }} />
              </Field>
              <Field label="Emoji pays de destination">
                <input className="input" value={c.comingSoon.destFlag} onChange={e => set('comingSoon.destFlag', e.target.value)} style={{ fontSize: 22, textAlign: 'center' }} />
              </Field>
            </div>
            <Field label="Titre de la route" hint="ex : Chine → Montréal">
              <input className="input" value={c.comingSoon.title} onChange={e => set('comingSoon.title', e.target.value)} />
            </Field>
            <Field label="Sous-titre" hint="description courte sous le titre">
              <input className="input" value={c.comingSoon.subtitle} onChange={e => set('comingSoon.subtitle', e.target.value)} />
            </Field>
          </EditorCard>

          <EditorCard title="Compte à rebours" icon={I.Activity}>
            <Field label="Date de lancement" hint="format AAAA-MM-JJ">
              <input
                className="input"
                type="date"
                value={c.comingSoon.launchDate}
                onChange={e => set('comingSoon.launchDate', e.target.value)}
              />
            </Field>
            <Field label="Libellé date" hint="texte affiché sous le bouton">
              <input className="input" value={c.comingSoon.launchLabel} onChange={e => set('comingSoon.launchLabel', e.target.value)} />
            </Field>
          </EditorCard>

          <EditorCard title="Appel à l'action (CTA)" icon={I.ArrowRight}>
            <Field label="Titre CTA">
              <input className="input" value={c.comingSoon.ctaTitle} onChange={e => set('comingSoon.ctaTitle', e.target.value)} />
            </Field>
            <Field label="Sous-titre CTA">
              <input className="input" value={c.comingSoon.ctaSubtitle} onChange={e => set('comingSoon.ctaSubtitle', e.target.value)} />
            </Field>
            <Field label="Texte du bouton">
              <input className="input" value={c.comingSoon.ctaButton} onChange={e => set('comingSoon.ctaButton', e.target.value)} />
            </Field>
          </EditorCard>
        </>
      )}

      {/* ── World expansion ── */}
      {tab === 'expansion' && (
        <>
          <InfoBanner>
            Section "Expansion mondiale" avec carte animée. Modifiez les textes et les 3 routes affichées.
          </InfoBanner>
          <EditorCard title="Textes principaux" icon={I.Globe}>
            <Field label="Eyebrow">
              <input className="input" value={c.worldExpansion.eyebrow} onChange={e => set('worldExpansion.eyebrow', e.target.value)} />
            </Field>
            <Field label="Titre">
              <input className="input" value={c.worldExpansion.title} onChange={e => set('worldExpansion.title', e.target.value)} />
            </Field>
            <Field label="Sous-titre">
              <textarea className="input" rows={2} value={c.worldExpansion.subtitle} onChange={e => set('worldExpansion.subtitle', e.target.value)} style={{ resize: 'vertical' }} />
            </Field>
          </EditorCard>
          <EditorCard title="Routes" icon={I.ArrowRight}>
            <div style={{ fontSize: 12, color: 'var(--ink-400)', marginBottom: 14 }}>
              Les arcs sur la carte sont géographiques (fixes). Seuls les textes sont éditables.
            </div>
            {(c.worldExpansion.routes ?? []).map((route, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 14, padding: '12px 14px', background: 'var(--bg-soft)', borderRadius: 8 }}>
                <Field label={`Route ${i + 1} — Origine`}>
                  <input className="input" value={route.from} onChange={e => set(`worldExpansion.routes.${i}.from`, e.target.value)} />
                </Field>
                <Field label="Destination">
                  <input className="input" value={route.to} onChange={e => set(`worldExpansion.routes.${i}.to`, e.target.value)} />
                </Field>
                <Field label="Statut">
                  <input className="input" value={route.status} onChange={e => set(`worldExpansion.routes.${i}.status`, e.target.value)} />
                </Field>
                <Field label="Détail" hint="villes, optionnel">
                  <input className="input" value={route.detail ?? ''} onChange={e => set(`worldExpansion.routes.${i}.detail`, e.target.value)} />
                </Field>
              </div>
            ))}
          </EditorCard>
        </>
      )}

      {/* ── Héro ── */}
      {tab === 'hero' && (
        <>
          {/* TODO: i18n — InfoBanner texts have no matching keys */}
          <InfoBanner>
            Section visible en haut de la page. La ligne d'accroche, le titre H1, le sous-titre et les 3 statistiques sont éditables ici.
          </InfoBanner>
          {/* TODO: i18n — EditorCard/Field labels below have no matching keys */}
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
              <Field label="Titre — ligne 3 (en cyan)">
                <input className="input" value={c.hero.line3} onChange={e => set('hero.line3', e.target.value)} />
              </Field>
            </div>
            <Field label="Sous-titre" hint="texte descriptif sous le titre">
              <textarea className="input" rows={3} value={c.hero.subtitle} onChange={e => set('hero.subtitle', e.target.value)} style={{ resize: 'vertical' }} />
            </Field>
          </EditorCard>

          <EditorCard title="Statistiques" icon={I.Activity}>
            {/* TODO: i18n — no key for stats description */}
            <div style={{ fontSize: 12, color: 'var(--ink-500)', marginBottom: 14 }}>
              Ces 3 chiffres apparaissent dans la section "Notre histoire" (côté droit foncé).
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {c.hero.stats.map((s, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px', background: 'var(--bg-soft)', borderRadius: 8 }}>
                  {/* TODO: i18n — no key for 'Stat N', 'Valeur', 'Label' */}
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

      {/* ── Notre histoire ── */}
      {tab === 'story' && (
        <>
          {/* TODO: i18n — InfoBanner text has no matching key */}
          <InfoBanner>
            Section split photo/fond sombre. La photo cargo est fixe — seuls les textes (badge, titre, description, bouton) sont éditables.
          </InfoBanner>
          {/* TODO: i18n — 'Section Notre histoire', 'Badge', 'Titre principal', 'Texte du bouton' have no matching keys */}
          <EditorCard title="Section Notre histoire" icon={I.Globe}>
            <Field label="Badge (petit texte coloré en haut)">
              <input className="input" value={c.storyCard?.badge ?? ''} onChange={e => set('storyCard.badge', e.target.value)} />
            </Field>
            <Field label="Titre principal">
              <input className="input" value={c.storyCard?.title ?? ''} onChange={e => set('storyCard.title', e.target.value)} />
            </Field>
            <Field label={t.common.description}>
              <textarea className="input" rows={3} value={c.storyCard?.description ?? ''} onChange={e => set('storyCard.description', e.target.value)} style={{ resize: 'vertical' }} />
            </Field>
            {/* TODO: i18n — no key for 'Texte du bouton' */}
            <Field label="Texte du bouton">
              <input className="input" value={c.storyCard?.button ?? ''} onChange={e => set('storyCard.button', e.target.value)} />
            </Field>
          </EditorCard>
        </>
      )}

      {/* ── 4 étapes ── */}
      {tab === 'steps' && (
        <>
          {/* TODO: i18n — InfoBanner text has no matching key */}
          <InfoBanner>
            Section zigzag "Comment ça marche". Modifiez le titre de chaque étape, sa description et le badge de durée (ex : "3 min", "1 jour"). Les icônes sont fixes.
          </InfoBanner>

          {/* TODO: i18n — 'En-tête de la section', 'Accroche (eyebrow)', 'Bouton CTA', 'Titre (partie normale/cyan)', 'Sous-titre' have no matching keys */}
          <EditorCard title="En-tête de la section" icon={I.ArrowRight}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Accroche (eyebrow)">
                <input className="input" value={c.sectionTitles?.steps?.eyebrow ?? ''} onChange={e => set('sectionTitles.steps.eyebrow', e.target.value)} />
              </Field>
              <Field label="Bouton CTA">
                <input className="input" value={c.sectionTitles?.steps?.button ?? ''} onChange={e => set('sectionTitles.steps.button', e.target.value)} />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Titre (partie normale)">
                <input className="input" value={c.sectionTitles?.steps?.title ?? ''} onChange={e => set('sectionTitles.steps.title', e.target.value)} placeholder="Simple comme " />
              </Field>
              <Field label="Titre (partie en cyan)">
                <input className="input" value={c.sectionTitles?.steps?.titleHighlight ?? ''} onChange={e => set('sectionTitles.steps.titleHighlight', e.target.value)} placeholder="4 étapes" />
              </Field>
            </div>
            <Field label="Sous-titre">
              <textarea className="input" rows={2} value={c.sectionTitles?.steps?.subtitle ?? ''} onChange={e => set('sectionTitles.steps.subtitle', e.target.value)} style={{ resize: 'vertical' }} />
            </Field>
          </EditorCard>

          {/* TODO: i18n — 'Étape N', '(sans titre)', 'Durée / badge', 'Titre de l'étape' have no matching keys */}
          {(c.steps ?? []).map((step, i) => (
            <EditorCard key={i} title={`Étape ${i + 1} — ${step.title || '(sans titre)'}`} icon={I.ArrowRight}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                <Field label="Durée / badge" hint="ex : 3 min, 1 jour">
                  <input className="input" value={step.duration} onChange={e => set(`steps.${i}.duration`, e.target.value)} placeholder="3 min" />
                </Field>
                <Field label="Titre de l'étape">
                  <input className="input" value={step.title} onChange={e => set(`steps.${i}.title`, e.target.value)} />
                </Field>
              </div>
              <Field label={t.common.description}>
                <textarea className="input" rows={2} value={step.description} onChange={e => set(`steps.${i}.description`, e.target.value)} style={{ resize: 'vertical' }} />
              </Field>
            </EditorCard>
          ))}
        </>
      )}

      {/* ── Section photo plein écran ── */}
      {tab === 'widephoto' && (
        <>
          {/* TODO: i18n — InfoBanner text has no matching key */}
          <InfoBanner>
            Section plein écran avec photo de fond, juste avant le pied de page. Titre, description et bouton sont éditables.
          </InfoBanner>
          {/* TODO: i18n — 'Section photo plein écran', 'Titre (partie normale/cyan)', 'Texte du bouton' have no matching keys */}
          <EditorCard title="Section photo plein écran" icon={I.Map}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Titre (partie normale)">
                <input className="input" value={c.widePhoto?.title ?? ''} onChange={e => set('widePhoto.title', e.target.value)} placeholder="De Douala à Montréal," />
              </Field>
              <Field label="Titre (partie en cyan)">
                <input className="input" value={c.widePhoto?.titleHighlight ?? ''} onChange={e => set('widePhoto.titleHighlight', e.target.value)} placeholder="en 14 jours max." />
              </Field>
            </div>
            <Field label={t.common.description}>
              <textarea className="input" rows={3} value={c.widePhoto?.description ?? ''} onChange={e => set('widePhoto.description', e.target.value)} style={{ resize: 'vertical' }} />
            </Field>
            {/* TODO: i18n — no key for 'Texte du bouton' */}
            <Field label="Texte du bouton">
              <input className="input" value={c.widePhoto?.button ?? ''} onChange={e => set('widePhoto.button', e.target.value)} />
            </Field>
          </EditorCard>
        </>
      )}

      {/* ── En-têtes ── */}
      {tab === 'headings' && (
        <>
          {/* TODO: i18n — InfoBanner text has no matching key */}
          <InfoBanner>
            En-têtes des sections intermédiaires (accroche, titre, sous-titre). Ces textes apparaissent au-dessus du simulateur et de la section 4 étapes.
          </InfoBanner>
          {/* TODO: i18n — 'Section Simulateur de prix', 'Accroche (eyebrow)', 'Titre', 'Sous-titre' have no matching keys */}
          <EditorCard title="Section Simulateur de prix" icon={I.Calculator}>
            <Field label="Accroche (eyebrow)">
              <input className="input" value={c.sectionTitles?.estimator?.eyebrow ?? ''} onChange={e => set('sectionTitles.estimator.eyebrow', e.target.value)} />
            </Field>
            <Field label="Titre">
              <input className="input" value={c.sectionTitles?.estimator?.title ?? ''} onChange={e => set('sectionTitles.estimator.title', e.target.value)} />
            </Field>
            <Field label="Sous-titre">
              <textarea className="input" rows={2} value={c.sectionTitles?.estimator?.subtitle ?? ''} onChange={e => set('sectionTitles.estimator.subtitle', e.target.value)} style={{ resize: 'vertical' }} />
            </Field>
          </EditorCard>
        </>
      )}

      {/* ── Pied de page ── */}
      {tab === 'footer' && (
        <>
          {/* TODO: i18n — InfoBanner text and 'Paramètres → Apparence' reference have no matching keys */}
          <InfoBanner>
            Le logo du pied de page utilise le logo principal configuré dans <strong>Paramètres → Apparence</strong>.
          </InfoBanner>
          {/* TODO: i18n — 'Textes du pied de page', 'Copyright', 'Bureaux / Villes' have no matching keys */}
          <EditorCard title="Textes du pied de page" icon={I.Globe}>
            <Field label={t.common.description}>
              <textarea className="input" rows={3} value={c.footer?.description ?? ''} onChange={e => set('footer.description', e.target.value)} style={{ resize: 'vertical' }} />
            </Field>
            <Field label={t.common.email}>
              <input className="input" value={c.footer?.email ?? ''} onChange={e => set('footer.email', e.target.value)} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {/* TODO: i18n — no key for 'Copyright' or 'Bureaux / Villes' */}
              <Field label="Copyright">
                <input className="input" value={c.footer?.copyright ?? ''} onChange={e => set('footer.copyright', e.target.value)} />
              </Field>
              <Field label="Bureaux / Villes">
                <input className="input" value={c.footer?.offices ?? ''} onChange={e => set('footer.offices', e.target.value)} />
              </Field>
            </div>
          </EditorCard>
        </>
      )}

      {/* ── Slides login ── */}
      {tab === 'slides' && (
        <>
          {/* TODO: i18n — InfoBanner text has no matching key */}
          <InfoBanner>
            Ces messages s'affichent en rotation automatique (fade toutes les 4,5 s) dans la colonne gauche de la page connexion / inscription.
          </InfoBanner>
          {(c.loginSlides || []).map((slide, i) => (
            <div key={i} className="card" style={{ marginBottom: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                {/* TODO: i18n — no key for 'Message N' */}
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Message {i + 1}</span>
                <div style={{ flex: 1 }} />
                {(c.loginSlides || []).length > 1 && (
                  <button onClick={() => removeSlide(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bad-500)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <I.Trash style={{ width: 13, height: 13 }} /> {t.common.delete}
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
                placeholder="Entrez un message marketing..." // TODO: i18n
                style={{ resize: 'vertical' }}
              />
            </div>
          ))}
          <button onClick={addSlide} className="btn btn--ghost btn--sm" style={{ marginTop: 4 }}>
            <I.Plus style={{ width: 14, height: 14 }} /> {t.common.add}
          </button>
        </>
      )}

      {/* Floating save */}
      <div style={{ position: 'sticky', bottom: 20, display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 16px', boxShadow: '0 4px 20px rgba(0,0,0,.1)', display: 'flex', alignItems: 'center', gap: 12 }}>
          {saved && <span style={{ fontSize: 12, color: 'var(--ok-700)', fontWeight: 600 }}>✓ {t.common.success}</span>}
          <button className="btn btn--brand btn--sm" disabled={saving} onClick={handleSave}>
            <I.Check />{saving ? `${t.common.saving}…` : t.common.save}
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
