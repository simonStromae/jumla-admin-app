// ============================================
// ZENDIT — Modal: Nouvelle cargaison (Wizard)
// ============================================

function NewCampaignWizard({ onClose, onCreated, mode = 'create', initial }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(() => ({
    routeId: initial?.routeId || 'r-dla-yul',
    code: initial?.code || 'DLA-YUL-MAY-01',
    depDate: initial?.depDate || '2026-05-12',
    arrDate: initial?.arrDate || '2026-05-26',
    capacityMax: initial?.capacityMax || 2200,
    capacityReserved: initial?.capacityReserved || 1840,
    currency: initial?.currency || 'CAD',
    pricing: initial?.pricing || [
      { from: 0, to: 5,    rate: 18 },
      { from: 5, to: 10,   rate: 16 },
      { from: 10, to: 25,  rate: 14 },
      { from: 25, to: 50,  rate: 12 },
      { from: 50, to: 100, rate: 10 },
    ],
    overrunRate: initial?.overrunRate || 22,
    deliveryFee: initial?.deliveryFee || 25,
    handlingFee: initial?.handlingFee || 8,
    internalTransport: initial?.internalTransport || 4200,
    internalCustoms: initial?.internalCustoms || 1800,
    internalWarehouse: initial?.internalWarehouse || 950,
    agentOrigin: initial?.agentOrigin || 'ag1',
    agentDest: initial?.agentDest || 'ag2',
    teamMembers: initial?.teamMembers || ['ag1','ag2','ag5'],
    notes: initial?.notes || '',
  }));

  const steps = [
    { id: 'route',   label: 'Route', sub: 'Trajet & dates' },
    { id: 'capacity',label: 'Capacité', sub: 'Volumes' },
    { id: 'pricing', label: 'Tarifs', sub: 'Grille & frais' },
    { id: 'costs',   label: 'Coûts', sub: 'Internes' },
    { id: 'team',    label: 'Équipe', sub: 'Agents' },
    { id: 'review',  label: 'Résumé', sub: 'Création' },
  ];

  const upd = (k, v) => setData(d => ({ ...d, [k]: v }));
  const route = window.getRoute(data.routeId);

  return (
    <Modal width={920} onClose={onClose} ariaLabel="Wizard nouvelle cargaison"
      title={
        <span>{mode==='edit' ? 'Modifier la cargaison' : 'Nouvelle cargaison'}
          <span style={{color:'var(--ink-400)', fontWeight:400, fontSize:'.85em', marginLeft:6}}>/ {mode==='edit'?'Edit shipment':'New shipment'}</span>
        </span>
      }
      sub={mode==='edit' ? data.code : 'Configurez votre cargaison étape par étape'}
      footer={
        <>
          {step > 0 && <button className="btn btn--ghost" onClick={() => setStep(step-1)}><I.ArrowLeft />Précédent</button>}
          <div className="spacer" style={{flex:1}}/>
          <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>Étape {step+1} / {steps.length}</span>
          {step < steps.length-1
            ? <button className="btn btn--brand" onClick={() => setStep(step+1)}>Suivant<I.ArrowRight /></button>
            : <button className="btn btn--brand" onClick={onCreated}><I.Check />{mode==='edit'?'Enregistrer':'Créer la cargaison'}</button>}
        </>
      }>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 0 }}>
        {steps.map((s, i) => (
          <React.Fragment key={s.id}>
            <div onClick={() => setStep(i)} style={{
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              opacity: i > step ? 0.5 : 1,
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: 999,
                background: i < step ? 'var(--ok-500)' : i === step ? 'var(--brand-500)' : 'var(--bg-soft)',
                color: i <= step ? 'white' : 'var(--ink-400)',
                border: i <= step ? 'none' : '1px solid var(--border)',
                display: 'grid', placeItems: 'center',
                fontSize: 11, fontWeight: 700,
                flex: '0 0 24px',
              }}>
                {i < step ? <I.Check style={{width:13, height:13}}/> : i+1}
              </div>
              <div style={{ display:'flex', flexDirection:'column', lineHeight:1.1 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: i <= step ? 'var(--ink-800)' : 'var(--ink-400)' }}>{s.label}</span>
                <span style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>{s.sub}</span>
              </div>
            </div>
            {i < steps.length-1 && <div style={{ flex: 1, height: 2, background: i < step ? 'var(--ok-500)' : 'var(--border)', margin: '0 12px', borderRadius: 999 }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Steps */}
      {step === 0 && <StepRoute data={data} upd={upd} />}
      {step === 1 && <StepCapacity data={data} upd={upd} route={route} />}
      {step === 2 && <StepPricing data={data} upd={upd} route={route} />}
      {step === 3 && <StepCosts data={data} upd={upd} />}
      {step === 4 && <StepTeam data={data} upd={upd} />}
      {step === 5 && <StepReview data={data} route={route} />}
    </Modal>
  );
}

function StepRoute({ data, upd }) {
  const routes = window.DATA.ROUTES.filter(r => r.active);
  return (
    <div>
      <h4 style={{margin:'0 0 6px', fontSize:15, fontWeight:700, letterSpacing:'-.01em'}}>Quelle route empruntez-vous ?</h4>
      <p style={{margin:'0 0 18px', color:'var(--ink-400)', fontSize:13}}>
        La cargaison héritera des paramètres par défaut de la route (grille tarifaire, entrepôts, agents). Vous pourrez les ajuster.
      </p>

      <div style={{ display: 'grid', gap: 10, marginBottom: 22 }}>
        {routes.map(r => (
          <label key={r.id} style={{
            display: 'grid',
            gridTemplateColumns: '20px 1fr auto',
            gap: 14,
            padding: '14px 16px',
            border: '1px solid '+(data.routeId === r.id ? 'var(--brand-500)' : 'var(--border)'),
            borderRadius: 10,
            background: data.routeId === r.id ? 'var(--brand-50)' : 'white',
            cursor: 'pointer',
            transition: 'all .15s',
            alignItems: 'center',
          }}>
            <input type="radio" name="route" checked={data.routeId === r.id} onChange={() => upd('routeId', r.id)} style={{accentColor:'var(--brand-500)'}} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <RoutePill from={r.fromIATA} to={r.toIATA} />
                <span style={{ fontWeight: 700, fontSize: 13.5 }}>{r.fromCity} → {r.toCity}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>
                Transit moyen <strong>{r.transitDays} j</strong> · Devise <strong>{r.currency}</strong> · Entrepôt départ <strong>{r.warehouseFrom}</strong>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 11.5, color: 'var(--ink-400)' }}>
              <div className="mono" style={{ fontWeight: 600 }}>{r.cargosCount} cargaisons</div>
              <div>{r.parcelsTotal.toLocaleString('fr')} colis livrés</div>
            </div>
          </label>
        ))}
      </div>

      <div className="field-row field-row--2">
        <div className="field">
          <label className="label">Code cargaison <span className="opt">/ Shipment code</span></label>
          <input className="input mono" value={data.code} onChange={e => upd('code', e.target.value)} />
          <div className="hint">Auto-généré. Format : <code style={{background:'var(--bg-soft)', padding:'1px 5px', borderRadius:3}}>ROUTE-MOIS-NN</code></div>
        </div>
        <div className="field">
          <label className="label">Devise <span className="opt">/ Currency</span></label>
          <select className="select" value={data.currency} onChange={e => upd('currency', e.target.value)}>
            <option value="CAD">CAD — Dollar canadien</option>
            <option value="EUR">EUR — Euro</option>
            <option value="USD">USD — Dollar US</option>
            <option value="XAF">XAF — Franc CFA</option>
          </select>
        </div>
      </div>

      <div className="field-row field-row--2">
        <div className="field">
          <label className="label">Date de départ <span className="opt">/ Departure</span></label>
          <input className="input" type="date" value={data.depDate} onChange={e => upd('depDate', e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Date d'arrivée estimée <span className="opt">/ ETA</span></label>
          <input className="input" type="date" value={data.arrDate} onChange={e => upd('arrDate', e.target.value)} />
          <div className="hint">Calculé automatiquement : départ + {window.getRoute(data.routeId)?.transitDays} jours.</div>
        </div>
      </div>
    </div>
  );
}

function StepCapacity({ data, upd, route }) {
  const pct = Math.round(data.capacityReserved / data.capacityMax * 100);
  return (
    <div>
      <h4 style={{margin:'0 0 6px', fontSize:15, fontWeight:700, letterSpacing:'-.01em'}}>Capacité de la cargaison</h4>
      <p style={{margin:'0 0 18px', color:'var(--ink-400)', fontSize:13}}>
        Définissez la capacité maximale et le volume déjà réservé par vos clients.
      </p>

      <div className="field-row field-row--2">
        <div className="field">
          <label className="label">Capacité maximale (kg) <span className="opt">/ Max capacity</span></label>
          <div style={{ position: 'relative' }}>
            <input className="input mono" type="number" value={data.capacityMax} onChange={e => upd('capacityMax', +e.target.value)} style={{ paddingRight: 36 }} />
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)', fontSize: 12 }}>kg</span>
          </div>
          <div className="hint">Limite physique de l'envoi.</div>
        </div>
        <div className="field">
          <label className="label">Capacité réservée (kg) <span className="opt">/ Reserved</span></label>
          <div style={{ position: 'relative' }}>
            <input className="input mono" type="number" value={data.capacityReserved} onChange={e => upd('capacityReserved', +e.target.value)} style={{ paddingRight: 36 }} />
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)', fontSize: 12 }}>kg</span>
          </div>
          <div className="hint">Somme des poids réservés à ce jour.</div>
        </div>
      </div>

      {/* Visual gauge */}
      <div style={{ marginTop: 8, padding: 16, background: 'var(--bg-soft)', border: '1px solid var(--border-soft)', borderRadius: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>Taux de remplissage</span>
          <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: pct > 90 ? 'var(--bad-600)' : pct > 75 ? 'var(--warn-700)' : 'var(--ok-600)' }}>
            {pct}%
          </span>
        </div>
        <div style={{ height: 12, background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 999, overflow: 'hidden', position: 'relative' }}>
          <div style={{
            height: '100%',
            width: pct+'%',
            background: pct > 90 ? 'var(--bad-500)' : pct > 75 ? 'var(--warn-500)' : 'var(--ok-500)',
            borderRadius: 999,
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11.5, color: 'var(--ink-500)' }}>
          <span><strong className="mono">{data.capacityReserved.toLocaleString('fr')} kg</strong> réservés</span>
          <span><strong className="mono">{(data.capacityMax - data.capacityReserved).toLocaleString('fr')} kg</strong> disponibles</span>
        </div>
      </div>

      {/* Info note */}
      <div style={{ display: 'flex', gap: 10, padding: 12, marginTop: 16, background: 'var(--info-50)', border: '1px solid var(--info-100)', borderRadius: 8 }}>
        <I.Info style={{ flex: '0 0 16px', color: 'var(--info-600)', marginTop: 1 }} />
        <div style={{ fontSize: 12.5, color: 'var(--ink-700)', lineHeight: 1.5 }}>
          Si le poids réel à l'embarquement dépasse la capacité réservée, le surplus sera facturé au tarif de dépassement défini à l'étape suivante.
        </div>
      </div>
    </div>
  );
}

function StepPricing({ data, upd, route }) {
  const updRow = (i, k, v) => {
    const next = [...data.pricing];
    next[i] = { ...next[i], [k]: v };
    upd('pricing', next);
  };
  const addRow = () => {
    const last = data.pricing[data.pricing.length-1];
    upd('pricing', [...data.pricing, { from: last.to, to: last.to + 10, rate: last.rate - 1 }]);
  };
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <div>
          <h4 style={{margin:'0 0 6px', fontSize:15, fontWeight:700, letterSpacing:'-.01em'}}>Grille tarifaire & frais</h4>
          <p style={{margin:0, color:'var(--ink-400)', fontSize:13}}>
            Hérité de la route <strong>{route.code}</strong>. Modifiable pour cette cargaison.
          </p>
        </div>
        <button className="btn btn--ghost btn--sm"><I.Refresh />Réinitialiser route</button>
      </div>

      <div className="section-title">
        Grille par tranche de poids <span className="section-title__count">{data.pricing.length}</span>
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 18 }}>
        <table className="tbl tbl--compact" style={{borderRadius:0}}>
          <thead>
            <tr>
              <th style={{borderRadius:0}}>De (kg)</th>
              <th>À (kg)</th>
              <th>Tarif / kg ({data.currency})</th>
              <th style={{borderRadius:0, width:30}}></th>
            </tr>
          </thead>
          <tbody>
            {data.pricing.map((row, i) => (
              <tr key={i}>
                <td><input className="input input--sm mono" type="number" value={row.from} onChange={e => updRow(i, 'from', +e.target.value)}/></td>
                <td><input className="input input--sm mono" type="number" value={row.to} onChange={e => updRow(i, 'to', +e.target.value)}/></td>
                <td><input className="input input--sm mono" type="number" value={row.rate} onChange={e => updRow(i, 'rate', +e.target.value)}/></td>
                <td><button className="icon-btn"><I.Trash style={{width:14, height:14}}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn btn--ghost btn--sm" onClick={addRow}><I.Plus />Ajouter une tranche</button>

      <div className="divider"></div>

      <div className="field-row field-row--3">
        <div className="field">
          <label className="label">Dépassement de poids <span className="opt">/ Overrun</span></label>
          <div style={{ position: 'relative' }}>
            <input className="input mono" type="number" value={data.overrunRate} onChange={e => upd('overrunRate', +e.target.value)} style={{ paddingRight: 60 }} />
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)', fontSize: 11 }}>{data.currency}/kg</span>
          </div>
        </div>
        <div className="field">
          <label className="label">Livraison à domicile <span className="opt">/ Home delivery</span></label>
          <div style={{ position: 'relative' }}>
            <input className="input mono" type="number" value={data.deliveryFee} onChange={e => upd('deliveryFee', +e.target.value)} style={{ paddingRight: 50 }} />
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)', fontSize: 11 }}>{data.currency}</span>
          </div>
        </div>
        <div className="field">
          <label className="label">Frais de manutention <span className="opt">/ Handling</span></label>
          <div style={{ position: 'relative' }}>
            <input className="input mono" type="number" value={data.handlingFee} onChange={e => upd('handlingFee', +e.target.value)} style={{ paddingRight: 50 }} />
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)', fontSize: 11 }}>{data.currency}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepCosts({ data, upd }) {
  const total = data.internalTransport + data.internalCustoms + data.internalWarehouse;
  const estRevenue = data.capacityReserved * 14; // rough avg
  const margin = estRevenue - total;
  return (
    <div>
      <h4 style={{margin:'0 0 6px', fontSize:15, fontWeight:700, letterSpacing:'-.01em'}}>Coûts internes</h4>
      <p style={{margin:'0 0 18px', color:'var(--ink-400)', fontSize:13}}>
        Pour le calcul de marge. Ces valeurs restent confidentielles, visibles aux admins uniquement.
      </p>

      <div className="field-row field-row--3">
        <div className="field">
          <label className="label">Transport aérien <span className="opt">/ Air freight</span></label>
          <div style={{ position: 'relative' }}>
            <input className="input mono" type="number" value={data.internalTransport} onChange={e => upd('internalTransport', +e.target.value)} style={{ paddingRight: 50 }} />
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)', fontSize: 11 }}>{data.currency}</span>
          </div>
        </div>
        <div className="field">
          <label className="label">Douane & dédouanement <span className="opt">/ Customs</span></label>
          <div style={{ position: 'relative' }}>
            <input className="input mono" type="number" value={data.internalCustoms} onChange={e => upd('internalCustoms', +e.target.value)} style={{ paddingRight: 50 }} />
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)', fontSize: 11 }}>{data.currency}</span>
          </div>
        </div>
        <div className="field">
          <label className="label">Entrepôt & logistique <span className="opt">/ Warehouse</span></label>
          <div style={{ position: 'relative' }}>
            <input className="input mono" type="number" value={data.internalWarehouse} onChange={e => upd('internalWarehouse', +e.target.value)} style={{ paddingRight: 50 }} />
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)', fontSize: 11 }}>{data.currency}</span>
          </div>
        </div>
      </div>

      <div className="field">
        <label className="label">Note interne <span className="opt">/ Internal note</span></label>
        <textarea className="textarea" placeholder="Devis fournisseur, conditions particulières..." value={data.notes} onChange={e => upd('notes', e.target.value)} rows={3} />
      </div>

      {/* Margin estimate */}
      <div style={{ marginTop: 16, padding: 18, background: 'linear-gradient(135deg, var(--ink-900), var(--ink-800))', color: 'white', borderRadius: 10 }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', color: 'rgba(255,255,255,.5)', marginBottom: 12, fontWeight: 600 }}>
          Estimation de marge <span style={{color:'rgba(255,255,255,.4)'}}>· basée sur capacité réservée × 14 CAD/kg</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginBottom: 4 }}>CA estimé</div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>{estRevenue.toLocaleString('fr')} <span style={{fontSize:12, color:'rgba(255,255,255,.5)'}}>{data.currency}</span></div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginBottom: 4 }}>Coûts totaux</div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,.85)' }}>−{total.toLocaleString('fr')} <span style={{fontSize:12, color:'rgba(255,255,255,.5)'}}>{data.currency}</span></div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginBottom: 4 }}>Marge prévisionnelle</div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: '#F5A524' }}>{margin.toLocaleString('fr')} <span style={{fontSize:12, color:'rgba(255,255,255,.5)'}}>{data.currency}</span></div>
            <div style={{ fontSize: 11, color: 'var(--ok-500)', marginTop: 3 }} className="mono">+{Math.round(margin/estRevenue*100)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepTeam({ data, upd }) {
  const agents = window.DATA.AGENTS;
  return (
    <div>
      <h4 style={{margin:'0 0 6px', fontSize:15, fontWeight:700, letterSpacing:'-.01em'}}>Équipe en charge</h4>
      <p style={{margin:'0 0 18px', color:'var(--ink-400)', fontSize:13}}>
        Définissez les responsables et l'équipe opérationnelle de cette cargaison.
      </p>

      <div className="field-row field-row--2">
        <div className="field">
          <label className="label">Responsable origine <span className="opt">/ Origin lead</span></label>
          <select className="select" value={data.agentOrigin} onChange={e => upd('agentOrigin', e.target.value)}>
            {agents.filter(a => a.city === 'Douala' || a.city === 'Lagos').map(a => (
              <option key={a.id} value={a.id}>{a.name} — {a.city}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label">Responsable destination <span className="opt">/ Destination lead</span></label>
          <select className="select" value={data.agentDest} onChange={e => upd('agentDest', e.target.value)}>
            {agents.filter(a => a.city === 'Montréal' || a.city === 'Bruxelles').map(a => (
              <option key={a.id} value={a.id}>{a.name} — {a.city}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="section-title" style={{ marginTop: 12 }}>
        Équipe opérationnelle <span className="section-title__count">{data.teamMembers.length}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {agents.map(a => {
          const sel = data.teamMembers.includes(a.id);
          return (
            <label key={a.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              border: '1px solid '+(sel ? 'var(--brand-300)' : 'var(--border)'),
              borderRadius: 8, cursor: 'pointer',
              background: sel ? 'var(--brand-50)' : 'white',
            }}>
              <input type="checkbox" checked={sel} style={{accentColor:'var(--brand-500)'}}
                onChange={() => {
                  if (sel) upd('teamMembers', data.teamMembers.filter(x => x !== a.id));
                  else upd('teamMembers', [...data.teamMembers, a.id]);
                }} />
              <Avatar initials={a.initials} color={a.color} size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>{a.city} · {a.role === 'admin' ? 'Admin' : a.role === 'agent' ? 'Agent' : 'Lecture'}</div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function StepReview({ data, route }) {
  const total = data.internalTransport + data.internalCustoms + data.internalWarehouse;
  return (
    <div>
      <h4 style={{margin:'0 0 6px', fontSize:15, fontWeight:700, letterSpacing:'-.01em'}}>Résumé & création</h4>
      <p style={{margin:'0 0 18px', color:'var(--ink-400)', fontSize:13}}>
        Vérifiez les informations avant de créer la cargaison.
      </p>

      <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', background: 'var(--bg-soft)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <RoutePill from={route.fromIATA} to={route.toIATA} />
          <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>{data.code}</span>
          <div className="spacer" style={{flex:1}}/>
          <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>Devise <strong>{data.currency}</strong></span>
        </div>
        <div style={{ padding: 18, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <ReviewRow label="Route" value={`${route.fromCity} → ${route.toCity}`} />
          <ReviewRow label="Transit" value={`${route.transitDays} jours`} />
          <ReviewRow label="Départ" value={data.depDate} />
          <ReviewRow label="Arrivée estimée" value={data.arrDate} />
          <ReviewRow label="Capacité max" value={`${data.capacityMax.toLocaleString('fr')} kg`} />
          <ReviewRow label="Capacité réservée" value={`${data.capacityReserved.toLocaleString('fr')} kg`} />
        </div>
        <div style={{ borderTop: '1px solid var(--border-soft)', padding: 18 }}>
          <div className="section-title" style={{ marginBottom: 8 }}>Tarification</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {data.pricing.map((r, i) => (
              <span key={i} style={{ padding: '4px 10px', borderRadius: 999, background: 'var(--bg-soft)', fontSize: 11.5 }} className="mono">
                {r.from}–{r.to} kg → <strong>{r.rate} {data.currency}/kg</strong>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--ink-500)' }}>
            <span>Dépassement : <strong className="mono" style={{color:'var(--ink-800)'}}>{data.overrunRate} {data.currency}/kg</strong></span>
            <span>Livraison : <strong className="mono" style={{color:'var(--ink-800)'}}>{data.deliveryFee} {data.currency}</strong></span>
            <span>Manutention : <strong className="mono" style={{color:'var(--ink-800)'}}>{data.handlingFee} {data.currency}</strong></span>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--border-soft)', padding: 18, background: 'var(--bg-soft)' }}>
          <div className="section-title" style={{ marginBottom: 8 }}>Coûts internes (admin)</div>
          <div className="mono" style={{ fontSize: 13, color: 'var(--ink-700)' }}>
            Transport <strong>{data.internalTransport.toLocaleString('fr')}</strong> + Douane <strong>{data.internalCustoms.toLocaleString('fr')}</strong> + Entrepôt <strong>{data.internalWarehouse.toLocaleString('fr')}</strong> = <strong style={{color:'var(--ink-900)'}}>{total.toLocaleString('fr')} {data.currency}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{value}</div>
    </div>
  );
}

window.NewCampaignWizard = NewCampaignWizard;
