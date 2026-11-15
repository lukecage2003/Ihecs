# Architecture

Application web statique, sans framework, écrite en **modules ES** dans `src/`, et livrée sous forme d'**un seul fichier HTML autonome**, `IHECS-STUDY-OS.html`. Ce fichier s'ouvre d'un double-clic, **sans serveur** (décision du 15 novembre 2026).

## Arborescence

```
IHECS-STUDY-OS.html        FICHIER À OUVRIR : généré par scripts/build.mjs, versionné
index.html                 gabarit de développement (non ouvrable seul : modules ES)
assets/css/style.css       design system (jetons clair et sombre)
assets/fonts/              police Inter locale (OFL-1.1)
src/
  main.js                  démarrage, routeur, raccourcis globaux
  core/                    pur, sans DOM : dates, html (échappement, couleurs), markdown, icônes
  domain/                  pur, sans DOM : srs (Leitner), progress, planner, activity, search, router
  state/store.js           état v1 : lecture, écriture, validation et encodage des sauvegardes
  content/workspaces.js    espaces de travail (démo seulement pour l'instant, D3)
  data/v2/                 CONCEPTION v2 (schéma, migration) — non importée par l'application
  ui/                      navigateur : contexte (app.js), dom, widgets, shell, thème
    components/            fiches, quiz, minuteur, recherche
    views/                 accueil, matières, chapitre, révision, examens, planning, réglages
fixtures/demo/cours.js     cours fictifs (démonstration et tests)
scripts/                   build.mjs (assemblage en un fichier), check-syntax.mjs
prototypes/drive/          laboratoire Google Drive (fichier autonome)
tests/unit/                node --test (logique pure, stockage, migration, assemblage)
tests/e2e/                 Playwright (parcours réels, bureau et mobile)
tests/fixtures/v1/         états v1 servant aux tests de migration
.github/workflows/ci.yml   CI : syntaxe, tests unitaires, tests de bout en bout
```

## Règles de dépendance

- `core` ne dépend de rien. `domain` dépend de `core`. `state` ne dépend de rien.
- `ui` dépend de `core`, `domain` et `state`. Seuls `ui` et `main.js` touchent le DOM.
- Les fonctions de `domain` reçoivent « aujourd'hui » en paramètre : aucune n'appelle `new Date()` pour décider.
- `data/v2` n'est importé que par les tests tant que la migration n'est pas approuvée.

## Sécurité

- CSP du fichier autonome : `default-src 'none'`, seul le script intégré est autorisé (identifié par son empreinte SHA-256), polices intégrées, `connect-src 'none'` : l'application ne peut contacter aucun site. Les styles en ligne restent autorisés (couleurs et largeurs calculées).
- Tout texte est échappé. Le Markdown n'autorise que les liens `http(s)`, `#` et `cours/`. Les couleurs sont validées (hexadécimal uniquement).
- L'assemblage refuse toute syntaxe d'import ou d'export qu'il ne sait pas transformer, plutôt que de produire un fichier faux. La CI vérifie que le fichier versionné correspond exactement aux sources.
- Aucune dépendance d'exécution. Une seule dépendance de développement : `@playwright/test` 1.63.0 (Apache-2.0), figée par `package-lock.json`.

## Assemblage

`npm run build` parcourt les imports depuis `src/main.js`, place chaque module dans sa propre fonction (aucune collision de noms), les ordonne selon leurs dépendances, intègre la feuille de style et la police (data: URI), puis calcule la CSP. Le résultat est déterministe.

## Stockage en `file://`

Dans Chrome, toutes les pages ouvertes depuis le disque partagent la même origine `file://`, donc le même `localStorage`. La progression reste sur cet ordinateur et dans ce navigateur. Une progression enregistrée dans l'aperçu claude.ai ne s'y retrouve pas : c'est une autre origine.
