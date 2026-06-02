import { useState } from 'react';
import { DATA, getRoute } from '../data.js';
import I from '../components/Icons.jsx';
import { RoutePill, Avatar } from '../components/Shell.jsx';

export default function CampaignFormPage({ mode = 'create', campaign, onNav }) {
  const isEdit = mode === 'edit';
  const routes = DATA.ROUTES.filter(r => r.active);

  const [data, setData] = useState(() => {
    const firstRoute = routes[0];
    return {
      routeId:    campaign?.route    || firstRoute?.id || '',
      code:       campaign?.code     || autoCode(firstRoute),
      depDate:    campaign?.dep      || '',
      arrDate:    '',
      agentOrigin: campaign?.agentOrigin || DATA.AGENTS.find(a => ['Douala', 'Lagos'].includes(a.city))?.id || '',
      agentDest:   campaign?.agentDest   || DATA.AGENTS.find(a => ['Montréal', 'Bruxelles'].includes(a.city))?.id || '',
      notes:      campaign?.notes   || '',
    };
  });

  const upd = (k, v) => setData(d => ({ ...d, [k]: v }));
  const route = getRoute(data.routeId) || routes[0];

  function handleRouteChange(routeId) {
    const r = getRoute(routeId);
    upd('routeId', routeId);
    upd('code', autoCode(r));
  }

  function handleDepDateChange(val) {
    upd('depDate', val);
    if (val && route?.transitDays) {
      const d = new Date(val);
      d.setDate(d.getDate() + route.transitDays);
      upd('arrDate', d.toISOString().slice(0, 10));
    }
  }

  return (
    <div className="page">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ink-400)', marginBottom: 8 }}>
        <a style={{ cursor: 'pointer' }} onClick={() => onNav('/')}>Cargaisons</a>
        <I.ChevronRight style={{ width: 12, height: 12 }} />
        <span style={{ color: 'var(--ink-600)', fontWeight: 600 }}>
          {isEdit ? campaign?.code : 'Nouvelle cargaison'}
        </span>
      </div>

      {/* Page head */}
      <div className="page__head" style={{ marginBottom: 28 }}>
        <div>
          <div className="page__title">
            {isEdit ? 'Modifier la cargaison' : 'Nouvelle cargaison'}
            <span style={{ color: 'var(--ink-400)', fontWeight: 400, fontSize: '.7em', marginLeft: 8 }}>
              / {isEdit ? 'Edit shipment' : 'New shipment'}
            </span>
          </div>
          <div className="page__sub">
            {route
              ? <>{route.fromCity} → {route.toCity} · Transit ~{route.transitDays} jours</>
              : 'Sélectionnez une route'}
          </div>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost" onClick={() => onNav('/')}>Annuler</button>
          <button className="btn btn--brand" onClick={() => onNav('/')}>
            <I.Check />{isEdit ? 'Enregistrer' : 'Créer la cargaison'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 22, alignItems: 'start' }}>
        <div>
          {/* Route */}
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div className="section-title" style={{ marginBottom: 14 }}>
              <I.Plane style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Route
            </div>
            <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
              {routes.map(r => (
                <label key={r.id} style={{
                  display: 'grid', gridTemplateColumns: '20px 1fr auto', gap: 14,
                  padding: '14px 16px',
                  border: '1px solid ' + (data.routeId === r.id ? 'var(--brand-500)' : 'var(--border)'),
                  borderRadius: 'var(--radius)',
                  background: data.routeId === r.id ? 'var(--brand-50)' : 'white',
                  cursor: 'pointer', alignItems: 'center',
                }}>
                  <input type="radio" name="route" checked={data.routeId === r.id}
                    onChange={() => handleRouteChange(r.id)}
                    style={{ accentColor: 'var(--brand-500)' }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                      <RoutePill from={r.fromIATA} to={r.toIATA} />
                      <span style={{ fontWeight: 700, fontSize: 13.5 }}>{r.fromCity} → {r.toCity}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>
                      Transit ~{r.transitDays} j · {r.currency} · Entrepôt {r.warehouseFrom}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 11.5, color: 'var(--ink-400)' }}>
                    <div className="mono" style={{ fontWeight: 600 }}>{r.cargosCount} cargaisons</div>
                    <div>{r.parcelsTotal.toLocaleString('fr')} colis</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="field-row field-row--2">
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Code cargaison <span className="opt">/ Auto</span></label>
                <input className="input mono" value={data.code} onChange={e => upd('code', e.target.value)} />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label" style={{ visibility: 'hidden' }}>—</label>
                <div style={{ padding: '9px 12px', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--ink-500)' }}>
                  Format <span className="mono" style={{ fontWeight: 600 }}>ROUTE-MOIS-NN</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div className="section-title" style={{ marginBottom: 14 }}>
              <I.Calendar style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Dates
            </div>
            <div className="field-row field-row--2">
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Date de départ <span className="opt">/ Departure</span></label>
                <input className="input" type="date" value={data.depDate}
                  onChange={e => handleDepDateChange(e.target.value)} />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Arrivée estimée <span className="opt">/ ETA — auto</span></label>
                <input className="input" type="date" value={data.arrDate}
                  onChange={e => upd('arrDate', e.target.value)} />
                {route && <div className="hint">Départ + {route.transitDays} jours de transit.</div>}
              </div>
            </div>
          </div>

          {/* Équipe */}
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div className="section-title" style={{ marginBottom: 14 }}>
              <I.Users style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Équipe
            </div>
            <div className="field-row field-row--2">
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Responsable origine <span className="opt">/ Origin lead</span></label>
                <select className="select" value={data.agentOrigin} onChange={e => upd('agentOrigin', e.target.value)}>
                  <option value="">— Choisir</option>
                  {DATA.AGENTS.filter(a => ['Douala', 'Lagos'].includes(a.city)).map(a => (
                    <option key={a.id} value={a.id}>{a.name} — {a.city}</option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Responsable destination <span className="opt">/ Dest. lead</span></label>
                <select className="select" value={data.agentDest} onChange={e => upd('agentDest', e.target.value)}>
                  <option value="">— Choisir</option>
                  {DATA.AGENTS.filter(a => ['Montréal', 'Bruxelles'].includes(a.city)).map(a => (
                    <option key={a.id} value={a.id}>{a.name} — {a.city}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div className="section-title" style={{ marginBottom: 14 }}>
              <I.Tag style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Notes internes
            </div>
            <textarea className="textarea" rows={3}
              value={data.notes} onChange={e => upd('notes', e.target.value)}
              placeholder="Conditions particulières, instructions de transport..." />
          </div>
        </div>

        {/* Right: live preview */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, var(--ink-900), var(--ink-800))', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                {route && <RoutePill from={route.fromIATA} to={route.toIATA} />}
                <span className="mono" style={{ fontSize: 13, fontWeight: 700 }}>{data.code || '—'}</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>Aperçu cargaison</div>
            </div>

            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Route', value: route ? `${route.fromCity} → ${route.toCity}` : '—' },
                { label: 'Départ', value: data.depDate || '—' },
                { label: 'Arrivée estimée', value: data.arrDate || '—' },
                { label: 'Devise', value: route?.currency || '—' },
                { label: 'Transit', value: route ? `~${route.transitDays} jours` : '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--ink-400)' }}>{label}</span>
                  <span style={{ fontWeight: 600, color: 'var(--ink-800)' }}>{value}</span>
                </div>
              ))}
            </div>

            {(data.agentOrigin || data.agentDest) && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-soft)', background: 'var(--bg-soft)' }}>
                <div style={{ fontSize: 10.5, color: 'var(--ink-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Équipe</div>
                {[data.agentOrigin, data.agentDest].map((id, i) => {
                  const agent = DATA.AGENTS.find(a => a.id === id);
                  if (!agent) return null;
                  return (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i === 0 ? 6 : 0 }}>
                      <Avatar initials={agent.initials} color={agent.color} size="sm" />
                      <div style={{ fontSize: 12 }}>
                        <span style={{ fontWeight: 600 }}>{agent.name}</span>
                        <span style={{ color: 'var(--ink-400)', marginLeft: 4 }}>· {i === 0 ? 'Origine' : 'Dest.'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function autoCode(route) {
  if (!route) return '';
  const now = new Date();
  const months = ['JAN','FÉV','MAR','AVR','MAI','JUN','JUL','AOÛ','SEP','OCT','NOV','DÉC'];
  return `${route.fromIATA}-${route.toIATA}-${months[now.getMonth()]}-01`;
}
