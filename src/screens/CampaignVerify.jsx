import { useState } from 'react';
import I from '../components/Icons.jsx';

export default function CampaignVerifyPanel({ parcels, campaign, onExit }) {
  const [verifs, setVerifs] = useState(() =>
    Object.fromEntries(parcels.map(p => [p.id, { status: 'pending', note: '' }]))
  );
  const [issueId, setIssueId] = useState(null);
  const [issueNote, setIssueNote] = useState('');

  const markOk = (id) => {
    setVerifs(v => ({ ...v, [id]: { status: 'ok', note: '' } }));
    setIssueId(null);
  };

  const openIssue = (id) => {
    setIssueId(id);
    setIssueNote('');
  };

  const confirmIssue = (id) => {
    setVerifs(v => ({ ...v, [id]: { status: 'issue', note: issueNote } }));
    setIssueId(null);
    setIssueNote('');
  };

  const reset = (id) => {
    setVerifs(v => ({ ...v, [id]: { status: 'pending', note: '' } }));
    setIssueId(id === issueId ? null : issueId);
  };

  const counts = {
    ok:      Object.values(verifs).filter(v => v.status === 'ok').length,
    issue:   Object.values(verifs).filter(v => v.status === 'issue').length,
    pending: Object.values(verifs).filter(v => v.status === 'pending').length,
  };
  const done  = counts.ok + counts.issue;
  const total = parcels.length;
  const pct   = total > 0 ? Math.round(done / total * 100) : 0;
  const allDone = done === total;

  const sorted = [...parcels].sort((a, b) => {
    const order = { pending: 0, issue: 1, ok: 2 };
    return order[verifs[a.id]?.status] - order[verifs[b.id]?.status];
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
              {counts.ok > 0 && <span style={{ color: 'var(--ok-600)', fontWeight: 600 }}>✓ {counts.ok} conformes</span>}
              {counts.issue > 0 && <span style={{ color: 'var(--bad-600)', fontWeight: 600 }}>⚠ {counts.issue} problèmes</span>}
              {counts.pending > 0 && <span style={{ color: 'var(--ink-400)' }}>{counts.pending} en attente</span>}
            </div>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={onExit}>Quitter</button>
          <button
            className="btn btn--primary btn--sm"
            disabled={!allDone}
            onClick={onExit}
            style={!allDone ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
          >
            <I.Check />Valider la vérification
          </button>
        </div>

        <div style={{ height: 6, background: 'var(--ink-100)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 999,
            width: pct + '%',
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
          const v = verifs[p.id] || { status: 'pending', note: '' };
          const isOk      = v.status === 'ok';
          const isIssue   = v.status === 'issue';
          const isPending = v.status === 'pending';
          const isNoteOpen = issueId === p.id;

          return (
            <div key={p.id} style={{
              background: isOk ? 'var(--ok-50)' : isIssue ? 'var(--bad-50)' : 'white',
              border: '1px solid ' + (isOk ? 'var(--ok-200)' : isIssue ? 'var(--bad-200)' : 'var(--border)'),
              borderRadius: 'var(--radius-xl)',
              padding: '12px 16px',
              transition: 'background .15s, border-color .15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* Status dot */}
                <div style={{
                  width: 9, height: 9, borderRadius: 999, flexShrink: 0,
                  background: isOk ? 'var(--ok-500)' : isIssue ? 'var(--bad-500)' : 'var(--ink-200)',
                }} />

                {/* Code */}
                <div className="mono" style={{
                  fontSize: 15, fontWeight: 800, minWidth: 52, flexShrink: 0,
                  color: isOk ? 'var(--ok-700)' : isIssue ? 'var(--bad-700)' : 'var(--ink-900)',
                }}>{p.code}</div>

                {/* Sender → Recipient */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--ink-800)' }}>{p.senderName}</span>
                    <span style={{ color: 'var(--ink-300)', fontSize: 12 }}>→</span>
                    <span style={{ color: 'var(--ink-800)' }}>{p.recipName}</span>
                    <span style={{ color: 'var(--ink-400)', fontSize: 11.5, fontWeight: 500 }}>· {p.recipCity}</span>
                  </div>
                  {isIssue && v.note && (
                    <div style={{ fontSize: 11.5, color: 'var(--bad-700)', marginTop: 3, fontWeight: 600 }}>
                      ⚠ {v.note}
                    </div>
                  )}
                </div>

                {/* Weight */}
                <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', flexShrink: 0 }}>
                  {p.actualKg} kg
                </div>

                {/* Delivery type */}
                <div style={{ fontSize: 11.5, color: 'var(--ink-400)', flexShrink: 0, minWidth: 70 }}>
                  {p.delivery === 'home' ? '🏠 Domicile' : '🏭 Retrait'}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {isPending && (
                    <>
                      <button
                        className="btn btn--sm"
                        style={{ background: 'var(--ok-500)', color: 'white', border: 'none' }}
                        onClick={() => markOk(p.id)}
                      >
                        <I.Check />Conforme
                      </button>
                      <button
                        className="btn btn--ghost btn--sm"
                        style={{ color: 'var(--bad-600)', borderColor: 'var(--bad-200)' }}
                        onClick={() => openIssue(p.id)}
                      >
                        <I.Alert />Problème
                      </button>
                    </>
                  )}
                  {(isOk || isIssue) && !isNoteOpen && (
                    <button
                      className="btn btn--ghost btn--xs"
                      style={{ color: 'var(--ink-400)' }}
                      onClick={() => reset(p.id)}
                    >
                      Modifier
                    </button>
                  )}
                </div>
              </div>

              {/* Issue note input */}
              {isNoteOpen && (
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <input
                    className="input input--sm"
                    autoFocus
                    placeholder="Décrivez le problème : manquant, endommagé, poids incorrect..."
                    value={issueNote}
                    onChange={e => setIssueNote(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') confirmIssue(p.id);
                      if (e.key === 'Escape') setIssueId(null);
                    }}
                  />
                  <button
                    className="btn btn--sm"
                    style={{ background: 'var(--bad-500)', color: 'white', border: 'none', flexShrink: 0 }}
                    onClick={() => confirmIssue(p.id)}
                  >
                    Confirmer
                  </button>
                  <button
                    className="btn btn--ghost btn--sm"
                    style={{ flexShrink: 0 }}
                    onClick={() => setIssueId(null)}
                  >
                    Annuler
                  </button>
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
          <button className="btn btn--primary btn--sm" onClick={onExit}>
            <I.Check />Valider et fermer
          </button>
        </div>
      )}
    </div>
  );
}
