'use client';
import { useState, useEffect } from 'react';

// ─── Content ────────────────────────────────────────────────────────────────

const ADMIN_ARTICLES = [
  {
    id: 'cargaison-create', section: 'Cargaisons', icon: '✈️',
    title: 'Créer une cargaison',
    body: `Une cargaison représente un vol de fret.
1. Allez dans **Cargaisons → Nouvelle cargaison**
2. Sélectionnez la route (ex: DLA → MTL)
3. Le code est généré automatiquement, vous pouvez le personnaliser
4. Renseignez les dates de départ et d'arrivée estimée
5. La capacité en kg est optionnelle mais utile pour le suivi de remplissage`,
  },
  {
    id: 'cargaison-statuts', section: 'Cargaisons', icon: '📋',
    title: 'Comprendre les statuts',
    body: `Les statuts suivent le cycle de vie de la cargaison :

**Ouverte (ENR)** — en cours d'enregistrement, on peut ajouter des colis
**Expédiée (EXP)** — partie de l'origine
**En transit (TRA)** — en cours de transport
**Arrivée au pays (APD)** — arrivée à destination
**En douane (DOU)** — présentée aux douanes canadiennes
**Libérée (LIB)** — dédouanée
**Entrepôt destination (ARD)** — disponible à notre entrepôt
**Prête livraison (PDL)** — livraison imminente
**Clôturée (OK)** — terminée

Changer le statut d'une cargaison met automatiquement à jour les colis associés.`,
  },
  {
    id: 'cargaison-airlines', section: 'Cargaisons', icon: '🏢',
    title: 'Compagnies aériennes & AWB',
    body: `Un leg = un tronçon avec une compagnie aérienne.

Une cargaison peut être divisée sur plusieurs compagnies (ex: Lufthansa pour les effets, Air France pour les marchandises).

**Ajouter un leg :** depuis le détail de la cargaison → section *Legs de transport* → associez compagnie + numéro AWB + poids.

Le numéro **AWB** (Air Waybill) est le connaissement aérien fourni par la compagnie.`,
  },
  {
    id: 'cargaison-costs', section: 'Cargaisons', icon: '💰',
    title: 'Coûts d\'une cargaison',
    body: `Gérez les coûts depuis **Coûts → icône calculatrice** sur la cargaison.

**Postes fixes :** Fret aérien, Douanes, Entreposage, Transport local, Manutention, Assurance.

**Coûts supplémentaires :** ajoutez des lignes libres (label + montant) pour tout frais spécifique.

La marge est calculée automatiquement : CA facturé − Total des coûts.`,
  },
  {
    id: 'clients-manage', section: 'Clients', icon: '👥',
    title: 'Gérer les clients',
    body: `L'écran **Expéditeurs** liste tous les clients enregistrés.

**Depuis la fiche client vous pouvez :**
• Voir l'historique complet de colis
• Contacter par WhatsApp avec un modèle pré-rempli
• Suspendre / réactiver le compte
• Renvoyer l'email de vérification si le compte n'est pas encore vérifié
• Supprimer le compte`,
  },
  {
    id: 'colis-add', section: 'Colis', icon: '📦',
    title: 'Ajouter un colis',
    body: `Depuis le détail d'une cargaison → **Ajouter un colis**.

**Champs importants :**
• **Client** — recherche par nom, email ou téléphone
• **Poids réel (kg)** — sert au calcul du prix
• **Code de suivi** — généré automatiquement, modifiable
• **Prix** — peut être calculé selon la grille tarifaire de la route`,
  },
  {
    id: 'paiement', section: 'Colis', icon: '💳',
    title: 'Enregistrer un paiement',
    body: `Depuis la fiche d'un colis → section **Paiement**.

**Types :** Paiement complet, Acompte (partiel), Paiement supplémentaire (surpoids).

**Modes :** Virement, Chèque, Espèces, Mobile Money.

Un reçu PDF peut être généré et envoyé au client.`,
  },
  {
    id: 'analytics', section: 'Analyses', icon: '📊',
    title: 'Lire les analyses',
    body: `L'écran **Analyses** présente les données de l'année en cours.

**Métriques :** CA total, poids total, nombre de colis et clients actifs, évolution mensuelle, top destinations, top clients fidèles, répartition par compagnie aérienne.

**Changer d'année :** sélecteur en haut à droite.`,
  },
  {
    id: 'settings-routes', section: 'Paramètres', icon: '🗺️',
    title: 'Routes & tarifs',
    body: `Dans **Paramètres → Routes & tarifs** :

• Créez des routes avec codes IATA (ex: DLA → MTL)
• Définissez une grille tarifaire par tranche de poids
• Activez/désactivez une route sans la supprimer

Le tarif s'applique automatiquement lors de la création d'un colis.`,
  },
  {
    id: 'settings-whatsapp', section: 'Paramètres', icon: '💬',
    title: 'Modèles WhatsApp',
    body: `Dans **Paramètres → WhatsApp**, personnalisez les 5 modèles de messages.

**Variables disponibles :**
\`{first_name}\` \`{parcel_code}\` \`{amount}\` \`{weight}\` \`{arrival_date}\`

Les messages sont envoyés depuis la fiche client ou en masse depuis une cargaison.`,
  },
];

const CLIENT_ARTICLES = [
  {
    id: 'cl-dashboard', section: 'Mes colis', icon: '📦',
    title: 'Consulter mes colis',
    body: `L'écran **Mes colis** affiche tous vos envois en cours et passés.

Cliquez sur un colis pour voir son statut, la facture, le bordereau et les coordonnées de votre agent.

Un code couleur indique l'état du paiement : vert = payé, orange = partiel, rouge = impayé.`,
  },
  {
    id: 'cl-statuts', section: 'Mes colis', icon: '📋',
    title: 'Statuts de livraison',
    body: `**Enregistré** — pris en charge
**Expédié** — parti de Douala
**En transit** — en cours de transport
**Arrivé au pays** — arrivé au Canada
**En douane** — examiné par les douanes
**Libéré** — dédouané
**Entrepôt destination** — disponible à notre entrepôt
**Prêt pour livraison** — livraison imminente
**Livré** — remis en main propre`,
  },
  {
    id: 'cl-tracking', section: 'Suivi', icon: '🔍',
    title: 'Suivre un colis',
    body: `**Sans se connecter :** allez sur le site public → Suivi → entrez votre code.

**Depuis votre espace :** Menu → Suivi → entrez le code ou cliquez sur un colis.

Votre code ressemble à : **JML-2024-0042**

Si vous avez perdu votre code, retrouvez-le dans **Mes colis** ou contactez-nous.`,
  },
  {
    id: 'cl-booking', section: 'Réservation', icon: '✈️',
    title: 'Réserver un envoi',
    body: `1. Menu → **Réserver un envoi**
2. Indiquez la cargaison, le contenu, le poids estimé
3. Soumettez la demande

Notre équipe vous contacte sous 24h pour confirmer les détails et le prix définitif.`,
  },
  {
    id: 'cl-payment', section: 'Paiements', icon: '💳',
    title: 'Payer ma facture',
    body: `Depuis la fiche de votre colis → section **Facture**.

**Modes acceptés :** Virement bancaire (Canada), Mobile Money (Cameroun), Espèces.

Si vous avez payé partiellement, le solde restant s'affiche en rouge. Contactez votre agent pour régulariser.`,
  },
  {
    id: 'cl-profile', section: 'Mon profil', icon: '👤',
    title: 'Modifier mon profil',
    body: `Menu → **Mon profil** pour mettre à jour :
• Nom et numéro de téléphone
• Adresse de livraison par défaut
• Destinataires fréquents

Pour changer votre mot de passe : profil → Changer le mot de passe.`,
  },
  {
    id: 'cl-support', section: 'Support', icon: '💬',
    title: 'Contacter le support',
    body: `**WhatsApp / Téléphone** — le moyen le plus rapide.
Disponible **lundi–vendredi, 9h–20h** (heure de Montréal).

📞 **+1 514 998 0709**

Donnez toujours votre **code de suivi** et votre **nom**.

**Email :** info@jumlas.com`,
  },
];

// ─── HelpTip (inline tooltip) ────────────────────────────────────────────────

export function HelpTip({ text, position = 'top' }) {
  const [show, setShow] = useState(false);

  const tipStyle = {
    position: 'absolute',
    zIndex: 1300,
    background: 'var(--ink-900)',
    color: 'white',
    fontSize: 12,
    lineHeight: 1.55,
    padding: '8px 12px',
    borderRadius: 8,
    width: 220,
    boxShadow: '0 4px 16px rgba(0,0,0,.25)',
    pointerEvents: 'none',
    whiteSpace: 'pre-wrap',
    ...(position === 'top'    ? { bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' } : {}),
    ...(position === 'bottom' ? { top:    'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' } : {}),
    ...(position === 'right'  ? { left:   'calc(100% + 6px)', top: '50%',  transform: 'translateY(-50%)'  } : {}),
    ...(position === 'left'   ? { right:  'calc(100% + 6px)', top: '50%',  transform: 'translateY(-50%)'  } : {}),
  };

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}>
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(s => !s)}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 15, height: 15, borderRadius: '50%',
          background: 'var(--info-100)', color: 'var(--info-700)',
          fontSize: 9.5, fontWeight: 800, cursor: 'pointer',
          border: '1px solid var(--info-200)',
          marginLeft: 5, flexShrink: 0, userSelect: 'none',
        }}>
        i
      </span>
      {show && <span style={tipStyle}>{text}</span>}
    </span>
  );
}

// ─── Article item ─────────────────────────────────────────────────────────────

function ArticleItem({ article }) {
  const [open, setOpen] = useState(false);

  const renderBody = (text) =>
    text.split('\n').map((line, i, arr) => {
      const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
      return (
        <span key={i}>
          {parts.map((p, j) => {
            if (p.startsWith('**') && p.endsWith('**'))
              return <strong key={j}>{p.slice(2, -2)}</strong>;
            if (p.startsWith('`') && p.endsWith('`'))
              return <code key={j} style={{ fontFamily: 'monospace', fontSize: 11.5, background: 'var(--bg-soft)', padding: '1px 5px', borderRadius: 4 }}>{p.slice(1, -1)}</code>;
            return p;
          })}
          {i < arr.length - 1 && <br />}
        </span>
      );
    });

  return (
    <div style={{ borderBottom: '1px solid var(--border-soft)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>{article.icon}</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--ink-800)' }}>{article.title}</span>
        <span style={{ fontSize: 11, color: 'var(--ink-400)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: '0 16px 14px 44px', fontSize: 12.5, color: 'var(--ink-600)', lineHeight: 1.7 }}>
          {renderBody(article.body)}
        </div>
      )}
    </div>
  );
}

// ─── Main HelpCenter popup ────────────────────────────────────────────────────

export default function HelpCenter({ variant = 'admin' }) {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState('');

  const articles = variant === 'admin' ? ADMIN_ARTICLES : CLIENT_ARTICLES;

  const filtered = search.trim()
    ? articles.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.body.toLowerCase().includes(search.toLowerCase()) ||
        a.section.toLowerCase().includes(search.toLowerCase())
      )
    : articles;

  // Group by section
  const sections = filtered.reduce((acc, a) => {
    if (!acc[a.section]) acc[a.section] = [];
    acc[a.section].push(a);
    return acc;
  }, {});

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // External trigger (from Plus menu or sidebar)
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('jumla:open-help', handler);
    return () => window.removeEventListener('jumla:open-help', handler);
  }, []);

  return (
    <>
      {/* Floating button — admin: prominent. client: subtle desktop-only */}
      <style>{`
        .help-float-btn { display: flex !important; }
        @media (max-width: 767px) { .help-float-btn { display: none !important; } }
      `}</style>
      <button
        className="help-float-btn"
        onClick={() => setOpen(true)}
        title="Centre d'aide"
        style={variant === 'admin' ? {
          position: 'fixed', bottom: 24, right: 24, zIndex: 800,
          width: 46, height: 46, borderRadius: '50%',
          background: 'linear-gradient(135deg, #00B4D8, #1B4FD8)',
          color: 'white', border: 'none', cursor: 'pointer',
          fontSize: 22, fontWeight: 800,
          boxShadow: '0 4px 20px rgba(27,79,216,.45)',
          alignItems: 'center', justifyContent: 'center',
          transition: 'transform .15s, box-shadow .15s',
          lineHeight: 1,
        } : {
          position: 'fixed', bottom: 24, right: 24, zIndex: 800,
          width: 36, height: 36, borderRadius: '50%',
          background: 'white',
          color: 'var(--brand-600)',
          border: '1.5px solid var(--brand-200)',
          cursor: 'pointer', fontSize: 16, fontWeight: 700,
          boxShadow: '0 2px 8px rgba(0,0,0,.08)',
          alignItems: 'center', justifyContent: 'center',
          transition: 'border-color .15s, box-shadow .15s',
          lineHeight: 1,
        }}
        onMouseEnter={e => {
          if (variant === 'admin') e.currentTarget.style.transform = 'scale(1.1)';
          else { e.currentTarget.style.borderColor = 'var(--brand-400)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(27,79,216,.2)'; }
        }}
        onMouseLeave={e => {
          if (variant === 'admin') e.currentTarget.style.transform = 'scale(1)';
          else { e.currentTarget.style.borderColor = 'var(--brand-200)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.08)'; }
        }}>
        ?
      </button>

      {/* Popup modal */}
      {open && (
        <div
          onClick={e => e.target === e.currentTarget && setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1100,
            background: 'rgba(10,20,50,.55)',
            backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px 16px',
          }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            width: '100%', maxWidth: 600,
            maxHeight: '85vh',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 24px 80px rgba(0,0,0,.22)',
            overflow: 'hidden',
            animation: 'helpSlideIn .22s ease',
          }}>
            <style>{`@keyframes helpSlideIn { from { opacity: 0; transform: scale(.96) translateY(8px); } to { opacity: 1; transform: none; } }`}</style>

            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #0D2E6E, #1B4FD8)',
              padding: '20px 20px 16px', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 22 }}>💡</span>
                <div style={{ flex: 1, color: 'white' }}>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>Centre d'aide</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', marginTop: 1 }}>
                    {variant === 'admin' ? 'Documentation opérateur' : 'Guide client Jumla'}
                  </div>
                </div>
                <button onClick={() => setOpen(false)} style={{
                  background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 8,
                  width: 30, height: 30, cursor: 'pointer', color: 'white',
                  fontSize: 15, display: 'grid', placeItems: 'center',
                }}>✕</button>
              </div>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher une aide…"
                autoFocus
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '9px 14px', borderRadius: 9,
                  border: 'none', fontSize: 13,
                  background: 'rgba(255,255,255,.15)',
                  color: 'white', outline: 'none',
                  '::placeholder': { color: 'rgba(255,255,255,.5)' },
                }}
              />
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {Object.entries(sections).map(([section, arts]) => (
                <div key={section}>
                  <div style={{
                    padding: '10px 16px 5px', fontSize: 10.5, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '.07em',
                    color: 'var(--ink-400)', background: 'var(--bg-soft)',
                    borderBottom: '1px solid var(--border-soft)',
                  }}>
                    {section}
                  </div>
                  {arts.map(a => <ArticleItem key={a.id} article={a} />)}
                </div>
              ))}

              {filtered.length === 0 && (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ink-400)', fontSize: 13 }}>
                  Aucun résultat pour « {search} »
                </div>
              )}

              <div style={{
                margin: 16, padding: 14,
                background: 'var(--bg-soft)', border: '1px solid var(--border-soft)', borderRadius: 10,
                fontSize: 12, color: 'var(--ink-500)', lineHeight: 1.6,
              }}>
                Vous ne trouvez pas la réponse ?<br />
                <strong style={{ color: 'var(--ok-700)' }}>WhatsApp / Tél.</strong> — +1 514 998 0709 · lun–ven 9h–20h · info@jumlas.com
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
