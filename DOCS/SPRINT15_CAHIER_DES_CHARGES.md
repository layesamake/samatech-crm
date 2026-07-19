# Cahier des charges — Sprint 15

## Rapports, exports et sauvegarde chiffrée

## 1. Objet

Développer un module local de rapports et d’exports, puis remplacer l’action principale de sauvegarde claire par une sauvegarde chiffrée authentifiée, tout en conservant la restauration des anciens fichiers compatibles.

## 2. Contraintes structurantes

- Respecter présentation/application/domaine/infrastructure.
- Garder les calculs et politiques de sécurité hors React.
- Accéder à Dexie uniquement par dépôts et cas d’usage.
- Lire un instantané cohérent pour chaque rapport ou export.
- Utiliser des entiers exacts et `BigInt` pour les agrégats.
- Ne jamais convertir ni additionner implicitement des devises ou échelles.
- Réutiliser les règles des modules sources.
- Ne créer aucune table Dexie pour stocker les rapports ou fichiers générés.
- Ne changer la version Dexie que si l’audit révèle une nécessité réelle indépendante du chiffrement.
- Produire PDF, CSV et sauvegardes entièrement en local et hors ligne.
- Ne pas mettre les fichiers générés dans les caches applicatifs.
- Conserver `securitySettings` et le PIN hors sauvegarde.
- Ne jamais utiliser le PIN comme mot de passe ou clé de sauvegarde.
- Utiliser Web Crypto ; aucune primitive cryptographique artisanale.
- Préserver les modifications existantes des Sprints 12, 13 et 14.
- Aucun backend, cloud, compte, IA, télémétrie distante ou API WhatsApp.
- Aucun commit, push, tag ou déploiement sans autorisation.

## 3. Module Rapports

### 3.1 Modèle commun

```ts
interface ReportPeriod {
  from: string; // YYYY-MM-DD inclus
  to: string;   // YYYY-MM-DD inclus
  timezone: 'Africa/Dakar';
  label: string;
}

interface ReportContext {
  reportId: string;
  reportType: 'COMMERCIAL' | 'FINANCIAL' | 'RECEIVABLES' | 'CLIENT_STATEMENT';
  generatedAt: string;
  period: ReportPeriod;
  filters: Record<string, string | boolean | string[]>;
  appVersion: string;
  hasIntegrityWarnings: boolean;
}

interface ExactMoney {
  currency: string;
  currencyScale: number;
  minor: string;
}
```

Tout montant agrégé est une chaîne entière dans le read model final afin d’éviter une conversion accidentelle en flottant.

### 3.2 Rapport commercial

Le modèle contient :

- volume de prospects et clients ;
- nouveaux prospects et conversions ;
- taux/délai de conversion ;
- relances par état ;
- factures et paiements ;
- produits vendus ;
- statistiques de devis, pro forma et livraisons ;
- séries temporelles ;
- période précédente comparable ;
- avertissements d’intégrité.

Les règles actuelles de `statistics` sont extraites ou réutilisées. Aucun second calcul incompatible ne doit être introduit.

### 3.3 Rapport financier

```ts
interface FinancialReportGroup {
  currency: string;
  currencyScale: number;
  billedMinor: string;
  collectedMinor: string;
  expensesMinor: string;
  netCashFlowMinor: string;
  receivableMinor: string;
  overdueMinor: string;
  notYetDueMinor: string;
  treasuryBalanceMinor: string;
  adjustmentsInMinor: string;
  adjustmentsOutMinor: string;
}
```

Exigences :

- `netCashFlowMinor = collectedMinor - expensesMinor` pour la période ;
- les transferts internes n’entrent pas dans le flux consolidé ;
- les soldes de comptes sont calculés à la date de fin ;
- les ajustements sont présentés séparément ;
- les comptes archivés restent inclus si leur historique affecte le solde ;
- les budgets utilisent leurs périodes et catégories réelles ;
- les prévisions à 30/60/90 jours séparent entrées, sorties et net ;
- les montants prévisionnels ne sont pas mélangés aux réalisés ;
- chaque groupe devise/échelle produit sa propre section.

### 3.4 Créances

Le rapport est calculé à une `asOfDate` explicite. Les tranches d’ancienneté sont mutuellement exclusives et leur somme égale le total des créances. Une facture annulée, un paiement annulé ou un document commercial préparatoire suit les exclusions existantes.

### 3.5 Relevé client

Le cas d’usage reçoit `clientProfileId`, période et options. Il calcule le solde d’ouverture avant `from`, ordonne les événements par date puis identifiant stable et calcule chaque solde courant. Il rejette un client absent au lieu de produire un relevé vide ambigu.

### 3.6 PDF

Tous les PDF comportent :

- identité et logo de l’entreprise si disponibles ;
- titre sans ambiguïté ;
- période, fuseau, date de génération et filtres ;
- pagination et numéros de page ;
- tableaux avec répétition des en-têtes ;
- totaux exacts par devise ;
- texte français et retours à la ligne sûrs ;
- état vide explicite ;
- avertissements et limites ;
- nom de fichier neutralisé.

Les rapports financiers portent la mention : « Rapport interne de gestion — ne remplace pas des états comptables ou fiscaux certifiés. »

Le générateur PDF n’interroge pas Dexie et ne recalcule pas les totaux.

## 4. Module Exports

### 4.1 Contrat de jeu de données

```ts
type ExportDataset =
  | 'CONTACTS_PROSPECTS'
  | 'CLIENTS'
  | 'CATALOG'
  | 'FOLLOW_UPS'
  | 'INVOICES'
  | 'INVOICE_LINES'
  | 'PAYMENTS'
  | 'EXPENSES'
  | 'TREASURY_ACCOUNTS'
  | 'TREASURY_MOVEMENTS'
  | 'BUDGETS'
  | 'FORECASTS'
  | 'COMMERCIAL_DOCUMENTS'
  | 'COMMERCIAL_DOCUMENT_LINES'
  | 'DELIVERY_NOTES';

interface ExportCriteria {
  dataset: ExportDataset;
  from?: string;
  to?: string;
  includeArchived: boolean;
  statuses?: string[];
  clientProfileId?: string;
}

interface ExportPreview {
  criteria: ExportCriteria;
  rowCount: number;
  columns: string[];
  containsPersonalData: boolean;
}
```

Chaque jeu de données possède une version de schéma et une liste de colonnes stable testée. Un changement incompatible augmente cette version et est documenté.

### 4.2 Sérialisation CSV

Le service commun doit :

1. écrire BOM UTF-8 ;
2. écrire les en-têtes stables ;
3. transformer chaque valeur selon son type ;
4. neutraliser les formules dans les champs non maîtrisés ;
5. doubler chaque `"` ;
6. entourer chaque champ par `"` ;
7. séparer par `;` ;
8. terminer les lignes par CRLF.

Les valeurs nulles deviennent une cellule vide. Les tableaux deviennent des colonnes normalisées ou une représentation documentée ; aucune chaîne `[object Object]` n’est permise.

### 4.3 Politique anti-formule

Créer une seule fonction pure, par exemple `escapeSpreadsheetCell`, testée avec :

- `=1+1` ;
- `+cmd` ;
- `-10+20` lorsqu’il s’agit d’un texte utilisateur ;
- `@SUM(A1:A2)` ;
- tabulation, CR, LF et variantes pleine largeur ;
- espaces ou caractères invisibles avant un initiateur ;
- guillemets et séparateurs injectés au milieu d’une valeur ;
- texte Unicode légitime.

Les colonnes numériques générées par l’application ne passent pas comme texte utilisateur. Les identifiants, téléphones, noms, notes et libellés sont toujours traités comme non fiables.

### 4.4 Montants et quantités

Chaque fichier financier exporte les colonnes exactes. Exemple :

```text
grandTotalMinor;currency;currencyScale;grandTotalFormatted
```

Les quantités utilisent de même `quantityScaled` et `quantityScale`. Aucune conversion `Number` depuis un `bigint` agrégé n’est acceptée.

### 4.5 Interface

Avant le téléchargement :

- choix du jeu de données ;
- filtres ;
- aperçu du nombre de lignes et colonnes ;
- avertissement de confidentialité ;
- rappel « Ce CSV ne peut pas restaurer SAMTECH CRM » ;
- action « Télécharger le CSV ».

L’export est annulable avant téléchargement et ne persiste pas le contenu généré.

## 5. Sauvegarde chiffrée

### 5.1 Formats

Conserver deux niveaux de version :

- `BACKUP_FORMAT_VERSION` pour l’enveloppe métier claire ;
- `ENCRYPTED_CONTAINER_VERSION` pour le conteneur cryptographique.

Le Sprint 15 ne doit pas augmenter `BACKUP_FORMAT_VERSION` si la structure logique ne change pas. Il ne doit pas augmenter le schéma Dexie pour ajouter uniquement le chiffrement.

### 5.2 Types

```ts
interface EncryptedBackupHeaderV1 {
  product: 'samtech-crm';
  containerVersion: 1;
  encrypted: true;
  createdAt: string;
  kdf: {
    name: 'PBKDF2';
    hash: 'SHA-256';
    iterations: 600000;
    salt: string;
  };
  cipher: {
    name: 'AES-GCM';
    keyLength: 256;
    iv: string;
    tagLength: 128;
  };
  payloadEncoding: 'base64';
}

interface EncryptedBackupContainerV1 extends EncryptedBackupHeaderV1 {
  payload: string;
}
```

Les champs binaires utilisent une fonction base64 stricte et testée. Les paramètres inconnus, absents, supplémentaires dangereux ou hors bornes sont rejetés.

### 5.3 AAD canonique

Créer l’en-tête en mémoire, le sérialiser avec la fonction canonique existante ou une fonction dédiée, puis utiliser ses octets UTF-8 comme `additionalData` pour AES-GCM. Au déchiffrement, reconstruire exactement l’AAD depuis les champs validés.

Le champ `payload` n’entre pas dans l’AAD, puisqu’il est déjà authentifié par GCM. Aucune donnée mutable non authentifiée ne doit influencer le déchiffrement.

### 5.4 Dérivation et chiffrement

```text
password UTF-8 normalisé
  → importKey(raw, PBKDF2, non extractible)
  → deriveKey(PBKDF2-SHA-256, sel 16 octets, 600 000)
  → AES-GCM 256, clé non extractible
  → encrypt(IV 12 octets, tag 128, AAD)
```

- utiliser `crypto.getRandomValues` pour sel et IV ;
- générer sel et IV à chaque export ;
- ne jamais accepter un sel ou IV choisi par l’interface ;
- ne pas exporter la clé dérivée ;
- ne pas réutiliser un `CryptoKey` entre deux sauvegardes ;
- écraser les buffers mutables contenant le mot de passe UTF-8 ou le clair quand cela est raisonnablement possible ;
- ne jamais affirmer que les chaînes JavaScript ont été effacées de façon garantie.

### 5.5 Politique de mot de passe

- minimum 12 caractères Unicode après normalisation ;
- maximum raisonnable documenté pour éviter l’abus, sans tronquer silencieusement ;
- confirmation exacte à l’export ;
- bouton afficher/masquer accessible ;
- recommandation d’une phrase d’au moins quatre mots ;
- aucun indice stocké dans le fichier ;
- aucun enregistrement ou récupération ;
- effacement de l’état React après succès, erreur, navigation ou annulation.

Le formulaire doit expliquer : « Ce mot de passe est indépendant du PIN. Sans lui, la sauvegarde ne peut pas être restaurée. »

### 5.6 Export

Le cas d’usage :

1. collecte l’instantané de toutes les collections métier réelles ;
2. produit l’enveloppe et son checksum existant ;
3. sérialise en UTF-8 ;
4. chiffre avec sel et IV neufs ;
5. sérialise le conteneur ;
6. déchiffre immédiatement ce conteneur en mémoire ;
7. revalide l’enveloppe obtenue ;
8. compare digest, métadonnées et compteurs ;
9. déclenche le téléchargement `.samtech-backup` ;
10. marque l’horodatage comme export préparé avec succès.

Si l’auto-contrôle échoue, aucun fichier ni succès n’est annoncé.

### 5.7 Inspection et restauration

Détection par contenu, pas uniquement par extension :

- `.samtech-backup` : conteneur chiffré attendu ;
- `.json` : sauvegarde historique claire possible ;
- contenu incompatible : rejet générique et sûr.

Pour un conteneur V1, seules les valeurs exactes prévues sont acceptées avant PBKDF2. La taille du conteneur, la longueur base64, le sel, l’IV et le payload sont bornés avant allocation coûteuse.

Après déchiffrement, réutiliser `validateBackupText` ou son équivalent unique. Ne pas créer une seconde validation moins stricte.

La restauration :

- affiche l’aperçu complet ;
- exige `REMPLACER MES DONNÉES` ;
- exige le PIN courant s’il est actif ;
- remplace toutes les collections dans la transaction existante ;
- ne modifie pas `securitySettings` ;
- conserve la base initiale en cas d’échec ;
- libère le mot de passe et le clair après l’opération.

### 5.8 Compatibilité claire

L’import des sauvegardes JSON historiques reste disponible. L’export clair historique peut rester sous « Options avancées » avec :

- libellé « Exporter un JSON non chiffré » ;
- confirmation explicite ;
- avertissement de sensibilité ;
- aucun marquage trompeur comme option recommandée.

### 5.9 Limites de ressources

- conserver 25 Mo maximum pour le contenu clair tant que les tests n’autorisent pas plus ;
- calculer la limite externe en tenant compte du base64 et de l’enveloppe ;
- rejeter un champ `iterations` différent de 600 000 pour le conteneur V1 ;
- ne pas lire ou décoder plusieurs fois un fichier hostile ;
- afficher une erreur si le volume exige de réduire la période ou les données ;
- mesurer temps, mémoire et blocage perceptible sur appareils physiques.

## 6. Dépôt de lecture des rapports

Le dépôt expose un instantané regroupant uniquement les collections nécessaires. Il garantit que les lectures appartiennent au même état logique. Il ne renvoie pas des objets Dexie mutables à la présentation.

Le cas d’usage vérifie :

- période valide ;
- date de référence ;
- client existant si requis ;
- paramètres de devise ;
- statuts et archivage ;
- intégrité des montants avant agrégation.

Une incohérence financière produit un avertissement typé ou bloque le rapport selon sa gravité.

## 7. Routes et navigation

```text
/reports
/reports/commercial
/reports/financial
/reports/receivables
/reports/client/[clientId]
/reports/exports
/settings/backup
```

- Ajouter Rapports au menu « Plus » et à la barre latérale.
- Ne pas surcharger la navigation mobile principale.
- Depuis un client, proposer « Générer un relevé ».
- Depuis le tableau de bord, proposer « Rapport de la période » en conservant les critères explicites.
- Depuis les paramètres, conserver une seule page Sauvegarde/restauration.

## 8. Mobile, accessibilité et ergonomie

- largeur minimale 320 px ;
- filtres en une colonne sur mobile ;
- boutons tactiles d’au moins 44 px lorsque possible ;
- progression accessible pendant PDF, CSV, PBKDF2 et restauration ;
- doubles soumissions empêchées ;
- mot de passe compatible avec gestionnaires de mots de passe sans autofill inadapté ;
- `autocomplete="new-password"` à l’export et stratégie cohérente à l’import ;
- erreurs liées aux champs et statut global avec `aria-live` ;
- aucun tableau essentiel nécessitant un défilement horizontal ;
- focus visible et ordre logique ;
- mode sombre ;
- annulation possible avant l’étape destructive ;
- texte explicite en cas de téléchargement iOS/Android via partage ou fichiers.

## 9. Hors ligne

- Toutes les routes et ressources nécessaires sont disponibles hors connexion après installation/chargement prévu.
- Aucune police, bibliothèque ou clé n’est chargée à distance au moment de générer.
- Le service worker n’intercepte pas les URL Blob.
- Les fichiers téléchargés ne rejoignent pas Cache Storage.
- Les rapports et exports utilisent uniquement les données locales.
- L’E2E coupe le réseau avant génération, chiffrement, vérification et restauration.

## 10. Tests obligatoires

### 10.1 Domaine Rapports

- périodes inclusive, précédente et fuseau Dakar ;
- états vides ;
- calcul commercial identique au dashboard ;
- facturé, encaissé, dépenses et flux net ;
- soldes de comptes à date ;
- transferts internes neutralisés dans le consolidé ;
- ajustements séparés ;
- budgets chevauchants selon règle existante ;
- prévisions 30/60/90 ;
- créances et somme des tranches ;
- solde d’ouverture et de clôture client ;
- documents commerciaux sans incidence financière ;
- multi-devises et échelles différentes ;
- valeurs limites sûres et rejet des entiers invalides.

### 10.2 PDF

- quatre rapports lisibles ;
- plusieurs pages ;
- en-têtes répétés ;
- caractères français et longues valeurs ;
- dates, filtres et fuseau ;
- totaux exacts par devise ;
- avertissement non comptable ;
- état vide ;
- nom de fichier sûr ;
- partage Web Share et téléchargement de repli.

### 10.3 CSV

- BOM, point-virgule, CRLF et en-têtes ;
- guillemets, séparateurs, retours à la ligne et Unicode ;
- cellules commençant par chaque caractère dangereux ;
- variantes après espaces et contrôles ;
- formule créée après tentative de rupture de cellule ;
- colonnes exactes de montant et quantité ;
- filtres de période/statut/archive/client ;
- ordre stable ;
- gros volume ;
- ouverture contrôlée dans Excel et LibreOffice au minimum lors de la recette physique.

### 10.4 Cryptographie

- vecteurs connus ou fixtures déterministes avec sel/IV injectés uniquement en test ;
- aller-retour Unicode ;
- même clair et même mot de passe produisent deux conteneurs différents ;
- sel 16 octets et IV 12 octets ;
- clé AES non extractible ;
- mot de passe erroné ;
- payload, AAD, sel, IV, tag, date ou version modifiés ;
- fichier tronqué et base64 invalide ;
- version/algorithme/itérations non supportés ;
- fichier vide, trop grand ou structure excessive ;
- message commun mauvais mot de passe/fichier altéré ;
- mot de passe absent, trop court, différent de confirmation et Unicode normalisé ;
- absence de mot de passe dans logs et stockage ;
- nettoyage de l’état d’interface ;
- auto-contrôle avant téléchargement.

### 10.5 Sauvegarde/restauration

- toutes les collections réelles exportées une seule fois ;
- `securitySettings` exclue ;
- restauration chiffrée complète ;
- vérification sans aucune mutation ;
- JSON clair historique toujours restaurable ;
- checksum logique altéré après déchiffrement rejeté ;
- références, montants et doublons rejetés ;
- phrase destructive et PIN courant ;
- rollback sur faute injectée ;
- ouverture/fermeture de base ;
- comparaison profonde avant/après ;
- données des Sprints 13 et 14 incluses.

### 10.6 E2E Sprint 15

Créer `scripts/e2e-sprint15-test.js` et `test:sprint15` couvrant :

1. données représentatives de tous les modules ;
2. génération des quatre rapports ;
3. comparaison de leurs indicateurs avec les domaines sources ;
4. export d’au moins un CSV par famille ;
5. charges d’injection CSV ;
6. création de deux sauvegardes chiffrées différentes ;
7. mot de passe erroné et fichier altéré refusés ;
8. vérification correcte sans mutation ;
9. effacement de la base de test puis restauration correcte ;
10. restauration d’une fixture JSON historique ;
11. comparaison de toutes les collections ;
12. reproduction hors ligne ;
13. vérification absence d’erreur console, HTTP ou réseau inattendue.

## 11. Tests physiques obligatoires

Au minimum sur un Android cible et, si le produit vise iOS, sur un iPhone :

- générer et ouvrir chaque PDF ;
- télécharger, retrouver et partager un CSV ;
- ouvrir le CSV dans un tableur cible ;
- créer une sauvegarde chiffrée ;
- fermer puis rouvrir la PWA ;
- vérifier la sauvegarde depuis le sélecteur de fichiers ;
- tester mauvais puis bon mot de passe ;
- restaurer sur une base de recette ;
- mesurer durée PBKDF2, chiffrement et déchiffrement pour un fichier représentatif et proche de la limite ;
- vérifier mémoire, clavier, focus et lisibilité ;
- répéter hors ligne.

Sans preuve de ces essais, le verdict maximal est conditionnel.

## 12. Commandes de validation

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

Les scripts inexistants parce qu’un sprint précédent n’est pas terminé doivent être signalés factuellement, pas simulés. Après toute correction tardive, relancer les contrôles affectés.

## 13. Documentation à mettre à jour

- `README.md` ;
- `DOCS/ARCHITECTURE.md` ;
- `DOCS/DATABASE.md` ;
- `DOCS/RULES.md` ;
- `DOCS/SECURITY.md` ;
- `DOCS/OFFLINE_FIRST.md` ;
- `DOCS/UI_UX.md` ;
- `DOCS/TESTING.md` ;
- `DOCS/USER_GUIDE.md` ;
- `DOCS/KNOWN_LIMITATIONS.md` ;
- `DOCS/RELEASE_CHECKLIST.md` ;
- notes de version.

La documentation doit supprimer l’affirmation que l’action principale génère uniquement un JSON non chiffré, sans masquer la compatibilité historique ni prétendre qu’IndexedDB est chiffrée.

## 14. Critères d’acceptation

1. quatre rapports cohérents sont générés localement ;
2. leurs résultats correspondent aux règles métier existantes ;
3. flux, soldes, réalisé et prévisionnel sont distingués ;
4. aucune devise ou échelle n’est mélangée ;
5. les CSV ont un schéma stable et des montants exacts ;
6. toutes les cellules utilisateur sont traitées contre l’injection de formule ;
7. l’interface ne présente jamais un CSV comme restaurable ;
8. la sauvegarde chiffrée est l’action recommandée ;
9. AES-GCM authentifie contenu et en-tête ;
10. PBKDF2-SHA-256 utilise 600 000 itérations, sel neuf et clé AES-256 non extractible ;
11. l’IV GCM aléatoire de 12 octets n’est jamais réutilisé ;
12. le mot de passe est distinct du PIN et n’est jamais persisté ;
13. mauvais secret et altération produisent le même message ;
14. la sauvegarde créée est auto-vérifiée avant succès ;
15. la vérification sans restauration ne modifie aucune donnée ;
16. les anciens JSON valides restent restaurables ;
17. la restauration reste atomique et protégée par confirmation/PIN ;
18. `securitySettings` reste exclue ;
19. aucune migration Dexie inutile n’est ajoutée ;
20. les données des Sprints 13 et 14 sont incluses selon l’état final réel ;
21. mobile, accessibilité et hors ligne sont validés ;
22. toutes les commandes applicables passent ;
23. aucun P0/P1 n’est ouvert ;
24. aucune action Git ou publication non autorisée n’a été réalisée.

## 15. Verdict

Le rapport final utilise exactement l’un de ces verdicts :

- `SPRINT 15 VALIDÉ` ;
- `SPRINT 15 VALIDATION CONDITIONNELLE` ;
- `SPRINT 15 NON VALIDÉ`.

Une recette uniquement automatisée, sans téléchargement/ouverture/restauration sur appareils physiques ni mesure du KDF, ne permet pas le verdict `SPRINT 15 VALIDÉ`.
