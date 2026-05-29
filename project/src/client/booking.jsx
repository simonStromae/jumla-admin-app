// ============================================
// ZENDIT CLIENT — Booking wizard (5 steps + confirmation)
// ============================================

const BOOKING_STEPS = [
  { id: 'route',     l: 'Route',      d: 'Choisissez votre cargaison' },
  { id: 'items',     l: 'Articles',   d: 'Détaillez votre contenu' },
  { id: 'contacts',  l: 'Coordonnées',d: 'Expéditeur & destinataire' },
  { id: 'summary',   l: 'Résumé',     d: 'Livraison & coûts' },
  { id: 'payment',   l: 'Paiement',   d: 'Paiement sécurisé' },
];

function BookingWizard({ onClose, onComplete, user }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    routeId: 'r-dla-yul',
    campaignId: null,
    categories: [
      { id: 1, cat: 'food', weight: 5, items: [{ d: 'Sachets épices', q: 5 }, { d: 'Café Bayanga', q: 2 }] },
    ],
    accessories: { boxes: 1, smallBags: 0, mediumBags: 2, largeBags: 0 },
    sender: { firstName: '', lastName: '', phone: '', city: 'Douala' },
    recipient: { firstName: '', lastName: '', phone: '', address: '', city: 'Montréal', email: '' },
    delivery: 'home',
    payment: 'card',
    terms: false,
  });

  const upd = (k, v) => setData(d => ({ ...d, [k]: v }));
  const totalWeight = data.categories.reduce((a, c) => a + (+c.weight || 0), 0);
  const route = window.getRoute(data.routeId);
  const tier = route.pricing.find(p => totalWeight > p.from && totalWeight <= p.to) || route.pricing[route.pricing.length-1];
  const transport = Math.round(totalWeight * tier.rate);
  const accessoriesFee = data.accessories.boxes * 5 + data.accessories.smallBags * 2 + data.accessories.mediumBags * 3 + data.accessories.largeBags * 5;
  const deliveryFee = data.delivery === 'home' ? 25 : 0;
  const handling = 8;
  const subtotal = transport + accessoriesFee + deliveryFee + handling;
  const taxes = Math.round(subtotal * 0.14975);
  const total = subtotal + taxes;

  if (step === 5) return <BookingConfirmation data={data} total={total} onBack={onComplete} />;

  return (
    <div className="wiz">
      <div className="wiz__head">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', padding: '14px 0', gap: 14 }}>
            <button className="btn btn--ghost btn--sm" onClick={onClose}><I.ArrowLeft />Retour à l'accueil</button>
            <div style={{ flex: 1 }}/>
            <div className="cnav__brand" style={{ fontSize: 15 }}>
              <div className="cnav__logo" style={{ width: 26, height: 26, fontSize: 11 }}>Z</div>
              <span>Zendit</span>
            </div>
            <div style={{ flex: 1 }}/>
            <div style={{ fontSize: 12, color: 'var(--ink-400)' }}>
              Besoin d'aide ? <a style={{ color: 'var(--brand-700)', fontWeight: 600, cursor: 'pointer' }}>WhatsApp</a>
            </div>
          </div>

          <div className="wiz__progress">
            {BOOKING_STEPS.map((s, i) => (
              <React.Fragment key={s.id}>
                <div className={'wiz__step' + (i === step ? ' is-active' : i < step ? ' is-done' : '')}>
                  <div className="wiz__step-num">{i < step ? <I.Check style={{ width: 13, height: 13 }} /> : i + 1}</div>
                  <div>
                    <div className="wiz__step-label">{s.l}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>{s.d}</div>
                  </div>
                </div>
                {i < BOOKING_STEPS.length - 1 && <div className={'wiz__step-line' + (i < step ? ' is-done' : '')} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="wiz__body">
        {step === 0 && <StepRoute data={data} upd={upd} />}
        {step === 1 && <StepItems data={data} upd={upd} totalWeight={totalWeight} />}
        {step === 2 && <StepContacts data={data} upd={upd} />}
        {step === 3 && <StepSummary data={data} upd={upd} costs={{ transport, accessoriesFee, deliveryFee, handling, subtotal, taxes, total, totalWeight, tier, route }} />}
        {step === 4 && <StepPayment data={data} upd={upd} costs={{ total }} />}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, gap: 10 }}>
          <button className="btn btn--ghost" onClick={() => step > 0 ? setStep(step - 1) : onClose()}>
            <I.ArrowLeft />{step === 0 ? 'Annuler' : 'Précédent'}
          </button>
          <div style={{ fontSize: 12, color: 'var(--ink-400)', alignSelf: 'center' }}>
            Étape {step + 1} sur {BOOKING_STEPS.length}
          </div>
          <button className="btn btn--brand"
            disabled={step === 3 && !data.terms}
            style={(step === 3 && !data.terms) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            onClick={() => setStep(step + 1)}>
            {step === 4 ? <>Payer {total} CAD</> : step === 3 ? 'Passer au paiement' : 'Continuer'} <I.ArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
}

// === Step 1: Route + Campaign ===
function StepRoute({ data, upd }) {
  const routes = window.DATA.ROUTES.filter(r => r.active);
  const campaigns = [
    { id: 'cp1', code: 'DLA-YUL-MAY-01', dep: '12 mai 2026',  arr: '26 mai 2026', cap: 360, total: 2200, price: 14, status: 'open' },
    { id: 'cp2', code: 'DLA-YUL-MAY-02', dep: '26 mai 2026',  arr: '09 juin 2026', cap: 1480, total: 2200, price: 14, status: 'open' },
    { id: 'cp3', code: 'DLA-YUL-JUN-01', dep: '12 juin 2026', arr: '26 juin 2026', cap: 2100, total: 2200, price: 14, status: 'open' },
  ];
  return (
    <div className="wiz__card">
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-.01em' }}>Choisissez votre route</h2>
      <p style={{ fontSize: 13.5, color: 'var(--ink-500)', margin: '6px 0 22px' }}>Sélectionnez d'abord la route, puis la cargaison qui vous convient.</p>

      <div style={{ marginBottom: 22 }}>
        <div className="section-title">Routes disponibles</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          {routes.map(r => {
            const sel = data.routeId === r.id;
            return (
              <button key={r.id} onClick={() => upd('routeId', r.id)} style={{
                padding: 16, textAlign: 'left',
                border: '1.5px solid ' + (sel ? 'var(--brand-500)' : 'var(--border)'),
                background: sel ? 'var(--brand-50)' : 'white',
                borderRadius: 10, cursor: 'pointer',
              }}>
                <RoutePill from={r.fromIATA} to={r.toIATA} />
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 8 }}>{r.fromCity} → {r.toCity}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>
                  Transit <strong>{r.transitDays} j</strong> · dès <strong className="mono">{r.pricing[r.pricing.length-1].rate} {r.currency}/kg</strong>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="section-title">Cargaisons ouvertes <span className="section-title__count">{campaigns.length}</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {campaigns.map(c => {
            const sel = data.campaignId === c.id;
            const pct = Math.round((c.total - c.cap) / c.total * 100);
            return (
              <label key={c.id} style={{
                display: 'grid', gridTemplateColumns: '20px 1fr auto auto', gap: 16,
                padding: '14px 16px',
                border: '1.5px solid ' + (sel ? 'var(--brand-500)' : 'var(--border)'),
                background: sel ? 'var(--brand-50)' : 'white',
                borderRadius: 10, cursor: 'pointer', alignItems: 'center',
              }}>
                <input type="radio" name="cp" checked={sel} onChange={() => upd('campaignId', c.id)} style={{accentColor:'var(--brand-500)'}}/>
                <div>
                  <div className="mono" style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{c.code}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-500)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <I.Calendar style={{ width: 12, height: 12 }} />
                    Départ <strong>{c.dep}</strong> · Arrivée estimée <strong>{c.arr}</strong>
                  </div>
                </div>
                <div style={{ width: 120 }}>
                  <div style={{ fontSize: 10, color: 'var(--ink-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 3 }}>Reste</div>
                  <div className="mono" style={{ fontSize: 14, fontWeight: 700 }}>{c.cap}<span style={{ fontSize: 10.5, color: 'var(--ink-400)', fontWeight: 500 }}> kg</span></div>
                  <Progress pct={pct} kind={pct > 90 ? 'bad' : pct > 75 ? 'warn' : null} />
                </div>
                <span className="badge badge--dot badge--ok">Ouvert</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// === Step 2: Items ===
function StepItems({ data, upd, totalWeight }) {
  const CATS = [
    { id: 'food',        l: 'Alimentaire',      i: '🥫' },
    { id: 'clothing',    l: 'Vêtements',        i: '👕' },
    { id: 'cosmetics',   l: 'Cosmétiques',      i: '💄' },
    { id: 'electronics', l: 'Électronique',     i: '📱' },
    { id: 'medicine',    l: 'Médecine trad.',   i: '🌿' },
    { id: 'beverages',   l: 'Boissons',         i: '🍷' },
    { id: 'documents',   l: 'Documents',        i: '📄' },
    { id: 'other',       l: 'Autres',           i: '📦' },
  ];

  const updCat = (id, k, v) => upd('categories', data.categories.map(c => c.id === id ? { ...c, [k]: v } : c));
  const updItem = (catId, idx, k, v) => {
    upd('categories', data.categories.map(c => c.id !== catId ? c : {
      ...c, items: c.items.map((it, i) => i === idx ? { ...it, [k]: v } : it)
    }));
  };
  const addItem = (catId) => upd('categories', data.categories.map(c => c.id !== catId ? c : { ...c, items: [...c.items, { d: '', q: 1 }] }));
  const removeItem = (catId, idx) => upd('categories', data.categories.map(c => c.id !== catId ? c : { ...c, items: c.items.filter((_, i) => i !== idx) }));
  const addCat = () => {
    const nextId = (data.categories[data.categories.length-1]?.id || 0) + 1;
    upd('categories', [...data.categories, { id: nextId, cat: 'clothing', weight: 0, items: [{ d: '', q: 1 }] }]);
  };
  const removeCat = (id) => upd('categories', data.categories.filter(c => c.id !== id));

  const reserved = 25;
  const weightColor = totalWeight > reserved ? 'var(--bad-600)' : totalWeight > reserved * 0.85 ? 'var(--warn-700)' : 'var(--ok-700)';

  const updAcc = (k, v) => upd('accessories', { ...data.accessories, [k]: v });

  return (
    <div>
      <div className="wiz__card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-.01em' }}>Vos articles</h2>
          <div style={{ background: totalWeight > reserved ? 'var(--bad-50)' : totalWeight > reserved * 0.85 ? 'var(--warn-50)' : 'var(--ok-50)', padding: '8px 14px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 8 }}>
            <I.Scale style={{ width: 14, height: 14, color: weightColor }} />
            <span style={{ fontSize: 11.5, color: weightColor, fontWeight: 600 }}>Total</span>
            <span className="mono" style={{ fontSize: 18, fontWeight: 800, color: weightColor }}>{totalWeight} kg</span>
          </div>
        </div>
        <p style={{ fontSize: 13.5, color: 'var(--ink-500)', margin: '0 0 22px' }}>Listez vos articles par catégorie. Cela permet de calculer le tarif juste et de générer le bordereau.</p>

        {data.categories.map(c => {
          const meta = CATS.find(cc => cc.id === c.cat);
          return (
            <div key={c.id} className="card" style={{ padding: 14, marginBottom: 10, background: 'var(--bg-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <select className="select input--sm" style={{ width: 180 }} value={c.cat} onChange={e => updCat(c.id, 'cat', e.target.value)}>
                  {CATS.map(cc => <option key={cc.id} value={cc.id}>{cc.i} {cc.l}</option>)}
                </select>
                <div style={{ position: 'relative', width: 110 }}>
                  <input className="input input--sm mono" type="number" min="0" step="0.5" value={c.weight} onChange={e => updCat(c.id, 'weight', +e.target.value)} style={{ paddingRight: 26, textAlign: 'right' }} />
                  <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--ink-400)' }}>kg</span>
                </div>
                <div style={{ flex: 1 }}/>
                <button className="icon-btn" onClick={() => removeCat(c.id)} disabled={data.categories.length <= 1}>
                  <I.Trash style={{ width: 14, height: 14 }} />
                </button>
              </div>

              {c.items.map((it, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 28px', gap: 6, marginBottom: 6 }}>
                  <input className="input input--sm" placeholder="Description de l'article" value={it.d} onChange={e => updItem(c.id, idx, 'd', e.target.value)} />
                  <input className="input input--sm mono" type="number" min="1" placeholder="Qté" value={it.q} onChange={e => updItem(c.id, idx, 'q', +e.target.value)} style={{ textAlign: 'center' }} />
                  <button className="icon-btn" onClick={() => removeItem(c.id, idx)} disabled={c.items.length <= 1}>
                    <I.Cross style={{ width: 12, height: 12 }} />
                  </button>
                </div>
              ))}
              <button className="btn btn--ghost btn--sm" onClick={() => addItem(c.id)}><I.Plus />Ajouter un article</button>
            </div>
          );
        })}

        <button className="btn btn--brand btn--sm" onClick={addCat}><I.Plus />Ajouter une catégorie</button>
      </div>

      <div className="wiz__card">
        <div className="section-title" style={{ marginBottom: 12 }}>Emballage <span style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 500, marginLeft: 6 }}>Optionnel</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            ['Cartons',     'boxes',      '📦', 5],
            ['Petits sacs', 'smallBags',  '🛍', 2],
            ['Sacs moyens', 'mediumBags', '🛍', 3],
            ['Grands sacs', 'largeBags',  '🛍', 5],
          ].map(([l, k, icon, price]) => (
            <div key={k} style={{ padding: 12, background: 'var(--bg-soft)', borderRadius: 10 }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 2 }}>{l}</div>
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-400)', marginBottom: 8 }}>{price} CAD / unité</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button className="icon-btn" style={{ width: 26, height: 26, background: 'white' }} onClick={() => updAcc(k, Math.max(0, data.accessories[k] - 1))}>−</button>
                <input className="input input--sm mono" type="number" value={data.accessories[k]} onChange={e => updAcc(k, +e.target.value)} style={{ textAlign: 'center', width: 50 }}/>
                <button className="icon-btn" style={{ width: 26, height: 26, background: 'white' }} onClick={() => updAcc(k, data.accessories[k] + 1)}>+</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// === Step 3: Contacts ===
function StepContacts({ data, upd }) {
  const updSender = (k, v) => upd('sender', { ...data.sender, [k]: v });
  const updRecip = (k, v) => upd('recipient', { ...data.recipient, [k]: v });
  return (
    <div className="wiz__card">
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-.01em' }}>Coordonnées</h2>
      <p style={{ fontSize: 13.5, color: 'var(--ink-500)', margin: '6px 0 22px' }}>Renseignez l'expéditeur (Douala) et le destinataire (Canada).</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        {/* Sender */}
        <div style={{ padding: 18, border: '1px solid var(--brand-200)', background: 'var(--brand-50)', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <I.Pin style={{ color: 'var(--brand-700)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-700)' }}>EXPÉDITEUR</span>
            <span style={{ fontSize: 11, color: 'var(--brand-600)' }}>· Douala, Cameroun</span>
          </div>
          <div className="field-row field-row--2">
            <div className="field"><label className="label">Prénom</label><input className="input" value={data.sender.firstName} onChange={e => updSender('firstName', e.target.value)} placeholder="Aïcha"/></div>
            <div className="field"><label className="label">Nom</label><input className="input" value={data.sender.lastName} onChange={e => updSender('lastName', e.target.value)} placeholder="Mbarga"/></div>
          </div>
          <div className="field"><label className="label">Téléphone</label><input className="input mono" value={data.sender.phone} onChange={e => updSender('phone', e.target.value)} placeholder="+237 6** ** ** **"/></div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Quartier / Ville</label>
            <input className="input" value={data.sender.city} onChange={e => updSender('city', e.target.value)} placeholder="Akwa, Douala"/>
          </div>
        </div>

        {/* Recipient */}
        <div style={{ padding: 18, border: '1px solid var(--info-100)', background: 'var(--info-50)', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <I.Pin style={{ color: 'var(--info-700)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--info-700)' }}>DESTINATAIRE</span>
            <span style={{ fontSize: 11, color: 'var(--info-600)' }}>· Canada</span>
          </div>
          <div className="field-row field-row--2">
            <div className="field"><label className="label">Prénom</label><input className="input" value={data.recipient.firstName} onChange={e => updRecip('firstName', e.target.value)} placeholder="Marie"/></div>
            <div className="field"><label className="label">Nom</label><input className="input" value={data.recipient.lastName} onChange={e => updRecip('lastName', e.target.value)} placeholder="Lefèvre"/></div>
          </div>
          <div className="field"><label className="label">Téléphone</label><input className="input mono" value={data.recipient.phone} onChange={e => updRecip('phone', e.target.value)} placeholder="+1 514 *** ****"/></div>
          <div className="field"><label className="label">Email <span className="opt">/ pour le reçu</span></label><input className="input" type="email" value={data.recipient.email} onChange={e => updRecip('email', e.target.value)} placeholder="marie@example.com"/></div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Adresse complète</label>
            <input className="input" value={data.recipient.address} onChange={e => updRecip('address', e.target.value)} placeholder="N°, rue, ville, code postal"/>
            <div className="hint">Précisez aussi appartement si applicable. Code postal Canada (ex: H2X 3K2).</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// === Step 4: Summary ===
function StepSummary({ data, upd, costs }) {
  const { transport, accessoriesFee, deliveryFee, handling, subtotal, taxes, total, totalWeight, route } = costs;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18 }}>
      <div className="wiz__card">
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-.01em' }}>Vérifiez votre réservation</h2>
        <p style={{ fontSize: 13.5, color: 'var(--ink-500)', margin: '6px 0 22px' }}>Tout est en ordre ? Choisissez le mode de livraison et acceptez les conditions.</p>

        <SummaryBlock title="Cargaison & route" content={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <RoutePill from={route.fromIATA} to={route.toIATA} />
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>{route.fromCity} → {route.toCity}</span>
            <span className="mono" style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--ink-500)' }}>DLA-YUL-MAY-01 · 12 mai 2026</span>
          </div>
        }/>

        <SummaryBlock title={`Contenu · ${totalWeight} kg`} content={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.categories.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span>{c.cat} · <span style={{color:'var(--ink-500)'}}>{c.items.length} article{c.items.length>1?'s':''}</span></span>
                <span className="mono" style={{ fontWeight: 600 }}>{c.weight} kg</span>
              </div>
            ))}
          </div>
        }/>

        <SummaryBlock title="Expéditeur & destinataire" content={
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 600, textTransform: 'uppercase' }}>Expéditeur</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{data.sender.firstName || '—'} {data.sender.lastName}</div>
              <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>{data.sender.phone || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 600, textTransform: 'uppercase' }}>Destinataire</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{data.recipient.firstName || '—'} {data.recipient.lastName}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>{data.recipient.address || '—'}</div>
            </div>
          </div>
        }/>

        <div className="section-title" style={{ marginTop: 16 }}>Mode de livraison</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
          {[
            { id: 'home', i: I.Truck, l: 'Livraison à domicile', d: 'Région du grand Montréal', extra: '+25 CAD' },
            { id: 'pickup', i: I.Warehouse, l: 'Retrait à l\'entrepôt', d: '5500 Pl. de la Savane, Lachine', extra: 'Gratuit' },
          ].map(opt => {
            const sel = data.delivery === opt.id;
            const Ic = opt.i;
            return (
              <label key={opt.id} onClick={() => upd('delivery', opt.id)} style={{
                padding: 14, border: '1.5px solid ' + (sel ? 'var(--brand-500)' : 'var(--border)'),
                background: sel ? 'var(--brand-50)' : 'white',
                borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <input type="radio" checked={sel} readOnly style={{accentColor:'var(--brand-500)'}}/>
                <Ic style={{ color: sel ? 'var(--brand-600)' : 'var(--ink-500)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{opt.l}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-500)' }}>{opt.d}</div>
                </div>
                <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: sel ? 'var(--brand-700)' : 'var(--ink-600)' }}>{opt.extra}</span>
              </label>
            );
          })}
        </div>

        <div style={{ padding: 14, background: 'var(--bg-soft)', borderRadius: 10, fontSize: 12, color: 'var(--ink-600)', lineHeight: 1.6, maxHeight: 100, overflowY: 'auto', marginBottom: 12 }}>
          <strong>Conditions générales de service.</strong> Zendit s'engage à acheminer votre colis dans les délais annoncés sous réserve des aléas aériens et douaniers.
          Tout dépassement de poids constaté à l'arrivée est facturé au tarif en vigueur (22 CAD/kg). Les articles interdits par la douane canadienne ne sont pas pris en charge.
          Le destinataire doit présenter une pièce d'identité au retrait. Voir <a style={{color:'var(--brand-700)', fontWeight:600}}>conditions complètes</a>.
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={data.terms} onChange={() => upd('terms', !data.terms)} style={{accentColor:'var(--brand-500)'}}/>
          <span>J'ai lu et j'accepte les <a style={{ color: 'var(--brand-700)', fontWeight: 600 }}>conditions générales de service</a></span>
        </label>
      </div>

      <div className="wiz__card" style={{ position: 'sticky', top: 156, alignSelf: 'start' }}>
        <div className="section-title" style={{ marginBottom: 12 }}>Détail du tarif</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
          <CostLine l={`Transport ${totalWeight} kg`} v={transport} />
          <CostLine l="Emballage" v={accessoriesFee} />
          <CostLine l="Manutention" v={handling} />
          {deliveryFee > 0 && <CostLine l="Livraison à domicile" v={deliveryFee} />}
          <div style={{ borderTop: '1px solid var(--border-soft)', margin: '6px 0', paddingTop: 6 }}>
            <CostLine l="Sous-total" v={subtotal} bold />
            <CostLine l="Taxes (TPS+TVQ 14,975%)" v={taxes} sub />
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Total dû</span>
            <span className="mono" style={{ fontSize: 26, fontWeight: 800 }}>{total} <span style={{ fontSize: 13, color: 'var(--ink-400)' }}>CAD</span></span>
          </div>
        </div>
        <div style={{ marginTop: 14, padding: 10, background: 'var(--ok-50)', borderRadius: 8, fontSize: 11.5, color: 'var(--ok-700)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <I.Lock style={{ width: 14, height: 14 }} /> Paiement 100% sécurisé via Stripe
        </div>
      </div>
    </div>
  );
}

function SummaryBlock({ title, content }) {
  return (
    <div style={{ padding: 14, border: '1px solid var(--border-soft)', borderRadius: 10, marginBottom: 10, background: 'white' }}>
      <div style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>{title}</div>
      {content}
    </div>
  );
}

function CostLine({ l, v, bold, sub }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', color: sub ? 'var(--ink-500)' : 'var(--ink-700)' }}>
      <span style={{ fontWeight: bold ? 700 : 500, fontSize: sub ? 11.5 : 13 }}>{l}</span>
      <span className="mono" style={{ fontWeight: bold ? 700 : 600, fontSize: sub ? 11.5 : 13 }}>{v} <span style={{ color: 'var(--ink-400)', fontWeight: 500, fontSize: 11 }}>CAD</span></span>
    </div>
  );
}

// === Step 5: Payment ===
function StepPayment({ data, upd, costs }) {
  const [method, setMethod] = useState('card');
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
      <div className="wiz__card">
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-.01em' }}>Paiement sécurisé</h2>
        <p style={{ fontSize: 13.5, color: 'var(--ink-500)', margin: '6px 0 22px' }}>Carte bancaire ou Interac e-Transfer. Reçu instantané par email et WhatsApp.</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {[
            { id: 'card', l: 'Carte de crédit / débit', i: '💳' },
            { id: 'interac', l: 'Interac e-Transfer', i: '🇨🇦' },
          ].map(m => (
            <button key={m.id} onClick={() => setMethod(m.id)} style={{
              padding: '12px 16px',
              fontSize: 13, fontWeight: 600,
              background: 'transparent',
              color: method === m.id ? 'var(--brand-700)' : 'var(--ink-500)',
              border: 'none',
              borderBottom: '2px solid ' + (method === m.id ? 'var(--brand-500)' : 'transparent'),
              cursor: 'pointer', marginBottom: -1,
            }}>{m.i} {m.l}</button>
          ))}
        </div>

        {method === 'card' && (
          <div>
            <div className="field"><label className="label">Nom sur la carte</label><input className="input" placeholder="Comme inscrit sur la carte"/></div>
            <div className="field">
              <label className="label">Numéro de carte</label>
              <div style={{ position: 'relative' }}>
                <input className="input mono" placeholder="•••• •••• •••• ••••" />
                <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 4 }}>
                  <span style={{ width: 28, height: 18, background: 'linear-gradient(135deg, #1A1F71, #4263EB)', borderRadius: 3, color: 'white', fontSize: 8, fontWeight: 800, display: 'grid', placeItems: 'center' }}>VISA</span>
                  <span style={{ width: 28, height: 18, background: 'linear-gradient(135deg, #EB001B, #F79E1B)', borderRadius: 3 }}/>
                </div>
              </div>
            </div>
            <div className="field-row field-row--2">
              <div className="field"><label className="label">Expiration</label><input className="input mono" placeholder="MM / AA"/></div>
              <div className="field"><label className="label">CVC</label><input className="input mono" placeholder="•••"/></div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--ink-600)', marginTop: 8 }}>
              <input type="checkbox" defaultChecked style={{accentColor:'var(--brand-500)'}}/>
              Enregistrer cette carte pour mes prochains envois
            </label>
          </div>
        )}

        {method === 'interac' && (
          <div style={{ padding: 16, background: 'var(--bg-soft)', borderRadius: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Envoyez un Interac e-Transfer</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div>1. Destinataire : <span className="mono" style={{ background: 'white', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>paiements@zendit.cargo</span></div>
              <div>2. Montant : <span className="mono" style={{ background: 'white', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>{costs.total} CAD</span></div>
              <div>3. Référence : <span className="mono" style={{ background: 'white', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>ZD-26042-CL0418</span></div>
              <div>4. Mot de passe : auto-dépôt (aucun requis)</div>
            </div>
            <div style={{ marginTop: 14, padding: 10, background: 'var(--warn-50)', border: '1px solid var(--warn-100)', borderRadius: 8, fontSize: 12, color: 'var(--warn-700)' }}>
              ⚠ Votre place sera réservée pendant 24 h en attente du paiement. Au-delà, elle sera libérée.
            </div>
          </div>
        )}

        <div style={{ marginTop: 14, padding: 10, background: 'var(--ok-50)', border: '1px solid var(--ok-100)', borderRadius: 8, fontSize: 12, color: 'var(--ok-700)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <I.Lock style={{ width: 14, height: 14 }} />
          <span>Chiffré SSL 256-bit · PCI-DSS · données jamais stockées sur nos serveurs</span>
        </div>
      </div>

      <div className="wiz__card" style={{ position: 'sticky', top: 156, alignSelf: 'start' }}>
        <div className="section-title" style={{ marginBottom: 12 }}>Récapitulatif</div>
        <div style={{ background: 'var(--bg-soft)', padding: 14, borderRadius: 10, marginBottom: 14 }}>
          <div className="mono" style={{ fontSize: 13, fontWeight: 700 }}>DLA-YUL-MAY-01</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-500)', marginTop: 2 }}>Douala → Montréal · 12 mai 2026</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '14px 0', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Total à payer</span>
          <span className="mono" style={{ fontSize: 28, fontWeight: 800 }}>{costs.total} <span style={{ fontSize: 13, color: 'var(--ink-400)' }}>CAD</span></span>
        </div>
      </div>
    </div>
  );
}

// === Confirmation ===
function BookingConfirmation({ data, total, onBack }) {
  return (
    <div className="wiz">
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 28px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 999,
            background: 'linear-gradient(135deg, var(--ok-500), var(--ok-600))',
            display: 'inline-grid', placeItems: 'center',
            color: 'white', marginBottom: 18,
            boxShadow: '0 12px 32px -8px rgba(16, 185, 129, .4)',
          }}>
            <I.Check style={{ width: 36, height: 36 }} />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-.02em', margin: 0 }}>Réservation confirmée !</h1>
          <p style={{ fontSize: 15, color: 'var(--ink-500)', marginTop: 10, marginBottom: 0 }}>
            Merci. Votre colis est réservé pour la prochaine cargaison.
          </p>
        </div>

        <div className="wiz__card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 28, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>
              Numéro de suivi
            </div>
            <div className="mono" style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.01em', marginBottom: 16 }}>
              ZD-26042-CL0418 <button className="icon-btn" style={{ verticalAlign: 'middle', marginLeft: 6 }} title="Copier"><I.Copy /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Cargaison</div>
                <div className="mono" style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>DLA-YUL-MAY-01</div>
                <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>Départ 12 mai 2026</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Destinataire</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{data.recipient.firstName || 'Client'} {data.recipient.lastName}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>{data.recipient.city}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Total payé</div>
                <div className="mono" style={{ fontSize: 16, fontWeight: 800, color: 'var(--ok-700)', marginTop: 2 }}>{total} CAD</div>
                <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>Reçu envoyé par email</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Statut</div>
                <div style={{ marginTop: 4 }}><span className="badge badge--info badge--dot">Réservé</span></div>
              </div>
            </div>
          </div>

          <div className="qr"/>
        </div>

        <div style={{ display: 'flex', gap: 10, padding: 14, background: 'var(--ok-50)', border: '1px solid var(--ok-100)', borderRadius: 10, marginTop: 16 }}>
          <I.Whatsapp style={{ flex: '0 0 18px', color: 'var(--ok-600)', marginTop: 1 }} />
          <div style={{ fontSize: 13, color: 'var(--ok-700)' }}>
            <strong>Confirmation envoyée.</strong> Vous et votre destinataire recevrez un message WhatsApp à chaque étape : embarquement, vol, arrivée, livraison.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button className="btn btn--ghost" style={{ flex: 1, justifyContent: 'center' }}><I.Download />Télécharger l'étiquette</button>
          <button className="btn btn--soft" style={{ flex: 1, justifyContent: 'center' }}><I.Activity />Suivre mon colis</button>
          <button className="btn btn--brand" style={{ flex: 1, justifyContent: 'center' }} onClick={onBack}>Faire un autre envoi <I.ArrowRight /></button>
        </div>
      </div>
    </div>
  );
}

window.BookingWizard = BookingWizard;
