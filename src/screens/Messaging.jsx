'use client';
import { useState, useEffect, useCallback } from 'react';
import I from '../components/Icons.jsx';
import { Bi, Avatar } from '../components/Shell.jsx';

const TEMPLATES = [
  { id: 'arrival',   l: "Avis d'arrivée",   body: `Bonjour {first_name} 👋\n\nVotre colis ({parcel_code}) est arrivé à Montréal.\n\n📦 Poids : {weight} kg\n💰 Montant dû : {amount} CAD\n\n📍 Retrait : {warehouse_address}\n📞 Contact : {agent_phone}\n\nMerci,\nJumla Shipping` },
  { id: 'reminder',  l: 'Relance paiement', body: `Bonjour {first_name},\n\nNous n'avons pas encore reçu votre paiement pour le colis {parcel_code} — montant dû : {amount} CAD.\n\nMerci de régulariser votre situation au plus vite.\n\nJumla Shipping` },
  { id: 'delivery',  l: 'Livraison',        body: `Bonjour {first_name},\n\nVotre colis {parcel_code} a été livré. Merci de votre confiance !\n\nJumla Shipping` },
  { id: 'invoice',   l: 'Facture',          body: `Bonjour {first_name},\n\nVoici le récapitulatif de votre colis {parcel_code} :\n• Poids : {weight} kg\n• Montant : {amount} CAD\n\nJumla Shipping` },
  { id: 'broadcast', l: 'Annonce cargaison', body: `Bonjour {first_name} 👋\n\nNouvelle cargaison disponible — départ prévu le {arrival_date}.\n\nRéservez votre place dès maintenant.\n\nJumla Shipping` },
];
const VARIABLES = ['{first_name}', '{amount}', '{weight}', '{parcel_code}', '{arrival_date}', '{warehouse_address}', '{agent_phone}'];

export default function MessagingScreen({ onNav }) {
  const [selected,   setSelected]   = useState([]);
  const [template,   setTemplate]   = useState('arrival');
  const [body,       setBody]       = useState(TEMPLATES[0].body);
  const [parcels,    setParcels]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('all');
  const [apiStatus,  setApiStatus]  = useState(null); // {configured, fromNumber}
  const [logs,       setLogs]       = useState([]);
  const [sending,    setSending]    = useState(false);
  const [sendResult, setSendResult] = useState(null);

  const loadData = useCallback(() => {
    Promise.all([
      fetch('/api/parcels').then(r => r.json()),
      fetch('/api/messaging/status').then(r => r.json()),
      fetch('/api/messaging/logs').then(r => r.json()),
    ]).then(([ps, status, ls]) => {
      setParcels(Array.isArray(ps) ? ps : []);
      setApiStatus(status);
      setLogs(Array.isArray(ls) ? ls : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = parcels.filter(p => {
    if (filter === 'unpaid') return p.paid !== 'paid';
    return true;
  });

  const toggleSelect = (id) => setSelected(sel =>
    sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]
  );

  const onTemplateChange = (id) => {
    setTemplate(id);
    const t = TEMPLATES.find(t => t.id === id);
    if (t) setBody(t.body);
  };

  const insertVar = (v) => setBody(b => b + v);

  const previewParcel = filtered.find(p => selected.includes(p.id)) ?? filtered[0];
  const previewBody = body
    .replace(/\{first_name\}/g,        previewParcel?.senderName?.split(' ')[0] ?? 'Client')
    .replace(/\{amount\}/g,            String(previewParcel?.amount ?? 0))
    .replace(/\{weight\}/g,            String(previewParcel?.weightKg ?? 0))
    .replace(/\{parcel_code\}/g,       previewParcel?.trackingCode ?? 'JMS-00000')
    .replace(/\{arrival_date\}/g,      'à définir')
    .replace(/\{warehouse_address\}/g, '5500 Pl. de la Savane, Lachine')
    .replace(/\{agent_phone\}/g,       '+1 514 000 0000');

  async function handleSend() {
    if (!selected.length || !apiStatus?.configured) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch('/api/messaging/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ parcelIds: selected, body }),
      });
      const data = await res.json();
      setSendResult(data);
      setSelected([]);
      // Refresh logs
      fetch('/api/messaging/logs').then(r => r.json()).then(ls => setLogs(Array.isArray(ls) ? ls : []));
    } catch {
      setSendResult({ error: 'Erreur réseau' });
    } finally {
      setSending(false);
    }
  }

  async function handleSendOne(parcelId) {
    if (!apiStatus?.configured) { onNav('/admin/settings?tab=whatsapp'); return; }
    setSending(true);
    try {
      const res = await fetch('/api/messaging/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ parcelIds: [parcelId], body }),
      });
      const data = await res.json();
      setSendResult(data);
      fetch('/api/messaging/logs').then(r => r.json()).then(ls => setLogs(Array.isArray(ls) ? ls : []));
    } catch {}
    finally { setSending(false); }
  }

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__title"><Bi fr="Messagerie WhatsApp" en="Messaging" /></div>
          <div className="page__sub">Envoi manuel · modèles bilingues · suivi de délivrance</div>
        </div>
        <div className="page__actions">
          {apiStatus === null ? null : apiStatus.configured ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--ok-50)', border: '1px solid var(--ok-100)', borderRadius: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--ok-500)' }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ok-700)' }}>API connectée · {apiStatus.fromNumber}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--warn-50)', border: '1px solid var(--warn-100)', borderRadius: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--warn-500)' }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--warn-700)' }}>API non configurée</span>
            </div>
          )}
          <button className="btn btn--ghost" onClick={() => onNav('/admin/settings?tab=whatsapp')}>
            <I.Settings />Configurer
          </button>
        </div>
      </div>

      {sendResult && (
        <div style={{
          marginBottom: 12, padding: '10px 14px', borderRadius: 8,
          background: sendResult.error ? 'var(--bad-50)' : 'var(--ok-50)',
          border: '1px solid ' + (sendResult.error ? 'var(--bad-200)' : 'var(--ok-200)'),
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: sendResult.error ? 'var(--bad-700)' : 'var(--ok-700)' }}>
            {sendResult.error
              ? '⚠️ ' + sendResult.error
              : `✓ ${sendResult.sentCount} envoyé${sendResult.sentCount > 1 ? 's' : ''}${sendResult.failedCount ? ` · ${sendResult.failedCount} échec(s)` : ''}`}
          </span>
          <button onClick={() => setSendResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--ink-400)' }}>✕</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 14 }}>
        {/* Recipient list */}
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
            {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-400)' }}>Chargement…</div>}
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
                  cursor: 'pointer', background: sel ? 'var(--brand-50)' : 'white',
                }}>
                  <input type="checkbox" checked={sel} onChange={() => toggleSelect(p.id)}
                    style={{ accentColor: 'var(--brand-500)' }} />
                  <Avatar initials={initials} color={(p.id.charCodeAt(0) % 8) + 1} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.senderName}</div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--ink-400)' }}>{p.trackingCode} · {p.senderPhone}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ fontSize: 12.5, fontWeight: 700 }}>{(p.amount ?? 0).toLocaleString('fr')} CAD</div>
                    <div style={{ fontSize: 10.5, color: isPaid ? 'var(--ok-600)' : 'var(--bad-600)', fontWeight: 600 }}>
                      {isPaid ? '✓ Payé' : '○ Impayé'}
                    </div>
                  </div>
                  <button className="icon-btn" title="Envoyer maintenant" onClick={e => { e.preventDefault(); handleSendOne(p.id); }}>
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
            <button
              className="btn btn--brand btn--sm"
              style={{ flex: 1, justifyContent: 'center' }}
              disabled={selected.length === 0 || sending || !apiStatus?.configured}
              onClick={handleSend}
            >
              <I.Chat />{sending ? 'Envoi…' : `Envoyer (${selected.length})`}
            </button>
          </div>
        </div>

        {/* Editor + preview */}
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <I.FileText style={{ width: 14, height: 14, color: 'var(--brand-600)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Modèle de message</div>
                <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>Variables remplacées automatiquement à l'envoi</div>
              </div>
              <select className="select input--sm" style={{ width: 220 }} value={template} onChange={e => onTemplateChange(e.target.value)}>
                {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.l}</option>)}
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
                  <button className="btn btn--ghost btn--sm" onClick={() => { const t = TEMPLATES.find(t => t.id === template); if (t) setBody(t.body); }}>Réinit.</button>
                </div>
              </div>

              {/* WhatsApp preview */}
              <div style={{ background: '#E4DDD3', padding: 16, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 360 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: 'var(--ink-500)', textTransform: 'uppercase', marginBottom: 4, textAlign: 'center' }}>
                  Aperçu · {previewParcel?.senderName ?? '—'}
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
              {!apiStatus?.configured && (
                <span style={{ fontSize: 12, color: 'var(--warn-600)' }}>⚠️ Configurez l'API d'abord</span>
              )}
              <button
                className="btn btn--brand"
                disabled={selected.length === 0 || sending || !apiStatus?.configured}
                onClick={handleSend}
              >
                <I.Send />{sending ? 'Envoi en cours…' : `Envoyer · ${selected.length}`}
              </button>
            </div>
          </div>

          {/* Message log */}
          <div className="card">
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <I.History style={{ width: 14, height: 14, color: 'var(--brand-600)' }} />
              <div style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>Journal d'envois</div>
              <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>{logs.length} message{logs.length !== 1 ? 's' : ''}</span>
            </div>
            {logs.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-400)' }}>
                <I.Chat style={{ width: 32, height: 32, opacity: .25, marginBottom: 10 }} />
                <div style={{ fontSize: 13 }}>Aucun message envoyé pour l'instant.</div>
              </div>
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Destinataire</th>
                    <th>Colis</th>
                    <th>Statut</th>
                    <th>Réf. Twilio</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => {
                    const parcel = parcels.find(p => p.id === log.parcelId);
                    return (
                      <tr key={log.id}>
                        <td className="mono" style={{ fontSize: 11.5, whiteSpace: 'nowrap' }}>
                          {new Date(log.sentAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ fontSize: 12.5 }}>
                          <div style={{ fontWeight: 600 }}>{parcel?.senderName ?? log.toPhone}</div>
                          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-400)' }}>{log.toPhone}</div>
                        </td>
                        <td className="mono" style={{ fontSize: 12, color: 'var(--brand-700)' }}>
                          {parcel?.trackingCode ?? '—'}
                        </td>
                        <td>
                          <span className={`badge badge--dot badge--${log.status === 'sent' ? 'ok' : 'bad'}`}>
                            {log.status === 'sent' ? 'Envoyé' : 'Échec'}
                          </span>
                          {log.error && <div style={{ fontSize: 10.5, color: 'var(--bad-600)', marginTop: 2 }}>{log.error}</div>}
                        </td>
                        <td className="mono" style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>
                          {log.twilioSid ? log.twilioSid.slice(0, 20) + '…' : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
