# Analyse fonctionnelle — Module dépenses et situation financière

## 1. Contexte

SAMTECH CRM est une PWA mono-utilisateur, locale et hors ligne. Elle gère déjà les prospects, clients, factures, paiements, créances, campagnes et statistiques commerciales. Les encaissements sont connus grâce aux paiements actifs, mais aucune sortie d’argent n’est enregistrée. Il est donc impossible d’évaluer le mouvement financier net de l’entreprise sur une période.

Le besoin est d’ajouter un registre des dépenses suffisamment simple pour une petite entreprise, tout en respectant l’architecture actuelle, l’exactitude monétaire et le fonctionnement hors ligne.

## 2. Objectif métier

L’objectif immédiat est de répondre aux questions suivantes :

- combien l’entreprise a-t-elle réellement encaissé pendant une période ?
- combien a-t-elle réellement dépensé pendant cette période ?
- quel est le flux net de trésorerie de la période ?
- quelles catégories concentrent les dépenses ?
- quelles dépenses ont été corrigées ou annulées ?

La formule de référence est :

`flux net de trésorerie = encaissements actifs de la période − dépenses actives de la période`

Les montants doivent être regroupés séparément par couple `(devise, échelle monétaire)`. Deux devises différentes ne sont jamais additionnées.

## 3. Limite importante du terme « situation financière »

Le module proposé ne produit pas un bilan comptable, un compte de résultat ou un solde bancaire. La V1 ne connaît pas :

- les soldes d’ouverture des caisses et comptes bancaires ;
- les transferts entre comptes ;
- le rapprochement bancaire ;
- les dettes fournisseurs et charges non encore payées ;
- les immobilisations, amortissements et stocks comptables ;
- les taxes à payer ou à récupérer ;
- les apports, retraits, emprunts et remboursements ventilés comptablement.

L’interface doit donc employer « Flux net de trésorerie sur la période » et afficher une explication : ce montant n’est ni le bénéfice comptable ni le solde bancaire disponible.

## 4. Utilisateur cible

Le responsable de l’entreprise est l’unique utilisateur de la V1. Il saisit les dépenses à partir de reçus, factures fournisseurs ou mouvements constatés, puis consulte les totaux et tendances depuis le même appareil.

## 5. Périmètre recommandé pour la V1

### Inclus

- créer une dépense ;
- modifier une dépense active ;
- annuler une dépense avec un motif sans la supprimer ;
- consulter et rechercher le registre ;
- filtrer par période, catégorie, mode de règlement et statut ;
- totaliser les dépenses actives par devise ;
- ventiler les dépenses par catégorie ;
- intégrer les dépenses au tableau de bord et aux statistiques ;
- sauvegarder et restaurer les dépenses avec les autres données métier ;
- fonctionner intégralement hors ligne.

### Hors périmètre

- comptabilité générale ou analytique complète ;
- comptes bancaires et caisses avec solde d’ouverture ;
- rapprochement bancaire ;
- dépenses récurrentes automatiques ;
- pièces jointes lourdes, OCR ou scan intelligent ;
- validation multi-utilisateur ;
- fournisseurs comme module CRM complet ;
- synchronisation cloud ou backend ;
- fiscalité automatisée ;
- prévision de trésorerie par IA.

## 6. Données d’une dépense

Champs obligatoires :

- date de dépense ;
- description ;
- montant strictement positif ;
- devise et échelle monétaire ;
- catégorie ;
- mode de règlement ;
- statut et données d’audit.

Champs facultatifs :

- fournisseur ou bénéficiaire ;
- référence du reçu ou de la facture fournisseur ;
- note ;
- catégorie personnalisée lorsque « Autre » est sélectionnée.

Le montant est stocké en unité mineure exacte (`amountMinor`) et jamais en nombre décimal flottant.

## 7. Catégories proposées

- Loyer ;
- Fournitures ;
- Transport ;
- Marketing et communication ;
- Salaires et prestations ;
- Impôts et taxes ;
- Eau, électricité et télécommunications ;
- Services professionnels ;
- Autre, avec libellé obligatoire.

Cette liste fixe évite une table supplémentaire dans la première version. Une gestion personnalisée des catégories pourra être étudiée plus tard.

## 8. Modes de règlement proposés

- Espèces ;
- Wave ;
- Orange Money ;
- Virement bancaire ;
- Carte ;
- Autre, avec explication obligatoire dans la note.

## 9. Cycle de vie

Une dépense possède deux statuts : `ACTIVE` et `CANCELLED`.

- Une dépense active participe aux totaux et peut être modifiée.
- Une dépense annulée reste dans l’historique, ne participe plus aux totaux et ne peut plus être modifiée.
- L’annulation exige un motif, une date d’annulation et une mise à jour de l’audit.
- Une correction après annulation se fait par une nouvelle dépense distincte.

La suppression physique depuis l’interface est exclue afin de préserver l’historique financier.

## 10. Indicateurs attendus

Pour une période inclusive et le fuseau `Africa/Dakar` :

- encaissements : paiements `ACTIVE` datés dans la période, selon les règles financières existantes ;
- dépenses : dépenses `ACTIVE`, non archivées, dont `expenseDate` appartient à la période ;
- flux net : encaissements moins dépenses ;
- nombre de dépenses actives ;
- répartition par catégorie ;
- série quotidienne ou mensuelle des encaissements, dépenses et flux net ;
- comparaison avec la période précédente équivalente.

Les créances restent un stock courant séparé et ne doivent pas être soustraites ou ajoutées au flux net.

## 11. Parcours utilisateur

1. Depuis le tableau de bord ou le menu, l’utilisateur ouvre « Nouvelle dépense ».
2. Il saisit la date, le montant, la description, la catégorie et le mode de règlement.
3. La dépense est enregistrée localement et apparaît immédiatement dans le registre et les statistiques.
4. Il peut corriger une écriture active.
5. En cas de doublon ou d’erreur définitive, il l’annule avec un motif.
6. Le tableau de bord recalcule le flux net de la période sans inclure l’écriture annulée.

## 12. Risques et réponses

- Confusion entre chiffre d’affaires, encaissements et résultat : employer des libellés explicites et une aide permanente.
- Erreur de saisie : autoriser la modification avant annulation et conserver les annulations.
- Mélange de devises : grouper strictement par devise et échelle.
- Perte de données à la migration : migration Dexie additive et test réel V10 vers V11.
- Restauration d’une ancienne sauvegarde : maintenir la compatibilité avec les sauvegardes V10 sans collection `expenses`.
- Faux sentiment de sécurité : rappeler que les données IndexedDB et sauvegardes ne sont pas chiffrées par le PIN.

## 13. Recommandation

Implémenter d’abord ce registre de dépenses et le flux net par période. Une phase ultérieure pourra ajouter des comptes de trésorerie et soldes d’ouverture si l’entreprise a besoin de connaître le montant réellement disponible dans chaque caisse ou banque.
