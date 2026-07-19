# Analyse fonctionnelle et technique — Sprint 14

## Devis, factures pro forma et bons de livraison

## 1. Contexte

SAMTECH CRM sait créer des factures, les émettre, produire un PDF, enregistrer les paiements et calculer les créances. Le code actuel contient aussi un type `ESTIMATE` présenté sous le libellé ambigu « Devis / Proforma » dans le même registre que les factures.

Cette implémentation partielle présente plusieurs risques :

- un devis et une pro forma sont deux documents différents ;
- l’émission d’un `ESTIMATE` utilise actuellement la séquence des factures ;
- les statuts de facture ne correspondent pas au cycle d’un devis ;
- les statistiques et créances peuvent inclure un document qui n’est pas une facture si elles ne filtrent pas le type ;
- aucun bon de livraison ou suivi de quantité livrée n’existe ;
- la conversion actuelle du devis vers une facture est une duplication sans lien métier durable.

Le Sprint 14 doit créer un véritable module de documents commerciaux, migrer les anciens `ESTIMATE` sans perte et garantir qu’aucun document préparatoire n’affecte les indicateurs financiers avant conversion explicite en facture.

## 2. Définitions

### Devis

Proposition commerciale chiffrée avec durée de validité. Il peut être accepté ou refusé manuellement, puis transformé en pro forma ou en facture.

### Facture pro forma

Document commercial informatif présentant les conditions d’une vente envisagée. Dans SAMTECH CRM, elle ne crée ni créance, ni paiement, ni chiffre facturé. Elle porte une mention visible indiquant qu’elle ne constitue pas la facture définitive.

### Bon de livraison

Document constatant les articles ou prestations remis au client. Il présente les quantités et références, sans prix ni total financier par défaut. Il ne réduit aucun stock, car la gestion de stock reste hors périmètre.

### Facture

Seule la facture émise participe au montant facturé, aux créances, aux paiements et aux statistiques financières existantes.

Les formulations et obligations réglementaires locales doivent être validées avant commercialisation par une personne compétente. Le sprint ne doit pas revendiquer une conformité juridique ou fiscale non vérifiée.

## 3. Objectifs métier

L’utilisateur doit pouvoir :

- créer un devis professionnel ;
- définir sa validité et ses conditions ;
- l’émettre, le partager et enregistrer son acceptation ou son refus ;
- convertir un devis accepté en pro forma ou en facture sans ressaisie ;
- créer et émettre une pro forma distincte ;
- convertir une pro forma en facture ;
- produire un ou plusieurs bons de livraison, y compris pour une livraison partielle ;
- connaître les quantités déjà engagées dans des bons actifs et les quantités restantes ;
- retrouver tous les documents depuis la fiche client et la chronologie ;
- conserver les instantanés historiques même si le catalogue ou le client change ;
- utiliser ces parcours sur smartphone et hors ligne.

## 4. Principe d’architecture

Les documents commerciaux ne doivent pas rester dans `invoices`.

Le modèle recommandé ajoute :

1. `commercialDocuments` ;
2. `commercialDocumentLines` ;
3. `commercialDocumentLinks`.

Les factures restent dans `invoices` et `invoiceLines`. Un lien explicite relie un devis ou une pro forma à la facture créée. Les lignes commerciales utilisent le même moteur exact de calcul que les factures pour éviter toute divergence, mais leurs cycles de vie et dépôts restent distincts.

Si le schéma final du Sprint 13 est Dexie V12 avec 26 collections métier, le prochain schéma attendu est V13 avec 29 collections. Gemini doit vérifier l’état réel avant de choisir le numéro.

## 5. Types et cycles de vie

### Devis — `QUOTE`

```text
DRAFT → ISSUED → ACCEPTED → CONVERTED
               ↘ REJECTED
               ↘ CANCELLED
```

Un devis `ISSUED` dont la date de validité est dépassée possède un état effectif `EXPIRED`, calculé sans modifier silencieusement la base lors d’une simple lecture. Il peut être dupliqué ou révisé, mais pas accepté sans confirmation de l’expiration.

### Pro forma — `PROFORMA`

```text
DRAFT → ISSUED → ACCEPTED → CONVERTED
               ↘ CANCELLED
```

L’acceptation est manuelle et facultative avant conversion selon la règle retenue. Une pro forma annulée ou expirée n’est pas convertie sans création explicite d’un nouveau document.

### Bon de livraison — `DELIVERY_NOTE`

```text
DRAFT → ISSUED → DELIVERED
               ↘ CANCELLED
```

Un bon émis réserve les quantités de son document source afin d’empêcher un second bon de dépasser le reliquat. Une annulation libère les quantités. Le statut `DELIVERED` confirme manuellement la remise.

### Héritage — `LEGACY_ESTIMATE`

Les anciens documents `ESTIMATE` portaient un libellé commun « Devis / Proforma ». Leur intention ne peut pas être déduite honnêtement.

Ils sont migrés vers un type temporaire `LEGACY_ESTIMATE` et conservent numéro, dates, statut, client, entreprise, lignes, montants et historique. Ils n’entrent dans aucun indicateur financier et doivent être classifiés manuellement comme devis ou pro forma avant toute nouvelle conversion.

## 6. Numérotation

Chaque type possède une séquence séparée, attribuée uniquement à l’émission :

- devis : préfixe recommandé `DEV-` ;
- pro forma : `PRO-` ;
- bon de livraison : `BL-` ;
- facture : séquence existante inchangée.

Exemple : `DEV-2026-0001`.

Règles :

- numéro unique par type ;
- attribution atomique avec l’émission ;
- aucun numéro définitif sur un brouillon ;
- numéro consommé jamais réutilisé ;
- préfixe, période annuelle, prochain numéro et remplissage configurables ;
- une conversion en facture ne consomme la séquence facture qu’à l’émission de la facture, pas lors de la création de son brouillon ;
- un numéro historique issu de l’ancienne séquence reste marqué comme hérité et n’est pas renuméroté.

## 7. Données et instantanés

Un document commercial contient :

- type et statut ;
- numéro éventuel ;
- profil client ;
- instantanés entreprise et client ;
- devise et échelle ;
- date d’émission ;
- date de validité pour devis/pro forma ;
- date de livraison et adresse pour le bon ;
- conditions, notes et référence client facultatives ;
- totaux exacts pour devis/pro forma ;
- informations de statut et d’annulation ;
- audit de création et mise à jour ;
- identifiant d’origine héritée si nécessaire.

Les lignes de devis/pro forma reprennent désignation, description, quantité, unité, prix, remise, taxe et totaux exacts.

Les lignes de bon contiennent désignation, description, unité et quantité livrée. Elles peuvent référencer une ligne source pour contrôler le reliquat. Les prix et taxes ne figurent pas sur le PDF du bon par défaut.

Après émission, les instantanés et lignes sont immuables. Une correction passe par annulation puis création ou duplication d’un nouveau document.

## 8. Conversions

### Devis vers pro forma

- source `ACCEPTED` ;
- création d’une pro forma `DRAFT` avec nouveaux identifiants ;
- copie des instantanés et lignes ;
- lien `QUOTE_TO_PROFORMA` ;
- le devis reste accepté tant que la pro forma n’est pas convertie en facture.

### Devis vers facture

- devis `ACCEPTED` et non annulé ;
- création atomique d’une facture `BROUILLON` ;
- copie exacte des lignes et instantanés pertinents ;
- lien `QUOTE_TO_INVOICE` ;
- devis marqué `CONVERTED` dans la même transaction ;
- une seule facture active créée depuis le même devis.

### Pro forma vers facture

- pro forma `ISSUED` ou `ACCEPTED`, selon la règle documentée ;
- mêmes garanties transactionnelles ;
- lien `PROFORMA_TO_INVOICE` ;
- statut `CONVERTED` ;
- aucune créance avant émission ultérieure de la facture.

### Vers bon de livraison

Un bon peut provenir d’un devis accepté, d’une pro forma émise/acceptée ou d’une facture émise. Il sélectionne une quantité pour chaque ligne source.

À l’émission du bon :

- recalcul du reliquat dans la transaction ;
- quantité strictement positive ;
- conversion exacte des échelles de quantité ;
- somme des bons actifs ≤ quantité source ;
- lien `DELIVERY_FOR` ;
- absence totale d’effet sur chiffre facturé, paiement, dépense ou trésorerie.

## 9. Révisions et duplications

Un document émis n’est pas modifié. L’utilisateur peut :

- dupliquer un devis expiré ou refusé comme nouveau brouillon ;
- créer une révision liée par `SUPERSEDES` ;
- annuler l’ancien document avec motif ;
- modifier librement le nouveau brouillon ;
- émettre avec un nouveau numéro.

La révision ne remplace pas rétroactivement l’historique.

## 10. Indicateurs

Les documents commerciaux fournissent des indicateurs non financiers :

- devis émis, acceptés, refusés, expirés et convertis ;
- taux d’acceptation ;
- valeur proposée par devise ;
- délai moyen d’acceptation ;
- pro forma en attente et converties ;
- bons émis, livrés et partiels ;
- quantités restant à livrer.

Ils sont toujours séparés des indicateurs suivants : facturé, encaissé, créances, dépenses, trésorerie et chiffre de vente.

## 11. PDF et partage

Chaque type dispose d’un titre, d’une structure et d’un nom de fichier distincts :

- `devis-DEV-2026-0001.pdf` ;
- `proforma-PRO-2026-0001.pdf` ;
- `bon-livraison-BL-2026-0001.pdf`.

Le devis montre validité, prix, remises, taxes, total et conditions.

La pro forma montre les montants et une mention explicite, configurable mais présente, indiquant qu’il ne s’agit pas de la facture définitive.

Le bon de livraison montre quantités, unités, adresse, date, référence et zones « Livré par » / « Reçu par », sans prix par défaut.

Le partage utilise Web Share lorsque disponible et le téléchargement comme repli. Aucun envoi WhatsApp automatique ou confirmation de réception n’est déduit.

## 12. Écrans

- `/sales-documents` — vue consolidée ;
- `/quotes`, `/quotes/new`, `/quotes/[id]`, `/quotes/[id]/edit` ;
- `/proformas`, `/proformas/new`, `/proformas/[id]`, `/proformas/[id]/edit` ;
- `/delivery-notes`, `/delivery-notes/new`, `/delivery-notes/[id]`, `/delivery-notes/[id]/edit` ;
- classification des anciens `LEGACY_ESTIMATE` ;
- paramètres de numérotation ;
- intégration dans la fiche client et la chronologie.

Sur smartphone, les listes sont en cartes et l’éditeur de lignes reste proche du formulaire Facture déjà connu. Le bon de livraison doit permettre de saisir les quantités partielles sans tableau horizontal indispensable.

## 13. Migration de `ESTIMATE`

La migration doit :

1. rechercher tous les `invoices` de type `ESTIMATE` ;
2. vérifier qu’aucun paiement actif ne leur est rattaché ;
3. copier chaque document vers `commercialDocuments` comme `LEGACY_ESTIMATE` ;
4. copier ses lignes vers `commercialDocumentLines` ;
5. préserver identifiants ou une correspondance déterministe ;
6. migrer les références de chronologie vers le nouveau document sans perdre l’événement ;
7. conserver le numéro et marquer sa provenance historique ;
8. supprimer l’ancien enregistrement et ses lignes uniquement dans la transaction réussie ;
9. prouver le rollback si une étape échoue ;
10. garantir que les vraies factures restent inchangées.

Si un paiement actif, une référence incohérente ou un conflit est trouvé, la migration ne doit pas inventer une correction. Elle doit échouer de manière explicite ou mettre l’élément en quarantaine selon une stratégie documentée et testée.

Après migration, `InvoiceRecord` et l’interface Factures ne créent plus `ESTIMATE`.

## 14. Sauvegarde et restauration

Les trois nouvelles collections rejoignent la sauvegarde. Les anciennes sauvegardes restent restaurables selon `sourceSchemaVersion` :

- V12, si elle est la version de départ, contient les 26 collections historiques ;
- la nouvelle version exige les 29 collections si aucune autre migration intermédiaire n’existe ;
- le checksum est vérifié avant adaptation ;
- les collections nouvelles sont injectées vides pour les anciennes sauvegardes valides ;
- après restauration d’une sauvegarde contenant des `ESTIMATE` historiques, une étape de migration déterministe est appliquée avant exposition de l’application ;
- références, lignes, liens, séquences et unicités sont validés ;
- restauration atomique et rollback obligatoires.

## 15. Risques

- **Document préparatoire compté comme facture** : collections séparées et tests financiers.
- **Ancien `ESTIMATE` mal classifié** : type temporaire à classifier manuellement.
- **Séquence facture consommée** : séquences propres par type.
- **Double conversion** : lien unique et transaction.
- **Livraison supérieure à la commande** : recalcul du reliquat à l’émission.
- **Divergence des totaux** : moteur de calcul partagé et exact.
- **Modification historique** : instantanés immuables après émission.
- **Promesse juridique excessive** : mentions configurables et validation locale requise.
- **Bon assimilé à un stock** : rappel explicite de l’absence de gestion de stock.

## 16. Décision de fin de sprint

- **SPRINT 14 VALIDÉ** : migration prouvée, documents distincts, conversions atomiques, PDF corrects, aucune incidence financière prématurée, tests mobiles/hors ligne réussis.
- **SPRINT 14 VALIDATION CONDITIONNELLE** : automatisation conforme mais recette physique ou validation juridique des mentions non réalisée.
- **SPRINT 14 NON VALIDÉ** : devis/pro forma compté comme facture, séquence corrompue, double conversion, dépassement de livraison, perte de données ou P0/P1.

Aucun document autre qu’une facture émise ne doit créer une créance ou recevoir un paiement.
