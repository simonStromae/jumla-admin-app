import { useState, useEffect } from 'react';
import I from '../components/Icons.jsx';
import { Bi, Avatar } from '../components/Shell.jsx';

const STATUS_MAP = {
  sent:       { icon: '✓✓', color: 'var(--info-600)', lbl: 'Envoyé' },
  pending:    { icon: '◷',  color: 'var(--warn-600)', lbl: 'En cours' },
  'not-sent': { icon: '○',  color: 'var(--ink-400)',  lbl: 'Non envoyé' },
};

const TEMPLATES = [
  { id: 'invoice',   l: 'Facture',            en: 'Invoice' },
  { id: 'arrival',   l: "Avis d'arrivée",     en: 'Arrival notice' },
  { id: 'delivery',  l: 'Livraison',          en: 'Delivery update' },
  { id: 'reminder',  l: 'Relance paiement',   en: 'Payment reminder' },
  { id: 'broadcast', l: 'Annonce cargaison',  en: 'Campaign broadcast' },
];

const VARIABLES = ['{first_name}', '{amount}', '{weight}', '{parcel_code}', '{arrival_date}', '{warehouse_address}', '{agent_phone}'];

const DEFAULT_BODY = `Bonjour {first_name} 👋

Votre colis ({parcel_code}) vient d'arriver à Montréal.

📦 Poids facturé : {weight} kg
💰 Montant dû : {amount} CAD

Vous pouvez récupérer votre colis à notre entrepôt :
📍 {warehouse_address}

Pour toute question : {agent_phone}

Merci de votre confiance,
L'équipe Jumla`;

export default function MessagingScreen({ onNav }) {
  const [selected, setSelected]   = useState([]);
  const [template, setTemplate]   = useState('arrival');
  const [body, setBody]           = useState(DEFAULT_BODY);
  const [parcels, setParcels]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');

  useEffect(() => {
    fetch('/api/parcels').then(r => r.json()).then(data => {
      setParcels(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = parcels.filter(p => {
    if (filter === 'unpaid') return p.paid === 'unpaid' || p.paid === 'pending';
    if (filter === 'not-sent') return true;
    return true;
  });

  const toggleSelect = (id) => setSelected(sel =>
    sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]
  );

  const insertVar = (v) => setBody(b => b + ' ' + v);

  const previewParcel = filtered[0];
  const previewBody = body
    .replace('{first_name}', previewParcel?.senderName?.split(' ')[0] ?? 'Client')
    .replace('{amount}',     String(previewParcel?.amount ?? 0))
    .replace('{weight}',     String(previewParcel?.weightKg ?? 0))
    .replace(/\{parcel_code\}/g, previewParcel?.trackingCode ?? 'JMS-00000')
    .replace('{arrival_date}', 'à définir')
    .replace('{warehouse_address}', '5500 Pl. de la Savane, Lachine')
    .replace('{agent_phone}', '+1 514 *** ****');

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__title"><Bi fr="Messagerie WhatsApp" en="Messaging" /></div>
          <div className="page__sub">Envoi manuel · modèles bilingues · suivi de délivrance</div>
        </div>
        <div className="page__actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--warn-50)', border: '1px solid var(--warn-100)', borderRadius: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--warn-500)' }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--warn-700)' }}>API non configurée</span>
          </div>
          <button className="btn btn--ghost"><I.Settings />Automatisations</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 14 }}>
        {/* Liste destinataires */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 200px)' }}>
          <div style={{ padding: 14, borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div className="section-title" style={{ margin: 0 }}>
                Destinataires <span className="section-title__count">{filtered.length}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-700)' }}>{selected.length} sélectionnés</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className={'btn btn--sm ' + (filter === 'all' ? 'btn--soft' : 'btn--ghost')} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setFilter('all')}>Tous</button>
              <button className={'btn btn--sm ' + (filter === 'unpaid' ? 'btn--soft' : 'btn--ghost')} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setFilter('unpaid')}>Impayés</button>
            </div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-400)' }}>Chargement…</div>
            )}
            {!loading && filtered.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-400)' }}>
                <I.Box style={{ width: 32, height: 32, opacity: .3, marginBottom: 8 }} />
                <div style={{ fontSize: 13 }}>Aucun colis disponible</div>
              </div>
            )}
            {filtered.map(p => {
              const sel = selected.includes(p.id);
              const initials = (p.senderName ?? '?').split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();
              const isPaid = p.paid === 'paid';
              return (
                <label key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px', borderBottom: '1px solid var(--border-soft)',
                  cursor: 'pointer',
                  background: sel ? 'var(--brand-50)' : 'white',
                }}>
                  <input type="checkbox" checked={sel} onChange={() => toggleSelect(p.id)}
                    style={{ accentColor: 'var(--brand-500)' }} />
                  <Avatar initials={initials} color={(p.id.charCodeAt(0) % 8) + 1} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.senderName}</div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--ink-400)' }}>{p.trackingCode}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ fontSize: 12.5, fontWeight: 700 }}>{(p.amount ?? 0).toLocaleString('fr')} CAD</div>
                    <div style={{ fontSize: 10.5, color: isPaid ? 'var(--ok-600)' : 'var(--bad-600)', fontWeight: 600 }}>
                      {isPaid ? '✓ Payé' : '○ Impayé'}
                    </div>
                  </div>
                  <button className="icon-btn" onClick={e => e.preventDefault()}>
                    <I.Send style={{ width: 14, height: 14, color: 'var(--ok-600)' }} />
                  </button>
                </label>
              );
            })}
          </div>

          <div style={{ padding: 12, borderTop: '1px solid var(--border)', background: 'var(--bg-soft)', display: 'flex', gap: 6 }}>
            <button className="btn btn--soft btn--sm" style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => setSelected(filtered.filter(p => p.paid !== 'paid').map(p => p.id))}>
              <I.Send />Sélectionner les impayés
            </button>
            <button className="btn btn--brand btn--sm" style={{ flex: 1, justifyContent: 'center' }}
              disabled={selected.length === 0}>
              <I.Chat />Envoyer ({selected.length})
            </button>
          </div>
        </div>

        {/* Éditeur + aperçu */}
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <I.FileText style={{ width: 14, height: 14, color: 'var(--brand-600)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Modèle de message</div>
                <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>Variables remplacées automatiquement à l'envoi</div>
              </div>
              <select className="select input--sm" style={{ width: 240 }} value={template} onChange={e => setTemplate(e.target.value)}>
                {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.l} — {t.en}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 0 }}>
              <div style={{ padding: 16, borderRight: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--ink-500)', marginBottom: 8, fontWeight: 600 }}>Variables disponibles</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                  {VARIABLES.map(v => (
                    <button key={v} onClick={() => insertVar(v)} style={{
                      padding: '3px 9px', fontSize: 11, fontFamily: 'var(--ff-mono)',
                      background: 'var(--info-50)', color: 'var(--info-700)',
                      border: '1px solid var(--info-100)', borderRadius: 5, fontWeight: 600, cursor: 'pointer',
                    }}>{v}</button>
                  ))}
                </div>
                <textarea className="textarea" rows={11} value={body} onChange={e => setBody(e.target.value)} style={{ fontSize: 13, lineHeight: 1.55 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-400)' }}>{body.length} caractères</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn--ghost btn--sm" onClick={() => setBody(DEFAULT_BODY)}>Réinit.</button>
                    <button className="btn btn--soft btn--sm">Enregistrer modèle</button>
                  </div>
                </div>
              </div>

              {/* Aperçu WhatsApp */}
              <div style={{ background: '#E4DDD3', padding: 16, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 360 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: 'var(--ink-500)', textTransform: 'uppercase', marginBottom: 4, textAlign: 'center' }}>
                  Aperçu WhatsApp · {previewParcel?.senderName ?? '—'}
                </div>
                <div style={{ alignSelf: 'flex-start', maxWidth: '92%', background: 'white', borderRadius: '10px 10px 10px 2px', padding: '8px 10px', boxShadow: '0 1px 1px rgba(0,0,0,.08)', fontSize: 12, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                  {previewBody}
                  <div style={{ fontSize: 10, color: 'var(--ink-300)', textAlign: 'right', marginTop: 2 }}>14:32 <span style={{ color: 'var(--info-500)' }}>✓✓</span></div>
                </div>
              </div>
            </div>

            <div style={{ padding: '12px 16px', background: 'var(--bg-soft)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, fontSize: 12.5, color: 'var(--ink-600)' }}>
                <strong>{selected.length}</strong> destinataire{selected.length !== 1 ? 's' : ''} recevront ce message
              </div>
              <button className="btn btn--ghost btn--sm">Envoyer un test</button>
              <button className="btn btn--brand" disabled={selected.length === 0}><I.Send />Envoyer · {selected.length}</button>
            </div>
          </div>

          {/* Journal vide */}
          <div className="card">
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <I.History style={{ width: 14, height: 14, color: 'var(--brand-600)' }} />
              <div style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>Journal d'envois</div>
            </div>
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-400)' }}>
              <I.Chat style={{ width: 32, height: 32, opacity: .25, marginBottom: 10 }} />
              <div style={{ fontSize: 13 }}>Aucun message envoyé pour l'instant.</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>L'historique apparaîtra ici une fois l'API configurée.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
