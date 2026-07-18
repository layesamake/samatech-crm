# Limites connues — V1 bêta

- Application mono-utilisateur et locale : aucun backend, cloud, compte, synchronisation ou travail multi-appareil.
- IndexedDB n’est pas chiffré. Le PIN masque l’interface mais ne protège pas le stockage contre un accès administrateur à l’appareil.
- Les sauvegardes JSON et les PDF ne sont pas chiffrés ; leur protection relève de l’utilisateur.
- Aucun mécanisme de récupération du PIN. La procédure « PIN oublié » efface les données locales.
- WhatsApp est uniquement assisté par lien : aucun envoi automatique, accusé de livraison/lecture, réponse ou attribution de conversion.
- Les campagnes ne mesurent ni livraison, ni lecture, ni ROI.
- Aucune fusion de sauvegardes : une restauration remplace les 20 tables métier après validation.
- Une route jamais chargée ni précachée peut être indisponible hors connexion selon le navigateur.
- Les quotas, l’éviction du stockage et certaines limites d’installation PWA dépendent du navigateur, en particulier sur iOS.
- Les essais automatisés utilisent Chromium headless et de l’émulation ; Safari réel, appareils Android/iPhone/tablette, clavier virtuel et lecteur d’écran restent à valider physiquement.
- Le dernier passage Lighthouse mobile simulé mesure 68 sur le tableau de bord et 67 sur la liste Prospects, sous l’objectif de 85 ; un passage précédent du même build avait mesuré 76 et 68. L’accessibilité est stable à 100 et 98, les bonnes pratiques à 100 et le CLS à 0. Le volume fonctionnel reste utilisable, mais la variabilité et l’optimisation du chargement JavaScript sont un P2 connu.
- L’audit npm en ligne peut être indisponible dans un environnement sans accès au registre ; toute alerte de dépendance doit être revue avant élargissement du pilote.
