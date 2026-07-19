# Analyse fonctionnelle et technique — Sprint 13

## Comptes de trésorerie, budgets et prévisions

## 1. Contexte

SAMTECH CRM connaît désormais les encaissements issus des paiements et les sorties enregistrées dans le module Dépenses. Il peut calculer le flux net d’une période :

`encaissements actifs − dépenses actives`

Ce flux ne répond cependant pas à trois questions essentielles :

- combien d’argent est réellement disponible aujourd’hui dans la caisse, Wave, Orange Money ou la banque ?
- les dépenses du mois respectent-elles le budget décidé ?
- la trésorerie probable restera-t-elle positive dans 30, 60 ou 90 jours ?

Le Sprint 13 ajoute ces réponses sans transformer SAMTECH CRM en logiciel de comptabilité générale.

## 2. Distinctions obligatoires

L’interface et les calculs doivent distinguer :

### Solde disponible

Le solde d’un compte est calculé depuis un solde d’ouverture et les mouvements réels affectés à ce compte.

### Flux net d’une période

Le flux net reste la différence entre encaissements et dépenses réels de la période. Un transfert entre deux comptes de l’entreprise ne modifie pas ce flux global.

### Budget

Le budget est une limite ou un objectif décidé pour une catégorie et un mois. Il n’est ni une dépense réelle, ni une prévision de paiement à une date précise.

### Prévision

La prévision combine le solde actuel avec des entrées et sorties futures attendues. Elle représente un scénario, pas une garantie.

### Résultat comptable

Aucun de ces indicateurs ne constitue un bénéfice comptable, un bilan, un compte de résultat ou un solde bancaire rapproché.

## 3. Objectifs métier

Le responsable doit pouvoir :

- créer ses comptes de trésorerie ;
- enregistrer leur solde au début d’une date donnée ;
- affecter chaque paiement ou dépense à un compte compatible ;
- transférer de l’argent entre deux comptes sans créer une recette ou une dépense ;
- corriger un solde avec une opération motivée et traçable ;
- connaître le solde actuel de chaque compte et le total par devise ;
- repérer les paiements ou dépenses non affectés ;
- définir un budget mensuel par catégorie de dépense ;
- comparer budget, réalisé, restant et dépassement ;
- saisir des entrées ou sorties futures prévues ;
- consulter une projection à 30, 60 et 90 jours ;
- distinguer les factures attendues, les montants en retard et les hypothèses manuelles.

## 4. Périmètre

### Inclus

- comptes Caisse, Wave, Orange Money, Banque et Autre ;
- devise et échelle immuables par compte après mouvements ;
- solde d’ouverture daté ;
- affectation traçable d’un paiement ou d’une dépense ;
- réaffectation par annulation motivée de l’ancienne affectation ;
- transferts internes dans une même devise et échelle ;
- ajustements entrants ou sortants motivés ;
- solde par compte et total par groupe monétaire ;
- liste séparée des mouvements non affectés ;
- budgets mensuels de dépenses par catégorie ;
- réalisé, restant, pourcentage consommé et dépassement ;
- éléments prévisionnels manuels entrants et sortants ;
- créances futures issues des factures comme source de prévision ;
- projections à 30, 60 et 90 jours ;
- indicateurs et alertes sur le tableau de bord ;
- sauvegarde, restauration, migration, tests et hors-ligne.

### Hors périmètre

- connexion bancaire ou Mobile Money ;
- rapprochement automatique avec un relevé ;
- comptabilité en partie double complète ;
- plan comptable, journal comptable, grand livre ou bilan ;
- amortissements, immobilisations, stocks comptables ou fiscalité ;
- conversion de devises ou taux de change ;
- crédit client, découvert autorisé ou prêt bancaire détaillé ;
- dépenses récurrentes générées automatiquement ;
- prévision produite par IA ;
- synchronisation cloud, backend ou multi-utilisateur ;
- suppression physique d’une opération financière.

## 5. Comptes de trésorerie

### Types

- `CASH` — caisse physique ;
- `WAVE` — portefeuille Wave ;
- `ORANGE_MONEY` — portefeuille Orange Money ;
- `BANK` — compte bancaire ;
- `OTHER` — autre réserve de trésorerie, avec libellé explicite.

### Données minimales

- identifiant ;
- nom unique parmi les comptes actifs ;
- type ;
- devise et échelle ;
- solde d’ouverture, positif, nul ou négatif ;
- date d’ouverture comptée comme début de journée dans `Africa/Dakar` ;
- note facultative ;
- statut actif ou archivé ;
- audit de création et modification.

Le solde d’ouverture représente le montant disponible au début de la date choisie. Les mouvements de cette date sont donc ajoutés ou soustraits ensuite.

Un compte ayant des mouvements n’est jamais supprimé. Il peut être archivé et reste visible dans l’historique et les rapports. L’archivage interdit de nouvelles affectations, sauf réactivation explicite.

## 6. Affectation des écritures réelles

Les paiements et dépenses existants restent les sources de vérité. Leur montant ne doit pas être dupliqué comme mouvement indépendant.

Une affectation relie :

- un paiement `ACTIVE` à un compte entrant ; ou
- une dépense `ACTIVE` à un compte sortant.

Règles :

- devise et échelle de l’écriture égales à celles du compte ;
- date de l’écriture postérieure ou égale à la date d’ouverture ;
- une seule affectation active par source ;
- compte actif lors de la nouvelle affectation ;
- une contrepassation de paiement ou annulation de dépense exclut automatiquement le mouvement du solde ;
- une réaffectation annule l’ancienne affectation avec motif puis en crée une nouvelle dans la même transaction ;
- les écritures historiques non affectées restent dans le flux global, mais pas dans le solde d’un compte ;
- leur montant est affiché dans « Mouvements à affecter ».

Lorsqu’au moins un compte actif compatible existe, les nouvelles interfaces de paiement et dépense doivent demander le compte. Une absence volontaire doit être signalée et rester corrigeable, afin de ne pas rendre les données historiques incompatibles.

## 7. Solde des comptes

Pour un compte et une date d’arrêté :

```text
solde = solde d’ouverture
      + paiements actifs affectés
      − dépenses actives affectées
      + transferts entrants actifs
      − transferts sortants actifs
      + ajustements entrants actifs
      − ajustements sortants actifs
```

Seuls les mouvements compris entre la date d’ouverture incluse et la date d’arrêté incluse participent au solde.

Les calculs utilisent des entiers exacts et doivent détecter tout dépassement de la plage monétaire supportée. Les comptes de devises ou échelles différentes ne sont jamais additionnés.

Un solde négatif est autorisé pour refléter la réalité ou une saisie incomplète, mais il déclenche une alerte. Le système ne doit pas inventer un découvert autorisé.

## 8. Transferts et ajustements

### Transfert

Un transfert possède une source, une destination, une date, un montant, une référence et une note facultatives.

- source différente de destination ;
- même devise et même échelle ;
- montant strictement positif ;
- date compatible avec l’ouverture des deux comptes ;
- écriture atomique ;
- effet nul sur la trésorerie globale ;
- annulation motivée, sans suppression.

Un transfert pouvant rendre la source négative affiche une confirmation renforcée. Il n’est pas silencieusement refusé, car un compte peut être incomplet ou autoriser un découvert réel non modélisé.

### Ajustement

Un ajustement corrige un écart constaté entre l’application et le montant réel. Il est entrant ou sortant, exige un motif et reste distinct d’un revenu ou d’une dépense.

L’interface doit préciser qu’un ajustement modifie le solde disponible mais pas le chiffre d’affaires, les encaissements commerciaux, les dépenses ou le flux net commercial.

## 9. Budgets

Le budget porte sur un mois civil `YYYY-MM`, une catégorie de dépense et un groupe monétaire.

Règles :

- une seule valeur active par mois, catégorie normalisée, devise et échelle ;
- montant strictement positif ;
- catégorie `OTHER` distinguée par un libellé personnalisé normalisé ;
- réalisé = dépenses actives non archivées du mois et de la catégorie ;
- dépenses annulées exclues ;
- le réalisé ne dépend pas de l’affectation à un compte ;
- budget total mensuel = somme des budgets de catégories compatibles ;
- réalisé sans budget affiché séparément ;
- aucune devise mélangée.

Indicateurs :

```text
restant = budget − réalisé
taux consommé = réalisé / budget
dépassement = max(réalisé − budget, 0)
```

Les montants restent exacts. Le pourcentage est un indicateur dérivé arrondi uniquement pour l’affichage.

## 10. Prévisions

### Sources

La prévision peut inclure :

- solde actuel réel des comptes ;
- soldes de factures non annulées avec échéance future ;
- date d’encaissement attendue explicitement corrigée pour une facture ;
- entrées manuelles prévues ;
- sorties manuelles prévues ;
- transferts futurs pour la vue par compte uniquement.

Les budgets ne sont pas des sorties prévisionnelles et ne sont jamais soustraits automatiquement.

### Factures en retard

Une créance déjà en retard est incertaine. Elle doit être présentée séparément et ne rejoindre une projection datée que si l’utilisateur lui attribue une date d’encaissement attendue. Cette décision évite de gonfler artificiellement la trésorerie future.

### Éléments manuels

Un élément contient : sens `INFLOW` ou `OUTFLOW`, date prévue, libellé, montant, devise, échelle, compte facultatif, note et statut `PLANNED`, `REALIZED` ou `CANCELLED`.

Marquer un élément « réalisé » ne crée pas silencieusement un paiement ou une dépense. L’utilisateur enregistre d’abord l’écriture réelle puis marque ou rapproche manuellement la prévision. Les éléments réalisés et annulés sont exclus du futur.

### Horizons

Pour 30, 60 et 90 jours à partir d’une date d’arrêté :

```text
projection = solde actuel
           + encaissements futurs inclus
           + entrées manuelles planifiées
           − sorties manuelles planifiées
```

Une projection est regroupée par devise/échelle et montre séparément : solde initial, entrées, sorties, créances en retard non planifiées et solde projeté.

## 11. Modèle de données recommandé

Le prochain schéma attendu est Dexie V12 si le Sprint 12 n’a pas ajouté de migration. Gemini doit vérifier le numéro réel avant d’écrire.

Collections recommandées :

1. `treasuryAccounts` ;
2. `treasuryAllocations` ;
3. `treasuryOperations` — transferts et ajustements ;
4. `expenseBudgets` ;
5. `treasuryForecastItems`.

Cette organisation ajoute cinq collections métier. Si l’état reste V11, le total passe de 21 à 26 collections métier, plus `securitySettings` séparée.

Le détail exact des champs et index est défini dans le cahier des charges. Les valeurs financières restent des entiers sûrs stockés et sont agrégées via `BigInt` avec validation avant conversion.

## 12. Écrans

- `/treasury` — synthèse, comptes, montants non affectés et alertes ;
- `/treasury/accounts` — liste et archives ;
- `/treasury/accounts/new` — création ;
- `/treasury/accounts/[id]` — solde et historique ;
- `/treasury/transfers/new` — transfert ;
- `/treasury/budgets` — budgets mensuels ;
- `/treasury/forecast` — prévisions à 30/60/90 jours ;
- intégration du compte dans Paiement et Dépense ;
- cartes compactes dans le tableau de bord et Statistiques.

Sur mobile, les données tabulaires deviennent des cartes. Les notions « Solde disponible », « Flux net », « Budget » et « Prévision » doivent rester visuellement et textuellement distinctes.

## 13. Migration et données historiques

La migration est additive et ne transforme ni paiements ni dépenses existants. Après mise à jour :

- aucun compte n’est créé automatiquement avec un faux solde ;
- paiements et dépenses existants restent non affectés ;
- le flux historique reste inchangé ;
- le solde par compte commence lorsque l’utilisateur crée un compte et saisit son solde d’ouverture ;
- une interface aide à affecter les écritures historiques compatibles ;
- la migration V11→V12 et la réouverture sont testées avec toutes les tables remplies.

## 14. Sauvegarde et restauration

Le format doit exporter les cinq nouvelles collections et garder `securitySettings` hors sauvegarde.

La validation devient dépendante de `sourceSchemaVersion` :

- une sauvegarde V10 exige ses 20 collections historiques ;
- une sauvegarde V11 exige 21 collections, dont `expenses` ;
- une sauvegarde V12 exige les 26 collections attendues si V12 est la version retenue ;
- le checksum est vérifié sur l’enveloppe originale avant d’ajouter des collections vides ;
- une ancienne sauvegarde valide reçoit ensuite des collections nouvelles vides en mémoire ;
- l’absence d’une collection obligatoire pour sa propre version reste une erreur ;
- la restauration reste atomique et remplace toutes les collections métier actuelles.

## 15. Alertes utiles

- compte négatif ;
- mouvements réels non affectés ;
- budget dépassé ou consommé à 80 % ;
- projection négative à 30, 60 ou 90 jours ;
- créances en retard sans date attendue ;
- sauvegarde ancienne après modifications importantes de trésorerie.

Ces alertes informent sans bloquer les saisies légitimes.

## 16. Risques

- **Double comptage** : les affectations référencent paiements/dépenses au lieu de copier leurs montants.
- **Transfert pris pour une dépense** : l’exclure des flux globaux.
- **Prévision trop optimiste** : isoler les créances en retard et nommer les hypothèses.
- **Mélange de devises** : grouper par devise/échelle à chaque étape.
- **Solde initial ambigu** : définir qu’il vaut au début de la date.
- **Historique effacé** : annuler plutôt que supprimer ou écraser.
- **Restauration ancienne rejetée** : valider selon la version source.
- **Fausses données automatiques** : ne créer aucun compte ou affectation arbitraire à la migration.

## 17. Décision de fin de sprint

- **SPRINT 13 VALIDÉ** : soldes, budgets et prévisions exacts, migration et sauvegardes prouvées, parcours mobile/hors ligne réussis, aucun P0/P1.
- **SPRINT 13 VALIDATION CONDITIONNELLE** : automatisation conforme mais recette physique non exécutée ou limite externe clairement documentée.
- **SPRINT 13 NON VALIDÉ** : double comptage, erreur monétaire, perte de données, restauration incompatible, transfert faussant le flux ou P0/P1 ouvert.

Le mot « prévision » doit rester visible : aucun solde futur ne doit être présenté comme certain.
