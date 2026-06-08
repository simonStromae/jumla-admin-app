'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import I from '../components/Icons.jsx';
import { ROUTES, PARCEL_CATEGORIES, getRoute } from '../data.js';
import { TopBar, SiteNav, SiteFooter } from './SiteLayout.jsx';
import '@/src/styles/client-omega.css';

const IMGS = {
  hero:    'https://images.pexels.com/photos/46148/aircraft-jet-landing-cloud-46148.jpeg?auto=compress&cs=tinysrgb&w=1400',
  cargo:   'https://images.pexels.com/photos/2026324/pexels-photo-2026324.jpeg?auto=compress&cs=tinysrgb&w=900',
  airport: 'https://images.pexels.com/photos/358319/pexels-photo-358319.jpeg?auto=compress&cs=tinysrgb&w=900',
  team:    'https://images.pexels.com/photos/4480505/pexels-photo-4480505.jpeg?auto=compress&cs=tinysrgb&w=900',
  svc1:    'https://images.pexels.com/photos/46148/aircraft-jet-landing-cloud-46148.jpeg?auto=compress&cs=tinysrgb&w=600',
  svc2:    'https://images.pexels.com/photos/4481259/pexels-photo-4481259.jpeg?auto=compress&cs=tinysrgb&w=600',
  svc3:    'https://images.pexels.com/photos/1267338/pexels-photo-1267338.jpeg?auto=compress&cs=tinysrgb&w=600',
  svc4:    'https://images.pexels.com/photos/4481327/pexels-photo-4481327.jpeg?auto=compress&cs=tinysrgb&w=600',
};


/* ─── Hero plein fond ─── */
function JHero({ onBook }) {
  return (
    <section className="jhero">
      <img className="jhero__bg" src={IMGS.hero} alt="" />
      <div className="jhero__overlay" />
      <div className="jc">
        <div className="jhero__content">
          <h1 className="jhero__title">
            <span className="or">Rapide</span> <span className="wh">&amp; fiable</span><br />
            <span className="wh">partout au</span> <span className="or">Canada</span>
          </h1>
          <p className="jhero__sub">
            Jumla Shipping est le spécialiste du fret aérien entre le Cameroun et le Canada.
            Réservez en ligne, déposez vos colis à Douala — votre destinataire les reçoit à Montréal en 14 jours.
          </p>
          <div className="jhero__btns">
            <button className="jhero__btn-1" onClick={onBook}>En savoir plus</button>
            <button className="jhero__btn-2" onClick={() => document.getElementById('jabout')?.scrollIntoView({ behavior: 'smooth' })}>
              Notre histoire
            </button>
          </div>
          <div className="jhero__stats">
            {[
              { n: '14 jours', l: 'Transit moyen' },
              { n: '12 000+',  l: 'Colis livrés' },
              { n: '98%',      l: 'Taux de succès' },
              { n: '2 500+',   l: 'Clients fidèles' },
            ].map(({ n, l }) => (
              <div key={l} className="jhero__stat">
                <div className="jhero__stat-n">{n}</div>
                <div className="jhero__stat-l">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── About ─── */
function JAbout() {
  return (
    <section className="jabout" id="jabout">
      <div className="jc">
        <span className="jabout__eyebrow">Bienvenue chez Jumla Shipping</span>
        <div className="jabout__grid">
          <div>
            <h2 className="jabout__title">
              Nous sommes experts du<br />
              <span className="or">fret aérien</span> international
            </h2>
            <div style={{ marginTop: 28 }}>
              <p className="jabout__body">
                Depuis 2021, Jumla Shipping connecte la diaspora africaine au Canada grâce au transport aérien.
                Chaque colis est pris en charge de Douala jusqu'à la porte de votre destinataire à Montréal,
                avec un suivi en temps réel et une vérification article par article à l'arrivée.
              </p>
            </div>
            <div className="jabout__ceo">
              <div className="jabout__ceo-av">JD</div>
              <div>
                <div className="jabout__ceo-name">Jean-Paul Douala</div>
                <div className="jabout__ceo-role">Directeur Général · Jumla Shipping</div>
              </div>
            </div>
          </div>
          <div>
            <p className="jabout__body">
              Nos décisions opérationnelles sont guidées par une seule priorité : que chaque colis arrive intact,
              à temps, et que l'expéditeur comme le destinataire soient informés à chaque étape du voyage.
            </p>
            <p className="jabout__body">
              Nous avons bâti un réseau de partenaires aériens fiables — Air France Cargo, Ethiopian Airlines,
              Turkish Cargo — pour garantir la régularité des rotations et la sécurité de vos marchandises,
              quelles que soient les saisons.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 36, paddingTop: 28, borderTop: '1px solid var(--border)' }}>
              {[{ n: '14j', l: 'Transit moyen' }, { n: '12k+', l: 'Colis livrés' }, { n: '98%', l: 'Succès' }].map(({ n, l }) => (
                <div key={l}>
                  <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 32, fontWeight: 900, color: 'var(--ink-900)', letterSpacing: '-.03em' }}>{n}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-400)', marginTop: 4 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Commitment ─── */
function JCommit({ onBook }) {
  return (
    <section className="jcommit">
      <div className="jc">
        <div className="jcommit__grid">
          <div className="jcommit__photos">
            <div className="jcommit__photo jcommit__photo--tall">
              <img src={IMGS.cargo} alt="Fret aérien" />
            </div>
            <div className="jcommit__photo">
              <img src={IMGS.airport} alt="Aéroport" />
            </div>
            <div className="jcommit__photo">
              <img src={IMGS.team} alt="Équipe" />
            </div>
          </div>
          <div>
            <h2 className="jcommit__title">
              Nous sommes engagés à fournir un service<br />
              <span className="or">sécurisé, équitable et fiable.</span>
            </h2>
            <p className="jcommit__body">
              Chaque colis est photographié au départ, pesé, et pointé article par article à l'arrivée à Montréal.
              Vous recevez une notification WhatsApp à chaque étape du voyage — sans avoir à demander.
            </p>
            <button className="jcommit__more" onClick={onBook}>
              <I.Plus style={{ width: 16, height: 16 }} /> Réserver maintenant
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Features bar ─── */
function JFeats() {
  const feats = [
    { Icon: I.Plane,    t: 'Livraison aérienne express',   d: 'Transit garanti 14 jours porte à porte entre Douala et Montréal grâce à nos partenaires aériens.' },
    { Icon: I.Sparkle,  t: 'Meilleur service du marché',   d: 'Vérification article par article, photos au départ et notification WhatsApp à chaque étape.' },
    { Icon: I.Globe,    t: 'Partout au Canada',             d: 'Livraison à domicile dans tout le Québec ou retrait à notre entrepôt de Montréal.' },
  ];
  return (
    <section className="jfeats">
      <div className="jc">
        <div className="jfeats__grid">
          {feats.map(({ Icon, t, d }) => (
            <div key={t}>
              <div className="jfeats__icon"><Icon style={{ width: 24, height: 24 }} /></div>
              <div className="jfeats__title">{t}</div>
              <p className="jfeats__desc">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Services cards ─── */
function JServices({ onBook }) {
  const svcs = [
    { img: IMGS.svc1, t: 'Fret aérien',        d: 'Transport direct Douala → Montréal. Le plus rapide et le plus sécurisé pour vos colis.' },
    { img: IMGS.svc2, t: 'Livraison domicile',  d: 'Votre destinataire reçoit son colis à domicile. Créneau sur rendez-vous, signature requise.' },
    { img: IMGS.svc3, t: 'Retrait entrepôt',    d: 'Récupération à notre entrepôt de Montréal. Horaires étendus, pas d\'avance requise.' },
    { img: IMGS.svc4, t: 'Suivi temps réel',    d: 'Notifications WhatsApp & SMS à chaque étape. Expéditeur et destinataire toujours informés.' },
  ];
  return (
    <section className="jsvc-sec" id="jsvc">
      <div className="jc">
        <div className="jsvc-sec__head">
          <div>
            <div className="jsvc-sec__eyebrow">Ce que nous proposons</div>
            <h2 className="jsvc-sec__title">
              Jumla <span className="or">Service</span>
            </h2>
          </div>
          <p className="jsvc-sec__body">
            Un seul interlocuteur pour tout votre envoi — de la prise en charge à Douala jusqu'à la remise
            au destinataire au Canada. Transparence totale, zéro mauvaise surprise.
          </p>
        </div>
        <div className="jsvc-grid">
          {svcs.map(({ img, t, d }) => (
            <div key={t} className="jsvc-card">
              <div className="jsvc-card__img"><img src={img} alt={t} /></div>
              <div className="jsvc-card__body">
                <div className="jsvc-card__title">{t}</div>
                <p className="jsvc-card__desc">{d}</p>
                <button className="jsvc-card__more" onClick={onBook}>En savoir plus →</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Estimator ─── */
function JEstimator({ onBook }) {
  const cats = PARCEL_CATEGORIES;
  const routes = ROUTES.filter(r => r.active);
  const [routeId, setRouteId] = useState(routes[0]?.id || 'r-dla-yul');
  const [lines, setLines] = useState([{ id: 1, cat: 'standard', weight: 12 }]);

  const r = getRoute(routeId) || routes[0];
  const tierFor = (w) => r.pricing.find(p => w > p.from && w <= p.to) || r.pricing[r.pricing.length - 1];
  const calc = (ln) => {
    const tier = tierFor(+ln.weight || 0);
    const base = Math.round((+ln.weight || 0) * tier.rate);
    const cat = cats.find(c => c.id === ln.cat) || cats[0];
    const surcharge = Math.round(base * cat.pct / 100);
    return { tier, base, cat, surcharge, total: base + surcharge };
  };
  const computed = lines.map(calc);
  const grandTotal = computed.reduce((a, c) => a + c.total, 0);
  const totalWeight = lines.reduce((a, l) => a + (+l.weight || 0), 0);

  const addLine = () => setLines([...lines, { id: Date.now(), cat: 'standard', weight: 5 }]);
  const removeLine = (id) => setLines(lines.length > 1 ? lines.filter(l => l.id !== id) : lines);
  const updLine = (id, k, v) => setLines(lines.map(l => l.id === id ? { ...l, [k]: v } : l));

  return (
    <section className="jest-wrap" id="jest">
      <div className="jc">
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="jsvc-sec__eyebrow" style={{ display: 'block', marginBottom: 10 }}>Simulateur de prix</div>
          <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '36px', color: 'var(--ink-900)', fontWeight: 900 }}>
            Combien coûte mon envoi ?
          </h2>
          <p style={{ fontSize: 15, color: 'var(--ink-400)', marginTop: 12, lineHeight: 1.65, maxWidth: 460, margin: '12px auto 0' }}>
            Calculez en quelques secondes. Sans inscription, sans engagement.
          </p>
        </div>
        <div className="jest">
          <div className="jest__head">
            <I.Calculator style={{ width: 16, height: 16, color: "var(--brand-400)" }} />
            <span className="jest__title">Estimateur d'envoi</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink-400)' }}>Ajoutez autant d'articles que nécessaire</span>
          </div>
          <div className="jest__route">
            <div className="jest__f">
              <label>Départ</label>
              <select value={routeId} onChange={e => setRouteId(e.target.value)}>
                {routes.map(rr => <option key={rr.id} value={rr.id}>{rr.fromCity} ({rr.fromIATA})</option>)}
              </select>
            </div>
            <I.ArrowRight style={{ width: 18, height: 18, color: "var(--ink-300)", alignSelf: 'flex-end', marginBottom: 11 }} />
            <div className="jest__f">
              <label>Destination</label>
              <select>{routes.map(rr => <option key={rr.id}>{rr.toCity} ({rr.toIATA})</option>)}</select>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ alignSelf: 'flex-end', marginBottom: 11, fontSize: 13, color: 'var(--ink-400)' }}>
              Transit <strong style={{ color: "var(--ink-900)" }}>{r?.transitDays} j</strong>
              {' · '}Tarif en <strong style={{ color: "var(--ink-900)" }}>{r?.currency}</strong>
            </div>
          </div>
          <div className="jest__lines">
            <div className="jest__lhead">
              <span>Catégorie</span><span>Poids (kg)</span>
              <span style={{ textAlign: 'right' }}>Base</span>
              <span style={{ textAlign: 'right' }}>Supplément</span>
              <span style={{ textAlign: 'right' }}>Sous-total</span>
              <span />
            </div>
            {lines.map((ln, i) => {
              const c = computed[i];
              return (
                <div className="jest__line" key={ln.id}>
                  <div className="jest__f">
                    <select value={ln.cat} onChange={e => updLine(ln.id, 'cat', e.target.value)}>
                      {cats.map(ct => <option key={ct.id} value={ct.id}>{ct.icon} {ct.label} ({ct.pct > 0 ? '+' : ''}{ct.pct}%)</option>)}
                    </select>
                  </div>
                  <div className="jest__f">
                    <input type="number" min="0.5" step="0.5" value={ln.weight} onChange={e => updLine(ln.id, 'weight', e.target.value)} />
                  </div>
                  <div className="jest__cell" style={{ textAlign: 'right' }}>
                    {c.base} <span className="jest__cur">{r?.currency}</span>
                    <div className="jest__tier">{c.tier.from}–{c.tier.to}kg · {c.tier.rate}/kg</div>
                  </div>
                  <div className="jest__cell" style={{ textAlign: 'right', color: c.surcharge > 0 ? "var(--brand-600)" : c.surcharge < 0 ? '#059669' : "var(--ink-300)" }}>
                    {c.surcharge > 0 ? '+' : ''}{c.surcharge} <span className="jest__cur">{r?.currency}</span>
                    <div className="jest__tier">{c.cat.label} {c.cat.pct > 0 ? '+' : ''}{c.cat.pct}%</div>
                  </div>
                  <div className="jest__cell" style={{ fontWeight: 800, color: 'var(--ink-900)', textAlign: 'right' }}>
                    {c.total} <span className="jest__cur">{r?.currency}</span>
                  </div>
                  <button className="jest__del" onClick={() => removeLine(ln.id)} disabled={lines.length <= 1}>
                    <I.Trash style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              );
            })}
            <button className="jest__add" onClick={addLine}>
              <I.Plus style={{ width: 14, height: 14 }} /> Ajouter un article
            </button>
          </div>
          <div className="jest__res">
            <div>
              <div className="jest__total-label">
                {lines.length} article{lines.length > 1 ? 's' : ''} · {totalWeight} kg · {r?.fromIATA} → {r?.toIATA}
              </div>
              <span className="jest__total-n">{grandTotal}</span>
              <span className="jest__total-cur">{r?.currency}</span>
            </div>
            <button className="jbtn-nav" style={{ marginLeft: 'auto' }} onClick={onBook}>
              Réserver cet envoi <I.ArrowRight style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
function JFAQ() {
  const faqs = [
    { q: 'Combien de temps dure un envoi Douala → Montréal ?', a: 'Le transit moyen est de 14 jours porte à porte. Vous recevez une estimation précise dès la réservation, puis des notifications WhatsApp à chaque étape du voyage.' },
    { q: 'Comment est calculé le prix ?', a: 'Le tarif est au kilo avec une grille par tranche (0–5 kg, 5–10 kg, 10–25 kg…). Certaines catégories appliquent un supplément : fragile +8%, électronique +5%. Les documents bénéficient d\'une réduction de 10%. Utilisez notre simulateur pour un devis instantané.' },
    { q: 'Comment est vérifié le contenu à l\'arrivée ?', a: 'Chaque article est photographié et listé sur un bordereau au départ. À l\'arrivée à Montréal, nos agents vérifient article par article. En cas d\'écart, vous êtes alertés immédiatement par WhatsApp.' },
    { q: 'Que puis-je envoyer ?', a: 'Vêtements, denrées alimentaires sèches, électronique, cosmétiques, documents, mobilier léger. Les produits dangereux, liquides et marchandises prohibées au transport aérien sont exclus.' },
    { q: 'Comment mon destinataire récupère-t-il le colis ?', a: 'Au choix : livraison à domicile partout au Québec (créneau sur rendez-vous, signature requise) ou retrait à notre entrepôt de Montréal. Paiement à la livraison — Interac, virement, espèces ou Mobile Money.' },
    { q: 'Peut-on envoyer depuis d\'autres villes ?', a: 'Nous opérons principalement depuis Douala. Nous avons également des routes depuis Lagos (Nigeria) et vers Bruxelles. Contactez-nous pour un devis personnalisé sur d\'autres origines.' },
  ];
  const [open, setOpen] = useState(0);
  return (
    <section style={{ padding: '96px 0', background: '#F8F9FC' }} id="jfaq">
      <div className="jc">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 72, alignItems: 'start' }}>
          <div>
            <div className="jsvc-sec__eyebrow" style={{ display: 'block', marginBottom: 12 }}>FAQ</div>
            <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '36px', fontWeight: 900, color: 'var(--ink-900)', marginBottom: 16 }}>
              Questions fréquentes
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--ink-400)' }}>
              Une autre question ? WhatsApp nous répond en moins d'une heure.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, color: '#25D366', fontWeight: 600, marginTop: 20 }}>
              <I.Whatsapp style={{ width: 18, height: 18 }} /> Écrire sur WhatsApp
            </div>
          </div>
          <div className="jfaq">
            {faqs.map((f, i) => (
              <div key={i} className={'jfaq__item' + (open === i ? ' is-open' : '')}>
                <button className="jfaq__q" onClick={() => setOpen(open === i ? -1 : i)}>
                  <span>{f.q}</span>
                  <span className="jfaq__ic">
                    {open === i ? <I.ChevronUp style={{ width: 18, height: 18 }} /> : <I.ChevronDown style={{ width: 18, height: 18 }} />}
                  </span>
                </button>
                {open === i && <div className="jfaq__a">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── CTA section ─── */
function JCTA({ onBook }) {
  return (
    <section className="jcta-sec">
      <div className="jc">
        <div className="jcta-sec__title">Prêt à envoyer votre premier colis ?</div>
        <p className="jcta-sec__sub">
          Rejoignez 2 500+ clients qui font confiance à Jumla Shipping pour leurs envois entre l'Afrique et le Canada.
        </p>
        <div className="jcta-sec__btns">
          <button className="jcta-btn-1" onClick={onBook}>
            Réserver un envoi <I.ArrowRight style={{ width: 17, height: 17 }} />
          </button>
        </div>
      </div>
    </section>
  );
}


/* ─── Root ─── */
export default function LandingPage({ onNav }) {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const onBook = () => {
    if (!onNav) return;
    if (session && (role === 'client' || !role)) {
      onNav('/client/booking');
    } else if (session && (role === 'admin' || role === 'agent')) {
      onNav('/admin');
    } else {
      onNav('/login');
    }
  };

  return (
    <div className="jpage">
      <TopBar />
      <SiteNav onNav={onNav} onBook={onBook} mode="landing" />
      <JHero onBook={onBook} />
      <JEstimator onBook={onBook} />
      <JAbout />
      <JCommit onBook={onBook} />
      <JFeats />
      <JServices onBook={onBook} />
      <JFAQ />
      <JCTA onBook={onBook} />
      <SiteFooter />
    </div>
  );
}
