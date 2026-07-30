'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import PhoneInput from './PhoneInput.jsx';

const DONE_KEY = 'ctsv1'; // same key as ClientTypeSelector

const STORAGE_KEY = 'jumla_phone_setup_v1';

export default function PhoneSetupModal() {
  const { data: session, status, update } = useSession();
  const [visible, setVisible] = useState(false);
  const [phone,   setPhone]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [done,    setDone]    = useState(false);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const role = session?.user?.role;
    if (role !== 'client') return;
    if (session?.user?.phone) return;                         // already has phone in session
    if (localStorage.getItem(STORAGE_KEY) === '1') return;   // dismissed before
    if (sessionStorage.getItem(DONE_KEY) === '1') return;    // clientType just selected — wait for next mount
    if (!session?.user?.clientType) return;                   // don't show until type is chosen
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, [status, session]);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  const handleSave = async () => {
    if (!phone) { dismiss(); return; }
    setSaving(true);
    await fetch('/api/me/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    }).catch(() => {});
    localStorage.setItem(STORAGE_KEY, '1');
    await update({ phone }).catch(() => {});
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
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #00B4D8, #1B4FD8)',
          padding: '24px 24px 20px', color: 'white',
        }}>
          <div style={{ fontSize: 34, marginBottom: 10 }}>📱</div>
          <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 6, letterSpacing: '-.01em' }}>
            Ajoutez votre numéro WhatsApp
          </div>
          <div style={{ fontSize: 13, opacity: .88, lineHeight: 1.55 }}>
            Recevez vos alertes de suivi, avis d'arrivée et factures directement sur WhatsApp.
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 24px' }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#047857' }}>Numéro enregistré !</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                Votre numéro WhatsApp
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
                  Plus tard
                </button>
                <button onClick={handleSave} disabled={saving} style={{
                  flex: 2, padding: '11px 16px', borderRadius: 10,
                  background: 'linear-gradient(90deg, #00B4D8, #1B4FD8)',
                  border: 'none', color: 'white',
                  fontSize: 13.5, fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
                  opacity: saving ? .8 : 1,
                }}>
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
