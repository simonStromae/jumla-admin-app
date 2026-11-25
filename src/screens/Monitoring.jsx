'use client';
import { useState, useEffect, useCallback } from 'react';
import I from '../components/Icons.jsx';

const STATUS_CONFIG = {
  ok:           { label: 'OK',            cls: 'badge--ok',      icon: I.Check   },
  warn:         { label: 'Attention',     cls: 'badge--warn',    icon: I.Alert   },
  error:        { label: 'Erreur',        cls: 'badge--bad',     icon: I.Cross   },
  unconfigured: { label: 'Non configure', cls: 'badge--neutral', icon: I.Lock    },
};

const SERVICE_ICONS = {
  db:             I.Activity,
  migrations:     I.History,
  twilio:         I.Whatsapp,
  resend:         I.Mail,
  authnet:        I.CreditCard,
  cron_reminders: I.Bell,
  cron_reengage:  I.Refresh,
};

function ServiceCard({ service }) {
  const cfg = STATUS_CONFIG[service.status] ?? STATUS_CONFIG.error;
  const StatusIcon = cfg.icon;
  const SvcIcon = SERVICE_ICONS[service.id] ?? I.Activity;

  return (
    <div className="monitoring-card" data-status={service.status}>
      <div className="monitoring-card__top">
        <div className="monitoring-card__svc-icon">
          <SvcIcon width={16} height={16} />
        </div>
        <span className="monitoring-card__label">{service.label}</span>
        <span className="monitoring-card__status-badge" data-status={service.status}>
          <StatusIcon width={10} height={10} />
          {cfg.label}
        </span>
      </div>

      <div className="monitoring-card__kpi">
        {service.latencyMs != null ? (
          <>
            <span className="monitoring-card__kpi-num">{service.latencyMs}</span>
            <span className="monitoring-card__kpi-unit">ms</span>
          </>
        ) : (
          <div className="monitoring-card__kpi-icon" data-status={service.status}>
            <StatusIcon width={30} height={30} />
          </div>
        )}
      </div>

      {service.detail && (
        <div className="monitoring-card__detail">{service.detail}</div>
      )}
    </div>
  );
}

function OverallBanner({ overall, checkedAt, onRefresh, loading }) {
  const labels = { ok: 'Tous les services fonctionnent', warn: 'Certains services necessitent attention', error: 'Un ou plusieurs services en erreur' };
  const cls    = { ok: 'monitoring-banner--ok', warn: 'monitoring-banner--warn', error: 'monitoring-banner--error' };
  const time   = checkedAt ? new Date(checkedAt).toLocaleTimeString('fr-FR') : '';
  return (
    <div className={`monitoring-banner ${cls[overall] ?? 'monitoring-banner--warn'}`}>
      <span className="monitoring-banner__text" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className={`monitoring-live-dot monitoring-live-dot--${overall ?? 'warn'}`} />
        {labels[overall] ?? '...'}
      </span>
      <span className="monitoring-banner__meta">
        {time && <span>Verifie a {time}</span>}
        <button className="btn btn--ghost btn--sm" onClick={onRefresh} disabled={loading} style={{ marginLeft: 8 }}>
          <I.ArrowRight width={14} height={14} style={{ transform: 'rotate(-90deg)' }} />
          {loading ? 'Verification...' : 'Actualiser'}
        </button>
      </span>
    </div>
  );
}

function ErrorLogSection() {
  const [errors, setErrors]   = useState(null);
  const [clearing, setClearing] = useState(false);

  const load = useCallback(() => {
    fetch('/api/monitoring/errors')
      .then(r => r.json())
      .then(d => setErrors(Array.isArray(d) ? d : []))
      .catch(() => setErrors([]));
  }, []);

  useEffect(() => { load(); }, [load]);

  const clear = async () => {
    if (!confirm('Vider le journal des erreurs ?')) return;
    setClearing(true);
    await fetch('/api/monitoring/errors', { method: 'DELETE' });
    setErrors([]);
    setClearing(false);
  };

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>Journal des erreurs 500</div>
          <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>50 dernieres erreurs API backend</div>
        </div>
        {errors && errors.length > 0 && (
          <button className="btn btn--ghost btn--sm" onClick={clear} disabled={clearing}>
            <I.Trash width={13} height={13} />
            Vider
          </button>
        )}
      </div>
      {errors === null && (
        <div style={{ color: 'var(--ink-400)', fontSize: 13, padding: '16px 0' }}>Chargement...</div>
      )}
      {errors !== null && errors.length === 0 && (
        <div className="monitoring-empty">
          <I.Check width={18} height={18} style={{ color: 'var(--ok-500)' }} />
          Aucune erreur enregistree
        </div>
      )}
      {errors !== null && errors.length > 0 && (
        <div className="monitoring-error-list">
          {errors.map(e => (
            <div key={e.id} className="monitoring-error-row">
              <div className="monitoring-error-row__meta">
                <span className="badge badge--bad" style={{ fontSize: 11 }}>{e.status}</span>
                <span className="monitoring-error-row__method">{e.method}</span>
                <span className="monitoring-error-row__route">{e.route}</span>
                <span className="monitoring-error-row__time">
                  {new Date(e.createdAt).toLocaleString('fr-FR', { timeZone: 'America/Toronto', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="monitoring-error-row__msg">{e.message}</div>
              {e.stack && (
                <details className="monitoring-error-row__stack">
                  <summary>Stack trace</summary>
                  <pre>{e.stack}</pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MonitoringScreen() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch('/api/monitoring/health')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__title">Monitoring</div>
          <div className="page__sub">Etat des services backend en temps reel</div>
        </div>
      </div>

      {loading && !data && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--ink-400)', fontSize: 14 }}>
          Verification en cours...
        </div>
      )}

      {error && (
        <div className="banner banner--error" style={{ marginBottom: 16 }}>
          Erreur lors de la verification : {error}
        </div>
      )}

      {data && (
        <>
          <OverallBanner overall={data.overall} checkedAt={data.checkedAt} onRefresh={refresh} loading={loading} />
          <div className="monitoring-grid">
            {(data.services ?? []).map(s => <ServiceCard key={s.id} service={s} />)}
          </div>
        </>
      )}

      <ErrorLogSection />
    </div>
  );
}
