# Analyse fonctionnelle et technique — Sprint 11

## Recette physique et correction PWA

## 1. Contexte

SAMTECH CRM est une PWA Next.js 16, mobile-first, mono-utilisateur et hors ligne. La V1 bêta couvre le cycle commercial complet ainsi que les dépenses. Les contrôles automatisés du Sprint 10 ont validé le build, les calculs financiers, IndexedDB, la sauvegarde, le PIN, l’accessibilité automatisée, le responsive et les principaux parcours hors ligne.

La validation actuelle reste toutefois incomplète sur des points qui dépendent d’un environnement réel : installation sur écran d’accueil, mise à jour entre deux versions distinctes, clavier virtuel, zones sûres iOS, partage de fichiers, quotas de stockage et comportement après fermeture complète du navigateur.

Le dépôt est désormais en Dexie V11 avec `expenses`. Il contient 21 collections métier exportables et une table `securitySettings` séparée, soit 22 tables au total. Les documents parlant encore de Dexie V10 ou de 20 collections doivent être corrigés pendant ce sprint.

## 2. Problème à résoudre

Une simulation Chromium ne reproduit pas complètement :

- l’installation PWA réelle sur Android et iOS ;
- les différences entre navigateur et application installée ;
- le clavier virtuel et le redimensionnement de la fenêtre ;
- les zones sûres, encoches et barres système ;
- le téléchargement, le partage et la réouverture de PDF ou JSON ;
- l’éviction éventuelle d’IndexedDB ;
- une mise à jour réelle entre deux artefacts A et B ;
- VoiceOver, NVDA et la navigation tactile réelle.

Le Sprint 11 doit produire un protocole reproductible, corriger les défauts constatés et conserver des preuves. Il ne doit pas transformer une absence de test en résultat réussi.

## 3. Objectif

Obtenir une PWA fiable sur les appareils cibles et rendre son comportement compréhensible pour l’utilisateur lors de l’installation, de la perte de réseau et d’une mise à jour.

Les objectifs mesurables sont :

- exécuter une recette physique documentée sur Android, iPhone/iPad et tablette ;
- prouver la conservation des données entre deux builds distincts ;
- corriger tout P0 ou P1 et les P2 relevant du périmètre ;
- améliorer le chargement mobile, actuellement mesuré sous la cible Lighthouse 85 ;
- sécuriser les en-têtes et le chargement du service worker ;
- mettre la documentation en cohérence avec Dexie V11 et le module Dépenses ;
- ne créer aucune régression métier, financière, hors ligne ou de sauvegarde.

## 4. Utilisateur cible

L’utilisateur travaille principalement sur smartphone, parfois avec une connexion instable. Il peut installer l’application, la fermer plusieurs heures, l’ouvrir hors ligne, produire un PDF, enregistrer une dépense ou un paiement et restaurer une sauvegarde.

L’interface doit expliquer clairement :

- si l’application est hors ligne ;
- si une nouvelle version est prête ;
- si une action exige le retour du réseau ;
- comment installer l’application sur iPhone/iPad ;
- que les données restent sur l’appareil et nécessitent des sauvegardes régulières.

## 5. Périmètre

### Inclus

- audit du manifeste, des icônes, du service worker et de son enregistrement ;
- état en ligne/hors ligne accessible et non bloquant ;
- cycle de mise à jour A vers B avec conservation d’IndexedDB ;
- stratégie de cache documentée et testée pour les routes de production ;
- traitement clair d’une navigation indisponible hors ligne ;
- tests portrait, paysage, clavier virtuel, tactile et zones sûres ;
- installation et relance depuis l’écran d’accueil ;
- PDF, partage, téléchargement, sauvegarde et restauration ;
- tests du PIN et de la persistance après fermeture complète ;
- optimisation du JavaScript initial et des écrans lents ;
- accessibilité manuelle complémentaire ;
- en-têtes de sécurité compatibles avec Next.js et la PWA ;
- correction ou remplacement du test historique centré sur `/dev-diagnostic` ;
- mise à jour de la documentation et du rapport de validation.

### Hors périmètre

- application Android native, Capacitor ou TWA ;
- backend, cloud, compte utilisateur ou synchronisation ;
- notifications Web Push nécessitant un serveur ;
- multi-utilisateur, licence ou abonnement ;
- nouveau module métier ;
- envoi WhatsApp automatique ;
- refonte graphique générale sans défaut démontré ;
- publication, commit, push, tag ou déploiement sans autorisation explicite.

## 6. Matrice d’essais

| Environnement | Mode minimal | Contrôles essentiels |
|---|---|---|
| Android / Chrome | onglet et PWA installée | installation, A→B, hors ligne, clavier, PDF, partage, sauvegarde |
| iPhone / Safari | onglet et écran d’accueil | installation guidée, zones sûres, A→B, hors ligne, PDF, partage, stockage |
| iPad ou tablette Android | portrait et paysage | navigation, tableaux, filtres, dialogues, clavier et tactile |
| Ordinateur / Chrome ou Edge | onglet et installation | cycle complet, mise à jour, téléchargement et restauration |
| Firefox | onglet | IndexedDB, parcours principal, PDF et comportement hors ligne supporté |
| NVDA ou VoiceOver | parcours principal | titres, focus, formulaires, erreurs, graphiques et écran PIN |

Une case non exécutée doit être marquée `NON EXÉCUTÉE`, avec la cause. Elle ne doit jamais être convertie en succès par inférence.

## 7. Parcours physique de référence

1. Ouvrir le build A via HTTPS et vérifier le manifeste.
2. Installer la PWA, puis l’ouvrir depuis son icône.
3. Configurer l’entreprise et créer un jeu fictif : produit, prospect, relance, conversion, facture, paiement et dépense.
4. Générer et partager ou enregistrer un PDF.
5. Exporter une sauvegarde JSON et la conserver hors de l’application.
6. Couper le réseau, fermer complètement l’application puis la rouvrir.
7. Consulter et modifier les données, créer une dépense et vérifier les statistiques hors ligne.
8. Rétablir le réseau et mettre à disposition un build B réellement différent.
9. Vérifier la détection ou l’application de la mise à jour selon la stratégie retenue.
10. Confirmer que toutes les données du build A subsistent et que Dexie a migré sans perte.
11. Restaurer la sauvegarde après validation et vérifier les relations et agrégats.
12. Refaire les formulaires critiques avec clavier virtuel, portrait et paysage.

Aucun lien WhatsApp ne doit être envoyé à un destinataire réel pendant la recette.

## 8. Mise à jour PWA attendue

Le service worker actuel utilise un cache versionné et `skipWaiting`, mais la recette existante ne compare pas deux contenus de build distincts. Le sprint doit choisir et documenter un comportement cohérent :

- le service worker ne doit pas rester bloqué par un cache HTTP obsolète ;
- les anciens caches SAMTECH doivent être supprimés sans toucher aux caches étrangers ;
- une mise à jour ne doit jamais supprimer IndexedDB ;
- l’utilisateur ne doit pas perdre une saisie en cours à cause d’un rechargement inattendu ;
- si une intervention utilisateur est nécessaire, un message accessible doit expliquer l’action ;
- le rechargement doit intervenir à un moment sûr ;
- l’application doit rester utilisable si la récupération du nouveau build échoue.

## 9. Performance

Le Sprint 10 a mesuré environ 67–68 sur les deux routes Lighthouse mobiles, avec un TBT supérieur à une seconde. Le travail doit commencer par une mesure avant modification, puis profiler les causes réelles.

Pistes autorisées après preuve :

- chargement différé de `pdf-lib`, du scanner ou d’autres bibliothèques lourdes ;
- fractionnement des composants client par route ou fonctionnalité ;
- réduction de l’hydratation du shell ;
- limitation des lectures IndexedDB et recalculs redondants ;
- pagination ou rendu progressif des listes volumineuses ;
- suppression des imports inutilisés et des préchargements sans bénéfice.

L’objectif est Performance Lighthouse mobile ≥ 85 sur le tableau de bord et Prospects, sans dégrader Accessibilité, Bonnes pratiques, SEO ou CLS. Si la cible n’est pas atteinte après corrections raisonnables, les mesures exactes et la cause doivent être publiées comme écart P2 ; aucun score ne doit être inventé.

## 10. Sécurité et fiabilité

Le sprint doit vérifier une politique d’en-têtes compatible avec le fonctionnement réel : CSP, `X-Content-Type-Options`, protection contre l’intégration en iframe, politique de référent, politique de permissions et cache spécifique de `sw.js`.

La CSP ne doit pas être ajoutée aveuglément : elle doit être testée en production, y compris le thème, les styles Next.js, le service worker, les blobs de PDF, les téléchargements et `https://wa.me/`.

L’audit des dépendances doit être exécuté si le registre est accessible. Une indisponibilité réseau doit être rapportée comme telle. Aucun `npm audit fix --force` ni mise à niveau majeure automatique n’est autorisé sans analyse des régressions.

## 11. Gravité des anomalies

- **P0 critique** : perte ou corruption de données, restauration destructive, faille exploitable majeure.
- **P1 bloquant** : installation ou parcours essentiel impossible, calcul financier erroné, mise à jour rendant l’application inutilisable, contournement normal du PIN.
- **P2 important** : forte dégradation mobile, problème de partage, accessibilité sérieuse, mise à jour confuse mais récupérable.
- **P3 mineur** : défaut visuel ou textuel sans blocage du parcours.

Tout P0/P1 doit être corrigé puis retesté sur l’environnement qui l’a révélé. Un P2 non corrigé exige une justification, une mesure compensatoire et une inscription dans `KNOWN_LIMITATIONS.md`.

## 12. Preuves attendues

Pour chaque session physique : date, appareil, modèle, OS, navigateur et version, mode onglet/installé, build ou hash, état réseau, données initiales, étapes, attendu, observé, résultat, capture éventuelle et anomalie liée.

Le rapport final doit séparer :

- les commandes réellement exécutées ;
- les tests automatisés ;
- les tests physiques réellement exécutés ;
- les tests non exécutés ;
- les corrections apportées ;
- les défauts restant ouverts ;
- la décision finale argumentée.

## 13. Décision de fin de sprint

- **SPRINT 11 VALIDÉ** : automatisation réussie, matrice physique obligatoire exécutée, aucun P0/P1 et P2 traités ou explicitement acceptés.
- **SPRINT 11 VALIDATION CONDITIONNELLE** : code et automatisation conformes, mais une partie obligatoire de la recette physique reste à réaliser.
- **SPRINT 11 NON VALIDÉ** : P0/P1 ouvert, régression de données, résultat financier incorrect ou parcours essentiel défaillant.

Une émulation ou un navigateur headless ne peut pas, à elle seule, conduire au statut `SPRINT 11 VALIDÉ`.
