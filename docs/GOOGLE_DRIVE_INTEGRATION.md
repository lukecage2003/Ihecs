# Google Drive sans Google Cloud Console — étude de faisabilité

**Statut : option A retenue (15 novembre 2026). Prototype prêt à être essayé (voir [Prototype](#prototype)). Aucune intégration dans l'application tant que les mesures ne sont pas faites.**

## Contraintes fixées

- Google Drive est le seul service externe autorisé.
- **Aucun** projet Google Cloud, **aucun** identifiant OAuth créé à la main, **aucune** API Google Cloud activée.
- Dépôt privé, aucun déploiement public, développement en local (D2).

## Conséquence directe

Une application web qui appelle elle-même l'API Drive a besoin d'un **identifiant client OAuth**, et cet identifiant se crée dans Google Cloud Console. **L'accès direct à l'API Drive depuis l'application est donc exclu.** Emprunter l'identifiant d'une autre application, passer par une API non officielle ou réutiliser des cookies de session serait non conforme et dangereux : ces pistes sont écartées.

Il reste trois voies officielles.

## Option A — Google Drive pour ordinateur + dossier local (recommandée)

**Principe.** L'application Google officielle *Google Drive pour ordinateur* (Windows et macOS) synchronise dans les deux sens un dossier de l'ordinateur avec Drive. IHECS STUDY OS, servi en local, lit et écrit dans ce dossier avec l'API *File System Access* du navigateur (`showDirectoryPicker`). L'application ne parle jamais à Google : c'est le client Google qui synchronise.

| Critère | Évaluation |
|---|---|
| Google Cloud Console | **Aucune démarche** |
| Identifiants dans l'application | **Aucun** (ni jeton, ni clé, ni secret) |
| Permissions | L'utilisateur choisit un seul dossier ; l'application ne voit rien d'autre du Drive |
| Synchronisation bidirectionnelle | Oui, assurée par le client Google, y compris quand l'application est fermée |
| Navigateurs | Chromium sur ordinateur (Chrome, Edge). L'API est marquée « disponibilité limitée » par MDN et non disponible dans Firefox et Safari **[à vérifier sur le tableau MDN]** |
| Contexte sécurisé | Exigé (HTTPS) **[vérifié, MDN]**. Un fichier ouvert depuis le disque (`file://`) est un contexte sécurisé dans Chromium (vérifié par les tests), mais la mémorisation du dossier dans ce cas reste à confirmer sur ton ordinateur. Un geste de l'utilisateur est requis pour ouvrir le sélecteur **[vérifié, MDN]** |
| Permission persistante | Selon la version de Chrome, il faut peut-être réautoriser le dossier à chaque session **[à vérifier]** |
| Téléphone | Non : pas de client Drive « dossier » ni de File System Access sur mobile. Cohérent avec D2 (usage local) |
| Conflits | Deux appareils modifiant le même fichier peuvent produire des copies de conflit côté Drive **[à vérifier : comportement exact du client]**. Mitigation par conception, voir plus bas |
| Documents originaux | Les PDF déposés dans Drive (y compris depuis le téléphone) arrivent dans le dossier et l'application peut les lire en lecture seule |

**Conception pour éviter les conflits avec cette option :**
- **un fichier par appareil** pour tout ce qui s'ajoute (journal des révisions, tentatives) : `reviews/<appareil>/<AAAA-MM>.jsonl`. Deux appareils n'écrivent jamais dans le même fichier ;
- pour les fichiers partagés (structure académique, notes), on compare une empreinte (SHA-256) et la date de modification avant d'écrire. Si le fichier a changé depuis la dernière lecture, c'est un conflit : on garde les deux versions et l'utilisateur choisit ;
- écriture atomique : on écrit dans un fichier temporaire, puis on le renomme ;
- les copies de conflit créées par le client Drive sont détectées et présentées, jamais supprimées.

## Option B — Google Apps Script (à autoriser séparément)

**Principe.** Un projet Apps Script reçoit automatiquement un projet Cloud « par défaut » qui « fonctionne en arrière-plan » : on n'ouvre jamais la console **[vérifié]**. Un script déployé en *application web* « exécutée en tant que moi » accède à Drive avec le compte de l'utilisateur **[vérifié]**, avec un accès limité au seul propriétaire **[à vérifier : option « Moi uniquement »]**.

| Critère | Évaluation |
|---|---|
| Google Cloud Console | Aucune démarche (projet par défaut automatique) |
| Service supplémentaire | **Oui : Apps Script est un service Google distinct de Drive**, non autorisé par D1 en l'état |
| Hébergement | L'interface serait servie par `script.google.com` (privée) : c'est un hébergement Google, à confronter avec D2 |
| Code | Une partie du code vivrait dans Apps Script ; GitHub ne serait plus la seule source |
| Limites | Pas de sélecteur de fichiers Google (« file-open dialog » impossible avec un projet par défaut **[vérifié]**) ; quotas et durée d'exécution d'Apps Script |
| Avantage | Utilisable sur téléphone, sans rien installer |

**Option non retenue sans nouvelle autorisation de ta part.**

## Option C — Échange manuel de fichiers (toujours possible)

L'application exporte ou importe un fichier de sauvegarde que tu ranges toi-même dans Drive (application Drive, site web). C'est fiable et sans configuration, mais il n'y a **pas de synchronisation** : c'est un complément (sauvegarde, transfert ponctuel), pas une solution principale.

## Recommandation

1. **Option A** comme stockage principal : elle respecte D1 et D2 sans exception, n'utilise aucun identifiant et garde Drive comme source de vérité.
2. **Option C** en filet de sécurité (exports datés).
3. Option B seulement si tu autorises plus tard Apps Script et l'accès depuis le téléphone.

**Points à vérifier par un prototype avant toute implémentation :**
- conservation de l'autorisation sur le dossier entre deux sessions de Chrome ;
- comportement du client Drive en cas d'écritures concurrentes ;
- délai de synchronisation observé.

## Prototype

Fichier : [`prototypes/drive/labo-drive.html`](../prototypes/drive/labo-drive.html). Il est autonome, s'ouvre **d'un double-clic** (aucun serveur), ne fait aucune requête réseau et n'écrit que dans `<dossier choisi>/_labo-ihecs`. Il ne supprime jamais rien.

### Ce qu'il te faut

- Un ordinateur Windows ou macOS avec **Google Chrome** (ou Edge).
- **Google Drive pour ordinateur** installé et connecté à ton compte.
- Le fichier `labo-drive.html`, téléchargé depuis GitHub (bouton « Download raw file »).

### Les expériences

| # | Question | Comment |
|---|---|---|
| 0 | Le navigateur est-il compatible ? | Diagnostic automatique à l'ouverture (contexte sécurisé, sélecteur de dossier, IndexedDB) |
| 1 | — | Choisir un dossier vide `IHECS STUDY OS` dans « Mon Drive » sur l'ordinateur |
| 2 | **L'autorisation survit-elle au redémarrage de Chrome ?** | Fermer complètement Chrome, rouvrir le fichier : le résultat s'enregistre seul |
| 3 | Délai ordinateur → Drive | Écrire un fichier, cliquer quand il apparaît sur drive.google.com |
| 4 | Délai Drive → ordinateur | Ajouter un fichier depuis le web ou le téléphone ; détection automatique toutes les 2 s |
| 5 | **Que fait Drive en cas de modifications simultanées ?** | Suspendre la synchronisation, modifier des deux côtés, reprendre, analyser |

À la fin, « Copier le rapport » produit un JSON. Il contient le navigateur, le système, le nom du dossier choisi et les noms des fichiers de `_labo-ihecs`, sans aucun autre contenu. Ce rapport décidera de la conception finale (réautorisation, rythme de synchronisation, gestion des conflits).

### Mécanismes déjà vérifiés automatiquement (sans Drive réel)

- écriture limitée à `_labo-ihecs` ;
- détection d'un fichier arrivé de l'extérieur ;
- **conflit détecté avant d'écrire** grâce à l'empreinte SHA-256, sans rien écraser ;
- analyse de la version gagnante et des copies ;
- ouverture en `file://` avec un contexte sécurisé.

**Restent à mesurer sur ton ordinateur :**
- le comportement réel de Google Drive ;
- la conservation de l'autorisation ;
- le fonctionnement du sélecteur de dossier et de sa mémorisation quand le fichier est ouvert depuis le disque (`file://`).

## Résultats des mesures

### 15 novembre 2026 — Windows, Chrome 157, laboratoire ouvert en `file://`

| Question | Résultat | Statut |
|---|---|---|
| Navigateur compatible (contexte sécurisé, sélecteur, IndexedDB, empreintes) | Oui, y compris en `file://` | **Confirmé** |
| Choisir le dossier et écrire depuis un fichier ouvert par double-clic | Fonctionne (dossier `IHECS STUDY OS` dans Mon Drive) | **Confirmé** |
| Délai ordinateur → Drive | ≈ 32 s (1 mesure, au clic, temps de réaction compris) | Confirmé, à répéter |
| Délai Drive → ordinateur | ≈ 1 min 50 s (1 mesure : image envoyée depuis le téléphone, envoi compris ; détection automatique toutes les 2 s) | Confirmé, à répéter |
| Autorisation conservée après fermeture de Chrome | Pas encore mesuré : aucune réouverture après le choix du dossier | **À faire** |
| Modifications simultanées | Incomplet : « Modifier côté ordinateur » non fait, aucune version web arrivée. Le verdict « Résultat inattendu » venait d'un message mal conçu, corrigé dans la version 2 du laboratoire | **À refaire** |
| Erreurs | Aucune | — |

**Conséquences pour la conception, déjà acquises :**
- l'application peut rester **un fichier ouvert par double-clic** : l'accès au dossier fonctionne en `file://` ;
- une modification faite ailleurs (téléphone, web) peut mettre **environ 2 minutes** à arriver. L'application doit donc relire le dossier régulièrement (à l'ouverture, au retour sur la fenêtre, puis à intervalle régulier), proposer une synchronisation manuelle, et ne jamais supposer que le dossier est à jour ;
- dans l'autre sens, il faut attendre **environ 30 secondes** avant qu'une écriture soit visible ailleurs. Il ne faut donc pas passer d'un appareil à l'autre dans la seconde.

## Sources

- [Projets Google Cloud par défaut d'Apps Script](https://developers.google.com/apps-script/guides/cloud-platform-projects)
- [Applications web Apps Script](https://developers.google.com/apps-script/guides/web)
- [MDN : showDirectoryPicker](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker)
- Étude précédente (OAuth, scopes, `changes.list`) : `docs/audit/ARCHITECTURE_ASSESSMENT.md`
