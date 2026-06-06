import { useState, useEffect } from 'react';
import I from '../components/Icons.jsx';
import { RoutePill, Avatar } from '../components/Shell.jsx';

function autoCode(route) {
  if (!route) return '';
  const now = new Date();
  const months = ['JAN','FEV','MAR','AVR','MAI','JUN','JUL','AOU','SEP','OCT','NOV','DEC'];
  return `${route.fromIATA}-${route.toIATA}-${months[now.getMonth()]}-01`;
}

export default function CampaignFormPage({ mode = 'create', campaign, onNav }) {
  const isEdit = mode === 'edit';

  const [routes, setRoutes]   = useState([]);
  const [agents, setAgents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState('');

  const [data, setData] = useState({
    routeId:     campaign?.route    || '',
    code:        campaign?.code     || '',
    depDate:     campaign?.dep      || '',
    arrDate:     '',
    capacityKg:  '',
    agentOrigin: '',
    agentDest:   '',
    notes:       '',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/routes').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
    ]).then(([routeData, userData]) => {
      const activeRoutes = Array.isArray(routeData) ? routeData.filter(r => r.active) : [];
      const allAgents = Array.isArray(userData) ? userData : [];
      setRoutes(activeRoutes);
      setAgents(allAgents);
      if (!isEdit && activeRoutes.length > 0 && !data.routeId) {
        const first = activeRoutes[0];
        setData(d => ({ ...d, routeId: first.id, code: autoCode(first) }));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const upd = (k, v) => setData(d => ({ ...d, [k]: v }));
  const route = routes.find(r => r.id === data.routeId) || null;

  function handleRouteChange(routeId) {
    const r = routes.find(x => x.id === routeId);
    setData(d => ({ ...d, routeId, code: autoCode(r) }));
  }

  async function handleSubmit() {
    if (!data.routeId) { setErr('Veuillez sélectionner une route'); return; }
    if (!data.code.trim()) { setErr('Le code de cargaison est obligatoire'); return; }
    setSaving(true); setErr('');
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code:          data.code.trim(),
          routeId:       data.routeId,
          departureDate: data.depDate || null,
          arrivalDate:   data.arrDate || null,
          capacityKg:    data.capacityKg ? Number(data.capacityKg) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setErr(json.error || 'Erreur lors de la création'); setSaving(false); return; }
      onNav('/');
    } catch { setErr('Erreur réseau'); setSaving(false); }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="page__head" style={{ marginBottom: 28 }}>
          <div className="page__title">{isEdit ? 'Modifier la cargaison' : 'Nouvelle cargaison'}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--ink-400)', fontSize: 14 }}>
          Chargement en cours…
        </div>
      </div>
    );
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
            {route ? `${route.fromIATA} → ${route.toIATA} · ${route.label || route.code}` : 'Sélectionnez une route'}
          </div>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost" onClick={() => onNav('/')}>Annuler</button>
          <button className="btn btn--brand" onClick={handleSubmit} disabled={saving}>
            <I.Check />{saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer la cargaison'}
          </button>
        </div>
      </div>

      {err && (
        <div style={{ padding: '10px 16px', background: 'var(--bad-50)', color: 'var(--bad-700)', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
          {err}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 22, alignItems: 'start' }}>
        <div>
          {/* Route */}
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div className="section-title" style={{ marginBottom: 14 }}>
              <I.Plane style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Route
            </div>

            {routes.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-soft)', borderRadius: 8, color: 'var(--ink-400)', fontSize: 13 }}>
                Aucune route active. <a style={{ color: 'var(--brand-600)', cursor: 'pointer', fontWeight: 600 }} onClick={() => onNav('/admin/settings')}>Créer une route dans les paramètres →</a>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
                {routes.map(r => (
                  <label key={r.id} style={{
                    display: 'grid', gridTemplateColumns: '20px 1fr',
                    gap: 14, padding: '14px 16px',
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
                        <span style={{ fontWeight: 700, fontSize: 13.5 }}>{r.label || r.code}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>
                        {r.fromIATA} → {r.toIATA}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="field-row field-row--2">
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Code cargaison <span className="opt">/ Auto</span></label>
                <input className="input mono" value={data.code} onChange={e => upd('code', e.target.value)} />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Capacité (kg) <span className="opt">/ optionnel</span></label>
                <input className="input mono" type="number" value={data.capacityKg}
                  onChange={e => upd('capacityKg', e.target.value)} placeholder="ex: 500" />
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
                  onChange={e => upd('depDate', e.target.value)} />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Arrivée estimée <span className="opt">/ ETA</span></label>
                <input className="input" type="date" value={data.arrDate}
                  onChange={e => upd('arrDate', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Équipe */}
          {agents.length > 0 && (
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <div className="section-title" style={{ marginBottom: 14 }}>
                <I.Users style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Équipe <span style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 400 }}>(optionnel)</span>
              </div>
              <div className="field-row field-row--2">
                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="label">Responsable origine</label>
                  <select className="select" value={data.agentOrigin} onChange={e => upd('agentOrigin', e.target.value)}>
                    <option value="">— Choisir</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.name}{a.city && a.city !== '—' ? ` — ${a.city}` : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="label">Responsable destination</label>
                  <select className="select" value={data.agentDest} onChange={e => upd('agentDest', e.target.value)}>
                    <option value="">— Choisir</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.name}{a.city && a.city !== '—' ? ` — ${a.city}` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

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
                { label: 'Route',           value: route ? `${route.fromIATA} → ${route.toIATA}` : '—' },
                { label: 'Libellé',         value: route?.label || '—' },
                { label: 'Départ',          value: data.depDate || '—' },
                { label: 'Arrivée estimée', value: data.arrDate || '—' },
                { label: 'Capacité',        value: data.capacityKg ? `${data.capacityKg} kg` : '—' },
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
                {[
                  { id: data.agentOrigin, role: 'Origine' },
                  { id: data.agentDest,   role: 'Dest.' },
                ].map(({ id, role }) => {
                  if (!id) return null;
                  const agent = agents.find(a => a.id === id);
                  if (!agent) return null;
                  return (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Avatar initials={agent.initials} color={agent.color} size="sm" />
                      <div style={{ fontSize: 12 }}>
                        <span style={{ fontWeight: 600 }}>{agent.name}</span>
                        <span style={{ color: 'var(--ink-400)', marginLeft: 4 }}>· {role}</span>
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
