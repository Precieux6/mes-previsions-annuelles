# Statut du projet — Mes prévisions annuelles (2027)

## Validé
- Banques mensuelles 2027 : 12 mois, au moins 30 fragments par domaine et par mois.
- Tendances annuelles communes : 75 phrases (5 thèmes × 15) et 10 conseils généraux, approuvés (`validations/relecture_annuel_2027.json`).
- Grandes tendances 2027 (lecture de M. Folly Valère Tossou) : validées, reprises dans `contenu/2027/commun.json`.
- Section des anges : 72 périodes, LEUVIAH conservé deux fois, noms à traits d'union conservés. La table est valable chaque année.
- Noms et périodes des 16 signes Mêdji alignés sur le manuscrit de référence (`geomancie_medji.json`, `geomancie_periodes.json`).
- Jours de naissance : référence « Tout savoir sur votre jour de naissance », corrections appliquées.
- Double influence (archange du jour et archange de la période de naissance) : règle confirmée.
- Année universelle 2027 : double lecture (11 maître, réduit à 2), décrite dans `annee_universelle.json`.
- Conseils mensuels : deux par domaine et par mois, en mode date comme en mode nom.

## Validations
- Banques mensuelles, contenus annuels et révélation : approuvés le 2026-11-18 par Précieux Trésor Tossou (chef de projet).
- Signature de M. Folly Valère Tossou : non requise. La base de données produit une analyse personnalisée ; la validation repose sur les champs `approuve` et `approuve_par`.
- Le worker refuse la production si une validation n'est pas approuvée.
- **À valider avant production** :
  - les deux phrases du bloc `annee_universelle` de `revelation.json` (et les lectures de `annee_universelle.json`) ;
  - les champs `conseil_2027` des 16 signes Mêdji, qui sont une rédaction du projet ;
  - les formulations de `geomancie_medji.json`, reprises du manuscrit.

## Décisions de contenu
- Contenus sensibles des signes Mêdji (perte d'enfants, veuvage, mort subite, inceste, etc.) : intégrés comme faits du manuscrit, reformulés.
- Décès, disparitions et séparations (`commun.json`) : formulations décidées par M. Tossou.
- Maladies : affections citées dans la source, avec avis professionnel.
- Divinités :
  - lundi (Sakpatè) : confirmée par la ressource des jours ;
  - mardi (Gou), jeudi (Hèviesso), vendredi (Nan) : non confirmées par la ressource, à compléter ;
  - mercredi, samedi, dimanche : aucune divinité dans la ressource (`null`) ;
  - Hoho (les Jumeaux) : non rattachée à un jour.
- Aucune citation d'une source protégée : les textes sont reformulés.

## Points ouverts
1. Nombre maître 11 pour l'année personnelle : conservé ou réduit ? La réponse conditionne l'introduction de `cycles_personnels` et `conventions.json`.
2. Divinités des mardi, jeudi et vendredi, et rattachement de Hoho.
3. Table cabalistique (`conventions.json`) : non utilisée par le code. À implémenter ou à retirer.
4. Intégration du code : `profil_spirituel.py`, `spiritualProfile.ts`, `rapport_2027.py`, `revelation_2027.py`, `pdf.ts`, puis affichage conditionnel de la divinité et du psaume dans `App.tsx`.

## Bloquant avant production
1. Code non compilé ni testé : `npm run typecheck`, `npm run build`, exécution de `rapport_2027.py` en mode date et en mode nom, puis `npm run spirit:check`.
2. PDF non rendu : vérifier 36 pages sans débordement.
3. Audios non produits : Piper et modèle voix à installer.
4. Services non créés : Supabase, bucket Cloudflare R2, projet Railway, projet Vercel, variables d'environnement, FedaPay (bac à sable puis production).
5. Présentation : validation par M. Tossou en attente (`presentation`).
6. Test de sélection de la révélation, bloc `annee_universelle` compris.
7. Fichiers à supprimer après vérification : `contenu/2027/sections.json` (fusionné dans `commun.json`) et `contenu/2027/grandes-tendances/grandes-tendances.json` (doublon).
