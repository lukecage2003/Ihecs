# Tests

| Commande | Contenu | Outil |
|---|---|---|
| `npm run check` | Syntaxe de tous les fichiers JS | `node --check` |
| `npm test` | Tests unitaires : logique pure, stockage, sauvegardes, fixtures, assemblage, migration v2 | `node --test` (intégré à Node) |
| `npm run build:check` | Le fichier `IHECS-STUDY-OS.html` versionné correspond exactement aux sources | `scripts/build.mjs` |
| `npm run test:e2e` | Parcours réels dans Chromium, en bureau et en mobile (Pixel 7) | `@playwright/test` 1.63.0 |
| `npm run test:all` | Tout, à la suite | |

**Aucun serveur.** Les tests de l'application ouvrent `IHECS-STUDY-OS.html` en `file://`, exactement comme un double-clic. Les tests du laboratoire Drive interceptent les requêtes dans Playwright.

## Ce que couvrent les tests de bout en bout

Chaque test échoue aussi s'il se produit une **erreur JavaScript**, une **violation de CSP** ou une **requête vers un autre site que l'application**.

Parcours couverts :
- affichage de toutes les pages, sans débordement horizontal ;
- signalement de l'espace de démonstration ; page 404 ;
- chapitre marqué comme lu et persistance ;
- notation d'une fiche, seulement une fois retournée ;
- quiz complet ;
- navigation au clavier entre les onglets ;
- cases du planning ;
- export et import d'une sauvegarde, refus d'une sauvegarde invalide ;
- annulation de la réinitialisation ;
- recherche ;
- **lecture d'une progression laissée par l'ancienne version, sans la modifier** ;
- fonctionnement quand le stockage est bloqué.

## Laboratoire Drive (7 tests × 2 appareils)

Le vrai Google Drive pour ordinateur n'existe pas dans l'environnement de test. Le dossier choisi y est remplacé par le système de fichiers privé du navigateur (OPFS), qui expose la même API. Les tests couvrent :
- l'écriture limitée à `_labo-ihecs` ;
- la détection d'un fichier arrivé de l'extérieur ;
- la détection d'un conflit **avant** d'écrire, sans rien écraser ;
- l'analyse de la version gagnante et des copies ;
- l'ouverture en `file://`.

Ils ne mesurent **pas** le comportement réel de Drive : c'est le rôle des expériences faites par l'utilisateur.

Limite de l'environnement : dans Chromium headless, relire depuis IndexedDB une poignée de dossier OPFS fait planter la page. Les tests remplacent donc cette mémorisation par un crochet de test (`__LABO_TEST_HANDLE_STORE__`). La vraie mémorisation n'est vérifiée que par l'expérience 2, faite sur ton ordinateur.

## Pas encore couvert

- Firefox et Safari : seul Chromium est installé dans l'environnement de développement actuel.
- Audit d'accessibilité automatisé (axe) : il demanderait une dépendance de plus, pas encore autorisée.
- Fin réelle d'une session du minuteur (25 minutes) et passage de minuit.
- Google Drive réel : impossible ici. Il est mesuré par le laboratoire, sur ton ordinateur.

## CI

`.github/workflows/ci.yml` lance syntaxe, tests unitaires, vérification du fichier autonome et tests de bout en bout à chaque push. Il n'utilise aucun secret, ne déploie rien et n'a que des permissions en lecture.
