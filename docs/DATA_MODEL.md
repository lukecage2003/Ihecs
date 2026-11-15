# Modèle de données

## État actuel : v1 (en production locale, inchangé)

Clé `localStorage` : `revisions-ihecs-v1`.

```js
{
  lu:      { "<matiere>|<chapitre>": true },
  quiz:    { "<matiere>|<chapitre>": { best, last, tries } },
  cartes:  { "<matiere>|<chapitre>|<index>": { box: 0..6, due: "AAAA-MM-JJ" } },
  plan:    { "<clé de tâche>": true|false },
  journal: { "AAAA-MM-JJ": <unités d'activité> },
  prenom, theme: "auto"|"light"|"dark", focus: { min }
}
```

Défauts : C1 (clé de fiche fondée sur la position), C2 (aucun historique). Voir `docs/audit/TECHNICAL_DEBT.md`.

## v2 — **en service pour l'espace réel** (version 0.4.0)

> La v2 est validée et utilisée par **l'espace académique réel** (dossier Google Drive). L'espace de démonstration garde le format v1 dans le navigateur : il n'a pas été migré, et rien ne l'exige, puisque ses données sont fictives. La migration v1 → v2 (`src/data/v2/migrate-v1.js`) reste disponible, testée et inutilisée.

### Fichiers de l'espace réel

```
<dossier choisi>/                                  ex. Mon Drive/IHECS STUDY OS
  ihecs-study-os.json                              manifeste : format, version, identifiant et nom de l'espace
  structure.json                                   structure académique (matières…), vide à la création
  appareils/<appareil>/etat.json                   document d'état v2 de CET ordinateur (un seul rédacteur)
  appareils/<appareil>/revisions-AAAA-MM.jsonl     journal des révisions, une ligne par révision, ajout seul
  imports/                                         fichiers de cours importés, archivés tels quels
  sauvegardes/                                     copie de structure.json avant chaque import
```

- **Création :** `structure.json`, puis l'état de l'appareil, puis le manifeste **en dernier**. Un dossier sans manifeste n'est pas un espace. Aucun fichier existant n'est écrasé : la création s'arrête si un fichier de l'espace est déjà présent. Les autres fichiers du dossier ne sont jamais touchés.
- **Ouverture :** manifeste, structure et état sont validés. En cas d'erreur, l'application affiche le message et n'écrit rien. Un nouvel ordinateur crée seulement **son** sous-dossier.
- **Enregistrement :** à chaque changement, l'état complet de l'appareil est réécrit de façon atomique (fichier temporaire, puis remplacement), une écriture à la fois. Un échec est affiché (« Échec de l'enregistrement », bouton Réessayer) et la dernière version reste en mémoire pour réessayer.
- **Révisions :** chaque note de fiche ajoute une ligne `{ id, cardId, at, rating, scheduler, before, after, deviceId }` sans réécrire les précédentes. C'est la correction du défaut C2 : un historique réel, à partir de maintenant.
- **Identifiants stables :** les fiches de l'espace réel utilisent leur `id` (correction de C1). Les fixtures de démonstration gardent leur clé v1.
- **Limite connue :** la progression de chaque ordinateur est séparée. La fusion entre plusieurs ordinateurs n'est pas encore faite.

## Conception v2 (référence)

### Document d'état v2

```js
{
  format: "ihecs-study-os",
  schemaVersion: 2,
  workspace: { id, kind: "demo" | "real" },     // D3 : les espaces ne se mélangent jamais
  createdAt, updatedAt,                          // ISO 8601
  migratedFrom: { schemaVersion: 1, at },
  settings: { firstName, theme },
  progress: {
    cards: { "<id stable>": { scheduler: "leitner", box, due, origin } },
    reviewLog: [ { id, cardId, at, rating, ... } ],   // ajout seul ; vide après migration
    reading:        { "<m>|<c>": { value, origin } },
    quizSummaries:  { "<m>|<c>": { best, last, tries, origin } },
    planChecks:     { "<clé>": { value, origin } },
    legacyDailyActivity: { "AAAA-MM-JJ": n },          // unités v1, ce ne sont PAS des révisions
    focusMinutes
  },
  idMap:   { cards: { "<clé v1>": "<id stable>" } },   // traçabilité
  orphans: { cards: {...}, quiz: {...} },              // données v1 sans correspondance, conservées
  legacy:  { v1, v1Keys, unknownFields, invalidFields, focusExtra }
}
```

### Identifiants stables

- Fiche : `card:<matière>:<chapitre>:<NNN>`. Il est calculé **une seule fois**, à la migration, puis enregistré dans le contenu. Il n'est plus jamais recalculé : réordonner ou insérer des fiches ne le change plus (testé).
- Question de quiz : `question:<matière>:<chapitre>:<NNN>`, selon la même règle.
- Un identifiant déjà présent n'est jamais remplacé.
- Les nouveaux éléments créés après la v2 recevront un UUID (à la phase concernée).

### Règles de migration v1 → v2

| # | Règle |
|---|---|
| R1 | L'entrée n'est jamais modifiée (copie profonde) |
| R2 | Résultat déterministe pour une même entrée et une même date (`now` passé en paramètre) |
| R3 | Rien n'est jeté : toute fiche ou tout quiz sans correspondance ou invalide va dans `orphans` |
| R4 | Aucune histoire inventée : `reviewLog` est vide, les états migrés sont marqués `origin: "migrated-v1"` |
| R5 | Le journal v1 est conservé sous le nom `legacyDailyActivity`, pour ne pas le confondre avec des révisions |
| R6 | Les résultats de quiz agrégés restent des résumés : ils ne deviennent pas de fausses tentatives |
| R7 | Les champs inconnus sont conservés dans `legacy.unknownFields` |
| R8 | Une copie intégrale de la v1 est gardée dans `legacy.v1` comme filet de sécurité |
| R9 | Une entrée invalide est refusée avec un message, sans exception et sans résultat partiel |
| R10 | Un document déjà en v2 est renvoyé tel quel (idempotence) |
| R11 | Le type d'espace (`demo` ou `real`) est imposé par l'appelant et conservé |
| R12 | Un rapport chiffré accompagne chaque migration (fiches reliées, orphelines, champs inconnus…) |

### Preuve d'absence de perte

`projectV2toV1(migrate(x))` redonne **exactement** `x` pour chaque fixture de `tests/fixtures/v1/` : état vide, état par défaut, état typique, orphelins et champs inconnus, valeurs invalides. Cette projection **n'utilise pas** la copie `legacy.v1` (un test la falsifie et vérifie que le résultat ne change pas).

On a aussi vérifié que les tests échouent quand on introduit volontairement une perte dans la migration (fiches orphelines jetées : 3 échecs ; journal vidé : 4 échecs).

### Décisions prises

1. L'espace réel démarre **vide**, directement en v2 : aucune migration n'est nécessaire.
2. Les données v2 sont écrites **dans le dossier Drive**. IndexedDB ne garde que des préférences du navigateur (identifiant d'appareil, dossier mémorisé, espace actif), jamais de données académiques.
3. La démonstration reste en v1 dans le navigateur, isolée (D3).
4. **À spécifier à l'étape suivante :** la hiérarchie complète de `structure.json` (années, semestres, matières, chapitres, objectifs, concepts) et son éditeur.
