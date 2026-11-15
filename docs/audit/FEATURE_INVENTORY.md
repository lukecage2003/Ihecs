# Inventaire des fonctionnalités existantes

Statuts : **Fonctionne** · **Partiel** · **Cassé** · **Manquant** · **Inconnu** · **Non applicable**.
« Fonctionne » signifie « vérifié dans un navigateur », voir `BASELINE_TEST_RESULTS.md`.

| Fonctionnalité | Statut | Emplacement | Remarques |
|---|---|---|---|
| Tableau de bord (compte à rebours, progression, statistiques, tâches du jour) | Fonctionne | `app.js` · `viewHome` | Progression = un pourcentage unique pondéré 30/30/40, ce que la vision demande d'éviter |
| Liste des matières et page matière | Fonctionne | `viewSubjects`, `viewSubject` | Pas d'année ni de semestre réels ; « quadrimestre » est un simple texte |
| Infos d'examen (date, type, durée, pondération, lieu, consignes) | Fonctionne | `viewSubject`, `viewExams` | Saisies dans `cours.js` uniquement |
| Résumé de chapitre en Markdown avec sommaire | Fonctionne | `md()`, `viewChapter` | Markdown maison ; aucune référence de source (page, diapositive) |
| Points clés et définitions | Fonctionne | `viewChapter` (onglet essentiel) | |
| Fiches recto verso avec notation en 4 niveaux | Fonctionne | `mountFlashcards` | Leitner, pas FSRS ; identifiants de fiche fondés sur leur position |
| Révision du jour (fiches dues, filtre par matière) | Fonctionne | `viewRevision`, `dueCards` | |
| Quiz à choix unique avec explication | Fonctionne | `mountQuiz` | Un seul format ; garde le meilleur score, sans historique des tentatives |
| Examen blanc par matière | Partiel | route `blanc-*` | Réutilise le quiz : pas de minutage, ni de sauvegarde, ni d'historique |
| Planning automatique | Partiel | `buildPlan` | Recalculé chaque jour ; ignore le temps disponible ; pas de modification manuelle ; aucune limite de charge par jour |
| Recherche globale (⌘K) | Fonctionne | `openSearch` | Index en mémoire du contenu statique |
| Minuteur Focus (25/5/15) | Partiel | `timer` | Ne tourne que page ouverte ; compte comme activité (5 unités) sans travail mesuré |
| Activité sur 7 jours et série | Partiel | `journal`, `streak` | Unités hétérogènes (fiche, question, tâche, minuteur) additionnées |
| Réglages : prénom, thème | Fonctionne | `viewSettings` | |
| Export et import de la progression | Fonctionne | `bindSettings` | Validation minimale du fichier importé |
| Réinitialisation avec confirmation | Fonctionne | `bindSettings` | |
| Mode clair et sombre | Fonctionne | `style.css` | Contraste non mesuré |
| Mobile (barre d'onglets) | Fonctionne | `style.css` | Pas de défilement horizontal à 375 px |
| Fonctionnement sans stockage disponible | Fonctionne | `try/catch` | |
| Page 404 | Cassé | `render` | Un hash inconnu redirige vers l'accueil ; la vue « introuvable » est inaccessible |
| Liste des documents d'une matière | Partiel | `viewSubject` | Affiche des liens ; aucun aperçu, import ni analyse |
| Google Drive, connexion Google | Manquant | — | |
| Années académiques, semestres, archives | Manquant | — | |
| Notes et annotations | Manquant | — | |
| Autres formats d'exercices (vrai/faux, appariement, texte à trous, questions ouvertes…) | Manquant | — | |
| Exam Center, Writing Studio, Oral Academy, Journalism Lab | Manquant | — | |
| Analytique détaillée | Manquant | — | |
| IA | Non applicable | — | Aucune, conforme au principe « désactivée par défaut » |
| Tests et CI | Manquant | — | |
