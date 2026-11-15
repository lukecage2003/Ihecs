# Matrice de couverture des fonctionnalités

**Statut actuel** : Fonctionne · Partiel · Cassé · Manquant · Inconnu · N/A
**Compatibilité** : **NAV** = pleinement compatible GitHub Pages et API du navigateur · **GOO** = compatible avec les API Google autorisées · **LIM** = limité par l'absence de serveur · **IMP** = impossible sans infrastructure supplémentaire · **VER** = vérification technique en attente
**Complexité** : S · M · L · XL (relative, sans date)

| Domaine | Fonctionnalité | Statut | Compatibilité | Complexité |
|---|---|---|---|---|
| **Structure** | Années, semestres, matières, cours, chapitres, concepts, objectifs | Partiel (matières et chapitres seulement) | NAV + GOO | M |
| | Archivage et réouverture d'une année | Manquant | NAV + GOO | S |
| **Drive** | Connexion, déconnexion, statut, explication des permissions | Manquant | GOO | M |
| | Dossier « IHECS STUDY OS » et arborescence | Manquant | GOO (`drive.file`) | S |
| | Import de fichiers existants choisis par l'utilisateur | Manquant | GOO (Picker) + VER (dossiers) | M |
| | Synchronisation bidirectionnelle à la demande et pendant l'utilisation | Manquant | GOO | L |
| | Synchronisation navigateur fermé, notifications poussées | Manquant | **IMP** | — |
| | Détection et résolution des conflits | Manquant | GOO + VER (écriture conditionnelle) | L |
| | Sauvegardes et restauration | Partiel (export manuel local) | GOO | M |
| **Bibliothèque** | Import, classement, recherche, filtres | Manquant | NAV + GOO | M |
| | Aperçu PDF avec navigation par page | Manquant | NAV (pdf.js) | M |
| | Extraction DOCX, PPTX, TXT, MD | Manquant | NAV | M |
| | Annotations (dans un fichier séparé de l'original) | Manquant | NAV + GOO | L |
| | Détection de doublons (empreinte de contenu) | Manquant | NAV | S |
| | OCR | Manquant | NAV (tesseract.js), lourd | M |
| | Transcription audio | Manquant | LIM | XL |
| **Connaissances** | Concepts, auteurs, définitions, événements, relations, références de source | Partiel (définitions sans source) | NAV | L |
| | Distinction cours / note perso / source externe / IA / non vérifié | Manquant | NAV | S |
| | Notes personnelles | Manquant | NAV + GOO | M |
| **Study Lab** | Fiches | Fonctionne | NAV | — |
| | QCM à réponse unique | Fonctionne | NAV | — |
| | QCM multiple, vrai/faux, texte à trous, appariement, chronologie, associations | Manquant | NAV | M |
| | Réponses courtes et longues, études de cas, argumentation (correction manuelle) | Manquant | NAV | M |
| | Création et édition des exercices par l'utilisateur | Manquant | NAV + GOO | M |
| **Répétition** | Algorithme FSRS (remplace Leitner) | Partiel (Leitner) | NAV | M |
| | Journal des révisions, confiance, temps de réponse | Manquant | NAV + GOO | M |
| | Files : du jour, à venir, en retard | Partiel (du jour seulement) | NAV | S |
| | Correction d'une révision enregistrée par erreur | Manquant | NAV | S |
| **Exam Center** | Examen minuté, banques de questions, tirage, distribution | Partiel (examen blanc non minuté) | NAV | L |
| | Sauvegarde automatique, historique, revue, reprise | Manquant | NAV + GOO | M |
| | Correction manuelle des questions ouvertes avec grille | Manquant | NAV | M |
| **Writing Studio** | Plans, brouillons, versions, comparaison, grilles | Manquant | NAV + GOO | L |
| | Vérification grammaticale | Manquant | VER (pas d'outil local gratuit de qualité ; LanguageTool demanderait un service tiers) | — |
| **Oral Academy** | Scénarios, préparation, grilles d'évaluation | Manquant | NAV | M |
| | Enregistrement vocal local | Manquant | NAV (MediaRecorder) | S |
| | Transcription | Manquant | LIM | XL |
| **Journalism Lab** | Rédaction simulée, titres, attaques, angles | Manquant | NAV (scénarios prédéfinis) | L |
| | Interview, fact-checking, analyse des médias, déontologie | Manquant | NAV | L |
| **Planificateur** | Calendrier, échéances, sessions, vues jour et semaine | Partiel (liste générée) | NAV | M |
| | Planification adaptative avec capacité réelle et modification manuelle | Partiel | NAV | L |
| | Rappels quand le site est fermé | Manquant | **LIM** (alternative : export .ics vers Google Agenda, une API Google à autoriser) | S |
| **Analytique** | Mémorisation, compréhension, application, rétention, régularité, examens | Partiel (un seul pourcentage) | NAV | L |
| | Courbes, faiblesses, historique, préparation à l'examen | Manquant | NAV | M |
| **Content Studio** | Synthèses, fiches courtes, glossaires, frises, packs | Partiel (résumé, glossaire) | NAV | M |
| | Cartes mentales et diagrammes | Manquant | NAV | M |
| **IA** | Explications, suggestions, aide à la correction | N/A (désactivée) | **IMP** sans serveur en toute sécurité ; interface prête | S (interface) |
| **Transversal** | Thèmes clair et sombre, mobile, recherche | Fonctionne | NAV | — |
| | Accessibilité (clavier complet, rôles ARIA, contraste mesuré) | Partiel | NAV | M |
| | Export et récupération | Partiel | NAV + GOO | S |
| | Tests et CI | Manquant | NAV (GitHub Actions) | M |
