# SAMTECH CRM — PROMPTS POUR GEMINI

**Document :** `PROMPTS_GEMINI.md`  
**Produit :** SAMTECH CRM  
**Éditeur :** SAMTECH  
**Version du document :** 1.0  
**Statut :** Guide d'exécution du développement  
**Date :** Juillet 2026

---

# 1. Objet

Ce document fournit des prompts structurés pour faire développer SAMTECH CRM progressivement avec Gemini.

Gemini doit agir comme développeur d'un module limité, et non comme propriétaire du produit. Il ne doit pas inventer de fonctionnalités, modifier silencieusement l'architecture ou anticiper le cloud, les licences et l'intelligence artificielle.

Le dossier de référence est :

```text
D:\dev\samatech crm
```

---

# 2. Documents obligatoires

Avant toute modification, Gemini doit lire :

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

Pour une tâche limitée, il peut se concentrer ensuite sur les sections pertinentes, mais il doit connaître les contraintes globales.

---

# 3. Ordre de priorité des références

En cas d'ambiguïté :

1. demander une décision si l'ambiguïté modifie le comportement métier ;
2. respecter `RULES.md` pour les règles métier ;
3. respecter `DATABASE.md` pour les données ;
4. respecter `ARCHITECTURE.md` pour les frontières techniques ;
5. respecter `UI_UX.md` pour l'expérience ;
6. respecter `TESTING.md` pour les preuves ;
7. ne jamais résoudre une contradiction en inventant silencieusement une solution.

---

# 4. Interdictions générales

Gemini ne doit pas :

- développer toute l'application en une seule tâche ;
- ajouter un backend métier dans la V1 ;
- ajouter Supabase, Firebase ou une autre base cloud ;
- ajouter une authentification distante ;
- ajouter la gestion des licences ;
- ajouter le multi-utilisateur ;
- intégrer l'API WhatsApp Business ;
- automatiser les envois WhatsApp ;
- ajouter de l'intelligence artificielle ;
- créer des microservices ;
- créer prématurément SAMTECH Core ;
- remplacer IndexedDB/Dexie sans décision ;
- stocker l'argent en nombres flottants non contrôlés ;
- stocker le PIN en clair ;
- supprimer ou réinitialiser une base comme solution à une migration ;
- masquer un test en échec ;
- modifier une règle métier uniquement dans le code ;
- utiliser des données personnelles réelles dans les tests ;
- faire un commit, push ou déploiement sans demande explicite.

---

# 5. Prompt maître de session

Copier ce prompt au début d'une nouvelle session Gemini :

```text
Tu travailles sur SAMTECH CRM dans le dossier exact :
D:\dev\samatech crm

SAMTECH CRM V1 est une PWA mobile-first, offline-first et mono-utilisateur. IndexedDB via Dexie.js est la source de vérité. Il n'existe pas de backend métier, cloud, synchronisation, licence, multi-utilisateur, API WhatsApp Business ou IA dans la V1.

Avant toute action :
1. lis entièrement VISION.md, ROADMAP.md, CAHIER_DES_CHARGES.md, RULES.md, ARCHITECTURE.md, DATABASE.md, OFFLINE_FIRST.md, SECURITY.md, UI_UX.md et TESTING.md ;
2. inspecte l'état actuel du projet et les changements existants ;
3. résume le périmètre de la tâche, les règles BR-* concernées, les fichiers probables et les tests requis ;
4. signale toute contradiction documentaire importante avant de coder.

Règles d'exécution :
- travaille uniquement sur la tâche demandée ;
- préserve les changements existants ;
- respecte les couches présentation, application, domaine et infrastructure ;
- garde les règles métier hors des composants React ;
- utilise des transactions Dexie pour les écritures multi-tables ;
- crée ou adapte les tests ;
- vérifie le mobile-first et le mode hors ligne ;
- n'ajoute aucune dépendance sans justification ;
- ne modifie pas le périmètre ;
- ne prétends jamais qu'un message WhatsApp a été envoyé après une simple ouverture ;
- mets à jour la documentation concernée et CHANGELOG.md si la tâche modifie le comportement livré.

À la fin, fournis :
- résultat obtenu ;
- fichiers modifiés ;
- règles BR-* couvertes ;
- tests créés ;
- commandes réellement exécutées et résultats ;
- vérifications manuelles restantes ;
- limites ou risques ;
- aucune affirmation non vérifiée.

N'effectue aucun commit, push ou déploiement sans autorisation explicite.
```

---

# 6. Prompt d'analyse avant implémentation

```text
Analyse la tâche suivante sans modifier de fichier pour le moment :

[DÉCRIRE LA TÂCHE]

Lis les documents de référence et inspecte le code actuel. Fournis :
1. périmètre exact ;
2. hors périmètre ;
3. règles BR-* concernées ;
4. entités et tables concernées ;
5. cas d'usage ;
6. écrans et états UX ;
7. risques offline et sécurité ;
8. tests nécessaires ;
9. dépendances éventuelles ;
10. plan de fichiers limité.

Si les documents se contredisent, cite précisément les sections et arrête-toi sur la question à trancher. Ne propose pas d'élargissement fonctionnel.
```

---

# 7. Prompt d'implémentation générique

```text
Implémente uniquement la tâche validée ci-dessous :

[DÉCRIRE LA TÂCHE]

Règles métier concernées : [BR-XXX, BR-YYY]
Critères d'acceptation :
- [CRITÈRE 1]
- [CRITÈRE 2]
- [CRITÈRE 3]

Contraintes :
- respecte l'architecture documentée ;
- n'ajoute pas de fonctionnalité hors périmètre ;
- écris d'abord ou en même temps les tests utiles ;
- applique les transactions prévues ;
- gère chargement, vide, succès et erreur ;
- vérifie le mobile-first ;
- vérifie le comportement hors ligne ;
- n'ajoute aucune dépendance sans nécessité prouvée ;
- préserve les modifications existantes.

Après l'implémentation, exécute les contrôles pertinents : format, lint, TypeScript, tests ciblés, tests complets et build. Corrige les problèmes causés par la tâche.

Termine par un rapport factuel conforme au prompt maître.
```

---

# 8. Prompt Sprint 0 — Initialisation

```text
Initialise uniquement le Sprint 0 de SAMTECH CRM dans D:\dev\samatech crm.

Objectif : obtenir une base Next.js TypeScript mobile-first, testable et prête pour IndexedDB et la PWA, sans implémenter les modules métier.

Lis tous les documents. Commence par inspecter le dossier et ne détruis aucun fichier existant.

Travaux attendus :
- initialiser Next.js avec App Router et TypeScript strict si le projet ne l'est pas déjà ;
- configurer Tailwind CSS ;
- installer/configurer shadcn/ui ou primitives équivalentes seulement si validé ;
- créer la structure définie dans ARCHITECTURE.md ;
- configurer format, lint, vérification TypeScript et tests ;
- préparer Dexie et une base minimale versionnée ;
- créer le shell responsive et la navigation principale sans données métier ;
- préparer manifeste, icônes temporaires et stratégie PWA minimale ;
- créer un écran de diagnostic de développement simple ;
- documenter les commandes dans README.md ;
- créer CHANGELOG.md s'il n'existe pas.

Ne crée pas de backend, cloud, licence, authentification distante ou modules complets.

Tests attendus :
- build ;
- rendu du shell ;
- ouverture de la base ;
- manifeste ;
- test de fumée.

Exécute toutes les vérifications et rapporte leurs résultats réels.
```

---

# 9. Prompt Sprint 1 — Paramètres, localités et catalogue

```text
Implémente uniquement le Sprint 1 : Paramètres, localités, catégories et produits/services.

Références principales :
- CAHIER_DES_CHARGES.md sections 9 à 11 ;
- RULES.md BR-050 à BR-064 ;
- DATABASE.md tables locations, categories, products, settings et sequences ;
- UI_UX.md sections Produits, Localités et Paramètres ;
- TESTING.md sections correspondantes.

Livrables :
- domaine et validations ;
- interfaces de dépôts ;
- implémentations Dexie ;
- cas d'usage CRUD et archivage ;
- configuration minimale de l'entreprise, devise et facturation ;
- listes, recherche, filtres et formulaires mobile-first ;
- états vide, chargement, succès et erreur ;
- tests unitaires, intégration et composants.

Contraintes :
- un produit archivé reste lisible dans l'historique futur ;
- prix et taxes utilisent une représentation sûre ;
- aucune gestion de stock ;
- aucune synchronisation.

Exécute format, lint, TypeScript, tests et build. Rapporte les résultats.
```

---

# 10. Prompt Sprint 2 — Prospects

```text
Implémente uniquement le Sprint 2 : gestion des prospects.

Références :
- RULES.md BR-010 à BR-033 ;
- DATABASE.md contacts, prospectProfiles, prospectInterests, tags, contactTags, notes et timelineEvents ;
- UI_UX.md sections 13 à 18 ;
- TESTING.md sections 10 à 13.

Fonctions :
- création rapide ;
- édition ;
- normalisation du numéro ;
- avertissement de doublon ;
- statuts et intérêts ;
- produits demandés ;
- tags et notes ;
- recherche, filtres combinés et archivage ;
- fiche prospect et chronologie de base.

Transactions : création du contact, profil, intérêts/tags initiaux et événement lorsqu'ils appartiennent à une même action.

Ne développe pas encore les relances, la conversion client, les factures ou campagnes au-delà des interfaces nécessaires.

Tests obligatoires : normalisation, doublons, transitions, unicités, recherche, filtres, archivage, rollback et parcours de création mobile.
```

---

# 11. Prompt Sprint 3 — Relances et messages

```text
Implémente uniquement le Sprint 3 : relances et modèles de messages.

Références :
- RULES.md BR-070 à BR-084 ;
- DATABASE.md followUps et messageTemplates ;
- UI_UX.md sections 20 à 23 ;
- TESTING.md sections 14 et 15 ;
- OFFLINE_FIRST.md pour les limites des notifications.

Fonctions :
- création, réalisation, report et annulation ;
- vues Aujourd'hui, En retard, À venir et Terminées ;
- priorités et tri ;
- modèles avec variables ;
- prévisualisation ;
- adaptateur WhatsApp et fallback Copier ;
- confirmation manuelle après retour ;
- événements de chronologie.

Règle absolue : ouvrir WhatsApp ne marque jamais automatiquement la relance comme réalisée ou le message comme envoyé.

Ne garantis pas de notifications lorsque la PWA est fermée.

Teste fuseaux, horloge contrôlée, report transactionnel, variables, encodage WhatsApp et fonctionnement hors ligne local.
```

---

# 12. Prompt Sprint 4 — Clients et conversion

```text
Implémente uniquement le Sprint 4 : conversion prospect vers client et fiche client 360°.

Références :
- RULES.md BR-040 à BR-046 ;
- DATABASE.md contacts, prospectProfiles, clientProfiles et timelineEvents ;
- UI_UX.md sections 19, 24 et 25 ;
- TESTING.md section 12.

Fonctions :
- action explicite de conversion ;
- identité unique sans duplication ;
- date de conversion ;
- profil client ;
- conservation de l'historique ;
- liste clients et fiche 360° avec données disponibles ;
- option de poursuivre vers une facture seulement sous forme de point d'entrée si le Sprint 5 n'est pas encore présent.

La conversion doit être transactionnelle. Une seconde conversion doit être refusée proprement.

N'invente pas de logique de retour client vers prospect lorsque des données incompatibles existent.
```

---

# 13. Prompt Sprint 5 — Facturation

```text
Implémente uniquement le Sprint 5 : facturation et PDF.

Références :
- RULES.md BR-100 à BR-129 ;
- DATABASE.md invoices, invoiceLines et sequences ;
- UI_UX.md sections 27 à 31 ;
- TESTING.md sections 17, 18 et 31 ;
- SECURITY.md pour PDF et données utilisateur.

Avant de choisir une bibliothèque PDF, fais une preuve de concept avec :
- UTF-8 et accents ;
- logo facultatif ;
- 50 lignes ;
- plusieurs pages ;
- génération hors ligne ;
- téléchargement et partage.

Implémente :
- brouillons sans numéro définitif ;
- moteur Money/calcul pur ;
- lignes, remises et taxes validées ;
- attribution transactionnelle du numéro à l'émission ;
- instantanés entreprise/client/produit ;
- statuts et annulation ;
- PDF utilisant exclusivement les totaux calculés et instantanés.

Interdictions : flottants non contrôlés, modification libre après émission, recalcul indépendant dans le PDF.

Ajoute les tests de matrice financière, arrondi, numérotation, rollback, instantanés et PDF.
```

---

# 14. Prompt Sprint 6 — Paiements

```text
Implémente uniquement le Sprint 6 : paiements et créances.

Références :
- RULES.md BR-130 à BR-150 ;
- DATABASE.md payments, invoices et clientProfiles ;
- UI_UX.md section 32 ;
- TESTING.md sections 19 et 20.

Fonctions :
- paiement complet ou partiel ;
- modes locaux ;
- recalcul du total payé, solde et statut ;
- liste et filtres ;
- renversement traçable ;
- factures impayées et en retard ;
- indicateurs facturé, encaissé et créances.

Toutes les écritures paiement/facture/événement sont transactionnelles.

Teste montant nul, surpaiement, plusieurs paiements, unité minimale, renversement, facture annulée, rollback et statistiques.
```

---

# 15. Prompt Sprint 7 — Campagnes

```text
Implémente uniquement le Sprint 7 : campagnes WhatsApp assistées.

Références :
- RULES.md BR-090 à BR-099 ;
- DATABASE.md campaigns et campaignRecipients ;
- UI_UX.md sections 33 et 34 ;
- TESTING.md section 16.

Fonctions :
- assistant en cinq étapes ;
- ciblage par critères documentés ;
- aperçu et exclusions ;
- liste figée au lancement ;
- suppression des doublons par numéro ;
- messages résolus et figés ;
- traitement destinataire par destinataire ;
- progression ;
- interruption et reprise ;
- états finaux.

Règle absolue : aucun envoi automatique et aucune confirmation automatique.

Teste les combinaisons de filtres, l'instantané, les doublons, le rollback, la reprise hors ligne et la terminaison.
```

---

# 16. Prompt Sprint 8 — Tableau de bord et statistiques

```text
Implémente uniquement le Sprint 8 : tableau de bord et statistiques.

Références :
- RULES.md BR-140 à BR-150 ;
- UI_UX.md sections 11, 12 et 35 ;
- TESTING.md section 20 ;
- DATABASE.md section Statistiques.

Fonctions :
- résumé du jour ;
- indicateurs essentiels ;
- actions rapides ;
- produits demandés ;
- conversion ;
- ventes, encaissements et créances ;
- filtres de période, produit et localité ;
- valeurs exactes en complément des graphiques ;
- états sans données.

Les formules doivent être centralisées, testées et indiquer clairement la date utilisée. N'ajoute pas de table d'agrégats sans preuve de performance.

Mesure avec les volumes de référence et rapporte les résultats.
```

---

# 17. Prompt Sprint 9 — Sauvegarde et sécurité locale

```text
Implémente uniquement le Sprint 9 : sauvegarde, restauration et PIN local.

Références :
- RULES.md BR-180 à BR-213 ;
- DATABASE.md sections sauvegarde/restauration/securitySettings ;
- OFFLINE_FIRST.md ;
- SECURITY.md ;
- UI_UX.md sections 10, 37 et 38 ;
- TESTING.md sections 25 à 29 et 37.

Sauvegarde :
- format applicatif versionné indépendant de Dexie ;
- UTF-8 ;
- validation ;
- contrôle d'intégrité contre corruption ;
- export hors ligne ;
- date de dernière sauvegarde.

Restauration :
- analyse complète avant écriture ;
- aperçu ;
- confirmation renforcée ;
- transaction ;
- diagnostic post-restauration ;
- base actuelle préservée si échec.

PIN :
- aucune valeur en clair ;
- dérivation salée et versionnée via primitives reconnues ;
- délais après échecs ;
- verrouillage après inactivité ;
- politique PIN oublié : réinitialisation complète des données locales, puis restauration facultative d'une sauvegarde et création d'un nouveau PIN.

Ne présente pas le PIN comme un chiffrement d'IndexedDB. N'invente pas une cryptographie maison.
```

---

# 18. Prompt Sprint 10 — Stabilisation

```text
Effectue uniquement le Sprint 10 : stabilisation et préparation de la bêta.

Ne développe aucune nouvelle fonctionnalité.

Travaux :
- exécuter toute la suite ;
- corriger les défauts causés par la V1 ;
- vérifier les parcours E2E-01 à E2E-06 de TESTING.md ;
- tester le build de production ;
- tester PWA, mise à jour et hors ligne ;
- mesurer les volumes de référence ;
- auditer l'accessibilité ;
- auditer les dépendances et le bundle ;
- vérifier CSP et en-têtes ;
- vérifier les migrations ;
- tester sauvegarde/restauration ;
- inspecter les journaux ;
- préparer les données de démonstration et le guide utilisateur minimal ;
- mettre à jour CHANGELOG.md.

Produit un rapport de recette listant clairement : réussi, échoué, non testé, appareil requis et risque résiduel. Ne masque aucun échec.
```

---

# 19. Prompt de correction de bug

```text
Corrige uniquement le défaut suivant :

[DESCRIPTION]

Étapes de reproduction :
[ÉTAPES]

Résultat attendu :
[ATTENDU]

Résultat observé :
[OBSERVÉ]

Avant de modifier :
- reproduis le défaut ;
- identifie la règle BR-* et la cause racine ;
- vérifie si des données existantes peuvent être affectées.

Ajoute un test de régression qui échoue avant la correction. Applique la plus petite correction cohérente. N'effectue pas de refactoring non lié.

Exécute les tests ciblés puis la suite pertinente et le build. Rapporte la reproduction, la cause, les fichiers, les tests et les risques.
```

---

# 20. Prompt de migration

```text
Conçois et implémente uniquement la migration de base suivante :

[CHANGEMENT DE SCHÉMA]

Exigences :
- mettre à jour DATABASE.md avant ou avec le code ;
- incrémenter la version Dexie ;
- préserver toutes les données ;
- transformer explicitement les anciennes valeurs ;
- ne jamais supprimer la base en cas d'échec ;
- ajouter une base fixture de la version précédente ;
- tester N → N+1, réouverture, erreur et volumes ;
- mettre à jour le format de sauvegarde uniquement si nécessaire ;
- documenter la compatibilité dans CHANGELOG.md.

Fournis un plan avant d'écrire si une donnée ancienne est ambiguë.
```

---

# 21. Prompt de revue de code

```text
Effectue une revue en lecture seule des changements actuels de SAMTECH CRM.

Recherche prioritairement :
- violation des règles BR-* ;
- perte ou corruption de données ;
- transaction manquante ;
- calcul financier incorrect ;
- migration dangereuse ;
- faille XSS ou import non validé ;
- fuite de données ;
- confusion ouverture/envoi WhatsApp ;
- régression offline ;
- problème mobile ou accessibilité ;
- test manquant.

Présente uniquement des constats vérifiables, classés par priorité, avec fichier et ligne, impact, scénario et correction recommandée. Ne modifie aucun fichier sauf demande explicite.
```

---

# 22. Prompt d'audit documentaire

```text
Audite la cohérence de VISION.md, ROADMAP.md, CAHIER_DES_CHARGES.md, RULES.md, ARCHITECTURE.md, DATABASE.md, OFFLINE_FIRST.md, SECURITY.md, UI_UX.md et TESTING.md.

Ne modifie rien.

Signale :
- contradictions ;
- règles sans données correspondantes ;
- tables sans besoin fonctionnel ;
- parcours sans test ;
- exigences offline incompatibles ;
- promesses de sécurité excessives ;
- fonctions V2 présentes en V1 ;
- termes et statuts incohérents.

Pour chaque constat, cite les sections et propose une décision minimale. Distingue erreur certaine, ambiguïté et amélioration facultative.
```

---

# 23. Prompt de choix d'une dépendance

```text
Évalue le besoin d'une dépendance pour : [BESOIN].

Ne l'installe pas encore.

Compare l'absence de dépendance et au maximum trois options selon :
- compatibilité avec Next.js et la PWA ;
- fonctionnement hors ligne ;
- taille ;
- maintenance ;
- sécurité ;
- licence ;
- TypeScript ;
- testabilité ;
- impact mobile ;
- risque de verrouillage.

Recommande une option et un prototype minimal. Toute information non vérifiée doit être signalée. Attends validation avant installation.
```

---

# 24. Prompt de validation finale d'un module

```text
Valide le module [NOM] sans ajouter de fonctionnalité.

1. établis la liste des règles BR-* concernées ;
2. relie chaque règle à son implémentation et ses tests ;
3. exécute format, lint, TypeScript, tests ciblés, tests complets et build ;
4. exécute les parcours pertinents ;
5. vérifie le mode hors ligne ;
6. vérifie mobile et accessibilité ;
7. vérifie les données et transactions ;
8. vérifie la documentation.

Retourne une matrice : exigence, preuve, résultat, limite. Utilise les états Réussi, Échoué, Non testé et Non applicable. Ne remplace jamais Non testé par Réussi.
```

---

# 25. Format obligatoire du rapport final

```text
## Résultat
[résumé factuel]

## Périmètre réalisé
- ...

## Fichiers modifiés
- chemin : raison

## Règles couvertes
- BR-XXX : preuve

## Tests ajoutés
- test : scénario

## Vérifications exécutées
- commande : résultat réel

## Vérifications manuelles restantes
- ...

## Risques ou limites
- ...

## Documentation
- fichiers mis à jour
```

Si une commande n'a pas été exécutée, écrire explicitement « non exécutée ».

---

# 26. Checklist avant chaque prompt

- le sprint ou module est nommé ;
- le périmètre est limité ;
- les règles BR-* sont citées ;
- les critères d'acceptation sont fournis ;
- les documents concernés sont indiqués ;
- les tests sont exigés ;
- les exclusions sont rappelées ;
- le format du rapport est imposé ;
- commit, push et déploiement ne sont pas autorisés implicitement.

---

# 27. Checklist après chaque réponse Gemini

- Gemini a-t-il lu les documents ?
- Le code reste-t-il dans le périmètre ?
- Une dépendance a-t-elle été ajoutée ?
- Les règles métier sont-elles hors de l'interface ?
- Les transactions sont-elles présentes ?
- Les tests ont-ils réellement été exécutés ?
- Le build réussit-il ?
- Le mode hors ligne a-t-il été vérifié ?
- Les affirmations sont-elles prouvées ?
- La documentation est-elle à jour ?
- Des changements non liés sont-ils présents ?

---

# 28. Principe directeur

**Demander à Gemini de livrer un module limité, prouvé par des tests et conforme aux documents, jamais de générer toute l'application en une seule fois.**

## 29. Audit factuel du Sprint 10

L’audit final porte sur le dépôt réel, exécute les commandes disponibles et sépare défauts applicatifs, défauts de recette et limitations d’environnement. Il ne déclare jamais réussis les navigateurs ou appareils physiques non essayés et termine seulement après inventaire des preuves, écarts et critères bloquants.
