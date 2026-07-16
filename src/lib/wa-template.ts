import { prisma } from './prisma';

export const WA_DEFAULTS: Record<string, { label: string; body: string; vars: string[]; trigger?: string }> = {
  // ── Manuel ──────────────────────────────────────────────────────────────
  payment_link: {
    label: 'Lien de paiement Interac',
    vars:  ['{first_name}', '{parcel_code}', '{amount}', '{payment_email}', '{payment_url}'],
    body:
`Bonjour {first_name} 👋

Voici votre lien de paiement pour le colis *{parcel_code}* — montant dû : *{amount} CAD*

💳 Effectuez un virement Interac à :
*{payment_email}*
(Inscrivez *{parcel_code}* dans le message)

🔗 Instructions détaillées :
{payment_url}

Jumla Shipping`,
  },
  arrival: {
    label: "Avis d'arrivée",
    vars:  ['{first_name}', '{parcel_code}', '{weight}', '{amount}', '{destination_city}', '{warehouse_address}', '{agent_phone}'],
    body:
`Bonjour {first_name} 👋

Votre colis ({parcel_code}) est arrivé à {destination_city}.

📦 Poids : {weight} kg
💰 Montant dû : {amount} CAD

📍 Retrait : {warehouse_address}
📞 Contact : {agent_phone}

Merci,
Jumla Shipping`,
  },
  reminder: {
    label: 'Relance paiement',
    vars:  ['{first_name}', '{parcel_code}', '{amount}'],
    body:
`Bonjour {first_name},

Nous n'avons pas encore reçu votre paiement pour le colis {parcel_code} — montant dû : {amount} CAD.

Merci de régulariser votre situation au plus vite.

Jumla Shipping`,
  },
  delivery: {
    label: 'Livraison confirmée',
    vars:  ['{first_name}', '{parcel_code}'],
    body:
`Bonjour {first_name},

Votre colis {parcel_code} a été livré. Merci de votre confiance !

Jumla Shipping`,
  },
  invoice: {
    label: 'Facture / Récap',
    vars:  ['{first_name}', '{parcel_code}', '{weight}', '{amount}'],
    body:
`Bonjour {first_name},

Voici le récapitulatif de votre colis {parcel_code} :
• Poids : {weight} kg
• Montant : {amount} CAD

Jumla Shipping`,
  },
  broadcast: {
    label: 'Annonce cargaison',
    vars:  ['{first_name}', '{arrival_date}'],
    body:
`Bonjour {first_name} 👋

Nouvelle cargaison disponible — départ prévu le {arrival_date}.

Réservez votre place dès maintenant.

Jumla Shipping`,
  },

  // ── Automatiques ────────────────────────────────────────────────────────
  auto_status_parcel: {
    label:   'Statut colis',
    trigger: "Déclenché à chaque changement de statut d'un colis",
    vars:    ['{first_name}', '{parcel_code}', '{status_label}'],
    body:
`Bonjour {first_name} 👋

Le statut de votre colis *{parcel_code}* a été mis à jour.

Nouveau statut : *{status_label}*

Connectez-vous à votre espace client pour suivre votre envoi.`,
  },
  auto_supplement: {
    label:   'Ajustement de prix',
    trigger: "Déclenché quand le prix confirmé est supérieur au prix estimé",
    vars:    ['{first_name}', '{parcel_code}', '{estimated_price}', '{confirmed_price}', '{diff}'],
    body:
`Bonjour {first_name} 👋

Après réception de votre colis *{parcel_code}* à notre entrepôt, le montant réel a été calculé.

💰 Montant estimé : *{estimated_price} CAD*
💳 Montant réel : *{confirmed_price} CAD*
📊 Ajustement : *+{diff} CAD*

Une facture complémentaire est disponible dans votre espace client. Merci de la régler pour que votre colis soit traité.`,
  },
  auto_campaign_status: {
    label:   'Statut cargaison',
    trigger: "Déclenché à chaque changement de statut d'une cargaison",
    vars:    ['{first_name}', '{campaign_code}', '{status_label}', '{parcel_codes}'],
    body:
`Bonjour {first_name} 👋

Votre cargaison *{campaign_code}* a été mise à jour.

Nouveau statut : *{status_label}*

Colis : {parcel_codes}

Connectez-vous à votre espace client pour suivre l'avancement de votre envoi.`,
  },
  auto_bordereau_confirmed: {
    label:   'Bordereau confirmé',
    trigger: "Déclenché quand un bordereau passe au statut « validé »",
    vars:    ['{first_name}', '{bordereau_code}', '{parcel_code}'],
    body:
`Bonjour {first_name} 👋

Votre bordereau *{bordereau_code}* (colis {parcel_code}) a été confirmé par Jumla Shipping.

Merci de vous connecter à votre espace client pour vérifier et accepter le contenu déclaré avant l'expédition.`,
  },
  auto_bordereau_discordance: {
    label:   'Discordance bordereau',
    trigger: "Déclenché quand un bordereau passe au statut « discordance »",
    vars:    ['{first_name}', '{bordereau_code}', '{parcel_code}'],
    body:
`Bonjour {first_name} 👋

Une discordance a été détectée sur votre bordereau *{bordereau_code}* (colis {parcel_code}).

Merci de vous connecter à votre espace client pour consulter les détails et régulariser votre dossier.`,
  },
};

// ─── Twilio Content API template definitions ───────────────────────────────
// Maps our template IDs to Twilio Content API payloads.
// Variables use {{N}} positional format; TWILIO_VAR_MAP maps {name} → "N".

export const TWILIO_TEMPLATES: Record<string, {
  friendlyName: string;
  body: string;                         // uses {{N}} variables
  sampleVars: Record<string, string>;   // sample values for submission
  varMap: Record<string, string>;       // {our_var} → "N"
  settingKey: string;                   // DB key where ContentSid is stored
}> = {
  payment_link: {
    friendlyName: 'jumla_payment_link_fr',
    settingKey:   'WA_TMPL_SID_payment_link',
    varMap: { first_name: '1', parcel_code: '2', amount: '3', payment_email: '4', payment_url: '5' },
    sampleVars: { '1': 'Client', '2': 'JMS-00000', '3': '150', '4': 'paiement@jumla.cargo', '5': 'https://jumla.cargo/payer/xxx' },
    body:
`Bonjour {{1}} 👋

Voici votre lien de paiement pour le colis *{{2}}* — montant dû : *{{3}} CAD*

💳 Effectuez un virement Interac à :
*{{4}}*
(Inscrivez *{{2}}* dans le message)

🔗 Instructions détaillées :
{{5}}

Jumla Shipping`,
  },
  arrival: {
    friendlyName: 'jumla_arrival_fr',
    settingKey:   'WA_TMPL_SID_arrival',
    varMap: { first_name: '1', parcel_code: '2', weight: '3', amount: '4', warehouse_address: '5', agent_phone: '6' },
    sampleVars: { '1': 'Client', '2': 'JMS-00000', '3': '10', '4': '100', '5': '5500 Pl. de la Savane, Lachine', '6': '+1 514 998 0709' },
    body:
`Bonjour {{1}} 👋

Votre colis ({{2}}) est arrivé à Montréal.

📦 Poids : {{3}} kg
💰 Montant dû : {{4}} CAD

📍 Retrait : {{5}}
📞 Contact : {{6}}

Merci,
Jumla Shipping`,
  },
  reminder: {
    friendlyName: 'jumla_reminder_fr',
    settingKey:   'WA_TMPL_SID_reminder',
    varMap: { first_name: '1', parcel_code: '2', amount: '3' },
    sampleVars: { '1': 'Client', '2': 'JMS-00000', '3': '100' },
    body:
`Bonjour {{1}},

Nous n'avons pas encore reçu votre paiement pour le colis {{2}} — montant dû : {{3}} CAD.

Merci de régulariser votre situation au plus vite.

Jumla Shipping`,
  },
  delivery: {
    friendlyName: 'jumla_delivery_fr',
    settingKey:   'WA_TMPL_SID_delivery',
    varMap: { first_name: '1', parcel_code: '2' },
    sampleVars: { '1': 'Client', '2': 'JMS-00000' },
    body:
`Bonjour {{1}},

Votre colis {{2}} a été livré. Merci de votre confiance !

Jumla Shipping`,
  },
  invoice: {
    friendlyName: 'jumla_invoice_fr',
    settingKey:   'WA_TMPL_SID_invoice',
    varMap: { first_name: '1', parcel_code: '2', weight: '3', amount: '4' },
    sampleVars: { '1': 'Client', '2': 'JMS-00000', '3': '10', '4': '100' },
    body:
`Bonjour {{1}},

Voici le récapitulatif de votre colis {{2}} :
• Poids : {{3}} kg
• Montant : {{4}} CAD

Jumla Shipping`,
  },
  auto_status_parcel: {
    friendlyName: 'jumla_status_colis_fr',
    settingKey:   'WA_TMPL_SID_auto_status_parcel',
    varMap: { first_name: '1', parcel_code: '2', status_label: '3' },
    sampleVars: { '1': 'Client', '2': 'JMS-00000', '3': 'Arrivé à Montréal' },
    body:
`Bonjour {{1}} 👋

Le statut de votre colis {{2}} a été mis à jour.

Nouveau statut : {{3}}

Connectez-vous à votre espace client pour suivre votre envoi.`,
  },
  auto_supplement: {
    friendlyName: 'jumla_supplement_fr',
    settingKey:   'WA_TMPL_SID_auto_supplement',
    varMap: { first_name: '1', parcel_code: '2', estimated_price: '3', confirmed_price: '4', diff: '5' },
    sampleVars: { '1': 'Client', '2': 'JMS-00000', '3': '100', '4': '150', '5': '50' },
    body:
`Bonjour {{1}} 👋

Après réception de votre colis {{2}} à notre entrepôt, le montant réel a été calculé.

💰 Montant estimé : {{3}} CAD
💳 Montant réel : {{4}} CAD
📊 Ajustement : +{{5}} CAD

Une facture complémentaire est disponible dans votre espace client. Merci de la régler pour que votre colis soit traité.`,
  },
  auto_bordereau_confirmed: {
    friendlyName: 'jumla_bordereau_fr',
    settingKey:   'WA_TMPL_SID_auto_bordereau_confirmed',
    varMap: { first_name: '1', bordereau_code: '2', parcel_code: '3' },
    sampleVars: { '1': 'Client', '2': 'BL-JMS-00000-01', '3': 'JMS-00000' },
    body:
`Bonjour {{1}} 👋

Votre bordereau {{2}} (colis {{3}}) a été confirmé par Jumla Shipping.

Merci de vous connecter à votre espace client pour vérifier et accepter le contenu déclaré avant l'expédition.`,
  },
  broadcast: {
    friendlyName: 'jumla_broadcast_fr',
    settingKey:   'WA_TMPL_SID_broadcast',
    varMap: { first_name: '1', arrival_date: '2' },
    sampleVars: { '1': 'Client', '2': '15 août 2026' },
    body:
`Bonjour {{1}} 👋

Nouvelle cargaison disponible — départ prévu le {{2}}.

Réservez votre place dès maintenant.

Jumla Shipping`,
  },
  auto_campaign_status: {
    friendlyName: 'jumla_cargaison_fr',
    settingKey:   'WA_TMPL_SID_auto_campaign_status',
    varMap: { first_name: '1', campaign_code: '2', status_label: '3', parcel_codes: '4' },
    sampleVars: { '1': 'Client', '2': 'DLA-MTL-JUL-01', '3': 'En transit', '4': 'JMS-00000' },
    body:
`Bonjour {{1}} 👋

Votre cargaison {{2}} a été mise à jour.

Nouveau statut : {{3}}

Colis : {{4}}

Connectez-vous à votre espace client pour suivre l'avancement de votre envoi.`,
  },
};

// Build ContentVariables from named vars using varMap
export function buildContentVariables(
  templateId: string,
  namedVars: Record<string, string>,
): Record<string, string> | null {
  const tmpl = TWILIO_TEMPLATES[templateId];
  if (!tmpl) return null;
  const result: Record<string, string> = {};
  for (const [name, pos] of Object.entries(tmpl.varMap)) {
    result[pos] = namedVars[name] ?? '';
  }
  return result;
}

export async function renderWaTemplate(
  id: string,
  vars: Record<string, string | number>,
): Promise<string> {
  const def = WA_DEFAULTS[id];
  let body = def?.body ?? '';
  try {
    const row = await prisma.setting.findUnique({ where: { key: `wa_tmpl_${id}_body` } });
    if (row?.value) body = row.value;
  } catch { /* use default */ }
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.split(`{${k}}`).join(String(v)),
    body,
  );
}
