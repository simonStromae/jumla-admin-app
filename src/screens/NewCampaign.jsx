import { useState } from 'react';
import { DATA, getRoute } from '../data.js';
import I from '../components/Icons.jsx';
import { RoutePill, Modal, Avatar } from '../components/Shell.jsx';
import { useAdminT } from '../lib/useAdminT.js';

export default function NewCampaignWizard({ onClose, onCreated, mode = 'create', initial }) {
  const t = useAdminT();
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
      { from: 0,  to: 5,   rate: 18 },
      { from: 5,  to: 10,  rate: 16 },
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
    teamMembers: initial?.teamMembers || ['ag1', 'ag2', 'ag5'],
    notes: initial?.notes || '',
  }));

  const steps = [
    { id: 'route',    label: t.campaigns.wizard.steps.route,   sub: /* TODO: i18n */ 'Trajet & dates' },
    { id: 'capacity', label: /* TODO: i18n */ 'Capacité',       sub: /* TODO: i18n */ 'Volumes' },
    { id: 'pricing',  label: t.campaigns.wizard.steps.pricing, sub: /* TODO: i18n */ 'Grille & frais' },
    { id: 'costs',    label: /* TODO: i18n */ 'Coûts',          sub: /* TODO: i18n */ 'Internes' },
    { id: 'team',     label: /* TODO: i18n */ 'Équipe',         sub: /* TODO: i18n */ 'Agents' },
    { id: 'review',   label: t.campaigns.wizard.steps.review,  sub: /* TODO: i18n */ 'Création' },
  ];

  const upd = (k, v) => setData(d => ({ ...d, [k]: v }));
  const route = getRoute(data.routeId);

  return (
    <Modal width={920} onClose={onClose} ariaLabel={/* TODO: i18n */ 'Wizard nouvelle cargaison'}
      title={
        <span>{mode === 'edit' ? /* TODO: i18n */ 'Modifier la cargaison' : t.campaigns.new}
        </span>
      }
      sub={mode === 'edit' ? data.code : /* TODO: i18n */ 'Configurez votre cargaison étape par étape'}
      footer={
        <>
          {step > 0 && <button className="btn btn--ghost" onClick={() => setStep(step - 1)}><I.ArrowLeft />{t.common.previous}</button>}
          <div className="spacer" style={{ flex: 1 }} />
          {/* TODO: i18n - no key for "Étape" */}
          <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>Étape {step + 1} / {steps.length}</span>
          {step < steps.length - 1
            ? <button className="btn btn--brand" onClick={() => setStep(step + 1)}>{t.common.next}<I.ArrowRight /></button>
            : <button className="btn btn--brand" onClick={onCreated}><I.Check />{mode === 'edit' ? t.common.save : t.campaigns.wizard.actions.create}</button>}
        </>
      }>

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 0 }}>
        {steps.map((s, i) => (
          <div key={s.id} style={{ display: 'contents' }}>
            <div onClick={() => setStep(i)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', opacity: i > step ? 0.5 : 1 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 999,
                background: i < step ? 'var(--ok-500)' : i === step ? 'var(--brand-500)' : 'var(--bg-soft)',
                color: i <= step ? 'white' : 'var(--ink-400)',
                border: i <= step ? 'none' : '1px solid var(--border)',
                display: 'grid', placeItems: 'center',
                fontSize: 11, fontWeight: 700, flex: '0 0 24px',
              }}>
                {i < step ? <I.Check style={{ width: 13, height: 13 }} /> : i + 1}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: i <= step ? 'var(--ink-800)' : 'var(--ink-400)' }}>{s.label}</span>
                <span style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>{s.sub}</span>
              </div>
            </div>
            {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? 'var(--ok-500)' : 'var(--border)', margin: '0 12px', borderRadius: 999 }} />}
          </div>
        ))}
      </div>

      {step === 0 && <StepRoute data={data} upd={upd} />}
      {step === 1 && <StepCapacity data={data} upd={upd} />}
      {step === 2 && <StepPricing data={data} upd={upd} route={route} />}
      {step === 3 && <StepCosts data={data} upd={upd} />}
      {step === 4 && <StepTeam data={data} upd={upd} />}
      {step === 5 && <StepReview data={data} route={route} />}
    </Modal>
  );
}

function StepRoute({ data, upd }) {
  const t = useAdminT();
  const routes = DATA.ROUTES.filter(r => r.active);
  const selectedRoute = getRoute(data.routeId);
  return (
    <div>
      {/* TODO: i18n - no key for this heading */}
      <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, letterSpacing: '-.01em' }}>Quelle route empruntez-vous ?</h4>
      {/* TODO: i18n - no key for this description */}
      <p style={{ margin: '0 0 18px', color: 'var(--ink-400)', fontSize: 13 }}>
        La cargaison héritera des paramètres par défaut de la route. Vous pourrez les ajuster.
      </p>

      <div style={{ display: 'grid', gap: 10, marginBottom: 22 }}>
        {routes.map(r => (
          <label key={r.id} style={{
            display: 'grid', gridTemplateColumns: '20px 1fr auto', gap: 14,
            padding: '14px 16px', border: '1px solid ' + (data.routeId === r.id ? 'var(--brand-500)' : 'var(--border)'),
            borderRadius: 10, background: data.routeId === r.id ? 'var(--brand-50)' : 'white',
            cursor: 'pointer', alignItems: 'center',
          }}>
            <input type="radio" name="route" checked={data.routeId === r.id} onChange={() => upd('routeId', r.id)} style={{ accentColor: 'var(--brand-500)' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <RoutePill from={r.fromIATA} to={r.toIATA} />
                <span style={{ fontWeight: 700, fontSize: 13.5 }}>{r.fromCity} → {r.toCity}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>
                {/* TODO: i18n - no key for "Transit moyen" or "Entrepôt départ" */}
                Transit moyen <strong>{r.transitDays} j</strong> · {t.common.currency} <strong>{r.currency}</strong> · Entrepôt départ <strong>{r.warehouseFrom}</strong>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 11.5, color: 'var(--ink-400)' }}>
              {/* TODO: i18n - no key for "cargaisons" or "colis livrés" labels */}
              <div className="mono" style={{ fontWeight: 600 }}>{r.cargosCount} cargaisons</div>
              <div>{r.parcelsTotal.toLocaleString('fr')} colis livrés</div>
            </div>
          </label>
        ))}
      </div>

      <div className="field-row field-row--2">
        <div className="field">
          {/* TODO: i18n - no key for "Code cargaison" */}
          <label className="label">Code cargaison</label>
          <input className="input mono" value={data.code} onChange={e => upd('code', e.target.value)} />
          {/* TODO: i18n - no key for this hint */}
          <div className="hint">Auto-généré. Format : <code style={{ background: 'var(--bg-soft)', padding: '1px 5px', borderRadius: 3 }}>ROUTE-MOIS-NN</code></div>
        </div>
        <div className="field">
          <label className="label">{t.common.currency}</label>
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
          <label className="label">{t.campaigns.fields.departure}</label>
          <input className="input" type="date" value={data.depDate} onChange={e => upd('depDate', e.target.value)} />
        </div>
        <div className="field">
          <label className="label">{t.campaigns.fields.arrival}</label>
          <input className="input" type="date" value={data.arrDate} onChange={e => upd('arrDate', e.target.value)} />
          {/* TODO: i18n - no key for this calculated hint */}
          <div className="hint">Calculé automatiquement : départ + {selectedRoute?.transitDays} jours.</div>
        </div>
      </div>
    </div>
  );
}

function StepCapacity({ data, upd }) {
  const t = useAdminT();
  const pct = Math.round(data.capacityReserved / data.capacityMax * 100);
  return (
    <div>
      {/* TODO: i18n - no key for "Capacité de la cargaison" */}
      <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, letterSpacing: '-.01em' }}>Capacité de la cargaison</h4>
      {/* TODO: i18n - no key for this description */}
      <p style={{ margin: '0 0 18px', color: 'var(--ink-400)', fontSize: 13 }}>Définissez la capacité maximale et le volume déjà réservé.</p>

      <div className="field-row field-row--2">
        <div className="field">
          <label className="label">{t.campaigns.wizard.fields.maxCapacity}</label>
          <div style={{ position: 'relative' }}>
            <input className="input mono" type="number" value={data.capacityMax} onChange={e => upd('capacityMax', +e.target.value)} style={{ paddingRight: 36 }} />
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)', fontSize: 12 }}>kg</span>
          </div>
        </div>
        <div className="field">
          {/* TODO: i18n - no key for "Capacité réservée" */}
          <label className="label">Capacité réservée (kg)</label>
          <div style={{ position: 'relative' }}>
            <input className="input mono" type="number" value={data.capacityReserved} onChange={e => upd('capacityReserved', +e.target.value)} style={{ paddingRight: 36 }} />
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)', fontSize: 12 }}>kg</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 8, padding: 16, background: 'var(--bg-soft)', border: '1px solid var(--border-soft)', borderRadius: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          {/* TODO: i18n - no key for "Taux de remplissage" */}
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>Taux de remplissage</span>
          <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: pct > 90 ? 'var(--bad-600)' : pct > 75 ? 'var(--warn-700)' : 'var(--ok-600)' }}>{pct}%</span>
        </div>
        <div style={{ height: 12, background: 'white', border: '1px solid var(--border)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: pct + '%', background: pct > 90 ? 'var(--bad-500)' : pct > 75 ? 'var(--warn-500)' : 'var(--ok-500)', borderRadius: 999 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11.5, color: 'var(--ink-500)' }}>
          {/* TODO: i18n - no keys for "réservés" / "disponibles" */}
          <span><strong className="mono">{data.capacityReserved.toLocaleString('fr')} kg</strong> réservés</span>
          <span><strong className="mono">{(data.capacityMax - data.capacityReserved).toLocaleString('fr')} kg</strong> disponibles</span>
        </div>
      </div>
    </div>
  );
}

function StepPricing({ data, upd, route }) {
  const t = useAdminT();
  const updRow = (i, k, v) => {
    const next = [...data.pricing];
    next[i] = { ...next[i], [k]: v };
    upd('pricing', next);
  };
  const addRow = () => {
    const last = data.pricing[data.pricing.length - 1];
    upd('pricing', [...data.pricing, { from: last.to, to: last.to + 10, rate: last.rate - 1 }]);
  };
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <div>
          {/* TODO: i18n - no key for "Grille tarifaire & frais" */}
          <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, letterSpacing: '-.01em' }}>Grille tarifaire & frais</h4>
          {/* TODO: i18n - no key for this description */}
          <p style={{ margin: 0, color: 'var(--ink-400)', fontSize: 13 }}>Hérité de la route <strong>{route?.code}</strong>. Modifiable pour cette cargaison.</p>
        </div>
        {/* TODO: i18n - no key for "Réinitialiser route" */}
        <button className="btn btn--ghost btn--sm"><I.Refresh />Réinitialiser route</button>
      </div>

      {/* TODO: i18n - no key for "Grille par tranche de poids" */}
      <div className="section-title">Grille par tranche de poids <span className="section-title__count">{data.pricing.length}</span></div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 18 }}>
        <table className="tbl tbl--compact" style={{ borderRadius: 0 }}>
          <thead>
            <tr>
              {/* TODO: i18n - no keys for "De (kg)" / "À (kg)" / "Tarif / kg" table headers */}
              <th style={{ borderRadius: 0 }}>De (kg)</th>
              <th>À (kg)</th>
              <th>Prix/kg ({data.currency})</th>
              <th style={{ borderRadius: 0, width: 30 }}></th>
            </tr>
          </thead>
          <tbody>
            {data.pricing.map((row, i) => (
              <tr key={i}>
                <td><input className="input input--sm mono" type="number" value={row.from} onChange={e => updRow(i, 'from', +e.target.value)} /></td>
                <td><input className="input input--sm mono" type="number" value={row.to} onChange={e => updRow(i, 'to', +e.target.value)} /></td>
                <td><input className="input input--sm mono" type="number" value={row.rate} onChange={e => updRow(i, 'rate', +e.target.value)} /></td>
                <td><button className="icon-btn"><I.Trash style={{ width: 14, height: 14 }} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* TODO: i18n - no key for "Ajouter une tranche" */}
      <button className="btn btn--ghost btn--sm" onClick={addRow}><I.Plus />Ajouter une tranche</button>

      <div className="divider"></div>
      <div className="field-row field-row--3">
        {[
          { label: /* TODO: i18n */ 'Dépassement de poids', key: 'overrunRate', suffix: `${data.currency}/kg` },
          { label: /* TODO: i18n */ 'Livraison à domicile', key: 'deliveryFee', suffix: data.currency },
          { label: t.costs.categories.handling, key: 'handlingFee', suffix: data.currency },
        ].map(({ label, key, suffix }) => (
          <div key={key} className="field">
            <label className="label">{label}</label>
            <div style={{ position: 'relative' }}>
              <input className="input mono" type="number" value={data[key]} onChange={e => upd(key, +e.target.value)} style={{ paddingRight: 60 }} />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)', fontSize: 11 }}>{suffix}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepCosts({ data, upd }) {
  const t = useAdminT();
  const total = data.internalTransport + data.internalCustoms + data.internalWarehouse;
  const estRevenue = data.capacityReserved * 14;
  const margin = estRevenue - total;
  return (
    <div>
      {/* TODO: i18n - no key for "Coûts internes" */}
      <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, letterSpacing: '-.01em' }}>Coûts internes</h4>
      {/* TODO: i18n - no key for this description */}
      <p style={{ margin: '0 0 18px', color: 'var(--ink-400)', fontSize: 13 }}>Pour le calcul de marge. Visibles aux admins uniquement.</p>

      <div className="field-row field-row--3">
        {[
          { label: 'Transport', key: 'internalTransport' },
          { label: t.costs.categories.customs, key: 'internalCustoms' },
          { label: /* TODO: i18n - no key for warehouse/entrepôt */ 'Entrepôt & logistique', key: 'internalWarehouse' },
        ].map(({ label, key }) => (
          <div key={key} className="field">
            <label className="label">{label}</label>
            <div style={{ position: 'relative' }}>
              <input className="input mono" type="number" value={data[key]} onChange={e => upd(key, +e.target.value)} style={{ paddingRight: 50 }} />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)', fontSize: 11 }}>{data.currency}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="field">
        <label className="label">{t.common.notes}</label>
        {/* TODO: i18n - no key for this placeholder text */}
        <textarea className="textarea" placeholder="Devis fournisseur, conditions particulières..." value={data.notes} onChange={e => upd('notes', e.target.value)} rows={3} />
      </div>

      <div style={{ marginTop: 16, padding: 18, background: 'linear-gradient(135deg, var(--ink-900), var(--ink-800))', color: 'white', borderRadius: 10 }}>
        {/* TODO: i18n - no keys for margin estimation labels */}
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', color: 'rgba(255,255,255,.5)', marginBottom: 12, fontWeight: 600 }}>
          Estimation de marge <span style={{ color: 'rgba(255,255,255,.4)' }}>· capacité réservée × 14 CAD/kg</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            { l: /* TODO: i18n */ 'CA estimé',            v: estRevenue, sign: '' },
            { l: /* TODO: i18n */ 'Coûts totaux',         v: total,      sign: '−' },
            { l: /* TODO: i18n */ 'Marge prévisionnelle', v: margin,     sign: '+', gold: true },
          ].map(({ l, v, sign, gold }, i) => (
            <div key={i}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginBottom: 4 }}>{l}</div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: gold ? '#00B4D8' : 'white' }}>
                {sign}{v.toLocaleString('fr')} <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>{data.currency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepTeam({ data, upd }) {
  const t = useAdminT();
  const agents = DATA.AGENTS;
  return (
    <div>
      {/* TODO: i18n - no key for "Équipe en charge" */}
      <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, letterSpacing: '-.01em' }}>Équipe en charge</h4>
      {/* TODO: i18n - no key for this description */}
      <p style={{ margin: '0 0 18px', color: 'var(--ink-400)', fontSize: 13 }}>Définissez les responsables et l'équipe opérationnelle.</p>

      <div className="field-row field-row--2">
        <div className="field">
          {/* TODO: i18n - no key for "Responsable origine" */}
          <label className="label">Responsable origine</label>
          <select className="select" value={data.agentOrigin} onChange={e => upd('agentOrigin', e.target.value)}>
            {agents.filter(a => ['Douala', 'Lagos'].includes(a.city)).map(a => (
              <option key={a.id} value={a.id}>{a.name} — {a.city}</option>
            ))}
          </select>
        </div>
        <div className="field">
          {/* TODO: i18n - no key for "Responsable destination" */}
          <label className="label">Responsable destination</label>
          <select className="select" value={data.agentDest} onChange={e => upd('agentDest', e.target.value)}>
            {agents.filter(a => ['Montréal', 'Bruxelles'].includes(a.city)).map(a => (
              <option key={a.id} value={a.id}>{a.name} — {a.city}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TODO: i18n - no key for "Équipe opérationnelle" */}
      <div className="section-title" style={{ marginTop: 12 }}>
        Équipe opérationnelle <span className="section-title__count">{data.teamMembers.length}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {agents.map(a => {
          const sel = data.teamMembers.includes(a.id);
          return (
            <label key={a.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              border: '1px solid ' + (sel ? 'var(--brand-300)' : 'var(--border)'),
              borderRadius: 8, cursor: 'pointer',
              background: sel ? 'var(--brand-50)' : 'white',
            }}>
              <input type="checkbox" checked={sel} style={{ accentColor: 'var(--brand-500)' }}
                onChange={() => {
                  if (sel) upd('teamMembers', data.teamMembers.filter(x => x !== a.id));
                  else upd('teamMembers', [...data.teamMembers, a.id]);
                }} />
              <Avatar initials={a.initials} color={a.color} size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>{a.city} · {a.role === 'admin' ? 'Admin' : 'Agent'}</div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function StepReview({ data, route }) {
  const t = useAdminT();
  const total = data.internalTransport + data.internalCustoms + data.internalWarehouse;
  return (
    <div>
      <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, letterSpacing: '-.01em' }}>{t.campaigns.wizard.steps.review}</h4>
      {/* TODO: i18n - no key for this description */}
      <p style={{ margin: '0 0 18px', color: 'var(--ink-400)', fontSize: 13 }}>Vérifiez les informations avant de créer la cargaison.</p>

      <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', background: 'var(--bg-soft)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <RoutePill from={route?.fromIATA} to={route?.toIATA} />
          <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>{data.code}</span>
          <div className="spacer" style={{ flex: 1 }} />
          <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>{t.common.currency} <strong>{data.currency}</strong></span>
        </div>
        <div style={{ padding: 18, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {[
            { label: t.campaigns.table.route,            value: `${route?.fromCity} → ${route?.toCity}` },
            { label: /* TODO: i18n */ 'Transit',         value: `${route?.transitDays} jours` },
            { label: t.campaigns.fields.departure,             value: data.depDate },
            { label: t.campaigns.fields.arrival,               value: data.arrDate },
            { label: t.campaigns.wizard.fields.maxCapacity,    value: `${data.capacityMax.toLocaleString('fr')} kg` },
            { label: /* TODO: i18n */ 'Capacité réservée', value: `${data.capacityReserved.toLocaleString('fr')} kg` },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid var(--border-soft)', padding: 18 }}>
          <div className="section-title" style={{ marginBottom: 8 }}>{t.campaigns.wizard.steps.pricing}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {data.pricing.map((r, i) => (
              <span key={i} style={{ padding: '4px 10px', borderRadius: 999, background: 'var(--bg-soft)', fontSize: 11.5 }} className="mono">
                {r.from}–{r.to} kg → <strong>{r.rate} {data.currency}/kg</strong>
              </span>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--border-soft)', padding: 18, background: 'var(--bg-soft)' }}>
          {/* TODO: i18n - no key for "Coûts internes (admin)" */}
          <div className="section-title" style={{ marginBottom: 8 }}>Coûts internes (admin)</div>
          <div className="mono" style={{ fontSize: 13, color: 'var(--ink-700)' }}>
            {'Transport'} <strong>{data.internalTransport.toLocaleString('fr')}</strong> + {t.costs.categories.customs} <strong>{data.internalCustoms.toLocaleString('fr')}</strong> + {/* TODO: i18n - no key for Entrepôt */}Entrepôt <strong>{data.internalWarehouse.toLocaleString('fr')}</strong> = <strong style={{ color: 'var(--ink-900)' }}>{total.toLocaleString('fr')} {data.currency}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
