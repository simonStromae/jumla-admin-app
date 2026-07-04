'use client';
import { useState, useEffect } from 'react';

const STEPS = [
  {
    icon: '🎉',
    title: 'Bienvenue sur Jumla Admin',
    desc: 'Cette interface vous permet de gérer toutes vos opérations de fret international : cargaisons, clients, colis et paiements.',
  },
  {
    icon: '✈️',
    title: 'Cargaisons',
    desc: 'Une cargaison = un vol. Créez-la avec sa route et ses dates, ajoutez les colis des clients, puis faites progresser son statut jusqu\'à la livraison.',
    hint: 'Menu → Cargaisons → Nouvelle cargaison',
  },
  {
    icon: '👥',
    title: 'Clients expéditeurs',
    desc: 'Consultez l\'historique de chaque client, leur poids envoyé, leurs paiements, et contactez-les directement par WhatsApp depuis leur fiche.',
    hint: 'Menu → Expéditeurs',
  },
  {
    icon: '📦',
    title: 'Colis & paiements',
    desc: 'Chaque colis est rattaché à une cargaison et un client. Vous pouvez enregistrer les paiements, générer des factures et créer des bordereaux.',
    hint: 'Menu → Colis ou depuis le détail d\'une cargaison',
  },
  {
    icon: '📊',
    title: 'Analyses',
    desc: 'Suivez vos revenus, volumes, compagnies aériennes les plus utilisées et vos meilleurs mois. Les données se mettent à jour en temps réel.',
    hint: 'Menu → Analyses',
  },
  {
    icon: '⚙️',
    title: 'Paramètres & personnalisation',
    desc: 'Configurez vos routes, tarifs, logo, modèles WhatsApp et la page d\'accueil publique. Tout est modifiable sans toucher au code.',
    hint: 'Menu → Paramètres (section Administration)',
  },
];

export default function AdminOnboarding() {
  const [visible, setVisible] = useState(false);
  const [step, setStep]       = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('jumla_ob_admin_v1') !== '1') {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  const finish = () => {
    localStorage.setItem('jumla_ob_admin_v1', '1');
    setVisible(false);
  };

  const skip = () => setVisible(false);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1200,
      background: 'rgba(10, 20, 50, 0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(2px)',
    }}>
      <div style={{
        background: 'white', borderRadius: 18, width: 480, maxWidth: '92vw',
        boxShadow: '0 32px 80px rgba(0,0,0,.22)',
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

        <div style={{ padding: '32px 32px 24px' }}>
          {/* Step counter */}
          <div style={{ fontSize: 11.5, color: 'var(--ink-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 20 }}>
            Étape {step + 1} / {STEPS.length}
          </div>

          {/* Icon */}
          <div style={{ fontSize: 48, marginBottom: 16, lineHeight: 1 }}>{current.icon}</div>

          {/* Title */}
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-900)', marginBottom: 12, letterSpacing: '-.01em' }}>
            {current.title}
          </div>

          {/* Description */}
          <div style={{ fontSize: 14.5, color: 'var(--ink-600)', lineHeight: 1.65, marginBottom: current.hint ? 16 : 28 }}>
            {current.desc}
          </div>

          {/* Hint */}
          {current.hint && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--brand-50)', border: '1px solid var(--brand-100)',
              borderRadius: 8, padding: '9px 14px', marginBottom: 28,
              fontSize: 12.5, color: 'var(--brand-700)', fontWeight: 600,
            }}>
              <span>→</span> {current.hint}
            </div>
          )}

          {/* Dot indicators */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 24, justifyContent: 'center' }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 18 : 6, height: 6, borderRadius: 3,
                background: i === step ? 'var(--brand-500)' : i < step ? 'var(--brand-200)' : 'var(--border)',
                transition: 'all .3s ease',
              }} />
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={skip}
              style={{
                flex: 0, padding: '10px 16px', borderRadius: 9,
                border: '1px solid var(--border)', background: 'white',
                fontSize: 13, color: 'var(--ink-500)', cursor: 'pointer', fontWeight: 500,
              }}>
              Passer
            </button>
            <div style={{ flex: 1 }} />
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                style={{
                  padding: '10px 16px', borderRadius: 9,
                  border: '1px solid var(--border)', background: 'white',
                  fontSize: 13, color: 'var(--ink-600)', cursor: 'pointer', fontWeight: 500,
                }}>
                ← Précédent
              </button>
            )}
            {isLast ? (
              <button
                onClick={finish}
                style={{
                  padding: '10px 24px', borderRadius: 9,
                  background: 'linear-gradient(90deg, #00B4D8, #1B4FD8)',
                  border: 'none', color: 'white',
                  fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
                }}>
                C'est compris ✓
              </button>
            ) : (
              <button
                onClick={() => setStep(s => s + 1)}
                style={{
                  padding: '10px 24px', borderRadius: 9,
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
