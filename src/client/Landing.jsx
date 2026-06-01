'use client';
import { useState, useEffect } from 'react';
import I from '../components/Icons.jsx';
import { ROUTES, PARCEL_CATEGORIES, getRoute } from '../data.js';
import '@/src/styles/client-omega.css';

const IMGS = {
  hero:   'https://images.pexels.com/photos/46148/aircraft-jet-landing-cloud-46148.jpeg?auto=compress&cs=tinysrgb&w=1800',
  cargo:  'https://images.pexels.com/photos/2026324/pexels-photo-2026324.jpeg?auto=compress&cs=tinysrgb&w=1200',
  team:   'https://images.pexels.com/photos/4480505/pexels-photo-4480505.jpeg?auto=compress&cs=tinysrgb&w=1000',
};

/* ─── Sticky nav with scroll-aware style ─── */
function JNav({ onSignin, onBook }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const links = [
    { l: 'Services',   id: 'jsvc' },
    { l: 'Comment',    id: 'jhow' },
    { l: 'Tarifs',     id: 'jest' },
    { l: 'Suivi',      id: 'jtrack' },
    { l: 'FAQ',        id: 'jfaq' },
  ];
  return (
    <nav className={`jnav ${scrolled ? 'is-scrolled' : 'is-hero'}`}>
      <div className="jc">
        <div className="jnav__inner">
          <div className="jnav__logo">
            <div className="jnav__logo-mark">J</div>
            Jumla Shipping
          </div>
          <div className="jnav__links">
            {links.map(({ l, id }) => (
              <button key={l} className="jnav__link" onClick={() => go(id)}>{l}</button>
            ))}
          </div>
          <div className="jnav__right">
            <button className="jnav__signin" onClick={onSignin}>Se connecter</button>
            <button className="jbtn jbtn--amber" onClick={onBook}>
              Réserver <I.ArrowRight style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

/* ─── Hero full-screen ─── */
function JHero({ onBook, onSignin }) {
  return (
    <section className="jhero">
      <img className="jhero__bg" src={IMGS.hero} alt="" />
      <div className="jhero__overlay" />
      <div className="jc">
        <div className="jhero__body">
          <span className="jchip jchip--light">Fret aérien exclusif · Douala → Montréal</span>
          <h1 className="jhero__title">
            Votre colis au Canada<br />
            en <span>14 jours</span>, garanti.
          </h1>
          <p className="jhero__sub">
            Jumla Shipping est le spécialiste du fret aérien entre le Cameroun et le Canada.
            Réservez en ligne, déposez vos colis, on s'occupe du reste.
          </p>
          <div className="jhero__ctas">
            <button className="jbtn jbtn--amber jbtn--xl" onClick={onBook}>
              Réserver un envoi <I.ArrowRight style={{ width: 18, height: 18 }} />
            </button>
            <button className="jbtn jbtn--outline-light jbtn--xl"
              onClick={() => document.getElementById('jest')?.scrollIntoView({ behavior: 'smooth' })}>
              Calculer le prix
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

/* ─── Trust logos bar ─── */
function JLogos() {
  const logos = ['Air France Cargo', 'Ethiopian Air', 'Brussels Airlines', 'Turkish Cargo', 'DHL Express'];
  return (
    <div className="jlogos">
      <div className="jc">
        <div className="jlogos__inner">
          <span className="jlogos__label">Partenaires de transport</span>
          <div className="jlogos__items">
            {logos.map(l => (
              <span key={l} className="jlogos__item">{l}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── How it works ─── */
function JHowItWorks() {
  const steps = [
    {
      n: '01', Icon: I.FileText,
      title: 'Réservez en ligne',
      desc: 'Remplissez le formulaire avec expéditeur, destinataire et contenu. Obtenez un prix immédiat, sans inscription.',
    },
    {
      n: '02', Icon: I.Box,
      title: 'Déposez vos colis',
      desc: 'Apportez vos colis à notre point de collecte à Douala. Nos agents vérifient et photographient chaque article.',
    },
    {
      n: '03', Icon: I.Plane,
      title: 'Livraison au Canada',
      desc: 'Votre destinataire reçoit son colis à domicile ou le retire à notre entrepôt à Montréal. Signature requise.',
    },
  ];
  return (
    <section className="jsec" id="jhow" style={{ background: 'var(--j-light)' }}>
      <div className="jc">
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <span className="jchip">Comment ça marche</span>
          <h2 style={{ marginTop: 16, fontSize: 'clamp(28px,4vw,40px)' }}>Simple comme un appel</h2>
          <p style={{ fontSize: 16, color: 'var(--j-muted)', marginTop: 12, lineHeight: 1.65, maxWidth: 480, margin: '12px auto 0' }}>
            De la réservation à la livraison, chaque étape est pensée pour vous simplifier la vie.
          </p>
        </div>
        <div className="jhow">
          {steps.map(({ n, Icon, title, desc }) => (
            <div key={n} className="jhow__card">
              <div className="jhow__num">{n}</div>
              <div className="jhow__icon"><Icon style={{ width: 22, height: 22 }} /></div>
              <div className="jhow__title">{title}</div>
              <p className="jhow__desc">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Air freight services ─── */
function JServices({ onBook }) {
  const feats = [
    { Icon: I.Check, t: 'Suivi GPS temps réel à chaque étape' },
    { Icon: I.Check, t: 'Photo de chaque article au départ' },
    { Icon: I.Check, t: 'Vérification article par article à l\'arrivée' },
    { Icon: I.Check, t: 'Notification WhatsApp expéditeur & destinataire' },
    { Icon: I.Check, t: 'Livraison à domicile ou retrait entrepôt Montréal' },
    { Icon: I.Check, t: 'Paiement à la livraison — aucune avance requise' },
  ];
  return (
    <section className="jsec" id="jsvc">
      <div className="jc">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <span className="jchip">Notre service</span>
            <h2 style={{ marginTop: 16, fontSize: 'clamp(28px,4vw,42px)' }}>Fret aérien<br />Douala → Montréal</h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--j-muted)', margin: '18px 0 28px', maxWidth: 420 }}>
              Le moyen le plus rapide et le plus sûr d'envoyer vos colis entre le Cameroun et le Canada.
              Transit garanti en 14 jours, porte à porte.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {feats.map(({ Icon, t }) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'var(--j-ink)' }}>
                  <span style={{ width: 22, height: 22, borderRadius: 999, background: 'var(--j-amber-l)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: 13, height: 13, color: 'var(--j-amber-d)' }} />
                  </span>
                  {t}
                </div>
              ))}
            </div>
            <button className="jbtn jbtn--navy jbtn--lg" onClick={onBook}>
              Réserver maintenant <I.ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
          <div style={{ borderRadius: 20, overflow: 'hidden', aspectRatio: '4/3', background: 'var(--j-light)', boxShadow: 'var(--j-sh-lg)' }}>
            <img src={IMGS.cargo} alt="Fret aérien Jumla" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        </div>

        {/* Why us - 3 pillars */}
        <div style={{ marginTop: 72, paddingTop: 56, borderTop: '1px solid var(--j-border)' }}>
          <div className="jwhy">
            {[
              { Icon: I.Lock,     t: 'Sécurité totale',   d: 'Chaque colis est photographié, pesé et consigné à l\'ouverture. Vos articles sont assurés pendant tout le transit.' },
              { Icon: I.Activity, t: 'Suivi transparent',  d: 'Vous et votre destinataire recevez des notifications WhatsApp à chaque étape. Aucune surprise à la livraison.' },
              { Icon: I.Wallet,   t: 'Prix honnêtes',      d: 'Tarif au kilo avec tableau de bord clair. Estimez votre envoi en ligne, sans inscription ni engagement.' },
            ].map(({ Icon, t, d }) => (
              <div key={t} className="jwhy__card">
                <div className="jwhy__icon"><Icon style={{ width: 20, height: 20 }} /></div>
                <div className="jwhy__title">{t}</div>
                <p className="jwhy__desc">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Price estimator ─── */
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
    <section className="jsec" id="jest" style={{ background: 'var(--j-light)' }}>
      <div className="jc">
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span className="jchip">Simulateur de prix</span>
          <h2 style={{ marginTop: 16, fontSize: 'clamp(28px,4vw,40px)' }}>Combien coûte mon envoi ?</h2>
          <p style={{ fontSize: 16, color: 'var(--j-muted)', margin: '12px auto 0', maxWidth: 460, lineHeight: 1.6 }}>
            Calculez le prix en quelques secondes. Sans inscription, sans engagement.
          </p>
        </div>
        <div className="jest">
          <div className="jest__head">
            <I.Calculator style={{ width: 16, height: 16, color: 'var(--j-amber-d)' }} />
            <span className="jest__title">Estimateur d'envoi</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--j-muted)' }}>
              Ajoutez autant d'articles que nécessaire
            </span>
          </div>
          <div className="jest__route">
            <div className="jest__f">
              <label>Départ</label>
              <select value={routeId} onChange={e => setRouteId(e.target.value)}>
                {routes.map(rr => <option key={rr.id} value={rr.id}>{rr.fromCity} ({rr.fromIATA})</option>)}
              </select>
            </div>
            <I.ArrowRight style={{ width: 18, height: 18, color: 'var(--j-muted)', alignSelf: 'flex-end', marginBottom: 11 }} />
            <div className="jest__f">
              <label>Destination</label>
              <select>
                {routes.map(rr => <option key={rr.id}>{rr.toCity} ({rr.toIATA})</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ alignSelf: 'flex-end', marginBottom: 11, fontSize: 13, color: 'var(--j-muted)' }}>
              Transit <strong style={{ color: 'var(--j-ink)' }}>{r?.transitDays} j</strong>
              {' · '}Tarif en <strong style={{ color: 'var(--j-ink)' }}>{r?.currency}</strong>
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
                      {cats.map(ct => (
                        <option key={ct.id} value={ct.id}>{ct.icon} {ct.label} ({ct.pct > 0 ? '+' : ''}{ct.pct}%)</option>
                      ))}
                    </select>
                  </div>
                  <div className="jest__f">
                    <input type="number" min="0.5" step="0.5" value={ln.weight} onChange={e => updLine(ln.id, 'weight', e.target.value)} />
                  </div>
                  <div className="jest__cell jmono" style={{ textAlign: 'right' }}>
                    {c.base} <span className="jest__cur">{r?.currency}</span>
                    <div className="jest__tier">{c.tier.from}–{c.tier.to} kg · {c.tier.rate}/kg</div>
                  </div>
                  <div className="jest__cell jmono" style={{ textAlign: 'right', color: c.surcharge > 0 ? 'var(--j-amber-d)' : c.surcharge < 0 ? '#059669' : 'var(--j-muted)' }}>
                    {c.surcharge > 0 ? '+' : ''}{c.surcharge} <span className="jest__cur">{r?.currency}</span>
                    <div className="jest__tier">{c.cat.label} {c.cat.pct > 0 ? '+' : ''}{c.cat.pct}%</div>
                  </div>
                  <div className="jest__cell jmono" style={{ fontWeight: 800, color: 'var(--j-ink)', textAlign: 'right' }}>
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
                Total estimé · {lines.length} article{lines.length > 1 ? 's' : ''} · {totalWeight} kg · {r?.fromIATA} → {r?.toIATA}
              </div>
              <span className="jest__total-n jmono">{grandTotal}</span>
              <span className="jest__total-cur">{r?.currency}</span>
            </div>
            <button className="jbtn jbtn--amber jbtn--lg" style={{ marginLeft: 'auto' }} onClick={onBook}>
              Réserver cet envoi <I.ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Parcel tracking ─── */
function JTracking() {
  const [searched, setSearched] = useState(false);
  const timeline = [
    { l: 'Colis déposé à Douala',       d: '28 avr. · 10:14', s: 'done' },
    { l: 'Embarqué en soute',           d: '28 avr. · 18:30', s: 'done' },
    { l: 'En vol vers Montréal',        d: '03 mai · 22:45',  s: 'done' },
    { l: 'Arrivé à Montréal',           d: '12 mai · 08:14',  s: 'active' },
    { l: 'Livré au destinataire',       d: 'Prévu 14 mai',    s: 'todo' },
  ];
  return (
    <section className="jsec jtrack" id="jtrack">
      <div className="jc jc--sm">
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <span className="jchip jchip--light">Suivi de colis</span>
          <h2 style={{ marginTop: 16, fontSize: 'clamp(28px,4vw,40px)', color: 'white' }}>Où est mon colis ?</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.6)', margin: '12px auto 0', maxWidth: 400, lineHeight: 1.65 }}>
            Numéro de suivi, téléphone ou nom. Sans créer de compte.
          </p>
        </div>
        <div className="jtrack__box">
          <I.Search style={{ width: 18, height: 18, color: 'var(--j-muted)', alignSelf: 'center', marginLeft: 10, flexShrink: 0 }} />
          <input className="jtrack__input" placeholder="Ex : JL-26042-DLA0418" onKeyDown={e => e.key === 'Enter' && setSearched(true)} />
          <button className="jbtn jbtn--amber" onClick={() => setSearched(true)}>
            Suivre <I.ArrowRight style={{ width: 15, height: 15 }} />
          </button>
        </div>
        {searched && (
          <div className="jtrack__result">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--j-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Numéro de suivi</div>
                <div className="jmono" style={{ fontSize: 20, fontWeight: 800, color: 'var(--j-ink)' }}>JL-26042-DLA0418</div>
              </div>
              <span style={{ background: 'var(--j-amber)', color: '#000', padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700 }}>En transit · 80%</span>
            </div>
            {timeline.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: 18, position: 'relative' }}>
                {i < timeline.length - 1 && (
                  <div style={{ position: 'absolute', left: 13, top: 28, bottom: -4, width: 2, background: t.s === 'done' ? 'var(--j-amber)' : 'var(--j-border)' }} />
                )}
                <div style={{
                  width: 28, height: 28, borderRadius: 999, flex: '0 0 28px', zIndex: 1,
                  background: t.s === 'done' ? 'var(--j-amber)' : t.s === 'active' ? 'var(--j-navy)' : 'white',
                  border: '2px solid ' + (t.s === 'todo' ? 'var(--j-border)' : t.s === 'active' ? 'var(--j-navy)' : 'var(--j-amber)'),
                  color: t.s === 'todo' ? 'var(--j-muted)' : t.s === 'done' ? '#000' : 'white',
                  display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700,
                }}>
                  {t.s === 'done' ? <I.Check style={{ width: 13, height: 13 }} /> : i + 1}
                </div>
                <div style={{ paddingTop: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: t.s === 'todo' ? 'var(--j-muted)' : 'var(--j-ink)' }}>{t.l}</div>
                  <div style={{ fontSize: 12, color: 'var(--j-muted)' }}>{t.d}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
function JFAQ() {
  const faqs = [
    { q: 'Combien de temps dure un envoi Douala → Montréal ?', a: 'Le transit moyen est de 14 jours porte à porte. Vous recevez une estimation précise à la réservation, puis des notifications à chaque étape du voyage.' },
    { q: 'Comment est calculé le prix de mon envoi ?', a: 'Le tarif est au kilo avec une grille par tranche (0–5 kg, 5–10 kg, 10–25 kg, etc.). Certaines catégories appliquent un supplément : fragile +8 %, électronique +5 %. Les documents bénéficient d\'une réduction. Utilisez notre estimateur ci-dessus pour un devis instantané.' },
    { q: 'Comment est vérifié le contenu à l\'arrivée ?', a: 'Chaque article est photographié au départ et coché sur un bordereau à l\'arrivée. En cas d\'écart, vous et votre destinataire êtes alertés immédiatement par WhatsApp.' },
    { q: 'Que puis-je envoyer ?', a: 'Vêtements, denrées alimentaires sèches, électronique, cosmétiques, documents et mobilier léger. Les produits dangereux, liquides et marchandises prohibées au transport aérien sont exclus.' },
    { q: 'Comment mon destinataire récupère-t-il le colis ?', a: 'Au choix : livraison à domicile dans tout le Québec (créneau sur rendez-vous, signature requise) ou retrait à notre entrepôt de Montréal. Le paiement se fait à la livraison — Interac, virement, espèces ou Mobile Money.' },
    { q: 'Puis-je envoyer depuis Lagos ou Bruxelles ?', a: 'Oui. En plus de Douala, nous opérons depuis Lagos (Nigeria) et Douala vers Bruxelles. D\'autres routes sont en cours d\'ouverture. Contactez-nous pour un devis sur mesure.' },
  ];
  const [open, setOpen] = useState(0);
  return (
    <section className="jsec" id="jfaq">
      <div className="jc jc--sm">
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <span className="jchip">FAQ</span>
          <h2 style={{ marginTop: 16, fontSize: 'clamp(28px,4vw,40px)' }}>Questions fréquentes</h2>
          <p style={{ fontSize: 16, color: 'var(--j-muted)', margin: '12px auto 0', maxWidth: 440, lineHeight: 1.6 }}>
            Tout ce qu'il faut savoir avant d'expédier. Une autre question ? WhatsApp nous répond en moins d'une heure.
          </p>
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
    </section>
  );
}

/* ─── CTA band ─── */
function JCTA({ onBook }) {
  return (
    <section className="jcta">
      <div className="jc" style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', color: '#000', maxWidth: 560, margin: '0 auto 16px' }}>
          Prêt à envoyer votre premier colis ?
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(0,0,0,.6)', margin: '0 auto 32px', maxWidth: 440, lineHeight: 1.65 }}>
          Rejoignez 2 500+ clients qui font confiance à Jumla Shipping pour leurs envois entre l'Afrique et le Canada.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="jbtn jbtn--navy jbtn--xl" onClick={onBook}>
            Réserver un envoi <I.ArrowRight style={{ width: 18, height: 18 }} />
          </button>
          <button className="jbtn jbtn--outline jbtn--xl"
            style={{ borderColor: 'rgba(0,0,0,.2)' }}
            onClick={() => document.getElementById('jtrack')?.scrollIntoView({ behavior: 'smooth' })}>
            <I.Search style={{ width: 16, height: 16 }} /> Suivre un colis
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function JFooter() {
  const cols = [
    { l: 'Service',   items: ['Transport aérien', 'Suivi de colis', 'Livraison domicile', 'Retrait entrepôt'] },
    { l: 'Entreprise',items: ['À propos', 'Blog', 'Contact', 'Recrutement'] },
    { l: 'Légal',     items: ['Conditions générales', 'Confidentialité', 'Cookies', 'FAQ'] },
  ];
  return (
    <footer className="jfoot" id="jfoot">
      <div className="jc">
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div className="jnav__logo-mark">J</div>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: '-.02em' }}>Jumla Shipping</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,.5)', maxWidth: 280, margin: '0 0 20px' }}>
              Spécialiste du fret aérien international entre l'Afrique et le Canada depuis 2021.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, color: '#25D366', fontWeight: 600 }}>
              <I.Whatsapp style={{ width: 16, height: 16 }} /> WhatsApp Douala · Montréal
            </div>
          </div>
          {cols.map(c => (
            <div key={c.l}>
              <div className="jfoot__title">{c.l}</div>
              <div className="jfoot__col">
                {c.items.map(item => <a key={item}>{item}</a>)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ paddingTop: 24, borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: 13, color: 'rgba(255,255,255,.35)' }}>
          <span>© 2026 Jumla Shipping SARL — Tous droits réservés</span>
          <span>Douala · Montréal · Lagos · Bruxelles</span>
        </div>
      </div>
    </footer>
  );
}

/* ─── Auth modal ─── */
function JAuth({ mode: initMode, onClose }) {
  const [mode, setMode] = useState(initMode || 'login');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', city: 'Montréal', password: '' });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="jauth-bg" onClick={onClose}>
      <div className="jauth" onClick={e => e.stopPropagation()}>
        <div className="jauth__side">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div className="jnav__logo-mark">J</div>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 17, fontWeight: 800, color: 'white', letterSpacing: '-.02em' }}>Jumla Shipping</span>
          </div>
          <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 22, fontWeight: 800, color: 'white', lineHeight: 1.2, margin: '0 0 12px' }}>
            {mode === 'login' ? 'Bon retour' : 'Créez votre compte'}
          </h3>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,.65)', lineHeight: 1.6, margin: 0 }}>
            {mode === 'login'
              ? 'Retrouvez vos adresses, historique d\'envois et suivi en temps réel.'
              : 'Enregistrez vos infos une fois, réservez en deux clics pour tous vos prochains envois.'}
          </p>
          <div className="jauth__perks">
            {['Infos pré-remplies à chaque réservation', 'Carnet d\'adresses destinataires', 'Suivi temps réel de vos colis', 'Historique et factures'].map((p, i) => (
              <div key={i} className="jauth__perk">
                <span style={{ width: 20, height: 20, borderRadius: 999, background: 'var(--j-amber)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <I.Check style={{ width: 12, height: 12, color: '#000' }} />
                </span>
                {p}
              </div>
            ))}
          </div>
        </div>
        <div className="jauth__form">
          <button className="jauth__close" onClick={onClose}><I.Cross style={{ width: 18, height: 18 }} /></button>
          <div className="jauth__tabs">
            <button className={mode === 'login'  ? 'is-active' : ''} onClick={() => setMode('login')}>Connexion</button>
            <button className={mode === 'signup' ? 'is-active' : ''} onClick={() => setMode('signup')}>Créer un compte</button>
          </div>
          {mode === 'signup' && (
            <div className="jauth__row2">
              <div className="jauth__f"><label>Prénom</label><input value={form.firstName} onChange={e => upd('firstName', e.target.value)} placeholder="Awa" /></div>
              <div className="jauth__f"><label>Nom</label><input value={form.lastName} onChange={e => upd('lastName', e.target.value)} placeholder="Diallo" /></div>
            </div>
          )}
          <div className="jauth__f"><label>Email</label><input type="email" value={form.email} onChange={e => upd('email', e.target.value)} placeholder="vous@email.com" /></div>
          {mode === 'signup' && (
            <div className="jauth__row2">
              <div className="jauth__f"><label>Téléphone</label><input value={form.phone} onChange={e => upd('phone', e.target.value)} placeholder="+1 514 ··· ····" /></div>
              <div className="jauth__f">
                <label>Ville</label>
                <select value={form.city} onChange={e => upd('city', e.target.value)}>
                  {['Montréal','Laval','Longueuil','Brossard','Québec','Toronto','Douala'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>
          )}
          <div className="jauth__f"><label>Mot de passe</label><input type="password" value={form.password} onChange={e => upd('password', e.target.value)} placeholder="••••••••" /></div>
          <button className="jbtn jbtn--amber" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            {mode === 'login' ? 'Se connecter' : 'Créer mon compte'} <I.ArrowRight style={{ width: 16, height: 16 }} />
          </button>
          <div className="jauth__sep"><span>ou</span></div>
          <button className="jbtn jbtn--outline" style={{ width: '100%', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 0 1-3.4 13l5.7 5.7A20 20 0 0 0 44 24c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8a12 12 0 0 1 20-4.7l5.7-5.7A20 20 0 0 0 6.3 14.7z"/><path fill="#4CAF50" d="M24 44a20 20 0 0 0 13.5-5.2L31.3 34a12 12 0 0 1-18-6L7 32.8A20 20 0 0 0 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 0 1-4 5.6l6 5A19 19 0 0 0 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
            Continuer avec Google Workspace
          </button>
          <p style={{ fontSize: 12, color: 'var(--j-muted)', textAlign: 'center', marginBottom: 0 }}>
            {mode === 'login' ? 'Pas encore de compte ? ' : 'Déjà inscrit ? '}
            <a style={{ color: 'var(--j-amber-d)', fontWeight: 700, cursor: 'pointer' }} onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
              {mode === 'login' ? 'Créez-en un' : 'Connectez-vous'}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Root ─── */
export default function LandingPage({ onNav }) {
  const [authMode, setAuthMode] = useState(null);
  const onBook = () => onNav ? onNav('/booking') : null;

  return (
    <div className="jpage">
      <JNav onSignin={() => setAuthMode('login')} onBook={onBook} />
      <JHero onBook={onBook} onSignin={() => setAuthMode('login')} />
      <JLogos />
      <JServices onBook={onBook} />
      <JHowItWorks />
      <JEstimator onBook={onBook} />
      <JTracking />
      <JFAQ />
      <JCTA onBook={onBook} />
      <JFooter />
      {authMode && <JAuth mode={authMode} onClose={() => setAuthMode(null)} />}
    </div>
  );
}
