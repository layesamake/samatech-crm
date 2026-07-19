# Prompt Gemini — Implémenter et valider le module dépenses

Copiez l’intégralité du texte ci-dessous dans Gemini.

---

Tu es un ingénieur logiciel senior chargé d’implémenter le module **Dépenses et flux net de trésorerie** dans le dépôt SAMTECH CRM.

## Mission

Implémente le registre des dépenses, son intégration au tableau de bord/statistiques, la migration Dexie V11, la sauvegarde rétrocompatible et les tests. Travaille directement dans le dépôt, mais ne fais aucun commit, push ou déploiement.

Ne te contente pas de produire un rapport ou des extraits : réalise l’implémentation complète, exécute les validations et fournis des preuves factuelles.

## Lecture obligatoire avant modification

1. Lis `AGENTS.md`.
2. Lis tous les documents pertinents de `DOCS`, en priorité :
   - `DOCS/DEPENSES_ANALYSE.md` ;
   - `DOCS/DEPENSES_CAHIER_DES_CHARGES.md` ;
   - `DOCS/ARCHITECTURE.md` ;
   - `DOCS/DATABASE.md` ;
   - `DOCS/RULES.md` ;
   - `DOCS/OFFLINE_FIRST.md` ;
   - `DOCS/UI_UX.md` ;
   - `DOCS/TESTING.md` ;
   - `DOCS/SECURITY.md`.
3. Inspecte l’état Git et préserve toutes les modifications existantes.
4. Inspecte les modules `payments`, `invoices`, `statistics`, `backup`, la base Dexie et les composants de navigation.
5. Cette application utilise Next.js 16 avec des changements incompatibles avec les anciennes versions : lis les guides locaux pertinents dans `node_modules/next/dist/docs/` avant d’écrire du code Next.js.
6. Exécute un état initial de TypeScript et des tests. Note séparément les défauts préexistants.

## Contraintes non négociables

- Architecture présentation/application/domaine/infrastructure.
- Règles métier hors des composants React.
- Aucun accès direct à Dexie depuis les composants ; utiliser dépôt et cas d’usage.
- Transactions pour les écritures qui relisent puis modifient un statut.
- Montants exacts en unités mineures entières ; aucun flottant financier.
- Aucun mélange de devises ou d’échelles monétaires.
- Mobile-first, accessible et hors ligne.
- Aucun backend, cloud, compte, multi-utilisateur, licence, IA, OCR ou API WhatsApp Business.
- Aucun effacement de données existantes.
- Aucun commit, push ou déploiement.

## Modèle métier obligatoire

Crée un module `src/modules/expenses` avec les catégories :

```ts
['RENT', 'SUPPLIES', 'TRANSPORT', 'MARKETING', 'SALARIES', 'TAXES', 'UTILITIES', 'PROFESSIONAL_SERVICES', 'OTHER']
```

Modes de règlement :

```ts
['CASH', 'WAVE', 'ORANGE_MONEY', 'BANK_TRANSFER', 'CARD', 'OTHER']
```

Statuts :

```ts
['ACTIVE', 'CANCELLED']
```

`ExpenseRecord` contient au minimum :

```ts
{
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

Règles : date civile réelle, description 2–200 caractères, montant positif et sûr, devise ISO sur trois lettres, échelle 0–3, `OTHER` documenté. Une dépense annulée est immuable, reste stockée et ne participe plus aux totaux. Aucun bouton de suppression définitive.

## Architecture attendue

Crée au minimum :

```text
src/modules/expenses/domain/expense.ts
src/modules/expenses/application/manage-expenses.ts
src/modules/expenses/infrastructure/dexie-expense-repository.ts
src/modules/expenses/presentation/ExpenseForm.tsx
src/modules/expenses/presentation/ExpensesDashboard.tsx
src/modules/expenses/__tests__/

src/app/(app)/expenses/page.tsx
src/app/(app)/expenses/new/page.tsx
src/app/(app)/expenses/[id]/edit/page.tsx
```

Réutilise les composants UI déjà possédés par le projet. N’installe pas une bibliothèque pour un composant qui existe déjà.

## Cas d’usage obligatoires

- charger la devise principale depuis les réglages ;
- créer une dépense ;
- obtenir une dépense ;
- modifier une dépense active ;
- annuler avec motif dans une transaction ;
- lister, rechercher et filtrer ;
- calculer le résumé actif par devise et catégorie.

La recherche doit ignorer accents et casse. Le tri principal est `expenseDate` décroissante, puis `createdAt` et `id` pour un ordre stable.

## Migration Dexie V11

Ajoute `expenses` sans modifier les données V10 :

```ts
this.version(11).stores({
  expenses: 'id, expenseDate, category, method, status, currency, createdAt, [status+expenseDate], [category+expenseDate]',
});
```

Mets à jour le diagnostic de base. Ajoute un test qui ouvre un vrai schéma V10, préserve chaque table, migre, écrit une dépense, ferme et rouvre.

## Écrans

### Registre `/expenses`

- titre, explication et bouton « Nouvelle dépense » ;
- période par défaut : mois courant ;
- recherche et filtres date/catégorie/mode/statut ;
- totaux actifs séparés par devise ;
- cartes mobiles lisibles ;
- modification active ;
- annulation avec saisie obligatoire du motif ;
- états chargement, vide et erreur.

### Formulaire

- date, montant, description, catégorie, mode obligatoires ;
- fournisseur, référence, note facultatifs ;
- champs conditionnels pour `OTHER` ;
- devise principale visible ;
- erreurs accessibles ;
- création et édition ;
- retour au registre après succès.

### Navigation

Ajoute Dépenses au menu desktop, au menu mobile, aux actions rapides et à la synchronisation du titre de page. Corrige toute action « Nouvelle dépense » existante qui pointe vers une mauvaise route.

## Situation financière

Étends le moteur statistique pur et son dépôt de lecture.

Pour chaque `(currency, currencyScale)` :

```text
expensesMinor = somme des dépenses ACTIVE non archivées datées dans la période
netCashflowMinor = collectedMinor - expensesMinor
```

Ajoute :

- dépenses et flux net dans les groupes monétaires ;
- dépenses et flux net dans la série temporelle ;
- comparaison avec la période précédente ;
- nombre de dépenses actives dans la période ;
- ventilation des dépenses par catégorie ;
- prise en compte des dépenses dans `isEmpty`.

Sur l’accueil, affiche « Situation financière » pour le mois courant avec Encaissements, Dépenses et Flux net. Dans les statistiques détaillées, ajoute les cartes, la ventilation et la série.

Texte obligatoire ou équivalent visible : **« Flux net sur la période : encaissements moins dépenses. Ce montant n’est ni le bénéfice comptable ni le solde bancaire. »**

Les créances restent un stock courant séparé.

## Sauvegarde V11 et compatibilité V10

- Passe `CURRENT_SCHEMA_VERSION` à 11.
- Ajoute `expenses` aux collections métier exportées.
- Mets à jour l’aperçu de sauvegarde.
- Une sauvegarde V11 exige les 21 collections métier.
- Une sauvegarde V10 valide conserve les 20 collections historiques et peut ne pas avoir `expenses`.
- Vérifie toujours son checksum sur l’enveloppe originale avant toute normalisation.
- Lors de la restauration V10, traite `expenses` comme une collection vide.
- Ne restaure jamais `securitySettings` depuis une sauvegarde.
- Mets à jour les jeux de charge et scripts qui construisent une sauvegarde courante.

## Tests obligatoires

Ajoute ou adapte les tests pour prouver :

1. parsing monétaire exact XOF et devise à deux décimales ;
2. validations et dépassements ;
3. création, modification et filtres ;
4. annulation sans suppression et immutabilité ;
5. double annulation refusée ;
6. agrégats multi-devises séparés ;
7. migration V10 → V11 avec réouverture ;
8. export/restauration V11 ;
9. import d’une sauvegarde V10 sans `expenses` ;
10. calcul : encaissé 400, dépensé 150, flux net 250 ;
11. exclusion d’une dépense annulée ;
12. présentation accessible et libellés non trompeurs ;
13. parcours E2E production mobile : création, persistance, hors-ligne, annulation et recalcul du flux net.

## Validation finale

Exécute réellement :

```powershell
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd test -- --run
npm.cmd run build
```

Puis exécute le parcours E2E du module sur le build de production. Ne masque pas les avertissements et n’affirme jamais qu’une commande passe si elle n’a pas terminé avec succès.

## Rapport attendu

Termine par un rapport factuel comprenant :

- fichiers créés et modifiés ;
- décisions métier prises ;
- schéma Dexie avant/après ;
- règles exactes des indicateurs ;
- tests ajoutés et résultat de chaque commande ;
- preuve du hors-ligne ;
- défauts préexistants distingués des régressions ;
- limites restantes ;
- verdict final : `MODULE DÉPENSES VALIDÉ` ou `MODULE DÉPENSES NON VALIDÉ` avec raisons précises.

Ne fais aucun commit, push ou déploiement.
