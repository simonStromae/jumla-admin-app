'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

const BUSINESS_TYPES = ['commercial', 'partenaire'];

const TYPES = [
  {
    key: 'standard',
    icon: '📦',
    label: 'Envois personnels',
    desc: 'J\'envoie des colis pour moi-même ou mes proches, de façon ponctuelle ou régulière.',
    features: ['Suivi individuel par colis', 'Paiement à la réservation', 'Notifications par colis'],
    color: 'var(--brand-500)',
    bg: 'var(--brand-50)',
    border: 'var(--brand-200)',
  },
  {
    key: 'commercial',
    icon: '🏢',
    label: 'Volumes commerciaux',
    desc: 'Mon entreprise expédie régulièrement de gros volumes à des fins commerciales.',
    features: ['Vue par cargaison', 'Facture unique par cargaison', 'Résumé groupé des notifications'],
    color: 'var(--ok-600)',
    bg: 'var(--ok-50)',
    border: 'var(--ok-200)',
  },
  {
    key: 'partenaire',
    icon: '🤝',
    label: 'Partenaire / Groupeur',
    desc: 'Je collecte et regroupe les colis de plusieurs clients pour les expédier ensemble.',
    features: ['Gestion multi-colis en lot', 'Relevé comptable par cargaison', 'Une seule facture pour tous vos colis'],
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
  },
];

const DONE_KEY = 'ctsv1';

export default function ClientTypeSelector() {
  const { data: session, status, update } = useSession();
  const [selected, setSelected]   = useState(null);
  const [step, setStep]           = useState(1); // 1 = type choice, 2 = company info
  const [companyName, setCompanyName]     = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [saving, setSaving]       = useState(false);
  const [done, setDone]           = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!sessionStorage.getItem(DONE_KEY);
  });

  const clientTypeChosen = session?.user?.clientTypeChosen;

  // Once session confirms the choice, clear the temporary flag
  if (typeof window !== 'undefined' && clientTypeChosen) sessionStorage.removeItem(DONE_KEY);

  // Don't render while session is loading, or once type has been explicitly chosen
  if (status !== 'authenticated') return null;
  if (clientTypeChosen || done) return null;

  const isBusiness = BUSINESS_TYPES.includes(selected);

  const handleStep1 = () => {
    if (!selected) return;
    if (isBusiness) {
      setStep(2);
    } else {
      handleSave();
    }
  };

  const handleSave = async (extraData = {}) => {
    setSaving(true);
    try {
      await fetch('/api/me/client-type', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ clientType: selected, ...extraData }),
      });
      sessionStorage.setItem(DONE_KEY, '1');
      setDone(true);
      await update({ clientType: selected, clientTypeChosen: true });
    } catch {
      sessionStorage.removeItem(DONE_KEY);
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!selected || saving) return;
    await handleSave(
      isBusiness ? { companyName: companyName || null, billingAddress: billingAddress || null } : {}
    );
  };

  const type = TYPES.find(t => t.key === selected);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1300,
      background: 'rgba(10, 20, 50, 0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(3px)',
      padding: '16px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: 24,
        width: '100%', maxWidth: 520,
        boxShadow: '0 32px 80px rgba(0,0,0,.25)',
        overflow: 'hidden',
      }}>
        {/* Header gradient */}
        <div style={{
          padding: '28px 28px 20px',
          background: 'linear-gradient(135deg, #00B4D8 0%, #1B4FD8 100%)',
          color: 'white',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', opacity: .8, marginBottom: 8 }}>
            Personnalisation
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.01em', marginBottom: 6 }}>
            Comment utilisez-vous Jumlas ?
          </div>
          <div style={{ fontSize: 13.5, opacity: .85, lineHeight: 1.5 }}>
            Sélectionnez votre profil pour une expérience adaptée à vos besoins.
          </div>
        </div>

        <div style={{ padding: '20px 24px 24px' }}>
          {step === 1 ? (
            <>
              {/* Type cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {TYPES.map(t => (
                  <button key={t.key} onClick={() => setSelected(t.key)} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                    padding: '14px 16px', borderRadius: 14,
                    border: `2px solid ${selected === t.key ? t.color : 'var(--border)'}`,
                    background: selected === t.key ? t.bg : 'white',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all .18s ease', outline: 'none',
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                      border: `2px solid ${selected === t.key ? t.color : 'var(--border)'}`,
                      background: selected === t.key ? t.color : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all .18s',
                    }}>
                      {selected === t.key && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 20 }}>{t.icon}</span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{t.label}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.5, marginBottom: selected === t.key ? 10 : 0 }}>
                        {t.desc}
                      </div>
                      {selected === t.key && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {t.features.map((f, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: t.color, fontWeight: 600 }}>
                              <span>✓</span> {f}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={handleStep1}
                disabled={!selected}
                style={{
                  width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                  background: selected ? type?.color : 'var(--ink-100)',
                  color: selected ? 'white' : 'var(--ink-400)',
                  fontSize: 15, fontWeight: 700, cursor: selected ? 'pointer' : 'not-allowed',
                  transition: 'all .2s',
                }}
              >
                {selected
                  ? isBusiness ? `Continuer en tant que ${type?.label} →` : `Commencer en tant que ${type?.label} →`
                  : 'Sélectionnez votre profil'}
              </button>
            </>
          ) : (
            <>
              {/* Step 2 — company info */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 18 }}>{type?.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{type?.label}</span>
                </div>
                <div style={{ fontSize: 12.5, color: '#6b7280' }}>
                  Quelques informations pour personnaliser vos factures et votre espace.
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', display: 'block', marginBottom: 5 }}>
                    Nom de la société / raison sociale <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optionnel)</span>
                  </label>
                  <input
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="Ex : SARL Logistique Douala"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', display: 'block', marginBottom: 5 }}>
                    Adresse de facturation <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optionnel)</span>
                  </label>
                  <textarea
                    value={billingAddress}
                    onChange={e => setBillingAddress(e.target.value)}
                    placeholder="Ex : BP 1234, Douala, Cameroun"
                    rows={2}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, resize: 'none', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setStep(1)}
                  style={{ flex: '0 0 auto', padding: '14px 18px', borderRadius: 12, border: '1px solid var(--border)', background: 'white', color: 'var(--ink-600)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  ← Retour
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={saving}
                  style={{
                    flex: 1, padding: '14px', borderRadius: 12, border: 'none',
                    background: type?.color ?? 'var(--brand-600)', color: 'white',
                    fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                    transition: 'all .2s',
                  }}
                >
                  {saving ? 'Enregistrement…' : 'Terminer la configuration →'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
