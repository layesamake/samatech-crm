# SAMTECH CRM — RÈGLES MÉTIER

**Document :** `RULES.md`  
**Produit :** SAMTECH CRM  
**Éditeur :** SAMTECH  
**Version du document :** 1.0  
**Statut :** Document de référence  
**Date :** Juillet 2026

---

# 1. Objet

Ce document définit les règles métier de SAMTECH CRM V1 Starter.

Il constitue la référence pour :

- les comportements fonctionnels ;
- les validations ;
- les statuts et transitions ;
- les calculs commerciaux et financiers ;
- les indicateurs ;
- l'intégrité des données ;
- les critères de test.

En cas d'ambiguïté entre une interface et ce document, la règle métier documentée prévaut jusqu'à décision contraire.

---

# 2. Conventions

Chaque règle possède un identifiant stable au format `BR-XXX`.

Les termes **doit**, **ne doit pas** et **obligatoire** expriment une exigence impérative. Les valeurs affichées à l'utilisateur peuvent être traduites, mais les codes internes doivent rester stables.

Les dates et heures sont stockées dans un format non ambigu. L'affichage respecte les paramètres locaux de l'utilisateur.

---

# 3. Règles générales sur les données

## BR-001 — Identifiants

Chaque entité métier doit posséder un identifiant interne unique, indépendant de son nom, numéro visible ou position dans une liste.

## BR-002 — Horodatage

Chaque enregistrement principal doit conserver au minimum sa date de création et sa date de dernière modification.

## BR-003 — Suppression logique

Une donnée déjà utilisée dans un historique ou un document financier doit être archivée ou désactivée, et non supprimée physiquement.

## BR-004 — Suppression définitive

La suppression physique n'est autorisée que pour une donnée sans dépendance, après confirmation explicite, ou dans une fonction spécialisée de purge future.

## BR-005 — Références historiques

L'archivage d'un produit, d'une localité, d'un modèle ou d'un contact ne doit pas rendre illisibles les opérations passées.

## BR-006 — Validation avant écriture

Les données doivent être validées avant leur enregistrement. Une opération invalide ne doit pas produire d'écriture partielle.

## BR-007 — Espaces et casse

Les champs textuels sont nettoyés des espaces inutiles aux extrémités. Les recherches textuelles sont insensibles à la casse.

## BR-008 — Données calculées

Les indicateurs, soldes et totaux doivent être recalculables à partir des données sources. Une valeur mise en cache ne constitue pas l'unique source de vérité.

---

# 4. Numéros de téléphone et WhatsApp

## BR-010 — Numéro principal

Le numéro WhatsApp est obligatoire pour un prospect actif destiné aux relances WhatsApp.

## BR-011 — Normalisation

Le numéro est normalisé pour les comparaisons : suppression des espaces, tirets, parenthèses et préfixes de présentation, puis conversion vers un format international cohérent lorsque le pays peut être déterminé.

## BR-012 — Conservation de l'affichage

L'application peut conserver une version lisible du numéro, mais les recherches et détections de doublons utilisent la version normalisée.

## BR-013 — Doublon potentiel

Si un numéro normalisé existe déjà, l'application avertit l'utilisateur. La création n'est permise qu'après confirmation explicite lorsqu'un cas légitime le justifie.

## BR-014 — Lien WhatsApp

Le lien WhatsApp utilise un numéro international sans espaces ni symbole `+`, selon le format attendu par WhatsApp.

## BR-015 — Statut d'envoi

L'ouverture de WhatsApp ne prouve pas qu'un message a été envoyé. L'état Contacté ou Réalisé nécessite une confirmation de l'utilisateur.

## BR-016 — Consentement et responsabilité

L'utilisateur reste responsable du contenu, du consentement des destinataires et du respect des règles de WhatsApp et de la réglementation applicable.

---

# 5. Prospects

## BR-020 — Identité minimale

Un prospect doit posséder au minimum un nom ou libellé identifiable et un numéro WhatsApp exploitable.

## BR-021 — Statut initial

À la création, le statut par défaut est `NOUVEAU` et le niveau d'intérêt est `NON_QUALIFIE`, sauf choix explicite.

## BR-022 — Statuts autorisés

Les statuts V1 sont :

- `NOUVEAU` ;
- `CONTACTE` ;
- `INTERESSE` ;
- `A_RELANCER` ;
- `NEGOCIATION` ;
- `CONVERTI` ;
- `PERDU`.

## BR-023 — Niveaux d'intérêt

Les niveaux V1 sont :

- `NON_QUALIFIE` ;
- `FROID` ;
- `TIEDE` ;
- `CHAUD`.

## BR-024 — Intérêts produits

Un prospect peut être associé à zéro, un ou plusieurs produits ou services. Chaque intérêt peut conserver une note, une date et, si utile, un niveau d'intérêt propre.

## BR-025 — Statut À relancer

Le statut `A_RELANCER` peut être choisi manuellement. La présence d'une relance planifiée n'impose pas automatiquement ce statut, afin de distinguer le pipeline commercial de l'agenda.

## BR-026 — Prospect perdu

Le passage à `PERDU` doit permettre de renseigner un motif. Les relances futures actives doivent être annulées ou explicitement conservées après confirmation.

## BR-027 — Réactivation

Un prospect perdu peut être réactivé vers un statut actif. Cette transition doit créer un événement dans la chronologie.

## BR-028 — Archivage

Un prospect archivé n'apparaît pas dans les listes actives ni les campagnes par défaut, mais reste consultable dans les historiques et statistiques historiques selon les filtres.

---

# 6. Transitions du prospect

## BR-030 — Transitions normales

Les transitions usuelles sont :

```text
NOUVEAU → CONTACTE → INTERESSE → NEGOCIATION → CONVERTI
                    ↘ A_RELANCER ↗
Tout statut actif → PERDU
PERDU → CONTACTE | INTERESSE | A_RELANCER
```

## BR-031 — Souplesse contrôlée

La V1 autorise l'utilisateur à passer directement entre statuts actifs lorsque son activité le nécessite. Les transitions importantes sont historisées.

## BR-032 — Conversion réservée

Le statut `CONVERTI` est appliqué par l'action métier de conversion en client, et non par une simple modification de liste.

## BR-033 — Retour après conversion

Un client ne redevient pas automatiquement prospect. Une correction de conversion doit utiliser une procédure dédiée et ne doit être possible que si aucune donnée client ou financière incompatible n'existe.

---

# 7. Conversion prospect vers client

## BR-040 — Unicité du contact

La conversion ne crée pas une copie indépendante. Le même contact conserve son identifiant ou une relation d'identité unique entre sa fiche de contact et son profil client.

## BR-041 — Données conservées

Les coordonnées, localités, tags, notes, intérêts, relances et événements du prospect sont conservés.

## BR-042 — Date de conversion

La conversion enregistre une date et une heure. Elles peuvent être corrigées avec traçabilité si une conversion historique est saisie.

## BR-043 — Déclenchement

La conversion peut être réalisée explicitement avant la première facture ou proposée lors de la création de la première vente.

Précision d’implémentation Sprint 4 : un prospect `PERDU` suit d’abord la réactivation prévue par BR-027 avant sa conversion. La création ou modification standard ne peut jamais attribuer `CONVERTI`, et aucun retour Client → Prospect n’est proposé sans la procédure dédiée de BR-033.

## BR-044 — Statut après conversion

Le prospect reçoit le statut `CONVERTI`. Le contact apparaît dans les clients et n'apparaît plus dans les prospects actifs par défaut.

## BR-045 — Factures antérieures

Une facture ne peut être émise qu'à un client. Si l'utilisateur part d'un prospect, l'application doit proposer sa conversion avant l'émission.

## BR-046 — Indicateurs

Une personne convertie compte comme prospect historique et comme client. Elle ne doit pas être comptée deux fois dans un indicateur de contacts uniques.

---

# 8. Localités

## BR-050 — Noms

Une localité doit avoir un nom non vide. Deux localités de même niveau et même parent ne doivent pas partager exactement le même nom normalisé.

## BR-051 — Hiérarchie

La hiérarchie autorisée est : Pays → Région → Ville → Quartier. Les niveaux peuvent être partiellement utilisés.

## BR-052 — Archivage

Une localité utilisée est archivée plutôt que supprimée. Elle reste associée aux contacts existants.

## BR-053 — Statistiques

Les statistiques utilisent le niveau sélectionné et ne doivent pas mélanger implicitement ville et quartier.

---

# 9. Produits et services

## BR-060 — Nom et type

Chaque élément du catalogue possède un nom non vide et un type `PRODUIT` ou `SERVICE`.

## BR-061 — Prix

Le prix de vente par défaut est supérieur ou égal à zéro. Un prix nul est autorisé pour un service gratuit ou un prix à définir.

## BR-062 — Produit inactif

Un produit inactif n'est plus proposé par défaut dans les nouveaux intérêts ou factures, mais demeure visible dans les historiques.

## BR-063 — Prix historique

La modification du prix catalogue ne modifie jamais les lignes de facture existantes.

## BR-064 — Demande et vente

Un produit demandé est comptabilisé à partir des intérêts prospects. Un produit vendu est comptabilisé à partir des lignes de factures émises non annulées, selon les règles statistiques.

---

# 10. Relances

## BR-070 — Contact obligatoire

Toute relance est associée à un prospect ou client existant.

## BR-071 — Date

Une nouvelle relance planifiée doit posséder une date et une heure. Une date passée est permise avec avertissement si l'utilisateur enregistre un historique.

## BR-072 — Statuts

Les statuts sont :

- `PLANIFIEE` ;
- `REALISEE` ;
- `REPORTEE` ;
- `ANNULEE`.

## BR-073 — Relance en retard

Une relance est en retard lorsque son échéance est antérieure à l'instant courant et que son statut est `PLANIFIEE`.

## BR-074 — Report

Le report clôt l'occurrence initiale avec le statut `REPORTEE` et crée une nouvelle relance `PLANIFIEE`, reliée à la précédente.

## BR-075 — Réalisation

La réalisation enregistre l'heure effective et peut inclure une note de résultat.

## BR-076 — Ouverture WhatsApp

L'ouverture de WhatsApp est enregistrée comme événement technique ou commercial, mais ne termine pas automatiquement la relance.

## BR-077 — Relances multiples

Un contact peut avoir plusieurs relances futures. L'interface doit signaler les doublons proches sans les interdire systématiquement.

Pour la V1, deux relances `PLANIFIEE` du même contact sont considérées comme proches lorsque leurs échéances sont séparées de **60 minutes ou moins**. Cette fenêtre est portée par la constante métier `FOLLOW_UP_DUPLICATE_WINDOW_MINUTES`. Elle déclenche un avertissement présentant la relance similaire ; l'utilisateur peut confirmer explicitement la création. Elle ne constitue ni une contrainte d'unicité ni un blocage automatique.

## BR-078 — Prochaine relance

La prochaine relance affichée pour un contact est la relance `PLANIFIEE` la plus proche dans le futur, ou la plus ancienne en retard s'il en existe.

---

# 11. Modèles de messages

## BR-080 — Contenu

Un modèle doit avoir un nom et un contenu non vides.

## BR-081 — Variables autorisées

Seules les variables documentées sont interprétées. Une variable inconnue doit être signalée.

## BR-082 — Valeur absente

Si une variable obligatoire n'a pas de valeur, l'utilisateur doit pouvoir compléter la donnée, modifier le message ou confirmer une substitution vide avant l'ouverture de WhatsApp.

Pour `{{produit}}`, tous les produits ou services actifs associés au prospect sont utilisés. Leurs noms sont triés alphabétiquement en français puis réunis avec `, ` afin que la résolution soit déterministe et lisible ; aucun produit n'est sélectionné arbitrairement.

## BR-083 — Instantané

Le message final utilisé lors d'une relance ou campagne doit pouvoir être conservé dans l'historique, indépendamment des modifications futures du modèle.

## BR-084 — Archivage

Un modèle archivé n'est plus proposé pour une nouvelle action mais reste identifiable dans les opérations passées.

---

# 12. Campagnes

## BR-090 — Campagne assistée

La V1 ne réalise pas d'envoi automatique en masse. Chaque destinataire est traité avec une action contrôlée par l'utilisateur.

## BR-091 — Statuts

Les statuts sont :

- `BROUILLON` ;
- `PRETE` ;
- `EN_COURS` ;
- `TERMINEE` ;
- `ANNULEE`.

## BR-092 — Sélection

Avant le lancement, l'application affiche le nombre et la liste des destinataires correspondant aux critères.

## BR-093 — Instantané des destinataires

Au lancement, la liste des destinataires est figée pour garantir une progression stable. Les changements ultérieurs dans la base n'ajoutent ni ne retirent silencieusement des destinataires.

## BR-094 — Exclusions

Les contacts archivés, sans numéro valide ou explicitement exclus ne sont pas traités.

## BR-095 — Doublons

Un numéro normalisé ne doit apparaître qu'une fois dans la même campagne, même s'il est relié à plusieurs critères.

## BR-096 — État par destinataire

Les états initiaux sont :

- `A_TRAITER` ;
- `OUVERT_DANS_WHATSAPP` ;
- `CONFIRME_CONTACTE` ;
- `IGNORE` ;
- `ERREUR`.

## BR-097 — Confirmation

Seule une confirmation de l'utilisateur produit l'état `CONFIRME_CONTACTE`.

## BR-098 — Campagne terminée

Une campagne est terminée lorsque tous ses destinataires sont dans un état final : confirmé, ignoré ou erreur abandonnée.

## BR-099 — Reprise

Une campagne en cours reprend au premier destinataire non finalisé.

---

# 13. Factures

## BR-100 — Client obligatoire

Une facture émise doit être associée à un client.

## BR-101 — Numéro unique

Chaque facture émise possède un numéro unique et immuable dans l'espace de données local.

## BR-102 — Attribution du numéro

Le numéro définitif est attribué à l'émission. Un brouillon peut utiliser un identifiant temporaire sans consommer de numéro définitif.

## BR-103 — Format

Le format par défaut est configurable, par exemple `FAC-2026-0001`. La séquence doit rester strictement croissante dans son périmètre.

## BR-104 — Statuts

- `BROUILLON` ;
- `EMISE` ;
- `PARTIELLEMENT_PAYEE` ;
- `PAYEE` ;
- `ANNULEE`.

## BR-105 — Lignes obligatoires

Une facture émise doit contenir au moins une ligne valide.

## BR-106 — Quantité

La quantité doit être strictement positive. Les quantités décimales sont autorisées si le produit ou service le justifie.

## BR-107 — Prix unitaire

Le prix unitaire doit être supérieur ou égal à zéro.

## BR-108 — Devise

Toutes les lignes d'une facture utilisent la même devise.

## BR-109 — Instantané

À l'émission, les informations de l'entreprise, du client, des produits, des prix, taxes et conditions sont copiées dans la facture.

## BR-110 — Modification après émission

Une facture émise ne doit pas être modifiée comme un brouillon. Toute correction suit une procédure contrôlée : annulation et nouvelle facture dans la V1, sauf fonction d'avoir documentée ultérieurement.

## BR-111 — Annulation

Une facture peut être annulée avec motif. Elle conserve son numéro et son historique.

## BR-112 — Facture payée

Une facture payée ne peut être annulée sans traitement préalable de ses paiements et confirmation renforcée.

## BR-113 — Échéance

La date d'échéance ne doit pas précéder la date d'émission, sauf import historique explicitement confirmé.

---

# 14. Calculs financiers

## BR-120 — Représentation monétaire

Les montants sont calculés avec une représentation décimale sûre ou en unité monétaire minimale. Les nombres flottants binaires ne doivent pas être utilisés directement comme source de vérité financière.

## BR-121 — Total brut de ligne

```text
total_brut_ligne = quantité × prix_unitaire
```

## BR-122 — Remise de ligne

Une remise de ligne peut être un montant ou un pourcentage. Son type doit être explicite. Elle ne peut pas rendre la base taxable négative. La V1 ne prend pas en charge les remises globales de facture.

## BR-123 — Base de ligne

```text
base_ligne = total_brut_ligne − remise_ligne
```

## BR-124 — Taxe de ligne

La logique fiscale complexe n'est pas activée par défaut. La TVA et autres taxes sont conservées comme points d'extension désactivés.
Si le paramètre global (enableTaxes) désactive les taxes, `taxe_ligne = 0`.
Sinon :
```text
taxe_ligne = base_ligne × taux_taxe
```

## BR-125 — Total de ligne

```text
total_ligne = base_ligne + taxe_ligne
```

## BR-126 — Sous-total

Le sous-total de facture est la somme des bases de lignes après remises de ligne et avant taxes de ligne.

## BR-127 — Total facture

Le total est la somme des totaux de lignes. Les remises globales et frais globaux sont hors périmètre de la V1.

## BR-128 — Arrondi

L'arrondi est appliqué selon le nombre de décimales de la devise. La stratégie d'arrondi doit être identique dans l'interface, le stockage, le PDF et les tests.

Précision V1 validée au Sprint 5 : l’arrondi est « demi-unité vers le haut » après chaque multiplication mise à l’échelle. Les pourcentages de remise et les taxes sont exprimés en points de base (`10000 = 100 %`). Les quantités utilisent au plus six décimales, `quantityScaled` est limité à `1 000 000 000`, et tout résultat doit rester un entier sûr JavaScript. XOF utilise une échelle monétaire nulle ; les devises configurées à deux décimales utilisent leur unité mineure, sans flottant binaire comme source financière.

## BR-129 — Valeurs affichées

Les totaux affichés proviennent du même moteur de calcul que les totaux enregistrés et imprimés.

---

# 15. Paiements

## BR-130 — Facture émise

Un paiement ne peut être enregistré que sur une facture émise, partiellement payée ou payée dans le cas d'une correction contrôlée.

## BR-131 — Montant positif

Le montant doit être strictement positif.

## BR-132 — Date

La date est obligatoire. Une date antérieure à l'émission nécessite un avertissement ou une règle d'import historique.

## BR-133 — Solde

```text
total_paye = somme des paiements actifs
solde = total_facture − total_paye
```

## BR-134 — Surpaiement

La V1 interdit un paiement supérieur au solde restant. La gestion d'avoirs clients est hors périmètre.

## BR-135 — Mise à jour du statut

- total payé = 0 → `EMISE` ;
- 0 < total payé < total → `PARTIELLEMENT_PAYEE` ;
- total payé = total → `PAYEE`.

## BR-136 — Tolérance d'arrondi

La comparaison avec le total utilise l'unité minimale de la devise et non une comparaison flottante approximative.

## BR-137 — Correction

La correction ou annulation d'un paiement doit être historisée et déclencher le recalcul de la facture.

## BR-138 — Paiement d'une facture annulée

Aucun nouveau paiement n'est accepté sur une facture annulée.

---

# 16. Chiffre d'affaires et indicateurs

## BR-140 — Prospect total

Le nombre total de prospects correspond aux contacts ayant été créés comme prospects, y compris les convertis, sauf filtre Actifs uniquement.

## BR-141 — Client total

Le nombre de clients correspond aux contacts convertis non supprimés, indépendamment du nombre de factures.

## BR-142 — Taux de conversion

```text
taux_conversion = prospects_convertis / prospects_éligibles × 100
```

La période et la population éligible doivent être affichées. Par défaut, la cohorte utilise la date de création des prospects dans la période sélectionnée.

## BR-143 — Produit demandé

Une demande correspond à une association distincte entre un prospect et un produit. Plusieurs notes sur le même intérêt ne créent pas plusieurs demandes.

## BR-144 — Quantité vendue

La quantité vendue est la somme des quantités des lignes appartenant à des factures émises, partiellement payées ou payées, hors factures annulées.

## BR-145 — Montant facturé

Le montant facturé est la somme des totaux des factures émises non annulées sur la période de date d'émission.

## BR-146 — Chiffre d'affaires V1

Par défaut dans la V1, le chiffre d'affaires commercial affiché correspond au montant des factures émises non annulées. L'interface doit distinguer clairement ce montant du montant encaissé.

## BR-147 — Montant encaissé

Le montant encaissé est la somme des paiements actifs sur la période de date de paiement.

## BR-148 — Créances

Les créances correspondent à la somme des soldes positifs des factures émises ou partiellement payées non annulées.

## BR-149 — Facture impayée

Une facture est impayée lorsque son solde est positif. Elle est en retard si son échéance est passée.

## BR-150 — Périodes

Chaque indicateur temporel doit préciser s'il utilise la date de création, conversion, émission ou paiement.

---

# 17. Chronologie et audit local

## BR-160 — Événements automatiques

Les événements critiques sont créés automatiquement : statut, conversion, facture, paiement, campagne et relance.

## BR-161 — Immutabilité logique

Un événement automatique ne doit pas être modifiable comme une note. Une correction produit un nouvel événement.

## BR-162 — Notes manuelles

Une note peut être modifiée ou archivée. Sa date de modification doit être conservée.

## BR-163 — Ordre

La chronologie est ordonnée par date d'événement puis par date de création afin de garantir un ordre stable.

---

# 18. Recherche, filtres et listes

## BR-170 — Recherche

La recherche ignore la casse, les espaces inutiles et, dans la mesure du possible, les différences d'accents.

## BR-171 — Numéros

Une recherche de téléphone utilise également la valeur normalisée.

## BR-172 — Combinaison

Des filtres de catégories différentes se combinent avec une logique `ET`. Plusieurs valeurs du même filtre utilisent `OU`, sauf indication contraire.

## BR-173 — Archives

Les éléments archivés sont exclus par défaut et accessibles via un filtre dédié.

## BR-174 — Tri stable

Les listes utilisent un second critère stable lorsque deux valeurs principales sont identiques.

---

# 19. Sauvegarde et restauration

## BR-180 — Contenu

Une sauvegarde complète contient les données métier, paramètres, versions de schéma et métadonnées nécessaires à la restauration.

## BR-181 — Version

Chaque fichier indique sa version de format. L'application refuse proprement une version incompatible.

## BR-182 — Validation préalable

Le fichier est entièrement validé avant toute modification de la base active.

## BR-183 — Restauration atomique

La restauration doit être atomique autant que possible : succès complet ou retour à l'état précédent.

## BR-184 — Modes de restauration

La V1 utilise par défaut le remplacement complet. Une fusion n'est autorisée que si ses règles de conflits sont documentées et testées.

## BR-185 — Confirmation

Le remplacement exige un résumé et une confirmation explicite.

## BR-186 — Intégrité

Une sauvegarde altérée ou incomplète ne doit pas remplacer les données existantes.

## BR-187 — Responsabilité locale

L'application rappelle que les données du navigateur peuvent être effacées et recommande des sauvegardes régulières.

---

# 20. PIN et verrouillage local

## BR-190 — Activation facultative

Le PIN peut être facultatif à la première utilisation, mais l'application recommande son activation.

## BR-191 — Format

Le PIN comporte au minimum 4 chiffres. Une longueur supérieure peut être autorisée.

## BR-192 — Stockage

Le PIN n'est jamais stocké en clair. Une dérivation de clé avec sel et paramètres adaptés est utilisée lorsque disponible.

## BR-193 — Tentatives

Après plusieurs échecs, un délai progressif limite les nouvelles tentatives.

## BR-194 — PIN oublié

Sans compte cloud, aucune porte dérobée ni récupération du PIN n'est prévue. En cas d'oubli, l'utilisateur doit réinitialiser complètement l'espace local, ce qui efface les données présentes sur l'appareil, puis restaurer une sauvegarde valide s'il en possède une. L'interface doit expliquer cette conséquence avant confirmation.

## BR-195 — Portée

Le PIN protège l'interface locale ; il n'est pas présenté comme un chiffrement complet du stockage navigateur.

---

# 21. PWA et fonctionnement hors ligne

## BR-200 — Source locale de vérité

Dans la V1, IndexedDB est la source de vérité des données métier.

## BR-201 — Écriture hors ligne

Les créations et modifications essentielles doivent fonctionner sans réseau après chargement initial de l'application.

## BR-202 — Mise à jour applicative

Une nouvelle version du code ne doit jamais effacer silencieusement les données locales.

## BR-203 — Migration

Chaque évolution du schéma IndexedDB utilise une migration versionnée et testée.

## BR-204 — Échec de migration

En cas d'échec, l'application doit préserver autant que possible la base existante, bloquer les écritures risquées et proposer une sauvegarde ou une action documentée.

## BR-205 — État réseau

L'état hors ligne est signalé lorsqu'il affecte une action. Une opération purement locale ne doit pas être bloquée inutilement.

## BR-206 — Ressources essentielles

Le shell applicatif et les ressources indispensables doivent être disponibles hors ligne après installation ou première visite réussie.

---

# 22. Import, export et fichiers

## BR-210 — Encodage

Les exports textuels utilisent UTF-8.

## BR-211 — Noms de fichiers

Les noms générés comprennent le produit, le type et une date non ambiguë, sans caractères incompatibles avec les systèmes courants.

## BR-212 — PDF

Le PDF d'une facture reflète exactement les données figées de la facture, et non les valeurs actuelles du catalogue ou du profil client.

## BR-213 — Partage

Si le partage natif n'est pas disponible, l'application propose le téléchargement du fichier.

---

# 23. Erreurs et confirmations

## BR-220 — Erreur métier

Une erreur doit expliquer ce qui empêche l'action et comment la corriger.

## BR-221 — Pas de faux succès

Un message de succès n'est affiché qu'après confirmation de l'écriture locale.

## BR-222 — Actions destructrices

Annulation de facture, restauration, suppression et correction financière exigent une confirmation adaptée au risque.

## BR-223 — Double soumission

Les boutons d'enregistrement empêchent les doubles actions pendant une écriture en cours.

---

# 24. Règles de confidentialité

## BR-230 — Minimisation

Seules les données nécessaires au suivi commercial doivent être demandées.

## BR-231 — Données locales

La V1 ne transmet pas les données métier à un serveur SAMTECH, sauf ajout ultérieur explicitement documenté et consenti.

## BR-232 — Télémétrie

Toute télémétrie future doit être documentée, limitée, transparente et distincte des données commerciales.

## BR-233 — Export utilisateur

L'utilisateur peut exporter ses données dans le cadre du mécanisme de sauvegarde prévu.

---

# 25. Décisions différées

Les règles suivantes seront définies avant leur implémentation :

- licences et activations ;
- synchronisation et résolution des conflits ;
- multi-utilisateur et permissions ;
- avoirs et remboursements ;
- plusieurs devises dans une même base ;
- gestion de stock ;
- paiements en ligne ;
- automatisation via l'API WhatsApp Business ;
- intelligence artificielle.

Aucune de ces fonctions ne doit être simulée partiellement dans la V1 sans décision documentée.

---

# 26. Matrice de cohérence essentielle

| Événement | Contact | Facture | Paiement | Historique |
|---|---|---|---|---|
| Création prospect | Prospect actif | — | — | Créé |
| Conversion | Client + prospect converti | — | — | Conversion |
| Émission facture | Client obligatoire | Émise | — | Facture émise |
| Paiement partiel | Client | Partiellement payée | Actif | Paiement reçu |
| Paiement total | Client | Payée | Actif | Facture soldée |
| Annulation facture | Client conservé | Annulée | À traiter selon règle | Annulation |
| Archivage contact | Archivé | Conservée | Conservé | Archivage |

---

# 27. Critères de validation des règles

Chaque règle métier implémentée doit être :

- reliée à au moins un scénario fonctionnel ;
- couverte par un test lorsque son comportement peut être automatisé ;
- appliquée de façon identique dans l'interface et les services métier ;
- indépendante du texte traduit affiché ;
- documentée dans le journal des changements si elle évolue.

Les règles financières, de conversion, de sauvegarde et de migration sont prioritaires pour les tests.

---

# 28. Gouvernance

- Toute modification d'une règle conserve son identifiant.
- Une règle supprimée est marquée obsolète ; son identifiant n'est pas réutilisé.
- Une modification incompatible doit préciser la version d'application concernée.
- Le code ne doit pas contenir une règle métier importante uniquement dans un composant d'interface.
- Gemini, Codex et les développeurs doivent citer les identifiants des règles concernées dans les tâches et tests lorsque cela est pertinent.

---

# 29. Prochaine étape

Après validation de `RULES.md`, la prochaine étape est `ARCHITECTURE.md`, qui traduira ces règles en composants, couches, responsabilités, flux de données et choix techniques pour la PWA.

---

# 30. Principe directeur

**Les données commerciales et financières doivent rester cohérentes, explicables et récupérables, même lorsque l'application fonctionne entièrement hors connexion.**

---

# 31. Précisions implémentées — Sprint 6

- Les statuts financiers `EMISE`, `PARTIELLEMENT_PAYEE` et `PAYEE` sont dérivés de la somme exacte des seuls paiements `ACTIVE`; un paiement `REVERSED` reste dans l’historique mais ne contribue plus aux agrégats.
- Un paiement sur une facture `BROUILLON`, `ANNULEE` ou déjà `PAYEE` est refusé. Un paiement ne peut jamais dépasser le solde relu et recalculé dans la transaction.
- Les six modes livrés sont `CASH`, `WAVE`, `ORANGE_MONEY`, `BANK_TRANSFER`, `CARD` et `OTHER`. `OTHER` exige une description dans la note.
- Une date antérieure à la date d’émission déclenche un avertissement et exige une confirmation explicite. En l’absence de règle V1 interdisant une date future, celle-ci est conservée telle que saisie; aucune date n’est silencieusement corrigée.
- Une correction exige une contrepassation motivée puis, si nécessaire, un nouveau paiement distinct. La contrepassation d’un paiement déjà contrepassé est refusée.
- Une facture ne peut être annulée tant qu’un paiement actif existe, y compris si ses agrégats mémorisés sont incohérents. Tous les paiements doivent d’abord être contrepassés.

---

# 32. Précisions implémentées — Sprint 7

- Les familles de segmentation sont combinées par `ET`; plusieurs valeurs d’une même famille sont combinées par `OU`. Une localité sélectionnée inclut récursivement ses villes ou quartiers descendants.
- L’inactivité compare, borne incluse, la date de la dernière chronologie commerciale reconnue à `inactiveSince`; à défaut d’événement, la création du contact sert de point de départ.
- Un contact client converti n’est jamais repris comme prospect. La déduplication finale utilise d’abord `contactId`, puis le numéro normalisé. Pour un numéro partagé, le contact créé le plus tôt est retenu; l’identifiant départage une égalité.
- Les exclusions manuelles et les confirmations de substitution vide sont conservées dans les critères avant lancement. Une variable inconnue bloque toujours; une variable sans valeur bloque le contact jusqu’à exclusion, correction ou confirmation explicite du vide.
- `ERREUR` signifie dans la V1 une erreur explicitement abandonnée par l’utilisateur et constitue donc un état final. Aucune erreur technique temporaire ne devient automatiquement `ERREUR`.
- L’ouverture WhatsApp produit seulement `OUVERT_DANS_WHATSAPP`. Seule l’action « Confirmer contacté » produit `CONFIRME_CONTACTE` et `CAMPAIGN_PROCESSED`.
- Une campagne terminée ou annulée est immuable. Une campagne en cours exige une confirmation renforcée pour être annulée et conserve tous ses destinataires.

---

# Précisions statistiques — Sprint 8

- Les périodes sont inclusives et évaluées par défaut dans `Africa/Dakar`. Les préréglages sont déterminés depuis une date de référence explicite.
- Le taux utilise la cohorte créée pendant la période. Une conversion ultérieure compte dans cette cohorte : un taux historique peut progresser. Une cohorte vide affiche « Non calculable ».
- Le délai moyen porte sur les conversions datées dans la période; une conversion antérieure à la création ou une date invalide est exclue et signalée.
- Une relance planifiée à la date locale du jour est « aujourd’hui », même si son heure est passée. Seules les dates locales antérieures sont « en retard ».
- Les demandes sont dédupliquées par profil prospect et produit. Les ventes excluent brouillons et annulations; les lignes gratuites sont comptées séparément.
- Facturé suit `issueDate`; encaissé suit `paymentDate` des paiements `ACTIVE`; les paiements `REVERSED` et ceux d’une facture annulée sont exclus. Les créances sont un stock courant recalculé.
- Les montants sont regroupés par `(currency, currencyScale)` et deux groupes différents ne sont jamais additionnés.
- Les statistiques géographiques utilisent la localité actuelle du contact et ne prétendent pas reconstituer son historique.
- Les incohérences détectées ne sont ni masquées ni corrigées en silence.

---

# 24. Précisions d'implémentation — Sprint 9

- BR-180 à BR-187 : le format 1 exporte les vingt tables métier V10, exige leur présence, vérifie SHA-256, références, doublons et entiers financiers avant une transaction de remplacement complet. La confirmation exacte est `REMPLACER MES DONNÉES` et le PIN courant est exigé s'il est actif.
- BR-190 à BR-195 : le PIN facultatif contient 4 à 6 chiffres; PBKDF2-SHA-256 salé remplace tout stockage en clair. Le premier délai intervient au cinquième échec, commence à 30 secondes, double et est plafonné à 15 minutes.
- Le déverrouillage n'est conservé qu'en mémoire React. Un chargement ou rechargement verrouille une installation protégée. Les choix automatiques sont jamais, 1, 5, 15 ou 30 minutes; la valeur initiale est 5 minutes.
- La phrase de réinitialisation est exactement `EFFACER MES DONNÉES`. Cette opération efface toutes les tables locales, sécurité comprise; aucune récupération, aucun PIN maître et aucune fusion ne sont disponibles.

## Règles de stabilisation V1 bêta

- Une erreur financière, perte de données, restauration partielle, ancien PIN restauré, violation axe critique/sérieuse ou panne hors ligne essentielle bloque la bêta.
- Les seuils de performance manqués sont publiés avec leur mesure et leur impact ; ils ne sont jamais arrondis ou masqués.
- Les essais non automatisables sont marqués « À réaliser sur appareil physique » et ne sont pas déclarés réussis sans preuve.
