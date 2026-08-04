import { useState } from 'react';
import I from '../components/Icons.jsx';
import { useAdminT } from '../lib/useAdminT.js';

const TH = ({ children, right }) => (
  <th style={{
    padding: '7px 10px', textAlign: right ? 'right' : 'left',
    fontSize: 10.5, fontWeight: 700, letterSpacing: '.05em',
    textTransform: 'uppercase', color: 'var(--ink-500)',
    borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap',
    background: 'var(--ink-50)',
  }}>{children}</th>
);

const TD = ({ children, mono, right, muted, style: sx }) => (
  <td style={{
    padding: '8px 10px', fontSize: 13,
    fontFamily: mono ? 'monospace' : undefined,
    textAlign: right ? 'right' : 'left',
    color: muted ? 'var(--ink-400)' : 'var(--ink-800)',
    borderBottom: '1px solid var(--border-soft)',
    ...sx,
  }}>{children}</td>
);

export default function CampaignVerifyPanel({ parcels, campaign, onExit, onSaveParcel, onClose, closing }) {
  const t = useAdminT();

  // Verify status options — labels translated where keys exist
  // TODO: no exact translation keys for 'Écart' (issue) and 'Manquant' (missing)
  const VERIF_OPTIONS = [
    { value: 'pending', label: '— ' + t.verify.pending,  color: 'var(--ink-400)' },
    { value: 'ok',      label: '✓ ' + t.verify.verified, color: 'var(--ok-700)' },
    { value: 'issue',   label: '⚠ Écart',                color: 'var(--warn-700)' },
    { value: 'missing', label: '✕ Manquant',             color: 'var(--bad-700)' },
  ];

  const [expanded, setExpanded]   = useState({});
  // A parcel is pre-saved if all its bordereaux already have a non-pending status
  const [saved, setSaved] = useState(() =>
    Object.fromEntries(parcels.map(p => {
      const rows = p.rows || [];
      const allDone = rows.length > 0 && rows.every(r => r.blStatus && r.blStatus !== 'en_attente');
      return [p.id, allDone];
    }))
  );
  const [saving,    setSavingMap] = useState({});   // parcelId → true
  const [saveError, setSaveError] = useState(null); // last save error message

  const initVerifRow = (r) => {
    // Prefer per-item state saved in items JSON (_verifStatus et al.)
    if (r.verifStatus) {
      return { status: r.verifStatus, ecart: r.verifEcart ?? 0, note: r.verifNote ?? '' };
    }
    // Fallback to bordereau-level status (single row bordereaux)
    if (r.blStatus === 'verifie') return { status: 'ok',    ecart: 0, note: r.verifNote || '' };
    if (r.blStatus === 'ecart')   return { status: 'issue', ecart: 0, note: r.verifNote || '' };
    return                               { status: 'pending', ecart: 0, note: '' };
  };

  const initVerifs = (p) =>
    Object.fromEntries((p.rows || []).map(r => [r.id, initVerifRow(r)]));

  const [verifs, setVerifs] = useState(() =>
    Object.fromEntries(parcels.map(p => [p.id, initVerifs(p)]))
  );

  const setRowField = (pid, rid, field, value) => {
    setVerifs(v => ({ ...v, [pid]: { ...v[pid], [rid]: { ...v[pid][rid], [field]: value } } }));
    setSaved(s => ({ ...s, [pid]: false }));
  };

  const setRowStatus = (pid, rid, status) => {
    setVerifs(v => {
      const row = (parcels.find(p => p.id === pid)?.rows || []).find(r => r.id === rid);
      const prev = v[pid]?.[rid] ?? { status: 'pending', ecart: 0, note: '' };
      // Auto-fill écart with full nb when marking as missing
      const ecart = status === 'missing' ? (row?.nb ?? 1) : prev.ecart;
      return { ...v, [pid]: { ...v[pid], [rid]: { ...prev, status, ecart } } };
    });
    setSaved(s => ({ ...s, [pid]: false }));
  };

  const markAllOk = (p) => {
    setVerifs(v => ({
      ...v,
      [p.id]: Object.fromEntries((p.rows || []).map(r => [r.id, { status: 'ok', ecart: 0, note: '' }])),
    }));
    setSaved(s => ({ ...s, [p.id]: false }));
  };

  const getParcelStatus = (p) => {
    const rows = p.rows || [];
    if (!rows.length) return 'pending';
    const statuses = rows.map(r => verifs[p.id]?.[r.id]?.status ?? 'pending');
    if (statuses.every(s => s === 'ok')) return 'ok';
    if (statuses.includes('pending')) return 'pending';
    return 'issue';
  };

  const handleSave = async (p) => {
    setSavingMap(s => ({ ...s, [p.id]: true }));
    setSaveError(null);
    try {
      await onSaveParcel(p, verifs);
      setSaved(s => ({ ...s, [p.id]: true }));
    } catch (err) {
      setSaveError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSavingMap(s => ({ ...s, [p.id]: false }));
    }
  };

  const counts = { ok: 0, issue: 0, pending: 0 };
  parcels.forEach(p => counts[getParcelStatus(p)]++);
  const done  = counts.ok + counts.issue;
  const total = parcels.length;
  const pct   = total > 0 ? Math.round(done / total * 100) : 0;
  const allSaved = parcels.every(p => saved[p.id]);

  return (
    <div>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'white', border: '1px solid var(--border)',
        borderRadius: 12, padding: '14px 18px',
        marginBottom: 12, boxShadow: 'var(--sh-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-900)' }}>
              {/* TODO: no exact translation key for 'Contrôle arrivée'; using t.verify.title as close match */}
              {t.verify.title} — <span className="mono">{campaign.code}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2, display: 'flex', gap: 10 }}>
              {/* TODO: no exact translation key for 'traités' */}
              <span>{done}/{total} traités</span>
              {counts.ok      > 0 && <span style={{ color: 'var(--ok-600)',   fontWeight: 600 }}>✓ {counts.ok} {t.verify.verified}</span>}
              {/* TODO: no exact translation key for 'écarts' */}
              {counts.issue   > 0 && <span style={{ color: 'var(--bad-600)', fontWeight: 600 }}>⚠ {counts.issue} écarts</span>}
              {counts.pending > 0 && <span style={{ color: 'var(--ink-400)' }}>{counts.pending} {t.verify.pending}</span>}
            </div>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={onExit}>{t.common.close}</button>
          <button
            className="btn btn--primary btn--sm"
            disabled={!allSaved || closing}
            onClick={onClose}
            title={!allSaved ? 'Sauvegardez tous les colis d\'abord' : '' /* TODO: no exact translation key */}
            style={!allSaved || closing ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
          >
            {/* TODO: 'Valider et clôturer' has no exact key; using t.common.confirm as close match */}
            <I.Check />{closing ? t.common.saving : t.common.confirm}
          </button>
        </div>
        <div style={{ height: 6, background: 'var(--ink-100)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 999, width: pct + '%',
            background: counts.issue > 0
              ? `linear-gradient(90deg, var(--ok-500) ${counts.ok / (total || 1) * 100}%, var(--bad-500) 0)`
              : 'var(--ok-500)',
            transition: 'width .3s ease',
          }} />
        </div>
        {saveError && (
          <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--bad-50)', border: '1px solid var(--bad-200)', borderRadius: 8, fontSize: 12.5, color: 'var(--bad-700)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚠</span>
            <span style={{ flex: 1 }}>{saveError}</span>
            <button onClick={() => setSaveError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bad-500)', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
          </div>
        )}
      </div>

      {/* Parcel cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {parcels.map(p => {
          const pStatus   = getParcelStatus(p);
          const isOk      = pStatus === 'ok';
          const isIssue   = pStatus === 'issue';
          const isOpen    = !!expanded[p.id];
          const isSaved   = !!saved[p.id];
          const isSaving  = !!saving[p.id];
          const rows      = p.rows || [];
          const checkedNb = rows.filter(r => (verifs[p.id]?.[r.id]?.status ?? 'pending') !== 'pending').length;
          const totalNb   = rows.reduce((s, r) => s + (r.nb || 1), 0);
          const conformes = rows
            .filter(r => verifs[p.id]?.[r.id]?.status === 'ok')
            .reduce((s, r) => s + (r.nb || 1), 0);
          const ecarts    = rows
            .filter(r => ['issue', 'missing'].includes(verifs[p.id]?.[r.id]?.status ?? ''))
            .reduce((s, r) => {
              const v = verifs[p.id]?.[r.id];
              return s + (Number(v?.ecart) || (v?.status === 'missing' ? (r.nb || 1) : 0));
            }, 0);

          const borderColor = isOk ? 'var(--ok-200)' : isIssue ? 'var(--warn-200)' : 'var(--border)';
          const bgColor     = isOk ? 'var(--ok-50)'  : isIssue ? 'var(--warn-50)'  : 'white';

          return (
            <div key={p.id} style={{
              border: '1px solid ' + borderColor,
              borderRadius: 12, overflow: 'hidden',
              background: bgColor,
              transition: 'border-color .15s, background .15s',
            }}>
              {/* Card header */}
              <div
                onClick={() => setExpanded(e => ({ ...e, [p.id]: !e[p.id] }))}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{
                  width: 9, height: 9, borderRadius: 999, flexShrink: 0,
                  background: isOk ? 'var(--ok-500)' : isIssue ? 'var(--warn-500)' : 'var(--ink-200)',
                }} />
                <div className="mono" style={{
                  fontSize: 15, fontWeight: 800, minWidth: 60, flexShrink: 0,
                  color: isOk ? 'var(--ok-700)' : isIssue ? 'var(--warn-700)' : 'var(--ink-900)',
                }}>{p.code}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)' }}>{p.senderName}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 1 }}>
                    {/* TODO: no exact translation key for 'ligne(s)' */}
                    {rows.length} ligne{rows.length > 1 ? 's' : ''} · {p.actualKg} kg
                  </div>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-400)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {checkedNb}/{rows.length} {t.verify.verified}
                </div>
                {isSaved && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ok-700)', flexShrink: 0 }}>✓ {t.common.save}</span>
                )}
                <div style={{ color: 'var(--ink-400)', flexShrink: 0 }}>
                  {isOpen ? <I.ChevronUp style={{ width: 16, height: 16 }} /> : <I.ChevronDown style={{ width: 16, height: 16 }} />}
                </div>
              </div>

              {/* Expanded content */}
              {isOpen && (
                <div style={{ borderTop: '1px solid ' + (isOk ? 'var(--ok-100)' : isIssue ? 'var(--warn-100)' : 'var(--border-soft)') }}>
                  {/* Sender / Recipient info */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderBottom: '1px solid var(--border-soft)' }}>
                    {[
                      // TODO: no exact translation keys for 'Expéditeur' / 'Destinataire'
                      { label: 'Expéditeur / Sender', name: p.senderName, phone: p.senderPhone, city: '' },
                      { label: 'Destinataire / Recipient', name: p.recipName, phone: p.senderPhone, city: p.recipCity },
                    ].map((side, i) => (
                      <div key={i} style={{
                        padding: '12px 16px',
                        borderRight: i === 0 ? '1px solid var(--border-soft)' : 'none',
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-400)', marginBottom: 6 }}>
                          {side.label}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                            background: 'var(--brand-100)', color: 'var(--brand-700)',
                            display: 'grid', placeItems: 'center',
                            fontSize: 12, fontWeight: 700,
                          }}>
                            {side.name.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{side.name}</div>
                            <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>{side.phone}</div>
                            {side.city && <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>{side.city}</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Table header */}
                  <div style={{ padding: '10px 16px 6px', display: 'flex', alignItems: 'baseline', gap: 14, borderBottom: '1px solid var(--border-soft)' }}>
                    <div>
                      {/* TODO: 'Vérification du contenu' has no exact key; using t.verify.title as close match */}
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{t.verify.title}</div>
                      {/* TODO: no exact translation key for 'Pointage à l'arrivée' */}
                      <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>Pointage à l&apos;arrivée</div>
                    </div>
                    <div style={{ flex: 1 }} />
                    {[
                      // TODO: no exact translation keys for 'Lignes', 'Conformes', 'Écarts'
                      { l: 'Lignes',    v: rows.length, color: 'var(--ink-700)' },
                      { l: t.common.total, v: totalNb,  color: 'var(--ink-700)' },
                      { l: 'Conformes', v: conformes,   color: 'var(--ok-600)' },
                      { l: 'Écarts',    v: ecarts,      color: ecarts > 0 ? 'var(--bad-600)' : 'var(--ink-400)' },
                    ].map(({ l, v, color }) => (
                      <div key={l} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color }} className="mono">{v}</div>
                        <div style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--ink-400)', fontWeight: 600 }}>{l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Verification table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <TH>#</TH>
                          {/* TODO: no exact translation key for 'Désignation' */}
                          <TH>Désignation</TH>
                          <TH>{t.common.description}</TH>
                          <TH>{t.common.type}</TH>
                          {/* TODO: no exact translation keys for 'NB' and 'Pièces' */}
                          <TH right>NB</TH>
                          <TH right>Pièces</TH>
                          {/* TODO: 'Vérification' col header; using t.verify.title as close match */}
                          <TH>{t.verify.title}</TH>
                          {/* TODO: no exact translation key for 'Écart' */}
                          <TH right>Écart</TH>
                          <TH>{t.common.note}</TH>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, idx) => {
                          const rv  = verifs[p.id]?.[row.id] ?? { status: 'pending', ecart: 0, note: '' };
                          const opt = VERIF_OPTIONS.find(o => o.value === rv.status) ?? VERIF_OPTIONS[0];
                          const hasIssue = rv.status === 'issue' || rv.status === 'missing';

                          return (
                            <tr key={row.id} style={{
                              background: rv.status === 'ok' ? 'var(--ok-50)'
                                : hasIssue ? 'var(--warn-50)'
                                : 'transparent',
                            }}>
                              <TD muted mono>{idx + 1}</TD>
                              <TD><span style={{ fontWeight: 600 }}>{row.designation}</span></TD>
                              <TD muted>{row.description}</TD>
                              <TD>{row.type}</TD>
                              <TD right mono>{row.nb}</TD>
                              <TD right mono muted={row.pieces == null}>{row.pieces ?? '—'}</TD>
                              <TD style={{ minWidth: 150 }}>
                                <select
                                  value={rv.status}
                                  onChange={e => setRowStatus(p.id, row.id, e.target.value)}
                                  style={{
                                    appearance: 'none', WebkitAppearance: 'none',
                                    border: '1.5px solid var(--border)',
                                    borderRadius: 7, padding: '4px 28px 4px 8px',
                                    fontSize: 12.5, fontWeight: 600,
                                    color: opt.color,
                                    background: `white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236b7280'/%3E%3C/svg%3E") no-repeat right 8px center`,
                                    cursor: 'pointer', width: '100%',
                                  }}
                                >
                                  {VERIF_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                  ))}
                                </select>
                              </TD>
                              <TD right style={{ minWidth: 70 }}>
                                <input
                                  type="number" min="0"
                                  value={hasIssue ? rv.ecart : 0}
                                  disabled={!hasIssue}
                                  onChange={e => setRowField(p.id, row.id, 'ecart', Math.max(0, parseInt(e.target.value, 10) || 0))}
                                  onClick={e => e.stopPropagation()}
                                  style={{
                                    width: 54, textAlign: 'right', border: '1.5px solid var(--border)',
                                    borderRadius: 6, padding: '3px 6px', fontSize: 13, fontFamily: 'monospace',
                                    background: hasIssue ? 'white' : 'transparent',
                                    color: hasIssue && rv.ecart > 0 ? 'var(--bad-600)' : 'var(--ink-400)',
                                    opacity: hasIssue ? 1 : 0.4,
                                  }}
                                />
                              </TD>
                              <TD style={{ minWidth: 180 }}>
                                <input
                                  type="text"
                                  value={rv.note || ''}
                                  placeholder={hasIssue ? t.common.notes : '—'}
                                  disabled={!hasIssue}
                                  onChange={e => setRowField(p.id, row.id, 'note', e.target.value)}
                                  onClick={e => e.stopPropagation()}
                                  style={{
                                    width: '100%', border: '1.5px solid ' + (hasIssue ? 'var(--border)' : 'transparent'),
                                    borderRadius: 6, padding: '3px 7px', fontSize: 12,
                                    background: hasIssue ? 'white' : 'transparent',
                                    opacity: hasIssue ? 1 : 0.35,
                                  }}
                                />
                              </TD>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Card footer */}
                  <div style={{
                    padding: '10px 16px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    borderTop: '1px solid var(--border-soft)',
                    background: isOk
                      ? 'var(--ok-50)'
                      : isIssue ? 'var(--warn-50)' : 'var(--ink-50)',
                  }}>
                    {isOk && (
                      <span style={{ fontSize: 13, color: 'var(--ok-700)', fontWeight: 600, flex: 1 }}>
                        {/* TODO: no exact translation key for this confirmation message */}
                        ✓ Contenu conforme. Prêt pour validation.
                      </span>
                    )}
                    {isIssue && (
                      <span style={{ fontSize: 13, color: 'var(--warn-700)', fontWeight: 600, flex: 1 }}>
                        {/* TODO: no exact translation key for this issue count message */}
                        ⚠ {rows.filter(r => ['issue','missing'].includes(verifs[p.id]?.[r.id]?.status ?? '')).length} écart(s) signalé(s).
                      </span>
                    )}
                    {pStatus === 'pending' && (
                      <span style={{ fontSize: 13, color: 'var(--ink-400)', flex: 1 }}>
                        {/* TODO: 'En cours de vérification…' has no exact key; using t.verify.pending as close match */}
                        {t.verify.pending}…
                      </span>
                    )}

                    {checkedNb < rows.length && (
                      <button
                        className="btn btn--sm"
                        style={{ background: 'var(--ok-500)', color: 'white', border: 'none' }}
                        onClick={e => { e.stopPropagation(); markAllOk(p); }}
                      >
                        {/* TODO: no exact translation key for 'Tout conforme' */}
                        <I.Check style={{ width: 13, height: 13 }} /> Tout conforme
                      </button>
                    )}
                    <button
                      className="btn btn--primary btn--sm"
                      disabled={isSaving || checkedNb < rows.length}
                      onClick={e => { e.stopPropagation(); handleSave(p); }}
                      style={checkedNb < rows.length ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                    >
                      {isSaving ? t.common.saving : isSaved ? '✓ ' + t.common.save : t.common.save}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom banner when all saved */}
      {allSaved && parcels.length > 0 && (
        <div style={{
          marginTop: 16, padding: '14px 18px',
          background: counts.issue > 0 ? 'var(--warn-50)' : 'var(--ok-50)',
          border: '1px solid ' + (counts.issue > 0 ? 'var(--warn-200)' : 'var(--ok-200)'),
          borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: counts.issue > 0 ? 'var(--warn-800)' : 'var(--ok-700)' }}>
            {/* TODO: no exact translation keys for these summary banner messages */}
            {counts.issue > 0
              ? `Vérification terminée avec ${counts.issue} colis signalé${counts.issue > 1 ? 's' : ''}.`
              : `Tous les colis sont conformes. La cargaison peut être distribuée.`}
          </div>
          <button
            className="btn btn--primary btn--sm"
            disabled={closing}
            onClick={onClose}
          >
            {/* TODO: 'Valider et clôturer' has no exact key; using t.common.confirm as close match */}
            <I.Check />{closing ? t.common.saving : t.common.confirm}
          </button>
        </div>
      )}
    </div>
  );
}
