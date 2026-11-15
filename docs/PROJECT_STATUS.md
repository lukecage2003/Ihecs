# État du projet

**Phase en cours :** Phase 1 terminée (fondations, modularisation, tests, CI). **En attente de validation** avant toute autre phase.

## Phase 1 — livré

| Élément | Statut | Emplacement |
|---|---|---|
| Découpage en modules ES par domaine | Fait, sans régression | `src/` |
| Logique métier pure et testable (date injectée) | Fait | `src/core`, `src/domain` |
| Fixtures de démonstration isolées dans un espace « demo » (D3) | Fait | `fixtures/demo/`, `src/content/workspaces.js` |
| Police locale (aucun CDN, D4) | Fait | `assets/fonts/` |
| CSP stricte, aucune requête externe | Fait, vérifié par les tests e2e | `index.html` |
| Validation des couleurs et des sauvegardes importées | Fait | `src/core/html.js`, `src/state/store.js` |
| Page 404 réelle (défaut m1) | Fait | `src/main.js` |
| Onglets accessibles au clavier, rôles ARIA (défaut m3) | Fait | `src/ui/views/chapter.js` |
| Serveur local restreint à 127.0.0.1 | Fait | `scripts/serve.mjs` |
| Tests unitaires (63) | 63 réussis | `tests/unit/` |
| Tests de bout en bout (13 parcours × 2 appareils) | 26 réussis | `tests/e2e/` |
| CI GitHub Actions | Écrite, **pas encore exécutée** | `.github/workflows/ci.yml` |
| Conception du modèle v2 et migration sans perte | Conçue et testée, **non appliquée** | `src/data/v2/`, `docs/DATA_MODEL.md` |
| Étude Google Drive sans Cloud Console | Rédigée, **aucune implémentation** | `docs/GOOGLE_DRIVE_INTEGRATION.md` |

## Limites connues

| Limite | Détail |
|---|---|
| Ouverture directe du fichier | `index.html` ne s'ouvre plus en double-cliquant (modules ES) : il faut `npm run serve` |
| CI non exécutée | Les workflows ne tournent que sur GitHub après un push. Leur résultat n'a pas encore été observé |
| Navigateurs testés | Chromium seulement |
| Défauts encore présents | C1 et C2 (identifiants positionnels, pas d'historique) tant que la v2 n'est pas appliquée ; M1 à M4 (mesure de progression, quiz, minuteur, planning) prévus aux phases suivantes |
| Stockage | Toujours `localStorage` dans ce navigateur (C4) |
| Aperçu claude.ai | Copie de l'ancienne version, conservée comme référence visuelle (D6), pas mise à jour |

## Décisions en vigueur

D1 Drive seul, sans Cloud Console · D2 dépôt privé, aucun déploiement, usage local · D3 fixtures réservées à la démo · D4 dépendances locales figées, sans CDN · D6 aperçu claude.ai conservé comme référence, GitHub seule source du code.
