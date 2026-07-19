# Prompt complet pour Gemini — Sprint 12

Copiez l’intégralité du prompt ci-dessous dans Gemini.

---

Tu travailles dans :

`D:\dev\samatech-crm`

Ta mission est d’implémenter et de valider le **Sprint 12 — Performances et ergonomie mobile** de SAMTECH CRM.

Tu dois auditer l’état réel, mesurer avant toute optimisation, corriger le code, ajouter les tests, rejouer toutes les validations et produire un rapport factuel. Ne te limite pas à un rapport ou à des recommandations.

## 1. Règles impératives

- Lis `AGENTS.md` avant toute action.
- Commence par `git status --short` et préserve tout changement existant.
- Ne lance aucune commande destructive.
- Ne fais aucun commit, push, tag, pull request ou déploiement.
- Ne demande pas de confirmation pour les commandes locales non destructives nécessaires.
- N’ajoute aucun backend, cloud, compte, synchronisation, multi-utilisateur, licence, IA ou application native.
- Conserve Next.js 16, React 19, TypeScript, Dexie V11 et l’approche offline-first.
- Respecte présentation/application/domaine/infrastructure.
- Aucun composant React de présentation ne doit requêter `db` directement.
- Aucun calcul financier métier ne doit être réalisé dans le rendu.
- N’utilise jamais `Number` ou un flottant pour additionner, soustraire, comparer ou agréger des montants métier affichés.
- Sépare toujours les montants par couple devise/échelle.
- Préserve migrations, sauvegardes, PIN, mode hors ligne et règles métier.
- Ne modifie jamais un seuil ou ne supprime jamais une assertion pour masquer une régression.
- Ne prétends jamais avoir testé un appareil que tu n’as pas réellement contrôlé.

## 2. Lectures obligatoires

Lis complètement :

- `DOCS/SPRINT12_ANALYSE.md`
- `DOCS/SPRINT12_CAHIER_DES_CHARGES.md`
- `DOCS/SPRINT11_ANALYSE.md`
- `DOCS/SPRINT11_CAHIER_DES_CHARGES.md`
- `DOCS/SPRINT11_VALIDATION_REPORT.md`
- `DOCS/SPRINT10_VALIDATION_REPORT.md`
- `DOCS/UI_UX.md`
- `DOCS/ARCHITECTURE.md`
- `DOCS/DATABASE.md`
- `DOCS/OFFLINE_FIRST.md`
- `DOCS/TESTING.md`
- `DOCS/SECURITY.md`
- `DOCS/KNOWN_LIMITATIONS.md`
- `DOCS/RELEASE_CHECKLIST.md`

Cette version de Next.js a des changements incompatibles avec des connaissances génériques. Lis aussi complètement les guides locaux pertinents, au minimum :

- `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`
- `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md`
- la documentation locale du bundling, des composants client/serveur et de l’optimisation identifiée dans `node_modules/next/dist/docs/`.

## 3. Attention au Sprint 11

Le rapport `SPRINT11_VALIDATION_REPORT.md` affirme que le sprint est terminé, mais il ne fournit pas la matrice physique obligatoire, le détail complet des commandes, le protocole A→B ni les mesures Lighthouse avant/après demandées par son cahier des charges.

Ne transforme pas cette absence de preuve en succès. Vérifie ce qui existe réellement. Les essais physiques non prouvés restent `NON EXÉCUTÉS`. Cette réserve ne t’empêche pas d’implémenter le Sprint 12.

## 4. Points du code à vérifier en priorité

L’état observé lors de la rédaction contient potentiellement :

- `MobileDashboard.tsx` important directement `db` et chargeant toutes les factures avant d’en garder trois ;
- le moteur complet de statistiques exécuté dès l’ouverture du tableau de bord ;
- des calculs avec `Number(money.*Minor)` pour créances, flux net et graphiques ;
- `clients/page.tsx` additionnant les créances via `Number` et sans séparation correcte des devises ;
- une valeur « Crédits inutilisés » toujours nulle ;
- Prospects relançant une requête à chaque caractère et affichant toute la liste ;
- de grandes pages clientes et composants monolithiques ;
- une navigation mobile différente de la référence Accueil/Prospects/Relances/Clients/Plus ;
- plusieurs FAB pouvant chevaucher la barre inférieure ;
- des gestes de balayage dont l’alternative visible doit être vérifiée ;
- des libellés incohérents : « Nouveau client » pointant vers un prospect, et « Ajouter l’heure du journal » pointant vers les relances.

Vérifie chaque point dans l’état actuel. Corrige seulement ce qui est confirmé et recherche les occurrences équivalentes dans tout le dépôt.

## 5. Phase 1 — Ligne de base

Avant toute modification :

1. inventorie versions, routes, composants clients, chunks et dépendances lourdes ;
2. exécute lint, TypeScript, tests, build, performance, Lighthouse et responsive ;
3. conserve codes, durées et sorties utiles ;
4. mesure au moins cinq fois `/` et `/prospects`, puis calcule médiane et dispersion ;
5. relève FCP, LCP, TBT, CLS, JavaScript initial et plus gros chunk ;
6. profile les rendus et requêtes sur `/`, `/prospects`, `/clients`, `/invoices`, `/follow-ups` et `/statistics` ;
7. utilise le jeu volumique existant ;
8. compte les données réellement chargées et rendues ;
9. mesure les parcours mobiles en temps et nombre de gestes ;
10. relève erreurs console, HTTP, réseau et accessibilité.

Ne commence pas l’optimisation avant d’avoir enregistré cette référence dans tes notes de travail.

## 6. Phase 2 — Intégrité et architecture

### A. Montants exacts

- Recherche tous les usages de `Number`, `parseFloat`, addition et soustraction sur `amountMinor`, `balanceMinor`, `billedMinor`, `collectedMinor`, `expensesMinor`, `receivableMinor` ou équivalents.
- Corrige tout calcul métier avec `bigint` ou les utilitaires exacts existants.
- Le mouvement net affiché doit être exact, y compris au-delà de `Number.MAX_SAFE_INTEGER`.
- Regroupe toujours devise et échelle.
- Les ratios visuels peuvent devenir des nombres seulement après calcul exact, avec bornage explicite. Ils ne servent jamais de valeur financière affichée.
- Ajoute des tests de grandes valeurs, flux négatif, zéro et multi-devises.

### B. Couches

- Retire l’import direct de `db` depuis la présentation.
- Ajoute dans les dépôts/cas d’usage des lectures ciblées, telles que les dernières factures limitées et ordonnées.
- Ne place pas de formule financière dans un hook ou composant.
- Évite toute migration Dexie si les index actuels suffisent.
- Si un nouvel index est réellement nécessaire, crée une migration additive, teste V10→nouvelle version et V11→nouvelle version, puis mets à jour sauvegarde et documentation si nécessaire.

### C. Données factuelles

- Supprime ou remplace toute valeur simulée, axe factice ou indicateur sans source.
- N’affiche pas « Crédits inutilisés » si le produit ne gère pas ce concept.
- Corrige les libellés trompeurs sans changer la règle métier.

## 7. Phase 3 — Performance

### A. Tableau de bord

- Ne calcule pas tous les détails de `/statistics` si le tableau de bord n’en affiche qu’une partie.
- Crée un cas d’usage de lecture compact si cela réduit réellement les données et calculs.
- Charge les transactions récentes avec une limite au niveau dépôt.
- Limite les graphiques à une ou deux vues utiles et accessibles.
- Préserve dépenses, flux net, créances, relances et multi-devises.

### B. Chargement JavaScript

- Utilise le rapport de build et le profilage.
- Diffère PDF, scanner, graphiques détaillés et éditeurs rares si leur présence initiale est confirmée.
- Vérifie qu’un import dynamique quitte réellement le chunk initial.
- Fournis squelette ou fallback accessible.
- Vérifie le chargement hors ligne de chaque chunk différé après installation et visite prévues.
- Ne disperse pas `dynamic()` sans bénéfice mesuré.

### C. Listes et Dexie

- Évite `toArray()` + tri complet lorsqu’une requête indexée et limitée est possible.
- Implémente pagination stable, « Afficher plus » ou rendu progressif sur les listes qui le nécessitent.
- Conserve ordre, filtres, mises à jour réactives, focus et position.
- N’introduis une virtualisation que si le gain est démontré et l’accessibilité testée.

### D. Recherche

- Évite une lecture ou un calcul lourd à chaque caractère.
- Utilise une temporisation courte ou `useDeferredValue` si pertinent.
- Empêche qu’un résultat ancien remplace le plus récent.
- Conserve la saisie immédiate et les règles de recherche existantes.

### E. Rendus React

- Profile avant d’ajouter `memo`, `useMemo` ou `useCallback`.
- Stabilise seulement les calculs et props coûteux identifiés.
- Réduis les états dupliqués et effets qui chargent les mêmes données.
- Découpe les composants trop larges par responsabilité, pas uniquement par taille de fichier.

## 8. Phase 4 — Ergonomie mobile

### A. Navigation

- Évalue et implémente une barre de cinq zones maximum fondée sur Accueil, Prospects, Relances, Clients et Plus, sauf preuve utilisateur contraire documentée.
- Ajoute `aria-current="page"` ou valeur appropriée à la destination active.
- Assure des cibles tactiles de 44 × 44 px environ et la zone sûre.
- Le menu Plus restitue le focus à son déclencheur.
- Aucun module existant ne devient introuvable.

### B. Actions

- Nouveau prospect, facture et dépense en deux gestes maximum.
- Un seul appel principal dominant par écran.
- Supprime les doublons et chevauchements entre FAB de page, FAB global, barre, bannière réseau et invite PWA.
- Une action par balayage possède toujours une alternative visible et accessible.
- Corrige tous les libellés inexacts.

### C. Prospects et filtres

- Sur mobile, remplace la rangée de sélecteurs par un panneau accessible si cela améliore réellement la densité.
- Affiche nombre et puces des filtres actifs.
- Fournis Appliquer, Réinitialiser et état Aucun résultat.
- Conserve recherche, filtres et position lors de l’ouverture puis du retour d’une fiche.
- Affiche un nombre de résultats.

### D. Formulaires

- Vérifie tous les `inputMode`, types, labels, messages et zones de validation.
- Garde le champ actif visible avec le clavier.
- Préserve la saisie après erreur.
- Avertis avant l’abandon d’une saisie non enregistrée lorsque le risque existe.
- Une barre fixe ne masque ni dernier champ, ni erreur, ni navigation système.

### E. États et contenu

- Utilise squelettes pour listes et calculs visibles.
- Distingue base vide, aucun résultat et erreur.
- Toute erreur dit si les données sont intactes et quelle action entreprendre.
- Les graphiques ont un équivalent textuel ; zéro ne produit pas une barre positive trompeuse.
- Respecte mode sombre, zoom 200 % et réduction des animations.

## 9. Objectifs mesurés

Dans le même protocole avant/après :

- Lighthouse Performance `/` ≥ 85 ;
- Lighthouse Performance `/prospects` ≥ 85 ;
- Accessibilité ≥ 98 ;
- Bonnes pratiques = 100 ;
- LCP ≤ 2,5 s ;
- TBT ≤ 300 ms ;
- CLS ≤ 0,1 ;
- recherche et filtres : médiane ≤ 300 ms sur le jeu représentatif ;
- zéro débordement essentiel de 320 à 1440 px ;
- zéro violation axe critique ou sérieuse ;
- zéro régression financière, IndexedDB, sauvegarde, PWA ou hors ligne.

Publie toutes les valeurs exactes. Si une cible reste manquée, conserve le test, explique la cause et classe l’écart.

## 10. Tests à créer ou adapter

Ajoute des tests qui auraient échoué avant chaque correction :

- grandes valeurs monétaires et multi-devises ;
- mouvement net exact ;
- lecture limitée et ordonnée des transactions récentes ;
- pagination stable sans doublon ;
- recherche différée sans résultat obsolète ;
- navigation active et focus du menu Plus ;
- alternative visible au balayage ;
- filtres mobiles, puces, réinitialisation et restauration du contexte ;
- absence de chevauchement aux viewports 320, 360, 390 et paysage ;
- états chargement/vide/erreur ;
- imports différés en ligne puis hors ligne ;
- parcours prospect, facture, paiement et dépense ;
- erreurs console et réseau inattendues égales à zéro.

Crée si utile `scripts/e2e-sprint12-test.js` et ajoute `test:sprint12` dans `package.json`.

## 11. Validation finale

Exécute dans cet ordre :

```text
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd test -- --run
npm.cmd run build
npm.cmd run test:pwa
npm.cmd run test:accessibility
npm.cmd run test:responsive
npm.cmd run test:performance
npm.cmd run test:lighthouse
npm.cmd run test:pwa-update
npm.cmd run test:v1-beta
npm.cmd run test:sprint12
```

Si `test:sprint12` n’existe pas, crée-le ou justifie précisément pourquoi les scénarios sont couverts ailleurs. Relance les contrôles affectés après toute correction tardive.

## 12. Recette physique

Si tu contrôles réellement les appareils, teste Android milieu de gamme, iPhone et tablette : portrait, paysage, clavier, gestes, Retour, zones sûres, réseau lent, hors ligne, barres fixes et temps perçu.

Consigne modèle, OS, navigateur, build, scénario, attendu, observé et preuve. Sinon, inscris `NON EXÉCUTÉ` et limite le verdict à une validation conditionnelle.

## 13. Documentation et rapport

Mets à jour les documents affectés et crée `DOCS/SPRINT12_VALIDATION_REPORT.md` contenant :

1. verdict ;
2. état initial réel ;
3. anomalies et gravités ;
4. fichiers modifiés ;
5. corrections d’architecture et d’exactitude ;
6. tableau Lighthouse avant/après avec toutes les exécutions et médianes ;
7. taille des chunks avant/après ;
8. requêtes et volumes avant/après ;
9. résultats exacts des commandes avec codes et durées ;
10. tests physiques exécutés et non exécutés ;
11. limites et défauts restants ;
12. état Git final ;
13. décision finale.

Utilise exactement l’un des verdicts :

- `SPRINT 12 VALIDÉ` seulement si automatisation et recette mobile physique obligatoire sont prouvées ;
- `SPRINT 12 VALIDATION CONDITIONNELLE` si le code est conforme mais que la recette physique ou une cible réelle reste non prouvée ;
- `SPRINT 12 NON VALIDÉ` si un P0/P1, une erreur financière, une perte de données ou une régression essentielle subsiste.

Commence maintenant par l’état Git et la ligne de base mesurée. Ensuite seulement, corrige, teste, mesure à nouveau et rédige le rapport.

---
