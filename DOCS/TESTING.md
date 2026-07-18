# SAMTECH CRM — STRATÉGIE DE TESTS

**Document :** `TESTING.md`  
**Produit :** SAMTECH CRM  
**Éditeur :** SAMTECH  
**Version du document :** 1.0  
**Statut :** Stratégie de référence V1  
**Date :** Juillet 2026

---

# 1. Objet

Ce document définit la stratégie de tests de SAMTECH CRM V1 Starter.

Les tests doivent démontrer que l'application :

- respecte les règles métier ;
- protège l'intégrité des données ;
- calcule correctement factures et paiements ;
- fonctionne hors connexion ;
- résiste aux erreurs de stockage et fichiers invalides ;
- reste utilisable sur smartphone, tablette et ordinateur ;
- satisfait les critères d'acceptation documentés.

---

# 2. Objectifs qualité

La V1 doit offrir :

1. zéro défaut critique connu ;
2. zéro perte de données connue sur les parcours pris en charge ;
3. calculs financiers déterministes ;
4. migrations et restaurations vérifiables ;
5. parcours métier essentiels fonctionnels hors ligne ;
6. interface accessible et mobile-first ;
7. compatibilité avec les navigateurs cibles ;
8. traçabilité entre règles, code et tests.

---

# 3. Principes

## 3.1 Tester les risques

La priorité est donnée aux fonctionnalités dont l'échec causerait une perte de données, une erreur financière ou l'oubli d'un prospect.

## 3.2 Tester au bon niveau

Les règles pures sont testées sans navigateur. IndexedDB, le service worker et les parcours complets sont testés dans un environnement proche de la production.

## 3.3 Tests déterministes

Les tests ne dépendent pas de l'heure, du réseau ou de données aléatoires non contrôlées.

## 3.4 Isolation

Chaque test possède ses propres données et nettoie son environnement.

## 3.5 Pas de faux positifs

Un test ne doit pas seulement vérifier qu'un bouton existe ; il doit vérifier l'effet métier attendu.

## 3.6 Documentation vivante

Toute règle `BR-*` critique doit être reliée à un ou plusieurs tests.

---

# 4. Niveaux de tests

## 4.1 Tests unitaires

Portée : fonctions pures, objets-valeurs, validations, transitions et calculs.

Rapides, nombreux et exécutés à chaque modification.

## 4.2 Tests d'intégration

Portée : cas d'usage, dépôts Dexie, transactions, migrations, génération de données et import/export.

## 4.3 Tests de composants

Portée : formulaires, états, messages, accessibilité et interactions isolées.

## 4.4 Tests de parcours

Portée : application complète dans un navigateur de production avec Playwright.

## 4.5 Tests manuels

Portée : installation PWA, appareils réels, partage, WhatsApp, perception UX et limitations propres aux plateformes.

## 4.6 Tests pilotes

Portée : usage réel par un groupe d'utilisateurs représentatifs.

---

# 5. Outils envisagés

- Vitest ou Jest pour les tests unitaires ;
- Testing Library pour les composants React ;
- `fake-indexeddb` pour certains tests rapides, complété par des tests réels navigateur ;
- Playwright pour les parcours et navigateurs ;
- axe-core ou outil équivalent pour les vérifications automatiques d'accessibilité ;
- Lighthouse comme indicateur PWA et performance, sans en faire l'unique validation ;
- outils d'audit de dépendances et détection de secrets.

Le choix final est figé au Sprint 0.

---

# 6. Pyramide cible

Répartition indicative :

- 60 à 70 % tests unitaires ;
- 20 à 30 % tests d'intégration et composants ;
- 5 à 15 % tests de parcours ;
- tests manuels ciblés sur les fonctions non automatisables.

Cette répartition guide l'effort sans imposer un quota artificiel.

---

# 7. Niveaux de criticité

## P0 — Critique

- perte ou corruption de données ;
- erreur de calcul financier ;
- restauration destructive ;
- migration échouée avec effacement ;
- contournement de confirmation financière ;
- injection de script ;
- publication impossible à mettre à jour.

## P1 — Élevée

- conversion incohérente ;
- relance perdue ;
- paiement ou solde incorrect ;
- facture sans numéro unique ;
- campagne impossible à reprendre ;
- PWA inutilisable hors ligne.

## P2 — Moyenne

- filtre incorrect ;
- message ou état mal présenté ;
- PDF mal mis en page ;
- problème d'accessibilité important ;
- performance dégradée.

## P3 — Faible

- défaut visuel mineur ;
- microcopie ;
- alignement sans impact fonctionnel.

---

# 8. Environnements

## Développement

- données fictives ;
- tests rapides ;
- base isolée ;
- service worker désactivé ou contrôlé selon le besoin.

## Intégration continue

- installation reproductible ;
- tests unitaires et intégration ;
- build ;
- analyse statique ;
- parcours Chromium minimum.

## Préproduction

- build identique à la production ;
- HTTPS ;
- service worker actif ;
- données fictives réalistes ;
- tests multi-navigateurs et appareils.

## Production

- tests de fumée non destructifs ;
- vérification installation et mise à jour ;
- aucun usage de données client dans les tests.

---

# 9. Données de test

Les jeux de test couvrent :

- base vide ;
- petit jeu réaliste ;
- grands volumes ;
- caractères accentués ;
- noms longs ;
- numéros de plusieurs pays ;
- prospects convertis et perdus ;
- factures avec et sans taxe ;
- remises et quantités décimales ;
- paiements partiels ;
- campagnes interrompues ;
- références orphelines invalides ;
- sauvegardes anciennes et corrompues.

Toutes les identités sont fictives.

---

# 10. Tests du domaine Contact et téléphone

## Cas unitaires

- nettoyage des espaces et séparateurs ;
- normalisation avec indicatif ;
- numéros nationaux avec pays configuré ;
- conservation du format d'affichage ;
- rejet d'un numéro vide ou manifestement invalide ;
- comparaison de deux variantes du même numéro ;
- construction d'une URL WhatsApp ;
- encodage des retours à la ligne et accents.

## Règles liées

`BR-010` à `BR-016`.

## Critères

- aucune URL n'accepte un domaine arbitraire ;
- le numéro utilisé par WhatsApp est normalisé ;
- l'ouverture ne produit jamais automatiquement l'état Envoyé.

---

# 11. Tests Prospects

## Unitaires

- statut initial ;
- intérêt initial ;
- transitions permises ;
- motif Perdu ;
- réactivation ;
- validation des champs requis.

## Intégration

- création contact + profil prospect dans une transaction ;
- détection de doublon ;
- association de plusieurs produits ;
- unicité d'un intérêt produit ;
- ajout de tags ;
- archivage avec historique conservé ;
- recherche et filtres combinés.

## Parcours

1. ajouter un prospect ;
2. constater sa présence dans la liste ;
3. rechercher par téléphone ;
4. ajouter un produit et une note ;
5. modifier son statut ;
6. vérifier la chronologie.

## Règles liées

`BR-020` à `BR-033`.

---

# 12. Tests de conversion

## P0/P1

- le contact n'est pas dupliqué ;
- un seul profil client est créé ;
- le profil prospect passe à Converti ;
- la date est enregistrée ;
- les intérêts, notes, tags et relances restent accessibles ;
- l'événement est créé ;
- un échec dans une écriture annule toute la transaction ;
- une seconde conversion est refusée proprement ;
- la correction d'une conversion avec factures est bloquée.

## Règles liées

`BR-040` à `BR-046`.

---

# 13. Tests Localités, catégories et produits

## Localités

- hiérarchie valide ;
- absence de cycles ;
- doublon logique ;
- archivage d'une localité utilisée ;
- filtre par ville et quartier distincts.

## Produits

- nom requis ;
- prix positif ou nul ;
- taxe valide ;
- produit inactif absent des sélections normales ;
- historique conservé ;
- modification de prix sans effet sur facture existante.

## Règles liées

`BR-050` à `BR-064`.

---

# 14. Tests Relances

## Unitaires

- calcul Aujourd'hui selon fuseau ;
- détermination En retard ;
- prochaine relance ;
- priorité et tri ;
- transitions de statut.

## Intégration

- création et événement ;
- report clôturant l'ancienne et créant la nouvelle ;
- rollback si la nouvelle relance échoue ;
- réalisation avec note ;
- annulation ;
- plusieurs relances sur le même contact.

## Parcours

- créer une relance pour demain ;
- modifier l'horloge de test ;
- vérifier son passage à En retard ;
- ouvrir WhatsApp ;
- vérifier qu'elle reste planifiée ;
- confirmer la réalisation.

## Règles liées

`BR-070` à `BR-078`.

---

# 15. Tests Modèles de messages

- extraction des variables ;
- rejet d'une variable inconnue ;
- substitution de chaque variable ;
- valeur absente ;
- caractères accentués et emoji ;
- texte long ;
- retours à la ligne ;
- instantané indépendant du modèle modifié ;
- modèle archivé non proposé ;
- absence d'exécution HTML.

Règles : `BR-080` à `BR-084`.

---

# 16. Tests Campagnes

## Ciblage

- prospects ou clients ;
- plusieurs localités ;
- produits demandés ;
- produits achetés ;
- statuts et intérêts ;
- tags ;
- périodes ;
- combinaison ET/OU selon `BR-172`.

## Lancement

- liste figée ;
- exclusion des archivés ;
- exclusion des numéros invalides ;
- suppression des doublons ;
- ordre stable ;
- message résolu et figé ;
- transaction complète.

## Exécution

- ouverture WhatsApp sans confirmation automatique ;
- confirmation manuelle ;
- Ignorer et Erreur ;
- fermeture puis reprise ;
- progression exacte ;
- terminaison uniquement quand tous les états sont finaux.

## Règles liées

`BR-090` à `BR-099`.

---

# 17. Tests Factures

## Numérotation

- brouillon sans numéro définitif ;
- numéro attribué à l'émission ;
- séquence croissante ;
- format et padding ;
- changement d'année ;
- unicité ;
- transaction annulée sans facture partiellement émise ;
- comportement de la séquence après rollback.

## Validation

- client requis ;
- ligne requise ;
- quantité strictement positive ;
- prix non négatif ;
- date d'échéance ;
- devise uniforme ;
- modification après émission refusée ;
- annulation avec motif.

## Instantanés

- modification du client après émission ;
- modification de l'entreprise ;
- changement du produit et prix ;
- PDF utilisant toujours les anciennes valeurs.

## Règles liées

`BR-100` à `BR-113`.

---

# 18. Matrice de calcul financier

Tester au minimum :

| Cas | Quantité | Prix | Remise | Taxe | Attendu |
|---|---:|---:|---:|---:|---|
| Simple XOF | 2 | 10 000 | 0 | 0 % | 20 000 |
| Taxe | 1 | 10 000 | 0 | 18 % | 11 800 |
| Remise montant | 1 | 10 000 | 1 000 | 18 % | 10 620 |
| Remise pourcentage | 2 | 10 000 | 10 % | 0 % | 18 000 |
| Quantité décimale | 1,5 | 2 000 | 0 | 0 % | 3 000 |
| Plusieurs lignes | varié | varié | varié | varié | somme exacte |
| Prix nul | 1 | 0 | 0 | 0 % | 0 |
| Valeur maximale | limite | limite | — | — | erreur contrôlée ou résultat sûr |

Ajouter des tests basés sur propriétés :

- total jamais négatif ;
- somme des lignes égale au total ;
- remise jamais supérieure à sa base ;
- affichage, stockage et PDF identiques ;
- arrondi stable.

Règles : `BR-120` à `BR-129`.

## Preuves automatisées Sprint 5

- `migration-v7.test.ts` : schéma V6 réel, quinze tables préservées, ajout facture/lignes en V7 et réouverture sans perte.
- `invoice-calculation.test.ts` : XOF, devise à deux décimales, quantité mise à l’échelle, remises, taxes activées/désactivées, demi-unité, agrégation et dépassements.
- `invoice-usecases.test.ts` : brouillons, produit archivé, émission atomique, rollback, concurrence logique, instantanés, immutabilité et annulation.
- `invoice-pdf.test.ts` : signature, document chargeable, métadonnées issues des instantanés, trois statuts, pagination et nom sûr.
- `scripts/e2e-sprint5-test.js` : 38 critères sur serveur de production et véritable IndexedDB Chromium, avec PDF en ligne/hors ligne, fallback, annulation, persistance et compteurs navigateur nuls.

Le contrôle visuel couvre cinq spécimens sans coordonnées réelles : A4 simple, huit pages avec en-têtes répétés, textes et notes longs, accents français/`œ`/`€`, et facture annulée. Toutes leurs pages sont rendues en PNG et inspectées ; le texte est extrait localement afin de vérifier accents, montants, client, entreprise, lignes, totaux et pieds de page.

---

# 19. Tests Paiements

- montant nul ou négatif refusé ;
- paiement sur brouillon refusé ;
- premier paiement partiel ;
- deuxième paiement soldant ;
- paiement exact ;
- surpaiement refusé ;
- unité minimale de devise ;
- statut facture recalculé ;
- renversement d'un paiement ;
- retour de Payée à Partiellement payée après renversement ;
- paiement sur facture annulée refusé ;
- rollback en cas d'échec d'événement ;
- total encaissé cohérent.

Règles : `BR-130` à `BR-138`.

---

# 20. Tests Statistiques

## Prospection

- nombre total ;
- actifs uniquement ;
- convertis comptés historiquement ;
- produits demandés sans doublon ;
- localités par niveau.

## Conversion

- cohorte par date de création ;
- période vide ;
- division par zéro ;
- affichage du périmètre.

## Ventes

- factures émises ;
- factures annulées exclues ;
- quantités vendues ;
- montant facturé ;
- montant encaissé par date de paiement ;
- créances ;
- factures en retard.

## Règles liées

`BR-140` à `BR-150`.

---

# 21. Tests Chronologie

- création de chaque type d'événement ;
- ordre stable ;
- lien vers l'entité source ;
- correction produisant un nouvel événement ;
- événement automatique non modifiable comme note ;
- payload versionné ;
- absence de données sensibles inutiles ;
- événement conservé après archivage.

Règles : `BR-160` à `BR-163`.

---

# 22. Tests Recherche et filtres

- casse ;
- accents ;
- espaces ;
- nom partiel ;
- numéro formaté ou normalisé ;
- plusieurs valeurs d'un même filtre ;
- filtres de catégories différentes ;
- archives exclues ;
- tri stable ;
- retour depuis une fiche conservant les filtres ;
- aucun résultat.

Règles : `BR-170` à `BR-174`.

---

# 23. Tests IndexedDB et dépôts

- ouverture de base neuve ;
- création des 22 tables ;
- présence des index ;
- unicités ;
- mapping ligne/modèle métier ;
- requêtes par index ;
- transaction réussie ;
- rollback après exception ;
- concurrence logique entre deux onglets ;
- fermeture de base ;
- erreur de quota simulée ;
- données archivées ;
- diagnostic de références orphelines.

Les tests utilisant `fake-indexeddb` sont complétés par des tests dans Chromium, Firefox si ciblé et WebKit.

---

# 24. Tests de migrations

Pour chaque version N → N+1 :

1. créer une base N réaliste ;
2. enregistrer son résumé et contrôle ;
3. ouvrir avec le code N+1 ;
4. exécuter la migration ;
5. vérifier les données et index ;
6. exécuter le diagnostic d'intégrité ;
7. utiliser les parcours critiques ;
8. vérifier qu'une nouvelle ouverture ne rejoue pas incorrectement la migration.

Cas d'échec :

- exception au milieu ;
- espace insuffisant ;
- valeur ancienne inattendue ;
- base partiellement corrompue ;
- application fermée ;
- deux onglets ouverts.

Aucune stratégie de test ne doit accepter l'effacement silencieux comme résultat.

---

# 25. Tests Sauvegarde

- export d'une base vide ;
- export d'une base complète ;
- version, date et métadonnées ;
- toutes les collections attendues ;
- UTF-8 ;
- caractères spéciaux ;
- gros volume ;
- contrôle d'intégrité ;
- absence du PIN en clair ;
- nom de fichier sûr ;
- export hors ligne ;
- fichier généré relisible immédiatement.

Règles : `BR-180` à `BR-187` et `BR-210` à `BR-213`.

---

# 26. Tests Restauration

- sauvegarde valide même version ;
- ancienne version compatible ;
- version future inconnue ;
- JSON invalide ;
- format inconnu ;
- collection manquante ;
- type de champ invalide ;
- référence orpheline ;
- doublon de clé ;
- fichier surdimensionné ;
- payload profond ;
- contrôle d'intégrité invalide ;
- annulation avant confirmation ;
- erreur en cours de transaction ;
- base précédente conservée ;
- diagnostic final réussi.

Scénario P0 : exporter une base, effacer la base de test, restaurer, puis comparer toutes les données métier.

---

# 27. Tests du PIN

- création et confirmation ;
- PIN trop court ;
- absence de stockage en clair ;
- hash et sel présents ;
- bon PIN ;
- mauvais PIN ;
- délai après échecs ;
- remise à zéro après succès ;
- verrouillage après inactivité ;
- verrouillage manuel ;
- retour après arrière-plan ;
- comportement après redémarrage ;
- procédure PIN oublié : avertissement, confirmation renforcée, effacement local, restauration facultative et nouveau PIN ;
- désactivation avec confirmation.

Les tests doivent confirmer les limites documentées et ne pas revendiquer le chiffrement d'IndexedDB.

Un scénario critique doit vérifier que l'abandon avant la confirmation du PIN oublié ne modifie aucune donnée.

---

# 28. Tests PWA

- manifeste valide ;
- nom et icônes ;
- mode d'affichage ;
- installation ;
- service worker enregistré ;
- ressources précachées ;
- démarrage sans réseau ;
- navigation hors ligne ;
- module PDF disponible hors ligne ;
- mise à jour détectée ;
- application différée pendant une saisie ;
- ancien cache nettoyé sans toucher aux données ;
- récupération après service worker défectueux.

Les tests sont exécutés sur un build de production servi en HTTPS ou environnement équivalent.

---

# 29. Tests hors ligne

En mode réseau coupé :

- créer un prospect ;
- modifier un produit ;
- programmer une relance ;
- convertir un client ;
- créer une facture ;
- générer un PDF ;
- enregistrer un paiement ;
- préparer une campagne ;
- consulter les statistiques ;
- exporter et restaurer.

Chaque action doit être vérifiée après fermeture et réouverture sans réseau.

---

# 30. Tests WhatsApp

## Automatisés

- URL et numéro ;
- encodage du message ;
- variables ;
- résultat Ouvert distinct de Envoyé ;
- fallback Copier.

## Manuels

- Android avec WhatsApp ;
- iPhone avec WhatsApp ;
- ordinateur avec WhatsApp Web/Desktop ;
- absence de WhatsApp ;
- hors ligne ;
- retour à la PWA ;
- messages longs et emoji.

Aucun test ne doit envoyer automatiquement un message réel à un contact externe.

---

# 31. Tests PDF

- facture courte ;
- 1, 10, 50 et 100 lignes ;
- multipage ;
- noms longs ;
- accents ;
- logo absent et présent ;
- taxes multiples ;
- remise ;
- XOF sans décimales ;
- devise à deux décimales ;
- totaux identiques au domaine ;
- statut et solde ;
- impression A4 ;
- téléchargement ;
- partage ;
- fonctionnement hors ligne.

Les PDF sont comparés visuellement et par extraction des valeurs critiques.

---

# 32. Tests de composants

Pour chaque formulaire :

- libellés ;
- requis ;
- messages d'erreur ;
- saisie clavier ;
- soumission ;
- double clic ;
- état en cours ;
- conservation après erreur ;
- annulation ;
- navigation avec données non enregistrées.

Pour chaque liste :

- chargement ;
- vide ;
- données ;
- erreur ;
- recherche ;
- filtres ;
- pagination ou virtualisation ;
- archivage.

---

# 33. Tests d'accessibilité

## Automatisés

- labels ;
- rôles ;
- contraste détectable ;
- attributs ARIA ;
- structure des titres ;
- formulaires ;
- modales.

## Manuels

- navigation clavier ;
- focus ;
- lecteur d'écran sur parcours critiques ;
- zoom à 200 % ;
- texte agrandi sur mobile ;
- réduction des animations ;
- perception sans couleur ;
- zones tactiles.

Objectif : WCAG 2.2 AA lorsque applicable.

---

# 34. Tests responsive

Largeurs minimales :

- 320 px ;
- 360/390 px ;
- 768 px ;
- 1024 px ;
- 1440 px.

Vérifier :

- navigation ;
- barres fixes et zones sûres ;
- formulaires ;
- cartes ;
- graphiques ;
- panneau de filtres ;
- lignes de facture ;
- clavier virtuel ;
- orientation paysage ;
- absence de défilement horizontal essentiel.

---

# 35. Matrice navigateurs et appareils

## Automatisés

- Chromium récent ;
- WebKit via Playwright ;
- Firefox si officiellement pris en charge.

## Appareils réels

- Android milieu de gamme avec Chrome ;
- iPhone récent avec Safari/PWA ;
- iPhone plus ancien encore supporté ;
- tablette représentative ;
- ordinateur Windows avec Chrome et Edge.

La matrice exacte est associée à chaque version publiée.

---

# 36. Tests de performance

Avec les volumes de `DATABASE.md` :

- démarrage ;
- ouverture de la base ;
- recherche ;
- filtre combiné ;
- liste de relances ;
- fiche avec longue chronologie ;
- statistiques ;
- lancement de campagne ;
- sauvegarde ;
- restauration ;
- génération PDF.

Mesurer sur téléphone, pas seulement sur poste de développement.

Les seuils précis sont fixés après le prototype. Une régression significative bloque la livraison.

---

# 37. Tests de sécurité

- XSS dans tous les textes ;
- HTML dans notes et messages ;
- URL manipulée ;
- sauvegarde malveillante ;
- taille et profondeur ;
- absence de secret dans le bundle ;
- CSP et en-têtes ;
- journaux sans données personnelles ;
- dépendances auditées ;
- service worker limité ;
- PIN non stocké en clair ;
- action destructive confirmée ;
- montants extrêmes.

Les défauts critiques et élevés bloquent la publication.

---

# 38. Tests de résilience

Simuler :

- fermeture pendant une saisie ;
- fermeture après écriture ;
- fermeture pendant campagne ;
- coupure réseau ;
- quota insuffisant ;
- migration interrompue ;
- service worker obsolète ;
- cache manquant ;
- fichier de sauvegarde incomplet ;
- deux onglets modifiant la même facture ;
- horloge de l'appareil modifiée.

Le résultat attendu privilégie la cohérence et une récupération explicite.

---

# 39. Parcours E2E critiques

## E2E-01 — Prospect à relance

Créer prospect → associer produit → programmer relance → mode hors ligne → rouvrir → exécuter → confirmer.

## E2E-02 — Prospect à client

Créer prospect → ajouter historique → convertir → vérifier identité unique et historique.

## E2E-03 — Vente et paiement

Client → facture à plusieurs lignes → émission → PDF → paiement partiel → deuxième paiement → facture payée.

## E2E-04 — Campagne

Créer contacts → filtrer → figer destinataires → traiter certains → fermer → reprendre → terminer.

## E2E-05 — Sauvegarde

Créer données → exporter → réinitialiser base de test → restaurer → comparer → utiliser les parcours.

## E2E-06 — Mise à jour

Installer version N → créer données → publier N+1 avec migration → mettre à jour → vérifier données et mode hors ligne.

---

# 40. Tests de fumée

Après chaque déploiement :

- page d'accueil charge ;
- base s'ouvre ;
- création puis suppression d'une donnée de test isolée dans l'environnement prévu ;
- navigation principale ;
- service worker ;
- manifeste ;
- hors ligne ;
- génération d'un PDF de test ;
- aucune erreur critique dans la console.

En production, les tests ne doivent pas modifier les données d'un utilisateur.

---

# 41. Tests de régression

Une correction doit ajouter un test qui échoue avant le correctif et réussit après, lorsque cela est automatisable.

La suite de régression prioritaire inclut toujours :

- calculs ;
- conversion ;
- numérotation ;
- paiements ;
- migrations ;
- sauvegarde/restauration ;
- offline ;
- XSS ;
- campagne reprise.

---

# 42. Couverture

La couverture de code est un indicateur, non une preuve de qualité.

Objectifs indicatifs :

- domaine financier et règles critiques : très forte couverture de branches ;
- cas d'usage critiques : forte couverture ;
- composants : interactions importantes ;
- code généré ou trivial : pas de quota artificiel.

Toute branche métier non testée dans un module P0/P1 doit être justifiée.

---

# 43. Traçabilité

Chaque test critique inclut :

- identifiant de test ;
- règles `BR-*` ;
- fonctionnalité ;
- niveau ;
- priorité ;
- données ;
- résultat attendu.

Exemple :

```text
INV-PAY-004
Règles : BR-133, BR-135, BR-136
Scénario : deux paiements soldent exactement une facture
Niveau : intégration
Priorité : P0
```

---

# 44. Gestion des défauts

Chaque défaut contient :

- résumé ;
- version ;
- appareil et navigateur ;
- étapes ;
- résultat attendu et observé ;
- impact ;
- criticité ;
- captures sans données réelles ;
- diagnostic non sensible ;
- règle concernée.

Les défauts P0/P1 bloquent la livraison sauf décision exceptionnelle documentée.

---

# 45. Critères d'entrée d'un sprint

- fonctionnalité documentée ;
- règles identifiées ;
- critères d'acceptation ;
- modèle de données validé ;
- dépendances connues ;
- cas de tests préparés ;
- maquette ou parcours disponible.

---

# 46. Définition de terminé

Une fonctionnalité est terminée si :

- code revu ;
- règles respectées ;
- tests unitaires et intégration ajoutés ;
- parcours critique testé ;
- responsive vérifié ;
- accessibilité vérifiée ;
- hors ligne vérifié ;
- erreurs gérées ;
- documentation mise à jour ;
- aucun défaut bloquant ouvert.

---

# 47. Critères de sortie de la bêta

- zéro P0 ouvert ;
- zéro P1 ouvert sans décision formelle ;
- suite automatique réussie ;
- parcours critiques réussis sur Android et iPhone ;
- sauvegarde/restauration validée ;
- migration validée ;
- calculs financiers vérifiés ;
- PWA installable et hors ligne ;
- retours pilotes prioritaires traités ;
- documentation utilisateur disponible.

---

# 48. Groupe pilote

Entre 5 et 15 utilisateurs :

- activités différentes ;
- Android et iPhone ;
- niveaux techniques variés ;
- bases de tailles différentes.

Ils utilisent des données de test ou donnent un consentement éclairé avant toute donnée réelle. Une procédure de sauvegarde est fournie avant le pilote.

---

# 49. Suivi pilote

Mesurer :

- activation et installation ;
- premier prospect ;
- relances effectuées ;
- conversions ;
- factures créées ;
- sauvegardes réalisées ;
- erreurs ;
- demandes d'aide ;
- compréhension du mode local ;
- satisfaction et volonté de payer.

La V1 n'ayant pas de télémétrie distante par défaut, ces mesures peuvent être recueillies par entretien, formulaire ou export volontaire non sensible.

---

# 50. Automatisation CI

Pour chaque proposition de modification :

1. installation avec lockfile ;
2. contrôle des secrets ;
3. format ;
4. lint ;
5. TypeScript ;
6. tests unitaires ;
7. tests d'intégration ;
8. build ;
9. parcours de fumée ;
10. rapport.

Pour la branche principale et les versions :

- multi-navigateurs ;
- accessibilité ;
- audit dépendances ;
- test PWA ;
- test de migration ;
- artefact versionné.

---

# 51. Responsabilités

## Propriétaire produit

- valide les critères métier ;
- arbitre les priorités ;
- accepte la recette.

## Développeur ou IA

- ajoute les tests ;
- fournit les preuves ;
- ne modifie pas une règle silencieusement ;
- documente les limites.

## Relecteur

- vérifie code, tests, risques et documentation.

## Utilisateur pilote

- exécute les parcours réels ;
- signale les incompréhensions et erreurs.

---

# 52. Utilisation de Gemini et Codex

Toute tâche confiée à une IA doit indiquer :

- documents de référence ;
- module limité ;
- règles `BR-*` ;
- tests à créer ;
- commandes de vérification ;
- interdiction d'élargir le périmètre ;
- format du rapport final.

Une réponse indiquant « le code devrait fonctionner » n'est pas une validation. L'IA doit exécuter les tests disponibles et rapporter les résultats réels.

---

# 53. Rapport de validation

Pour chaque sprint :

```text
Sprint :
Version :
Fonctionnalités :
Règles couvertes :
Tests ajoutés :
Tests exécutés :
Résultats :
Navigateurs/appareils :
Mode hors ligne :
Défauts ouverts :
Risques résiduels :
Décision : validé / à corriger
```

---

# 54. Prochaine étape

Après validation de `TESTING.md`, créer `PROMPTS_GEMINI.md` pour transformer la documentation en instructions de développement contrôlées, sprint par sprint.

---

# 55. Convention E2E locale

Les scénarios navigateur démarrent leur propre serveur de production sur un port configurable, 3100 par défaut. Un port déjà occupé provoque un échec : aucun serveur étranger ou ancien n'est réutilisé. Le script attend explicitement l'état prêt et ne ferme que le processus qu'il a créé.

Le scénario Sprint 3 `scripts/e2e-sprint3-test.js` applique la même convention sur le port 3200 par défaut (`E2E_PORT` reste configurable), afin de rester distinct du scénario Sprint 2 et de tout serveur de développement utilisateur.

Les écouteurs `console`, `pageerror` et `requestfailed` sont installés avant la première navigation. Toute erreur console, exception non gérée ou requête échouée en ligne bloque le scénario. Les requêtes réseau après passage volontaire hors ligne sont comptées séparément. L'annulation `net::ERR_ABORTED` d'une requête RSC obsolète par une navigation Next.js immédiate est la seule exception en ligne documentée et reste comptabilisée dans le rapport.

---

# 56. Principe directeur

**Une fonctionnalité n'est terminée que lorsque son résultat métier, ses données, ses erreurs et son fonctionnement hors ligne ont été vérifiés.**

---

# 57. Validation automatisée du Sprint 4

Les tests métier de conversion vérifient l’identité unique, l’index de profil client unique, le statut et la date, le même `contactId` sur le profil, les relances et les événements, la conservation des intérêts, notes, tags et identifiants d’événements, l’ordre stable de la chronologie, le rollback intégral après deux écritures réussies, le refus d’une seconde conversion, le statut manuel interdit, le retour interdit, le prospect perdu, les archives et les recherches/filtres.

Le scénario `scripts/e2e-sprint4-test.js` lance son propre serveur de production sur le port 3300 par défaut. Il vérifie 28 critères sur Chromium réel : prospect, localité, deux intérêts, relances passée et future, événements, confirmation, identité unique, listes, recherches nom/téléphone/entreprise, filtres localité/date, fiche 360°, notes rendues comme texte, ordre et unicité de la chronologie, seconde conversion non proposée, actualisation, persistance IndexedDB, liste et fiche hors ligne. Comme les scénarios précédents, toute erreur console, exception de page ou panne réseau en ligne inattendue est bloquante ; les annulations RSC ne sont admises que dans une fenêtre de navigation identifiée.

La preuve de migration `migration-v5.test.ts` exerce successivement V4, V5 et V6, ferme puis rouvre la même base et vérifie toutes les tables anciennes et nouvelles sans suppression de base entre les étapes.

---

# 58. Validation automatisée du Sprint 6

Les tests du domaine vérifient l’arithmétique exacte, les statuts, l’exclusion des paiements contrepassés et la conversion stricte d’un montant saisi vers l’unité minimale. Les tests de cas d’usage couvrent les six modes, les versements partiels, le solde exact, les entrées invalides, les dates historiques, devise et échelle, surpaiement simple et concurrent, rollback, contrepassations successives, correction et annulation de facture protégée par relecture des paiements actifs.

`migration-v8.test.ts` prouve la migration réelle V7 → V8 et la persistance après fermeture/réouverture sans suppression intermédiaire. Les tests PDF couvrent les états `EMISE`, `PARTIELLEMENT_PAYEE` et `PAYEE` avec les agrégats courants.

`scripts/e2e-sprint6-test.js` démarre son propre build de production sur le port 3500 par défaut et vérifie 42 critères dans Chromium mobile 390×844 : Wave 30 %, espèces 20 %, refus du surpaiement, solde exact, filtres et totaux, créances, contrepassation motivée, annulation protégée puis autorisée, chronologie, trois états PDF, et encaissement/rechargement/PDF hors ligne. Les compteurs console, exceptions, réseau et annulations RSC sont tous publiés dans le rapport.

---

# 59. Validation automatisée du Sprint 7

Les tests purs couvrent audiences, descendant de localité, produits demandés et achetés, exclusion des brouillons et annulations, statuts, intérêt, tags, source, périodes, inactivité, critères combinés, archives, numéros invalides, exclusion manuelle, variables, déduplication et ordre stable.

Les tests de cas d’usage couvrent création, modification, validation, transitions, lancement atomique, rollback, instantanés, mutations postérieures, ouverture sans confirmation, confirmation manuelle, ignorance, erreur abandonnée, progression, reprise, fin, annulation renforcée, immutabilité et réouverture IndexedDB. `migration-v9.test.ts` prouve séparément V8 → V9 sans perte.

`scripts/e2e-sprint7-test.js` lance son propre serveur de production sur le port 3600 et vérifie 45 critères en Chromium 390×844. Le lien WhatsApp exact est inspecté mais jamais suivi. Le scénario couvre exclusions, déduplication, variable manquante, audience figée, quatre destinataires, trois issues, chronologie, reprise et fin hors ligne, avec compteurs console/réseau/RSC.

---

# 60. Validation automatisée du Sprint 8

Les tests purs couvrent périodes inclusives, fuseau Dakar, cohorte vide et conversion ultérieure, délai, non-chevauchement des relances, demandes distinctes, quantités multi-échelles, lignes gratuites, factures annulées, paiements contrepassés, créances courantes, multi-devise, séries à zéro et détection d’intégrité. Les tests de composants contrôlent libellé graphique, alternative textuelle, état vide sans `NaN` et période personnalisée.

`statistics-volume.test.ts` génère séparément 10 000 contacts, 20 000 intérêts, 2 000 factures, 10 000 lignes, 5 000 paiements, 20 000 relances et des campagnes. Il vérifie les résultats et une limite de 10 secondes pour le moteur pur. La complexité visée est O(C + P + I + F + L + E + R), hors tris des classements O(k log k); la lecture Dexie et le rendu ne font pas partie du chronométrage pur.

`scripts/e2e-sprint8-test.js` démarre le build sur le port 3600 et vérifie 33 critères en Chromium 390×844 : vide, seed, totaux, cohorte, relances, produits, trois flux financiers, exclusions, répartitions, périodes, séries, reprise, raccourcis, actualisation locale, persistance, multi-devise, accessibilité et recalcul hors ligne. Les compteurs console, page et réseau sont publiés.

---

# 61. Validation automatisée du Sprint 9

- `backup.test.ts` couvre base vide, vingt collections, UTF-8, exclusion de sécurité, dernière date, remplacement, conservation du PIN, formats invalides, checksum, collection absente, doublon, référence orpheline, montant négatif et rollback injecté.
- `security.test.ts` couvre format, confirmation, absence de clair, sels distincts, vérification, compteur, délai, remise à zéro, modification, désactivation et réinitialisation renforcée.
- `security-gate.test.tsx` prouve que les enfants sensibles ne sont pas rendus, que le verrouillage manuel/rechargement agit et que l'effacement exige la phrase exacte.
- `migration-v10.test.ts` prouve V9 → V10 avec les vingt tables préservées et réouverture.
- `scripts/e2e-sprint9-test.js` exécute 36 étapes en build de production Chromium mobile : fichier réellement téléchargé, checksum recalculé, corruptions et version future, restauration relationnelle, PIN, délai, inactivité, rechargement, oubli, nouvelle activation et parcours hors ligne. Il publie séparément console, page, réseau, RSC et hors-ligne.

---

# 62. Validation automatisée du Sprint 10

- `test:accessibility` audite 24 écrans avec axe-core WCAG A/AA/2.1/2.2 et contrôle le lien d’évitement ainsi que le focus du PIN et de la confirmation destructive.
- `test:responsive` exerce 14 routes, six largeurs et le paysage, soit 85 contrôles, en distinguant les conteneurs de défilement intentionnels.
- `test:performance` injecte cinq fois un jeu déterministe représentatif et publie minimum, médiane, moyenne et maximum par scénario ainsi que la taille du bundle.
- `test:lighthouse` mesure en profil mobile le tableau de bord et les prospects avec les quatre catégories et les métriques FCP, LCP, TBT et CLS.
- `test:pwa-update` vérifie scope, contrôleur, mise à jour, conservation IndexedDB et rechargement hors ligne.
- `test:v1-beta` couvre 40 étapes et 41 assertions du parcours transversal, sans suivre le lien WhatsApp.
- `financial-v1-beta-reference.test.ts` documente deux calculs financiers attendus en unités minimales et les paiements partiels/final/renversé/trop-perçu.
