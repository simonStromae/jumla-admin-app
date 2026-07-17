'use client';
import { useState, useEffect, useCallback } from 'react';
import I from '../components/Icons.jsx';
import { Bi, Avatar } from '../components/Shell.jsx';
import { useAdminT } from '../lib/useAdminT.js';


const TEMPLATE_DEFAULTS = [
  { id: 'arrival',   l: "Avis d'arrivée",    body: `Bonjour {first_name} 👋\n\nVotre colis ({parcel_code}) est arrivé à Montréal.\n\n📦 Poids : {weight} kg\n💰 Montant dû : {amount} CAD\n\n📍 Retrait : {warehouse_address}\n📞 Contact : {agent_phone}\n\nMerci,\nJumla Shipping` },
  { id: 'reminder',  l: 'Relance paiement',  body: `Bonjour {first_name},\n\nNous n'avons pas encore reçu votre paiement pour le colis {parcel_code} — montant dû : {amount} CAD.\n\nMerci de régulariser votre situation au plus vite.\n\nJumla Shipping` },
  { id: 'delivery',  l: 'Livraison',         body: `Bonjour {first_name},\n\nVotre colis {parcel_code} a été livré. Merci de votre confiance !\n\nJumla Shipping` },
  { id: 'invoice',   l: 'Facture',           body: `Bonjour {first_name},\n\nVoici le récapitulatif de votre colis {parcel_code} :\n• Poids : {weight} kg\n• Montant : {amount} CAD\n\nJumla Shipping` },
  { id: 'broadcast', l: 'Annonce cargaison', body: `Bonjour {first_name} 👋\n\nNouvelle cargaison disponible — départ prévu le {arrival_date}.\n\nRéservez votre place dès maintenant.\n\nJumla Shipping` },
];
const VARIABLES = ['{first_name}', '{amount}', '{weight}', '{parcel_code}', '{arrival_date}', '{warehouse_address}', '{agent_phone}'];

export default function MessagingScreen({ onNav, campaignId }) {
  const t = useAdminT();
  const [selected,        setSelected]        = useState([]);
  const [templates,       setTemplates]       = useState(TEMPLATE_DEFAULTS);
  const [template,        setTemplate]        = useState('arrival');
  const [body,            setBody]            = useState(TEMPLATE_DEFAULTS[0].body);
  const [parcels,         setParcels]         = useState([]);
  const [campaigns,       setCampaigns]       = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [filter,          setFilter]          = useState('all');
  const [campaignFilter,  setCampaignFilter]  = useState(campaignId ?? '');
  const [apiStatus,       setApiStatus]       = useState(null); // {configured, fromNumber}
  const [logs,            setLogs]            = useState([]);
  const [sending,         setSending]         = useState(false);
  const [sendResult,      setSendResult]      = useState(null);
  const [refreshing,      setRefreshing]      = useState(false);
  const [refreshResult,   setRefreshResult]   = useState(null);
  const [waTemplates,     setWaTemplates]     = useState([]);   // Twilio template status
  const [creatingTmpls,   setCreatingTmpls]   = useState(false);
  const [createResult,    setCreateResult]    = useState(null);
  const [showTemplates,   setShowTemplates]   = useState(false);

  const loadWaTemplates = useCallback(() => {
    fetch('/api/messaging/templates').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setWaTemplates(d);
    }).catch(() => {});
  }, []);

  useEffect(() => { loadWaTemplates(); }, [loadWaTemplates]);

  const loadData = useCallback(() => {
    Promise.all([
      fetch('/api/parcels').then(r => r.json()),
      fetch('/api/messaging/status').then(r => r.json()),
      fetch('/api/messaging/logs').then(r => r.json()),
      fetch('/api/campaigns').then(r => r.json()),
    ]).then(([ps, status, ls, cs]) => {
      setParcels(Array.isArray(ps) ? ps : []);
      setApiStatus(status);
      setLogs(Array.isArray(ls) ? ls : []);
      setCampaigns(Array.isArray(cs) ? cs : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Load customised templates from settings
  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      const loaded = TEMPLATE_DEFAULTS.map(tmpl => ({
        ...tmpl,
        l:    d[`wa_tmpl_${tmpl.id}_label`] ?? tmpl.l,
        body: d[`wa_tmpl_${tmpl.id}_body`]  ?? tmpl.body,
      }));
      setTemplates(loaded);
      const cur = loaded.find(tmpl => tmpl.id === template);
      if (cur) setBody(cur.body);
    }).catch(() => {});
  }, []);

  // Sync campaignFilter when campaignId prop changes
  useEffect(() => {
    if (campaignId) setCampaignFilter(campaignId);
  }, [campaignId]);

  const filtered = parcels.filter(p => {
    if (campaignFilter && p.campaignId !== campaignFilter) return false;
    if (filter === 'unpaid') return p.paid !== 'paid';
    return true;
  });

  const activeCampaign = campaignFilter ? campaigns.find(c => c.id === campaignFilter) : null;

  const toggleSelect = (id) => setSelected(sel =>
    sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]
  );

  const onTemplateChange = (id) => {
    setTemplate(id);
    const found = templates.find(tmpl => tmpl.id === id);
    if (found) setBody(found.body);
  };

  const insertVar = (v) => setBody(b => b + v);

  const previewParcel = filtered.find(p => selected.includes(p.id)) ?? filtered[0];
  const previewBody = body
    .replace(/\{first_name\}/g,        previewParcel?.senderName?.split(' ')[0] ?? 'Client')
    .replace(/\{amount\}/g,            String(previewParcel?.amount ?? 0))
    .replace(/\{weight\}/g,            String(previewParcel?.weightKg ?? 0))
    .replace(/\{parcel_code\}/g,       previewParcel?.trackingCode ?? 'JMS-00000')
    .replace(/\{arrival_date\}/g,      'à définir')
    .replace(/\{destination_city\}/g,  'Montréal')
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
        body:    JSON.stringify({ parcelIds: selected, body, templateId: template }),
      });
      const data = await res.json();
      setSendResult(data);
      setSelected([]);
      // Refresh logs
      fetch('/api/messaging/logs').then(r => r.json()).then(ls => setLogs(Array.isArray(ls) ? ls : []));
    } catch {
      setSendResult({ error: t.common.networkError });
    } finally {
      setSending(false);
    }
  }

  async function handleCreateTemplates() {
    setCreatingTmpls(true);
    setCreateResult(null);
    try {
      const res  = await fetch('/api/messaging/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json();
      setCreateResult(data);
      loadWaTemplates();
    } catch {
      setCreateResult({ error: t.common.networkError });
    } finally {
      setCreatingTmpls(false);
    }
  }

  async function handleRefreshStatuses() {
    setRefreshing(true);
    setRefreshResult(null);
    try {
      const res  = await fetch('/api/messaging/refresh', { method: 'POST' });
      const data = await res.json();
      setRefreshResult(data);
      // Reload logs after refresh
      fetch('/api/messaging/logs').then(r => r.json()).then(ls => setLogs(Array.isArray(ls) ? ls : []));
    } catch {
      setRefreshResult({ error: t.common.networkError });
    } finally {
      setRefreshing(false);
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
          <div className="page__title">{t.messaging.title}</div>
          {/* TODO: no i18n key — Envoi manuel · modèles bilingues · suivi de délivrance */}
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
              {/* TODO: no i18n key for "API non configurée" */}
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--warn-700)' }}>API non configurée</span>
            </div>
          )}
          {/* TODO: no i18n key for "Configurer" — using t.common.update as closest match */}
          <button className="btn btn--ghost" onClick={() => onNav('/admin/settings?tab=whatsapp')}>
            <I.Settings />Configurer
          </button>
        </div>
      </div>

      {activeCampaign && (
        <div style={{
          marginBottom: 12, padding: '10px 16px', borderRadius: 8,
          background: '#F0FDF4', border: '1px solid #25D366',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <svg viewBox="0 0 24 24" fill="#25D366" width="18" height="18"><path d="M17.5 14.4c-.3-.1-1.7-.9-2-1s-.5-.1-.7.1c-.2.3-.7 1-.9 1.1-.2.2-.3.2-.6 0-.3-.1-1.2-.5-2.3-1.4-.8-.7-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5 0-.2 0-.4-.1-.5 0-.1-.7-1.6-1-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.4-.3.3-1 1-1 2.4s1 2.8 1.2 3.1c.2.2 2 3 4.8 4.3.7.3 1.2.4 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.3.3-.7.3-1.2.2-1.3-.1-.2-.3-.3-.6-.4zM12 21a9 9 0 0 1-4.6-1.3L3 21l1.3-4.3A9 9 0 1 1 12 21z" /></svg>
          {/* TODO: no i18n key for "Envoi groupé — Cargaison" or "Voir tous" */}
          <span style={{ fontSize: 13, fontWeight: 700, color: '#166534', flex: 1 }}>
            Envoi groupé — Cargaison <strong>{activeCampaign.code}</strong> · {filtered.length} client{filtered.length !== 1 ? 's' : ''}
          </span>
          <button onClick={() => setCampaignFilter('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#166534', fontWeight: 600 }}>
            Voir tous ✕
          </button>
        </div>
      )}

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

      {/* Sandbox / Production notice */}
      {apiStatus?.configured && (() => {
        const from = apiStatus.fromNumber ?? '';
        if (!from) return null;
        const isSandbox = from.includes('14155238886');
        return (
          <div style={{
            marginBottom: 14, padding: '12px 16px', borderRadius: 10,
            background: isSandbox ? '#fffbeb' : 'var(--bad-50)',
            border: `1.5px solid ${isSandbox ? '#fde68a' : 'var(--bad-200)'}`,
          }}>
            {isSandbox ? (
              <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
                <strong>⚠️ Mode sandbox actif</strong> — Pour recevoir les messages, chaque destinataire doit d'abord envoyer <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontWeight: 700 }}>join pride-upon</code> au <strong>+1 415 523 8886</strong> sur WhatsApp (une seule fois par numéro).
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--bad-700)', lineHeight: 1.6 }}>
                <strong>❌ Numéro de production ({from})</strong> — Ce numéro génère l'erreur 63016 (messages libres hors session 24h refusés par WhatsApp). Pour envoyer des messages libres, changez le numéro d'envoi pour <strong>+14155238886</strong> dans{' '}
                <button onClick={() => onNav('/admin/settings?tab=whatsapp')} style={{ background: 'none', border: 'none', color: 'var(--brand-600)', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 13 }}>Paramètres → WhatsApp</button>.
              </div>
            )}
          </div>
        );
      })()}

      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 14 }}>
        {/* Recipient list */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 200px)' }}>
          <div style={{ padding: 14, borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              {/* TODO: no i18n key for "Destinataires" or "sélectionnés" */}
              <div className="section-title" style={{ margin: 0 }}>
                Destinataires <span className="section-title__count">{filtered.length}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-700)' }}>{selected.length} sélectionnés</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className={'btn btn--sm ' + (filter === 'all' ? 'btn--soft' : 'btn--ghost')} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setFilter('all')}>{t.parcels.filterAll}</button>
              <button className={'btn btn--sm ' + (filter === 'unpaid' ? 'btn--soft' : 'btn--ghost')} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setFilter('unpaid')}>{t.parcels.filterUnpaid}</button>
            </div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-400)' }}>{t.common.loading}</div>}
            {!loading && filtered.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-400)' }}>
                <I.Box style={{ width: 32, height: 32, opacity: .3, marginBottom: 8 }} />
                <div style={{ fontSize: 13 }}>{t.parcels.noParcels}</div>
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
                      {/* TODO: no i18n key for "Impayé" — using t.paymentStatus.paid / t.payments.filterUnpaid */}
                      {isPaid ? `✓ ${t.paymentStatus.paid}` : '○ Impayé'}
                    </div>
                  </div>
                  <button className="icon-btn" title={t.messaging.actions.send} onClick={e => { e.preventDefault(); handleSendOne(p.id); }}>
                    <I.Send style={{ width: 14, height: 14, color: 'var(--ok-600)' }} />
                  </button>
                </label>
              );
            })}
          </div>

          <div style={{ padding: 12, borderTop: '1px solid var(--border)', background: 'var(--bg-soft)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {activeCampaign && (
              /* TODO: no i18n key for "Sélectionner tous de la cargaison" */
              <button className="btn btn--sm" style={{ justifyContent: 'center', background: '#25D366', color: 'white', border: 'none' }}
                onClick={() => setSelected(filtered.map(p => p.id))}>
                Sélectionner tous de la cargaison ({filtered.length})
              </button>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
            {/* TODO: no i18n key for "Sélectionner les impayés" or "Configurer WhatsApp" */}
            <button className="btn btn--soft btn--sm" style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => setSelected(filtered.filter(p => p.paid !== 'paid').map(p => p.id))}>
              <I.Send />Sélectionner les impayés
            </button>
            {!apiStatus?.configured ? (
              <button className="btn btn--sm" style={{ flex: 1, justifyContent: 'center', background: 'var(--warn-500)', color: 'white' }}
                onClick={() => onNav('/admin/settings?tab=whatsapp')}>
                ⚙️ Configurer WhatsApp
              </button>
            ) : (
              <button
                className="btn btn--brand btn--sm"
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={selected.length === 0 || sending}
                onClick={handleSend}
              >
                <I.Chat />{sending ? t.common.sending : `${t.messaging.actions.send} (${selected.length})`}
              </button>
            )}
            </div>
          </div>
        </div>

        {/* Editor + preview */}
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <I.FileText style={{ width: 14, height: 14, color: 'var(--brand-600)' }} />
              <div style={{ flex: 1 }}>
                {/* TODO: no i18n key for "Modèle de message" or "Variables remplacées automatiquement à l'envoi" */}
                <div style={{ fontSize: 13, fontWeight: 700 }}>Modèle de message</div>
                <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>Variables remplacées automatiquement à l'envoi</div>
              </div>
              <select className="select input--sm" style={{ width: 220 }} value={template} onChange={e => onTemplateChange(e.target.value)}>
                {templates.map(tmpl => <option key={tmpl.id} value={tmpl.id}>{tmpl.l}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 0 }}>
              <div style={{ padding: 16, borderRight: '1px solid var(--border)' }}>
                {/* TODO: no i18n key for "Variables disponibles" */}
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
                  {/* TODO: no i18n key for "caractères" or "Réinit." */}
                  <span style={{ fontSize: 11.5, color: 'var(--ink-400)' }}>{body.length} caractères</span>
                  <button className="btn btn--ghost btn--sm" onClick={() => { const tmpl = templates.find(tmpl => tmpl.id === template); if (tmpl) setBody(tmpl.body); }}>Réinit.</button>
                </div>
              </div>

              {/* WhatsApp preview */}
              <div style={{ background: '#E4DDD3', padding: 16, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 360 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: 'var(--ink-500)', textTransform: 'uppercase', marginBottom: 4, textAlign: 'center' }}>
                  {t.common.preview} · {previewParcel?.senderName ?? '—'}
                </div>
                <div style={{ alignSelf: 'flex-start', maxWidth: '92%', background: 'white', borderRadius: '10px 10px 10px 2px', padding: '8px 10px', boxShadow: '0 1px 1px rgba(0,0,0,.08)', fontSize: 12, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                  {previewBody}
                  <div style={{ fontSize: 10, color: 'var(--ink-300)', textAlign: 'right', marginTop: 2 }}>14:32 <span style={{ color: 'var(--info-500)' }}>✓✓</span></div>
                </div>
              </div>
            </div>

            <div style={{ padding: '12px 16px', background: 'var(--bg-soft)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* TODO: no i18n key for "destinataire(s) sélectionné(s)" or "Configurer WhatsApp pour envoyer" */}
              <div style={{ flex: 1, fontSize: 12.5, color: 'var(--ink-600)' }}>
                <strong>{selected.length}</strong> destinataire{selected.length !== 1 ? 's' : ''} sélectionné{selected.length !== 1 ? 's' : ''}
              </div>
              {!apiStatus?.configured ? (
                <button className="btn" style={{ background: 'var(--warn-500)', color: 'white' }} onClick={() => onNav('/admin/settings?tab=whatsapp')}>
                  ⚙️ Configurer WhatsApp pour envoyer
                </button>
              ) : (
                <button
                  className="btn btn--brand"
                  disabled={selected.length === 0 || sending}
                  onClick={handleSend}
                >
                  <I.Send />{sending ? t.common.sending : `${t.messaging.actions.send} · ${selected.length}`}
                </button>
              )}
            </div>
          </div>

          {/* Message log */}
          <div className="card">
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <I.History style={{ width: 14, height: 14, color: 'var(--brand-600)' }} />
              {/* TODO: no i18n key for "Journal d'envois", "message(s)", "Rafraîchir statuts", or "Actualisation…" */}
              <div style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>Journal d'envois</div>
              <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>{logs.length} message{logs.length !== 1 ? 's' : ''}</span>
              {logs.some(l => ['queued','accepted','sending'].includes(l.status)) && (
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={handleRefreshStatuses}
                  disabled={refreshing}
                  title="Interroger Twilio pour mettre à jour les statuts en attente"
                >
                  <I.Refresh style={{ width: 13, height: 13 }} />
                  {refreshing ? 'Actualisation…' : 'Rafraîchir statuts'}
                </button>
              )}
            </div>
            {refreshResult && (
              <div style={{ padding: '8px 16px', background: refreshResult.error ? 'var(--bad-50)' : 'var(--ok-50)', borderBottom: '1px solid var(--border)', fontSize: 12.5, color: refreshResult.error ? 'var(--bad-700)' : 'var(--ok-700)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>
                  {/* TODO: no i18n key for "mis à jour sur" or "Aucun statut mis à jour" */}
                  {refreshResult.error
                    ? `${t.common.error} : ${refreshResult.error}`
                    : refreshResult.updated > 0
                    ? `✓ ${refreshResult.updated} statut${refreshResult.updated > 1 ? 's' : ''} mis à jour sur ${refreshResult.total}`
                    : refreshResult.message ?? 'Aucun statut mis à jour'}
                </span>
                <button onClick={() => setRefreshResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1, color: 'inherit', opacity: .6 }}>×</button>
              </div>
            )}
            {logs.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-400)' }}>
                <I.Chat style={{ width: 32, height: 32, opacity: .25, marginBottom: 10 }} />
                <div style={{ fontSize: 13 }}>Aucun message envoyé</div>
              </div>
            ) : (
              <div style={{ overflowY: 'auto', maxHeight: 480 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>{t.common.date}</th>
                    <th>{t.messaging.logHeaders.recipient}</th>
                    {/* TODO: no i18n key for "Colis" (parcel column) or "Réf. Twilio" */}
                    <th>Colis</th>
                    <th>{t.common.status}</th>
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
                          {(() => {
                            const ok  = ['sent','delivered','read'].includes(log.status);
                            const pnd = ['queued','accepted','sending'].includes(log.status);
                            const undeliv = log.status === 'undelivered';
                            /* TODO: no i18n keys for delivery status labels "Livré", "Envoyé", "En attente", "Non livré", "Échec" */
                            const label = log.status === 'delivered' || log.status === 'read' ? 'Livré'
                              : log.status === 'sent' ? 'Envoyé'
                              : pnd ? 'En attente'
                              : undeliv ? 'Non livré'
                              : 'Échec';
                            const cls = ok ? 'ok' : pnd ? 'info' : 'bad';
                            return <span className={`badge badge--dot badge--${cls}`}>{label}</span>;
                          })()}
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
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp Templates panel */}
        <div className="card" style={{ marginTop: 14 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="1.7"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            {/* TODO: no i18n key for "Templates WhatsApp approuvés", "Masquer ▲", or "Afficher ▼" */}
            <div style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>Templates WhatsApp approuvés</div>
            <button className="btn btn--ghost btn--sm" onClick={() => setShowTemplates(v => !v)}>
              {showTemplates ? 'Masquer ▲' : 'Afficher ▼'}
            </button>
          </div>

          {showTemplates && (
            <div style={{ padding: '14px 16px' }}>
              {/* TODO: no i18n key for the Meta templates explanation paragraph */}
              <p style={{ fontSize: 12.5, color: 'var(--ink-500)', marginBottom: 14, lineHeight: 1.5 }}>
                Les templates approuvés par Meta permettent d'envoyer des messages <strong>sans fenêtre 24h</strong>. Créez-les une fois, soumettez pour approbation (24–48h), ensuite tous les envois les utilisent automatiquement.
              </p>

              {createResult && (
                <div style={{ marginBottom: 12, padding: '8px 14px', borderRadius: 8, background: createResult.error ? 'var(--bad-50)' : 'var(--ok-50)', border: '1px solid ' + (createResult.error ? 'var(--bad-200)' : 'var(--ok-200)'), fontSize: 12.5, color: createResult.error ? 'var(--bad-700)' : 'var(--ok-700)', display: 'flex', justifyContent: 'space-between' }}>
                  {/* TODO: no i18n key for "Templates créés et soumis…" */}
                  <span>{createResult.error ? `${t.common.error} : ${createResult.error}` : '✓ Templates créés et soumis pour approbation Meta (24–48h)'}</span>
                  <button onClick={() => setCreateResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, opacity: .6 }}>×</button>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8, marginBottom: 14 }}>
                {waTemplates.map(tmpl => {
                  const approved  = tmpl.approvalStatus === 'approved';
                  const pending   = tmpl.approvalStatus === 'pending' || tmpl.approvalStatus === 'submitted';
                  const rejected  = tmpl.approvalStatus === 'rejected';
                  const notYet    = tmpl.approvalStatus === 'not_created';
                  const color = approved ? 'var(--ok-700)' : pending ? 'var(--info-700)' : rejected ? 'var(--bad-700)' : 'var(--ink-400)';
                  const bg    = approved ? 'var(--ok-50)'  : pending ? 'var(--info-50)' : rejected ? 'var(--bad-50)'  : 'var(--bg-soft)';
                  /* TODO: no i18n keys for template approval status labels "Approuvé", "En attente", "Rejeté", "Non créé" */
                  const label = approved ? '✓ Approuvé' : pending ? '⏳ En attente' : rejected ? '✕ Rejeté' : notYet ? 'Non créé' : tmpl.approvalStatus;
                  return (
                    <div key={tmpl.id} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: bg }}>
                      <div style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--ink-800)', marginBottom: 3 }}>{tmpl.label || tmpl.id}</div>
                      <div style={{ fontSize: 11, color, fontWeight: 600 }}>{label}</div>
                      {tmpl.contentSid && <div className="mono" style={{ fontSize: 10, color: 'var(--ink-400)', marginTop: 2 }}>{tmpl.contentSid.slice(0, 20)}…</div>}
                    </div>
                  );
                })}
              </div>

              <button
                className="btn btn--brand"
                disabled={creatingTmpls}
                onClick={handleCreateTemplates}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {/* TODO: no i18n keys for "Création en cours…", "Soumettre les templates manquants", "Créer et soumettre tous les templates à Meta" */}
                {creatingTmpls ? 'Création en cours…' : waTemplates.some(tmpl => tmpl.approvalStatus !== 'not_created') ? '↻ Soumettre les templates manquants' : '📤 Créer et soumettre tous les templates à Meta'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
