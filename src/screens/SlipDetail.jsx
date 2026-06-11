'use client';
import { useState, useEffect } from 'react';
import I from '../components/Icons.jsx';
import { Avatar, Skel } from '../components/Shell.jsx';

const TYPE_LABELS = {
  carton:   'Carton',
  paquet:   'Paquet',
  sachet:   'Sachet',
  bouteille: 'Bouteille',
};

const VERIFY_STATUS = {
  ok:      { lbl: '✓ Conforme',   cls: 'ok' },
  missing: { lbl: '✗ Manquant',   cls: 'bad' },
  extra:   { lbl: '+ En plus',    cls: 'warn' },
  verify:  { lbl: '? À vérifier', cls: 'neutral' },
};

const BL_STATUS = {
  en_attente: { l: 'À vérifier',  cls: 'neutral' },
  en_cours:   { l: 'En cours',    cls: 'warn' },
  valide:     { l: 'Validé',      cls: 'ok' },
  libere:     { l: 'Libéré',      cls: 'ok' },
};

export default function SlipDetailScreen({ id, onNav }) {
  const [slip,    setSlip]    = useState(null);
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    fetch('/api/bordereaux/' + id)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setLoading(false); return; }
        setSlip(data);
        const rawItems = Array.isArray(data.items) ? data.items : [];
        setItems(rawItems.map((it, i) => ({
          id:          it.id ?? i + 1,
          designation: it.designation ?? it.name ?? '',
          type:        it.type ?? 'carton',
          count:       it.count ?? it.packs ?? 1,
          nbPieces:    it.nbPieces ?? it.pieces ?? null,
          status:      it.status ?? 'ok',
          discrepancy: it.discrepancy ?? it.discr ?? 0,
          note:        it.note ?? '',
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const updItem = (itemId, k, v) => setItems(its => its.map(i => i.id === itemId ? { ...i, [k]: v } : i));

  const totalCount  = items.reduce((a, i) => a + (Number(i.count) || 0), 0);
  const okCount     = items.filter(i => i.status === 'ok').reduce((a, i) => a + (Number(i.count) || 0), 0);
  const totalDiscr  = items.reduce((a, i) => a + (Number(i.discrepancy) || 0), 0);

  const saveItems = async () => {
    setSaving(true);
    await fetch('/api/bordereaux/' + slip.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const validate = async () => {
    if (!confirm('Valider ce bordereau ? Le colis passera au statut "Reçu".')) return;
    setSaving(true);
    const res = await fetch('/api/bordereaux/' + slip.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, status: 'valide' }),
    });
    const json = await res.json();
    if (json.ok) setSlip(s => ({ ...s, status: 'valide' }));
    setSaving(false);
  };

  if (loading) return (
    <div className="page">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16 }}>
        <Skel w={300} h={28} />
        <Skel w="100%" h={200} />
      </div>
    </div>
  );

  if (!slip) return (
    <div className="page">
      <div style={{ padding: 32, color: 'var(--bad-700)' }}>Bordereau introuvable : {id}</div>
    </div>
  );

  const blSt = BL_STATUS[slip.status] || { l: slip.status, cls: 'neutral' };

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ink-400)', marginBottom: 8 }}>
        <a style={{ cursor: 'pointer' }} onClick={() => onNav('/admin/campaigns')}>Cargaisons</a>
        <I.ChevronRight style={{ width: 12, height: 12 }} />
        {slip.campaign && (
          <>
            <a style={{ cursor: 'pointer' }}>{slip.campaign.code}</a>
            <I.ChevronRight style={{ width: 12, height: 12 }} />
          </>
        )}
        <span style={{ color: 'var(--ink-600)', fontWeight: 600 }}>Bordereau {slip.code}</span>
      </div>

      <div className="page__head" style={{ marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h1 className="page__title" style={{ margin: 0 }}>Bordereau du colis</h1>
            <span className="mono badge badge--lg badge--neutral">{slip.code}</span>
            <span className={'badge badge--lg badge--dot badge--' + blSt.cls}>{blSt.l}</span>
          </div>
          <div className="page__sub">
            Colis <strong className="mono">{slip.parcel?.trackingCode}</strong>
            {slip.campaign && <> · Cargaison <strong>{slip.campaign.code}</strong></>}
          </div>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost" onClick={() => window.open('/admin/slips/' + slip.code + '/print', '_blank')}>
            <I.Print />Imprimer
          </button>
          {slip.status !== 'valide' && slip.status !== 'libere' && (
            <button className="btn btn--brand" onClick={validate} disabled={saving}>
              <I.Check />{saving ? '…' : 'Valider'}
            </button>
          )}
        </div>
      </div>

      <div className="layout-2col">
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <PartyCard kind="Expéditeur" en="Sender"
              data={{ name: slip.client?.name, phone: slip.client?.phone, city: slip.client?.city }} color={1} />
            <PartyCard kind="Destinataire" en="Recipient"
              data={{ name: slip.recipient?.name, phone: slip.recipient?.phone, address: slip.recipient?.address }} color={2} />
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Vérification du contenu</div>
                <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>
                  {items.length === 0 ? 'Aucune ligne déclarée' : 'Pointage à l\'arrivée'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                <Stat label="Lignes"    value={items.length} />
                <Stat label="Total"     value={totalCount} />
                <Stat label="Conformes" value={okCount}    color="var(--ok-600)" />
                <Stat label="Écarts"    value={totalDiscr} color={totalDiscr > 0 ? 'var(--bad-600)' : null} />
              </div>
            </div>

            {items.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-400)', fontSize: 13 }}>
                Aucune ligne déclarée pour ce bordereau.
              </div>
            ) : (
              <table className="tbl tbl--compact" style={{ borderRadius: 0 }}>
                <thead>
                  <tr>
                    <th style={{ borderRadius: 0, width: 28 }}>#</th>
                    <th>Désignation</th>
                    <th style={{ width: 140 }}>Description</th>
                    <th style={{ width: 80 }}>Type</th>
                    <th style={{ width: 55, textAlign: 'center' }}>Nb</th>
                    <th style={{ width: 70, textAlign: 'center' }}>Pièces</th>
                    <th style={{ width: 150 }}>Vérification</th>
                    <th style={{ width: 55, textAlign: 'center' }}>Écart</th>
                    <th style={{ borderRadius: 0 }}>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={it.id}>
                      <td className="mono" style={{ color: 'var(--ink-400)', fontSize: 11.5 }}>{i + 1}</td>
                      <td style={{ fontWeight: 500, fontSize: 12.5 }}>{it.designation || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--ink-500)' }}>{it.description || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--ink-600)' }}>{TYPE_LABELS[it.type] ?? it.type}</td>
                      <td className="mono" style={{ textAlign: 'center' }}>{it.count}</td>
                      <td className="mono" style={{ textAlign: 'center', color: 'var(--ink-400)' }}>{it.nbPieces || '—'}</td>
                      <td>
                        <select className="select input--sm" style={{ height: 26, padding: '0 6px', fontSize: 11.5 }}
                          value={it.status} onChange={e => updItem(it.id, 'status', e.target.value)}>
                          {Object.entries(VERIFY_STATUS).map(([v, { lbl }]) => (
                            <option key={v} value={v}>{lbl}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input type="number" min="0" className="input input--sm mono"
                          style={{ width: 44, textAlign: 'center', padding: '0 4px' }}
                          value={it.discrepancy || ''} placeholder="0"
                          onChange={e => updItem(it.id, 'discrepancy', Number(e.target.value))} />
                      </td>
                      <td>
                        <input className="input input--sm" value={it.note}
                          onChange={e => updItem(it.id, 'note', e.target.value)} placeholder="—" style={{ fontSize: 11.5 }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div style={{ padding: '10px 16px', background: totalDiscr > 0 ? 'var(--bad-50)' : 'var(--ok-50)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              {totalDiscr > 0 ? (
                <>
                  <I.Alert style={{ width: 15, height: 15, color: 'var(--bad-600)' }} />
                  <span style={{ fontSize: 12.5, color: 'var(--bad-700)', flex: 1 }}>
                    <strong>{totalDiscr} écart{totalDiscr > 1 ? 's' : ''}</strong> détecté{totalDiscr > 1 ? 's' : ''}. La validation reste possible.
                  </span>
                </>
              ) : (
                <>
                  <I.Check style={{ width: 15, height: 15, color: 'var(--ok-600)' }} />
                  <span style={{ fontSize: 12.5, color: 'var(--ok-700)', flex: 1 }}>
                    Contenu conforme. Prêt pour validation.
                  </span>
                </>
              )}
              <button className="btn btn--ghost btn--sm" onClick={saveItems} disabled={saving}>
                {saved ? '✓ Sauvegardé' : saving ? '…' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className="section-title" style={{ margin: 0 }}>
                <I.Wallet style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Paiement
              </div>
              {slip.payment && (
                <span className={'badge badge--dot badge--' + (slip.payment.status === 'completed' ? 'ok' : 'warn')}>
                  {slip.payment.status === 'completed' ? 'Payé' : 'En attente'}
                </span>
              )}
            </div>

            {slip.payment ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '10px 0', borderTop: '1px solid var(--border)', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700 }}>Total dû</span>
                  <span className="mono" style={{ fontSize: 20, fontWeight: 700 }}>
                    {slip.payment.amount?.toLocaleString('fr')} <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>CAD</span>
                  </span>
                </div>
                {slip.payment.status === 'completed' && (
                  <div style={{ padding: 10, background: 'var(--ok-50)', border: '1px solid var(--ok-100)', borderRadius: 6, fontSize: 11.5, color: 'var(--ok-700)' }}>
                    <strong>Réglé</strong>
                    {slip.payment.paidAt && ` le ${new Date(slip.payment.paidAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
                    {slip.payment.interacRef && ` · Réf. ${slip.payment.interacRef}`}
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--ink-400)' }}>Paiement non créé</div>
            )}
          </div>

          {slip.recipient?.address && (
            <div className="card" style={{ padding: 16, marginBottom: 14 }}>
              <div className="section-title" style={{ marginBottom: 12 }}>
                <I.Truck style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Livraison
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-700)', lineHeight: 1.7 }}>
                <div style={{ fontWeight: 600 }}>{slip.recipient.name}</div>
                <div>{slip.recipient.address}</div>
                {slip.recipient.phone && <div className="mono" style={{ fontSize: 12, color: 'var(--ink-500)' }}>{slip.recipient.phone}</div>}
              </div>
            </div>
          )}

          <div className="card" style={{ padding: 16 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>
              <I.History style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Cargaison
            </div>
            {slip.campaign && (
              <div style={{ fontSize: 13, color: 'var(--ink-700)', lineHeight: 1.7 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{slip.campaign.code}</div>
                <div style={{ color: 'var(--ink-500)', fontSize: 12 }}>{slip.campaign.from} → {slip.campaign.to}</div>
                {slip.campaign.arrivalDate && (
                  <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 4 }}>
                    Arrivée prévue : {new Date(slip.campaign.arrivalDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PartyCard({ kind, en, data, color }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700, color: 'var(--ink-400)' }}>
          {kind} <span style={{ color: 'var(--ink-300)', fontWeight: 500 }}>/ {en}</span>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Avatar initials={(data?.name || '?').split(' ').map(x => x[0]).slice(0, 2).join('')} color={color} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{data?.name || '—'}</div>
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-600)', lineHeight: 1.6 }}>
        {data?.phone   && <div className="mono">{data.phone}</div>}
        {data?.city    && <div>{data.city}</div>}
        {data?.address && <div style={{ color: 'var(--ink-500)' }}>{data.address}</div>}
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: color || 'var(--ink-900)' }}>{value}</div>
      <div style={{ fontSize: 10.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>{label}</div>
    </div>
  );
}
