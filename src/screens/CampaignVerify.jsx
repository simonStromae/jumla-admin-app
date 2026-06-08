import { useState } from 'react';
import I from '../components/Icons.jsx';

const ITEM_STATUS = {
  pending: { label: 'En attente', color: 'var(--ink-400)',  border: 'var(--border)',   bg: '#FAFAFA' },
  ok:      { label: 'Conforme',   color: 'var(--ok-700)',   border: 'var(--ok-200)',   bg: 'var(--ok-50)' },
  short:   { label: 'Incomplet',  color: 'var(--warn-700)', border: 'var(--warn-200)', bg: 'var(--warn-50)' },
  missing: { label: 'Manquant',   color: 'var(--bad-700)',  border: 'var(--bad-200)',  bg: 'var(--bad-50)' },
};

export default function CampaignVerifyPanel({ parcels, campaign, onExit, onValidate, saving }) {
  const [expanded, setExpanded] = useState({});
  const [itemVerifs, setItemVerifs] = useState(() =>
    Object.fromEntries(parcels.map(p => [
      p.id,
      Object.fromEntries((p.items || []).map(it => [it.id, { qtyReceived: null, note: '' }]))
    ]))
  );
  const [parcelObs, setParcelObs] = useState(() =>
    Object.fromEntries(parcels.map(p => [p.id, '']))
  );

  const getItemStatus = (pid, item) => {
    const v = itemVerifs[pid]?.[item.id];
    if (v?.qtyReceived === null || v?.qtyReceived === undefined) return 'pending';
    if (v.qtyReceived === 0) return 'missing';
    if (v.qtyReceived < item.qty) return 'short';
    return 'ok';
  };

  const getParcelStatus = (p) => {
    const items = p.items || [];
    if (!items.length) return 'pending';
    const statuses = items.map(it => getItemStatus(p.id, it));
    if (statuses.includes('pending')) return 'pending';
    if (statuses.includes('missing') || statuses.includes('short')) return 'issue';
    return 'ok';
  };

  const setQty = (pid, iid, qty) => {
    setItemVerifs(v => ({
      ...v,
      [pid]: { ...v[pid], [iid]: { ...v[pid][iid], qtyReceived: qty } },
    }));
  };

  const setItemNote = (pid, iid, note) => {
    setItemVerifs(v => ({
      ...v,
      [pid]: { ...v[pid], [iid]: { ...v[pid][iid], note } },
    }));
  };

  const markAllOk = (p) => {
    setItemVerifs(v => ({
      ...v,
      [p.id]: Object.fromEntries((p.items || []).map(it => [it.id, { qtyReceived: it.qty, note: '' }])),
    }));
  };

  const resetParcel = (p) => {
    setItemVerifs(v => ({
      ...v,
      [p.id]: Object.fromEntries((p.items || []).map(it => [it.id, { qtyReceived: null, note: '' }])),
    }));
  };

  const counts = { ok: 0, issue: 0, pending: 0 };
  parcels.forEach(p => { counts[getParcelStatus(p)]++; });
  const done  = counts.ok + counts.issue;
  const total = parcels.length;
  const pct   = total > 0 ? Math.round(done / total * 100) : 0;
  const allDone = done === total;

  const sorted = [...parcels].sort((a, b) => {
    const order = { pending: 0, issue: 1, ok: 2 };
    return order[getParcelStatus(a)] - order[getParcelStatus(b)];
  });

  return (
    <div>
      {/* Sticky progress header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'white', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)', padding: '14px 18px',
        marginBottom: 12, boxShadow: 'var(--sh-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>
              Vérification d'arrivée —&nbsp;
              <span className="mono">{campaign.code}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2, display: 'flex', gap: 10 }}>
              <span>{done}/{total} traités</span>
              {counts.ok > 0    && <span style={{ color: 'var(--ok-600)', fontWeight: 600 }}>✓ {counts.ok} conformes</span>}
              {counts.issue > 0 && <span style={{ color: 'var(--bad-600)', fontWeight: 600 }}>⚠ {counts.issue} problèmes</span>}
              {counts.pending > 0 && <span style={{ color: 'var(--ink-400)' }}>{counts.pending} en attente</span>}
            </div>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={onExit}>Quitter</button>
          <button
            className="btn btn--primary btn--sm"
            disabled={!allDone || saving}
            onClick={() => onValidate ? onValidate({ itemVerifs, parcelObs, parcels }) : onExit()}
            style={(!allDone || saving) ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
          >
            <I.Check />{saving ? 'Enregistrement…' : 'Valider la vérification'}
          </button>
        </div>
        <div style={{ height: 6, background: 'var(--ink-100)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 999, width: pct + '%',
            background: counts.issue > 0
              ? `linear-gradient(90deg, var(--ok-500) ${counts.ok / total * 100}%, var(--bad-500) 0)`
              : 'var(--ok-500)',
            transition: 'width .3s ease',
          }} />
        </div>
      </div>

      {/* Parcel rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.map(p => {
          const pStatus      = getParcelStatus(p);
          const isOk         = pStatus === 'ok';
          const isIssue      = pStatus === 'issue';
          const isOpen       = !!expanded[p.id];
          const items        = p.items || [];
          const checkedCount = items.filter(it => getItemStatus(p.id, it) !== 'pending').length;
          const allItemsDone = checkedCount === items.length && items.length > 0;

          return (
            <div key={p.id} style={{
              background: isOk ? 'var(--ok-50)' : isIssue ? 'var(--bad-50)' : 'white',
              border: '1px solid ' + (isOk ? 'var(--ok-200)' : isIssue ? 'var(--bad-200)' : 'var(--border)'),
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              transition: 'background .15s, border-color .15s',
            }}>
              {/* Header row — click to expand */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setExpanded(e => ({ ...e, [p.id]: !e[p.id] }))}
              >
                <div style={{
                  width: 9, height: 9, borderRadius: 999, flexShrink: 0,
                  background: isOk ? 'var(--ok-500)' : isIssue ? 'var(--bad-500)' : 'var(--ink-200)',
                }} />

                <div className="mono" style={{
                  fontSize: 15, fontWeight: 800, minWidth: 52, flexShrink: 0,
                  color: isOk ? 'var(--ok-700)' : isIssue ? 'var(--bad-700)' : 'var(--ink-900)',
                }}>{p.code}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--ink-800)' }}>{p.senderName}</span>
                    <span style={{ color: 'var(--ink-300)', fontSize: 12 }}>→</span>
                    <span style={{ color: 'var(--ink-800)' }}>{p.recipName}</span>
                    <span style={{ color: 'var(--ink-400)', fontSize: 11.5, fontWeight: 500 }}>· {p.recipCity}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 2 }}>
                    {items.length} article{items.length > 1 ? 's' : ''} · {p.actualKg} kg
                    {p.delivery === 'home' ? ' · 🏠 Domicile' : ' · 🏭 Retrait'}
                  </div>
                </div>

                <div style={{
                  fontSize: 11.5, fontWeight: 600, flexShrink: 0,
                  color: allItemsDone ? (isIssue ? 'var(--bad-600)' : 'var(--ok-600)') : 'var(--ink-400)',
                }}>
                  {checkedCount}/{items.length} vérifiés
                </div>

                <div style={{ color: 'var(--ink-400)', flexShrink: 0 }}>
                  {isOpen
                    ? <I.ChevronUp style={{ width: 16, height: 16 }} />
                    : <I.ChevronDown style={{ width: 16, height: 16 }} />}
                </div>
              </div>

              {/* Expanded: item-level verification */}
              {isOpen && (
                <div style={{
                  borderTop: '1px solid ' + (isOk ? 'var(--ok-100)' : isIssue ? 'var(--bad-100)' : 'var(--border-soft)'),
                  padding: '12px 16px 16px',
                  background: 'rgba(0,0,0,.015)',
                }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-400)', marginBottom: 8 }}>
                    Articles du colis
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                    {items.map(item => {
                      const ist = getItemStatus(p.id, item);
                      const iv  = itemVerifs[p.id]?.[item.id] || { qtyReceived: null, note: '' };
                      const cfg = ITEM_STATUS[ist];
                      const hasIssue = ist === 'short' || ist === 'missing';

                      return (
                        <div key={item.id} style={{
                          background: cfg.bg,
                          border: '1px solid ' + cfg.border,
                          borderRadius: 'var(--radius)',
                          padding: '10px 12px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: 120, fontSize: 13, fontWeight: 600, color: 'var(--ink-800)' }}>
                              {item.desc}
                            </div>

                            <div style={{ fontSize: 11.5, color: 'var(--ink-500)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                              Attendu&nbsp;<span className="mono" style={{ fontWeight: 700, color: 'var(--ink-700)' }}>{item.qty}</span>
                            </div>

                            {/* Qty stepper */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                              <span style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>Reçu</span>
                              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--border)', borderRadius: 7, overflow: 'hidden', background: 'white' }}>
                                <button
                                  style={{ width: 28, height: 30, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 15, color: 'var(--ink-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  onClick={e => { e.stopPropagation(); setQty(p.id, item.id, Math.max(0, (iv.qtyReceived ?? item.qty) - 1)); }}
                                >−</button>
                                <input
                                  type="number"
                                  min="0"
                                  value={iv.qtyReceived ?? ''}
                                  placeholder={String(item.qty)}
                                  onClick={e => e.stopPropagation()}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setQty(p.id, item.id, val === '' ? null : Math.max(0, parseInt(val, 10) || 0));
                                  }}
                                  style={{ width: 38, textAlign: 'center', border: 'none', outline: 'none', fontSize: 13, fontWeight: 700, fontFamily: 'monospace', background: 'transparent', padding: 0 }}
                                />
                                <button
                                  style={{ width: 28, height: 30, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 15, color: 'var(--ink-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  onClick={e => { e.stopPropagation(); setQty(p.id, item.id, (iv.qtyReceived ?? item.qty) + 1); }}
                                >+</button>
                              </div>
                            </div>

                            {ist !== 'pending' && (
                              <div style={{
                                fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999,
                                color: cfg.color, background: 'white', border: '1.5px solid ' + cfg.border,
                                flexShrink: 0,
                              }}>
                                {ist === 'ok' ? '✓' : '⚠'} {cfg.label}
                              </div>
                            )}
                          </div>

                          {hasIssue && (
                            <div style={{ marginTop: 8 }}>
                              <input
                                className="input input--sm"
                                placeholder="Observation (ex: carton ouvert, quantité partielle reçue)..."
                                value={iv.note}
                                onClick={e => e.stopPropagation()}
                                onChange={e => setItemNote(p.id, item.id, e.target.value)}
                                style={{ width: '100%', fontSize: 12 }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Parcel-level observation + quick actions */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      className="input input--sm"
                      placeholder="Observation générale sur ce colis (facultatif)..."
                      value={parcelObs[p.id] || ''}
                      onClick={e => e.stopPropagation()}
                      onChange={e => setParcelObs(o => ({ ...o, [p.id]: e.target.value }))}
                      style={{ flex: 1, fontSize: 12 }}
                    />
                    {!allItemsDone ? (
                      <button
                        className="btn btn--sm"
                        style={{ background: 'var(--ok-500)', color: 'white', border: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}
                        onClick={e => { e.stopPropagation(); markAllOk(p); }}
                      >
                        <I.Check style={{ width: 13, height: 13 }} />Tout conforme
                      </button>
                    ) : (
                      <button
                        className="btn btn--ghost btn--xs"
                        style={{ color: 'var(--ink-400)', flexShrink: 0, whiteSpace: 'nowrap' }}
                        onClick={e => { e.stopPropagation(); resetParcel(p); }}
                      >Réinitialiser</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {allDone && (
        <div style={{
          marginTop: 16, padding: '14px 18px',
          background: counts.issue > 0 ? 'var(--warn-50)' : 'var(--ok-50)',
          border: '1px solid ' + (counts.issue > 0 ? 'var(--warn-200)' : 'var(--ok-200)'),
          borderRadius: 'var(--radius-xl)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: counts.issue > 0 ? 'var(--warn-800)' : 'var(--ok-700)' }}>
            {counts.issue > 0
              ? `Vérification terminée avec ${counts.issue} problème${counts.issue > 1 ? 's' : ''} signalé${counts.issue > 1 ? 's' : ''}.`
              : `Tous les colis sont conformes. La cargaison peut être distribuée.`}
          </div>
          <button
            className="btn btn--primary btn--sm"
            disabled={saving}
            onClick={() => onValidate ? onValidate({ itemVerifs, parcelObs, parcels }) : onExit()}
          >
            <I.Check />{saving ? 'Enregistrement…' : 'Valider et fermer'}
          </button>
        </div>
      )}
    </div>
  );
}
