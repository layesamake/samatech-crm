# SAMTECH CRM — AUDIT DE COHÉRENCE DOCUMENTAIRE

**Document :** `AUDIT_DOCUMENTAIRE.md`  
**Produit :** SAMTECH CRM  
**Version de l'audit :** 1.0  
**Date :** 17 juillet 2026  
**Périmètre :** Documentation fondatrice avant Sprint 0

---

# 1. Conclusion

La documentation est suffisamment structurée pour préparer le Sprint 0, sous réserve de valider trois décisions fonctionnelles avant les sprints concernés.

Aucune contradiction critique n'a été trouvée concernant :

- la vision du produit ;
- la PWA mobile-first ;
- l'approche offline-first ;
- IndexedDB/Dexie comme source locale ;
- l'identité unique prospect/client ;
- les statuts principaux ;
- les 22 tables ;
- la facturation et les paiements ;
- le fonctionnement assisté de WhatsApp ;
- l'exclusion du cloud, des licences, du multi-utilisateur et de l'IA en V1.

État global : **cohérent et harmonisé**.

---

# 2. Documents audités

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

---

# 3. Points validés

## 3.1 Périmètre V1

Tous les documents majeurs décrivent une V1 :

- mono-utilisateur ;
- locale ;
- sans backend métier ;
- sans synchronisation ;
- sans licences ;
- sans automatisation WhatsApp ;
- sans IA.

## 3.2 Statuts prospects

Les codes suivants sont cohérents entre `RULES.md` et `DATABASE.md` :

`NOUVEAU`, `CONTACTE`, `INTERESSE`, `A_RELANCER`, `NEGOCIATION`, `CONVERTI`, `PERDU`.

## 3.3 Statuts factures

Les codes suivants sont cohérents :

`BROUILLON`, `EMISE`, `PARTIELLEMENT_PAYEE`, `PAYEE`, `ANNULEE`.

## 3.4 WhatsApp

Tous les documents distinguent correctement :

- ouverture de WhatsApp ;
- confirmation humaine ;
- envoi réel non observable automatiquement en V1.

## 3.5 Données

La liste annoncée de 22 tables correspond au schéma décrit. Les principales relations, transactions et index ont une justification fonctionnelle.

## 3.6 Tests

Les domaines à risque sont couverts par la stratégie : conversion, argent, séquences, paiements, migrations, sauvegarde/restauration, PWA et sécurité.

---

# 4. Décisions validées et appliquées

## AUD-001 — Campagnes classées « Should have »

**Statut :** résolu.

`VISION.md`, `ROADMAP.md` et les parcours présentent les campagnes comme faisant partie de la V1. La section MoSCoW de `CAHIER_DES_CHARGES.md` les place toutefois dans **Should have**.

**Risque :** une équipe pourrait considérer la V1 terminée sans campagnes.

**Décision appliquée :** campagnes assistées classées **Must have V1**.

## AUD-002 — PIN classé « Should have »

**Statut :** résolu.

Le PIN est inclus dans la vision, le cahier des charges et le Sprint 9, mais classé **Should have** dans la matrice MoSCoW.

**Risque :** statut ambigu pour la recette de la V1.

**Décision appliquée :** PIN local classé **Must have V1**, avec communication claire de ses limites.

## AUD-003 — Politique « PIN oublié »

**Statut :** résolu.

`SECURITY.md` présente trois possibilités sans en retenir une.

**Décision appliquée :** aucune porte dérobée ; réinitialisation complète avec perte des données locales, restauration facultative d'une sauvegarde, puis création d'un nouveau PIN.

## AUD-004 — Remises globales de facture

**Statut :** résolu.

Le cahier des charges et les règles évoquent des remises, tandis que `DATABASE.md` décrit précisément les remises par ligne et conserve un total de remise sur la facture, sans champ définissant une remise globale.

**Risque :** deux moteurs de calcul différents selon l'interprétation.

**Décision appliquée :** remises par ligne uniquement ; somme dans `discountTotalMinor` ; remises et frais globaux différés.

---

# 5. Points à confirmer pendant le Sprint 0

## AUD-005 — Solution PWA

Le choix du mécanisme de service worker reste volontairement ouvert.

**Action :** réaliser une preuve de concept compatible avec la version exacte de Next.js, tester build de production, installation, navigation hors ligne et mise à jour.

## AUD-006 — Bibliothèque PDF

Le choix reste volontairement ouvert.

**Action :** comparer au maximum trois options et tester UTF-8, 50 lignes, multipage, logo, génération hors ligne, téléchargement et partage.

## AUD-007 — Représentation monétaire

Le principe est cohérent, mais la bibliothèque ou le type final reste à sélectionner.

**Action :** retenir soit les unités monétaires minimales avec entiers sûrs, soit une bibliothèque décimale justifiée. Tester XOF et une devise à deux décimales.

## AUD-008 — Concurrence entre onglets

La numérotation transactionnelle est documentée, mais le comportement multi-onglets doit être prouvé.

**Action :** tester deux onglets émettant des factures et définir une stratégie de verrouillage ou de détection si nécessaire.

---

# 6. Points réglementaires avant commercialisation

Ces sujets ne bloquent pas le Sprint 0, mais doivent être traités avant vente :

- mentions obligatoires des factures selon les pays ciblés ;
- règles fiscales et taxes ;
- politique de confidentialité ;
- durée de conservation ;
- consentement aux campagnes ;
- conditions d'utilisation ;
- politique de support et mises à jour ;
- protection des sauvegardes.

---

# 7. Corrections documentaires réalisées

Les décisions AUD-001 à AUD-004 ont été appliquées :

1. matrice MoSCoW mise à jour ;
2. politique PIN oublié figée ;
3. remises V1 limitées aux lignes ;
4. prompts Gemini et Codex harmonisés ;
5. changelog mis à jour ;
6. identifiants `BR-*` conservés.

---

# 8. Critère d'autorisation du Sprint 0

Le Sprint 0 peut commencer lorsque :

- l'audit est accepté ;
- les décisions AUD-001 à AUD-004 sont appliquées ;
- le projet contient un `AGENTS.md` concis ;
- les versions techniques sont choisies à partir de sources officielles actuelles ;
- aucune fonctionnalité métier complète n'est incluse dans l'initialisation.

---

# 9. Décision recommandée

Valider les choix suivants :

- campagnes assistées : **Must have V1** ;
- PIN local : **Must have V1** ;
- PIN oublié : réinitialisation locale avec perte des données, puis restauration d'une sauvegarde ;
- remises V1 : remises par ligne uniquement ;
- remise globale et frais globaux : différés.

Avec ces décisions, la documentation est prête à guider le Sprint 0 et les sprints métier suivants.
