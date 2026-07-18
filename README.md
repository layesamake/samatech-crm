# SAMTECH CRM — V1 bêta

Application de gestion commerciale hors ligne (PWA).

Version courante : `1.0.0-beta.1`. Cette version est destinée à une phase pilote supervisée ; aucune publication n’est implicite.

## Documentation

La documentation de référence se trouve dans le dossier `DOCS/`.
Veuillez lire les fichiers présents dans ce dossier avant toute modification majeure.

## Commandes de Développement

- `npm run dev` : Démarrer le serveur de développement.
- `npm run build` : Compiler l'application pour la production.
- `npm run start` : Démarrer l'application en mode production.
- `npm run lint` : Lancer l'analyse ESLint.
- `npm run test` : Lancer les tests unitaires avec Vitest.
- `npm run test:accessibility` : Auditer les routes importantes avec axe-core.
- `npm run test:responsive` : Contrôler les largeurs 320 à 1440 px et le paysage.
- `npm run test:performance` : Mesurer le jeu de données représentatif.
- `npm run test:lighthouse` : Mesurer deux écrans mobiles représentatifs.
- `npm run test:pwa-update` : Vérifier mise à jour, hors-ligne et conservation IndexedDB.
- `npm run test:v1-beta` : Exécuter le parcours transversal de la bêta.

## Accès Rapide

- [Diagnostic de Développement](/dev-diagnostic) : Vérifier l'état d'IndexedDB et PWA (disponible en dev).

## Sauvegarde et sécurité locale

- `/settings/backup` exporte et restaure localement les vingt collections métier au format JSON version 1.
- `/settings/security` configure un PIN local facultatif et le verrouillage de l'interface.
- Le fichier de sauvegarde n'est pas chiffré et doit être conservé en lieu sûr. Le PIN protège l'interface; il ne chiffre pas IndexedDB.

Consultez aussi `DOCS/USER_GUIDE.md`, `DOCS/PILOT_TEST_PLAN.md`, `DOCS/RELEASE_CHECKLIST.md`, `DOCS/KNOWN_LIMITATIONS.md` et `DOCS/RELEASE_NOTES_BETA.md`.
