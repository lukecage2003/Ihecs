# Architecture

Application web statique, sans framework ni étape de build, en **modules ES natifs**. Elle tourne en local (D2) via un petit serveur Node sans dépendance.

## Arborescence

```
index.html                 point d'entrée (CSP stricte, module src/main.js)
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
scripts/                   serve.mjs (serveur local), check-syntax.mjs
tests/unit/                node --test (logique pure, stockage, migration, serveur)
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

- CSP : `default-src 'none'`, scripts et polices locaux uniquement, aucune requête externe (`connect-src 'self'`). Les styles en ligne restent autorisés, car le rendu s'en sert pour les couleurs et les largeurs calculées.
- Tout texte est échappé. Le Markdown n'autorise que les liens `http(s)`, `#` et `cours/`. Les couleurs sont validées (hexadécimal uniquement).
- Le serveur local écoute seulement sur `127.0.0.1` et ne sert que `index.html`, `assets/`, `src/` et `fixtures/`. Il refuse `.git`, `package.json`, `node_modules`, `tests` et les traversées de chemin.
- Aucune dépendance d'exécution. Une seule dépendance de développement : `@playwright/test` 1.63.0 (Apache-2.0), figée par `package-lock.json`.

## Lancer

```
npm install          # une fois (outil de test uniquement)
npm run serve        # http://127.0.0.1:8080/
```

Ouvrir `index.html` directement depuis le disque ne fonctionne plus : les navigateurs bloquent les modules ES en `file://`.
