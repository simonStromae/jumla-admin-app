import { prisma } from './prisma';

export const WA_DEFAULTS: Record<string, { label: string; body: string; vars: string[]; trigger?: string }> = {
  // ── Manuel ──────────────────────────────────────────────────────────────
  arrival: {
    label: "Avis d'arrivée",
    vars:  ['{first_name}', '{parcel_code}', '{weight}', '{amount}', '{warehouse_address}', '{agent_phone}'],
    body:
`Bonjour {first_name} 👋

Votre colis ({parcel_code}) est arrivé à Montréal.

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
