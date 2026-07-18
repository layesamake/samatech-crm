# Guide utilisateur — SAMTECH CRM V1 bêta

Version documentée : `1.0.0-beta.1`.

SAMTECH CRM est une PWA commerciale mono-utilisateur et hors ligne. Les données restent dans IndexedDB sur l’appareil utilisé : il n’existe ni compte cloud, ni synchronisation, ni récupération distante.

## Installer et démarrer

Ouvrez l’application dans un navigateur compatible, puis utilisez l’action « Installer l’application » du navigateur lorsque celle-ci est proposée. Ouvrez au moins une fois l’application en ligne pour installer le service worker et mettre les ressources en cache. Sur iPhone/iPad, utilisez Safari puis « Sur l’écran d’accueil » ; les limites iOS doivent être vérifiées sur appareil physique.

## Parcours commercial

1. Configurez l’entreprise, la devise et la numérotation dans Paramètres.
2. Créez les localités, catégories et produits.
3. Ajoutez un prospect, ses intérêts, ses notes et ses relances.
4. Utilisez un modèle WhatsApp : l’application ouvre un lien prérempli, mais n’envoie jamais le message et ne confirme ni livraison ni lecture.
5. Convertissez le prospect en client sans dupliquer le contact.
6. Créez puis émettez une facture. Téléchargez son PDF localement.
7. Enregistrez un ou plusieurs paiements partiels. Le solde et les créances sont recalculés à partir des paiements actifs ; le trop-perçu est refusé.
8. Consultez la chronologie, le tableau de bord et les statistiques.
9. Préparez une campagne assistée. Chaque destinataire doit être traité manuellement ; aucun envoi automatique n’a lieu.

## Hors connexion

Après une première ouverture en ligne, les routes mises en cache et les données locales restent disponibles hors connexion. La création et la modification locales, les factures, paiements, PDF et sauvegardes fonctionnent sans réseau. Une route jamais mise en cache peut rester indisponible selon le navigateur. Attendez le retour en ligne avant toute mise à jour de l’application.

## Sauvegarder et restaurer

Dans Paramètres > Sauvegarde, exportez régulièrement les 20 tables métier. Le fichier JSON contient des données commerciales sensibles, n’est pas chiffré et doit être stocké dans un emplacement sûr. Le PIN n’est jamais exporté.

Avant restauration, vérifiez l’aperçu puis saisissez la phrase de confirmation et le PIN actif. La restauration remplace atomiquement les données métier ; en cas d’erreur, aucune écriture partielle ne doit subsister. Conservez plusieurs sauvegardes datées.

## PIN local

Le PIN facultatif masque l’interface et se dérive localement avec PBKDF2-SHA-256 et un sel aléatoire. Il ne chiffre pas IndexedDB et ne protège pas contre une personne ayant le contrôle complet de l’appareil. Il n’existe aucun PIN maître.

Si le PIN est oublié, la seule procédure proposée efface toutes les données locales après saisie exacte de la phrase destructive. Exportez donc une sauvegarde avant d’activer le PIN. Restaurer une sauvegarde ne restaure jamais l’ancien PIN.

## Bonnes pratiques pilote

- Utilisez des données fictives pendant les premiers essais.
- Sauvegardez avant une mise à jour, une restauration ou un changement d’appareil.
- Vérifiez les montants, la devise et le destinataire avant toute action externe.
- Ne partagez ni sauvegarde, ni PDF, ni appareil déverrouillé sans autorisation.
- Signalez le navigateur, l’appareil, l’heure et les étapes exactes de tout défaut.

