import { useState, useEffect, useCallback } from 'react';
import I from '../components/Icons.jsx';
import { RoutePill, Avatar, Modal } from '../components/Shell.jsx';
import { useAdminT } from '../lib/useAdminT.js';

// Main linear flow (shown in timeline)
// TODO: i18n — step labels are not covered by translation keys
const STEPS = [
  { id: 'enr', label: 'Enregistré',              icon: '📝', color: '#6b7280' },
  { id: 'exp', label: 'Expédié',                  icon: '🚀', color: '#0e7490' },
  { id: 'tra', label: 'En transit',               icon: '✈️', color: '#0891b2' },
  { id: 'apd', label: 'Arrivé au pays de dest.',  icon: '🛬', color: '#16a34a' },
  { id: 'dou', label: 'Présenté aux douanes',     icon: '🛃', color: '#d97706' },
  { id: 'ins', label: 'En inspection douanière',  icon: '🔎', color: '#c2410c' },
  { id: 'ret', label: 'Retenu par les douanes',   icon: '⚠️', color: '#dc2626' },
  { id: 'lib', label: 'Libéré par les douanes',   icon: '✅', color: '#16a34a' },
  { id: 'ard', label: 'Arrivé entrepôt de dest.', icon: '🏭', color: '#15803d' },
  { id: 'pdl', label: 'Prêt pour livraison',      icon: '📦', color: '#0891b2' },
  { id: 'ok',  label: 'Clôturée',                 icon: '🔒', color: '#374151' },
];

const ALL_STEPS = STEPS;

const STEP_LABELS = Object.fromEntries(STEPS.map(s => [s.id, s.label]));
const STEP_ICONS  = Object.fromEntries(STEPS.map(s => [s.id, s.icon]));

// TODO: i18n — step effect descriptions are not covered by translation keys
const STEP_EFFECTS = {
  exp: 'Tous les colis reçus/préparés seront automatiquement passés à "Expédié" (EXP).',
  tra: 'Nouvelle escale enregistrée. La note de transit sera mise à jour.',
  apd: 'La cargaison est arrivée au pays de destination.',
  dou: 'La cargaison est présentée aux douanes.',
  ins: 'La cargaison est en inspection douanière.',
  ret: 'La cargaison est retenue par les douanes.',
  lib: 'La cargaison a été libérée par les douanes.',
  ard: 'Tous les colis en route (EXP, TRA, APD) seront passés à "Arrivé entrepôt destination" (ARD).',
  pdl: 'La cargaison est prête pour la livraison ou le retrait.',
  ok:  'La cargaison sera définitivement clôturée. Cette action est irréversible.',
};

// TODO: i18n — use t.paymentStatus.* in render instead of these labels
const PAYMENT_STATUS = {
  completed: { label: 'Payé',       cls: 'ok' },
  pending:   { label: 'En attente', cls: 'warn' },
  failed:    { label: 'Échoué',     cls: 'bad' },
};
// TODO: i18n — parcel status labels are not covered by translation keys
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
  const t = useAdminT();
  const [campaign,           setCampaign]           = useState(null);
  const [loading,            setLoading]            = useState(true);
  const [advancing,          setAdvancing]          = useState(false);
  const [advanceError,       setAdvanceError]       = useState('');
  const [showConfirmModal,   setShowConfirmModal]   = useState(null); // nextStep
  const [showDepartureModal, setShowDepartureModal] = useState(null); // targetStep
  const [statusNotes,        setStatusNotes]        = useState({});
  const [showBroadcast,      setShowBroadcast]      = useState(false);
  const [broadcastPreview,   setBroadcastPreview]   = useState(null); // { total, campaign }
  const [broadcasting,       setBroadcasting]       = useState(false);
  const [broadcastResult,    setBroadcastResult]    = useState(null); // { sent, failed, total }

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
          <div style={{ fontSize: 14 }}>{t.common.loading}</div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
        <div style={{ textAlign: 'center', color: 'var(--ink-400)' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>📦</div>
          {/* TODO: i18n — no translation key for "Cargaison introuvable" */}
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-700)' }}>Cargaison introuvable</div>
          <button className="btn btn--ghost" style={{ marginTop: 16 }} onClick={() => onNav('/')}>← {t.common.back}</button>
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

  const getPaymentLabel = (status) => {
    if (status === 'completed') return t.paymentStatus.paid;
    if (status === 'pending') return t.paymentStatus.pending;
    if (status === 'failed') return t.paymentStatus.cancelled; // TODO: no exact match for 'failed' status
    return PAYMENT_STATUS[status]?.label || status || '—';
  };

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
        setAdvanceError(json.error || `${t.common.error} ${res.status}`);
      } else {
        const updated = await fetch('/api/campaigns/' + id).then(r => r.json());
        setCampaign(updated);
        setStatusNotes(updated.statusNotes ?? {});
      }
    } catch {
      setAdvanceError(t.common.networkError);
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
        <a style={{ cursor: 'pointer' }} onClick={() => onNav('/')}>{t.nav.campaigns}</a>
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
            {t.campaigns.detail.info.departure} <strong style={{ color: 'var(--ink-700)' }}>{depDate}</strong>
            {' · '}
            {t.campaigns.detail.info.arrival} <strong style={{ color: 'var(--ink-700)' }}>{arrDate}</strong>
          </div>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost" onClick={() => onNav('/admin/campaigns/' + campaign.id + '/edit')}>
            <I.Edit />{t.common.edit}
          </button>
          <button onClick={() => {
            setBroadcastResult(null);
            fetch('/api/campaigns/' + campaign.id + '/broadcast')
              .then(r => r.json()).then(d => setBroadcastPreview(d)).catch(() => {});
            setShowBroadcast(true);
          }} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 8,
            border: '1px solid #25D366', background: 'white',
            color: '#25D366', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M17.5 14.4c-.3-.1-1.7-.9-2-1s-.5-.1-.7.1c-.2.3-.7 1-.9 1.1-.2.2-.3.2-.6 0-.3-.1-1.2-.5-2.3-1.4-.8-.7-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5 0-.2 0-.4-.1-.5 0-.1-.7-1.6-1-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.4-.3.3-1 1-1 2.4s1 2.8 1.2 3.1c.2.2 2 3 4.8 4.3.7.3 1.2.4 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.3.3-.7.3-1.2.2-1.3-.1-.2-.3-.3-.6-.4zM12 21a9 9 0 0 1-4.6-1.3L3 21l1.3-4.3A9 9 0 1 1 12 21z" /></svg>
            {/* TODO: i18n — no translation key for "Notifier les clients" */}
            Notifier les clients
          </button>
          <button onClick={() => onNav('/messaging?campaignId=' + campaign.id)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'white',
            color: 'var(--ink-600)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M17.5 14.4c-.3-.1-1.7-.9-2-1s-.5-.1-.7.1c-.2.3-.7 1-.9 1.1-.2.2-.3.2-.6 0-.3-.1-1.2-.5-2.3-1.4-.8-.7-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5 0-.2 0-.4-.1-.5 0-.1-.7-1.6-1-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.4-.3.3-1 1-1 2.4s1 2.8 1.2 3.1c.2.2 2 3 4.8 4.3.7.3 1.2.4 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.3.3-.7.3-1.2.2-1.3-.1-.2-.3-.3-.6-.4zM12 21a9 9 0 0 1-4.6-1.3L3 21l1.3-4.3A9 9 0 1 1 12 21z" /></svg>
            {/* TODO: i18n — no translation key for "WhatsApp groupe" */}
            WhatsApp groupe
          </button>
          {campaign.status === 'enr' && (
            <button
              className="btn btn--brand"
              onClick={() => onNav('/parcels/new?campaign=' + id)}
            >
              <I.Plus />{t.campaigns.detail.parcels.addParcel}
            </button>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
        {[
          { l: t.campaigns.kpi.parcels,              v: parcels.length,                  u: '' },
          { l: /* TODO: i18n */ 'Poids total',        v: totalWeight.toLocaleString('fr'), u: 'kg' },
          { l: /* TODO: i18n */ 'Facturé',            v: invoiced.toLocaleString('fr'),    u: 'CAD' },
          { l: /* TODO: i18n */ 'Perçu',              v: collected.toLocaleString('fr'),   u: 'CAD', col: 'var(--ok-600)' },
          { l: /* TODO: i18n */ 'Reste à percevoir',  v: outstanding.toLocaleString('fr'), u: 'CAD', col: outstanding > 0 ? 'var(--bad-600)' : 'var(--ok-600)' },
          { l: /* TODO: i18n */ 'Taux recouvrement',  v: pct,                              u: '%',   col: pct >= 95 ? 'var(--ok-600)' : 'var(--warn-700)' },
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
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-500)', whiteSpace: 'nowrap' }}>{t.campaigns.detail.status.updateStatus}</span>
        <select
          className="input"
          style={{ flex: 1, minWidth: 220, maxWidth: 360 }}
          value={campaign.status}
          onChange={e => {
            const target = STEPS.find(s => s.id === e.target.value);
            if (!target) return;
            // TRA can be set multiple times (multiple stopovers)
            if (target.id !== 'tra' && target.id === campaign.status) return;
            if (target.id === 'exp' || target.id === 'tra') {
              setShowDepartureModal(target);
            } else {
              setShowConfirmModal(target);
            }
          }}
        >
          {/* TODO: i18n — optgroup and option labels are not in translation keys */}
          <optgroup label="Flux principal">
            <option value="enr">📝 Enregistré</option>
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
            <option value="pdl">📦 Prêt pour livraison/retrait</option>
            <option value="ok">🔒 Clôturée</option>
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
            {/* TODO: i18n — "Clôturer" has no exact translation key */}
            {advancing ? t.common.saving : nextStep.id === 'ok' ? 'Clôturer' : `→ ${nextStep.label}`}
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

      {/* ── Broadcast modal ── */}
      {showBroadcast && (
        <Modal title={/* TODO: i18n */ 'Notifier tous les clients'} onClose={() => { setShowBroadcast(false); setBroadcastResult(null); }}>
          {broadcastResult ? (
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{broadcastResult.failed === 0 ? '✅' : '⚠️'}</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
                {/* TODO: i18n — pluralized "messages envoyés" has no translation key */}
                {broadcastResult.sent} message{broadcastResult.sent > 1 ? 's' : ''} envoyé{broadcastResult.sent > 1 ? 's' : ''}
              </div>
              {broadcastResult.failed > 0 && (
                <div style={{ fontSize: 13, color: 'var(--bad-600)', marginBottom: 8 }}>
                  {/* TODO: i18n — failure count message has no translation key */}
                  {broadcastResult.failed} échec{broadcastResult.failed > 1 ? 's' : ''} — vérifiez les numéros manquants dans les fiches clients
                </div>
              )}
              {/* TODO: i18n — "clients contactés" has no translation key */}
              <div style={{ fontSize: 12, color: 'var(--ink-400)' }}>{broadcastResult.total} clients contactés</div>
              <button className="btn btn--brand" style={{ marginTop: 20 }} onClick={() => { setShowBroadcast(false); setBroadcastResult(null); }}>
                {t.common.close}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ background: 'var(--bg-soft)', borderRadius: 10, padding: '14px 16px', marginBottom: 16, fontSize: 13, color: 'var(--ink-600)', lineHeight: 1.6 }}>
                {/* TODO: i18n — "Message qui sera envoyé" has no translation key */}
                <strong>Message qui sera envoyé :</strong>
                <pre style={{ marginTop: 8, fontFamily: 'inherit', whiteSpace: 'pre-wrap', color: 'var(--ink-700)' }}>{`Bonjour [Prénom] 👋\n\nNouvelle cargaison disponible — départ prévu le ${campaign.departureDate ? new Date(campaign.departureDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'à définir'}.\n\nRéservez votre place dès maintenant.\n\nJumla Shipping`}</pre>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--info-50)', border: '1px solid var(--info-100)', borderRadius: 8, marginBottom: 20, fontSize: 13 }}>
                <span style={{ fontSize: 20 }}>👥</span>
                <div>
                  <strong style={{ color: 'var(--info-700)' }}>
                    {broadcastPreview ? broadcastPreview.total : '…'} client{broadcastPreview?.total !== 1 ? 's' : ''} actif{broadcastPreview?.total !== 1 ? 's' : ''}
                  </strong>
                  {/* TODO: i18n — "Tous les clients avec un numéro de téléphone" has no translation key */}
                  <div style={{ color: 'var(--info-600)', fontSize: 12 }}>Tous les clients avec un numéro de téléphone</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn--ghost" onClick={() => setShowBroadcast(false)}>{t.common.cancel}</button>
                <button
                  className="btn btn--brand"
                  disabled={broadcasting || !broadcastPreview}
                  onClick={async () => {
                    setBroadcasting(true);
                    const res = await fetch('/api/campaigns/' + campaign.id + '/broadcast', { method: 'POST' });
                    const json = await res.json();
                    setBroadcasting(false);
                    setBroadcastResult(json);
                  }}
                >
                  {/* TODO: i18n — "Envoyer à X clients" has no translation key */}
                  {broadcasting ? t.common.sending : `Envoyer à ${broadcastPreview?.total ?? '…'} clients`}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* ── Compagnies aériennes & AWB ── */}
      <CampaignLegsPanel campaignId={campaign.id} />

      {/* ── Campaign Timeline ── */}
      <CampaignTimeline campaign={campaign} route={route} />

      {/* Parcel table */}
      {parcels.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📦</div>
          {/* TODO: i18n — "Aucun colis dans cette cargaison" has no exact translation key */}
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>Aucun colis dans cette cargaison</div>
          {/* TODO: i18n — "Ajoutez le premier colis pour commencer." has no translation key */}
          <div style={{ fontSize: 13, color: 'var(--ink-400)', marginBottom: 20 }}>Ajoutez le premier colis pour commencer.</div>
          {campaign.status === 'enr' && (
            <button className="btn btn--brand" onClick={() => onNav('/parcels/new?campaign=' + id)}>
              <I.Plus />{t.campaigns.detail.parcels.addParcel}
            </button>
          )}
        </div>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>{t.campaigns.detail.parcels.columns.trackingId}</th>
              <th>{t.parcels.table.client}</th>
              <th>{t.parcels.table.weight}</th>
              <th>{t.common.description}</th>
              <th style={{ textAlign: 'right' }}>{t.parcels.table.amount}</th>
              <th>{t.parcels.table.payment}</th>
              <th>{t.parcels.table.status}</th>
            </tr>
          </thead>
          <tbody>
            {parcels.map(p => {
              const payInfo = PAYMENT_STATUS[p.payment?.status] || { label: p.payment?.status || '—', cls: 'neutral' };
              const payLabel = getPaymentLabel(p.payment?.status);
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
                      {payLabel}
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

      {/* TODO: i18n — "colis · Capacité" has no translation key */}
      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-400)', marginBottom: 8 }}>
        {parcels.length} colis · Capacité {campaign.capacityKg != null ? campaign.capacityKg + ' kg' : '—'}
      </div>
    </div>
  );
}

/* ── Campaign Legs (airlines + AWB) ── */
function CampaignLegsPanel({ campaignId }) {
  const t = useAdminT();
  const [legs,     setLegs]     = useState(null);
  const [airlines, setAirlines] = useState([]);
  const [adding,   setAdding]   = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [form,     setForm]     = useState({ airlineId: '', awbNumber: '', weightKg: '', notes: '' });
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState('');

  const load = useCallback(() => {
    fetch(`/api/campaigns/${campaignId}/legs`).then(r => r.json()).then(setLegs);
  }, [campaignId]);

  useEffect(() => {
    load();
    fetch('/api/airlines').then(r => r.json()).then(setAirlines);
  }, [load]);

  function startAdd() {
    setForm({ airlineId: airlines[0]?.id ?? '', awbNumber: '', weightKg: '', notes: '' });
    setEditId(null);
    setAdding(true);
    setErr('');
  }

  function startEdit(leg) {
    setForm({ airlineId: leg.airlineId, awbNumber: leg.awbNumber ?? '', weightKg: leg.weightKg ?? '', notes: leg.notes ?? '' });
    setEditId(leg.id);
    setAdding(true);
    setErr('');
  }

  async function handleSave() {
    if (!form.airlineId) { setErr(/* TODO: i18n */ 'Sélectionnez une compagnie'); return; }
    setSaving(true);
    setErr('');
    const body = editId
      ? { legId: editId, ...form }
      : form;
    const res  = await fetch(`/api/campaigns/${campaignId}/legs`, {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error ?? t.common.error); setSaving(false); return; }
    setSaving(false);
    setAdding(false);
    setEditId(null);
    load();
  }

  async function handleDelete(legId) {
    await fetch(`/api/campaigns/${campaignId}/legs`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ legId }),
    });
    load();
  }

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="card" style={{ marginBottom: 16, padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div className="section-title" style={{ flex: 1, marginBottom: 0 }}>
          {/* TODO: i18n — using t.airlines.title as close match for "Compagnies aériennes"; "& AWB" suffix has no key */}
          <I.Plane style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> {t.airlines.title} & AWB
        </div>
        {!adding && (
          <button className="btn btn--ghost btn--sm" onClick={startAdd}>
            <I.Plus style={{ width: 13, height: 13 }} /> {t.common.add}
          </button>
        )}
      </div>

      {/* Add / Edit form */}
      {adding && (
        <div style={{ marginBottom: 14, padding: '14px 16px', background: 'var(--bg-soft)', borderRadius: 8, border: '1px solid var(--border)' }}>
          {err && <div style={{ marginBottom: 10, padding: '8px 12px', background: 'var(--bad-50)', borderRadius: 6, fontSize: 12.5, color: 'var(--bad-700)' }}>{err}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              {/* TODO: i18n — "Compagnie" label has no translation key */}
              <label className="label">Compagnie *</label>
              <select className="input" value={form.airlineId} onChange={e => upd('airlineId', e.target.value)}>
                {/* TODO: i18n — "— Sélectionner —" has no translation key */}
                <option value="">— Sélectionner —</option>
                {airlines.filter(a => a.active).map(a => (
                  <option key={a.id} value={a.id}>{a.iata ? `${a.iata} — ` : ''}{a.name}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              {/* TODO: i18n — "N° AWB" has no translation key */}
              <label className="label">N° AWB</label>
              <input className="input" value={form.awbNumber} onChange={e => upd('awbNumber', e.target.value)} placeholder="Ex: 220-12345678" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">{t.common.weight}</label>
              <input className="input" type="number" min="0" value={form.weightKg} onChange={e => upd('weightKg', e.target.value)} placeholder="Ex: 120" />
            </div>
          </div>
          <div className="field" style={{ marginBottom: 10 }}>
            <label className="label">{t.common.note}</label>
            <input className="input" value={form.notes} onChange={e => upd('notes', e.target.value)} placeholder="Ex: Poissons fumés, Effets personnels…" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn--brand btn--sm" disabled={saving} onClick={handleSave}>
              <I.Check style={{ width: 13, height: 13 }} /> {saving ? '…' : editId ? t.common.update : t.common.add}
            </button>
            <button className="btn btn--ghost btn--sm" onClick={() => { setAdding(false); setEditId(null); }}>{t.common.cancel}</button>
          </div>
        </div>
      )}

      {/* Legs list */}
      {legs === null ? (
        <div style={{ fontSize: 13, color: 'var(--ink-400)', padding: '8px 0' }}>{t.common.loading}</div>
      ) : legs.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--ink-400)', padding: '8px 0', textAlign: 'center' }}>
          {/* TODO: i18n — "Aucune compagnie assignée" message has no translation key */}
          Aucune compagnie assignée — cliquez "Ajouter" pour lier des transporteurs.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {legs.map(leg => (
            <div key={leg.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-soft)', borderRadius: 8, border: '1px solid var(--border-soft)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--brand-50)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <I.Plane style={{ width: 16, height: 16, color: 'var(--brand-500)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{leg.airline.name}</span>
                  {leg.airline.iata && (
                    <span className="mono" style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', background: 'var(--brand-50)', color: 'var(--brand-700)', borderRadius: 5, border: '1px solid var(--brand-100)' }}>
                      {leg.airline.iata}
                    </span>
                  )}
                  {leg.awbNumber && (
                    <span className="mono" style={{ fontSize: 12, color: 'var(--ink-600)', background: 'var(--ink-50)', padding: '2px 8px', borderRadius: 5, border: '1px solid var(--border)' }}>
                      AWB {leg.awbNumber}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>
                  {leg.weightKg ? `${leg.weightKg} kg` : '— kg'}{leg.notes ? ` · ${leg.notes}` : ''}
                </div>
              </div>
              <button className="btn btn--ghost btn--sm" onClick={() => startEdit(leg)}>
                <I.Edit style={{ width: 12, height: 12 }} />
              </button>
              <button className="btn btn--sm" onClick={() => handleDelete(leg.id)}
                style={{ background: 'var(--bad-50)', color: 'var(--bad-600)', border: '1px solid var(--bad-100)', padding: '5px 8px' }}>
                <I.Trash style={{ width: 12, height: 12 }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Campaign Timeline (horizontal stepper) ── */
// Steps that only appear if the campaign actually passed through them.
// lib (Libéré par les douanes) is always shown — it's a normal milestone after dou.
// Only ins and ret are truly exceptional (inspection, detention).
const OPTIONAL_STEPS = new Set(['ins', 'ret']);

function CampaignTimeline({ campaign }) {
  const t = useAdminT();
  const rawNotes = campaign.statusNotes ?? {};

  // Helper: get { at, note } from statusNotes entry (handles legacy string format)
  const getNoteData = (id) => {
    const v = rawNotes[id];
    if (!v) return null;
    if (typeof v === 'string') return { at: null, note: v };
    return { at: v.at ?? null, note: v.note ?? null };
  };

  // Only show optional steps if they were actually visited (recorded in statusNotes)
  // or if the campaign is currently at that step
  const visibleSteps = STEPS.filter(step => {
    if (!OPTIONAL_STEPS.has(step.id)) return true;
    return campaign.status === step.id || !!rawNotes[step.id];
  });

  const currentIdx = visibleSteps.findIndex(s => s.id === campaign.status);
  const n = visibleSteps.length;

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
    : null;

  const getStepDate = (step) => {
    const nd = getNoteData(step.id);
    if (nd?.at) return nd.at;
    if (step.id === 'enr') return campaign.createdAt;
    if (step.id === 'exp') return campaign.departureDate;
    if (step.id === 'ard') return campaign.arrivalDate;
    return null;
  };

  return (
    <div className="card" style={{ padding: '18px 22px', marginBottom: 16 }}>
      <div className="section-title" style={{ marginBottom: 20 }}>
        {/* TODO: i18n — "Timeline de la cargaison" has no translation key */}
        <I.History style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Timeline de la cargaison
      </div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ position: 'relative', minWidth: n * 80 }}>
          {/* Background line */}
          <div style={{
            position: 'absolute', top: 17, zIndex: 0,
            left: `calc(100% / ${n * 2})`, right: `calc(100% / ${n * 2})`,
            height: 2, background: '#e5e7eb', borderRadius: 1,
          }} />
          {/* Progress line */}
          {currentIdx > 0 && (
            <div style={{
              position: 'absolute', top: 17, zIndex: 0,
              left: `calc(100% / ${n * 2})`,
              width: `calc(${currentIdx} * 100% / ${n})`,
              height: 2, background: '#86efac', borderRadius: 1,
            }} />
          )}
          {/* Steps grid */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, position: 'relative', zIndex: 1 }}>
            {visibleSteps.map((step, i) => {
              const isDone    = i < currentIdx || step.id === 'enr';
              const isCurrent = i === currentIdx && step.id !== 'enr';

              const circleBg  = isCurrent ? step.color : isDone ? '#f0fdf4' : 'white';
              const border    = isCurrent ? step.color : isDone ? '#86efac' : '#e5e7eb';
              const iconColor = isCurrent ? 'white'    : isDone ? '#16a34a' : '#d1d5db';
              const txtColor  = isCurrent ? step.color : isDone ? '#374151' : '#9ca3af';

              const date = (isDone || isCurrent) ? fmtDate(getStepDate(step)) : null;
              const note = getNoteData(step.id)?.note ?? null;

              return (
                <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    background: circleBg, border: `2px solid ${border}`,
                    display: 'grid', placeItems: 'center',
                    fontSize: isCurrent ? 16 : 13, color: iconColor,
                    boxShadow: isCurrent ? `0 0 0 3px ${step.color}22` : 'none',
                  }}>
                    {isCurrent ? step.icon : isDone ? '✓' : ''}
                  </div>
                  <div style={{ marginTop: 6, textAlign: 'center', width: '100%', padding: '0 3px' }}>
                    <div style={{
                      fontSize: 10, lineHeight: 1.3,
                      fontWeight: isCurrent ? 700 : isDone ? 500 : 400,
                      color: txtColor,
                    }}>
                      {step.label}
                    </div>
                    {isCurrent && (
                      <div style={{
                        marginTop: 3, fontSize: 8, fontWeight: 700, letterSpacing: '.05em',
                        background: step.color, color: 'white',
                        padding: '1px 4px', borderRadius: 3, display: 'inline-block',
                      }}>{/* TODO: i18n — "ACTUEL" has no translation key */}ACTUEL</div>
                    )}
                    {date && (
                      <div style={{ fontSize: 9, color: isCurrent ? step.color : '#9ca3af', marginTop: 2, fontWeight: isCurrent ? 600 : 400 }}>{date}</div>
                    )}
                    {note && (
                      <div style={{ fontSize: 9, color: '#6b7280', fontStyle: 'italic', marginTop: 1, lineHeight: 1.2 }}>{note}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Confirmation modal for non-transit steps ── */
function ConfirmAdvanceModal({ campaign, targetStep, unpaidCount, advancing, onClose, onConfirm }) {
  const t = useAdminT();
  const isClosure = targetStep.id === 'ok';
  const effect = STEP_EFFECTS[targetStep.id];

  return (
    <Modal
      title={/* TODO: i18n */ isClosure ? 'Clôturer la cargaison' : 'Confirmer le changement de statut'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose} disabled={advancing}>{t.common.cancel}</button>
          <button
            className={isClosure ? 'btn btn--danger' : 'btn btn--primary'}
            onClick={onConfirm}
            disabled={advancing}
          >
            {/* TODO: i18n — "Confirmer la clôture" / "Confirmer →" have no translation keys */}
            {advancing ? t.common.saving : isClosure ? 'Confirmer la clôture' : `Confirmer → ${targetStep.label}`}
          </button>
        </>
      }
    >
      <div style={{ padding: '4px 0 8px', display: 'grid', gap: 14 }}>
        <p style={{ fontSize: 14, color: 'var(--ink-700)', margin: 0 }}>
          {/* TODO: i18n — status change description text has no translation key */}
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
              {/* TODO: i18n — "colis non payé" has no translation key */}
              ⚠️ {unpaidCount} colis non payé{unpaidCount > 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--bad-600)' }}>
              {/* TODO: i18n */}
              Ces colis resteront en attente de paiement après la clôture.
            </div>
          </div>
        )}

        {isClosure && unpaidCount === 0 && (
          <div style={{ background: 'var(--ok-50)', border: '1px solid var(--ok-200)', borderRadius: 8, padding: '10px 14px' }}>
            {/* TODO: i18n — "Tous les colis sont réglés" has no translation key */}
            <div style={{ fontWeight: 700, color: 'var(--ok-700)' }}>✓ Tous les colis sont réglés</div>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ── Departure note modal (transit steps) ── */
function DepartureNoteModal({ targetStep, advancing, onClose, onConfirm }) {
  const t = useAdminT();
  const [note, setNote] = useState('');
  return (
    <Modal
      width={420}
      onClose={onClose}
      title={/* TODO: i18n */ 'Confirmer le départ'}
      sub={targetStep.label}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose} disabled={advancing}>{t.common.cancel}</button>
          <button className="btn btn--brand" onClick={() => onConfirm(note)} disabled={advancing}>
            {/* TODO: i18n — "Confirmer le départ" has no translation key */}
            {advancing ? t.common.saving : 'Confirmer le départ'}
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: 14 }}>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-700)' }}>
          {/* TODO: i18n — departure confirmation message has no translation key */}
          Tous les colis reçus seront automatiquement passés en transit.
        </p>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-600)', display: 'block', marginBottom: 6 }}>
            {t.common.note} <span style={{ fontWeight: 400, color: 'var(--ink-400)' }}>({t.common.optional} · ex: DLA → BRU)</span>
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
