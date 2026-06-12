// Single source of truth for parcel tracking statuses
export const PARCEL_STATUSES = {
  enr: { label: 'Colis enregistré',              code: 'ENR', icon: '📝', color: '#6b7280', bg: '#f9fafb' },
  rec: { label: 'Reçu à l\'entrepôt',            code: 'REC', icon: '📥', color: '#1d4ed8', bg: '#eff6ff' },
  pre: { label: 'Vérifié et préparé',             code: 'PRE', icon: '🔍', color: '#7c3aed', bg: '#f5f3ff' },
  exp: { label: 'Expédié',                        code: 'EXP', icon: '🚀', color: '#0e7490', bg: '#ecfeff' },
  tra: { label: 'En transit',                     code: 'TRA', icon: '✈️', color: '#0891b2', bg: '#ecfeff' },
  apd: { label: 'Arrivé au pays de destination',  code: 'APD', icon: '🛬', color: '#16a34a', bg: '#f0fdf4' },
  dou: { label: 'Présenté aux douanes',           code: 'DOU', icon: '🛃', color: '#b45309', bg: '#fffbeb' },
  ins: { label: 'En inspection douanière',        code: 'INS', icon: '🔎', color: '#b45309', bg: '#fffbeb' },
  ret: { label: 'Retenu par les douanes',         code: 'RET', icon: '⚠️', color: '#dc2626', bg: '#fef2f2' },
  lib: { label: 'Libéré par les douanes',         code: 'LIB', icon: '✅', color: '#16a34a', bg: '#f0fdf4' },
  del: { label: 'En cours de livraison',          code: 'DEL', icon: '🚚', color: '#0e7490', bg: '#ecfeff' },
  liv: { label: 'Livré',                          code: 'LIV', icon: '🎉', color: '#15803d', bg: '#dcfce7' },
};

// Ordered happy-path steps (progress bar)
export const PARCEL_STEPS = ['enr', 'rec', 'pre', 'exp', 'tra', 'apd', 'dou', 'lib', 'del', 'liv'];

// Statuses a client can still edit their parcel
export const EDITABLE_STATUSES = ['enr', 'rec'];

// Parcel is considered "active" (not yet delivered)
export const isActive = (status) => status !== 'liv';
