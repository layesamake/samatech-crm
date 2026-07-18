# SAMTECH CRM — ARCHITECTURE TECHNIQUE

**Document :** `ARCHITECTURE.md`  
**Produit :** SAMTECH CRM  
**Éditeur :** SAMTECH  
**Version du document :** 1.0  
**Statut :** Architecture de référence V1  
**Date :** Juillet 2026

---

# 1. Objet

Ce document définit l'architecture technique de SAMTECH CRM V1 Starter.

Il traduit `VISION.md`, `CAHIER_DES_CHARGES.md` et `RULES.md` en composants logiciels, responsabilités, dépendances et flux de données.

La V1 est une application Web progressive :

- mobile-first ;
- offline-first ;
- mono-utilisateur ;
- sans backend métier ;
- sans synchronisation cloud ;
- sans gestion des licences ;
- avec IndexedDB comme source locale de vérité.

---

# 2. Objectifs architecturaux

L'architecture doit favoriser :

1. la fiabilité des données commerciales et financières ;
2. le fonctionnement hors connexion ;
3. la simplicité de maintenance ;
4. la testabilité des règles métier ;
5. une expérience rapide sur smartphone ;
6. des migrations locales sûres ;
7. une future évolution vers le cloud sans dépendance prématurée ;
8. une documentation exploitable par des développeurs et outils d'IA.

---

# 3. Principes

## 3.1 Local-first pour la V1

Toutes les opérations métier essentielles lisent et écrivent dans IndexedDB. Le réseau ne doit pas être requis pour gérer les données.

## 3.2 Séparation des responsabilités

Les composants d'interface ne contiennent pas directement les règles financières, les transitions de statuts ou les migrations.

## 3.3 Dépendances dirigées vers le métier

Le domaine métier ne dépend ni de React, ni de Dexie, ni du service worker, ni d'une bibliothèque d'interface.

## 3.4 Interfaces explicites

L'accès aux données et aux services externes est défini par des contrats TypeScript.

## 3.5 Pas d'abstraction prématurée

La V1 reste une application modulaire unique. Aucun microservice ni package SAMTECH Core n'est créé sans réutilisation réelle.

## 3.6 Écritures cohérentes

Les opérations portant sur plusieurs tables utilisent des transactions IndexedDB.

## 3.7 Calculs déterministes

Les totaux financiers et indicateurs sont produits par des fonctions pures, testables et communes à l'interface, au PDF et au stockage.

---

# 4. Vue d'ensemble

```text
┌─────────────────────────────────────────────────────────┐
│                    Interface utilisateur                 │
│ Next.js + React + composants + formulaires + navigation │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                     Couche Application                   │
│ Cas d'usage, commandes, requêtes, orchestration         │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                      Couche Domaine                      │
│ Entités, valeurs, règles, transitions, calculs          │
└──────────────────────────┬──────────────────────────────┘
                           │ contrats
┌──────────────────────────▼──────────────────────────────┐
│                   Couche Infrastructure                  │
│ Dexie/IndexedDB, sauvegarde, PDF, WhatsApp, PWA         │
└──────────────────────────┬──────────────────────────────┘
                           │
                 ┌─────────▼─────────┐
                 │   Navigateur/PWA  │
                 └───────────────────┘
```

---

# 5. Stack de référence

## Application

- Next.js avec App Router ;
- React ;
- TypeScript en mode strict.

## Présentation

- Tailwind CSS ;
- shadcn/ui ou composants accessibles équivalents ;
- icônes cohérentes et légères.

## Données

- IndexedDB ;
- Dexie.js ;
- extension React de Dexie si elle améliore les requêtes réactives sans couplage excessif.

## Validation

- Zod ou bibliothèque équivalente pour les schémas aux frontières.

## Formulaires

- React Hook Form ou solution équivalente, associée aux schémas de validation.

## PWA

- manifeste Web App ;
- service worker compatible avec la version retenue de Next.js ;
- stratégie de cache explicitement configurée.

## PDF

- bibliothèque générant un PDF déterministe et testable côté client ;
- choix final validé par un prototype de facture multipage.

## Tests

- Vitest ou Jest pour les tests unitaires ;
- Testing Library pour les composants ;
- Playwright pour les parcours critiques.

Les versions exactes doivent être figées dans le projet lors de l'initialisation et mises à jour de manière contrôlée.

---

# 6. Rendu Next.js

## 6.1 Principe

Les écrans qui accèdent aux données métier locales sont des composants clients, car IndexedDB n'existe que dans le navigateur.

## 6.2 Composants serveur

Les composants serveur peuvent être utilisés pour le shell statique, les pages publiques futures ou les contenus ne dépendant pas des données locales. Ils ne doivent pas tenter de lire la base métier.

## 6.3 Hydratation

L'application doit afficher un état de chargement explicite pendant l'ouverture de la base locale. Elle ne doit pas produire de contenu incohérent entre serveur et navigateur.

## 6.4 Déploiement statique ou hébergé

L'architecture doit rester compatible avec un hébergement Web standard. Le choix entre export statique et serveur Next.js dépendra des contraintes réelles du plugin PWA et du déploiement, sans introduire de backend métier dans la V1.

---

# 7. Couches

## 7.1 Présentation

Responsabilités :

- pages et mises en page ;
- composants ;
- navigation ;
- saisie et messages ;
- états de chargement et d'erreur ;
- adaptation responsive ;
- accessibilité ;
- appel des cas d'usage.

Interdictions :

- requêtes Dexie dispersées dans les composants ;
- calculs financiers dans le rendu ;
- transitions métier codées uniquement dans les boutons ;
- accès direct aux objets du service worker.

## 7.2 Application

Responsabilités :

- orchestrer les cas d'usage ;
- ouvrir et valider les transactions ;
- appliquer les règles du domaine ;
- appeler les dépôts ;
- produire des résultats typés ;
- publier les événements de chronologie.

Exemples :

- `CreateProspect` ;
- `ScheduleFollowUp` ;
- `ConvertProspectToClient` ;
- `IssueInvoice` ;
- `RecordPayment` ;
- `LaunchCampaign` ;
- `ExportBackup` ;
- `RestoreBackup`.

## 7.3 Domaine

Responsabilités :

- entités et objets-valeurs ;
- statuts et transitions ;
- validation métier ;
- calculs de facture ;
- calculs de paiement ;
- normalisation des numéros ;
- résolution des variables de messages ;
- formules statistiques.

Le domaine doit fonctionner dans des tests sans navigateur ni base de données.

## 7.4 Infrastructure

Responsabilités :

- schéma Dexie ;
- implémentation des dépôts ;
- migrations ;
- transactions ;
- import/export ;
- génération PDF ;
- ouverture de WhatsApp ;
- accès aux API du navigateur ;
- cache PWA ;
- gestion locale du PIN.

---

# 8. Organisation fonctionnelle

Le code est organisé par modules métier, avec des couches partagées limitées.

```text
src/
├── app/
│   ├── (app)/
│   │   ├── dashboard/
│   │   ├── prospects/
│   │   ├── follow-ups/
│   │   ├── clients/
│   │   ├── products/
│   │   ├── campaigns/
│   │   ├── invoices/
│   │   ├── payments/
│   │   ├── statistics/
│   │   └── settings/
│   ├── layout.tsx
│   └── page.tsx
├── modules/
│   ├── contacts/
│   ├── prospects/
│   ├── clients/
│   ├── products/
│   ├── locations/
│   ├── follow-ups/
│   ├── messages/
│   ├── campaigns/
│   ├── invoices/
│   ├── payments/
│   ├── analytics/
│   ├── backup/
│   └── settings/
├── domain/
│   ├── shared/
│   ├── money/
│   ├── phone/
│   └── events/
├── infrastructure/
│   ├── database/
│   ├── repositories/
│   ├── pdf/
│   ├── whatsapp/
│   ├── pwa/
│   ├── files/
│   └── security/
├── components/
│   ├── ui/
│   └── shared/
├── hooks/
├── lib/
├── styles/
└── test/
```

La structure exacte peut évoluer, mais les frontières de responsabilité doivent être conservées.

---

# 9. Structure interne d'un module

Exemple :

```text
modules/invoices/
├── domain/
│   ├── invoice.ts
│   ├── invoice-status.ts
│   ├── invoice-calculator.ts
│   └── invoice-rules.ts
├── application/
│   ├── create-draft.ts
│   ├── issue-invoice.ts
│   └── cancel-invoice.ts
├── infrastructure/
│   └── dexie-invoice-repository.ts
├── presentation/
│   ├── invoice-form.tsx
│   ├── invoice-list.tsx
│   └── invoice-summary.tsx
└── index.ts
```

Les exports publics passent par le fichier d'entrée du module. Les imports profonds entre modules sont évités.

---

# 10. Modèle de données conceptuel

Les principales relations sont :

```text
Contact
├── profil Prospect
├── profil Client
├── Localité
├── Tags
├── Intérêts Produits
├── Notes
├── Relances
└── Événements

Client
├── Factures
│   ├── Lignes de facture
│   └── Paiements
└── Campagnes reçues

Campagne
├── critères
└── destinataires figés
```

Le détail des tables, index et migrations est défini dans `DATABASE.md`.

---

# 11. Entité Contact

L'identité d'une personne ou organisation ne doit pas être dupliquée lors de la conversion.

Architecture recommandée :

- table `contacts` pour l'identité et les coordonnées ;
- table ou propriétés `prospectProfiles` pour les données de prospection ;
- table ou propriétés `clientProfiles` pour les données de client ;
- relations vers les événements, intérêts, relances et documents.

Cette structure rend possible la coexistence du rôle historique de prospect et du rôle actuel de client.

---

# 12. Dépôts

La couche application dépend d'interfaces telles que :

```ts
interface ProspectRepository {
  getById(id: ProspectId): Promise<Prospect | null>;
  findByNormalizedPhone(phone: string): Promise<Prospect[]>;
  save(prospect: Prospect): Promise<void>;
  search(criteria: ProspectSearchCriteria): Promise<ProspectPage>;
}
```

Principes :

- les interfaces appartiennent au domaine ou à l'application ;
- Dexie fournit les implémentations ;
- les composants ne construisent pas directement de requêtes de persistance ;
- les dépôts retournent des modèles métier, pas des lignes brutes non validées.

---

# 13. Base IndexedDB et Dexie

## 13.1 Source de vérité

IndexedDB est la source de vérité métier de la V1.

## 13.2 Instance unique

Une seule instance de base est créée par contexte applicatif. Son initialisation est centralisée.

## 13.3 Versionnement

Chaque modification structurelle incrémente la version Dexie et fournit une migration explicite.

## 13.4 Index

Les index sont définis à partir des recherches réelles : numéro normalisé, statut, date, localité, produit, facture et échéance.

## 13.5 Transactions

Les cas suivants exigent une transaction atomique :

- conversion prospect/client et événement ;
- émission de facture et attribution du numéro ;
- paiement, recalcul et événement ;
- report d'une relance ;
- lancement d'une campagne et création de ses destinataires ;
- restauration d'une sauvegarde.

## 13.6 Réactivité

Les listes peuvent utiliser des requêtes réactives Dexie. Les calculs coûteux doivent être maîtrisés afin d'éviter des recalculs complets à chaque rendu.

---

# 14. Cas d'usage critiques

## 14.1 Conversion

```text
Interface
  → ConvertProspectToClient
  → vérifier prospect et préconditions
  → transaction
      → créer/activer profil client
      → passer prospect à CONVERTI
      → enregistrer date de conversion
      → ajouter événement
  → résultat typé
  → actualiser l'interface
```

## 14.2 Émission de facture

```text
Interface
  → IssueInvoice
  → valider client et lignes
  → calculer par le moteur Money/Invoice
  → transaction
      → réserver prochain numéro
      → figer les instantanés
      → enregistrer facture et lignes
      → ajouter événement
  → générer le PDF à la demande
```

## 14.3 Paiement

```text
Interface
  → RecordPayment
  → vérifier facture et solde
  → transaction
      → créer paiement
      → recalculer total payé et statut
      → ajouter événement
  → résultat
```

## 14.4 Restauration

```text
Fichier
  → lecture hors écriture
  → validation structurelle
  → contrôle version/intégrité
  → aperçu utilisateur
  → confirmation
  → transaction de remplacement
  → contrôles post-restauration
  → rechargement contrôlé
```

---

# 15. Gestion d'état

## 15.1 État persistant

Les données métier persistantes restent dans IndexedDB et sont observées par des hooks ou requêtes dédiées.

## 15.2 État d'interface

Les formulaires, onglets, modales, filtres temporaires et états de chargement restent locaux aux composants ou à un contexte limité.

## 15.3 État global

Un gestionnaire d'état global ne doit être ajouté que pour des besoins transversaux réels, par exemple :

- session de verrouillage ;
- état d'initialisation de la base ;
- préférences d'interface ;
- notification globale.

Le stockage métier ne doit pas être dupliqué dans un store global.

---

# 16. Validation

Trois niveaux de validation sont prévus :

1. **Interface :** retour rapide sur les champs.
2. **Application :** validation du cas d'usage et des préconditions.
3. **Domaine :** invariants impossibles à contourner.

Les schémas Zod sont adaptés aux frontières : formulaires, fichiers importés et données désérialisées. Les objets du domaine appliquent ensuite leurs invariants.

---

# 17. Gestion de l'argent

Un type `Money` ou une bibliothèque décimale fiable doit être utilisé.

Le type doit porter :

- une valeur en unité minimale ou décimale exacte ;
- une devise ;
- des opérations contrôlées ;
- une stratégie d'arrondi unique.

Le moteur de facture est une fonction pure recevant les lignes et paramètres, puis retournant tous les totaux. Le PDF ne recalcule pas indépendamment les valeurs.

---

# 18. Dates et fuseaux horaires

- Les instants techniques sont stockés en ISO UTC.
- Les dates civiles comme une date de facture peuvent être stockées séparément au format `YYYY-MM-DD`.
- Le fuseau d'affichage provient de l'appareil ou des paramètres.
- Une relance combine une date/heure locale et l'information nécessaire pour éviter les ambiguïtés.
- Les comparaisons Aujourd'hui et En retard utilisent le fuseau de l'utilisateur.

---

# 19. Historique commercial

Les événements automatiques utilisent une structure commune :

- identifiant ;
- type ;
- contact ;
- entité source facultative ;
- date d'événement ;
- données d'affichage minimales ;
- version du payload.

Les événements ne doivent pas devenir un journal technique contenant des secrets ou des objets complets. Les données financières restent dans leurs tables sources.

---

# 20. Intégration WhatsApp

Un adaptateur `WhatsAppGateway` est responsable de :

- vérifier et formater le numéro ;
- résoudre et encoder le message ;
- construire l'URL ;
- appeler l'API de navigation ou de partage appropriée ;
- retourner un résultat indiquant uniquement que l'ouverture a été tentée ou réussie.

Il ne doit jamais retourner `messageSent: true` sans confirmation réelle indisponible dans la V1.

---

# 21. Génération PDF

Le service PDF reçoit un modèle de facture figé et indépendant de React.

Exigences :

- rendu A4 ;
- factures multipages ;
- caractères UTF-8 ;
- montants identiques à l'application ;
- téléchargement et partage ;
- génération hors ligne après chargement des ressources ;
- polices intégrées ou disponibles localement ;
- tests visuels sur plusieurs volumes de lignes.

Le Sprint 5 retient `pdf-lib` : la bibliothèque fonctionne côté client sans réseau, intègre les polices PDF standard, produit des A4 multipages et reste isolée dans `modules/invoices/pdf`. Le générateur reçoit uniquement l’agrégat figé et les totaux du moteur central ; les composants déclenchent le téléchargement ou le partage sans connaître les primitives PDF.

---

# 22. Sauvegarde

Le service de sauvegarde sérialise un format applicatif, et non un export brut dépendant de Dexie.

Structure indicative :

```json
{
  "format": "samtech-crm-backup",
  "formatVersion": 1,
  "appVersion": "1.0.0",
  "exportedAt": "2026-07-17T12:00:00Z",
  "metadata": {},
  "data": {},
  "integrity": {}
}
```

Le format est versionné. Des adaptateurs convertissent les anciennes versions compatibles avant la restauration.

---

# 23. PIN et sécurité locale

Le module de verrouillage est séparé du domaine CRM.

Il gère :

- configuration du PIN ;
- dérivation et comparaison sécurisée ;
- compteur de tentatives ;
- temporisation ;
- verrouillage après inactivité ;
- état de session déverrouillée.

Le secret n'est pas stocké en clair. La documentation doit expliquer que ce verrouillage ne constitue pas un chiffrement complet d'IndexedDB.

---

# 24. Architecture PWA

## 24.1 App shell

Le shell, les styles, icônes et ressources indispensables sont mis en cache après la première visite réussie.

## 24.2 Stratégies de cache

- ressources versionnées : cache-first avec invalidation par version ;
- navigation applicative : stratégie compatible avec le shell hors ligne ;
- données métier : jamais gérées par le cache HTTP, uniquement par IndexedDB ;
- ressources externes : évitées pour les fonctions essentielles ;
- PDF générés : à la demande, non mis en cache automatiquement.

## 24.3 Mise à jour

Lorsqu'une nouvelle version est disponible :

- ne pas interrompre une écriture ;
- informer l'utilisateur ;
- appliquer la mise à jour à un moment sûr ;
- exécuter les migrations au prochain démarrage ;
- ne jamais effacer la base comme stratégie de correction.

## 24.4 Hors ligne

Un indicateur réseau est informatif. Les cas d'usage locaux restent disponibles. Les actions dépendant d'une application externe expliquent leurs limites.

---

# 25. Gestion des erreurs

Les erreurs sont classées :

- `ValidationError` ;
- `BusinessRuleError` ;
- `NotFoundError` ;
- `ConflictError` ;
- `StorageError` ;
- `MigrationError` ;
- `FileFormatError` ;
- `ExternalActionError` ;
- `UnexpectedError`.

Les couches internes produisent des erreurs typées. La présentation les transforme en messages compréhensibles. Les détails techniques ne sont pas affichés à l'utilisateur.

---

# 26. Journalisation

La V1 peut utiliser un journal local minimal pour le diagnostic :

- niveau ;
- code ;
- date ;
- contexte non sensible ;
- version de l'application.

Les noms, numéros, messages, factures et autres données personnelles ne doivent pas être enregistrés dans les journaux techniques par défaut.

Aucune télémétrie distante n'est prévue dans la V1.

---

# 27. Performance

- indexer les critères de recherche fréquents ;
- paginer ou virtualiser les grandes listes ;
- éviter de charger toutes les chronologies ;
- calculer les statistiques hors du cycle de rendu ;
- mémoriser seulement les résultats coûteux invalidables ;
- charger les modules lourds, notamment PDF et graphiques, à la demande ;
- optimiser le bundle initial mobile ;
- mesurer sur un téléphone représentatif.

Objectifs précis à fixer après prototype et jeu de données réaliste.

---

# 28. Accessibilité et design system

Les composants partagés doivent intégrer :

- labels et descriptions ;
- navigation clavier ;
- focus visible ;
- états invalides ;
- contrastes ;
- tailles tactiles ;
- préférences de réduction des animations.

Les composants métier composent les primitives accessibles au lieu de les recréer.

---

# 29. Tests

## 29.1 Pyramide

- nombreux tests unitaires du domaine ;
- tests d'intégration des dépôts et transactions ;
- tests de composants ciblés ;
- quelques parcours Playwright critiques ;
- tests manuels PWA et appareils réels.

## 29.2 Priorités

- calcul monétaire ;
- conversion ;
- statuts ;
- numérotation ;
- paiement et solde ;
- migrations ;
- sauvegarde/restauration ;
- campagnes reprises ;
- comportement hors ligne.

## 29.3 Base de test

Les tests IndexedDB utilisent un environnement isolé et réinitialisable. Les cas d'usage de domaine utilisent des dépôts en mémoire uniquement lorsque cela ne masque pas le comportement réel de Dexie.

---

# 30. Sécurité de la chaîne de développement

- dépendances minimales et maintenues ;
- verrouillage des versions ;
- audit régulier ;
- aucun secret dans le dépôt ;
- politique de sécurité du contenu adaptée ;
- protection contre l'injection dans les messages, notes et PDF ;
- validation stricte des fichiers importés ;
- interdiction d'évaluer du code contenu dans une sauvegarde.

Le détail sera complété dans `SECURITY.md`.

---

# 31. Déploiement

La V1 peut être déployée sur une plateforme compatible Next.js ou comme application statique si toutes les exigences sont satisfaites.

Le processus doit inclure :

1. contrôles de format et types ;
2. tests ;
3. build de production ;
4. vérification du manifeste et du service worker ;
5. test d'installation ;
6. test hors ligne ;
7. validation des migrations ;
8. publication versionnée ;
9. mise à jour du changelog.

Les environnements recommandés sont développement, préproduction et production.

---

# 32. Préparation du cloud futur

La V1 ne contient pas de synchronisation. Elle prépare l'évolution par :

- identifiants uniques non séquentiels ;
- dates de création et modification ;
- dépôts abstraits ;
- cas d'usage séparés ;
- format de sauvegarde versionné ;
- événements métier structurés ;
- absence de dépendance directe de l'interface à Dexie.

Cela ne signifie pas que le remplacement de Dexie sera automatique. La synchronisation nécessitera une conception dédiée : identité, authentification, conflits, suppression, sécurité et migrations serveur.

---

# 33. Éléments explicitement absents de la V1

- API serveur métier ;
- base distante ;
- authentification cloud ;
- licence ;
- synchronisation ;
- files de messages distantes ;
- WebSockets ;
- microservices ;
- fonctions serverless métier ;
- analyse distante ;
- envoi WhatsApp automatisé.

Un outil d'IA ne doit pas ajouter ces éléments pour « préparer l'avenir » sans validation.

---

# 34. Décisions architecturales initiales

## ADR-001 — PWA avant applications natives

**Décision :** développer une PWA mobile-first.  
**Raison :** livrer Web, Android et iPhone avec une base commune.  
**Conséquence :** accepter et documenter les limites des navigateurs.

## ADR-002 — IndexedDB comme source locale

**Décision :** IndexedDB via Dexie.js.  
**Raison :** données structurées, index, transactions et migrations dans le navigateur.  
**Conséquence :** nécessité de sauvegardes et de tests de migrations.

## ADR-003 — Absence de backend métier en V1

**Décision :** aucune dépendance serveur pour les données CRM.  
**Raison :** valider le cœur métier et l'offline-first.  
**Conséquence :** pas de synchronisation, récupération distante ou collaboration.

## ADR-004 — Architecture modulaire en couches

**Décision :** modules métier séparant présentation, application, domaine et infrastructure.  
**Raison :** testabilité et évolution.  
**Conséquence :** discipline d'import et contrats explicites.

## ADR-005 — WhatsApp assisté

**Décision :** ouvrir WhatsApp avec message prérempli.  
**Raison :** simplicité et contrôle humain.  
**Conséquence :** l'application ne connaît pas automatiquement le statut réel d'envoi.

## ADR-006 — Argent exact

**Décision :** type monétaire sûr et moteur de calcul central.  
**Raison :** éviter les erreurs financières.  
**Conséquence :** toute interface et tout PDF consomment les mêmes résultats.

---

# 35. Règles d'import entre modules

- La présentation peut importer l'application et les composants partagés.
- L'application peut importer le domaine et les interfaces de dépôts.
- Le domaine importe uniquement le domaine partagé.
- L'infrastructure implémente les interfaces du domaine/application.
- Un module n'accède pas directement aux tables d'un autre module.
- Les dépendances circulaires sont interdites.
- Les exports publics de chaque module sont centralisés.

Des règles automatiques de lint peuvent faire respecter ces frontières.

---

# 36. Définition de terminé technique

Une fonctionnalité est techniquement terminée lorsque :

- le cas d'usage est implémenté ;
- les règles métier correspondantes sont respectées ;
- les écritures sont transactionnelles lorsque nécessaire ;
- les erreurs sont gérées ;
- les tests requis réussissent ;
- l'interface mobile est validée ;
- le mode hors ligne est vérifié ;
- les données existantes migrent correctement ;
- la documentation et le changelog sont mis à jour ;
- aucun secret ou donnée sensible n'est journalisé.

---

# 37. Prochain document

Après validation de cette architecture, `DATABASE.md` doit préciser :

- toutes les tables ;
- champs et types ;
- clés et index ;
- relations ;
- contraintes ;
- schémas Dexie ;
- transactions ;
- migrations ;
- stratégie d'export et restauration.

---

# 38. Principe directeur

**L'interface peut évoluer, le stockage peut évoluer et le cloud peut être ajouté, mais les règles métier doivent rester centralisées, testables et indépendantes de ces choix.**

---

# 39. Architecture livrée — Sprint 6

Le module `payments` respecte les quatre couches : objets, schémas et moteur financier pur dans `domain`; orchestration dans `application`; dépôt Dexie et transactions dans `infrastructure`; formulaires, listes et indicateurs dans `presentation`. Les composants React ne calculent ni statut de facture ni solde métier et n’accèdent jamais directement à Dexie.

Le moteur pur additionne les montants entiers sûrs des paiements actifs puis dérive `paidTotalMinor`, `balanceMinor` et le statut. Le dépôt relit facture, client et paiements actifs à l’intérieur de la transaction avant toute décision. Cette sérialisation logique empêche deux encaissements concurrents de produire ensemble un surpaiement.

Les événements `PAYMENT_RECORDED` et `PAYMENT_REVERSED` sont écrits dans la même transaction que le paiement et la facture. Les recherches de paiements, créances et indicateurs passent par `ManagePaymentsUseCase`. Le PDF de facture consomme les agrégats financiers courants de la facture et reste généré entièrement dans le navigateur.

---

# 40. Architecture livrée — Sprint 7

Le module `campaigns` sépare le moteur pur de segmentation et de progression, l’orchestration des cas d’usage, le dépôt Dexie transactionnel et la présentation. React ne choisit aucune transition et n’accède pas à IndexedDB.

La prévisualisation construit une vue déterministe à partir des contacts, profils, localités, intérêts, tags, factures émises, lignes et chronologie. Le lancement relit ces sources dans la transaction, résout les messages avec le moteur Sprint 3, crée tous les instantanés puis passe la campagne à `EN_COURS`; une erreur annule l’ensemble.

Les actions destinataire sont unitaires. La préparation WhatsApp met à jour un seul destinataire et retourne un lien sans le suivre. Confirmation, ignorance et erreur abandonnée recalculent la progression depuis `campaignRecipients`; la dernière finalisation termine atomiquement la campagne.

---

# 41. Architecture livrée — Sprint 8

Le module `statistics` suit les quatre couches. `domain/statistics.ts` reçoit un instantané typé et une période explicite, puis produit un rapport déterministe sans Dexie, React, réseau ni horloge implicite. `GetStatisticsUseCase` fournit la date de référence; `DexieStatisticsReadRepository` lit les tables V9; la présentation ne contient aucune formule métier.

Le moteur effectue des passages linéaires et construit des index `Map`. Les agrégats monétaires restent des `BigInt` pendant le calcul puis deviennent des chaînes d’entiers sérialisables. Aucun cache ou compteur persistant n’est introduit et, à l'issue du Sprint 8, la base restait en version 9.

Le rendu utilise des cartes, listes et barres CSS légères avec alternative textuelle. Les écrans recalculent à l’ouverture, au changement de période et sur actualisation, hors du cycle de rendu React.

---

# 42. Architecture livrée — Sprint 9

Les modules `backup` et `security` suivent les couches domaine/application/infrastructure/présentation. `backup/domain/backup.ts` définit l'enveloppe, la sérialisation stable, SHA-256 et toutes les validations sans React ni Dexie. `ManageBackupsUseCase` orchestre l'export et l'autorisation PIN; `DexieBackupRepository` est seul responsable des lectures et du remplacement transactionnel.

`security/domain/security.ts` définit PBKDF2, formats et délais. `ManageSecurityUseCase` porte activation, vérification, changement, désactivation et effacement; `DexieSecurityRepository` isole Dexie. `SecurityGate` conserve la session uniquement en mémoire et choisit entre shell complet et écran verrouillé. La base courante est V10; aucun cache statistique, backend ou réseau métier n'est introduit.

## Stabilisation V1 bêta

Le Sprint 10 ne modifie pas le schéma Dexie V10 ni les frontières présentation/application/domaine/infrastructure. Les scripts `test-accessibility`, `test-responsive`, `test-performance`, `test-lighthouse`, `test-pwa-update` et `test:v1-beta` exercent le build de production. Les jeux de volume et de démonstration sont déterministes et restent des données de test, jamais un nouveau stockage applicatif.
