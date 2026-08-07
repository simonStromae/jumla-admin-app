import { useState, useEffect } from 'react';
import I from '../components/Icons.jsx';
import { Bi, RoutePill, Avatar, Progress, Skel } from '../components/Shell.jsx';
import { useAdminT } from '../lib/useAdminT.js';

export default function AnalyticsScreen({ onNav }) {
  const [year, setYear] = useState(2026);
  const [routeFilter, setRouteFilter] = useState('all');
  const [period, setPeriod] = useState('ytd');
  const [kpi, setKpi] = useState(null);
  const [opKpi, setOpKpi] = useState(null);
  const [monthData, setMonthData] = useState({ labels: [], revenue: [], costs: [], invoiced: [] });
  const [routes, setRoutes] = useState([]);
  const [routeStats, setRouteStats]             = useState([]);
  const [topClients, setTopClients]             = useState([]);
  const [topDestinations, setTopDestinations]   = useState([]);
  const [topAgents, setTopAgents]               = useState([]);
  const [airlineStats, setAirlineStats]         = useState([]);
  const [unpaid, setUnpaid]                     = useState([]);
  const [paymentMethods, setPaymentMethods]     = useState([]);
  const [recentActivity, setRecentActivity]     = useState([]);
  const t = useAdminT();

  useEffect(() => {
    const params = new URLSearchParams({ year: String(year) });
    if (routeFilter !== 'all') params.set('routeId', routeFilter);

    setKpi(null);
    Promise.all([
      fetch('/api/analytics?' + params).then(r => r.json()),
      fetch('/api/routes').then(r => r.json()),
    ]).then(([d, routesData]) => {
      if (d.kpi) setKpi(d.kpi);
      if (d.opKpi) setOpKpi(d.opKpi);
      if (d.months) {
        setMonthData({
          labels:   d.months.labels   || [],
          revenue:  d.months.revenue  || [],
          costs:    d.months.costs    || [],
          invoiced: d.months.invoiced || [],
        });
      }
      setRouteStats(d.routeStats             || []);
      setTopClients(d.topClients             || []);
      setTopDestinations(d.topDestinations   || []);
      setTopAgents(d.topAgents               || []);
      setAirlineStats(d.airlineStats         || []);
      setUnpaid(d.unpaid                     || []);
      setPaymentMethods(d.paymentMethods     || []);
      setRecentActivity(d.recentActivity     || []);
      setRoutes(Array.isArray(routesData) ? routesData : []);
    }).catch(() => {});
  }, [year, routeFilter]);

  if (!kpi) {
    return (
      <div className="page">
        <div className="page__head">
          <div>
            <div className="page__title">{t.analytics.title}</div>
            <div className="page__sub"><Skel w={240} h={13} /></div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 18 }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="card" style={{ padding: 14 }}>
              <Skel w="70%" h={11} style={{ marginBottom: 10 }} />
              <Skel w="55%" h={26} style={{ marginBottom: 8 }} />
              <Skel w="80%" h={11} />
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="card" style={{ padding: 14 }}>
              <Skel w="70%" h={11} style={{ marginBottom: 10 }} />
              <Skel w="55%" h={26} style={{ marginBottom: 8 }} />
              <Skel w="80%" h={11} />
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <Skel w={200} h={14} style={{ marginBottom: 6 }} />
            <Skel w={140} h={11} style={{ marginBottom: 16 }} />
            <Skel w="100%" h={180} r={8} />
          </div>
          <div className="card" style={{ padding: 16 }}>
            <Skel w={160} h={14} style={{ marginBottom: 6 }} />
            <Skel w={120} h={11} style={{ marginBottom: 16 }} />
            <Skel w="100%" h={120} r={8} />
          </div>
        </div>
        <div className="card" style={{ padding: 16, marginBottom: 14 }}>
          <Skel w={200} h={14} style={{ marginBottom: 6 }} />
          <Skel w={160} h={11} style={{ marginBottom: 16 }} />
          <Skel w="100%" h={160} r={8} />
        </div>
      </div>
    );
  }

  const {
    totalCollected, totalInvoiced, totalWeight, totalParcels,
    recoveryRate, totalCosts, grossMargin, grossMarginPct,
    avgCostPerKg, marginPerParcel, unpaidTotal, unpaidCount,
  } = kpi;

  const PAYMENT_COLORS = ['var(--brand-500)', 'var(--ok-500)', 'var(--info-500)', 'var(--warn-500)', 'var(--bad-500)'];
  const donutData = paymentMethods.map((m, i) => ({
    v: m.amount, l: m.label, color: PAYMENT_COLORS[i % PAYMENT_COLORS.length],
  }));

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__title">{t.analytics.title}</div>
          {/* TODO: no i18n key for this subtitle */}
          <div className="page__sub">Performance commerciale, opérationnelle et financière · {year}</div>
        </div>
        <div className="page__actions">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 6px 4px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'white', fontSize: 12.5 }}>
            <I.Calendar style={{ width: 14, height: 14, color: 'var(--ink-400)' }} />
            <select value={year} onChange={e => setYear(+e.target.value)} style={{ border: 0, background: 'transparent', fontWeight: 600, paddingRight: 4 }}>
              <option>2026</option><option>2025</option><option>2024</option>
            </select>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 6px 4px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'white', fontSize: 12.5 }}>
            <I.Route style={{ width: 14, height: 14, color: 'var(--ink-400)' }} />
            <select value={routeFilter} onChange={e => setRouteFilter(e.target.value)} style={{ border: 0, background: 'transparent', fontWeight: 600, paddingRight: 4 }}>
              {/* TODO: no i18n key for "Toutes les routes" */}
              <option value="all">Toutes les routes</option>
              {routes.map(r => <option key={r.id} value={r.id}>{r.code}</option>)}
            </select>
          </div>
          <div className="tabs" style={{ padding: 2 }}>
            {[['ytd','YTD'],['month', 'Mois'],['12m', '12 mois']].map(([id, lbl]) => (
              <button key={id} className={'tab '+(period===id?'is-active':'')} onClick={() => setPeriod(id)} style={{ padding: '4px 10px', fontSize: 11.5 }}>{lbl}</button>
            ))}
          </div>
          <button className="btn btn--ghost"><I.Download />{t.common.export} PDF</button>
        </div>
      </div>

      {/* ── KPIs principaux ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 18 }}>
        <KpiCard label={t.analytics.kpi.revenue} en="Revenue" value={(totalCollected/1000).toFixed(1)+'k'} unit="CAD" color="var(--ok-500)" big />
        {/* TODO: no i18n key for "Taux recouvrement" */}
        <KpiCard label="Taux recouvrement" en="Recovery" value={recoveryRate} unit="%" progress={recoveryRate} color="var(--brand-500)" />
        <KpiCard label={t.analytics.kpi.parcels} en="Parcels" value={totalParcels.toLocaleString('fr')} unit="" color="var(--info-500)" />
        {/* TODO: no i18n key for "Poids transporté" */}
        <KpiCard label="Poids transporté" en="Weight" value={(totalWeight/1000).toFixed(1)} unit="t" color="var(--brand-500)" />
        {/* TODO: no i18n key for "Impayés" KPI label, "paiement(s) en attente", "Tout à jour" */}
        <KpiCard
          label="Restant à encaisser"
          value={unpaidTotal > 0 ? (unpaidTotal/1000).toFixed(1)+'k' : '0'}
          unit="CAD"
          color={unpaidTotal > 0 ? 'var(--bad-600)' : 'var(--ok-600)'}
          sub={unpaidCount > 0 ? unpaidCount + ' paiement' + (unpaidCount > 1 ? 's' : '') + ' en attente' : 'Tout à jour'}
        />
      </div>

      {/* ── KPIs financiers ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
        {/* TODO: no i18n key for "Coûts opérationnels", "Coût moyen / kg", "Marge brute", "Marge / colis", "par kilogramme expédié", "Taux X%" */}
        <KpiCard label="Coûts opérationnels" en="Op. Costs" value={(totalCosts/1000).toFixed(1)+'k'} unit="CAD" color="var(--bad-500)" />
        <KpiCard label="Coût moyen / kg" en="Cost / kg" value={avgCostPerKg.toFixed(2)} unit="CAD/kg" color="var(--brand-500)" sub="par kilogramme expédié" />
        <KpiCard label="Marge brute" en="Gross Margin" value={(grossMargin/1000).toFixed(1)+'k'} unit="CAD" color="var(--ok-500)" big />
        <KpiCard label="Marge / colis" en="Per Parcel" value={marginPerParcel} unit="CAD" color="var(--ok-500)" sub={`Taux ${grossMarginPct}%`} />
      </div>

      {/* ── Revenus vs temps + Performance opérationnelle ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* TODO: no i18n key for sub "CA facturé vs encaissé · par mois", "Facturé", "Encaissé" */}
        <ChartCard title={t.analytics.charts.monthly} sub="CA facturé vs encaissé · par mois">
          <RevenueChart months={monthData.labels} revenue={monthData.invoiced} collected={monthData.revenue} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14, padding: '10px 0 0', borderTop: '1px solid var(--border-soft)' }}>
            <LegendItem color="var(--brand-100)" label="Facturé" v={(totalInvoiced/1000).toFixed(1)+'k CAD'} />
            <LegendItem color="var(--brand-500)" label="Encaissé" v={(totalCollected/1000).toFixed(1)+'k CAD'} />
            <div style={{ flex: 1 }} />
          </div>
        </ChartCard>

        {/* TODO: no i18n key for "Performance opérationnelle", "Indicateurs clés", "Taux recouvrement", "Délai moyen paiement", "Délai moyen transit", "Validation bordereaux" */}
        <ChartCard title="Performance opérationnelle" sub="Indicateurs clés">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <GaugeRow label="Taux recouvrement" v={recoveryRate} target={95} unit="%" />
            {opKpi && <>
              <GaugeRow label="Délai moyen paiement" v={opKpi.avgPaymentDays} target={7} unit=" j" inverse />
              <GaugeRow label="Délai moyen transit" v={opKpi.avgDeliveryDays} target={14} unit=" j" inverse />
              {opKpi.borderTotal > 0 && (
                <GaugeRow label="Validation bordereaux" v={opKpi.borderValRate} target={100} unit="%" />
              )}
            </>}
          </div>
        </ChartCard>
      </div>

      {/* ── Revenus vs Coûts ── */}
      <div style={{ marginBottom: 14 }}>
        {/* TODO: no i18n key for "Revenus vs Coûts", "CA encaissé · coûts opérationnels · marge brute — par mois", "Marge brute", "Coûts opérationnels", "Taux de marge", "Marge / colis" */}
        <ChartCard title="Revenus vs Coûts" sub="CA encaissé · coûts opérationnels · marge brute — par mois">
          <RevsVsCostsChart months={monthData.labels} revenue={monthData.revenue} costs={monthData.costs} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14, padding: '10px 0 0', borderTop: '1px solid var(--border-soft)' }}>
            <LegendItem color="var(--ok-400)" label="Marge brute" v={(grossMargin/1000).toFixed(1)+'k CAD'} />
            <LegendItem color="var(--bad-300)" label="Coûts opérationnels" v={(totalCosts/1000).toFixed(1)+'k CAD'} />
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 11.5, color: 'var(--ink-400)' }}>
              Taux de marge <strong style={{ color: 'var(--ok-600)' }}>{grossMarginPct}%</strong>
              <span style={{ marginLeft: 12 }}>Marge / colis <strong style={{ color: 'var(--ink-700)' }}>{marginPerParcel} CAD</strong></span>
            </span>
          </div>
        </ChartCard>
      </div>

      {/* ── Routes + En cours + Méthodes de paiement ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* TODO: no i18n key for sub "Volume et chiffre d'affaires encaissé" */}
        <ChartCard title={t.analytics.sections.routes} sub="Volume et chiffre d'affaires encaissé">
          <RoutesBar routeStats={routeStats} />
        </ChartCard>

        <ChartCard title="Restant à encaisser" sub={`${unpaidCount} paiement${unpaidCount !== 1 ? 's' : ''} en attente`}>
          <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: unpaidTotal > 0 ? 'var(--bad-600)' : 'var(--ok-600)', fontFamily: 'var(--ff-mono)' }}>
              {unpaidTotal > 0 ? unpaidTotal.toLocaleString('fr') : '0'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-400)', marginBottom: 12 }}>CAD en attente</div>
          </div>
          {unpaid.slice(0, 4).map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: '1px solid var(--border-soft)', fontSize: 12 }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--ink-800)' }}>{p.clientName}</div>
                <div style={{ color: 'var(--ink-400)', fontFamily: 'var(--ff-mono)', fontSize: 11 }}>{p.trackingCode}</div>
              </div>
              <span style={{ fontWeight: 700, color: 'var(--bad-600)', fontFamily: 'var(--ff-mono)' }}>{p.amount.toLocaleString('fr')}</span>
            </div>
          ))}
          {unpaid.length === 0 && <div style={{ textAlign: 'center', color: 'var(--ok-600)', fontSize: 13, fontWeight: 600, paddingTop: 8 }}>✓ Tout est à jour</div>}
        </ChartCard>

        {/* TODO: no i18n key for sub "Volume encaissé par canal", "Aucune transaction enregistrée" */}
        <ChartCard title="Moyens de paiement" sub="Volume encaissé par canal">
          {donutData.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', color: 'var(--ink-300)', fontSize: 13 }}>
              {t.analytics.empty}
            </div>
          ) : (
            <Donut
              data={donutData}
              center={{ value: (totalCollected / 1000).toFixed(1) + 'k', label: 'CAD' }}
            />
          )}
        </ChartCard>
      </div>

      {/* ── Top classements ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* TODO: no i18n key for "Top clients", "Top destinations", "Top agents", "Par chiffre d'affaires", "Par volume expédié", "Par cargaisons gérées" */}
        <RankingCard title="Top clients" sub="Par chiffre d'affaires" icon={<I.Star style={{ color: 'var(--brand-500)' }} />} items={topClients} />
        <RankingCard title="Top destinations" sub="Par volume expédié" icon={<I.Pin style={{ color: 'var(--info-500)' }} />} items={topDestinations} />
        <RankingCard title="Top agents" sub="Par cargaisons gérées" icon={<I.Users style={{ color: 'var(--ok-500)' }} />} items={topAgents} />
      </div>

      {/* ── Compagnies aériennes ── */}
      <div style={{ marginBottom: 14 }}>
        {/* TODO: no i18n key for sub "Volume, coûts et tarif au kg par transporteur", "Aucune compagnie assignée...", "Cargaisons", "Volume (kg)", "% du volume", "Frêt estimé", "Frêt / kg" */}
        <ChartCard title={t.airlines.title} sub="Volume, coûts et tarif au kg par transporteur">
          {airlineStats.length === 0 ? (
            <div style={{ padding: '28px 0', textAlign: 'center', color: 'var(--ink-400)', fontSize: 13 }}>
              {t.analytics.empty}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  {[t.airlines.headers.name, 'Cargaisons', 'Volume (kg)', '% du volume', 'Frêt estimé', 'Frêt / kg'].map(h => (
                    <th key={h} style={{ textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', padding: '0 0 8px', paddingRight: 16 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {airlineStats.map((a, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: '10px 16px 10px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--brand-50)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                          <I.Plane style={{ width: 13, height: 13, color: 'var(--brand-500)' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-900)' }}>{a.name}</div>
                          {a.iata && <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>{a.iata}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px 10px 0', fontSize: 13, fontWeight: 600, fontFamily: 'var(--ff-mono)' }}>{a.campaigns}</td>
                    <td style={{ padding: '10px 16px 10px 0', fontSize: 13, fontFamily: 'var(--ff-mono)', fontWeight: 600 }}>
                      {a.weightKg.toLocaleString('fr')}
                    </td>
                    <td style={{ padding: '10px 16px 10px 0', minWidth: 100 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: 'var(--ink-100)', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: a.weightPct + '%', background: 'var(--brand-500)', borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-600)', minWidth: 32, textAlign: 'right' }}>{a.weightPct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px 10px 0', fontSize: 13, fontFamily: 'var(--ff-mono)', fontWeight: 600, color: a.fretXaf > 0 ? 'var(--ink-900)' : 'var(--ink-300)' }}>
                      {a.fretXaf > 0 ? a.fretXaf.toLocaleString('fr') + ' CAD' : '—'}
                    </td>
                    <td style={{ padding: '10px 0' }}>
                      {a.fretPerKg > 0 ? (
                        <span className="badge" style={{ background: 'var(--ok-50)', color: 'var(--ok-700)', border: '1px solid var(--ok-100)', fontFamily: 'var(--ff-mono)', fontSize: 12 }}>
                          {a.fretPerKg} CAD/kg
                        </span>
                      ) : <span style={{ fontSize: 12, color: 'var(--ink-300)' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ChartCard>
      </div>

      {/* ── En cours · à relancer + Activité récente ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
        <ChartCard title="Restant à encaisser" sub={unpaidCount + ' paiement' + (unpaidCount !== 1 ? 's' : '') + ' en attente'} actions={
          <a style={{ fontSize: 12, color: 'var(--brand-700)', fontWeight: 600, cursor: 'pointer' }} onClick={() => onNav('/payments')}>Voir tout →</a>
        }>
          {unpaid.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', color: 'var(--ok-600)', fontSize: 13, fontWeight: 600 }}>
              ✓ Aucun en cours
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  {[t.parcels.table.client, 'Colis', t.common.amount, t.common.status].map(h => (
                    <th key={h} style={{ textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', padding: '0 0 8px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {unpaid.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: '8px 0', fontSize: 12.5, fontWeight: 600 }}>{p.clientName}</td>
                    <td style={{ padding: '8px 0', fontSize: 11.5, color: 'var(--ink-400)', fontFamily: 'var(--ff-mono)' }}>{p.trackingCode}</td>
                    <td style={{ padding: '8px 0', fontSize: 13, fontWeight: 700, color: 'var(--bad-600)', fontFamily: 'var(--ff-mono)' }}>{p.amount.toLocaleString('fr')}</td>
                    <td style={{ padding: '8px 0' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 600,
                        background: p.status === 'supplement_pending' ? 'var(--info-50)' : 'var(--bad-50)',
                        color:      p.status === 'supplement_pending' ? 'var(--info-700)' : 'var(--bad-700)',
                      }}>
                        {p.status === 'supplement_pending' ? 'Supplément' : 'En cours'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ChartCard>

        {/* TODO: no i18n key for "Activité récente", "Derniers événements de suivi et paiements", "Aucune activité récente" */}
        <ChartCard title="Activité récente" sub="Derniers événements de suivi et paiements">
          {recentActivity.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', color: 'var(--ink-300)', fontSize: 13 }}>
              {t.analytics.empty}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recentActivity.map((ev, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 999, flexShrink: 0,
                    background: ev.type === 'payment' ? 'var(--ok-50)' : 'var(--brand-50)',
                    display: 'grid', placeItems: 'center',
                  }}>
                    {ev.type === 'payment'
                      ? <I.Check style={{ width: 13, height: 13, color: 'var(--ok-600)' }} />
                      : <I.Box style={{ width: 13, height: 13, color: 'var(--brand-600)' }} />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-800)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 2 }}>
                      {ev.sub} · {new Date(ev.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function KpiCard({ label, en, value, unit, delta, deltaLabel, deltaInverse, spark, progress, color, sub, big }) {
  const trend = delta != null ? (deltaInverse ? -delta : delta) : null;
  const trendKind = trend != null ? (trend >= 0 ? 'up' : 'down') : null;
  return (
    <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 10.5, color: 'var(--ink-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>
        {label} <span style={{ color: 'var(--ink-300)', fontWeight: 500, textTransform: 'none', letterSpacing: 0, marginLeft: 2 }}>/ {en}</span>
      </div>
      <div className="mono" style={{ fontSize: big ? 26 : 22, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--ink-900)' }}>
        {value}{unit && <span style={{ fontSize: 12, color: 'var(--ink-400)', fontWeight: 500, marginLeft: 3 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>{sub}</div>}
      {delta != null && trend != null && (
        <div className={'kpi__delta kpi__delta--' + trendKind} style={{ marginTop: 'auto' }}>
          <span>{trend >= 0 ? '▲' : '▼'}</span>
          {Math.abs(delta)}% {deltaLabel || 'vs N-1'}
        </div>
      )}
      {spark && <Sparkline data={spark} color={color || 'var(--brand-500)'} />}
      {progress != null && <Progress pct={progress} />}
    </div>
  );
}

function Sparkline({ data, color, height = 28 }) {
  const w = 100, h = height;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * h}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height, marginTop: 4 }}>
      <defs>
        <linearGradient id={'sg' + color.replace(/[^a-z0-9]/gi, '')} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill={`url(#sg${color.replace(/[^a-z0-9]/gi, '')})`} points={`0,${h} ${pts} ${w},${h}`} />
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function ChartCard({ title, sub, actions, children }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink-900)' }}>{title}</div>
          {sub && <div style={{ fontSize: 11.5, color: 'var(--ink-400)', marginTop: 2 }}>{sub}</div>}
        </div>
        {actions}
      </div>
      <div style={{ padding: 16, flex: 1 }}>{children}</div>
    </div>
  );
}

function RevenueChart({ months, revenue, collected }) {
  const t = useAdminT();
  if (!months || months.length === 0) return <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-300)', fontSize: 13 }}>{t.analytics.empty}</div>;
  const max = Math.max(...revenue, ...collected, 1);
  const w = 100, h = 180;
  const barW = w / months.length * 0.6;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 200 }}>
        {[0.25, 0.5, 0.75, 1].map((g, i) => (
          <line key={i} x1="0" x2={w} y1={h * (1 - g)} y2={h * (1 - g)} stroke="var(--border-soft)" strokeWidth=".3" vectorEffect="non-scaling-stroke" />
        ))}
        {months.map((m, i) => {
          const x = (i + 0.5) * (w / months.length) - barW / 2;
          const hRev  = ((revenue[i]   || 0) / max) * h;
          const hColl = ((collected[i] || 0) / max) * h;
          return (
            <g key={i}>
              <rect x={x} y={h - hRev}  width={barW} height={hRev  || 0.1} fill="var(--brand-100)" rx={1.4} vectorEffect="non-scaling-stroke" />
              <rect x={x} y={h - hColl} width={barW} height={hColl || 0}   fill="var(--brand-500)" rx={1.4} vectorEffect="non-scaling-stroke" />
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${months.length}, 1fr)`, marginTop: 6 }}>
        {months.map((m, i) => (
          <div key={i} style={{ fontSize: 10.5, textAlign: 'center', color: revenue[i] ? 'var(--ink-600)' : 'var(--ink-300)', fontWeight: 500 }}>{m}</div>
        ))}
      </div>
    </div>
  );
}

function GaugeRow({ label, v, target, unit, inverse }) {
  const t = useAdminT();
  const fillPct = inverse
    ? Math.min(100, Math.round(target / Math.max(v, 0.1) * 100))
    : Math.min(100, Math.round(v / Math.max(target, 0.1) * 100));
  const ok = inverse ? v <= target : v >= target * 0.95;
  const warn = inverse ? v <= target * 2 : v >= target * 0.7;
  const color = ok ? 'var(--ok-500)' : warn ? 'var(--warn-500)' : 'var(--bad-500)';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 12.5, color: 'var(--ink-700)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 11.5, color: 'var(--ink-400)' }}>
          <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>{v}</span>{unit}
          {/* TODO: no i18n key for "cible" (target) */}
          <span style={{ color: 'var(--ink-400)', marginLeft: 6 }}>cible <span className="mono">{target}{unit}</span></span>
        </span>
      </div>
      <div style={{ height: 6, background: 'var(--ink-100)', borderRadius: 999, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: fillPct + '%', background: color, borderRadius: 999 }} />
      </div>
    </div>
  );
}

function Donut({ data, center }) {
  const total = data.reduce((a, d) => a + d.v, 0);
  const R = 60, r = 38;
  let acc = 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg viewBox="-70 -70 140 140" style={{ width: 130, height: 130, flexShrink: 0 }}>
        {data.map((d, i) => {
          const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
          acc += d.v;
          const end = (acc / total) * Math.PI * 2 - Math.PI / 2;
          const large = end - start > Math.PI ? 1 : 0;
          const x1 = Math.cos(start) * R, y1 = Math.sin(start) * R;
          const x2 = Math.cos(end) * R,   y2 = Math.sin(end) * R;
          const xi1 = Math.cos(start) * r, yi1 = Math.sin(start) * r;
          const xi2 = Math.cos(end) * r,   yi2 = Math.sin(end) * r;
          const dp = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${r} ${r} 0 ${large} 0 ${xi1} ${yi1} Z`;
          return <path key={i} d={dp} fill={d.color} stroke="white" strokeWidth="1.5" />;
        })}
        <text x="0" y="-2" textAnchor="middle" style={{ fontSize: 16, fontWeight: 700, fill: 'var(--ink-900)', fontFamily: 'var(--ff-mono)' }}>{center.value}</text>
        <text x="0" y="11" textAnchor="middle" style={{ fontSize: 8, fill: 'var(--ink-400)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>{center.label}</text>
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ width: 8, height: 8, background: d.color, borderRadius: 2, flexShrink: 0 }} />
            <span style={{ flex: 1, color: 'var(--ink-700)' }}>{d.l}</span>
            <span className="mono" style={{ fontWeight: 700, color: 'var(--ink-800)' }}>{Math.round(d.v / total * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoutesBar({ routeStats }) {
  const t = useAdminT();
  if (!routeStats || routeStats.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0', color: 'var(--ink-300)', fontSize: 13 }}>
        {t.analytics.empty}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {routeStats.map((r, idx) => (
        <div key={idx}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <RoutePill from={r.fromIATA} to={r.toIATA} />
            <span style={{ fontSize: 12.5, fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-900)', flexShrink: 0 }}>
              {r.collected > 0 ? (r.collected / 1000).toFixed(1) + 'k' : '—'}
            </span>
          </div>
          <div style={{ height: 8, background: 'var(--ink-100)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: (r.meter || 0) + '%', background: 'linear-gradient(90deg, var(--brand-300), var(--brand-500))', borderRadius: 999 }} />
          </div>
          {/* TODO: no i18n key for "colis" (parcel count label) and "Facturé" */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 10.5, color: 'var(--ink-400)' }}>
            <span>{r.parcels} colis · {r.weightKg.toLocaleString('fr')} kg</span>
            <span>Facturé {r.invoiced > 0 ? (r.invoiced / 1000).toFixed(1) + 'k CAD' : '—'}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function RankingCard({ title, sub, icon, items }) {
  const t = useAdminT();
  return (
    <ChartCard title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{icon}{title}</span>} sub={sub}>
      {items.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0', color: 'var(--ink-300)', fontSize: 13 }}>
          {t.analytics.empty}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((it, i) => (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ width: 18, fontSize: 11, color: 'var(--ink-400)', fontWeight: 700, fontFamily: 'var(--ff-mono)' }}>{i + 1}.</span>
                {it.color && <Avatar initials={it.name.split(' ').map(x => x[0]).join('').slice(0, 2)} color={it.color} size="sm" />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{it.name}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>{it.sub}</div>
                </div>
                <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>{it.value}</span>
              </div>
              <div style={{ marginLeft: 26 + (it.color ? 30 : 0), height: 3, background: 'var(--ink-100)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: it.meter + '%', background: i === 0 ? 'var(--brand-500)' : 'var(--ink-300)', borderRadius: 999 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}

function RevsVsCostsChart({ months, revenue, costs }) {
  const t = useAdminT();
  if (!months || months.length === 0) return <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-300)', fontSize: 13 }}>{t.analytics.empty}</div>;
  const max = Math.max(...revenue, ...costs, 1);
  const w = 100, h = 140;
  const barW = w / months.length * 0.58;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 160 }}>
        {[0.25, 0.5, 0.75, 1].map((g, i) => (
          <line key={i} x1="0" x2={w} y1={h*(1-g)} y2={h*(1-g)} stroke="var(--border-soft)" strokeWidth=".3" vectorEffect="non-scaling-stroke" />
        ))}
        {months.map((m, i) => {
          if (!revenue[i]) return null;
          const x = (i + 0.5) * (w / months.length) - barW / 2;
          const hRev  = (revenue[i] / max) * h;
          const hCost = ((costs[i] || 0) / max) * h;
          const hMargin = Math.max(0, hRev - hCost);
          return (
            <g key={i}>
              <rect x={x} y={h - hCost}   width={barW} height={hCost   || 0.1} fill="var(--bad-300)"  rx="1.4" vectorEffect="non-scaling-stroke" />
              <rect x={x} y={h - hRev}    width={barW} height={hMargin || 0.1} fill="var(--ok-400)"   rx="1.4" vectorEffect="non-scaling-stroke" />
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${months.length}, 1fr)`, marginTop: 6 }}>
        {months.map((m, i) => (
          <div key={i} style={{ fontSize: 10.5, textAlign: 'center', color: revenue[i] ? 'var(--ink-600)' : 'var(--ink-300)', fontWeight: 500 }}>{m}</div>
        ))}
      </div>
    </div>
  );
}

function LegendItem({ color, label, v }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 10, height: 10, background: color, borderRadius: 2 }} />
      <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>{label}</span>
      <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-800)' }}>{v}</span>
    </div>
  );
}
