'use client';
import { useState, useEffect } from 'react';
import I from '@/src/components/Icons';

function fmt(n) { return (n ?? 0).toLocaleString('fr'); }
function fmtDate(d, opts = {}) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', ...opts });
}

const STATUS_LABELS = {
  enr: { label: 'Enregistré', color: 'var(--ink-500)', bg: 'var(--bg-soft)' },
  ard: { label: 'Arrivé', color: 'var(--brand-700)', bg: 'var(--brand-50)' },
  lib: { label: 'Libéré', color: 'var(--ok-700)', bg: 'var(--ok-50)' },
  ver: { label: 'Vérifié', color: 'var(--ok-700)', bg: 'var(--ok-50)' },
  pdl: { label: 'Prêt livr.', color: 'var(--brand-600)', bg: 'var(--brand-50)' },
  liv: { label: 'En livr.', color: '#7c3aed', bg: '#f5f3ff' },
  ok:  { label: 'Livré', color: 'var(--ok-700)', bg: 'var(--ok-50)' },
  tdl: { label: 'Échec', color: 'var(--bad-700)', bg: 'var(--bad-50)' },
  ann: { label: 'Annulé', color: 'var(--bad-700)', bg: 'var(--bad-50)' },
};

const INVOICE_STATUS = {
  draft:   { label: 'Brouillon', color: 'var(--ink-500)', bg: 'var(--bg-soft)' },
  sent:    { label: 'Envoyée', color: '#0284c7', bg: '#e0f2fe' },
  paid:    { label: 'Payée', color: 'var(--ok-700)', bg: 'var(--ok-50)' },
  overdue: { label: 'En retard', color: 'var(--bad-700)', bg: 'var(--bad-50)' },
};

// ─── Campaign block (onglet En cours & Historique) ────────────────────────────
function CampaignBlock({ group, onNavParcel }) {
  const [open, setOpen] = useState(false);
  const { campaign, parcels } = group;
  const totalAmount = parcels.reduce((s, p) => s + (p.confirmedPriceXaf ?? p.priceXaf ?? 0), 0);
  const totalWeight = parcels.reduce((s, p) => s + (p.weightKg ?? 0), 0);
  const allPaid = parcels.every(p => p.payment?.status === 'completed');
  const somePaid = !allPaid && parcels.some(p => p.payment?.status === 'completed' || p.payment?.status === 'partial');

  const isActive = campaign && !['ok', 'ann', 'fin'].includes(campaign.status);

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', cursor: 'pointer',
          background: isActive ? 'var(--brand-50)' : 'var(--bg-soft)',
          borderBottom: open ? '1px solid var(--border-soft)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--ink-400)', transition: 'transform .2s', transform: open ? 'rotate(90deg)' : 'none', display: 'inline-block' }}>▶</span>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 14, color: 'var(--ink-900)' }}>
              {campaign?.code ?? '—'}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-500)', marginTop: 1 }}>
              {campaign?.route?.origin} → {campaign?.route?.destination}
              {campaign?.departureDate ? ` · départ ${fmtDate(campaign.departureDate)}` : ''}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, textAlign: 'right' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>{parcels.length} colis · {Math.round(totalWeight * 10) / 10} kg</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--ink-900)' }}>{fmt(totalAmount)} XAF</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: allPaid ? 'var(--ok-600)' : somePaid ? '#d97706' : 'var(--bad-600)' }}>
              {allPaid ? '✓ Soldé' : somePaid ? 'Partiel' : 'Non soldé'}
            </div>
          </div>
        </div>
      </div>

      {open && (
        <div>
          {parcels.map((p, i) => {
            const st = STATUS_LABELS[p.status] ?? { label: p.status, color: 'var(--ink-500)', bg: 'var(--bg-soft)' };
            const paid = p.payment?.status === 'completed';
            return (
              <div
                key={p.id}
                onClick={() => onNavParcel(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 16px 10px 42px',
                  borderBottom: i < parcels.length - 1 ? '1px solid var(--border-soft)' : 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-soft)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: st.bg, color: st.color, fontSize: 11, fontWeight: 700 }}>
                    {st.label}
                  </span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--ink-800)' }}>{p.trackingCode}</div>
                    {p.recipName && <div style={{ fontSize: 11.5, color: 'var(--ink-400)' }}>→ {p.recipName}{p.recipCity ? `, ${p.recipCity}` : ''}</div>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--ink-800)' }}>
                    {fmt(p.confirmedPriceXaf ?? p.priceXaf)} XAF
                  </div>
                  <div style={{ fontSize: 11, color: paid ? 'var(--ok-600)' : 'var(--bad-600)', fontWeight: 600 }}>
                    {paid ? '✓ Soldé' : 'Non soldé'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Invoice row ───────────────────────────────────────────────────────────────
function InvoiceRow({ inv, onStatusChange, onDelete }) {
  const [updating, setUpdating] = useState(false);
  const st = INVOICE_STATUS[inv.status] ?? INVOICE_STATUS.draft;

  const changeStatus = async (newStatus) => {
    setUpdating(true);
    await fetch('/api/admin/invoices/' + inv.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    onStatusChange(inv.id, newStatus);
    setUpdating(false);
  };

  return (
    <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--ink-900)' }}>{inv.number}</div>
        {inv.campaign && <div style={{ fontSize: 11.5, color: 'var(--ink-400)', marginTop: 1 }}>{inv.campaign.code}</div>}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, background: st.bg, color: st.color, fontSize: 12, fontWeight: 700 }}>
          {st.label}
        </span>
      </td>
      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13.5, color: 'var(--ink-900)' }}>{fmt(inv.amountXaf)}</span>
        <span style={{ fontSize: 11, color: 'var(--ink-400)', marginLeft: 4 }}>XAF</span>
      </td>
      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--ink-500)' }}>
        {inv.issuedAt ? fmtDate(inv.issuedAt) : '—'}
        {inv.dueAt && <div style={{ color: new Date(inv.dueAt) < new Date() && inv.status !== 'paid' ? 'var(--bad-600)' : 'var(--ink-400)', fontWeight: 600 }}>
          Échéance : {fmtDate(inv.dueAt)}
        </div>}
        {inv.paidAt && <div style={{ color: 'var(--ok-600)', fontWeight: 600 }}>Payée le {fmtDate(inv.paidAt)}</div>}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {inv.status === 'draft' && (
            <button disabled={updating} onClick={() => changeStatus('sent')} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #0284c7', background: '#e0f2fe', color: '#0284c7', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Envoyer
            </button>
          )}
          {inv.status === 'sent' && (
            <button disabled={updating} onClick={() => changeStatus('paid')} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--ok-600)', background: 'var(--ok-50)', color: 'var(--ok-700)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Marquer payée
            </button>
          )}
          {inv.status !== 'paid' && (
            <button disabled={updating} onClick={() => { if (confirm('Supprimer cette facture ?')) onDelete(inv.id); }} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'white', color: 'var(--bad-600)', fontSize: 12, cursor: 'pointer' }}>
              ✕
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── New Invoice Modal ─────────────────────────────────────────────────────────
function NewInvoiceModal({ partner, campaigns, onClose, onCreated }) {
  const [campaignId, setCampaignId] = useState('');
  const [amount, setAmount]         = useState('');
  const [dueAt, setDueAt]           = useState('');
  const [notes, setNotes]           = useState('');
  const [saving, setSaving]         = useState(false);

  // Auto-fill amount when campaign selected
  useEffect(() => {
    if (!campaignId) return;
    const group = campaigns.find(g => g.campaign?.id === campaignId);
    if (group) {
      const total = group.parcels.reduce((s, p) => s + (p.confirmedPriceXaf ?? p.priceXaf ?? 0), 0);
      setAmount(String(total));
    }
  }, [campaignId, campaigns]);

  const handleCreate = async () => {
    setSaving(true);
    const res = await fetch('/api/admin/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: partner.id, campaignId: campaignId || null, amountXaf: parseInt(amount, 10), dueAt: dueAt || null, notes: notes || null }),
    });
    const inv = await res.json();
    onCreated(inv);
    setSaving(false);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 420, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 17 }}>Nouvelle facture</div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--ink-400)' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', display: 'block', marginBottom: 5 }}>Campagne (optionnel)</label>
            <select value={campaignId} onChange={e => setCampaignId(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}>
              <option value="">— Multi-campagnes / autre —</option>
              {campaigns.map(g => (
                <option key={g.campaign?.id} value={g.campaign?.id ?? ''}>
                  {g.campaign?.code ?? '?'} · {g.parcels.length} colis
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', display: 'block', marginBottom: 5 }}>Montant (XAF)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="Ex: 85000"
              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', display: 'block', marginBottom: 5 }}>Date d'échéance</label>
            <input type="date" value={dueAt} onChange={e => setDueAt(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', display: 'block', marginBottom: 5 }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, resize: 'none', boxSizing: 'border-box' }} />
          </div>
          <button
            onClick={handleCreate}
            disabled={!amount || saving}
            style={{ padding: '12px', borderRadius: 10, border: 'none', background: amount ? 'var(--brand-600)' : 'var(--ink-100)', color: amount ? 'white' : 'var(--ink-400)', fontWeight: 700, fontSize: 14, cursor: amount ? 'pointer' : 'not-allowed' }}>
            {saving ? 'Création…' : 'Créer la facture'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function PartenaireDetailScreen({ id, onNav }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('active');
  const [showNewInv, setShowNewInv] = useState(false);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    fetch('/api/admin/partners/' + id)
      .then(r => r.json())
      .then(d => { setData(d); setInvoices(d.invoices ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const handleStatusChange = (invId, newStatus) => {
    setInvoices(prev => prev.map(i => i.id === invId ? { ...i, status: newStatus, paidAt: newStatus === 'paid' ? new Date().toISOString() : i.paidAt, issuedAt: newStatus === 'sent' ? new Date().toISOString() : i.issuedAt } : i));
  };

  const handleDelete = async (invId) => {
    await fetch('/api/admin/invoices/' + invId, { method: 'DELETE' });
    setInvoices(prev => prev.filter(i => i.id !== invId));
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-400)' }}>Chargement…</div>;
  if (!data) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--bad-600)' }}>Partenaire introuvable.</div>;

  const { partner, campaigns } = data;
  const activeCampaigns = campaigns.filter(g =>
    g.campaign && !['fin', 'ann'].includes(g.campaign.status)
  );
  const pastCampaigns = campaigns.filter(g =>
    !g.campaign || ['fin', 'ann'].includes(g.campaign.status)
  );

  const totalAmount  = campaigns.reduce((s, g) => s + g.parcels.reduce((ss, p) => ss + (p.confirmedPriceXaf ?? p.priceXaf ?? 0), 0), 0);
  const totalParcels = campaigns.reduce((s, g) => s + g.parcels.length, 0);
  const typeCfg = partner.clientType === 'partenaire'
    ? { label: 'Partenaire / Groupeur', color: '#7c3aed', bg: '#f5f3ff' }
    : { label: 'Commercial', color: '#0284c7', bg: '#e0f2fe' };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 960, margin: '0 auto' }}>
      {showNewInv && (
        <NewInvoiceModal
          partner={partner}
          campaigns={campaigns}
          onClose={() => setShowNewInv(false)}
          onCreated={inv => setInvoices(prev => [inv, ...prev])}
        />
      )}

      {/* Back */}
      <button onClick={() => onNav('/admin/partenaires')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-600)', fontSize: 13, fontWeight: 600, marginBottom: 20, padding: 0 }}>
        <I.ArrowLeft style={{ width: 14, height: 14 }} /> Partenaires
      </button>

      {/* Header card */}
      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: typeCfg.bg, color: typeCfg.color, display: 'grid', placeItems: 'center', fontSize: 20, fontWeight: 800, flexShrink: 0 }}>
            {(partner.companyName ?? partner.name).slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-900)' }}>{partner.companyName ?? partner.name}</div>
            {partner.companyName && <div style={{ fontSize: 14, color: 'var(--ink-500)', marginTop: 1 }}>Contact : {partner.name}</div>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
              {partner.phone && <span style={{ fontSize: 13, color: 'var(--ink-600)' }}>📱 {partner.phone}</span>}
              <span style={{ fontSize: 13, color: 'var(--ink-600)' }}>✉️ {partner.email}</span>
              {partner.city && <span style={{ fontSize: 13, color: 'var(--ink-600)' }}>📍 {partner.city}</span>}
            </div>
            {partner.billingAddress && (
              <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 6 }}>🏢 {partner.billingAddress}</div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <span style={{ display: 'inline-block', padding: '5px 12px', borderRadius: 999, background: typeCfg.bg, color: typeCfg.color, fontSize: 12, fontWeight: 700 }}>
            {typeCfg.label}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Campagnes', value: campaigns.length },
          { label: 'Colis total', value: totalParcels },
          { label: 'Volume total', value: fmt(totalAmount) + ' XAF' },
          { label: 'Factures', value: invoices.length },
        ].map(k => (
          <div key={k.label} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink-900)' }}>{k.value}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 3 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {[
          { key: 'active', label: `En cours (${activeCampaigns.length})` },
          { key: 'history', label: `Historique (${pastCampaigns.length})` },
          { key: 'invoices', label: `Factures (${invoices.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 18px', background: 'none', cursor: 'pointer',
              border: 'none', borderBottom: tab === t.key ? '2px solid var(--brand-600)' : '2px solid transparent',
              color: tab === t.key ? 'var(--brand-600)' : 'var(--ink-500)',
              fontWeight: tab === t.key ? 700 : 400, fontSize: 13.5, marginBottom: -1,
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'active' && (
        <div>
          {activeCampaigns.length === 0
            ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-400)' }}>Aucune campagne en cours.</div>
            : activeCampaigns.map((g, i) => (
                <CampaignBlock key={i} group={g} onNavParcel={pid => onNav('/admin/parcels/' + pid)} />
              ))
          }
        </div>
      )}

      {tab === 'history' && (
        <div>
          {pastCampaigns.length === 0
            ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-400)' }}>Aucun historique.</div>
            : pastCampaigns.map((g, i) => (
                <CampaignBlock key={i} group={g} onNavParcel={pid => onNav('/admin/parcels/' + pid)} />
              ))
          }
        </div>
      )}

      {tab === 'invoices' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button
              onClick={() => setShowNewInv(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 9, border: 'none', background: 'var(--brand-600)', color: 'white', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}
            >
              <I.Plus style={{ width: 15, height: 15 }} /> Nouvelle facture
            </button>
          </div>

          {invoices.length === 0
            ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-400)' }}>Aucune facture.</div>
            : (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-soft)', borderBottom: '1px solid var(--border)' }}>
                      {['Numéro', 'Statut', 'Montant', 'Dates', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Montant' ? 'right' : 'left', fontSize: 11.5, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => (
                      <InvoiceRow
                        key={inv.id}
                        inv={inv}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      )}
    </div>
  );
}
