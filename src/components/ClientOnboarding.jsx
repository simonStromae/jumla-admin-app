'use client';
import { useState, useEffect } from 'react';

const STEPS = [
  {
    icon: '👋',
    title: 'Bienvenue chez Jumla Shipping',
    desc: 'Votre espace personnel pour réserver, suivre et gérer tous vos envois de Douala vers Montréal.',
  },
  {
    icon: '📦',
    title: 'Mes colis',
    desc: 'Consultez tous vos colis en cours et passés. Cliquez sur un colis pour voir son statut détaillé, sa facture et les événements de suivi.',
    hint: 'Menu → Mes colis',
  },
  {
    icon: '🔍',
    title: 'Suivi de colis',
    desc: 'Entrez votre code de suivi à tout moment pour connaître la localisation exacte de votre colis, même sans vous connecter.',
    hint: 'Menu → Suivi',
  },
  {
    icon: '✈️',
    title: 'Réserver un envoi',
    desc: 'Pré-réservez votre prochain envoi en ligne : indiquez le contenu, le poids estimé et vos coordonnées. Notre équipe vous confirme les détails.',
    hint: 'Menu → Réserver un envoi',
  },
  {
    icon: '💬',
    title: 'Besoin d\'aide ?',
    desc: 'Notre équipe est disponible lundi-vendredi de 9h à 20h. Contactez-nous directement par WhatsApp pour toute question sur votre envoi.',
  },
];

export default function ClientOnboarding() {
  const [visible, setVisible] = useState(false);
  const [step, setStep]       = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('jumla_ob_client_v1') !== '1') {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  const finish = () => {
    localStorage.setItem('jumla_ob_client_v1', '1');
    setVisible(false);
  };

  const skip = () => setVisible(false);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1200,
      background: 'rgba(10, 20, 50, 0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(2px)',
      padding: '16px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: 20,
        width: '100%', maxWidth: 460,
        boxShadow: '0 24px 64px rgba(0,0,0,.22)',
        overflow: 'hidden',
      }}>
        {/* Progress bar */}
        <div style={{ height: 3, background: 'var(--border-soft)' }}>
          <div style={{
            height: '100%',
            width: `${((step + 1) / STEPS.length) * 100}%`,
            background: 'linear-gradient(90deg, #00B4D8, #1B4FD8)',
            transition: 'width .35s ease',
          }} />
        </div>

        <div style={{ padding: '28px 28px 24px' }}>
          {/* Step counter */}
          <div style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 16 }}>
            {step + 1} / {STEPS.length}
          </div>

          <div style={{ fontSize: 40, marginBottom: 12 }}>{current.icon}</div>

          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink-900)', marginBottom: 10, letterSpacing: '-.01em' }}>
            {current.title}
          </div>

          <div style={{ fontSize: 14, color: 'var(--ink-600)', lineHeight: 1.65, marginBottom: current.hint ? 14 : 24 }}>
            {current.desc}
          </div>

          {current.hint && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--brand-50)', border: '1px solid var(--brand-100)',
              borderRadius: 8, padding: '8px 12px', marginBottom: 24,
              fontSize: 12, color: 'var(--brand-700)', fontWeight: 600,
            }}>
              <span>→</span> {current.hint}
            </div>
          )}

          {/* Dots */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 20, justifyContent: 'center' }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 16 : 5, height: 5, borderRadius: 3,
                background: i === step ? 'var(--brand-500)' : i < step ? 'var(--brand-200)' : 'var(--border)',
                transition: 'all .3s ease',
              }} />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={skip} style={{
              flex: 0, padding: '11px 16px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'white',
              fontSize: 13, color: 'var(--ink-500)', cursor: 'pointer', fontWeight: 500,
            }}>
              Passer
            </button>
            <div style={{ flex: 1 }} />
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} style={{
                padding: '11px 16px', borderRadius: 10,
                border: '1px solid var(--border)', background: 'white',
                fontSize: 13, color: 'var(--ink-600)', cursor: 'pointer', fontWeight: 500,
              }}>
                ←
              </button>
            )}
            {isLast ? (
              <button onClick={finish} style={{
                padding: '11px 24px', borderRadius: 10,
                background: 'linear-gradient(90deg, #00B4D8, #1B4FD8)',
                border: 'none', color: 'white',
                fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
              }}>
                C'est parti ✓
              </button>
            ) : (
              <button onClick={() => setStep(s => s + 1)} style={{
                padding: '11px 24px', borderRadius: 10,
                background: 'linear-gradient(90deg, #00B4D8, #1B4FD8)',
                border: 'none', color: 'white',
                fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
              }}>
                Suivant →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
