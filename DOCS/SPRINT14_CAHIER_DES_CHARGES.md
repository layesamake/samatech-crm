# Cahier des charges — Sprint 14

## Devis, factures pro forma et bons de livraison

## 1. Objet

Créer un module autonome de documents commerciaux permettant de préparer, émettre, partager, suivre et convertir des devis, pro forma et bons de livraison, sans altérer les règles financières des factures.

## 2. Contraintes structurantes

- Conserver les factures réelles dans `invoices` et `invoiceLines`.
- Stocker les documents commerciaux dans des collections séparées.
- Supprimer la création future du type ambigu `ESTIMATE` dans Factures.
- Migrer les `ESTIMATE` existants sans choisir arbitrairement devis ou pro forma.
- Seule une facture émise peut produire facturé, créance ou paiement.
- Réutiliser un moteur exact commun pour les lignes chiffrées.
- Stocker les montants et quantités sous forme entière mise à l’échelle.
- Utiliser des transactions pour émission, conversion, livraison et migration.
- Conserver les instantanés après émission.
- Accéder à Dexie par dépôts et cas d’usage.
- Garder toute règle métier hors des composants React.
- Maintenir mobile-first, PWA et hors-ligne.
- Ne pas ajouter stock, signature électronique, backend, cloud, IA ou API WhatsApp.
- Préserver les changements des Sprints 12 et 13.
- Aucun commit, push, tag ou déploiement sans autorisation.

## 3. Modèle de données

### 3.1 Documents

```ts
type CommercialDocumentType =
  | 'QUOTE'
  | 'PROFORMA'
  | 'DELIVERY_NOTE'
  | 'LEGACY_ESTIMATE';

type CommercialDocumentStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CONVERTED'
  | 'DELIVERED'
  | 'CANCELLED';

interface CommercialDocumentRecord {
  id: string;
  type: CommercialDocumentType;
  status: CommercialDocumentStatus;
  number?: string;
  clientProfileId: string;
  currency?: string;
  currencyScale?: number;
  companySnapshot: PartySnapshot;
  clientSnapshot: PartySnapshot;
  issueDate?: string;
  validUntil?: string;
  deliveryDate?: string;
  deliveryAddress?: string;
  recipientName?: string;
  customerReference?: string;
  notes?: string;
  terms?: string;
  subtotalMinor?: number;
  discountTotalMinor?: number;
  taxTotalMinor?: number;
  grandTotalMinor?: number;
  issuedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  deliveredAt?: string;
  convertedAt?: string;
  cancelledAt?: string;
  statusReason?: string;
  legacyInvoiceId?: string;
  legacyNumber?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}
```

Les champs monétaires sont requis pour `QUOTE`, `PROFORMA` et `LEGACY_ESTIMATE`, et interdits ou ignorés pour `DELIVERY_NOTE` selon le domaine.

### 3.2 Lignes

```ts
interface CommercialDocumentLineRecord {
  id: string;
  documentId: string;
  productId?: string;
  position: number;
  designationSnapshot: string;
  descriptionSnapshot?: string;
  unitLabelSnapshot?: string;
  quantityScaled: number;
  quantityScale: number;
  unitPriceMinor?: number;
  grossMinor?: number;
  discountType?: DiscountType;
  discountValue?: number;
  discountMinor?: number;
  taxRateBasisPoints?: number;
  taxMinor?: number;
  lineTotalMinor?: number;
  sourceEntityType?: 'COMMERCIAL_DOCUMENT_LINE' | 'INVOICE_LINE';
  sourceLineId?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}
```

Pour un bon de livraison, `quantityScaled` représente la quantité livrée et les champs financiers sont absents.

### 3.3 Liens

```ts
type LinkedEntityType = 'COMMERCIAL_DOCUMENT' | 'INVOICE';
type CommercialDocumentRelation =
  | 'QUOTE_TO_PROFORMA'
  | 'QUOTE_TO_INVOICE'
  | 'PROFORMA_TO_INVOICE'
  | 'DELIVERY_FOR'
  | 'SUPERSEDES';

interface CommercialDocumentLinkRecord {
  id: string;
  relation: CommercialDocumentRelation;
  sourceType: LinkedEntityType;
  sourceId: string;
  targetType: LinkedEntityType;
  targetId: string;
  uniqueKey: string;
  createdAt: string;
}
```

`uniqueKey` garantit qu’un même lien logique n’est pas créé deux fois.

## 4. Schéma Dexie

Utiliser la prochaine version disponible après audit, normalement V13 si le Sprint 13 a créé V12.

```ts
commercialDocuments:
  'id, type, status, &number, clientProfileId, issueDate, validUntil, deliveryDate, legacyInvoiceId, [type+status], [clientProfileId+issueDate]'

commercialDocumentLines:
  'id, documentId, position, productId, sourceLineId, [documentId+position], [sourceEntityType+sourceLineId]'

commercialDocumentLinks:
  'id, &uniqueKey, relation, sourceId, targetId, [sourceType+sourceId], [targetType+targetId]'
```

Comme plusieurs types utilisent des séries différentes, vérifier si l’unicité globale de `number` convient. Si les préfixes sont configurables et peuvent entrer en collision, utiliser une clé normalisée `type + number` plutôt qu’un index global naïf.

## 5. Règles de domaine

### DOC-F01 — Brouillon

Un brouillon exige client et au moins une ligne avant émission. Il reste modifiable et ne possède pas de numéro définitif.

Les devis et pro forma exigent devise, échelle, montants exacts et dates cohérentes. Un bon exige date/adresse de livraison selon les données disponibles et des quantités positives.

### DOC-F02 — Émission

L’émission :

- relit le document, les lignes, le client, l’entreprise, les paramètres et la séquence dans une transaction ;
- recalcule les montants ou reliquats ;
- refuse toute incohérence ;
- attribue le numéro propre au type ;
- fige les instantanés ;
- change le statut ;
- écrit la chronologie ;
- ne modifie aucun indicateur financier.

### DOC-F03 — Validité

`validUntil` est obligatoire pour un devis et facultatif/configurable pour une pro forma. Elle ne précède pas `issueDate`.

`effectiveStatus(document, today)` retourne `EXPIRED` pour un document émis dépassé, sans écrire en base. Acceptation ou conversion d’un document expiré exige la création d’une révision ou une confirmation métier explicitement testée.

### DOC-F04 — Acceptation et refus

L’acceptation/refus est manuel, daté et peut contenir une note. Le système ne prétend pas disposer d’une signature, livraison WhatsApp ou preuve juridique externe.

Un devis rejeté n’est pas converti. Un devis accepté devient immuable.

### DOC-F05 — Annulation

L’annulation exige motif, date et statut compatible. Elle ne supprime rien. Un document déjà converti ne peut pas être annulé sans traitement explicite du document cible ; le sprint ne doit pas inventer une cascade destructive.

### DOC-F06 — Calculs

Devis et pro forma utilisent exactement les mêmes règles de quantité, prix, remise, taxes et arrondi que les factures. Extraire un calculateur de lignes commerciales partagé si nécessaire, puis prouver que les résultats historiques des factures ne changent pas.

### DOC-F07 — Conversion en facture

Dans une transaction :

1. relire source et liens ;
2. vérifier statut et absence de conversion active ;
3. créer facture et lignes `BROUILLON` avec nouveaux identifiants ;
4. copier les instantanés et montants exacts ;
5. créer le lien ;
6. marquer la source `CONVERTED` ;
7. écrire la chronologie.

Aucun numéro facture n’est attribué et aucune créance n’est créée avant l’émission ultérieure selon le cas d’usage Facture existant.

### DOC-F08 — Devis vers pro forma

Même principe : nouveau brouillon, nouveaux identifiants, lien et copie exacte. Un devis ne peut produire qu’une pro forma active selon la règle retenue, sauf duplication/révision explicite.

### DOC-F09 — Bon de livraison

Le bon peut référencer des lignes de devis, pro forma ou facture. À l’émission, recalculer pour chaque ligne :

```text
remaining = source quantity
          − sum(quantity on non-cancelled issued/delivered notes)
```

Comparer des quantités ayant des échelles différentes avec `BigInt`, sans flottant. Refuser quantité nulle, négative ou supérieure au reliquat.

Les brouillons ne réservent pas le reliquat. Les bons `ISSUED` et `DELIVERED` le consomment. Une annulation le libère.

### DOC-F10 — Absence de stock

Émettre ou livrer un bon ne modifie aucun produit, quantité disponible ou mouvement de stock. Une aide visible le rappelle.

## 6. Séquences et paramètres

Ajouter aux paramètres des documents commerciaux :

- préfixe Devis ;
- préfixe Pro forma ;
- préfixe Bon de livraison ;
- prochain numéro initial ;
- remplissage ;
- validité par défaut du devis ;
- mention pro forma ;
- option d’affichage des prix sur bon, désactivée par défaut si elle est retenue.

Les séquences utilisent des clés distinctes par type et année, par exemple `quote:2026`, `proforma:2026`, `delivery-note:2026`.

## 7. Migration des anciens `ESTIMATE`

La migration réelle doit être testée avec : brouillon, émis, annulé, plusieurs lignes, client modifié après émission, numéro hérité et événement de chronologie.

Règles :

- type cible `LEGACY_ESTIMATE` ;
- statuts traduits sans inventer une acceptation ;
- montants et instantanés inchangés ;
- ligne conservée exactement ;
- numéro conservé dans `legacyNumber` et éventuellement `number` avec marqueur historique ;
- aucune nouvelle séquence consommée ;
- chronologie reliée au nouveau document ;
- ancien enregistrement supprimé seulement après copie complète dans la transaction ;
- vraie facture non touchée ;
- paiement actif sur `ESTIMATE` traité comme anomalie bloquante ;
- rollback prouvé par injection de faute.

L’écran de classification permet de choisir Devis ou Pro forma. Cette action conserve l’historique, ne renumérote pas et ne crée pas de facture.

## 8. Statistiques, paiements et trésorerie

- `commercialDocuments` exclus de `billedMinor`, créances, encaissements et prévisions de factures ;
- aucun paiement ne cible un document commercial ;
- aucun document commercial ne crée d’affectation de trésorerie ;
- valeur proposée et taux d’acceptation dans une section commerciale distincte ;
- livraison sans effet sur trésorerie ou dépenses ;
- tous les anciens `ESTIMATE` exclus des statistiques pendant et après migration ;
- intégrité vérifiée par tests de référence avant/après migration.

## 9. PDF

Créer un générateur ou des templates distincts, partageant seulement les primitives communes.

### Devis

- titre DEVIS ;
- numéro, dates et validité ;
- parties ;
- lignes chiffrées ;
- taxes/remises/totaux ;
- conditions et notes ;
- statut annulé si nécessaire.

### Pro forma

- titre FACTURE PRO FORMA ou PRO FORMA ;
- numéro et validité ;
- lignes et totaux ;
- mention configurable obligatoire indiquant le caractère non définitif ;
- aucun libellé « payé » ou « solde dû » issu du module Factures.

### Bon de livraison

- titre BON DE LIVRAISON ;
- numéro, date, adresse et référence source ;
- désignation, quantité et unité ;
- aucune colonne prix/taxe/total par défaut ;
- zones Livré par, Reçu par et observations ;
- pagination et numéros de page.

Les métadonnées PDF et noms de fichiers correspondent exactement au type.

## 10. Interface et routes

Routes attendues :

```text
/sales-documents
/quotes
/quotes/new
/quotes/[id]
/quotes/[id]/edit
/proformas
/proformas/new
/proformas/[id]
/proformas/[id]/edit
/delivery-notes
/delivery-notes/new
/delivery-notes/[id]
/delivery-notes/[id]/edit
```

Exigences mobiles :

- cartes dès 320 px ;
- filtres type/statut/client/période ;
- nombre de résultats et réinitialisation ;
- actions principales accessibles sans geste caché ;
- éditeur de lignes en cartes ;
- choix des quantités partielles clair ;
- badges textuels ;
- confirmation accessible des transitions ;
- aperçu adapté au téléphone et PDF téléchargeable ;
- aucune table horizontale essentielle ;
- mode sombre, clavier, focus et lecteur d’écran.

## 11. Chronologie client

Ajouter les événements nécessaires, par exemple :

- devis émis, accepté, refusé, converti, annulé ;
- pro forma émise, convertie, annulée ;
- bon émis, livré, annulé ;
- document historique classifié.

Chaque événement contient type, document, numéro, date et résumé sans donnée financière ambiguë. Les liens depuis la fiche client ouvrent le bon document.

## 12. Sauvegarde et restauration

- ajouter les trois collections ;
- mettre à jour la version de schéma réelle ;
- conserver les anciennes sauvegardes selon leur `sourceSchemaVersion` ;
- vérifier checksum avant adaptation ;
- injecter collections vides uniquement pour une version antérieure valide ;
- migrer les `ESTIMATE` restaurés selon la même stratégie que l’upgrade ;
- valider documents/lignes, liens, séquences, références client et produit facultatif ;
- rejeter lien orphelin, double conversion, quantité livrée excessive et numéro dupliqué ;
- transaction unique et rollback.

## 13. Tests obligatoires

### Domaine

- transitions valides et invalides par type ;
- expiration effective sans mutation ;
- calcul exact identique à facture ;
- grandes valeurs et multi-devises ;
- quantité livrée partielle avec échelles différentes ;
- reliquat, dépassement et annulation ;
- document commercial exclu des finances ;
- mention pro forma et absence de solde dû ;
- bon sans prix.

### Cas d’usage et transactions

- émission et séquence propre ;
- concurrence sur numéro ;
- acceptation/refus/annulation ;
- devis→pro forma ;
- devis→facture ;
- pro forma→facture ;
- refus de double conversion ;
- création de plusieurs bons partiels ;
- rollback à chaque étape ;
- instantanés immuables.

### Migration

- vraie base de version précédente remplie ;
- tous les cas `ESTIMATE` migrés en `LEGACY_ESTIMATE` ;
- classification manuelle ;
- vrais `INVOICE` inchangés ;
- paiement actif anormal bloquant ;
- chronologie reliée ;
- fermeture/réouverture ;
- restauration d’une ancienne sauvegarde.

### PDF

- trois PDF valides et lisibles ;
- titres et métadonnées exacts ;
- multipage ;
- caractères français ;
- absence de prix sur bon ;
- mention pro forma ;
- fichiers sûrs et partage/repli.

### E2E

1. migrer un ancien `ESTIMATE` ;
2. le classifier ;
3. créer et émettre un devis ;
4. accepter puis convertir en facture brouillon ;
5. prouver que le devis seul n’a modifié aucun indicateur financier ;
6. émettre la facture et vérifier alors le montant facturé ;
7. créer une pro forma puis la convertir ;
8. créer deux bons partiels ;
9. refuser un dépassement ;
10. annuler un bon et vérifier le reliquat ;
11. générer/partager les trois PDF ;
12. sauvegarder/restaurer ;
13. refaire les actions essentielles hors ligne.

## 14. Commandes de validation

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
npm.cmd run test:sprint14
```

Créer `scripts/e2e-sprint14-test.js` et `test:sprint14`.

## 15. Critères d’acceptation

1. aucun nouveau `ESTIMATE` n’est créé dans `invoices` ;
2. tous les héritages sont conservés et classifiables ;
3. les trois types utilisent leurs propres statuts et séquences ;
4. seuls les factures émises affectent les finances ;
5. aucune conversion double ou partielle ne subsiste après échec ;
6. les montants restent identiques lors d’une conversion ;
7. les livraisons partielles ne dépassent jamais la source ;
8. un transfert vers facture ne consomme pas prématurément son numéro ;
9. PDF et partage sont distincts et fonctionnels ;
10. historique, sauvegarde et restauration sont cohérents ;
11. parcours mobile et hors ligne réussis ;
12. toutes les commandes passent ;
13. aucun P0/P1 n’est ouvert ;
14. aucune action Git ou publication non autorisée n’a été effectuée.

Sans recette physique et vérification locale des mentions réglementaires, le verdict maximal est `SPRINT 14 VALIDATION CONDITIONNELLE`.
