# État du projet

**Phase en cours :** prototype Google Drive (option A), **en attente des mesures réelles** faites par l'utilisateur. La phase 1 est terminée et validée (CI réussie). La conception v2 est validée mais **pas encore appliquée**.

## Prototype Drive et suppression du serveur — livré

| Élément | Statut | Emplacement |
|---|---|---|
| Application en un seul fichier ouvrable par double-clic (aucun serveur) | Fait, testé en `file://` | `IHECS-STUDY-OS.html`, `scripts/build.mjs` |
| Laboratoire Drive autonome (6 étapes, rapport JSON) | Fait, mécanique testée | `prototypes/drive/labo-drive.html` |
| Mesures réelles avec Google Drive pour ordinateur | **Partielles** (15 novembre) : `file://`, écriture et synchronisation dans les deux sens confirmées ; autorisation après redémarrage et modifications simultanées encore à mesurer | `GOOGLE_DRIVE_INTEGRATION.md#résultats-des-mesures` |
| Laboratoire version 2 : messages clairs quand une étape manque | Fait, testé | `prototypes/drive/labo-drive.html` |

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
| Serveur local restreint à 127.0.0.1 | Remplacé par le fichier autonome (0.3.0) | — |
| Tests unitaires | 65 réussis (0.3.0) | `tests/unit/` |
| Tests de bout en bout (application 13 + laboratoire 7, × 2 appareils) | 40 réussis (0.3.0) | `tests/e2e/` |
| CI GitHub Actions | Réussie sur la phase 1 (run 43762866950) | `.github/workflows/ci.yml` |
| Conception du modèle v2 et migration sans perte | Conçue et testée, **non appliquée** | `src/data/v2/`, `docs/DATA_MODEL.md` |
| Étude Google Drive sans Cloud Console | Rédigée, **aucune implémentation** | `docs/GOOGLE_DRIVE_INTEGRATION.md` |

## Limites connues

| Limite | Détail |
|---|---|
| Fichier à ouvrir | C'est `IHECS-STUDY-OS.html` (généré) ; `index.html` est un gabarit de développement qui ne s'ouvre pas seul |
| Laboratoire en test automatique | Chromium headless plante en relisant une poignée de dossier depuis IndexedDB : cette mémorisation est simulée dans les tests et mesurée pour de vrai seulement chez l'utilisateur |
| Navigateurs testés | Chromium seulement |
| Défauts encore présents | C1 et C2 (identifiants positionnels, pas d'historique) tant que la v2 n'est pas appliquée ; M1 à M4 (mesure de progression, quiz, minuteur, planning) prévus aux phases suivantes |
| Stockage | Toujours `localStorage` dans ce navigateur (C4) |
| Aperçu claude.ai | Copie de l'ancienne version, conservée comme référence visuelle (D6), pas mise à jour |

## Décisions en vigueur

D1 Drive seul, sans Cloud Console (option A retenue) · D2 dépôt privé, aucun déploiement, usage local **sans serveur** · D3 fixtures réservées à la démo · D4 dépendances locales figées, sans CDN · D6 aperçu claude.ai conservé comme référence, GitHub seule source du code.
