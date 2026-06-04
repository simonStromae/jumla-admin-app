import { useState } from 'react';
import I from '../components/Icons.jsx';
import { Bi } from '../components/Shell.jsx';

const ALL_LOGS = [
  { id: 1,  ts: '2026-06-04 14:48', user: 'Aïcha M.',  action: 'Paiement validé',       obj: 'CLI-0418 · Colis #01',      kind: 'ok',      cat: 'payment' },
  { id: 2,  ts: '2026-06-04 14:32', user: 'Marc L.',   action: 'Bordereau créé',         obj: 'BL-2604-01',                kind: 'info',    cat: 'parcel'  },
  { id: 3,  ts: '2026-06-04 13:55', user: 'Aïcha M.',  action: 'Cargaison clôturée',     obj: 'DLA-YUL-APR-01',            kind: 'warn',    cat: 'campaign'},
  { id: 4,  ts: '2026-06-04 13:21', user: 'Admin',     action: 'Agent invité',           obj: 'Thomas D. · agent@jumla.cm',kind: 'neutral', cat: 'admin'   },
  { id: 5,  ts: '2026-06-04 12:07', user: 'Marc L.',   action: 'Colis vérifié',          obj: 'P-0139 — 12,5 kg',          kind: 'ok',      cat: 'parcel'  },
  { id: 6,  ts: '2026-06-04 11:44', user: 'Aïcha M.',  action: 'Statut modifié',         obj: 'DLA-YUL-APR-01 → En transit',kind: 'info',   cat: 'campaign'},
  { id: 7,  ts: '2026-06-04 10:30', user: 'Admin',     action: 'Route modifiée',         obj: 'DLA → YUL · tarif mis à jour',kind: 'warn',  cat: 'settings'},
  { id: 8,  ts: '2026-06-04 09:15', user: 'Aïcha M.',  action: 'Client créé',            obj: 'Jean Mbarga · CLI-0419',    kind: 'info',    cat: 'client'  },
  { id: 9,  ts: '2026-06-03 17:02', user: 'Marc L.',   action: 'Paiement remboursé',     obj: 'CLI-0402 · 65 CAD',         kind: 'warn',    cat: 'payment' },
  { id: 10, ts: '2026-06-03 16:48', user: 'Admin',     action: 'Connexion',              obj: 'Chrome · 192.168.1.x',      kind: 'neutral', cat: 'security'},
  { id: 11, ts: '2026-06-03 15:33', user: 'Aïcha M.',  action: 'Facture complément',     obj: 'CLI-0415 · 27 CAD envoyé',  kind: 'ok',      cat: 'payment' },
  { id: 12, ts: '2026-06-03 14:00', user: 'Thomas D.', action: 'Colis créé',             obj: 'P-0142',                    kind: 'info',    cat: 'parcel'  },
  { id: 13, ts: '2026-06-03 11:20', user: 'Admin',     action: 'Paramètres modifiés',    obj: 'Notifications WhatsApp',    kind: 'neutral', cat: 'settings'},
  { id: 14, ts: '2026-06-03 09:45', user: 'Marc L.',   action: 'Cargaison créée',        obj: 'DLA-YUL-JUN-02',            kind: 'ok',      cat: 'campaign'},
  { id: 15, ts: '2026-06-02 17:11', user: 'Aïcha M.',  action: 'Bordereau imprimé',      obj: 'BL-2604-01 × 3 copies',     kind: 'neutral', cat: 'parcel'  },
];

const CATEGORIES = [
  { id: '',         label: 'Tout' },
  { id: 'payment',  label: 'Paiements' },
  { id: 'parcel',   label: 'Colis' },
  { id: 'campaign', label: 'Cargaisons' },
  { id: 'client',   label: 'Clients' },
  { id: 'settings', label: 'Paramètres' },
  { id: 'security', label: 'Sécurité' },
  { id: 'admin',    label: 'Administration' },
];

const KIND_LABELS = {
  ok:      { label: 'Succès',    cls: 'badge--ok'      },
  info:    { label: 'Info',      cls: 'badge--info'    },
  warn:    { label: 'Attention', cls: 'badge--warn'    },
  neutral: { label: 'Système',   cls: 'badge--neutral' },
};

export default function LogsScreen({ onNav }) {
  const [cat, setCat]    = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage]  = useState(0);
  const PER_PAGE = 10;

  const filtered = ALL_LOGS.filter(l => {
    const matchCat    = !cat || l.cat === cat;
    const q           = search.toLowerCase();
    const matchSearch = !q || l.action.toLowerCase().includes(q) || l.user.toLowerCase().includes(q) || l.obj.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const visible    = filtered.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  const changeSearch = v => { setSearch(v); setPage(0); };
  const changeCat    = v => { setCat(v);    setPage(0); };

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__title"><Bi fr="Journal d'activité" en="Activity Log" /></div>
          <div className="page__sub">Historique de toutes les actions réalisées par les agents de la plateforme</div>
        </div>
        <button className="btn btn--ghost btn--sm"><I.Download />Exporter CSV</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: "Aujourd'hui",   v: ALL_LOGS.filter(l => l.ts.startsWith('2026-06-04')).length, color: 'var(--brand-600)' },
          { label: 'Cette semaine', v: ALL_LOGS.length, color: 'var(--ok-600)' },
          { label: 'Agents actifs', v: [...new Set(ALL_LOGS.map(l => l.user))].length, color: 'var(--ink-700)' },
          { label: 'Alertes',       v: ALL_LOGS.filter(l => l.kind === 'warn').length, color: 'var(--warn-600)' },
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
              placeholder="Rechercher action, agent, objet…"
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
              <th style={{ width: 150 }}>Date / heure</th>
              <th style={{ width: 120 }}>Agent</th>
              <th style={{ width: 160 }}>Action</th>
              <th>Objet</th>
              <th style={{ width: 110 }}>Catégorie</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink-400)', fontSize: 13 }}>
                  Aucune entrée ne correspond à votre recherche.
                </td>
              </tr>
            )}
            {visible.map(log => {
              const kd = KIND_LABELS[log.kind] || KIND_LABELS.neutral;
              const [date, time] = log.ts.split(' ');
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
            <span style={{ color: 'var(--ink-400)' }}>{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn--ghost btn--sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Préc.</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} className={'btn btn--sm ' + (i === page ? 'btn--brand' : 'btn--ghost')} onClick={() => setPage(i)}>{i + 1}</button>
              ))}
              <button className="btn btn--ghost btn--sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Suiv. →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
