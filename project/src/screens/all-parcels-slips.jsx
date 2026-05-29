// ============================================
// ZENDIT — Screen: All parcels (across campaigns)
// ============================================

function AllParcelsScreen({ onNav }) {
  const [tab, setTab] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Synthesize parcels from multiple campaigns
  const allParcels = window.DATA.CAMPAIGNS.flatMap(c =>
    window.DATA.PARCELS.slice(0, c.parcels > 4 ? 4 : c.parcels).map((p, i) => ({
      ...p,
      id: c.id + '-' + p.id,
      campaign: c.code,
      campaignId: c.id,
      campaignStatus: c.status,
    }))
  );

  const filtered = allParcels.filter(p => {
    if (campaignFilter !== 'all' && p.campaignId !== campaignFilter) return false;
    if (tab === 'unpaid') return p.paid === 'unpaid';
    if (tab === 'pending') return p.paid === 'pending';
    if (tab === 'overrun') return p.overrun;
    if (tab === 'home') return p.delivery === 'home';
    return true;
  });
  const pageStart = (page - 1) * pageSize;
  const paged = filtered.slice(pageStart, pageStart + pageSize);

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__title"><Bi fr="Tous les colis" en="All parcels" /></div>
          <div className="page__sub">Vue globale — colis de toutes les cargaisons, filtrables par statut et destination</div>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost"><I.Download />Export CSV</button>
          <button className="btn btn--brand"><I.Plus />Nouveau colis</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 18 }}>
        <div className="kpi">
          <div className="kpi__label">Total colis <span style={{textTransform:'none', color:'var(--ink-300)'}}>/ Parcels</span></div>
          <div className="kpi__value">{allParcels.length.toLocaleString('fr')}</div>
          <div className="kpi__delta">8 cargaisons</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Poids cumulé</div>
          <div className="kpi__value">{(allParcels.reduce((a,p) => a + p.actualKg, 0)).toFixed(0)} <span style={{ fontSize: 14, color: 'var(--ink-400)' }}>kg</span></div>
        </div>
        <div className="kpi" style={{background:'var(--ok-50)', borderColor:'var(--ok-100)'}}>
          <div className="kpi__label" style={{color:'var(--ok-700)'}}>Payés</div>
          <div className="kpi__value" style={{color:'var(--ok-700)'}}>{allParcels.filter(p => p.paid === 'paid').length}</div>
        </div>
        <div className="kpi" style={{background:'var(--bad-50)', borderColor:'var(--bad-100)'}}>
          <div className="kpi__label" style={{color:'var(--bad-700)'}}>Impayés</div>
          <div className="kpi__value" style={{color:'var(--bad-700)'}}>{allParcels.filter(p => p.paid === 'unpaid').length}</div>
        </div>
        <div className="kpi" style={{background:'var(--warn-50)', borderColor:'var(--warn-100)'}}>
          <div className="kpi__label" style={{color:'var(--warn-700)'}}>Dépassements</div>
          <div className="kpi__value" style={{color:'var(--warn-700)'}}>{allParcels.filter(p => p.overrun).length}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="tabs">
          <button className={'tab '+(tab==='all'?'is-active':'')} onClick={() => setTab('all')}>Tous <span className="count">{allParcels.length}</span></button>
          <button className={'tab '+(tab==='unpaid'?'is-active':'')} onClick={() => setTab('unpaid')}>Impayés <span className="count">{allParcels.filter(p=>p.paid==='unpaid').length}</span></button>
          <button className={'tab '+(tab==='pending'?'is-active':'')} onClick={() => setTab('pending')}>En cours</button>
          <button className={'tab '+(tab==='home'?'is-active':'')} onClick={() => setTab('home')}>À livrer</button>
          <button className={'tab '+(tab==='overrun'?'is-active':'')} onClick={() => setTab('overrun')}>Dépassements <span className="count">{allParcels.filter(p=>p.overrun).length}</span></button>
        </div>
        <div className="spacer"/>
        <div style={{ position: 'relative' }}>
          <I.Search style={{ position: 'absolute', left: 10, top: 9, width: 14, height: 14, color: 'var(--ink-400)' }} />
          <input className="input input--sm" placeholder="Code, expéditeur, destinataire..." style={{ width: 260, paddingLeft: 32 }} />
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 6px 4px 10px', border: '1px solid var(--border)', borderRadius: 7, background: 'white', fontSize: 12 }}>
          <I.Plane style={{ width: 12, height: 12, color: 'var(--ink-400)' }} />
          <select value={campaignFilter} onChange={e => setCampaignFilter(e.target.value)} style={{ border: 0, background: 'transparent', fontWeight: 600, paddingRight: 4 }}>
            <option value="all">Toutes cargaisons</option>
            {window.DATA.CAMPAIGNS.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
        </div>
        <button className="btn btn--soft btn--sm"><I.Filter />Filtres</button>
      </div>

      {/* Table */}
      <table className="tbl" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <thead>
          <tr>
            <th style={{ width: 32, borderRadius: 0 }}><input type="checkbox" style={{accentColor:'var(--brand-500)'}}/></th>
            <th>Cargaison</th>
            <th>Code</th>
            <th>Expéditeur</th>
            <th>Destinataire</th>
            <th>Poids</th>
            <th style={{textAlign:'right'}}>Montant</th>
            <th>Paiement</th>
            <th>Livraison</th>
            <th>Bordereau</th>
            <th style={{ borderRadius: 0, width: 60 }}></th>
          </tr>
        </thead>
        <tbody>
          {paged.map(p => (
            <tr key={p.id}>
              <td><input type="checkbox" style={{accentColor:'var(--brand-500)'}}/></td>
              <td>
                <a className="mono" onClick={() => onNav('/campaign/'+p.campaignId)} style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-700)', cursor: 'pointer' }}>{p.campaign}</a>
              </td>
              <td><span className="mono" style={{ fontWeight: 700 }}>{p.code}</span></td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar initials={p.senderName.split(' ').map(x=>x[0]).join('')} color={(p.id.charCodeAt(0)%8)+1} size="sm" />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 12.5 }}>{p.senderName}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>{p.senderPhone}</div>
                  </div>
                </div>
              </td>
              <td>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12.5 }}>{p.recipName}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>{p.recipCity}</div>
                </div>
              </td>
              <td>
                <div className="mono" style={{ fontSize: 12 }}>
                  <strong>{p.actualKg}</strong> kg
                  {p.overrun && <span style={{ marginLeft: 4, color: 'var(--warn-700)' }}>⚠</span>}
                </div>
              </td>
              <td style={{ textAlign: 'right' }}>
                <span className="mono" style={{ fontWeight: 700 }}>{p.amount}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-400)', marginLeft: 3 }}>CAD</span>
              </td>
              <td>
                <span className={'badge badge--dot badge--'+window.STATUS.payment[p.paid].cls}>
                  {window.STATUS.payment[p.paid].label}
                </span>
              </td>
              <td>
                <span style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--ink-600)' }}>
                  {p.delivery === 'home' ? <><I.Truck style={{width:13, height:13}}/> Domicile</> : <><I.Warehouse style={{width:13, height:13}}/> Retrait</>}
                </span>
              </td>
              <td>
                {p.slip
                  ? <a className="mono" style={{ fontSize: 12, color: 'var(--brand-700)', fontWeight: 600, cursor: 'pointer' }} onClick={() => onNav('/slip/'+p.slip)}>{p.slip}</a>
                  : <button className="btn btn--ghost btn--xs"><I.Plus />Créer</button>}
              </td>
              <td>
                <button className="icon-btn"><I.More /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination total={filtered.length} page={page} pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />

      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-400)', display: 'flex', justifyContent: 'space-between' }}>
        <span>Actualisé il y a 2 min · {allParcels.length} colis indexés</span>
        <span>Tri par défaut : cargaison ↓, code ↑</span>
      </div>
    </div>
  );
}

// ============================================
// ZENDIT — Screen: All slips (bordereaux)
// ============================================

function AllSlipsScreen({ onNav }) {
  const [tab, setTab] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const slips = window.DATA.CAMPAIGNS.flatMap(c =>
    Array.from({ length: Math.min(c.parcels, 6) }).map((_, i) => ({
      id: c.code.replace('DLA-YUL-','BL-').replace('LOS-YUL-','BL-').replace('DLA-BRU-','BL-')+'-'+String(i+1).padStart(2,'0'),
      code: `BL-${c.dep.match(/(\d+)/)[0]}${c.code.includes('APR')?'04':c.code.includes('MAR')?'03':c.code.includes('FEB')?'02':'01'}-${String(i+1).padStart(2,'0')}`,
      campaign: c.code,
      campaignId: c.id,
      campaignStatus: c.status,
      sender: 'Client ' + String.fromCharCode(65 + i),
      recipient: 'Client ' + String.fromCharCode(74 + i),
      recipientCity: ['Montréal','Laval','Longueuil','Brossard','Gatineau','Québec'][i % 6],
      items: 2 + (i % 4),
      pieces: 5 + (i * 3) % 12,
      status: i % 5 === 0 ? 'pending' : i % 5 === 1 ? 'partial' : i % 5 === 2 ? 'validated' : i % 5 === 3 ? 'released' : 'pending',
      discrepancy: i % 4 === 0 ? 0 : i % 4 === 1 ? 0 : i % 4 === 2 ? 2 : 1,
      amount: 100 + (i * 65) % 500,
      paid: i % 3 === 0 ? 'paid' : i % 3 === 1 ? 'unpaid' : 'pending',
      agent: i % 2 === 0 ? 'AM' : 'ML',
    }))
  );

  const filtered = slips.filter(s => {
    if (campaignFilter !== 'all' && s.campaignId !== campaignFilter) return false;
    if (tab === 'pending')   return s.status === 'pending';
    if (tab === 'validated') return s.status === 'validated';
    if (tab === 'discr')     return s.discrepancy > 0;
    if (tab === 'released')  return s.status === 'released';
    return true;
  });
  const pageStartS = (page - 1) * pageSize;
  const pagedSlips = filtered.slice(pageStartS, pageStartS + pageSize);

  const slipStatusMap = {
    pending:   { l: 'À vérifier',  cls: 'neutral' },
    partial:   { l: 'En cours',    cls: 'warn' },
    validated: { l: 'Validé',      cls: 'ok' },
    released:  { l: 'Libéré',      cls: 'ok' },
  };

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__title"><Bi fr="Bordereaux" en="Slips" /></div>
          <div className="page__sub">Tous les bordereaux de livraison de toutes les cargaisons</div>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost"><I.Download />Export PDF lot</button>
          <button className="btn btn--brand"><I.Plus />Nouveau bordereau</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 18 }}>
        <div className="kpi">
          <div className="kpi__label">Total bordereaux</div>
          <div className="kpi__value">{slips.length}</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">À vérifier</div>
          <div className="kpi__value">{slips.filter(s => s.status === 'pending').length}</div>
        </div>
        <div className="kpi" style={{background:'var(--ok-50)', borderColor:'var(--ok-100)'}}>
          <div className="kpi__label" style={{color:'var(--ok-700)'}}>Validés</div>
          <div className="kpi__value" style={{color:'var(--ok-700)'}}>{slips.filter(s => s.status === 'validated' || s.status === 'released').length}</div>
        </div>
        <div className="kpi" style={{background:'var(--bad-50)', borderColor:'var(--bad-100)'}}>
          <div className="kpi__label" style={{color:'var(--bad-700)'}}>Avec écarts</div>
          <div className="kpi__value" style={{color:'var(--bad-700)'}}>{slips.filter(s => s.discrepancy > 0).length}</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Libérés</div>
          <div className="kpi__value">{slips.filter(s => s.status === 'released').length}</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="tabs">
          <button className={'tab '+(tab==='all'?'is-active':'')} onClick={() => setTab('all')}>Tous <span className="count">{slips.length}</span></button>
          <button className={'tab '+(tab==='pending'?'is-active':'')} onClick={() => setTab('pending')}>À vérifier</button>
          <button className={'tab '+(tab==='validated'?'is-active':'')} onClick={() => setTab('validated')}>Validés</button>
          <button className={'tab '+(tab==='discr'?'is-active':'')} onClick={() => setTab('discr')}>Avec écarts <span className="count">{slips.filter(s=>s.discrepancy>0).length}</span></button>
          <button className={'tab '+(tab==='released'?'is-active':'')} onClick={() => setTab('released')}>Libérés</button>
        </div>
        <div className="spacer"/>
        <div style={{ position: 'relative' }}>
          <I.Search style={{ position: 'absolute', left: 10, top: 9, width: 14, height: 14, color: 'var(--ink-400)' }} />
          <input className="input input--sm" placeholder="Code BL, destinataire..." style={{ width: 240, paddingLeft: 32 }} />
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 6px 4px 10px', border: '1px solid var(--border)', borderRadius: 7, background: 'white', fontSize: 12 }}>
          <I.Plane style={{ width: 12, height: 12, color: 'var(--ink-400)' }} />
          <select value={campaignFilter} onChange={e => setCampaignFilter(e.target.value)} style={{ border: 0, background: 'transparent', fontWeight: 600 }}>
            <option value="all">Toutes cargaisons</option>
            {window.DATA.CAMPAIGNS.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
        </div>
      </div>

      <table className="tbl" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <thead>
          <tr>
            <th style={{ width: 32, borderRadius: 0 }}><input type="checkbox" style={{accentColor:'var(--brand-500)'}}/></th>
            <th>Bordereau</th>
            <th>Cargaison</th>
            <th>Expéditeur</th>
            <th>Destinataire</th>
            <th style={{textAlign:'center'}}>Articles</th>
            <th style={{textAlign:'center'}}>Pièces</th>
            <th>Écart</th>
            <th>Statut BL</th>
            <th>Paiement</th>
            <th>Agent</th>
            <th style={{ borderRadius: 0, width: 80 }}></th>
          </tr>
        </thead>
        <tbody>
          {pagedSlips.map(s => {
            const st = slipStatusMap[s.status];
            return (
              <tr key={s.id}>
                <td><input type="checkbox" style={{accentColor:'var(--brand-500)'}}/></td>
                <td>
                  <a className="mono" onClick={() => onNav('/slip/'+s.code)} style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--brand-700)', cursor: 'pointer' }}>
                    {s.code}
                  </a>
                </td>
                <td>
                  <a className="mono" onClick={() => onNav('/campaign/'+s.campaignId)} style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', cursor: 'pointer' }}>{s.campaign}</a>
                </td>
                <td style={{ fontSize: 13, fontWeight: 500 }}>{s.sender}</td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{s.recipient}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>{s.recipientCity}</div>
                </td>
                <td className="mono" style={{ textAlign: 'center', fontWeight: 600 }}>{s.items}</td>
                <td className="mono" style={{ textAlign: 'center', fontWeight: 600 }}>{s.pieces}</td>
                <td>
                  {s.discrepancy > 0
                    ? <span className="badge badge--bad badge--dot">−{s.discrepancy}</span>
                    : <span style={{ color: 'var(--ink-300)', fontSize: 13 }} className="mono">—</span>}
                </td>
                <td>
                  <span className={'badge badge--dot badge--'+st.cls}>{st.l}</span>
                </td>
                <td>
                  <span className={'badge badge--dot badge--'+window.STATUS.payment[s.paid].cls}>
                    {window.STATUS.payment[s.paid].label}
                  </span>
                </td>
                <td>
                  <Avatar initials={s.agent} color={s.agent === 'AM' ? 1 : 2} size="sm" />
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <button className="icon-btn" title="Imprimer" onClick={() => onNav('/slip/'+s.code+'/print')}><I.Print /></button>
                    <button className="icon-btn" title="Voir" onClick={() => onNav('/slip/'+s.code)}><I.Eye /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Pagination total={filtered.length} page={page} pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />

      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-400)', display: 'flex', justifyContent: 'space-between' }}>
        <span>Actualisé il y a 2 min</span>
        <button className="btn btn--ghost btn--xs"><I.Download />Tout exporter en PDF</button>
      </div>
    </div>
  );
}

window.AllParcelsScreen = AllParcelsScreen;
window.AllSlipsScreen = AllSlipsScreen;
