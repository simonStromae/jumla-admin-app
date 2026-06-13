import { useState, useEffect } from 'react';
import I from '../components/Icons.jsx';
import { RoutePill, Avatar, Modal } from '../components/Shell.jsx';

const STEPS = [
  { id: 'enr', label: 'Ouverte',          color: 'var(--brand-500)' },
  { id: 'exp', label: 'Expédiée',          color: 'var(--info-500)' },
  { id: 'tra', label: 'En transit',        color: 'var(--warn-500)' },
  { id: 'apd', label: 'Arrivée au pays',  color: 'var(--ok-400)' },
  { id: 'dou', label: 'En douane',         color: '#b45309' },
  { id: 'lib', label: 'Libérée douanes',  color: 'var(--ok-500)' },
  { id: 'ard', label: 'Entrepôt dest.',   color: '#16a34a' },
  { id: 'pdl', label: 'Prête livraison',  color: 'var(--info-600)' },
  { id: 'ok',  label: 'Clôturée',         color: 'var(--ink-500)' },
];
const STEP_LABELS = {
  enr: 'Ouverte',
  exp: 'Expédiée',
  tra: 'En transit',
  apd: 'Arrivée au pays',
  dou: 'En douane',
  lib: 'Libérée douanes',
  ard: 'Entrepôt dest.',
  pdl: 'Prête livraison',
  ok:  'Clôturée',
};

const STEP_ICONS = {
  enr: '✏️', exp: '🚀', tra: '✈️', apd: '🛬', dou: '🔍', lib: '✅', ard: '🏭', pdl: '📦', ok: '🔒',
};
const STEP_EFFECTS = {
  exp: 'Tous les colis reçus/préparés (REC, PRE) seront automatiquement passés à "Expédié" (EXP).',
  tra: 'La cargaison est en transit — second tronçon.',
  apd: 'La cargaison est arrivée au pays de destination.',
  dou: 'La cargaison est présentée aux douanes.',
  lib: 'La cargaison a été libérée par les douanes.',
  ard: 'Tous les colis expédiés/en transit (EXP, TRA, APD) seront passés à "Arrivé entrepôt destination" (ARD).',
  pdl: 'La cargaison est prête pour la livraison.',
  ok:  'La cargaison sera définitivement clôturée. Cette action est irréversible.',
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
                style={{ color: STEPS.find(s => s.id === campaign.status)?.color }}
              >
                {STEP_LABELS[campaign.status] || campaign.status}
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
          style={{ flex: 1, minWidth: 200, maxWidth: 320 }}
          value={campaign.status}
          onChange={e => {
            const target = STEPS.find(s => s.id === e.target.value);
            if (!target || target.id === campaign.status) return;
            if (target.id === 'exp' || target.id === 'tra') {
              setShowDepartureModal(target);
            } else {
              setShowConfirmModal(target);
            }
          }}
        >
          {STEPS.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
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
  const currentIdx = STEPS.findIndex(s => s.id === campaign.status);
  const notes = campaign.statusNotes ?? {};

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  // Contextual location per step
  const stepLocation = (id) => {
    if (['enr', 'exp'].includes(id))             return route.origin ?? null;
    if (['tra'].includes(id))                     return null;
    if (['apd', 'dou', 'lib', 'ard', 'pdl', 'ok'].includes(id)) return route.destination ?? null;
    return null;
  };

  // Contextual date per step
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
      <div>
        {STEPS.map((step, i) => {
          const isDone    = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isPending = i > currentIdx;

          const bg     = isCurrent ? step.color : isDone ? 'var(--ok-50)'      : 'transparent';
          const border = isCurrent ? step.color : isDone ? 'var(--ok-300)'     : 'var(--border)';
          const txtCol = isCurrent ? step.color : isDone ? 'var(--ink-700)'    : 'var(--ink-300)';
          const lineCol= isDone ? 'var(--ok-200)' : 'var(--border)';

          const location = (isDone || isCurrent) ? stepLocation(step.id) : null;
          const date     = (isDone || isCurrent) ? fmtDate(stepDate(step.id)) : null;
          const note     = notes[step.id] ?? null;

          return (
            <div key={step.id} style={{ display: 'flex', gap: 14, position: 'relative', paddingBottom: i < STEPS.length - 1 ? 20 : 0 }}>
              {i < STEPS.length - 1 && (
                <div style={{ position: 'absolute', left: 15, top: 32, bottom: 0, width: 1.5, background: lineCol }} />
              )}
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: bg, border: `2px solid ${border}`,
                display: 'grid', placeItems: 'center', fontSize: 14,
                color: isCurrent ? 'white' : isDone ? 'var(--ok-600)' : 'var(--ink-200)',
              }}>
                {isCurrent ? STEP_ICONS[step.id] : isDone ? '✓' : ''}
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
  const effect = STEP_EFFECTS[targetStep.id];

  return (
    <Modal
      title={isClosure ? 'Clôturer la cargaison' : 'Confirmer l\'avancement'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose} disabled={advancing}>Annuler</button>
          <button
            className={isClosure ? 'btn btn--danger' : 'btn btn--primary'}
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
