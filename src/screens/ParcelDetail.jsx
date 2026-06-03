'use client';
import { useState } from 'react';
import { DATA, STATUS, PARCEL_CATEGORIES } from '../data.js';
import I from '../components/Icons.jsx';
import { Avatar, Modal } from '../components/Shell.jsx';

export default function ParcelDetailScreen({ id, onNav }) {
  const parcel = DATA.PARCELS.find(p => p.id === id) || DATA.PARCELS[0];
  const campaign = DATA.CAMPAIGNS.find(c => c.code === parcel.campaign) || DATA.CAMPAIGNS[0];
  const paymentStatus = STATUS.payment[parcel.paid];

  const [items, setItems] = useState(() =>
    (parcel.items || []).map(it => ({
      id: it.id,
      name: it.desc,
      cat: it.cat || 'standard',
      packs: it.qty,
      pieces: it.qty,
      kg: it.kg,
      status: 'ok',
      discr: 0,
      note: '',
    }))
  );
  const [showSlip, setShowSlip] = useState(!!parcel.slip);
  const [linkSent, setLinkSent] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  const updItem = (itemId, k, v) => setItems(items.map(i => i.id === itemId ? { ...i, [k]: v } : i));
  const totalDiscr = items.reduce((a, i) => a + i.discr, 0);
  const totalPieces = items.reduce((a, i) => a + i.pieces, 0);

  const deliveryFee = parcel.delivery === 'home' ? 25 : 0;
  const overrunFee = parcel.overrun ? (parcel.actualKg - parcel.reservedKg) * 22 : 0;

  return (
    <div className="page">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ink-400)', marginBottom: 8 }}>
        <a style={{ cursor: 'pointer' }} onClick={() => onNav('/')}>Cargaisons</a>
        <I.ChevronRight style={{ width: 12, height: 12 }} />
        <a style={{ cursor: 'pointer' }} onClick={() => onNav('/campaign/' + campaign.id)}>{campaign.code}</a>
        <I.ChevronRight style={{ width: 12, height: 12 }} />
        <span style={{ color: 'var(--ink-600)', fontWeight: 600 }}>Colis {parcel.code}</span>
      </div>

      {/* Header */}
      <div className="page__head" style={{ marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h1 className="page__title" style={{ margin: 0 }}>Colis {parcel.code}</h1>
            <span className={'badge badge--dot badge--' + paymentStatus.cls}>{paymentStatus.label}</span>
            {parcel.overrun && <span className="badge badge--warn badge--dot">Dépassement poids</span>}
          </div>
          <div className="page__sub">
            Cargaison <a style={{ color: 'var(--brand-700)', fontWeight: 600, cursor: 'pointer' }} onClick={() => onNav('/campaign/' + campaign.id)}>{campaign.code}</a> ·
            Agent <strong style={{ color: 'var(--ink-700)' }}>{parcel.agent === 'AM' ? 'Aïcha M.' : 'Marc L.'}</strong>
          </div>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost"><I.Whatsapp style={{ color: 'var(--ok-600)' }} />WhatsApp</button>
          <button className="btn btn--ghost"><I.Print />Imprimer</button>
          {!linkSent ? (
            <button className="btn btn--brand" onClick={() => setShowPayModal(true)}>
              <I.Send />Envoyer lien Interac
            </button>
          ) : (
            <button className="btn btn--ghost btn--ok" disabled style={{ opacity: 1, color: 'var(--ok-700)', borderColor: 'var(--ok-300)', background: 'var(--ok-50)' }}>
              <I.Check />Lien envoyé
            </button>
          )}
        </div>
      </div>

      <div className="layout-2col">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Sender / Recipient */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <PartyCard
              kind="Expéditeur" en="Sender"
              name={parcel.senderName} phone={parcel.senderPhone}
              city="Douala" color={1}
              icon={<I.Pin style={{ color: 'var(--brand-500)', width: 16, height: 16, flexShrink: 0 }} />}
            />
            <PartyCard
              kind="Destinataire" en="Recipient"
              name={parcel.recipName} phone={parcel.recipPhone}
              city={parcel.recipCity} color={2}
              icon={<I.Pin style={{ color: 'var(--info-600)', width: 16, height: 16, flexShrink: 0 }} />}
            />
          </div>

          {/* Weight & contents */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <I.Box style={{ width: 14, height: 14, color: 'var(--brand-600)' }} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>Contenu & poids</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
              <Kv label="Poids réservé" value={parcel.reservedKg + ' kg'} />
              <Kv label="Poids réel" value={parcel.actualKg + ' kg'} color={parcel.overrun ? 'var(--warn-700)' : undefined} />
              <Kv label="Livraison" value={parcel.delivery === 'home' ? 'Domicile' : 'Retrait entrepôt'} />
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-600)', padding: '10px 12px', background: 'var(--bg-soft)', border: '1px solid var(--border)' }}>
              {parcel.contents}
            </div>
            {parcel.note && parcel.note !== '—' && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-500)', fontStyle: 'italic' }}>
                Note : {parcel.note}
              </div>
            )}
          </div>

          {/* Bordereau section */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  Bordereau {parcel.slip ? <span className="mono badge badge--neutral badge--lg" style={{ fontSize: 12 }}>{parcel.slip}</span> : ''}
                </div>
                {!parcel.slip && <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>Aucun bordereau créé</div>}
              </div>
              {!parcel.slip && !showSlip && (
                <button className="btn btn--brand btn--sm" onClick={() => setShowSlip(true)}>
                  <I.Plus />Créer le bordereau
                </button>
              )}
              {parcel.slip && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn--ghost btn--sm" onClick={() => onNav('/parcels/' + parcel.id + '/labels')}><I.Tag />Étiquettes</button>
                  <button className="btn btn--ghost btn--sm"><I.Print />Imprimer</button>
                  <button className="btn btn--ghost btn--sm"><I.Download />PDF</button>
                  <button className="btn btn--ghost btn--sm"><I.Whatsapp style={{ color: 'var(--ok-600)' }} />Envoyer</button>
                </div>
              )}
            </div>

            {showSlip && (
              <>
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Vérification du contenu</div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                    <Stat label="Articles" value={items.length} />
                    <Stat label="Pièces" value={totalPieces} />
                    <Stat label="Écarts" value={totalDiscr} color={totalDiscr > 0 ? 'var(--bad-600)' : null} />
                  </div>
                </div>

                <table className="tbl tbl--compact" style={{ borderRadius: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ borderRadius: 0, width: 32 }}>#</th>
                      <th>Article / Description</th>
                      <th style={{ width: 140 }}>Catégorie</th>
                      <th style={{ width: 60 }}>Qté</th>
                      <th style={{ width: 155 }}>Vérification</th>
                      <th style={{ width: 55, textAlign: 'center' }}>Écart</th>
                      <th style={{ borderRadius: 0 }}>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, i) => {
                      const catDef = PARCEL_CATEGORIES.find(c => c.id === it.cat) || PARCEL_CATEGORIES[0];
                      return (
                        <tr key={it.id}>
                          <td className="mono" style={{ color: 'var(--ink-400)', fontSize: 12 }}>{i + 1}</td>
                          <td>
                            <input className="input input--sm" value={it.name}
                              onChange={e => updItem(it.id, 'name', e.target.value)}
                              placeholder="Libellé article..." style={{ fontSize: 12, fontWeight: 500 }} />
                          </td>
                          <td>
                            <select className="select input--sm" style={{ height: 28, padding: '0 8px', fontSize: 12 }}
                              value={it.cat} onChange={e => updItem(it.id, 'cat', e.target.value)}>
                              {PARCEL_CATEGORIES.map(c => (
                                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="mono">{it.packs}</td>
                          <td>
                            <select className="select input--sm" style={{ height: 28, padding: '0 8px', fontSize: 12 }}
                              value={it.status} onChange={e => updItem(it.id, 'status', e.target.value)}>
                              <option value="ok">Conforme</option>
                              <option value="missing">Manquant</option>
                              <option value="extra">En plus</option>
                              <option value="verify">A vérifier</option>
                            </select>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="mono" style={{ fontWeight: 700, color: it.discr > 0 ? 'var(--bad-600)' : 'var(--ink-300)' }}>
                              {it.discr > 0 ? '-' + it.discr : '—'}
                            </span>
                          </td>
                          <td>
                            <input className="input input--sm" value={it.note}
                              onChange={e => updItem(it.id, 'note', e.target.value)}
                              placeholder="—" style={{ fontSize: 12 }} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button className="btn btn--ghost btn--sm" onClick={() => setItems([...items, { id: Date.now(), name: '', cat: 'standard', packs: 1, pieces: 1, kg: 0, status: 'ok', discr: 0, note: '' }])}>
                    <I.Plus />Ajouter article
                  </button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn--ghost btn--sm" onClick={() => onNav('/parcels/' + parcel.id + '/labels')}>
                      <I.Tag />Imprimer étiquettes
                    </button>
                    <button className="btn btn--primary btn--sm"><I.Check />Valider le bordereau</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Payment panel */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className="section-title" style={{ margin: 0 }}>
                <I.Wallet style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Paiement
              </div>
              <span className={'badge badge--dot badge--' + paymentStatus.cls}>{paymentStatus.label}</span>
            </div>

            <div style={{ display: 'grid', gap: 6, marginBottom: 14, fontSize: 13 }}>
              <SlipLine l={`Poids ${parcel.actualKg} kg × 18 CAD`} v={Math.round(parcel.actualKg * 18)} />
              {overrunFee > 0 && <SlipLine l={`Dépassement +${parcel.actualKg - parcel.reservedKg} kg × 22 CAD`} v={overrunFee} />}
              {deliveryFee > 0 && <SlipLine l="Livraison à domicile" v={deliveryFee} />}
            </div>

            <div style={{ padding: '12px 0', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              <span style={{ fontWeight: 700 }}>Total dû</span>
              <span className="mono" style={{ fontSize: 22, fontWeight: 700 }}>
                {parcel.amount} <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>CAD</span>
              </span>
            </div>

            {parcel.paid === 'unpaid' || parcel.paid === 'pending' ? (
              <div style={{ display: 'grid', gap: 8 }}>
                <button className="btn btn--brand" style={{ justifyContent: 'center' }} onClick={() => setShowPayModal(true)}>
                  <I.Send />Envoyer lien Interac
                </button>
                <button className="btn btn--ghost" style={{ justifyContent: 'center' }}>
                  <I.Check />Marquer comme payé
                </button>
              </div>
            ) : (
              <div style={{ padding: 10, background: 'var(--ok-50)', border: '1px solid var(--ok-100)', fontSize: 11.5, color: 'var(--ok-700)' }}>
                <strong>Réglé</strong> · Virement Interac
              </div>
            )}
          </div>

          {/* Delivery */}
          <div className="card" style={{ padding: 16 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>
              <I.Truck style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Mode de livraison
            </div>
            <div style={{ padding: 12, background: 'var(--bg-soft)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {parcel.delivery === 'home'
                  ? <><I.Truck style={{ color: 'var(--brand-600)' }} /><span style={{ fontSize: 13, fontWeight: 700 }}>Livraison à domicile</span><span className="mono" style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600 }}>+25 CAD</span></>
                  : <><I.Warehouse style={{ color: 'var(--ink-500)' }} /><span style={{ fontSize: 13, fontWeight: 700 }}>Retrait entrepôt</span><span className="mono" style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: 'var(--ok-600)' }}>Gratuit</span></>
                }
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>Destinataire</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{parcel.recipName}</div>
              <div className="mono" style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>{parcel.recipPhone}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 1 }}>{parcel.recipCity}, Canada</div>
            </div>
          </div>

          {/* History */}
          <div className="card" style={{ padding: 16 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>
              <I.History style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Historique
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                { who: 'Aïcha M.', what: 'Colis enregistré dans la cargaison', when: '14 avr. 08:30', c: 1 },
                { who: 'Aïcha M.', what: 'Lien paiement Interac envoyé', when: '14 avr. 09:00', c: 1 },
                { who: 'Marc L.',  what: 'Poids réel confirmé à l\'entrepôt', when: '28 avr. 07:55', c: 2 },
              ].map((h, i, arr) => (
                <div key={i} style={{ display: 'flex', gap: 10, position: 'relative' }}>
                  {i < arr.length - 1 && <div style={{ position: 'absolute', left: 10, top: 22, bottom: -6, width: 1, background: 'var(--border)' }} />}
                  <Avatar initials={h.who.split(' ').map(x => x[0]).join('')} color={h.c} size="sm" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5 }}><strong>{h.who}</strong> — {h.what}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 1 }}>{h.when}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showPayModal && (
        <InteracModal
          parcel={parcel}
          onClose={() => setShowPayModal(false)}
          onSend={() => { setLinkSent(true); setShowPayModal(false); }}
        />
      )}
    </div>
  );
}

function InteracModal({ parcel, onClose, onSend }) {
  const token = 'pay-' + parcel.id + '-' + Math.random().toString(36).slice(2, 8);
  const payUrl = typeof window !== 'undefined' ? window.location.origin + '/payer/' + token : '/payer/' + token;

  return (
    <Modal width={700} onClose={onClose}
      title="Envoyer le lien de paiement Interac"
      sub={'Colis ' + parcel.code + ' · ' + parcel.amount + ' CAD dû'}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Annuler</button>
          <button className="btn btn--brand" onClick={onSend}><I.Send />Envoyer par WhatsApp</button>
        </>
      }>
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ padding: 14, background: 'var(--bg-soft)', border: '1px solid var(--border)', fontSize: 12.5, color: 'var(--ink-700)', lineHeight: 1.6 }}>
          <strong>{parcel.recipName}</strong> ({parcel.recipPhone}) recevra un lien unique pour payer <span className="mono" style={{ fontWeight: 700 }}>{parcel.amount} CAD</span> par virement Interac.
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-400)', marginBottom: 6 }}>Lien de paiement</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="mono" style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-soft)', border: '1px solid var(--border)', fontSize: 11.5, color: 'var(--ink-600)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {payUrl}
            </div>
            <button className="btn btn--ghost btn--sm" onClick={() => navigator.clipboard?.writeText(payUrl)}>Copier</button>
          </div>
        </div>

        <div style={{ padding: 12, background: 'var(--warn-50)', border: '1px solid var(--warn-100)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--warn-800)', marginBottom: 6 }}>Instructions Interac</div>
          <div style={{ fontSize: 12, color: 'var(--ink-700)', lineHeight: 1.65 }}>
            Le destinataire devra effectuer le virement depuis un compte dont l'<strong>adresse e-mail ou le numéro de téléphone correspond exactement</strong> à celui enregistré dans notre système :
            <div className="mono" style={{ marginTop: 6, fontWeight: 700, color: 'var(--ink-900)' }}>{parcel.recipPhone}</div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function PartyCard({ kind, en, name, phone, city, color, icon }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {icon}
        <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700, color: 'var(--ink-400)' }}>
          {kind} <span style={{ color: 'var(--ink-300)', fontWeight: 500 }}>/ {en}</span>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar initials={name.split(' ').map(x => x[0]).slice(0, 2).join('')} color={color} size="lg" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{name}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>{city}, {color === 1 ? 'Cameroun' : 'Canada'}</div>
        </div>
      </div>
      <div className="mono" style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-400)' }}>{phone}</div>
    </div>
  );
}

function Kv({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600, color: 'var(--ink-400)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: color || 'var(--ink-900)' }}>{value}</div>
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

function SlipLine({ l, v }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-600)' }}>
      <span>{l}</span>
      <span className="mono" style={{ color: 'var(--ink-800)', fontWeight: 600 }}>{v} CAD</span>
    </div>
  );
}
