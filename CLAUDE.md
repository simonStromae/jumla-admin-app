# CLAUDE.md — Instructions pour Claude Code

## Git workflow
- Ne jamais pousser directement sur `main`
- Toujours créer une branche avant de coder :
  - `git checkout -b feature/description` pour une nouvelle fonctionnalité
  - `git checkout -b fix/description` pour un correctif
- Pousser la branche et créer une Pull Request pour review
- La PR génère automatiquement un lien Vercel Preview pour valider avant de merger

## Stack
- Next.js 14 App Router (`app/` = pages, `src/screens/` = écrans admin, `src/client/` = composants publics)
- i18n via React Context (`LocaleProvider` + `useT()` + `useLocale()`) dans `src/lib/i18n.jsx`
- Tokens design dans `src/styles/tokens.css`

## Règles de couleurs
- Jamais de jaune/orange/amber (`--warn-*`, `#F5A524`, `#D97706`, etc.) sur les pages client
- Actions primaires → dégradé brand cyan/bleu (`#00B4D8` → `#1B4FD8`)
- États action requise / paiement en attente → `--bad-*` (rouge)
- Informatif / supplément → `--info-*` (indigo)
- Succès → `--ok-*` (vert)
