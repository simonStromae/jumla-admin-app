'use client';
import { useState, useEffect } from 'react';
import I from '../components/Icons.jsx';
import { Skel } from '../components/Shell.jsx';

function fmt(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const SECTION = ({ num, title, children }) => (
  <div style={{ marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #E5E7EB' }}>
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#374151', marginBottom: 6 }}>
      {num}. {title}
    </div>
    <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.65 }}>{children}</div>
  </div>
);

const Bullets = ({ items }) => (
  <ul style={{ margin: '4px 0 4px 14px', padding: 0 }}>
    {items.map((it, i) => <li key={i} style={{ marginBottom: 2, fontSize: 11, color: '#374151' }}>{it}</li>)}
  </ul>
);

export default function PolicyPrintScreen({ id, onNav }) {
  const [parcel,  setParcel]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!id) { setError('Identifiant manquant'); setLoading(false); return; }
    fetch('/api/parcels/' + id)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setParcel(d);
        setLoading(false);
      })
      .catch(() => { setError('Erreur réseau'); setLoading(false); });
  }, [id]);

  const client   = parcel?.client   || {};
  const campaign = parcel?.campaign || {};
  const today    = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{ background: '#E5E7EB', minHeight: '100vh', padding: '24px 0', fontFamily: 'var(--ff-sans)' }}>

      {/* Toolbar */}
      <div className="no-print" style={{
        position: 'sticky', top: 0, zIndex: 10,
        maxWidth: 920, margin: '0 auto 18px',
        background: 'white', border: '1px solid var(--border)',
        borderRadius: 10, padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: 'var(--sh-sm)',
      }}>
        <button className="btn btn--ghost btn--sm" onClick={() => onNav && onNav('/admin/parcels/' + id)}>
          <I.ArrowLeft />Retour
        </button>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Attestation des politiques — aperçu avant impression</span>
        <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>— A4 portrait, marges 12 mm</span>
        <div style={{ flex: 1 }} />
        <button className="btn btn--brand btn--sm" onClick={() => window.print()}>
          <I.Print />Imprimer / PDF
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ width: 794, margin: '0 auto', background: 'white', padding: '44px 48px', borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skel w="40%" h={24} />
          <Skel w="100%" h={80} />
          <Skel w="100%" h={200} />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ width: 794, margin: '0 auto', background: 'white', padding: '60px', textAlign: 'center', borderRadius: 4 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--bad-700)', marginBottom: 8 }}>Colis introuvable</div>
          <div style={{ fontSize: 13, color: 'var(--ink-400)' }}>{error}</div>
        </div>
      )}

      {/* Document */}
      {!loading && parcel && (
        <div style={{ width: 794, margin: '0 auto', background: 'white', padding: '44px 48px', boxShadow: 'var(--sh-md)', borderRadius: 4, color: '#0F172A', fontSize: 12 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '2px solid #0F172A', paddingBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
                  <defs><linearGradient id="plg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#00B4D8"/><stop offset="100%" stopColor="#1B4FD8"/></linearGradient></defs>
                  <path d="M8 8 C8 6 10 4 12 5 L38 20 C40 21 40 27 38 28 L12 43 C10 44 8 42 8 40 Z" fill="url(#plg)"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.02em' }}>Jumla Shipping</div>
                <div style={{ fontSize: 10.5, color: '#6B7280' }}>Fret aérien international</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 4 }}>
                Attestation des politiques
              </div>
              <div style={{ fontSize: 10, color: '#6B7280' }}>Remis en personne à l'entrepôt</div>
              <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>Date : {today}</div>
            </div>
          </div>

          {/* Client + Colis info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '18px 0' }}>
            <div style={{ border: '1px solid #D1D5DB', borderRadius: 4 }}>
              <div style={{ padding: '5px 12px', background: '#F4F5F7', borderBottom: '1px solid #D1D5DB', fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em' }}>CLIENT / EXPÉDITEUR</div>
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{client.name || '—'}</div>
                {client.city && <div style={{ fontSize: 11.5, color: '#374151', marginTop: 3 }}>{client.city}</div>}
                {client.phone && <div style={{ fontFamily: 'monospace', fontSize: 11.5, color: '#374151', marginTop: 2 }}>{client.phone}</div>}
              </div>
            </div>
            <div style={{ border: '1px solid #D1D5DB', borderRadius: 4 }}>
              <div style={{ padding: '5px 12px', background: '#F4F5F7', borderBottom: '1px solid #D1D5DB', fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em' }}>COLIS</div>
              <div style={{ padding: '10px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { l: 'Code colis',   v: parcel.trackingCode },
                  { l: 'Cargaison',    v: campaign.code || '—' },
                  { l: 'Départ',       v: campaign.from || '—' },
                  { l: 'Destination',  v: campaign.to   || '—' },
                ].map((k, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 9, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>{k.l}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, marginTop: 1 }}>{k.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Intro */}
          <div style={{ padding: '10px 14px', background: '#F4F5F7', border: '1px solid #E5E7EB', borderRadius: 4, marginBottom: 20, fontSize: 11.5, color: '#374151', lineHeight: 1.65 }}>
            Le soussigné <strong>{client.name || '(nom du client)'}</strong> reconnaît avoir pris connaissance et accepter l'ensemble des politiques de <strong>Jumla Shipping Inc.</strong> telles que détaillées ci-dessous, en complément des conditions acceptées lors de l'enregistrement en ligne.
          </div>

          {/* Section A — Politique de réclamation (résumé) */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', background: '#0F172A', color: 'white', padding: '5px 12px', marginBottom: 10 }}>
              A — Politique de réclamation et d'indemnisation (résumé)
            </div>

            <SECTION num="1" title="Principe de responsabilité">
              Jumla agit à titre de transporteur et de prestataire de services logistiques. Sa responsabilité est limitée aux fautes directement imputables à Jumla. Elle ne peut être tenue responsable des dommages résultant notamment de la nature des marchandises, d'un emballage inadéquat, d'un vice caché, de retards causés par des compagnies aériennes ou partenaires logistiques, d'une inspection ou saisie douanière, ou d'un cas de force majeure.
            </SECTION>

            <SECTION num="2" title="Délais pour présenter une réclamation">
              <Bullets items={[
                'Colis endommagé : 7 jours civils maximum après la livraison.',
                'Colis perdu : 30 jours civils maximum après la date prévue de livraison.',
                'Toute réclamation reçue hors délai pourra être refusée.',
              ]} />
              Les réclamations doivent être soumises via le formulaire en ligne ou par courriel à <strong>info@jumlas.com</strong>. Les réclamations par téléphone, texto ou réseaux sociaux ne constituent pas une demande officielle.
            </SECTION>

            <SECTION num="3" title="Situations exclues de toute indemnisation">
              <Bullets items={[
                'Produits périssables ou soumis à une détérioration naturelle.',
                'Saisie, confiscation ou destruction par une autorité douanière.',
                'Colis contenant des marchandises interdites.',
                'Emballage inadéquat fourni par le client.',
                'Renseignements incomplets ou erronés fournis par le client.',
                'Catastrophe naturelle, guerre, pandémie, grève ou cas de force majeure.',
              ]} />
            </SECTION>

            <SECTION num="4" title="Responsabilité maximale">
              Sauf garantie particulière souscrite, la responsabilité financière de Jumla est limitée au montant des frais de transport payés pour le colis concerné. Jumla n'est jamais responsable des pertes commerciales, du manque à gagner, des pertes indirectes, des dommages punitifs ou des dommages moraux.
            </SECTION>
          </div>

          {/* Section B — Politique de confidentialité (résumé) */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', background: '#0F172A', color: 'white', padding: '5px 12px', marginBottom: 10 }}>
              B — Politique de confidentialité (résumé)
            </div>

            <SECTION num="1" title="Renseignements collectés">
              Jumla collecte les renseignements personnels nécessaires à la prestation de ses services : coordonnées, informations d'expédition, informations financières et, lorsque requis, documents d'identification. Ces renseignements sont utilisés exclusivement aux fins des services de transport, de dédouanement et de livraison.
            </SECTION>

            <SECTION num="2" title="Communication des renseignements">
              Jumla ne vend jamais vos renseignements personnels. Ils peuvent être transmis à des transporteurs partenaires, compagnies aériennes, autorités douanières, fournisseurs de paiement et organismes légaux lorsque la loi l'exige. Chaque partenaire est contractuellement tenu d'assurer un niveau de protection équivalent.
            </SECTION>

            <SECTION num="3" title="Vos droits">
              Vous pouvez demander l'accès, la correction ou la suppression de vos renseignements, retirer votre consentement ou déposer une plainte en contactant Jumla Import Export Inc. à l'adresse <strong>info@jumlas.com</strong> ou au 514-998-0709.
            </SECTION>
          </div>

          {/* Section C — Attestations spécifiques */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', background: '#0F172A', color: 'white', padding: '5px 12px', marginBottom: 10 }}>
              C — Attestations spécifiques
            </div>

            {[
              {
                label: 'Marchandises interdites',
                text: "Je confirme que mon colis ne contient aucune marchandise interdite (armes, explosifs, produits dangereux, stupéfiants, contrefaçons, billets de banque, etc.) ni tout autre article dont le transport est interdit par la réglementation douanière canadienne ou de destination. Je comprends qu'une fausse déclaration entraîne le rejet de toute réclamation et peut faire l'objet de poursuites civiles ou pénales.",
                checked: parcel.forbiddenAcknowledged,
              },
              {
                label: 'Objets de valeur',
                text: "Je déclare avoir été informé(e) que les objets de valeur (bijoux, appareils électroniques, œuvres d'art, etc.) non couverts par la garantie optionnelle proposée par Jumla ne feront l'objet d'aucune indemnisation en cas de perte ou de vol, conformément à la renonciation ci-présente.",
                checked: parcel.waiverAccepted || parcel.hasValuable === false,
                note: parcel.hasValuable && parcel.declaredValue
                  ? `Valeur déclarée : ${Number(parcel.declaredValue).toLocaleString('fr')} CAD`
                  : parcel.hasValuable
                  ? 'Objet de valeur déclaré'
                  : null,
              },
              {
                label: 'Exactitude du contenu déclaré',
                text: "Je certifie que la description du contenu de mon colis est exacte et complète. Je comprends que toute inexactitude engage ma responsabilité et peut entraîner des frais douaniers supplémentaires, le blocage du colis et l'exclusion de toute indemnisation.",
                checked: null,
              },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 4 }}>
                <div style={{ flexShrink: 0, marginTop: 1 }}>
                  {item.checked
                    ? <span style={{ fontSize: 14, color: '#059669' }}>☑</span>
                    : <span style={{ fontSize: 14 }}>☐</span>
                  }
                </div>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: '#374151', marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.6 }}>{item.text}</div>
                  {item.note && (
                    <div style={{ marginTop: 4, fontSize: 10.5, fontWeight: 600, color: '#1B4FD8' }}>→ {item.note}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Signature */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 10 }}>
            {[
              { lbl: 'Agent Jumla', name: null },
              { lbl: 'Client — ' + (client.name || ''), name: client.name },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', color: '#6B7280', marginBottom: 40, textTransform: 'uppercase' }}>
                  Signature — {s.lbl}
                </div>
                <div style={{ borderBottom: '1px solid #0F172A', marginBottom: 6 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#374151' }}>
                  <span>{s.name || '_______________'}</span>
                  <span>Date : ____ / ____ / ____</span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ marginTop: 28, paddingTop: 12, borderTop: '1px solid #D1D5DB', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6B7280' }}>
            <span>Jumla Import Export Inc. · 711 Av. Lajoie, Dorval (QC) H9P 1G7</span>
            <span>info@jumlas.com · 514-998-0709</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 9.5, color: '#9CA3AF', textAlign: 'center' }}>
            Les politiques complètes sont disponibles sur <strong>jumlas.com</strong> · Dernière mise à jour : juillet 2026
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body { margin: 0; background: white; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
