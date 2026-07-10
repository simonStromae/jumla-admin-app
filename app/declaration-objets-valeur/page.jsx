'use client';
import { useRouter } from 'next/navigation';
import { TopBar, SiteNav, SiteFooter } from '@/src/client/SiteLayout.jsx';
import '@/src/styles/client-omega.css';

function BulletList({ items }) {
  return (
    <ul style={{ margin: '8px 0 12px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: 14, color: 'var(--ink-700)', lineHeight: 1.7 }}>{item}</li>
      ))}
    </ul>
  );
}

function Paragraphs({ text }) {
  return text.split('\n\n').map((p, i) => (
    <p key={i} style={{ margin: '0 0 12px', lineHeight: 1.75, color: 'var(--ink-700)', fontSize: 14 }}>{p}</p>
  ));
}

const FORBIDDEN = [
  'Viande, volaille, poisson et fruits de mer non autorisés (frais, congelés, séchés ou fumés);',
  'Produits contenant de la viande ou des sous-produits animaux (ex. : bouillons d\'assaisonnement à base de viande, peau de bœuf, viande séchée, saucisses, charcuteries, cubes de bouillon contenant des ingrédients d\'origine animale);',
  'Produits laitiers (lait, fromage, beurre, yogourt, crème, lait en poudre et produits dérivés) lorsqu\'ils sont interdits ou non conformes aux exigences canadiennes;',
  'Margarine ou substituts de beurre ne respectant pas les exigences réglementaires canadiennes, notamment en matière d\'enrichissement en vitamine D;',
  'Médicaments pharmaceutiques, médicaments sur ordonnance et certains produits de santé naturels nécessitant une autorisation;',
  'Drogues, stupéfiants, cannabis (lorsque non autorisé), substances illicites et produits psychotropes;',
  'Armes à feu, munitions, explosifs, feux d\'artifice et autres matières dangereuses;',
  'Armes blanches interdites (certaines machettes, couteaux prohibés, poings américains, etc.);',
  'Produits inflammables, corrosifs, toxiques ou explosifs;',
  'Argent comptant, chèques au porteur et devises;',
  'Animaux vivants et spécimens biologiques;',
  'Produits contrefaits ou piratés;',
  'Espèces animales ou végétales protégées sans les permis requis;',
  'Produits soumis à des restrictions d\'importation imposées par les autorités canadiennes;',
  'Toute autre marchandise dont l\'importation, l\'exportation, la possession ou le transport est interdite par les lois applicables.',
];

export default function DeclarationObjetsValeurPage() {
  const router = useRouter();
  return (
    <>
      <TopBar />
      <SiteNav onNav={p => router.push(p)} mode="page" />
      <main style={{ minHeight: '60vh', padding: '64px 0 80px' }}>
        <div className="jc" style={{ maxWidth: 760 }}>

          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--brand-500)', marginBottom: 10 }}>Légal · CGV</div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink-900)', margin: '0 0 8px', letterSpacing: '-.02em' }}>Déclaration des objets de valeur & Marchandises interdites</h1>
            <p style={{ fontSize: 14, color: 'var(--ink-400)', margin: '0 0 16px' }}>Conditions applicables à tout envoi confié à Jumla Import Export Inc.</p>
          </div>

          {/* Section 1 — Objets de valeur */}
          <div style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 16, padding: '32px 36px', boxShadow: '0 2px 16px rgba(0,0,0,.04)', marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 18 }}>
              <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 10, background: 'var(--brand-50)', border: '1.5px solid var(--brand-100)', display: 'grid', placeItems: 'center', fontSize: 20 }}>
                💎
              </div>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: 'var(--ink-900)', letterSpacing: '-.01em' }}>Déclaration des objets de valeur</h2>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-400)' }}>Avez-vous des objets de valeur dans votre envoi ?</p>
              </div>
            </div>

            <div style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-100)', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--brand-700)', lineHeight: 1.7 }}>
                Tout article d'une valeur supérieure à <strong>100 $ CAD</strong> (notamment les bijoux, vêtements de marque, téléphones, ordinateurs, appareils électroniques, montres, thé de grande valeur ou tout autre objet de valeur) doit être <strong>déclaré</strong> lors du dépôt du colis.
              </p>
            </div>

            <p style={{ fontSize: 14, color: 'var(--ink-700)', margin: '0 0 10px', lineHeight: 1.7, fontWeight: 600 }}>Le client doit :</p>
            <BulletList items={[
              'déclarer la valeur réelle des articles;',
              'fournir une facture ou une preuve d\'achat à l\'appui;',
              'souscrire à la couverture offerte par Jumla en acquittant des frais correspondant à 20 % de la valeur déclarée.',
            ]} />

            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '14px 18px', marginTop: 16 }}>
              <p style={{ margin: 0, fontSize: 14, color: '#991B1B', lineHeight: 1.7 }}>
                <strong>Important :</strong> Le refus de déclarer un objet de valeur ou de souscrire à cette couverture constitue une <strong>renonciation expresse</strong> à toute réclamation, indemnisation ou poursuite contre Jumla en cas de perte, de vol ou de dommage affectant ces articles.
              </p>
            </div>
          </div>

          {/* Section 2 — Marchandises interdites */}
          <div style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 16, padding: '32px 36px', boxShadow: '0 2px 16px rgba(0,0,0,.04)' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 18 }}>
              <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 10, background: '#FEF2F2', border: '1.5px solid #FECACA', display: 'grid', placeItems: 'center', fontSize: 20 }}>
                🚫
              </div>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: 'var(--ink-900)', letterSpacing: '-.01em' }}>Marchandises interdites</h2>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-400)' }}>Tout colis contenant l'un de ces articles pourra être refusé, retenu, saisi ou détruit.</p>
              </div>
            </div>

            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 14, color: '#991B1B', lineHeight: 1.7 }}>
                Les marchandises suivantes sont <strong>strictement interdites</strong> dans les envois confiés à Jumla. Tout colis contenant l'un de ces articles pourra être refusé, retenu, saisi ou détruit par les autorités compétentes, <strong>sans possibilité de remboursement ou d'indemnisation</strong>.
              </p>
            </div>

            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-800)', margin: '0 0 10px' }}>Les marchandises interdites comprennent notamment :</p>
            <BulletList items={FORBIDDEN} />

            <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 20, marginTop: 8 }}>
              <p style={{ fontSize: 14, color: 'var(--ink-700)', margin: '0 0 8px', lineHeight: 1.7 }}>
                <strong>Le client est seul responsable du contenu de son colis.</strong> Il lui appartient de s'assurer que les marchandises expédiées sont conformes aux lois et règlements en vigueur dans le pays d'origine, de transit et de destination.
              </p>
              <p style={{ fontSize: 14, color: 'var(--ink-700)', margin: 0, lineHeight: 1.7 }}>
                Jumla se réserve le droit de refuser tout colis contenant des marchandises interdites ou jugées non conformes. Si un colis est retenu, saisi, confisqué ou détruit par les autorités douanières ou tout autre organisme gouvernemental, <strong>aucun remboursement, crédit ou indemnisation ne sera accordé</strong>, et les frais de transport demeureront entièrement à la charge du client.
              </p>
            </div>
          </div>

          {/* Back to CGV */}
          <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => router.push('/cgv')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'white', border: '1.5px solid var(--border)', borderRadius: 8, color: 'var(--ink-700)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              ← Retour aux CGV
            </button>
            <a href="mailto:contact@jumla.cargo"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'var(--brand-500)', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              Une question ? Contactez-nous
            </a>
          </div>

        </div>
      </main>
      <SiteFooter />
    </>
  );
}
