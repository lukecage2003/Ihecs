# Révisions IHECS

Site de révision personnel : un tableau de bord par matière, avec résumés complets, fiches de mémorisation, quiz, examens blancs, infos d'examens et planning automatique.

> Le contenu actuel est un **exemple**. Il sera remplacé par les vrais cours dès qu'ils seront ajoutés dans le dossier `cours/`.

## Fonctionnalités

| Page | Ce qu'elle fait |
|---|---|
| **Tableau de bord** | Compte à rebours jusqu'au prochain examen, progression globale, fiches à revoir, série de jours, tâches du jour, minuteur Focus (25 min), activité de la semaine. |
| **Matière** | Chapitres et leur statut, infos d'examen (date, type, durée, pondération, lieu, consignes), documents du cours, examen blanc. |
| **Chapitre** | Quatre onglets : *Résumé* (avec sommaire), *L'essentiel* (points clés et définitions), *Fiches* (cartes à retourner), *Quiz* (questions corrigées et expliquées). |
| **Révision du jour** | Répétition espacée (système de Leitner) : les fiches reviennent après 1, 2, 4, 8, 16 puis 32 jours selon tes réponses. |
| **Examens** | Toutes les épreuves de la session, triées par date, avec ton niveau de préparation. |
| **Planning** | Répartit automatiquement les chapitres pas encore maîtrisés jusqu'à 3 jours avant chaque examen, puis garde les 2 derniers jours pour les fiches et un examen blanc. |
| **Recherche** | <kbd>⌘K</kbd> ou <kbd>Ctrl K</kbd> : chapitres, notions, auteurs, définitions, fiches. |

Mode clair et sombre automatiques, version mobile avec barre d'onglets, progression sauvegardée dans le navigateur (export et import possibles dans *Réglages*).

## Ouvrir le site

Aucune installation : c'est un site statique (HTML, CSS, JavaScript).

- **En local** : double-clique sur `index.html`, ou lance `python3 -m http.server` dans le dossier et ouvre http://localhost:8000.
- **En ligne avec GitHub Pages** : *Settings → Pages → Deploy from a branch*, puis choisis la branche et le dossier `/`. Attention : sur un compte GitHub gratuit, Pages exige un dépôt **public**. Les cours appartenant aux professeurs, garde le dépôt **privé** et utilise plutôt la version locale.

## Ajouter des cours

1. Dépose les fichiers bruts (PDF, slides, notes, consignes d'examen) dans `cours/<matiere>/`. Voir [`cours/README.md`](cours/README.md).
2. Le contenu du site se trouve dans [`data/cours.js`](data/cours.js) : matières, examens, chapitres, résumés (en Markdown), points clés, définitions, fiches et quiz. La structure est expliquée en haut du fichier.

## Structure

```
index.html            page unique
assets/css/style.css  design (inspiré d'Apple, clair et sombre)
assets/js/app.js      application : navigation, fiches, quiz, planning, recherche
data/cours.js         tout le contenu des cours
cours/                fichiers originaux des cours, par matière
```
