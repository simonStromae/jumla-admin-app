// Single source of truth for parcel tracking statuses
export const PARCEL_STATUSES = {
  // ── Flux principal ──────────────────────────────────────────────────────
  enr: { label: 'Colis enregistré',              code: 'ENR', icon: '📝', color: '#6b7280', bg: '#f9fafb', cls: 'neutral' },
  rec: { label: 'Reçu à l\'entrepôt',            code: 'REC', icon: '📥', color: '#1d4ed8', bg: '#eff6ff', cls: 'info' },
  pre: { label: 'Vérifié et préparé',             code: 'PRE', icon: '🔍', color: '#7c3aed', bg: '#f5f3ff', cls: 'info' },
  exp: { label: 'Expédié',                        code: 'EXP', icon: '🚀', color: '#0e7490', bg: '#ecfeff', cls: 'info' },
  tra: { label: 'En transit',                     code: 'TRA', icon: '✈️', color: '#0891b2', bg: '#ecfeff', cls: 'info' },
  apd: { label: 'Arrivé au pays de destination',  code: 'APD', icon: '🛬', color: '#16a34a', bg: '#f0fdf4', cls: 'ok' },
  // ── Douanes ─────────────────────────────────────────────────────────────
  dou: { label: 'Présenté aux douanes',           code: 'DOU', icon: '🛃', color: '#b45309', bg: '#fffbeb', cls: 'warn' },
  ins: { label: 'En inspection douanière',        code: 'INS', icon: '🔎', color: '#b45309', bg: '#fffbeb', cls: 'warn' },
  ret: { label: 'Retenu par les douanes',         code: 'RET', icon: '⚠️', color: '#dc2626', bg: '#fef2f2', cls: 'bad' },
  lib: { label: 'Libéré par les douanes',         code: 'LIB', icon: '✅', color: '#16a34a', bg: '#f0fdf4', cls: 'ok' },
  // ── Livraison ────────────────────────────────────────────────────────────
  ard: { label: 'Arrivé à l\'entrepôt de destination', code: 'ARD', icon: '🏭', color: '#16a34a', bg: '#f0fdf4', cls: 'ok' },
  ver: { label: 'Vérification finale',            code: 'VER', icon: '🔬', color: '#7c3aed', bg: '#f5f3ff', cls: 'info' },
  pdl: { label: 'Prêt pour livraison ou retrait', code: 'PDL', icon: '📦', color: '#0e7490', bg: '#ecfeff', cls: 'info' },
  liv: { label: 'En cours de livraison',          code: 'LIV', icon: '🚚', color: '#0891b2', bg: '#ecfeff', cls: 'info' },
  ok:  { label: 'Livré',                          code: 'OK',  icon: '🎉', color: '#15803d', bg: '#dcfce7', cls: 'ok' },
  // ── Statuts exceptionnels ────────────────────────────────────────────────
  adr: { label: 'Adresse incomplète',             code: 'ADR', icon: '📍', color: '#dc2626', bg: '#fef2f2', cls: 'bad' },
  tdl: { label: 'Tentative de livraison',         code: 'TDL', icon: '🔔', color: '#b45309', bg: '#fffbeb', cls: 'warn' },
  rte: { label: 'Retour à l\'entrepôt',           code: 'RTE', icon: '↩️', color: '#dc2626', bg: '#fef2f2', cls: 'bad' },
  dom: { label: 'Colis endommagé',                code: 'DOM', icon: '💥', color: '#dc2626', bg: '#fef2f2', cls: 'bad' },
  cla: { label: 'Réclamation ouverte',            code: 'CLA', icon: '📋', color: '#dc2626', bg: '#fef2f2', cls: 'bad' },
};

// Ordered happy-path steps (for linear display)
export const PARCEL_STEPS = ['enr', 'rec', 'pre', 'exp', 'tra', 'apd', 'dou', 'lib', 'ard', 'ver', 'pdl', 'liv', 'ok'];

// Statuses a client can still edit their parcel
export const EDITABLE_STATUSES = ['enr', 'rec'];

export const isDelivered = (status) => status === 'ok';
export const isActive    = (status) => status !== 'ok';
