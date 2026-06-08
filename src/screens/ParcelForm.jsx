import { useState, useEffect, useCallback } from 'react';
import I from '../components/Icons.jsx';
import { RoutePill } from '../components/Shell.jsx';

const PRODUCT_TYPES = [
  { id: 'standard',     label: 'Standard',                       desc: 'Savons, pagnes, articles généraux' },
  { id: 'vetements',    label: 'Vêtements / Chaussures / Sacs',  desc: '+2 $/kg supplément' },
  { id: 'cosmetique',   label: 'Cosmétiques / Compléments',      desc: '+3 $/kg supplément' },
  { id: 'alimentaire',  label: 'Alimentaire / Épices',           desc: 'Ndolè, poisson fumé, café…' },
  { id: 'biere',        label: 'Bière',                          desc: '6 $/kg + frais SAQ' },
  { id: 'manioc_huile', label: 'Bâton de manioc / Huile rouge',  desc: 'Tarif spécial' },
  { id: 'electronique', label: 'Électronique',                   desc: '+5 $/kg supplément' },
  { id: 'documents',    label: 'Documents',                      desc: 'Tarif réduit -2 $/kg' },
];

function NumField({ label, value, onChange, min = 0 }) {
  return (
    <div className="field" style={{ marginBottom: 0 }}>
      <label className="label">{label}</label>
      <input
        className="input input--sm mono"
        type="number"
        min={min}
        value={value}
        onChange={e => onChange(Math.max(min, parseInt(e.target.value) || 0))}
        style={{ width: '100%' }}
      />
    </div>
  );
}

function PriceRow({ label, value, bold }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: bold ? 13 : 12, fontWeight: bold ? 700 : 400, color: bold ? 'var(--ink-900)' : 'var(--ink-600)', padding: '3px 0' }}>
      <span>{label}</span>
      <span className="mono">{value.toFixed(2)} $</span>
    </div>
  );
}

export default function ParcelFormPage({ mode = 'create', parcel, campaign, onNav }) {
  const isEdit = mode === 'edit';

  const [campaigns, setCampaigns]   = useState([]);
  const [clients, setClients]       = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [err, setErr]               = useState('');
  const [pricing, setPricing]       = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  const [items, setItems] = useState([
    { id: 1, description: '', productType: 'standard', weightKg: '', nbPieces: '' },
  ]);
  const addItem    = () => setItems(p => [...p, { id: Date.now(), description: '', productType: 'standard', weightKg: '', nbPieces: '' }]);
  const removeItem = id  => setItems(p => p.filter(i => i.id !== id));
  const updItem    = (id, k, v) => setItems(p => p.map(i => i.id === id ? { ...i, [k]: v } : i));
  const totalKg    = items.reduce((s, i) => s + (parseFloat(i.weightKg) || 0), 0);
  const dominantType = items.reduce((best, item) => {
    const w = parseFloat(item.weightKg) || 0;
    return w > best.w ? { type: item.productType, w } : best;
  }, { type: 'standard', w: 0 }).type;

  const [data, setData] = useState({
    campaignId:       campaign?.id || '',
    clientId:         '',
    nbCartons:        parcel?.nbCartons   || 0,
    nbPetitsSacs:     parcel?.nbPetitsSacs    || 0,
    nbSacsMoyens:     parcel?.nbSacsMoyens    || 0,
    nbGrandsSacs:     parcel?.nbGrandsSacs    || 0,
    nbPlastiques:     parcel?.nbPlastiques    || 0,
    nbPlastiquesBiere:parcel?.nbPlastiquesBiere || 0,
    nbCasiers24x65:   parcel?.nbCasiers24x65  || 0,
    nbCasiers24x33:   parcel?.nbCasiers24x33  || 0,
    nbCasiers12x50:   parcel?.nbCasiers12x50  || 0,
    marginPct:        parcel?.marginPct   || 30,
    delivery:         'pickup',
    notes:            parcel?.notes       || '',
  });

  const upd = (k, v) => setData(d => ({ ...d, [k]: v }));

  useEffect(() => {
    Promise.all([
      fetch('/api/campaigns').then(r => r.json()),
      fetch('/api/clients').then(r => r.json()),
    ]).then(([campData, clientData]) => {
      const open = Array.isArray(campData) ? campData.filter(c => c.status === 'open' || c.status === 'Ouverte') : [];
      setCampaigns(open);
      setClients(Array.isArray(clientData) ? clientData : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const calcPrice = useCallback(async (d) => {
    if (!d.weightKg || Number(d.weightKg) <= 0) { setPricing(null); return; }
    setCalcLoading(true);
    try {
      const res = await fetch('/api/pricing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weightKg:         Number(d.weightKg),
          productType:      d.productType,
          nbCartons:        d.nbCartons,
          nbPetitsSacs:     d.nbPetitsSacs,
          nbSacsMoyens:     d.nbSacsMoyens,
          nbGrandsSacs:     d.nbGrandsSacs,
          nbPlastiques:     d.nbPlastiques,
          nbPlastiquesBiere:d.nbPlastiquesBiere,
          nbCasiers24x65:   d.nbCasiers24x65,
          nbCasiers24x33:   d.nbCasiers24x33,
          nbCasiers12x50:   d.nbCasiers12x50,
          marginPct:        Number(d.marginPct),
        }),
      });
      const json = await res.json();
      setPricing(json);
    } catch { setPricing(null); }
    setCalcLoading(false);
  }, []);

  // Recalculate whenever pricing-relevant fields change
  useEffect(() => {
    const timer = setTimeout(() => calcPrice({ ...data, weightKg: totalKg, productType: dominantType }), 300);
    return () => clearTimeout(timer);
  }, [items, data.nbCartons, data.nbPetitsSacs, data.nbSacsMoyens, data.nbGrandsSacs, data.nbPlastiques, data.nbPlastiquesBiere, data.nbCasiers24x65, data.nbCasiers24x33, data.nbCasiers12x50, data.marginPct]);

  const activeCampaign = campaigns.find(c => c.id === data.campaignId) || campaign || null;
  const filteredClients = clients.filter(c =>
    !clientSearch || c.name?.toLowerCase().includes(clientSearch.toLowerCase()) || c.email?.toLowerCase().includes(clientSearch.toLowerCase())
  ).slice(0, 20);

  async function handleSubmit() {
    if (!data.campaignId) { setErr('Veuillez sélectionner une cargaison'); return; }
    if (!data.clientId)   { setErr('Veuillez sélectionner un client'); return; }
    if (totalKg <= 0) { setErr('Le poids total des articles est obligatoire'); return; }

    setSaving(true); setErr('');
    const deliveryFee = data.delivery === 'home' ? 25 : 0;
    const finalPrice  = pricing ? Math.round(pricing.prixClient + deliveryFee) : null;

    try {
      const res = await fetch('/api/parcels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId:          data.clientId,
          campaignId:        data.campaignId,
          items:             items.map(({ id, ...r }) => ({ ...r, weightKg: Number(r.weightKg) || 0, nbPieces: r.nbPieces ? Number(r.nbPieces) : null })),
          description:       items.map(i => i.description).filter(Boolean).join(' · ') || null,
          weightKg:          totalKg,
          productType:       dominantType,
          priceXaf:          finalPrice,
          notes:             data.notes || null,
          nbCartons:         data.nbCartons,
          nbPetitsSacs:      data.nbPetitsSacs,
          nbSacsMoyens:      data.nbSacsMoyens,
          nbGrandsSacs:      data.nbGrandsSacs,
          nbPlastiques:      data.nbPlastiques,
          nbPlastiquesBiere: data.nbPlastiquesBiere,
          nbCasiers24x65:    data.nbCasiers24x65,
          nbCasiers24x33:    data.nbCasiers24x33,
          nbCasiers12x50:    data.nbCasiers12x50,
          marginPct:         Number(data.marginPct),
          pricingDetails:    pricing || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setErr(json.error || 'Erreur lors de la création'); setSaving(false); return; }
      if (campaign) onNav('/campaign/' + campaign.id);
      else onNav('/parcels');
    } catch { setErr('Erreur réseau'); setSaving(false); }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="page__head"><div className="page__title">Nouveau colis</div></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--ink-400)', fontSize: 14 }}>Chargement…</div>
      </div>
    );
  }

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
        <span style={{ color: 'var(--ink-600)', fontWeight: 600 }}>{isEdit ? 'Modifier' : 'Nouveau colis'}</span>
      </div>

      <div className="page__head" style={{ marginBottom: 22 }}>
        <div>
          <div className="page__title">
            {isEdit ? 'Modifier le colis' : 'Nouveau colis'}
            <span style={{ color: 'var(--ink-400)', fontWeight: 400, fontSize: '.7em', marginLeft: 8 }}>/ {isEdit ? 'Edit parcel' : 'New parcel'}</span>
          </div>
          <div className="page__sub">
            {activeCampaign
              ? <>Cargaison <span className="mono" style={{ fontWeight: 600 }}>{activeCampaign.code}</span> · {activeCampaign.from} → {activeCampaign.to}</>
              : 'Sélectionnez une cargaison'}
          </div>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost" onClick={() => campaign ? onNav('/campaign/' + campaign.id) : onNav('/parcels')}>Annuler</button>
          <button className="btn btn--brand" onClick={handleSubmit} disabled={saving}>
            <I.Check />{saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer le colis'}
          </button>
        </div>
      </div>

      {err && (
        <div style={{ padding: '10px 16px', background: 'var(--bad-50)', color: 'var(--bad-700)', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
          {err}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 22, alignItems: 'start' }}>
        <div>
          {/* Campaign selector */}
          {!campaign && (
            <div className="card" style={{ padding: 16, marginBottom: 14 }}>
              <div className="section-title" style={{ marginBottom: 12 }}>
                <I.Plane style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Cargaison
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Cargaison <span className="opt">/ Shipment</span></label>
                {campaigns.length === 0 ? (
                  <div style={{ padding: '10px 12px', background: 'var(--warn-50)', color: 'var(--warn-700)', borderRadius: 6, fontSize: 13, fontWeight: 500, border: '1px solid var(--warn-200)' }}>
                    Aucune cargaison ouverte — les colis ne peuvent être ajoutés qu'aux cargaisons en statut "Ouverte".
                  </div>
                ) : (
                  <select className="select" value={data.campaignId} onChange={e => upd('campaignId', e.target.value)}>
                    <option value="">— Choisir une cargaison</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.code} · {c.from} → {c.to}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          {/* Client */}
          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>
              <I.Users style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Client / Expéditeur
            </div>
            <div className="field" style={{ marginBottom: 8 }}>
              <label className="label">Rechercher un client</label>
              <div style={{ position: 'relative' }}>
                <I.Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: 'var(--ink-400)' }} />
                <input
                  className="input"
                  placeholder="Nom, email, téléphone…"
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                  style={{ paddingLeft: 32 }}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
              {filteredClients.length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--ink-400)', padding: '8px 0', textAlign: 'center' }}>Aucun client trouvé</div>
              )}
              {filteredClients.map(c => (
                <label key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                  border: '1px solid ' + (data.clientId === c.id ? 'var(--brand-500)' : 'var(--border)'),
                  borderRadius: 8, cursor: 'pointer',
                  background: data.clientId === c.id ? 'var(--brand-50)' : 'white',
                }}>
                  <input type="radio" name="client" checked={data.clientId === c.id}
                    onChange={() => upd('clientId', c.id)} style={{ accentColor: 'var(--brand-500)' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-400)' }}>{c.email} {c.phone ? '· ' + c.phone : ''}</div>
                  </div>
                </label>
              ))}
            </div>
            {clients.length === 0 && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-400)', textAlign: 'center' }}>
                Aucun client. <a style={{ color: 'var(--brand-600)', cursor: 'pointer', fontWeight: 600 }} onClick={() => onNav('/admin/clients')}>Créer un client →</a>
              </div>
            )}
          </div>

          {/* Product & Weight - multi-line */}
          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>
              <I.Box style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Contenu & Poids
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 90px 70px 32px', gap: 6, marginBottom: 8, padding: '0 2px' }}>
              {['Description', 'Type produit', 'Poids kg', 'Pièces', ''].map((h, i) => (
                <div key={i} style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</div>
              ))}
            </div>

            {items.map(item => (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 90px 70px 32px', gap: 6, marginBottom: 6 }}>
                <input className="input input--sm" value={item.description}
                  onChange={e => updItem(item.id, 'description', e.target.value)}
                  placeholder="Ex: Vêtements, cosmétiques…" />
                <select className="select" style={{ height: 32, padding: '0 8px', fontSize: 12 }}
                  value={item.productType} onChange={e => updItem(item.id, 'productType', e.target.value)}>
                  {PRODUCT_TYPES.map(pt => <option key={pt.id} value={pt.id}>{pt.label}</option>)}
                </select>
                <input className="input input--sm mono" type="number" min="0.1" step="0.1"
                  value={item.weightKg} onChange={e => updItem(item.id, 'weightKg', e.target.value)} placeholder="0" />
                <input className="input input--sm mono" type="number" min="1"
                  value={item.nbPieces} onChange={e => updItem(item.id, 'nbPieces', e.target.value)} placeholder="—" />
                <button onClick={() => removeItem(item.id)} disabled={items.length === 1}
                  style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', border: '1px solid var(--border)', background: items.length === 1 ? 'var(--bg-soft)' : 'white', borderRadius: 6, cursor: items.length === 1 ? 'not-allowed' : 'pointer', opacity: items.length === 1 ? .35 : 1, fontSize: 16, color: 'var(--ink-500)' }}>×</button>
              </div>
            ))}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-soft)' }}>
              <button className="btn btn--ghost btn--sm" onClick={addItem}><I.Plus />Ajouter une ligne</button>
              {totalKg > 0 && (
                <span style={{ fontSize: 13, color: 'var(--ink-500)' }}>
                  Total : <strong style={{ color: 'var(--ink-900)' }}>{totalKg.toFixed(1)} kg</strong>
                </span>
              )}
            </div>
          </div>

          {/* Packaging */}
          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <div className="section-title" style={{ marginBottom: 14 }}>
              <I.Tag style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Emballage & Conditionnement
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
              <NumField label="Cartons" value={data.nbCartons} onChange={v => upd('nbCartons', v)} />
              <NumField label="Petits sacs" value={data.nbPetitsSacs} onChange={v => upd('nbPetitsSacs', v)} />
              <NumField label="Sacs moyens" value={data.nbSacsMoyens} onChange={v => upd('nbSacsMoyens', v)} />
              <NumField label="Grands sacs" value={data.nbGrandsSacs} onChange={v => upd('nbGrandsSacs', v)} />
              <NumField label="Plastiques std" value={data.nbPlastiques} onChange={v => upd('nbPlastiques', v)} />
              {dominantType === 'biere' && (
                <NumField label="Plastiques bière" value={data.nbPlastiquesBiere} onChange={v => upd('nbPlastiquesBiere', v)} />
              )}
            </div>

            {dominantType === 'biere' && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-400)', marginBottom: 10 }}>Frais SAQ — Casiers de bière</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  <NumField label="Casiers 24×65cl" value={data.nbCasiers24x65} onChange={v => upd('nbCasiers24x65', v)} />
                  <NumField label="Casiers 24×33cl" value={data.nbCasiers24x33} onChange={v => upd('nbCasiers24x33', v)} />
                  <NumField label="Casiers 12×50cl" value={data.nbCasiers12x50} onChange={v => upd('nbCasiers12x50', v)} />
                </div>
              </>
            )}
          </div>

          {/* Delivery + Notes */}
          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>
              <I.Truck style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Livraison & Notes
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {[
                { id: 'pickup', label: 'Retrait entrepôt', en: 'Warehouse pickup', extra: 'Gratuit' },
                { id: 'home',   label: 'Livraison à domicile', en: 'Home delivery', extra: '+25 $ CAD' },
              ].map(opt => (
                <label key={opt.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                  border: '1px solid ' + (data.delivery === opt.id ? 'var(--brand-500)' : 'var(--border)'),
                  borderRadius: 8, cursor: 'pointer',
                  background: data.delivery === opt.id ? 'var(--brand-50)' : 'white',
                }}>
                  <input type="radio" name="delivery" checked={data.delivery === opt.id}
                    onChange={() => upd('delivery', opt.id)} style={{ accentColor: 'var(--brand-500)' }} />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>{opt.extra}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Notes internes <span className="opt">/ optionnel</span></label>
              <textarea className="textarea" rows={2} value={data.notes} onChange={e => upd('notes', e.target.value)} placeholder="Instructions, précautions…" />
            </div>
          </div>

          {/* Margin */}
          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>
              <I.Tag style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Marge commerciale
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Marge commerciale (%)</label>
              <input className="input mono" type="number" min="0" step="1"
                value={data.marginPct} onChange={e => upd('marginPct', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Right: price summary */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, var(--ink-900), var(--ink-800))', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, opacity: .7 }}>Calcul du prix</span>
                {activeCampaign && <RoutePill from={activeCampaign.from} to={activeCampaign.to} />}
              </div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>
                {calcLoading ? '…' : pricing
                  ? `${(pricing.prixClient + (data.delivery === 'home' ? 25 : 0)).toFixed(2)} $`
                  : totalKg > 0 ? '—' : '— $'}
              </div>
              <div style={{ fontSize: 11, opacity: .55, marginTop: 2 }}>
                CAD · Marge {data.marginPct}% · {totalKg.toFixed(1)} kg
              </div>
            </div>

            <div style={{ padding: 16 }}>
              {!pricing && !calcLoading && (
                <div style={{ color: 'var(--ink-400)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>
                  Saisissez le poids pour calculer le prix
                </div>
              )}
              {calcLoading && (
                <div style={{ color: 'var(--ink-400)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>
                  Calcul en cours…
                </div>
              )}
              {pricing && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <PriceRow label="Transport" value={pricing.transport} />
                  {pricing.cartons > 0   && <PriceRow label="Cartons" value={pricing.cartons} />}
                  {pricing.sacs > 0      && <PriceRow label="Sacs" value={pricing.sacs} />}
                  <PriceRow label="Manutention" value={pricing.manutention} />
                  {pricing.douane > 0    && <PriceRow label="Douane & terminal" value={pricing.douane} />}
                  {pricing.formalites > 0 && <PriceRow label="Formalités" value={pricing.formalites} />}
                  {pricing.conditionnement > 0 && <PriceRow label="Conditionnement" value={pricing.conditionnement} />}
                  {pricing.fraisSAQ > 0  && <PriceRow label="Frais SAQ" value={pricing.fraisSAQ} />}
                  <div style={{ borderTop: '1px solid var(--border-soft)', margin: '6px 0' }} />
                  <PriceRow label="Sous-total" value={pricing.sousTotal} />
                  <PriceRow label={`Marge ${data.marginPct}%`} value={pricing.marge} />
                  {data.delivery === 'home' && <PriceRow label="Livraison domicile" value={25} />}
                  <div style={{ borderTop: '2px solid var(--ink-200)', margin: '6px 0' }} />
                  <PriceRow label="Prix client" value={pricing.prixClient + (data.delivery === 'home' ? 25 : 0)} bold />
                </div>
              )}
            </div>

            {/* Selected client summary */}
            {data.clientId && (() => {
              const c = clients.find(x => x.id === data.clientId);
              if (!c) return null;
              return (
                <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-soft)', background: 'var(--bg-soft)' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>Client</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>{c.email}</div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
