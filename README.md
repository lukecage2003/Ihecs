# IHECS STUDY OS

Environnement personnel d'étude pour l'IHECS : tableau de bord, matières, résumés, fiches à répétition espacée, quiz, examens blancs, examens et planning.

> **État :** phase 1 (fondations) terminée. L'application tourne **en local** avec des **cours fictifs** de démonstration. Ton espace académique réel et Google Drive arriveront dans les phases suivantes, après validation. Voir [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md).

## Lancer l'application

Prérequis : Node.js 20 ou plus récent.

```
npm install        # une seule fois (installe l'outil de test)
npm run serve      # puis ouvrir http://127.0.0.1:8080/
```

L'application ne contacte aucun site extérieur et n'est publiée nulle part.

## Tester

```
npm run check      # syntaxe
npm test           # tests unitaires
npm run test:e2e   # parcours dans le navigateur (Chromium)
```

Détails dans [`docs/TESTING.md`](docs/TESTING.md).

## Documentation

| Document | Contenu |
|---|---|
| [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) | Où en est le projet, limites connues |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Structure du code, règles, sécurité |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | Format v1 actuel, conception v2 et règles de migration |
| [`docs/GOOGLE_DRIVE_INTEGRATION.md`](docs/GOOGLE_DRIVE_INTEGRATION.md) | Options Google Drive sans Google Cloud Console |
| [`docs/TESTING.md`](docs/TESTING.md) | Tests et CI |
| [`docs/audit/`](docs/audit/) | Audit initial du dépôt |
| [`docs/PRODUCT/`](docs/PRODUCT/) | Vision produit et matrice de couverture |
| [`CHANGELOG.md`](CHANGELOG.md) | Historique des versions |

## Confidentialité

Le dépôt est privé. Aucun cours réel, document ou identifiant ne doit y être versionné : les données personnelles vivront dans Google Drive (voir l'étude Drive).
