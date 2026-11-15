# Journal des modifications

## 0.3.0 — Sans serveur et prototype Drive (branche `prototype-drive-a`)

### Modifié
- **Plus de serveur local.** L'application est livrée en un seul fichier, `IHECS-STUDY-OS.html` (code, styles et police intégrés, CSP par empreinte), qui s'ouvre d'un double-clic. `scripts/serve.mjs` est supprimé.
- Les tests de bout en bout ouvrent ce fichier en `file://`.

### Ajouté
- `scripts/build.mjs` : assemblage déterministe des modules de `src/` ; vérifié par la CI (`npm run build:check`).
- `prototypes/drive/labo-drive.html` : laboratoire autonome pour mesurer, sur l'ordinateur de l'utilisateur, la conservation de l'autorisation, les délais de synchronisation et le comportement en cas de modifications simultanées.
- Tests du laboratoire (7 parcours) et de l'assemblage.

## 0.2.0 — Phase 1 : fondations (branche `phase-1-fondations`)

### Modifié
- Application découpée en modules ES (`src/`). Comportement identique : les 27 vérifications de référence de l'audit passent.
- Cours fictifs déplacés de `data/cours.js` vers `fixtures/demo/cours.js`, chargés uniquement dans l'espace « demo ». Bandeau « Mode démonstration » et badge « Démo ».
- Police Inter servie localement à la place de Google Fonts.
- Lancement via `npm run serve` (serveur local `127.0.0.1`).

### Ajouté
- Politique de sécurité du contenu (CSP) stricte ; aucune requête externe.
- Validation stricte des sauvegardes importées ; validation des couleurs.
- Vraie page « Page introuvable ».
- Onglets de chapitre accessibles (rôles ARIA, flèches, Début et Fin).
- Tests unitaires (`node --test`), tests de bout en bout (Playwright), CI GitHub Actions.
- Conception du modèle de données v2 et de la migration v1 → v2 avec preuves d'absence de perte (**non appliquée**).
- Étude d'intégration Google Drive sans Google Cloud Console.
- `.gitignore`, `package.json`, documentation (`docs/`).

### Données
- **Aucune migration appliquée.** La clé `revisions-ihecs-v1` et son format sont inchangés ; une progression existante est relue telle quelle (testé).

## 0.1.0 — Prototype initial
- Site de révision statique : tableau de bord, matières, chapitres, fiches, quiz, examens, planning, recherche.
