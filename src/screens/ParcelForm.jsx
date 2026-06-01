import { useState } from 'react';
import { DATA, getRoute, getCategory } from '../data.js';
import I from '../components/Icons.jsx';
import { RoutePill, Modal, Avatar } from '../components/Shell.jsx';

export default function ParcelFormModal({ mode = 'create', parcel, campaign, onClose, onSave }) {
  const isEdit = mode === 'edit';
  const route = getRoute(campaign?.route) || DATA.ROUTES[0];

  const [data, setData] = useState(() => ({
    code: parcel?.code || '#65',
    senderId: parcel?.senderId || 'cl1',
    senderName: parcel?.senderName || '',
    senderPhone: parcel?.senderPhone || '',
    recipId: parcel?.recipId || '',
    recipName: parcel?.recipName || '',
    recipPhone: parcel?.recipPhone || '',
    recipCity: parcel?.recipCity || 'Montréal',
    recipAddress: parcel?.recipAddress || '',
    reservedKg: parcel?.reservedKg || 10,
    actualKg: parcel?.actualKg || 10,
    contents: parcel?.contents || '',
    category: parcel?.category || 'standard',
    categoryPctOverride: parcel?.categoryPctOverride ?? null,
    items: parcel?.items || [{ id: 1, name: '', packs: 1, pieces: 1, value: 0, note: '' }],
    delivery: parcel?.delivery || 'home',
    paid: parcel?.paid || 'unpaid',
    method: parcel?.method || '',
    agent: parcel?.agent || 'AM',
    note: parcel?.note || '',
    insurance: parcel?.insurance || false,
  }));

  const upd = (k, v) => setData(d => ({ ...d, [k]: v }));

  const grid = route.pricing;
  const reservedAmount = calcPrice(data.reservedKg, grid);
  const actualAmount = calcPrice(data.actualKg, grid);
  const overrun = Math.max(0, data.actualKg - data.reservedKg);
  const overrunAmount = overrun * 22;
  const deliveryFee = data.delivery === 'home' ? 25 : 0;
  const handlingFee = 8;
  const category = getCategory(data.category) || DATA.PARCEL_CATEGORIES[0];
  const categoryPct = data.categoryPctOverride != null ? data.categoryPctOverride : category.pct;
  const categorySurcharge = Math.round(actualAmount * categoryPct / 100);
  const insuranceFee = data.insurance ? Math.round(actualAmount * 0.03) : 0;
  const total = actualAmount + overrunAmount + categorySurcharge + deliveryFee + handlingFee + insuranceFee;

  return (
    <Modal width={920} onClose={onClose}
      title={
        <span>{isEdit ? 'Modifier le colis' : 'Nouveau colis'}
          <span style={{ color: 'var(--ink-400)', fontWeight: 400, fontSize: '.85em', marginLeft: 6 }}>/ {isEdit ? 'Edit parcel' : 'New parcel'}</span>
        </span>
      }
      sub={
        <span>
          Cargaison <span className="mono" style={{ color: 'var(--ink-700)', fontWeight: 600 }}>{campaign?.code || 'DLA-YUL-APR-02'}</span>
          {isEdit && <> · Colis <span className="mono" style={{ color: 'var(--ink-700)', fontWeight: 600 }}>{data.code}</span></>}
        </span>
      }
      footer={
        <>
          {isEdit && <button className="btn btn--ghost" style={{ color: 'var(--bad-600)' }}><I.Trash />Supprimer</button>}
          <div className="spacer" style={{ flex: 1 }} />
          <button className="btn btn--ghost" onClick={onClose}>Annuler</button>
          {!isEdit && <button className="btn btn--soft" onClick={onSave}>Enregistrer & ajouter un autre</button>}
          <button className="btn btn--brand" onClick={onSave}>
            <I.Check />{isEdit ? 'Enregistrer les modifications' : 'Créer le colis'}
          </button>
        </>
      }>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 22 }}>
        <div>
          <PartyField kind="Expéditeur · Douala" en="Sender" iconColor="var(--brand-500)" color={1} data={data} prefix="sender" cityLabel="Cameroun" upd={upd} />
          <PartyField kind="Destinataire · Canada" en="Recipient" iconColor="var(--info-600)" color={2} data={data} prefix="recip" cityLabel={data.recipCity} upd={upd} withAddress />

          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>
              <I.Scale style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Poids
            </div>
            <div className="field-row field-row--2" style={{ marginBottom: 0 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Poids réservé <span className="opt">/ Reserved</span></label>
                <div style={{ position: 'relative' }}>
                  <input className="input mono" type="number" step="0.1" value={data.reservedKg} onChange={e => upd('reservedKg', +e.target.value)} style={{ paddingRight: 36 }} />
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)', fontSize: 12 }}>kg</span>
                </div>
                <div className="hint">Tarif calculé : <strong className="mono" style={{ color: 'var(--ink-700)' }}>{reservedAmount} {route.currency}</strong></div>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Poids réel à l'arrivée <span className="opt">/ Actual</span></label>
                <div style={{ position: 'relative' }}>
                  <input className="input mono" type="number" step="0.1" value={data.actualKg} onChange={e => upd('actualKg', +e.target.value)} style={{ paddingRight: 36 }} />
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)', fontSize: 12 }}>kg</span>
                </div>
                {overrun > 0 && (
                  <div className="hint" style={{ color: 'var(--warn-700)' }}>
                    ⚠ Dépassement <strong className="mono">+{overrun.toFixed(1)} kg</strong> → <strong className="mono">+{overrunAmount.toFixed(0)} {route.currency}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          <ItemsSection data={data} upd={upd} currency={route.currency} />
          <CategorySection data={data} upd={upd} currency={route.currency} actualAmount={actualAmount} />

          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>
              <I.Tag style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Notes & options
            </div>
            <div className="field">
              <label className="label">Note générale <span className="opt">/ General note</span></label>
              <textarea className="textarea" rows={2} value={data.contents} onChange={e => upd('contents', e.target.value)} placeholder="Description résumée, instructions de manutention..." />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Options</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <ToggleChip checked={data.insurance} onChange={() => upd('insurance', !data.insurance)} icon="🛡">Assurance +3%</ToggleChip>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>
              <I.Truck style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Mode de livraison
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <DeliveryCard sel={data.delivery === 'home'} onClick={() => upd('delivery', 'home')} icon={<I.Truck style={{ width: 18, height: 18 }} />} label="Livraison à domicile" en="Home delivery" extra={`+25 ${route.currency}`} />
              <DeliveryCard sel={data.delivery === 'pickup'} onClick={() => upd('delivery', 'pickup')} icon={<I.Warehouse style={{ width: 18, height: 18 }} />} label="Retrait entrepôt" en="Warehouse pickup" extra="Gratuit" />
            </div>
          </div>

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
                <label className="label">Méthode de paiement</label>
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
              <input className="input" value={data.note} onChange={e => upd('note', e.target.value)} placeholder="Note interne..." />
            </div>
          </div>
        </div>

        <div>
          <div style={{ position: 'sticky', top: 0 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, var(--ink-900), var(--ink-800))', color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>{data.code}</span>
                  <RoutePill from={route.fromIATA} to={route.toIATA} />
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)' }}>{campaign?.code || 'DLA-YUL-APR-02'} · Aperçu en direct</div>
              </div>

              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 10.5, color: 'var(--ink-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Détail du tarif</div>
                <SummaryLine l={`Poids ${data.actualKg} kg`} sub={`${getTierRate(data.actualKg, grid)} ${route.currency}/kg`} v={actualAmount} cur={route.currency} />
                {categoryPct !== 0 && <SummaryLine l={`Cat. ${category.label}`} sub={`${categoryPct > 0 ? '+' : ''}${categoryPct}%`} v={(categoryPct > 0 ? '+' : '') + categorySurcharge} cur={route.currency} warn={categoryPct > 0} />}
                {overrun > 0 && <SummaryLine l={`Dépassement +${overrun.toFixed(1)} kg`} sub="22 CAD/kg" v={overrunAmount.toFixed(0)} cur={route.currency} warn />}
                {data.delivery === 'home' && <SummaryLine l="Livraison domicile" sub="Forfait" v={deliveryFee} cur={route.currency} />}
                <SummaryLine l="Manutention" sub="" v={handlingFee} cur={route.currency} />
                {data.insurance && <SummaryLine l="Assurance (3%)" sub="optionnelle" v={insuranceFee} cur={route.currency} />}

                <div style={{ borderTop: '1px solid var(--border)', marginTop: 10, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700 }}>Total dû</span>
                  <span className="mono" style={{ fontSize: 22, fontWeight: 700 }}>
                    {total.toFixed(0)} <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>{route.currency}</span>
                  </span>
                </div>

                {data.paid === 'paid' && (
                  <div style={{ marginTop: 10, padding: 8, background: 'var(--ok-50)', borderRadius: 6, fontSize: 11.5, color: 'var(--ok-700)', fontWeight: 600 }}>
                    ✓ Marqué comme payé · {data.method || '—'}
                  </div>
                )}
                {data.paid === 'unpaid' && (
                  <div style={{ marginTop: 10, padding: 8, background: 'var(--bad-50)', borderRadius: 6, fontSize: 11.5, color: 'var(--bad-700)', fontWeight: 600 }}>
                    ⚠ Reste à percevoir <span className="mono">{total.toFixed(0)} {route.currency}</span>
                  </div>
                )}
              </div>

              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-soft)', background: 'var(--bg-soft)' }}>
                <div style={{ fontSize: 10.5, color: 'var(--ink-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>
                  Grille — route {route.code}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {grid.map((p, i) => {
                    const active = data.actualKg > p.from && data.actualKg <= p.to;
                    return (
                      <span key={i} className="mono" style={{
                        padding: '2px 7px', borderRadius: 4, fontSize: 10.5, fontWeight: 600,
                        background: active ? 'var(--brand-500)' : 'white',
                        color: active ? 'white' : 'var(--ink-600)',
                        border: '1px solid ' + (active ? 'var(--brand-500)' : 'var(--border)'),
                      }}>
                        {p.from}-{p.to}: {p.rate}
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
    </Modal>
  );
}

function calcPrice(weight, grid) {
  if (!weight) return 0;
  for (const tier of grid) {
    if (weight > tier.from && weight <= tier.to) return Math.round(weight * tier.rate);
  }
  return Math.round(weight * grid[grid.length - 1].rate);
}

function getTierRate(weight, grid) {
  for (const tier of grid) {
    if (weight > tier.from && weight <= tier.to) return tier.rate;
  }
  return grid[grid.length - 1].rate;
}

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
        <button className="btn btn--ghost btn--sm"><I.Search />Choisir existant</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: name ? 'var(--bg-soft)' : 'transparent', border: name ? 'none' : '1px dashed var(--border)', borderRadius: 8, marginBottom: 12 }}>
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
          <div style={{ flex: 1, color: 'var(--ink-400)', fontSize: 12.5, padding: '6px 0' }}>Aucun client sélectionné — renseignez les champs ci-dessous.</div>
        )}
      </div>

      <div className="field-row field-row--2">
        <div className="field" style={{ marginBottom: withAddress ? 14 : 0 }}>
          <label className="label">Nom complet <span className="opt">/ Full name</span></label>
          <input className="input" value={name} onChange={e => upd(prefix + 'Name', e.target.value)} placeholder="Ex: Client A" />
        </div>
        <div className="field" style={{ marginBottom: withAddress ? 14 : 0 }}>
          <label className="label">Téléphone <span className="opt">/ Phone</span></label>
          <input className="input mono" value={phone} onChange={e => upd(prefix + 'Phone', e.target.value)} placeholder="+1 514 ..." />
        </div>
      </div>

      {withAddress && (
        <>
          <div className="field-row field-row--2" style={{ marginBottom: 14 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Ville</label>
              <select className="select" value={data.recipCity} onChange={e => upd('recipCity', e.target.value)}>
                {['Montréal', 'Laval', 'Longueuil', 'Brossard', 'Gatineau', 'Québec', 'Toronto'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Langue préférée</label>
              <select className="select" defaultValue="fr"><option value="fr">Français</option><option value="en">English</option></select>
            </div>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Adresse de livraison <span className="opt">/ Delivery address</span></label>
            <input className="input" value={data.recipAddress} onChange={e => upd('recipAddress', e.target.value)} placeholder="N°, rue, code postal..." />
          </div>
        </>
      )}
    </div>
  );
}

function DeliveryCard({ sel, onClick, icon, label, en, extra }) {
  return (
    <label onClick={onClick} style={{ padding: 14, border: '1px solid ' + (sel ? 'var(--brand-500)' : 'var(--border)'), background: sel ? 'var(--brand-50)' : 'white', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, color: sel ? 'var(--brand-700)' : 'var(--ink-700)' }}>
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
    <button onClick={onChange} style={{ padding: '8px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: checked ? 'var(--brand-500)' : 'white', color: checked ? 'white' : 'var(--ink-600)', border: '1px solid ' + (checked ? 'var(--brand-500)' : 'var(--border)'), display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
      <span>{icon}</span>{children}
    </button>
  );
}

function ItemsSection({ data, upd, currency }) {
  const items = data.items || [];
  const addRow = () => upd('items', [...items, { id: (items[items.length - 1]?.id || 0) + 1, name: '', packs: 1, pieces: 1, value: 0, note: '' }]);
  const removeRow = (id) => upd('items', items.filter(i => i.id !== id));
  const updRow = (id, k, v) => upd('items', items.map(i => i.id === id ? { ...i, [k]: v } : i));
  const duplicateRow = (row) => upd('items', [...items, { ...row, id: (items[items.length - 1]?.id || 0) + 1 }]);
  const totalPieces = items.reduce((a, i) => a + (+i.pieces || 0), 0);
  const totalValue = items.reduce((a, i) => a + (+i.value || 0), 0);

  return (
    <div className="card" style={{ padding: 0, marginBottom: 14, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <I.Box style={{ width: 14, height: 14, color: 'var(--brand-600)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>Articles du colis <span style={{ color: 'var(--ink-400)', fontWeight: 500, fontSize: 12, marginLeft: 4 }}>/ Items</span></div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-400)', marginTop: 2 }}>Détaillez chaque article — cette liste alimente le bordereau.</div>
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 11.5 }}>
          <MiniStat label="Articles" v={items.length} />
          <MiniStat label="Pièces" v={totalPieces} />
          <MiniStat label="Valeur" v={totalValue.toLocaleString('fr')} unit={currency} />
        </div>
      </div>

      <table className="tbl tbl--compact" style={{ borderRadius: 0 }}>
        <thead>
          <tr>
            <th style={{ borderRadius: 0, width: 36, textAlign: 'center' }}>#</th>
            <th>Article <span style={{ color: 'var(--ink-300)', fontWeight: 500, marginLeft: 3, textTransform: 'none', letterSpacing: 0 }}>/ Item</span></th>
            <th style={{ width: 80 }}>Colis</th>
            <th style={{ width: 80 }}>Pièces</th>
            <th style={{ width: 130 }}>Valeur ({currency})</th>
            <th>Note</th>
            <th style={{ borderRadius: 0, width: 60 }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={it.id}>
              <td className="mono" style={{ color: 'var(--ink-400)', fontSize: 12, textAlign: 'center' }}>{idx + 1}</td>
              <td style={{ padding: '6px 8px' }}>
                <input className="input input--sm" value={it.name} onChange={e => updRow(it.id, 'name', e.target.value)} placeholder="Ex: Valise — vêtements adulte" />
              </td>
              <td style={{ padding: '6px 8px' }}>
                <input className="input input--sm mono" type="number" min="0" value={it.packs} onChange={e => updRow(it.id, 'packs', +e.target.value)} style={{ textAlign: 'center' }} />
              </td>
              <td style={{ padding: '6px 8px' }}>
                <input className="input input--sm mono" type="number" min="0" value={it.pieces} onChange={e => updRow(it.id, 'pieces', +e.target.value)} style={{ textAlign: 'center' }} />
              </td>
              <td style={{ padding: '6px 8px' }}>
                <input className="input input--sm mono" type="number" min="0" value={it.value} onChange={e => updRow(it.id, 'value', +e.target.value)} style={{ textAlign: 'right' }} />
              </td>
              <td style={{ padding: '6px 8px' }}>
                <input className="input input--sm" value={it.note} onChange={e => updRow(it.id, 'note', e.target.value)} placeholder="—" />
              </td>
              <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>
                <button className="icon-btn" onClick={() => duplicateRow(it)} style={{ width: 26, height: 26 }}><I.Copy style={{ width: 13, height: 13 }} /></button>
                <button className="icon-btn" onClick={() => removeRow(it.id)} disabled={items.length <= 1} style={{ width: 26, height: 26, color: items.length <= 1 ? 'var(--ink-300)' : 'var(--bad-500)' }}><I.Trash style={{ width: 13, height: 13 }} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-soft)', borderTop: '1px solid var(--border-soft)' }}>
        <button className="btn btn--ghost btn--sm" onClick={addRow}><I.Plus />Ajouter un article</button>
        <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>
          {totalPieces} pièces · valeur déclarée <strong className="mono" style={{ color: 'var(--ink-800)' }}>{totalValue.toLocaleString('fr')} {currency}</strong>
        </div>
      </div>
    </div>
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

function CategorySection({ data, upd, currency, actualAmount }) {
  const cats = DATA.PARCEL_CATEGORIES;
  const selectedCat = cats.find(c => c.id === data.category) || cats[0];
  const effectivePct = data.categoryPctOverride != null ? data.categoryPctOverride : selectedCat.pct;
  const surcharge = Math.round(actualAmount * effectivePct / 100);
  const [showOverride, setShowOverride] = useState(data.categoryPctOverride != null);

  return (
    <div className="card" style={{ padding: 16, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10, gap: 10 }}>
        <div className="section-title" style={{ margin: 0 }}>
          <I.Tag style={{ width: 14, height: 14, color: 'var(--brand-600)' }} />
          Catégorie de colis <span style={{ color: 'var(--ink-300)', fontWeight: 500, marginLeft: 4 }}>/ Category</span>
        </div>
        <span style={{ fontSize: 11.5, color: 'var(--ink-400)' }}>Une catégorie ajoute un % à la grille tarifaire.</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 6 }}>
        {cats.map(c => {
          const sel = data.category === c.id;
          return (
            <button key={c.id} onClick={() => { upd('category', c.id); upd('categoryPctOverride', null); setShowOverride(false); }} style={{
              padding: '10px 12px', border: '1.5px solid ' + (sel ? c.color : 'var(--border)'),
              background: sel ? c.color + '12' : 'white', borderRadius: 8, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
            }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>{c.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: sel ? c.color : 'var(--ink-800)' }}>{c.label}</div>
                <div className="mono" style={{ fontSize: 11, fontWeight: 700, color: c.pct > 0 ? 'var(--warn-700)' : c.pct < 0 ? 'var(--ok-700)' : 'var(--ink-400)' }}>
                  {c.pct > 0 ? '+' : ''}{c.pct}%
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 12, padding: 12, background: selectedCat.color + '0F', border: '1px solid ' + selectedCat.color + '33', borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>{selectedCat.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedCat.label}
              {data.categoryPctOverride != null && <span style={{ fontSize: 10.5, padding: '1px 6px', marginLeft: 8, borderRadius: 999, background: 'var(--brand-100)', color: 'var(--brand-700)', fontWeight: 700 }}>OVERRIDE</span>}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-500)', marginTop: 1 }}>{selectedCat.desc}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: effectivePct > 0 ? 'var(--warn-700)' : effectivePct < 0 ? 'var(--ok-700)' : 'var(--ink-700)' }}>
              {effectivePct > 0 ? '+' : ''}{effectivePct}%
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-500)' }}>{surcharge >= 0 ? '+' : ''}{surcharge} {currency}</div>
          </div>
          <button className="btn btn--ghost btn--xs" onClick={() => setShowOverride(!showOverride)}>
            {showOverride ? 'Annuler' : 'Ajuster'}
          </button>
        </div>

        {showOverride && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid ' + selectedCat.color + '33', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-600)', fontWeight: 500 }}>% personnalisé :</span>
            <div style={{ position: 'relative', width: 100 }}>
              <input className="input input--sm mono" type="number"
                value={data.categoryPctOverride != null ? data.categoryPctOverride : selectedCat.pct}
                onChange={e => upd('categoryPctOverride', +e.target.value)}
                style={{ paddingRight: 24, textAlign: 'right' }} />
              <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)', fontSize: 11 }}>%</span>
            </div>
            <button className="btn btn--ghost btn--xs" onClick={() => upd('categoryPctOverride', null)}>Réinitialiser</button>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryLine({ l, sub, v, cur, warn }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '5px 0', fontSize: 12.5, gap: 8 }}>
      <span style={{ color: warn ? 'var(--warn-700)' : 'var(--ink-600)', flex: 1 }}>
        {l}{sub && <span style={{ color: 'var(--ink-300)', marginLeft: 4, fontSize: 11 }}>· {sub}</span>}
      </span>
      <span className="mono" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{v} <span style={{ color: 'var(--ink-400)', fontWeight: 500, fontSize: 11 }}>{cur}</span></span>
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
