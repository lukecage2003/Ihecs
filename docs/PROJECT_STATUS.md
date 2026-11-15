# État du projet

**Étape en cours :** espace académique réel relié au dossier Google Drive (format v2) — **livré, en attente de ton essai**. Prochaine étape proposée : structure académique et ajout des matières.

## Espace réel relié à Drive — livré (0.4.0, branche `espace-reel-drive`)

| Élément | Statut | Emplacement |
|---|---|---|
| Choisir le dossier Drive, créer ou rouvrir l'espace | Fait, testé | `src/ui/views/settings.js`, `src/storage/real-workspace.js` |
| Espace réel vide, séparé de la démo (D3) | Fait, testé | `src/ui/workspace.js` |
| Progression v2 enregistrée dans le dossier, état d'enregistrement visible | Fait, testé | `appareils/<appareil>/etat.json` |
| Journal des révisions en ajout seul (correction C2) | Fait, testé | `appareils/<appareil>/revisions-AAAA-MM.jsonl` |
| Identifiants de fiche stables dans l'espace réel (correction C1) | Fait, testé | `src/domain/srs.js` |
| Écran d'accès quand Chrome redemande l'autorisation | Fait, testé (simulé) | `src/main.js` |
| Sauvegardes : refus de mélanger démo et espace réel | Fait, testé | `src/ui/views/settings.js` |
| Ajout de matières, cours, examens | **Pas encore** (prochaine étape) | — |
| Fusion de la progression de plusieurs ordinateurs | **Pas encore** | — |

## Prototype Drive et suppression du serveur — livré

| Élément | Statut | Emplacement |
|---|---|---|
| Application en un seul fichier ouvrable par double-clic (aucun serveur) | Fait, testé en `file://` | `IHECS-STUDY-OS.html`, `scripts/build.mjs` |
| Laboratoire Drive autonome (6 étapes, rapport JSON) | Fait, mécanique testée | `prototypes/drive/labo-drive.html` |
| Mesures réelles avec Google Drive pour ordinateur | **Partielles** (15 novembre) : `file://`, écriture et synchronisation dans les deux sens confirmées ; autorisation après redémarrage encore à mesurer ; modifications simultanées non mesurées par décision (conception « pire cas ») | `GOOGLE_DRIVE_INTEGRATION.md#résultats-des-mesures` |
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
| Stockage | Démo : `localStorage`. Espace réel : dossier Drive (C4 corrigé pour l'espace réel) |
| Aperçu claude.ai | Copie de l'ancienne version, conservée comme référence visuelle (D6), pas mise à jour |

## Décisions en vigueur

D1 Drive seul, sans Cloud Console (option A retenue) · D2 dépôt privé, aucun déploiement, usage local **sans serveur** · D3 fixtures réservées à la démo · D4 dépendances locales figées, sans CDN · D6 aperçu claude.ai conservé comme référence, GitHub seule source du code.
