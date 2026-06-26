import { useState, useEffect } from 'react';
import I from '../components/Icons.jsx';

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
    { title: 'Vérification article par article',        description: "Chaque colis est photographié et listé sur un bordereau signé au départ. À l'arrivée à Montréal, nos agents vérifient chaque article. En cas d'écart, vous êtes alertés immédiatement par WhatsApp." },
    { title: 'Réseau de partenaires aériens fiables',   description: 'Air France Cargo, Ethiopian Airlines, Turkish Cargo — nous choisissons les rotations les plus régulières pour garantir la ponctualité de vos livraisons quelles que soient les saisons.' },
    { title: 'Notifications automatiques à chaque étape', description: "Dès la prise en charge jusqu'à la remise finale : vous et votre destinataire recevez une notification WhatsApp à chaque changement de statut. Aucune démarche nécessaire de votre côté." },
    { title: 'Paiement flexible à la livraison',        description: 'Interac, virement bancaire, Mobile Money (Orange Money, MTN) ou espèces — choisissez le mode qui vous convient. Aucun frais caché, devis instantané avec notre simulateur.' },
    { title: 'Couverture dans tout le Canada',          description: "Livraison à domicile dans tout le Québec ou retrait à notre entrepôt de Montréal. Nous desservons également Toronto, Ottawa et Vancouver sur commande groupée." },
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
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [tab, setTab]         = useState('hero');
  const [saving, setSaving]   = useState(false);
  const [saved,  setSaved]    = useState(false);
  const [loaded, setLoaded]   = useState(false);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d.landing_content) {
        try {
          const parsed = JSON.parse(d.landing_content);
          setContent(c => deepMerge(c, parsed));
        } catch {}
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const set = (path, value) => {
    setContent(prev => {
      const next = structuredClone(prev);
      const keys = path.split('.');
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
    ...c, faq: [...c.faq, { question: '', answer: '' }],
  }));
  const removeFaq = (i) => setContent(c => ({
    ...c, faq: c.faq.filter((_, idx) => idx !== i),
  }));

  async function handleSave() {
    setSaving(true);
    await fetch('/api/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ landing_content: JSON.stringify(content) }),
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

      {/* Tabs */}
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
              <input className="input" value={content.hero.eyebrow} onChange={e => set('hero.eyebrow', e.target.value)} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <Field label="Titre — ligne 1">
                <input className="input" value={content.hero.line1} onChange={e => set('hero.line1', e.target.value)} />
              </Field>
              <Field label="Titre — ligne 2">
                <input className="input" value={content.hero.line2} onChange={e => set('hero.line2', e.target.value)} />
              </Field>
              <Field label="Titre — ligne 3">
                <input className="input" value={content.hero.line3} onChange={e => set('hero.line3', e.target.value)} />
              </Field>
            </div>
            <Field label="Sous-titre" hint="texte descriptif sous le titre">
              <textarea className="input" rows={3} value={content.hero.subtitle} onChange={e => set('hero.subtitle', e.target.value)} style={{ resize: 'vertical' }} />
            </Field>
          </EditorCard>

          <EditorCard title="Statistiques" icon={I.Activity}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {content.hero.stats.map((s, i) => (
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
      {tab === 'services' && content.services.map((svc, i) => (
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
      {tab === 'features' && content.features.map((feat, i) => (
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
          {content.faq.map((item, i) => (
            <div key={i} className="card" style={{ marginBottom: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Q{i + 1}</span>
                <div style={{ flex: 1 }} />
                {content.faq.length > 1 && (
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
              <input className="input" value={content.cta.line1} onChange={e => set('cta.line1', e.target.value)} />
            </Field>
            <Field label="Titre — ligne 2">
              <input className="input" value={content.cta.line2} onChange={e => set('cta.line2', e.target.value)} />
            </Field>
            <Field label="Titre — ligne 3 (en cyan)">
              <input className="input" value={content.cta.line3} onChange={e => set('cta.line3', e.target.value)} />
            </Field>
          </div>
          <Field label="Sous-titre">
            <textarea className="input" rows={2} value={content.cta.subtitle} onChange={e => set('cta.subtitle', e.target.value)} style={{ resize: 'vertical' }} />
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
