# SAMTECH CRM — ROADMAP PRODUIT

**Document :** `ROADMAP.md`  
**Produit :** SAMTECH CRM  
**Éditeur :** SAMTECH  
**Version du document :** 1.0  
**Statut :** Document de référence  
**Date :** Juillet 2026

---

# 1. Objet du document

Cette roadmap transforme la vision de SAMTECH CRM en étapes de conception, de développement, de validation et de commercialisation.

Elle définit :

- les priorités du produit ;
- le périmètre des versions ;
- l'ordre de réalisation des modules ;
- les résultats attendus à chaque phase ;
- les critères de passage d'une phase à la suivante.

La roadmap doit rester cohérente avec `VISION.md`. Toute modification importante du périmètre doit être documentée avant d'être intégrée au développement.

---

# 2. Stratégie générale

Le développement de SAMTECH CRM suivra une progression en quatre grandes étapes :

1. **V1 — Starter :** construire et valider le cœur métier dans une PWA locale, mobile-first et offline-first.
2. **V1.x — Commercialisation :** renforcer la distribution, la sécurité, les licences et l'exploitation du produit.
3. **V2 — Professional :** ajouter le cloud, la synchronisation et le multi-appareil.
4. **V3 — Business :** ajouter la collaboration, les équipes, les rôles et les automatisations avancées.

Le développement commence par les besoins les plus importants : organiser les prospects, assurer les relances, convertir les prospects en clients, facturer et suivre les paiements.

---

# 3. Principes de priorisation

Une fonctionnalité est prioritaire lorsqu'elle :

- répond directement à un besoin commercial réel ;
- réduit le risque d'oublier un prospect ;
- améliore la conversion des prospects en clients ;
- facilite une action fréquente sur smartphone ;
- fonctionne de manière fiable hors connexion ;
- apporte une information utile à la prise de décision ;
- peut être testée et validée indépendamment.

Les fonctionnalités qui augmentent fortement la complexité sans valider le cœur métier sont différées.

---

# 4. Phase 0 — Fondations documentaires

## Objectif

Établir une référence commune avant le développement afin que le propriétaire du produit, Gemini, Codex et tout futur développeur travaillent avec les mêmes règles.

## Livrables

- `VISION.md` ;
- `ROADMAP.md` ;
- `CAHIER_DES_CHARGES.md` ;
- `RULES.md` ;
- `ARCHITECTURE.md` ;
- `DATABASE.md` ;
- `OFFLINE_FIRST.md` ;
- `SECURITY.md` ;
- `UI_UX.md` ;
- `TESTING.md` ;
- `PROMPTS_GEMINI.md` ;
- `PROMPTS_CODEX.md` ;
- `CHANGELOG.md`.

## Critères de sortie

- le périmètre de la V1 est clairement défini ;
- les principales règles métier sont documentées ;
- le modèle de données initial est validé ;
- les parcours mobiles essentiels sont décrits ;
- l'architecture technique est suffisamment précise pour démarrer le code.

---

# 5. V1 — SAMTECH CRM Starter

## Objectif

Livrer une PWA mobile-first et offline-first permettant à un utilisateur unique de gérer son cycle commercial complet, de la création du prospect jusqu'au paiement.

## Caractéristiques générales

- application Web progressive installable ;
- expérience prioritairement conçue pour smartphone ;
- fonctionnement local avec IndexedDB ;
- utilisation des fonctions essentielles sans connexion Internet ;
- données appartenant à l'utilisateur et exportables ;
- interface en français dans la première version ;
- architecture préparée pour des évolutions futures sans introduire prématurément le cloud ou le multi-utilisateur.

---

# 6. Plan de développement de la V1

## Sprint 0 — Initialisation technique

### Objectif

Créer une base de projet stable et vérifiable.

### Travaux

- initialiser le projet Next.js avec TypeScript ;
- configurer Tailwind CSS et la bibliothèque de composants ;
- définir la structure des dossiers ;
- configurer les contrôles de qualité ;
- préparer le manifeste PWA et les icônes ;
- configurer le service worker ;
- mettre en place Dexie.js et IndexedDB ;
- définir les conventions de code ;
- préparer les tests unitaires et les tests de parcours ;
- créer la structure de navigation mobile-first.

### Résultat attendu

Une PWA installable disposant d'une navigation de base et d'un stockage local fonctionnel.

---

## Sprint 1 — Gestion des prospects

### Objectif

Créer une base commerciale structurée et facilement exploitable.

### Fonctionnalités

- création et modification d'un prospect ;
- nom et numéro WhatsApp ;
- coordonnées complémentaires ;
- localité ;
- source du prospect ;
- statut commercial ;
- niveau d'intérêt ;
- tags ;
- notes ;
- association à un ou plusieurs produits demandés ;
- date du premier contact ;
- recherche, tri et filtres ;
- archivage avec confirmation ;
- détection des doublons par numéro normalisé.

### Résultat attendu

L'utilisateur peut enregistrer, retrouver, classer et qualifier ses prospects rapidement.

---

## Sprint 2 — Paramètres, localités et catalogue

### Objectif

Mettre en place les données de référence utilisées par les autres modules.

### Fonctionnalités

- profil de l'entreprise ;
- devise et paramètres de facturation ;
- gestion des localités ;
- catégories de produits et services ;
- création, modification, archivage et recherche de produits ou services ;
- prix de vente et statut actif/inactif ;
- paramètres de numérotation des factures.

### Résultat attendu

L'utilisateur peut configurer son entreprise, ses localités et son catalogue.

---

## Sprint 3 — Relances et modèles de messages

### Objectif

Réduire les oublis et faciliter le suivi commercial via WhatsApp.

### Fonctionnalités

- création d'une relance ;
- date, heure, priorité et motif ;
- vues Aujourd'hui, En retard et À venir ;
- validation, report et annulation d'une relance ;
- bibliothèque de modèles de messages ;
- variables de personnalisation ;
- prévisualisation du message final ;
- ouverture de WhatsApp avec numéro et message préremplis ;
- enregistrement d'un événement dans l'historique commercial.

### Résultat attendu

L'utilisateur identifie immédiatement les prospects à relancer et peut ouvrir WhatsApp avec un message personnalisé.

---

## Sprint 4 — Conversion en client et historique

### Objectif

Assurer la continuité entre prospection et relation client.

### Fonctionnalités

- conversion d'un prospect en client sans duplication ;
- conservation des données et intérêts du prospect ;
- date de conversion ;
- fiche client ;
- chronologie commerciale ;
- historique des relances, notes, achats, factures et paiements ;
- recherche et filtrage des clients ;
- indicateurs simples par client.

### Résultat attendu

Un prospect peut devenir client tout en conservant l'ensemble de son historique.

---

## Sprint 5 — Facturation

### Objectif

Permettre la création et le partage de factures professionnelles.

### Fonctionnalités

- création d'une facture depuis une fiche client ;
- numérotation unique ;
- ajout de produits ou services ;
- quantités et prix unitaires ;
- remises ;
- taxes configurables ;
- calcul automatique des sous-totaux et du total ;
- date d'émission et échéance ;
- statuts Brouillon, Émise, Partiellement payée, Payée et Annulée ;
- génération d'un PDF ;
- téléchargement et partage de la facture ;
- validation des données avant émission.

### Résultat attendu

L'utilisateur peut créer une facture exacte, générer son PDF et la partager avec le client.

---

## Sprint 6 — Paiements et créances

### Objectif

Suivre les encaissements et les montants restant à payer.

### Fonctionnalités

- enregistrement d'un paiement ;
- paiements complets ou partiels ;
- modes Espèces, Wave, Orange Money, Virement, Carte et Autre ;
- référence et note de paiement ;
- calcul du total payé et du solde ;
- mise à jour automatique du statut de la facture ;
- liste des factures impayées ou partiellement payées ;
- historique des paiements ;
- protection contre les paiements supérieurs au solde, sauf règle explicitement prévue.

### Résultat attendu

L'utilisateur connaît les montants facturés, encaissés et restant à encaisser.

---

## Sprint 7 — Campagnes WhatsApp assistées

### Objectif

Permettre des actions marketing ciblées sans automatisation non conforme.

### Fonctionnalités

- création d'une campagne ;
- nom, objectif et message ;
- sélection d'un modèle ;
- segmentation par localité, produit, statut, intérêt, tags, période et type de contact ;
- estimation et prévisualisation des destinataires ;
- exclusion des contacts sans numéro valide ;
- personnalisation individuelle ;
- ouverture successive de WhatsApp pour les destinataires ;
- suivi manuel Assisté, Contacté, Ignoré ou Erreur ;
- historique des campagnes reçues par contact.

### Résultat attendu

L'utilisateur peut préparer et exécuter une campagne ciblée avec validation humaine de chaque envoi.

---

## Sprint 8 — Tableau de bord et statistiques

### Objectif

Transformer les données enregistrées en indicateurs commerciaux utiles.

### Indicateurs

- nombre total de prospects ;
- nouveaux prospects sur une période ;
- répartition par localité ;
- produits les plus demandés ;
- clients obtenus ;
- taux de conversion ;
- relances du jour et en retard ;
- produits les plus vendus ;
- montant facturé ;
- montant encaissé ;
- créances ;
- évolution mensuelle des ventes.

### Résultat attendu

L'utilisateur peut comprendre rapidement l'état de son activité commerciale.

---

## Sprint 9 — Sauvegarde, restauration et sécurité locale

### Objectif

Protéger les données et permettre leur récupération.

### Fonctionnalités

- export complet des données ;
- fichier de sauvegarde versionné ;
- validation d'une sauvegarde avant import ;
- restauration avec avertissement et confirmation ;
- gestion des évolutions de schéma ;
- code PIN local ;
- verrouillage après inactivité ;
- option de réinitialisation conforme au modèle local ;
- messages clairs sur les limites de sécurité d'une application locale ;
- documentation du processus de sauvegarde.

### Résultat attendu

L'utilisateur peut sauvegarder et restaurer ses données et protéger l'accès courant à l'application.

---

## Sprint 10 — Stabilisation et préparation de la bêta

### Objectif

Corriger les défauts, vérifier l'expérience réelle et préparer les tests utilisateurs.

### Travaux

- tests fonctionnels complets ;
- tests sur petits écrans ;
- tests Android, iPhone, tablette et ordinateur ;
- vérification du fonctionnement hors ligne ;
- tests de sauvegarde et restauration ;
- tests des calculs de facturation et paiement ;
- tests d'accessibilité ;
- amélioration des performances ;
- traitement des erreurs ;
- préparation des données de démonstration ;
- documentation utilisateur minimale.

### Résultat attendu

Une version bêta stable, installable et utilisable par un groupe pilote.

---

# 7. Phase pilote de la V1

## Objectif

Valider le produit avec de vrais utilisateurs avant la commercialisation.

## Groupe pilote recommandé

Entre 5 et 15 utilisateurs provenant de plusieurs activités :

- commerce ;
- formation ;
- prestation de services ;
- distribution ;
- agriculture ou élevage ;
- activité indépendante.

## Mesures à observer

- temps nécessaire pour enregistrer un prospect ;
- nombre de prospects réellement suivis ;
- fréquence d'utilisation des relances ;
- facilité de création d'une facture ;
- fiabilité des sauvegardes ;
- compréhension du tableau de bord ;
- erreurs rencontrées ;
- fonctions utilisées ou ignorées ;
- satisfaction générale ;
- volonté de payer pour le produit.

## Critères de sortie

- aucun défaut bloquant ;
- aucune perte de données connue ;
- calculs financiers vérifiés ;
- parcours principaux compris sans assistance importante ;
- sauvegarde et restauration validées ;
- retours prioritaires du pilote traités.

---

# 8. Définition de réussite de la V1

La V1 est considérée comme terminée lorsque :

1. tous les critères de réussite définis dans `VISION.md` sont satisfaits ;
2. les modules principaux fonctionnent hors connexion après installation ;
3. les données survivent à la fermeture et à la réouverture normale de l'application ;
4. les factures et paiements produisent des calculs exacts ;
5. l'export et la restauration ont été testés ;
6. les parcours critiques sont couverts par des tests ;
7. la PWA fonctionne sur les navigateurs cibles documentés ;
8. aucun problème bloquant ou critique connu ne reste ouvert ;
9. la documentation correspond à la version livrée ;
10. la version pilote a été validée.

---

# 9. V1.x — Sécurisation et commercialisation

## Objectif

Transformer la V1 validée en produit distribuable et commercialisable.

## Fonctionnalités envisagées

- gestion des licences ;
- activation en ligne ;
- règles de réactivation et de transfert ;
- portail d'administration des licences ;
- mécanismes de contrôle adaptés aux PWA ;
- identité visuelle finalisée ;
- site de présentation ;
- parcours d'achat et d'activation ;
- conditions d'utilisation et politique de confidentialité ;
- support utilisateur ;
- journalisation technique respectueuse de la vie privée ;
- amélioration du format de sauvegarde ;
- processus de mise à jour et de migration.

La conception du système de licence devra tenir compte des limites propres aux navigateurs et ne devra pas promettre une protection matérielle impossible à garantir dans une PWA.

---

# 10. V2 — SAMTECH CRM Professional

## Objectif

Permettre une utilisation sécurisée sur plusieurs appareils grâce au cloud.

## Fonctionnalités envisagées

- compte utilisateur ;
- authentification sécurisée ;
- sauvegarde cloud automatique ;
- synchronisation local/cloud ;
- stratégie de résolution des conflits ;
- utilisation multi-appareil ;
- reprise après perte ou changement d'appareil ;
- historique de synchronisation ;
- rapports avancés ;
- options d'abonnement ;
- notifications améliorées ;
- import de données structuré.

## Condition préalable

La V2 ne doit commencer qu'après validation du modèle métier, du modèle économique et de l'utilisation réelle de la V1.

---

# 11. V3 — SAMTECH CRM Business

## Objectif

Répondre aux besoins des entreprises disposant d'équipes commerciales.

## Fonctionnalités envisagées

- organisations et espaces de travail ;
- plusieurs utilisateurs ;
- rôles et permissions ;
- attribution des prospects ;
- gestion d'équipes commerciales ;
- journal d'audit ;
- tableaux de bord par utilisateur et équipe ;
- pipeline commercial avancé ;
- objectifs et performances ;
- automatisations ;
- API et intégrations ;
- gestion centralisée de la facturation de l'abonnement.

---

# 12. Évolutions exploratoires

Les éléments suivants seront évalués en fonction des besoins réels, de la réglementation, des coûts et des règles des plateformes :

- API officielle WhatsApp Business ;
- réception et centralisation de conversations autorisées ;
- campagnes automatisées conformes ;
- intelligence artificielle pour résumer ou suggérer ;
- scoring des prospects ;
- recommandations de relance ;
- intégrations Facebook Lead Ads et formulaires Web ;
- devis et bons de livraison ;
- gestion de stock ;
- paiements en ligne ;
- applications mobiles natives si les limites de la PWA le justifient.

Ces éléments ne doivent pas perturber la livraison de la V1.

---

# 13. Dépendances entre modules

L'ordre recommandé est le suivant :

```text
Fondations techniques
        ↓
Paramètres + Localités + Produits
        ↓
Prospects
        ↓
Relances + Modèles WhatsApp
        ↓
Conversion en clients
        ↓
Factures
        ↓
Paiements
        ↓
Campagnes
        ↓
Statistiques
        ↓
Sauvegarde + Sécurité locale
        ↓
Stabilisation + Pilote
```

Un module ne doit pas être considéré comme terminé si ses règles métier, ses tests et sa documentation ne sont pas à jour.

---

# 14. Règles d'exécution des sprints

Pour chaque sprint :

1. confirmer le périmètre à partir de la documentation ;
2. préciser les critères d'acceptation ;
3. mettre à jour le modèle de données si nécessaire ;
4. développer un module limité et cohérent ;
5. exécuter les tests ;
6. vérifier l'interface sur smartphone ;
7. vérifier le comportement hors ligne ;
8. documenter les décisions ;
9. mettre à jour `CHANGELOG.md` ;
10. valider le sprint avant de commencer le suivant.

Les outils d'intelligence artificielle ne doivent pas modifier librement le périmètre, les dépendances ou l'architecture sans décision documentée.

---

# 15. Gestion des changements

Une nouvelle fonctionnalité proposée pendant la V1 doit être classée dans l'une des catégories suivantes :

- **Indispensable :** nécessaire au parcours central ou à l'intégrité des données ;
- **Importante :** apporte une forte valeur mais n'empêche pas la validation du produit ;
- **Souhaitable :** amélioration pouvant attendre une version ultérieure ;
- **Hors périmètre :** fonctionnalité réservée à V1.x, V2, V3 ou à l'exploration.

Toute modification majeure doit préciser :

- le besoin utilisateur ;
- la valeur attendue ;
- l'impact sur les délais ;
- l'impact sur la base de données ;
- l'impact sur l'expérience offline ;
- l'impact sur la sécurité et les tests ;
- la version cible.

---

# 16. Risques principaux

## Perte de données locales

Réponse : sauvegarde explicite, avertissements, tests de restauration et documentation claire.

## Limites des navigateurs et d'iOS

Réponse : définir les navigateurs supportés, tester l'installation et documenter les limites de stockage, notifications et exécution en arrière-plan.

## Complexité excessive de la V1

Réponse : respecter strictement le périmètre et différer le cloud, le multi-utilisateur, les licences et l'IA.

## Envois WhatsApp non conformes

Réponse : utiliser des campagnes assistées avec validation humaine et réserver l'automatisation à l'API officielle dans une version ultérieure.

## Erreurs financières

Réponse : définir des règles précises de calcul, utiliser une représentation monétaire sûre et couvrir les calculs par des tests.

## Abstraction prématurée de SAMTECH Core

Réponse : extraire uniquement les composants réellement réutilisés par plusieurs produits.

---

# 17. Indicateurs de progression du projet

Le suivi du projet doit mesurer :

- documents validés ;
- sprints terminés ;
- critères d'acceptation satisfaits ;
- tests réussis ;
- défauts bloquants, critiques et majeurs ;
- parcours validés sur mobile ;
- compatibilité hors ligne ;
- retours du groupe pilote ;
- risques ouverts ;
- conformité entre le code et la documentation.

---

# 18. Prochaine étape

Après validation de cette roadmap, les documents suivants doivent être rédigés dans cet ordre :

1. `CAHIER_DES_CHARGES.md` ;
2. `RULES.md` ;
3. `ARCHITECTURE.md` ;
4. `DATABASE.md` ;
5. `OFFLINE_FIRST.md` ;
6. `SECURITY.md` ;
7. `UI_UX.md` ;
8. `TESTING.md` ;
9. `PROMPTS_GEMINI.md` ;
10. `PROMPTS_CODEX.md`.

Le développement commencera lorsque les fondations fonctionnelles, métier, techniques et UX nécessaires au Sprint 0 seront validées.

---

# 19. Principe directeur

**Livrer d'abord un cœur métier simple, fiable et réellement utilisé, puis renforcer progressivement la commercialisation, le cloud, la collaboration et l'automatisation.**

La réussite de SAMTECH CRM dépend davantage de la qualité des parcours essentiels que du nombre de fonctionnalités disponibles.

## Clôture du Sprint 10

La cible technique est `1.0.0-beta.1`. Les validations automatiques incluent lint, TypeScript, tests, build, PWA, axe-core, responsive, charge déterministe, Lighthouse, mise à jour PWA et parcours E2E transversal. Les essais Android, iPhone, tablette, PWA installée et lecteur d’écran restent des jalons physiques obligatoires avant élargissement du pilote.
