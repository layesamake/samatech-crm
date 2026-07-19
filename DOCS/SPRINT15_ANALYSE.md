# Analyse fonctionnelle et technique — Sprint 15

## Rapports, exports et sauvegarde chiffrée

## 1. Contexte

SAMTECH CRM dispose déjà de données commerciales riches : prospects, clients, relances, factures, paiements, dépenses, comptes de trésorerie, budgets, prévisions et documents commerciaux. Le tableau de bord calcule plusieurs indicateurs et les factures ainsi que les documents commerciaux peuvent produire des PDF.

Trois besoins restent toutefois distincts et non couverts de bout en bout :

- produire des rapports de gestion lisibles, datés et partageables ;
- exporter des données structurées pour analyse ou archivage externe ;
- protéger les sauvegardes lorsqu’elles quittent le navigateur.

La sauvegarde actuelle est un JSON UTF-8 contenant une enveloppe applicative, les collections métier et un SHA-256. Ce condensat détecte une corruption accidentelle, mais ne fournit aucune confidentialité et n’authentifie pas un secret. Le fichier peut donc révéler contacts, factures, paiements et autres données à toute personne qui y accède.

Le Sprint 15 doit résoudre ces besoins sans transformer SAMTECH CRM en logiciel comptable, sans introduire de backend et sans confondre trois artefacts :

1. **rapport PDF** : document lisible et synthétique ;
2. **export CSV** : données tabulaires exploitables, non restaurables ;
3. **sauvegarde chiffrée** : copie complète destinée à une restauration.

## 2. État observé avant le sprint

Au moment de cette analyse :

- l’application est en cours d’évolution vers Dexie V13 ;
- la base déclare les collections des Sprints 13 et 14 ;
- la liste réelle des collections de sauvegarde doit encore être auditée, car le travail concurrent des sprints précédents n’est pas stabilisé ;
- `BACKUP_FORMAT_VERSION` vaut actuellement `1` ;
- la taille maximale du JSON clair est de 25 Mo et le nombre maximal de lignes de 250 000 ;
- `securitySettings` et le PIN sont exclus de la sauvegarde ;
- la restauration valide produit, version, structure, checksum, doublons et références avant un remplacement transactionnel ;
- la restauration exige la phrase `REMPLACER MES DONNÉES` et, s’il est actif, le PIN courant ;
- le PIN de verrouillage est dérivé par PBKDF2-SHA-256 avec 210 000 itérations, mais ne chiffre ni IndexedDB ni les fichiers ;
- aucun module général de rapports ou d’exports CSV n’existe ;
- les statistiques actuelles peuvent fournir une partie des agrégats, mais ne couvrent pas encore toute la situation de trésorerie, les budgets, prévisions et documents commerciaux dans un modèle de rapport commun.

Gemini devra vérifier l’état réel après la fin des Sprints 13 et 14. Le Sprint 15 ne doit pas recopier une liste de collections supposée ni corriger silencieusement une migration en cours sans audit.

## 3. Objectifs métier

L’utilisateur doit pouvoir :

- sélectionner une période inclusive et générer un rapport de gestion ;
- obtenir une vision commerciale et une vision financière séparées mais cohérentes ;
- consulter les créances par ancienneté et produire un relevé client ;
- exporter les principales données en CSV compatible avec les tableurs courants ;
- comprendre exactement le périmètre, les filtres, la devise et la date de génération ;
- créer une sauvegarde complète chiffrée avec un mot de passe distinct du PIN ;
- vérifier une sauvegarde chiffrée sans restaurer les données ;
- restaurer les nouvelles sauvegardes chiffrées et les anciens JSON clairs compatibles ;
- effectuer ces opérations localement, hors ligne et sur smartphone.

## 4. Principes de séparation

### Rapport

Un rapport est une projection en lecture seule. Il réutilise les règles de calcul du domaine et génère un PDF. Il ne devient jamais une source de vérité et n’est pas stocké en base.

### Export

Un export CSV porte un jeu de données choisi et ses filtres. Il facilite le travail dans Excel, LibreOffice ou un outil d’analyse. Il ne contient pas nécessairement toutes les relations et ne doit jamais être présenté comme restaurable.

### Sauvegarde

Une sauvegarde conserve l’enveloppe applicative complète, ses versions et contrôles d’intégrité. Elle sert à remplacer une base lors d’une restauration contrôlée. Son contenu logique reste indépendant du conteneur de chiffrement.

Cette séparation doit apparaître dans le domaine, les noms de fichiers, l’interface et la documentation.

## 5. Catalogue minimal des rapports

### 5.1 Rapport d’activité commerciale

Pour une période et le fuseau `Africa/Dakar` :

- nouveaux prospects ;
- prospects actifs ;
- conversions en clients ;
- taux et délai moyen de conversion avec dénominateur explicite ;
- relances réalisées, à venir et en retard ;
- factures émises et montants facturés ;
- montants encaissés ;
- produits ou services vendus ;
- devis émis, acceptés, refusés, expirés et convertis ;
- pro forma et bons de livraison par statut ;
- comparaison avec la période précédente équivalente.

Les devis, pro forma et bons de livraison restent dans une section commerciale non financière. Ils ne créent ni chiffre facturé, ni encaissement, ni créance.

### 5.2 Rapport de situation financière

Pour chaque couple devise/échelle, sans conversion implicite :

- facturé sur la période ;
- encaissé sur la période ;
- dépenses actives sur la période ;
- flux net de la période : encaissements moins dépenses ;
- créances ouvertes à la date de fin ;
- créances échues et non échues ;
- soldes des comptes de trésorerie à la date de fin ;
- transferts internes, exclus des entrées et sorties consolidées ;
- ajustements clairement séparés ;
- budgets, consommation, disponible ou dépassement ;
- prévisions à 30, 60 et 90 jours ;
- alertes d’intégrité détectées.

Le rapport doit distinguer un flux observé pendant la période d’un solde constaté à la date de fin. Un solde de trésorerie ne peut pas être reconstruit uniquement avec les mouvements de la période.

Le résultat n’est ni un bilan comptable, ni un compte de résultat, ni une déclaration fiscale. Une mention explicite le rappelle.

### 5.3 Rapport des créances

- client et référence ;
- facture et échéance ;
- montant initial ;
- paiements actifs ;
- solde exact ;
- jours de retard à la date de référence ;
- tranches 0–30, 31–60, 61–90 et plus de 90 jours ;
- total par devise/échelle ;
- top débiteurs sans addition entre devises.

### 5.4 Relevé client

Pour un client et une période :

- identité figée ou actuelle clairement qualifiée ;
- factures émises ;
- paiements actifs ;
- annulations ;
- solde d’ouverture calculé avant la période ;
- mouvements chronologiques ;
- solde de clôture par devise/échelle ;
- documents commerciaux liés en annexe non financière, si demandé.

Le relevé ne doit pas inventer un débit/crédit comptable si le modèle métier ne le supporte pas. Il présente les factures, paiements et soldes selon les règles existantes.

## 6. Règles communes aux rapports

- La période est inclusive et affiche dates, fuseau et date/heure de génération.
- Les données sont lues dans un instantané cohérent afin d’éviter un rapport mélangeant deux états.
- Les calculs restent dans le domaine ou l’application, jamais dans les composants React ou le générateur PDF.
- Les montants sont agrégés avec `BigInt` et sérialisés en chaînes si nécessaire.
- Deux monnaies ou deux échelles ne sont jamais additionnées.
- Une donnée archivée, annulée ou brouillon suit les règles de son module source.
- Les filtres et exclusions figurent dans le rapport.
- Une section vide dit « Aucune donnée » et ne produit pas un total trompeur.
- Les anomalies d’intégrité empêchant un résultat fiable sont visibles ; elles ne sont pas masquées par un zéro.
- La génération est locale et reste possible hors ligne après installation de la PWA.
- Les PDF ne sont pas conservés automatiquement dans IndexedDB ou dans le cache du service worker.

## 7. Exports CSV

### 7.1 Jeux de données

Le hub d’exports doit au minimum proposer :

- contacts, prospects et intérêts ;
- clients ;
- produits et catégories ;
- relances ;
- factures ;
- lignes de facture ;
- paiements ;
- dépenses ;
- comptes et mouvements de trésorerie ;
- budgets et prévisions ;
- devis et pro forma ;
- lignes de documents commerciaux ;
- bons de livraison.

Les campagnes peuvent être ajoutées si leur export ne divulgue pas inutilement des données et si le schéma est documenté. Un export massif unique n’est pas obligatoire : un fichier par jeu de données réduit l’ambiguïté et évite une dépendance ZIP.

### 7.2 Format

- UTF-8 avec BOM pour l’ouverture directe dans Excel ;
- séparateur point-virgule par défaut pour le contexte francophone ;
- fin de ligne CRLF ;
- première ligne contenant des en-têtes stables ;
- chaque cellule entourée de guillemets doubles ;
- guillemet interne doublé ;
- date civile en `YYYY-MM-DD` ;
- horodatage ISO 8601 ;
- identifiants et codes métier exportés en plus des libellés ;
- valeurs booléennes et états sous forme de codes documentés ;
- nom de fichier sûr incluant jeu de données, périmètre et date.

Pour les montants, exporter au minimum :

- `amountMinor` ou le champ mineur métier exact ;
- `currency` ;
- `currencyScale` ;
- une valeur formatée uniquement comme colonne de confort.

Une valeur décimale formatée ne remplace jamais le triplet exact.

### 7.3 Injection de formule

Les valeurs utilisateur peuvent commencer par `=`, `+`, `-`, `@`, une tabulation ou un retour de ligne et être interprétées comme des formules par un tableur. L’échappement CSV ordinaire ne suffit pas toujours.

Le moteur d’export doit appliquer une politique centralisée et testée à chaque cellule non maîtrisée :

- normaliser le champ en texte ;
- neutraliser les caractères initiateurs de formule, y compris après espaces ou caractères de contrôle selon la politique retenue ;
- guillemeter toutes les cellules et doubler les guillemets ;
- documenter le préfixe ajouté et son impact sur une réimportation éventuelle.

Le Sprint 15 ne doit pas prétendre qu’une stratégie est universelle dans tous les tableurs. Les CSV sont destinés à la consultation/analyse humaine ; une future importation devra traiter explicitement le préfixe de neutralisation.

### 7.4 Filtres et traçabilité

Chaque export doit afficher avant téléchargement :

- jeu de données ;
- période ou totalité ;
- statuts inclus ;
- éléments archivés inclus ou exclus ;
- nombre de lignes ;
- avertissement de sensibilité.

Le filtre réellement appliqué est transmis au cas d’usage, pas reconstruit depuis du texte d’interface. L’export doit être déterministe pour les mêmes données et critères, hors horodatage du nom de fichier.

## 8. Menaces portant sur la sauvegarde

Le modèle de menace couvre :

- vol ou copie d’un fichier de sauvegarde ;
- partage accidentel par messagerie ou stockage externe ;
- tentative hors ligne de deviner le mot de passe ;
- modification du contenu, des paramètres cryptographiques ou des métadonnées ;
- fichier tronqué, surdimensionné ou volontairement coûteux à traiter ;
- confusion entre ancien JSON clair et nouveau conteneur chiffré ;
- perte du mot de passe ;
- fuite du secret dans logs, stockage navigateur ou état persistant.

Le périmètre ne couvre pas un appareil déjà compromis pendant que l’utilisateur saisit son mot de passe. Le chiffrement du fichier n’est pas le chiffrement de la base IndexedDB.

## 9. Conception cryptographique

### 9.1 Choix

Utiliser exclusivement l’API Web Crypto du navigateur :

- dérivation : `PBKDF2` avec HMAC-SHA-256 ;
- sel aléatoire : 16 octets minimum, nouveau à chaque export ;
- travail d’export V1 : 600 000 itérations ;
- clé dérivée : AES 256 bits, non extractible ;
- chiffrement authentifié : `AES-GCM` ;
- IV : 12 octets aléatoires, nouveau à chaque export ;
- tag : 128 bits ;
- AAD : en-tête canonique non secret du conteneur.

OWASP recommande actuellement 600 000 itérations pour PBKDF2-HMAC-SHA-256. NIST recommande un IV GCM de 96 bits et insiste sur son unicité. Web Crypto expose PBKDF2 et AES-GCM sans implémentation cryptographique artisanale.

Argon2id est généralement préférable pour résister aux attaques matérielles, mais il n’est pas fourni nativement par Web Crypto. Ajouter un moteur WASM serait une dépendance importante pour la PWA hors ligne. PBKDF2 est donc retenu pour le format V1, avec paramètres versionnés et mesure obligatoire sur les smartphones cibles.

### 9.2 Mot de passe

Le mot de passe de sauvegarde :

- est distinct du PIN 4–6 chiffres ;
- contient au minimum 12 caractères ;
- accepte les espaces et caractères Unicode ;
- est demandé deux fois à l’export ;
- est normalisé de manière documentée et identique à l’export/import ;
- n’est jamais enregistré dans Dexie, localStorage, sessionStorage, URL, télémétrie ou logs ;
- est supprimé de l’état de l’interface dès la fin ou l’abandon de l’opération ;
- n’a aucun mécanisme de récupération.

L’interface recommande une phrase longue composée de plusieurs mots et avertit clairement qu’une perte rend la sauvegarde irrécupérable. Une chaîne JavaScript ne peut pas être effacée de façon garantie ; la documentation doit donc parler de réduction de durée de vie, pas de « suppression mémoire sécurisée » absolue.

### 9.3 Conteneur

Le JSON logique actuel reste le contenu clair interne. Il est chiffré dans un nouveau conteneur versionné, par exemple :

```json
{
  "product": "samtech-crm",
  "containerVersion": 1,
  "encrypted": true,
  "createdAt": "2026-07-19T12:00:00.000Z",
  "kdf": {
    "name": "PBKDF2",
    "hash": "SHA-256",
    "iterations": 600000,
    "salt": "base64"
  },
  "cipher": {
    "name": "AES-GCM",
    "keyLength": 256,
    "iv": "base64",
    "tagLength": 128
  },
  "payloadEncoding": "base64",
  "payload": "base64"
}
```

Le résultat de Web Crypto contient le texte chiffré et son tag. L’en-tête canonique, hors `payload`, sert d’AAD afin que sa modification fasse échouer l’authentification. Aucun compteur métier, nom d’entreprise ou indice de mot de passe ne reste en clair.

L’extension recommandée est `.samtech-backup`. Le conteneur versionne les paramètres cryptographiques séparément de `BACKUP_FORMAT_VERSION`, qui continue de versionner le contenu restaurable.

### 9.4 Validation et restauration

Ordre obligatoire :

1. vérifier nom/extension tolérée, taille et structure externe bornée ;
2. reconnaître un conteneur chiffré ou un JSON historique ;
3. refuser version, algorithme, tailles et paramètres non supportés avant dérivation ;
4. décoder strictement sel, IV et charge utile ;
5. dériver la clé ;
6. authentifier/déchiffrer AES-GCM ;
7. en cas d’échec, afficher seulement « Mot de passe incorrect ou fichier altéré » ;
8. valider ensuite le JSON logique avec toutes les règles de sauvegarde existantes ;
9. afficher un aperçu ;
10. exiger la phrase destructive et le PIN courant s’il est actif ;
11. restaurer dans une transaction avec rollback.

Le mot de passe de fichier ne remplace ni la confirmation destructive ni le PIN courant. Une sauvegarde ne restaure toujours pas `securitySettings`.

### 9.5 Vérification sans restauration

L’action « Vérifier une sauvegarde » doit :

- sélectionner le fichier ;
- demander le mot de passe si nécessaire ;
- authentifier, déchiffrer et valider tout le contenu ;
- afficher date, version, nombre d’enregistrements et collections ;
- ne modifier aucune donnée locale ;
- oublier le secret et le contenu déchiffré après fermeture.

Après création, l’application réalise un auto-contrôle en mémoire en déchiffrant le conteneur produit avant de proposer le téléchargement. La date de dernière sauvegarde n’est enregistrée qu’après réussite de la préparation, de l’auto-contrôle et du déclenchement du téléchargement. L’interface précise qu’elle ne peut pas garantir que le navigateur a réellement conservé le fichier.

## 10. Compatibilité

- Les nouveaux exports sont chiffrés par défaut.
- Les anciens `.json` valides restent importables.
- Un export JSON clair peut rester accessible dans une section avancée de compatibilité, derrière un avertissement explicite ; il ne doit pas être l’action principale.
- Un nouveau conteneur ne change pas à lui seul la version Dexie.
- Si le schéma final reste V13, Sprint 15 doit conserver V13.
- La liste des collections provient d’une source unique alignée sur la base réelle.
- Les sauvegardes des versions antérieures sont adaptées seulement après validation de leur checksum d’origine.
- Une version cryptographique future est rejetée proprement au lieu d’être interprétée avec des valeurs par défaut.

## 11. Architecture recommandée

```text
src/modules/reports/
  domain/
    report-models.ts
    report-calculations.ts
    csv.ts
  application/
    generate-report.ts
    export-dataset.ts
  infrastructure/
    dexie-report-read-repository.ts
  pdf/
    management-report-pdf.ts
    client-statement-pdf.ts
  presentation/
    ReportsHub.tsx
    ReportBuilder.tsx
    ExportsPanel.tsx

src/modules/backup/
  domain/
    backup.ts
    encrypted-container.ts
  application/
    manage-backups.ts
  infrastructure/
    web-crypto-backup-crypto.ts
  presentation/
    BackupSettings.tsx
```

Le domaine de rapports peut réutiliser des fonctions pures du module Statistiques. Il ne doit pas dupliquer les formules ni importer un composant de présentation. Le dépôt de lecture produit un instantané brut ou un read model cohérent. Les générateurs PDF/CSV ne reçoivent que des modèles déjà calculés.

Le service cryptographique ne lit pas Dexie. Il chiffre et déchiffre des octets. `ManageBackupsUseCase` orchestre collecte, sérialisation, chiffrement, vérification et restauration.

## 12. Interface mobile

Routes recommandées :

```text
/reports
/reports/commercial
/reports/financial
/reports/receivables
/reports/client/[clientId]
/reports/exports
/settings/backup
```

Le menu « Plus » mène au hub Rapports. Sur 320 px :

- sélecteur de rapport en cartes ;
- filtres en panneau vertical ;
- résumé avant génération ;
- progression textuelle pour génération/chiffrement ;
- aucun tableau horizontal indispensable ;
- téléchargement et partage accessibles ;
- champs mot de passe avec afficher/masquer, confirmation et conseils ;
- erreurs annoncées par lecteur d’écran ;
- focus restitué après dialogue ;
- aucune donnée sensible copiée automatiquement dans le presse-papiers.

## 13. Hors ligne et performance

- Aucun rapport, export ou chiffrement ne dépend du réseau.
- Les bibliothèques nécessaires sont embarquées dans le build.
- Les téléchargements ne sont pas mis en cache par le service worker.
- La génération affiche une progression ou un état occupé et empêche les doubles clics.
- La limite claire reste 25 Mo tant qu’une mesure ne justifie pas son changement.
- Le conteneur base64 étant plus volumineux, une limite externe distincte doit être calculée et testée avant lecture complète.
- Les paramètres PBKDF2 sont mesurés sur Android et iPhone réels ; une réduction éventuelle exige une décision de sécurité documentée et une nouvelle version de conteneur.
- Les listes volumineuses sont parcourues sans copies inutiles ; un export dépassant les limites affiche un message et propose de réduire la période.

## 14. Sécurité et confidentialité

- Aucun rapport ou CSV n’est chiffré automatiquement : l’interface avertit qu’il contient des données sensibles.
- Les cellules CSV sont protégées contre l’injection de formule selon une politique testée.
- Les noms de fichiers sont neutralisés.
- Les PDF n’interprètent aucune donnée comme HTML ou code.
- Les mots de passe ne sont jamais inclus dans les exceptions remontées à l’interface.
- Les erreurs d’authentification AES-GCM ne révèlent pas si le mot de passe ou le fichier est fautif.
- La taille, les versions et paramètres KDF sont validés avant les opérations coûteuses.
- Le code n’implémente ni AES, ni GCM, ni PBKDF2 manuellement.
- Aucun secret ou contenu déchiffré n’est envoyé sur le réseau.
- IndexedDB reste non chiffrée : cette limite doit rester visible dans la documentation.

## 15. Risques principaux

- **Divergence dashboard/rapport** : fonctions de calcul partagées et matrices de référence.
- **Addition de monnaies différentes** : regroupement strict par devise/échelle.
- **Rapport présenté comme comptabilité** : titre et avertissement explicites.
- **CSV exécutable** : neutralisation centralisée et tests d’attaque.
- **CSV pris pour une sauvegarde** : parcours, extension et messages distincts.
- **Mot de passe faible** : longueur minimale, recommandation de phrase longue et KDF coûteuse.
- **PIN utilisé comme clé** : interdiction formelle.
- **Altération de l’en-tête** : AAD canonique.
- **Réutilisation d’IV** : clé dérivée avec sel neuf et IV aléatoire neuf à chaque export.
- **Perte du mot de passe** : avertissement et vérification sans restauration.
- **Déni de service par KDF ou fichier** : paramètres exacts et limites avant dérivation.
- **Fausse garantie de sauvegarde** : auto-contrôle plus rappel de vérifier le fichier téléchargé.
- **Régression de restauration historique** : matrice de fixtures des anciennes versions.
- **Écrasement des Sprints 13/14** : audit Git et intégration sur état réel.

## 16. Hors périmètre

- comptabilité générale, bilan, compte de résultat ou déclarations fiscales ;
- taux de change et consolidation multi-devises ;
- constructeur libre de rapports ;
- planification ou envoi automatique de rapports ;
- synchronisation cloud ou sauvegarde distante ;
- partage par lien public ;
- fichier Excel natif `.xlsx` ;
- import CSV ;
- chiffrement intégral d’IndexedDB ;
- récupération de mot de passe ;
- signature numérique ou certificat d’origine ;
- backend, compte utilisateur, IA ou API WhatsApp Business.

## 17. Références de sécurité

- OWASP Password Storage Cheat Sheet : https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- W3C Web Cryptography Level 2 : https://www.w3.org/TR/WebCryptoAPI/
- NIST SP 800-38D, GCM et GMAC : https://csrc.nist.gov/pubs/sp/800/38/d/final
- OWASP CSV Injection : https://owasp.org/www-community/attacks/CSV_Injection

Ces références fixent la ligne de base au moment du Sprint 15. Les paramètres sont portés par le conteneur afin de permettre une évolution explicite.

## 18. Décision de fin de sprint

- **SPRINT 15 VALIDÉ** : rapports exacts, CSV sûrs, sauvegarde chiffrée et restauration prouvées, compatibilité historique, mobile/hors ligne et recette physique réussis.
- **SPRINT 15 VALIDATION CONDITIONNELLE** : automatisation conforme mais recette physique des téléchargements, performances cryptographiques ou ouverture dans les tableurs cibles non prouvée.
- **SPRINT 15 NON VALIDÉ** : total financier faux, devises mélangées, CSV injectable, secret persisté, sauvegarde indéchiffrable, altération acceptée, ancienne sauvegarde cassée, restauration non atomique ou P0/P1 restant.

Le verdict ne doit jamais confondre réussite d’un aller-retour de test avec preuve qu’une copie réelle existe dans le stockage de l’utilisateur.
