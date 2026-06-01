'use client';
import { useState } from 'react';
import '@/src/styles/client.css';

function ZTop({ onBook, onSignin }) {
  const [lang, setLang] = useState('FR');
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'linear-gradient(180deg, rgba(10,14,26,.95) 0%, rgba(10,14,26,.9) 100%)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px', display: 'flex', alignItems: 'center', height: 64, gap: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 20, color: 'white', letterSpacing: '-.02em' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #F5A524, #D97706)', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 700, fontSize: 14 }}>Z</div>
          Zendit
        </div>
        <div style={{ display: 'flex', gap: 24, marginLeft: 12, flex: 1 }}>
          {['Services', 'Suivi', 'FAQ', 'Contact'].map(l => (
            <a key={l} style={{ fontSize: 13.5, fontWeight: 500, color: 'rgba(255,255,255,.7)', cursor: 'pointer', transition: 'color .15s' }}
               onMouseEnter={e => e.target.style.color = 'white'}
               onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,.7)'}>{l}</a>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'inline-flex', border: '1px solid rgba(255,255,255,.2)', borderRadius: 7, padding: 2 }}>
            {['FR', 'EN'].map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                background: lang === l ? 'white' : 'transparent',
                color: lang === l ? '#0A0E1A' : 'rgba(255,255,255,.7)',
                border: 'none', borderRadius: 5, padding: '4px 9px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>{l}</button>
            ))}
          </div>
          <button onClick={onSignin} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.25)', borderRadius: 7, padding: '7px 14px', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.85)', cursor: 'pointer' }}>Se connecter</button>
          <button onClick={onBook} style={{ background: 'linear-gradient(135deg, #F5A524, #D97706)', border: 'none', borderRadius: 7, padding: '8px 16px', fontSize: 13, fontWeight: 700, color: 'white', cursor: 'pointer', boxShadow: '0 2px 8px rgba(217, 119, 6, .4)' }}>Réserver</button>
        </div>
      </div>
    </div>
  );
}

function Hero({ onBook }) {
  return (
    <div style={{ background: 'linear-gradient(180deg, #0A0E1A 0%, #0F172A 60%, #1A1F35 100%)', color: 'white', padding: '100px 28px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse 60% 40% at 50% 60%, rgba(245, 165, 36, .08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', background: 'rgba(245, 165, 36, .12)', border: '1px solid rgba(245, 165, 36, .25)', borderRadius: 999, fontSize: 12, fontWeight: 600, color: '#F5A524', marginBottom: 28 }}>
          ✈ Douala → Montréal · Fret aérien · Arrivée en 14 jours
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.1, margin: '0 0 22px' }}>
          Envoyez vos colis<br />
          <span style={{ background: 'linear-gradient(90deg, #F5A524, #FCBC4F)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>en toute confiance</span>
        </h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,.65)', lineHeight: 1.65, marginBottom: 40, fontWeight: 400 }}>
          Zendit simplifie l'envoi de colis entre le Cameroun et le Canada.<br />
          Suivi en temps réel, paiement sécurisé, remise à domicile ou en entrepôt.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onBook} style={{ background: 'linear-gradient(135deg, #F5A524, #D97706)', border: 'none', borderRadius: 9, padding: '14px 28px', fontSize: 15, fontWeight: 700, color: 'white', cursor: 'pointer', boxShadow: '0 4px 20px rgba(217, 119, 6, .35)' }}>
            Réserver un envoi →
          </button>
          <button style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 9, padding: '14px 28px', fontSize: 15, fontWeight: 600, color: 'white', cursor: 'pointer' }}>
            Suivre mon colis
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, maxWidth: 900, margin: '64px auto 0', textAlign: 'left' }}>
        {[
          { v: '12 000+', l: 'Colis livrés', sub: 'depuis 2020' },
          { v: '4,9 / 5',  l: 'Satisfaction client', sub: '1 200+ avis' },
          { v: '14 jours', l: 'Transit moyen', sub: 'Douala → Montréal' },
          { v: '98 %',    l: 'Livraisons réussies', sub: 'taux de succès' },
        ].map((k, i) => (
          <div key={i} style={{ padding: '20px 22px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#F5A524', letterSpacing: '-.02em', marginBottom: 4 }}>{k.v}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 2 }}>{k.l}</div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.45)' }}>{k.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Services() {
  const services = [
    { icon: '✈', title: 'Fret aérien', sub: 'Douala ↔ Montréal', desc: 'Transport express par avion cargo. Idéal pour les colis de valeur, vêtements, denrées sèches et électronique.', color: 'var(--brand-500)' },
    { icon: '🏠', title: 'Livraison domicile', sub: 'Dans tout le Québec', desc: 'Votre colis livré directement à l\'adresse du destinataire. Créneau sur rendez-vous, signature requise.', color: '#10B981' },
    { icon: '🏭', title: 'Retrait entrepôt', sub: '5500 Pl. de la Savane, Lachine', desc: 'Récupérez votre colis à notre entrepôt à Lachine. Horaires étendus, parking gratuit.', color: '#6366F1' },
    { icon: '📱', title: 'Suivi temps réel', sub: 'WhatsApp + SMS + email', desc: 'Notifications à chaque étape du voyage. Votre expéditeur et destinataire informés automatiquement.', color: '#F59E0B' },
  ];
  return (
    <div style={{ background: '#F7F8FA', padding: '80px 28px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', color: 'var(--brand-600)', textTransform: 'uppercase', marginBottom: 10 }}>NOS SERVICES</div>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-.02em', color: '#0B1220', margin: '0 0 14px' }}>Tout pour votre envoi</h2>
          <p style={{ fontSize: 16, color: '#6B7280', maxWidth: 520, margin: '0 auto', lineHeight: 1.65 }}>De la collecte à la livraison, nous gérons chaque étape de votre colis.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 }}>
          {services.map((s, i) => (
            <div key={i} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 14, padding: '24px 22px', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{s.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0B1220', marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: s.color, marginBottom: 10 }}>{s.sub}</div>
              <div style={{ fontSize: 13.5, color: '#6B7280', lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HowItWorks({ onBook }) {
  const steps = [
    { n: '01', title: 'Réservez en ligne',          desc: 'Remplissez le formulaire : expéditeur, destinataire, contenu. Obtenez un prix instantané.' },
    { n: '02', title: 'Déposez vos colis',          desc: 'Apportez vos colis à notre point de collecte à Douala ou programmez un enlèvement.' },
    { n: '03', title: 'Suivi en temps réel',        desc: 'Vous et votre destinataire êtes notifiés à chaque étape par WhatsApp et email.' },
    { n: '04', title: 'Livraison ou retrait',       desc: 'Votre destinataire reçoit le colis à domicile ou le retire à notre entrepôt de Lachine.' },
  ];
  return (
    <div style={{ background: 'white', padding: '80px 28px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', color: 'var(--brand-600)', textTransform: 'uppercase', marginBottom: 10 }}>COMMENT ÇA MARCHE</div>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-.02em', color: '#0B1220', margin: 0 }}>Simple comme un appel</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 28 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #F5A524, #D97706)', color: 'white', display: 'grid', placeItems: 'center', fontSize: 15, fontWeight: 800, flexShrink: 0 }}>{s.n}</div>
                {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: '#E5E7EB', position: 'absolute', left: 56, top: 22, width: 'calc(100% - 12px)' }} />}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0B1220', marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: 13.5, color: '#6B7280', lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <button onClick={onBook} style={{ background: 'linear-gradient(135deg, #F5A524, #D97706)', border: 'none', borderRadius: 9, padding: '14px 32px', fontSize: 15, fontWeight: 700, color: 'white', cursor: 'pointer', boxShadow: '0 4px 20px rgba(217, 119, 6, .3)' }}>
            Commencer mon envoi →
          </button>
        </div>
      </div>
    </div>
  );
}

function Testimonials() {
  const items = [
    { name: 'Fatou B.',   city: 'Montréal', text: 'Ma famille reçoit ses colis en temps et en heure. Le suivi WhatsApp est vraiment pratique, on est toujours informés.', stars: 5 },
    { name: 'Pierre N.',  city: 'Laval',    text: "J'envoie régulièrement des valises et cartons depuis 3 ans. Jamais eu de problème, l'équipe est réactive et professionnelle.", stars: 5 },
    { name: 'Amina K.',   city: 'Brossard', text: 'Le service de livraison à domicile est super pratique. Mon destinataire a été notifié la veille et a reçu le colis à l\'heure.', stars: 5 },
  ];
  return (
    <div style={{ background: '#F7F8FA', padding: '80px 28px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', color: 'var(--brand-600)', textTransform: 'uppercase', marginBottom: 10 }}>AVIS CLIENTS</div>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-.02em', color: '#0B1220', margin: 0 }}>Ils nous font confiance</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
          {items.map((t, i) => (
            <div key={i} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 14, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
              <div style={{ color: '#F59E0B', fontSize: 16, marginBottom: 12 }}>{'★'.repeat(t.stars)}</div>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: '0 0 18px' }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 999, background: 'linear-gradient(135deg, #F5A524, #D97706)', color: 'white', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700 }}>{t.name[0]}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0B1220' }}>{t.name}</div>
                  <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>{t.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Footer({ onBook }) {
  return (
    <footer style={{ background: '#0A0E1A', color: 'rgba(255,255,255,.6)', padding: '60px 28px 32px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 48 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 20, color: 'white', marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #F5A524, #D97706)', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 700, fontSize: 14 }}>Z</div>
              Zendit
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'rgba(255,255,255,.5)', marginBottom: 18 }}>
              Fret aérien international entre le Cameroun et le Canada. Votre partenaire de confiance depuis 2020.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onBook} style={{ background: 'linear-gradient(135deg, #F5A524, #D97706)', border: 'none', borderRadius: 7, padding: '8px 16px', fontSize: 13, fontWeight: 700, color: 'white', cursor: 'pointer' }}>Réserver</button>
            </div>
          </div>
          {[
            { title: 'Services',  links: ['Envoi Douala → Montréal', 'Livraison domicile', 'Retrait entrepôt', 'Suivi de colis'] },
            { title: 'Infos',     links: ['À propos', 'FAQ', 'Tarifs', 'Contact'] },
            { title: 'Contact',   links: ['+237 6** ** ** 00', '+1 514 *** ****', 'support@zendit.cargo', '5500 Pl. Savane, Lachine'] },
          ].map((col, i) => (
            <div key={i}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 14 }}>{col.title}</div>
              {col.links.map((l, j) => (
                <div key={j} style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginBottom: 8, cursor: 'pointer' }}>{l}</div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,.3)' }}>
          <span>© 2026 Zendit International SARL · Tous droits réservés</span>
          <span>Politique de confidentialité · CGV</span>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage({ onNav }) {
  const onBook = () => onNav ? onNav('/booking') : null;
  const onSignin = () => onNav ? onNav('/login') : null;

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <ZTop onBook={onBook} onSignin={onSignin} />
      <Hero onBook={onBook} />
      <Services />
      <HowItWorks onBook={onBook} />
      <Testimonials />
      <Footer onBook={onBook} />
    </div>
  );
}
