# Prompt complet pour Gemini — Sprint 15

Copiez l’intégralité du prompt ci-dessous dans Gemini.

---

Tu travailles dans :

`D:\dev\samatech-crm`

Implémente et valide le **Sprint 15 — Rapports, exports et sauvegarde chiffrée**.

Tu dois auditer l’état final réel des Sprints 12, 13 et 14, développer le module complet, ajouter les tests, exécuter toutes les validations et produire un rapport factuel. Ne te limite pas à des recommandations.

## 1. Règles absolues

- Lis `AGENTS.md` avant toute action.
- Commence par `git status --short`.
- Le dépôt contient potentiellement des modifications non validées des Sprints 12 à 14 : préserve-les intégralement.
- Ne lance aucune commande destructive.
- Ne fais aucun commit, push, tag, pull request ou déploiement.
- Exécute sans demander de confirmation les commandes locales non destructives nécessaires.
- Lis la documentation Next.js 16 locale pertinente dans `node_modules/next/dist/docs/` avant toute modification de pages, routes, imports dynamiques ou PWA.
- Respecte présentation/application/domaine/infrastructure.
- Aucun composant React ne doit appeler Dexie directement.
- Aucun générateur PDF ou CSV ne doit appeler Dexie ou recalculer les règles métier.
- Utilise un instantané de lecture cohérent.
- Utilise des entiers exacts, `BigInt` pour les agrégats et des chaînes dans les read models si nécessaire.
- Ne mélange jamais devise ou échelle et n’ajoute aucun taux de change.
- N’ajoute aucune table pour mémoriser les fichiers générés.
- Ne change pas la version Dexie uniquement pour le chiffrement.
- Utilise l’API Web Crypto ; n’implémente aucune primitive cryptographique toi-même.
- N’utilise jamais le PIN 4–6 chiffres comme mot de passe, clé ou secret de sauvegarde.
- Ne persiste jamais le mot de passe de sauvegarde.
- Maintiens la restauration transactionnelle et l’exclusion de `securitySettings`.
- N’ajoute pas backend, cloud, compte utilisateur, IA, télémétrie distante, API WhatsApp, fichier XLSX ou import CSV.
- Ne revendique jamais une conformité comptable, fiscale ou cryptographique certifiée.
- Ne prétends jamais avoir testé un appareil physique sans preuve réelle.

## 2. Documents à lire complètement

- `DOCS/SPRINT15_ANALYSE.md`
- `DOCS/SPRINT15_CAHIER_DES_CHARGES.md`
- `DOCS/SPRINT14_ANALYSE.md`
- `DOCS/SPRINT14_CAHIER_DES_CHARGES.md`
- `DOCS/SPRINT14_VALIDATION_REPORT.md` s’il existe
- `DOCS/SPRINT13_VALIDATION_REPORT.md` s’il existe
- `DOCS/SPRINT12_VALIDATION_REPORT.md` s’il existe
- `DOCS/ARCHITECTURE.md`
- `DOCS/DATABASE.md`
- `DOCS/RULES.md`
- `DOCS/SECURITY.md`
- `DOCS/OFFLINE_FIRST.md`
- `DOCS/UI_UX.md`
- `DOCS/TESTING.md`
- `DOCS/USER_GUIDE.md`
- `DOCS/KNOWN_LIMITATIONS.md`
- `DOCS/RELEASE_CHECKLIST.md`
- `README.md`

Consulte également, avant d’arrêter les paramètres cryptographiques :

- https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- https://www.w3.org/TR/WebCryptoAPI/
- https://csrc.nist.gov/pubs/sp/800/38/d/final
- https://owasp.org/www-community/attacks/CSV_Injection

Si le réseau n’est pas disponible, utilise le cahier des charges comme ligne de base et signale que les références n’ont pas pu être revérifiées. N’invente pas une recommandation plus récente.

## 3. Audit initial obligatoire

Avant de coder :

1. relève état Git, Node, npm, Next.js, Dexie et scripts disponibles ;
2. inspecte les migrations et la version Dexie réelle ;
3. inventorie toutes les tables réelles et la liste des collections de sauvegarde ;
4. vérifie que les comptes, allocations et opérations de trésorerie ainsi que les documents commerciaux sont réellement inclus dans l’export ;
5. relève `BACKUP_FORMAT_VERSION`, limites, checksum, validations et compatibilités historiques ;
6. inspecte `ManageBackupsUseCase`, `BackupSettings`, le dépôt et les tests ;
7. inspecte le PIN existant sans le confondre avec le nouveau secret ;
8. inventorie les calculs du dashboard/statistiques, factures, paiements, dépenses, trésorerie, budgets, prévisions et documents commerciaux ;
9. identifie les fonctions pures réutilisables et les divergences ;
10. cherche tout export CSV ou rapport général déjà ajouté ;
11. exécute lint, TypeScript, tests et build comme ligne de base ;
12. distingue défauts antérieurs, travail concurrent et régressions de Sprint 15.

Lors de la rédaction, l’arbre en cours indiquait Dexie V13 mais la liste de sauvegarde pouvait ne pas être totalement alignée sur toutes les tables de trésorerie. Ne suppose pas un nombre de collections : audite et crée une source unique correcte.

## 4. Architecture

Crée un module cohérent `src/modules/reports/` avec :

- modèles et règles de domaine ;
- calculs ou adaptateurs vers les règles existantes ;
- cas d’usage de génération et export ;
- dépôt de lecture Dexie ;
- générateurs PDF ;
- sérialiseur CSV ;
- présentation ;
- tests.

Étends le module `backup` avec :

- domaine du conteneur chiffré ;
- port cryptographique testable ;
- implémentation Web Crypto ;
- orchestration export/auto-vérification/inspection/restauration ;
- interface de mot de passe ;
- tests.

Le service cryptographique manipule des octets et ne connaît pas Dexie. Le dépôt de rapports ne génère aucun PDF. La présentation ne porte aucune formule métier ou politique cryptographique.

## 5. Rapports

Implémente quatre rapports :

1. activité commerciale ;
2. situation financière ;
3. créances ;
4. relevé client.

Chaque rapport porte : type, période inclusive, fuseau `Africa/Dakar`, critères, date de génération, version de l’application et avertissements d’intégrité.

### Rapport commercial

Inclure prospects, conversions, relances, facturation, encaissements, produits vendus, devis, pro forma, livraisons et comparaison à période équivalente.

Réutilise les calculs de `statistics` ou extrais un domaine partagé. Prouve avec des matrices de non-régression que dashboard et rapport renvoient les mêmes valeurs à critères identiques.

### Rapport financier

Par devise et échelle : facturé, encaissé, dépenses, flux net, créances, échéances, soldes de comptes à date, ajustements, budgets et prévisions 30/60/90.

- Le flux net de période est encaissements moins dépenses.
- Les transferts internes ne sont ni une entrée ni une sortie consolidée.
- Les soldes de trésorerie sont des positions à la date de fin, pas uniquement les mouvements de la période.
- Les ajustements restent identifiables.
- Réalisé et prévisionnel ne sont jamais additionnés.
- Les documents commerciaux ne sont jamais assimilés à des factures.
- Affiche la mention « Rapport interne de gestion — ne remplace pas des états comptables ou fiscaux certifiés. »

### Créances

Calculer à une date de référence : facture, client, échéance, montant, paiements actifs, solde, retard et tranches 0–30, 31–60, 61–90 et >90 jours. La somme des tranches doit égaler le total par devise/échelle.

### Relevé client

Calculer solde d’ouverture, mouvements de période et solde de clôture par devise. Ordonner de façon déterministe. Ne pas créer une terminologie comptable non portée par le modèle.

## 6. PDF

Crée quatre templates ou un système de sections strictement typé. Réutilise les primitives sûres existantes pour polices, images, pagination, partage et noms de fichiers.

Exigences :

- aucune requête ou règle métier dans le générateur ;
- PDF valide, multipage et lisible ;
- en-têtes de tableau répétés ;
- caractères français et longues valeurs ;
- identité entreprise, titre, période, fuseau, génération et filtres ;
- totaux exacts et séparés par devise ;
- avertissements et état vide ;
- Web Share lorsque disponible, téléchargement sinon ;
- génération entièrement hors ligne ;
- aucun cache du fichier.

## 7. Exports CSV

Implémente les jeux du cahier des charges : contacts/prospects, clients, catalogue, relances, factures/lignes, paiements, dépenses, trésorerie, budgets, prévisions et documents commerciaux/lignes/livraisons.

Un fichier par jeu de données est suffisant. N’ajoute pas ZIP ou XLSX sans nécessité et sans cadrage.

Format obligatoire :

- UTF-8 avec BOM ;
- séparateur `;` ;
- CRLF ;
- en-têtes stables ;
- chaque cellule guillemetée ;
- guillemets doublés ;
- dates civiles ISO et horodatages ISO ;
- codes métier et identifiants conservés ;
- schéma de chaque jeu versionné et testé.

Pour chaque montant, exporte champ mineur exact, devise, échelle et éventuellement valeur formatée. Pour chaque quantité, exporte valeur mise à l’échelle et échelle. N’utilise jamais une valeur flottante comme seule représentation.

## 8. Défense CSV

Crée une fonction pure centralisée de neutralisation des cellules de tableur. Couvre `=`, `+`, `-`, `@`, tabulation, CR, LF, variantes pleine largeur, espaces/contrôles préfixes et tentatives de rupture par séparateur ou guillemet.

Applique la politique à toute valeur utilisateur : noms, téléphones, notes, libellés, références, adresses, descriptions. Ne te contente pas de guillemeter : documente le préfixe de neutralisation retenu et teste le fichier final comme cellules.

Affiche avant export le dataset, les filtres, le nombre de lignes, l’avertissement de sensibilité et « Ce CSV ne peut pas restaurer SAMTECH CRM ».

## 9. Conteneur de sauvegarde chiffrée V1

Conserve l’enveloppe métier actuelle comme clair interne. Ajoute un conteneur séparé avec :

```text
product          = samtech-crm
containerVersion = 1
encrypted        = true
createdAt         ISO 8601
kdf.name          PBKDF2
kdf.hash          SHA-256
kdf.iterations    600000
kdf.salt          base64 de 16 octets aléatoires minimum
cipher.name       AES-GCM
cipher.keyLength  256
cipher.iv         base64 de 12 octets aléatoires
cipher.tagLength  128
payloadEncoding   base64
payload           résultat AES-GCM, tag inclus
```

- Utilise `crypto.getRandomValues` pour sel et IV, nouveaux à chaque export.
- Importe le mot de passe comme clé PBKDF2 non extractible.
- Dérive une clé AES-GCM 256 non extractible avec Web Crypto.
- Utilise l’en-tête canonique sans `payload` comme AAD.
- Le contenu en clair conserve son SHA-256 et toutes ses validations.
- N’expose en clair aucun compteur, nom d’entreprise ou indice de mot de passe.
- Extension : `.samtech-backup`.
- Ne modifie pas `BACKUP_FORMAT_VERSION` si le contenu logique ne change pas.
- Ne modifie pas la version Dexie si aucune table ne change.

Pour le conteneur V1, refuse avant dérivation toute version, algorithme, taille, tag ou nombre d’itérations différent. Borne la taille et le base64 avant allocation. N’accepte pas de paramètres par défaut silencieux.

## 10. Mot de passe

- indépendant du PIN ;
- minimum 12 caractères après normalisation documentée ;
- confirmation à l’export ;
- espaces et Unicode permis ;
- recommandation d’au moins quatre mots ;
- aucun stockage dans Dexie, Web Storage, URL, logs ou télémétrie ;
- aucun mécanisme de récupération ;
- état effacé après succès, erreur, annulation ou navigation ;
- pas de promesse d’effacement garanti des chaînes JavaScript.

Affiche clairement qu’une perte rend le fichier irrécupérable. Ne préremplis jamais avec le PIN.

## 11. Export et auto-vérification

L’action principale « Créer une sauvegarde chiffrée » doit :

1. collecter toutes les collections métier réelles ;
2. sérialiser et contrôler l’enveloppe existante ;
3. chiffrer ;
4. sérialiser le conteneur ;
5. le déchiffrer immédiatement en mémoire ;
6. revalider le JSON logique complet ;
7. comparer digest et compteurs ;
8. déclencher le téléchargement ;
9. seulement alors enregistrer la date de préparation réussie.

Explique que l’application ne peut pas prouver que le navigateur a conservé le téléchargement. Ajoute une action « Vérifier une sauvegarde » indépendante de la restauration.

L’ancien export JSON clair peut rester uniquement dans une section avancée, avec avertissement et confirmation explicites.

## 12. Inspection et restauration

Détecte le format par contenu en plus de l’extension.

Pour un conteneur chiffré :

1. validation externe bornée ;
2. demande du mot de passe ;
3. dérivation ;
4. déchiffrement authentifié ;
5. message unique « Mot de passe incorrect ou fichier altéré » pour toute erreur GCM ;
6. validation logique complète par le validateur existant ;
7. aperçu ;
8. phrase `REMPLACER MES DONNÉES` ;
9. PIN courant si actif ;
10. remplacement transactionnel et rollback.

La vérification seule effectue les étapes 1 à 7 sans aucune écriture. Prouve cette absence de mutation.

Les anciens `.json` valides restent inspectables et restaurables. Ils suivent le même aperçu, la même confirmation destructive et les mêmes règles de compatibilité.

## 13. Alignement des collections

Crée une source unique pour les collections métier sauvegardées et aligne :

- définition Dexie ;
- types du dépôt ;
- export ;
- validation ;
- restauration ;
- aperçu ;
- tests et documentation.

Vérifie explicitement les collections de trésorerie et de documents commerciaux issues des Sprints 13/14. `securitySettings` reste toujours séparée. Corrige les défauts confirmés sans perdre de données et sans masquer qu’ils étaient antérieurs au Sprint 15.

## 14. Routes, mobile et accessibilité

Crée :

```text
/reports
/reports/commercial
/reports/financial
/reports/receivables
/reports/client/[clientId]
/reports/exports
```

Étends `/settings/backup`.

- Ajoute Rapports au menu Plus/latéral.
- Ajoute « Générer un relevé » depuis un client.
- Utilise des cartes et filtres verticaux dès 320 px.
- Évite toute table horizontale essentielle.
- Empêche doubles clics et affiche progression pendant PDF, CSV, KDF et restauration.
- Implémente afficher/masquer le mot de passe, focus, clavier, `aria-live`, erreurs associées et mode sombre.
- Ne copie aucune donnée sensible dans le presse-papiers.
- Vérifie téléchargement et partage Android/iOS.

## 15. Hors ligne et performance

- Aucun réseau pour rapports, CSV, chiffrement, inspection ou restauration.
- Aucune dépendance dynamique distante.
- Aucun Blob ajouté au cache du service worker.
- Conserve 25 Mo comme limite du clair tant que les mesures ne justifient pas autre chose.
- Calcule une limite externe sûre tenant compte du base64.
- Mesure PBKDF2 600 000, AES-GCM et mémoire sur les appareils cibles avec fichier représentatif et proche de la limite.
- Ne réduis pas silencieusement les itérations. Toute évolution exige version et justification documentée.

## 16. Tests

Implémente tous les tests du cahier des charges.

### Rapports

- période/fuseau ;
- égalité dashboard/rapport ;
- flux versus soldes ;
- transferts internes ;
- budgets/prévisions ;
- créances et tranches ;
- relevé client ;
- multi-devises ;
- documents commerciaux sans effet financier ;
- PDF vides, remplis, multipages et Unicode.

### CSV

- BOM, séparateur, CRLF, guillemets ;
- Unicode ;
- matrice complète d’injection de formule ;
- montants et quantités exacts ;
- filtres, ordre, gros volume ;
- schémas versionnés.

### Chiffrement

- vecteurs/fixtures déterministes en test ;
- roundtrip et Unicode ;
- aléas distincts à chaque export ;
- tailles sel/IV/tag et clé non extractible ;
- mot de passe erroné ;
- chaque champ ou octet altéré ;
- base64, troncature, surtaille et paramètres hostiles ;
- message d’erreur commun ;
- aucun secret persisté ou loggé ;
- auto-vérification.

### Restauration

- toutes collections réelles ;
- exclusion sécurité ;
- vérification sans mutation ;
- nouvelle sauvegarde chiffrée ;
- fixtures JSON historiques ;
- validation logique après déchiffrement ;
- confirmation, PIN et rollback ;
- comparaison profonde.

## 17. E2E

Crée `scripts/e2e-sprint15-test.js` et `test:sprint15` couvrant :

1. jeu représentatif de tous les modules ;
2. quatre rapports et cohérence ;
3. CSV de chaque famille et charges d’injection ;
4. deux conteneurs différents pour même clair/mot de passe ;
5. mauvais mot de passe et altération ;
6. vérification sans mutation ;
7. restauration chiffrée et comparaison ;
8. restauration historique claire ;
9. exécution hors ligne ;
10. zéro erreur console, HTTP ou réseau inattendue.

## 18. Commandes finales

Exécute dans cet ordre et rapporte code, durée, succès et avertissements :

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
npm.cmd run test:sprint12
npm.cmd run test:sprint13
npm.cmd run test:sprint14
npm.cmd run test:sprint15
```

Si un script précédent n’existe pas, rapporte-le. Ne simule pas son résultat. Relance tout contrôle affecté après une correction tardive et ne masque aucun échec.

## 19. Documentation et rapport

Mets à jour README, architecture, base, règles, sécurité, hors-ligne, UI/UX, tests, guide utilisateur, limites, checklist et notes de version.

Crée `DOCS/SPRINT15_VALIDATION_REPORT.md` avec :

1. verdict ;
2. état Git initial et travail concurrent ;
3. audit Dexie et liste exacte des collections ;
4. architecture et fichiers ;
5. modèles et matrices de rapports ;
6. comparaison avec dashboard ;
7. PDF générés ;
8. schémas CSV et défense injection ;
9. modèle de menace ;
10. paramètres, AAD et format cryptographique ;
11. secret et absence de persistance ;
12. compatibilité des sauvegardes ;
13. restauration, rollback et vérification sans mutation ;
14. tests et E2E ;
15. commandes, codes et durées ;
16. mesures de performance ;
17. recette Android/iOS/tableurs avec preuves ;
18. hors ligne ;
19. défauts restants ;
20. état Git final ;
21. décision finale.

Utilise exactement un verdict :

- `SPRINT 15 VALIDÉ` seulement si calculs, sécurité, compatibilité, automatisation et recette physique sont prouvés ;
- `SPRINT 15 VALIDATION CONDITIONNELLE` si le code est conforme mais tests physiques, tableurs cibles ou performances cryptographiques ne sont pas prouvés ;
- `SPRINT 15 NON VALIDÉ` si un rapport est faux, des devises sont mélangées, un CSV reste injectable, un secret est persisté, une altération est acceptée, une sauvegarde compatible ne se restaure plus, le rollback échoue ou un P0/P1 demeure.

Commence maintenant par l’état Git et l’audit complet de la base, des collections exportées, des calculs existants et de la sauvegarde claire. Implémente ensuite sans écraser les Sprints 12/13/14, teste, corrige et rédige le rapport factuel.

---
