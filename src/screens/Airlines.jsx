import { useState, useEffect } from 'react';
import I from '../components/Icons.jsx';
import { useAdminT } from '../lib/useAdminT.js';

const COUNTRIES = [
  'Allemagne', 'Canada', 'Cameroun', 'Éthiopie', 'Émirats arabes unis',
  'France', 'Grande-Bretagne', 'Kenya', 'Maroc', 'Pays-Bas',
  'Qatar', 'Sénégal', 'Turquie', 'États-Unis',
];

const EMPTY = { name: '', iata: '', country: '', logoUrl: '' };

function AirlineModal({ airline, onSave, onClose }) {
  const t = useAdminT();
  const [form, setForm] = useState(airline ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.name.trim()) { setErr(t.airlines.headers.name + ' *'); return; }
    setSaving(true);
    setErr('');
    const url    = airline ? `/api/airlines/${airline.id}` : '/api/airlines';
    const method = airline ? 'PUT' : 'POST';
    const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data   = await res.json();
    if (!res.ok) { setErr(data.error ?? t.common.error); setSaving(false); return; }
    onSave(data.airline);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,.22)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--brand-50)', display: 'grid', placeItems: 'center' }}>
            <I.Plane style={{ width: 16, height: 16, color: 'var(--brand-600)' }} />
          </div>
          <div style={{ flex: 1, fontSize: 15, fontWeight: 700 }}>
            {airline ? t.common.edit : t.airlines.new}
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 999, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: 16, color: 'var(--ink-400)', display: 'grid', placeItems: 'center' }}>×</button>
        </div>

        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {err && <div style={{ padding: '10px 14px', background: 'var(--bad-50)', border: '1px solid var(--bad-200)', borderRadius: 8, fontSize: 13, color: 'var(--bad-700)' }}>{err}</div>}

          <div className="field">
            <label className="label">{t.airlines.headers.name} *</label>
            <input className="input" value={form.name} onChange={e => upd('name', e.target.value)} placeholder="Ex: Lufthansa Cargo" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label className="label">{t.airlines.headers.iata}</label>
              <input className="input" value={form.iata} onChange={e => upd('iata', e.target.value.toUpperCase())} placeholder="Ex: LH" maxLength={3} />
            </div>
            <div className="field">
              {/* TODO: no exact key for "Pays d'origine" */}
              <label className="label">Pays d'origine</label>
              <select className="input" value={form.country} onChange={e => upd('country', e.target.value)}>
                {/* TODO: no exact key for "Sélectionner" placeholder */}
                <option value="">— Sélectionner —</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="field">
            {/* TODO: no exact key for "URL du logo" */}
            <label className="label">URL du logo <span style={{ fontWeight: 400, color: 'var(--ink-400)' }}>({t.common.optional})</span></label>
            <input className="input" value={form.logoUrl} onChange={e => upd('logoUrl', e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn btn--ghost" onClick={onClose}>{t.common.cancel}</button>
          <button className="btn btn--brand" disabled={saving} onClick={handleSave}>
            <I.Check style={{ width: 14, height: 14 }} />
            {saving ? t.common.saving : airline ? t.common.save : t.common.create}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AirlinesScreen() {
  const t = useAdminT();
  const [airlines, setAirlines] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null); // null | {} | {airline}
  const [deleting, setDeleting] = useState(null);
  const [delErr,   setDelErr]   = useState('');

  useEffect(() => {
    fetch('/api/airlines').then(r => r.json()).then(data => { setAirlines(data); setLoading(false); });
  }, []);

  function handleSaved(airline) {
    setAirlines(prev => {
      const idx = prev.findIndex(a => a.id === airline.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = airline; return next; }
      return [...prev, airline].sort((a, b) => a.name.localeCompare(b.name));
    });
    setModal(null);
  }

  async function handleToggle(a) {
    const res = await fetch(`/api/airlines/${a.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...a, active: !a.active }),
    });
    if (res.ok) {
      const { airline } = await res.json();
      setAirlines(prev => prev.map(x => x.id === airline.id ? airline : x));
    }
  }

  async function handleDelete(a) {
    setDeleting(a.id);
    setDelErr('');
    const res = await fetch(`/api/airlines/${a.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { setDelErr(data.error); setDeleting(null); return; }
    setAirlines(prev => prev.filter(x => x.id !== a.id));
    setDeleting(null);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.airlines.title}</h1>
          {/* TODO: no exact key for subtitle "Gérez les transporteurs utilisés dans vos cargaisons" */}
          <p className="page-sub">Gérez les transporteurs utilisés dans vos cargaisons</p>
        </div>
        <button className="btn btn--brand" onClick={() => setModal({})}>
          <I.Plus style={{ width: 14, height: 14 }} /> {t.airlines.new}
        </button>
      </div>

      {delErr && (
        <div style={{ margin: '0 0 14px', padding: '10px 16px', background: 'var(--bad-50)', border: '1px solid var(--bad-200)', borderRadius: 8, fontSize: 13, color: 'var(--bad-700)' }}>
          {delErr}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-400)' }}>{t.common.loading}</div>
      ) : airlines.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✈️</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>{t.airlines.empty}</div>
          {/* TODO: no exact key for empty-state description */}
          <div style={{ fontSize: 13, color: 'var(--ink-400)', marginBottom: 20 }}>Commencez par ajouter les compagnies qui transportent vos cargaisons.</div>
          <button className="btn btn--brand" onClick={() => setModal({})}>
            <I.Plus style={{ width: 14, height: 14 }} /> {t.airlines.new}
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {airlines.map(a => (
            <div key={a.id} className="card" style={{ padding: 0, overflow: 'hidden', opacity: a.active ? 1 : 0.65 }}>
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                {a.logoUrl ? (
                  <img src={a.logoUrl} alt={a.name} style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-soft)' }} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--brand-50)', display: 'grid', placeItems: 'center', border: '1px solid var(--brand-100)', flexShrink: 0 }}>
                    <I.Plane style={{ width: 20, height: 20, color: 'var(--brand-500)' }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>{a.name}</span>
                    {a.iata && <span className="mono" style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', background: 'var(--brand-50)', color: 'var(--brand-700)', borderRadius: 5, border: '1px solid var(--brand-100)' }}>{a.iata}</span>}
                    {!a.active && <span className="badge" style={{ background: 'var(--bad-50)', color: 'var(--bad-700)', border: '1px solid var(--bad-200)' }}>{t.common.inactive}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>
                    {a.country && <span>{a.country} · </span>}
                    {/* TODO: no exact key for "cargaison(s)" */}
                    <span>{a._count?.legs ?? 0} cargaison(s)</span>
                  </div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border-soft)', padding: '10px 16px', display: 'flex', gap: 8, background: 'var(--bg-soft)' }}>
                <button className="btn btn--ghost btn--sm" onClick={() => setModal(a)}>
                  <I.Edit style={{ width: 13, height: 13 }} /> {t.common.edit}
                </button>
                {/* TODO: no exact keys for "Désactiver"/"Activer" actions; using status labels as closest match */}
                <button className="btn btn--ghost btn--sm" onClick={() => handleToggle(a)}>
                  {a.active ? t.common.inactive : t.common.active}
                </button>
                <div style={{ flex: 1 }} />
                <button
                  className="btn btn--sm"
                  disabled={deleting === a.id}
                  onClick={() => handleDelete(a)}
                  style={{ background: 'var(--bad-50)', color: 'var(--bad-700)', border: '1px solid var(--bad-100)' }}>
                  <I.Trash style={{ width: 13, height: 13 }} />
                  {deleting === a.id ? '…' : t.common.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <AirlineModal
          airline={modal?.id ? modal : null}
          onSave={handleSaved}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
