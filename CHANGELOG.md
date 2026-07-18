# Journal des modifications — SAMTECH CRM

Toutes les modifications importantes de SAMTECH CRM seront documentées dans ce fichier.

Le projet suivra le versionnement sémantique à partir de la première version applicative.

> **Note d'harmonisation documentaire :**
> À partir de la v0.2.0, la roadmap a été réorganisée. Le développement du module Prospects a été effectué en premier (Sprint 1), suivi du module Paramètres et Catalogue (Sprint 2), afin de refléter fidèlement l'historique d'implémentation.

## [1.0.0-beta.1] — Sprint 10

### Stabilisation

- Audit global sans nouveau module métier, corrections d’accessibilité, responsive et récupération après erreur.
- Ajout des recettes axe-core, responsive multi-largeurs, performance volumique, Lighthouse, mise à jour PWA et E2E transversal.
- Jeu déterministe représentatif et nouveaux tests financiers de référence.
- Documentation complète de la bêta, du pilote, de la checklist et des limites connues.

### Limites

- Dernier passage Lighthouse mobile simulé à 68 sur le tableau de bord et 67 sur Prospects (passage précédent : 76/68), sous l’objectif indicatif de 85 ; variabilité et optimisation du chargement à poursuivre.
- Validation sur appareils physiques et audit npm en ligne à terminer avant élargissement du pilote.

## [Non publié] — Sprint 9

### Sprint 9 — Sauvegarde, restauration et sécurité locale

- Ajout des routes `/settings/backup` et `/settings/security`, export JSON version 1 des vingt tables métier, SHA-256 déterministe et aperçu strict avant remplacement atomique.
- Migration additive Dexie V9 → V10 ajoutant uniquement `securitySettings`; les données PIN restent exclues des sauvegardes.
- PIN 4 à 6 chiffres dérivé par PBKDF2-SHA-256 salé, temporisation progressive, verrouillage manuel/automatique/global et réinitialisation destructive renforcée.
- Ajout des tests de domaine, intégration, migration, écran global et du scénario production `e2e-sprint9-test.js` en 36 étapes, y compris hors ligne.
- Aucun backend, cloud, chiffrement artisanal, fusion, déploiement ou dépendance supplémentaire.

### Historique Sprint 8

### Ajouté

- Tableau de bord local sur `/` et statistiques détaillées sur `/statistics`, avec périodes inclusives, comparaison équivalente et raccourcis commerciaux.
- Moteur pur déterministe calculant prospects, cohorte de conversion, délai, relances, demandes, ventes, facturé, encaissé, créances, localités, sources, statuts, intérêts et campagnes depuis les sources V9.
- Arithmétique entière exacte avec regroupement strict par couple devise/échelle, quantités multi-échelles et séparation des lignes gratuites.
- Détection non destructive des incohérences financières, références manquantes, montants non sûrs et paiements actifs liés à une facture annulée.
- Visualisations CSS accessibles, légendes, unités, alternatives textuelles, séries sans rupture et interface mobile 390×844 utilisable hors ligne.
- Tests du domaine et des composants, test de charge dédié, et scénario Chromium Sprint 8 couvrant 33 critères.

### Limites explicites

- Aucune table statistique, cache persistant, synchronisation, télémétrie ou appel métier réseau : le schéma reste Dexie V9.
- Les répartitions géographiques utilisent la localité actuelle du contact, faute d’instantané historique; aucun montant de devises différentes n’est additionné.
- Les campagnes n’exposent aucune livraison, lecture, réponse, conversion attribuée ni ROI.

## [Non publié] — Sprint 7

### Ajouté

- Campagnes WhatsApp exclusivement assistées, sans envoi automatique, API externe ni confirmation implicite.
- Migration additive Dexie V8 → V9 ajoutant campagnes et destinataires figés, avec contraintes composées et preuve de réouverture sans perte.
- Segmentation pure prospects/clients par localités hiérarchiques, demandes, achats réels, statuts, intérêts, tags, sources, périodes et inactivité commerciale.
- Prévisualisation des admissibles, archives, numéros invalides, doublons, variables manquantes et exclusions manuelles, avec messages personnalisés.
- Lancement atomique, instantanés stables, exécution mobile destinataire par destinataire, progression dérivée, reprise, fin et annulation renforcée.
- Chronologie `CAMPAIGN_PROCESSED` sur les fiches Prospect et Client, avec résumé limité.
- Cinq routes Campagnes, tests domaine/cas d’usage/migration et E2E Chromium 45 critères incluant la reprise et la fin hors ligne.

### Limites explicites

- Aucune mesure de livraison, lecture, réponse WhatsApp ou conversion causale.
- `ERREUR` représente une erreur explicitement abandonnée; les nouvelles tentatives et erreurs temporaires restent différées.

## [Non publié] — Sprint 6

### Ajouté

- Encaissements 1-N exacts par facture avec six modes, références, notes, dates historiques confirmées et agrégats financiers dérivés des paiements actifs.
- Migration additive Dexie V7 → V8 ajoutant `payments`, avec preuve de conservation de toutes les tables et données V7 après fermeture et réouverture.
- Transactions atomiques d’enregistrement et de contrepassation mettant à jour paiement, facture et chronologie, avec rollback et protection du surpaiement concurrent.
- Contrepassation motivée sans édition ni suppression, annulation de facture interdite tant qu’un paiement actif subsiste et correction par nouvelle écriture.
- Écran Paiements avec recherche, filtres, total encaissé, indicateurs et créances; enrichissement de la facture et de la fiche client 360°.
- PDF de facture enrichi du statut financier courant, du total payé et du solde, y compris hors ligne.
- Tests domaine, cas d’usage, migration V8, PDF et scénario Chromium mobile couvrant 42 critères et les compteurs console/réseau/RSC.

### Limites explicites

- Aucun remboursement bancaire, avoir client, paiement automatique, rapprochement, backend, synchronisation ou stockage automatique des PDF n’est introduit.
- La V1 conserve les dates futures saisies sans correction automatique, faute de règle métier les interdisant.

## [Non publié] — Sprint 5

### Ajouté

- Factures brouillons, lignes catalogue ou libres, quantités décimales mises à l’échelle, remises par ligne et calcul financier central exact.
- Migration additive Dexie V6 → V7 ajoutant `invoices` et `invoiceLines`, avec preuve de conservation de toutes les tables V6 après fermeture et réouverture.
- Émission atomique avec numéro annuel unique, séquence transactionnelle, instantanés entreprise/client/lignes et événement `INVOICE_ISSUED`.
- Immutabilité après émission et annulation motivée sans suppression, avec conservation du numéro et événement `INVOICE_CANCELLED`.
- Liste, recherche, filtres, formulaire mobile-first, détail, accès depuis la fiche client et chronologie de facture.
- PDF A4 local avec `pdf-lib`, pagination, en-têtes répétés, états BROUILLON/ANNULÉE, téléchargement et fallback de partage.
- Tests financiers, cas d’usage, migration V7, PDF et scénario Chromium mobile 390×844 couvrant 38 critères, dont brouillon/émission hors ligne, annulation, PDF hors ligne et compteurs RSC par navigation.

### Limites explicites

- Aucun paiement n’est enregistré au Sprint 5 : `paidTotalMinor` reste nul et les statuts `PARTIELLEMENT_PAYEE` et `PAYEE` restent réservés au Sprint 6.
- Aucun avoir, fiscalité nationale, backend, synchronisation ou stockage automatique des PDF n’est introduit.

## [Non publié] — Sprint 4

### Ajouté

- Conversion explicite et transactionnelle d’un prospect en client, sans duplication du contact, avec refus des conversions répétées.
- Migration Dexie V4 vers V5 ajoutant `clientProfiles` et son index unique `&contactId`, testée avec fermeture et réouverture de la base.
- Conservation du profil prospect, des intérêts, des relances et de la chronologie ; ajout de l’événement `PROSPECT_CONVERTED`.
- Liste Clients avec recherche et filtres de localité et de période de conversion.
- Fiche client 360° avec coordonnées, intérêts, actions commerciales, indicateurs disponibles et chronologie.
- Exclusion par défaut des contacts convertis de la liste des prospects actifs ; accès à la fiche client depuis l’ancienne fiche prospect.
- Parcours navigateur de production Sprint 4 couvrant 28 critères, dont l’identité unique, la chronologie ordonnée, les filtres, la persistance et la liste/fiche hors ligne.
- Migration additive V5 → V6 pour activer Notes et Tags sur les bases V5 déjà ouvertes, sans réinitialisation ; preuve séquentielle V4 → V5 → V6 avec deux réouvertures.
- Historisation des créations de prospect, notes, changements de statut et annulations de relance ; tri déterministe par date d’événement, date de création puis identifiant.
- Fiche 360° enrichie avec tags, notes, prochaine relance et relances passées/futures ; archives clients filtrables.

### Limites explicites

- Les achats, factures, paiements et indicateurs financiers seront alimentés par les Sprints 5 et 6 ; les écrans affichent des états vides explicites et aucun montant fictif.
- Le retour d’un client vers prospect et la correction d’une conversion ne sont pas introduits sans la procédure métier dédiée prévue par BR-033 et BR-042.

## [Non publié] — Sprint 3

### Ajouté

- Relances locales avec vues Aujourd'hui, En retard, À venir et Terminées, recherche, filtres et tris.
- Création depuis une fiche Prospect, avertissements de date passée et de doublon proche, modification, réalisation avec note, annulation et report atomique.
- Modèles de messages texte avec variables contrôlées, aperçu, duplication, modification, archivage logique et archives facultatives.
- Résolution locale des données Prospect, entreprise, produits, localité et profil SAMTECH CRM, avec signalement des valeurs manquantes.
- Préparation explicite de liens `wa.me`, instantané du message et chronologie `FOLLOW_UP_CREATED`, `FOLLOW_UP_COMPLETED`, `FOLLOW_UP_RESCHEDULED` et `WHATSAPP_OPENED` sans envoi automatique.
- Migration additive Dexie V3 vers V4 ajoutant `followUps`, `messageTemplates` et `timelineEvents`, avec test de fermeture et réouverture sans perte.
- Parcours navigateur de production Sprint 3 couvrant 26 critères, fonctionnement hors ligne et contrôles stricts de console/réseau.

### Décisions

- Fenêtre d'avertissement des relances proches fixée à 60 minutes et documentée dans BR-077.
- L'état « en retard » reste calculé à l'ouverture et n'est jamais persisté comme statut.
- L'ouverture de WhatsApp ne termine pas la relance et ne constitue aucune preuve d'envoi ou de livraison.

## [0.2.0] - 2026-07-17
### Ajouté
- Réalisation du Sprint 2 : Paramètres, Localités et Catalogue.
- Module Paramètres (Profil entreprise, paramètres de facturation incluant désactivation TVA).
- Module Localités (Hiérarchie de lieux, archivage, recherche).
- Module Catalogue (Catégories, Produits/Services, gestion des prix en MinorAmount).
- Tests E2E étendus (19 points de validation dont offline et console errors).
- Tests de domaine et cas d'usage dédiés par module (Settings, Locations, Catalog, Prospects).
- Test unitaire explicite de migration Dexie V2 vers V3 sans perte de données.
- Intégration complète entre Prospects et données de référence (Localités, Produits).
- Module Prospects complet (Sprint 1 : Création, Lecture, Modification, Liste, Détail).
- Recherche multicritère (nom, numéro, entreprise) et filtres (statut, intérêt).
- Gestion des doublons de numéros WhatsApp avec avertissement non bloquant (BR-013).
- Archivage logique et filtre pour afficher les archives.
- Audit correctif Sprint 2 : 73 tests, migration réelle depuis les tables V2 `contacts` et `prospectProfiles`, validation de la hiérarchie des localités, modification/recherche/filtres/archives dans l'interface et badges des références archivées sur les fiches prospects.
- Validation des devises ISO 4217 et des préfixes de facture ; taxes conservées désactivées par défaut conformément à BR-125, sans consommation de séquence.
- Finalisation de l'audit Sprint 2 : suppression des `any` explicites, encapsulation du diagnostic IndexedDB, sélecteur mobile accessible des intérêts produits et conservation des références archivées.
- Scénario E2E autonome sur port 3100 avec 39 assertions, serveur de production isolé, IndexedDB Chromium réel et échec automatique sur erreur console, exception de page ou requête en ligne inattendue.

## [0.1.0] - 2026-07-17

### Ajouté
- Initialisation du projet Next.js avec TypeScript et App Router.
- Configuration de Tailwind CSS et shadcn/ui.
- Architecture des dossiers selon `DOCS/ARCHITECTURE.md`.
- Configuration initiale de la Progressive Web App (PWA)
- Génération d'un Service Worker minimal (mise en cache des ressources statiques)
- Manifeste web avec icônes de base
- Page d'accueil temporaire "Fondation technique"
- Audit complet des dépendances et du PWA (Diagnostic)
- Configuration de Dexie.js pour la base locale.
- Configuration minimale de PWA avec `next-pwa`.
- Page de diagnostic `dev-diagnostic`.
- Configuration des tests avec Vitest et React Testing Library.

---

## [Non publié] — Fondation documentaire

### Ajouté

- `DOCS/VISION.md` : vision produit, problème, proposition de valeur, utilisateurs cibles, périmètre V1 et évolutions.
- `DOCS/ROADMAP.md` : phases produit, versions V1 à V3, sprints, pilote et critères de sortie.
- `DOCS/CAHIER_DES_CHARGES.md` : exigences fonctionnelles, non fonctionnelles et critères de recette de la V1.
- `DOCS/RULES.md` : règles métier identifiées par des codes `BR-*`.
- `DOCS/ARCHITECTURE.md` : architecture modulaire en couches, flux, dépendances et décisions techniques.
- `DOCS/DATABASE.md` : modèle IndexedDB/Dexie, 22 tables, index, transactions, migrations et sauvegardes.
- `DOCS/OFFLINE_FIRST.md` : stratégie PWA hors ligne, cache, IndexedDB, mises à jour et récupération.
- `DOCS/SECURITY.md` : modèle de menace, PIN local, sauvegardes, sécurité Web et limites de la PWA.
- `DOCS/UI_UX.md` : navigation mobile-first, écrans, parcours, états et accessibilité.
- `DOCS/TESTING.md` : stratégie de tests métier, données, PWA, sécurité, appareils et recette.
- `DOCS/PROMPTS_GEMINI.md` : prompt maître et prompts de développement par sprint pour Gemini.
- `DOCS/PROMPTS_CODEX.md` : prompt maître, modèle `AGENTS.md` et prompts de travail pour Codex.

### Décisions

- Nom de l'éditeur : **SAMTECH**.
- Nom du premier produit : **SAMTECH CRM**.
- Produit générique destiné aux entrepreneurs, indépendants, TPE, PME et commerciaux.
- WhatsApp reste le canal de communication ; SAMTECH CRM organise la relation commerciale.
- Première version développée comme une **PWA mobile-first**.
- Approche **offline-first**.
- Une seule base de code Web avant d'envisager des applications natives.
- Stack cible : Next.js, TypeScript, Tailwind CSS, composants accessibles, IndexedDB et Dexie.js.
- V1 mono-utilisateur avec données locales.
- Aucun backend métier requis dans la V1.
- Gestion des licences différée après validation du cœur métier.
- Synchronisation cloud, multi-appareil et multi-utilisateur différés.
- API WhatsApp Business et envois automatisés différés.
- Intelligence artificielle différée.
- Facturation et paiements inclus dans le cœur métier V1.
- Les campagnes WhatsApp de la V1 sont assistées et nécessitent une validation humaine.
- Un contact conserve une identité unique lors de la conversion prospect vers client.
- IndexedDB via Dexie.js est la source de vérité locale de la V1.
- Les calculs monétaires doivent utiliser une représentation exacte et centralisée.
- La sauvegarde et la restauration locales font partie des fonctions essentielles.
- Le PIN protège l'accès courant à l'interface sans être présenté comme un chiffrement complet d'IndexedDB.
- Les campagnes WhatsApp assistées sont obligatoires dans la V1.
- Le PIN local est obligatoire dans la V1.
- En cas de PIN oublié, la V1 impose une réinitialisation complète des données locales, suivie d'une restauration facultative depuis une sauvegarde et de la création d'un nouveau PIN.
- La V1 accepte uniquement les remises par ligne ; les remises et frais globaux sont différés.
- L'extraction de composants dans SAMTECH Core est différée jusqu'à l'existence d'une réutilisation réelle.

### Modifié

- Harmonisation de `DOCS/CAHIER_DES_CHARGES.md`, `DOCS/RULES.md`, `DOCS/DATABASE.md`, `DOCS/SECURITY.md`, `DOCS/UI_UX.md`, `DOCS/TESTING.md`, `DOCS/PROMPTS_GEMINI.md` et `DOCS/PROMPTS_CODEX.md` à la suite de l'audit documentaire.

### Hors périmètre de la V1

- gestion des licences ;
- authentification distante ;
- synchronisation et sauvegarde cloud ;
- multi-utilisateur et gestion d'équipes ;
- API WhatsApp Business ;
- envoi automatisé de campagnes ;
- intelligence artificielle ;
- gestion de stock ;
- applications mobiles natives Android et iOS.

---

## Règles de maintenance

1. Toute modification livrable met à jour la section **Non publié**.
2. Les changements sont décrits du point de vue de l'utilisateur ou du mainteneur.
3. Les corrections importantes indiquent le module et, si pertinent, les règles `BR-*` concernées.
4. Toute modification du schéma mentionne la version Dexie et la migration.
5. Toute incompatibilité de sauvegarde est signalée explicitement.
6. Une version publiée reçoit un numéro et une date.
7. La section **Non publié** est conservée en tête pour le travail suivant.
8. Aucun changement non vérifié ne doit être présenté comme livré.

---

## Versionnement envisagé

- `0.x` : prototypes et versions internes ;
- `1.0.0` : première V1 Starter validée ;
- `1.x` : corrections, commercialisation et gestion des licences ;
- `2.0.0` : Professional avec cloud et synchronisation ;
- `3.0.0` : Business avec équipes, rôles et collaboration.

Le numéro définitif d'une version dépend du contenu réellement livré, et non uniquement de la roadmap.
