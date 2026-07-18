# Checklist de livraison — V1 bêta

Version cible : `1.0.0-beta.1`.

## Automatisé avant livraison

- [ ] `npm.cmd run lint`
- [ ] `npx.cmd tsc --noEmit`
- [ ] `npm.cmd test -- --run`
- [ ] `npm.cmd run build`
- [ ] `npm.cmd run test:pwa`
- [ ] `npm.cmd run test:accessibility`
- [ ] `npm.cmd run test:responsive`
- [ ] `npm.cmd run test:performance`
- [ ] `npm.cmd run test:lighthouse`
- [ ] `npm.cmd run test:pwa-update`
- [ ] `npm.cmd run test:v1-beta`
- [ ] Vérifier l’audit de dépendances et documenter chaque alerte.
- [ ] Vérifier version, manifeste, service worker, migrations et sauvegarde de référence.

## Recette et données

- [ ] Parcours transversal complet et calculs financiers vérifiés.
- [ ] Sauvegarde des 20 tables, checksum, restauration atomique et rollback vérifiés.
- [ ] PIN exclu de l’export et ancien PIN non restauré.
- [ ] Hors connexion : consultation, écriture, facture, paiement, PDF et sauvegarde/restauration.
- [ ] Aucun message WhatsApp réellement envoyé pendant la recette.
- [ ] Aucun P0/P1 ouvert ; P2/P3 consignés dans `KNOWN_LIMITATIONS.md`.

## À réaliser sur appareil physique

- [ ] Android/Chrome : installation PWA, portrait/paysage, clavier virtuel, mise à jour, redémarrage et hors ligne.
- [ ] iPhone/Safari : ajout à l’écran d’accueil, zones sûres, stockage, PDF, partage, mise à jour et hors ligne.
- [ ] Tablette : portrait/paysage, tableaux, dialogues et navigation tactile.
- [ ] Ordinateur Chrome/Edge : installation et cycle complet.
- [ ] Firefox : parcours en onglet, IndexedDB, PDF et hors connexion lorsque pris en charge.
- [ ] Lecteur d’écran NVDA ou VoiceOver et zoom navigateur 200 %.
- [ ] Sauvegarde téléchargée, déplacée, relue puis restaurée sur chaque famille d’appareil.

## Publication

- [ ] Autorisation explicite obtenue avant tout commit, tag, push ou déploiement.
- [ ] Notes de version et guide utilisateur transmis aux pilotes.
- [ ] Canal de signalement, responsable de sauvegarde et procédure de retour arrière identifiés.

