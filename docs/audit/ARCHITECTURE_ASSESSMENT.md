# Évaluation d'architecture et faisabilité Google Drive

Les affirmations sur Google et GitHub sont marquées **[vérifié]** quand elles ont été relues dans la documentation officielle pendant cet audit (15 novembre 2026), et **[à vérifier]** quand elles viennent de connaissances antérieures non reconfirmées.

## 1. Contraintes structurantes

1. **Pas de serveur.** GitHub Pages ne sert que des fichiers statiques. Tout le code s'exécute dans le navigateur, et seulement quand une page est ouverte.
2. **Un site Pages est public.** Seules les organisations sur GitHub Enterprise Cloud peuvent publier un site Pages en privé **[vérifié]**. Publier Pages depuis un dépôt privé exige un forfait payant (Pro, Team ou Enterprise) **[à vérifier]**. Conséquence : **aucune donnée personnelle ne doit faire partie du site publié**. Le site ne contient que le code, et les données arrivent de Drive après connexion.
3. **Google Drive est le stockage principal**, accédé directement depuis le navigateur.

## 2. Faisabilité Google Drive dans une application uniquement navigateur

### 2.1 Authentification

| Point | Constat |
|---|---|
| Flux | Google Identity Services, *token model* : il est « basé sur le flux OAuth 2.0 *implicit grant* » et renvoie un **jeton d'accès** directement au navigateur **[vérifié]** |
| Durée du jeton | « Par conception, les jetons d'accès ont une durée de vie courte » **[vérifié]**, en pratique environ 1 heure (`expires_in`) **[à vérifier]** |
| Jeton de rafraîchissement | Aucun flux de rafraîchissement n'est décrit pour le navigateur ; on obtient un nouveau jeton en rappelant `requestAccessToken()`, idéalement depuis un clic **[vérifié]**. Un jeton de rafraîchissement exigerait un secret client côté serveur : **impossible ici, et c'est voulu** |
| Renouvellement | Le consentement n'est demandé qu'une fois par scope ; ensuite le renouvellement est rapide (au plus un clic) **[vérifié]** |
| Révocation | `google.accounts.oauth2.revoke()` retire le consentement pour tous les scopes **[vérifié]** : c'est le bouton « Déconnecter Google » |
| Identifiant client | L'*OAuth Client ID* est **public par nature** (il apparaît dans le code du navigateur) et se protège en limitant les origines JavaScript autorisées. Ce n'est pas un secret. **Aucun secret client n'est nécessaire ni utilisé** |
| Prérequis | Créer cet identifiant demande un **projet dans Google Cloud Console**. C'est de la configuration d'identifiants, pas de l'hébergement, mais le prompt n'autorise pas explicitement Google Cloud : **décision à valider** |
| Mode « Test » OAuth | Une application à usage personnel peut rester en mode test avec l'utilisateur déclaré comme testeur, sans vérification Google, avec les scopes non sensibles **[à vérifier]** |

**Stockage du jeton** : en mémoire seulement, jamais dans `localStorage` ni dans IndexedDB, et jamais versionné. Fermer l'onglet le fait disparaître ; une reconnexion silencieuse est tentée au chargement.

### 2.2 Scopes (moindre privilège)

| Scope | Classification | Usage proposé |
|---|---|---|
| `drive.file` | Non sensible **[vérifié]** | **Retenu.** Accès uniquement aux fichiers que l'application a créés ou que l'utilisateur lui a ouverts ou partagés **[vérifié]** |
| `drive.appdata` | Non sensible **[vérifié]** | Possible pour des réglages cachés, mais invisible dans Drive. **Écarté** pour les données principales, que l'utilisateur doit pouvoir voir et sauvegarder |
| `drive.readonly`, `drive` | **Restreint** **[vérifié]** | **Écartés** : accès à tout le Drive, ce qui est contraire au principe « pas d'accès au reste du Drive » |

Avec `drive.file`, l'application **ne voit pas** le reste du Drive. Les cours déjà présents doivent être **choisis par l'utilisateur** avec le **Google Picker**, qui fonctionne en JavaScript dans le navigateur avec un jeton OAuth **[vérifié]**. Le Picker web exige aussi une clé API (publique, à restreindre par origine) et `setAppId` pour que les fichiers choisis deviennent accessibles avec `drive.file` **[à vérifier]**. Si l'utilisateur choisit un **dossier**, l'accès aux fichiers qu'il contient n'est pas garanti **[à vérifier]** : à prototyper avant de promettre l'import d'un dossier entier.

### 2.3 Synchronisation bidirectionnelle

| Capacité | Faisable ? | Méthode |
|---|---|---|
| Détecter les changements Drive | **Oui, à la demande** | `changes.getStartPageToken` puis `changes.list` avec le jeton de page enregistré, changements du plus ancien au plus récent **[vérifié]** |
| Notifications poussées | **Non** | `changes.watch` exige une URL de réception en HTTPS avec un certificat valide, donc un serveur **[vérifié]** |
| Synchroniser navigateur fermé | **Non** | Pas de serveur, et pas de jeton valide hors session. Synchronisation à l'ouverture, au retour sur l'onglet, à intervalle régulier pendant l'utilisation, et sur demande |
| Écrire vers Drive | Oui | `files.create` et `files.update` sur les fichiers de l'application |
| Hors connexion | Partiel | File d'attente des opérations dans IndexedDB, rejouée au retour du réseau ; identifiant d'opération pour éviter les doublons |
| Détection de conflit | Oui | Enregistrer le numéro `version` (ou `headRevisionId`) de chaque fichier à la dernière synchronisation. Avant d'écrire, relire la métadonnée : si elle a changé des deux côtés, c'est un conflit **[à vérifier : sémantique exacte du champ `version`]** |
| Écriture conditionnelle atomique | **Non garantie** | Pas d'en-tête de type `If-Match` documenté pour le contenu Drive v3 **[à vérifier]**. Il reste une fenêtre de course entre la relecture et l'écriture, acceptable pour un seul utilisateur avec peu d'appareils, et compensée par les révisions Drive et des sauvegardes |
| Résolution | Oui | Garder les deux versions (copie « conflit »), montrer la différence, laisser choisir, journaliser la décision |
| Documents originaux | Protégés | L'application n'écrit **jamais** dans un document importé. Les annotations et les ressources générées sont des fichiers séparés qui pointent vers l'original par son identifiant Drive |

### 2.4 Format des données dans Drive

```
IHECS STUDY OS/
  10 — Application Data/
    manifest.json                schéma, version, liste des fichiers et de leurs sommes de contrôle
    academic.json                années, semestres, matières, chapitres, objectifs
    content/<matiere>.json       résumés, concepts, définitions, exercices (identifiants stables)
    reviews/<AAAA-MM>.jsonl      journal des révisions en ajout seul, un fichier par mois
    attempts/<AAAA-MM>.jsonl     tentatives d'examen et de quiz
    plans.json, notes/…          plans, notes de l'utilisateur
  11 — Backups/                  instantanés datés (rotation)
```

Chaque enregistrement porte `id` (UUID), `createdAt`, `updatedAt` et `schemaVersion`. Les journaux en ajout seul limitent les conflits : deux appareils qui ajoutent des révisions ne se contredisent pas, on fusionne par identifiant. Un index et le cache vivent dans IndexedDB et **se reconstruisent toujours depuis Drive** : ce cache n'est jamais une seconde source de vérité. Les migrations sont versionnées, non destructives, et précédées d'une sauvegarde automatique.

### 2.5 Lecture des documents dans le navigateur

| Format | Solution sans serveur | Remarque |
|---|---|---|
| PDF | pdf.js | Aperçu et extraction du texte avec numéro de page ; les PDF scannés n'ont pas de texte |
| DOCX | mammoth.js | Texte et structure |
| PPTX | JSZip et lecture du XML des diapositives | Texte par diapositive ; mise en page approximative |
| TXT, Markdown | natif | |
| Images | natif | OCR possible en local avec tesseract.js, lourd mais gratuit et privé : optionnel |
| Audio | stockage et lecture seulement | Transcription locale très lourde dans le navigateur : reportée et optionnelle |

Chaque import affiche un statut réel : *analysé*, *partiellement lu*, *non pris en charge*, *chiffré* ou *erreur*.

## 3. Architecture proposée

**Garder** l'approche actuelle (statique, sans framework) et la **structurer**, plutôt que réécrire avec un framework :

- **Modules ES natifs**, sans bundler, découpés par domaine : `academic/`, `documents/`, `drive/`, `sync/`, `knowledge/`, `exercises/`, `srs/`, `exams/`, `writing/`, `oral/`, `journalism/`, `planner/`, `analytics/`, `ai/`, `ui/`. Coût de ce choix : il faut servir le site en HTTP, l'ouverture directe du fichier ne marchera plus.
- **Logique métier en fonctions pures**, testables avec `node --test` (intégré à Node, aucune dépendance) ; types JSDoc.
- **Couche de stockage abstraite** : `Repository` → `DriveStore` (source de vérité) et `LocalCache` (IndexedDB), avec une file d'attente de synchronisation.
- **Bibliothèques tierces** chargées depuis un CDN avec version figée ou copiées dans le dépôt, uniquement quand elles font un travail réel : pdf.js, mammoth, JSZip, DOMPurify, ts-fsrs (FSRS, licence MIT) **[à vérifier : versions et licences]**.
- **Sécurité** : politique CSP en balise `meta`, DOMPurify pour tout contenu importé, couleurs validées, aucune analytique tierce.
- **CI** : GitHub Actions pour la vérification de syntaxe, les tests unitaires et Playwright. Aucun déploiement automatique sans accord.

## 4. Compatibilité des modules avec les contraintes

Voir `../PRODUCT/FEATURE_COVERAGE_MATRIX.md`. En résumé :

| Classe | Exemples |
|---|---|
| Pleinement compatible (navigateur et Pages) | Structure académique, fiches, FSRS, quiz, Exam Center, Writing Studio, Journalism Lab avec scénarios prédéfinis, planning, analytique, export |
| Compatible avec les API Google autorisées | Connexion, stockage Drive, import via Picker, synchronisation à la demande, sauvegardes |
| Limité par l'absence de serveur | Synchronisation navigateur fermé, notifications poussées, rappels quand le site est fermé, OCR et transcription lourds |
| Impossible sans infrastructure en plus | Appels IA sécurisés (une clé API ne doit pas être dans le navigateur), webhooks Drive, tâches planifiées côté serveur |
| À vérifier | Accès aux fichiers d'un dossier choisi dans le Picker ; écriture conditionnelle Drive ; Pages sur dépôt privé selon le forfait |

## 5. IA (optionnelle, désactivée)

La documentation Gemini demande de ne **pas** intégrer de clé API dans une application web ou mobile, et de passer par un serveur **[vérifié]**. Elle ne dit pas qu'un abonnement **Google AI Pro** donne accès à l'API développeur : on doit considérer que non tant que ce n'est pas démontré **[à vérifier]**. Comme un serveur est exclu, il n'y aura **pas d'appel IA automatique**. On prépare une interface de fournisseur documentée et désactivée. Seule option à étudier plus tard : une clé fournie par l'utilisateur, en mémoire seulement, après avertissement explicite, mais elle va à l'encontre de la recommandation de Google.

## 6. Sources

- [Google Identity Services : modèle par jeton](https://developers.google.com/identity/oauth2/web/guides/use-token-model)
- [Scopes de l'API Drive](https://developers.google.com/workspace/drive/api/guides/api-specific-auth)
- [Suivre les changements Drive](https://developers.google.com/workspace/drive/api/guides/manage-changes)
- [Notifications Drive (push)](https://developers.google.com/workspace/drive/api/guides/push)
- [Google Picker : vue d'ensemble](https://developers.google.com/workspace/drive/picker/guides/overview)
- [Visibilité des sites GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site)
- [Clés API Gemini](https://aistudio.google.com/docs/api-key)

## 7. Feuille de route proposée

L'ordre du prompt est conservé, avec **une modification** : les fondations de données (identifiants stables, journal des révisions, schéma versionné) passent **avant** Google Drive. On ne synchronise pas proprement un format qui va encore changer, et C1 et C2 corrompent l'historique à chaque nouvelle donnée accumulée.

| Étape | Contenu | Dépend de | Complexité |
|---|---|---|---|
| 1 | Fondations : découpage en modules ES, tests (`node --test` et Playwright), CI GitHub Actions, CSP, DOMPurify, `.gitignore`, corrections m1 à m3 | — | M |
| 2 | Modèle de données v2 : années, semestres et objectifs ; identifiants stables ; journal des révisions ; schéma versionné et migration depuis le `localStorage` actuel sans perte | 1 | L |
| 3 | Google Drive : connexion et déconnexion, dossier de l'application, lecture et écriture, IndexedDB et file d'attente, synchronisation et conflits, sauvegardes | 2 + décisions D1 et D2 | XL |
| 4 | Bibliothèque : Picker, pdf.js, DOCX et PPTX, statuts d'import, doublons, aperçu | 3 | L |
| 5 | Connaissances et notes avec références de source | 4 | L |
| 6 | Study Lab : nouveaux formats d'exercices et éditeur | 2 | L |
| 7 | Répétition : FSRS, files du jour, à venir et en retard, correction d'une révision | 2 | M |
| 8 | Exam Center | 6, 7 | L |
| 9 | Writing Studio et Oral Academy | 3 | L |
| 10 | Journalism Lab, avec scénarios prédéfinis | 6 | L |
| 11 | Planificateur et analytique | 7, 8 | L |
| 12 | Content Studio | 5 | M |
| 13 | Finition du design et de l'accessibilité | continu | M |
| 14 | Interface IA désactivée | — | S |
| 15 | Assurance qualité complète et documentation de fin de projet (PROJECT_STATUS, DATA_MODEL…) | continu | M |

Les étapes 6 et 7 peuvent avancer en parallèle de 3 et 4, car elles ne dépendent que du modèle v2.

## 8. Décisions en attente

| # | Décision | Options |
|---|---|---|
| D1 | **Projet Google Cloud Console** pour créer l'identifiant OAuth (configuration d'identifiants, pas d'hébergement) | L'autoriser (indispensable pour Drive) ou renoncer à Drive |
| D2 | **Hébergement** | (a) Pages sur dépôt **public** : le code seul est public, les données restent dans Drive, gratuit · (b) Pages sur dépôt privé : forfait payant, et le site reste public · (c) Pas de Pages : site lancé en local |
| D3 | Contenu d'exemple de `data/cours.js` | Le garder comme démo hors connexion, ou le retirer quand Drive est en place |
| D4 | Bibliothèques tierces (pdf.js, mammoth, JSZip, DOMPurify, ts-fsrs) | Les charger depuis un CDN avec version figée, ou les copier dans le dépôt |
| D5 | Langue de l'interface et de la documentation | Français (actuel) recommandé |
| D6 | Aperçu claude.ai hors dépôt | Le garder synchronisé ou le supprimer |

## 9. Risques

- **Fenêtre de course à l'écriture** sur Drive (§2.3) : faible pour un seul utilisateur, mais réelle. On la compense par les révisions Drive et des sauvegardes.
- **Renouvellement du jeton** : environ toutes les heures, avec parfois un clic à faire. C'est une gêne d'usage, pas un risque de sécurité.
- **Accès aux dossiers via le Picker** non confirmé : l'import en masse pourrait devoir se faire fichier par fichier.
- **Poids des bibliothèques** (pdf.js, tesseract.js) sur mobile : à charger seulement quand on en a besoin.
- **Périmètre** : la vision complète est très large. Il faut viser l'usage quotidien d'abord (étapes 1 à 4 et 7) avant les laboratoires spécialisés.
