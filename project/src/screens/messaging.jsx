// ============================================
// ZENDIT — Screen: WhatsApp messaging center
// ============================================

function MessagingScreen({ onNav }) {
  const [selected, setSelected] = useState(['cl1', 'cl3', 'cl4']);
  const [template, setTemplate] = useState('arrival');
  const [body, setBody] = useState(`Bonjour {first_name} 👋

Votre colis ({parcel_code}) de la cargaison {parcel_code} vient d'arriver à Montréal.

📦 Poids facturé : {weight} kg
💰 Montant dû : {amount} CAD

Vous pouvez récupérer votre colis à notre entrepôt :
📍 {warehouse_address}

Pour toute question : {agent_phone}

Merci de votre confiance,
L'équipe Zendit`);

  const recipients = [
    { id: 'r1', name: 'Client J', phone: '+1 514 *** **45', amount: 280, status: 'sent',    parcel: '#01' },
    { id: 'r2', name: 'Client K', phone: '+1 438 *** **08', amount: 145, status: 'sent',    parcel: '#02' },
    { id: 'r3', name: 'Client L', phone: '+1 450 *** **77', amount: 410, status: 'pending', parcel: '#03' },
    { id: 'r4', name: 'Client M', phone: '+1 514 *** **19', amount: 320, status: 'not-sent', parcel: '#04' },
    { id: 'r5', name: 'Client N', phone: '+1 819 *** **66', amount: 540, status: 'sent',    parcel: '#05' },
    { id: 'r6', name: 'Client O', phone: '+1 514 *** **22', amount: 195, status: 'not-sent', parcel: '#06' },
    { id: 'r7', name: 'Client P', phone: '+1 450 *** **30', amount: 380, status: 'sent',    parcel: '#07' },
    { id: 'r8', name: 'Client Q', phone: '+1 514 *** **51', amount: 110, status: 'sent',    parcel: '#08' },
  ];

  const templates = [
    { id: 'invoice',  l: 'Facture',         en: 'Invoice' },
    { id: 'arrival',  l: 'Avis d\'arrivée', en: 'Arrival notice' },
    { id: 'delivery', l: 'Livraison',       en: 'Delivery update' },
    { id: 'reminder', l: 'Relance paiement',en: 'Payment reminder' },
    { id: 'broadcast',l: 'Annonce cargaison', en: 'Campaign broadcast' },
  ];

  const variables = [
    '{first_name}', '{amount}', '{weight}', '{parcel_code}',
    '{arrival_date}', '{warehouse_address}', '{agent_phone}',
  ];

  const insertVar = (v) => setBody(body + ' ' + v);

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__title"><Bi fr="Messagerie WhatsApp" en="Messaging" /></div>
          <div className="page__sub">Envoi automatique et manuel · suivi de délivrance · modèles bilingues</div>
        </div>
        <div className="page__actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--ok-50)', border: '1px solid var(--ok-100)', borderRadius: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--ok-500)', boxShadow: '0 0 0 4px rgba(16, 185, 129, .2)', animation: 'pulse 1.6s infinite' }}></span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ok-700)' }}>API connectée</span>
            <span style={{ fontSize: 11, color: 'var(--ok-600)' }}>· Twilio · +237 6** ** ** 00</span>
          </div>
          <button className="btn btn--ghost"><I.Settings />Automatisations</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 14 }}>
        {/* Left: recipient list */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 200px)' }}>
          <div style={{ padding: 14, borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div className="section-title" style={{ margin: 0 }}>
                Destinataires <span className="section-title__count">{recipients.length}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-700)' }}>{selected.length} sélectionnés</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn--soft btn--sm" style={{flex:1, justifyContent:'center'}}>Tous</button>
              <button className="btn btn--soft btn--sm" style={{flex:1, justifyContent:'center'}}>Impayés <span style={{ background: 'var(--bad-100)', color: 'var(--bad-700)', padding: '0 6px', borderRadius: 999, marginLeft: 4, fontSize: 10 }}>2</span></button>
              <button className="btn btn--soft btn--sm" style={{flex:1, justifyContent:'center'}}>Non envoyé</button>
            </div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {recipients.map(r => {
              const sel = selected.includes(r.id);
              const statusMap = {
                sent:     { icon: '✓✓', color: 'var(--info-600)', lbl: 'Envoyé' },
                pending:  { icon: '◷',  color: 'var(--warn-600)', lbl: 'En cours' },
                'not-sent': { icon: '○', color: 'var(--ink-400)', lbl: 'Non envoyé' },
              };
              const st = statusMap[r.status];
              return (
                <label key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px', borderBottom: '1px solid var(--border-soft)',
                  cursor: 'pointer',
                  background: sel ? 'var(--brand-50)' : 'white',
                }}>
                  <input type="checkbox" checked={sel} onChange={() => {
                    setSelected(sel ? selected.filter(x => x !== r.id) : [...selected, r.id]);
                  }} style={{accentColor:'var(--brand-500)'}}/>
                  <Avatar initials={r.name.split(' ').map(x=>x[0]).join('')} color={(r.id.charCodeAt(1)%8)+1} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--ink-400)' }}>{r.phone}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ fontSize: 12.5, fontWeight: 700 }}>{r.amount} CAD</div>
                    <div style={{ fontSize: 10.5, color: st.color, fontWeight: 600, fontFamily: 'var(--ff-mono)' }}>{st.icon} {st.lbl}</div>
                  </div>
                  <button className="icon-btn" onClick={(e) => e.preventDefault()}>
                    <I.Send style={{width:14, height:14, color: 'var(--ok-600)'}}/>
                  </button>
                </label>
              );
            })}
          </div>

          <div style={{ padding: 12, borderTop: '1px solid var(--border)', background: 'var(--bg-soft)', display: 'flex', gap: 6 }}>
            <button className="btn btn--soft btn--sm" style={{flex:1, justifyContent:'center'}}>
              <I.Send />Envoyer aux {selected.length} sélectionnés
            </button>
            <button className="btn btn--brand btn--sm" style={{flex:1, justifyContent:'center'}}>
              <I.Whatsapp />Tous les impayés
            </button>
          </div>
        </div>

        {/* Right: editor + preview */}
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <I.FileText style={{ width: 14, height: 14, color: 'var(--brand-600)' }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Modèle de message</div>
                <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>Personnalisez le contenu et utilisez des variables pour chaque client</div>
              </div>
              <select className="select input--sm" style={{ width: 240 }} value={template} onChange={e => setTemplate(e.target.value)}>
                {templates.map(t => <option key={t.id} value={t.id}>{t.l} — {t.en}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 0 }}>
              {/* Editor */}
              <div style={{ padding: 16, borderRight: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--ink-500)', marginBottom: 8, fontWeight: 600 }}>Variables disponibles</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                  {variables.map(v => (
                    <button key={v} onClick={() => insertVar(v)} style={{
                      padding: '3px 9px',
                      fontSize: 11,
                      fontFamily: 'var(--ff-mono)',
                      background: 'var(--info-50)',
                      color: 'var(--info-700)',
                      border: '1px solid var(--info-100)',
                      borderRadius: 5,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}>{v}</button>
                  ))}
                </div>

                <textarea className="textarea" rows={11} value={body} onChange={e => setBody(e.target.value)} style={{ fontSize: 13, lineHeight: 1.55 }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-400)' }}>{body.length} caractères · variables remplacées à l'envoi</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn--ghost btn--sm">Réinit.</button>
                    <button className="btn btn--soft btn--sm">Enregistrer modèle</button>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div style={{ background: '#E4DDD3', padding: 16, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 360 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: 'var(--ink-500)', textTransform: 'uppercase', marginBottom: 4, textAlign: 'center' }}>
                  Aperçu WhatsApp · Client J
                </div>
                <div style={{ alignSelf: 'flex-start', maxWidth: '92%', background: 'white', borderRadius: '10px 10px 10px 2px', padding: '8px 10px', boxShadow: '0 1px 1px rgba(0,0,0,.08)', fontSize: 12, lineHeight: 1.45, whiteSpace: 'pre-wrap', position: 'relative' }}>
                  {body
                    .replace('{first_name}', 'Client J')
                    .replace('{amount}', '280')
                    .replace('{weight}', '14')
                    .replace(/\{parcel_code\}/g, '#01')
                    .replace('{arrival_date}', '12 mai')
                    .replace('{warehouse_address}', '5500 Pl. de la Savane, Lachine')
                    .replace('{agent_phone}', '+1 514 *** ****')}
                  <div style={{ fontSize: 10, color: 'var(--ink-300)', textAlign: 'right', marginTop: 2, display: 'flex', justifyContent: 'flex-end', gap: 3, alignItems: 'center' }}>
                    14:32 <span style={{ color: 'var(--info-500)' }}>✓✓</span>
                  </div>
                </div>
                <div style={{ alignSelf: 'flex-end', maxWidth: '70%', background: '#D9FDD3', borderRadius: '10px 10px 2px 10px', padding: '8px 10px', boxShadow: '0 1px 1px rgba(0,0,0,.08)', fontSize: 12, lineHeight: 1.45 }}>
                  Bien reçu, merci ! Je passe demain matin 🙏
                  <div style={{ fontSize: 10, color: 'var(--ink-400)', textAlign: 'right', marginTop: 2 }}>14:48</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '12px 16px', background: 'var(--bg-soft)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, fontSize: 12.5, color: 'var(--ink-600)' }}>
                <strong>{selected.length}</strong> destinataires recevront ce message
              </div>
              <button className="btn btn--ghost btn--sm">Envoyer un test</button>
              <button className="btn btn--brand"><I.Send />Envoyer · {selected.length}</button>
            </div>
          </div>

          {/* Send log */}
          <div className="card">
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <I.History style={{ width: 14, height: 14, color: 'var(--brand-600)' }}/>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>Journal d'envois</div>
              <a style={{ fontSize: 12, color: 'var(--brand-700)', fontWeight: 600, cursor: 'pointer' }}>Voir tout →</a>
            </div>
            <table className="tbl tbl--compact" style={{ borderRadius: 0 }}>
              <thead>
                <tr>
                  <th style={{borderRadius:0}}>Heure</th>
                  <th>Destinataire</th>
                  <th>Modèle</th>
                  <th>Statut</th>
                  <th>Lu</th>
                  <th style={{borderRadius:0}}>Agent</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { t: '14:48', n: 'Client J', m: 'Avis d\'arrivée', s: 'sent', read: true,  a: 'AM' },
                  { t: '14:32', n: 'Client K', m: 'Avis d\'arrivée', s: 'sent', read: true,  a: 'AM' },
                  { t: '14:18', n: 'Client L', m: 'Avis d\'arrivée', s: 'pending', read: false, a: 'ML' },
                  { t: '13:55', n: 'Client P', m: 'Avis d\'arrivée', s: 'sent', read: false, a: 'AM' },
                  { t: '13:21', n: 'Client M', m: 'Relance paiement', s: 'failed', read: false, a: 'ML' },
                ].map((l, i) => (
                  <tr key={i}>
                    <td className="mono" style={{ fontSize: 12, color: 'var(--ink-500)' }}>{l.t}</td>
                    <td>{l.n}</td>
                    <td style={{ fontSize: 12 }}>{l.m}</td>
                    <td>
                      {l.s === 'sent' && <span className="badge badge--info">✓✓ Envoyé</span>}
                      {l.s === 'pending' && <span className="badge badge--warn">◷ En cours</span>}
                      {l.s === 'failed' && <span className="badge badge--bad">✗ Échec</span>}
                    </td>
                    <td style={{ fontSize: 12, color: l.read ? 'var(--info-600)' : 'var(--ink-400)' }}>{l.read ? '✓✓ Lu' : '—'}</td>
                    <td><Avatar initials={l.a} color={l.a === 'AM' ? 1 : 2} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

window.MessagingScreen = MessagingScreen;
