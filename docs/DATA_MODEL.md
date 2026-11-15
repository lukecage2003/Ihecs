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

## Conception v2 — **non appliquée**

> Phase 1 : conception, règles et tests seulement. Le code se trouve dans `src/data/v2/` et **n'est importé par aucune partie de l'application**. Aucune donnée existante n'a été migrée.

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

### Ce qui reste à décider avant d'appliquer la v2

1. **Quand** migrer : au démarrage, après une sauvegarde automatique de la v1, et avec ta confirmation.
2. **Où** écrire la v2 : localement (IndexedDB) puis dans le dossier Drive (option A de `GOOGLE_DRIVE_INTEGRATION.md`).
3. L'espace de démonstration actuel migre vers un espace `demo`. Ton espace réel démarre vide, sans aucune donnée des fixtures.
4. La hiérarchie complète (années, semestres, objectifs, concepts) et le contenu v2 seront spécifiés à l'étape suivante. Cette phase ne couvre que l'état de progression et les identifiants du contenu.
