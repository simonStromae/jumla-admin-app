'use client';
import { useState, useEffect, useMemo } from 'react';
import I from '@/src/components/Icons';

const TYPE_LABELS = {
  commercial: { label: 'Commercial', color: '#0284c7', bg: '#e0f2fe' },
  partenaire: { label: 'Partenaire', color: '#7c3aed', bg: '#f5f3ff' },
};

function fmt(n) { return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(Number(n) || 0); }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function PartnerRow({ p, onClick }) {
  const type = TYPE_LABELS[p.clientType] ?? TYPE_LABELS.commercial;
  const hasIssue = p.stats.pendingInvoices > 0 || p.stats.pendingAmount > 0;

  return (
    <tr
      onClick={onClick}
      style={{ borderBottom: '1px solid var(--border-soft)', cursor: 'pointer' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-soft)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <td style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: type.bg, color: type.color,
            display: 'grid', placeItems: 'center',
            fontSize: 14, fontWeight: 700,
          }}>
            {(p.companyName ?? p.name).slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink-900)' }}>
              {p.companyName ?? p.name}
            </div>
            {p.companyName && (
              <div style={{ fontSize: 11.5, color: 'var(--ink-400)' }}>{p.name}</div>
            )}
            <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 1 }}>
              {p.phone ?? p.email}
            </div>
          </div>
        </div>
      </td>
      <td style={{ padding: '14px 16px' }}>
        <span style={{
          display: 'inline-block', padding: '3px 10px', borderRadius: 999,
          background: type.bg, color: type.color,
          fontSize: 11.5, fontWeight: 700,
        }}>
          {type.label}
        </span>
      </td>
      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink-900)' }}>{p.stats.totalParcels}</div>
        <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>{p.stats.campaigns} camp.</div>
      </td>
      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: p.stats.activeParcels > 0 ? 'var(--brand-600)' : 'var(--ink-300)' }}>
          {p.stats.activeParcels}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>en cours</div>
      </td>
      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13.5, color: 'var(--ink-900)' }}>
          {fmt(p.stats.totalAmount)}
        </div>
        {p.stats.pendingAmount > 0 && (
          <div style={{ fontSize: 11, color: 'var(--bad-600)', fontWeight: 600 }}>
            {fmt(p.stats.pendingAmount)} dû
          </div>
        )}
      </td>
      <td style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {hasIssue ? (
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--bad-600)', background: 'var(--bad-50)', padding: '3px 8px', borderRadius: 6 }}>
              {p.stats.pendingInvoices > 0 ? `${p.stats.pendingInvoices} facture(s) en attente` : 'Solde impayé'}
            </span>
          ) : (
            <span style={{ fontSize: 11.5, color: 'var(--ok-600)', fontWeight: 600 }}>✓ À jour</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 2 }}>{fmtDate(p.lastActivity)}</div>
      </td>
    </tr>
  );
}

export default function PartenairesScreen({ onNav }) {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetch('/api/admin/partners')
      .then(r => r.json())
      .then(data => { setPartners(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = partners;
    if (typeFilter !== 'all') list = list.filter(p => p.clientType === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.companyName ?? '').toLowerCase().includes(q) ||
        (p.phone ?? '').includes(q) ||
        p.email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [partners, search, typeFilter]);

  // Summary stats
  const totalParcels  = partners.reduce((s, p) => s + p.stats.totalParcels, 0);
  const totalAmount   = partners.reduce((s, p) => s + p.stats.totalAmount, 0);
  const pendingAmount = partners.reduce((s, p) => s + p.stats.pendingAmount, 0);
  const activeParcels = partners.reduce((s, p) => s + p.stats.activeParcels, 0);

  return (
    <div style={{ padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--ink-900)' }}>Partenaires</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--ink-400)', fontSize: 13.5 }}>
          Clients commerciaux & groupeurs — suivi opérationnel et facturation
        </p>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Partenaires', value: partners.length, icon: '🤝', color: 'var(--brand-600)' },
          { label: 'Colis actifs', value: activeParcels, icon: '📦', color: 'var(--ok-600)' },
          { label: 'Volume total', value: fmt(totalAmount) + '', icon: '💰', color: 'var(--ink-700)' },
          { label: 'Solde impayé', value: fmt(pendingAmount) + '', icon: '⚠️', color: pendingAmount > 0 ? 'var(--bad-600)' : 'var(--ok-600)' },
        ].map(k => (
          <div key={k.label} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 11.5, color: 'var(--ink-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
              {k.icon} {k.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <I.Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--ink-400)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un partenaire…"
            style={{ width: '100%', padding: '8px 12px 8px 32px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'white', boxSizing: 'border-box' }}
          />
        </div>
        {['all', 'commercial', 'partenaire'].map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            style={{
              padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13,
              background: typeFilter === t ? 'var(--brand-600)' : 'white',
              color: typeFilter === t ? 'white' : 'var(--ink-600)',
              fontWeight: typeFilter === t ? 700 : 400,
            }}
          >
            {t === 'all' ? 'Tous' : TYPE_LABELS[t]?.label ?? t}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--ink-400)' }}>Chargement…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--ink-400)', fontSize: 14 }}>
          {partners.length === 0 ? 'Aucun partenaire enregistré.' : 'Aucun résultat pour cette recherche.'}
        </div>
      ) : (
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-soft)', borderBottom: '1px solid var(--border)' }}>
                {['Partenaire', 'Type', 'Colis', 'Actifs', 'Montant', 'Statut'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: h === 'Montant' ? 'right' : 'left',
                    fontSize: 11.5, fontWeight: 700, color: 'var(--ink-500)',
                    textTransform: 'uppercase', letterSpacing: '.04em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <PartnerRow
                  key={p.id}
                  p={p}
                  onClick={() => onNav('/admin/partenaires/' + p.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
