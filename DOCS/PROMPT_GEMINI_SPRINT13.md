# Prompt complet pour Gemini — Sprint 13

Copiez l’intégralité du prompt ci-dessous dans Gemini.

---

Tu travailles dans le dépôt :

`D:\dev\samatech-crm`

Implémente et valide le **Sprint 13 — Comptes de trésorerie, budgets et prévisions**.

Tu dois auditer l’état réel après le Sprint 12, développer le module complet, ajouter migration et tests, exécuter les validations, corriger les défauts rencontrés et produire un rapport factuel. Ne te limite pas à une proposition.

## 1. Règles absolues

- Lis `AGENTS.md` avant toute action.
- Commence par `git status --short` et préserve tous les changements existants.
- Le dépôt peut contenir des modifications du Sprint 12 : ne les annule et ne les écrase jamais.
- Ne lance aucune commande destructive.
- Ne fais aucun commit, push, tag, pull request ou déploiement.
- Exécute sans demander de confirmation les commandes locales non destructives nécessaires.
- N’ajoute aucun backend, cloud, synchronisation, compte utilisateur, licence, multi-utilisateur, IA ou connexion bancaire.
- Respecte présentation/application/domaine/infrastructure.
- Aucun composant React ne doit appeler Dexie directement.
- Utilise des transactions pour toute écriture multi-table.
- Les paiements et dépenses restent les sources de vérité des mouvements réels.
- Ne duplique jamais leur montant dans un registre indépendant.
- Utilise des unités mineures entières, `BigInt` pour agréger et une validation avant conversion.
- Ne mélange jamais devise ou échelle.
- Ne supprime physiquement aucune opération financière depuis l’interface.
- Ne présente jamais un budget comme une dépense, une prévision comme une certitude, ou un solde de trésorerie comme un bénéfice comptable.
- Ne prétends jamais avoir exécuté un test physique sans preuve réelle.

## 2. Documents obligatoires

Lis complètement :

- `DOCS/SPRINT13_ANALYSE.md`
- `DOCS/SPRINT13_CAHIER_DES_CHARGES.md`
- `DOCS/SPRINT12_ANALYSE.md`
- `DOCS/SPRINT12_CAHIER_DES_CHARGES.md`
- `DOCS/SPRINT12_VALIDATION_REPORT.md` s’il existe
- `DOCS/DEPENSES_ANALYSE.md`
- `DOCS/DEPENSES_CAHIER_DES_CHARGES.md`
- `DOCS/ARCHITECTURE.md`
- `DOCS/DATABASE.md`
- `DOCS/RULES.md`
- `DOCS/OFFLINE_FIRST.md`
- `DOCS/SECURITY.md`
- `DOCS/TESTING.md`
- `DOCS/UI_UX.md`
- `DOCS/KNOWN_LIMITATIONS.md`
- `DOCS/RELEASE_CHECKLIST.md`

Lis aussi la documentation Next.js 16 locale pertinente dans `node_modules/next/dist/docs/` avant de modifier les pages, le chargement ou la PWA.

## 3. Audit initial

Avant de coder :

1. relève l’état Git et les modifications en cours ;
2. vérifie la version Dexie réelle et la dernière migration ;
3. inventorie toutes les tables et collections de sauvegarde ;
4. vérifie le format réel des paiements, dépenses, factures, statistiques et paramètres monétaires ;
5. inspecte les transactions actuelles de paiement et dépense ;
6. vérifie la compatibilité réelle des sauvegardes V10/V11 ;
7. relève les usages de `Number` sur montants et corrige ceux qui affecteraient le module ;
8. exécute lint, TypeScript, tests et build pour connaître la ligne de base ;
9. distingue les défauts préexistants des régressions ;
10. choisis la prochaine version Dexie disponible seulement après cet audit.

La version attendue est V12 si le Sprint 12 n’a pas modifié le schéma. Si la version réelle diffère, utilise la suivante et documente l’écart.

## 4. Architecture à créer

Crée un module `src/modules/treasury/` séparant :

- domaine des comptes, affectations, opérations, budgets et prévisions ;
- cas d’usage d’écriture et de lecture ;
- dépôt Dexie ;
- composants de présentation ;
- tests.

Les responsabilités attendues incluent :

- gérer les comptes ;
- affecter ou réaffecter paiements et dépenses ;
- créer/annuler transferts et ajustements ;
- calculer soldes et historique ;
- gérer budgets mensuels ;
- calculer prévisions 30/60/90 ;
- lire les alertes du tableau de bord.

Les noms exacts peuvent suivre les conventions du dépôt, mais aucune logique financière ne doit rester dans les composants.

## 5. Migration Dexie

Ajoute cinq collections métier dans une migration additive :

- `treasuryAccounts` ;
- `treasuryAllocations` ;
- `treasuryOperations` ;
- `expenseBudgets` ;
- `treasuryForecastItems`.

Utilise les modèles et index de `SPRINT13_CAHIER_DES_CHARGES.md`, adaptés seulement après analyse des requêtes.

Exigences :

- aucun `upgrade()` ne modifie les paiements, dépenses ou factures existants ;
- aucun compte, solde ou affectation n’est inventé ;
- toutes les nouvelles tables commencent vides ;
- vraie migration depuis une base V11 remplie, fermeture puis réouverture ;
- si le schéma initial est supérieur, teste depuis les deux versions précédentes pertinentes ;
- aucune donnée ou index historique perdu.

## 6. Comptes et soldes

Implémente les types : Caisse, Wave, Orange Money, Banque et Autre.

Chaque compte possède nom normalisé unique, devise, échelle, solde d’ouverture et date d’ouverture. Le solde vaut au début de cette date ; les mouvements du jour sont ensuite inclus.

Calcule exactement :

```text
opening
+ active allocated payments
- active allocated expenses
+ active incoming transfers
- active outgoing transfers
+ active IN adjustments
- active OUT adjustments
```

- les groupes monétaires restent séparés ;
- un solde négatif est autorisé mais signalé ;
- un compte avec historique n’est jamais supprimé ;
- devise, échelle, ouverture et solde initial deviennent immuables après le premier mouvement ;
- un compte archivé reste dans les rapports et refuse les nouvelles écritures.

Ajoute tests de grandes valeurs, zéro, négatif, dépassement et multi-devises.

## 7. Affectations

Ne copie ni montant, ni devise, ni date dans `treasuryAllocations`. Lis toujours la source paiement ou dépense.

Règles :

- une source `ACTIVE` seulement ;
- même devise et échelle que le compte ;
- date ≥ ouverture ;
- une seule affectation active ;
- nouvelle affectation sur compte actif ;
- réaffectation = annulation motivée + nouvelle affectation dans une transaction ;
- paiement `REVERSED` ou dépense `CANCELLED` automatiquement exclu du solde ;
- mouvements historiques non affectés affichés séparément.

Étends les parcours de nouveau paiement et nouvelle dépense pour proposer un compte compatible. La création de la source, l’affectation et les autres écritures existantes doivent être atomiques.

Si l’utilisateur n’affecte pas une écriture alors que cela reste autorisé, affiche clairement qu’elle n’entre pas dans le solde d’un compte.

## 8. Transferts et ajustements

### Transferts

- source ≠ destination ;
- même devise/échelle ;
- montant positif ;
- date compatible avec les deux ouvertures ;
- opération atomique et historique unique ;
- neutralité exacte sur le total global ;
- annulation motivée sans suppression ;
- avertissement renforcé si la source devient négative.

Un transfert n’est ni un encaissement, ni une dépense et ne modifie pas le flux net.

### Ajustements

- compte, sens, date, montant, libellé et motif requis ;
- effet uniquement sur le solde ;
- exclusion des indicateurs commerciaux ;
- annulation motivée ;
- aide visible expliquant la différence avec revenu et dépense.

## 9. Budgets

Implémente un budget mensuel par catégorie, catégorie personnalisée normalisée, devise et échelle.

Calcule :

```text
actual = active, non-archived expenses in month/category
remaining = budget - actual
overrun = max(actual - budget, 0)
```

- les dépenses annulées sont exclues ;
- le réalisé ne dépend pas du compte affecté ;
- les catégories sans budget restent visibles ;
- seuil d’alerte à 80 % et dépassement ;
- pourcentage dérivé uniquement pour affichage ;
- unicité garantie par clé stable ;
- aucune devise mélangée.

Ajoute vue mois courant, mois précédent/suivant et sélection explicite.

## 10. Prévisions

Implémente les éléments manuels `INFLOW`/`OUTFLOW` et les créances liées aux factures.

Règles :

- `PLANNED`, `REALIZED`, `CANCELLED` ;
- une prévision réalisée n’écrit jamais silencieusement paiement ou dépense ;
- date, montant, devise, sens et libellé requis ;
- compte facultatif mais compatible s’il est choisi ;
- une facture liée ne peut contribuer au-delà de son solde actuel ;
- aucun double comptage entre échéance automatique et élément lié ;
- facture en retard exclue de la projection datée sans date attendue explicite ;
- budgets jamais transformés automatiquement en sorties ;
- transferts futurs neutres globalement.

Projette 30, 60 et 90 jours depuis une date d’arrêté, pour chaque groupe monétaire :

- solde actuel ;
- factures attendues ;
- autres entrées ;
- sorties prévues ;
- solde projeté ;
- créances en retard non planifiées.

Affiche « Prévision non garantie » et les hypothèses incluses.

## 11. Sauvegarde et restauration

Ajoute les cinq collections à la sauvegarde actuelle. `securitySettings` reste exclue.

Corrige la validation pour qu’elle dépende de `sourceSchemaVersion` :

- V10 : 20 collections historiques obligatoires ;
- V11 : 21, avec `expenses` ;
- nouvelle version : toutes les collections actuelles.

Procédure obligatoire :

1. parser la structure sûre ;
2. vérifier le checksum sur l’enveloppe originale ;
3. vérifier les collections obligatoires de la version source ;
4. rejeter inconnues, doublons et omissions historiques ;
5. adapter en mémoire avec collections nouvelles vides ;
6. valider toutes les références et règles ;
7. restaurer toutes les tables métier dans une transaction ;
8. prouver le rollback.

Teste V10, V11, nouvelle version, checksum altéré, références orphelines, double affectation active, compte incompatible et collection manquante.

## 12. Interface

Crée :

- `/treasury` ;
- `/treasury/accounts` ;
- `/treasury/accounts/new` ;
- `/treasury/accounts/[id]` ;
- `/treasury/transfers/new` ;
- `/treasury/budgets` ;
- `/treasury/forecast`.

Intègre Trésorerie dans la navigation sans surcharger la barre mobile. Utilise le menu Plus si nécessaire.

Mobile-first : cartes à 320 px, filtres en panneau, actions tactiles, aucun tableau horizontal essentiel, focus correct, mode sombre, valeurs négatives textuelles et graphiques avec équivalent accessible.

Le tableau de bord principal affiche une synthèse compacte avec liens vers le détail.

## 13. Alertes

Ajoute des alertes calculées :

- compte négatif ;
- mouvement non affecté ;
- budget à 80 % ou dépassé ;
- prévision négative 30/60/90 ;
- créance en retard non planifiée.

Elles ne bloquent pas les saisies légitimes et restent regroupées par devise.

## 14. Tests

Ajoute des tests unitaires, dépôts, transactions, migration, sauvegarde, composants et E2E pour tous les cas du cahier des charges.

Crée `scripts/e2e-sprint13-test.js` et `test:sprint13` couvrant au minimum :

1. migration remplie ;
2. comptes Caisse et Wave ;
3. paiement et dépense affectés ;
4. transfert neutre ;
5. contrepassation et annulation ;
6. ajustement ;
7. mouvement historique non affecté puis affecté ;
8. budget et dépassement ;
9. prévisions 30/60/90 ;
10. facture en retard ;
11. export/restauration ;
12. fonctionnement hors ligne ;
13. aucun mélange de devises ;
14. aucune erreur console ou réseau inattendue.

## 15. Commandes finales

Exécute dans cet ordre et publie codes, durées et résultats exacts :

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
npm.cmd run test:sprint13
```

Relance les suites affectées après toute correction tardive. Ne transforme pas un test non exécuté en succès.

## 16. Documentation et rapport

Mets à jour `DATABASE.md`, `RULES.md`, `ARCHITECTURE.md`, `UI_UX.md`, `TESTING.md`, `OFFLINE_FIRST.md`, `USER_GUIDE.md`, `KNOWN_LIMITATIONS.md`, `RELEASE_CHECKLIST.md`, README et notes de version selon les changements réels.

Crée `DOCS/SPRINT13_VALIDATION_REPORT.md` avec :

1. verdict ;
2. état initial, version Dexie et collections ;
3. modèle et architecture implémentés ;
4. fichiers modifiés ;
5. preuves de migration ;
6. matrice de calcul des soldes ;
7. neutralité des transferts ;
8. budgets et prévisions de référence ;
9. compatibilité sauvegardes V10/V11/nouvelle version ;
10. tests et commandes avec durées ;
11. E2E et hors-ligne ;
12. recette physique exécutée ou `NON EXÉCUTÉE` ;
13. anomalies restantes ;
14. état Git final ;
15. décision finale.

Utilise exactement un verdict :

- `SPRINT 13 VALIDÉ` seulement si automatisation, exactitude et recette mobile physique sont prouvées ;
- `SPRINT 13 VALIDATION CONDITIONNELLE` si le code est conforme mais une recette physique reste non exécutée ;
- `SPRINT 13 NON VALIDÉ` en cas de double comptage, erreur monétaire, perte de données, restauration incompatible ou P0/P1.

Commence maintenant par l’audit de l’état final du Sprint 12 et la ligne de base. Implémente ensuite le module, teste, corrige et rédige le rapport.

---
