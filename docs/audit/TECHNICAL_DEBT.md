# Dette technique et défauts

Classés par gravité. « Critique » bloque la vision (intégrité ou confidentialité des données) ; « Majeur » fausse un résultat présenté à l'utilisateur ; « Mineur » est un défaut de confort.

## Critiques

| # | Défaut | Conséquence | Correction proposée |
|---|---|---|---|
| C1 | **Identifiants de fiche fondés sur la position** (`matière\|chapitre\|index`) | Insérer, supprimer ou réordonner une fiche rattache l'historique de révision à la mauvaise question, sans le signaler | Identifiant stable (UUID) par élément, avec une migration qui conserve l'état existant |
| C2 | **Aucun journal des révisions** : seul l'état courant (`box`, `due`) est conservé | Impossible de mesurer la rétention, de calculer FSRS, de tracer un résultat jusqu'à l'activité réelle, ou de corriger une erreur de notation | Journal en ajout seul : un enregistrement par révision (date, note, durée, état avant et après) |
| C3 | **Contenu des cours dans le dépôt** (`data/cours.js`, `cours/`) | Un site GitHub Pages est public : y publier les vrais cours les exposerait | Le contenu réel vit dans Google Drive et n'est lu qu'à l'exécution ; le dépôt ne garde que le code et un jeu d'exemple |
| C4 | **`localStorage` comme unique stockage** | Données perdues si on efface le navigateur ; une seule machine ; environ 5 Mo ; aucun versionnement de schéma | Drive comme source de vérité ; IndexedDB comme cache et file d'attente documentés |

## Majeurs

| # | Défaut | Correction proposée |
|---|---|---|
| M1 | Progression ramenée à **un seul pourcentage** aux poids arbitraires (30/30/40) | Mesures séparées (mémorisation, quiz, lecture) avec les données manquantes affichées comme telles |
| M2 | Quiz : on garde le **meilleur** score, ce qui gonfle la préparation affichée | Historique des tentatives ; afficher la dernière, la moyenne et la tendance |
| M3 | Le minuteur ajoute 5 unités d'« activité » sans travail mesuré | Séparer le temps de travail des révisions mesurées |
| M4 | Le planning est recalculé chaque jour, sans limite de charge ni modification manuelle | Plans persistants et modifiables, avec une capacité quotidienne déclarée |
| M5 | Application en un seul fichier de 818 lignes, rendu par `innerHTML` | Modules ES par domaine ; fonctions pures testables ; nettoyage HTML pour tout contenu importé |
| M6 | Aucun test ni CI | Tests unitaires (`node --test`) et parcours Playwright dans GitHub Actions |

## Mineurs

| # | Défaut |
|---|---|
| m1 | La vue 404 est inaccessible : un hash inconnu redirige vers l'accueil |
| m2 | La couleur des matières n'est pas validée (injection CSS possible depuis un fichier de données) |
| m3 | Les onglets ont `role="tab"` sans `tabpanel` ni navigation aux flèches ; la fiche est un `div role="button"` |
| m4 | Les dates d'examen sont interprétées dans le fuseau du navigateur, sans fuseau explicite |
| m5 | Le minuteur dépend de `setInterval`, ralenti par les navigateurs dans les onglets en arrière-plan |
| m6 | Pas de `.gitignore`, pas de licence |
| m7 | Le Markdown maison ne gère pas les listes imbriquées, les images ni les notes de bas de page |
| m8 | L'aperçu publié sur claude.ai est une copie hors dépôt qui peut diverger |
