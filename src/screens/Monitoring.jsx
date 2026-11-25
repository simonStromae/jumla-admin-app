'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAdminT } from '../lib/useAdminT.js';
import I from '../components/Icons.jsx';

const STATUS_CONFIG = {
  ok:           { label: 'OK',              cls: 'badge--ok',      icon: I.Check   },
  warn:         { label: 'Attention',       cls: 'badge--warn',    icon: I.Alert   },
  error:        { label: 'Erreur',          cls: 'badge--bad',     icon: I.Cross   },
  unconfigured: { label: 'Non configure',   cls: 'badge--neutral', icon: I.Lock    },
};

function ServiceCard({ service }) {
  const cfg = STATUS_CONFIG[service.status] ?? STATUS_CONFIG.error;
  const Icon = cfg.icon;
  return (
    <div className="monitoring-card" data-status={service.status}>
      <div className="monitoring-card__header">
        <span className="monitoring-card__label">{service.label}</span>
        <span className={`badge ${cfg.cls}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon width={12} height={12} />
          {cfg.label}
        </span>
      </div>
      {(service.detail || service.latencyMs != null) && (
        <div className="monitoring-card__detail">
          {service.detail}
          {service.latencyMs != null && (
            <span className="monitoring-card__latency">{service.latencyMs} ms</span>
          )}
        </div>
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
      <span className="monitoring-banner__text">{labels[overall] ?? '...'}</span>
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

  useEffect(() => { refresh(); }, [refresh]);

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
    </div>
  );
}
