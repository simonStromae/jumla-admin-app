// ============================================
// ZENDIT — Screen: Delivery slip (Bordereau) detail
// ============================================

function SlipDetailScreen({ id, onNav, onPrint }) {
  const slip = {
    code: id || 'BL-2604-01',
    clientCode: 'CL-0418',
    campaign: 'DLA-YUL-APR-02',
    status: 'in-progress',
    sender: { name: 'Client A', code: 'CL-0142', phone: '+237 6** ** ** 12', city: 'Douala', address: 'BP 1842, Akwa, Douala' },
    recipient: { name: 'Client J', code: 'CL-0418', phone: '+1 514 *** **45', city: 'Montréal', address: '1234 Rue Saint-Denis, Montréal H2X 3K2' },
    amount: { weight: 14, weightRate: 18, weightAmount: 252, overrun: 22, overrunAmount: 44, delivery: 25, handling: 8, total: 280 + 49 },
  };

  const items = [
    { id: 1, name: 'Valise médium — vêtements adulte', packs: 1, pieces: 1, status: 'ok',     discr: 0, note: '' },
    { id: 2, name: 'Valise large — chaussures, sacs',  packs: 1, pieces: 1, status: 'ok',     discr: 0, note: '' },
    { id: 3, name: 'Carton — ndolè, épices, café',     packs: 1, pieces: 8, status: 'verify', discr: 0, note: '8 sachets, à peser' },
    { id: 4, name: 'Carton — produits cosmétiques',    packs: 1, pieces: 12, status: 'missing', discr: 2, note: '2 flacons manquants' },
    { id: 5, name: 'Sachet — bijoux fantaisie',        packs: 1, pieces: 6, status: 'extra', discr: 1, note: '1 article en plus' },
  ];

  const verif = {
    total: items.reduce((a,i)=>a+i.pieces, 0),
    ok: items.filter(i => i.status === 'ok').reduce((a,i)=>a+i.pieces, 0),
    discr: items.reduce((a,i)=>a+i.discr, 0),
  };

  return (
    <div className="page">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ink-400)', marginBottom: 8 }}>
        <a style={{cursor:'pointer'}} onClick={() => onNav('/')}>Cargaisons</a>
        <I.ChevronRight style={{width:12, height:12}} />
        <a style={{cursor:'pointer'}} onClick={() => onNav('/campaign/c1')}>{slip.campaign}</a>
        <I.ChevronRight style={{width:12, height:12}} />
        <span style={{ color: 'var(--ink-600)', fontWeight: 600 }}>Bordereau {slip.code}</span>
      </div>

      <div className="page__head" style={{ marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h1 className="page__title" style={{ margin: 0 }}>Bordereau de livraison</h1>
            <span className="mono badge badge--lg badge--neutral">{slip.code}</span>
            <span className="badge badge--lg badge--warn badge--dot">Vérification en cours</span>
          </div>
          <div className="page__sub">
            Cargaison <a style={{color:'var(--brand-700)', fontWeight:600, cursor:'pointer'}} onClick={() => onNav('/campaign/c1')}>{slip.campaign}</a> ·
            Client <strong className="mono">{slip.clientCode}</strong>
          </div>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost" onClick={onPrint}><I.Print />Imprimer</button>
          <button className="btn btn--ghost"><I.Download />PDF</button>
          <button className="btn btn--ghost"><I.Whatsapp style={{color:'var(--ok-600)'}}/>Envoyer</button>
          <button className="btn btn--brand"><I.Check />Valider & libérer</button>
        </div>
      </div>

      <div className="layout-2col">
        {/* Left col */}
        <div>
          {/* Sender/Recipient */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <PartyCard kind="Expéditeur" en="Sender" data={slip.sender} color={1} icon={<I.Pin style={{color:'var(--brand-500)'}}/>} />
            <PartyCard kind="Destinataire" en="Recipient" data={slip.recipient} color={2} icon={<I.Pin style={{color:'var(--info-600)'}}/>} />
          </div>

          {/* Verification table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Vérification du contenu</div>
                <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>Pointage à l'arrivée — colis par colis</div>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                <Stat label="Articles" value={items.length} />
                <Stat label="Pièces" value={verif.total} />
                <Stat label="Conformes" value={verif.ok} color="var(--ok-600)" />
                <Stat label="Écarts" value={verif.discr} color={verif.discr > 0 ? 'var(--bad-600)' : null} />
              </div>
            </div>

            <table className="tbl tbl--compact" style={{ borderRadius: 0 }}>
              <thead>
                <tr>
                  <th style={{borderRadius:0, width: 32}}>#</th>
                  <th>Article</th>
                  <th style={{width:60}}>Colis</th>
                  <th style={{width:60}}>Pièces</th>
                  <th style={{width:160}}>Vérification</th>
                  <th style={{width:60, textAlign:'center'}}>Écart</th>
                  <th style={{borderRadius:0}}>Note</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => {
                  const statusMap = {
                    ok:      { lbl: 'Conforme', cls: 'ok' },
                    missing: { lbl: 'Manquant', cls: 'bad' },
                    extra:   { lbl: 'En plus',  cls: 'warn' },
                    verify:  { lbl: 'À vérifier', cls: 'neutral' },
                  };
                  const st = statusMap[it.status];
                  return (
                    <tr key={it.id}>
                      <td className="mono" style={{ color: 'var(--ink-400)', fontSize: 12 }}>{i+1}</td>
                      <td style={{ fontWeight: 500 }}>{it.name}</td>
                      <td className="mono">{it.packs}</td>
                      <td className="mono">{it.pieces}</td>
                      <td>
                        <select className="select input--sm" style={{ height: 28, padding: '0 8px', fontSize: 12, color: st.cls === 'ok' ? 'var(--ok-700)' : st.cls === 'bad' ? 'var(--bad-700)' : st.cls === 'warn' ? 'var(--warn-700)' : 'var(--ink-600)' }} defaultValue={it.status}>
                          <option value="ok">✓ Conforme</option>
                          <option value="missing">✗ Manquant</option>
                          <option value="extra">+ En plus</option>
                          <option value="verify">? À vérifier</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="mono" style={{ fontWeight: 700, color: it.discr > 0 ? 'var(--bad-600)' : 'var(--ink-300)' }}>
                          {it.discr > 0 ? '−'+it.discr : '—'}
                        </span>
                      </td>
                      <td>
                        <input className="input input--sm" defaultValue={it.note} placeholder="—" style={{ fontSize: 12 }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ padding: '12px 16px', background: verif.discr > 0 ? 'var(--bad-50)' : 'var(--ok-50)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              {verif.discr > 0 ? (
                <>
                  <I.Alert style={{ width: 16, height: 16, color: 'var(--bad-600)' }}/>
                  <span style={{ fontSize: 13, color: 'var(--bad-700)' }}>
                    <strong>{verif.discr} écart{verif.discr>1?'s':''} détecté{verif.discr>1?'s':''}.</strong> La validation reste possible mais signalera l'écart sur le bordereau imprimé.
                  </span>
                </>
              ) : (
                <>
                  <I.Check style={{ width: 16, height: 16, color: 'var(--ok-600)' }}/>
                  <span style={{ fontSize: 13, color: 'var(--ok-700)' }}>Contenu intégralement conforme. Prêt pour validation.</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right col */}
        <div>
          {/* Payment */}
          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className="section-title" style={{ margin: 0 }}>
                <I.Wallet style={{ width: 14, height: 14, color: 'var(--brand-600)' }}/> Paiement
              </div>
              <span className="badge badge--dot badge--ok">Payé</span>
            </div>

            <div style={{ display: 'grid', gap: 6, marginBottom: 14, fontSize: 13 }}>
              <Line l={`Poids ${slip.amount.weight} kg × ${slip.amount.weightRate} CAD`} v={slip.amount.weightAmount} />
              <Line l={`Dépassement ${slip.amount.overrun > 0 ? `+2 kg × ${slip.amount.overrun} CAD` : '—'}`} v={slip.amount.overrunAmount} />
              <Line l="Livraison à domicile" v={slip.amount.delivery} />
              <Line l="Manutention" v={slip.amount.handling} />
            </div>

            <div style={{ padding: '12px 0', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              <span style={{ fontWeight: 700 }}>Total dû</span>
              <span className="mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink-900)' }}>
                {slip.amount.total} <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>CAD</span>
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button className="btn btn--ghost btn--sm" style={{justifyContent:'center'}}>Acompte</button>
              <button className="btn btn--brand btn--sm" style={{justifyContent:'center'}}><I.Check />Marquer payé</button>
            </div>

            <div style={{ marginTop: 12, padding: 10, background: 'var(--ok-50)', borderRadius: 6, fontSize: 11.5, color: 'var(--ok-700)' }}>
              <strong>Réglé le 26 avr. 14:32</strong> · Virement Interac · Reçu par Aïcha M.
            </div>
          </div>

          {/* Delivery mode */}
          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>
              <I.Truck style={{ width: 14, height: 14, color: 'var(--brand-600)' }}/> Mode de livraison
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              <label style={{
                padding: 12, border: '1px solid var(--brand-500)', borderRadius: 8,
                background: 'var(--brand-50)', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              }}>
                <I.Truck style={{ color: 'var(--brand-700)' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-700)' }}>Livraison à domicile</span>
                <span style={{ fontSize: 10.5, color: 'var(--brand-600)' }}>+25 CAD</span>
              </label>
              <label style={{
                padding: 12, border: '1px solid var(--border)', borderRadius: 8,
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                color: 'var(--ink-500)',
              }}>
                <I.Warehouse />
                <span style={{ fontSize: 12, fontWeight: 600 }}>Retrait entrepôt</span>
                <span style={{ fontSize: 10.5 }}>Gratuit</span>
              </label>
            </div>

            <div style={{ background: 'var(--bg-soft)', borderRadius: 7, padding: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600, marginBottom: 6 }}>Adresse de livraison</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{slip.recipient.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-600)', marginBottom: 4 }}>{slip.recipient.address}</div>
              <div className="mono" style={{ fontSize: 12, color: 'var(--ink-500)' }}>{slip.recipient.phone}</div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn--ghost btn--sm" style={{flex:1, justifyContent:'center'}}><I.Edit />Modifier</button>
              <button className="btn btn--soft btn--sm" style={{flex:1, justifyContent:'center'}}><I.Phone />Appeler</button>
            </div>
          </div>

          {/* History */}
          <div className="card" style={{ padding: 16 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>
              <I.History style={{ width: 14, height: 14, color: 'var(--brand-600)' }}/> Historique
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                { who: 'Aïcha M.', what: 'Paiement marqué reçu', when: '26 avr. 14:32', c: 1 },
                { who: 'Marc L.',  what: 'Vérification arrivée — 2 manquants',     when: '26 avr. 11:08', c: 2 },
                { who: 'Marc L.',  what: 'Cargaison arrivée à YUL',                when: '26 avr. 09:14', c: 2 },
                { who: 'Aïcha M.', what: 'Bordereau créé',                          when: '14 avr. 08:30', c: 1 },
              ].map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, position: 'relative' }}>
                  {i < 3 && <div style={{ position: 'absolute', left: 10, top: 22, bottom: -6, width: 1, background: 'var(--border)' }} />}
                  <Avatar initials={h.who.split(' ').map(x=>x[0]).join('')} color={h.c} size="sm" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5 }}><strong>{h.who}</strong> — {h.what}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 1 }}>{h.when}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PartyCard({ kind, en, data, color, icon }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {icon}
        <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700, color: 'var(--ink-400)' }}>
          {kind} <span style={{ color: 'var(--ink-300)', fontWeight: 500 }}>/ {en}</span>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar initials={data.name.split(' ').map(x=>x[0]).slice(0,2).join('')} color={color} size="lg" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{data.name}</div>
          <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-400)' }}>{data.code}</div>
        </div>
      </div>
      <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--ink-600)', lineHeight: 1.6 }}>
        <div className="mono">{data.phone}</div>
        <div>{data.address}</div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: color || 'var(--ink-900)' }}>{value}</div>
      <div style={{ fontSize: 10.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function Line({ l, v }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-600)' }}>
      <span>{l}</span>
      <span className="mono" style={{ color: 'var(--ink-800)', fontWeight: 600 }}>{v} CAD</span>
    </div>
  );
}

window.SlipDetailScreen = SlipDetailScreen;
