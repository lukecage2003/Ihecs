# Tests

| Commande | Contenu | Outil |
|---|---|---|
| `npm run check` | Syntaxe de tous les fichiers JS | `node --check` |
| `npm test` | Tests unitaires : logique pure, stockage, sauvegardes, fixtures, serveur, migration v2 | `node --test` (intégré à Node) |
| `npm run test:e2e` | Parcours réels dans Chromium, en bureau et en mobile (Pixel 7) | `@playwright/test` 1.63.0 |
| `npm run test:all` | Les trois à la suite | |

## Ce que couvrent les tests de bout en bout

Chaque test échoue aussi s'il se produit une **erreur JavaScript**, une **violation de CSP** ou une **requête vers un autre site que l'application**.

Parcours couverts :
- affichage de toutes les pages, sans débordement horizontal ;
- signalement de l'espace de démonstration ; page 404 ;
- chapitre marqué comme lu et persistance ;
- notation d'une fiche, seulement une fois retournée ;
- quiz complet ;
- navigation au clavier entre les onglets ;
- cases du planning ;
- export et import d'une sauvegarde, refus d'une sauvegarde invalide ;
- annulation de la réinitialisation ;
- recherche ;
- **lecture d'une progression laissée par l'ancienne version, sans la modifier** ;
- fonctionnement quand le stockage est bloqué.

## Pas encore couvert

- Firefox et Safari : seul Chromium est installé dans l'environnement de développement actuel.
- Audit d'accessibilité automatisé (axe) : il demanderait une dépendance de plus, pas encore autorisée.
- Fin réelle d'une session du minuteur (25 minutes) et passage de minuit.
- Google Drive : pas implémenté.

## CI

`.github/workflows/ci.yml` lance les trois commandes à chaque push, sans secret, sans déploiement et avec des permissions en lecture seule. Le workflow n'a pas encore pu s'exécuter : voir `PROJECT_STATUS.md`.
