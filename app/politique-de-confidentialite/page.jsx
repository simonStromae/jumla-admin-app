'use client';
import { useRouter } from 'next/navigation';
import { TopBar, SiteNav, SiteFooter } from '@/src/client/SiteLayout.jsx';
import '@/src/styles/client-omega.css';

const Section = ({ num, title, children }) => (
  <section style={{ marginBottom: 40 }}>
    <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink-900)', margin: '0 0 12px', letterSpacing: '-.02em' }}>
      {num}. {title}
    </h2>
    <div style={{ fontSize: 14.5, color: 'var(--ink-700)', lineHeight: 1.8 }}>{children}</div>
  </section>
);

const Ul = ({ items }) => (
  <ul style={{ margin: '8px 0 8px 20px', padding: 0 }}>
    {items.map((item, i) => (
      <li key={i} style={{ marginBottom: 4 }}>{item}</li>
    ))}
  </ul>
);

const Sub = ({ title, children }) => (
  <div style={{ marginTop: 16 }}>
    <strong style={{ color: 'var(--ink-900)' }}>{title}</strong>
    {children}
  </div>
);

export default function PolitiqueConfidentialitePage() {
  const router = useRouter();
  return (
    <>
      <TopBar />
      <SiteNav onNav={p => router.push(p)} onBook={() => router.push('/login')} mode="public" />
      <main style={{ minHeight: '60vh', padding: '64px 0 80px' }}>
        <div className="jc">

          {/* Header */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--brand-500)', marginBottom: 10 }}>Légal</div>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--ink-900)', margin: '0 0 6px', letterSpacing: '-.02em' }}>Politique de confidentialité</h1>
            <p style={{ fontSize: 14, color: 'var(--ink-400)', margin: '0 0 4px' }}>Jumla Shipping Inc.</p>
            <p style={{ fontSize: 14, color: 'var(--ink-400)', margin: 0 }}>Dernière mise à jour : 1er juillet 2026</p>
          </div>

          {/* Content */}
          <div style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 16, padding: '48px 48px', boxShadow: '0 2px 16px rgba(0,0,0,.04)' }}>

            <Section num="1" title="Notre engagement">
              <p>Chez Jumla Import Export Inc. (« Jumla », « nous », « notre »), nous accordons une grande importance à la protection des renseignements personnels de nos clients, partenaires, fournisseurs, visiteurs et utilisateurs de nos services.</p>
              <p style={{ marginTop: 12 }}>Nous nous engageons à recueillir, utiliser, conserver et communiquer les renseignements personnels de façon responsable, transparente et sécuritaire, conformément aux lois applicables, notamment :</p>
              <Ul items={[
                'la Loi sur la protection des renseignements personnels et les documents électroniques (LPRPDE/PIPEDA) ;',
                'la Loi 25 du Québec ;',
                'toute autre loi applicable en matière de protection des renseignements personnels.',
              ]} />
              <p style={{ marginTop: 12 }}>La présente politique explique comment nous recueillons, utilisons, protégeons et conservons vos renseignements personnels lorsque vous utilisez nos services, notre site Internet, nos applications ou lorsque vous communiquez avec nous.</p>
            </Section>

            <Section num="2" title="Définitions">
              <Sub title="Renseignements personnels">
                <p style={{ marginTop: 6 }}>Les renseignements personnels sont toute information permettant d'identifier directement ou indirectement une personne physique. Ils peuvent notamment comprendre :</p>
                <Ul items={['nom et prénom ;', 'adresse postale ;', 'numéro de téléphone ;', 'adresse courriel ;', "copie d'une pièce d'identité lorsque nécessaire ;", 'renseignements de paiement ;', 'informations relatives aux expéditions ;', 'historique des commandes ;', 'adresses IP ;', 'informations de connexion à notre plateforme.']} />
                <p style={{ marginTop: 8 }}>Les renseignements anonymisés ou dépersonnalisés ne sont pas considérés comme des renseignements personnels.</p>
              </Sub>
              <Sub title="Client">
                <p style={{ marginTop: 6 }}>Le terme client désigne toute personne utilisant les services de Jumla, notamment :</p>
                <Ul items={['les expéditeurs ;', 'les destinataires ;', 'les importateurs ;', 'les exportateurs ;', 'les acheteurs de notre boutique en ligne ;', 'les utilisateurs de notre plateforme de suivi ;', 'toute personne communiquant avec Jumla.']} />
              </Sub>
            </Section>

            <Section num="3" title="Les renseignements que nous recueillons">
              <p>Selon les services utilisés, nous pouvons recueillir :</p>
              <Sub title="Coordonnées">
                <Ul items={['Nom', 'Adresse', 'Téléphone', 'Courriel']} />
              </Sub>
              <Sub title="Informations relatives aux expéditions">
                <Ul items={"Adresse de l'expéditeur,Adresse du destinataire,Description des marchandises,Valeur déclarée,Poids,Numéro de suivi,Documents douaniers".split(',')} />
              </Sub>
              <Sub title="Informations financières">
                <Ul items={['Facturation', 'Paiements', 'Historique des transactions']} />
                <p style={{ marginTop: 8 }}>Nous ne conservons jamais les numéros complets de cartes de crédit lorsque les paiements sont traités par un fournisseur de paiement sécurisé.</p>
              </Sub>
              <Sub title="Documents d'identification">
                <p style={{ marginTop: 6 }}>Lorsque requis pour les formalités douanières ou réglementaires :</p>
                <Ul items={['Passeport', 'Permis', "Pièce d'identité gouvernementale", "Numéro d'entreprise"]} />
              </Sub>
              <Sub title="Données techniques">
                <p style={{ marginTop: 6 }}>Lorsque vous utilisez notre site Internet :</p>
                <Ul items={['Adresse IP', "Type d'appareil", 'Navigateur', 'Pages consultées', 'Date et heure des visites']} />
              </Sub>
            </Section>

            <Section num="4" title="Pourquoi recueillons-nous ces renseignements ?">
              <p>Nous utilisons vos renseignements afin de :</p>
              <Ul items={[
                'fournir nos services de transport ;', 'gérer les importations et exportations ;', 'effectuer le dédouanement ;',
                'organiser les livraisons ;', 'assurer le suivi des colis ;', 'communiquer avec les clients ;',
                'répondre aux demandes de renseignements ;', 'produire les factures ;', 'traiter les paiements ;',
                'prévenir la fraude ;', 'satisfaire à nos obligations légales ;', 'améliorer nos services ;',
                'effectuer des analyses statistiques ;', 'envoyer des communications commerciales lorsque vous y avez consenti.',
              ]} />
            </Section>

            <Section num="5" title="Consentement">
              <p>Nous recueillons vos renseignements personnels avec votre consentement, sauf lorsque la loi autorise ou exige autrement. Votre consentement peut être :</p>
              <Ul items={['explicite ;', "implicite selon la nature de la relation d'affaires."]} />
              <p style={{ marginTop: 8 }}>Vous pouvez retirer votre consentement en tout temps, sous réserve des obligations légales ou contractuelles qui nous obligent à conserver certains renseignements. Le retrait du consentement pourrait limiter notre capacité à fournir certains services.</p>
            </Section>

            <Section num="6" title="Exactitude des renseignements">
              <p>Nous faisons des efforts raisonnables afin que les renseignements personnels soient exacts, complets et à jour. Vous êtes responsable de nous informer de toute modification concernant vos coordonnées ou vos renseignements.</p>
            </Section>

            <Section num="7" title="Communication des renseignements personnels">
              <p>Nous ne vendons jamais vos renseignements personnels. Nous pouvons toutefois les communiquer lorsque cela est nécessaire à l'exécution de nos services, notamment auprès de :</p>
              <Ul items={[
                'transporteurs partenaires ;', 'compagnies aériennes ;', 'compagnies maritimes ;',
                'agences gouvernementales ;', 'autorités douanières ;', 'courtiers en douane ;',
                'fournisseurs informatiques ;', 'fournisseurs de paiement ;', 'partenaires logistiques ;',
                "organismes chargés de l'application de la loi lorsque la loi l'exige.",
              ]} />
              <p style={{ marginTop: 8 }}>Lorsque des renseignements sont communiqués à un fournisseur de services, celui-ci est contractuellement tenu d'assurer un niveau de protection équivalent au nôtre.</p>
            </Section>

            <Section num="8" title="Conservation des renseignements">
              <p>Les renseignements personnels sont conservés uniquement pendant la durée nécessaire :</p>
              <Ul items={['à la prestation des services ;', 'aux exigences comptables ;', 'aux obligations fiscales ;', 'aux obligations douanières ;', 'aux exigences légales.']} />
              <p style={{ marginTop: 8 }}>À l'expiration de cette période, les renseignements sont détruits de façon sécuritaire ou anonymisés.</p>
            </Section>

            <Section num="9" title="Protection des renseignements">
              <p>Jumla applique des mesures de sécurité administratives, physiques et technologiques afin de protéger les renseignements personnels contre la perte, le vol, l'accès non autorisé, la divulgation, la modification et la destruction. Ces mesures comprennent notamment :</p>
              <Ul items={['chiffrement des données sensibles ;', 'pare-feu ;', 'contrôle des accès ;', 'authentification des utilisateurs ;', 'sauvegardes sécurisées ;', 'formation des employés ;', 'politiques internes de confidentialité.']} />
              <p style={{ marginTop: 8 }}>Malgré toutes les précautions raisonnables, aucun système informatique ne peut garantir une sécurité absolue.</p>
            </Section>

            <Section num="10" title="Témoins de connexion (Cookies)">
              <p>Notre site Internet utilise des témoins (cookies) afin d'améliorer votre expérience utilisateur, mémoriser certaines préférences, mesurer l'utilisation de notre site et améliorer nos services. Vous pouvez modifier les paramètres de votre navigateur afin de refuser certains témoins. Certaines fonctionnalités du site pourraient toutefois être limitées.</p>
            </Section>

            <Section num="11" title="Communications électroniques">
              <p>Avec votre consentement, Jumla peut vous transmettre des nouvelles, des promotions, des offres spéciales, des sondages et des informations concernant nos services. Chaque communication commerciale comprend un mécanisme simple permettant de se désabonner. Les courriels liés au suivi des expéditions, à la facturation ou à votre compte continueront d'être transmis lorsque nécessaire.</p>
            </Section>

            <Section num="12" title="Intelligence artificielle">
              <p>Jumla peut utiliser certaines technologies d'intelligence artificielle afin d'améliorer le service à la clientèle, le suivi des expéditions, la détection des anomalies et l'automatisation de certains processus administratifs. Toute utilisation de ces technologies demeure sous supervision humaine et respecte les principes de transparence, d'équité, de sécurité et de responsabilité.</p>
            </Section>

            <Section num="13" title="Vos droits">
              <p>Vous pouvez, sous réserve des lois applicables :</p>
              <Ul items={[
                "demander l'accès à vos renseignements personnels ;",
                'demander leur correction ;',
                'demander leur suppression lorsque permis ;',
                'retirer votre consentement ;',
                'demander des précisions concernant leur utilisation ;',
                'déposer une plainte concernant leur traitement.',
              ]} />
              <p style={{ marginTop: 8 }}>Toute demande sera traitée dans les délais prévus par la loi.</p>
            </Section>

            <Section num="14" title="Sites Web de tiers">
              <p>Notre site peut contenir des liens vers des sites externes. Jumla n'est pas responsable des politiques de confidentialité de ces sites. Nous vous encourageons à consulter leur politique avant de leur transmettre des renseignements personnels.</p>
            </Section>

            <Section num="15" title="Responsable de la protection des renseignements personnels">
              <p>Toute question, demande d'accès, demande de correction ou plainte concernant la présente politique peut être adressée au responsable de la protection des renseignements personnels de Jumla.</p>
              <div style={{ marginTop: 16, background: 'var(--bg-soft)', border: '1px solid var(--border-soft)', borderRadius: 10, padding: '16px 20px', fontSize: 14 }}>
                <strong style={{ color: 'var(--ink-900)' }}>Jumla Import Export Inc.</strong><br />
                711, Av. Lajoie<br />
                Dorval (Québec) H9P 1G7<br />
                Canada<br />
                <a href="mailto:info@jumlas.com" style={{ color: 'var(--brand-500)' }}>info@jumlas.com</a><br />
                514-998-0709
              </div>
            </Section>

            <Section num="16" title="Modifications de la politique">
              <p>Jumla peut modifier la présente politique afin de refléter les changements apportés à ses activités, à la technologie ou aux exigences légales. La version la plus récente est toujours disponible sur notre site Internet. En continuant d'utiliser nos services après la publication d'une version révisée, vous acceptez les modifications apportées à la présente politique.</p>
            </Section>

          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
