# Rapport final de validation — Sprint 10 : Stabilisation et préparation de la V1 bêta

Date de l’audit final : 18 juillet 2026. Dépôt : `D:\dev\samatech-crm`. Environnement : Windows, fuseau Africa/Dakar, Node.js local, Next.js 16.2.10, build de production et Chromium/Chrome headless.

## 1. Résumé et décision

Décision : la V1 bêta peut entrer dans un pilote limité et supervisé. Toutes les commandes applicatives obligatoires réussissent, les 239 tests exécutés réussissent, les calculs financiers de référence sont exacts, les E2E Sprint 2 à 9 et le parcours transversal réussissent, et aucun P0/P1 n’est ouvert.

Les écarts non bloquants sont publiés : Lighthouse Performance sous l’objectif 85, audit npm distant indisponible, ancien script PWA centré sur une route de diagnostic obsolète en échec, et essais physiques/lecteur d’écran encore à réaliser. Aucune publication publique, aucun commit, push, tag ou déploiement n’a été effectué.

### CORRECTIONS REQUISES AVANT VALIDATION

L’état initial du Sprint 10 comportait 6 règles axe critiques et 7 sérieuses, un débordement réel des filtres Prospects sur mobile, des contrôles non nommés ou non étiquetés, des contrastes insuffisants et une recette globale recherchant à tort un prospect déjà converti. Les corrections sont restées dans le périmètre de stabilisation : titres et récupération d’erreur, lien d’évitement, focus, labels, contrastes, zones tactiles, grille responsive et correction des données/parcours de test. Tous les contrôles concernés ont été intégralement rejoués ; les résultats finaux sont ceux du présent rapport.

Défauts bloquants finaux : aucun. Statut : bêta techniquement prête pour un pilote supervisé, sous réserve de suivre la checklist physique.

## 2. État réel du dépôt

- Version initiale relevée au début des travaux Sprint 10 : `0.1.0`. Version finale dans `package.json` et affichée dans le shell : `1.0.0-beta.1`.
- Dexie : V10. Tables : 21 au total, dont 20 métier exportables et `securitySettings` séparée.
- Tables : `contacts`, `prospectProfiles`, `settings`, `sequences`, `locations`, `categories`, `products`, `prospectInterests`, `followUps`, `messageTemplates`, `timelineEvents`, `clientProfiles`, `tags`, `contactTags`, `notes`, `invoices`, `invoiceLines`, `payments`, `campaigns`, `campaignRecipients`, `securitySettings`.
- Routes : 28 fichiers `page.tsx`; le rapport de build contient 29 entrées en incluant `/_not-found`, dont 21 pages générées lors du build.
- Modules : 13 — backup, campaigns, catalog, clients, follow-ups, invoices, locations, messages, payments, prospects, security, settings, statistics.
- Tests : 44 fichiers; 240 cas inventoriés, 239 réussis et 1 ignoré.
- E2E : 11 scripts — deux historiques, Sprint 2 à 9 et la recette V1 bêta. Aucun script nommé Sprint 0 ou Sprint 1 n’existe.
- Dépendances directes Sprint 10 : `axe-core@4.12.1` et `lighthouse@13.4.0`, uniquement en développement.
- Git final : arbre volontairement non commité, 40 entrées de statut (8 fichiers suivis modifiés et 32 groupes non suivis représentant 242 fichiers). L’arbre était déjà sale avant cet audit; aucun changement existant n’a été annulé.
- Documents Sprint 10 : les cinq documents obligatoires sont présents, ainsi que le présent rapport.

## 3. Résultats exacts des commandes

| Commande | Code | Durée | Suites / contrôles | Réussites | Échecs | Ignorés | Avertissements utiles |
|---|---:|---:|---:|---:|---:|---:|---|
| `npm.cmd run lint` | 0 | 28,492 s | — | — | 0 | — | aucun |
| `npx.cmd tsc --noEmit` | 0 | 8,732 s | — | — | 0 | — | aucun |
| `npm.cmd test -- --run` | 0 | 53,88 s | 44 fichiers / 240 tests | 239 | 0 | 1 | aucun |
| `npm.cmd run build` | 0 | ≈46,5 s mur | 21 pages générées | 21 | 0 | — | aucun; SW : 51 fichiers, hash `bf152d49` |
| `npm.cmd run test:pwa` | 0 | 3,649 s | manifeste + SW | succès | 0 | — | aucun |
| `npm.cmd run test:accessibility` | 0 | 57,599 s | 24 écrans + 4 focus | 24 | 0 | — | 0 violation finale |
| `npm.cmd run test:responsive` | 0 | 113,059 s | 85 contrôles | 85 | 0 | — | aucun débordement |
| `npm.cmd run test:performance` | 0 | ≈129,1 s mur | 16 scénarios × 5 | 80 mesures | 0 | — | seuil Lighthouse traité séparément |
| `npm.cmd run test:lighthouse` | 0 | 41,524 s | 2 routes | 2 audits | 0 | — | performance sous cible |
| `npm.cmd run test:pwa-update` | 0 | 17,909 s interne | 4 assertions | 4 | 0 | — | aucun |
| `npm.cmd run test:v1-beta` | 0 | 24,389 s | 40 étapes / 41 assertions | 41 | 0 | — | 2 coupures hors ligne attendues; 12 RSC annulées |
| `node scripts/e2e-v1-beta-test.js` | 0 | 25,282 s | 40 étapes / 41 assertions | 41 | 0 | — | 12 RSC annulées |
| même E2E avec Chrome système | 0 | 23,156 s | 40 étapes / 41 assertions | 41 | 0 | — | 12 RSC annulées |
| `npm.cmd audit --json` | 1 | 8,96 s | service npm | 0 | 1 infrastructure | — | registre inaccessible; relance externe refusée par politique |
| `npm.cmd audit --offline --json` | 0 | 5,015 s | cache local | 0 alerte en cache | 0 | — | résultat non autoritatif sans données d’avis à jour |

Lors de l’installation des dépendances, npm a annoncé 19 vulnérabilités modérées et aucune haute/critique. Le détail package/chemin/correctif n’a pas pu être obtenu sans transmettre le graphe au registre; il n’est donc pas inventé.

Historique E2E pertinent : Sprint 2, 39 assertions; Sprint 3, 26 scénarios; Sprint 4, 28; Sprint 5, 38; Sprint 6, 42; Sprint 7, 45; Sprint 8, 33; Sprint 9, 36 — tous code 0. L’ancien `e2e-prospects-test.js` réussit. L’ancien `e2e-browser-test.js` échoue sur `/dev-diagnostic` hors ligne avec « Accès refusé »; cette route de développement n’est pas un parcours métier et sa couverture PWA est remplacée par trois recettes de production réussies.

## 4. Audit fonctionnel

| Périmètre | Preuve finale | Résultat |
|---|---|---|
| Navigation, tableau de bord, statistiques | build, axe, responsive, Sprint 8, E2E global | conforme |
| Paramètres, localités, catalogue | Sprint 2 et tests unitaires | conforme |
| Prospects, recherche, filtres, archivage | anciens E2E Prospects, Sprint 2/4, global | conforme |
| Conversion, clients, chronologie | Sprint 4 et global | identité conservée, conforme |
| Relances et modèles WhatsApp | Sprint 3; lien inspecté sans être suivi | conforme |
| Campagnes assistées | Sprint 7; aucun lien WhatsApp suivi | conforme |
| Factures et PDF | Sprint 5/6 et global | conforme en ligne/hors ligne |
| Paiements partiels et créances | Sprint 6, tests financiers et global | conforme |
| Sauvegarde/restauration | Sprint 9, global et charge volumique | conforme et transactionnel |
| PIN/verrouillage | tests sécurité, Sprint 9 et global | conforme aux limites locales documentées |
| PWA/hors connexion | test PWA, mise à jour et E2E Sprint 3–9/global | parcours essentiels conformes |

Le parcours Prospect → produit → qualification → relance → modèle → conversion → facture → PDF → paiement partiel → créance → paiement final → chronologie → statistiques → campagne → sauvegarde → restauration est couvert par la combinaison des recettes spécialisées et les 41 assertions transversales. Les données fictives `SENCAIILLE`, `+221 77 648 17 82` et `Quartier Mbambara Thiès` sont utilisées; aucun message réel n’a été envoyé.

## 5. Calculs financiers

| Cas | Attendu | Observé | Résultat |
|---|---|---|---|
| 2,50 × 10 000; remise 10 %; taxe 18 % | brut 25 000; remise 2 500; taxe 4 050; ligne 26 550 | identique | réussi |
| 2 × 5 000; remise fixe 1 000 | brut 10 000; ligne 9 000 | identique | réussi |
| Totaux des deux lignes | sous-total 31 500; remises 3 500; taxes 4 050; total 35 550 | identique | réussi |
| Paiement partiel 10 000 | payé 10 000; solde 25 550; partiellement payée | identique | réussi |
| Deux actifs 10 000 + 5 550 et renversé 2 000 | payé 15 550; solde 20 000 | identique; renversé exclu | réussi |
| Paiement final 20 000 après 15 550 | payé 35 550; solde 0; payée | identique | réussi |
| Trop-perçu 35 551 | rejet | exception attendue | réussi |

Les suites Sprint 5, 6 et 8 couvrent aussi annulation, séquence/absence de doublon, chiffre d’affaires, encaissé, créances, périodes et exclusion des factures annulées. Aucun défaut financier P1 n’est observé.

## 6. Accessibilité

- Outil : axe-core 4.12.1, 69 règles correspondant aux tags WCAG 2 A/AA, 2.1 AA et 2.2 AA.
- Portée : 23 routes importantes plus l’écran verrouillé, soit 24 écrans. Aucune exclusion globale; seules les violations sont collectées et toutes les critiques/sérieuses sont bloquantes.
- Initial : 6 règles critiques et 7 sérieuses relevées. Final : 0 violation totale, 0 critique, 0 sérieuse.
- Contrôles automatisés supplémentaires : premier Tab vers le lien d’évitement, activation vers le contenu principal, focus initial PIN, focus de la phrase destructive.
- Structure : `lang="fr"`, titres par route, labels et noms accessibles vérifiés; focus visible et `prefers-reduced-motion` définis globalement.
- Restent manuels : parcours intégral au lecteur d’écran, zoom 200 %, pièges/focus de tous les dialogues et contrôle tactile réel. Ils ne sont pas déclarés réussis sans appareil.

## 7. Responsive

| Largeur | Routes | Débordements essentiels | Éléments coupés détectés | Résultat |
|---:|---:|---:|---:|---|
| 320 px | 14 | 0 | 0 | réussi |
| 360 px | 14 | 0 | 0 | réussi |
| 390 px | 14 | 0 | 0 | réussi |
| 768 px | 14 | 0 | 0 | réussi |
| 1024 px | 14 | 0 | 0 | réussi |
| 1440 px | 14 | 0 | 0 | réussi |
| 844 × 390 paysage | écran sécurité | 0 | 0 | réussi |

Les conteneurs ayant un défilement horizontal intentionnel, notamment navigation et tableaux, sont exclus uniquement de la détection d’élément coupé; le débordement du document reste toujours bloquant. Les chevauchements visuels fins, zones sûres iOS et clavier virtuel restent à contrôler physiquement.

## 8. Performances

Jeu déterministe : 1 000 prospects/contacts/intérêts, 200 clients, 100 produits, 600 notes, 600 événements concentrés en une chronologie longue de 1 200 éléments, 500 relances, 200 factures, 600 lignes, 180 paiements, 20 campagnes et 400 destinataires. Build de production, Chromium headless, viewport mobile 390 × 844, cinq exécutions par mesure.

| Mesure (ms) | Min | Médiane | Moyenne | Max |
|---|---:|---:|---:|---:|
| Démarrage | 1 005,3 | 1 042,3 | 1 389,8 | 2 488,6 |
| Ouverture/écriture IndexedDB et seed | 1 909,8 | 1 995,5 | 1 989,8 | 2 046,8 |
| Tableau de bord | 1 003,7 | 1 015,3 | 1 018,6 | 1 043,8 |
| Prospects | 2 052,9 | 2 059,5 | 2 061,4 | 2 073,2 |
| Chronologie longue 1 200 éléments | 1 664,4 | 2 048,8 | 1 928,7 | 2 080,9 |
| Relances | 1 974,9 | 2 073,1 | 2 077,4 | 2 193,3 |
| Factures | 1 114,1 | 1 160,8 | 1 356,2 | 2 075,7 |
| Statistiques | 1 003,7 | 1 005,5 | 1 006,6 | 1 013,3 |
| Campagne | 1 001,7 | 1 007,1 | 1 006,4 | 1 009,9 |
| Recherche | 163,7 | 169,9 | 208,0 | 274,9 |
| Filtres combinés | 192,0 | 232,8 | 242,1 | 289,2 |
| Export sauvegarde | 632,5 | 636,5 | 641,1 | 659,5 |
| Validation sauvegarde | 162,7 | 183,6 | 186,4 | 219,9 |
| Restauration | 2 356,1 | 2 434,2 | 2 416,7 | 2 470,4 |
| Génération PDF | 126,3 | 127,2 | 127,3 | 128,3 |

Bundle statique total : 2 537 103 octets; plus gros chunk : 441 297 octets.

Dernier Lighthouse : tableau de bord Performance 68, Accessibilité 100, Bonnes pratiques 100, SEO 100, FCP 787 ms, LCP 3 492 ms, TBT 1 094 ms, CLS 0. Prospects : Performance 67, Accessibilité 98, Bonnes pratiques 100, SEO 100, FCP 780 ms, LCP 3 519 ms, TBT 1 186 ms, CLS 0. Un passage précédent du même build avait donné 76/68 en performance, montrant une variabilité de la simulation. Les objectifs accessibilité, bonnes pratiques et CLS sont atteints; Performance ≥85 est manquée et classée P2, sans panne fonctionnelle ni régression de données.

## 9. PWA et hors connexion

Le manifeste contient `id`, `start_url` et `scope` à `/`, `display: standalone`, quatre icônes PNG/SVG. Le service worker installe, précache 51 ressources statiques, appelle `skipWaiting`, revendique les clients, supprime les anciens caches nommés et sert le cache hors ligne.

`test:pwa-update` réussit 4 assertions : scope, enregistrement/mise à jour, conservation du contact IndexedDB et rechargement de Prospects hors ligne. Les E2E spécialisés couvrent route visitée, routes métier précachées/préchargées, consultation/écriture IndexedDB, facture, paiement, PDF, export, validation/restauration, verrouillage/déverrouillage et fermeture/réouverture hors ligne. Les échecs réseau après coupure sont comptés séparément.

Limite factuelle : la recette de mise à jour réenregistre `sw.js` avec une URL de version différente mais le même contenu de build; un cycle réel entre deux artefacts distincts reste à confirmer pendant la recette physique.

## 10. Sauvegarde, restauration et PIN

Les 20 tables métier sont exportées en JSON UTF-8 format 1 avec SHA-256; `securitySettings` et le PIN sont exclus. Sensibilité et absence de chiffrement sont affichées. Format vide/JSON invalide, version future, checksum altéré, collection manquante, doublon, référence orpheline, montant négatif et clés de pollution de prototype sont rejetés.

La restauration valide en mémoire puis remplace les 20 tables dans une transaction; un défaut injecté prouve le rollback. Les relations, statistiques et agrégats sont conservés après restauration, y compris hors ligne.

Le PIN 4–6 chiffres est dérivé PBKDF2-SHA-256, 210 000 itérations, sel aléatoire, jamais stocké en clair. Mauvais PIN, délais progressifs, bon PIN, verrouillage manuel/inactivité/rechargement, changement, désactivation et phrase destructive sont testés. La restauration ne remplace pas `securitySettings`; l’ancien PIN n’est donc pas restauré. Le PIN masque l’interface mais ne chiffre pas IndexedDB.

## 11. Sécurité et dépendances

React rend les noms, notes, modèles et campagnes comme texte; aucun `dangerouslySetInnerHTML`, `eval` ou `new Function` n’est présent. Les essais conservent `<script>` comme texte inerte. Les sauvegardes rejettent `__proto__`, `constructor` et `prototype`. Les téléphones sont réduits aux chiffres, les messages WhatsApp sont encodés par `encodeURIComponent`, et aucun message n’est envoyé automatiquement.

Aucun secret serveur, PIN, télémétrie ou ressource métier distante n’est trouvé dans `src`; les seules URL externes applicatives sont les liens `https://wa.me/`. Les données sensibles ne sont pas placées dans les routes. `SecurityGate` ne rend pas le shell lorsqu’il est verrouillé. Les erreurs globales n’affichent pas de pile.

Dépendances : l’audit distant a échoué avant de fournir package, chemin et correctif. L’installation npm avait indiqué 19 modérées, 0 haute et 0 critique; l’audit hors ligne retourne 0 uniquement faute d’avis à jour en cache. Exploitabilité individuelle : NON ÉVALUABLE dans cet environnement. Décision : pas de haute/critique signalée, donc pas de blocage du pilote supervisé; audit autorisé obligatoire avant élargissement. L’absence de politique CSP explicite dans `next.config.ts` reste un durcissement P2.

## 12. Compatibilité

| Environnement | Type de test | Résultat | Limite |
|---|---|---|---|
| Chromium fourni par Puppeteer | headless, production, E2E/a11y/responsive/perf/PWA | réussi | pas un appareil physique |
| Google Chrome installé | headless, E2E global 41 assertions | réussi | installation PWA réelle non testée |
| Microsoft Edge installé | headless, ancien E2E Prospects | réussi | ancien E2E PWA échoue sur route dev uniquement |
| Firefox | disponibilité contrôlée | NON EXÉCUTÉE | binaire absent |
| WebKit/Safari | disponibilité contrôlée | NON EXÉCUTÉE | moteur absent sous Windows |
| Android Chrome | recette physique | À réaliser sur appareil physique | checklist ouverte |
| iPhone/iPad Safari | recette physique | À réaliser sur appareil physique | checklist ouverte |
| Tablette | recette physique | À réaliser sur appareil physique | checklist ouverte |

## 13. E2E global

Résultat final npm : 40 étapes, 41 assertions, 24 389 ms. Exécution directe : 25 282 ms. Chrome système : 23 156 ms. Sur la dernière exécution directe : erreurs console 0, avertissements 0, exceptions 0, erreurs HTTP 0, échecs réseau en ligne 0, échecs réseau attendus hors ligne 0, requêtes RSC annulées 12, violations critiques/sérieuses 0, débordements horizontaux 0. L’exécution npm a compté 2 coupures réseau hors ligne attendues. Résultat : réussi.

Le premier essai avait expiré parce qu’il recherchait un contact converti dans la liste Prospects, laquelle exclut correctement les convertis. La recette a été corrigée pour rechercher ce contact dans Clients; aucun code métier n’a été assoupli.

## 14. Documentation

Présents et cohérents : `USER_GUIDE.md` (46 lignes), `PILOT_TEST_PLAN.md` (37), `RELEASE_CHECKLIST.md` (45), `KNOWN_LIMITATIONS.md` (14), `RELEASE_NOTES_BETA.md` (17), README, CHANGELOG et les documents d’architecture, base, règles, offline, sécurité, UI/UX et tests.

La documentation mentionne la version, installation PWA, mode hors ligne, sauvegarde/restauration, PIN oublié, paiements partiels, campagnes assistées, limites iOS, absence de cloud/synchronisation, sauvegardes non chiffrées, PIN ne chiffrant pas IndexedDB et absence de confirmation automatique WhatsApp. Aucune fonction absente n’est revendiquée.

## 15. Défauts constatés

| ID | Gravité | Module | Preuve | Impact | Correction |
|---|---|---|---|---|---|
| PERF-01 | P2 important | shell/Prospects | Lighthouse 68/67, TBT 1 094/1 186 ms | chargement mobile simulé sous cible | fractionner/retarder le JavaScript et profiler l’hydratation |
| SEC-01 | P2 important | dépendances | audit distant refusé; npm install : 19 modérées | détail et exploitabilité non établis | exécuter l’audit dans un environnement autorisé et traiter chaque avis |
| SEC-02 | P2 important | en-têtes | aucune CSP explicite dans `next.config.ts` | défense XSS en profondeur incomplète | définir et tester une CSP compatible Next/PWA |
| PWA-01 | P2 important | mise à jour | même contenu SW réenregistré sous URL versionnée | cycle réel de deux builds non reproduit | recette A→B sur appareils et artefacts distincts |
| E2E-LEG-01 | P3 mineur | ancien script PWA | `/dev-diagnostic` hors ligne : « Accès refusé » | bruit CI si lancé sans distinction | archiver ou réécrire le script autour des routes de production |
| QA-01 | P3 mineur | compatibilité | Firefox/WebKit/appareils/lecteur d’écran non disponibles | couverture réelle incomplète | exécuter la checklist physique avant pilote élargi |

Aucun P0/P1, aucune perte/corruption, erreur financière, migration destructive, restauration partielle, contournement normal du verrouillage, violation axe critique/sérieuse ou panne essentielle à 320/390 px n’est constaté.

## 16. Vérifications manuelles restantes

- [ ] Android/Chrome physique : installation, mise à jour A→B, portrait/paysage, clavier virtuel, PDF, hors ligne et persistance.
- [ ] iPhone/iPad Safari physique : ajout à l’écran d’accueil, zones sûres, quotas/éviction, partage PDF, hors ligne et restauration.
- [ ] Tablette physique : orientation, tableaux, filtres, dialogues et tactile.
- [ ] Lecteur d’écran NVDA ou VoiceOver : titres, formulaires, erreurs, graphiques et écran PIN.
- [ ] Zoom 200 %, contraste en conditions réelles, absence de piège clavier et focus de chaque dialogue.
- [ ] Audit npm en ligne autorisé et revue des 19 alertes modérées annoncées.

## 17. Décision finale

Les critères bloquants automatisables sont satisfaits. Les P2 sont documentés, sans erreur métier, financière, de données, d’accessibilité sérieuse ou de fonctionnement essentiel. Le pilote doit rester limité et suivre `RELEASE_CHECKLIST.md`; son élargissement reste conditionné aux essais physiques et à la revue des dépendances.

V1 BÊTA PRÊTE POUR PILOTE
