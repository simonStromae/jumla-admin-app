import { useState } from 'react';
import { DATA, getRoute } from '../data.js';
import I from '../components/Icons.jsx';
import { RoutePill, Avatar } from '../components/Shell.jsx';

const CATS = DATA.PARCEL_CATEGORIES;

export default function ParcelFormPage({ mode = 'create', parcel, campaign, onNav }) {
  const isEdit = mode === 'edit';
  const route = getRoute(campaign?.route) || DATA.ROUTES[0];

  const [data, setData] = useState(() => ({
    campaignId: campaign?.id || '',
    code: parcel?.code || '#65',
    senderName: parcel?.senderName || '',
    senderPhone: parcel?.senderPhone || '',
    recipName: parcel?.recipName || '',
    recipPhone: parcel?.recipPhone || '',
    recipCity: parcel?.recipCity || 'Montréal',
    recipAddress: parcel?.recipAddress || '',
    recipApt: parcel?.recipApt || '',
    recipProvince: parcel?.recipProvince || 'QC',
    recipPostal: parcel?.recipPostal || '',
    items: parcel?.items || [
      { id: 1, name: '', packs: 1, pieces: 1, weight: 0, category: 'standard', note: '' },
    ],
    delivery: parcel?.delivery || 'home',
    paid: parcel?.paid || 'unpaid',
    method: parcel?.method || '',
    agent: parcel?.agent || 'AM',
    contents: parcel?.contents || '',
    insurance: parcel?.insurance || false,
  }));

  const upd = (k, v) => setData(d => ({ ...d, [k]: v }));

  const activeCampaign = campaign || DATA.CAMPAIGNS.find(c => c.id === data.campaignId);
  const activeRoute = activeCampaign ? getRoute(activeCampaign.route) : route;
  const grid = activeRoute.pricing;

  const totalItemWeight = data.items.reduce((a, i) => a + (+i.weight || 0), 0);
  const baseRate = getTierRate(totalItemWeight, grid);
  const itemsTotal = data.items.reduce((a, i) => {
    const cat = CATS.find(c => c.id === i.category) || CATS[0];
    return a + Math.round((+i.weight || 0) * baseRate * (1 + cat.pct / 100));
  }, 0);
  const deliveryFee = data.delivery === 'home' ? 25 : 0;
  const handlingFee = 8;
  const insuranceFee = data.insurance ? Math.round(itemsTotal * 0.03) : 0;
  const total = itemsTotal + deliveryFee + handlingFee + insuranceFee;

  const handleCancel = () => {
    if (campaign) onNav('/campaign/' + campaign.id);
    else onNav('/parcels');
  };

  return (
    <div className="page">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ink-400)', marginBottom: 8 }}>
        <a style={{ cursor: 'pointer' }} onClick={() => onNav('/')}>Cargaisons</a>
        {campaign && (
          <>
            <I.ChevronRight style={{ width: 12, height: 12 }} />
            <a style={{ cursor: 'pointer' }} onClick={() => onNav('/campaign/' + campaign.id)}>{campaign.code}</a>
          </>
        )}
        <I.ChevronRight style={{ width: 12, height: 12 }} />
        <span style={{ color: 'var(--ink-600)', fontWeight: 600 }}>
          {isEdit ? data.code : 'Nouveau colis'}
        </span>
      </div>

      {/* Page head */}
      <div className="page__head" style={{ marginBottom: 22 }}>
        <div>
          <div className="page__title">
            {isEdit ? 'Modifier le colis' : 'Nouveau colis'}
            <span style={{ color: 'var(--ink-400)', fontWeight: 400, fontSize: '.7em', marginLeft: 8 }}>
              / {isEdit ? 'Edit parcel' : 'New parcel'}
            </span>
          </div>
          <div className="page__sub">
            {activeCampaign
              ? <>Cargaison <span className="mono" style={{ color: 'var(--ink-700)', fontWeight: 600 }}>{activeCampaign.code}</span> · {activeRoute.fromIATA} → {activeRoute.toIATA}</>
              : <span style={{ color: 'var(--ink-400)' }}>Sélectionnez une cargaison</span>
            }
          </div>
        </div>
        <div className="page__actions">
          {isEdit && <button className="btn btn--ghost" style={{ color: 'var(--bad-600)' }}><I.Trash />Supprimer</button>}
          <button className="btn btn--ghost" onClick={handleCancel}>Annuler</button>
          {!isEdit && <button className="btn btn--soft" onClick={handleCancel}>Enregistrer &amp; ajouter un autre</button>}
          <button className="btn btn--brand" onClick={handleCancel}>
            <I.Check />{isEdit ? 'Enregistrer les modifications' : 'Créer le colis'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 22, alignItems: 'start' }}>
        <div>
          {/* Campaign selector — only when called outside a campaign */}
          {!campaign && (
            <div className="card" style={{ padding: 16, marginBottom: 14 }}>
              <div className="section-title" style={{ marginBottom: 12 }}>
                <I.Plane style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Cargaison
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Sélectionner la cargaison <span className="opt">/ Shipment</span></label>
                <select className="select" value={data.campaignId || ''} onChange={e => upd('campaignId', e.target.value)}>
                  <option value="">— Choisir une cargaison ouverte</option>
                  {DATA.CAMPAIGNS.filter(c => c.status !== 'closed').map(c => (
                    <option key={c.id} value={c.id}>{c.code} · {c.dep}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <PartyField kind="Expéditeur · Douala" en="Sender" iconColor="var(--brand-500)" color={1} data={data} prefix="sender" cityLabel="Cameroun" upd={upd} />
          <PartyField kind="Destinataire · Canada" en="Recipient" iconColor="var(--info-600)" color={2} data={data} prefix="recip" cityLabel={data.recipCity} upd={upd} withAddress />

          {/* Items — with weight + category per line */}
          <ItemsSection data={data} upd={upd} currency={activeRoute.currency} baseRate={baseRate} />

          {/* Notes & options */}
          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>
              <I.Tag style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Notes & options
            </div>
            <div className="field">
              <label className="label">Note générale <span className="opt">/ General note</span></label>
              <textarea className="textarea" rows={2} value={data.contents} onChange={e => upd('contents', e.target.value)} placeholder="Instructions de manutention, précautions..." />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Options</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <ToggleChip checked={data.insurance} onChange={() => upd('insurance', !data.insurance)} icon="🛡">Assurance +3%</ToggleChip>
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>
              <I.Truck style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Mode de livraison
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <DeliveryCard sel={data.delivery === 'home'} onClick={() => upd('delivery', 'home')} icon={<I.Truck style={{ width: 18, height: 18 }} />} label="Livraison à domicile" en="Home delivery" extra={`+25 ${activeRoute.currency}`} />
              <DeliveryCard sel={data.delivery === 'pickup'} onClick={() => upd('delivery', 'pickup')} icon={<I.Warehouse style={{ width: 18, height: 18 }} />} label="Retrait entrepôt" en="Warehouse pickup" extra="Gratuit" />
            </div>
          </div>

          {/* Payment */}
          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>
              <I.Wallet style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Paiement & affectation
            </div>
            <div className="field-row field-row--3">
              <div className="field">
                <label className="label">Statut paiement</label>
                <select className="select" value={data.paid} onChange={e => upd('paid', e.target.value)}>
                  <option value="unpaid">Impayé</option>
                  <option value="pending">Acompte / Partiel</option>
                  <option value="paid">Payé intégralement</option>
                </select>
              </div>
              <div className="field">
                <label className="label">Méthode</label>
                <select className="select" value={data.method} onChange={e => upd('method', e.target.value)}>
                  <option value="">—</option>
                  <option>Espèces</option>
                  <option>Virement Interac</option>
                  <option>Virement bancaire</option>
                  <option>Mobile Money</option>
                </select>
              </div>
              <div className="field">
                <label className="label">Agent en charge</label>
                <select className="select" value={data.agent} onChange={e => upd('agent', e.target.value)}>
                  {DATA.AGENTS.map(a => <option key={a.id} value={a.initials}>{a.initials} — {a.name}</option>)}
                </select>
              </div>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Observations <span className="opt">/ Notes</span></label>
              <input className="input" value={data.note || ''} onChange={e => upd('note', e.target.value)} placeholder="Note interne..." />
            </div>
          </div>
        </div>

        {/* Right: live summary */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, var(--ink-900), var(--ink-800))', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>{data.code}</span>
                <RoutePill from={activeRoute.fromIATA} to={activeRoute.toIATA} />
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)' }}>
                {activeCampaign?.code || '—'} · Aperçu en direct
              </div>
            </div>

            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 10.5, color: 'var(--ink-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>
                Tarif · {baseRate} {activeRoute.currency}/kg
              </div>

              {/* Per-item lines */}
              {data.items.map((it, idx) => {
                if (!it.weight) return null;
                const cat = CATS.find(c => c.id === it.category) || CATS[0];
                const linePrice = Math.round(it.weight * baseRate * (1 + cat.pct / 100));
                return (
                  <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '4px 0', fontSize: 12, gap: 6, borderBottom: idx < data.items.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                    <span style={{ color: 'var(--ink-600)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ marginRight: 4 }}>{cat.icon}</span>
                      {it.name || `Ligne ${idx + 1}`}
                      <span style={{ color: 'var(--ink-300)', marginLeft: 4 }}>· {it.weight}kg</span>
                      {cat.pct !== 0 && <span style={{ marginLeft: 4, fontSize: 10, color: cat.pct > 0 ? 'var(--warn-600)' : 'var(--ok-600)', fontWeight: 700 }}>{cat.pct > 0 ? '+' : ''}{cat.pct}%</span>}
                    </span>
                    <span className="mono" style={{ fontWeight: 600, color: 'var(--ink-900)', whiteSpace: 'nowrap', fontSize: 12 }}>{linePrice} <span style={{ color: 'var(--ink-400)', fontWeight: 400, fontSize: 10 }}>{activeRoute.currency}</span></span>
                  </div>
                );
              })}

              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-soft)' }}>
                <SummaryLine l={`Sous-total articles (${totalItemWeight.toFixed(1)} kg)`} v={itemsTotal} cur={activeRoute.currency} />
                {data.delivery === 'home' && <SummaryLine l="Livraison domicile" v={deliveryFee} cur={activeRoute.currency} />}
                <SummaryLine l="Manutention" v={handlingFee} cur={activeRoute.currency} />
                {data.insurance && <SummaryLine l="Assurance 3%" v={insuranceFee} cur={activeRoute.currency} />}
              </div>

              <div style={{ borderTop: '2px solid var(--ink-900)', marginTop: 10, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700 }}>Total dû</span>
                <span className="mono" style={{ fontSize: 22, fontWeight: 700 }}>
                  {total} <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>{activeRoute.currency}</span>
                </span>
              </div>

              {data.paid === 'paid' && (
                <div style={{ marginTop: 10, padding: 8, background: 'var(--ok-50)', fontSize: 11.5, color: 'var(--ok-700)', fontWeight: 600 }}>
                  ✓ Marqué comme payé · {data.method || '—'}
                </div>
              )}
              {data.paid === 'unpaid' && total > 0 && (
                <div style={{ marginTop: 10, padding: 8, background: 'var(--bad-50)', fontSize: 11.5, color: 'var(--bad-700)', fontWeight: 600 }}>
                  ⚠ Reste à percevoir <span className="mono">{total} {activeRoute.currency}</span>
                </div>
              )}
            </div>

            {/* Pricing grid */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-soft)', background: 'var(--bg-soft)' }}>
              <div style={{ fontSize: 10.5, color: 'var(--ink-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>
                Grille — {activeRoute.code}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {grid.map((p, i) => {
                  const active = totalItemWeight > p.from && totalItemWeight <= p.to;
                  return (
                    <span key={i} className="mono" style={{
                      padding: '2px 7px', fontSize: 10.5, fontWeight: 600,
                      background: active ? 'var(--brand-500)' : 'white',
                      color: active ? 'white' : 'var(--ink-600)',
                      border: '1px solid ' + (active ? 'var(--brand-500)' : 'var(--border)'),
                    }}>
                      {p.from}–{p.to}: {p.rate}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 12, padding: 14 }}>
            <div style={{ fontSize: 10.5, color: 'var(--ink-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>À l'enregistrement</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
              <AutoCheck checked label="Générer le bordereau (BL)" />
              <AutoCheck checked label="Envoyer la facture par WhatsApp" />
              <AutoCheck label="Notifier l'expéditeur" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */

function calcPrice(weight, grid) {
  if (!weight) return 0;
  for (const tier of grid) {
    if (weight > tier.from && weight <= tier.to) return Math.round(weight * tier.rate);
  }
  return Math.round(weight * grid[grid.length - 1].rate);
}

function getTierRate(weight, grid) {
  if (!weight) return grid[0].rate;
  for (const tier of grid) {
    if (weight > tier.from && weight <= tier.to) return tier.rate;
  }
  return grid[grid.length - 1].rate;
}

/* ── Items table ── */

function ItemsSection({ data, upd, currency, baseRate }) {
  const items = data.items || [];
  const addRow = () => upd('items', [...items, {
    id: (items[items.length - 1]?.id || 0) + 1,
    name: '', packs: 1, pieces: 1, weight: 0, category: 'standard', note: '',
  }]);
  const removeRow = (id) => upd('items', items.filter(i => i.id !== id));
  const updRow = (id, k, v) => upd('items', items.map(i => i.id === id ? { ...i, [k]: v } : i));
  const duplicateRow = (row) => upd('items', [...items, { ...row, id: (items[items.length - 1]?.id || 0) + 1 }]);

  const totalWeight = items.reduce((a, i) => a + (+i.weight || 0), 0);
  const totalPieces = items.reduce((a, i) => a + (+i.pieces || 0), 0);

  return (
    <div className="card" style={{ padding: 0, marginBottom: 14, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <I.Box style={{ width: 14, height: 14, color: 'var(--brand-600)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>Articles du colis <span style={{ color: 'var(--ink-400)', fontWeight: 500, fontSize: 12, marginLeft: 4 }}>/ Items</span></div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-400)', marginTop: 2 }}>Chaque ligne a son propre poids et sa catégorie tarifaire.</div>
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 11.5 }}>
          <MiniStat label="Lignes" v={items.length} />
          <MiniStat label="Pièces" v={totalPieces} />
          <MiniStat label="Poids total" v={totalWeight.toFixed(1)} unit="kg" />
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="tbl tbl--compact" style={{ borderRadius: 0, minWidth: 620 }}>
          <thead>
            <tr>
              <th style={{ borderRadius: 0, width: 30, textAlign: 'center' }}>#</th>
              <th>Article</th>
              <th style={{ width: 55 }}>Colis</th>
              <th style={{ width: 55 }}>Pièces</th>
              <th style={{ width: 80 }}>Poids (kg)</th>
              <th style={{ width: 165 }}>Catégorie</th>
              <th style={{ width: 75, textAlign: 'right', borderRadius: 0 }}>Montant</th>
              <th style={{ width: 50, borderRadius: 0 }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => {
              const cat = CATS.find(c => c.id === it.category) || CATS[0];
              const linePrice = Math.round((+it.weight || 0) * baseRate * (1 + cat.pct / 100));
              return (
                <tr key={it.id}>
                  <td className="mono" style={{ color: 'var(--ink-400)', fontSize: 12, textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ padding: '5px 8px' }}>
                    <input className="input input--sm" value={it.name} onChange={e => updRow(it.id, 'name', e.target.value)} placeholder="Ex: Boissons, poissons fumés..." />
                  </td>
                  <td style={{ padding: '5px 6px' }}>
                    <input className="input input--sm mono" type="number" min="0" value={it.packs} onChange={e => updRow(it.id, 'packs', +e.target.value)} style={{ textAlign: 'center' }} />
                  </td>
                  <td style={{ padding: '5px 6px' }}>
                    <input className="input input--sm mono" type="number" min="0" value={it.pieces} onChange={e => updRow(it.id, 'pieces', +e.target.value)} style={{ textAlign: 'center' }} />
                  </td>
                  <td style={{ padding: '5px 6px' }}>
                    <input className="input input--sm mono" type="number" min="0" step="0.1" value={it.weight} onChange={e => updRow(it.id, 'weight', +e.target.value)} style={{ textAlign: 'right' }} />
                  </td>
                  <td style={{ padding: '5px 6px' }}>
                    <select
                      className="select input--sm"
                      value={it.category}
                      onChange={e => updRow(it.id, 'category', e.target.value)}
                      style={{ fontSize: 12, height: 30, padding: '0 6px' }}
                    >
                      {CATS.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.icon} {c.label} ({c.pct > 0 ? '+' : ''}{c.pct}%)
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ textAlign: 'right', padding: '5px 8px' }}>
                    {it.weight > 0
                      ? <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-800)' }}>{linePrice}</span>
                      : <span style={{ color: 'var(--ink-300)', fontSize: 12 }}>—</span>
                    }
                  </td>
                  <td style={{ padding: '5px 6px', whiteSpace: 'nowrap' }}>
                    <button className="icon-btn" onClick={() => duplicateRow(it)} style={{ width: 24, height: 24 }} title="Dupliquer"><I.Copy style={{ width: 12, height: 12 }} /></button>
                    <button className="icon-btn" onClick={() => removeRow(it.id)} disabled={items.length <= 1} style={{ width: 24, height: 24, color: items.length <= 1 ? 'var(--ink-300)' : 'var(--bad-500)' }}><I.Trash style={{ width: 12, height: 12 }} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-soft)', borderTop: '1px solid var(--border-soft)' }}>
        <button className="btn btn--ghost btn--sm" onClick={addRow}><I.Plus />Ajouter une ligne</button>
        <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>
          {totalPieces} pièces · <strong className="mono" style={{ color: 'var(--ink-800)' }}>{totalWeight.toFixed(1)} kg</strong> total déclaré
        </div>
      </div>
    </div>
  );
}

/* ── Party field ── */

function PartyField({ kind, en, iconColor, color, data, prefix, cityLabel, upd, withAddress }) {
  const name = data[prefix + 'Name'];
  const phone = data[prefix + 'Phone'];
  return (
    <div className="card" style={{ padding: 16, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 10 }}>
        <div className="section-title" style={{ margin: 0 }}>
          <I.Pin style={{ width: 14, height: 14, color: iconColor }} />
          <span>{kind}</span>
          <span style={{ color: 'var(--ink-300)', fontWeight: 500 }}>/ {en}</span>
        </div>
        {prefix === 'sender' && <button className="btn btn--ghost btn--sm"><I.Search />Choisir expéditeur</button>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: name ? 'var(--bg-soft)' : 'transparent', border: name ? 'none' : '1px dashed var(--border)', marginBottom: 12 }}>
        {name ? (
          <>
            <Avatar initials={name.split(' ').map(x => x[0]).slice(0, 2).join('')} color={color} size="lg" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{name}</div>
              <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>{phone} · {cityLabel}</div>
            </div>
            <button className="btn btn--ghost btn--sm" onClick={() => { upd(prefix + 'Name', ''); upd(prefix + 'Phone', ''); }}><I.Refresh />Changer</button>
          </>
        ) : (
          <div style={{ flex: 1, color: 'var(--ink-400)', fontSize: 12.5, padding: '6px 0' }}>
            {prefix === 'sender' ? 'Sélectionnez un expéditeur existant ou renseignez ci-dessous.' : 'Renseignez les coordonnées du destinataire.'}
          </div>
        )}
      </div>

      <div className="field-row field-row--2">
        <div className="field" style={{ marginBottom: withAddress ? 14 : 0 }}>
          <label className="label">Nom complet</label>
          <input className="input" value={name} onChange={e => upd(prefix + 'Name', e.target.value)} placeholder="Nom prénom" />
        </div>
        <div className="field" style={{ marginBottom: withAddress ? 14 : 0 }}>
          <label className="label">Téléphone</label>
          <input className="input mono" value={phone} onChange={e => upd(prefix + 'Phone', e.target.value)} placeholder={prefix === 'sender' ? '+237 6XX...' : '+1 514...'} />
        </div>
      </div>

      {withAddress && (
        <>
          <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '12px 14px', marginBottom: 0 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-400)', marginBottom: 10 }}>Adresse de livraison</div>
            <div className="field" style={{ marginBottom: 10 }}>
              <label className="label">Adresse (numéro et rue)</label>
              <input className="input" value={data.recipAddress} onChange={e => upd('recipAddress', e.target.value)} placeholder="123 rue Sainte-Catherine" />
            </div>
            <div className="field" style={{ marginBottom: 10 }}>
              <label className="label">Appartement, bureau (optionnel)</label>
              <input className="input" value={data.recipApt} onChange={e => upd('recipApt', e.target.value)} placeholder="Apt 4B" />
            </div>
            <div className="field-row field-row--2" style={{ marginBottom: 10 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Ville</label>
                <select className="select" value={data.recipCity} onChange={e => upd('recipCity', e.target.value)}>
                  <optgroup label="Grand Montréal">
                    {['Montréal','Laval','Longueuil','Brossard','Saint-Lambert','Westmount','Outremont','Côte-Saint-Luc','LaSalle','Verdun','Lachine','Dorval','Pointe-Claire','Dollard-des-Ormeaux','Mont-Royal'].map(c => <option key={c}>{c}</option>)}
                  </optgroup>
                  <optgroup label="Hors région">
                    {['Gatineau','Québec','Ottawa','Toronto','Vancouver','Calgary','Edmonton','Winnipeg'].map(c => <option key={c}>{c}</option>)}
                  </optgroup>
                </select>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Province</label>
                <select className="select" value={data.recipProvince} onChange={e => upd('recipProvince', e.target.value)}>
                  <option value="QC">Québec</option>
                  <option value="ON">Ontario</option>
                  <option value="BC">Colombie-Britannique</option>
                  <option value="AB">Alberta</option>
                  <option value="MB">Manitoba</option>
                  <option value="SK">Saskatchewan</option>
                  <option value="NS">Nouvelle-Écosse</option>
                  <option value="NB">Nouveau-Brunswick</option>
                </select>
              </div>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Code postal</label>
              <input className="input mono" value={data.recipPostal} onChange={e => upd('recipPostal', e.target.value)} placeholder="H3H 1A1" style={{ maxWidth: 160 }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Small components ── */

function DeliveryCard({ sel, onClick, icon, label, en, extra }) {
  return (
    <label onClick={onClick} style={{ padding: 14, border: '1px solid ' + (sel ? 'var(--brand-500)' : 'var(--border)'), background: sel ? 'var(--brand-50)' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, color: sel ? 'var(--brand-700)' : 'var(--ink-700)' }}>
      <input type="radio" checked={sel} readOnly style={{ accentColor: 'var(--brand-500)' }} />
      <div style={{ color: sel ? 'var(--brand-600)' : 'var(--ink-500)' }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 11, opacity: .7 }}>{en}</div>
      </div>
      <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{extra}</span>
    </label>
  );
}

function ToggleChip({ checked, onChange, icon, children }) {
  return (
    <button onClick={onChange} style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, background: checked ? 'var(--brand-500)' : 'white', color: checked ? 'white' : 'var(--ink-600)', border: '1px solid ' + (checked ? 'var(--brand-500)' : 'var(--border)'), display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
      <span>{icon}</span>{children}
    </button>
  );
}

function MiniStat({ label, v, unit }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-900)' }}>
        {v}{unit && <span style={{ fontSize: 10, color: 'var(--ink-400)', marginLeft: 2, fontWeight: 500 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 9.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function SummaryLine({ l, sub, v, cur, warn }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '4px 0', fontSize: 12, gap: 8 }}>
      <span style={{ color: warn ? 'var(--warn-700)' : 'var(--ink-600)', flex: 1 }}>
        {l}{sub && <span style={{ color: 'var(--ink-300)', marginLeft: 4, fontSize: 10 }}>· {sub}</span>}
      </span>
      <span className="mono" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{v} <span style={{ color: 'var(--ink-400)', fontWeight: 400, fontSize: 10 }}>{cur}</span></span>
    </div>
  );
}

function AutoCheck({ checked, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', color: 'var(--ink-700)' }}>
      <input type="checkbox" defaultChecked={checked} style={{ accentColor: 'var(--brand-500)' }} />
      {label}
    </label>
  );
}
