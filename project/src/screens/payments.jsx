// ============================================
// ZENDIT — Screen: Payments journal
// ============================================

function PaymentsScreen({ onNav }) {
  const [tab, setTab] = useState('all');
  const payments = window.DATA.PAYMENTS;
  const tabs = [
    { id: 'all',     l: 'Tous',      n: payments.length },
    { id: 'paid',    l: 'Payés',     n: 5, cls: 'ok' },
    { id: 'pending', l: 'En cours',  n: 1, cls: 'warn' },
    { id: 'unpaid',  l: 'Impayés',   n: 2, cls: 'bad' },
  ];

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__title"><Bi fr="Paiements" en="Payments" /></div>
          <div className="page__sub">Journal chronologique — tous les règlements et leurs statuts</div>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost"><I.Download />Export comptable</button>
          <button className="btn btn--brand"><I.Plus />Enregistrer paiement</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
        <div className="kpi">
          <div className="kpi__label">Facturé <span style={{textTransform:'none', color:'var(--ink-300)'}}>/ Invoiced</span></div>
          <div className="kpi__value">2 380 <span style={{ fontSize: 14, color: 'var(--ink-400)' }}>CAD</span></div>
          <div className="kpi__delta">8 colis</div>
        </div>
        <div className="kpi" style={{ background: 'var(--ok-50)', borderColor: 'var(--ok-100)' }}>
          <div className="kpi__label" style={{ color: 'var(--ok-700)' }}>Perçu <span style={{textTransform:'none', opacity:.6}}>/ Collected</span></div>
          <div className="kpi__value" style={{ color: 'var(--ok-700)' }}>1 855 <span style={{ fontSize: 14, opacity: .6 }}>CAD</span></div>
          <Progress pct={78} />
        </div>
        <div className="kpi" style={{ background: 'var(--bad-50)', borderColor: 'var(--bad-100)' }}>
          <div className="kpi__label" style={{ color: 'var(--bad-700)' }}>Impayés <span style={{textTransform:'none', opacity:.6}}>/ Outstanding</span></div>
          <div className="kpi__value" style={{ color: 'var(--bad-700)' }}>525 <span style={{ fontSize: 14, opacity: .6 }}>CAD</span></div>
          <div className="kpi__delta" style={{ color: 'var(--bad-600)' }}>2 colis · 2 clients</div>
        </div>
        <div className="kpi">
          <div className="kpi__label">Acomptes / Crédits</div>
          <div className="kpi__value">200 <span style={{ fontSize: 14, color: 'var(--ink-400)' }}>CAD</span></div>
          <div className="kpi__delta">1 acompte</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="tabs">
          {tabs.map(t => (
            <button key={t.id} className={'tab '+(tab===t.id?'is-active':'')} onClick={() => setTab(t.id)}>
              {t.l} <span className="count">{t.n}</span>
            </button>
          ))}
        </div>
        <div className="spacer" />
        <div style={{ position: 'relative' }}>
          <I.Search style={{ position: 'absolute', left: 10, top: 9, width: 14, height: 14, color: 'var(--ink-400)' }} />
          <input className="input input--sm" placeholder="Destinataire, colis, agent..." style={{ width: 260, paddingLeft: 32 }} />
        </div>
        <button className="btn btn--soft btn--sm"><I.Plane />Cargaison</button>
        <button className="btn btn--soft btn--sm"><I.Users />Agent</button>
        <button className="btn btn--soft btn--sm"><I.Calendar />Période</button>
      </div>

      <table className="tbl" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <thead>
          <tr>
            <th style={{borderRadius:0}}>Date</th>
            <th>Destinataire</th>
            <th>Cargaison</th>
            <th>Colis</th>
            <th style={{textAlign:'right'}}>Dû</th>
            <th style={{textAlign:'right'}}>Reçu</th>
            <th>Statut</th>
            <th>Méthode</th>
            <th>Agent</th>
            <th>Note</th>
            <th style={{borderRadius:0, width:90}}></th>
          </tr>
        </thead>
        <tbody>
          {payments.map(p => (
            <tr key={p.id}>
              <td className="mono" style={{ fontSize: 12, color: 'var(--ink-500)' }}>{p.date}</td>
              <td>
                <div style={{ fontWeight: 600 }}>{p.recipName}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-400)' }}>{p.recipPhone}</div>
              </td>
              <td className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{p.campaign}</td>
              <td className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{p.parcel}</td>
              <td style={{ textAlign: 'right' }}>
                <span className="mono" style={{ fontWeight: 600 }}>{p.due}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-400)', marginLeft: 3 }}>CAD</span>
              </td>
              <td style={{ textAlign: 'right' }}>
                <span className="mono" style={{ fontWeight: 700, color: p.received > 0 ? 'var(--ok-700)' : 'var(--ink-300)' }}>
                  {p.received > 0 ? p.received : '—'}
                </span>
                {p.received > 0 && <span style={{ fontSize: 11, color: 'var(--ok-700)', opacity: .7, marginLeft: 3 }}>CAD</span>}
              </td>
              <td>
                <span className={'badge badge--dot badge--'+window.STATUS.payment[p.status].cls}>
                  {window.STATUS.payment[p.status].label}
                </span>
              </td>
              <td style={{ fontSize: 12, color: 'var(--ink-600)' }}>{p.method}</td>
              <td><Avatar initials={p.agent} color={p.agent === 'AM' ? 1 : 2} size="sm" /></td>
              <td style={{ fontSize: 12, color: 'var(--ink-500)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.note}</td>
              <td>
                {p.status === 'paid'
                  ? <button className="btn btn--ghost btn--xs" style={{justifyContent:'center', width:'100%'}}><I.Eye />Voir</button>
                  : <button className="btn btn--brand btn--xs" style={{justifyContent:'center', width:'100%'}}><I.Wallet />Régler</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-400)' }}>
        8 entrées · Période : 24 → 26 avril 2026
      </div>
    </div>
  );
}

window.PaymentsScreen = PaymentsScreen;
