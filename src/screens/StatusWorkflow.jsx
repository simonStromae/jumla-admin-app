import { useState } from 'react';
import { STATUS_STEPS } from '../data.js';
import I from '../components/Icons.jsx';
import { Modal } from '../components/Shell.jsx';

const TRANSITIONS = {
  'draft → open': {
    title: 'Ouvrir la cargaison',
    description: 'La cargaison devient visible à votre équipe et accepte les colis.',
    effects: [
      { kind: 'enable',  what: 'Création de colis activée pour tous les agents autorisés' },
      { kind: 'notify',  what: "Annonce envoyée aux clients fidèles (si l'automatisation est active)" },
      { kind: 'system',  what: 'Code cargaison verrouillé · Plus modifiable' },
    ],
    requires: [],
    cta: 'Ouvrir la cargaison', tone: 'brand',
  },
  'open → locked': {
    title: 'Verrouiller la cargaison',
    description: "Plus aucun colis ne pourra être ajouté. La cargaison est prête à partir.",
    effects: [
      { kind: 'disable', what: 'Ajout de nouveaux colis désactivé' },
      { kind: 'notify',  what: 'Confirmation d\'expédition envoyée à chaque expéditeur via WhatsApp' },
      { kind: 'system',  what: 'Manifeste de chargement généré (PDF)' },
      { kind: 'auto',    what: 'Génération automatique des bordereaux manquants' },
    ],
    requires: [
      { ok: true,  label: 'Capacité réservée atteinte à 84%' },
      { ok: false, label: '2 colis sans bordereau', action: 'Générer maintenant' },
    ],
    cta: 'Verrouiller', tone: 'brand',
  },
  'locked → in-transit': {
    title: 'Marquer en transit',
    description: "L'expédition est physiquement partie. Édition limitée au strict minimum.",
    effects: [
      { kind: 'disable', what: 'Modification des poids et contenus bloquée' },
      { kind: 'enable',  what: 'Suivi de transit activé · ETA visible côté client' },
      { kind: 'notify',  what: '"Cargaison partie de Douala" envoyé aux destinataires' },
      { kind: 'system',  what: 'Horodatage de départ enregistré' },
    ],
    requires: [{ ok: true, label: "Manifeste signé par l'agent origine" }],
    cta: 'Confirmer le départ', tone: 'info', needsDate: true,
  },
  'in-transit → arrived': {
    title: "Confirmer l'arrivée",
    description: "La cargaison est physiquement arrivée à destination. Les agents peuvent commencer le pointage.",
    effects: [
      { kind: 'enable',  what: "Vérification des bordereaux activée pour l'équipe destination" },
      { kind: 'enable',  what: 'Statuts de paiement modifiables' },
      { kind: 'notify',  what: '"Votre colis est arrivé" envoyé aux 64 destinataires' },
      { kind: 'notify',  what: "Adresse de l'entrepôt incluse dans le message" },
      { kind: 'system',  what: '"Délai post-arrivée" démarré' },
    ],
    requires: [{ ok: true, label: "Agent destination présent à l'entrepôt" }],
    cta: 'Marquer comme arrivée', tone: 'info', needsDate: true,
  },
  'arrived → closed': {
    title: 'Clôturer la cargaison',
    description: "Bilan financier final, archivage et stats.",
    effects: [
      { kind: 'disable', what: 'Lecture seule sur toute la cargaison' },
      { kind: 'system',  what: 'Bilan P&L généré et archivé (PDF)' },
      { kind: 'auto',    what: 'Mise à jour des stats annuelles & analyses' },
      { kind: 'auto',    what: 'Reclassement automatique des impayés' },
    ],
    requires: [
      { ok: true,  label: 'Tous les bordereaux validés (64/64)' },
      { ok: false, label: '12 impayés à régler ou requalifier', action: 'Voir les impayés' },
    ],
    cta: 'Clôturer définitivement', tone: 'primary',
  },
};

export function StatusStepperMini({ current, onClick }) {
  const idx = STATUS_STEPS.findIndex(s => s.id === current);
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 0, background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 999, padding: '3px 4px' }}>
      {STATUS_STEPS.map((s, i) => {
        const passed = i < idx;
        const active = i === idx;
        const Ic = I[s.icon];
        return (
          <span key={s.id} style={{ display: 'inline-flex', alignItems: 'center' }}>
            <button onClick={() => onClick?.(s)} title={s.label} style={{
              width: 24, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer',
              background: active ? 'var(--brand-500)' : passed ? 'var(--ok-500)' : 'white',
              color: active || passed ? 'white' : 'var(--ink-400)',
              boxShadow: active ? '0 0 0 3px rgba(217, 119, 6, .2)' : 'none',
              display: 'grid', placeItems: 'center',
            }}>
              {passed ? <I.Check style={{ width: 12, height: 12 }} /> : Ic ? <Ic style={{ width: 12, height: 12 }} /> : <span style={{ fontSize: 10, fontWeight: 700 }}>{i + 1}</span>}
            </button>
            {i < STATUS_STEPS.length - 1 && (
              <span style={{ width: 8, height: 2, background: i < idx ? 'var(--ok-500)' : 'var(--border)', margin: '0 1px' }} />
            )}
          </span>
        );
      })}
    </div>
  );
}

export function StatusPanel({ status, onAdvance, onJump }) {
  const idx = STATUS_STEPS.findIndex(s => s.id === status);
  const next = STATUS_STEPS[idx + 1];
  const current = STATUS_STEPS[idx];

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10.5, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 700, marginBottom: 4 }}>
            Statut actuel <span style={{ color: 'var(--ink-300)', fontWeight: 500, textTransform: 'none', letterSpacing: 0, marginLeft: 2 }}>/ Status</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 17, fontWeight: 700 }}>{current?.label}</span>
            <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>· {current?.desc}</span>
          </div>
        </div>
        {next && (
          <button className="btn btn--brand" onClick={onAdvance}>
            Passer à <strong style={{ marginLeft: 4 }}>{next.label}</strong>
            <I.ArrowRight />
          </button>
        )}
        {!next && <span className="badge badge--ok badge--dot badge--lg">Cargaison clôturée</span>}
      </div>

      <div style={{ padding: '14px 18px', background: 'var(--bg-soft)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STATUS_STEPS.length}, 1fr)`, gap: 0, position: 'relative' }}>
          <div style={{ position: 'absolute', left: '8.3%', right: '8.3%', top: 14, height: 2, background: 'var(--border)', borderRadius: 999, zIndex: 0 }} />
          <div style={{ position: 'absolute', left: '8.3%', top: 14, height: 2, background: 'var(--ok-500)', borderRadius: 999, zIndex: 1, width: `${(idx / (STATUS_STEPS.length - 1)) * 83.4}%`, transition: 'width .3s' }} />

          {STATUS_STEPS.map((s, i) => {
            const passed = i < idx;
            const active = i === idx;
            const Ic = I[s.icon];
            return (
              <button key={s.id} onClick={() => onJump?.(s, i)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                background: 'transparent', border: 'none', cursor: 'pointer',
                position: 'relative', zIndex: 2,
                opacity: i > idx + 1 ? 0.4 : 1,
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 999,
                  background: active ? 'var(--brand-500)' : passed ? 'var(--ok-500)' : 'white',
                  color: active || passed ? 'white' : 'var(--ink-400)',
                  border: passed || active ? 'none' : '1.5px solid var(--border-strong)',
                  display: 'grid', placeItems: 'center',
                  boxShadow: active ? '0 0 0 4px rgba(217, 119, 6, .15)' : 'none',
                }}>
                  {passed ? <I.Check style={{ width: 14, height: 14 }} /> : Ic ? <Ic style={{ width: 14, height: 14 }} /> : null}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: passed || active ? 'var(--ink-800)' : 'var(--ink-500)' }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink-400)' }}>{s.en}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function StatusTransitionModal({ from, to, onClose, onConfirm }) {
  const key = from + ' → ' + to;
  const t = TRANSITIONS[key];
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notify, setNotify] = useState(true);

  if (!t) return null;
  const blocked = t.requires?.some(r => !r.ok);

  return (
    <Modal width={620} onClose={onClose}
      title={t.title}
      sub={<>De <strong>{STATUS_STEPS.find(s => s.id === from)?.label}</strong> vers <strong>{STATUS_STEPS.find(s => s.id === to)?.label}</strong></>}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Annuler</button>
          <div className="spacer" style={{ flex: 1 }} />
          <button className={'btn btn--' + (t.tone || 'brand')} onClick={onConfirm} disabled={blocked} style={blocked ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>
            <I.Check />{t.cta}
          </button>
        </>
      }>

      <div style={{ display: 'flex', gap: 12, padding: 14, background: 'var(--bg-soft)', borderRadius: 10, marginBottom: 18 }}>
        <I.Info style={{ flex: '0 0 18px', color: 'var(--ink-500)', marginTop: 2 }} />
        <div style={{ fontSize: 13, color: 'var(--ink-700)', lineHeight: 1.5 }}>{t.description}</div>
      </div>

      {t.requires && t.requires.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div className="section-title">Pré-requis</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {t.requires.map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                background: r.ok ? 'var(--ok-50)' : 'var(--bad-50)',
                border: '1px solid ' + (r.ok ? 'var(--ok-100)' : 'var(--bad-100)'),
                borderRadius: 7,
              }}>
                {r.ok ? <I.Check style={{ color: 'var(--ok-600)', width: 16, height: 16 }} /> : <I.Alert style={{ color: 'var(--bad-600)', width: 16, height: 16 }} />}
                <span style={{ flex: 1, fontSize: 13, color: r.ok ? 'var(--ok-700)' : 'var(--bad-700)', fontWeight: 500 }}>{r.label}</span>
                {!r.ok && r.action && <a style={{ fontSize: 12, color: 'var(--bad-700)', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}>{r.action}</a>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section-title">Répercussions à la confirmation</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {t.effects.map((e, i) => {
          const cfg = {
            enable:  { c: 'var(--ok-600)',   bg: 'var(--ok-50)',    icon: I.Check,    lbl: 'Activé' },
            disable: { c: 'var(--ink-500)',  bg: 'var(--bg-soft)',  icon: I.Lock,     lbl: 'Bloqué' },
            notify:  { c: 'var(--info-600)', bg: 'var(--info-50)',  icon: I.Whatsapp, lbl: 'Notification' },
            auto:    { c: 'var(--brand-600)',bg: 'var(--brand-50)', icon: I.Sparkle,  lbl: 'Automatique' },
            system:  { c: 'var(--ink-600)',  bg: 'var(--bg-soft)',  icon: I.FileText, lbl: 'Système' },
          }[e.kind];
          const Ic = cfg.icon;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', borderRadius: 6, background: cfg.bg }}>
              <div style={{ width: 22, height: 22, borderRadius: 5, background: 'white', display: 'grid', placeItems: 'center', flex: '0 0 22px', color: cfg.c }}>
                <Ic style={{ width: 12, height: 12 }} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: cfg.c, marginRight: 6 }}>{cfg.lbl}</span>
                <span style={{ fontSize: 13, color: 'var(--ink-700)' }}>{e.what}</span>
              </div>
            </div>
          );
        })}
      </div>

      {t.needsDate && (
        <div className="field" style={{ marginBottom: 0 }}>
          <label className="label">Date effective <span className="opt">/ Effective date</span></label>
          <div className="field-row field-row--2">
            <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            <input className="input" type="time" defaultValue="14:30" />
          </div>
        </div>
      )}

      {t.effects.some(e => e.kind === 'notify') && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: 'var(--bg-soft)', borderRadius: 7, fontSize: 13, marginTop: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={notify} onChange={() => setNotify(!notify)} style={{ accentColor: 'var(--brand-500)' }} />
          <span>Envoyer les notifications WhatsApp maintenant <span style={{ color: 'var(--ink-400)' }}>(sinon mises en file pour plus tard)</span></span>
        </label>
      )}
    </Modal>
  );
}


import { DATA, STATUS } from '../data.js';
import { Bi, RoutePill } from '../components/Shell.jsx';

export default function StatusWorkflowScreen({ onNav }) {
  const [transition, setTransition] = useState(null);

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <div className="page__title"><Bi fr="Workflow & statuts" en="Workflow & status" /></div>
          <div className="page__sub">Avancement des cargaisons à travers les étapes opérationnelles</div>
        </div>
      </div>

      <StatusStepperMini current="open" />

      <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
        {DATA.CAMPAIGNS.map(c => {
          const s = STATUS.campaign[c.status];
          return (
            <div key={c.id} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 18, cursor: 'pointer' }}
                 onClick={() => onNav('/campaign/' + c.id)}>
              <RoutePill from={c.dep.split('-')[0]} to={c.dep.split('-')[1]} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }} className="mono">{c.code}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>
                  {c.parcels} colis · {c.totalKg} kg · départ {c.dep}
                </div>
              </div>
              <StatusPanel status={c.status} onAdvance={() => setTransition(c)} />
            </div>
          );
        })}
      </div>

      {transition && (
        <StatusTransitionModal
          from={transition.status}
          to="open"
          onClose={() => setTransition(null)}
          onConfirm={() => setTransition(null)}
        />
      )}
    </div>
  );
}
