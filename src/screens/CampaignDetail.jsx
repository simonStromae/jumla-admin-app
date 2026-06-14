import { useState, useEffect } from 'react';
import I from '../components/Icons.jsx';
import { RoutePill, Avatar, Modal } from '../components/Shell.jsx';

// Main linear flow (shown in timeline)
const STEPS = [
  { id: 'enr', label: 'Enregistré',               icon: '📝', color: '#6b7280' },
  { id: 'rec', label: 'Reçu à l\'entrepôt',        icon: '📥', color: '#2563eb' },
  { id: 'pre', label: 'Vérifié et préparé',        icon: '🔍', color: '#7c3aed' },
  { id: 'exp', label: 'Expédié',                   icon: '🚀', color: '#0e7490' },
  { id: 'tra', label: 'En transit',                icon: '✈️', color: '#0891b2' },
  { id: 'apd', label: 'Arrivé au pays de dest.',   icon: '🛬', color: '#16a34a' },
  { id: 'dou', label: 'Présenté aux douanes',      icon: '🛃', color: '#d97706' },
  { id: 'ins', label: 'En inspection douanière',   icon: '🔎', color: '#c2410c' },
  { id: 'ret', label: 'Retenu par les douanes',    icon: '⚠️', color: '#dc2626' },
  { id: 'lib', label: 'Libéré par les douanes',    icon: '✅', color: '#16a34a' },
  { id: 'ard', label: 'Arrivé entrepôt de dest.',  icon: '🏭', color: '#15803d' },
  { id: 'ver', label: 'Vérification finale',       icon: '🔬', color: '#0e7490' },
  { id: 'pdl', label: 'Prêt pour livraison',       icon: '📦', color: '#0891b2' },
  { id: 'liv', label: 'En cours de livraison',     icon: '🚚', color: '#0891b2' },
  { id: 'ok',  label: 'Livré',                     icon: '🎉', color: '#15803d' },
];

// Exceptional statuses (select only, not in main timeline)
const EXCEPT_STEPS = [
  { id: 'adr', label: 'Adresse incomplète',     icon: '📍', color: '#dc2626' },
  { id: 'tdl', label: 'Tentative de livraison', icon: '🔔', color: '#d97706' },
  { id: 'rte', label: 'Retour à l\'entrepôt',   icon: '↩️', color: '#7c3aed' },
  { id: 'dom', label: 'Colis endommagé',         icon: '💥', color: '#dc2626' },
  { id: 'cla', label: 'Réclamation ouverte',     icon: '📋', color: '#dc2626' },
];

const ALL_STEPS = [...STEPS, ...EXCEPT_STEPS];

const STEP_LABELS = Object.fromEntries(ALL_STEPS.map(s => [s.id, s.label]));
const STEP_ICONS  = Object.fromEntries(ALL_STEPS.map(s => [s.id, s.icon]));

const STEP_EFFECTS = {
  rec: 'Les colis enregistrés (ENR) seront considérés comme reçus à l\'entrepôt.',
  pre: 'Les colis reçus (REC) sont vérifiés et prêts pour l\'expédition.',
  exp: 'Tous les colis reçus/préparés (REC, PRE) seront automatiquement passés à "Expédié" (EXP).',
  tra: 'La cargaison est en transit — second tronçon.',
  apd: 'La cargaison est arrivée au pays de destination.',
  dou: 'La cargaison est présentée aux douanes.',
  ins: 'La cargaison est en inspection douanière.',
  ret: 'La cargaison est retenue par les douanes.',
  lib: 'La cargaison a été libérée par les douanes.',
  ard: 'Tous les colis expédiés/en transit (EXP, TRA, APD) seront passés à "Arrivé entrepôt destination" (ARD).',
  ver: 'Vérification finale avant mise à disposition.',
  pdl: 'La cargaison est prête pour la livraison ou le retrait.',
  liv: 'La cargaison est en cours de livraison.',
  ok:  'La cargaison sera définitivement clôturée. Cette action est irréversible.',
  adr: 'Adresse de livraison incomplète — action requise.',
  tdl: 'Tentative de livraison effectuée sans succès.',
  rte: 'La cargaison est retournée à l\'entrepôt.',
  dom: 'Colis endommagé — ouverture de dossier.',
  cla: 'Réclamation ouverte — en attente de traitement.',
};

const PAYMENT_STATUS = {
  completed: { label: 'Payé',       cls: 'ok' },
  pending:   { label: 'En attente', cls: 'warn' },
  failed:    { label: 'Échoué',     cls: 'bad' },
};
const PARCEL_STATUS = {
  enr: 'Enregistré',  rec: 'Reçu entrepôt',    pre: 'Vérifié/Préparé',
  exp: 'Expédié',     tra: 'En transit',        apd: 'Arrivé pays dest.',
  dou: 'Aux douanes', ins: 'Inspection',        ret: 'Retenu',
  lib: 'Libéré',      ard: 'Entrepôt dest.',    ver: 'Vérification',
  pdl: 'Prêt livr.',  liv: 'En livraison',      ok: 'Livré',
  adr: 'Adr. incompl.', tdl: 'Tent. livr.',     rte: 'Retour entrepôt',
  dom: 'Endommagé',   cla: 'Réclamation',
};

export default function CampaignDetailScreen({ id, onNav }) {
  const [campaign,           setCampaign]           = useState(null);
  const [loading,            setLoading]            = useState(true);
  const [advancing,          setAdvancing]          = useState(false);
  const [advanceError,       setAdvanceError]       = useState('');
  const [showConfirmModal,   setShowConfirmModal]   = useState(null); // nextStep
  const [showDepartureModal, setShowDepartureModal] = useState(null); // targetStep
  const [statusNotes,        setStatusNotes]        = useState({});

  useEffect(() => {
    fetch('/api/campaigns/' + id)
      .then(r => r.json())
      .then(c => {
        setCampaign(c);
        setStatusNotes(c.statusNotes ?? {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
        <div style={{ textAlign: 'center', color: 'var(--ink-400)' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 14 }}>Chargement de la cargaison…</div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
        <div style={{ textAlign: 'center', color: 'var(--ink-400)' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-700)' }}>Cargaison introuvable</div>
          <button className="btn btn--ghost" style={{ marginTop: 16 }} onClick={() => onNav('/')}>← Retour</button>
        </div>
      </div>
    );
  }

  const parcels = campaign.parcels || [];
  const totalWeight = parcels.reduce((s, p) => s + (p.weightKg || 0), 0);
  const invoiced    = parcels.reduce((s, p) => s + (p.payment?.amount ?? p.priceXaf ?? 0), 0);
  const collected   = parcels.reduce((s, p) => s + (p.payment?.status === 'completed' ? (p.payment.amount || 0) : 0), 0);
  const outstanding = invoiced - collected;
  const pct = invoiced > 0 ? Math.round(collected / invoiced * 100) : 0;

  const currentStepIdx = STEPS.findIndex(s => s.id === campaign.status);
  const nextStep = currentStepIdx >= 0 && currentStepIdx < STEPS.length - 1 ? STEPS[currentStepIdx + 1] : null;
  const currentStepInfo = ALL_STEPS.find(s => s.id === campaign.status);

  const unpaidCount = parcels.filter(p => p.payment?.status !== 'completed').length;

  async function doAdvance(targetStep, note) {
    setAdvancing(true);
    setAdvanceError('');
    try {
      const res = await fetch('/api/campaigns/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStep.id, ...(note && { statusNote: note }) }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAdvanceError(json.error || `Erreur ${res.status}`);
      } else {
        const updated = await fetch('/api/campaigns/' + id).then(r => r.json());
        setCampaign(updated);
        setStatusNotes(updated.statusNotes ?? {});
      }
    } catch {
      setAdvanceError('Erreur réseau — réessayez.');
    } finally {
      setAdvancing(false);
    }
  }

  function handleAdvance() {
    if (!nextStep) return;
    setAdvanceError('');
    if (nextStep.id === 'exp' || nextStep.id === 'tra') {
      setShowDepartureModal(nextStep);
      return;
    }
    setShowConfirmModal(nextStep);
  }

  const route = campaign.route || {};
  const depDate = campaign.departureDate ? new Date(campaign.departureDate).toLocaleDateString('fr-CA') : '—';
  const arrDate = campaign.arrivalDate ? new Date(campaign.arrivalDate).toLocaleDateString('fr-CA') : '—';

  return (
    <div className="page">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ink-400)', marginBottom: 8 }}>
        <a style={{ cursor: 'pointer' }} onClick={() => onNav('/')}>Cargaisons</a>
        <I.ChevronRight style={{ width: 12, height: 12 }} />
        <span style={{ color: 'var(--ink-600)', fontWeight: 600 }}>{campaign.code}</span>
      </div>

      {/* Header */}
      <div className="page__head" style={{ marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h1 className="page__title" style={{ margin: 0 }}>{campaign.code}</h1>
            {route.origin && route.destination && (
              <RoutePill from={route.origin} to={route.destination} size="lg" />
            )}
            {campaign.status && (
              <span
                className="badge badge--dot badge--neutral"
                style={{ color: currentStepInfo?.color }}
              >
                {currentStepInfo?.icon} {STEP_LABELS[campaign.status] || campaign.status}
              </span>
            )}
          </div>
          <div className="page__sub">
            <I.Calendar style={{ width: 12, height: 12, display: 'inline', verticalAlign: -2, marginRight: 4 }} />
            Départ <strong style={{ color: 'var(--ink-700)' }}>{depDate}</strong>
            {' · '}
            Arrivée estimée <strong style={{ color: 'var(--ink-700)' }}>{arrDate}</strong>
          </div>
        </div>
        <div className="page__actions">
          <button onClick={() => onNav('/messaging?campaignId=' + campaign.id)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 8,
            border: '1px solid #25D366', background: 'white',
            color: '#25D366', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M17.5 14.4c-.3-.1-1.7-.9-2-1s-.5-.1-.7.1c-.2.3-.7 1-.9 1.1-.2.2-.3.2-.6 0-.3-.1-1.2-.5-2.3-1.4-.8-.7-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5 0-.2 0-.4-.1-.5 0-.1-.7-1.6-1-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.4-.3.3-1 1-1 2.4s1 2.8 1.2 3.1c.2.2 2 3 4.8 4.3.7.3 1.2.4 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.3.3-.7.3-1.2.2-1.3-.1-.2-.3-.3-.6-.4zM12 21a9 9 0 0 1-4.6-1.3L3 21l1.3-4.3A9 9 0 1 1 12 21z" /></svg>
            WhatsApp groupe
          </button>
          {campaign.status === 'enr' && (
            <button
              className="btn btn--brand"
              onClick={() => onNav('/parcels/new?campaign=' + id)}
            >
              <I.Plus />Ajouter un colis
            </button>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
        {[
          { l: 'Colis',             v: parcels.length,                          u: '' },
          { l: 'Poids total',       v: totalWeight.toLocaleString('fr'),         u: 'kg' },
          { l: 'Facturé',           v: invoiced.toLocaleString('fr'),            u: 'CAD' },
          { l: 'Perçu',             v: collected.toLocaleString('fr'),           u: 'CAD', col: 'var(--ok-600)' },
          { l: 'Reste à percevoir', v: outstanding.toLocaleString('fr'),         u: 'CAD', col: outstanding > 0 ? 'var(--bad-600)' : 'var(--ok-600)' },
          { l: 'Taux recouvrement', v: pct,                                      u: '%',   col: pct >= 95 ? 'var(--ok-600)' : 'var(--warn-700)' },
        ].map((k, i) => (
          <div key={i} style={{ padding: '14px 18px', borderRight: i < 5 ? '1px solid var(--border-soft)' : 'none' }}>
            <div className="kpi__label" style={{ fontSize: 10.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600, marginBottom: 4 }}>{k.l}</div>
            <div className="kpi__value mono" style={{ fontSize: 18, fontWeight: 700, color: k.col || 'var(--ink-900)' }}>
              {k.v}<span style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 500, marginLeft: 4 }}>{k.u}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Status controls */}
      <div className="card" style={{ marginBottom: 16, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', whiteSpace: 'nowrap' }}>Changer le statut :</span>
        <select
          className="input"
          style={{ flex: 1, minWidth: 220, maxWidth: 360 }}
          value={campaign.status}
          onChange={e => {
            const target = ALL_STEPS.find(s => s.id === e.target.value);
            if (!target || target.id === campaign.status) return;
            if (target.id === 'exp' || target.id === 'tra') {
              setShowDepartureModal(target);
            } else {
              setShowConfirmModal(target);
            }
          }}
        >
          <optgroup label="Flux principal">
            <option value="enr">📝 Enregistré</option>
            <option value="rec">📥 Reçu à l'entrepôt</option>
            <option value="pre">🔍 Vérifié et préparé</option>
            <option value="exp">🚀 Expédié</option>
            <option value="tra">✈️ En transit</option>
            <option value="apd">🛬 Arrivé au pays de destination</option>
          </optgroup>
          <optgroup label="Douanes">
            <option value="dou">🛃 Présenté aux douanes</option>
            <option value="ins">🔎 En inspection douanière</option>
            <option value="ret">⚠️ Retenu par les douanes</option>
            <option value="lib">✅ Libéré par les douanes</option>
          </optgroup>
          <optgroup label="Livraison">
            <option value="ard">🏭 Arrivé entrepôt de destination</option>
            <option value="ver">🔬 Vérification finale</option>
            <option value="pdl">📦 Prêt pour livraison/retrait</option>
            <option value="liv">🚚 En cours de livraison</option>
            <option value="ok">🎉 Livré</option>
          </optgroup>
          <optgroup label="Exceptionnels">
            <option value="adr">📍 Adresse incomplète</option>
            <option value="tdl">🔔 Tentative de livraison</option>
            <option value="rte">↩️ Retour à l'entrepôt</option>
            <option value="dom">💥 Colis endommagé</option>
            <option value="cla">📋 Réclamation ouverte</option>
          </optgroup>
        </select>
        {advanceError && (
          <span style={{ fontSize: 12, color: 'var(--bad-600)', fontWeight: 600 }}>✕ {advanceError}</span>
        )}
        {nextStep && (
          <button
            className={nextStep.id === 'ok' ? 'btn btn--danger' : 'btn btn--primary'}
            onClick={handleAdvance}
            disabled={advancing}
            style={{ whiteSpace: 'nowrap' }}
          >
            {advancing ? 'Mise à jour…' : nextStep.id === 'ok' ? 'Clôturer' : `→ ${nextStep.label}`}
          </button>
        )}
      </div>

      {/* Generic confirmation modal (all non-transit steps) */}
      {showConfirmModal && (
        <ConfirmAdvanceModal
          campaign={campaign}
          targetStep={showConfirmModal}
          unpaidCount={unpaidCount}
          advancing={advancing}
          onClose={() => setShowConfirmModal(null)}
          onConfirm={() => {
            setShowConfirmModal(null);
            doAdvance(showConfirmModal);
          }}
        />
      )}

      {/* Departure note modal (transit steps) */}
      {showDepartureModal && (
        <DepartureNoteModal
          targetStep={showDepartureModal}
          advancing={advancing}
          onClose={() => setShowDepartureModal(null)}
          onConfirm={(note) => {
            setShowDepartureModal(null);
            doAdvance(showDepartureModal, note);
          }}
        />
      )}

      {/* Parcel table */}
      {parcels.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>Aucun colis dans cette cargaison</div>
          <div style={{ fontSize: 13, color: 'var(--ink-400)', marginBottom: 20 }}>Ajoutez le premier colis pour commencer.</div>
          {campaign.status === 'enr' && (
            <button className="btn btn--brand" onClick={() => onNav('/parcels/new?campaign=' + id)}>
              <I.Plus />Ajouter un colis
            </button>
          )}
        </div>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>Code</th>
              <th>Client</th>
              <th>Poids (kg)</th>
              <th>Contenu</th>
              <th style={{ textAlign: 'right' }}>Montant (CAD)</th>
              <th>Paiement</th>
              <th>Statut colis</th>
            </tr>
          </thead>
          <tbody>
            {parcels.map(p => {
              const payInfo = PAYMENT_STATUS[p.payment?.status] || { label: p.payment?.status || '—', cls: 'neutral' };
              const parcelLabel = PARCEL_STATUS[p.status] || p.status || '—';
              const clientName = p.client?.name || '—';
              const initials = clientName.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();
              return (
                <tr
                  key={p.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onNav('/parcels/' + p.id)}
                >
                  <td>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--brand-700)' }}>
                      {p.trackingCode || p.id}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar initials={initials} size="sm" />
                      <div>
                        <div style={{ fontWeight: 600 }}>{clientName}</div>
                        {p.client?.phone && (
                          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-400)' }}>{p.client.phone}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="mono" style={{ fontWeight: 600 }}>{p.weightKg != null ? p.weightKg : '—'}</span>
                  </td>
                  <td style={{ maxWidth: 180, fontSize: 12, color: 'var(--ink-600)' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.description || '—'}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--ink-900)' }}>
                      {(p.payment?.amount ?? p.priceXaf) != null ? (p.payment?.amount ?? p.priceXaf).toLocaleString('fr') : '—'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge--dot badge--${payInfo.cls}`}>
                      {payInfo.label}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge--neutral">{parcelLabel}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-400)' }}>
        {parcels.length} colis · Capacité {campaign.capacityKg != null ? campaign.capacityKg + ' kg' : '—'}
      </div>

      {/* ── Campaign Timeline ── */}
      <CampaignTimeline campaign={campaign} route={route} />
    </div>
  );
}

/* ── Campaign Timeline ── */
function CampaignTimeline({ campaign, route }) {
  const isExceptional = EXCEPT_STEPS.some(s => s.id === campaign.status);
  const exceptInfo    = isExceptional ? EXCEPT_STEPS.find(s => s.id === campaign.status) : null;
  // For exceptional statuses, highlight the last main flow step reached
  const currentIdx    = isExceptional
    ? -1
    : STEPS.findIndex(s => s.id === campaign.status);
  const notes = campaign.statusNotes ?? {};

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const stepLocation = (id) => {
    if (['enr', 'rec', 'pre', 'exp'].includes(id)) return route.origin ?? null;
    if (['tra'].includes(id))                       return null;
    return route.destination ?? null;
  };

  const stepDate = (id) => {
    if (id === 'enr') return campaign.createdAt;
    if (id === 'exp') return campaign.departureDate;
    if (id === 'ard') return campaign.arrivalDate;
    return null;
  };

  return (
    <div className="card" style={{ padding: '18px 22px', marginTop: 20 }}>
      <div className="section-title" style={{ marginBottom: 18 }}>
        <I.History style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Timeline de la cargaison
      </div>

      {/* Exceptional status banner */}
      {isExceptional && exceptInfo && (
        <div style={{
          marginBottom: 16, padding: '10px 14px', borderRadius: 8,
          background: '#fef2f2', border: '1.5px solid #fca5a5',
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 13, fontWeight: 700, color: exceptInfo.color,
        }}>
          <span style={{ fontSize: 18 }}>{exceptInfo.icon}</span>
          <div>
            <div>{exceptInfo.label}</div>
            <div style={{ fontSize: 11.5, fontWeight: 400, color: '#6b7280', marginTop: 2 }}>Statut exceptionnel — la progression principale est suspendue</div>
          </div>
        </div>
      )}

      <div>
        {STEPS.map((step, i) => {
          const isDone    = isExceptional ? false : i < currentIdx;
          const isCurrent = !isExceptional && i === currentIdx;
          const isPending = isExceptional ? true : i > currentIdx;

          const bg     = isCurrent ? step.color : isDone ? 'var(--ok-50)'   : 'transparent';
          const border = isCurrent ? step.color : isDone ? 'var(--ok-300)'  : 'var(--border)';
          const txtCol = isCurrent ? step.color : isDone ? 'var(--ink-700)' : 'var(--ink-300)';
          const lineCol= isDone ? 'var(--ok-200)' : 'var(--border)';

          const location = (isDone || isCurrent) ? stepLocation(step.id) : null;
          const date     = (isDone || isCurrent) ? fmtDate(stepDate(step.id)) : null;
          const note     = notes[step.id] ?? null;

          return (
            <div key={step.id} style={{ display: 'flex', gap: 14, position: 'relative', paddingBottom: i < STEPS.length - 1 ? 18 : 0 }}>
              {i < STEPS.length - 1 && (
                <div style={{ position: 'absolute', left: 15, top: 32, bottom: 0, width: 1.5, background: lineCol }} />
              )}
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: bg, border: `2px solid ${border}`,
                display: 'grid', placeItems: 'center', fontSize: 14,
                color: isCurrent ? 'white' : isDone ? 'var(--ok-600)' : 'var(--ink-200)',
              }}>
                {isCurrent ? step.icon : isDone ? '✓' : ''}
              </div>
              <div style={{ flex: 1, paddingTop: 5, opacity: isPending ? 0.3 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: isCurrent ? 700 : isDone ? 500 : 400, color: txtCol }}>
                    {step.label}
                  </span>
                  {isCurrent && (
                    <span style={{ fontSize: 9.5, fontWeight: 700, background: step.color, color: 'white', padding: '1px 6px', borderRadius: 2, letterSpacing: '.04em' }}>
                      ACTUEL
                    </span>
                  )}
                </div>
                {location && (
                  <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>📍 {location}</div>
                )}
                {note && (
                  <div style={{ fontSize: 12, color: 'var(--ink-500)', fontStyle: 'italic', marginTop: 2 }}>{note}</div>
                )}
                {date && (
                  <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 2 }}>{date}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Confirmation modal for non-transit steps ── */
function ConfirmAdvanceModal({ campaign, targetStep, unpaidCount, advancing, onClose, onConfirm }) {
  const isClosure = targetStep.id === 'ok';
  const isExcept  = EXCEPT_STEPS.some(s => s.id === targetStep.id);
  const effect = STEP_EFFECTS[targetStep.id];

  return (
    <Modal
      title={isClosure ? 'Clôturer la cargaison' : isExcept ? 'Statut exceptionnel' : 'Confirmer le changement de statut'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose} disabled={advancing}>Annuler</button>
          <button
            className={isClosure || isExcept ? 'btn btn--danger' : 'btn btn--primary'}
            onClick={onConfirm}
            disabled={advancing}
          >
            {advancing ? 'Mise à jour…' : isClosure ? 'Confirmer la clôture' : `Confirmer → ${targetStep.label}`}
          </button>
        </>
      }
    >
      <div style={{ padding: '4px 0 8px', display: 'grid', gap: 14 }}>
        <p style={{ fontSize: 14, color: 'var(--ink-700)', margin: 0 }}>
          Vous êtes sur le point de faire passer la cargaison{' '}
          <strong>{campaign.code}</strong> au statut{' '}
          <strong style={{ color: targetStep.color }}>{targetStep.label}</strong>.
        </p>

        {effect && (
          <div style={{
            background: isClosure ? 'var(--warn-50)' : 'var(--info-50)',
            border: `1px solid ${isClosure ? 'var(--warn-200)' : 'var(--info-200)'}`,
            borderRadius: 8, padding: '10px 14px',
            fontSize: 13, color: isClosure ? 'var(--warn-700)' : 'var(--info-700)',
          }}>
            {effect}
          </div>
        )}

        {isClosure && unpaidCount > 0 && (
          <div style={{ background: 'var(--bad-50)', border: '1px solid var(--bad-200)', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontWeight: 700, color: 'var(--bad-700)', marginBottom: 4 }}>
              ⚠️ {unpaidCount} colis non payé{unpaidCount > 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--bad-600)' }}>
              Ces colis resteront en attente de paiement après la clôture.
            </div>
          </div>
        )}

        {isClosure && unpaidCount === 0 && (
          <div style={{ background: 'var(--ok-50)', border: '1px solid var(--ok-200)', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontWeight: 700, color: 'var(--ok-700)' }}>✓ Tous les colis sont réglés</div>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ── Departure note modal (transit steps) ── */
function DepartureNoteModal({ targetStep, advancing, onClose, onConfirm }) {
  const [note, setNote] = useState('');
  return (
    <Modal
      width={420}
      onClose={onClose}
      title="Confirmer le départ"
      sub={targetStep.label}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose} disabled={advancing}>Annuler</button>
          <button className="btn btn--brand" onClick={() => onConfirm(note)} disabled={advancing}>
            {advancing ? 'Mise à jour…' : 'Confirmer le départ'}
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 14 }}>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-700)' }}>
          Tous les colis reçus seront automatiquement passés en transit.
        </p>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', display: 'block', marginBottom: 6 }}>
            Note de transit <span style={{ fontWeight: 400, color: 'var(--ink-400)' }}>(optionnel · ex: DLA → BRU)</span>
          </label>
          <input
            className="input"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="DLA → BRU"
            autoFocus
          />
        </div>
      </div>
    </Modal>
  );
}
