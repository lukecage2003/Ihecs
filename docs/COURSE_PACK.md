# Fichier de cours (« pack ») — spécification

Un fichier de cours apporte une ou plusieurs **matières complètes** à ton espace académique : chapitres, résumés, points clés, définitions, fiches, quiz, examen et documents. Il s'importe dans **Mon espace → Importer mes cours**, avec un aperçu avant toute écriture.

Exemple complet (cours fictifs) : [`fixtures/packs/exemple-cours.json`](../fixtures/packs/exemple-cours.json).

> **Confidentialité :** tes vrais fichiers de cours ne doivent jamais être ajoutés au dépôt GitHub, qui est public. Range-les dans ton dossier Google Drive, par exemple dans `IHECS STUDY OS/imports-a-faire/`.

## Structure

```json
{
  "format": "ihecs-study-os",
  "kind": "course-pack",
  "schemaVersion": 2,
  "title": "Bloc 1 — Q1 2026-2027",
  "createdAt": "2026-11-16T10:00:00.000Z",
  "source": { "kind": "claude", "note": "Généré à partir des documents LEARN de chaque cours" },
  "subjects": [
    {
      "id": "socio",
      "nom": "Sociologie de la communication",
      "prof": "Nom du professeur",
      "credits": 5,
      "quadrimestre": "Q1",
      "couleur": "#0a84ff",
      "icone": "people",
      "examen": {
        "date": "2027-01-08T09:00",
        "type": "Écrit",
        "duree": "3 h",
        "poids": "100 %",
        "lieu": "Auditoire",
        "consignes": ["…"]
      },
      "documents": [
        { "nom": "Slides chapitre 1", "chemin": "cours/socio/chapitre-1.pdf" }
      ],
      "chapitres": [
        {
          "id": "c1",
          "titre": "Les modèles de la communication",
          "duree": 40,
          "resume": "## Titre\nTexte en Markdown…",
          "pointsCles": ["…"],
          "definitions": [{ "terme": "…", "def": "…" }],
          "fiches": [{ "id": "card:socio:c1:001", "q": "Question ?", "r": "Réponse." }],
          "quiz": [{ "id": "question:socio:c1:001", "q": "…", "choix": ["A", "B", "C", "D"], "bonne": 1, "explication": "…" }],
          "sources": [{ "document": "cours/socio/chapitre-1.pdf", "pages": "3-12" }]
        }
      ]
    }
  ]
}
```

## Règles (vérifiées à l'import)

| Champ | Règle |
|---|---|
| `id` de matière et de chapitre | Lettres et chiffres uniquement, 32 au plus, uniques. Ils servent dans les liens (`#m-socio`). |
| `id` de fiche et de question | **Obligatoire et stable**, 4 à 80 caractères parmi `A-Z a-z 0-9 : . _ -`, unique dans tout l'espace. Ta progression y est attachée : **ne jamais changer l'id d'une fiche existante** quand un cours est régénéré. |
| `couleur` | `#rrggbb` (facultative) |
| `icone` | Facultative : `people`, `scale`, `chart`, `eye`, `globe`, `book`, `mic`, `pen`, `camera`, `brain`… |
| `examen.date` | Date ISO lisible (`2027-01-08T09:00`), facultative |
| `documents[].chemin` | Chemin **relatif** dans ton dossier (`cours/…`), sans `..`. Le fichier est ouvert depuis ton dossier Drive, jamais téléchargé d'Internet. |
| `resume` | Markdown simple : titres `##`, listes, tableaux, **gras**, *italique*, ==surligné==, encadrés `>` |
| `quiz` | 2 à 4 `choix` ; `bonne` = index de la bonne réponse (0 pour la première) |
| Taille | 20 Mo au maximum par fichier |

## Comportement de l'import

1. Tu peux choisir **plusieurs fichiers d'un coup**. Ils sont réunis dans un seul aperçu ; si une même matière apparaît dans deux fichiers, la version la plus récente (`createdAt`) est gardée et l'aperçu le signale.
2. **Aperçu** : matières nouvelles, à mettre à jour, déjà à jour, ainsi que les erreurs éventuelles. Rien n'est écrit à ce stade.
3. Une matière **déjà présente** (même `id`) :
   - identique au fichier → « Déjà à jour », rien ne change ;
   - différente → « Mettre à jour » est **pré-coché** ; décoche pour garder la version actuelle.
4. Les informations que tu as **modifiées dans le site** (crédits, quadrimestre, date et détails de l'examen) sont conservées lors d'une mise à jour.
5. À la validation :
   - chaque fichier est archivé tel quel dans `imports/` ;
   - la structure actuelle est copiée dans `sauvegardes/` ;
   - `structure.json` est mis à jour **seulement s'il n'a pas changé depuis l'aperçu**. Sinon, rien n'est écrit et l'application te demande de relancer l'aperçu.

## Principes de rédaction (pour Claude)

- Partir **uniquement** du contenu des documents du cours. Ne jamais inventer d'auteur, de date, de citation ni de numéro de page.
- Indiquer les `sources` (document et pages) quand elles sont connues.
- Une information absente des documents (date d'examen inconnue, par exemple) est **omise**, jamais devinée.
