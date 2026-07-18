# SAMTECH CRM — CAHIER DES CHARGES

**Document :** `CAHIER_DES_CHARGES.md`  
**Produit :** SAMTECH CRM  
**Éditeur :** SAMTECH  
**Version du document :** 1.0  
**Statut :** Document de référence  
**Date :** Juillet 2026

---

# 1. Objet

Ce cahier des charges définit les besoins, le périmètre, les exigences et les critères d'acceptation de SAMTECH CRM V1 Starter.

SAMTECH CRM est une application Web progressive, mobile-first et offline-first destinée aux entrepreneurs, indépendants, commerciaux, TPE et PME utilisant principalement WhatsApp pour gérer leurs relations commerciales.

Le produit doit structurer le cycle suivant :

**Prospect → Qualification → Relance → Conversion → Client → Vente → Facture → Paiement → Fidélisation**

Ce document complète `VISION.md` et `ROADMAP.md`. Les règles détaillées seront précisées dans `RULES.md` et le modèle technique dans les documents d'architecture.

---

# 2. Contexte

Les utilisateurs ciblés reçoivent une grande partie de leurs demandes commerciales sur WhatsApp. Les informations utiles restent dispersées entre les conversations, le carnet de contacts, des notes papier et des tableaux.

Cette organisation entraîne notamment :

- des prospects oubliés ;
- des relances non réalisées ;
- une mauvaise connaissance des produits demandés ;
- une segmentation commerciale difficile ;
- un suivi incomplet de la conversion ;
- une facturation et un suivi des paiements séparés du parcours commercial ;
- une visibilité insuffisante sur l'activité.

SAMTECH CRM doit centraliser ces informations sans remplacer WhatsApp.

---

# 3. Objectifs de la V1

La V1 doit permettre à un utilisateur unique de :

1. constituer une base structurée de prospects ;
2. classer les contacts par localité, produit, statut, intérêt et tags ;
3. programmer et exécuter des relances WhatsApp assistées ;
4. préparer des campagnes segmentées avec validation humaine des envois ;
5. convertir un prospect en client sans perdre son historique ;
6. gérer un catalogue de produits et services ;
7. créer des factures et leurs PDF ;
8. enregistrer les paiements complets ou partiels ;
9. consulter des indicateurs commerciaux utiles ;
10. sauvegarder et restaurer ses données ;
11. utiliser les fonctions essentielles sans connexion Internet.

---

# 4. Utilisateurs cibles

## 4.1 Utilisateur principal

Entrepreneur, indépendant, dirigeant ou commercial travaillant seul et gérant directement ses prospects, clients, ventes et paiements.

## 4.2 Niveau technique

L'application doit convenir à un utilisateur non technicien, habitué au smartphone et à WhatsApp, mais pas nécessairement à un CRM professionnel.

## 4.3 Secteurs

Le produit est générique et doit convenir notamment aux commerces, centres de formation, cabinets, agences, artisans, distributeurs, prestataires et activités agricoles.

---

# 5. Périmètre de la V1

## Inclus

- configuration de l'entreprise ;
- tableau de bord ;
- localités ;
- catalogue de produits et services ;
- prospects ;
- intérêts produits ;
- notes et historique ;
- relances ;
- modèles de messages ;
- ouverture de WhatsApp avec message prérempli ;
- campagnes assistées ;
- conversion en client ;
- clients ;
- factures ;
- PDF des factures ;
- paiements ;
- statistiques essentielles ;
- export et restauration ;
- code PIN local ;
- installation PWA ;
- fonctionnement offline-first.

## Exclus

- gestion des licences ;
- abonnement et paiement du logiciel ;
- compte utilisateur distant ;
- synchronisation ou sauvegarde cloud ;
- multi-appareil synchronisé ;
- multi-utilisateur, rôles et équipes ;
- API WhatsApp Business ;
- envoi automatique en masse ;
- lecture automatique des conversations WhatsApp ;
- intelligence artificielle ;
- intégrations externes ;
- gestion de stock ;
- comptabilité générale ;
- applications natives Android et iOS.

---

# 6. Hypothèses et contraintes

- La V1 est mono-utilisateur.
- Les données sont conservées localement dans le navigateur.
- L'utilisateur est responsable de ses sauvegardes.
- La suppression des données du navigateur peut supprimer les données locales.
- Les possibilités PWA peuvent varier selon le navigateur et le système d'exploitation.
- WhatsApp est ouvert par un lien avec numéro et texte préremplis ; l'utilisateur confirme l'envoi.
- La V1 est conçue en français.
- La devise, les taxes et les informations de l'entreprise sont configurables.
- La connexion Internet peut être absente ou instable.

---

# 7. Exigences générales d'expérience utilisateur

- L'interface doit être pensée d'abord pour les écrans de smartphone.
- Les actions fréquentes doivent être accessibles en deux ou trois interactions lorsque cela est raisonnable.
- Les formulaires doivent utiliser des libellés explicites et des valeurs par défaut utiles.
- Les erreurs doivent être expliquées en langage clair.
- Les actions destructrices doivent demander confirmation.
- Les listes doivent offrir recherche et filtres adaptés.
- L'utilisateur doit toujours comprendre si une action est enregistrée, en attente ou impossible.
- Les éléments interactifs doivent être utilisables au toucher.
- L'application doit rester cohérente sur téléphone, tablette et ordinateur.

---

# 8. Navigation principale

La navigation de premier niveau doit donner accès à :

- Accueil ;
- Prospects ;
- Relances ;
- Clients ;
- Plus ou menu secondaire.

Le menu secondaire donne accès à :

- Campagnes ;
- Produits et services ;
- Factures ;
- Paiements ;
- Statistiques ;
- Modèles de messages ;
- Localités ;
- Sauvegarde et restauration ;
- Paramètres.

La solution définitive sera détaillée dans `UI_UX.md`.

---

# 9. Module Paramètres et entreprise

## Exigences fonctionnelles

L'utilisateur doit pouvoir définir :

- nom commercial ;
- raison sociale, si applicable ;
- adresse ;
- téléphone ;
- email ;
- identifiants fiscaux facultatifs ;
- logo facultatif ;
- devise ;
- format de date ;
- préfixe et prochain numéro de facture ;
- taxes disponibles ;
- délai d'échéance par défaut ;
- durée de verrouillage automatique.

## Critères d'acceptation

- Les paramètres sont conservés localement.
- Les informations configurées apparaissent correctement sur les factures.
- La modification d'un paramètre n'altère pas rétroactivement les documents déjà émis, sauf règle explicitement définie.

---

# 10. Module Localités

## Exigences fonctionnelles

L'utilisateur doit pouvoir :

- créer une localité ;
- modifier son nom et son niveau ;
- organiser pays, région, ville et quartier de manière simple ;
- rechercher une localité ;
- désactiver ou archiver une localité ;
- utiliser une localité dans les fiches, filtres et statistiques.

## Critères d'acceptation

- Une localité utilisée ne doit pas être supprimée sans traitement de ses références.
- Les prospects et clients peuvent être filtrés par localité.
- Les statistiques géographiques utilisent des données cohérentes.

---

# 11. Module Produits et services

## Données

- identifiant interne ;
- nom ;
- type Produit ou Service ;
- catégorie ;
- description facultative ;
- prix de vente ;
- taxe par défaut facultative ;
- statut actif ou inactif ;
- date de création et de modification.

## Exigences fonctionnelles

L'utilisateur doit pouvoir créer, modifier, rechercher, filtrer et archiver un produit ou service.

Un produit doit pouvoir être :

- associé à l'intérêt d'un prospect ;
- ajouté à une facture ;
- utilisé pour segmenter une campagne ;
- analysé dans les statistiques.

## Critères d'acceptation

- Un produit archivé reste visible dans l'historique et les anciennes factures.
- Le prix d'une ligne de facture reste inchangé si le prix du catalogue est modifié plus tard.
- Les montants sont validés avant enregistrement.

---

# 12. Module Prospects

## Données principales

- identifiant interne ;
- prénom et nom ou nom complet ;
- numéro WhatsApp obligatoire ;
- téléphone complémentaire facultatif ;
- email facultatif ;
- entreprise et profession facultatives ;
- localité ;
- source ;
- statut ;
- niveau d'intérêt ;
- tags ;
- produits ou services demandés ;
- date du premier contact ;
- notes ;
- prochaine relance calculée ou associée ;
- dates de création et de modification ;
- état actif ou archivé.

## Statuts initiaux

- Nouveau ;
- Contacté ;
- Intéressé ;
- À relancer ;
- Négociation ;
- Converti ;
- Perdu.

## Niveaux d'intérêt

- Chaud ;
- Tiède ;
- Froid ;
- Non qualifié.

## Exigences fonctionnelles

L'utilisateur doit pouvoir :

- créer rapidement un prospect ;
- modifier ses informations ;
- associer plusieurs intérêts produits ;
- ajouter des notes ;
- rechercher par nom ou numéro ;
- filtrer par localité, produit, statut, intérêt, tag, source et période ;
- trier la liste ;
- ouvrir WhatsApp ;
- programmer une relance ;
- convertir le prospect en client ;
- marquer le prospect comme perdu ;
- archiver le prospect.

## Doublons

Le numéro doit être normalisé. Lorsqu'un numéro semblable existe, l'application doit avertir l'utilisateur et proposer d'ouvrir la fiche existante ou de confirmer la création.

## Critères d'acceptation

- La création rapide est utilisable sur smartphone.
- Un prospect est retrouvable par nom ou numéro.
- Les filtres peuvent être combinés.
- Une conversion ne crée pas deux personnes distinctes.
- L'historique est conservé après conversion.

---

# 13. Notes et chronologie commerciale

## Événements attendus

- création du prospect ;
- modification importante de statut ;
- ajout d'une note ;
- création, report, réalisation ou annulation d'une relance ;
- ouverture d'un message WhatsApp ;
- participation à une campagne ;
- conversion en client ;
- création ou émission d'une facture ;
- enregistrement d'un paiement.

## Exigences

- Les événements doivent être datés.
- La chronologie doit être lisible du plus récent au plus ancien.
- Les événements automatiques doivent être distingués des notes manuelles.
- Un événement financier ne doit pas pouvoir être modifié comme une simple note.

---

# 14. Module Relances

## Données

- contact concerné ;
- date et heure ;
- canal ;
- motif ;
- message ou modèle facultatif ;
- priorité ;
- statut ;
- date de réalisation ;
- note de résultat.

## Statuts

- Planifiée ;
- Réalisée ;
- Reportée ;
- Annulée.

## Vues

- Aujourd'hui ;
- En retard ;
- À venir ;
- Terminées.

## Exigences fonctionnelles

L'utilisateur doit pouvoir créer, modifier avant réalisation, reporter, annuler et terminer une relance.

Depuis une relance WhatsApp, il doit pouvoir :

- choisir ou modifier un modèle ;
- prévisualiser le message personnalisé ;
- ouvrir la conversation WhatsApp ;
- indiquer ensuite que la relance est réalisée ;
- saisir une note de résultat et éventuellement la prochaine action.

## Critères d'acceptation

- Une relance passée et non terminée apparaît en retard.
- Une relance reportée conserve sa trace dans l'historique.
- L'ouverture de WhatsApp ne marque pas automatiquement la relance comme réalisée.

---

# 15. Module Modèles de messages

## Données

- nom du modèle ;
- catégorie ;
- contenu ;
- variables utilisées ;
- statut actif ou archivé.

## Variables initiales

- `{{prenom}}` ;
- `{{nom}}` ;
- `{{contact}}` ;
- `{{entreprise}}` ;
- `{{produit}}` ;
- `{{localite}}` ;
- `{{nom_entreprise}}`.

## Exigences

- L'utilisateur peut créer, modifier, dupliquer et archiver un modèle.
- Une prévisualisation affiche les variables résolues.
- Une variable manquante est signalée avant l'ouverture de WhatsApp.
- Le message final doit être correctement encodé dans le lien WhatsApp.

---

# 16. Intégration WhatsApp

## Fonctionnement V1

SAMTECH CRM prépare le numéro et le message, puis ouvre WhatsApp ou WhatsApp Web. L'utilisateur contrôle l'envoi final.

## Exigences

- normaliser le numéro au format international attendu ;
- vérifier la présence d'un numéro utilisable ;
- encoder correctement les caractères et retours à la ligne ;
- présenter le message avant ouverture ;
- afficher une erreur compréhensible si l'ouverture échoue ;
- ne jamais prétendre qu'un message a été envoyé uniquement parce que WhatsApp a été ouvert.

---

# 17. Module Clients

## Conversion

La conversion transforme le rôle commercial du contact sans dupliquer son identité.

## Données complémentaires

- date de conversion ;
- historique d'achat ;
- factures ;
- paiements ;
- chiffre d'affaires calculé ;
- solde dû calculé ;
- date du dernier achat.

## Exigences fonctionnelles

L'utilisateur doit pouvoir :

- convertir un prospect ;
- consulter la fiche client à 360° ;
- créer une facture ;
- programmer une relance ;
- ouvrir WhatsApp ;
- consulter les achats, factures et paiements ;
- filtrer les clients par localité, produit acheté et activité récente.

## Critères d'acceptation

- L'historique du prospect reste accessible.
- Le contact n'est compté qu'une fois dans les indicateurs appropriés.
- Une conversion peut être reliée à une première vente ou effectuée avant la facture selon la règle métier retenue.

---

# 18. Module Facturation

## Données de facture

- identifiant ;
- numéro unique ;
- client ;
- date d'émission ;
- date d'échéance ;
- devise ;
- statut ;
- lignes ;
- sous-total ;
- remise ;
- taxes ;
- total ;
- total payé calculé ;
- solde calculé ;
- notes et conditions ;
- instantané des informations de l'entreprise et du client.

## Ligne de facture

- référence facultative au catalogue ;
- désignation copiée ;
- description facultative ;
- quantité ;
- prix unitaire ;
- remise ;
- taxe ;
- total calculé.

## Statuts

- Brouillon ;
- Émise ;
- Partiellement payée ;
- Payée ;
- Annulée.

## Exigences fonctionnelles

- créer et modifier un brouillon ;
- ajouter, modifier, ordonner et supprimer des lignes ;
- recalculer les montants ;
- émettre une facture ;
- générer un PDF ;
- télécharger ou partager le PDF ;
- rechercher et filtrer les factures ;
- annuler une facture selon les règles prévues ;
- créer un paiement depuis une facture.

## Critères d'acceptation

- Le numéro est unique.
- Une facture émise conserve un instantané de ses données.
- Les calculs sont déterministes et testés.
- Une facture payée affiche un solde nul.
- Une facture annulée n'est pas comptée comme chiffre d'affaires actif.

---

# 19. PDF de facture

Le PDF doit contenir au minimum :

- identité visuelle et coordonnées de l'entreprise ;
- numéro et dates ;
- informations du client ;
- lignes détaillées ;
- sous-total, remises, taxes et total ;
- paiements ou solde, selon le modèle retenu ;
- devise ;
- notes et conditions.

Le document doit être lisible sur écran et imprimable au format A4. Les lignes longues et factures multipages doivent être gérées proprement.

---

# 20. Module Paiements

## Données

- facture ;
- client ;
- date ;
- montant ;
- mode de paiement ;
- référence facultative ;
- note facultative ;
- dates de création et de modification autorisée.

## Modes initiaux

- Espèces ;
- Wave ;
- Orange Money ;
- Virement ;
- Carte ;
- Autre.

## Exigences

- enregistrer un paiement complet ou partiel ;
- recalculer le total payé et le solde ;
- mettre à jour le statut de la facture ;
- consulter l'historique ;
- filtrer par date, mode, client et facture ;
- corriger ou annuler un paiement selon une procédure traçable.

## Critères d'acceptation

- Aucun montant négatif ou nul n'est accepté.
- Un paiement ne dépasse pas le solde sans règle explicite.
- La suppression ou correction ne doit pas rompre la cohérence de la facture.

---

# 21. Module Campagnes

## Données

- nom ;
- objectif ;
- type de destinataires ;
- critères de segmentation ;
- modèle ou contenu ;
- date de création ;
- statut ;
- destinataires figés ou instantané de sélection ;
- état de traitement par destinataire.

## Statuts de campagne

- Brouillon ;
- Prête ;
- En cours ;
- Terminée ;
- Annulée.

## Segmentation

- prospect ou client ;
- localité ;
- produit demandé ;
- produit acheté ;
- statut ;
- niveau d'intérêt ;
- tags ;
- source ;
- période ;
- activité récente.

## Exigences

- afficher le nombre de destinataires avant lancement ;
- permettre de consulter et d'exclure des contacts ;
- détecter les numéros manquants ou invalides ;
- prévisualiser le message personnalisé ;
- ouvrir WhatsApp destinataire par destinataire ;
- permettre de marquer le résultat manuellement ;
- reprendre une campagne interrompue ;
- éviter qu'une simple ouverture soit considérée comme un envoi confirmé.

## Critères d'acceptation

- La campagne respecte les filtres sélectionnés.
- L'utilisateur garde le contrôle de chaque envoi.
- La progression est conservée après fermeture et réouverture.

---

# 22. Tableau de bord

Le tableau de bord doit présenter des informations immédiatement exploitables :

- prospects totaux ;
- nouveaux prospects ;
- clients ;
- taux de conversion ;
- relances aujourd'hui ;
- relances en retard ;
- montant facturé ;
- montant encaissé ;
- créances ;
- produits les plus demandés.

Il doit aussi fournir des raccourcis vers :

- ajouter un prospect ;
- voir les relances ;
- créer une facture ;
- lancer ou reprendre une campagne.

Les périodes de calcul doivent être explicites.

---

# 23. Statistiques

## Prospection

- évolution du nombre de prospects ;
- répartition par localité ;
- répartition par source ;
- répartition par statut et intérêt ;
- produits les plus demandés.

## Conversion

- nombre de conversions ;
- taux de conversion ;
- délai moyen de conversion, si les données le permettent.

## Ventes

- produits les plus vendus ;
- chiffre d'affaires par période ;
- chiffre d'affaires par produit et localité ;
- montant facturé, encaissé et restant dû.

## Exigences

- Les statistiques doivent préciser la période.
- Les formules doivent être documentées dans `RULES.md`.
- Les factures annulées doivent être traitées conformément aux règles métier.
- Les indicateurs doivent être recalculables à partir des données sources.

---

# 24. Recherche et filtres

- Recherche tolérante à la casse et aux espaces superflus.
- Recherche par nom et numéro normalisé.
- Combinaison de plusieurs filtres.
- Affichage du nombre de résultats.
- Réinitialisation simple des filtres.
- Conservation temporaire des filtres pendant la navigation, si utile.
- Aucun résultat doit être expliqué clairement avec une action possible.

---

# 25. Sauvegarde et restauration

## Export

L'application doit produire un fichier contenant toutes les données nécessaires à une restauration complète.

Le fichier doit inclure :

- version du format ;
- date d'export ;
- version de l'application ;
- données métier ;
- paramètres ;
- contrôle d'intégrité adapté.

## Restauration

Le processus doit :

1. sélectionner un fichier ;
2. vérifier son format ;
3. afficher un résumé ;
4. avertir sur l'impact ;
5. demander confirmation ;
6. exécuter la restauration de manière atomique autant que possible ;
7. afficher le résultat ;
8. conserver une stratégie de récupération en cas d'échec.

## Critères d'acceptation

- Une sauvegarde valide restaure les données attendues.
- Un fichier invalide n'endommage pas la base existante.
- Les versions compatibles sont documentées.
- La restauration est testée avec des volumes représentatifs.

---

# 26. Sécurité locale et PIN

## Exigences

- création d'un PIN ;
- vérification au démarrage ou après verrouillage ;
- verrouillage après inactivité configurable ;
- limitation raisonnable des tentatives ;
- stockage non réversible du secret lorsque possible ;
- masquage des informations sensibles dans l'interface verrouillée ;
- procédure claire si le PIN est oublié.

## Limite à communiquer

Le PIN protège l'accès courant à l'interface mais ne remplace pas la sécurité de l'appareil, le chiffrement matériel ni une architecture serveur sécurisée.

---

# 27. Exigences PWA

L'application doit :

- disposer d'un manifeste valide ;
- disposer d'icônes adaptées ;
- être installable sur les plateformes compatibles ;
- avoir un nom, une couleur et un mode d'affichage cohérents ;
- charger une interface utile hors connexion après la première utilisation ;
- gérer les mises à jour du service worker sans perte de données ;
- afficher clairement les états hors ligne et les erreurs réseau ;
- ne pas dépendre d'une ressource distante pour les opérations locales essentielles.

---

# 28. Exigences offline-first

Les fonctions suivantes doivent fonctionner hors connexion après installation et chargement initial :

- consulter et modifier les données locales ;
- gérer prospects, clients, produits et localités ;
- gérer les relances ;
- créer des factures ;
- enregistrer des paiements ;
- consulter les statistiques locales ;
- préparer les campagnes ;
- sauvegarder les données localement ;
- utiliser le PIN.

L'ouverture effective de WhatsApp et le partage peuvent dépendre du système, de l'application installée et de la connectivité.

---

# 29. Exigences techniques de référence

Stack envisagée :

- Next.js ;
- TypeScript en mode strict ;
- Tailwind CSS ;
- shadcn/ui ou composants accessibles équivalents ;
- IndexedDB ;
- Dexie.js ;
- service worker et manifeste PWA ;
- bibliothèque de génération PDF validée ;
- tests unitaires, d'intégration et de parcours.

Les versions exactes et décisions seront figées dans `ARCHITECTURE.md`.

---

# 30. Qualité, performance et fiabilité

- L'application doit répondre rapidement sur un smartphone courant.
- Les listes volumineuses doivent rester utilisables.
- Les opérations longues doivent afficher un état de progression.
- Les erreurs non prévues doivent être interceptées et expliquées sans exposer de détails sensibles.
- Les écritures importantes doivent éviter les états partiels.
- Les calculs financiers doivent utiliser une méthode évitant les erreurs classiques de nombres flottants.
- Les migrations de base locale doivent être testées.
- Aucune mise à jour ne doit effacer silencieusement les données.

---

# 31. Accessibilité

- Contrastes suffisants.
- Taille de texte lisible.
- Zones tactiles suffisamment grandes.
- Libellés associés aux champs.
- Navigation clavier sur ordinateur.
- États de focus visibles.
- Informations non communiquées uniquement par la couleur.
- Messages d'erreur associés aux champs concernés.

L'objectif minimal est de suivre les bonnes pratiques WCAG applicables au produit.

---

# 32. Compatibilité cible

La matrice finale doit être documentée et testée au minimum sur :

- Chrome récent sur Android ;
- Safari récent sur iPhone ;
- Chrome et Edge récents sur ordinateur ;
- un format tablette représentatif.

Les différences d'installation, de stockage, de notifications et de partage sur iOS doivent être documentées.

---

# 33. Tests requis

## Tests unitaires

- normalisation des numéros ;
- variables de messages ;
- calculs de facture ;
- calculs de paiement et solde ;
- statistiques ;
- validations métier.

## Tests d'intégration

- stockage IndexedDB ;
- migrations ;
- conversion prospect/client ;
- facture et paiements ;
- export et restauration ;
- progression des campagnes.

## Tests de parcours

- créer un prospect et une relance ;
- ouvrir WhatsApp avec un message ;
- convertir en client ;
- créer une facture ;
- enregistrer deux paiements partiels ;
- sauvegarder et restaurer ;
- utiliser l'application hors ligne.

## Tests manuels

- installation PWA ;
- petits écrans ;
- partage de PDF ;
- comportement Android et iPhone ;
- mises à jour de l'application.

---

# 34. Données de démonstration

Un jeu de données facultatif doit permettre de découvrir l'application sans saisir immédiatement toutes les informations.

Il doit être clairement identifié comme démonstration et pouvoir être supprimé sans affecter les données réelles.

---

# 35. Documentation attendue

- documentation produit ;
- règles métier ;
- architecture technique ;
- modèle de données ;
- stratégie offline ;
- sécurité ;
- UX/UI ;
- tests ;
- guide d'installation PWA ;
- guide utilisateur ;
- procédure de sauvegarde et restauration ;
- historique des versions.

---

# 36. Livrables de la V1

- code source versionné ;
- PWA installable ;
- modules fonctionnels décrits dans ce document ;
- base locale et migrations ;
- modèles de facture PDF ;
- tests automatisés ;
- documentation à jour ;
- jeu de démonstration facultatif ;
- version bêta validée ;
- version de production prête à être déployée.

---

# 37. Critères globaux de recette

La V1 sera acceptée si :

1. le parcours commercial complet est réalisable ;
2. les données restent cohérentes après les opérations principales ;
3. les calculs financiers sont exacts ;
4. les sauvegardes valides peuvent être restaurées ;
5. les fonctions essentielles restent utilisables hors connexion ;
6. l'application est utilisable sur les appareils cibles ;
7. les actions WhatsApp restent assistées et transparentes ;
8. aucun défaut bloquant ou critique connu ne subsiste ;
9. les tests prioritaires réussissent ;
10. la documentation correspond à la version livrée.

---

# 38. Priorités MoSCoW de la V1

## Must have

- prospects ;
- produits et localités ;
- relances ;
- modèles WhatsApp ;
- conversion en client ;
- factures et PDF ;
- paiements ;
- tableau de bord essentiel ;
- sauvegarde/restauration ;
- offline-first ;
- interface mobile-first ;
- campagnes WhatsApp assistées ;
- PIN local.

## Should have

- statistiques détaillées ;
- chronologie commerciale complète ;
- jeu de démonstration.

## Could have

- personnalisation avancée des factures ;
- import CSV guidé ;
- graphiques supplémentaires ;
- raccourcis et préférences avancées.

## Won't have in V1

- licences ;
- cloud ;
- multi-utilisateur ;
- API WhatsApp Business ;
- intelligence artificielle ;
- automatisation intégrale.

---

# 39. Gouvernance documentaire

- Toute nouvelle fonctionnalité modifie le cahier des charges avant ou avec le code.
- Toute nouvelle règle métier modifie `RULES.md`.
- Toute modification de données modifie `DATABASE.md`.
- Toute décision d'architecture modifie `ARCHITECTURE.md`.
- Toute version livrée modifie `CHANGELOG.md`.
- Les outils d'IA ne doivent pas inventer de fonctionnalités ou changer le périmètre sans validation.

---

# 40. Prochaine étape

Après validation de ce document, la prochaine étape est la rédaction de `RULES.md`, qui définira précisément :

- les statuts et transitions ;
- la normalisation des numéros ;
- les règles de conversion ;
- les calculs de factures ;
- les paiements et soldes ;
- la numérotation ;
- les campagnes ;
- les indicateurs ;
- l'archivage et la suppression ;
- la sauvegarde et la restauration.

---

# 41. Principe directeur

**SAMTECH CRM V1 doit résoudre de manière simple et fiable les besoins commerciaux essentiels avant d'ajouter la complexité de la commercialisation technique, du cloud et de la collaboration.**

## 42. Critères de la V1 bêta

La bêta `1.0.0-beta.1` exige zéro test métier en échec, zéro violation d’accessibilité critique ou sérieuse, un parcours essentiel utilisable de 320 à 1440 px, une migration et une restauration non destructives, des calculs financiers exacts et le fonctionnement hors ligne des opérations principales. Les validations physiques et les limites connues sont suivies dans les documents de livraison dédiés.
