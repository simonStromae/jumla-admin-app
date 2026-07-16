'use client';
import { useRouter } from 'next/navigation';
import { TopBar, SiteNav, SiteFooter } from '@/src/client/SiteLayout.jsx';
import '@/src/styles/client-omega.css';

const ARTICLES = [
  {
    n: 1,
    title: 'Objet',
    body: `La présente Politique de réclamation et d'indemnisation établit les conditions, les délais et la procédure applicables à toute réclamation relative aux services de transport, d'importation, d'exportation, d'entreposage, de préparation et de livraison fournis par Jumla Shipping Inc. (« Jumla »).

Toute personne utilisant les services de Jumla reconnaît avoir pris connaissance de cette politique et l'accepter.`,
  },
  {
    n: 2,
    title: 'Principe général',
    body: `Jumla agit principalement à titre de transporteur et de prestataire de services logistiques.

Notre responsabilité est limitée aux situations où une faute directement imputable à Jumla est démontrée.

Jumla ne peut être tenue responsable des dommages résultant notamment :`,
    bullets: [
      'de la nature des marchandises;',
      "d'un emballage inadéquat fourni par le client;",
      "d'un vice caché ou d'un défaut de fabrication;",
      "d'un retard causé par une compagnie aérienne, maritime ou un partenaire logistique;",
      "d'une inspection ou d'une saisie douanière;",
      "d'un cas de force majeure (catastrophe naturelle, conflit, pandémie, grève, etc.).",
    ],
  },
  {
    n: 3,
    title: "Situations donnant ouverture à une réclamation",
    body: `Une réclamation peut être présentée uniquement dans les cas suivants :`,
    bullets: [
      'perte d\'un colis sous la responsabilité de Jumla;',
      'livraison du colis à un mauvais destinataire lorsque celui-ci demeure introuvable;',
      'dommage causé directement par une mauvaise manipulation de Jumla;',
      'erreur administrative de Jumla ayant entraîné un préjudice démontrable.',
    ],
    after: 'Toute autre situation sera évaluée au cas par cas.',
  },
  {
    n: 4,
    title: 'Situations exclues',
    body: `Aucune indemnisation ne sera accordée dans les cas suivants :`,
    bullets: [
      'produits périssables détériorés malgré le respect des délais de transport;',
      'produits non périssables ayant subi une détérioration naturelle;',
      'saisie, confiscation ou destruction par une autorité douanière;',
      'colis contenant des marchandises interdites;',
      'emballage inadéquat fourni par le client;',
      'renseignements incomplets ou erronés fournis par le client;',
      'retard attribuable aux compagnies aériennes, maritimes ou aux autorités gouvernementales;',
      'catastrophe naturelle, guerre, pandémie, grève ou autre cas de force majeure.',
    ],
  },
  {
    n: 5,
    title: 'Marchandises de valeur',
    body: `Tout objet de valeur doit être déclaré au moment de l'expédition.

Lorsque le client choisit de souscrire la garantie offerte par Jumla, moyennant le paiement des frais applicables, une indemnisation pourra être accordée conformément aux présentes conditions.

Si le client refuse cette garantie, il renonce à toute réclamation relativement à la perte ou au vol de cette marchandise, conformément à la renonciation écrite signée lors de l'expédition.`,
  },
  {
    n: 6,
    title: 'Délai pour présenter une réclamation',
    body: `Toute réclamation doit être transmise :`,
    bullets: [
      'dans un délai maximal de 7 jours civils suivant la livraison pour un colis endommagé;',
      'dans un délai maximal de 30 jours civils suivant la date prévue de livraison pour un colis perdu.',
    ],
    after: 'Toute réclamation reçue après ces délais pourra être refusée.',
  },
  {
    n: 7,
    title: 'Procédure de réclamation',
    body: `Les réclamations doivent être soumises exclusivement :`,
    bullets: [
      'au moyen du formulaire disponible sur le site Internet de Jumla;',
      'ou par courriel au service des réclamations.',
    ],
    after: 'Les réclamations par téléphone, message texte, réseaux sociaux ou messagerie instantanée ne constituent pas une demande officielle.',
  },
  {
    n: 8,
    title: 'Documents requis',
    body: `Le client devra fournir :`,
    bullets: [
      'son numéro de suivi;',
      'une copie de la facture Jumla;',
      'la facture d\'achat des marchandises;',
      'une preuve de la valeur des biens;',
      'des photographies des dommages, lorsque applicable;',
      'toute information permettant d\'évaluer la réclamation.',
    ],
    after: 'Jumla se réserve le droit de demander tout document supplémentaire.',
  },
  {
    n: 9,
    title: 'Enquête',
    body: `À la réception d'une réclamation complète, Jumla procédera à une enquête.

Cette enquête peut comprendre :`,
    bullets: [
      'la vérification des documents;',
      "l'inspection des marchandises;",
      "l'analyse des enregistrements internes;",
      'les échanges avec les partenaires logistiques;',
      'la consultation des compagnies aériennes ou maritimes.',
    ],
    after: 'Le délai d\'analyse peut varier selon la complexité du dossier.',
  },
  {
    n: 10,
    title: 'Décision',
    body: `À l'issue de l'enquête, Jumla communiquera une décision écrite indiquant :`,
    bullets: [
      "l'acceptation de la réclamation;",
      "l'acceptation partielle;",
      'ou le refus motivé.',
    ],
    after: 'La décision de Jumla est fondée sur les preuves disponibles et les présentes politiques.',
  },
  {
    n: 11,
    title: "Forme de l'indemnisation",
    body: `Sauf disposition contraire ou obligation légale, toute indemnisation accordée prendra la forme :`,
    bullets: [
      "d'un crédit applicable sur de futurs services de Jumla;",
      "ou d'une autre solution jugée appropriée par Jumla.",
    ],
    after: "Aucun remboursement en argent ne sera effectué, sauf lorsque Jumla récupère une indemnité d'un transporteur tiers ou lorsque la loi l'exige.",
  },
  {
    n: 12,
    title: "Réclamations impliquant une compagnie aérienne ou maritime",
    body: `Lorsque la perte ou le dommage est attribuable à une compagnie aérienne, maritime ou à un autre transporteur partenaire, Jumla transmettra la réclamation auprès de ce transporteur.

Le client recevra uniquement l'indemnité effectivement versée par celui-ci.

Jumla ne garantit ni l'acceptation ni le montant de cette indemnité.`,
  },
  {
    n: 13,
    title: 'Responsabilité maximale',
    body: `Sauf garantie particulière souscrite par le client, la responsabilité financière de Jumla est limitée au montant des frais de transport payés pour le colis concerné.

Jumla n'est jamais responsable :`,
    bullets: [
      'des pertes commerciales;',
      'du manque à gagner;',
      'des pertes indirectes;',
      'des dommages punitifs;',
      'des pertes de clientèle;',
      'des dommages moraux.',
    ],
  },
  {
    n: 14,
    title: 'Partenaires commerciaux',
    body: `Les partenaires ou revendeurs utilisant les services de Jumla demeurent seuls responsables envers leurs propres clients.

Toute indemnisation sera versée exclusivement au partenaire ayant conclu le contrat avec Jumla.

Il appartient au partenaire de régler toute réclamation avec son client.`,
  },
  {
    n: 15,
    title: 'Prévention des fraudes',
    body: `Toute fausse déclaration, document falsifié ou tentative d'obtenir une indemnisation indue entraînera :`,
    bullets: [
      'le rejet immédiat de la réclamation;',
      'la suspension des services;',
      'et, le cas échéant, des recours civils ou pénaux.',
    ],
  },
  {
    n: 16,
    title: 'Service à la clientèle',
    body: `Les employés de Jumla s'engagent à traiter chaque réclamation avec professionnalisme.

En retour, les clients doivent communiquer avec respect.

Les comportements abusifs, les menaces, les insultes, le harcèlement ou les appels répétitifs envers les employés peuvent entraîner la suspension du traitement de la demande et, dans les cas graves, le refus de fournir de futurs services.`,
  },
  {
    n: 17,
    title: 'Modification de la politique',
    body: `Jumla se réserve le droit de modifier la présente Politique de réclamation et d'indemnisation à tout moment.

La version publiée sur le site Internet de Jumla constitue la version officielle applicable à tous les services.

L'utilisation continue des services de Jumla vaut acceptation de toute version mise à jour de cette politique.`,
  },
];

const DELAYS = [
  { label: 'Colis endommagé', delay: '7 jours civils', color: 'var(--ok-600)', bg: '#F0FDF4', border: '#BBF7D0' },
  { label: 'Colis perdu', delay: '30 jours civils', color: 'var(--brand-700)', bg: 'var(--brand-50)', border: 'var(--brand-100)' },
];

function Paragraphs({ text }) {
  return text.split('\n\n').map((p, i) => (
    <p key={i} style={{ margin: '0 0 12px', lineHeight: 1.75, color: 'var(--ink-700)', fontSize: 14 }}>{p}</p>
  ));
}

function BulletList({ items }) {
  return (
    <ul style={{ margin: '8px 0 12px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 5 }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: 14, color: 'var(--ink-700)', lineHeight: 1.7 }}>{item}</li>
      ))}
    </ul>
  );
}

function Article({ article }) {
  return (
    <div style={{ paddingBottom: 28, marginBottom: 28, borderBottom: '1px solid var(--border-soft)' }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{
          flexShrink: 0,
          width: 30, height: 30,
          borderRadius: 8,
          background: 'var(--brand-50)',
          border: '1.5px solid var(--brand-100)',
          display: 'grid', placeItems: 'center',
          fontSize: 12, fontWeight: 800,
          color: 'var(--brand-600)',
        }}>
          {article.n}
        </div>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink-900)', lineHeight: 1.4, paddingTop: 4 }}>
          {article.title}
        </h2>
      </div>
      <div className="jlegal-art-body">
        {article.body && <Paragraphs text={article.body} />}
        {article.bullets && <BulletList items={article.bullets} />}
        {article.after && <Paragraphs text={article.after} />}
        {article.bullets2 && <BulletList items={article.bullets2} />}
        {article.after2 && <Paragraphs text={article.after2} />}
      </div>
    </div>
  );
}

export default function PolitiqueReclamationPage() {
  const router = useRouter();
  return (
    <>
      <TopBar />
      <SiteNav onNav={p => router.push(p)} onBook={() => router.push('/login')} mode="public" />
      <main style={{ minHeight: '60vh', padding: '64px 0 80px' }}>
        <div className="jc">

          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--brand-500)', marginBottom: 10 }}>Légal</div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink-900)', margin: '0 0 8px', letterSpacing: '-.02em' }}>Politique de réclamation et d'indemnisation</h1>
            <p style={{ fontSize: 14, color: 'var(--ink-400)', margin: '0 0 16px' }}>Dernière mise à jour : 9 juillet 2026 · Jumla Shipping Inc.</p>
          </div>

          {/* Délais clés */}
          <div className="jlegal-delay-grid">
            {DELAYS.map(d => (
              <div key={d.label} style={{ background: d.bg, border: `1.5px solid ${d.border}`, borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: d.color, marginBottom: 6 }}>{d.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-900)' }}>{d.delay}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 3 }}>pour présenter une réclamation</div>
              </div>
            ))}
          </div>

          {/* Table des matières */}
          <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginBottom: 36 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-400)', marginBottom: 12 }}>Table des matières</div>
            <div className="jlegal-toc-grid">
              {ARTICLES.map(a => (
                <a key={a.n} href={`#art-${a.n}`}
                  style={{ fontSize: 13, color: 'var(--ink-600)', textDecoration: 'none', padding: '3px 0', display: 'flex', gap: 8, alignItems: 'baseline' }}
                  onMouseOver={e => e.currentTarget.style.color = 'var(--brand-600)'}
                  onMouseOut={e => e.currentTarget.style.color = 'var(--ink-600)'}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-300)', flexShrink: 0, minWidth: 16 }}>{a.n}.</span>
                  {a.title}
                </a>
              ))}
            </div>
          </div>

          {/* Articles */}
          <div className="jlegal-card">
            {ARTICLES.map(a => (
              <div key={a.n} id={`art-${a.n}`}>
                <Article article={a} />
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ marginTop: 32, padding: '20px 24px', background: 'var(--brand-50)', border: '1px solid var(--brand-100)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand-800)', marginBottom: 3 }}>Soumettre une réclamation</div>
              <div style={{ fontSize: 13, color: 'var(--brand-700)' }}>Utilisez notre formulaire en ligne ou contactez-nous par email à <a href="mailto:info@jumlas.com" style={{ color: 'var(--brand-600)', fontWeight: 600 }}>info@jumlas.com</a>.</div>
            </div>
            <a href="mailto:info@jumlas.com"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'var(--brand-500)', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
              Déposer une réclamation
            </a>
          </div>

        </div>
      </main>
      <SiteFooter />
    </>
  );
}
