# SAMTECH CRM — MODÈLE DE DONNÉES

**Document :** `DATABASE.md`  
**Produit :** SAMTECH CRM  
**Éditeur :** SAMTECH  
**Version du document :** 1.0  
**Statut :** Modèle de référence V1  
**Date :** Juillet 2026

---

# 1. Objet

Ce document définit le modèle de données local de SAMTECH CRM V1 Starter :

- entités ;
- champs et types ;
- clés et index ;
- relations ;
- contraintes ;
- transactions ;
- versions Dexie ;
- migrations ;
- sauvegarde et restauration.

IndexedDB, utilisée via Dexie.js, est la source de vérité métier de la V1.

---

# 2. Principes

## 2.1 Identité unique

Un prospect converti en client reste le même contact. La conversion ne duplique ni ses coordonnées ni son historique.

## 2.2 Identifiants portables

Les clés primaires sont des UUID générés par l'application. Elles ne dépendent pas d'un compteur local afin de préparer les exports et une future synchronisation.

## 2.3 Références explicites

Les relations utilisent des identifiants. IndexedDB ne garantit pas les clés étrangères ; l'application assure donc l'intégrité par les cas d'usage et les transactions.

## 2.4 Historique conservé

Les données utilisées par une facture ou un événement sont archivées ou figées. Elles ne disparaissent pas lorsque le catalogue ou le contact évolue.

## 2.5 Argent exact

Les montants sont stockés en unité monétaire minimale sous forme d'entiers sûrs lorsque la devise le permet. Le champ `currencyScale` indique le nombre de décimales.

Exemple : `150000` avec `XOF` et une échelle de `0` représente 150 000 FCFA.

## 2.6 Dates non ambiguës

- instants techniques : chaînes ISO 8601 UTC ;
- dates civiles : `YYYY-MM-DD` ;
- heures locales : format explicite avec fuseau lorsque nécessaire.

## 2.7 Archivage

Les entités réutilisées possèdent généralement `archivedAt`. Une valeur absente indique un élément actif.

---

# 3. Types communs

```ts
type UUID = string;
type ISODateTime = string; // UTC, exemple 2026-07-17T12:00:00.000Z
type LocalDate = string;   // YYYY-MM-DD
type CurrencyCode = string; // ISO 4217, exemple XOF
type MinorAmount = number; // entier sûr uniquement

interface AuditFields {
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  archivedAt?: ISODateTime;
}
```

Les montants dépassant la plage sûre de JavaScript nécessiteront une stratégie `bigint` ou décimale avant implémentation. Pour la V1, les limites métier doivent rester dans la plage des entiers sûrs.

---

# 4. Vue relationnelle

```text
locations ───────────────┐
                        ▼
contacts ──────── prospect_profiles
   │                     │
   │                     ├── prospect_interests ── products
   │                     └── contact_tags ───────── tags
   │
   ├────────── client_profiles
   │                 │
   │                 └── invoices ── invoice_lines
   │                          │
   │                          └── payments
   │
   ├────────── follow_ups
   ├────────── notes
   ├────────── timeline_events
   └────────── campaign_recipients ── campaigns

message_templates ─────── follow_ups / campaigns
categories ────────────── products
settings ──────────────── configuration locale
sequences ─────────────── numérotation des factures
```

---

# 5. Tables V1

La base contient les tables suivantes :

1. `contacts` ;
2. `prospectProfiles` ;
3. `clientProfiles` ;
4. `locations` ;
5. `categories` ;
6. `products` ;
7. `prospectInterests` ;
8. `tags` ;
9. `contactTags` ;
10. `notes` ;
11. `followUps` ;
12. `messageTemplates` ;
13. `campaigns` ;
14. `campaignRecipients` ;
15. `invoices` ;
16. `invoiceLines` ;
17. `payments` ;
18. `timelineEvents` ;
19. `settings` ;
20. `sequences` ;
21. `securitySettings` ;
22. `appMetadata`.

---

# 6. Table `contacts`

Stocke l'identité et les coordonnées partagées par les rôles prospect et client.

```ts
interface ContactRecord extends AuditFields {
  id: UUID;
  displayName: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  jobTitle?: string;
  whatsappPhone: string;
  normalizedWhatsappPhone: string;
  secondaryPhone?: string;
  normalizedSecondaryPhone?: string;
  email?: string;
  locationId?: UUID;
  address?: string;
  source?: ContactSource;
  customSource?: string;
}
```

## Index Dexie

```text
id,
normalizedWhatsappPhone,
displayName,
locationId,
source,
createdAt,
updatedAt,
archivedAt
```

## Contraintes

- `id` unique et immuable ;
- `displayName` non vide ;
- `whatsappPhone` et `normalizedWhatsappPhone` requis pour un prospect WhatsApp actif ;
- doublon de numéro averti selon `BR-013` ;
- une localité supprimée ne doit pas laisser une référence invalide.

## Sources initiales

```ts
type ContactSource =
  | 'WHATSAPP'
  | 'FACEBOOK'
  | 'INSTAGRAM'
  | 'LINKEDIN'
  | 'WEBSITE'
  | 'REFERRAL'
  | 'EVENT'
  | 'MANUAL'
  | 'OTHER';
```

---

# 7. Table `prospectProfiles`

Stocke les informations de prospection liées à un contact.

```ts
interface ProspectProfileRecord extends AuditFields {
  id: UUID;
  contactId: UUID;
  status: ProspectStatus;
  interestLevel: InterestLevel;
  firstContactDate: LocalDate;
  lostReason?: string;
  convertedAt?: ISODateTime;
  lastStatusChangedAt: ISODateTime;
}
```

## Statuts

```ts
type ProspectStatus =
  | 'NOUVEAU'
  | 'CONTACTE'
  | 'INTERESSE'
  | 'A_RELANCER'
  | 'NEGOCIATION'
  | 'CONVERTI'
  | 'PERDU';

type InterestLevel =
  | 'NON_QUALIFIE'
  | 'FROID'
  | 'TIEDE'
  | 'CHAUD';
```

## Index Dexie

```text
id,
&contactId,
status,
interestLevel,
firstContactDate,
convertedAt,
lastStatusChangedAt,
archivedAt,
[status+interestLevel]
```

`&contactId` représente un index unique : un seul profil prospect par contact.

---

# 8. Table `clientProfiles`

```ts
interface ClientProfileRecord extends AuditFields {
  id: UUID;
  contactId: UUID;
  convertedAt: ISODateTime;
  clientNumber?: string;
  lastPurchaseAt?: ISODateTime;
}
```

## Index Dexie

```text
id,
&contactId,
convertedAt,
clientNumber,
lastPurchaseAt,
archivedAt
```

Les indicateurs `totalSpent` et `balanceDue` ne sont pas des sources primaires. Ils sont calculés depuis les factures et paiements, ou mis en cache avec une stratégie explicite future.

---

# 9. Table `locations`

```ts
interface LocationRecord extends AuditFields {
  id: UUID;
  name: string;
  normalizedName: string;
  level: 'COUNTRY' | 'REGION' | 'CITY' | 'DISTRICT';
  parentId?: UUID;
  sortOrder?: number;
}
```

## Index Dexie

```text
id,
name,
normalizedName,
level,
parentId,
archivedAt,
[parentId+level],
[parentId+normalizedName]
```

## Contraintes

- nom non vide ;
- parent compatible avec le niveau ;
- pas de cycle hiérarchique ;
- unicité logique de `(parentId, level, normalizedName)` contrôlée par le cas d'usage.

---

# 10. Table `categories`

```ts
interface CategoryRecord extends AuditFields {
  id: UUID;
  name: string;
  normalizedName: string;
  description?: string;
  sortOrder?: number;
}
```

## Index Dexie

```text
id,
name,
normalizedName,
archivedAt
```

---

# 11. Table `products`

```ts
interface ProductRecord extends AuditFields {
  id: UUID;
  name: string;
  normalizedName: string;
  type: 'PRODUCT' | 'SERVICE';
  categoryId?: UUID;
  sku?: string;
  description?: string;
  unitLabel?: string;
  unitPriceMinor: MinorAmount;
  currency: CurrencyCode;
  currencyScale: number;
  defaultTaxRateBasisPoints?: number;
  isActive: boolean;
}
```

Un taux en points de base utilise `10000 = 100 %`, donc `1800 = 18 %`.

## Index Dexie

```text
id,
name,
normalizedName,
type,
categoryId,
sku,
isActive,
archivedAt,
[categoryId+isActive]
```

## Contraintes

- prix entier supérieur ou égal à zéro ;
- devise et échelle requises ;
- taux de taxe compris dans les limites validées ;
- modification du catalogue sans effet sur les factures existantes.

---

# 12. Table `prospectInterests`

Relation plusieurs-à-plusieurs entre prospects et produits.

```ts
interface ProspectInterestRecord extends AuditFields {
  id: UUID;
  prospectProfileId: UUID;
  productId: UUID;
  interestLevel?: InterestLevel;
  requestedAt: ISODateTime;
  note?: string;
}
```

## Index Dexie

```text
id,
prospectProfileId,
productId,
interestLevel,
requestedAt,
archivedAt,
[prospectProfileId+productId],
[productId+requestedAt]
```

## Contrainte

Une seule association active par couple prospect/produit. Les mises à jour complètent la relation existante au lieu de créer une demande en double.

---

# 13. Tables `tags` et `contactTags`

```ts
interface TagRecord extends AuditFields {
  id: UUID;
  name: string;
  normalizedName: string;
  color?: string;
}

interface ContactTagRecord {
  id: UUID;
  contactId: UUID;
  tagId: UUID;
  createdAt: ISODateTime;
}
```

## Index Dexie

`tags` :

```text
id,
&normalizedName,
name,
archivedAt
```

`contactTags` :

```text
id,
contactId,
tagId,
&[contactId+tagId]
```

La clé composée unique empêche l'association multiple du même tag au même contact.

---

# 14. Table `notes`

```ts
interface NoteRecord extends AuditFields {
  id: UUID;
  contactId: UUID;
  content: string;
  pinned: boolean;
}
```

## Index Dexie

```text
id,
contactId,
pinned,
createdAt,
updatedAt,
archivedAt,
[contactId+createdAt]
```

Le contenu est du texte simple ou un format riche strictement contrôlé. Aucun HTML arbitraire ne doit être exécuté.

---

# 15. Table `followUps`

```ts
interface FollowUpRecord extends AuditFields {
  id: UUID;
  contactId: UUID;
  channel: 'WHATSAPP' | 'PHONE' | 'EMAIL' | 'OTHER';
  dueAt: ISODateTime;
  timezone: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  status: 'PLANIFIEE' | 'REALISEE' | 'REPORTEE' | 'ANNULEE';
  reason?: string;
  messageTemplateId?: UUID;
  messageSnapshot?: string;
  completedAt?: ISODateTime;
  resultNote?: string;
  previousFollowUpId?: UUID;
}
```

## Index Dexie

```text
id,
contactId,
channel,
dueAt,
priority,
status,
completedAt,
previousFollowUpId,
archivedAt,
[status+dueAt],
[contactId+status]
```

Les vues Aujourd'hui, En retard et À venir s'appuient sur `[status+dueAt]`.

---

# 16. Table `messageTemplates`

```ts
interface MessageTemplateRecord extends AuditFields {
  id: UUID;
  name: string;
  category:
    | 'FIRST_CONTACT'
    | 'FOLLOW_UP'
    | 'QUOTE'
    | 'PROMOTION'
    | 'LOYALTY'
    | 'PAYMENT'
    | 'OTHER';
  content: string;
  variables: string[];
  isActive: boolean;
}
```

## Index Dexie

```text
id,
name,
category,
isActive,
archivedAt,
[category+isActive]
```

Le champ `variables` est dérivé ou validé à partir du contenu.

---

# 17. Table `campaigns`

```ts
interface CampaignRecord extends AuditFields {
  id: UUID;
  name: string;
  objective?: string;
  status: 'BROUILLON' | 'PRETE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
  audienceType: 'PROSPECTS' | 'CLIENTS' | 'ALL_CONTACTS';
  criteria: CampaignCriteria;
  messageTemplateId?: UUID;
  messageSnapshot: string;
  launchedAt?: ISODateTime;
  completedAt?: ISODateTime;
}

interface CampaignCriteria {
  locationIds?: UUID[];
  productInterestIds?: UUID[];
  purchasedProductIds?: UUID[];
  prospectStatuses?: ProspectStatus[];
  interestLevels?: InterestLevel[];
  tagIds?: UUID[];
  sources?: ContactSource[];
  createdFrom?: LocalDate;
  createdTo?: LocalDate;
  inactiveSince?: LocalDate;
}
```

## Index Dexie

```text
id,
name,
status,
audienceType,
launchedAt,
completedAt,
createdAt,
archivedAt,
[status+createdAt]
```

Les critères sont conservés pour audit. La liste effective est figée dans `campaignRecipients` au lancement.

---

# 18. Table `campaignRecipients`

```ts
interface CampaignRecipientRecord extends AuditFields {
  id: UUID;
  campaignId: UUID;
  contactId: UUID;
  normalizedPhoneSnapshot: string;
  displayNameSnapshot: string;
  resolvedMessageSnapshot: string;
  position: number;
  status:
    | 'A_TRAITER'
    | 'OUVERT_DANS_WHATSAPP'
    | 'CONFIRME_CONTACTE'
    | 'IGNORE'
    | 'ERREUR';
  openedAt?: ISODateTime;
  confirmedAt?: ISODateTime;
  errorCode?: string;
  resultNote?: string;
}
```

## Index Dexie

```text
id,
campaignId,
contactId,
status,
position,
normalizedPhoneSnapshot,
&[campaignId+contactId],
[campaignId+status],
[campaignId+position]
```

La contrainte composée empêche un contact d'apparaître deux fois dans une campagne.

---

# 19. Table `invoices`

```ts
interface InvoiceRecord extends AuditFields {
  id: UUID;
  clientProfileId: UUID;
  number?: string;
  status: 'BROUILLON' | 'EMISE' | 'PARTIELLEMENT_PAYEE' | 'PAYEE' | 'ANNULEE';
  issueDate?: LocalDate;
  dueDate?: LocalDate;
  currency: CurrencyCode;
  currencyScale: number;
  companySnapshot: PartySnapshot;
  clientSnapshot: PartySnapshot;
  subtotalMinor: MinorAmount;
  discountTotalMinor: MinorAmount; // somme des remises de lignes uniquement
  taxTotalMinor: MinorAmount;
  grandTotalMinor: MinorAmount;
  paidTotalMinor: MinorAmount;
  balanceMinor: MinorAmount;
  notes?: string;
  terms?: string;
  issuedAt?: ISODateTime;
  cancelledAt?: ISODateTime;
  cancellationReason?: string;
}

interface PartySnapshot {
  displayName: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  logoDataRef?: string;
}
```

## Index Dexie

```text
id,
&number,
clientProfileId,
status,
issueDate,
dueDate,
issuedAt,
archivedAt,
[clientProfileId+issueDate],
[status+dueDate]
```

## Notes

- `number` est absent pour un brouillon et unique après émission ;
- les champs de total sont enregistrés pour l'instantané, mais vérifiables depuis les lignes ;
- `discountTotalMinor` est la somme des `discountMinor` des lignes ; aucune remise globale n'est prise en charge en V1 ;
- les instantanés évitent toute modification rétroactive.

---

# 20. Table `invoiceLines`

```ts
interface InvoiceLineRecord extends AuditFields {
  id: UUID;
  invoiceId: UUID;
  productId?: UUID;
  position: number;
  designationSnapshot: string;
  descriptionSnapshot?: string;
  unitLabelSnapshot?: string;
  quantityScaled: number;
  quantityScale: number;
  unitPriceMinor: MinorAmount;
  grossMinor: MinorAmount;
  discountType?: 'NONE' | 'PERCENT' | 'AMOUNT';
  discountValue?: number;
  discountMinor: MinorAmount;
  taxRateBasisPoints: number;
  taxMinor: MinorAmount;
  lineTotalMinor: MinorAmount;
}
```

Une quantité décimale est stockée sous forme mise à l'échelle. Exemple : `1500` avec une échelle `3` représente `1,500`.

## Index Dexie

```text
id,
invoiceId,
productId,
position,
[invoiceId+position],
[productId+createdAt]
```

## Contraintes

- quantité strictement positive ;
- position unique dans la facture, contrôlée par cas d'usage ;
- montants cohérents avec le moteur de calcul ;
- une facture émise possède au moins une ligne.

---

# 21. Table `payments`

```ts
interface PaymentRecord extends AuditFields {
  id: UUID;
  invoiceId: UUID;
  clientProfileId: UUID;
  paymentDate: LocalDate;
  amountMinor: MinorAmount;
  currency: CurrencyCode;
  currencyScale: number;
  method: 'CASH' | 'WAVE' | 'ORANGE_MONEY' | 'BANK_TRANSFER' | 'CARD' | 'OTHER';
  reference?: string;
  note?: string;
  status: 'ACTIVE' | 'REVERSED';
  reversedAt?: ISODateTime;
  reversalReason?: string;
}
```

## Index Dexie

```text
id,
invoiceId,
clientProfileId,
paymentDate,
method,
status,
createdAt,
[invoiceId+status],
[clientProfileId+paymentDate]
```

Les paiements ne sont pas supprimés physiquement après validation. Une correction utilise `REVERSED`, puis éventuellement un nouveau paiement.

---

# 22. Table `timelineEvents`

```ts
interface TimelineEventRecord {
  id: UUID;
  contactId: UUID;
  type: TimelineEventType;
  occurredAt: ISODateTime;
  createdAt: ISODateTime;
  sourceEntityType?: string;
  sourceEntityId?: UUID;
  title: string;
  summary?: string;
  payloadVersion: number;
  payload?: Record<string, unknown>;
}
```

## Types initiaux

```ts
type TimelineEventType =
  | 'CONTACT_CREATED'
  | 'PROSPECT_STATUS_CHANGED'
  | 'NOTE_ADDED'
  | 'FOLLOW_UP_CREATED'
  | 'FOLLOW_UP_COMPLETED'
  | 'FOLLOW_UP_RESCHEDULED'
  | 'WHATSAPP_OPENED'
  | 'CAMPAIGN_PROCESSED'
  | 'PROSPECT_CONVERTED'
  | 'INVOICE_ISSUED'
  | 'INVOICE_CANCELLED'
  | 'PAYMENT_RECORDED'
  | 'PAYMENT_REVERSED'
  | 'CONTACT_ARCHIVED';
```

## Index Dexie

```text
id,
contactId,
type,
occurredAt,
sourceEntityId,
[contactId+occurredAt],
[sourceEntityType+sourceEntityId]
```

Le payload ne contient pas d'objet métier complet ni de secret.

---

# 23. Table `settings`

```ts
interface SettingsRecord {
  key: string;
  value: unknown;
  schemaVersion: number;
  updatedAt: ISODateTime;
}
```

## Clés prévues

- `company.profile` ;
- `regional.locale` ;
- `regional.currency` ;
- `invoice.defaults` ;
- `invoice.taxRates` ;
- `ui.preferences` ;
- `backup.preferences` ;
- `security.lockPreferences`.

## Index Dexie

```text
&key,
updatedAt
```

Chaque valeur est validée par un schéma associé à sa clé.

---

# 24. Table `sequences`

```ts
interface SequenceRecord {
  key: string;
  prefix: string;
  period?: string;
  nextValue: number;
  padding: number;
  updatedAt: ISODateTime;
}
```

Exemple :

```json
{
  "key": "invoice:2026",
  "prefix": "FAC-2026-",
  "period": "2026",
  "nextValue": 1,
  "padding": 4
}
```

L'attribution d'un numéro et l'incrément de la séquence s'effectuent dans la même transaction que l'émission.

---

# 25. Table `securitySettings`

```ts
interface SecuritySettingsRecord {
  id: 'local-security';
  pinEnabled: boolean;
  pinHash?: string;
  pinSalt?: string;
  pinAlgorithmVersion?: number;
  failedAttempts: number;
  lockedUntil?: ISODateTime;
  autoLockMinutes?: number;
  updatedAt: ISODateTime;
}
```

Cette table ne contient jamais le PIN en clair. Le choix final de l'algorithme est détaillé dans `SECURITY.md`.

---

# 26. Table `appMetadata`

```ts
interface AppMetadataRecord {
  key: string;
  value: string | number | boolean | null;
  updatedAt: ISODateTime;
}
```

Clés possibles :

- `database.createdAt` ;
- `database.lastMigratedAt` ;
- `database.lastVerifiedAt` ;
- `backup.lastExportedAt` ;
- `seed.demoDataInstalled` ;
- `app.lastOpenedVersion`.

---

# 27. Schéma Dexie initial

## Schéma réellement livré au Sprint 2 — Dexie V3

La V2 contient `contacts` et `prospectProfiles` avec les index décrits aux sections 6 et 7. La V3 conserve ces tables et leurs données sans transformation, puis ajoute :

```text
settings: &key, updatedAt
sequences: &key, updatedAt
locations: id, name, normalizedName, level, parentId, archivedAt, [parentId+level], [parentId+normalizedName]
categories: id, name, normalizedName, archivedAt
products: id, name, normalizedName, type, categoryId, sku, isActive, archivedAt, [categoryId+isActive]
prospectInterests: id, prospectProfileId, productId, interestLevel, requestedAt, archivedAt, [prospectProfileId+productId], [productId+requestedAt]
```

Les relations utilisent exclusivement les identifiants stables `contactId`, `locationId`, `categoryId`, `prospectProfileId` et `productId`. L'ouverture Dexie V3 effectue une montée de version additive : aucune table V2 n'est supprimée ou vidée. Le test `src/infrastructure/database/migration.test.ts` crée une base V2 réaliste, conserve plusieurs contacts et profils, ouvre la même base avec la classe V3, utilise les six nouvelles tables, ferme puis rouvre la base et revérifie les comptages.

## Schéma réellement livré au Sprint 3 — Dexie V4

La V4 conserve sans transformation les huit tables et tous les index de la V3, puis ajoute les magasins suivants :

```text
followUps: id, contactId, channel, dueAt, priority, status, completedAt, previousFollowUpId, archivedAt, [status+dueAt], [contactId+status]
messageTemplates: id, name, category, isActive, archivedAt, [category+isActive]
timelineEvents: id, contactId, type, occurredAt, sourceEntityId, [contactId+occurredAt], [sourceEntityType+sourceEntityId]
```

La montée V3 vers V4 est strictement additive : aucun `upgrade()` destructif, effacement ou réinitialisation n'est exécuté. Le test `src/infrastructure/database/migration-v4.test.ts` construit une base avec le schéma V3 exact, insère une ligne dans chacune des huit tables existantes, ouvre cette même base avec `SamtechCRMDatabase` V4, vérifie les données, écrit dans les trois nouvelles tables, ferme, rouvre et vérifie à nouveau les onze magasins.

Le report d'une relance écrit l'ancienne occurrence `REPORTEE`, la nouvelle occurrence `PLANIFIEE` et son événement `FOLLOW_UP_RESCHEDULED` dans une unique transaction Dexie couvrant `followUps` et `timelineEvents`.

Schéma indicatif à confirmer pendant l'implémentation :

```ts
db.version(1).stores({
  contacts:
    'id, normalizedWhatsappPhone, displayName, locationId, source, createdAt, updatedAt, archivedAt',
  prospectProfiles:
    'id, &contactId, status, interestLevel, firstContactDate, convertedAt, lastStatusChangedAt, archivedAt, [status+interestLevel]',
  clientProfiles:
    'id, &contactId, convertedAt, clientNumber, lastPurchaseAt, archivedAt',
  locations:
    'id, name, normalizedName, level, parentId, archivedAt, [parentId+level], [parentId+normalizedName]',
  categories:
    'id, name, normalizedName, archivedAt',
  products:
    'id, name, normalizedName, type, categoryId, sku, isActive, archivedAt, [categoryId+isActive]',
  prospectInterests:
    'id, prospectProfileId, productId, interestLevel, requestedAt, archivedAt, [prospectProfileId+productId], [productId+requestedAt]',
  tags:
    'id, &normalizedName, name, archivedAt',
  contactTags:
    'id, contactId, tagId, &[contactId+tagId]',
  notes:
    'id, contactId, pinned, createdAt, updatedAt, archivedAt, [contactId+createdAt]',
  followUps:
    'id, contactId, channel, dueAt, priority, status, completedAt, previousFollowUpId, archivedAt, [status+dueAt], [contactId+status]',
  messageTemplates:
    'id, name, category, isActive, archivedAt, [category+isActive]',
  campaigns:
    'id, name, status, audienceType, launchedAt, completedAt, createdAt, archivedAt, [status+createdAt]',
  campaignRecipients:
    'id, campaignId, contactId, status, position, normalizedPhoneSnapshot, &[campaignId+contactId], [campaignId+status], [campaignId+position]',
  invoices:
    'id, &number, clientProfileId, status, issueDate, dueDate, issuedAt, archivedAt, [clientProfileId+issueDate], [status+dueDate]',
  invoiceLines:
    'id, invoiceId, productId, position, [invoiceId+position], [productId+createdAt]',
  payments:
    'id, invoiceId, clientProfileId, paymentDate, method, status, createdAt, [invoiceId+status], [clientProfileId+paymentDate]',
  timelineEvents:
    'id, contactId, type, occurredAt, sourceEntityId, [contactId+occurredAt], [sourceEntityType+sourceEntityId]',
  settings: '&key, updatedAt',
  sequences: '&key, period, updatedAt',
  securitySettings: '&id, updatedAt',
  appMetadata: '&key, updatedAt'
});
```

Une revue doit vérifier que chaque index répond à une requête réelle. Les index inutiles augmentent le stockage et le coût des écritures.

---

# 28. Transactions obligatoires

## Conversion prospect/client

Tables : `prospectProfiles`, `clientProfiles`, `timelineEvents`.

## Report d'une relance

Tables : `followUps`, `timelineEvents`.

## Lancement d'une campagne

Tables : `campaigns`, `campaignRecipients`, éventuellement `timelineEvents`.

## Émission de facture

Tables : `invoices`, `invoiceLines`, `sequences`, `timelineEvents`.

## Paiement

Tables : `payments`, `invoices`, `clientProfiles`, `timelineEvents`.

## Annulation de paiement

Tables : `payments`, `invoices`, `timelineEvents`.

## Restauration

Toutes les tables métier concernées, avec validation préalable hors transaction d'écriture.

---

# 29. Règles d'intégrité applicative

IndexedDB ne fournissant pas de clés étrangères, les services doivent garantir :

- tout profil référence un contact existant ;
- tout intérêt référence un prospect et un produit existants ;
- toute facture référence un client existant ;
- toute ligne référence une facture existante ;
- tout paiement référence une facture et le même client ;
- tout destinataire référence sa campagne ;
- tout événement référence un contact existant, sauf événement système futur ;
- toute suppression logique préserve les références.

Un outil de vérification d'intégrité doit être prévu pour les tests et le diagnostic.

---

# 30. Requêtes principales

## Prospects

- par statut et intérêt ;
- par numéro normalisé ;
- par localité ;
- par produit demandé ;
- par tag ;
- par date de création ;
- actifs ou archivés.

## Relances

- planifiées avant une date ;
- en retard ;
- du jour ;
- à venir ;
- par contact.

## Clients

- par date de conversion ;
- par localité ;
- par produit acheté ;
- par date du dernier achat.

## Factures

- par client ;
- par statut ;
- par date d'émission ;
- par échéance ;
- impayées ou en retard.

## Campagnes

- par statut ;
- destinataires à traiter par position ;
- progression par état.

---

# 31. Statistiques

Les statistiques sont calculées depuis les données sources.

Pour la V1, éviter des tables d'agrégats tant que les volumes ne les rendent pas nécessaires. Si les performances deviennent insuffisantes, les agrégats doivent être :

- dérivés ;
- reconstruisibles ;
- invalidés dans les mêmes transactions ;
- versionnés.

Les factures annulées et paiements renversés sont exclus conformément à `RULES.md`.

---

# 32. Volumes de référence

La V1 doit être testée au minimum avec :

- 10 000 contacts ;
- 20 000 intérêts produits ;
- 20 000 relances ;
- 500 produits et services ;
- 2 000 factures ;
- 10 000 lignes de facture ;
- 4 000 paiements ;
- 100 campagnes ;
- 20 000 destinataires de campagne ;
- 50 000 événements de chronologie.

Ces volumes sont des cibles de test, non des limites commerciales garanties. Les résultats doivent être mesurés sur un appareil mobile représentatif.

---

# 33. Migrations

## Principes

- toute modification du schéma incrémente la version ;
- chaque migration est idempotente dans son contexte ;
- aucune migration ne supprime silencieusement une donnée ;
- les migrations utilisent des lots si le volume le nécessite ;
- une sauvegarde est recommandée avant une évolution risquée ;
- les versions anciennes prises en charge sont documentées.

## Processus

1. ouvrir la base ;
2. détecter la version ;
3. exécuter les transformations Dexie ;
4. valider les invariants essentiels ;
5. inscrire la migration dans `appMetadata` ;
6. rendre l'application disponible.

## Échec

En cas d'échec, l'application ne doit pas effacer la base. Elle affiche un mode de récupération et, si possible, permet d'exporter les données brutes pour assistance.

---

# 34. Sauvegarde

Le format de sauvegarde est indépendant du schéma interne Dexie.

Chaque collection exportée comprend :

- un nom stable ;
- une version ;
- une liste d'enregistrements ;
- les métadonnées nécessaires.

Les index Dexie ne sont pas exportés : ils sont reconstruits à l'import.

Les données de sécurité sensibles peuvent être exclues ou traitées séparément. Le PIN local ne doit pas empêcher une restauration légitime sans procédure documentée.

---

# 35. Restauration

## Étapes

1. lire le fichier sans écriture ;
2. vérifier le type et la version ;
3. valider chaque collection ;
4. contrôler les identifiants et références ;
5. convertir le format si nécessaire ;
6. afficher un résumé ;
7. obtenir confirmation ;
8. remplacer les données dans une transaction ;
9. vérifier l'intégrité ;
10. rouvrir les vues.

## Mode V1

La restauration remplace l'ensemble de la base métier. La fusion de deux bases est hors périmètre tant que les conflits ne sont pas précisément définis.

---

# 36. Données de démonstration

Les données de démonstration utilisent des identifiants connus et un marqueur `demoDatasetId` si nécessaire.

Elles doivent pouvoir être supprimées par une opération contrôlée sans toucher aux données réelles ajoutées ensuite. Une stratégie plus sûre consiste à proposer la démonstration dans une base IndexedDB distincte.

---

# 37. Confidentialité

- aucune donnée métier n'est envoyée à un serveur dans la V1 ;
- les journaux n'incluent pas les coordonnées ou messages complets ;
- les fichiers de sauvegarde sont présentés comme sensibles ;
- les données ne sont pas placées dans `localStorage` si IndexedDB convient ;
- les informations sensibles ne sont pas incluses dans les URL ;
- les exports ne doivent pas rester inutilement dans un cache applicatif.

---

# 38. Évolution cloud future

Les champs suivants préparent sans implémenter la synchronisation :

- UUID ;
- `createdAt` ;
- `updatedAt` ;
- archivage explicite ;
- événements versionnés ;
- sauvegardes versionnées.

Avant la V2, il faudra ajouter ou revoir :

- propriétaire/organisation ;
- révisions ;
- tombstones de suppression ;
- horloge et conflits ;
- droits ;
- chiffrement et authentification ;
- migrations serveur ;
- file de synchronisation.

Ces mécanismes ne doivent pas être simulés dans la V1.

---

# 39. Vérification d'intégrité

Une fonction de diagnostic doit pouvoir détecter :

- références orphelines ;
- doublons de numéros ;
- profils multiples pour un contact ;
- campagnes sans destinataires cohérents ;
- factures sans lignes ;
- totaux de facture incohérents ;
- paiements dépassant le total ;
- soldes ou statuts incohérents ;
- séquences inférieures à des numéros déjà attribués ;
- événements référant des entités absentes.

Le diagnostic ne corrige pas automatiquement les données sans stratégie explicite.

---

# 40. Tests de base de données

Les tests doivent couvrir :

- création et ouverture de la base ;
- tous les index critiques ;
- unicités ;
- transactions et rollback ;
- conversion prospect/client ;
- émission concurrente logique de factures ;
- paiements partiels ;
- renversement de paiement ;
- report de relance ;
- lancement et reprise de campagne ;
- migration entre chaque version ;
- export et restauration ;
- fichiers invalides ;
- volumes de référence ;
- diagnostic d'intégrité.

---

# 41. Décisions à confirmer pendant le prototype

- bibliothèque UUID et compatibilité navigateurs ;
- stockage des logos et pièces jointes ;
- limite de taille des images intégrées ;
- bibliothèque décimale ou stratégie d'entiers ;
- échelle maximale des quantités ;
- méthode de génération PDF ;
- chiffrement éventuel des sauvegardes ;
- comportement exact du PIN lors d'une restauration.

Toute décision confirmée doit être inscrite dans l'architecture et le changelog documentaire.

---

# 42. Définition de terminé

Le modèle de données V1 est prêt lorsque :

- toutes les entités du cahier des charges sont représentées ;
- les règles `RULES.md` sont applicables ;
- les requêtes critiques disposent d'index adaptés ;
- les transactions sont identifiées ;
- les calculs sont vérifiables ;
- une migration d'exemple est testée ;
- une sauvegarde complète est restaurable ;
- les volumes de référence sont mesurés ;
- le diagnostic d'intégrité ne détecte aucune anomalie sur un jeu valide.

---

# 43. Prochaine étape

Après validation de `DATABASE.md`, le document `OFFLINE_FIRST.md` doit préciser le cycle de vie de la PWA, le cache applicatif, les mises à jour, les migrations, les limites des navigateurs et les scénarios de récupération.

---

# 44. Principe directeur

**Une donnée enregistrée doit rester identifiable, cohérente, exportable et compréhensible pendant toute la vie commerciale du contact.**

---

# 45. État implémenté — Sprint 4

La migration Sprint 4 V4 → V5 crée `clientProfiles` avec les index `id`, `&contactId`, `convertedAt`, `clientNumber`, `lastPurchaseAt` et `archivedAt`. Elle ne transforme ni ne recopie les enregistrements existants. V6 active ensuite `tags`, `contactTags` et `notes`. À l'issue du Sprint 5, la version était V7 : cette migration ajoute exclusivement `invoices` et `invoiceLines` avec les index documentés, sans `upgrade()` destructif, recopie, suppression ni réinitialisation.

La conversion écrit dans une seule transaction `prospectProfiles + clientProfiles + timelineEvents`. Le `contactId` reste identique, le profil prospect passe à `CONVERTI`, la date est portée par les deux profils et un événement `PROSPECT_CONVERTED` est ajouté. L’index unique et la vérification dans la transaction empêchent deux profils clients pour un même contact.

Le test historique construit le véritable schéma V4, ouvre V5 puis V6 et vérifie Notes/Tags sans perte. La preuve Sprint 5 construit séparément le véritable schéma V6 avec une donnée dans chacune de ses quinze tables, dont un client avec localité, produit, relance et chronologie ; elle ouvre la même base en V7, crée une facture et ses lignes, ferme, rouvre et vérifie toutes les données anciennes et nouvelles. Aucune suppression de base n’intervient entre ces étapes.

---

# 46. État implémenté — Sprint 6

À l'issue du Sprint 6, la version était Dexie V8. La migration V7 → V8 est strictement additive et crée `payments` avec les index `id`, `invoiceId`, `clientProfileId`, `paymentDate`, `method`, `status`, `createdAt`, `[invoiceId+status]` et `[clientProfileId+paymentDate]`. Elle ne recopie, ne supprime et ne réinitialise aucune donnée historique.

Un paiement est une écriture 1-N rattachée à une facture et à son profil client. Il conserve son montant en unité monétaire minimale, la devise, l’échelle, la date commerciale, le mode, la référence et la note facultatives. Il n’est ni modifié ni supprimé : une correction passe de `ACTIVE` à `REVERSED` et conserve le motif et l’horodatage de contrepassation.

`paidTotalMinor`, `balanceMinor` et le statut de facture sont des agrégats recalculés exclusivement depuis les paiements `ACTIVE`. L’enregistrement et la contrepassation utilisent chacun une transaction unique `payments + invoices + timelineEvents` (avec lecture du profil client). L’annulation d’une facture relit également les paiements actifs dans sa transaction et ne se fie pas aux seuls agrégats mémorisés.

La preuve `migration-v8.test.ts` construit le véritable schéma V7 avec une ligne dans chacune des dix-sept tables, ouvre la même base en V8, ajoute des paiements actif et contrepassé, ferme, rouvre, puis vérifie sans suppression toutes les données V7 et V8.

---

# 47. État implémenté — Sprint 7

À l'issue du Sprint 7, la version était Dexie V9. La migration V8 → V9 ajoute exclusivement `campaigns` et `campaignRecipients` avec les index documentés, dont les contraintes `&[campaignId+contactId]`, `[campaignId+status]` et `[campaignId+position]`. Elle ne transforme, ne supprime et ne réinitialise aucune table V8.

`CampaignCriteria` conserve deux décisions V1 supplémentaires : `excludedContactIds` pour les exclusions manuelles et `allowEmptyVariableContactIds` pour les substitutions vides explicitement confirmées. Ces listes restent modifiables avant lancement seulement. Au lancement, téléphone, nom, message résolu et position sont figés dans `campaignRecipients`.

Le test `migration-v9.test.ts` construit le véritable schéma V8 avec une donnée dans chacune de ses dix-huit tables, y compris client, prospect, produit, facture et paiement; il migre en V9, ajoute campagne et destinataires, ferme, rouvre et vérifie toutes les données sans suppression intermédiaire.

---

# 48. État implémenté — Sprint 9

La version était Dexie V10. La migration V9 → V10 est strictement additive : elle crée uniquement `securitySettings` avec `&id, updatedAt`.

# 49. État implémenté — Sprint 11

La version courante est Dexie V11. La migration V10 → V11 ajoute `expenses`.
Le format de sauvegarde accepté est `samtech-crm`, avec un schéma source compris entre 1 et 11 et les vingt-et-une collections obligatoires suivantes : `settings`, `sequences`, `locations`, `categories`, `products`, `contacts`, `prospectProfiles`, `prospectInterests`, `clientProfiles`, `tags`, `contactTags`, `notes`, `timelineEvents`, `followUps`, `messageTemplates`, `invoices`, `invoiceLines`, `payments`, `campaigns`, `campaignRecipients`, `expenses`. Les index Dexie et `securitySettings` sont exclus.

La restauration remplace les 21 tables dans une transaction Dexie unique.

## État V1 bêta

La version applicative conserve Dexie V11 : 21 tables métier exportables et `securitySettings` séparée.
