# Analyse fonctionnelle et technique — Sprint 12

## Performances et ergonomie mobile

## 1. Contexte

SAMTECH CRM est une PWA Next.js 16, React 19 et Dexie V11, conçue en priorité pour le smartphone. Le produit couvre désormais prospects, clients, relances, catalogue, factures, paiements, campagnes, statistiques, dépenses, sauvegarde et sécurité locale.

Le Sprint 10 a établi une référence Lighthouse mobile d’environ 68 sur le tableau de bord et 67 sur Prospects, avec un LCP proche de 3,5 secondes et un TBT supérieur à une seconde. Le Sprint 11 a ajouté une page hors ligne, un indicateur réseau, un cycle de mise à jour contrôlé et des en-têtes HTTP. Son rapport ne contient toutefois ni matrice d’appareils physiques, ni résultats complets des commandes, ni mesures avant/après. Ces éléments ne doivent pas être considérés comme validés sans nouvelle preuve.

Le Sprint 12 vise à rendre l’application sensiblement plus rapide et plus simple sur téléphone, sans ajouter de nouveau module métier.

## 2. Constats factuels initiaux

L’inspection du code actuel révèle plusieurs pistes à confirmer par mesure :

- de nombreuses pages métier sont entièrement des composants clients ;
- le tableau de bord exécute le moteur complet de statistiques puis lit directement `db.invoices` depuis la présentation ;
- les factures récentes sont toutes chargées, triées en mémoire puis limitées à trois ;
- plusieurs listes chargent et rendent toute la collection sans pagination ni rendu progressif ;
- la recherche Prospects relance une requête réactive à chaque caractère ;
- certains grands composants cumulent chargement, calcul, état et rendu ;
- le tableau de bord et la page Clients convertissent des montants exacts avec `Number`, parfois pour calculer une valeur financière affichée ;
- les créances Clients sont agrégées sans séparation fiable des devises ;
- la présentation du tableau de bord accède directement à Dexie, contrairement à l’architecture documentée ;
- le menu mobile livré diffère de la navigation de référence décrite dans `UI_UX.md` ;
- plusieurs actions flottantes peuvent entrer en concurrence avec la barre inférieure ;
- le balayage sur Clients révèle des actions, mais une alternative visible doit être garantie ;
- certains libellés sont trompeurs, notamment « Nouveau client » vers la création d’un prospect et « Ajouter l’heure du journal » vers les relances ;
- une valeur « Crédits inutilisés » est affichée à zéro sans source métier réelle.

Ces constats sont des hypothèses de travail ou défauts observables. Gemini doit les vérifier, les mesurer puis corriger leur cause sans réécrire inutilement l’application.

## 3. Objectifs

### Performance réelle

- réduire le JavaScript nécessaire au premier affichage ;
- raccourcir LCP et TBT sur le tableau de bord et Prospects ;
- éviter les lectures Dexie complètes lorsqu’une requête ciblée suffit ;
- garder les recherches, filtres et défilements réactifs avec le jeu volumique ;
- charger PDF, scanner et vues détaillées uniquement à la demande ;
- conserver les performances hors ligne et sur téléphone Android milieu de gamme.

### Ergonomie mobile

- rendre les tâches fréquentes accessibles en un ou deux gestes évidents ;
- harmoniser navigation, actions rapides et boutons flottants ;
- simplifier les filtres sur petit écran ;
- conserver la position, la recherche et les filtres au retour d’une fiche ;
- rendre les formulaires utilisables avec le clavier virtuel ;
- remplacer les tableaux complexes par des cartes mobiles lorsque nécessaire ;
- fournir des chargements, états vides, erreurs et confirmations cohérents ;
- ne dépendre ni d’une couleur, ni d’un geste caché.

### Intégrité

- supprimer les calculs financiers via `Number` lorsqu’ils produisent une valeur métier ;
- séparer strictement les montants par couple devise/échelle ;
- restaurer l’accès à Dexie par dépôts et cas d’usage ;
- ne modifier aucune règle métier pour améliorer artificiellement une mesure.

## 4. Utilisateur et conditions cibles

Le scénario de référence est un responsable de petite entreprise utilisant un téléphone Android de milieu de gamme, parfois hors ligne, avec une seule main et une connexion intermittente.

Les conditions doivent inclure :

- viewport 360 ou 390 × 844 ;
- limitation CPU et réseau reproductible pour Lighthouse ;
- 1 000 prospects, 200 clients, 500 relances, 200 factures, 180 paiements et un historique long ;
- données financières, dépenses et plusieurs états métier ;
- mode clair et sombre ;
- portrait, paysage et clavier virtuel.

Les mesures sur poste de développement restent utiles pour comparer, mais ne remplacent pas une recette sur téléphone.

## 5. Périmètre

### Inclus

- mesure avant/après et budget de performance ;
- analyse du bundle et des frontières client ;
- chargement différé fondé sur les usages ;
- optimisation des lectures Dexie et des agrégats ;
- pagination, chargement progressif ou fenêtre de rendu pour les listes longues ;
- recherche temporisée sans perte de réactivité ;
- optimisation du tableau de bord mobile ;
- navigation inférieure, menu Plus et actions rapides ;
- filtres mobiles en panneau, puces actives et réinitialisation ;
- persistance de l’état de liste au retour d’une fiche ;
- ergonomie des formulaires, clavier et actions fixes ;
- cartes mobiles pour les données tabulaires ;
- squelettes, états vides, erreurs et annonces accessibles ;
- correction des libellés et valeurs trompeuses ;
- tests responsive, accessibilité, performance et parcours ;
- mise à jour de la documentation et rapport factuel.

### Hors périmètre

- nouveau module métier ;
- refonte complète de l’identité visuelle ;
- application Android native ;
- backend, cloud, synchronisation ou compte ;
- notifications Push serveur ;
- remplacement de Dexie ;
- modification des formules commerciales ou financières ;
- virtualisation ajoutée sans preuve d’un bénéfice ;
- dépendance lourde introduite uniquement pour l’interface ;
- commit, push, tag ou déploiement sans autorisation.

## 6. Parcours prioritaires

### Parcours A — Travail du jour

1. ouvrir l’application ;
2. voir immédiatement relances en retard, créances et mouvement net ;
3. ouvrir les relances du jour ;
4. revenir au tableau de bord sans perdre la position.

### Parcours B — Nouveau prospect

1. déclencher l’action depuis la barre ou le tableau de bord ;
2. saisir le minimum requis avec le bon clavier ;
3. enregistrer en moins d’une minute ;
4. revenir à une liste affichant le nouveau prospect et les filtres précédents.

### Parcours C — Recherche et filtres

1. ouvrir Prospects ;
2. rechercher par nom ou numéro ;
3. appliquer plusieurs filtres dans un panneau mobile ;
4. voir le nombre de résultats et les filtres actifs ;
5. ouvrir une fiche puis revenir avec le même contexte ;
6. tout réinitialiser en une action.

### Parcours D — Opération financière

1. ouvrir un client ou une facture ;
2. enregistrer un paiement ou une dépense ;
3. vérifier le montant exact et la devise ;
4. consulter le tableau de bord sans mélange de devise ni perte d’exactitude.

## 7. Navigation mobile recommandée

La navigation doit être fondée sur la fréquence réelle. La référence documentaire propose : Accueil, Prospects, Relances, Clients et Plus. Le sprint doit la confronter aux parcours et conserver cinq zones maximum, icône et libellé visibles.

Règles :

- aucune destination essentielle ne dépend uniquement du balayage ;
- l’action « + » ne doit pas masquer les onglets ou les boutons de page ;
- un seul appel principal domine chaque écran ;
- le bouton flottant d’une page ne doit pas chevaucher la barre inférieure ni les zones sûres ;
- le menu Plus doit fermer correctement, gérer le focus et signaler la destination active ;
- Prospects et Relances doivent rester rapidement accessibles ;
- les libellés décrivent exactement la destination ou l’action.

## 8. Listes, recherche et filtres

Une liste volumineuse ne doit pas charger ou rendre aveuglément toutes les lignes si l’utilisateur n’en voit que quelques-unes.

Approches possibles après profilage :

- requêtes Dexie indexées et limitées ;
- pagination stable par curseur ;
- bouton « Afficher plus » ;
- rendu progressif ;
- virtualisation uniquement si elle reste accessible et conserve le focus.

La recherche doit être insensible à la casse et aux accents selon les règles existantes. Une temporisation courte peut réduire les requêtes, mais ne doit ni perdre une saisie ni rendre l’interface lente. Les filtres doivent être conservés dans l’URL ou un état de navigation approprié afin que Retour restaure le contexte.

## 9. Tableau de bord

Le premier écran ne doit pas calculer et rendre tous les détails disponibles dans Statistiques. Il doit privilégier :

- travail urgent ;
- indicateurs financiers principaux ;
- actions rapides exactes ;
- trois à cinq transactions récentes obtenues par un cas d’usage ciblé ;
- une ou deux visualisations accessibles ;
- lien vers les statistiques complètes.

Les calculs doivent rester dans le domaine ou l’application. Les barres visuelles peuvent utiliser des ratios de présentation calculés à partir de valeurs exactes, mais les montants affichés et signes du flux net doivent venir d’un calcul exact, par exemple `bigint` ou utilitaire métier existant.

## 10. Objectifs mesurables

Sur un protocole stable en build de production :

- Lighthouse Performance ≥ 85 sur `/` et `/prospects` ;
- Accessibilité ≥ 98, Bonnes pratiques = 100 et CLS ≤ 0,1 ;
- LCP cible ≤ 2,5 s ;
- TBT cible ≤ 300 ms ;
- aucune augmentation du JavaScript initial sans justification mesurée ;
- recherche et filtres combinés : médiane ≤ 300 ms avec le jeu représentatif ;
- action après un toucher : retour visuel immédiat et aucune tâche longue évitable ;
- zéro débordement horizontal essentiel de 320 à 1440 px ;
- aucune régression de sauvegarde, PWA, calcul financier ou hors ligne.

Si une cible n’est pas atteinte, le rapport doit publier la valeur exacte, la comparaison, la cause probable et le prochain traitement. La variabilité Lighthouse impose plusieurs passages et l’usage de la médiane.

## 11. Stratégie de correction

1. figer un jeu et un protocole avant modification ;
2. mesurer route, chunks, requêtes Dexie et rendus ;
3. corriger en premier les lectures et calculs inutiles ;
4. fractionner uniquement les éléments réellement lourds ;
5. corriger navigation, filtres et formulaires ;
6. ajouter un test de régression par défaut corrigé ;
7. rejouer les mesures dans les mêmes conditions ;
8. effectuer une recette tactile physique lorsqu’un appareil est disponible ;
9. documenter les écarts sans embellissement.

## 12. Risques

- **Optimisation sans mesure** : conserver une référence et profiler.
- **Pagination incorrecte** : assurer ordre stable, absence de doublon et prise en compte des mises à jour Dexie.
- **Régression hors ligne** : tester tous les chunks différés après mise en cache et hors ligne.
- **Perte de contexte** : tester Retour, actualisation et ouverture de fiche.
- **Accessibilité de la virtualisation** : fournir une alternative ou choisir un chargement progressif.
- **Montants inexacts** : bannir `Number` pour calculer ou agréger les valeurs financières affichées.
- **Mélange de devises** : regrouper par devise et échelle.
- **Réduction fonctionnelle** : aucune action existante ne doit disparaître sans alternative évidente.

## 13. Décision de fin de sprint

- **SPRINT 12 VALIDÉ** : objectifs fonctionnels atteints, commandes réussies, aucune régression P0/P1, performances mesurées et ergonomie mobile testée physiquement.
- **SPRINT 12 VALIDATION CONDITIONNELLE** : code et automatisation conformes, mais recette tactile ou cible de performance non prouvée sur appareil réel.
- **SPRINT 12 NON VALIDÉ** : erreur financière, perte de données, régression hors ligne, parcours essentiel défaillant ou P0/P1 ouvert.

Un score isolé ou une impression visuelle ne suffit pas pour valider le sprint.
