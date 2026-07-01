'use client';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

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
5. La capacité en kg est optionnelle mais utile pour le suivi de remplissage
6. Cliquez **Créer la cargaison**`,
    tags: ['campaigns', 'new'],
  },
  {
    id: 'cargaison-statuts', section: 'Cargaisons', icon: '📋',
    title: 'Comprendre les statuts',
    body: `Les statuts suivent le cycle de vie de la cargaison :

• **Ouverte (ENR)** — en cours d'enregistrement, on peut ajouter des colis
• **Expédiée (EXP)** — la cargaison a quitté l'origine
• **En transit (TRA)** — en cours de transport
• **Arrivée au pays (APD)** — arrivée à destination
• **En douane (DOU)** — présentée aux douanes
• **Libérée (LIB)** — dédouanée
• **Entrepôt destination (ARD)** — en attente de retrait/livraison
• **Prête livraison (PDL)** — prête à être remise au client
• **Clôturée (OK)** — terminée

Changer le statut d'une cargaison met automatiquement à jour les statuts des colis associés.`,
    tags: ['campaigns', 'status'],
  },
  {
    id: 'cargaison-airlines', section: 'Cargaisons', icon: '🏢',
    title: 'Compagnies aériennes & legs',
    body: `Un leg = un tronçon de vol avec une compagnie aérienne.

Une cargaison peut être divisée sur plusieurs compagnies (ex: Lufthansa pour les effets, Air France pour les marchandises).

**Ajouter une compagnie :**
→ Menu *Compagnies* pour créer les compagnies d'abord
→ Dans le détail de la cargaison, section *Legs de transport*
→ Associez compagnie + numéro AWB + poids + notes

Le numéro **AWB** (Air Waybill) est le numéro de connaissement aérien fourni par la compagnie.`,
    tags: ['campaigns', 'airlines'],
  },
  {
    id: 'cargaison-costs', section: 'Cargaisons', icon: '💰',
    title: 'Coûts d\'une cargaison',
    body: `Les coûts se gèrent depuis **Coûts → icône calculatrice** sur la cargaison.

**Postes fixes :**
• Fret aérien, Douanes & dédouanement, Entreposage, Transport local, Manutention, Assurance

**Coûts supplémentaires :** ajoutez des lignes libres (label + montant) pour tout frais spécifique.

La marge est calculée automatiquement : CA facturé − Total des coûts.`,
    tags: ['costs', 'campaigns'],
  },
  {
    id: 'clients-manage', section: 'Clients', icon: '👥',
    title: 'Gérer les clients',
    body: `L'écran **Expéditeurs** liste tous les clients enregistrés.

**Depuis la fiche client (drawer) vous pouvez :**
• Voir l'historique complet de colis
• Contacter par WhatsApp avec un modèle pré-rempli
• Suspendre / réactiver le compte
• Renvoyer l'email de vérification si l'email n'est pas encore vérifié
• Supprimer le compte (supprime aussi tous ses colis)

**Filtres :** utilisez la vue Liste pour voir le statut, la ville, et les métriques.`,
    tags: ['clients'],
  },
  {
    id: 'colis-add', section: 'Colis', icon: '📦',
    title: 'Ajouter un colis',
    body: `Depuis le détail d'une cargaison → **Ajouter un colis**.

**Champs importants :**
• **Client** — cherchez par nom, email ou téléphone (auto-complétion)
• **Poids réel (kg)** — sert au calcul du prix si tarif au kg
• **Code de suivi** — généré automatiquement, modifiable
• **Prix** — peut être calculé automatiquement selon la grille tarifaire de la route

Une fois créé, le colis apparaît dans la liste de la cargaison et dans l'espace client.`,
    tags: ['parcels'],
  },
  {
    id: 'paiement', section: 'Colis', icon: '💳',
    title: 'Enregistrer un paiement',
    body: `Depuis la fiche d'un colis → section **Paiement**.

**Modes disponibles :** Virement, Chèque, Espèces, Mobile Money, Autre

**Types de paiement :**
• Paiement complet
• Acompte (partiel) → le reste reste dû
• Paiement supplémentaire (surpoids détecté après pesée)

Un reçu PDF peut être généré et envoyé au client depuis la fiche de paiement.`,
    tags: ['parcels', 'payment'],
  },
  {
    id: 'analytics', section: 'Analyses', icon: '📊',
    title: 'Lire les analyses',
    body: `L'écran **Analyses** présente les données de l'année en cours.

**Métriques disponibles :**
• CA total, poids total, nombre de colis et clients actifs
• Évolution mensuelle (revenus + volume)
• Top destinations et top clients fidèles
• Répartition par compagnie aérienne : volume, % du volume, frêt estimé, coût/kg

**Changer d'année :** utilisez le sélecteur en haut à droite.`,
    tags: ['analytics'],
  },
  {
    id: 'settings-routes', section: 'Paramètres', icon: '🗺️',
    title: 'Routes & tarifs',
    body: `Dans **Paramètres → Routes & tarifs** :

• Créez des routes (ex: DLA → MTL avec codes IATA)
• Définissez une grille tarifaire par tranche de poids (ex: 0-5kg = 12 CAD/kg, 5-20kg = 10 CAD/kg)
• Activez/désactivez une route sans la supprimer

Le tarif s'applique automatiquement à la création d'un colis si la route a une grille configurée.`,
    tags: ['settings'],
  },
  {
    id: 'settings-whatsapp', section: 'Paramètres', icon: '💬',
    title: 'Modèles WhatsApp',
    body: `Dans **Paramètres → WhatsApp** :

Personnalisez les 5 modèles de messages envoyés aux clients :
• Avis d'arrivée, Relance paiement, Livraison confirmée, Facture/Récap, Annonce cargaison

**Variables disponibles :**
\`{first_name}\` \`{parcel_code}\` \`{amount}\` \`{weight}\` \`{arrival_date}\`

Les messages sont envoyés depuis la fiche client ou en masse depuis une cargaison.`,
    tags: ['settings', 'whatsapp'],
  },
];

const CLIENT_ARTICLES = [
  {
    id: 'cl-dashboard', section: 'Mes colis', icon: '📦',
    title: 'Consulter mes colis',
    body: `L'écran **Mes colis** affiche tous vos envois en cours et passés.

Cliquez sur un colis pour voir :
• Son statut actuel et l'historique des événements
• Le détail de la facture (poids, montant, paiements effectués)
• Le bordereau de livraison
• Les coordonnées de votre agent

Un code couleur indique l'état du paiement : vert = payé, orange = partiel, rouge = impayé.`,
    tags: ['dashboard'],
  },
  {
    id: 'cl-statuts', section: 'Mes colis', icon: '📋',
    title: 'Statuts de livraison',
    body: `Voici ce que signifient les statuts de votre colis :

• **Enregistré** — votre colis est pris en charge
• **Expédié** — parti de Douala
• **En transit** — en cours de transport
• **Arrivé au pays** — arrivé au Canada
• **En douane** — examiné par les douanes canadiennes
• **Libéré** — dédouané, prêt pour la suite
• **Entrepôt destination** — disponible à notre entrepôt
• **Prêt pour livraison** — livraison imminente
• **Livré** — remis en main propre`,
    tags: ['dashboard', 'tracking'],
  },
  {
    id: 'cl-tracking', section: 'Suivi', icon: '🔍',
    title: 'Suivre un colis',
    body: `**Sans se connecter :** allez sur le site public → Suivi → entrez votre code de suivi.

**Depuis votre espace :** Menu → Suivi → entrez le code ou cliquez directement sur un colis.

Votre code de suivi ressemble à : **JML-2024-0042**

Si vous avez perdu votre code, retrouvez-le dans la liste **Mes colis** ou contactez-nous par WhatsApp.`,
    tags: ['tracking'],
  },
  {
    id: 'cl-booking', section: 'Réservation', icon: '✈️',
    title: 'Réserver un envoi',
    body: `Pour pré-réserver un envoi :

1. Menu → **Réserver un envoi**
2. Indiquez la cargaison souhaitée, le contenu, le poids estimé
3. Soumettez la demande

Notre équipe vous contacte sous 24h pour confirmer les détails, le prix définitif et les modalités de dépôt à Douala.

**Note :** la réservation ne garantit pas une place, elle permet à notre équipe de vous planifier.`,
    tags: ['booking'],
  },
  {
    id: 'cl-payment', section: 'Paiements', icon: '💳',
    title: 'Payer ma facture',
    body: `Depuis la fiche de votre colis → section **Facture**.

Les modes de paiement acceptés dépendent de votre accord avec votre agent :
• Virement bancaire (Canada)
• Mobile Money (Cameroun)
• Espèces (dépôt en agence)

Si vous avez payé partiellement, le solde restant s'affiche en rouge. Contactez votre agent pour régulariser.`,
    tags: ['payments'],
  },
  {
    id: 'cl-profile', section: 'Mon profil', icon: '👤',
    title: 'Modifier mon profil',
    body: `Menu → **Mon profil** pour mettre à jour :
• Votre nom et numéro de téléphone
• Votre adresse de livraison par défaut
• Vos destinataires fréquents (gain de temps à la prochaine réservation)

Pour changer votre mot de passe : profil → Changer le mot de passe.

Pour changer votre email : contactez votre agent (modification manuelle requise).`,
    tags: ['profile'],
  },
  {
    id: 'cl-support', section: 'Support', icon: '💬',
    title: 'Contacter le support',
    body: `**WhatsApp** — le moyen le plus rapide.
Disponible **lundi–vendredi, 9h–20h** (heure de Montréal).

Donnez toujours votre **code de suivi** et votre **nom** pour un traitement rapide.

**Email :** support@jumlas.com

Depuis votre espace client, vous pouvez aussi envoyer un message depuis la fiche d'un colis → icône WhatsApp.`,
    tags: ['support'],
  },
];

// ─── HelpTip (exported inline tooltip) ──────────────────────────────────────

export function HelpTip({ text, position = 'top' }) {
  const [show, setShow] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!show) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShow(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [show]);

  const tipStyle = {
    position: 'absolute',
    zIndex: 900,
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
    ...(position === 'right'  ? { left:   'calc(100% + 6px)', top: '50%', transform: 'translateY(-50%)'  } : {}),
    ...(position === 'left'   ? { right:  'calc(100% + 6px)', top: '50%', transform: 'translateY(-50%)'  } : {}),
  };

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}>
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
          marginLeft: 5, flexShrink: 0,
          userSelect: 'none',
        }}>
        i
      </span>
      {show && <span style={tipStyle}>{text}</span>}
    </span>
  );
}

// ─── Help Panel ──────────────────────────────────────────────────────────────

function ArticleItem({ article }) {
  const [open, setOpen] = useState(false);

  const renderBody = (text) =>
    text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
      return (
        <span key={i}>
          {parts.map((p, j) => {
            if (p.startsWith('**') && p.endsWith('**'))
              return <strong key={j}>{p.slice(2, -2)}</strong>;
            if (p.startsWith('`') && p.endsWith('`'))
              return <code key={j} style={{ fontFamily: 'var(--ff-mono)', fontSize: 11.5, background: 'var(--bg-soft)', padding: '1px 4px', borderRadius: 4 }}>{p.slice(1, -1)}</code>;
            return p;
          })}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      );
    });

  return (
    <div style={{ borderBottom: '1px solid var(--border-soft)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '11px 16px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>{article.icon}</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--ink-800)' }}>{article.title}</span>
        <span style={{ fontSize: 11, color: 'var(--ink-400)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
      </button>
      {open && (
        <div style={{
          padding: '0 16px 14px 44px',
          fontSize: 12.5, color: 'var(--ink-600)', lineHeight: 1.7,
        }}>
          {renderBody(article.body)}
        </div>
      )}
    </div>
  );
}

// ─── Main HelpCenter component ───────────────────────────────────────────────

export default function HelpCenter({ variant = 'admin' }) {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState('');
  const pathname = usePathname();

  const articles = variant === 'admin' ? ADMIN_ARTICLES : CLIENT_ARTICLES;

  // Determine context-relevant articles based on current path
  const contextTags = (() => {
    if (!pathname) return [];
    if (pathname.includes('campaigns') || pathname.includes('campaign')) return ['campaigns'];
    if (pathname.includes('clients'))    return ['clients'];
    if (pathname.includes('parcels'))    return ['parcels'];
    if (pathname.includes('costs'))      return ['costs'];
    if (pathname.includes('analytics'))  return ['analytics'];
    if (pathname.includes('settings'))   return ['settings'];
    if (pathname.includes('airlines'))   return ['airlines'];
    if (pathname.includes('dashboard'))  return ['dashboard'];
    if (pathname.includes('suivi'))      return ['tracking'];
    if (pathname.includes('booking'))    return ['booking'];
    if (pathname.includes('invoices'))   return ['payments'];
    if (pathname.includes('profile'))    return ['profile'];
    return [];
  })();

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

  // Contextually relevant articles shown first
  const contextArticles = !search.trim() && contextTags.length > 0
    ? articles.filter(a => a.tags?.some(t => contextTags.includes(t)))
    : [];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        title="Centre d'aide"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 800,
          width: 44, height: 44, borderRadius: '50%',
          background: 'linear-gradient(135deg, #00B4D8, #1B4FD8)',
          color: 'white', border: 'none', cursor: 'pointer',
          fontSize: 20, fontWeight: 800,
          boxShadow: '0 4px 16px rgba(27,79,216,.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform .15s, box-shadow .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(27,79,216,.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';    e.currentTarget.style.boxShadow = '0 4px 16px rgba(27,79,216,.4)'; }}>
        ?
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', zIndex: 900 }}
        />
      )}

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 901,
        width: 380, maxWidth: '92vw',
        background: 'white', boxShadow: '-4px 0 32px rgba(0,0,0,.12)',
        display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform .28s cubic-bezier(.4,0,.2,1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 16px 14px',
          borderBottom: '1px solid var(--border-soft)',
          background: 'linear-gradient(135deg, #0D2E6E, #1B4FD8)',
          color: 'white', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Centre d'aide</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', marginTop: 1 }}>
                {variant === 'admin' ? 'Documentation opérateur' : 'Guide client'}
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{
              background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 7,
              width: 28, height: 28, cursor: 'pointer', color: 'white', fontSize: 14,
              display: 'grid', placeItems: 'center',
            }}>✕</button>
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une aide…"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '9px 12px', borderRadius: 8,
              border: 'none', fontSize: 13,
              background: 'rgba(255,255,255,.15)',
              color: 'white', outline: 'none',
            }}
          />
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Contextual articles */}
          {!search.trim() && contextArticles.length > 0 && (
            <div>
              <div style={{
                padding: '10px 16px 6px', fontSize: 10.5, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '.07em',
                color: 'var(--brand-600)', background: 'var(--brand-50)',
              }}>
                📍 Suggérés pour cette page
              </div>
              {contextArticles.map(a => <ArticleItem key={a.id + '_ctx'} article={a} />)}
              <div style={{ height: 6, background: 'var(--bg-soft)' }} />
            </div>
          )}

          {/* All sections */}
          {Object.entries(sections).map(([section, arts]) => (
            <div key={section}>
              <div style={{
                padding: '10px 16px 6px', fontSize: 10.5, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '.07em',
                color: 'var(--ink-400)',
              }}>
                {section}
              </div>
              {arts.map(a => <ArticleItem key={a.id} article={a} />)}
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-400)', fontSize: 13 }}>
              Aucun résultat pour « {search} »
            </div>
          )}

          {/* Footer */}
          <div style={{
            margin: 16, padding: 14,
            background: 'var(--bg-soft)', border: '1px solid var(--border-soft)', borderRadius: 10,
            fontSize: 12, color: 'var(--ink-500)', lineHeight: 1.5,
          }}>
            Vous ne trouvez pas la réponse ?<br />
            <strong style={{ color: 'var(--ok-700)' }}>WhatsApp</strong> — équipe disponible lun–ven 9h–20h
          </div>
        </div>
      </div>
    </>
  );
}
