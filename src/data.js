// ============================================
// JUMLA — Mock data
// ============================================

export const ROUTES = [
  {
    id: 'r-dla-yul', code: 'DLA → YUL',
    fromCity: 'Douala', fromCountry: 'Cameroun', fromIATA: 'DLA',
    toCity: 'Montréal', toCountry: 'Canada', toIATA: 'YUL',
    transitDays: 14, currency: 'CAD', active: true,
    cargosCount: 22, parcelsTotal: 1284, revenueTotal: 482300,
    warehouseFrom: 'Akwa, Douala', warehouseTo: 'Lachine, Montréal',
    agentFrom: 'Aïcha M.', agentTo: 'Marc L.',
    pricing: [
      { from: 0, to: 5,    rate: 18 },
      { from: 5, to: 10,   rate: 16 },
      { from: 10, to: 25,  rate: 14 },
      { from: 25, to: 50,  rate: 12 },
      { from: 50, to: 100, rate: 10 },
    ],
    fees: {
      base: 50, customs: 5, carton: 1, formality: 4, service: 5,
      flatUpTo3kg: 65, perHalfKgRate: 9,
      addons: { smallBag: 3, mediumBag: 5, largeBag: 10 },
      montrealDelivery: 25,
    },
  },
  {
    id: 'r-los-yul', code: 'LOS → YUL',
    fromCity: 'Lagos', fromCountry: 'Nigeria', fromIATA: 'LOS',
    toCity: 'Montréal', toCountry: 'Canada', toIATA: 'YUL',
    transitDays: 16, currency: 'CAD', active: true,
    cargosCount: 7, parcelsTotal: 312, revenueTotal: 118400,
    warehouseFrom: 'Ikeja, Lagos', warehouseTo: 'Lachine, Montréal',
    agentFrom: 'Tunde A.', agentTo: 'Marc L.',
    pricing: [
      { from: 0, to: 5,   rate: 20 },
      { from: 5, to: 15,  rate: 17 },
      { from: 15, to: 30, rate: 14 },
      { from: 30, to: 100, rate: 11 },
    ],
    fees: {
      base: 55, customs: 6, carton: 1, formality: 4, service: 4,
      flatUpTo3kg: 70, perHalfKgRate: 10,
      addons: { smallBag: 3, mediumBag: 5, largeBag: 10 },
      montrealDelivery: 25,
    },
  },
  {
    id: 'r-dla-bru', code: 'DLA → BRU',
    fromCity: 'Douala', fromCountry: 'Cameroun', fromIATA: 'DLA',
    toCity: 'Bruxelles', toCountry: 'Belgique', toIATA: 'BRU',
    transitDays: 8, currency: 'EUR', active: true,
    cargosCount: 4, parcelsTotal: 142, revenueTotal: 42100,
    warehouseFrom: 'Akwa, Douala', warehouseTo: 'Zaventem, Bruxelles',
    agentFrom: 'Aïcha M.', agentTo: 'Sophie D.',
    pricing: [
      { from: 0, to: 5,   rate: 14 },
      { from: 5, to: 15,  rate: 12 },
      { from: 15, to: 50, rate: 10 },
    ],
    fees: {
      base: 40, customs: 4, carton: 1, formality: 3, service: 2,
      flatUpTo3kg: 50, perHalfKgRate: 7,
      addons: { smallBag: 2, mediumBag: 4, largeBag: 8 },
      montrealDelivery: 0,
    },
  },
  {
    id: 'r-dla-par', code: 'DLA → CDG',
    fromCity: 'Douala', fromCountry: 'Cameroun', fromIATA: 'DLA',
    toCity: 'Paris', toCountry: 'France', toIATA: 'CDG',
    transitDays: 7, currency: 'EUR', active: false,
    cargosCount: 0, parcelsTotal: 0, revenueTotal: 0,
    warehouseFrom: 'Akwa, Douala', warehouseTo: '—',
    agentFrom: 'Aïcha M.', agentTo: '—',
    pricing: [
      { from: 0, to: 5,   rate: 13 },
      { from: 5, to: 20,  rate: 11 },
    ],
    fees: {
      base: 38, customs: 4, carton: 1, formality: 3, service: 2,
      flatUpTo3kg: 48, perHalfKgRate: 7,
      addons: { smallBag: 2, mediumBag: 4, largeBag: 8 },
      montrealDelivery: 0,
    },
  },
];

export const CAMPAIGNS = [
  { id: 'c1', code: 'DLA-YUL-APR-02', route: 'r-dla-yul', month: 'Avril 2026',    dep: '28 avr. 2026', status: 'exp', parcels: 64, weight: 1842, invoiced: 32450, collected: 18920, alerts: 3, costs: { fret: 8200, manutention: 960,  douane: 720, transport: 420, divers: 180 } },
  { id: 'c2', code: 'DLA-YUL-APR-01', route: 'r-dla-yul', month: 'Avril 2026',    dep: '14 avr. 2026', status: 'ok',     parcels: 58, weight: 1622, invoiced: 28100, collected: 28100, alerts: 0, costs: { fret: 7400, manutention: 820,  douane: 640, transport: 360, divers: 140 } },
  { id: 'c3', code: 'LOS-YUL-APR-01', route: 'r-los-yul', month: 'Avril 2026',    dep: '10 avr. 2026', status: 'ok',     parcels: 41, weight: 1108, invoiced: 19600, collected: 19200, alerts: 1, costs: { fret: 5800, manutention: 640,  douane: 520, transport: 280, divers: 120 } },
  { id: 'c4', code: 'DLA-YUL-MAR-02', route: 'r-dla-yul', month: 'Mars 2026',     dep: '28 mars 2026', status: 'ok',     parcels: 71, weight: 2014, invoiced: 35200, collected: 35200, alerts: 0, costs: { fret: 9000, manutention: 1100, douane: 780, transport: 480, divers: 220 } },
  { id: 'c5', code: 'DLA-YUL-MAR-01', route: 'r-dla-yul', month: 'Mars 2026',     dep: '14 mars 2026', status: 'ok',     parcels: 62, weight: 1722, invoiced: 30650, collected: 30650, alerts: 0, costs: { fret: 7800, manutention: 880,  douane: 680, transport: 400, divers: 160 } },
  { id: 'c6', code: 'DLA-BRU-MAR-01', route: 'r-dla-bru', month: 'Mars 2026',     dep: '08 mars 2026', status: 'ok',     parcels: 34, weight: 962,  invoiced: 11400, collected: 11400, alerts: 0, costs: { fret: 3600, manutention: 460,  douane: 320, transport: 200, divers: 80  } },
  { id: 'c7', code: 'DLA-YUL-FEB-02', route: 'r-dla-yul', month: 'Février 2026',  dep: '26 fév. 2026', status: 'ok',     parcels: 67, weight: 1880, invoiced: 32100, collected: 32100, alerts: 0, costs: { fret: 8400, manutention: 940,  douane: 700, transport: 420, divers: 180 } },
  { id: 'c8', code: 'DLA-YUL-FEB-01', route: 'r-dla-yul', month: 'Février 2026',  dep: '12 fév. 2026', status: 'ok',     parcels: 55, weight: 1542, invoiced: 27300, collected: 27300, alerts: 0, costs: { fret: 6900, manutention: 760,  douane: 600, transport: 340, divers: 140 } },
];

export const PARCELS = [
  { id: 'p1', code: '#01', campaign: 'DLA-YUL-APR-02', senderName: 'Client A', senderPhone: '+237 6** ** ** 12', recipName: 'Client J', recipPhone: '+1 514 *** **45', recipCity: 'Montréal',  reservedKg: 12, actualKg: 14,  contents: '2 valises, vêtements, ndolè',        amount: 280, paid: 'paid',    delivery: 'home',   slip: 'BL-2604-01', agent: 'AM', note: '—',         overrun: true,  items: [
    { id: 'p1-i1', desc: 'Valise de voyage',        qty: 2, kg: 6,   cat: 'standard' },
    { id: 'p1-i2', desc: 'Sac vêtements mixtes',    qty: 1, kg: 4,   cat: 'standard' },
    { id: 'p1-i3', desc: 'Carton ndolè (surgelé)',  qty: 1, kg: 4,   cat: 'food'     },
  ]},
  { id: 'p2', code: '#02', campaign: 'DLA-YUL-APR-02', senderName: 'Client B', senderPhone: '+237 6** ** ** 24', recipName: 'Client K', recipPhone: '+1 438 *** **08', recipCity: 'Laval',      reservedKg: 8,  actualKg: 7.5, contents: 'Carton produits alimentaires',        amount: 145, paid: 'paid',    delivery: 'pickup', slip: 'BL-2604-02', agent: 'AM', note: '—',         overrun: false, items: [
    { id: 'p2-i1', desc: 'Carton produits alimentaires', qty: 1, kg: 5,   cat: 'food' },
    { id: 'p2-i2', desc: 'Sachets condiments locaux',    qty: 4, kg: 2.5, cat: 'food' },
  ]},
  { id: 'p3', code: '#03', campaign: 'DLA-YUL-APR-02', senderName: 'Client C', senderPhone: '+237 6** ** ** 31', recipName: 'Client L', recipPhone: '+1 450 *** **77', recipCity: 'Longueuil', reservedKg: 25, actualKg: 24,  contents: 'Électronique, 1 carton scellé',      amount: 410, paid: 'pending', delivery: 'home',   slip: null,         agent: 'ML', note: 'À rappeler', overrun: false, items: [
    { id: 'p3-i1', desc: 'Téléviseur 43" (carton)',    qty: 1, kg: 14, cat: 'electronics' },
    { id: 'p3-i2', desc: 'Carton électronique divers', qty: 1, kg: 10, cat: 'electronics' },
  ]},
  { id: 'p4', code: '#04', campaign: 'DLA-YUL-APR-02', senderName: 'Client D', senderPhone: '+237 6** ** ** 02', recipName: 'Client M', recipPhone: '+1 514 *** **19', recipCity: 'Montréal',  reservedKg: 15, actualKg: 18,  contents: 'Vêtements, chaussures',              amount: 320, paid: 'unpaid',  delivery: 'home',   slip: 'BL-2604-04', agent: 'ML', note: '—',         overrun: true,  items: [
    { id: 'p4-i1', desc: 'Carton vêtements adulte', qty: 2, kg: 10, cat: 'standard' },
    { id: 'p4-i2', desc: 'Paires de chaussures',    qty: 4, kg: 8,  cat: 'standard' },
  ]},
  { id: 'p5', code: '#05', campaign: 'DLA-YUL-APR-02', senderName: 'Client E', senderPhone: '+237 6** ** ** 87', recipName: 'Client N', recipPhone: '+1 819 *** **66', recipCity: 'Gatineau',  reservedKg: 30, actualKg: 31,  contents: 'Mobilier démontable, 3 cartons',     amount: 540, paid: 'paid',    delivery: 'home',   slip: 'BL-2604-05', agent: 'AM', note: '—',         overrun: false, items: [
    { id: 'p5-i1', desc: 'Carton pièces mobilier',    qty: 3, kg: 25, cat: 'oversize' },
    { id: 'p5-i2', desc: 'Sac outillage & visserie',  qty: 1, kg: 6,  cat: 'standard' },
  ]},
  { id: 'p6', code: '#06', campaign: 'DLA-YUL-APR-02', senderName: 'Client F', senderPhone: '+237 6** ** ** 41', recipName: 'Client O', recipPhone: '+1 514 *** **22', recipCity: 'Montréal',  reservedKg: 10, actualKg: 9,   contents: 'Documents et 1 valise',              amount: 195, paid: 'unpaid',  delivery: 'pickup', slip: null,         agent: 'AM', note: 'Vérifier',  overrun: false, items: [
    { id: 'p6-i1', desc: 'Valise vêtements',     qty: 1, kg: 7, cat: 'standard'   },
    { id: 'p6-i2', desc: 'Pochette documents',   qty: 1, kg: 2, cat: 'documents'  },
  ]},
  { id: 'p7', code: '#07', campaign: 'DLA-YUL-APR-02', senderName: 'Client G', senderPhone: '+237 6** ** ** 18', recipName: 'Client P', recipPhone: '+1 450 *** **30', recipCity: 'Brossard',  reservedKg: 20, actualKg: 22,  contents: 'Tissu wax, bibelots, 2 cartons',     amount: 380, paid: 'paid',    delivery: 'home',   slip: 'BL-2604-07', agent: 'ML', note: '—',         overrun: true,  items: [
    { id: 'p7-i1', desc: 'Rouleaux tissu wax',      qty: 5, kg: 8,  cat: 'standard' },
    { id: 'p7-i2', desc: 'Carton bibelots & déco',  qty: 2, kg: 14, cat: 'fragile'  },
  ]},
  { id: 'p8', code: '#08', campaign: 'DLA-YUL-APR-02', senderName: 'Client H', senderPhone: '+237 6** ** ** 09', recipName: 'Client Q', recipPhone: '+1 514 *** **51', recipCity: 'Montréal',  reservedKg: 6,  actualKg: 5.5, contents: 'Petit colis, cadeaux',               amount: 110, paid: 'paid',    delivery: 'pickup', slip: 'BL-2604-08', agent: 'AM', note: '—',         overrun: false, items: [
    { id: 'p8-i1', desc: 'Boîtes cadeaux emballées',   qty: 3, kg: 3,   cat: 'fragile' },
    { id: 'p8-i2', desc: 'Sachets friandises locales', qty: 2, kg: 2.5, cat: 'food'    },
  ]},
];

export const CLIENTS = [
  { id: 'cl1', name: 'Client A', code: 'CL-0142', role: 'sender',    phone: '+237 6** ** ** 12', city: 'Douala',   campaigns: 8,  weight: 96,  amount: 1820, lastCampaign: 'DLA-YUL-APR-02', lastStatus: 'exp', loyal: true,  color: 1 },
  { id: 'cl2', name: 'Client J', code: 'CL-0418', role: 'recipient', phone: '+1 514 *** **45',  city: 'Montréal', campaigns: 12, weight: 188, amount: 2840, lastCampaign: 'DLA-YUL-APR-02', lastStatus: 'exp', loyal: true,  color: 2 },
  { id: 'cl3', name: 'Client K', code: 'CL-0327', role: 'recipient', phone: '+1 438 *** **08',  city: 'Laval',    campaigns: 4,  weight: 42,  amount: 760,  lastCampaign: 'DLA-YUL-APR-02', lastStatus: 'exp', loyal: false, color: 3 },
  { id: 'cl4', name: 'Client B', code: 'CL-0211', role: 'both',      phone: '+237 6** ** ** 24', city: 'Douala',   campaigns: 14, weight: 226, amount: 3200, lastCampaign: 'DLA-YUL-APR-02', lastStatus: 'exp', loyal: true,  color: 4 },
  { id: 'cl5', name: 'Client M', code: 'CL-0501', role: 'recipient', phone: '+1 514 *** **19',  city: 'Montréal', campaigns: 2,  weight: 32,  amount: 580,  lastCampaign: 'DLA-YUL-APR-02', lastStatus: 'exp', loyal: false, color: 5 },
  { id: 'cl6', name: 'Client D', code: 'CL-0388', role: 'sender',    phone: '+237 6** ** ** 02', city: 'Douala',   campaigns: 6,  weight: 78,  amount: 1180, lastCampaign: 'DLA-YUL-APR-02', lastStatus: 'exp', loyal: false, color: 6 },
  { id: 'cl7', name: 'Client P', code: 'CL-0612', role: 'recipient', phone: '+1 450 *** **30',  city: 'Brossard', campaigns: 9,  weight: 142, amount: 2150, lastCampaign: 'DLA-YUL-APR-02', lastStatus: 'exp', loyal: true,  color: 7 },
  { id: 'cl8', name: 'Client N', code: 'CL-0455', role: 'recipient', phone: '+1 819 *** **66',  city: 'Gatineau', campaigns: 3,  weight: 64,  amount: 980,  lastCampaign: 'DLA-YUL-APR-02', lastStatus: 'exp', loyal: false, color: 8 },
];

export const PAYMENTS = [
  { id: 'pa1', date: '26 avr. 14:32', recipName: 'Client J', recipPhone: '+1 514 *** **45', campaign: 'DLA-YUL-APR-02', parcel: '#01', due: 280, received: 280, status: 'paid',    method: 'Virement Interac', agent: 'AM', note: '—' },
  { id: 'pa2', date: '26 avr. 13:08', recipName: 'Client K', recipPhone: '+1 438 *** **08', campaign: 'DLA-YUL-APR-02', parcel: '#02', due: 145, received: 145, status: 'paid',    method: 'Espèces',          agent: 'AM', note: '—' },
  { id: 'pa3', date: '26 avr. 11:50', recipName: 'Client L', recipPhone: '+1 450 *** **77', campaign: 'DLA-YUL-APR-02', parcel: '#03', due: 410, received: 200, status: 'pending', method: 'Acompte',          agent: 'ML', note: 'Solde lundi' },
  { id: 'pa4', date: '25 avr. 17:22', recipName: 'Client M', recipPhone: '+1 514 *** **19', campaign: 'DLA-YUL-APR-02', parcel: '#04', due: 320, received: 0,   status: 'unpaid',  method: '—',                agent: 'ML', note: 'Rappel J+1' },
  { id: 'pa5', date: '25 avr. 16:01', recipName: 'Client N', recipPhone: '+1 819 *** **66', campaign: 'DLA-YUL-APR-02', parcel: '#05', due: 540, received: 540, status: 'paid',    method: 'Virement bancaire',agent: 'AM', note: '—' },
  { id: 'pa6', date: '25 avr. 12:45', recipName: 'Client O', recipPhone: '+1 514 *** **22', campaign: 'DLA-YUL-APR-02', parcel: '#06', due: 195, received: 0,   status: 'unpaid',  method: '—',                agent: 'AM', note: '—' },
  { id: 'pa7', date: '24 avr. 18:30', recipName: 'Client P', recipPhone: '+1 450 *** **30', campaign: 'DLA-YUL-APR-02', parcel: '#07', due: 380, received: 380, status: 'paid',    method: 'Espèces',          agent: 'ML', note: '—' },
  { id: 'pa8', date: '24 avr. 15:14', recipName: 'Client Q', recipPhone: '+1 514 *** **51', campaign: 'DLA-YUL-APR-02', parcel: '#08', due: 110, received: 110, status: 'paid',    method: 'Espèces',          agent: 'AM', note: '—' },
];

export const AGENTS = [
  { id: 'ag1', name: 'Aïcha M.',  initials: 'AM', city: 'Douala',    role: 'admin',    campaigns: 22, parcels: 612, collected: 184200, lastLogin: 'il y a 12 min', color: 1, perms: { campaigns: true, parcels: true, payments: true, agents: true,  whatsapp: true,  analytics: true } },
  { id: 'ag2', name: 'Marc L.',   initials: 'ML', city: 'Montréal',  role: 'admin',    campaigns: 22, parcels: 612, collected: 184200, lastLogin: 'il y a 1 h',    color: 2, perms: { campaigns: true, parcels: true, payments: true, agents: true,  whatsapp: true,  analytics: true } },
  { id: 'ag3', name: 'Sophie D.', initials: 'SD', city: 'Bruxelles', role: 'agent',    campaigns: 4,  parcels: 142, collected: 42100,  lastLogin: 'il y a 3 h',    color: 3, perms: { campaigns: false, parcels: true, payments: true, agents: false, whatsapp: true,  analytics: false } },
  { id: 'ag4', name: 'Tunde A.',  initials: 'TA', city: 'Lagos',     role: 'agent',    campaigns: 7,  parcels: 312, collected: 118400, lastLogin: 'hier',          color: 4, perms: { campaigns: false, parcels: true, payments: true, agents: false, whatsapp: true,  analytics: false } },
  { id: 'ag5', name: 'Karim O.',  initials: 'KO', city: 'Douala',    role: 'agent',    campaigns: 5,  parcels: 188, collected: 56400,  lastLogin: 'il y a 2 j',    color: 5, perms: { campaigns: false, parcels: true, payments: false, agents: false, whatsapp: false, analytics: false } },
  { id: 'ag6', name: 'Léa R.',    initials: 'LR', city: 'Montréal',  role: 'readonly', campaigns: 0,  parcels: 0,   collected: 0,      lastLogin: 'il y a 1 j',    color: 6, perms: { campaigns: false, parcels: false, payments: false, agents: false, whatsapp: false, analytics: true } },
];

export const PARCEL_CATEGORIES = [
  { id: 'standard',     label: 'Standard',                      en: 'Standard',    pct: 0,   color: '#9CA3AF', icon: '📦', desc: 'Savons, pagnes, épices, articles généraux' },
  { id: 'vetements',    label: 'Vêtements / Chaussures / Sacs', en: 'Clothing',    pct: 2,   color: '#8B5CF6', icon: '👗', desc: 'Robes, pantalons, chaussures, sacs à main' },
  { id: 'cosmetique',   label: 'Cosmétiques / Compléments',     en: 'Cosmetics',   pct: 3,   color: '#EC4899', icon: '💄', desc: 'Crèmes, parfums, produits capillaires' },
  { id: 'alimentaire',  label: 'Alimentaire / Épices',          en: 'Food',        pct: 0,   color: '#10B981', icon: '🥘', desc: 'Ndolè, poisson fumé, café, cacao, safou' },
  { id: 'biere',        label: 'Bière',                         en: 'Beer',        pct: 6,   color: '#F59E0B', icon: '🍺', desc: 'Bouteilles ou canettes — frais SAQ inclus' },
  { id: 'manioc_huile', label: 'Bâton de manioc / Huile rouge', en: 'Manioc/Oil',  pct: 0,   color: '#065F46', icon: '🌿', desc: 'Bâtons de manioc, huile de palme rouge' },
  { id: 'electronique', label: 'Électronique',                  en: 'Electronics', pct: 5,   color: '#6366F1', icon: '📱', desc: 'Téléphones, ordinateurs, accessoires' },
  { id: 'documents',    label: 'Documents',                     en: 'Documents',   pct: -2,  color: '#06B6D4', icon: '📄', desc: 'Papiers administratifs, courriers (tarif réduit)' },
];

export const DATA = { ROUTES, CAMPAIGNS, PARCELS, CLIENTS, PAYMENTS, AGENTS, PARCEL_CATEGORIES };

export const getRoute = (id) => ROUTES.find(r => r.id === id);
export const getCampaign = (id) => CAMPAIGNS.find(c => c.id === id);
export const getCategory = (id) => PARCEL_CATEGORIES.find(c => c.id === id);

export const STATUS = {
  campaign: {
    enr: { label: 'Ouverte',          cls: 'brand',   dot: 'brand' },
    exp: { label: 'Expédiée',         cls: 'info',    dot: 'info' },
    tra: { label: 'En transit',       cls: 'warn',    dot: 'warn' },
    apd: { label: 'Arrivée pays',     cls: 'ok',      dot: 'ok' },
    dou: { label: 'En douane',        cls: 'warn',    dot: 'warn' },
    lib: { label: 'Libérée',          cls: 'ok',      dot: 'ok' },
    ard: { label: 'Entrepôt dest.',   cls: 'ok',      dot: 'ok' },
    pdl: { label: 'Prête livr.',      cls: 'info',    dot: 'info' },
    ok:  { label: 'Clôturée',         cls: 'neutral', dot: 'neutral' },
  },
  payment: {
    'paid':    { label: 'Payé',     en: 'Paid',    cls: 'ok' },
    'unpaid':  { label: 'Impayé',   en: 'Unpaid',  cls: 'bad' },
    'pending': { label: 'En cours', en: 'Pending', cls: 'warn' },
  },
};

export const STATUS_STEPS = [
  {
    id: 'enr', label: 'Ouverte', en: 'Open',
    desc: 'Accepte les colis · Modifications autorisées',
    effects: [
      { type: 'unlock', text: 'Ajout et modification de colis activés' },
    ],
  },
  {
    id: 'exp', label: 'Expédiée', en: 'Shipped',
    desc: 'Cargaison partie · Édition restreinte',
    nextLabel: 'Marquer arrivée pays',
    effects: [
      { type: 'block', text: 'Modification des poids et tarifs bloquée' },
      { type: 'auto',  text: 'Colis REC/PRE → EXP automatiquement' },
    ],
  },
  {
    id: 'tra', label: 'En transit', en: 'In transit',
    desc: 'Second tronçon du trajet',
    effects: [],
  },
  {
    id: 'apd', label: 'Arrivée pays', en: 'Arrived at country',
    desc: 'Arrivée au pays de destination',
    effects: [],
  },
  {
    id: 'dou', label: 'En douane', en: 'At customs',
    desc: 'Présentée aux douanes',
    effects: [],
  },
  {
    id: 'lib', label: 'Libérée douanes', en: 'Customs cleared',
    desc: 'Libérée par les douanes',
    effects: [],
  },
  {
    id: 'ard', label: 'Entrepôt dest.', en: 'At warehouse',
    desc: 'Arrivée à l\'entrepôt de destination',
    effects: [
      { type: 'unlock', text: 'Vérification des bordereaux activée' },
      { type: 'auto',  text: 'Colis EXP/TRA/APD → ARD automatiquement' },
    ],
  },
  {
    id: 'pdl', label: 'Prête livraison', en: 'Ready',
    desc: 'Prête pour la livraison ou le retrait',
    effects: [],
  },
  {
    id: 'ok', label: 'Clôturée', en: 'Closed',
    desc: 'Lecture seule · Bilan P&L disponible',
    effects: [
      { type: 'block', text: 'Cargaison en lecture seule' },
    ],
  },
];
