# SAMTECH CRM — SPÉCIFICATION UI/UX

**Document :** `UI_UX.md`  
**Produit :** SAMTECH CRM  
**Éditeur :** SAMTECH  
**Version du document :** 1.0  
**Statut :** Référence UX/UI V1  
**Date :** Juillet 2026

---

# 1. Objet

Ce document définit l'expérience utilisateur et l'organisation des interfaces de SAMTECH CRM V1 Starter.

L'application est conçue d'abord pour le smartphone, puis adaptée à la tablette et à l'ordinateur. Elle s'adresse à des utilisateurs professionnels qui connaissent WhatsApp mais pas nécessairement les logiciels CRM.

L'expérience doit rendre le parcours suivant naturel :

**Enregistrer → Qualifier → Relancer → Convertir → Facturer → Encaisser → Fidéliser**

---

# 2. Objectifs UX

1. permettre une prise en main sans formation longue ;
2. rendre les actions quotidiennes accessibles en quelques gestes ;
3. afficher les priorités commerciales dès l'accueil ;
4. éviter les erreurs de saisie et les pertes de données ;
5. conserver une interface compréhensible hors connexion ;
6. faciliter le passage entre SAMTECH CRM et WhatsApp ;
7. rendre la facturation utilisable sur un petit écran ;
8. expliquer clairement les limites de la PWA locale.

---

# 3. Principes de conception

## 3.1 Simplicité

Chaque écran poursuit un objectif principal. Les options avancées sont disponibles sans encombrer le parcours courant.

## 3.2 Priorité à l'action

Les écrans mettent en avant ce que l'utilisateur doit faire maintenant : ajouter un prospect, effectuer une relance, finaliser une facture ou enregistrer un paiement.

## 3.3 Langage métier

Utiliser des termes familiers : Prospect, Client, Relance, Produit, Facture, Paiement. Éviter les termes techniques comme IndexedDB, transaction ou service worker dans l'interface normale.

## 3.4 Confirmation visible

Après une action, l'utilisateur comprend immédiatement si elle a été enregistrée, refusée ou nécessite une étape supplémentaire.

## 3.5 Contrôle humain

WhatsApp est ouvert avec un message préparé, mais l'utilisateur confirme lui-même l'envoi. L'interface ne simule pas une automatisation inexistante.

## 3.6 Divulgation progressive

Afficher d'abord les informations essentielles, puis les détails et options secondaires sur demande.

## 3.7 Cohérence

Les mêmes statuts, couleurs, libellés et actions se comportent de façon identique dans tous les modules.

---

# 4. Architecture de l'information

```text
Accueil
├── Résumé du jour
├── Relances prioritaires
├── Indicateurs
└── Actions rapides

Prospects
├── Liste et filtres
├── Création rapide
├── Fiche prospect
├── Relances
├── Intérêts produits
└── Conversion

Relances
├── Aujourd'hui
├── En retard
├── À venir
└── Terminées

Clients
├── Liste
├── Fiche 360°
├── Achats
├── Factures
└── Paiements

Plus
├── Campagnes
├── Produits et services
├── Factures
├── Paiements
├── Statistiques
├── Modèles de messages
├── Localités
├── Sauvegarde
└── Paramètres
```

---

# 5. Navigation mobile

La barre inférieure comporte cinq entrées :

1. **Accueil** ;
2. **Prospects** ;
3. **Relances** ;
4. **Clients** ;
5. **Plus**.

Règles :

- icône et libellé toujours visibles ;
- élément actif clairement identifiable ;
- barre accessible au pouce ;
- prise en compte de la zone sûre iPhone ;
- aucun menu essentiel derrière un geste caché ;
- compteur possible sur Relances.

---

# 6. Navigation tablette et ordinateur

À partir d'une largeur adaptée, la barre inférieure devient une barre latérale.

La barre latérale peut afficher :

- logo SAMTECH CRM ;
- navigation principale ;
- raccourcis secondaires ;
- état hors ligne ;
- verrouillage ;
- paramètres.

Les écrans larges peuvent utiliser une disposition maître/détail, par exemple liste de prospects à gauche et fiche à droite, sans rendre cette disposition obligatoire sur tablette étroite.

---

# 7. En-tête

L'en-tête contient selon l'écran :

- titre ;
- bouton Retour sur les sous-écrans ;
- recherche ;
- filtre ;
- menu contextuel ;
- état de sauvegarde ou hors ligne si pertinent.

Le titre et l'action principale doivent rester visibles sans surcharger l'espace.

---

# 8. Actions principales

Sur mobile, l'action principale peut être présentée par :

- bouton flottant « + » dans une liste ;
- bouton pleine largeur dans un état vide ;
- bouton fixe en bas d'un formulaire ;
- bouton principal dans l'en-tête lorsqu'il reste accessible.

Un seul bouton principal visuellement dominant par écran.

---

# 9. Onboarding

## Étape 1 — Bienvenue

Présenter en trois phrases :

- centraliser les prospects ;
- organiser les relances WhatsApp ;
- facturer et suivre les paiements.

## Étape 2 — Entreprise

Demander seulement :

- nom de l'entreprise ;
- devise ;
- pays ;
- téléphone facultatif.

Les autres paramètres peuvent être complétés plus tard.

## Étape 3 — Sécurité

Proposer le PIN avec une explication honnête de sa portée. L'utilisateur peut différer selon la règle validée.

## Étape 4 — Données

Choix :

- commencer avec une base vide ;
- utiliser des données de démonstration ;
- restaurer une sauvegarde.

## Étape 5 — Installation

Afficher des instructions adaptées au navigateur pour installer la PWA, sans bloquer l'utilisation dans un onglet.

---

# 10. Écran de verrouillage

Contenu :

- logo ;
- nom du produit ;
- clavier numérique ;
- indicateur discret du nombre de chiffres ;
- message d'erreur ;
- temps d'attente après tentatives ;
- aide « PIN oublié » expliquant la réinitialisation complète et la restauration éventuelle d'une sauvegarde.

Le contenu CRM ne doit pas être visible derrière l'écran verrouillé.

Le parcours « PIN oublié » doit afficher clairement que toutes les données locales seront effacées. Il exige une confirmation renforcée, puis propose de restaurer une sauvegarde et de créer un nouveau PIN.

---

# 11. Tableau de bord

## Zone supérieure

- salutation ou nom de l'entreprise ;
- date ;
- indicateur hors ligne ;
- action de verrouillage.

## Résumé du jour

- relances aujourd'hui ;
- relances en retard ;
- prospects chauds ;
- factures en retard.

## Indicateurs

- prospects ;
- clients ;
- taux de conversion ;
- montant encaissé sur la période.

## Actions rapides

- Nouveau prospect ;
- Voir les relances ;
- Nouvelle facture ;
- Nouvelle campagne.

## Tendances

Une ou deux visualisations simples : produits les plus demandés et ventes mensuelles. Les graphiques détaillés restent dans Statistiques.

---

# 12. État vide du tableau de bord

Lorsque la base est vide :

- éviter les cartes remplies de zéros sans explication ;
- afficher le bénéfice de la première action ;
- proposer « Ajouter mon premier prospect » ;
- proposer facultativement les données de démonstration ;
- rappeler que les données sont stockées sur l'appareil.

---

# 13. Liste des prospects

## En-tête

- titre et nombre de résultats ;
- recherche ;
- bouton Filtrer ;
- ajout rapide.

## Carte prospect mobile

- nom ;
- numéro ou entreprise en secondaire ;
- localité ;
- badges statut et intérêt ;
- produit principal demandé ;
- prochaine relance ;
- action WhatsApp rapide.

## Actions par carte

- ouvrir la fiche ;
- WhatsApp ;
- programmer une relance ;
- menu secondaire.

Un balayage gestuel ne doit pas être l'unique moyen d'accéder à une action.

---

# 14. Recherche et filtres prospects

Recherche par nom, numéro ou entreprise.

Filtres :

- statut ;
- intérêt ;
- localité ;
- produit ;
- tag ;
- source ;
- période ;
- actifs/archivés.

Sur mobile, les filtres s'ouvrent dans un panneau inférieur ou plein écran.

Règles :

- afficher le nombre de filtres actifs ;
- permettre de tout réinitialiser ;
- afficher les filtres actifs sous forme de puces ;
- conserver les filtres lors du retour depuis une fiche ;
- expliquer « Aucun résultat » et proposer une réinitialisation.

---

# 15. Création rapide d'un prospect

Le premier écran demande :

- nom ou libellé ;
- numéro WhatsApp ;
- localité ;
- produit demandé ;
- niveau d'intérêt ;
- prochaine relance facultative.

Les informations secondaires sont accessibles dans « Plus de détails » :

- email ;
- entreprise ;
- profession ;
- source ;
- tags ;
- notes ;
- date du premier contact.

Le formulaire doit :

- utiliser un clavier téléphonique ;
- afficher le pays et l'indicatif ;
- détecter les doublons avant validation ;
- permettre l'enregistrement même si certains champs secondaires sont vides ;
- conserver la saisie après une erreur.

---

# 16. Avertissement de doublon

Si un numéro existe :

- afficher le contact correspondant ;
- indiquer son statut ;
- proposer « Ouvrir la fiche » ;
- proposer « Créer quand même » avec confirmation ;
- ne pas supprimer la saisie en cours.

---

# 17. Fiche prospect

## En-tête

- nom ;
- statut ;
- intérêt ;
- menu Modifier/Archiver/Perdu.

## Actions rapides

- WhatsApp ;
- Relancer ;
- Ajouter une note ;
- Convertir en client.

## Sections

1. prochaine action ;
2. coordonnées ;
3. produits demandés ;
4. qualification et tags ;
5. notes épinglées ;
6. chronologie.

Sur mobile, utiliser des sections repliables uniquement si cela améliore la lisibilité. La prochaine action et les coordonnées restent immédiatement visibles.

---

# 18. Chronologie

Chaque événement affiche :

- icône ;
- titre ;
- date et heure ;
- résumé ;
- accès au détail si nécessaire.

Les types financiers sont visuellement distincts des notes, sans reposer uniquement sur la couleur.

Filtres facultatifs : Tout, Relances, Messages, Factures, Paiements, Notes.

---

# 19. Conversion en client

Parcours :

1. toucher « Convertir en client » ;
2. afficher un résumé du contact ;
3. demander la date de conversion ;
4. proposer « Créer une facture maintenant » ;
5. confirmer ;
6. afficher la fiche client ou le formulaire de facture.

Le message doit expliquer que l'historique est conservé. La conversion ne doit pas ressembler à une duplication ou suppression.

---

# 20. Liste des relances

Onglets :

- Aujourd'hui ;
- En retard ;
- À venir ;
- Terminées.

Chaque carte affiche :

- heure ou retard ;
- contact ;
- priorité ;
- motif ;
- canal ;
- message prévu ;
- action principale.

Ordre : retard le plus ancien, priorité haute, heure proche.

---

# 21. Exécution d'une relance WhatsApp

```text
Relance
  → choisir ou vérifier le modèle
  → prévisualiser le message résolu
  → corriger les variables manquantes
  → ouvrir WhatsApp
  → revenir dans SAMTECH CRM
  → confirmer « Relance effectuée »
  → ajouter un résultat
  → programmer la prochaine action facultative
```

Après le retour de WhatsApp, afficher un panneau clair :

- Relance effectuée ;
- Reporter ;
- Annuler ;
- Garder en attente.

---

# 22. Création d'une relance

Champs :

- contact prérempli ;
- date ;
- heure ;
- canal ;
- priorité ;
- motif ;
- modèle de message facultatif ;
- aperçu.

Raccourcis : Aujourd'hui, Demain, Dans 3 jours, Dans 7 jours.

Les raccourcis ne remplacent pas le choix précis de la date.

---

# 23. Modèles de messages

Liste avec :

- nom ;
- catégorie ;
- aperçu ;
- statut.

Éditeur :

- champ Nom ;
- catégorie ;
- zone de texte confortable ;
- bouton Insérer une variable ;
- aperçu avec un contact exemple ;
- compteur de caractères indicatif ;
- validation des variables inconnues.

Les variables apparaissent sous forme visuellement distincte sans transformer le texte en éditeur complexe.

## Parcours réellement livré au Sprint 3

- `/follow-ups` expose les vues Aujourd'hui, En retard, À venir et Terminées, la recherche par contact, les filtres canal/priorité et le tri par échéance ou priorité ;
- `/follow-ups/new` accepte un contact prérempli depuis sa fiche et exige une confirmation pour une date passée ou un doublon à 60 minutes ;
- `/follow-ups/[id]` regroupe prévisualisation texte, résolution des variables, préparation explicite du lien WhatsApp, réalisation avec note, report et annulation ;
- `/follow-ups/[id]/edit` ne modifie que les occurrences `PLANIFIEE` ;
- `/message-templates` regroupe liste, création, aperçu texte, modification, duplication, archivage et consultation des archives.

Une variable sans valeur reste visible dans le message et bloque la préparation du lien. L'utilisateur peut modifier le texte final, ou confirmer la substitution vide. La préparation crée l'instantané et l'événement `WHATSAPP_OPENED`, affiche ensuite un lien distinct « Ouvrir WhatsApp » et ne présente jamais le message comme envoyé. La limite réseau ou application installée de WhatsApp est rappelée dans l'écran.

---

# 24. Liste des clients

Chaque carte affiche :

- nom ;
- localité ;
- dernier achat ;
- montant total facturé ou dépensé selon libellé ;
- solde dû ;
- action WhatsApp.

Filtres : localité, produit acheté, activité récente, solde dû et période de conversion.

---

# 25. Fiche client 360°

## Résumé

- coordonnées ;
- client depuis ;
- dernier achat ;
- total facturé ;
- total encaissé ;
- solde dû.

## Actions

- WhatsApp ;
- Nouvelle facture ;
- Paiement ;
- Relance ;
- Note.

## Onglets ou sections

- Aperçu ;
- Factures ;
- Paiements ;
- Produits ;
- Chronologie.

Sur mobile, une barre d'onglets défilante peut être utilisée si elle reste accessible.

---

# 26. Produits et services

## Liste

- recherche ;
- filtre Produit/Service ;
- catégorie ;
- actifs/inactifs ;
- prix.

## Formulaire

- nom ;
- type ;
- catégorie ;
- prix ;
- taxe ;
- unité ;
- description ;
- statut.

Le prix doit utiliser un champ numérique adapté à la devise et présenter le format final.

---

# 27. Liste des factures

Onglets ou filtres :

- Toutes ;
- Brouillons ;
- À encaisser ;
- Payées ;
- En retard ;
- Annulées.

Chaque carte affiche :

- numéro ou Brouillon ;
- client ;
- date ;
- total ;
- solde ;
- statut ;
- échéance.

Actions rapides : ouvrir, partager le PDF, enregistrer un paiement.

---

# 28. Création d'une facture

Le parcours mobile est divisé en étapes simples.

## Étape 1 — Client et dates

- client ;
- date d'émission ;
- échéance ;
- devise.

## Étape 2 — Articles

- sélectionner un produit ;
- quantité ;
- prix ;
- remise ;
- taxe ;
- ajouter une ligne libre.

## Étape 3 — Résumé

- sous-total ;
- remises ;
- taxes ;
- total ;
- conditions et note.

## Étape 4 — Action

- Enregistrer le brouillon ;
- Prévisualiser ;
- Émettre la facture.

Une barre de total reste visible lors de l'édition des lignes.

---

# 29. Éditeur de lignes de facture

Sur mobile, chaque ligne est une carte compacte.

Elle affiche :

- désignation ;
- quantité × prix ;
- remise/taxe ;
- total ;
- modifier ;
- supprimer.

L'édition détaillée s'ouvre dans un panneau ou un écran secondaire. Éviter un tableau horizontal complexe sur smartphone.

---

# 30. Émission d'une facture

Avant émission :

- afficher le numéro qui sera attribué ou indiquer qu'il sera attribué ;
- vérifier client, lignes, devise et total ;
- signaler les données manquantes ;
- expliquer qu'une facture émise n'est plus modifiable comme un brouillon ;
- demander confirmation.

Après émission :

- afficher le numéro ;
- proposer Voir le PDF ;
- Partager ;
- Enregistrer un paiement ;
- Retour au client.

---

# 31. PDF et partage

Écran d'aperçu :

- miniature ou aperçu lisible ;
- numéro et client ;
- Télécharger ;
- Partager ;
- Partager via WhatsApp si disponible ;
- message si le partage natif n'est pas pris en charge.

Le téléchargement doit rester disponible comme solution de repli.

---

# 32. Paiements

## Enregistrement

- facture ;
- total ;
- déjà payé ;
- solde ;
- montant ;
- date ;
- mode ;
- référence ;
- note.

Boutons rapides : Payer le solde, Moitié du solde, Montant personnalisé, si cela ne crée pas d'ambiguïté.

Après validation, afficher le nouveau solde et le statut de la facture.

## Liste

- date ;
- client ;
- facture ;
- montant ;
- mode ;
- actif ou annulé.

---

# 33. Campagnes

## Étape 1 — Informations

- nom ;
- objectif ;
- prospects, clients ou tous.

## Étape 2 — Ciblage

- localités ;
- produits demandés ou achetés ;
- statuts ;
- intérêts ;
- tags ;
- sources ;
- périodes.

Afficher le nombre de destinataires en temps réel ou après calcul explicite.

## Étape 3 — Destinataires

- liste ;
- recherche ;
- exclusion individuelle ;
- numéros invalides ;
- doublons supprimés ;
- résumé des critères.

## Étape 4 — Message

- modèle ;
- édition ;
- variables ;
- prévisualisation sur plusieurs contacts.

## Étape 5 — Confirmation

- nombre final ;
- rappel du fonctionnement assisté ;
- lancer.

---

# 34. Exécution d'une campagne

Écran focalisé sur un destinataire à la fois :

- progression `12 / 48` ;
- nom et numéro ;
- message personnalisé ;
- Ouvrir WhatsApp ;
- Confirmer contacté ;
- Ignorer ;
- Signaler une erreur ;
- Quitter et reprendre plus tard.

La campagne ne doit jamais avancer automatiquement après l'ouverture de WhatsApp sans retour et confirmation de l'utilisateur.

---

# 35. Statistiques

## Filtres globaux

- période ;
- localité ;
- produit.

## Sections

- Prospection ;
- Conversion ;
- Produits ;
- Ventes ;
- Encaissements ;
- Relances.

Chaque graphique doit :

- avoir un titre explicite ;
- préciser la période ;
- afficher les valeurs exactes ;
- offrir une alternative textuelle ou tabulaire ;
- éviter les effets visuels décoratifs ;
- gérer le manque de données.

---

# 36. Localités, catégories et tags

Ces écrans secondaires utilisent un modèle cohérent :

- liste recherchable ;
- ajout ;
- modification ;
- archivage ;
- compteur d'utilisation ;
- avertissement si l'élément est référencé.

Sur mobile, l'édition peut s'ouvrir dans un panneau inférieur.

---

# 37. Sauvegarde et restauration

## Écran Sauvegarde

- état des données locales ;
- date de dernière sauvegarde ;
- taille estimée ;
- bouton Exporter ;
- avertissement de confidentialité ;
- recommandation de stockage sûr.

## Écran Restauration

1. choisir le fichier ;
2. analyser ;
3. afficher version, date et nombre d'éléments ;
4. signaler les erreurs ;
5. confirmer le remplacement ;
6. afficher la progression ;
7. confirmer le résultat.

Ne jamais placer « Effacer les données » à proximité immédiate d'une action courante.

---

# 38. Paramètres

Sections :

- Entreprise ;
- Facturation ;
- Devise et région ;
- Sécurité ;
- Données et sauvegarde ;
- Apparence ;
- Installation PWA ;
- À propos ;
- Diagnostic.

Le diagnostic technique est présenté séparément et reste compréhensible pour le support.

---

# 39. États vides

Chaque état vide contient :

- un titre expliquant la situation ;
- une phrase sur l'utilité du module ;
- une action principale ;
- éventuellement un lien d'aide.

Exemples :

- « Aucun prospect pour le moment » → Ajouter un prospect ;
- « Aucune relance aujourd'hui » → Voir les relances à venir ;
- « Aucun client » → Convertir un prospect ;
- « Aucune facture » → Créer une facture ;
- « Aucun résultat » → Réinitialiser les filtres.

---

# 40. Chargement

- préférer des squelettes pour les listes ;
- utiliser un indicateur de progression pour restauration, migration et PDF ;
- éviter les écrans blancs ;
- ne pas afficher un chargement réseau pour une opération locale courte ;
- annoncer les opérations longues aux technologies d'assistance.

---

# 41. Erreurs

Un message d'erreur doit préciser :

1. ce qui n'a pas fonctionné ;
2. si les données ont été enregistrées ;
3. ce que l'utilisateur peut faire ;
4. un code de support si nécessaire.

Exemples :

- « La facture n'a pas été enregistrée. Vérifiez les montants puis réessayez. »
- « Le fichier ne correspond pas à une sauvegarde SAMTECH CRM valide. Vos données actuelles n'ont pas été modifiées. »

---

# 42. Messages de succès

Les confirmations sont brèves et spécifiques :

- Prospect enregistré ;
- Relance programmée ;
- Client créé ;
- Facture émise ;
- Paiement enregistré ;
- Sauvegarde créée.

Pour une action annulable sans risque, proposer Annuler pendant quelques secondes. Les opérations financières utilisent une procédure explicite plutôt qu'un simple Undo.

---

# 43. Confirmations

Une confirmation est requise pour :

- archivage avec impact ;
- prospect perdu avec relances actives ;
- conversion ;
- émission de facture ;
- annulation de facture ;
- renversement de paiement ;
- lancement de campagne ;
- remplacement par restauration ;
- désactivation du PIN ;
- effacement des données.

Le bouton dangereux indique l'action exacte, jamais seulement « Oui ».

---

# 44. Formulaires

- labels visibles au-dessus des champs ;
- champs requis clairement indiqués ;
- exemple ou aide sous le champ ;
- erreur près du champ ;
- clavier adapté au type ;
- ordre logique ;
- sauvegarde explicite ;
- avertissement avant de quitter une saisie non enregistrée ;
- remplissage automatique utilisé avec prudence ;
- aucune validation agressive avant que l'utilisateur commence.

---

# 45. Couleurs de statuts

Proposition sémantique à valider dans le design system :

- Nouveau : bleu ;
- Contacté : indigo ;
- Intéressé : turquoise ;
- À relancer : orange ;
- Négociation : violet ;
- Converti/Payée : vert ;
- Perdu/Annulée : gris ou rouge atténué ;
- En retard : rouge ;
- Brouillon : gris.

Chaque statut utilise aussi un texte et, si utile, une icône. La couleur seule ne suffit jamais.

---

# 46. Typographie et densité

- corps lisible sur mobile, généralement 16 px ;
- hiérarchie claire des titres ;
- maximum raisonnable de deux familles ou une seule famille système ;
- chiffres financiers alignés et lisibles ;
- espaces suffisants entre actions ;
- mode compact possible plus tard sur ordinateur, non prioritaire en V1.

Les polices nécessaires doivent être disponibles hors ligne.

---

# 47. Grille responsive

Références à valider :

- mobile : 320 à 767 px ;
- tablette : 768 à 1023 px ;
- ordinateur : 1024 px et plus.

Principes :

- marges mobiles de 16 px environ ;
- contenu principal limité en largeur sur ordinateur ;
- cartes en une colonne sur mobile ;
- deux à quatre colonnes pour les indicateurs selon l'espace ;
- tableaux remplacés par des cartes sur petits écrans ;
- aucun défilement horizontal pour les parcours essentiels.

---

# 48. Accessibilité

Objectif : bonnes pratiques WCAG 2.2 niveau AA lorsque applicables.

- contraste suffisant ;
- focus visible ;
- navigation clavier ;
- libellés programmatiques ;
- ordre de tabulation logique ;
- zones tactiles d'au moins environ 44 × 44 px ;
- erreurs annoncées ;
- modales avec gestion correcte du focus ;
- graphiques accompagnés de valeurs ;
- réduction des animations ;
- textes redimensionnables ;
- pas d'information uniquement colorée.

---

# 49. États hors ligne

## Bandeau

Afficher un bandeau discret « Hors ligne — vos données locales restent disponibles ».

## Actions externes

Lors d'une action WhatsApp ou partage qui échoue, préserver le message et proposer Réessayer ou Copier.

## Mise à jour

Afficher « Mise à jour disponible » avec Appliquer plus tard ou Actualiser lorsque le travail est enregistré.

## Stockage

Afficher des alertes progressives et proposer une sauvegarde. Ne jamais supprimer automatiquement les données métier.

---

# 50. Installation PWA

L'aide doit détecter le contexte :

- Android/Chrome : bouton ou instruction d'installation ;
- iPhone/Safari : Partager → Sur l'écran d'accueil ;
- ordinateur : icône d'installation du navigateur ;
- navigateur non compatible : continuer dans le navigateur.

Ne pas afficher continuellement la demande si l'utilisateur la refuse.

---

# 51. Performance perçue

- afficher immédiatement la structure de l'écran ;
- éviter les animations longues ;
- charger PDF et graphiques à la demande ;
- conserver la position et les filtres au retour ;
- utiliser la mise à jour optimiste seulement si un rollback fiable existe ;
- privilégier la confirmation après écriture locale pour les données critiques.

---

# 52. Raccourcis utiles

## Mobile

- appui sur numéro → WhatsApp ou options ;
- action rapide depuis une carte ;
- raccourcis de date pour relances ;
- dupliquer un modèle ;
- créer une facture depuis le client.

## Ordinateur

- `/` ou `Ctrl+K` pour recherche globale future ;
- raccourcis de création documentés ;
- navigation clavier dans les listes.

Les raccourcis clavier ne sont pas nécessaires à la première livraison mobile.

---

# 53. Microcopie

Le ton doit être :

- professionnel ;
- simple ;
- direct ;
- rassurant sans minimiser les risques ;
- orienté vers l'action.

Éviter : « Erreur 500 », « Payload invalide », « Transaction abortée ».

Préférer : « L'enregistrement n'a pas abouti. Vos données précédentes sont intactes. Réessayez. »

---

# 54. Internationalisation future

Même si la V1 est en français :

- ne pas intégrer les textes directement dans le domaine ;
- centraliser les libellés ;
- formater dates, nombres et devises selon la région ;
- éviter les mises en page dépendant de la longueur française ;
- conserver des codes internes stables.

---

# 55. Composants partagés

## Primitives

- Button ;
- Input ;
- Select ;
- Textarea ;
- Checkbox ;
- Radio ;
- Dialog ;
- Drawer/Sheet ;
- Tabs ;
- Badge ;
- Card ;
- Toast ;
- Alert ;
- Skeleton ;
- EmptyState ;
- ConfirmDialog.

## Métier

- ContactCard ;
- StatusBadge ;
- InterestBadge ;
- FollowUpCard ;
- MoneyDisplay ;
- InvoiceStatus ;
- PaymentMethod ;
- TimelineItem ;
- ProductPicker ;
- LocationPicker ;
- MessagePreview ;
- FilterBar ;
- OfflineBanner.

Les composants métier appliquent les mêmes libellés et comportements partout.

---

# 56. Tests UX

## Scénarios

- première utilisation ;
- ajout d'un prospect en moins d'une minute ;
- détection d'un doublon ;
- relance WhatsApp ;
- conversion ;
- facture avec trois lignes ;
- deux paiements partiels ;
- campagne de dix destinataires ;
- sauvegarde et restauration ;
- utilisation en mode avion.

## Utilisateurs pilotes

Tester avec des utilisateurs de plusieurs secteurs et niveaux techniques, sur Android et iPhone.

## Mesures

- taux de réussite ;
- temps ;
- erreurs ;
- demandes d'aide ;
- compréhension des statuts ;
- confiance dans la sauvegarde ;
- satisfaction.

---

# 57. Critères d'acceptation UX

La V1 est acceptable si :

1. les utilisateurs trouvent les cinq modules principaux sans aide ;
2. un prospect peut être ajouté rapidement ;
3. les relances du jour sont immédiatement visibles ;
4. le passage à WhatsApp est compris ;
5. la conversion ne crée pas de confusion ;
6. une facture est réalisable sur smartphone ;
7. le solde d'une facture est compréhensible ;
8. une campagne peut être interrompue et reprise ;
9. les états hors ligne et sauvegarde sont compris ;
10. aucune action critique ne dépend uniquement d'une couleur ou d'un geste caché.

---

# 58. Livrables design futurs

Après validation de ce document :

- carte complète des écrans ;
- wireframes basse fidélité ;
- prototype cliquable des parcours critiques ;
- design system ;
- composants responsives ;
- modèle de facture ;
- tests utilisateurs ;
- spécifications finales pour le développement.

---

# 59. Prochaine étape documentaire

Après `UI_UX.md`, créer `TESTING.md` afin de formaliser la stratégie de tests fonctionnels, métier, base de données, PWA, sécurité, accessibilité et compatibilité.

---

# 60. Sélection multiple mobile des références

Une association multiple de produits utilise une liste de cases à cocher tactiles plutôt qu'un `<select multiple>`. Le composant fournit une recherche, un résumé du nombre de sélections et un état sélectionné visible. Chaque ligne possède une zone tactile d'au moins 44 px et reste utilisable au clavier.

Les références archivées ne sont pas proposées lors d'une nouvelle association. Une référence déjà associée reste affichée, cochée et désactivée avec l'indication « Inactif », afin qu'une modification sans rapport ne supprime pas l'historique.

---

# 61. Principe directeur

**Chaque écran doit aider l'utilisateur à savoir qui contacter, quelle action accomplir et quel résultat commercial a été obtenu, sans exiger de connaissances techniques.**

---

# 62. Écrans livrés — Sprint 4

- `/clients` présente les contacts convertis, le nombre de résultats, la recherche par identité, téléphone ou entreprise, les filtres de localité, période de conversion et archives, ainsi qu’une réinitialisation explicite.
- `/clients/[id]` présente la fiche 360° : identité, date de conversion, coordonnées, localité, tags, notes, intérêts conservés, relances passées et futures, prochaine relance, actions WhatsApp et relance, puis chronologie commerciale stable du plus récent au plus ancien.
- la fiche prospect propose une confirmation explicite avec date et heure ; après conversion, cette action est remplacée par « Ouvrir la fiche client » ;
- la liste des prospects actifs masque les statuts `CONVERTI` par défaut ;
- les sections Factures, Paiements, Achats et chiffre d’affaires sont des états vides explicitement rattachés aux Sprints 5 et 6. Aucun zéro financier n’est présenté comme une donnée réelle avant ces modules.

## Mise en œuvre Sprint 5 — Factures

Les routes actives sont `/invoices`, `/invoices/new`, `/invoices/[id]` et `/invoices/[id]/edit`. La fiche Client propose « Créer une facture », récapitule total facturé et solde, puis liste les factures et leurs événements. L’éditeur présente chaque ligne en carte mobile avec contrôles tactiles, produit actif ou ligne libre, ordre, retrait confirmé et résumé financier. L’émission et l’annulation demandent une confirmation ; après émission, l’action de modification disparaît. La fiche facture expose ses instantanés, ses totaux, sa chronologie, le téléchargement PDF et le fallback de partage.

---

## Mise en œuvre Sprint 6 — Paiements et créances

Le détail d’une facture émise ou partiellement payée affiche le solde, un formulaire d’encaissement mobile-first, un bouton de remplissage du solde, les six modes, la date, la référence et la note. Une date antérieure affiche un avertissement et demande une confirmation dédiée. Un résumé précède l’écriture définitive.

L’historique affiche les paiements actifs et contrepassés sans proposer d’édition ni de suppression. La contrepassation exige un motif et une confirmation forte. Après chaque opération, le statut, les montants, l’historique et le PDF reflètent immédiatement l’état recalculé.

La route `/payments` réunit les indicateurs encaissé/créances, la liste recherchable et filtrable des paiements, et un onglet Créances avec filtres en retard/à venir, tri et nombre de jours de retard. La fiche client 360° expose facturé, encaissé, solde, retards et historique des paiements.

---

## Mise en œuvre Sprint 7 — Campagnes assistées

Les routes `/campaigns`, `/campaigns/new`, `/campaigns/[id]`, `/campaigns/[id]/edit` et `/campaigns/[id]/run` couvrent liste, critères, prévisualisation, instantané, consultation et exécution. La prévisualisation affiche comptes bruts/admissibles, invalides, archives, doublons, exclusions, numéros masqués, raisons et messages personnalisés.

L’exécution présente une seule carte à la fois avec position, progression, numéro, message figé, note et actions tactiles. « Préparer l’ouverture WhatsApp » enregistre uniquement l’ouverture et révèle un lien distinct; le destinataire suivant n’est jamais ouvert automatiquement. Confirmation, ignorance ou erreur abandonnée restent des actions explicites.

Les résumés indiquent destinataires, confirmés, ignorés, erreurs, restant, taux de traitement et taux de confirmation manuelle. L’interface ne mentionne jamais livraison, lecture, réponse ou conversion attribuée à WhatsApp.

---

## Mise en œuvre Sprint 8 — Tableau de bord et statistiques

La route `/` devient le tableau de bord compact; `/statistics` détaille conversions, relances, flux financiers, ventes, créances, séries, localités, sources, statuts, intérêts et campagnes. La navigation principale expose les deux destinations.

Le sélecteur propose six périodes avec bornes personnalisées inclusives. Chaque carte indique la date métier utilisée. Facturé, encaissé et restant dû ont des couleurs et libellés distincts. Les devises secondaires apparaissent séparément avec avertissement.

Les visualisations sont des barres CSS avec libellé accessible, valeur visible et alternative textuelle. Les zéros sont expliqués, les séries conservent les intervalles vides, et les listes en cartes restent lisibles à 390×844. L’état vide conduit vers le premier prospect et rappelle le stockage local.

---

## Mise en œuvre Sprint 9 — Paramètres locaux

`/settings/backup` présente la responsabilité locale, la date du dernier export, l'avertissement de sensibilité, l'action d'export et un import en deux temps : validation/aperçu puis remplacement renforcé. L'aperçu affiche date, version, total et compteurs métier. Les erreurs restent génériques et n'interprètent jamais le contenu importé comme HTML.

`/settings/security` présente état, activation, modification, désactivation, délai et verrouillage manuel. Sur verrouillage, aucune navigation, nom, téléphone, montant ou indicateur métier n'est rendu. Le panneau « PIN oublié » explique l'irréversibilité et maintient le bouton destructif désactivé tant que la phrase exacte n'est pas saisie. Les écrans restent en une colonne sur mobile et s'élargissent progressivement.

## Stabilisation accessibilité et responsive

Le shell V1 bêta fournit langue française, titres de document par route, lien d’évitement, focus visible, réduction des animations et écrans de récupération. Les routes essentielles sont contrôlées à 320, 360, 390, 768, 1024 et 1440 px ainsi qu’en paysage. Les tableaux ou navigations explicitement défilables peuvent conserver leur propre défilement ; aucun contenu essentiel ne doit imposer un débordement horizontal au document.
