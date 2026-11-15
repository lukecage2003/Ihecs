# Résultats de référence (baseline)

- **Date :** 15 novembre 2026
- **Commit :** `b9e7d7a`
- **Environnement :** Node 22.23.4, Playwright 1.63.0, Chromium, serveur `python3 -m http.server`
- **Script :** `docs/audit/scripts/baseline-smoke.js`, lancé à la main. Le site doit être servi sur `localhost:8765` et Playwright être installé.

## Vérifications disponibles dans le dépôt

| Vérification | Résultat |
|---|---|
| Tests du dépôt | **Aucun** |
| Vérification des types | **Non applicable** (JavaScript sans typage) |
| Lint | **Aucun configuré** |
| Build | **Non applicable** (site statique) |
| Syntaxe (`node --check`) sur `app.js` et `cours.js` | Réussi |

## Vérifications fonctionnelles (navigateur réel)

27 vérifications, 27 réussies.

| # | Vérification | Résultat |
|---|---|---|
| 1–14 | Rendu des 14 routes (dont `#inexistant`) | 14 réussies |
| 15 | « Marquer comme lu » survit au rechargement | Réussi |
| 16 | La note d'une fiche est enregistrée | Réussi |
| 17 | « Facile » depuis la boîte 0 programme à +2 jours | Réussi |
| 18 | Une note donnée avant de retourner la fiche est ignorée | Réussi |
| 19 | Le résultat d'un quiz complet est enregistré | Réussi |
| 20 | Une case cochée dans le planning est conservée | Réussi |
| 21 | Export puis import restaure l'état | Réussi |
| 22 | Un code de sauvegarde invalide est refusé sans perte | Réussi |
| 23 | La réinitialisation demande une confirmation dans la page | Réussi |
| 24 | La recherche trouve « handyside » | Réussi (11 résultats) |
| 25 | Le site fonctionne si le stockage est bloqué | Réussi |
| 26 | Aucun défilement horizontal à 375 px | Réussi |
| 27 | Aucune erreur JavaScript non gérée | Réussi |

## Non testé

| Élément | Raison |
|---|---|
| Accessibilité (contraste, lecteur d'écran) | Aucun outil d'audit (axe, Lighthouse) installé dans le dépôt ; seule une revue manuelle du code a été faite |
| Safari et Firefox | Seul Chromium est disponible ici |
| Fin d'une session du minuteur Focus | 25 minutes réelles ; non simulé |
| Bascule de jour pour la série et les échéances | Nécessite de simuler l'horloge |
| Google Drive | N'existe pas encore |

## Remarques

- `#inexistant` « réussit » parce qu'il redirige vers l'accueil. La vue « Page introuvable » n'est jamais atteinte (voir `TECHNICAL_DEBT.md`).
- Le quiz du test 19 a été rempli en répondant toujours « A » : il vérifie l'enregistrement, pas la justesse des corrigés.
