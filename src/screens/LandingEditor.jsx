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
  ];

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

      {/* CTA */}
      {tab === 'cta' && (
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
