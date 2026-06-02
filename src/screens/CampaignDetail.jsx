import { useState } from 'react';
import { DATA, getCampaign, getRoute, STATUS, STATUS_STEPS } from '../data.js';
import I from '../components/Icons.jsx';
import { RoutePill, StatusDot, Avatar, Modal, ParcelActionsMenu } from '../components/Shell.jsx';
import { StatusPanel, StatusTransitionModal } from './StatusWorkflow.jsx';

export default function CampaignDetailScreen({ id, onNav, onEdit, onClose: onCloseCampaign }) {
  const c = getCampaign(id) || DATA.CAMPAIGNS[0];
  const r = getRoute(c.route);
  const s = STATUS.campaign[c.status];
  const [tab, setTab] = useState('all');
  const [statusTransition, setStatusTransition] = useState(null);
  const [showClose, setShowClose] = useState(false);

  const workflowStatus = c.status === 'closed' ? 'arrived' : c.status === 'in-transit' ? 'in-transit' : 'open';
  const lockedStates = ['locked', 'in-transit', 'arrived', 'closed'];
  const isLocked = lockedStates.includes(workflowStatus) || c.status === 'closed';
  const parcels = DATA.PARCELS;
  const pct = Math.round(c.collected / c.invoiced * 100);

  const tabs = [
    { id: 'all',     label: 'Tous',           n: parcels.length },
    { id: 'unpaid',  label: 'Impayés',        n: 2, cls: 'bad' },
    { id: 'todeliv', label: 'À livrer',       n: 5 },
    { id: 'noslip',  label: 'Sans bordereau', n: 2, cls: 'warn' },
    { id: 'overrun', label: 'Dépassement',    n: 3, cls: 'warn' },
  ];

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ink-400)', marginBottom: 8 }}>
        <a style={{ cursor: 'pointer' }} onClick={() => onNav('/')}>Cargaisons</a>
        <I.ChevronRight style={{ width: 12, height: 12 }} />
        <span style={{ color: 'var(--ink-600)', fontWeight: 600 }}>{c.code}</span>
      </div>

      <div className="page__head" style={{ marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h1 className="page__title" style={{ margin: 0 }}>{c.code}</h1>
            <RoutePill from={r.fromIATA} to={r.toIATA} size="lg" />
            <StatusDot kind={s.dot} label={s.label} />
          </div>
          <div className="page__sub">
            <I.Calendar style={{ width: 12, height: 12, display: 'inline', verticalAlign: -2, marginRight: 4 }} />
            Départ <strong style={{ color: 'var(--ink-700)' }}>{c.dep}</strong> ·
            Arrivée estimée <strong style={{ color: 'var(--ink-700)' }}>12 mai 2026</strong> ·
            Responsable <strong style={{ color: 'var(--ink-700)' }}>Aïcha M.</strong>
          </div>
        </div>
        <div className="page__actions">
          <button className="btn btn--ghost"><I.Print />Imprimer</button>
          <button className="btn btn--ghost"><I.Download />Export Excel</button>
          <button className="btn btn--ghost" onClick={onEdit} disabled={isLocked} style={isLocked ? { opacity: 0.4, cursor: 'not-allowed' } : {}}><I.Edit />Modifier</button>
          {c.status !== 'closed' && <button className="btn btn--primary" onClick={() => setShowClose(true)}><I.Check />Clôturer</button>}
          <button className="btn btn--brand" onClick={() => !isLocked && onNav('/parcels/new?campaign=' + c.id)} disabled={isLocked} style={isLocked ? { opacity: 0.4, cursor: 'not-allowed' } : {}}><I.Plus />Nouveau colis</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
        {[
          { l: 'Colis',              v: c.parcels,                              u: '' },
          { l: 'Poids total',        v: c.weight.toLocaleString('fr'),          u: 'kg' },
          { l: 'Facturé',            v: c.invoiced.toLocaleString('fr'),        u: 'CAD' },
          { l: 'Perçu',              v: c.collected.toLocaleString('fr'),       u: 'CAD', col: 'var(--ok-600)' },
          { l: 'Reste à percevoir',  v: (c.invoiced - c.collected).toLocaleString('fr'), u: 'CAD', col: 'var(--bad-600)' },
          { l: 'Taux recouvrement',  v: pct,                                    u: '%', col: pct >= 95 ? 'var(--ok-600)' : 'var(--warn-700)' },
        ].map((k, i) => (
          <div key={i} style={{ padding: '14px 18px', borderRight: i < 5 ? '1px solid var(--border-soft)' : 'none' }}>
            <div style={{ fontSize: 10.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600, marginBottom: 4 }}>{k.l}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: k.col || 'var(--ink-900)' }} className="mono">
              {k.v}<span style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 500, marginLeft: 4 }}>{k.u}</span>
            </div>
          </div>
        ))}
      </div>

      <StatusPanel
        status={workflowStatus}
        onAdvance={() => {
          const idx = STATUS_STEPS.findIndex(s => s.id === workflowStatus);
          const next = STATUS_STEPS[idx + 1];
          if (next) setStatusTransition({ from: workflowStatus, to: next.id });
        }}
        onJump={(target, i) => {
          const idx = STATUS_STEPS.findIndex(s => s.id === workflowStatus);
          if (i === idx + 1) setStatusTransition({ from: workflowStatus, to: target.id });
        }}
      />

      {isLocked && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', marginBottom: 14, background: c.status === 'closed' ? 'var(--bg-soft)' : 'var(--warn-50)', border: '1px solid ' + (c.status === 'closed' ? 'var(--border)' : 'var(--warn-100)'), borderRadius: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'white', display: 'grid', placeItems: 'center', color: c.status === 'closed' ? 'var(--ink-500)' : 'var(--warn-700)' }}>
            <I.Lock />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-800)' }}>
              {c.status === 'closed' ? 'Cargaison clôturée — lecture seule' : 'Cargaison verrouillée — plus de modifications possibles'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>
              {c.status === 'closed' ? 'Aucune modification possible. La cargaison est archivée.' : 'Plus d\'ajout ni de modification de colis.'}
            </div>
          </div>
          {c.status !== 'closed' && <button className="btn btn--ghost btn--sm"><I.ArrowLeft />Rouvrir</button>}
        </div>
      )}

      <div className="toolbar">
        <div className="tabs">
          {tabs.map(t => (
            <button key={t.id} className={'tab ' + (tab === t.id ? 'is-active' : '')} onClick={() => setTab(t.id)}>
              {t.label} <span className="count">{t.n}</span>
            </button>
          ))}
        </div>
        <div className="spacer" />
        <div style={{ position: 'relative' }}>
          <I.Search style={{ position: 'absolute', left: 10, top: 9, width: 14, height: 14, color: 'var(--ink-400)' }} />
          <input className="input input--sm" placeholder="Rechercher colis, expéditeur, destinataire..." style={{ width: 280, paddingLeft: 32 }} />
        </div>
        <button className="btn btn--ghost btn--sm"><I.Filter />Filtres</button>
      </div>

      <table className="tbl" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <thead>
          <tr>
            <th style={{ width: 32, borderRadius: 0 }}><input type="checkbox" style={{ accentColor: 'var(--brand-500)' }} /></th>
            <th style={{ borderRadius: 0 }}>Code</th>
            <th>Expéditeur · Douala</th>
            <th>Destinataire · Canada</th>
            <th>Poids</th>
            <th>Contenu</th>
            <th style={{ textAlign: 'right' }}>Montant</th>
            <th>Paiement</th>
            <th>Livraison</th>
            <th>Agent</th>
            <th style={{ width: 44, borderRadius: 0 }}></th>
          </tr>
        </thead>
        <tbody>
          {parcels.map(p => (
            <tr key={p.id}>
              <td><input type="checkbox" style={{ accentColor: 'var(--brand-500)' }} /></td>
              <td><a className="mono" style={{ fontWeight: 700, color: 'var(--brand-700)', cursor: 'pointer' }} onClick={() => onNav('/parcels/' + p.id)}>{p.code}</a></td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar initials={p.senderName.split(' ').map(x => x[0]).join('').slice(0, 2)} color={(p.id.charCodeAt(0) % 8) + 1} size="sm" />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{p.senderName}</div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--ink-400)' }}>{p.senderPhone}</div>
                  </div>
                </div>
              </td>
              <td>
                <div style={{ fontWeight: 600 }}>{p.recipName}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>
                  <span className="mono">{p.recipPhone}</span>
                  <span style={{ marginLeft: 6, color: 'var(--ink-500)' }}>· {p.recipCity}</span>
                </div>
              </td>
              <td>
                <div className="mono" style={{ fontSize: 12, lineHeight: 1.3 }}>
                  <span style={{ color: 'var(--ink-400)' }}>Rés.</span> <strong>{p.reservedKg}</strong> kg<br />
                  <span style={{ color: 'var(--ink-400)' }}>Réel</span> <strong style={{ color: p.overrun ? 'var(--warn-700)' : 'var(--ink-800)' }}>{p.actualKg}</strong> kg
                  {p.overrun && <span style={{ marginLeft: 4, color: 'var(--warn-700)', fontSize: 10 }}>⚠</span>}
                </div>
              </td>
              <td style={{ maxWidth: 200, fontSize: 12, color: 'var(--ink-600)' }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.contents}</div>
              </td>
              <td style={{ textAlign: 'right' }}>
                <span className="mono" style={{ fontWeight: 700, color: 'var(--ink-900)' }}>{p.amount}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-400)', marginLeft: 4 }}>CAD</span>
              </td>
              <td>
                <span className={'badge badge--dot badge--' + STATUS.payment[p.paid].cls}>
                  {STATUS.payment[p.paid].label}
                </span>
              </td>
              <td>
                <span style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--ink-600)' }}>
                  {p.delivery === 'home' ? <><I.Truck style={{ width: 13, height: 13 }} /> Domicile</> : <><I.Warehouse style={{ width: 13, height: 13 }} /> Retrait</>}
                </span>
              </td>
              <td>
                <Avatar initials={p.agent} color={p.agent === 'AM' ? 1 : 2} size="sm" />
              </td>
              <td style={{ overflow: 'visible' }}>
                <ParcelActionsMenu parcel={p} onNav={onNav} isLocked={isLocked} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-400)', display: 'flex', justifyContent: 'space-between' }}>
        <span>{parcels.length} colis affichés sur {c.parcels}</span>
        <span>Dernière modif. : Marc L. — 26 avr. 2026, 14:32</span>
      </div>

      {statusTransition && (
        <StatusTransitionModal
          from={statusTransition.from}
          to={statusTransition.to}
          onClose={() => setStatusTransition(null)}
          onConfirm={() => setStatusTransition(null)}
        />
      )}

      {showClose && (
        <CloseCampaignModal
          id={id}
          onClose={() => setShowClose(false)}
          onConfirm={() => setShowClose(false)}
        />
      )}
    </div>
  );
}

export function CloseCampaignModal({ id, onClose, onConfirm }) {
  const c = getCampaign(id) || DATA.CAMPAIGNS[0];
  const outstanding = c.invoiced - c.collected;
  const internalTotal = 6950;
  const margin = c.collected - internalTotal;
  const marginPct = Math.round(margin / c.collected * 100);

  return (
    <Modal width={780} onClose={onClose}
      title={<span>Clôturer la cargaison <span style={{ color: 'var(--ink-400)', fontWeight: 400, fontSize: '.85em', marginLeft: 6 }}>/ Close shipment</span></span>}
      sub={<><span className="mono">{c.code}</span> — vérifiez le bilan avant de clôturer</>}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Annuler</button>
          <button className="btn btn--soft">Imprimer rapport</button>
          <button className="btn btn--primary" onClick={onConfirm}><I.Check />Confirmer la clôture</button>
        </>
      }>
      <div style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
        <div className="card" style={{ flex: 1, padding: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>Facturé</div>
          <div className="mono" style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{c.invoiced.toLocaleString('fr')} <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>CAD</span></div>
        </div>
        <div className="card" style={{ flex: 1, padding: 14, background: 'var(--ok-50)', borderColor: 'var(--ok-100)' }}>
          <div style={{ fontSize: 11, color: 'var(--ok-700)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>Perçu</div>
          <div className="mono" style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: 'var(--ok-700)' }}>{c.collected.toLocaleString('fr')} <span style={{ fontSize: 12, opacity: .7 }}>CAD</span></div>
        </div>
        <div className="card" style={{ flex: 1, padding: 14, background: outstanding > 0 ? 'var(--bad-50)' : 'var(--bg-soft)', borderColor: outstanding > 0 ? 'var(--bad-100)' : 'var(--border)' }}>
          <div style={{ fontSize: 11, color: outstanding > 0 ? 'var(--bad-700)' : 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>Impayés</div>
          <div className="mono" style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: outstanding > 0 ? 'var(--bad-700)' : 'var(--ink-700)' }}>{outstanding.toLocaleString('fr')} <span style={{ fontSize: 12, opacity: .7 }}>CAD</span></div>
        </div>
      </div>

      {outstanding > 0 && (
        <div style={{ display: 'flex', gap: 10, padding: 12, background: 'var(--warn-50)', border: '1px solid var(--warn-100)', borderRadius: 8, marginBottom: 18 }}>
          <I.Alert style={{ flex: '0 0 16px', color: 'var(--warn-700)', marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-800)' }}>Impayés non régularisés</div>
            <div style={{ fontSize: 12, color: 'var(--ink-600)', marginTop: 2 }}>3 colis présentent des impayés ({outstanding.toLocaleString('fr')} CAD). Choisissez comment les traiter :</div>
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              {['Reporter sur la prochaine cargaison', 'Marquer comme perte', 'Garder ouvert'].map((opt, i) => (
                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '5px 10px', background: 'white', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}>
                  <input type="radio" name="outstanding" defaultChecked={i === 0} style={{ accentColor: 'var(--brand-500)' }} /> {opt}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="section-title">Bilan financier</div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <table className="tbl tbl--compact" style={{ borderRadius: 0 }}>
          <tbody>
            {[
              { l: 'Recettes colis',            v: c.invoiced, type: 'in' },
              { l: 'Frais de livraison facturés', v: 480,      type: 'in' },
              { l: 'Dépassements de poids',      v: 320,       type: 'in' },
              { l: 'Transport aérien',           v: -4200,     type: 'out' },
              { l: 'Douane & dédouanement',      v: -1800,     type: 'out' },
              { l: 'Entrepôt & logistique',      v: -950,      type: 'out' },
            ].map((row, i) => (
              <tr key={i}>
                <td style={{ fontSize: 13 }}>{row.l}</td>
                <td style={{ textAlign: 'right', width: 160 }}>
                  <span className="mono" style={{ fontWeight: 600, color: row.type === 'in' ? 'var(--ok-600)' : 'var(--bad-600)' }}>
                    {row.type === 'in' ? '+' : ''}{row.v.toLocaleString('fr')} CAD
                  </span>
                </td>
              </tr>
            ))}
            <tr style={{ background: 'var(--ink-900)', color: 'white' }}>
              <td style={{ fontWeight: 700, color: 'white' }}>Marge nette</td>
              <td style={{ textAlign: 'right' }}>
                <span className="mono" style={{ fontWeight: 700, fontSize: 16, color: '#F5A524' }}>+{margin.toLocaleString('fr')} CAD</span>
                <span style={{ marginLeft: 8, color: 'rgba(255,255,255,.5)', fontSize: 12 }}>· {marginPct}%</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 10, padding: 12, marginTop: 14, background: 'var(--info-50)', border: '1px solid var(--info-100)', borderRadius: 8 }}>
        <I.Info style={{ flex: '0 0 16px', color: 'var(--info-600)', marginTop: 1 }} />
        <div style={{ fontSize: 12.5, color: 'var(--ink-700)', lineHeight: 1.5 }}>
          La clôture archive la cargaison en lecture seule, génère le rapport financier PDF et envoie un récap par WhatsApp à chaque destinataire.
        </div>
      </div>
    </Modal>
  );
}
