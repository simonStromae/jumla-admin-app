import { useState } from 'react';
import I from '../components/Icons.jsx';
import { Modal, Avatar } from '../components/Shell.jsx';

export default function ClientFormModal({ mode = 'create', client, onClose, onSave }) {
  const isEdit = mode === 'edit';
  const [data, setData] = useState(() => ({
    name:            client?.name  || '',
    code:            client?.code  || 'CL-' + String(700 + Math.floor(Math.random() * 99)).padStart(4, '0'),
    color:           client?.color || ((Math.floor(Math.random() * 8)) + 1),
    phone:           client?.phone !== '—' ? (client?.phone || '') : '',
    whatsapp:        client?.whatsapp || (client?.phone !== '—' ? client?.phone : '') || '',
    city:            client?.city  !== '—' ? (client?.city  || 'Douala') : 'Douala',
    email:           client?.email || '',
    loyal:           client?.loyal || false,
    notes:           client?.notes || '',
    deliveryName:    client?.deliveryName    || '',
    deliveryAddress: client?.deliveryAddress || '',
    deliveryPhone:   client?.deliveryPhone   || '',
  }));
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');

  const upd = (k, v) => setData(d => ({ ...d, [k]: v }));

  const handleSave = async (andNew = false) => {
    if (!data.name.trim() || !data.email.trim()) {
      setSaveErr('Nom et email requis');
      return;
    }
    setSaving(true);
    setSaveErr('');
    try {
      const url    = isEdit ? `/api/clients/${client.id}` : '/api/clients';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:            data.name.trim(),
          email:           data.email.trim(),
          phone:           data.phone.trim()           || null,
          city:            data.city                   || null,
          whatsapp:        data.whatsapp.trim()        || null,
          deliveryName:    data.deliveryName.trim()    || null,
          deliveryAddress: data.deliveryAddress.trim() || null,
          deliveryPhone:   data.deliveryPhone.trim()   || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setSaveErr(json.error || 'Erreur'); setSaving(false); return; }
      onSave(andNew);
    } catch {
      setSaveErr('Erreur réseau');
      setSaving(false);
    }
  };

  const COLORS = ['', '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6', '#EC4899', '#14B8A6'];

  const CITIES = ['Douala', 'Yaoundé', 'Lagos', 'Bafoussam', 'Abidjan'];

  const cityCountry = (city) => {
    if (city === 'Lagos') return city + ', Nigeria';
    if (city === 'Abidjan') return city + ", Côte d'Ivoire";
    return city + ', Cameroun';
  };

  return (
    <Modal width={820} onClose={onClose}
      title={
        <span>{isEdit ? "Modifier l'expéditeur" : 'Nouvel expéditeur'}
          <span style={{ color: 'var(--ink-400)', fontWeight: 400, fontSize: '.85em', marginLeft: 6 }}>
            / {isEdit ? 'Edit sender' : 'New sender'}
          </span>
        </span>
      }
      sub={isEdit
        ? <><span className="mono">{data.code}</span> · {data.name}</>
        : "Expéditeur enregistré dans le système — basé en pays d'origine"}
      footer={
        <>
          {isEdit && (
            <button className="btn btn--ghost" style={{ color: 'var(--bad-600)' }}
              onClick={async () => {
                if (!confirm('Supprimer ce client ?')) return;
                await fetch(`/api/clients/${client.id}`, { method: 'DELETE' });
                onSave();
              }}>
              <I.Trash />Supprimer
            </button>
          )}
          <div style={{ flex: 1 }} />
          {saveErr && <span style={{ fontSize: 12, color: 'var(--bad-600)' }}>{saveErr}</span>}
          <button className="btn btn--ghost" onClick={onClose}>Annuler</button>
          {!isEdit && (
            <button className="btn btn--soft" onClick={() => handleSave(true)} disabled={saving}>
              Enregistrer &amp; nouveau
            </button>
          )}
          <button className="btn btn--brand" onClick={() => handleSave(false)} disabled={saving}>
            <I.Check />{saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : "Créer l'expéditeur"}
          </button>
        </>
      }>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 22 }}>
        <div>
          {/* Identity block */}
          <div className="section-title">Identité</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, padding: 14, background: 'var(--bg-soft)', borderRadius: 10 }}>
            <Avatar
              initials={data.name ? data.name.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase() : '••'}
              color={data.color}
              size="xl"
            />
            <div style={{ flex: 1 }}>
              <div className="field-row field-row--2" style={{ marginBottom: 0 }}>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="label">Nom complet</label>
                  <input className="input" value={data.name} onChange={e => upd('name', e.target.value)} placeholder="Ex: Client M" />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="label">Code expéditeur <span className="opt">/ Auto</span></label>
                  <input className="input mono" value={data.code} onChange={e => upd('code', e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 5, marginTop: 10 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(c => (
                  <button key={c} onClick={() => upd('color', c)} style={{
                    width: 20, height: 20, borderRadius: 999,
                    background: COLORS[c],
                    border: data.color === c ? '2px solid var(--ink-900)' : '2px solid white',
                    boxShadow: data.color === c ? '0 0 0 1.5px white' : 'none',
                    cursor: 'pointer',
                  }} />
                ))}
              </div>
            </div>
          </div>

          {/* Phone block */}
          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>
              <I.Phone style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Contact
            </div>
            <div className="field-row field-row--2">
              <div className="field">
                <label className="label">Téléphone Douala <span className="opt">/ Sender phone</span></label>
                <input className="input mono" value={data.phone} onChange={e => upd('phone', e.target.value)} placeholder="+237 6** ** ** **" />
              </div>
              <div className="field">
                <label className="label">WhatsApp <span className="opt">/ Si différent</span></label>
                <input className="input mono" value={data.whatsapp} onChange={e => upd('whatsapp', e.target.value)} placeholder="+237 6** ** ** **" />
              </div>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Email <span className="opt">/ Optionnel</span></label>
              <input className="input" type="email" value={data.email} onChange={e => upd('email', e.target.value)} placeholder="client@example.com" />
            </div>
          </div>

          {/* Location block */}
          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>
              <I.Pin style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Localisation (origine)
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Ville d'origine</label>
              <select className="select" value={data.city} onChange={e => upd('city', e.target.value)}>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Delivery block */}
          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>
              <I.Truck style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Livraison (destination)
              <span style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 400, marginLeft: 6 }}>/ Delivery info</span>
            </div>
            <div className="field">
              <label className="label">Nom du destinataire <span className="opt">/ Si différent de l'expéditeur</span></label>
              <input className="input" value={data.deliveryName} onChange={e => upd('deliveryName', e.target.value)} placeholder="Nom complet" />
            </div>
            <div className="field">
              <label className="label">Adresse de livraison</label>
              <input className="input" value={data.deliveryAddress} onChange={e => upd('deliveryAddress', e.target.value)} placeholder="1234 Rue Saint-Denis, Montréal H2X 3K2" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Téléphone de livraison <span className="opt">/ À Montréal</span></label>
              <input className="input mono" value={data.deliveryPhone} onChange={e => upd('deliveryPhone', e.target.value)} placeholder="+1 514 *** ****" />
            </div>
          </div>

          {/* Notes + Loyal */}
          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>
              <I.Tag style={{ width: 14, height: 14, color: 'var(--brand-600)' }} /> Préférences
            </div>
            <div className="field">
              <label className="label">Expéditeur fidèle</label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px',
                background: data.loyal ? 'var(--brand-50)' : 'var(--bg-soft)',
                border: '1px solid ' + (data.loyal ? 'var(--brand-200)' : 'var(--border)'),
                borderRadius: 7,
              }}>
                <I.Star style={{ width: 14, height: 14, color: data.loyal ? 'var(--brand-500)' : 'var(--ink-300)' }} />
                <span style={{ flex: 1, fontSize: 13, color: data.loyal ? 'var(--brand-700)' : 'var(--ink-500)', fontWeight: 600 }}>
                  {data.loyal ? 'Marqué comme fidèle' : 'Non marqué'}
                </span>
                <button className="btn btn--ghost btn--xs" onClick={() => upd('loyal', !data.loyal)}>
                  {data.loyal ? 'Retirer' : 'Marquer'}
                </button>
              </div>
              <div className="hint">Notifié en priorité à l'ouverture d'une cargaison.</div>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Notes internes <span className="opt">/ Visible aux agents uniquement</span></label>
              <textarea className="textarea" rows={3} value={data.notes} onChange={e => upd('notes', e.target.value)} placeholder="Particularités, instructions, historique..." />
            </div>
          </div>
        </div>

        {/* Right: live preview */}
        <div>
          <div style={{ position: 'sticky', top: 0 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', background: 'var(--bg-soft)', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 700 }}>Aperçu fiche</div>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <Avatar
                    initials={data.name ? data.name.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase() : '••'}
                    color={data.color}
                    size="lg"
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>
                      {data.name || 'Sans nom'}
                      {data.loyal && <I.Star style={{ width: 12, height: 12, color: 'var(--brand-500)', marginLeft: 4, verticalAlign: -1 }} />}
                    </div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--ink-400)' }}>{data.code}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--ink-600)' }}>
                  {data.phone && <div className="mono">📱 {data.phone}</div>}
                  {data.email && <div>✉ {data.email}</div>}
                  {data.city && <div>📍 {cityCountry(data.city)}</div>}
                  {data.address && <div style={{ fontSize: 11 }}>{data.address}</div>}
                </div>
              </div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-soft)', background: 'var(--bg-soft)', fontSize: 11.5, color: 'var(--ink-500)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <I.Info style={{ width: 12, height: 12, color: 'var(--ink-400)' }} />
                {isEdit
                  ? 'Modifications enregistrées et propagées aux colis liés'
                  : "L'expéditeur sera disponible pour les nouveaux colis"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
