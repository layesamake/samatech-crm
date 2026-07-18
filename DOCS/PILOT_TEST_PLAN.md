# Plan de test pilote — V1 bêta

Version : `1.0.0-beta.1`. Le pilote est local, limité et supervisé. Il n’autorise ni déploiement public implicite ni données personnelles réelles avant validation organisationnelle.

## Préconditions

- Build de production validé et checklist de livraison revue.
- Sauvegarde de référence conservée hors de l’appareil.
- Jeu d’essai fictif : entreprise `SENCAIILLE`, WhatsApp `+221 77 648 17 82`, adresse `Quartier Mbambara Thiès`.
- Un téléphone Android, un iPhone et une tablette identifiés pour les essais physiques.

## Recette fonctionnelle

Exécuter le parcours suivant sans envoyer de WhatsApp réel : prospect, produit demandé, qualification, relance, modèle WhatsApp, conversion, facture, PDF, deux paiements partiels, créance, paiement final, chronologie, statistiques, campagne assistée, sauvegarde puis restauration.

Pour chaque étape, contrôler création, modification, recherche, filtres, actualisation, fermeture/réouverture, relations et persistance IndexedDB. Refaire les opérations essentielles hors connexion : modification d’un contact, facture, paiement, PDF, sauvegarde/restauration, verrouillage et déverrouillage.

## Cas de sûreté

- Refuser un trop-perçu et une sauvegarde corrompue ou incompatible.
- Vérifier que l’annulation et la contrepassation exigent les confirmations prévues.
- Vérifier que le PIN n’est ni visible, ni journalisé, ni inclus dans la sauvegarde.
- Vérifier que « PIN oublié » efface uniquement après la phrase exacte.
- Tester des noms, notes et modèles contenant du HTML comme texte inerte.

## Accessibilité et appareils

Effectuer au clavier le parcours principal et contrôler focus, zoom 200 %, contraste et absence de piège. Compléter avec NVDA ou VoiceOver. Tester portrait/paysage, clavier virtuel, retour arrière, installation PWA, mise à jour et relance hors connexion.

## Collecte des résultats

Pour chaque session : date, version, appareil, OS, navigateur, installation PWA ou onglet, état réseau, étapes, résultat attendu/observé, capture et sévérité P0 à P3. Une perte de données, erreur financière, restauration partielle, contournement normal du verrouillage ou parcours essentiel indisponible est bloquant.

## Sortie du pilote

La phase pilote ne s’élargit qu’après : zéro P0/P1, résolution ou acceptation explicite des P2, sauvegarde/restauration prouvée sur appareils cibles, résultats financiers exacts et documentation mise à jour.

