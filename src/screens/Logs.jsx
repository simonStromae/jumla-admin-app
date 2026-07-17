import { useState, useEffect } from 'react';
import { useAdminT } from '../lib/useAdminT.js';
import I from '../components/Icons.jsx';
import { Bi } from '../components/Shell.jsx';

export default function LogsScreen({ onNav }) {
  const t = useAdminT();

  const CATEGORIES = [
    { id: '',         label: t.logs.categories.all },
    { id: 'payment',  label: t.nav.payments },
    { id: 'parcel',   label: t.nav.parcels },
    { id: 'campaign', label: t.nav.campaigns },
    { id: 'client',   label: t.nav.clients },
    { id: 'settings', label: t.nav.settings },
    { id: 'security', label: 'Sécurité' }, // TODO: no translation key for security
    { id: 'admin',    label: t.nav.administration },
  ];

  const KIND_LABELS = {
    ok:      { label: t.common.success, cls: 'badge--ok'      },
    info:    { label: t.common.info,    cls: 'badge--info'    },
    warn:    { label: t.common.warning, cls: 'badge--warn'    },
    neutral: { label: 'Système',        cls: 'badge--neutral' }, // TODO: no translation key for système/system
  };

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat]    = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage]  = useState(0);
  const PER_PAGE = 10;

  useEffect(() => {
    fetch('/api/logs')
      .then(r => r.json())
      .then(data => { setLogs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const filtered = logs.filter(l => {
    const matchCat    = !cat || l.cat === cat;
    const q           = search.toLowerCase();
    const matchSearch = !q || l.action.toLowerCase().includes(q) || l.user.toLowerCase().includes(q) || l.obj.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const visible    = filtered.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  const changeSearch = v => { setSearch(v); setPage(0); };
  const changeCat    = v => { setCat(v);    setPage(0); };

  if (loading) {
    return (
      <div className="page">
        <div className="page__head">
          <div>
            <div className="page__title"><Bi fr="Journal d'activité" en="Activity Log" /></div>
            {/* TODO: no translation key for this subtitle */}
            <div className="page__sub">Historique de toutes les actions réalisées par les agents de la plateforme</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--ink-400)', fontSize: 14 }}>
          {t.common.loading}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__title"><Bi fr="Journal d'activité" en="Activity Log" /></div>
          {/* TODO: no translation key for this subtitle */}
          <div className="page__sub">Historique de toutes les actions réalisées par les agents de la plateforme</div>
        </div>
        <button className="btn btn--ghost btn--sm"><I.Download />{t.common.export} CSV</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: "Aujourd'hui",   v: logs.filter(l => new Date(l.ts).toISOString().slice(0, 10) === today).length, color: 'var(--brand-600)' }, // TODO: no translation key
          { label: 'Cette semaine', v: logs.length, color: 'var(--ok-600)' }, // TODO: no translation key
          { label: 'Agents actifs', v: [...new Set(logs.map(l => l.user))].length, color: 'var(--ink-700)' }, // TODO: no translation key
          { label: 'Alertes',       v: logs.filter(l => l.kind === 'warn').length, color: 'var(--warn-600)' }, // TODO: no translation key
        ].map((k, i) => (
          <div key={i} className="kpi" style={{ padding: '14px 18px' }}>
            <div className="kpi__label">{k.label}</div>
            <div className="kpi__value" style={{ color: k.color }}>{k.v}</div>
          </div>
        ))}
      </div>

      <div className="card">
        {/* Filters */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
            <I.Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--ink-400)' }} />
            <input
              className="input input--sm"
              placeholder={t.logs.searchPlaceholder}
              value={search}
              onChange={e => changeSearch(e.target.value)}
              style={{ paddingLeft: 32, width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => changeCat(c.id)}
                className={'btn btn--sm ' + (cat === c.id ? 'btn--brand' : 'btn--ghost')}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 150 }}>{t.logs.headers.timestamp}</th>
              <th style={{ width: 120 }}>{t.logs.headers.user}</th>
              <th style={{ width: 160 }}>{t.logs.headers.action}</th>
              <th>{t.logs.headers.details}</th>
              <th style={{ width: 110 }}>{t.common.category}</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink-400)', fontSize: 13 }}>
                  {t.logs.empty}
                </td>
              </tr>
            )}
            {visible.map(log => {
              const kd = KIND_LABELS[log.kind] || KIND_LABELS.neutral;
              const dt = new Date(log.ts);
              const date = dt.toISOString().slice(0, 10);
              const time = dt.toTimeString().slice(0, 5);
              return (
                <tr key={log.id}>
                  <td>
                    <div className="mono" style={{ fontSize: 12, color: 'var(--ink-500)' }}>{date}</div>
                    <div className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{time}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 999, background: 'var(--brand-100)', color: 'var(--brand-700)', fontSize: 10, fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        {log.user.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{log.user}</span>
                    </div>
                  </td>
                  <td><span className={'badge ' + kd.cls}>{log.action}</span></td>
                  <td style={{ fontSize: 12.5, color: 'var(--ink-600)', fontFamily: 'var(--ff-mono)' }}>{log.obj}</td>
                  <td>
                    <span style={{ fontSize: 11.5, padding: '2px 8px', borderRadius: 999, background: 'var(--bg-soft)', border: '1px solid var(--border)', color: 'var(--ink-500)', fontWeight: 600 }}>
                      {CATEGORIES.find(c => c.id === log.cat)?.label || log.cat}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 }}>
            {/* TODO: no translation key for results count */}
            <span style={{ color: 'var(--ink-400)' }}>{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn--ghost btn--sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← {t.common.previous}</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} className={'btn btn--sm ' + (i === page ? 'btn--brand' : 'btn--ghost')} onClick={() => setPage(i)}>{i + 1}</button>
              ))}
              <button className="btn btn--ghost btn--sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>{t.common.next} →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
