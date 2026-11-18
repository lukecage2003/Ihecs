# Journal des modifications

## 0.8.0 — Sur téléphone

### Ajouté
- Sur téléphone (ou navigateur sans accès aux dossiers) : **Ouvrir mes cours (structure.json)** dans les Réglages. Le fichier se choisit depuis Google Drive dans le sélecteur de fichiers.
- Espace « Copie » : cours en lecture seule, progression gardée sur l'appareil sous une clé propre (jamais mélangée à la démonstration, D3), bandeau avec la date de la copie, bouton « Mettre à jour la copie ».
- Un fichier de cours ou un JSON invalide est refusé sans rien changer.
- La sauvegarde de progression passe entre la copie et l'espace réel (mêmes cours), jamais vers ou depuis la démonstration.
- Tests : 3 parcours (× 2 appareils).

## 0.7.0 — Modifier dans le site

### Ajouté
- Page d'une matière : bouton **Modifier** sur la carte Examen (date et heure, type, durée, pondération, lieu, consignes, crédits, quadrimestre).
- Enregistrement dans `structure.json` après une copie dans `sauvegardes/`, et seulement si le fichier n'a pas changé entre-temps.
- Seuls les champs réellement changés sont mémorisés (`userEdits`) : ils restent prioritaires lors des réimports, les autres peuvent encore être mis à jour par un fichier de cours.
- Tests : 1 unitaire et 1 parcours (× 2 appareils).

## 0.6.0 — Import plus simple

### Ajouté
- Import de **plusieurs fichiers de cours à la fois**, réunis dans un seul aperçu (doublons : la version la plus récente est gardée et signalée).
- Mise à jour automatique : une matière dont le contenu a changé est pré-cochée « Mettre à jour » ; une matière identique est marquée « Déjà à jour ».
- Les informations modifiées dans le site (`userEdits`) sont conservées lors d'une mise à jour.
- Chaque fichier importé est archivé dans `imports/`.
- Tests : 3 unitaires et 1 parcours (× 2 appareils).

## 0.5.1 — Examens sans date

### Ajouté
- Page **Examens** : section « Date à confirmer » pour les matières dont l'examen est décrit (type, durée, crédits, consignes) mais pas encore daté.
- Test de parcours correspondant (× 2 appareils).

## 0.5.0 — Import des cours (branche `import-cours`)

### Ajouté
- **Importer mes cours** (`#importer`) : choix d'un fichier de cours, aperçu (nouvelles, à remplacer, ignorées, erreurs), puis import.
- Sécurités : matière existante ignorée sauf remplacement explicite ; fichier archivé dans `imports/` ; structure précédente copiée dans `sauvegardes/` ; écriture seulement si `structure.json` n'a pas changé depuis l'aperçu.
- Format documenté : `docs/COURSE_PACK.md` ; exemple fictif : `fixtures/packs/exemple-cours.json`.
- Documents d'une matière ouverts depuis le dossier Drive (fichier manquant signalé).
- Bouton « Importer mes cours » sur l'accueil d'un espace vide et dans les Réglages.
- Tests : 8 unitaires (validation, plan d'import) et 7 parcours (× 2 appareils).

## 0.4.1 — Site en ligne (GitHub Pages)

- Décision D2 révisée : dépôt public, site publié sur https://lukecage2003.github.io/Ihecs/.
- `.github/workflows/pages.yml` publie uniquement le fichier autonome, après vérification qu'il est à jour.
- Vérification avant publication : aucun e-mail, nom, identifiant personnel ni secret dans l'historique. L'identifiant d'appareil repris d'un rapport a été remplacé par un identifiant fictif dans les tests.

## 0.4.0 — Espace académique réel dans Google Drive (branche `espace-reel-drive`)

### Ajouté
- **Mon espace académique** (Réglages) : choisir le dossier synchronisé par Google Drive pour ordinateur, y créer l'espace (vide) ou rouvrir un espace existant. Bascule démo ↔ espace réel ; « Oublier ce dossier » sans rien supprimer.
- Format v2 en service pour l'espace réel : manifeste, structure, état par ordinateur, journal des révisions en ajout seul.
- Écran « Ouvrir ton espace académique » quand Chrome redemande l'accord ; état « Enregistré dans Drive à … » ou « Échec de l'enregistrement » avec Réessayer.
- Identifiants de fiche stables (espace réel).
- Tests : 8 unitaires (format v2) et 9 parcours (espace réel), en bureau et mobile.

### Modifié
- Les codes de sauvegarde portent l'espace d'origine ; une sauvegarde de la démo est refusée dans l'espace réel, et inversement.

### Données
- Démonstration : inchangée (v1, `localStorage`). Aucune migration appliquée.

## 0.3.1 — Premiers résultats réels du laboratoire Drive

- Résultats du 15 novembre (Windows, Chrome 157) consignés dans `docs/GOOGLE_DRIVE_INTEGRATION.md` : `file://` et synchronisation dans les deux sens confirmés.
- Laboratoire version 2 : l'analyse des modifications simultanées indique l'étape manquante au lieu de « Résultat inattendu » ; consigne explicite pour l'expérience de redémarrage ; `laboVersion` dans le rapport.

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
