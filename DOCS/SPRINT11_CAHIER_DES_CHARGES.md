# Cahier des charges — Sprint 11

## Recette physique et correction PWA

## 1. Objet

Fiabiliser SAMTECH CRM comme PWA installable et hors ligne sur ses appareils cibles, corriger les défauts observés, améliorer les performances mobiles et établir une validation factuelle fondée sur des preuves automatisées et physiques.

## 2. Contraintes structurantes

- Conserver Next.js 16, React 19, TypeScript, Dexie et l’architecture existante.
- Lire les guides locaux pertinents dans `node_modules/next/dist/docs/` avant toute modification Next.js.
- Garder les règles métier hors des composants React.
- Accéder à Dexie par les dépôts et cas d’usage existants.
- Préserver les montants exacts et les transactions multi-tables.
- Préserver les données V1 à V11 et les sauvegardes compatibles.
- Maintenir le fonctionnement local et hors ligne.
- Ne pas ajouter de backend, cloud, multi-utilisateur, licence, IA ou API WhatsApp Business.
- Ne pas ajouter de Web Push dépendant d’un serveur.
- Préserver les changements existants.
- Ne faire aucun commit, push, tag ou déploiement sans autorisation.
- Ne jamais déclarer un test physique réussi sans exécution et preuve réelles.

## 3. Référentiel initial

Le travail commence par un audit factuel de :

- `package.json` et des versions réellement installées ;
- `public/manifest.json`, icônes et métadonnées du layout ;
- `src/sw-template.js`, `scripts/build-sw.js`, `public/sw.js` et `PWARegister` ;
- scripts PWA, Lighthouse, responsive, accessibilité, performance et E2E ;
- Dexie V11, collection `expenses` et migrations ;
- format de sauvegarde et liste réelle des collections ;
- `next.config.ts` et en-têtes HTTP ;
- documentation de livraison et limites connues ;
- état Git avant toute modification.

Les valeurs du Sprint 10 sont une base de comparaison, pas un résultat du Sprint 11.

## 4. Exigences fonctionnelles

### S11-F01 — Installation

L’application doit disposer d’un manifeste valide, d’icônes utilisables et d’un affichage autonome cohérent. Le protocole doit tester l’installation Android et l’ajout à l’écran d’accueil iOS.

Si une aide à l’installation est ajoutée, elle doit :

- reconnaître le mode autonome ;
- ne pas harceler l’utilisateur ;
- fournir des instructions spécifiques à iOS sans prétendre déclencher une API inexistante ;
- rester utilisable au clavier et avec un lecteur d’écran.

### S11-F02 — État réseau

L’application doit indiquer de façon accessible le passage hors ligne et le retour en ligne, sans masquer le contenu ni empêcher les écritures locales disponibles.

Une action réellement dépendante du réseau doit expliquer pourquoi elle est indisponible. Une action locale ne doit pas être désactivée uniquement parce que le réseau est coupé.

### S11-F03 — Mise à jour

Deux builds distincts A et B doivent être produits avec une différence vérifiable. Le passage A→B doit conserver IndexedDB, le PIN local, les relations, les dépenses et les agrégats financiers.

Le mécanisme de mise à jour doit :

- récupérer `sw.js` sans cache HTTP obsolète ;
- ne pas recharger pendant une saisie non sauvegardée ;
- présenter une action explicite si un rechargement est nécessaire ;
- éviter les boucles de rechargement ;
- supprimer uniquement les anciens caches appartenant à SAMTECH CRM ;
- retomber proprement sur la version fonctionnelle en cas d’échec réseau.

### S11-F04 — Navigation hors ligne

Après une première ouverture en ligne, toutes les routes de production déclarées essentielles doivent être accessibles hors ligne selon une politique documentée.

Une route non disponible ne doit pas afficher silencieusement le tableau de bord comme si elle correspondait à la demande. Une réponse ou vue hors ligne explicite doit être utilisée lorsque la route demandée ne peut pas être servie correctement.

La route de développement `/dev-diagnostic` ne doit pas conditionner la conformité de production ni être préchargée sans justification.

### S11-F05 — Persistance

Les données suivantes doivent survivre à un rechargement, une fermeture complète, une ouverture hors ligne et une mise à jour A→B :

- paramètres et catalogue ;
- prospect, relance, conversion et chronologie ;
- facture, paiements et créances ;
- dépense active et dépense annulée ;
- campagne assistée ;
- PIN et état de verrouillage selon les règles existantes.

### S11-F06 — Fichiers

Sur chaque appareil applicable, vérifier :

- génération et ouverture du PDF ;
- téléchargement ou partage proposé par le système ;
- export JSON ;
- déplacement ou conservation du fichier hors de l’application ;
- sélection, validation et restauration du fichier ;
- comportement hors ligne.

Les différences de plateforme doivent être documentées dans le guide utilisateur.

### S11-F07 — Mobile réel

À 320 px et sur appareils physiques : aucun contenu essentiel ne doit être inaccessible. Tester portrait, paysage, clavier virtuel, encoches, zones sûres, retour système, défilement, tableaux, feuilles, dialogues et boutons tactiles.

Les boutons essentiels doivent conserver une cible tactile adéquate et le champ actif ne doit pas être masqué durablement par le clavier.

### S11-F08 — Accessibilité manuelle

Le parcours principal doit être testé avec NVDA ou VoiceOver. Vérifier titres, ordre de focus, libellés, annonces d’erreur, dialogues, graphique accessible, bannière réseau, notification de mise à jour et écran PIN.

Le zoom 200 %, le contraste réel et `prefers-reduced-motion` doivent rester fonctionnels.

### S11-F09 — Performance mobile

Mesurer avant et après sur les mêmes routes, le même build de production et un protocole stable.

Objectifs :

- Lighthouse Performance ≥ 85 sur `/` et `/prospects` ;
- Accessibilité ≥ 98 ;
- Bonnes pratiques = 100 ;
- CLS ≤ 0,1 ;
- aucune régression significative des temps du jeu volumique ;
- documenter taille du bundle et plus gros chunk.

L’optimisation doit être guidée par le profilage. Les bibliothèques lourdes non nécessaires au démarrage doivent être candidates au chargement différé.

### S11-F10 — En-têtes de sécurité

Configurer et tester des en-têtes adaptés au produit, notamment :

- `X-Content-Type-Options` ;
- protection contre le framing via CSP et/ou en-tête compatible ;
- `Referrer-Policy` ;
- `Permissions-Policy` ;
- CSP testée, sans casser Next.js, les styles, les blobs PDF ni `wa.me` ;
- pour `sw.js`, type JavaScript et politique de cache empêchant une version obsolète.

Ne pas copier une CSP générique sans vérifier les ressources réellement utilisées.

### S11-F11 — Documentation cohérente

Mettre à jour au minimum, si nécessaire :

- `README.md` ;
- `DOCS/USER_GUIDE.md` ;
- `DOCS/PILOT_TEST_PLAN.md` ;
- `DOCS/RELEASE_CHECKLIST.md` ;
- `DOCS/KNOWN_LIMITATIONS.md` ;
- `DOCS/RELEASE_NOTES_BETA.md` ;
- `DOCS/ARCHITECTURE.md`, `DATABASE.md`, `OFFLINE_FIRST.md`, `SECURITY.md` et `TESTING.md` ;
- le rapport final du Sprint 11.

Les mentions Dexie V10, 20 collections métier ou périmètre antérieur aux dépenses doivent être remplacées par l’état réel : Dexie V11, 21 collections métier et `securitySettings` séparée, sous réserve de vérification dans le code.

## 5. Exigences techniques

### 5.1 Guides Next.js obligatoires

Lire complètement avant modification :

- `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md` ;
- `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md` ;
- `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md` ;
- `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/headers.md`.

### 5.2 Service worker

La stratégie de cache doit être explicite par type de ressource. Elle doit différencier au minimum navigation, ressources statiques immuables, manifeste/icônes et ressources externes. Les réponses en erreur et opaques ne doivent pas être mises en cache sans justification.

Tous les traitements asynchrones de cache déclenchés par un événement doivent être rattachés à la durée de vie de l’événement lorsque requis. Les erreurs réseau doivent retourner une réponse valide et compréhensible pour les navigations.

### 5.3 Données

Le cache HTTP et Cache Storage ne doivent jamais être présentés comme la sauvegarde d’IndexedDB. Une mise à jour ou un nettoyage de cache ne doit pas effacer la base.

Toute évolution Dexie éventuelle doit être additive, testée depuis V10 et V11, et ne doit être créée que si le sprint la nécessite réellement.

### 5.4 Observabilité de recette

Les scripts doivent produire des résultats déterministes et lisibles : durée, build, routes, assertions, console, erreurs HTTP et réseau attendu/inattendu. Ils ne doivent pas masquer les échecs avec des valeurs par défaut trompeuses.

## 6. Protocole A→B

Le protocole minimal est :

1. construire et conserver l’artefact A ;
2. servir A sur une origine HTTPS stable ;
3. installer A et créer les données de référence ;
4. confirmer l’utilisation hors ligne de A ;
5. construire B avec un identifiant ou contenu différent ;
6. remplacer A par B sans effacer les données navigateur ;
7. ouvrir l’application en ligne et observer le cycle du service worker ;
8. appliquer la mise à jour selon le mécanisme prévu ;
9. fermer, rouvrir et repasser hors ligne ;
10. comparer les données et calculs à la référence ;
11. conserver captures, hash et résultat.

Changer uniquement le paramètre d’URL de `sw.js` sans modifier son contenu ne constitue pas un test A→B valide.

## 7. Tests automatisés à ajouter ou adapter

- manifeste : champs, icônes, portée et installabilité vérifiables ;
- en-têtes globaux et en-têtes de `sw.js` ;
- enregistrement du service worker avec politique de mise à jour ;
- transition waiting/activation/rechargement sans boucle ;
- bannière en ligne/hors ligne et accessibilité ;
- navigation vers une route indisponible hors ligne ;
- suppression sélective des anciens caches ;
- conservation IndexedDB lors d’un scénario A→B automatisable ;
- présence de `expenses` dans le parcours transversal, la sauvegarde et les statistiques ;
- responsive avec clavier ou viewport visuel simulé ;
- absence de régression des tests financiers et de restauration ;
- remplacement ou archivage explicite de l’ancien E2E `/dev-diagnostic`.

## 8. Commandes de validation

Exécuter au minimum :

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

Si l’audit distant est impossible, consigner le code, le message exact et la portée de l’incertitude. Ne pas présenter l’audit hors ligne comme équivalent.

## 9. Dossier de recette physique

Le rapport doit contenir une ligne par environnement :

| Date | Appareil | OS | Navigateur | Mode | Build A/B | Réseau | Scénario | Résultat | Preuve | Défaut |
|---|---|---|---|---|---|---|---|---|---|---|

Les preuves peuvent être des captures, vidéos, journaux distants ou fichiers exportés, sans inclure de données personnelles réelles.

## 10. Critères d’acceptation

Le Sprint 11 est pleinement accepté lorsque :

1. toutes les commandes obligatoires réussissent, sauf indisponibilité externe explicitement prouvée ;
2. aucun P0/P1 n’est ouvert ;
3. Android, iPhone/iPad et tablette ont réellement été testés ;
4. le passage A→B a été effectué avec deux artefacts distincts ;
5. les données Dexie V11, dont les dépenses, subsistent ;
6. installation, hors-ligne, PDF, partage et sauvegarde/restauration sont vérifiés ;
7. les résultats financiers restent exacts ;
8. les défauts mobiles constatés ont été corrigés et retestés ;
9. les en-têtes ne provoquent aucune régression ;
10. la documentation correspond au code et aux résultats ;
11. les tests non exécutés sont clairement identifiés ;
12. aucune publication ou action Git non autorisée n’a été effectuée.

Si les appareils physiques ne sont pas disponibles, le seul verdict honnête possible après réussite du code est `SPRINT 11 VALIDATION CONDITIONNELLE`.
