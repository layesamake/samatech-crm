# Prompt complet pour Gemini — Sprint 14

Copiez l’intégralité du prompt ci-dessous dans Gemini.

---

Tu travailles dans :

`D:\dev\samatech-crm`

Implémente et valide le **Sprint 14 — Devis, factures pro forma et bons de livraison**.

Tu dois auditer l’état final réel des Sprints 12 et 13, développer le module complet, migrer l’implémentation `ESTIMATE`, ajouter les tests, exécuter toutes les validations et produire un rapport factuel. Ne te limite pas à des recommandations.

## 1. Règles absolues

- Lis `AGENTS.md` avant toute action.
- Commence par `git status --short`.
- Le dépôt contient potentiellement des modifications non validées des Sprints 12 et 13 : préserve-les intégralement.
- Ne lance aucune commande destructive.
- Ne fais aucun commit, push, tag, pull request ou déploiement.
- Exécute sans demander de confirmation les commandes locales non destructives nécessaires.
- Respecte présentation/application/domaine/infrastructure.
- Aucun composant React ne doit appeler Dexie directement.
- Utilise des transactions pour émission, conversion, livraison, migration et restauration.
- Utilise des entiers mis à l’échelle et `BigInt` pour les calculs exacts.
- Ne mélange jamais devise ou échelle.
- Conserve les instantanés historiques.
- Aucun devis, pro forma ou bon de livraison ne doit augmenter le facturé, créer une créance, accepter un paiement ou modifier la trésorerie.
- Seule une facture émise conserve ces effets.
- N’ajoute pas gestion de stock, signature électronique, backend, cloud, IA, licence ou automatisation WhatsApp.
- Ne revendique aucune conformité juridique/fiscale non vérifiée.
- Ne prétends jamais avoir testé un appareil physique sans preuve réelle.

## 2. Documents à lire complètement

- `DOCS/SPRINT14_ANALYSE.md`
- `DOCS/SPRINT14_CAHIER_DES_CHARGES.md`
- `DOCS/SPRINT13_ANALYSE.md`
- `DOCS/SPRINT13_CAHIER_DES_CHARGES.md`
- `DOCS/SPRINT13_VALIDATION_REPORT.md` s’il existe
- `DOCS/SPRINT12_VALIDATION_REPORT.md` s’il existe
- `DOCS/ARCHITECTURE.md`
- `DOCS/DATABASE.md`
- `DOCS/RULES.md`
- `DOCS/UI_UX.md`
- `DOCS/TESTING.md`
- `DOCS/OFFLINE_FIRST.md`
- `DOCS/SECURITY.md`
- `DOCS/KNOWN_LIMITATIONS.md`
- `DOCS/RELEASE_CHECKLIST.md`

Lis également la documentation Next.js 16 locale pertinente dans `node_modules/next/dist/docs/` avant de modifier les pages, imports dynamiques ou PWA.

## 3. Audit initial obligatoire

Avant de coder :

1. relève état Git, versions et commandes disponibles ;
2. vérifie la version Dexie et les collections réelles après Sprint 13 ;
3. inventorie les sauvegardes et leur compatibilité ;
4. recherche tous les usages de `ESTIMATE`, « Devis / Proforma » et `invoice.type` ;
5. vérifie si `ESTIMATE` entre actuellement dans statistiques, créances, paiements, trésorerie ou prévisions ;
6. vérifie les données de seed et tests contenant des devis hérités ;
7. inspecte numérotation, émission, conversion, chronologie et PDF ;
8. exécute lint, TypeScript, tests et build comme ligne de base ;
9. distingue défauts antérieurs et régressions ;
10. choisis la prochaine migration seulement après vérification.

Le code observé lors de la rédaction contient :

- `InvoiceRecord.type?: 'INVOICE' | 'ESTIMATE'` ;
- un formulaire « Facture » ou « Devis / Proforma » ;
- un PDF intitulé « Devis / Proforma » ;
- l’émission d’un `ESTIMATE` utilisant apparemment la séquence `invoice:YYYY` ;
- une duplication du devis vers une facture sans lien métier durable ;
- des requêtes statistiques/paiements qui ne filtrent pas visiblement `ESTIMATE`.

Vérifie l’état actuel et corrige les risques confirmés.

## 4. Nouveau module

Crée `src/modules/commercial-documents/` ou un nom cohérent comprenant :

- domaine documents, lignes, transitions et liens ;
- cas d’usage de création, émission, statut, conversion et livraison ;
- dépôt Dexie ;
- générateurs PDF ou templates ;
- composants de présentation ;
- tests.

Ajoute trois collections :

- `commercialDocuments` ;
- `commercialDocumentLines` ;
- `commercialDocumentLinks`.

La version attendue est V13 si le Sprint 13 a réellement livré V12. Utilise toujours la prochaine version réelle.

## 5. Types et statuts

Implémente :

- `QUOTE` ;
- `PROFORMA` ;
- `DELIVERY_NOTE` ;
- `LEGACY_ESTIMATE` uniquement pour migration.

Statuts généraux : `DRAFT`, `ISSUED`, `ACCEPTED`, `REJECTED`, `CONVERTED`, `DELIVERED`, `CANCELLED`, avec transitions autorisées par type.

L’expiration est un état effectif calculé depuis `validUntil`, pas une mutation silencieuse lors d’une lecture.

Ajoute des fonctions de domaine pures testant chaque transition, date, type et combinaison de champs.

## 6. Calculs partagés

Les devis et pro forma doivent produire exactement les mêmes résultats de lignes que les factures : quantités mises à l’échelle, remises, taxes, arrondi et limites.

- Extrais si nécessaire un moteur commun de calcul commercial dans une couche de domaine partagée.
- Fais utiliser ce moteur par Factures et Documents commerciaux.
- Ne duplique pas les formules.
- Avant/après refactor, toutes les matrices financières Facture doivent être strictement identiques.
- Les bons de livraison n’utilisent pas de montant.

## 7. Numérotation

Ajoute paramètres et séquences séparés :

- `quote:YYYY` avec préfixe `DEV-` ;
- `proforma:YYYY` avec `PRO-` ;
- `delivery-note:YYYY` avec `BL-`.

Attribution seulement à l’émission, dans la transaction. Aucune réutilisation, même après annulation. Concurrence testée.

La facture conserve sa séquence existante. Une conversion crée seulement un brouillon de facture ; son numéro sera attribué par le cas d’usage Facture lors de l’émission.

## 8. Migration des `ESTIMATE`

La migration est critique.

Pour chaque `invoices.type === 'ESTIMATE'` :

1. charge document, lignes, paiements et événements ;
2. refuse ou met explicitement en quarantaine tout paiement actif incohérent ;
3. crée un `commercialDocument` de type `LEGACY_ESTIMATE` ;
4. préserve statut sans inventer acceptation/refus ;
5. préserve instantanés, dates, montants, numéro et ID de provenance ;
6. copie les lignes exactement ;
7. migre les références de chronologie ;
8. supprime ancien document/lignes uniquement après réussite de toutes les copies ;
9. ne touche à aucune vraie facture ;
10. prouve le rollback par faute injectée.

Ne classe pas automatiquement un héritage en devis ou pro forma. Crée une interface de classification manuelle. La classification ne renumérote pas et ne crée aucun effet financier.

Après migration :

- le formulaire Facture ne crée plus `ESTIMATE` ;
- le domaine Facture ne propose plus ce type pour les nouvelles données ;
- statistiques, paiements et trésorerie ignorent toute donnée héritée résiduelle ;
- une vérification d’intégrité détecte un ancien `ESTIMATE` non migré.

## 9. Devis

Implémente : brouillon, émission, PDF, partage, validité, état effectif expiré, acceptation, refus, annulation, duplication/révision et conversions.

Un devis accepté peut devenir :

- une pro forma brouillon liée ; ou
- une facture brouillon liée.

Empêche les conversions doubles avec lien unique et transaction. L’acceptation reste manuelle et ne prétend pas être une signature électronique.

## 10. Pro forma

Implémente un document distinct avec son propre titre, numéro, cycle et PDF.

Le PDF et l’aperçu doivent afficher une mention configurable indiquant clairement le caractère non définitif. Ils ne doivent pas afficher « Payé », « Solde dû » ou formulaire de paiement.

Une pro forma émise/acceptée peut être convertie une seule fois en facture brouillon. Aucun indicateur financier ne change avant émission de cette facture.

## 11. Bons de livraison

Crée un bon depuis un devis accepté, une pro forma admissible ou une facture émise.

- sélectionne les lignes et quantités ;
- prend en charge les livraisons partielles ;
- référence chaque ligne source ;
- recalcule le reliquat à l’émission dans la transaction ;
- additionne uniquement les bons `ISSUED` ou `DELIVERED` non annulés ;
- refuse tout dépassement exact, même avec échelles différentes ;
- annuler libère le reliquat ;
- statut `DELIVERED` confirme manuellement la remise ;
- aucun mouvement de stock, revenu, dépense ou trésorerie.

Le PDF n’affiche pas les prix par défaut. Il contient date, adresse, référence, quantités, unités, observations et zones Livré/Reçu.

## 12. Liens, chronologie et client

Crée des liens explicites pour :

- devis→pro forma ;
- devis→facture ;
- pro forma→facture ;
- bon→source ;
- révision→ancien document.

Ajoute des événements de chronologie typés pour émission, acceptation, refus, conversion, livraison, annulation et classification héritée.

La fiche client présente les documents par type et ouvre leurs routes. Les instantanés émis ne changent pas après modification du client ou catalogue.

## 13. PDF et partage

Génère et teste trois templates distincts. Réutilise les primitives de pagination, texte sûr, image et partage, mais pas un libellé conditionnel ambigu.

Exigences :

- titres et métadonnées exacts ;
- noms de fichiers sûrs ;
- caractères français ;
- multipage ;
- mention pro forma ;
- absence de prix sur bon ;
- statut annulé visible ;
- Web Share puis téléchargement de repli ;
- fonctionnement hors ligne après chargement prévu.

## 14. Routes et mobile

Crée les routes du cahier des charges : hub, listes, création, détail et édition pour devis, pro forma et bons.

- navigation via le menu Plus sans surcharger la barre inférieure ;
- cartes mobiles dès 320 px ;
- filtres type/statut/client/période ;
- actions visibles sans balayage obligatoire ;
- éditeur de lignes en cartes ;
- quantités partielles compréhensibles ;
- focus, clavier, dialogues, mode sombre et lecteur d’écran ;
- aucun tableau horizontal essentiel.

## 15. Statistiques et non-régression financière

Ajoute une suite de référence prouvant :

- émettre devis/pro forma/bon laisse facturé, encaissé, créances, dépenses et trésorerie inchangés ;
- convertir en facture brouillon laisse encore ces indicateurs inchangés ;
- émettre ensuite la facture augmente seulement le montant facturé selon les règles existantes ;
- aucun paiement ne peut viser un document commercial ;
- livraison n’affecte rien financièrement ;
- valeur proposée et taux d’acceptation sont dans une section commerciale séparée par devise.

## 16. Sauvegarde et restauration

Ajoute les trois collections à l’export et adapte les sauvegardes antérieures selon `sourceSchemaVersion` après vérification du checksum original.

Valide références, lignes, liens, numéros, conversions et reliquats. Rejette orphelins, doublons, cycle de liens et dépassements.

Une ancienne sauvegarde contenant `ESTIMATE` doit être restaurée puis migrée de façon déterministe avant l’usage. Prouve transaction et rollback.

## 17. Tests et E2E

Implémente tous les tests du cahier des charges.

Crée `scripts/e2e-sprint14-test.js` et `test:sprint14` couvrant :

1. migration d’un `ESTIMATE` et classification ;
2. devis émis, accepté et converti ;
3. non-incidence financière avant facture émise ;
4. pro forma distincte et conversion ;
5. facture émise après conversion ;
6. deux livraisons partielles ;
7. dépassement refusé ;
8. annulation libérant le reliquat ;
9. trois PDF ;
10. chronologie client ;
11. sauvegarde/restauration ;
12. hors ligne ;
13. zéro erreur console, HTTP ou réseau inattendue.

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
npm.cmd run test:sprint14
```

Relance les contrôles affectés après toute correction tardive. Ne masque aucun échec.

## 19. Documentation et rapport

Mets à jour les documents concernés : architecture, base, règles, UI/UX, tests, hors-ligne, guide utilisateur, limites, checklist, README et notes de version.

Crée `DOCS/SPRINT14_VALIDATION_REPORT.md` avec :

1. verdict ;
2. état initial et dette `ESTIMATE` ;
3. version Dexie et collections ;
4. migration et rollback ;
5. architecture et fichiers ;
6. cycles et conversions ;
7. matrices financières avant/après ;
8. livraisons partielles ;
9. PDF ;
10. sauvegarde/restauration ;
11. commandes, codes et durées ;
12. E2E, hors-ligne et appareils ;
13. limites réglementaires ;
14. défauts restants ;
15. état Git final ;
16. décision finale.

Utilise exactement un verdict :

- `SPRINT 14 VALIDÉ` seulement si migration, automatisation et recette physique sont prouvées, et après validation des mentions requises pour l’usage visé ;
- `SPRINT 14 VALIDATION CONDITIONNELLE` si le code est conforme mais recette physique ou validation réglementaire reste absente ;
- `SPRINT 14 NON VALIDÉ` si un document préparatoire affecte les finances, si la migration perd des données, si une conversion double ou livraison excessive reste possible, ou si un P0/P1 demeure.

Commence maintenant par l’état Git et l’audit complet de `ESTIMATE`. Implémente ensuite sans écraser les Sprints 12/13, teste, corrige et rédige le rapport.

---
