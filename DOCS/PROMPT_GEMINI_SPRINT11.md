# Prompt complet pour Gemini — Sprint 11

Copiez l’intégralité du prompt ci-dessous dans Gemini.

---

Tu travailles dans le dépôt Windows suivant :

`D:\dev\samatech-crm`

Ta mission est d’implémenter et de valider le **Sprint 11 — Recette physique et correction PWA** de SAMTECH CRM.

Tu dois travailler sur l’état réel du dépôt, corriger le code et les tests, exécuter toutes les validations possibles et produire un rapport factuel. Ne rédige pas seulement des recommandations.

## 1. Règles absolues

- Lis `AGENTS.md` avant toute action.
- Lis les documents de `DOCS/` avant toute modification importante.
- Préserve tous les changements existants et commence par `git status --short`.
- Ne supprime, ne réinitialise et n’écrase aucun travail existant.
- Ne fais aucun commit, push, tag, pull request ou déploiement.
- N’ajoute aucun backend, cloud, compte, synchronisation, multi-utilisateur, licence, IA ou API WhatsApp Business.
- N’ajoute pas de notifications Web Push nécessitant un serveur.
- Garde l’architecture présentation/application/domaine/infrastructure.
- Garde les règles métier hors des composants React.
- Accède à Dexie par les dépôts et cas d’usage.
- Utilise des transactions pour les écritures multi-tables.
- Conserve la représentation monétaire exacte ; n’utilise pas de flottants ou de soustraction via `Number` pour les montants métier.
- Exécute les commandes non destructives nécessaires sans demander de confirmation interactive.
- Ne prétends jamais avoir utilisé un appareil, navigateur ou lecteur d’écran que tu n’as pas réellement contrôlé.

## 2. Documents obligatoires

Lis complètement au minimum :

- `DOCS/SPRINT11_ANALYSE.md`
- `DOCS/SPRINT11_CAHIER_DES_CHARGES.md`
- `DOCS/SPRINT10_VALIDATION_REPORT.md`
- `DOCS/KNOWN_LIMITATIONS.md`
- `DOCS/RELEASE_CHECKLIST.md`
- `DOCS/PILOT_TEST_PLAN.md`
- `DOCS/OFFLINE_FIRST.md`
- `DOCS/TESTING.md`
- `DOCS/SECURITY.md`
- `DOCS/UI_UX.md`
- `DOCS/ARCHITECTURE.md`
- `DOCS/DATABASE.md`
- `DOCS/DEPENSES_CAHIER_DES_CHARGES.md`

Cette version de Next.js possède des changements incompatibles avec des connaissances générales. Avant de modifier Next.js, lis complètement :

- `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md`
- `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`
- `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/headers.md`

## 3. État de référence à vérifier

Ne fais confiance à aucune valeur sans la vérifier dans le code. L’état attendu au moment de la rédaction est :

- Next.js 16.2.10 et React 19.2.4 ;
- PWA locale et hors ligne ;
- Dexie V11 ;
- 21 collections métier exportables, dont `expenses` ;
- `securitySettings` séparée, soit 22 tables au total ;
- format de sauvegarde actuellement version 1 ;
- manifeste statique dans `public/manifest.json` ;
- service worker généré depuis `src/sw-template.js` ;
- `skipWaiting` et stratégie cache-first actuellement présents ;
- `/dev-diagnostic` actuellement inclus dans le précache ;
- aucun en-tête de sécurité explicite dans `next.config.ts` ;
- Lighthouse mobile historique autour de 68/67 avec TBT supérieur à une seconde ;
- plusieurs documents encore datés de Dexie V10 et 20 collections.

Si le dépôt diffère, documente l’écart et utilise l’état réel.

## 4. Audit initial obligatoire

Avant de modifier le code :

1. relève l’état Git ;
2. inventorie les routes, tables, collections de sauvegarde, scripts et tests ;
3. inspecte manifeste, icônes, layout, métadonnées, service worker et mécanisme d’enregistrement ;
4. inspecte le cycle de mise à jour et la stratégie hors ligne ;
5. mesure le build, le bundle et Lighthouse avant correction ;
6. identifie les imports lourds et l’hydratation inutile avec des preuves ;
7. inspecte les en-têtes HTTP réels du build de production ;
8. vérifie que les dépenses sont présentes dans statistiques, sauvegarde et recette E2E ;
9. dresse la liste des écarts par gravité P0 à P3.

Conserve les résultats avant/après dans le rapport final.

## 5. Travaux à réaliser

### A. Installation et manifeste

- Valide `name`, `short_name`, `id`, `start_url`, `scope`, `display`, couleurs et icônes.
- Vérifie la qualité et les dimensions réelles des PNG.
- Ajoute seulement les champs ou variantes d’icônes réellement utiles et testables.
- Si tu ajoutes une aide à l’installation, rends-la non intrusive, accessible et correcte sur iOS.
- Ne prétends pas pouvoir déclencher automatiquement l’installation sur Safari iOS.

### B. État en ligne et hors ligne

- Ajoute ou fiabilise un indicateur accessible lors de la perte et du retour du réseau.
- N’empêche pas les opérations locales disponibles hors ligne.
- Explique clairement les rares actions qui exigent le réseau.
- Ajoute les tests de transition `online`/`offline` et de nom accessible.

### C. Service worker et navigation hors ligne

- Remplace la stratégie cache-first globale par une politique explicite et justifiée selon le type de ressource si l’audit confirme le risque.
- Ne mets pas en cache les réponses en erreur.
- Ne confonds jamais cache HTTP et données IndexedDB.
- Évite de précacher `/dev-diagnostic` si cette route de développement n’a pas de justification en production.
- Gère une navigation hors ligne indisponible avec une réponse explicite ; ne renvoie pas silencieusement `/` comme si c’était la route demandée.
- Supprime uniquement les anciens caches nommés SAMTECH CRM.
- Rattache correctement les écritures asynchrones de cache à la durée de vie des événements.
- Conserve le fonctionnement des routes dynamiques déjà couvertes.

### D. Cycle de mise à jour

- Configure l’enregistrement de `sw.js` pour éviter qu’un cache HTTP obsolète bloque la mise à jour.
- Conçois un cycle sûr pour un worker en attente ou activé.
- Ne recharge jamais brutalement une saisie en cours.
- Si une nouvelle version nécessite une action, affiche un message accessible avec une action explicite.
- Empêche les boucles de rechargement.
- Ajoute un vrai protocole automatisé A→B utilisant deux contenus ou artefacts distincts, dans la limite de l’environnement.
- Prouve que les données IndexedDB et le PIN ne sont pas supprimés.
- Le test physique A→B reste obligatoire pour la validation finale.

### E. Performances

- Profile avant d’optimiser.
- Cible prioritairement `/` et `/prospects`.
- Charge dynamiquement les bibliothèques lourdes uniquement lorsqu’elles sont nécessaires, notamment PDF ou scanner si le profil le confirme.
- Réduis l’hydratation, les lectures Dexie et les recalculs redondants lorsque cela est démontré.
- N’affaiblis aucun test fonctionnel pour gagner un score.
- Mesure après correction dans le même protocole.
- Objectif : Lighthouse Performance ≥ 85 sur les deux routes, Accessibilité ≥ 98, Bonnes pratiques 100 et CLS ≤ 0,1.
- Si 85 n’est pas atteint, publie le score exact et la cause ; n’invente pas la réussite.

### F. Sécurité HTTP

- Ajoute des en-têtes compatibles avec Next.js et la PWA après avoir lu la documentation locale.
- Couvre au minimum `X-Content-Type-Options`, framing, référent et permissions.
- Définis une CSP compatible avec les ressources réellement utilisées, `wa.me`, les styles, le thème et les blobs/téléchargements PDF.
- Définis pour `sw.js` un type JavaScript et une politique de cache adaptée à sa mise à jour.
- Teste les en-têtes sur le serveur de production, pas seulement leur présence dans le fichier de configuration.

### G. Mobile, fichiers et accessibilité

- Étends les scripts responsive aux états avec dialogues, champs bas de page et clavier simulé lorsque pertinent.
- Vérifie les zones sûres, la navigation du bas, les tableaux, les feuilles et les boutons tactiles.
- Teste génération PDF, export JSON et restauration dans l’environnement disponible.
- Prépare une checklist précise pour Android, iPhone/iPad et tablette.
- Exécute NVDA, VoiceOver ou appareils uniquement s’ils sont réellement disponibles.
- Marque chaque environnement indisponible `NON EXÉCUTÉ`.

### H. Recette métier et dépenses

Le parcours transversal doit désormais inclure :

1. configuration ;
2. produit ;
3. prospect et relance ;
4. conversion en client ;
5. facture et PDF ;
6. deux paiements partiels puis paiement final ;
7. dépense active ;
8. dépense annulée exclue des totaux ;
9. flux net exact ;
10. campagne assistée sans envoi réel ;
11. sauvegarde des 21 collections ;
12. restauration et vérification des agrégats ;
13. fermeture, réouverture et hors ligne.

Utilise des données fictives. Ne suis aucun lien WhatsApp pendant l’automatisation.

### I. Dette de tests et documentation

- Réécris ou archive proprement `scripts/e2e-browser-test.js` s’il dépend encore de `/dev-diagnostic` comme critère PWA.
- Mets à jour tous les comptes de tables, versions Dexie et périmètres obsolètes.
- Mets à jour README, guide utilisateur, checklist, plan pilote, limites, notes de version et documents techniques concernés.
- Ajoute `DOCS/SPRINT11_VALIDATION_REPORT.md`.

## 6. Recette physique obligatoire

Si tu contrôles réellement les appareils, exécute et documente :

- Android/Chrome en onglet et PWA installée ;
- iPhone ou iPad/Safari en onglet et écran d’accueil ;
- tablette en portrait et paysage ;
- installation, fermeture complète, redémarrage hors ligne ;
- clavier virtuel, retour système, zones sûres et tactile ;
- PDF, partage, sauvegarde et restauration ;
- cycle A→B avec deux artefacts distincts ;
- conservation de toutes les données et du PIN.

Pour chaque session, consigne : date, modèle, OS, navigateur/version, mode, build/hash, réseau, étapes, attendu, observé, capture ou journal et défaut lié.

Si tu ne contrôles pas ces appareils, ne simule pas les résultats. Prépare le protocole et conclus au maximum `SPRINT 11 VALIDATION CONDITIONNELLE`.

## 7. Tests obligatoires

Ajoute ou adapte des tests pour :

- manifeste et icônes ;
- en-têtes globaux et `sw.js` ;
- bannière réseau ;
- cycle service worker sans rechargement en boucle ;
- navigation hors ligne indisponible ;
- suppression sélective des caches ;
- vrai scénario A→B automatisable ;
- persistance IndexedDB ;
- dépenses dans statistiques, E2E et sauvegarde ;
- responsive et accessibilité des nouveaux états ;
- non-régression des calculs et restaurations.

Ne supprime pas une assertion utile pour faire passer la suite. Corrige la cause ou documente le blocage.

## 8. Commandes finales

Exécute dans cet ordre et rapporte code, durée, succès, échec et avertissements :

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
npm.cmd audit --json
```

Relance les contrôles affectés après toute correction tardive. Si `npm audit` ne peut joindre le registre, publie l’erreur exacte et ne présente pas `--offline` comme autoritatif. N’utilise pas `npm audit fix --force`.

## 9. Rapport final obligatoire

Crée `DOCS/SPRINT11_VALIDATION_REPORT.md` avec :

1. résumé et verdict ;
2. état initial et état final du dépôt ;
3. fichiers modifiés ;
4. corrections et raisons ;
5. tableau avant/après des performances ;
6. résultats exacts de chaque commande ;
7. résultat du cycle A→B ;
8. matrice des tests physiques exécutés ;
9. tests explicitement non exécutés ;
10. preuves de persistance et de calcul financier ;
11. anomalies P0 à P3 restantes ;
12. documentation mise à jour ;
13. état Git final ;
14. décision finale.

Utilise exactement l’un des verdicts suivants :

- `SPRINT 11 VALIDÉ` seulement si automatisation et recette physique obligatoire sont réellement réussies ;
- `SPRINT 11 VALIDATION CONDITIONNELLE` si le code est conforme mais que des tests physiques obligatoires restent non exécutés ;
- `SPRINT 11 NON VALIDÉ` si un P0/P1 ou une régression essentielle reste ouvert.

Ne masque aucune limite et ne confonds jamais émulation avec appareil physique.

Commence maintenant par l’audit factuel du dépôt, puis implémente, teste, corrige et rédige le rapport.

---
