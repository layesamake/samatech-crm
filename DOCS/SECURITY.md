# SAMTECH CRM — SÉCURITÉ

**Document :** `SECURITY.md`  
**Produit :** SAMTECH CRM  
**Éditeur :** SAMTECH  
**Version du document :** 1.0  
**Statut :** Politique de référence V1  
**Date :** Juillet 2026

---

# 1. Objet

Ce document définit les objectifs, menaces, contrôles et limites de sécurité de SAMTECH CRM V1 Starter.

La V1 est une PWA mono-utilisateur, offline-first, sans backend métier, sans compte cloud et sans gestion des licences. Les données sont conservées dans IndexedDB sur l'appareil de l'utilisateur.

La sécurité doit protéger :

- les coordonnées des prospects et clients ;
- les notes commerciales ;
- les relances et campagnes ;
- les factures et paiements ;
- les paramètres de l'entreprise ;
- les sauvegardes ;
- l'intégrité des calculs et documents.

---

# 2. Principes

## 2.1 Transparence

Le produit ne doit pas présenter le PIN ou IndexedDB comme une protection inviolable.

## 2.2 Défense en profondeur

La sécurité repose sur plusieurs mesures complémentaires : appareil protégé, origine HTTPS, code sûr, validation, PIN, sauvegardes et mises à jour.

## 2.3 Moindre privilège

L'application ne demande que les autorisations nécessaires à une action comprise par l'utilisateur.

## 2.4 Minimisation

Seules les données utiles au CRM sont collectées et conservées.

## 2.5 Sécurité par défaut

Les configurations initiales évitent l'exposition inutile, les contenus distants et l'exécution de données importées.

## 2.6 Pas de secret dans le client

Une PWA distribuée ne peut pas protéger durablement une clé secrète intégrée à son code. Aucun secret serveur, clé privée ou mécanisme de licence sensible ne doit être embarqué.

---

# 3. Périmètre

## Inclus

- sécurité du code PWA ;
- sécurité de l'origine Web ;
- données IndexedDB ;
- PIN local ;
- formulaires et affichage ;
- exports, sauvegardes et restaurations ;
- PDF ;
- liens WhatsApp ;
- dépendances ;
- mises à jour et service worker ;
- journalisation locale ;
- pratiques de développement.

## Hors périmètre V1

- authentification distante ;
- sécurité d'une API métier ;
- synchronisation cloud ;
- contrôle d'accès multi-utilisateur ;
- licences ;
- paiements en ligne ;
- API WhatsApp Business ;
- gestion centralisée des appareils ;
- effacement distant.

---

# 4. Actifs à protéger

| Actif | Sensibilité | Risque principal |
|---|---:|---|
| Coordonnées des contacts | Élevée | divulgation ou export non autorisé |
| Notes et intérêts commerciaux | Élevée | atteinte à la confidentialité |
| Factures et paiements | Élevée | modification, fraude ou perte |
| Historique commercial | Moyenne à élevée | altération ou perte |
| Paramètres de l'entreprise | Moyenne | documents incorrects |
| PIN dérivé | Élevée | contournement du verrouillage |
| Sauvegardes | Très élevée | copie complète des données |
| Code applicatif | Moyenne | altération ou dépendance compromise |
| Numérotation et calculs | Élevée | incohérence financière |

---

# 5. Modèle de menace

## 5.1 Personne ayant accès au téléphone déverrouillé

Elle peut tenter d'ouvrir la PWA et consulter les données.

Mesures : verrouillage de l'appareil, PIN de l'application, verrouillage après inactivité et masquage des aperçus.

## 5.2 Personne ayant accès au profil du navigateur

Un utilisateur avancé ou un logiciel local peut inspecter IndexedDB.

Mesures : sécurité de l'appareil, profils séparés, PIN comme barrière d'interface et communication claire des limites.

## 5.3 Script injecté dans l'origine

Une faille XSS pourrait lire ou modifier toutes les données locales accessibles à l'application.

Mesures : échappement, interdiction du HTML arbitraire, CSP, dépendances contrôlées et validation stricte.

## 5.4 Dépendance compromise

Une bibliothèque malveillante pourrait accéder aux données au moment du build ou dans le navigateur.

Mesures : dépendances minimales, verrouillage des versions, audits, revue des mises à jour et inventaire.

## 5.5 Sauvegarde volée

Une sauvegarde non protégée peut exposer toute la base.

Mesures : avertissement, chiffrement facultatif recommandé, mot de passe distinct et stockage sûr.

## 5.6 Sauvegarde malveillante

Un fichier modifié peut tenter de provoquer une corruption, une injection ou un déni de service.

Mesures : limites de taille, validation structurelle, absence d'évaluation de code, transactions et contrôle d'intégrité.

## 5.7 Service worker compromis ou obsolète

Un service worker incorrect peut servir une version vulnérable ou bloquer les mises à jour.

Mesures : HTTPS, portée limitée, cache versionné, processus de mise à jour et procédure de récupération.

## 5.8 Appareil perdu ou compromis

Les protections de la PWA peuvent être contournées sur un appareil compromis.

Mesures : verrouillage système, chiffrement de l'appareil, sauvegardes protégées et absence de fausse promesse.

---

# 6. Limites de sécurité de la V1

La V1 ne peut pas garantir :

- la protection contre un appareil rooté, jailbreaké ou infecté ;
- le secret absolu des données face à un utilisateur contrôlant le navigateur ;
- l'effacement à distance ;
- la récupération d'un PIN sans mécanisme externe ;
- une sauvegarde automatique après perte de l'appareil ;
- la preuve qu'un message WhatsApp a été envoyé ;
- l'authenticité d'une installation copiée ;
- une protection anti-piratage comparable à un service SaaS.

Ces limites doivent être expliquées dans la documentation commerciale et utilisateur.

---

# 7. Sécurité de l'origine Web

## Exigences

- production accessible uniquement en HTTPS ;
- redirection HTTP vers HTTPS ;
- HSTS après validation du domaine et du déploiement ;
- certificat valide ;
- absence de contenu mixte ;
- domaine officiel clairement communiqué ;
- environnements de test séparés de la production.

Les données IndexedDB sont liées à l'origine. Changer de domaine, protocole ou sous-domaine peut créer un nouvel espace de stockage inaccessible à l'application précédente.

---

# 8. En-têtes de sécurité

La production doit configurer au minimum, selon les besoins réels :

- `Content-Security-Policy` ;
- `Strict-Transport-Security` ;
- `X-Content-Type-Options: nosniff` ;
- `Referrer-Policy` restrictive ;
- `Permissions-Policy` restrictive ;
- protection contre l'intégration dans un cadre via CSP `frame-ancestors` ;
- politique d'isolation supplémentaire si elle est compatible.

Les valeurs exactes doivent être testées. Une politique CSP ne doit pas être désactivée pour contourner un problème de bibliothèque.

---

# 9. Content Security Policy

Objectifs :

- scripts provenant uniquement de l'application ;
- absence de `unsafe-eval` en production ;
- styles contrôlés selon les contraintes de Next.js ;
- images limitées à l'origine, `blob:` et `data:` lorsque nécessaire ;
- connexions réseau limitées aux destinations explicitement autorisées ;
- interdiction d'objets et de cadres non nécessaires ;
- `base-uri 'self'` ;
- `form-action 'self'` si applicable.

Les URL WhatsApp sont ouvertes par navigation explicite et ne justifient pas une politique réseau générale permissive.

---

# 10. Protection contre les injections

## Texte utilisateur

Les noms, notes, descriptions, messages et références sont traités comme du texte.

## HTML

- ne pas utiliser `dangerouslySetInnerHTML` avec une donnée utilisateur ;
- si du texte riche est ajouté ultérieurement, utiliser une liste limitée de balises et un assainissement reconnu ;
- ne jamais exécuter le HTML contenu dans une sauvegarde.

## Formules de tableur

Tout futur export CSV doit neutraliser les cellules commençant par `=`, `+`, `-` ou `@` selon la stratégie documentée.

## PDF

Les données injectées dans le PDF sont échappées et limitées. Les URL et pièces jointes actives ne sont pas ajoutées sans validation.

---

# 11. Validation des entrées

La validation intervient :

1. dans le formulaire pour aider l'utilisateur ;
2. dans le cas d'usage ;
3. dans le domaine pour protéger les invariants ;
4. lors de toute désérialisation d'un fichier.

Les limites doivent être définies pour :

- longueurs de noms et notes ;
- numéros et emails ;
- quantités et montants ;
- taux de taxe et remises ;
- tailles d'images ;
- nombre de destinataires ;
- taille des sauvegardes ;
- profondeur des objets importés.

---

# 12. PIN local

## Objectif

Le PIN protège l'accès courant à l'interface lorsqu'une autre personne utilise le même appareil.

## Règles

- minimum 4 chiffres ;
- possibilité de 6 chiffres recommandée ;
- confirmation lors de la création ;
- jamais stocké en clair ;
- délai progressif après échecs ;
- verrouillage après inactivité ;
- option de verrouillage manuel ;
- aucune indication permettant de deviner le PIN.

## Limite

Le PIN ne chiffre pas automatiquement IndexedDB et ne protège pas contre une inspection avancée du navigateur ou un appareil compromis.

---

# 13. Dérivation du PIN

La valeur stockée doit provenir d'une fonction de dérivation avec :

- sel aléatoire unique ;
- paramètres versionnés ;
- coût adapté aux appareils mobiles ;
- comparaison sans exposition du PIN ;
- utilisation de Web Crypto lorsque possible.

Une preuve de concept doit mesurer les performances sur un téléphone courant. Le choix final doit être documenté et testable.

Il est interdit d'utiliser un simple hash rapide non salé comme SHA-256 du PIN.

---

# 14. Tentatives et verrouillage

Stratégie initiale indicative :

- 5 échecs : délai court ;
- répétition des échecs : délai progressif ;
- affichage du temps restant ;
- remise à zéro après succès ;
- horodatage conservé localement.

Cette mesure ralentit les essais opportunistes, mais un attaquant contrôlant le stockage peut tenter de contourner le compteur. Elle ne doit pas être présentée comme un contrôle serveur.

---

# 15. PIN oublié

Sans compte cloud ni secret externe, la V1 ne prévoit aucune récupération du PIN et aucune porte dérobée.

La procédure retenue est :

1. avertir que la réinitialisation effacera toutes les données locales ;
2. demander une confirmation renforcée ;
3. réinitialiser complètement l'espace local ;
4. permettre la restauration d'une sauvegarde valide ;
5. demander la création d'un nouveau PIN.

Si aucune sauvegarde n'existe, les données locales ne sont pas récupérables. Aucune question secrète faible ni phrase de récupération n'est prévue dans la V1.

---

# 16. Verrouillage de session

L'application doit se verrouiller :

- après la durée d'inactivité configurée ;
- après une action manuelle ;
- lorsque la visibilité reste absente au-delà d'un délai défini ;
- au redémarrage selon les paramètres.

Les formulaires doivent être enregistrés avant verrouillage lorsque c'est possible, sans conserver de secret en mémoire plus longtemps que nécessaire.

---

# 17. IndexedDB

## Protection attendue

IndexedDB isole les données par origine et profil de navigateur.

## Limites

- données inspectables par une personne contrôlant le navigateur ;
- données supprimables par l'utilisateur ou le système ;
- stockage non équivalent à un coffre-fort ;
- protection dépendante de l'appareil et du navigateur.

## Règles

- ne pas dupliquer les données sensibles dans `localStorage` ;
- ne pas mettre les données dans Cache Storage ;
- ne pas conserver de données dans les URL ;
- limiter les blobs ;
- fermer proprement les transactions ;
- tester les migrations ;
- demander le stockage persistant lorsque pertinent.

---

# 18. Chiffrement local

Le chiffrement complet transparent d'IndexedDB est différé tant qu'une gestion sûre des clés n'est pas définie.

Stocker une clé de chiffrement dans le même JavaScript ou le même stockage que les données apporte une protection limitée. Dériver une clé uniquement du PIN faible peut exposer les données à une attaque hors ligne.

Toute future fonction de chiffrement local doit définir :

- source et cycle de vie de la clé ;
- récupération ;
- changement du PIN ;
- migrations ;
- performances ;
- indexation et recherche ;
- sauvegarde ;
- appareil perdu ;
- modèle d'attaque.

---

# 19. Sauvegardes

Les sauvegardes contiennent potentiellement toutes les données et sont classées très sensibles.

## Exigences minimales

- format versionné ;
- validation stricte ;
- contrôle d'intégrité contre les corruptions accidentelles ;
- message d'avertissement avant export ;
- nom de fichier sans données personnelles ;
- absence de secret technique embarqué ;
- exclusion ou traitement séparé du hash du PIN.

## Recommandation

Proposer un chiffrement par mot de passe distinct pour les sauvegardes avant commercialisation, après validation cryptographique et UX.

---

# 20. Chiffrement des sauvegardes

Si activé, le format doit utiliser :

- une dérivation de clé résistante avec sel aléatoire ;
- un chiffrement authentifié standard disponible via Web Crypto ;
- un nonce unique par opération ;
- des paramètres et versions enregistrés dans l'enveloppe ;
- aucune clé ou mot de passe stocké dans le fichier ;
- authentification avant toute désérialisation des données métier.

La conception cryptographique doit utiliser des primitives reconnues et faire l'objet d'une revue dédiée. Aucun algorithme « maison » n'est autorisé.

---

# 21. Restauration sécurisée

Avant écriture :

- vérifier la taille ;
- vérifier le type de fichier ;
- analyser le JSON sans exécution ;
- valider le schéma ;
- limiter nombres de tables et d'enregistrements ;
- contrôler les identifiants et références ;
- refuser les clés inattendues critiques ;
- vérifier l'intégrité ;
- afficher un aperçu.

La restauration utilise une transaction. Un fichier invalide ne doit pas altérer la base existante.

---

# 22. WhatsApp

- le numéro est normalisé et validé ;
- le message est encodé comme paramètre d'URL ;
- aucun HTML n'est injecté ;
- l'URL cible utilise un domaine ou schéma explicitement autorisé ;
- l'utilisateur prévisualise le message ;
- l'ouverture ne prouve pas l'envoi ;
- les données ne sont transmises à WhatsApp qu'à l'action explicite de l'utilisateur.

L'application doit éviter d'exposer des informations inutiles dans le message préparé.

---

# 23. PDF

- le PDF utilise les instantanés de facture ;
- le contenu est traité comme texte ;
- les images sont validées ;
- les métadonnées n'incluent pas de données internes inutiles ;
- les liens actifs sont absents ou strictement contrôlés ;
- les fichiers temporaires sont libérés ;
- les montants proviennent du moteur de calcul central.

Le Sprint 5 borne les quantités, échelles, taux, remises et montants avant écriture. Les multiplications et arrondis passent par des entiers/`BigInt`, puis refusent toute sortie hors de `Number.MAX_SAFE_INTEGER`. Le nom de fichier PDF est nettoyé, les données sont dessinées comme texte (jamais interprétées comme HTML), aucune ressource distante n’est chargée et les URL d’objet sont révoquées après déclenchement du téléchargement.

---

# 24. Service worker

Le service worker dispose d'un accès puissant à l'origine.

Exigences :

- HTTPS ;
- portée minimale nécessaire ;
- script servi depuis l'origine officielle ;
- pas d'import dynamique depuis un domaine tiers ;
- caches nommés et versionnés ;
- suppression limitée aux caches SAMTECH connus ;
- aucune suppression d'IndexedDB ;
- mise à jour contrôlée ;
- procédure de désinscription en cas d'incident ;
- tests contre les boucles et réponses obsolètes.

---

# 25. Dépendances

## Règles

- limiter leur nombre ;
- utiliser un fichier de verrouillage ;
- installer depuis des registres officiels ;
- vérifier la réputation, la maintenance et la licence ;
- auditer les vulnérabilités ;
- revoir les changements majeurs ;
- ne pas exécuter aveuglément des scripts d'installation ;
- supprimer les dépendances inutilisées ;
- produire un inventaire pour les versions publiées.

Les mises à jour automatiques directes en production sont interdites.

---

# 26. Secrets et configuration

La V1 ne doit contenir aucun secret métier.

Interdictions :

- clé privée dans le dépôt ;
- token d'administration dans une variable publique ;
- secret dans le bundle JavaScript ;
- identifiant réel dans les données de démonstration ;
- mot de passe dans les journaux ou captures.

Les variables `NEXT_PUBLIC_*` sont considérées publiques.

---

# 27. Journalisation

Les journaux techniques peuvent contenir :

- date ;
- version ;
- code d'erreur ;
- type d'opération ;
- état non sensible.

Ils ne doivent pas contenir :

- noms ;
- numéros ;
- emails ;
- notes ;
- messages WhatsApp ;
- lignes de facture ;
- références de paiement ;
- PIN, hash ou sel ;
- sauvegardes complètes.

Toute future télémétrie distante exige une décision et une information explicite.

---

# 28. Gestion des erreurs

- ne pas afficher de pile technique en production ;
- utiliser un code de diagnostic non sensible ;
- ne pas révéler l'existence d'une donnée dans un message inutilement ;
- ne pas masquer un échec d'écriture ;
- préserver les données lors d'une erreur ;
- séparer le message utilisateur du détail développeur ;
- traiter les erreurs de quota et migration comme des incidents de données.

---

# 29. Protection des actions sensibles

Les actions suivantes exigent une confirmation renforcée :

- remplacement par restauration ;
- effacement complet ;
- annulation de facture ;
- renversement d'un paiement ;
- désactivation du PIN ;
- export d'une sauvegarde ;
- suppression d'un contact avec dépendances ;
- réinitialisation locale.

Une confirmation renforcée peut demander le PIN ou une saisie explicite selon le risque.

---

# 30. Sécurité des calculs financiers

- représentation monétaire exacte ;
- aucune confiance dans les totaux reçus d'un formulaire ;
- recalcul dans le domaine ;
- mêmes résultats pour écran, stockage et PDF ;
- limites sur quantités, taux et montants ;
- détection de dépassement de la plage sûre ;
- tests unitaires des arrondis ;
- statut de facture recalculé après paiement ;
- événements pour corrections et annulations.

---

# 31. Données de démonstration et tests

- utiliser exclusivement des identités fictives ;
- ne jamais copier une base réelle dans le dépôt ;
- nettoyer les captures et fichiers de test ;
- séparer la base de démonstration ;
- ne pas exposer les exports dans des artefacts publics ;
- utiliser des secrets factices clairement identifiés.

---

# 32. Environnement de développement

- poste protégé et à jour ;
- dépôt privé pendant le développement initial si nécessaire ;
- branches et revues ;
- protection de la branche principale ;
- contrôles automatiques ;
- aucune donnée client réelle dans le développement ;
- sauvegarde du code et documentation ;
- droits minimaux sur les services de déploiement.

---

# 33. Chaîne CI/CD

Avant publication :

1. vérification du format ;
2. lint ;
3. vérification TypeScript ;
4. tests ;
5. audit des dépendances ;
6. build reproductible ;
7. contrôle des secrets ;
8. contrôle des en-têtes ;
9. test PWA ;
10. publication avec droits limités.

Les artefacts doivent être associés à une version et à un commit.

---

# 34. Revue de code

Une revue est obligatoire pour :

- authentification ou PIN ;
- sauvegarde et restauration ;
- service worker ;
- migrations ;
- génération PDF ;
- calcul financier ;
- dépendance nouvelle ;
- manipulation de HTML ;
- en-têtes de sécurité ;
- futur code réseau.

Le code généré par une IA est soumis aux mêmes exigences.

---

# 35. Classification des vulnérabilités

## Critique

Exécution de code, extraction globale facile, corruption massive ou compromission de la chaîne de publication.

## Élevée

Accès non autorisé significatif, contournement du PIN exploitable, altération financière ou restauration dangereuse.

## Moyenne

Fuite limitée, contrôle manquant, mauvaise validation ou déni de service local récupérable.

## Faible

Information technique mineure ou amélioration de durcissement.

Les défauts critiques et élevés doivent bloquer une publication.

---

# 36. Réponse aux incidents

En cas de vulnérabilité :

1. confirmer et limiter l'accès aux détails ;
2. évaluer les versions affectées ;
3. préparer un correctif ;
4. tester les données et migrations ;
5. publier une version ;
6. informer les utilisateurs avec des actions claires ;
7. révoquer les ressources externes si nécessaire ;
8. documenter l'incident ;
9. prévenir la régression.

La PWA doit disposer d'un mécanisme fiable pour signaler une mise à jour de sécurité disponible.

---

# 37. Confidentialité et droits des personnes

SAMTECH CRM doit permettre à l'utilisateur professionnel de :

- consulter les données d'un contact ;
- les corriger ;
- les exporter dans le cadre prévu ;
- les archiver ou supprimer lorsqu'aucune obligation de conservation ne s'y oppose ;
- distinguer les données commerciales des documents financiers ;
- appliquer sa propre politique de conservation.

Les exigences juridiques exactes dépendent des pays de commercialisation et devront être validées avant lancement.

---

# 38. Politique de conservation

La V1 doit éviter une suppression automatique arbitraire.

Le propriétaire des données décide :

- durée de conservation des prospects perdus ;
- archivage des contacts inactifs ;
- conservation des factures et paiements selon la réglementation ;
- suppression des campagnes anciennes ;
- conservation des sauvegardes.

Les documents financiers ne doivent pas être effacés comme de simples notes.

---

# 39. Vérifications avant mise en production

- HTTPS et domaine officiel ;
- CSP testée ;
- en-têtes vérifiés ;
- absence de secrets ;
- dépendances auditées ;
- XSS testé ;
- import malveillant testé ;
- sauvegarde/restauration testée ;
- PIN testé sur appareils réels ;
- journaux inspectés ;
- service worker testé ;
- migrations testées ;
- calculs financiers testés ;
- documentation des limites publiée ;
- politique de confidentialité préparée.

---

# 40. Tests de sécurité prioritaires

- injection dans tous les champs texte ;
- notes contenant HTML et scripts ;
- variables de messages malformées ;
- liens WhatsApp manipulés ;
- image ou logo invalide ;
- sauvegarde surdimensionnée ;
- JSON profond ou récursif ;
- références orphelines ;
- montants extrêmes ;
- brute force du PIN et délais ;
- inspection des journaux ;
- cache obsolète ;
- migration interrompue ;
- restauration échouée ;
- dépendance indisponible hors ligne.

---

# 41. Critères d'acceptation

La sécurité V1 est acceptable lorsque :

1. aucun secret n'est présent dans le client ;
2. l'origine utilise HTTPS ;
3. la CSP et les en-têtes sont validés ;
4. les entrées ne permettent pas l'exécution de HTML ou JavaScript ;
5. le PIN n'est pas stocké en clair ;
6. les sauvegardes invalides n'altèrent pas la base ;
7. les actions sensibles sont confirmées ;
8. les journaux ne contiennent pas de données métier ;
9. les dépendances sont inventoriées et auditées ;
10. les tests prioritaires réussissent ;
11. les limites de la PWA sont clairement communiquées ;
12. aucun défaut critique ou élevé connu ne subsiste.

---

# 42. Évolutions V1.x

Avant commercialisation, étudier et documenter :

- sauvegardes chiffrées ;
- politique de récupération du PIN ;
- licences adaptées aux PWA ;
- portail de licences séparé ;
- signature ou authentification des activations ;
- politique de mises à jour de sécurité ;
- support et signalement des vulnérabilités ;
- vérification indépendante de la sécurité.

---

# 43. Évolutions cloud V2

La V2 nécessitera une nouvelle analyse incluant :

- authentification ;
- sessions ;
- contrôle d'accès ;
- isolation des organisations ;
- chiffrement en transit et au repos ;
- gestion des secrets ;
- sauvegardes serveur ;
- journaux d'audit ;
- synchronisation et conflits ;
- réponse aux incidents ;
- conformité réglementaire ;
- suppression et export des données.

Les contrôles locaux de la V1 ne suffiront pas pour la V2.

---

# 44. Prochaine étape

Après validation de `SECURITY.md`, le document `UI_UX.md` doit définir l'arborescence, la navigation mobile, les écrans, composants, états, formulaires et parcours critiques.

---

# 45. Principe directeur

**SAMTECH CRM doit protéger les données avec des contrôles proportionnés à une PWA locale, expliquer honnêtement leurs limites et ne jamais sacrifier l'intégrité des données à une apparence de sécurité.**

---

# 46. Intégrité des paiements — Sprint 6

- Les montants sont validés comme entiers sûrs en unité minimale; aucune comparaison financière en virgule flottante n’est utilisée.
- Les opérations sensibles relisent l’état dans une transaction et écrivent ensemble paiement, facture et chronologie. Une erreur provoque le rollback intégral.
- Aucun paiement n’est supprimé ni édité. La correction est une contrepassation motivée, confirmée dans l’interface et auditée localement.
- Les chaînes utilisateur (référence, note, motif) sont rendues comme texte. Elles ne sont pas injectées en HTML et ne sont pas envoyées à un service externe.
- Le Sprint 6 n’ajoute aucun backend, secret, télémétrie, synchronisation, API de paiement ou traitement réseau métier.

---

# 47. Protection des campagnes — Sprint 7

- Aucun message, numéro ou contact n’est transmis avant l’action explicite d’ouverture du lien WhatsApp; aucun test ne suit ce lien.
- Les listes générales masquent partiellement les numéros. Le numéro complet et le message figé ne sont visibles que dans l’écran d’exécution individuel.
- Les journaux de chronologie conservent un titre et un résumé limité, jamais le message complet ni le numéro. Le contenu intégral reste dans l’instantané local du destinataire.
- Les messages sont traités comme texte. Aucune interprétation HTML, API WhatsApp Business, tâche de fond, télémétrie ou confirmation automatique n’est introduite.
- Les statuts terminaux, transactions, contraintes uniques et instantanés empêchent suppression, duplication et modification silencieuse après lancement.

---

# 48. Protection des statistiques — Sprint 8

- Les calculs restent locaux et n’envoient ni données commerciales, ni identifiants, ni montants à un service tiers.
- L’avertissement d’intégrité est générique; les identifiants internes et détails financiers incohérents ne sont pas exposés dans l’interface.
- Les montants non sûrs, références absentes, soldes négatifs et statuts incohérents sont signalés sans mutation automatique.
- Les libellés provenant des contacts, produits et localités sont rendus comme texte React, jamais comme HTML interprété.
- Aucune télémétrie, bibliothèque graphique distante, backend, secret, IA ou synchronisation n’est ajouté.

---

# 49. Sauvegarde et PIN local — Sprint 9

Le PIN utilise PBKDF2 via Web Crypto, HMAC-SHA-256, un sel aléatoire de 16 octets par activation, 210 000 itérations et une sortie de 256 bits. Ces paramètres portent la version d'algorithme `1`. Le 18 juillet 2026, dix dérivations Web Crypto sur le poste de validation Node ont mesuré 90,5 ms au minimum, 100,9 ms en médiane, 112,0 ms au maximum et 101,3 ms en moyenne. Ce résultat desktop ne remplace pas la mesure encore requise sur les téléphones Android et iPhone cibles.

Le hash, le sel, les compteurs, le délai et l'état de session ne quittent jamais `securitySettings`. Cette table est absente des sauvegardes. L'écran verrouillé remplace réellement le shell React; l'état déverrouillé n'est écrit ni dans IndexedDB ni dans `localStorage`. La temporisation locale ne remplace pas une sécurité serveur et reste contournable par une personne contrôlant le profil navigateur.

Le fichier de sauvegarde Sprint 9 est un JSON UTF-8 non chiffré. Son SHA-256 détecte les corruptions accidentelles, mais n'authentifie pas l'auteur. IndexedDB n'est pas chiffrée par l'application. L'utilisateur doit conserver les exports dans un emplacement sûr. Aucun chiffrement artisanal, compte, porte dérobée, récupération par e-mail ou PIN maître n'existe.

## Revue V1 bêta

La recette finale revalide l’affichage inerte des entrées HTML, l’encodage du lien WhatsApp, le masquage du shell par `SecurityGate`, l’exclusion de `securitySettings`, la procédure destructive et la restauration transactionnelle. `axe-core` et `lighthouse` sont des dépendances de développement uniquement. L’audit npm distant doit être exécuté dans un environnement explicitement autorisé à transmettre le graphe de dépendances.
