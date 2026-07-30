'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

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
  const { data: session, update } = useSession();
  const [selected, setSelected]   = useState(null);
  const [saving, setSaving]       = useState(false);
  const [done, setDone]           = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!sessionStorage.getItem(DONE_KEY);
  });

  const clientType = session?.user?.clientType;

  // Once session carries the type, clear the temporary flag
  useState(() => { if (clientType) sessionStorage.removeItem(DONE_KEY); });

  if (clientType || done) return null;

  const handleConfirm = async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      await fetch('/api/me/client-type', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ clientType: selected }),
      });
      // Mark done BEFORE calling update() — update() can trigger a re-render
      // that would reset done=false before the state update lands
      sessionStorage.setItem(DONE_KEY, '1');
      setDone(true);
      await update({ clientType: selected });
    } catch {
      sessionStorage.removeItem(DONE_KEY);
      setSaving(false);
    }
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
          {/* Type cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {TYPES.map(t => (
              <button key={t.key} onClick={() => setSelected(t.key)} style={{
                display: 'flex', alignItems: 'flex-start', gap: 14,
                padding: '14px 16px',
                borderRadius: 14,
                border: `2px solid ${selected === t.key ? t.color : 'var(--border)'}`,
                background: selected === t.key ? t.bg : 'white',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all .18s ease',
                outline: 'none',
              }}>
                {/* Selection indicator */}
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                  border: `2px solid ${selected === t.key ? t.color : 'var(--border)'}`,
                  background: selected === t.key ? t.color : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .18s',
                }}>
                  {selected === t.key && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />
                  )}
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
            onClick={handleConfirm}
            disabled={!selected || saving}
            style={{
              width: '100%', padding: '14px',
              borderRadius: 12, border: 'none',
              background: selected
                ? `linear-gradient(90deg, ${type?.color}, ${type?.color}cc)`
                : 'var(--ink-100)',
              color: selected ? 'white' : 'var(--ink-400)',
              fontSize: 15, fontWeight: 700, cursor: selected ? 'pointer' : 'not-allowed',
              transition: 'all .2s',
            }}
          >
            {saving ? 'Enregistrement…' : selected ? `Continuer en tant que ${type?.label} →` : 'Sélectionnez votre profil'}
          </button>
        </div>
      </div>
    </div>
  );
}
