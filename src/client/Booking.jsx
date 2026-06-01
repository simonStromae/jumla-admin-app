'use client';
import { useState } from 'react';
import I from '../components/Icons.jsx';

const ROUTES_DATA = [
  { id: 'dla-yul', label: 'Douala → Montréal (DLA → YUL)', base: 18, currency: 'CAD', transit: 14 },
  { id: 'yul-dla', label: 'Montréal → Douala (YUL → DLA)', base: 16, currency: 'CAD', transit: 14 },
];

const CATS = [
  { id: 'clothing',    label: 'Vêtements & textiles',    icon: '👗', surcharge: 0 },
  { id: 'food',        label: 'Épices & denrées sèches',  icon: '🌿', surcharge: 2 },
  { id: 'electronics', label: 'Électronique',             icon: '💻', surcharge: 5 },
  { id: 'cosmetics',   label: 'Cosmétiques',              icon: '💄', surcharge: 3 },
  { id: 'documents',   label: 'Documents',                icon: '📄', surcharge: 0 },
  { id: 'other',       label: 'Autre',                    icon: '📦', surcharge: 1 },
];

export default function BookingScreen({ onNav }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    route: 'dla-yul',
    senderName: '', senderPhone: '', senderEmail: '',
    recipName: '', recipPhone: '', recipCity: 'Montréal',
    delivery: 'pickup',
    recipAddress: '',
    weight: '',
    category: 'clothing',
    items: '',
    notes: '',
  });

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const route = ROUTES_DATA.find(r => r.id === form.route);
  const cat = CATS.find(c => c.id === form.category);
  const w = parseFloat(form.weight) || 0;
  const price = w * (route.base + (cat?.surcharge || 0));
  const delivery = form.delivery === 'home' ? 25 : 0;
  const total = price + delivery;

  const steps = [
    { label: 'Route',        icon: I.Plane },
    { label: 'Expéditeur',   icon: I.Users },
    { label: 'Destinataire', icon: I.Users },
    { label: 'Colis',        icon: I.Box },
    { label: 'Confirmation', icon: I.Check },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0A0E1A 0%, #0F172A 100%)', padding: '0 28px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', alignItems: 'center', height: 64, gap: 20 }}>
          <button onClick={() => onNav?.('/')} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <I.ArrowLeft style={{ width: 16, height: 16 }} /> Retour
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>Réserver un envoi</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>Zendit Cargo</div>
          </div>
          <div style={{ width: 80 }} />
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 28px' }}>
        {/* Step indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 36 }}>
          {steps.map((s, i) => {
            const Ic = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  opacity: done || active ? 1 : .4,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 999, display: 'grid', placeItems: 'center',
                    background: done ? 'var(--ok-500)' : active ? '#F5A524' : 'white',
                    border: '2px solid ' + (done ? 'var(--ok-500)' : active ? '#F5A524' : '#D1D5DB'),
                    color: done || active ? 'white' : '#9CA3AF',
                    fontSize: done ? 14 : 12,
                  }}>
                    {done ? '✓' : <Ic style={{ width: 14, height: 14 }} />}
                  </div>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: active ? '#D97706' : '#9CA3AF', whiteSpace: 'nowrap' }}>{s.label}</div>
                </div>
                {i < steps.length - 1 && <div style={{ width: 32, height: 2, background: i < step ? 'var(--ok-500)' : '#E5E7EB', marginBottom: 20 }} />}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 14, padding: '28px 32px', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
          {step === 0 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>Choisissez votre route</h2>
              <p style={{ fontSize: 13.5, color: '#6B7280', margin: '0 0 24px' }}>Sélectionnez le trajet et les dates de votre envoi.</p>
              <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
                {ROUTES_DATA.map(r => (
                  <label key={r.id} style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px',
                    border: '2px solid ' + (form.route === r.id ? '#F5A524' : '#E5E7EB'),
                    borderRadius: 12, cursor: 'pointer',
                    background: form.route === r.id ? '#FFFBEB' : 'white',
                  }}>
                    <input type="radio" name="route" value={r.id} checked={form.route === r.id} onChange={() => upd('route', r.id)} style={{ accentColor: '#F5A524' }} />
                    <I.Plane style={{ width: 22, height: 22, color: '#D97706' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0B1220' }}>{r.label}</div>
                      <div style={{ fontSize: 12.5, color: '#6B7280', marginTop: 3 }}>Transit ~{r.transit} jours · À partir de {r.base} {r.currency}/kg</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>Informations de l'expéditeur</h2>
              <p style={{ fontSize: 13.5, color: '#6B7280', margin: '0 0 24px' }}>La personne qui envoie le colis (côté départ).</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label className="label">Nom complet</label>
                  <input className="input" value={form.senderName} onChange={e => upd('senderName', e.target.value)} placeholder="Awa Nkemdirim" />
                </div>
                <div className="field">
                  <label className="label">Téléphone</label>
                  <input className="input" value={form.senderPhone} onChange={e => upd('senderPhone', e.target.value)} placeholder="+237 6** ** ** **" />
                </div>
                <div className="field">
                  <label className="label">Email</label>
                  <input className="input" type="email" value={form.senderEmail} onChange={e => upd('senderEmail', e.target.value)} placeholder="vous@email.com" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>Informations du destinataire</h2>
              <p style={{ fontSize: 13.5, color: '#6B7280', margin: '0 0 24px' }}>La personne qui recevra le colis.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label className="label">Nom complet</label>
                  <input className="input" value={form.recipName} onChange={e => upd('recipName', e.target.value)} placeholder="Jean Mbarga" />
                </div>
                <div className="field">
                  <label className="label">Téléphone</label>
                  <input className="input" value={form.recipPhone} onChange={e => upd('recipPhone', e.target.value)} placeholder="+1 514 *** ****" />
                </div>
                <div className="field">
                  <label className="label">Ville</label>
                  <select className="select" value={form.recipCity} onChange={e => upd('recipCity', e.target.value)}>
                    {['Montréal', 'Laval', 'Longueuil', 'Brossard', 'Gatineau', 'Québec', 'Toronto'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label className="label">Mode de livraison</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { id: 'pickup', label: 'Retrait entrepôt', sub: 'Lachine, QC — Gratuit', icon: I.Warehouse },
                      { id: 'home',   label: 'Livraison domicile', sub: 'Québec — +25 CAD', icon: I.Truck },
                    ].map(d => {
                      const Ic = d.icon;
                      return (
                        <label key={d.id} style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                          border: '2px solid ' + (form.delivery === d.id ? '#F5A524' : '#E5E7EB'),
                          borderRadius: 10, cursor: 'pointer',
                          background: form.delivery === d.id ? '#FFFBEB' : 'white',
                        }}>
                          <input type="radio" name="delivery" value={d.id} checked={form.delivery === d.id} onChange={() => upd('delivery', d.id)} style={{ accentColor: '#F5A524' }} />
                          <Ic style={{ width: 20, height: 20, color: '#D97706' }} />
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 700 }}>{d.label}</div>
                            <div style={{ fontSize: 12, color: '#6B7280' }}>{d.sub}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>Contenu du colis</h2>
              <p style={{ fontSize: 13.5, color: '#6B7280', margin: '0 0 24px' }}>Décrivez ce que vous envoyez pour une tarification correcte.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="field">
                  <label className="label">Poids estimé (kg)</label>
                  <input className="input" type="number" value={form.weight} onChange={e => upd('weight', e.target.value)} placeholder="14" min="0" step="0.5" />
                </div>
                <div className="field">
                  <label className="label">Catégorie principale</label>
                  <select className="select" value={form.category} onChange={e => upd('category', e.target.value)}>
                    {CATS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label className="label">Description du contenu</label>
                  <textarea className="textarea" rows={4} value={form.items} onChange={e => upd('items', e.target.value)} placeholder="Ex: 2 valises vêtements, 1 carton épices, 1 sachet cosmétiques..." />
                </div>
              </div>

              {/* Price preview */}
              {w > 0 && (
                <div style={{ marginTop: 20, padding: '16px 18px', background: '#FFFBEB', border: '1px solid #FEE3C7', borderRadius: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Estimation du prix</div>
                  {[
                    { l: `${w} kg × ${route.base + (cat?.surcharge || 0)} ${route.currency}/kg`, v: price.toFixed(0) + ' ' + route.currency },
                    form.delivery === 'home' && { l: 'Livraison domicile', v: '25 CAD' },
                  ].filter(Boolean).map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#374151', marginBottom: 4 }}>
                      <span>{r.l}</span><span style={{ fontWeight: 600 }}>{r.v}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: '#D97706', marginTop: 10, paddingTop: 10, borderTop: '1px solid #FEE3C7' }}>
                    <span>Total estimé</span><span>{total.toFixed(0)} {route.currency}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 72, height: 72, borderRadius: 999, background: 'var(--ok-50)', border: '2px solid var(--ok-100)', display: 'grid', placeItems: 'center', margin: '0 auto 20px', fontSize: 32 }}>✓</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', color: '#0B1220' }}>Réservation confirmée !</h2>
              <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 28, lineHeight: 1.65 }}>
                Votre demande a été enregistrée. Notre équipe vous contactera dans les 2h pour confirmer les détails et organiser la collecte.
              </p>
              <div style={{ padding: '16px 20px', background: '#F7F8FA', border: '1px solid #E5E7EB', borderRadius: 10, marginBottom: 24, textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12.5, color: '#6B7280' }}>Route</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>{route.label.split(' (')[0]}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12.5, color: '#6B7280' }}>Expéditeur</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>{form.senderName || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12.5, color: '#6B7280' }}>Destinataire</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>{form.recipName || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12.5, color: '#6B7280' }}>Estimation</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#D97706' }}>{total > 0 ? total.toFixed(0) + ' CAD' : '—'}</span>
                </div>
              </div>
              <button onClick={() => onNav?.('/')} style={{ background: '#F7F8FA', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                Retour à l'accueil
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        {step < 4 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <button onClick={() => step > 0 ? setStep(step - 1) : onNav?.('/')} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <I.ArrowLeft style={{ width: 14, height: 14 }} /> {step === 0 ? 'Retour' : 'Précédent'}
            </button>
            <button onClick={() => setStep(step + 1)} style={{ background: 'linear-gradient(135deg, #F5A524, #D97706)', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 700, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {step === 3 ? 'Confirmer la réservation' : 'Continuer'} <I.ArrowRight style={{ width: 14, height: 14 }} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
