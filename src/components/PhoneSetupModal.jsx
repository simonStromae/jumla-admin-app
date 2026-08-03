'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import PhoneInput from './PhoneInput.jsx';

const PHONE_KEY    = 'jumla_phone_setup_v1';
const LOCATION_KEY = 'jumla_location_setup_v1';
const CTS_KEY      = 'ctsv1';

const CITIES = [
  'Montréal', 'Laval', 'Longueuil', 'Brossard', 'Boucherville',
  'Repentigny', 'Westmount', 'LaSalle', 'Verdun', 'Dollard-des-Ormeaux',
  'Pointe-Claire', 'Dorval', 'Côte-Saint-Luc', 'Terrebonne', 'Saint-Lambert',
];

export default function PhoneSetupModal() {
  const { data: session, status, update } = useSession();
  const [step, setStep]       = useState(0);
  const [visible, setVisible] = useState(false);
  const [phone, setPhone]     = useState('');
  const [city, setCity]       = useState('');
  const [delivery, setDelivery] = useState('pickup');
  const [saving, setSaving]   = useState(false);
  const [done, setDone]       = useState(false);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (session?.user?.role !== 'client') return;
    if (!session?.user?.clientTypeChosen) return;
    if (sessionStorage.getItem(CTS_KEY) === '1') return;

    const phoneDismissed    = localStorage.getItem(PHONE_KEY) === '1';
    const locationDismissed = localStorage.getItem(LOCATION_KEY) === '1';
    const hasPhone = !!session?.user?.phone;
    const hasCity  = !!session?.user?.city;

    const needsPhone    = !hasPhone && !phoneDismissed;
    const needsLocation = !hasCity  && !locationDismissed;

    if (!needsPhone && !needsLocation) return;

    setStep(needsPhone ? 0 : 1);
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, [status, session]);

  if (!visible) return null;

  const totalSteps = (() => {
    const phoneDismissed    = localStorage.getItem(PHONE_KEY) === '1';
    const locationDismissed = localStorage.getItem(LOCATION_KEY) === '1';
    const hasPhone = !!session?.user?.phone;
    const hasCity  = !!session?.user?.city;
    const needsPhone    = !hasPhone && !phoneDismissed;
    const needsLocation = !hasCity  && !locationDismissed;
    return needsPhone && needsLocation ? 2 : 1;
  })();

  const dismiss = () => {
    if (step === 0) localStorage.setItem(PHONE_KEY, '1');
    localStorage.setItem(LOCATION_KEY, '1');
    setVisible(false);
  };

  const handleSavePhone = async () => {
    setSaving(true);
    if (phone) {
      await fetch('/api/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      }).catch(() => {});
      await update({ phone }).catch(() => {});
    } else {
      localStorage.setItem(PHONE_KEY, '1');
    }
    setSaving(false);
    if (totalSteps === 2) {
      setStep(1);
    } else {
      setDone(true);
      setTimeout(() => setVisible(false), 900);
    }
  };

  const handleSaveLocation = async () => {
    setSaving(true);
    if (city || delivery) {
      const body = {};
      if (city)     body.city = city;
      if (delivery) body.defaultDelivery = delivery;
      await fetch('/api/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).catch(() => {});
      await update({ city: city || undefined, defaultDelivery: delivery }).catch(() => {});
    }
    localStorage.setItem(LOCATION_KEY, '1');
    setSaving(false);
    setDone(true);
    setTimeout(() => setVisible(false), 900);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      background: 'rgba(10, 20, 50, 0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, backdropFilter: 'blur(2px)',
    }}>
      <div style={{
        background: 'white', borderRadius: 20, width: '100%', maxWidth: 430,
        boxShadow: '0 24px 64px rgba(0,0,0,.22)', overflow: 'hidden',
      }}>

        {/* Progress indicator */}
        {totalSteps > 1 && (
          <div style={{ display: 'flex', gap: 6, padding: '14px 24px 0', justifyContent: 'center' }}>
            {[0, 1].map(i => (
              <div key={i} style={{
                width: i === step ? 24 : 8, height: 5, borderRadius: 3,
                background: i <= step ? '#1B4FD8' : '#e5e7eb',
                transition: 'all .3s',
              }} />
            ))}
          </div>
        )}

        {/* Header */}
        <div style={{ padding: totalSteps > 1 ? '16px 24px 14px' : '24px 24px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 34, marginBottom: 10 }}>
            {step === 0 ? '📱' : '📍'}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.01em', marginBottom: 6 }}>
            {step === 0 ? 'Votre numéro WhatsApp' : 'Votre localisation par défaut'}
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.55 }}>
            {step === 0
              ? 'Recevez vos alertes de suivi et factures directement sur WhatsApp.'
              : 'On pré-remplira votre ville et mode de livraison à chaque réservation.'}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '0 24px 24px' }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#047857' }}>Tout est enregistré !</div>
            </div>

          ) : step === 0 ? (
            <>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                Numéro WhatsApp
              </div>
              <PhoneInput value={phone} onChange={setPhone} />
              <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 6, lineHeight: 1.4 }}>
                Utilisé uniquement pour les notifications de vos colis. Jamais partagé.
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button onClick={dismiss} style={{
                  flex: 1, padding: '11px 16px', borderRadius: 10,
                  border: '1px solid #E5E7EB', background: 'white',
                  fontSize: 13, color: '#6B7280', cursor: 'pointer', fontWeight: 500,
                }}>
                  Ignorer
                </button>
                <button onClick={handleSavePhone} disabled={saving} style={{
                  flex: 2, padding: '11px 16px', borderRadius: 10,
                  background: 'linear-gradient(90deg, #00B4D8, #1B4FD8)',
                  border: 'none', color: 'white',
                  fontSize: 13.5, fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
                  opacity: saving ? .8 : 1,
                }}>
                  {saving ? 'Enregistrement…' : phone ? (totalSteps > 1 ? 'Suivant →' : 'Enregistrer') : 'Passer cette étape'}
                </button>
              </div>
            </>

          ) : (
            <>
              {/* City */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                  Votre ville (zone de livraison)
                </div>
                <select value={city} onChange={e => setCity(e.target.value)} style={{
                  width: '100%', padding: '10px 12px',
                  border: '1.5px solid #e5e7eb', borderRadius: 10,
                  fontFamily: 'inherit', fontSize: 14,
                  color: city ? '#111827' : '#9ca3af',
                  background: 'white', outline: 'none', cursor: 'pointer',
                }}>
                  <option value="">Sélectionnez votre ville…</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="Hors région">Hors région / Autre ville</option>
                </select>
              </div>

              {/* Delivery preference */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                  Mode de livraison préféré
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { key: 'pickup', icon: '📦', label: 'Je dépose', sub: 'Gratuit' },
                    { key: 'home',   icon: '🚚', label: 'À domicile', sub: 'Frais variable' },
                  ].map(opt => (
                    <button key={opt.key} onClick={() => setDelivery(opt.key)} style={{
                      flex: 1, padding: '12px 8px', borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${delivery === opt.key ? '#1B4FD8' : '#e5e7eb'}`,
                      background: delivery === opt.key ? '#eff6ff' : 'white',
                      textAlign: 'center', fontFamily: 'inherit', transition: 'all .15s',
                    }}>
                      <div style={{ fontSize: 22, marginBottom: 4 }}>{opt.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{opt.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={dismiss} style={{
                  flex: 1, padding: '11px 16px', borderRadius: 10,
                  border: '1px solid #E5E7EB', background: 'white',
                  fontSize: 13, color: '#6B7280', cursor: 'pointer', fontWeight: 500,
                }}>
                  Ignorer
                </button>
                <button onClick={handleSaveLocation} disabled={saving} style={{
                  flex: 2, padding: '11px 16px', borderRadius: 10,
                  background: 'linear-gradient(90deg, #00B4D8, #1B4FD8)',
                  border: 'none', color: 'white',
                  fontSize: 13.5, fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
                  opacity: saving ? .8 : 1,
                }}>
                  {saving ? 'Enregistrement…' : 'Terminer ✓'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
