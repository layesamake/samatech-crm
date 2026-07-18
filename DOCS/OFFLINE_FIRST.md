# SAMTECH CRM — STRATÉGIE OFFLINE-FIRST

**Document :** `OFFLINE_FIRST.md`  
**Produit :** SAMTECH CRM  
**Éditeur :** SAMTECH  
**Version du document :** 1.0  
**Statut :** Document de référence V1  
**Date :** Juillet 2026

---

# 1. Objet

Ce document définit la stratégie offline-first de SAMTECH CRM V1 Starter.

L'objectif est de permettre à l'utilisateur de travailler avec ses prospects, clients, relances, factures et paiements même lorsque la connexion Internet est absente, instable ou coûteuse.

La V1 utilise :

- un service worker pour rendre l'interface disponible hors connexion ;
- IndexedDB via Dexie.js pour stocker les données métier ;
- des fichiers exportables pour la sauvegarde ;
- aucune synchronisation cloud.

---

# 2. Définition d'offline-first

Offline-first signifie que les fonctionnalités métier essentielles sont conçues pour fonctionner localement par défaut.

Cela ne signifie pas que toutes les capacités du téléphone ou des services externes fonctionneront sans réseau. L'ouverture effective de WhatsApp, l'envoi d'un message, le partage vers une application distante et le téléchargement initial de la PWA peuvent dépendre de la connectivité et du système.

---

# 3. Principes

## 3.1 Données locales comme source de vérité

Dans la V1, IndexedDB est l'unique source de vérité métier. Il n'existe pas de copie serveur à synchroniser.

## 3.2 Séparation du code et des données

- le service worker met en cache le code et les ressources de l'application ;
- IndexedDB conserve les données CRM ;
- le cache HTTP ne doit jamais servir de base de données métier.

## 3.3 Absence de réseau non bloquante

Une action locale ne doit pas être désactivée uniquement parce que `navigator.onLine` indique un état hors ligne.

## 3.4 Échecs explicites

Une action qui dépend réellement d'un service externe doit expliquer pourquoi elle ne peut pas aboutir et préserver le travail déjà saisi.

## 3.5 Aucune perte silencieuse

Une mise à jour, une migration, une erreur de service worker ou un manque d'espace ne doit jamais déclencher l'effacement automatique des données.

---

# 4. Périmètre disponible hors connexion

Après une première ouverture réussie et la mise en cache des ressources essentielles, l'utilisateur doit pouvoir :

- ouvrir l'application ;
- déverrouiller l'accès local ;
- consulter le tableau de bord local ;
- créer, modifier, rechercher et filtrer les prospects ;
- gérer les clients ;
- gérer les localités, catégories, produits et services ;
- créer et gérer les relances ;
- créer et modifier les modèles de messages ;
- préparer et reprendre une campagne ;
- convertir un prospect en client ;
- créer et consulter les factures ;
- enregistrer les paiements ;
- consulter les statistiques calculées localement ;
- générer un PDF si toutes ses ressources sont locales ;
- exporter une sauvegarde ;
- restaurer une sauvegarde valide ;
- modifier les paramètres locaux.

---

# 5. Capacités pouvant dépendre du réseau ou du système

- première visite de l'application ;
- installation initiale de la PWA ;
- réception d'une nouvelle version ;
- ouverture de WhatsApp Web ;
- livraison réelle d'un message WhatsApp ;
- partage vers une application qui nécessite Internet ;
- chargement d'une ressource distante non intégrée au bundle ;
- notifications selon les limitations du navigateur ;
- future activation de licence ou synchronisation cloud.

Le produit ne doit pas annoncer qu'un message a été envoyé simplement parce que WhatsApp a été ouvert.

---

# 6. Architecture

```text
┌────────────────────────────────────────────────┐
│                 Interface PWA                  │
│         pages, composants, navigation          │
└───────────────────┬────────────────────────────┘
                    │
          ┌─────────▼─────────┐
          │ Cas d'usage locaux│
          └─────────┬─────────┘
                    │
          ┌─────────▼─────────┐
          │ IndexedDB / Dexie │  ← données métier
          └───────────────────┘

┌────────────────────────────────────────────────┐
│ Service worker                                 │
│ cache du shell, JS, CSS, icônes et ressources  │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ Services externes facultatifs                  │
│ WhatsApp, partage système, future mise à jour  │
└────────────────────────────────────────────────┘
```

---

# 7. App shell

Le shell applicatif comprend :

- document HTML de démarrage ou réponse de navigation adaptée ;
- JavaScript nécessaire au lancement ;
- styles ;
- polices locales ;
- icônes ;
- manifeste ;
- écran hors ligne ;
- composants essentiels de navigation.

Après la première visite réussie, ce shell doit permettre d'ouvrir l'application sans réseau.

Les modules lourds peuvent être chargés à la demande, mais toute fonction déclarée disponible hors ligne doit avoir été mise en cache avant d'être nécessaire ou proposer un mécanisme clair de préparation.

---

# 8. Stratégies de cache

## 8.1 Ressources versionnées

Stratégie recommandée : `Cache First` avec noms de cache versionnés et nettoyage contrôlé des versions obsolètes.

Exemples : JavaScript compilé, CSS, icônes, polices et images intégrées.

## 8.2 Navigation applicative

Stratégie : servir le shell mis en cache lorsqu'une requête réseau échoue, conformément au comportement du routeur Next.js retenu.

## 8.3 Mise à jour de l'application

Stratégie : vérifier le réseau en arrière-plan, télécharger une nouvelle version, puis demander à l'utilisateur de l'appliquer à un moment sûr.

## 8.4 Ressources externes

Les fonctions essentielles ne doivent pas dépendre de CDN, polices distantes ou images externes.

## 8.5 Données métier

Les données CRM ne passent pas par Cache Storage. Elles sont lues et écrites exclusivement via les dépôts IndexedDB.

## 8.6 Fichiers PDF

Les PDF sont générés à la demande. Ils ne sont pas conservés automatiquement dans le cache du service worker.

---

# 9. Service worker

Le service worker doit :

- être généré ou configuré de manière compatible avec la version de Next.js ;
- précacher les ressources indispensables ;
- fournir une réponse hors ligne pour les navigations ;
- éviter d'intercepter incorrectement les téléchargements et exports ;
- versionner ses caches ;
- supprimer seulement les caches qu'il possède ;
- ne jamais supprimer IndexedDB ;
- gérer les erreurs sans boucle de rechargement ;
- être testé en production build, pas uniquement en développement.

Le choix du plugin PWA doit être validé par un prototype, car la compatibilité avec Next.js peut évoluer.

---

# 10. Cycle de première utilisation

```text
Première ouverture avec Internet
        ↓
Chargement de l'application
        ↓
Création/ouverture d'IndexedDB
        ↓
Installation du service worker
        ↓
Mise en cache des ressources essentielles
        ↓
Vérification de disponibilité hors ligne
        ↓
Application prête
```

L'interface ne doit pas annoncer « disponible hors ligne » avant que l'installation du service worker et le cache essentiel soient effectivement prêts.

---

# 11. Cycle des opérations locales

```text
Action utilisateur
        ↓
Validation du formulaire
        ↓
Validation métier
        ↓
Transaction IndexedDB
        ↓
Confirmation d'écriture
        ↓
Mise à jour de l'interface
```

La présence ou l'absence de réseau n'intervient pas dans ce cycle.

Un message de succès n'est affiché qu'après confirmation de la transaction locale.

---

# 12. Détection du réseau

`navigator.onLine` est un indice, pas une preuve de connectivité réelle.

La stratégie est la suivante :

- utiliser l'événement `online/offline` pour informer l'interface ;
- ne pas bloquer les opérations locales ;
- traiter chaque action externe avec son propre résultat ;
- afficher « Connexion indisponible » seulement après un échec réel lorsque cela est pertinent ;
- ne pas lancer de tests réseau fréquents consommant inutilement les données ou la batterie.

---

# 13. Indicateur d'état

L'application peut afficher :

- **Hors ligne** : aucune connectivité détectée ;
- **En ligne** : connectivité détectée, sans garantie qu'un service tiers fonctionne ;
- **Mise à jour disponible** ;
- **Sauvegarde recommandée** ;
- **Stockage limité** ou **Stockage presque plein**.

L'état hors ligne doit être visible sans être alarmant, puisque le travail local reste possible.

---

# 14. IndexedDB

## Ouverture

La base est ouverte avant l'accès aux écrans métier. L'interface affiche un état de préparation.

## Transactions

Les écritures multi-tables définies dans `DATABASE.md` sont atomiques.

## Réactivité

Les écrans observent les requêtes nécessaires sans dupliquer toutes les données dans un état global.

## Quotas

La capacité disponible dépend du navigateur, de l'appareil, de l'espace libre et du comportement du système. Aucune capacité fixe ne doit être promise.

## Persistance

Lorsque l'API le permet, l'application peut demander un stockage persistant après avoir expliqué son intérêt à l'utilisateur.

---

# 15. Demande de stockage persistant

L'application peut utiliser `navigator.storage.persist()` lorsque disponible.

Règles :

- ne pas déclencher la demande sans contexte ;
- l'expliquer après la création de données importantes ou pendant l'onboarding ;
- traiter un refus sans bloquer l'application ;
- afficher le statut dans les paramètres ;
- continuer à recommander les sauvegardes, même si le stockage est déclaré persistant.

---

# 16. Estimation de stockage

Lorsque disponible, `navigator.storage.estimate()` peut alimenter une page de diagnostic.

L'application peut afficher :

- espace utilisé ;
- quota estimé ;
- pourcentage approximatif ;
- date de la dernière sauvegarde.

Les valeurs sont indicatives et ne doivent pas déclencher une suppression automatique.

---

# 17. Gestion des pièces jointes

La V1 ne doit pas stocker de nombreuses pièces jointes lourdes sans étude préalable.

Pour le logo de l'entreprise et les ressources PDF :

- limiter les formats et dimensions ;
- compresser les images ;
- définir une taille maximale ;
- stocker les blobs dans une table dédiée si nécessaire ;
- exclure toute ressource externe indispensable ;
- inclure les blobs nécessaires dans la sauvegarde ou documenter leur exclusion.

---

# 18. Mises à jour

## Détection

Le service worker détecte une nouvelle version et prépare ses ressources.

## Application différée

La nouvelle version ne doit pas forcer le rechargement pendant :

- la saisie d'un formulaire ;
- une transaction ;
- la génération d'un PDF ;
- une sauvegarde ou restauration ;
- le traitement d'une campagne.

## Message utilisateur

Exemple : « Une nouvelle version est prête. Enregistrez votre travail puis actualisez l'application. »

## Activation

L'utilisateur peut appliquer la mise à jour immédiatement lorsqu'aucun travail non enregistré n'existe, ou la différer.

---

# 19. Compatibilité code/base

Le code ne doit accéder aux écrans métier qu'après :

1. ouverture de la base ;
2. exécution des migrations ;
3. validation minimale de l'état ;
4. signalement de la version prête.

Le service worker et le schéma IndexedDB évoluent séparément, mais leurs versions compatibles doivent être documentées.

---

# 20. Migrations hors ligne

Les migrations sont intégrées au code téléchargé. Elles s'exécutent donc sans réseau après activation de la nouvelle version.

Avant une migration risquée :

- vérifier l'espace disponible si possible ;
- recommander une sauvegarde ;
- afficher un écran de progression ;
- empêcher la fermeture logique des opérations ;
- ne pas supprimer la base en cas d'échec.

Une migration échouée doit conduire à un mode de récupération, pas à une réinitialisation silencieuse.

---

# 21. Mode de récupération

Le mode de récupération est affiché si la base ne peut pas être ouverte ou migrée normalement.

Il doit proposer, selon ce qui reste techniquement possible :

- réessayer ;
- afficher un diagnostic simplifié ;
- exporter une sauvegarde ou un paquet de récupération ;
- restaurer une sauvegarde connue ;
- contacter le support avec un code d'erreur non sensible.

L'action « Effacer toutes les données » doit être séparée, clairement signalée et protégée par une confirmation renforcée.

---

# 22. Sauvegarde locale

La sauvegarde est la protection principale contre :

- suppression des données du navigateur ;
- désinstallation de la PWA ;
- perte ou changement d'appareil ;
- panne de stockage ;
- migration incompatible ;
- erreur humaine.

L'application doit :

- rappeler régulièrement de sauvegarder ;
- afficher la date du dernier export ;
- permettre un export hors ligne ;
- valider le fichier généré avant de le proposer ;
- utiliser un format versionné.

---

# 23. Fréquence de sauvegarde recommandée

Recommandation initiale :

- après l'onboarding et la configuration ;
- après un import important ;
- au moins une fois par semaine pour un usage courant ;
- plus fréquemment pour une activité quotidienne ;
- avant une mise à jour majeure ou une restauration.

La V1 peut afficher un rappel basé sur le temps écoulé et le nombre de modifications depuis le dernier export.

---

# 24. Restauration

La restauration fonctionne hors connexion avec un fichier local.

Elle doit :

- lire le fichier sans modifier la base ;
- valider le format et la version ;
- contrôler les références ;
- afficher le nombre de contacts, factures et autres données ;
- avertir que la base actuelle sera remplacée ;
- demander confirmation ;
- utiliser une transaction ;
- vérifier l'intégrité après import.

En cas d'échec, la base précédente doit être préservée autant que possible.

---

# 25. iPhone et iPad

Les PWA sur iOS peuvent présenter des différences concernant :

- installation sur l'écran d'accueil ;
- quotas et éviction du stockage ;
- partage de fichiers ;
- notifications ;
- exécution en arrière-plan ;
- mise à jour du service worker ;
- comportement après une longue période sans utilisation.

Conséquences :

- tester sur de vrais appareils iPhone ;
- fournir un guide d'installation Safari ;
- recommander fortement les sauvegardes ;
- ne pas dépendre des tâches en arrière-plan pour les relances ;
- proposer un fallback de téléchargement pour les PDF.

---

# 26. Android

Sur Android, l'installation et l'intégration PWA sont généralement plus complètes, mais il faut tout de même tester :

- Chrome et navigateurs ciblés ;
- installation ;
- stockage persistant ;
- partage PDF ;
- ouverture de WhatsApp ;
- retour dans la PWA après WhatsApp ;
- économie de batterie et fermeture de l'application.

Aucune fonction essentielle ne doit dépendre d'une tâche JavaScript prolongée en arrière-plan.

---

# 27. Ordinateur

Sur ordinateur, la PWA doit fonctionner dans Chrome et Edge récents, installée ou dans un onglet.

WhatsApp peut s'ouvrir dans WhatsApp Desktop ou WhatsApp Web selon la configuration du système. Le CRM doit uniquement garantir la construction correcte du lien.

---

# 28. Relances et notifications

La V1 ne doit pas garantir des notifications locales fiables lorsque l'application est fermée, car les navigateurs et iOS imposent des limites.

Le comportement minimal garanti est :

- affichage des relances du jour à l'ouverture ;
- compteur des relances en retard ;
- tri par priorité et échéance.

Toute notification PWA ajoutée doit être décrite comme une amélioration progressive et non comme l'unique mécanisme de rappel.

---

# 29. Campagnes hors ligne

L'utilisateur peut hors ligne :

- créer la campagne ;
- définir les filtres ;
- figer les destinataires ;
- résoudre les messages ;
- consulter et modifier la liste ;
- reprendre la progression.

L'ouverture et la livraison via WhatsApp dépendent de l'environnement. Une erreur ne doit pas faire perdre la progression de la campagne.

---

# 30. Factures et PDF hors ligne

La génération PDF doit fonctionner hors connexion si :

- la bibliothèque est chargée ou précachée ;
- les polices sont locales ;
- le logo est enregistré localement ;
- aucune image distante n'est requise.

Les calculs et instantanés proviennent d'IndexedDB. Le partage peut être remplacé par un téléchargement si l'API système n'est pas disponible.

Mise en œuvre Sprint 5 : création et modification des brouillons, émission et séquence annuelle, annulation, consultation et génération `pdf-lib` s’exécutent intégralement dans le navigateur. Les PDF sont produits à la demande dans un `Blob`, l’URL d’objet est révoquée, et aucun PDF n’est ajouté automatiquement à IndexedDB ou au cache du service worker. Le scénario de production vérifie téléchargement, fallback et actualisation de la fiche client en mode hors ligne.

---

# 31. États d'interface

Chaque écran dépendant de la base doit prévoir :

- initialisation ;
- prêt ;
- liste vide ;
- chargement d'une requête ;
- écriture en cours ;
- succès ;
- erreur récupérable ;
- erreur de stockage ;
- mode récupération.

Un écran vide ne doit jamais masquer une erreur d'ouverture de base.

---

# 32. Erreurs de quota

Lorsqu'une écriture échoue faute d'espace :

1. ne pas afficher de faux succès ;
2. préserver les données déjà enregistrées ;
3. informer l'utilisateur ;
4. proposer une sauvegarde si possible ;
5. proposer de réduire les ressources lourdes contrôlées par l'application ;
6. ne pas supprimer automatiquement des données métier.

---

# 33. Désinstallation et suppression des données

La désinstallation d'une PWA ou l'effacement des données du site peut supprimer IndexedDB selon la plateforme.

L'application doit expliquer que :

- l'icône installée n'est pas une sauvegarde ;
- les données restent liées au navigateur et au profil ;
- changer de navigateur crée un espace de données distinct ;
- une sauvegarde exportée est nécessaire pour transférer les données en V1.

---

# 34. Changement d'appareil

En V1 :

```text
Ancien appareil
  → exporter une sauvegarde
  → transférer le fichier de manière sûre

Nouvel appareil
  → installer SAMTECH CRM
  → ouvrir l'application
  → restaurer la sauvegarde
  → vérifier les données
```

Il n'existe pas de transfert automatique tant que le cloud est hors périmètre.

---

# 35. Sécurité hors ligne

- ne pas mettre les données métier dans le cache HTTP ;
- ne pas inclure les coordonnées dans les URL ;
- ne pas journaliser les données personnelles ;
- protéger l'accès par PIN local selon `SECURITY.md` ;
- valider strictement les sauvegardes ;
- appliquer une politique de contenu restrictive ;
- considérer les fichiers exportés comme sensibles.

Le stockage IndexedDB n'est pas présenté comme inviolable sur un appareil compromis.

---

# 36. Tests automatisés

Les tests doivent couvrir :

- démarrage sans réseau après première visite ;
- navigation entre les routes mises en cache ;
- opérations CRUD hors ligne ;
- transaction interrompue ;
- mise à jour du service worker ;
- migration hors ligne ;
- sauvegarde sans réseau ;
- restauration sans réseau ;
- génération PDF hors ligne ;
- erreur de quota simulée ;
- base inaccessible ;
- reprise après fermeture pendant une campagne.

---

# 37. Tests manuels par plateforme

## Android

- installation depuis Chrome ;
- lancement en mode avion ;
- saisie et fermeture forcée ;
- retour depuis WhatsApp ;
- partage et téléchargement PDF.

## iPhone

- ajout à l'écran d'accueil depuis Safari ;
- lancement en mode avion ;
- restauration après fermeture ;
- téléchargement ou partage PDF ;
- comportement après redémarrage ;
- stockage après une période d'inactivité.

## Ordinateur

- installation Chrome/Edge ;
- lancement sans réseau ;
- export et restauration ;
- ouverture WhatsApp Desktop/Web ;
- mise à jour de la PWA.

---

# 38. Critères d'acceptation

La stratégie offline-first est validée si :

1. la PWA s'ouvre sans réseau après installation ;
2. les opérations métier essentielles fonctionnent hors ligne ;
3. les données persistent après fermeture normale et forcée ;
4. une mise à jour ne supprime aucune donnée ;
5. une migration valide fonctionne hors ligne ;
6. un échec de migration conduit à une récupération contrôlée ;
7. la sauvegarde et la restauration fonctionnent sans réseau ;
8. les PDF essentiels sont générables hors ligne ;
9. les limites WhatsApp et notifications sont clairement expliquées ;
10. Android, iPhone et ordinateur ont été testés.

---

# 39. Préparation du cloud futur

La future synchronisation ne doit pas modifier le principe selon lequel une écriture locale est rapide et utilisable hors ligne.

La V2 devra ajouter :

- journal ou file d'opérations ;
- identité et organisation ;
- révisions ;
- suppressions synchronisables ;
- résolution des conflits ;
- état de synchronisation ;
- chiffrement en transit ;
- récupération distante.

Ces mécanismes sont explicitement absents de la V1.

---

# 40. Documentation utilisateur nécessaire

- comment installer la PWA sur Android ;
- comment l'installer sur iPhone ;
- comment travailler hors ligne ;
- ce qui dépend d'Internet ;
- comment sauvegarder ;
- comment restaurer ;
- comment changer d'appareil ;
- risques liés à l'effacement des données du navigateur ;
- limites des notifications ;
- résolution des problèmes courants.

---

# 41. Décisions à confirmer par prototype

- solution PWA compatible avec la version retenue de Next.js ;
- stratégie exacte de fallback de navigation ;
- liste des chunks à précacher ;
- méthode de détection d'une mise à jour sûre ;
- comportement de la génération PDF hors ligne ;
- persistance réelle sur Safari iOS ciblé ;
- limites de taille des sauvegardes ;
- comportement des API de partage sur chaque plateforme.

---

# 42. Prochaine étape

Après validation de `OFFLINE_FIRST.md`, le document `SECURITY.md` doit définir la sécurité locale, le PIN, la protection des sauvegardes, la validation des entrées, la chaîne de dépendances et les limites de sécurité propres à une PWA sans backend.

---

# 43. Principe directeur

**L'utilisateur doit pouvoir continuer à travailler sans réseau, comprendre les limites de son appareil et conserver la maîtrise de ses données grâce à des sauvegardes vérifiables.**

---

# 44. Paiements et créances hors ligne — Sprint 6

L’enregistrement, la contrepassation, la consultation de l’historique, le calcul des créances et la génération du PDF financier ne déclenchent aucune requête métier réseau. Toutes ces opérations lisent et écrivent IndexedDB par les dépôts locaux.

Le scénario navigateur Sprint 6 installe d’abord l’application en ligne, passe ensuite Chromium hors ligne, enregistre un paiement, recharge la page, vérifie sa persistance et le recalcul du solde, puis génère le PDF. Toute panne réseau en ligne, exception de page ou erreur console reste bloquante; les requêtes attendues pendant la phase volontairement hors ligne sont comptées séparément.

---

# 45. Campagnes assistées hors ligne — Sprint 7

Création, segmentation, prévisualisation, lancement, progression, confirmation, ignorance, erreur abandonnée, reprise, fin et consultation utilisent uniquement IndexedDB. Aucun traitement en arrière-plan ni envoi automatique n’existe.

Le lien WhatsApp peut être préparé hors ligne mais son ouverture effective dépend de l’application et du réseau. Une préparation ne confirme jamais le contact. Le scénario Sprint 7 recharge l’exécution hors ligne, reprend le premier destinataire non finalisé, finalise localement et vérifie les instantanés après navigation.

---

# 46. Tableau de bord et statistiques hors ligne — Sprint 8

Les routes `/` et `/statistics` lisent uniquement IndexedDB par le cas d’usage statistique. Changement de période, comparaison, séries, classements, détection d’intégrité et actualisation ne déclenchent aucune requête métier réseau. Le service worker existant assure l’ouverture après une première visite en ligne.

Le scénario Sprint 8 recharge l’écran détaillé en mode hors ligne, recalcule les indicateurs et change de période. Les échecs réseau attendus pendant cette phase volontaire sont séparés des échecs en ligne bloquants.

---

# 47. Sauvegarde, restauration et verrouillage hors ligne — Sprint 9

`/settings/backup` lit et écrit uniquement IndexedDB et des fichiers locaux avec `Blob`, `File` et Web Crypto. Export, validation SHA-256, aperçu et remplacement transactionnel n'appellent aucun service distant. `/settings/security` dérive le PIN localement et le verrouillage global ne dépend pas du réseau.

Le service worker généré précache les ressources du build et permet les parcours après un premier chargement. Le test Chromium Sprint 9 active le mode hors ligne puis exécute export, relecture, validation, restauration protégée par PIN et vérification des données. Les fichiers téléchargés ne sont pas ajoutés au cache applicatif.

## Mise à jour V1 bêta

`scripts/test-pwa-update.js` force l’enregistrement et la mise à jour du service worker sur le build de production, vérifie son scope, recharge une route hors ligne et confirme que les enregistrements IndexedDB sont conservés. Les essais d’installation, d’éviction de stockage et de mise à jour sur Android/iOS physiques restent obligatoires dans la checklist.
