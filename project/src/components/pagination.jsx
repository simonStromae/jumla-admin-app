// ============================================
// ZENDIT — Reusable: Pagination + View toggle
// ============================================

function Pagination({ total, page, pageSize, onPageChange, onPageSizeChange, sizes = [10, 25, 50, 100] }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  // Build page list with ellipses
  const pagesToShow = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pagesToShow.push(i);
  } else {
    pagesToShow.push(1);
    if (page > 3) pagesToShow.push('…');
    const startP = Math.max(2, page - 1);
    const endP = Math.min(totalPages - 1, page + 1);
    for (let i = startP; i <= endP; i++) pagesToShow.push(i);
    if (page < totalPages - 2) pagesToShow.push('…');
    pagesToShow.push(totalPages);
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', marginTop: 0,
      background: 'white', border: '1px solid var(--border)', borderTop: 0,
      borderRadius: '0 0 10px 10px',
      fontSize: 12.5, color: 'var(--ink-500)',
    }}>
      <span>
        <strong className="mono" style={{ color: 'var(--ink-800)' }}>{start}–{end}</strong>
        <span style={{ margin: '0 4px' }}>sur</span>
        <strong className="mono" style={{ color: 'var(--ink-800)' }}>{total.toLocaleString('fr')}</strong>
      </span>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 10 }}>
        <span style={{ color: 'var(--ink-400)' }}>Lignes</span>
        <select className="select input--sm" value={pageSize} onChange={e => onPageSizeChange?.(+e.target.value)} style={{ width: 64, height: 26, padding: '0 6px', fontSize: 12, fontWeight: 600 }}>
          {sizes.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="spacer" style={{ flex: 1 }}/>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        <button className="icon-btn" disabled={page <= 1} onClick={() => onPageChange(1)}
          style={page <= 1 ? { opacity: 0.3, cursor: 'not-allowed' } : {}}
          title="Première page">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 18l-6-6 6-6M18 18l-6-6 6-6"/></svg>
        </button>
        <button className="icon-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}
          style={page <= 1 ? { opacity: 0.3, cursor: 'not-allowed' } : {}}
          title="Précédent">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>

        {pagesToShow.map((p, i) =>
          p === '…'
            ? <span key={i} style={{ padding: '0 6px', color: 'var(--ink-300)' }}>…</span>
            : <button key={i}
                onClick={() => onPageChange(p)}
                className="mono"
                style={{
                  minWidth: 28, height: 28,
                  padding: '0 8px',
                  fontSize: 12, fontWeight: p === page ? 700 : 500,
                  background: p === page ? 'var(--ink-900)' : 'transparent',
                  color: p === page ? 'white' : 'var(--ink-600)',
                  border: '1px solid ' + (p === page ? 'var(--ink-900)' : 'transparent'),
                  borderRadius: 6, cursor: 'pointer',
                }}>{p}</button>
        )}

        <button className="icon-btn" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}
          style={page >= totalPages ? { opacity: 0.3, cursor: 'not-allowed' } : {}}
          title="Suivant">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <button className="icon-btn" disabled={page >= totalPages} onClick={() => onPageChange(totalPages)}
          style={page >= totalPages ? { opacity: 0.3, cursor: 'not-allowed' } : {}}
          title="Dernière page">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 18l6-6-6-6M6 18l6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  );
}

// View toggle (grid / list)
function ViewToggle({ value, onChange, options }) {
  const opts = options || [
    { id: 'grid', label: 'Cartes', icon: 'grid' },
    { id: 'list', label: 'Liste',  icon: 'list' },
  ];
  return (
    <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 7, padding: 2, background: 'white' }}>
      {opts.map(o => {
        const sel = value === o.id;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 12, fontWeight: 600,
            background: sel ? 'var(--ink-900)' : 'transparent',
            color: sel ? 'white' : 'var(--ink-500)',
            border: 'none', borderRadius: 5, cursor: 'pointer',
          }}>
            {o.icon === 'grid' && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>}
            {o.icon === 'list' && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

window.Pagination = Pagination;
window.ViewToggle = ViewToggle;
