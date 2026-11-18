# Mes prévisions annuelles

Plateforme dédiée aux prévisions annuelles. Une seule base de code, un dossier de contenu par année.

## Structure
- `api/` : endpoints Vercel (commande, suivi, téléchargement, retour de paiement, webhook FedaPay).
- `api/_lib/` : base de données, jetons, validation, paiement, configuration.
- `worker/` : production des documents (PDF 36 pages, reçu, audios), à déployer sur Railway.
- `packages/` : moteur astronomique, générateur PDF et reçu, audio Piper, stockage R2.
- `scripts/` : moteurs Python (rapport, révélation, conseils, tonalités, validation).
- `banks/2027/` : banques mensuelles et conventions.
- `contenu/2027/` : contenu commun, révélation, anges, annuel.
- `db/` : schéma et migrations.
- `src/` : application (commande et suivi).
- `DEPLOIEMENT.md`, `STATUT.md`, `.env.example`.

## Commandes
- `npm install`
- `npm run typecheck`
- `npm run build`
- `npm run worker` (en local, avec les variables)
- `npm run rapport:test`
- `npm run banks:check`
