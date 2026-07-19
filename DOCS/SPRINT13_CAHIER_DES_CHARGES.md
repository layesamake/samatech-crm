# Cahier des charges — Sprint 13

## Comptes de trésorerie, budgets et prévisions

## 1. Objet

Ajouter à SAMTECH CRM un registre fiable des comptes de trésorerie, des budgets mensuels de dépenses et des prévisions à 30, 60 et 90 jours, entièrement local, hors ligne et compatible avec les données existantes.

## 2. Contraintes structurantes

- Respecter les couches présentation/application/domaine/infrastructure.
- Interdire les requêtes Dexie et calculs financiers dans les composants React.
- Utiliser des transactions pour toute écriture multi-table.
- Conserver les paiements et dépenses comme sources de vérité.
- Ne jamais dupliquer un montant réel dans un second registre indépendant.
- Stocker les montants en unités mineures entières sûres et agréger via `BigInt`.
- Ne jamais mélanger deux devises ou échelles.
- Utiliser `Africa/Dakar` et des dates civiles explicites.
- Conserver fonctionnement mobile-first, PWA et hors ligne.
- Préserver toutes les migrations et sauvegardes existantes.
- Ne pas ajouter backend, cloud, connexion bancaire, IA ou multi-utilisateur.
- Ne pas supprimer physiquement une écriture financière depuis l’interface.
- Préserver les changements existants et auditer l’état final du Sprint 12.
- Aucun commit, push, tag ou déploiement sans autorisation.

## 3. Modèle de données

Les types ci-dessous sont la référence fonctionnelle. Les noms peuvent être ajustés uniquement pour rester cohérents avec les conventions réelles du dépôt.

### 3.1 Comptes

```ts
type TreasuryAccountType =
  | 'CASH'
  | 'WAVE'
  | 'ORANGE_MONEY'
  | 'BANK'
  | 'OTHER';

interface TreasuryAccountRecord {
  id: string;
  name: string;
  normalizedName: string;
  type: TreasuryAccountType;
  currency: string;
  currencyScale: number;
  openingBalanceMinor: number;
  openingDate: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}
```

### 3.2 Affectations

```ts
type TreasurySourceType = 'PAYMENT' | 'EXPENSE';
type TreasuryAllocationStatus = 'ACTIVE' | 'CANCELLED';

interface TreasuryAllocationRecord {
  id: string;
  sourceType: TreasurySourceType;
  sourceId: string;
  accountId: string;
  status: TreasuryAllocationStatus;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
}
```

Le montant, la date, la devise et le statut sont lus depuis la source. Ils ne sont pas copiés dans l’affectation.

### 3.3 Opérations propres à la trésorerie

```ts
type TreasuryOperationKind = 'TRANSFER' | 'ADJUSTMENT';
type TreasuryAdjustmentDirection = 'IN' | 'OUT';
type TreasuryOperationStatus = 'ACTIVE' | 'CANCELLED';

interface TreasuryOperationRecord {
  id: string;
  kind: TreasuryOperationKind;
  operationDate: string;
  amountMinor: number;
  currency: string;
  currencyScale: number;
  sourceAccountId?: string;
  destinationAccountId?: string;
  accountId?: string;
  adjustmentDirection?: TreasuryAdjustmentDirection;
  label: string;
  reference?: string;
  note?: string;
  status: TreasuryOperationStatus;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
}
```

Un transfert utilise source et destination. Un ajustement utilise compte et sens. Les combinaisons invalides sont rejetées par le domaine.

### 3.4 Budgets

```ts
interface ExpenseBudgetRecord {
  id: string;
  uniqueKey: string;
  month: string; // YYYY-MM
  category: ExpenseCategory;
  customCategory?: string;
  normalizedCategoryKey: string;
  amountMinor: number;
  currency: string;
  currencyScale: number;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}
```

`uniqueKey` représente mois, catégorie normalisée, devise et échelle.

### 3.5 Prévisions

```ts
type ForecastDirection = 'INFLOW' | 'OUTFLOW';
type ForecastStatus = 'PLANNED' | 'REALIZED' | 'CANCELLED';
type ForecastSourceType = 'MANUAL' | 'INVOICE';

interface TreasuryForecastItemRecord {
  id: string;
  direction: ForecastDirection;
  expectedDate: string;
  label: string;
  amountMinor: number;
  currency: string;
  currencyScale: number;
  accountId?: string;
  sourceType: ForecastSourceType;
  sourceId?: string;
  note?: string;
  status: ForecastStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  cancellationReason?: string;
}
```

Un élément `INVOICE` doit référencer une facture non annulée de même devise et ne peut dépasser son solde courant lors du calcul.

## 4. Schéma Dexie

Utiliser la prochaine version disponible, normalement V12 si la base reste V11.

Index attendus, à adapter après audit :

```ts
treasuryAccounts:
  'id, &normalizedName, type, currency, archivedAt, [currency+currencyScale]'

treasuryAllocations:
  'id, sourceType, sourceId, accountId, status, [sourceType+sourceId], [accountId+status]'

treasuryOperations:
  'id, kind, operationDate, status, sourceAccountId, destinationAccountId, accountId, [status+operationDate]'

expenseBudgets:
  'id, &uniqueKey, month, category, currency, [month+currency]'

treasuryForecastItems:
  'id, expectedDate, direction, status, accountId, sourceType, sourceId, [status+expectedDate]'
```

La migration est additive. Elle ne modifie aucun paiement, dépense, facture ou paramètre existant.

## 5. Exigences fonctionnelles

### TRE-F01 — Créer un compte

Nom requis de 2 à 100 caractères, unique après normalisation parmi les comptes non archivés. Type, devise, échelle, solde et date d’ouverture requis. `OTHER` exige une note ou un libellé suffisamment descriptif.

Le solde d’ouverture peut être négatif, nul ou positif, dans la plage entière sûre.

### TRE-F02 — Modifier et archiver

Nom, note et type peuvent être modifiés. Devise, échelle, date et solde d’ouverture ne peuvent être modifiés après le premier mouvement actif. Avant tout mouvement, une modification est autorisée dans une transaction.

Un compte n’est jamais supprimé. L’archivage conserve le solde et l’historique, interdit les nouvelles écritures et demande confirmation si le solde est non nul.

### TRE-F03 — Affecter un paiement

Une affectation active peut être créée seulement si : paiement existant, `ACTIVE`, non archivé, date compatible, devise/échelle identiques et aucune autre affectation active.

La création du paiement et de son affectation, lorsqu’elles sont simultanées, doit être atomique avec la mise à jour de facture et la chronologie existante.

### TRE-F04 — Affecter une dépense

Même règle pour une dépense `ACTIVE`. La création simultanée dépense + affectation est transactionnelle.

### TRE-F05 — Réaffecter

La réaffectation exige un motif. Dans une transaction, l’ancienne affectation est annulée puis la nouvelle créée. Aucune période ne doit contenir deux affectations actives de la même source.

### TRE-F06 — Réagir aux annulations

Un paiement `REVERSED` ou une dépense `CANCELLED` ne participe plus au solde, même si son affectation reste dans l’historique. Aucune copie de montant ne doit rester comptée.

### TRE-F07 — Mouvements non affectés

Afficher paiements actifs et dépenses actives sans affectation, filtrables par date, type, mode et devise. Permettre l’affectation individuelle. Aucun compte par défaut n’est inventé.

### TRE-F08 — Transférer

Créer atomiquement un transfert logique entre deux comptes distincts compatibles. Il diminue la source, augmente la destination et laisse inchangé le total global de la devise.

Une annulation motivée neutralise les deux effets. Un transfert ne doit apparaître ni dans encaissements, ni dans dépenses, ni dans flux net.

### TRE-F09 — Ajuster

Un ajustement entrant ou sortant exige compte, date, montant, libellé et motif explicite. Il affecte le solde mais pas les indicateurs commerciaux.

### TRE-F10 — Calculer les soldes

Calculer à une date donnée selon la formule de l’analyse. Grouper les totaux par `(currency, currencyScale)`. Utiliser `BigInt` et rejeter un dépassement avant conversion ou affichage.

### TRE-F11 — Créer un budget

Créer ou modifier le budget d’une catégorie pour un mois. L’unicité est garantie. Une modification conserve `updatedAt`. L’archivage d’un budget ne supprime pas les dépenses réalisées.

### TRE-F12 — Comparer budget et réalisé

Pour chaque catégorie : budget, réalisé, restant, dépassement et pourcentage. Afficher séparément les catégories dépensées sans budget.

Seules les dépenses actives, non archivées et datées dans le mois participent au réalisé.

### TRE-F13 — Ajouter une prévision manuelle

Créer une entrée ou sortie future avec compte facultatif. Date future ou aujourd’hui, montant positif, devise et échelle valides. Un compte renseigné doit être compatible.

### TRE-F14 — Planifier une créance

Une facture avec solde positif peut être intégrée. Pour une échéance future, le système peut proposer la date d’échéance. Pour une facture en retard, une date attendue explicite est obligatoire.

Une facture ne doit pas être comptée deux fois entre prévision automatique et élément lié. Le calcul retient au maximum le solde restant actuel.

### TRE-F15 — Résoudre une prévision

Une prévision peut devenir `REALIZED` ou `CANCELLED`. Ces statuts exigent confirmation ; l’annulation exige un motif. Le changement ne crée aucune écriture réelle automatiquement.

### TRE-F16 — Projeter 30/60/90 jours

Pour chaque horizon et groupe monétaire : solde actuel, entrées attendues, sorties attendues, solde projeté et créances en retard non planifiées.

Le calcul utilise une date d’arrêté explicite et des bornes inclusives en `Africa/Dakar`.

### TRE-F17 — Tableau de bord

Afficher au minimum :

- total disponible par devise ;
- comptes négatifs ;
- mouvements non affectés ;
- budget du mois et dépassements ;
- projection à 30 jours avec lien vers 60/90 jours.

Chaque carte explique sa définition. « Prévision » et « non garantie » restent visibles.

### TRE-F18 — Hors ligne

Comptes, affectations, transferts, ajustements, budgets et prévisions fonctionnent sans réseau après mise en cache. Aucun calcul ne dépend d’une API distante.

## 6. Architecture

```text
src/modules/treasury/
  domain/
    treasury.ts
    budget.ts
    forecast.ts
  application/
    manage-treasury-accounts.ts
    allocate-treasury-sources.ts
    manage-treasury-operations.ts
    manage-expense-budgets.ts
    get-cash-forecast.ts
  infrastructure/
    dexie-treasury-repository.ts
  presentation/
    TreasuryOverview.tsx
    TreasuryAccountForm.tsx
    TreasuryTransferForm.tsx
    BudgetManager.tsx
    CashForecast.tsx
  __tests__/
```

Les frontières de fichiers peuvent évoluer, mais les dépendances restent orientées vers le domaine.

Les opérations paiement + affectation, dépense + affectation et réaffectation doivent disposer d’une orchestration transactionnelle claire. Ne pas écrire une table puis essayer de réparer une seconde écriture échouée.

## 7. Règles exactes de calcul

### Solde

```text
opening
+ active allocated payments
- active allocated expenses
+ active incoming transfers
- active outgoing transfers
+ active IN adjustments
- active OUT adjustments
```

### Budget

```text
actual = active expenses in month and category
remaining = budget - actual
overrun = max(actual - budget, 0)
```

### Prévision globale

```text
projected = current available
          + eligible invoice receivables
          + planned manual inflows
          - planned manual outflows
```

Les transferts futurs sont nuls au niveau global et ne servent qu’à la projection par compte.

## 8. Sauvegarde rétrocompatible

- Ajouter les cinq collections aux exports actuels.
- Conserver `securitySettings` hors export.
- Vérifier le checksum original avant toute adaptation.
- Définir les collections requises selon `sourceSchemaVersion`.
- Accepter une sauvegarde V10 valide avec 20 collections, puis injecter `expenses` et trésorerie vides.
- Accepter une sauvegarde V11 valide avec 21 collections, puis injecter les cinq nouvelles collections vides.
- Exiger toutes les collections de la nouvelle version pour un export nouveau.
- Rejeter doublons, inconnues, références orphelines, comptes incompatibles, double affectation active et montants invalides.
- Restaurer les collections actuelles dans une transaction unique avec rollback prouvé.

## 9. Interface mobile et accessibilité

- page de synthèse en cartes dès 320 px ;
- compte, solde, devise et date clairement visibles ;
- actions tactiles d’au moins 44 px ;
- panneau de filtres sur mobile ;
- confirmation renforcée des transferts négatifs et ajustements ;
- statut et sens exprimés par texte et icône, jamais seulement couleur ;
- graphiques accompagnés d’un tableau ou résumé textuel ;
- focus géré dans dialogues et feuilles ;
- valeurs négatives annoncées correctement ;
- aucune table horizontale indispensable ;
- chargement, vide, erreur et succès distincts.

## 10. Tests obligatoires

### Domaine

- solde d’ouverture positif, nul et négatif ;
- paiement entrant, dépense sortante, annulation et contrepassation ;
- transfert neutre globalement ;
- ajustements exclus du flux commercial ;
- grandes valeurs et dépassement ;
- devises/échelles séparées ;
- limites de date `Africa/Dakar` ;
- budget exact, dépassement et dépense annulée ;
- prévisions 30/60/90 ;
- créance en retard non incluse sans date attendue ;
- facture partiellement payée limitée au solde courant ;
- absence de double comptage.

### Dépôts et transactions

- création et archivage de compte ;
- immobilité devise/échelle après mouvement ;
- affectation unique active ;
- réaffectation atomique ;
- paiement + facture + allocation atomiques ;
- dépense + allocation atomiques ;
- rollback injecté à chaque étape ;
- requêtes de solde et historique ordonnées ;
- opérations concurrentes ;
- compte archivé refusé pour nouvelle écriture.

### Migration et sauvegarde

- vraie base V11 remplie vers nouvelle version et réouverture ;
- aucune donnée historique modifiée ;
- export/restauration nouvelle version avec les cinq collections ;
- import V10, V11 et version actuelle ;
- checksum original vérifié ;
- collection obligatoire manquante selon sa version refusée ;
- référence orpheline refusée ;
- rollback complet.

### Composants

- sélection de compte compatible ;
- liste des non-affectés ;
- confirmation de transfert ;
- budgets et alertes ;
- horizons 30/60/90 ;
- libellés expliquant les définitions ;
- navigation clavier, lecteur d’écran et mode sombre ;
- responsive 320 à 1440 px.

### E2E production

1. migrer une base V11 remplie ;
2. créer Caisse et Wave avec soldes d’ouverture ;
3. enregistrer un paiement affecté ;
4. enregistrer une dépense affectée ;
5. transférer Caisse vers Wave et vérifier neutralité globale ;
6. contrepasser le paiement puis vérifier le solde ;
7. créer un ajustement motivé ;
8. affecter un mouvement historique ;
9. créer les budgets du mois et provoquer un dépassement ;
10. créer entrées/sorties prévues ;
11. vérifier 30/60/90 et une créance en retard ;
12. exporter, restaurer et comparer tous les soldes ;
13. répéter les écritures essentielles hors ligne.

## 11. Commandes de validation

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

Créer `test:sprint13` pour le parcours transversal de trésorerie.

## 12. Critères d’acceptation

Le Sprint 13 est accepté si :

1. aucune donnée historique n’est perdue ou modifiée arbitrairement ;
2. le solde de chaque compte est recalculable depuis ses sources ;
3. une source réelle n’est jamais comptée deux fois ;
4. transferts et ajustements ne faussent pas le flux commercial ;
5. paiements inversés et dépenses annulées sont exclus automatiquement ;
6. montants et devises restent exacts ;
7. budgets et réalisé concordent ;
8. prévisions distinguent hypothèses, créances et retards ;
9. les horizons 30/60/90 sont exacts ;
10. migration et sauvegardes V10/V11/nouvelle version sont prouvées ;
11. les écritures multi-tables sont transactionnelles ;
12. le parcours fonctionne hors ligne et sur mobile ;
13. toutes les commandes obligatoires réussissent ;
14. aucun P0/P1 n’est ouvert ;
15. aucune action Git ou publication non autorisée n’a été effectuée.

Sans recette mobile physique prouvée, le verdict maximal est `SPRINT 13 VALIDATION CONDITIONNELLE`.
