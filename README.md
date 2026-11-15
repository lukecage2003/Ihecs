# IHECS STUDY OS

Environnement personnel d'étude pour l'IHECS : tableau de bord, matières, résumés, fiches à répétition espacée, quiz, examens blancs, examens et planning.

> **État :** phase 1 terminée ; prototype Google Drive (option A) prêt à être essayé. L'application fonctionne avec des **cours fictifs** de démonstration. Voir [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md).

## Ouvrir l'application

**En ligne : https://lukecage2003.github.io/Ihecs/**, dans Chrome ou Edge sur ordinateur.

Le site publié ne contient que le code et des cours **fictifs** de démonstration. Ton espace académique (cours, progression) reste dans ton dossier Google Drive : le navigateur le lit directement sur ton ordinateur, il ne passe jamais par GitHub.

Hors ligne, tu peux aussi télécharger [`IHECS-STUDY-OS.html`](IHECS-STUDY-OS.html) et l'ouvrir d'un double-clic : c'est le même fichier.

## Laboratoire Google Drive

[`prototypes/drive/labo-drive.html`](prototypes/drive/labo-drive.html) : à ouvrir lui aussi d'un double-clic. Mode d'emploi dans [`docs/GOOGLE_DRIVE_INTEGRATION.md`](docs/GOOGLE_DRIVE_INTEGRATION.md#prototype).

## Développer et tester

Le code source est découpé en modules dans `src/`. Node.js (20 ou plus) sert uniquement à assembler et tester :

```
npm install          # une fois (outil de test)
npm run build        # régénère IHECS-STUDY-OS.html à partir de src/
npm run test:all     # syntaxe, tests unitaires, fichier à jour, parcours navigateur
```

Détails dans [`docs/TESTING.md`](docs/TESTING.md).

## Documentation

| Document | Contenu |
|---|---|
| [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) | Où en est le projet, limites connues |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Structure du code, règles, sécurité |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | Format v1 actuel, conception v2 et règles de migration |
| [`docs/GOOGLE_DRIVE_INTEGRATION.md`](docs/GOOGLE_DRIVE_INTEGRATION.md) | Options Google Drive sans Google Cloud Console |
| [`docs/COURSE_PACK.md`](docs/COURSE_PACK.md) | Format des fichiers de cours à importer |
| [`docs/TESTING.md`](docs/TESTING.md) | Tests et CI |
| [`docs/audit/`](docs/audit/) | Audit initial du dépôt |
| [`docs/PRODUCT/`](docs/PRODUCT/) | Vision produit et matrice de couverture |
| [`CHANGELOG.md`](CHANGELOG.md) | Historique des versions |

## Confidentialité

Le dépôt est privé. Aucun cours réel, document ou identifiant ne doit y être versionné : les données personnelles vivront dans Google Drive (voir l'étude Drive).
