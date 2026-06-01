'use client';
import { useState } from 'react';
import I from '../components/Icons.jsx';
import { ROUTES, PARCEL_CATEGORIES, getRoute } from '../data.js';
import '@/src/styles/client-omega.css';

const IMGS = {
  hero:   'https://images.pexels.com/photos/2026324/pexels-photo-2026324.jpeg?auto=compress&cs=tinysrgb&w=1700',
  air:    'https://images.pexels.com/photos/358319/pexels-photo-358319.jpeg?auto=compress&cs=tinysrgb&w=1000',
  sea:    'https://images.pexels.com/photos/1117210/pexels-photo-1117210.jpeg?auto=compress&cs=tinysrgb&w=1000',
  road:   'https://images.pexels.com/photos/93398/pexels-photo-93398.jpeg?auto=compress&cs=tinysrgb&w=1000',
  ware:   'https://images.pexels.com/photos/1267338/pexels-photo-1267338.jpeg?auto=compress&cs=tinysrgb&w=1000',
  worker: 'https://images.pexels.com/photos/4480505/pexels-photo-4480505.jpeg?auto=compress&cs=tinysrgb&w=1000',
};

function ZNav({ onSignin, onBook }) {
  const [lang, setLang] = useState('FR');
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const links = [
    { l: 'À propos',  id: 'zabout' },
    { l: 'Services',  id: 'zservices' },
    { l: 'Suivi',     id: 'ztrack' },
    { l: 'FAQ',       id: 'zfaq' },
    { l: 'Contact',   id: 'zfoot' },
  ];
  return (
    <div className="ztop__wrap">
      <div className="zc zc--wide">
        <nav className="ztop">
          <div className="ztop__brand">
            <div className="ztop__logo">J</div>
            Jumla Shipping
          </div>
          <div className="ztop__links">
            {links.map(({ l, id }) => (
              <button key={l} className="ztop__link" onClick={() => scrollTo(id)}>{l}</button>
            ))}
          </div>
          <div className="ztop__right">
            <div style={{ display: 'inline-flex', border: '1px solid rgba(255,255,255,.2)', borderRadius: 7, padding: 2 }}>
              {['FR', 'EN'].map(l => (
                <button key={l} onClick={() => setLang(l)} style={{
                  background: lang === l ? 'white' : 'transparent',
                  color: lang === l ? 'var(--z-navy-900)' : 'rgba(255,255,255,.7)',
                  border: 'none', borderRadius: 5, padding: '4px 9px',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>{l}</button>
              ))}
            </div>
            <button className="ztop__signin" onClick={onSignin}>
              <I.Users style={{ width: 15, height: 15 }} /> Se connecter
            </button>
            <button className="zbtn zbtn--gold" onClick={onBook}>Réserver</button>
          </div>
        </nav>
      </div>
    </div>
  );
}

function ZEstimator({ onBook }) {
  const cats = PARCEL_CATEGORIES;
  const routes = ROUTES.filter(r => r.active);
  const [routeId, setRouteId] = useState(routes[0]?.id || 'r-dla-yul');
  const [lines, setLines] = useState([{ id: 1, cat: 'standard', weight: 12 }]);

  const r = getRoute(routeId) || routes[0];
  const tierFor = (w) => r.pricing.find(p => w > p.from && w <= p.to) || r.pricing[r.pricing.length - 1];
  const calcLine = (ln) => {
    const tier = tierFor(+ln.weight || 0);
    const base = Math.round((+ln.weight || 0) * tier.rate);
    const cat = cats.find(c => c.id === ln.cat) || cats[0];
    const surcharge = Math.round(base * cat.pct / 100);
    return { tier, base, cat, surcharge, total: base + surcharge };
  };
  const computed = lines.map(calcLine);
  const grandTotal = computed.reduce((a, c) => a + c.total, 0);
  const totalWeight = lines.reduce((a, l) => a + (+l.weight || 0), 0);

  const addLine = () => setLines([...lines, { id: Date.now(), cat: 'standard', weight: 5 }]);
  const removeLine = (id) => setLines(lines.length > 1 ? lines.filter(l => l.id !== id) : lines);
  const updLine = (id, k, v) => setLines(lines.map(l => l.id === id ? { ...l, [k]: v } : l));

  return (
    <div className="zest-band">
      <div className="zc zc--wide">
        <div className="zest">
          <div className="zest__head">
            <I.Calculator style={{ width: 16, height: 16, color: 'var(--z-gold-500)' }} />
            <span className="zest__title">Estimer un envoi</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--z-mut-2)' }}>
              Sans inscription · ajoutez autant d'articles que nécessaire
            </span>
          </div>

          <div className="zest__route">
            <div className="zest__f">
              <label>De</label>
              <select value={routeId} onChange={e => setRouteId(e.target.value)}>
                {routes.map(rr => <option key={rr.id} value={rr.id}>{rr.fromCity}</option>)}
              </select>
            </div>
            <I.ArrowRight style={{ width: 18, height: 18, color: 'var(--z-mut-2)', alignSelf: 'flex-end', marginBottom: 10 }} />
            <div className="zest__f">
              <label>Vers</label>
              <select value={r?.toCity}>
                {routes.map(rr => <option key={rr.id}>{rr.toCity}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ alignSelf: 'flex-end', marginBottom: 10, fontSize: 12, color: 'var(--z-mut-2)' }}>
              Transit <strong style={{ color: 'var(--z-ink)' }}>{r?.transitDays} j</strong>
              {' · '}Devise <strong style={{ color: 'var(--z-ink)' }}>{r?.currency}</strong>
            </div>
          </div>

          <div className="zest__lines">
            <div className="zest__lhead">
              <span>Catégorie</span>
              <span>Poids (kg)</span>
              <span style={{ textAlign: 'right' }}>Base</span>
              <span style={{ textAlign: 'right' }}>Supplément</span>
              <span style={{ textAlign: 'right' }}>Sous-total</span>
              <span />
            </div>
            {lines.map((ln, i) => {
              const c = computed[i];
              return (
                <div className="zest__line" key={ln.id}>
                  <div className="zest__f">
                    <select value={ln.cat} onChange={e => updLine(ln.id, 'cat', e.target.value)}>
                      {cats.map(ct => (
                        <option key={ct.id} value={ct.id}>{ct.icon} {ct.label} ({ct.pct > 0 ? '+' : ''}{ct.pct}%)</option>
                      ))}
                    </select>
                  </div>
                  <div className="zest__f">
                    <input type="number" min="0.5" step="0.5" value={ln.weight} onChange={e => updLine(ln.id, 'weight', e.target.value)} />
                  </div>
                  <div className="zest__cell mono" style={{ textAlign: 'right' }}>
                    {c.base} <span className="zest__cur">{r?.currency}</span>
                    <div className="zest__tier">{c.tier.from}–{c.tier.to} kg · {c.tier.rate}/kg</div>
                  </div>
                  <div className="zest__cell mono" style={{ textAlign: 'right', color: c.surcharge > 0 ? 'var(--z-gold-600)' : c.surcharge < 0 ? '#1F8A5B' : 'var(--z-mut-2)' }}>
                    {c.surcharge > 0 ? '+' : ''}{c.surcharge} <span className="zest__cur">{r?.currency}</span>
                    <div className="zest__tier">{c.cat.label} {c.cat.pct > 0 ? '+' : ''}{c.cat.pct}%</div>
                  </div>
                  <div className="zest__cell mono" style={{ fontWeight: 800, color: 'var(--z-ink)', textAlign: 'right' }}>
                    {c.total} <span className="zest__cur">{r?.currency}</span>
                  </div>
                  <button className="zest__del" onClick={() => removeLine(ln.id)} disabled={lines.length <= 1} title="Retirer">
                    <I.Trash style={{ width: 15, height: 15 }} />
                  </button>
                </div>
              );
            })}
            <button className="zest__add" onClick={addLine}>
              <I.Plus style={{ width: 15, height: 15 }} /> Ajouter un article
            </button>
          </div>

          <div className="zest__res">
            <div>
              <div style={{ fontSize: 12, color: 'var(--z-mut-2)', fontWeight: 600, marginBottom: 2 }}>
                Total estimé · {lines.length} article{lines.length > 1 ? 's' : ''} · {totalWeight} kg · {r?.fromIATA} → {r?.toIATA}
              </div>
              <div className="mono" style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.02em', color: 'var(--z-ink)' }}>
                {grandTotal} <span style={{ fontSize: 15, color: 'var(--z-mut-2)', fontWeight: 600 }}>{r?.currency}</span>
              </div>
            </div>
            <button className="zbtn zbtn--navy" style={{ marginLeft: 'auto' }} onClick={onBook}>
              Réserver cet envoi <I.ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ZHero({ onBook, onSignin }) {
  return (
    <>
      <ZNav onSignin={onSignin} onBook={onBook} />
      <header className="zhero">
        <img className="zhero__bg" src={IMGS.hero} alt="" />
        <div className="zhero__tint" />
        <div className="zc zc--wide">
          <div className="zhero__body">
            <span className="zeyebrow zeyebrow--light">Air · Mer · Route — Douala → Montréal</span>
            <h1 className="zhero__title" style={{ marginTop: 18 }}>
              Transport <em>sécurisé</em> sans frontières
            </h1>
            <p className="zhero__sub">
              La référence du fret international entre l'Afrique et le Canada. Réservez votre place,
              suivez chaque étape et faites vérifier le contenu à l'arrivée.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="zbtn zbtn--gold zbtn--lg" onClick={onBook}>
                Réserver un envoi <I.ArrowRight style={{ width: 18, height: 18 }} />
              </button>
              <button className="zbtn zbtn--ghost-light zbtn--lg"
                onClick={() => document.getElementById('ztrack')?.scrollIntoView({ behavior: 'smooth' })}>
                Suivre un colis
              </button>
            </div>
            <div className="zhero__chips">
              {[['5 j', 'Transit moyen'], ['12k+', 'Colis livrés'], ['98%', 'Satisfaction']].map(([n, l]) => (
                <div key={l}>
                  <div className="zhero__chip-n">{n}</div>
                  <div className="zhero__chip-l">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>
      <ZEstimator onBook={onBook} />
    </>
  );
}

function ZDonut() {
  const segs = [
    { l: 'Alimentaire', v: 28, c: '#F5A524' },
    { l: 'Vêtements',   v: 24, c: '#FCBC4F' },
    { l: 'Électronique',v: 18, c: '#2A5C86' },
    { l: 'Cosmétiques', v: 12, c: '#1D496F' },
    { l: 'Documents',   v: 9,  c: '#3E7CA8' },
    { l: 'Autres',      v: 9,  c: '#6FA3C9' },
  ];
  const total = segs.reduce((a, s) => a + s.v, 0);
  let acc = 0;
  const R = 62, r = 40;
  return (
    <div style={{ position: 'relative', width: 240, height: 240, margin: '0 auto' }}>
      <svg viewBox="-70 -70 140 140" style={{ width: 240, height: 240, transform: 'rotate(-90deg)' }}>
        {segs.map((s, i) => {
          const a0 = (acc / total) * Math.PI * 2; acc += s.v;
          const a1 = (acc / total) * Math.PI * 2;
          const large = a1 - a0 > Math.PI ? 1 : 0;
          const x0 = Math.cos(a0) * R, y0 = Math.sin(a0) * R;
          const x1 = Math.cos(a1) * R, y1 = Math.sin(a1) * R;
          const xi0 = Math.cos(a0) * r, yi0 = Math.sin(a0) * r;
          const xi1 = Math.cos(a1) * r, yi1 = Math.sin(a1) * r;
          return <path key={i} d={`M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} L ${xi1} ${yi1} A ${r} ${r} 0 ${large} 0 ${xi0} ${yi0} Z`} fill={s.c} stroke="#0E2238" strokeWidth="1.5" />;
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div className="mono" style={{ fontSize: 28, fontWeight: 800, color: 'white' }}>5 380</div>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.55)' }}>colis cette année</div>
        </div>
      </div>
    </div>
  );
}

function ZAbout() {
  const cats = [
    { l: 'Alimentaire', v: 28, c: '#F5A524' },
    { l: 'Vêtements',   v: 24, c: '#FCBC4F' },
    { l: 'Électronique',v: 18, c: '#2A5C86' },
    { l: 'Cosmétiques', v: 12, c: '#1D496F' },
    { l: 'Documents',   v: 9,  c: '#3E7CA8' },
    { l: 'Autres',      v: 9,  c: '#6FA3C9' },
  ];
  return (
    <section className="zabout" id="zabout">
      <svg className="zabout__map" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="zdot" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.4" fill="white" />
          </pattern>
        </defs>
        <rect width="1200" height="400" fill="url(#zdot)" />
      </svg>
      <div className="zc zc--wide" style={{ position: 'relative', zIndex: 1 }}>
        <span className="zeyebrow zeyebrow--light">À propos</span>
        <h2 className="zh2" style={{ color: 'white', margin: '14px 0 44px', maxWidth: 560 }}>
          Une expertise éprouvée du fret international
        </h2>
        <div className="zdonut-wrap">
          <ZDonut />
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
              <div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', fontWeight: 600 }}>Notre expérience</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,.6)' }}>au service de la diaspora</div>
              </div>
              <div className="zbignum">7<span style={{ fontSize: 28, marginLeft: 6, color: 'white' }}>ans</span></div>
            </div>
            <div className="zstat-row" style={{ marginTop: 30 }}>
              {[
                { Ic: I.Box,   n: '14 000+', l: 'colis livrés depuis 2021' },
                { Ic: I.Users, n: '2 500+',  l: 'clients fidèles' },
                { Ic: I.Route, n: '4',        l: 'routes actives' },
              ].map(({ Ic, n, l }) => (
                <div key={l}>
                  <div className="zstat__ic"><Ic style={{ width: 20, height: 20 }} /></div>
                  <div className="zstat__n">{n}</div>
                  <div className="zstat__l">{l}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 36 }}>
              <div className="zcat-bar">
                {cats.map((c, i) => <div key={i} style={{ width: c.v + '%', background: c.c }} />)}
              </div>
              <div className="zcat-legend">
                {cats.map((c, i) => (
                  <div key={i} className="zcat-item">
                    <span className="zcat-item__v">{c.v}%</span>
                    <span className="zcat-item__dot" style={{ background: c.c }} />
                    {c.l}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ZServices({ onBook }) {
  const soon = [
    { t: 'Transport maritime', img: IMGS.sea },
    { t: 'Transport routier',  img: IMGS.road },
    { t: 'Entreposage',        img: IMGS.ware },
  ];
  return (
    <section className="zsection" id="zservices">
      <div className="zc zc--wide">
        <span className="zeyebrow">Notre service</span>
        <h2 className="zh2" style={{ margin: '14px 0 50px', maxWidth: 560 }}>Le fret aérien, notre spécialité</h2>
        <div className="zsvc">
          <div>
            <div className="zsvc__num">01</div>
            <h3 className="zserif" style={{ fontSize: 32, margin: '6px 0 14px', color: 'var(--z-ink)' }}>Transport aérien</h3>
            <p className="zlead" style={{ marginBottom: 18, maxWidth: 460 }}>
              Le plus rapide et le plus sûr. Idéal pour colis urgents, denrées, électronique et petits volumes.
              Transit moyen <strong style={{ color: 'var(--z-ink)' }}>14 jours</strong> porte à porte, de Douala à Montréal.
            </p>
            <ul className="zsvc__feats">
              {[
                'Suivi en temps réel à chaque étape',
                'Vérification article par article à l\'arrivée',
                'Livraison à domicile ou retrait entrepôt',
                'Notifications WhatsApp expéditeur & destinataire',
              ].map((f, i) => (
                <li key={i}><I.Check style={{ width: 15, height: 15, color: 'var(--z-gold-500)' }} /> {f}</li>
              ))}
            </ul>
            <button className="zbtn zbtn--navy" style={{ marginTop: 24 }} onClick={onBook}>
              Réserver un envoi <I.ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
          <div className="zsvc__photo">
            <img src={IMGS.air} alt="Transport aérien" />
          </div>
        </div>
        <div className="zsoon">
          <div className="zsoon__lab">Bientôt disponible</div>
          <div className="zsoon__grid">
            {soon.map((sv, i) => (
              <div key={i} className="zsoon__card">
                <div className="zsoon__img"><img src={sv.img} alt={sv.t} /></div>
                <span className="zsoon__t">{sv.t}</span>
                <span className="zsoon__badge">À venir</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ZPillars() {
  const items = [
    { Ic: I.Activity, t: 'Force',     d: 'Partenaire maritime et aérien de confiance, reconnu pour sa fiabilité et sa transparence sur chaque envoi.' },
    { Ic: I.Lock,     t: 'Stabilité', d: 'Un modèle solide qui navigue un marché dynamique avec assurance, bâtissant la confiance par la régularité.' },
    { Ic: I.Sparkle,  t: 'Succès',    d: 'Portés par l\'innovation, nous renforçons des partenariats durables au service de la diaspora.' },
  ];
  return (
    <section className="zsection" style={{ background: 'var(--z-paper-2)' }}>
      <div className="zc zc--wide">
        <div style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto 56px' }}>
          <span className="zeyebrow" style={{ marginBottom: 0 }}>Partenaire de confiance</span>
          <h2 className="zh2" style={{ marginTop: 14 }}>Flexibilité et confiance,<br />dans chaque port</h2>
        </div>
        <div className="zpillars">
          {items.map(({ Ic, t, d }, i) => (
            <div key={i}>
              <div className="zpillar__ic"><Ic style={{ width: 26, height: 26 }} /></div>
              <div className="zpillar__t">{t}</div>
              <div className="zpillar__divider" />
              <p className="zlead" style={{ fontSize: 14.5 }}>{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ZTrust({ onBook }) {
  return (
    <section className="ztrust">
      <div className="ztrust__img">
        <img src={IMGS.worker} alt="Équipe Jumla Shipping" />
      </div>
      <div className="ztrust__txt">
        <span className="zeyebrow zeyebrow--light">Notre engagement</span>
        <h2 className="zserif" style={{ fontSize: 40, color: 'white', margin: '16px 0 16px', lineHeight: 1.1 }}>
          Chaque colis traité<br />comme s'il était le nôtre
        </h2>
        <p style={{ fontSize: 15.5, lineHeight: 1.7, color: 'rgba(255,255,255,.7)', maxWidth: 440, marginBottom: 26 }}>
          Photographié au départ, suivi en temps réel et pointé article par article à l'arrivée.
          Vous et votre destinataire êtes notifiés par WhatsApp à chaque étape.
        </p>
        <button className="zbtn zbtn--gold zbtn--lg" onClick={onBook}>
          Commencer un envoi <I.ArrowRight style={{ width: 18, height: 18 }} />
        </button>
      </div>
    </section>
  );
}

function ZTracking() {
  const [searched, setSearched] = useState(false);
  const timeline = [
    { l: 'Colis déposé à Douala',       d: '28 avr. · 10:14', s: 'done' },
    { l: 'Embarqué dans la cargaison',  d: '28 avr. · 18:30', s: 'done' },
    { l: 'En vol vers Montréal',        d: '03 mai · 22:45',  s: 'done' },
    { l: 'Arrivé à Montréal',           d: '12 mai · 08:14',  s: 'active' },
    { l: 'Livré au destinataire',       d: 'Prévu 14 mai',    s: 'todo' },
  ];
  return (
    <section className="zsection ztrack" id="ztrack">
      <div className="zc" style={{ maxWidth: 760 }}>
        <div style={{ textAlign: 'center', marginBottom: 34 }}>
          <span className="zeyebrow">Suivi de colis</span>
          <h2 className="zh2" style={{ marginTop: 14 }}>Où en est mon colis ?</h2>
          <p className="zlead" style={{ margin: '12px auto 0', maxWidth: 460 }}>
            Numéro de suivi, téléphone ou nom — sans créer de compte.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, background: 'white', border: '1px solid var(--z-line)', borderRadius: 12, padding: 8, boxShadow: '0 16px 40px -22px rgba(10,26,47,.4)' }}>
          <I.Search style={{ width: 18, height: 18, color: 'var(--z-mut-2)', alignSelf: 'center', marginLeft: 10 }} />
          <input
            placeholder="Ex : JL-26042-DL0418"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, background: 'transparent' }}
            onKeyDown={e => e.key === 'Enter' && setSearched(true)}
          />
          <button className="zbtn zbtn--navy" onClick={() => setSearched(true)}>Suivre</button>
        </div>
        {searched && (
          <div style={{ background: 'white', border: '1px solid var(--z-line)', borderRadius: 14, padding: 24, marginTop: 16, boxShadow: '0 16px 40px -24px rgba(10,26,47,.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--z-mut-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>Numéro de suivi</div>
                <div className="mono" style={{ fontSize: 20, fontWeight: 800 }}>JL-26042-DL0418</div>
              </div>
              <span style={{ background: 'var(--z-gold-500)', color: 'white', padding: '6px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 700 }}>En transit · 92%</span>
            </div>
            {timeline.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: 18, position: 'relative' }}>
                {i < timeline.length - 1 && (
                  <div style={{ position: 'absolute', left: 13, top: 28, bottom: -4, width: 2, background: t.s === 'done' ? 'var(--z-gold-500)' : 'var(--z-line)' }} />
                )}
                <div style={{
                  width: 28, height: 28, borderRadius: 999, flex: '0 0 28px', zIndex: 1,
                  background: t.s === 'done' ? 'var(--z-gold-500)' : t.s === 'active' ? 'var(--z-navy-900)' : 'white',
                  border: '2px solid ' + (t.s === 'todo' ? 'var(--z-line)' : t.s === 'active' ? 'var(--z-navy-900)' : 'var(--z-gold-500)'),
                  color: t.s === 'todo' ? 'var(--z-mut-2)' : 'white',
                  display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700,
                }}>
                  {t.s === 'done' ? <I.Check style={{ width: 13, height: 13 }} /> : i + 1}
                </div>
                <div style={{ paddingTop: 4 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: t.s === 'todo' ? 'var(--z-mut-2)' : 'var(--z-ink)' }}>{t.l}</div>
                  <div style={{ fontSize: 12, color: 'var(--z-mut-2)' }}>{t.d}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ZFAQ() {
  const faqs = [
    { q: 'Combien de temps prend une livraison ?', a: 'Le transit moyen est de 14 jours porte à porte entre Douala et Montréal. Vous recevez une estimation d\'arrivée dès la réservation, puis le suivi en temps réel à chaque étape.' },
    { q: 'Comment est calculé le prix de mon envoi ?', a: 'Le tarif dépend du poids (grille par tranche de kg) et de la catégorie du contenu, qui peut ajouter un léger supplément (ex. fragile +8%, électronique +5%). Utilisez l\'estimateur en haut de page pour un devis instantané, sans inscription.' },
    { q: 'Que se passe-t-il si un article manque à l\'arrivée ?', a: 'Chaque colis est photographié au départ et vérifié article par article à l\'arrivée. En cas d\'écart, un bordereau détaillé est généré et vous êtes notifié immédiatement par WhatsApp.' },
    { q: 'Quels types de colis puis-je envoyer ?', a: 'Vêtements, denrées alimentaires sèches, électronique, cosmétiques, documents et plus. Certaines catégories sensibles (valeur déclarée, hors gabarit) ont une tarification adaptée. Les produits interdits au transport aérien sont exclus.' },
    { q: 'Comment suivre mon colis ?', a: 'Avec votre numéro de suivi, votre téléphone ou votre nom — sans créer de compte. La timeline affiche chaque étape : dépôt, embarquement, vol, arrivée et livraison.' },
    { q: 'Comment payer et récupérer mon colis ?', a: 'Le destinataire règle à la livraison (espèces, virement Interac, virement bancaire ou Mobile Money) puis choisit la livraison à domicile ou le retrait à l\'entrepôt de Montréal.' },
  ];
  const [open, setOpen] = useState(0);
  return (
    <section className="zsection" id="zfaq" style={{ background: 'var(--z-paper-2)' }}>
      <div className="zc" style={{ maxWidth: 860 }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <span className="zeyebrow">FAQ</span>
          <h2 className="zh2" style={{ marginTop: 14 }}>Questions fréquentes</h2>
          <p className="zlead" style={{ margin: '12px auto 0', maxWidth: 480 }}>
            Tout ce qu'il faut savoir avant d'expédier. Une autre question ? Écrivez-nous sur WhatsApp.
          </p>
        </div>
        <div className="zfaq">
          {faqs.map((f, i) => (
            <div key={i} className={'zfaq__item' + (open === i ? ' is-open' : '')}>
              <button className="zfaq__q" onClick={() => setOpen(open === i ? -1 : i)}>
                <span>{f.q}</span>
                <span className="zfaq__ic">
                  {open === i ? <I.ChevronUp style={{ width: 18, height: 18 }} /> : <I.ChevronDown style={{ width: 18, height: 18 }} />}
                </span>
              </button>
              {open === i && <div className="zfaq__a">{f.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ZFooter() {
  const cols = [
    { l: 'Services',  items: ['Transport aérien', 'Maritime (à venir)', 'Routier (à venir)', 'Entreposage (à venir)'] },
    { l: 'Entreprise',items: ['À propos', 'Contact', 'Blog', 'Carrières'] },
    { l: 'Légal',     items: ['Conditions', 'Confidentialité', 'Cookies', 'FAQ'] },
  ];
  return (
    <footer className="zfoot" id="zfoot">
      <div className="zc zc--wide">
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: 48, marginBottom: 44 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
              <div className="ztop__logo">J</div>
              <span style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>Jumla Shipping</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,.55)', maxWidth: 300 }}>
              Fret aérien et maritime international entre l'Afrique et le Canada. Suivi, sécurité et confiance depuis 2021.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#25D366', fontWeight: 600 }}>
                <I.Whatsapp style={{ width: 16, height: 16 }} /> WhatsApp Douala · Montréal
              </span>
            </div>
          </div>
          {cols.map(c => (
            <div key={c.l}>
              <div className="zfoot__t">{c.l}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {c.items.map(item => <a key={item} style={{ fontSize: 14 }}>{item}</a>)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ paddingTop: 24, borderTop: '1px solid rgba(255,255,255,.1)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: 13, color: 'rgba(255,255,255,.4)' }}>
          <span>© 2026 Jumla Shipping SARL — Tous droits réservés</span>
          <span>Douala · Montréal · Bruxelles · Lagos</span>
        </div>
      </div>
    </footer>
  );
}

function ZAuth({ mode: initMode, onClose }) {
  const [mode, setMode] = useState(initMode || 'login');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', city: 'Montréal', password: '' });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="zauth-backdrop" onClick={onClose}>
      <div className="zauth" onClick={e => e.stopPropagation()}>
        <div className="zauth__side">
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 28 }}>
            <div className="ztop__logo">J</div>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>Jumla Shipping</span>
          </div>
          <h3 className="zserif" style={{ fontSize: 24, color: 'white', lineHeight: 1.2, margin: '0 0 14px' }}>
            {mode === 'login' ? 'Bon retour parmi nous' : 'Créez votre compte client'}
          </h3>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,.7)', lineHeight: 1.6, margin: 0 }}>
            {mode === 'login'
              ? 'Retrouvez vos adresses enregistrées, l\'historique de vos envois et le suivi en temps réel.'
              : 'Enregistrez vos informations une seule fois et réservez en deux clics.'}
          </p>
          <div className="zauth__perks">
            {['Infos pré-remplies à chaque envoi', 'Carnet d\'adresses destinataires', 'Suivi temps réel de tous vos colis', 'Historique & factures'].map((p, i) => (
              <div key={i} className="zauth__perk">
                <I.Check style={{ width: 15, height: 15, color: 'var(--z-gold-400)' }} /> {p}
              </div>
            ))}
          </div>
        </div>
        <div className="zauth__form">
          <button className="zauth__close" onClick={onClose}><I.Cross style={{ width: 18, height: 18 }} /></button>
          <div className="zauth__tabs">
            <button className={mode === 'login'  ? 'is-active' : ''} onClick={() => setMode('login')}>Connexion</button>
            <button className={mode === 'signup' ? 'is-active' : ''} onClick={() => setMode('signup')}>Créer un compte</button>
          </div>
          {mode === 'signup' && (
            <div className="zauth__row2">
              <div className="zauth__f"><label>Prénom</label><input value={form.firstName} onChange={e => upd('firstName', e.target.value)} placeholder="Awa" /></div>
              <div className="zauth__f"><label>Nom</label><input value={form.lastName} onChange={e => upd('lastName', e.target.value)} placeholder="Diallo" /></div>
            </div>
          )}
          <div className="zauth__f"><label>Email</label><input type="email" value={form.email} onChange={e => upd('email', e.target.value)} placeholder="vous@email.com" /></div>
          {mode === 'signup' && (
            <div className="zauth__row2">
              <div className="zauth__f"><label>Téléphone</label><input value={form.phone} onChange={e => upd('phone', e.target.value)} placeholder="+1 514 ··· ····" /></div>
              <div className="zauth__f">
                <label>Ville</label>
                <select value={form.city} onChange={e => upd('city', e.target.value)}>
                  {['Montréal','Laval','Longueuil','Brossard','Québec','Toronto','Douala'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>
          )}
          <div className="zauth__f"><label>Mot de passe</label><input type="password" value={form.password} onChange={e => upd('password', e.target.value)} placeholder="••••••••" /></div>
          {mode === 'login' && <a className="zauth__forgot">Mot de passe oublié ?</a>}
          <button className="zbtn zbtn--gold" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            {mode === 'login' ? 'Se connecter' : 'Créer mon compte'} <I.ArrowRight style={{ width: 16, height: 16 }} />
          </button>
          <div className="zauth__sep"><span>ou</span></div>
          <button className="zbtn zbtn--ghost" style={{ width: '100%', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 0 1-3.4 13l5.7 5.7A20 20 0 0 0 44 24c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8a12 12 0 0 1 20-4.7l5.7-5.7A20 20 0 0 0 6.3 14.7z"/><path fill="#4CAF50" d="M24 44a20 20 0 0 0 13.5-5.2L31.3 34a12 12 0 0 1-18-6L7 32.8A20 20 0 0 0 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 0 1-4 5.6l6 5A19 19 0 0 0 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
            Continuer avec Google Workspace
          </button>
          <p style={{ fontSize: 12, color: 'var(--z-mut-2)', textAlign: 'center', marginBottom: 0 }}>
            {mode === 'login' ? 'Pas encore de compte ? ' : 'Déjà inscrit ? '}
            <a style={{ color: 'var(--z-gold-600)', fontWeight: 700, cursor: 'pointer' }} onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
              {mode === 'login' ? 'Créez-en un' : 'Connectez-vous'}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage({ onNav }) {
  const [authMode, setAuthMode] = useState(null);
  const onBook = () => onNav ? onNav('/booking') : null;
  const onSignin = () => setAuthMode('login');

  return (
    <div className="zf">
      <ZHero onBook={onBook} onSignin={onSignin} />
      <ZAbout />
      <ZServices onBook={onBook} />
      <ZPillars />
      <ZTrust onBook={onBook} />
      <ZTracking />
      <ZFAQ />
      <ZFooter />
      {authMode && <ZAuth mode={authMode} onClose={() => setAuthMode(null)} />}
    </div>
  );
}
