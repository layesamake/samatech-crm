# SAMTECH CRM — PROMPTS POUR CODEX

**Document :** `PROMPTS_CODEX.md`  
**Produit :** SAMTECH CRM  
**Éditeur :** SAMTECH  
**Version :** 1.0  
**Statut :** Guide d'exécution  
**Date :** Juillet 2026

---

# 1. Objet

Ce document fournit des prompts réutilisables pour faire développer, tester, diagnostiquer et revoir SAMTECH CRM avec Codex.

Dossier exact :

```text
D:\dev\samatech crm
```

Un bon prompt Codex précise :

- **Objectif** : résultat attendu ;
- **Contexte** : fichiers, règles et code concernés ;
- **Contraintes** : limites à respecter ;
- **Terminé lorsque** : preuves exigées.

---

# 2. Documents obligatoires

Avant une modification importante, Codex doit lire :

1. `VISION.md` ;
2. `ROADMAP.md` ;
3. `CAHIER_DES_CHARGES.md` ;
4. `RULES.md` ;
5. `ARCHITECTURE.md` ;
6. `DATABASE.md` ;
7. `OFFLINE_FIRST.md` ;
8. `SECURITY.md` ;
9. `UI_UX.md` ;
10. `TESTING.md` ;
11. `CHANGELOG.md`, lorsqu'il existe.

Priorité : règles métier, données, architecture, offline, sécurité, UX, tests.

---

# 3. Interdictions V1

Codex ne doit pas ajouter sans validation :

- backend métier ou base cloud ;
- synchronisation ;
- compte distant ou multi-utilisateur ;
- gestion des licences ;
- API WhatsApp Business ;
- envoi automatique ;
- intelligence artificielle ;
- microservices ;
- abstraction SAMTECH Core prématurée ;
- dépendance non justifiée.

Il ne doit jamais :

- stocker le PIN en clair ;
- utiliser des flottants non contrôlés pour l'argent ;
- effacer une base pour résoudre une migration ;
- prétendre qu'un message est envoyé après une simple ouverture ;
- masquer un test en échec ;
- écraser les changements existants ;
- commit, pousser ou déployer sans demande explicite.

---

# 4. Instructions durables avec `AGENTS.md`

Créer à la racine un `AGENTS.md` concis contenant :

- structure du dépôt ;
- documents de référence ;
- commandes d'installation, test et build ;
- règles architecturales ;
- exclusions V1 ;
- sécurité ;
- définition de terminé ;
- politique Git.

Modèle :

```text
# AGENTS.md — SAMTECH CRM

SAMTECH CRM V1 est une PWA mobile-first, offline-first et mono-utilisateur.
IndexedDB via Dexie.js est la source de vérité.

Lire les documents de référence avant une modification importante.

- Séparer présentation, application, domaine et infrastructure.
- Garder les règles métier hors des composants React.
- Accéder à Dexie par des dépôts et cas d'usage.
- Utiliser des transactions pour les écritures multi-tables.
- Centraliser les calculs financiers exacts.
- Ne pas ajouter cloud, licence, multi-utilisateur, API WhatsApp Business ou IA.
- Ajouter les tests et exécuter format, lint, types, tests et build.
- Vérifier mobile et hors ligne lorsque pertinent.
- Préserver les changements existants.
- Aucun commit, push ou déploiement sans demande explicite.
```

---

# 5. Prompt maître

```text
Travaille dans D:\dev\samatech crm.

Objectif
[RÉSULTAT À OBTENIR]

Contexte
Lis AGENTS.md s'il existe et les documents pertinents. Inspecte le code et l'état
Git avant de modifier. SAMTECH CRM V1 est une PWA mobile-first, offline-first,
mono-utilisateur, avec IndexedDB/Dexie comme source de vérité.

Contraintes
- respecte RULES.md, ARCHITECTURE.md, DATABASE.md, OFFLINE_FIRST.md,
  SECURITY.md, UI_UX.md et TESTING.md ;
- travaille uniquement sur la tâche demandée ;
- préserve les changements existants ;
- garde les règles métier hors de React ;
- utilise les transactions documentées ;
- ajoute ou adapte les tests ;
- n'ajoute aucune fonction V2/V3 ;
- ne commit, pousse ou déploie rien.

Terminé lorsque
- les critères d'acceptation sont satisfaits ;
- format, lint, TypeScript, tests et build réussissent ;
- mobile et hors ligne sont vérifiés lorsque pertinent ;
- le diff ne contient aucun changement non lié ;
- documentation et CHANGELOG.md sont à jour.

Avant de coder, résume les règles BR-* concernées et ton plan. À la fin, rapporte
les fichiers modifiés, tests réellement exécutés, vérifications restantes et
risques. N'indique jamais Réussi pour une vérification non exécutée.
```

---

# 6. Prompt de planification

```text
Analyse cette tâche sans modifier les fichiers : [TÂCHE].

Fournis : objectif, périmètre, hors périmètre, règles BR-*, tables, transactions,
cas d'usage, écrans, risques offline/sécurité, tests, fichiers probables et critères
de validation. Cite toute contradiction documentaire. Demande une décision
uniquement si elle change matériellement le résultat.
```

---

# 7. Prompt d'implémentation générique

```text
Implémente uniquement [FONCTIONNALITÉ].

Objectif : [RÉSULTAT UTILISATEUR]
Règles : [BR-XXX, BR-YYY]
Documents : [FICHIERS/SECTIONS]
Critères : [LISTE]

Respecte les couches, dépôts, transactions, validations et états UX. Reste
mobile-first et offline-first. Ne refactore pas les zones non liées. Ne change pas
le schéma sans migration et mise à jour de DATABASE.md.

Ajoute les tests utiles, exécute les contrôles du projet et révise le diff avant
de conclure.
```

---

# 8. Sprint 0 — Initialisation

```text
Initialise uniquement le Sprint 0.

Objectif : base Next.js App Router, TypeScript strict, Tailwind, composants
accessibles, structure modulaire, Dexie minimal, PWA minimale, tests et shell
responsive.

Préserve les fichiers existants. Ne crée aucun module métier complet, backend,
cloud, licence ou authentification distante.

Terminé lorsque l'application démarre, la base s'ouvre, le shell est responsive,
le manifeste est valide, les tests de fumée et le build réussissent, et README.md,
AGENTS.md et CHANGELOG.md sont cohérents.
```

---

# 9. Sprint 1 — Paramètres et catalogue

```text
Implémente le Sprint 1 : paramètres, localités, catégories et produits/services.

Références : CAHIER_DES_CHARGES.md 9-11, RULES.md BR-050 à BR-064,
DATABASE.md tables correspondantes, UI_UX.md et TESTING.md.

Créer domaine, cas d'usage, dépôts Dexie, écrans mobile-first, recherche, filtres
et archivage. Utiliser une représentation exacte des prix et taxes. Ne pas ajouter
de stock. Tester validations, unicités, archivage et requêtes.
```

---

# 10. Sprint 2 — Prospects

```text
Implémente le Sprint 2 : prospects.

Références : RULES.md BR-010 à BR-033 ; DATABASE.md contacts,
prospectProfiles, prospectInterests, tags, contactTags, notes et timelineEvents ;
UI_UX.md 13-18 ; TESTING.md Contact et Prospects.

Inclure création rapide, numéro normalisé, avertissement de doublon, statuts,
intérêts, produits, tags, notes, recherche, filtres, archivage et chronologie.
Utiliser des transactions. Ne développer aucun autre module complet.
```

---

# 11. Sprint 3 — Relances et messages

```text
Implémente le Sprint 3 : relances, modèles et ouverture WhatsApp.

Références : RULES.md BR-070 à BR-084 ; DATABASE.md followUps et
messageTemplates ; OFFLINE_FIRST.md ; UI_UX.md 20-23 ; TESTING.md.

Inclure Aujourd'hui, En retard, À venir, Terminées, report transactionnel,
variables, aperçu, fallback Copier et confirmation après retour.

Ouvrir WhatsApp ne marque jamais automatiquement une relance comme réalisée ou
un message comme envoyé. Ne garantis pas de notification PWA fermée.
```

---

# 12. Sprint 4 — Clients

```text
Implémente le Sprint 4 : conversion prospect/client et fiche 360°.

Références : RULES.md BR-040 à BR-046 ; DATABASE.md contacts,
prospectProfiles, clientProfiles, timelineEvents ; UI_UX.md 19, 24, 25 ;
TESTING.md conversion.

La conversion est transactionnelle, ne duplique pas le contact, conserve tout
l'historique et refuse une seconde conversion. N'invente pas de retour client vers
prospect.
```

---

# 13. Sprint 5 — Facturation

```text
Implémente le Sprint 5 : factures et PDF.

Références : RULES.md BR-100 à BR-129 ; DATABASE.md invoices, invoiceLines,
sequences ; UI_UX.md 27-31 ; SECURITY.md ; TESTING.md.

Valide d'abord un prototype PDF hors ligne avec accents, logo facultatif et 50
lignes multipages. Utilise Money exact et un moteur pur. Attribue le numéro dans
la transaction d'émission. Fige les instantanés. Interdis la modification libre
après émission. Le PDF consomme les résultats du domaine.
```

---

# 14. Sprint 6 — Paiements

```text
Implémente le Sprint 6 : paiements, soldes et créances.

Références : RULES.md BR-130 à BR-150 ; DATABASE.md payments, invoices,
clientProfiles ; UI_UX.md 32 ; TESTING.md.

Paiement, facture et événement sont transactionnels. Refuser montants invalides
et surpaiement. Recalculer statut et solde. Corriger par renversement traçable.
Tester paiements partiels, solde exact, renversement, rollback et indicateurs.
```

---

# 15. Sprint 7 — Campagnes

```text
Implémente le Sprint 7 : campagnes WhatsApp assistées.

Références : RULES.md BR-090 à BR-099 ; DATABASE.md campaigns et
campaignRecipients ; UI_UX.md 33-34 ; TESTING.md Campagnes.

Figer les destinataires, exclure archivés et numéros invalides, supprimer les
doublons, résoudre les messages, traiter un contact à la fois et permettre la
reprise. Aucun envoi ni confirmation automatique.
```

---

# 16. Sprint 8 — Statistiques

```text
Implémente le Sprint 8 : tableau de bord et statistiques.

Références : RULES.md BR-140 à BR-150 ; DATABASE.md Statistiques ; UI_UX.md
11, 12, 35 ; TESTING.md.

Centraliser et tester les formules. Afficher période et date de référence.
Accompagner chaque graphique de valeurs exactes. Traiter correctement factures
annulées et paiements renversés. Ne créer aucun agrégat sans besoin mesuré.
```

---

# 17. Sprint 9 — Sauvegarde et PIN

```text
Implémente le Sprint 9 : sauvegarde, restauration et PIN.

Références : RULES.md BR-180 à BR-213 ; DATABASE.md ; OFFLINE_FIRST.md ;
SECURITY.md ; UI_UX.md 10, 37, 38 ; TESTING.md.

Utiliser un format UTF-8 versionné et valider entièrement avant écriture. Restaurer
en transaction et préserver la base en cas d'échec. Ne jamais stocker le PIN en
clair ni inventer de cryptographie. Ne pas présenter le PIN comme chiffrement
d'IndexedDB. Appliquer la politique PIN oublié documentée : réinitialisation locale complète, restauration facultative d'une sauvegarde, puis nouveau PIN.
```

---

# 18. Sprint 10 — Stabilisation

```text
Stabilise la V1 sans ajouter de fonctionnalité.

Exécute la suite complète et les parcours E2E-01 à E2E-06. Vérifie build,
installation PWA, hors ligne, mise à jour, migrations, sauvegarde/restauration,
volumes, accessibilité, sécurité, dépendances et journaux. Prépare le guide
utilisateur et CHANGELOG.md.

Classe chaque contrôle : Réussi, Échoué, Non testé ou Non applicable.
```

---

# 19. Prompt de diagnostic

```text
Diagnostique ce problème sans corriger : [PROBLÈME].

Étapes : [ÉTAPES]
Attendu : [ATTENDU]
Observé : [OBSERVÉ]
Environnement : [APPAREIL/NAVIGATEUR/VERSION]

Reproduis si possible. Identifie la cause racine, fichiers/lignes, données
affectées, priorité, règle BR-*, test manquant et options. Ne modifie rien.
```

---

# 20. Prompt de correction

```text
Corrige uniquement [DÉFAUT].

Reproduis-le, puis ajoute un test de régression qui échoue avant le correctif.
Identifie la cause et les règles BR-*. Applique la plus petite correction cohérente.
Ne refactore rien de non lié. Si une migration est nécessaire, présente d'abord
un plan.

Terminé lorsque le test de régression, les tests voisins, la suite pertinente et
le build réussissent et que le diff est propre.
```

---

# 21. Prompt de migration

```text
Implémente uniquement cette migration Dexie : [CHANGEMENT].

Mettre à jour DATABASE.md, incrémenter la version, transformer explicitement les
données, ne jamais effacer la base, préserver la récupération et mettre à jour
CHANGELOG.md. Tester fixture N→N+1, réouverture, erreur, rollback, volumes et
diagnostic d'intégrité.
```

---

# 22. Prompt de revue de code

```text
Effectue une revue en lecture seule des changements actuels.

Recherche en priorité : perte de données, calcul incorrect, transaction ou
migration manquante, violation BR-*, XSS, fuite, régression offline, confusion
WhatsApp ouvert/envoyé, problème mobile/accessibilité et test manquant.

Présente les constats actionnables classés par priorité avec fichier, ligne,
scénario, impact et correction. Ne modifie rien. Si aucun défaut n'est trouvé,
indique les risques et tests non couverts.
```

---

# 23. Prompt de revue de sécurité

```text
Revois en lecture seule la sécurité de [MODULE] selon SECURITY.md.

Cherche XSS, données sensibles dans URL/cache/journaux, import non borné, secret
dans le bundle, PIN faible, action destructive, dépendance risquée, service worker
permissif et atteinte à l'intégrité. Fournis des constats vérifiables avec preuve,
impact et recommandation. Ne modifie rien.
```

---

# 24. Prompt de validation

```text
Valide [MODULE] sans ajouter de fonctionnalité.

Relie chaque exigence aux règles BR-*, au code et aux tests. Vérifie données,
transactions, erreurs, mobile, accessibilité, hors ligne, sécurité et documentation.
Exécute format, lint, TypeScript, tests ciblés, suite complète et build.

Retourne une matrice Exigence / Preuve / Résultat / Limite avec uniquement les
états Réussi, Échoué, Non testé et Non applicable.
```

---

# 25. Prompt de choix de dépendance

```text
Évalue une dépendance pour [BESOIN] sans l'installer.

Compare la solution native et au maximum trois options : compatibilité Next.js
et PWA, offline, maintenance, sécurité, taille, TypeScript, tests, licence,
performance mobile et CSP. Utilise les sources officielles actuelles si nécessaire.
Recommande un prototype minimal et attends validation.
```

---

# 26. Prompt d'audit documentaire

```text
Audite en lecture seule les documents SAMTECH CRM.

Recherche contradictions, statuts incohérents, règle sans table/test, table sans
besoin, promesse offline impossible, sécurité excessive, fonction V2 présente en
V1 et choix non décidé présenté comme définitif. Cite les sections, classe chaque
constat et propose une décision minimale. Ne modifie rien.
```

---

# 27. Prompt de documentation

```text
Mets à jour uniquement la documentation pour cette décision validée :
[DÉCISION]

Modifie seulement les documents affectés. Préserve les identifiants BR-* ; marque
une règle obsolète au lieu de réutiliser son identifiant. Signale les impacts sur
architecture, données, tests, roadmap et changelog. N'implémente pas le code.
```

---

# 28. Prompt de préparation de version

```text
Prépare la version [VERSION] sans la publier.

Inspecte Git, exécute tous les contrôles, construis l'artefact, vérifie PWA,
offline, migrations, sauvegarde/restauration, dépendances et secrets. Mets à jour
CHANGELOG.md et les notes de version. Ne commit, tague, pousse ou déploie rien.

Rapporte blocages, risques, contrôles réussis, non exécutés et étapes manuelles.
```

---

# 29. Format du rapport final

```text
## Résultat
[résumé factuel]

## Changements
- fichier : raison

## Règles couvertes
- BR-XXX : preuve

## Tests ajoutés
- test : scénario

## Vérifications exécutées
- commande : résultat réel

## Vérifications non exécutées
- contrôle : raison

## Risques et limites
- ...

## Documentation
- fichiers mis à jour
```

---

# 30. Quand utiliser le mode Plan

Utiliser le mode Plan pour :

- architecture ;
- migration ;
- sauvegarde/restauration ;
- PIN et sécurité ;
- choix PDF ou PWA ;
- changement multi-modules ;
- exigence métier ambiguë.

L'implémentation directe convient aux tâches locales, bien spécifiées et faciles à vérifier.

---

# 31. Revue et validation

Après un sprint :

1. demander à Codex de revoir le diff ;
2. effectuer une revue distincte ;
3. corriger les constats importants ;
4. réexécuter les tests ;
5. inspecter visuellement le diff.

Une revue ne remplace pas les tests ; les tests ne remplacent pas la revue.

---

# 32. Autorisations

- conserver les permissions limitées par défaut ;
- approuver uniquement les accès nécessaires ;
- exiger une autorisation pour écrire hors du projet ;
- refuser les commandes destructrices larges ;
- vérifier toute installation ou demande réseau ;
- ne pas autoriser implicitement commit, push, déploiement ou message externe.

---

# 33. Checklist avant une tâche

- objectif centré sur le résultat ;
- contexte et fichiers cités ;
- règles BR-* identifiées ;
- limites explicites ;
- preuves de fin définies ;
- tests demandés ;
- actions externes interdites ou autorisées ;
- périmètre limité à un module ou sprint.

---

# 34. Checklist après une tâche

- diff limité ;
- règles respectées ;
- tests réellement exécutés ;
- build réussi ;
- migrations sûres ;
- mobile et offline vérifiés ;
- limites annoncées ;
- documentation à jour ;
- aucune action non autorisée.

---

# 35. Source méthodologique

Ce guide applique les bonnes pratiques Codex : formuler l'objectif, fournir le
contexte pertinent, préciser les contraintes et définir une fin vérifiable ;
utiliser `AGENTS.md` pour les instructions durables ; planifier les tâches
complexes ; exiger tests, vérifications et revue du diff.

---

# 36. Principe directeur

**Confier à Codex un résultat limité avec le bon contexte, des frontières explicites et des preuves obligatoires, puis examiner le diff avant de l'accepter.**

## 37. Validation finale V1 bêta

Une validation Sprint 10 distingue toujours l’état initial, les corrections de stabilisation et les résultats finaux. Chaque commande conserve son code de sortie et sa durée ; toute mesure non exécutée reste explicitement marquée comme telle. La conclusion ne peut ignorer ni seuil Lighthouse manqué, ni validation physique restante, ni audit de dépendances indisponible.
