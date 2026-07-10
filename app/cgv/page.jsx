'use client';
import { useRouter } from 'next/navigation';
import { TopBar, SiteNav, SiteFooter } from '@/src/client/SiteLayout.jsx';
import '@/src/styles/client-omega.css';

const ARTICLES = [
  {
    n: 1,
    title: "Champ d'application",
    body: `Les présentes Conditions générales de vente et d'expédition régissent tous les services offerts par Jumla Import Export Inc. (« Jumla »), notamment le transport, l'importation, l'exportation, le dédouanement, l'entreposage, la préparation, l'emballage et la livraison de marchandises.

En confiant un colis à Jumla ou à l'un de ses partenaires, le client reconnaît avoir lu, compris et accepté les présentes conditions.`,
  },
  {
    n: 2,
    title: 'Responsabilité de Jumla',
    body: `Jumla agit exclusivement à titre de transporteur et d'intermédiaire logistique.

Sauf disposition contraire prévue aux présentes, Jumla n'est pas responsable :`,
    bullets: [
      'de la qualité des marchandises transportées;',
      'des défauts de fabrication;',
      "de l'emballage effectué par le client;",
      'des dommages résultant de la nature même des marchandises;',
      'des retards causés par les autorités gouvernementales, les compagnies aériennes, les compagnies maritimes ou tout cas de force majeure.',
    ],
  },
  {
    n: 3,
    title: 'Produits non périssables',
    body: `Le client s'engage à remettre uniquement des produits pouvant être conservés dans un état normal pendant une période minimale de douze (12) jours.

Si le colis est livré dans ce délai, aucune réclamation ne sera acceptée relativement à une détérioration, une perte de qualité ou une réduction de valeur de la marchandise.`,
  },
  {
    n: 4,
    title: 'Produits périssables',
    body: `Les produits périssables expédiés doivent pouvoir être conservés pendant au moins cinq (5) jours, lorsque les conditions normales de transport et d'entreposage sont respectées.

Lorsque cette condition est satisfaite, Jumla ne pourra être tenue responsable de toute détérioration naturelle de la marchandise.

Aucun remboursement, crédit ou indemnisation ne sera accordé dans ce cas.`,
  },
  {
    n: 5,
    title: 'Formalités douanières',
    body: `Toutes les marchandises sont soumises aux lois et règlements des pays d'origine, de transit et de destination.

L'admission d'un colis sur le territoire canadien relève exclusivement de l'Agence des services frontaliers du Canada (ASFC) ou de toute autre autorité compétente.

Si une marchandise est retenue, saisie, détruite, refusée ou confisquée par une autorité gouvernementale :`,
    bullets: [
      'Jumla ne pourra être tenue responsable;',
      'aucun remboursement ou crédit ne sera accordé;',
      'les frais de transport demeurent entièrement payables.',
    ],
    after: `Le client est seul responsable de s'assurer que les marchandises expédiées sont autorisées.`,
  },
  {
    n: 6,
    title: 'Déclaration des objets de valeur',
    body: `Tout objet de valeur doit obligatoirement être déclaré avant l'expédition.

Le client qui souhaite protéger un objet de valeur devra souscrire la garantie offerte par Jumla moyennant le paiement d'un montant correspondant à 20 % de la valeur déclarée de la marchandise.

À défaut de souscrire cette garantie, le client renonce à toute réclamation ou poursuite contre Jumla relativement à la perte ou au vol de cette marchandise.

Cette renonciation devra être signée par le client et accompagnée :`,
    bullets: [
      'de la mention manuscrite « Lu et approuvé »;',
      'du numéro de sa pièce d\'identité;',
      'de la date et du lieu de délivrance de celle-ci;',
      'de sa signature.',
    ],
  },
  {
    n: 7,
    title: "Perte d'un colis assuré",
    body: `Lorsqu'un colis couvert par la garantie de Jumla est déclaré perdu, seule Jumla est autorisée à déterminer les modalités de l'indemnisation conformément aux présentes conditions.

Les partenaires, sous-traitants ou représentants locaux ne peuvent en aucun cas procéder eux-mêmes à une indemnisation.`,
  },
  {
    n: 8,
    title: 'Réclamations',
    body: `Une réclamation pourra être acceptée uniquement dans les situations suivantes :`,
    bullets: [
      'la marchandise a été endommagée directement par les employés de Jumla;',
      'le colis a été remis par erreur à un autre client et demeure introuvable.',
    ],
    after: `Le client devra fournir :`,
    bullets2: [
      "la facture d'achat originale;",
      'toute preuve pertinente;',
      'les photographies des dommages, lorsque applicable.',
    ],
    after2: `Sauf disposition contraire, toute indemnisation prendra exclusivement la forme d'un crédit applicable sur de futurs services de transport.

Aucun remboursement en argent ne sera effectué.`,
  },
  {
    n: 9,
    title: "Colis perdus ou endommagés par une compagnie aérienne ou maritime",
    body: `Lorsque la perte ou les dommages sont attribuables au transporteur aérien, maritime ou à un autre transporteur partenaire, Jumla présentera une réclamation auprès de celui-ci.

Si cette réclamation est acceptée, Jumla remettra au client uniquement le montant effectivement reçu du transporteur.

Jumla ne garantit en aucun cas l'acceptation d'une telle réclamation.`,
  },
  {
    n: 10,
    title: 'Assurance',
    body: `À l'exception de la garantie prévue à l'article 6, Jumla ne vend aucune police d'assurance.

Aucune garantie implicite ou supplémentaire n'est accordée relativement aux marchandises transportées.`,
  },
  {
    n: 11,
    title: 'Facturation',
    body: `Les factures sont généralement mises à la disposition des clients au moins 24 heures avant l'embarquement des marchandises.

Le client demeure responsable de vérifier son compte et d'effectuer le paiement dans les délais requis.`,
  },
  {
    n: 12,
    title: 'Paiement',
    body: `Sauf entente écrite contraire :`,
    bullets: [
      'toutes les factures sont payables avant l\'expédition;',
      'aucun colis ne sera embarqué;',
      'aucun colis ne sera livré tant que la facture n\'aura pas été acquittée en totalité.',
    ],
    after: `Jumla se réserve le droit de suspendre tout service en cas de défaut de paiement.`,
  },
  {
    n: 13,
    title: 'Partenaires revendeurs',
    body: `Les partenaires ou revendeurs utilisant les services de Jumla demeurent entièrement responsables envers leurs propres clients.

En cas de perte ou de litige, le partenaire devra d'abord régler la situation avec son client avant d'adresser une réclamation à Jumla.

Tout partenaire exploitant une entreprise au Cameroun doit enregistrer les colis au nom de cette entreprise.

À défaut d'une entreprise légalement constituée, les colis devront être enregistrés au nom personnel du partenaire.`,
  },
  {
    n: 14,
    title: "Frais d'emballage",
    body: `Les frais de plastification, d'emballage et de préparation sont considérés comme des services distincts du transport.

Ces frais ne sont remboursables que si Jumla en décide autrement ou lorsque la loi l'exige.`,
  },
  {
    n: 15,
    title: 'Délais de livraison',
    body: `Les délais communiqués sont fournis à titre indicatif.

Ils peuvent varier selon :`,
    bullets: [
      'les inspections douanières;',
      'les conditions météorologiques;',
      'les compagnies aériennes;',
      'les compagnies maritimes;',
      'les autorités gouvernementales;',
      'les cas de force majeure.',
    ],
    after: `Un retard de livraison ne donne automatiquement droit à aucune indemnisation.`,
  },
  {
    n: 16,
    title: 'Communications et réclamations',
    body: `Toute demande, plainte ou réclamation doit être transmise :`,
    bullets: [
      'par l\'intermédiaire du formulaire disponible sur le site Internet de Jumla;',
      'ou par courrier électronique.',
    ],
    after: `Les réclamations effectuées par téléphone, les appels répétitifs ou toute forme de harcèlement envers les employés ou représentants de Jumla ne seront pas traités.`,
  },
  {
    n: 17,
    title: 'Droit applicable',
    body: `Les présentes Conditions générales sont régies par les lois de la province de Québec et les lois fédérales du Canada applicables.

Tout différend sera soumis aux tribunaux compétents du district judiciaire de Montréal, sauf disposition légale impérative contraire.`,
  },
  {
    n: 18,
    title: 'Modification des Conditions générales',
    body: `Jumla peut modifier les présentes Conditions générales à tout moment.

La version publiée sur le site Internet de Jumla constitue la version officielle et remplace toute version antérieure.

L'utilisation continue des services de Jumla vaut acceptation des Conditions générales en vigueur.`,
  },
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

export default function CgvPage() {
  const router = useRouter();
  return (
    <>
      <TopBar />
      <SiteNav onNav={p => router.push(p)} mode="page" />
      <main style={{ minHeight: '60vh', padding: '64px 0 80px' }}>
        <div className="jc">

          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--brand-500)', marginBottom: 10 }}>Légal</div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink-900)', margin: '0 0 8px', letterSpacing: '-.02em' }}>Conditions générales de vente et d'expédition</h1>
            <p style={{ fontSize: 14, color: 'var(--ink-400)', margin: '0 0 16px' }}>Dernière mise à jour : 7 juillet 2026 · Jumla Import Export Inc.</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'var(--brand-50)', border: '1px solid var(--brand-100)', borderRadius: 8, fontSize: 13, color: 'var(--brand-700)' }}>
              <span style={{ fontSize: 15 }}>📋</span>
              Ce document constitue un contrat légalement contraignant entre vous et Jumla.
            </div>
          </div>

          {/* Table of contents */}
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

          {/* Contact CTA */}
          <div style={{ marginTop: 32, padding: '20px 24px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#15803D', marginBottom: 3 }}>Des questions sur nos conditions ?</div>
              <div style={{ fontSize: 13, color: '#16A34A' }}>Contactez-nous via notre formulaire ou par email à <a href="mailto:contact@jumla.cargo" style={{ color: '#15803D', fontWeight: 600 }}>contact@jumla.cargo</a>.</div>
            </div>
            <a href="mailto:contact@jumla.cargo"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: '#16A34A', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
              Nous contacter
            </a>
          </div>

        </div>
      </main>
      <SiteFooter />
    </>
  );
}
