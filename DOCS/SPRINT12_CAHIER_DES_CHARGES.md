# Cahier des charges — Sprint 12

## Performances et ergonomie mobile

## 1. Objet

Améliorer la rapidité réelle et perçue de SAMTECH CRM sur smartphone, simplifier les parcours fréquents et corriger les écarts d’architecture ou d’exactitude découverts dans les écrans mobiles, sans ajouter de fonctionnalité métier majeure.

## 2. Contraintes

- Conserver Next.js 16, React 19, TypeScript, Dexie V11 et le fonctionnement PWA local.
- Lire les guides locaux Next.js avant toute modification.
- Respecter présentation/application/domaine/infrastructure.
- Interdire l’accès Dexie direct depuis les composants de présentation.
- Garder les calculs et agrégats métier hors du rendu.
- Utiliser une représentation monétaire exacte et séparer devise/échelle.
- Préserver les migrations, sauvegardes et données existantes.
- Préserver l’utilisation hors ligne, y compris les chunks différés.
- Ne pas ajouter backend, cloud, multi-utilisateur, licence, IA ou application native.
- Préserver les changements existants.
- Ne faire aucun commit, push, tag ou déploiement sans autorisation.
- Ne pas déclarer un test physique réussi sans preuve réelle.

## 3. Audit préalable obligatoire

Avant toute correction :

- relever l’état Git et les versions ;
- exécuter les mesures actuelles de build, performance et Lighthouse ;
- relever le JavaScript initial par route et les principaux chunks ;
- inventorier les composants clients et les imports lourds ;
- profiler `/`, `/prospects`, `/clients`, `/invoices`, `/follow-ups` et `/statistics` ;
- compter les lectures Dexie, volumes chargés et rendus lors d’une recherche ;
- vérifier la navigation à 320, 360, 390 et 844×390 ;
- mesurer les parcours fréquents en nombre de gestes et en temps ;
- inventorier les usages de `Number` sur montants ou quantités exactes ;
- vérifier les agrégations multi-devises ;
- auditer le rapport Sprint 11 et conserver comme non exécutées les preuves absentes.

## 4. Exigences de performance

### S12-P01 — Budget mesurable

Créer un rapport avant/après reproductible comprenant :

- scores Lighthouse et métriques FCP, LCP, TBT, CLS ;
- au moins cinq passages par route et médiane ;
- taille totale des ressources de démarrage ;
- JavaScript chargé par route et plus gros chunk ;
- durée des requêtes et du rendu ;
- temps du jeu volumique existant ;
- environnement, throttling, build et hash.

### S12-P02 — Chargement différé

Charger à la demande les fonctionnalités lourdes non nécessaires au premier écran. Vérifier notamment PDF, scanner, formulaires secondaires, graphiques détaillés et panneaux rarement ouverts.

Un import dynamique n’est accepté que si :

- il réduit réellement le chargement de la route cible ;
- un état de chargement accessible existe ;
- le module est disponible hors ligne après la stratégie de cache prévue ;
- les erreurs de chargement sont traitées ;
- aucun code métier critique n’est déplacé dans une frontière fragile.

### S12-P03 — Frontières client

Réduire les composants clients aux sous-arbres qui nécessitent IndexedDB, événements ou état interactif. Ne pas transformer artificiellement des pages locales en composants serveur qui tenteraient de lire Dexie.

Découper les composants monolithiques lorsque cela réduit les rerendus ou clarifie les responsabilités, sans multiplier les abstractions inutiles.

### S12-P04 — Requêtes Dexie

- aucune lecture complète suivie d’un tri en présentation lorsqu’un dépôt peut retourner une limite ordonnée ;
- requêtes filtrées et indexées lorsqu’un index existant convient ;
- pagination ou chargement progressif des longues listes ;
- ordre stable et absence de doublons ;
- mises à jour réactives correctement reflétées ;
- aucune migration Dexie sauf nécessité démontrée ;
- toute migration éventuelle est additive, transactionnelle et testée depuis V10/V11.

### S12-P05 — Recherche

Les recherches à saisie continue doivent éviter les calculs coûteux à chaque frappe. Une temporisation courte ou `useDeferredValue` peut être employée après mesure. L’entrée reste immédiatement contrôlable et les résultats obsolètes ne remplacent pas une requête plus récente.

### S12-P06 — Rendu des listes

Prospects, Clients, Factures, Paiements, Relances et Dépenses doivent rester utilisables avec les volumes de référence. Choisir selon la mesure : pagination, « Afficher plus », fenêtre de rendu ou regroupement.

La solution doit préserver clavier, lecteur d’écran, focus, retour de fiche et position de défilement.

## 5. Exigences d’intégrité technique

### S12-I01 — Exactitude monétaire

Supprimer tout calcul métier affiché fondé sur `Number(amountMinor)`, addition flottante ou mélange de devises.

Le mouvement net, les créances et tous les regroupements doivent utiliser `bigint` ou les utilitaires exacts existants. Les ratios graphiques peuvent être convertis uniquement après que le montant exact a été calculé, avec bornes et sans réutiliser le ratio comme valeur métier.

### S12-I02 — Couches

`MobileDashboard` et les autres composants appellent des cas d’usage ou services de lecture. Ils ne doivent pas importer directement `db` ni construire des agrégats financiers métier.

Créer des méthodes ciblées, par exemple transactions récentes limitées, plutôt que de charger une collection entière.

### S12-I03 — Devises

Une carte ne doit jamais additionner XOF, EUR ou des échelles différentes. L’interface affiche la devise principale et signale les autres groupes, ou présente chaque groupe séparément.

### S12-I04 — Informations réelles

Supprimer ou renommer toute valeur simulée, codée en dur ou sans source métier. Aucun « crédit inutilisé », axe graphique ou libellé ne doit suggérer une donnée réellement calculée si elle ne l’est pas.

## 6. Exigences d’ergonomie

### S12-U01 — Navigation inférieure

- cinq zones maximum ;
- icône et libellé visibles ;
- destination active annoncée visuellement et par `aria-current` ;
- cible tactile d’environ 44 × 44 px minimum ;
- respect de la zone sûre ;
- ordre cohérent avec les tâches les plus fréquentes ;
- focus correctement géré dans le menu Plus ;
- thème et réglages secondaires non prioritaires par rapport aux modules métier.

La configuration de référence à évaluer est Accueil, Prospects, Relances, Clients et Plus.

### S12-U02 — Actions rapides

- Nouveau prospect, nouvelle facture et nouvelle dépense accessibles en deux gestes maximum ;
- libellés exacts ;
- un seul bouton principal dominant par écran ;
- aucun chevauchement entre FAB, barre inférieure, bannière réseau et invite de mise à jour ;
- action équivalente visible lorsque le balayage est proposé.

### S12-U03 — Tableau de bord

Afficher prioritairement : relances, factures échues, encaissements, dépenses, flux net et actions rapides. Limiter les graphiques détaillés et renvoyer vers Statistiques.

Les cartes doivent avoir un titre exact, une période explicite et une valeur accessible sous forme textuelle. Aucun axe factice ni hauteur minimale trompeuse ne doit suggérer une valeur positive nulle.

### S12-U04 — Filtres mobiles

Sur petit écran, les filtres complexes s’ouvrent dans un `Sheet` ou écran dédié avec :

- nombre de filtres actifs ;
- valeurs sélectionnées ;
- puces récapitulatives ;
- actions Appliquer et Réinitialiser ;
- conservation au retour d’une fiche ;
- état « aucun résultat » avec réinitialisation.

### S12-U05 — Listes mobiles

Chaque carte expose uniquement les informations nécessaires à la décision. La carte Prospect doit au minimum permettre de comprendre identité, statut, intérêt et prochaine action. Les actions visibles ne doivent pas provoquer de navigation accidentelle lors d’un balayage.

### S12-U06 — Formulaires

- labels persistants ;
- clavier adapté via `inputMode`, type et auto-complétion prudente ;
- champ actif visible avec le clavier virtuel ;
- erreurs proches du champ et annoncées ;
- saisie conservée après une erreur ;
- avertissement avant abandon d’une saisie non sauvegardée ;
- barre d’action fixe seulement si elle ne masque aucun contenu ;
- boutons de validation inactifs uniquement pour une raison compréhensible.

### S12-U07 — États

Utiliser les composants partagés pour : squelette, liste vide, aucun résultat, erreur récupérable, succès et opération longue. Les opérations locales courtes ne doivent pas afficher un faux chargement réseau.

### S12-U08 — Accessibilité et mouvement

- WCAG 2.2 AA lorsque applicable ;
- ordre de focus logique ;
- `aria-current`, noms accessibles et annonces dynamiques ;
- aucune action uniquement gestuelle ou colorée ;
- valeurs textuelles pour les graphiques ;
- respect de `prefers-reduced-motion` ;
- zoom 200 % et texte agrandi ;
- pas de focus perdu après fermeture d’un panneau.

## 7. Objectifs de qualité

| Indicateur | Cible |
|---|---:|
| Lighthouse Performance `/` | ≥ 85 |
| Lighthouse Performance `/prospects` | ≥ 85 |
| Lighthouse Accessibilité | ≥ 98 |
| Bonnes pratiques | 100 |
| LCP | ≤ 2,5 s |
| TBT | ≤ 300 ms |
| CLS | ≤ 0,1 |
| Recherche/filtres représentatifs | médiane ≤ 300 ms |
| Débordements essentiels 320–1440 px | 0 |
| Violations axe critiques/sérieuses | 0 |
| Erreurs financières ou multi-devises | 0 |

La cible est évaluée sur la médiane d’exécutions répétées. Une cible manquée doit être publiée, pas contournée en modifiant le test.

## 8. Tests obligatoires

### Unitaires et domaine

- soustraction exacte encaissements/dépenses sur grandes valeurs ;
- signe du flux net ;
- regroupement par devise et échelle ;
- ratios graphiques bornés sans altérer les valeurs ;
- pagination stable et sans doublon ;
- recherche temporisée et résultats les plus récents.

### Dépôts et application

- requête limitée des factures récentes ;
- listes paginées et filtres combinés ;
- mise à jour Dexie après ajout ou archivage ;
- nombre de lectures attendu pour les parcours critiques ;
- aucune dépendance présentation → `db` sur les fichiers corrigés.

### Composants

- navigation active avec `aria-current` ;
- ouverture/fermeture et restitution du focus du menu Plus ;
- alternatives visibles aux gestes ;
- panneau de filtres, puces et réinitialisation ;
- persistance des filtres et de la position ;
- squelettes, erreurs et états vides ;
- absence de chevauchement des barres fixes aux viewports cibles.

### E2E

- nouveau prospect en moins d’une minute dans le script ;
- recherche et filtres sur jeu volumique ;
- ouverture d’une fiche et retour avec contexte ;
- facture, paiement et dépense exacts ;
- navigation mobile complète ;
- mode hors ligne avec les imports différés ;
- PDF et scanner chargés uniquement à l’usage ;
- aucune erreur console, HTTP ou exception inattendue.

### Physiques

- Android milieu de gamme ;
- iPhone récent et, si disponible, plus ancien supporté ;
- tablette ;
- portrait, paysage, clavier, tactile, zone sûre et réseau instable.

Tout test matériel absent est marqué `NON EXÉCUTÉ`.

## 9. Commandes de validation

Exécuter au minimum :

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
```

Ajouter `test:sprint12` si un parcours dédié est créé et l’exécuter dans la validation finale.

## 10. Documentation et rapport

Mettre à jour les documents impactés, notamment `UI_UX.md`, `ARCHITECTURE.md`, `TESTING.md`, `KNOWN_LIMITATIONS.md`, `RELEASE_CHECKLIST.md`, `USER_GUIDE.md` et les notes de version.

Créer `DOCS/SPRINT12_VALIDATION_REPORT.md` avec : état initial, fichiers modifiés, défauts corrigés, architecture, mesures avant/après, budget par route, tests et durées, recette physique, limites, état Git et verdict.

## 11. Critères d’acceptation

1. aucune présentation corrigée n’accède directement à Dexie ;
2. aucun montant métier affiché n’est calculé avec `Number` ;
3. les devises ne sont jamais fusionnées ;
4. les listes volumineuses restent réactives ;
5. recherche et filtres conservent le contexte ;
6. la navigation correspond aux tâches prioritaires ;
7. aucun bouton fixe ne masque une action ou un contenu ;
8. les libellés et valeurs sont factuels ;
9. les budgets sont mesurés avant/après ;
10. les commandes obligatoires réussissent ;
11. PWA, hors-ligne, sauvegarde et calculs ne régressent pas ;
12. aucun P0/P1 ne reste ouvert ;
13. les essais physiques manquants sont explicitement indiqués ;
14. aucune action Git ou publication non autorisée n’a eu lieu.

Sans recette mobile physique, le verdict maximal est `SPRINT 12 VALIDATION CONDITIONNELLE`.
