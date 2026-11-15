# Audit du dépôt — IHECS STUDY OS

- **Date :** 15 novembre 2026
- **Commit audité :** `b9e7d7a` (branche `ccr-3a22c581-fdzalp`, seule branche du dépôt, aussi `HEAD` distant)
- **Portée :** audit uniquement. Aucune fonctionnalité n'a été modifiée.

## 1. Résumé

Le dépôt contient un **prototype fonctionnel** de site de révision construit en une seule session : une application statique monopage, en JavaScript sans dépendance, avec un contenu d'**exemple** (5 matières, 6 chapitres). Il n'y a ni Google Drive, ni authentification, ni tests versionnés, ni CI, ni `package.json`.

Le prototype est solide pour ce qu'il fait (27 vérifications fonctionnelles sur 27 passent, voir `BASELINE_TEST_RESULTS.md`). Il est en revanche **loin de la vision IHECS STUDY OS**. Il faut le faire évoluer par étapes plutôt que le jeter : son interface, sa navigation, son rendu Markdown et ses composants fiches, quiz et planning sont réutilisables.

## 2. Structure

```
index.html              1,3 Ko   point d'entrée unique
assets/css/style.css    34 Ko    594 lignes, design system (jetons clair et sombre)
assets/js/app.js        67 Ko    818 lignes, toute l'application (IIFE unique)
data/cours.js           43 Ko    572 lignes, contenu d'exemple (window.REVISION)
cours/README.md                  consignes pour déposer les fichiers bruts
README.md                        présentation et mode d'emploi
```

Absents : `.github/`, `package.json`, tests, configuration de lint, `.gitignore`, licence.

## 3. Pile technique

| Élément | Constat |
|---|---|
| Langage | JavaScript ES2020+ (fonctions fléchées, lookbehind dans une regex), sans module ni typage |
| Framework | Aucun : rendu par chaînes HTML et `innerHTML` |
| Build | Aucun ; s'ouvre directement ou via n'importe quel serveur statique |
| Dépendances | Aucune ; seulement la police Inter depuis Google Fonts (CSS) |
| Routage | Par hash (`#accueil`, `#m-<id>`, `#c-<m>-<c>-<onglet>`, `#blanc-<id>`…) |
| Stockage | `localStorage`, clé `revisions-ihecs-v1`, objet JSON unique |
| Contenu | Fichier JS statique versionné (`data/cours.js`) |
| Authentification | Aucune |
| Intégrations Google | Aucune (seulement Google Fonts) |

## 4. Points d'entrée et routes

`index.html` charge `data/cours.js` puis `assets/js/app.js`. Routes : tableau de bord, liste des matières, matière, chapitre (résumé, essentiel, fiches, quiz), examen blanc par matière, révision du jour, examens, planning, réglages. Un hash inconnu est traité comme une ancre puis redirigé vers l'accueil (pas de page 404 atteignable).

## 5. Modèle de données actuel

**Contenu** (`window.REVISION`, lecture seule) : `matieres[]` → `examen{}`, `fichiers[]`, `chapitres[]` → `resume` (Markdown), `pointsCles[]`, `definitions[]`, `fiches[] {q, r}`, `quiz[] {q, choix[], bonne, explication}`. Pas d'années académiques, de semestres, de concepts, d'objectifs ni de références de source (page, diapositive).

**État utilisateur** (`localStorage`) : `lu{}`, `quiz{ best, last, tries }`, `cartes{ box, due }`, `plan{}`, `journal{ date: n }`, `prenom`, `theme`, `focus.min`. Seul l'**état courant** est conservé : il n'y a **pas d'historique des révisions**.

## 6. Sécurité

| Risque | Gravité | Détail |
|---|---|---|
| Contenu de cours dans le dépôt | **Élevée (à venir)** | Une fois les vrais cours ajoutés à `data/cours.js` ou `cours/`, une publication GitHub Pages les rendrait publics, car un site Pages est public sauf sur GitHub Enterprise Cloud. Aujourd'hui le contenu n'est qu'un exemple. |
| Rendu via `innerHTML` | Moyenne | Les textes sont échappés (`esc`) et le Markdown maison n'autorise que les liens `http(s)`, `#` et `cours/`. C'est correct pour un contenu écrit à la main, insuffisant pour des documents importés non fiables : il faudra un nettoyage HTML éprouvé et une CSP. |
| Couleur insérée dans `style=""` | Faible | `m.couleur` est échappé en HTML mais pas validé comme couleur (injection CSS possible depuis un fichier de données malveillant). |
| Import de sauvegarde | Faible | La validation se limite à la présence de `cartes` ; un fichier forgé peut injecter des champs arbitraires dans l'état. |
| Secrets | Aucun | Aucun secret, jeton ou clé dans le dépôt ni dans l'historique (1 commit). |
| Aperçu publié hors dépôt | Info | Une copie du site a été publiée comme artefact claude.ai privé. Elle peut diverger du dépôt. |

## 7. Tests, CI, build, déploiement

Aucun test versionné, aucune CI, aucun build, aucun déploiement configuré. Les vérifications de cet audit ont été faites avec Playwright ; le script est conservé dans `docs/audit/scripts/baseline-smoke.js`. Il n'est pas encore branché sur une CI.

## 8. Historique Git

Un seul commit (`b9e7d7a`). L'arbre de travail était propre au début de l'audit. Le dépôt n'a pas de branche `main` : la branche de travail est la branche par défaut du dépôt distant.

## 9. Conclusion

| Catégorie | Verdict |
|---|---|
| À conserver | Design system, coquille de navigation, recherche, composants fiches et quiz, minuteur, rendu Markdown, export et import, comportement sans stockage |
| À refondre | Modèle de données (identifiants stables, historique), moteur de répétition (Leitner → FSRS), mesure de progression, découpage en modules |
| À créer | Google Drive, bibliothèque de documents, années et semestres, notes, Exam Center, Writing Studio, Oral Academy, Journalism Lab, analytique, tests et CI |

Le détail est dans `FEATURE_INVENTORY.md`, `TECHNICAL_DEBT.md` et `ARCHITECTURE_ASSESSMENT.md`.
