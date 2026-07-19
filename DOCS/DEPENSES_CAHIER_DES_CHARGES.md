# Cahier des charges — Module dépenses

## 1. Objet

Ajouter à SAMTECH CRM un module local et hors ligne de gestion des dépenses, puis intégrer ces dépenses aux indicateurs financiers afin de calculer le flux net de trésorerie par période.

## 2. Contraintes structurantes

- Respecter les couches présentation, application, domaine et infrastructure.
- Garder les règles métier hors des composants React.
- Accéder à Dexie exclusivement par un dépôt et des cas d’usage.
- Utiliser une transaction pour toute écriture qui relit puis modifie une dépense.
- Stocker les montants en entiers d’unités mineures sûres.
- Ne jamais additionner des devises ou échelles différentes.
- Conserver le fonctionnement mobile-first et hors ligne.
- Ne pas ajouter de backend, cloud, multi-utilisateur, licence, IA ou API externe.
- Préserver toutes les données et modifications existantes.

## 3. Exigences fonctionnelles

### DEP-F01 — Créer une dépense

Le système doit permettre de créer une dépense avec : date, description, montant, devise, échelle monétaire, catégorie et mode de règlement. Fournisseur, référence et note sont facultatifs.

### DEP-F02 — Valider la saisie

- La date doit être une date civile réelle au format `YYYY-MM-DD`.
- La description contient de 2 à 200 caractères après trim.
- Le montant est strictement positif et reste dans `Number.MAX_SAFE_INTEGER` après conversion en unité mineure.
- La devise est un code de trois lettres majuscules.
- L’échelle est un entier de 0 à 3.
- La catégorie `OTHER` exige `customCategory`.
- Le mode `OTHER` exige une explication dans `note`.

### DEP-F03 — Modifier une dépense

Une dépense `ACTIVE` peut être modifiée. Le système doit relire son statut dans la transaction avant d’écrire. Une dépense `CANCELLED` est immuable.

### DEP-F04 — Annuler sans supprimer

L’annulation exige un motif non vide de 500 caractères maximum. Elle renseigne `status`, `cancelledAt`, `cancellationReason` et `updatedAt`. L’enregistrement demeure dans IndexedDB.

### DEP-F05 — Consulter le registre

La page `/expenses` doit afficher les dépenses de la plus récente à la plus ancienne, avec date, description, montant, catégorie, mode, fournisseur éventuel et statut.

### DEP-F06 — Rechercher et filtrer

Les critères sont : texte libre, date de début, date de fin, catégorie, mode et statut. La recherche porte au minimum sur description, fournisseur, référence, note et libellé de catégorie. Elle ignore casse et accents.

### DEP-F07 — Résumer la période

Le registre affiche le nombre de dépenses actives et annulées ainsi que les totaux actifs, séparés par `(currency, currencyScale)`.

### DEP-F08 — Ventiler par catégorie

Le système calcule, pour chaque catégorie, le nombre d’écritures actives et les montants séparés par devise.

### DEP-F09 — Situation financière

Le domaine statistique doit exposer pour chaque groupe monétaire :

- `billedMinor` ;
- `collectedMinor` ;
- `expensesMinor` ;
- `netCashflowMinor = collectedMinor - expensesMinor` ;
- les créances existantes, sans les mélanger au flux.

### DEP-F10 — Tableau de bord

Le tableau de bord du mois courant affiche une carte « Situation financière » contenant encaissements, dépenses et flux net. Si le flux est négatif, son état visuel doit être explicite. Une note précise qu’il ne s’agit pas du solde bancaire.

### DEP-F11 — Statistiques détaillées

La page des statistiques intègre :

- cartes Dépenses et Flux net ;
- ventilation par catégorie ;
- série temporelle encaissements/dépenses/flux net ;
- comparaison avec la période précédente ;
- groupes monétaires séparés.

### DEP-F12 — Navigation

Ajouter « Dépenses » dans la navigation desktop et mobile, une action rapide vers `/expenses/new`, et les titres de pages correspondants.

### DEP-F13 — Hors ligne

Création, modification, annulation, filtres et statistiques doivent fonctionner sans réseau après installation et première mise en cache de l’application.

### DEP-F14 — Sauvegarde et restauration

Les exports du schéma V11 contiennent `expenses`. Une sauvegarde V10 valide sans cette collection doit rester restaurable et produire un registre de dépenses vide.

## 4. Modèle de données

```ts
type ExpenseCategory =
  | 'RENT'
  | 'SUPPLIES'
  | 'TRANSPORT'
  | 'MARKETING'
  | 'SALARIES'
  | 'TAXES'
  | 'UTILITIES'
  | 'PROFESSIONAL_SERVICES'
  | 'OTHER';

type ExpenseMethod =
  | 'CASH'
  | 'WAVE'
  | 'ORANGE_MONEY'
  | 'BANK_TRANSFER'
  | 'CARD'
  | 'OTHER';

type ExpenseStatus = 'ACTIVE' | 'CANCELLED';

interface ExpenseRecord {
  id: string;
  expenseDate: string;
  description: string;
  supplier?: string;
  amountMinor: number;
  currency: string;
  currencyScale: number;
  category: ExpenseCategory;
  customCategory?: string;
  method: ExpenseMethod;
  reference?: string;
  note?: string;
  status: ExpenseStatus;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}
```

## 5. Migration Dexie

Passer de V10 à V11 avec une migration additive :

```ts
this.version(11).stores({
  expenses: 'id, expenseDate, category, method, status, currency, createdAt, [status+expenseDate], [category+expenseDate]',
});
```

Aucun `upgrade()` ne doit transformer les tables existantes. Le test de migration doit créer une vraie base V10, y écrire une donnée dans chaque table, ouvrir V11, vérifier toutes les données, écrire une dépense, fermer et rouvrir.

## 6. Architecture attendue

```text
src/modules/expenses/
  domain/expense.ts
  application/manage-expenses.ts
  infrastructure/dexie-expense-repository.ts
  presentation/ExpenseForm.tsx
  presentation/ExpensesDashboard.tsx
  __tests__/

src/app/(app)/expenses/page.tsx
src/app/(app)/expenses/new/page.tsx
src/app/(app)/expenses/[id]/edit/page.tsx
```

Les composants ne doivent jamais appeler `db.expenses` directement.

## 7. Sauvegarde rétrocompatible

- `CURRENT_SCHEMA_VERSION` passe à 11.
- `expenses` rejoint les collections métier exportables.
- Une sauvegarde V11 doit avoir les 21 collections métier.
- Une sauvegarde V10 conserve ses 20 collections obligatoires historiques.
- Le checksum d’une sauvegarde V10 est vérifié sur l’enveloppe originale avant toute adaptation.
- Pendant la restauration, l’absence de `expenses` en V10 équivaut à une collection vide.
- `securitySettings` reste exclue des sauvegardes.

## 8. Interface et accessibilité

- Conception mobile-first dès 320 px.
- Cibles tactiles d’au moins 44 px pour les actions principales.
- Labels explicites pour tous les champs.
- Messages d’erreur associés et annoncés avec `role="alert"`.
- Confirmation d’annulation accessible avec champ de motif.
- États de chargement, vide et erreur distincts.
- Contraste suffisant en modes clair et sombre.
- Ne pas utiliser la couleur seule pour signifier un flux négatif ou un statut annulé.

## 9. Règles de calcul

Pour une période inclusive `[from, to]` :

```text
expenses = somme des ExpenseRecord
  où status = ACTIVE
  et archivedAt est absent
  et expenseDate ∈ [from, to]

netCashflow = collected - expenses
```

Les sommes sont réalisées avec `BigInt` ou une protection équivalente contre le dépassement, puis converties seulement si le résultat reste dans la plage entière sûre.

## 10. Tests obligatoires

### Domaine

- conversion exacte XOF et devises à décimales ;
- date invalide ;
- montant nul, négatif, non sûr et dépassement de somme ;
- catégorie et mode `OTHER` ;
- exclusion des dépenses annulées ;
- flux net positif, nul et négatif.

### Cas d’usage et dépôt

- création ;
- recherche et filtres ;
- modification active ;
- refus de modification après annulation ;
- annulation sans suppression ;
- double annulation refusée ;
- agrégats multi-devises séparés ;
- comportement concurrent protégé par transaction.

### Migration et sauvegarde

- migration réelle V10 → V11 et réouverture ;
- export/restauration V11 avec une dépense ;
- import V10 sans dépenses ;
- rollback de restauration ;
- exclusion de la sécurité locale.

### Statistiques et présentation

- paiement 400, dépense 150, flux net 250 ;
- dépense annulée exclue ;
- XOF et USD séparés ;
- libellés indiquant clairement « période » et « pas un solde bancaire » ;
- navigation clavier et contrôles accessibles.

### E2E production

- créer une dépense ;
- la retrouver après rechargement ;
- créer ou modifier hors ligne ;
- constater le flux net sur le tableau de bord ;
- annuler avec motif ;
- vérifier que le nombre d’enregistrements ne baisse pas et que le total est recalculé.

## 11. Commandes de validation

```powershell
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd test -- --run
npm.cmd run build
```

Les défauts préexistants doivent être distingués des régressions introduites. Aucun résultat ne doit être déclaré réussi sans sortie de commande ou preuve factuelle.

## 12. Critères d’acceptation

Le module est accepté si :

- aucune donnée V10 n’est perdue ;
- toutes les écritures fonctionnent hors ligne ;
- les dépenses annulées restent visibles et sont exclues des totaux ;
- les devises ne sont jamais mélangées ;
- le tableau de bord présente encaissements, dépenses et flux net exacts ;
- l’interface ne présente pas ce flux comme un bénéfice ou un solde bancaire ;
- sauvegarde V11 et restauration V10/V11 sont prouvées ;
- lint, TypeScript, tests et build passent, hors anomalie antérieure explicitement documentée.
