/*
  ============================================================
  FIXTURE DE DÉMONSTRATION (cours fictifs)
  ============================================================
  Contenu FICTIF utilisé pour la démonstration et les tests.
  Il ne doit jamais être mélangé avec le véritable espace académique :
  il est chargé uniquement dans l'espace « démonstration »
  (voir src/content/workspaces.js).

  Structure d'une matière :
  {
    id: "socio",                 // identifiant court, lettres uniquement
    nom: "…", prof: "…", credits: 5, quadrimestre: "Q1",
    couleur: "#0a84ff",          // couleur de la matière
    icone: "people",             // people | scale | chart | eye | globe | book | mic | pen | camera | brain
    examen: { date: "2027-01-08T09:00", type: "Écrit", duree: "3 h", poids: "100 %", lieu: "…", consignes: [ … ] },
    fichiers: [ { nom: "Slides chapitre 1", chemin: "cours/socio/ch1.pdf" } ],
    chapitres: [
      {
        id: "c1", titre: "…", duree: 45,  // minutes de lecture estimées
        resume: `markdown`,                // ## titres, listes, **gras**, ==surligné==, > encadré, tableaux
        pointsCles: [ "…" ],
        definitions: [ { terme: "…", def: "…" } ],
        fiches: [ { q: "question", r: "réponse" } ],
        quiz: [ { q: "…", choix: ["…","…","…","…"], bonne: 0, explication: "…" } ]
      }
    ]
  }
*/
const DEMO_COURSES = {
  exemple: true,
  ecole: "IHECS",
  annee: "Bachelier 1 — 2026-2027",
  session: { nom: "Session de janvier 2027", debut: "2027-01-06", fin: "2027-01-29" },

  matieres: [
    /* ------------------------------------------------------------------ */
    {
      id: "socio",
      nom: "Sociologie de la communication",
      prof: "Prof. (exemple)",
      credits: 5,
      quadrimestre: "Q1",
      couleur: "#0a84ff",
      icone: "people",
      examen: {
        date: "2027-01-08T09:00",
        type: "Écrit",
        duree: "3 h",
        poids: "100 % de la note",
        lieu: "Auditoire (à confirmer)",
        consignes: [
          "Questions de restitution (définitions, auteurs, dates) et questions de réflexion.",
          "Une question d'application : analyser un cas d'actualité avec un modèle du cours.",
          "Aucun document autorisé.",
          "Citer les auteurs avec l'année est valorisé."
        ]
      },
      fichiers: [],
      chapitres: [
        {
          id: "c1",
          titre: "Les modèles de la communication",
          duree: 40,
          resume: `
## Pourquoi des modèles ?
Un **modèle** est une représentation simplifiée d'un phénomène. En communication, il sert à repérer les éléments en jeu (qui parle, à qui, par quel moyen, avec quel effet) et à les comparer. On distingue deux grandes familles : les modèles **linéaires**, qui voient la communication comme une transmission, et les modèles **circulaires**, qui la voient comme une interaction.

## Le modèle de Shannon et Weaver (1949)
Claude Shannon, ingénieur aux laboratoires Bell, publie en 1948 une théorie mathématique de la communication, présentée en 1949 avec Warren Weaver. La question est technique : comment transmettre un signal avec le moins de perte possible ?

La chaîne comporte cinq éléments : **source → émetteur → canal → récepteur → destinataire**. Le **bruit** est tout ce qui perturbe le signal sur le canal.

> **Limite** : le modèle ignore le sens du message, le contexte et la réaction du destinataire. Il décrit la transmission, pas la compréhension.

## Lasswell (1948) : les cinq questions
Harold Lasswell, politologue qui a étudié la propagande, résume l'acte de communication en une phrase : ==Qui dit quoi, par quel canal, à qui, avec quel effet ?==

| Question | Champ d'étude |
|---|---|
| Qui ? | Analyse du contrôle (émetteurs) |
| Dit quoi ? | Analyse de contenu |
| Par quel canal ? | Analyse des médias |
| À qui ? | Analyse de l'audience |
| Avec quel effet ? | Analyse des effets |

Le modèle reste linéaire et suppose un effet direct du message sur le récepteur.

## Jakobson (1960) : les six fonctions du langage
Le linguiste Roman Jakobson associe une fonction à chacun des six facteurs de la communication.

| Facteur | Fonction | Exemple |
|---|---|---|
| Destinateur | Expressive (émotive) | « Quelle horreur ! » |
| Destinataire | Conative | « Viens ici. » |
| Contexte | Référentielle | « Il pleut à Bruxelles. » |
| Message | Poétique | Le slogan « I like Ike » |
| Contact | Phatique | « Allô ? Tu m'entends ? » |
| Code | Métalinguistique | « Que veut dire *phatique* ? » |

Un message mobilise souvent plusieurs fonctions ; on parle de fonction **dominante**.

## L'école de Palo Alto
Autour de Gregory Bateson puis de Paul Watzlawick, des chercheurs californiens étudient la communication comme un **système** d'interactions. Dans *Une logique de la communication* (Watzlawick, Beavin et Jackson, 1967), ils formulent cinq axiomes :

1. ==On ne peut pas ne pas communiquer.== Le silence et l'immobilité sont aussi des messages.
2. Toute communication a un aspect de **contenu** et un aspect de **relation**.
3. La nature d'une relation dépend de la **ponctuation** des séquences d'échange.
4. La communication est **digitale** (les mots) et **analogique** (gestes, ton, posture).
5. Les échanges sont **symétriques** (égalité) ou **complémentaires** (différence, ex. professeur et étudiant).

> **À retenir** : Yves Winkin (*La nouvelle communication*, 1981) oppose le modèle **télégraphique** (linéaire, Shannon) au modèle **orchestral** : chacun participe à la communication comme un musicien dans un orchestre, sans chef ni partition visible.
`,
          pointsCles: [
            "Deux familles de modèles : linéaires (transmission) et circulaires (interaction).",
            "Shannon et Weaver (1949) : source, émetteur, canal, récepteur, destinataire, plus le bruit. Modèle technique qui ignore le sens.",
            "Lasswell (1948) : qui dit quoi, par quel canal, à qui, avec quel effet. Chaque question correspond à un champ d'étude.",
            "Jakobson (1960) : six facteurs et six fonctions (expressive, conative, référentielle, poétique, phatique, métalinguistique).",
            "Palo Alto (1967) : « on ne peut pas ne pas communiquer » ; contenu et relation ; communication digitale et analogique.",
            "Winkin (1981) oppose le modèle télégraphique au modèle orchestral."
          ],
          definitions: [
            { terme: "Bruit", def: "Toute perturbation qui altère le signal pendant sa transmission sur le canal (Shannon et Weaver)." },
            { terme: "Fonction phatique", def: "Fonction centrée sur le contact : établir, maintenir ou vérifier la communication (« Allô ? »)." },
            { terme: "Fonction conative", def: "Fonction centrée sur le destinataire, qu'on cherche à faire agir (impératif, interpellation)." },
            { terme: "Métacommunication", def: "Communication sur la communication ; chez Palo Alto, l'aspect relationnel qui dit comment comprendre le contenu." },
            { terme: "Relation complémentaire", def: "Échange fondé sur la différence de position entre les partenaires (ex. médecin et patient)." }
          ],
          fiches: [
            { q: "Quels sont les éléments du modèle de Shannon et Weaver ?", r: "Source, émetteur, canal, récepteur, destinataire, et le bruit qui perturbe le canal." },
            { q: "En quelle année Shannon et Weaver publient-ils leur modèle ?", r: "1949 (théorie de Shannon publiée en 1948)." },
            { q: "Quelle est la principale limite du modèle de Shannon ?", r: "Il ignore le sens, le contexte et la rétroaction : il décrit une transmission technique, pas la compréhension." },
            { q: "Formule de Lasswell (1948) ?", r: "Qui dit quoi, par quel canal, à qui, avec quel effet ?" },
            { q: "Quelle fonction de Jakobson est centrée sur le code ?", r: "La fonction métalinguistique (ex. « que veut dire ce mot ? »)." },
            { q: "Quelle fonction de Jakobson est centrée sur le message lui-même ?", r: "La fonction poétique (travail de la forme : rimes, slogans, jeux de mots)." },
            { q: "Premier axiome de l'école de Palo Alto ?", r: "« On ne peut pas ne pas communiquer » : tout comportement a valeur de message." },
            { q: "Différence entre communication digitale et analogique ?", r: "Digitale : les mots, le code arbitraire. Analogique : le non-verbal (gestes, ton, posture)." },
            { q: "Modèle télégraphique contre modèle orchestral : qui fait cette opposition ?", r: "Yves Winkin, dans La nouvelle communication (1981)." }
          ],
          quiz: [
            { q: "Dans le modèle de Shannon et Weaver, le « bruit » désigne :", choix: ["Le volume sonore du message", "Toute perturbation du signal sur le canal", "Le désaccord entre émetteur et récepteur", "Les messages publicitaires"], bonne: 1, explication: "Le bruit est une notion technique : tout ce qui altère le signal pendant sa transmission." },
            { q: "« Allô ? Tu m'entends ? » illustre surtout la fonction :", choix: ["Conative", "Référentielle", "Phatique", "Expressive"], bonne: 2, explication: "La fonction phatique sert à établir ou vérifier le contact." },
            { q: "Quelle question N'APPARTIENT PAS à la formule de Lasswell ?", choix: ["Par quel canal ?", "Avec quel effet ?", "Pourquoi ?", "À qui ?"], bonne: 2, explication: "La formule est : qui, dit quoi, par quel canal, à qui, avec quel effet. Le « pourquoi » n'y figure pas." },
            { q: "Selon l'école de Palo Alto, toute communication comporte :", choix: ["Un émetteur et un récepteur distincts", "Un aspect de contenu et un aspect de relation", "Un canal et un code", "Une fonction poétique"], bonne: 1, explication: "C'est le deuxième axiome de Watzlawick, Beavin et Jackson (1967)." },
            { q: "Le modèle « orchestral » de la communication :", choix: ["Est linéaire", "A été proposé par Shannon", "Voit chaque participant comme un musicien sans chef visible", "Ne concerne que la musique"], bonne: 2, explication: "Winkin oppose ce modèle circulaire au modèle télégraphique, linéaire." },
            { q: "Un slogan comme « I like Ike » met en avant la fonction :", choix: ["Poétique", "Métalinguistique", "Phatique", "Référentielle"], bonne: 0, explication: "La fonction poétique est centrée sur la forme du message (ici, les sonorités)." }
          ]
        },
        {
          id: "c2",
          titre: "Les effets des médias",
          duree: 45,
          resume: `
## Trois grandes périodes
L'étude des effets des médias suit un mouvement de balancier : on pense d'abord que les médias sont tout-puissants, puis que leurs effets sont limités, puis on revient à des effets puissants mais indirects, à long terme.

## 1. Les effets puissants (années 1920-1940)
Après la propagande de la Première Guerre mondiale, on imagine que le message agit directement sur chaque individu, comme une piqûre : c'est la théorie de la **seringue hypodermique** (ou de la *balle magique*). Lasswell étudie la propagande dès 1927.

> **Exemple souvent cité** : l'émission radio *La Guerre des mondes* d'Orson Welles (1938). La « panique générale » a été largement exagérée par la presse de l'époque, ce qui montre les limites du modèle.

## 2. Les effets limités (années 1940-1960)
Paul Lazarsfeld, Bernard Berelson et Hazel Gaudet étudient l'élection présidentielle américaine de 1940 dans le comté d'Erie (*The People's Choice*, 1944). Résultat : les médias changent très peu les opinions ; ils les **renforcent** surtout.

Ils proposent le **two-step flow** (communication à deux étages) : les messages des médias atteignent d'abord des **leaders d'opinion**, qui les relaient ensuite dans leur entourage. Katz et Lazarsfeld développent cette idée dans *Personal Influence* (1955).

## 3. Le public actif : usages et gratifications
Avec Elihu Katz, Jay Blumler et Michael Gurevitch (1974), la question change : on ne demande plus ce que les médias font aux gens, mais ==ce que les gens font avec les médias==. Le public choisit les médias pour satisfaire des besoins : s'informer, se divertir, construire son identité, entretenir des relations.

## 4. Le retour des effets puissants (années 1970)
| Théorie | Auteurs | Idée centrale |
|---|---|---|
| Agenda-setting | McCombs et Shaw (1972) | Les médias ne disent pas quoi penser, mais **à quoi penser**. |
| Cultivation | Gerbner (années 1970) | Une forte exposition à la télévision façonne la vision du monde (« syndrome du grand méchant monde »). |
| Spirale du silence | Noelle-Neumann (1974) | Par peur de l'isolement, les personnes qui se croient minoritaires se taisent, ce qui renforce l'opinion perçue comme dominante. |

> **Astuce d'examen** : pour l'agenda-setting, cite l'étude de McCombs et Shaw sur l'élection de 1968 à Chapel Hill, et la formule de Bernard Cohen (1963) qui l'a inspirée.
`,
          pointsCles: [
            "Trois périodes : effets puissants, effets limités, retour des effets puissants (mais indirects et à long terme).",
            "Seringue hypodermique : le message agit directement et uniformément sur chaque individu.",
            "The People's Choice (1944) : les médias renforcent les opinions plus qu'ils ne les changent.",
            "Two-step flow : médias → leaders d'opinion → reste du public (Katz et Lazarsfeld, 1955).",
            "Usages et gratifications (1974) : on étudie ce que le public fait avec les médias.",
            "Agenda-setting (1972), cultivation (Gerbner) et spirale du silence (1974) marquent le retour des effets forts."
          ],
          definitions: [
            { terme: "Leader d'opinion", def: "Personne plus exposée aux médias et plus influente, qui relaie et interprète les messages pour son entourage." },
            { terme: "Agenda-setting", def: "Capacité des médias à hiérarchiser les sujets auxquels le public accorde de l'importance." },
            { terme: "Effet de renforcement", def: "Les médias confortent surtout des opinions déjà présentes plutôt que de les modifier." },
            { terme: "Spirale du silence", def: "Mécanisme par lequel la peur de l'isolement pousse les personnes minoritaires à se taire (Noelle-Neumann, 1974)." }
          ],
          fiches: [
            { q: "Qu'affirme la théorie de la seringue hypodermique ?", r: "Le message des médias agit directement et de la même manière sur chaque individu, comme une injection." },
            { q: "Auteurs et date de The People's Choice ?", r: "Lazarsfeld, Berelson et Gaudet, 1944 (élection présidentielle de 1940, comté d'Erie)." },
            { q: "Qu'est-ce que le two-step flow ?", r: "La communication à deux étages : les médias touchent les leaders d'opinion, qui influencent ensuite leur entourage." },
            { q: "Question centrale des usages et gratifications ?", r: "Que font les gens avec les médias ? (Katz, Blumler, Gurevitch, 1974)" },
            { q: "Idée de l'agenda-setting ?", r: "Les médias ne disent pas quoi penser, mais à quoi penser (McCombs et Shaw, 1972)." },
            { q: "Qui a théorisé la cultivation ?", r: "George Gerbner (années 1970) : la télévision façonne la perception de la réalité des grands consommateurs." },
            { q: "Qui a proposé la spirale du silence, et quand ?", r: "Elisabeth Noelle-Neumann, 1974." }
          ],
          quiz: [
            { q: "Selon The People's Choice (1944), l'effet principal des médias est :", choix: ["La conversion des opinions", "Le renforcement des opinions", "La manipulation directe", "L'indifférence totale"], bonne: 1, explication: "L'étude montre surtout un effet de renforcement des opinions existantes." },
            { q: "Dans le two-step flow, l'intermédiaire entre les médias et le public est :", choix: ["Le journaliste", "Le gouvernement", "Le leader d'opinion", "L'annonceur"], bonne: 2, explication: "Les leaders d'opinion relaient et interprètent les messages des médias." },
            { q: "« Les médias ne disent pas quoi penser mais à quoi penser » résume :", choix: ["La cultivation", "L'agenda-setting", "La spirale du silence", "La seringue hypodermique"], bonne: 1, explication: "C'est l'idée de l'agenda-setting (McCombs et Shaw, 1972)." },
            { q: "Quelle théorie s'intéresse à ce que le public fait des médias ?", choix: ["Usages et gratifications", "Agenda-setting", "Two-step flow", "Balle magique"], bonne: 0, explication: "Katz, Blumler et Gurevitch (1974) partent des besoins du public." },
            { q: "La spirale du silence repose sur :", choix: ["La peur de l'isolement", "Le manque d'accès aux médias", "La censure de l'État", "Le désintérêt pour la politique"], bonne: 0, explication: "Noelle-Neumann : on se tait quand on croit son opinion minoritaire." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "droit",
      nom: "Droit de la communication",
      prof: "Prof. (exemple)",
      credits: 4,
      quadrimestre: "Q1",
      couleur: "#5e5ce6",
      icone: "scale",
      examen: {
        date: "2027-01-13T13:30",
        type: "Oral avec préparation",
        duree: "20 min de préparation, 15 min d'oral",
        poids: "100 % de la note",
        lieu: "Bureau du professeur (à confirmer)",
        consignes: [
          "Tirage au sort de deux questions : une théorique, un cas pratique.",
          "Le Code annoté (sans notes personnelles) est autorisé pendant la préparation.",
          "Citer les articles précis (Constitution, CEDH) et la jurisprudence clé."
        ]
      },
      fichiers: [],
      chapitres: [
        {
          id: "c1",
          titre: "La liberté d'expression",
          duree: 35,
          resume: `
## Les sources
La liberté d'expression est protégée à deux niveaux en Belgique.

- **Constitution belge** : l'**article 19** garantit la liberté de manifester ses opinions en toute matière, sauf la répression des délits commis à cette occasion. L'**article 25** garantit la liberté de la presse : ==la censure ne pourra jamais être établie==.
- **Convention européenne des droits de l'homme (CEDH, 1950)** : l'**article 10** protège la liberté d'expression, qui comprend la liberté d'opinion et la liberté de recevoir ou de communiquer des informations ou des idées.

## Une liberté qui n'est pas absolue
L'article 10, paragraphe 2, admet des restrictions, mais seulement si elles respectent **trois conditions cumulatives** :

1. être **prévues par la loi** (loi accessible et prévisible) ;
2. poursuivre un **but légitime** (sécurité nationale, protection de la réputation ou des droits d'autrui, etc.) ;
3. être **nécessaires dans une société démocratique** (répondre à un besoin social impérieux et être proportionnées).

> **Arrêt clé** : *Handyside c. Royaume-Uni* (CEDH, 7 décembre 1976). La liberté d'expression vaut aussi pour les idées « qui heurtent, choquent ou inquiètent ». C'est une exigence du pluralisme et de la tolérance.

## Les spécificités belges pour la presse
- **Interdiction de la censure préalable** (art. 25) : on ne peut pas contrôler un écrit avant sa publication.
- **Responsabilité en cascade** (art. 25, al. 2) : si l'auteur est connu et domicilié en Belgique, l'éditeur, l'imprimeur et le distributeur ne peuvent pas être poursuivis.
- **Délit de presse** (art. 150) : il relève de la cour d'assises, avec un jury. Depuis la révision de 1999, les délits de presse inspirés par le racisme ou la xénophobie relèvent du tribunal correctionnel.

## La protection des sources
La Cour européenne la considère comme une « pierre angulaire » de la liberté de la presse (*Goodwin c. Royaume-Uni*, 1996). En Belgique, la **loi du 7 avril 2005** permet aux journalistes de taire leurs sources, sauf exceptions strictes (prévenir des infractions graves contre l'intégrité physique).
`,
          pointsCles: [
            "Sources : art. 19 et 25 de la Constitution belge ; art. 10 de la CEDH.",
            "La censure préalable est interdite en Belgique (art. 25).",
            "Restriction admise si elle est prévue par la loi, poursuit un but légitime et est nécessaire dans une société démocratique.",
            "Handyside (1976) : les idées qui heurtent, choquent ou inquiètent sont aussi protégées.",
            "Responsabilité en cascade : l'auteur connu et domicilié en Belgique protège éditeur, imprimeur et distributeur.",
            "Protection des sources : Goodwin (1996) et loi belge du 7 avril 2005."
          ],
          definitions: [
            { terme: "Censure préalable", def: "Contrôle d'un contenu avant sa diffusion ; interdite par l'article 25 de la Constitution." },
            { terme: "Responsabilité en cascade", def: "Seul l'auteur est poursuivi s'il est connu et domicilié en Belgique ; sinon l'éditeur, puis l'imprimeur, puis le distributeur." },
            { terme: "Délit de presse", def: "Infraction commise par l'expression d'une opinion dans un écrit imprimé et diffusé ; jugée en principe par la cour d'assises (art. 150)." },
            { terme: "Proportionnalité", def: "La restriction ne doit pas aller au-delà de ce qui est nécessaire pour atteindre le but légitime poursuivi." }
          ],
          fiches: [
            { q: "Quel article de la CEDH protège la liberté d'expression ?", r: "L'article 10." },
            { q: "Quels articles de la Constitution belge protègent la liberté d'expression et de la presse ?", r: "Article 19 (opinions) et article 25 (presse, interdiction de la censure)." },
            { q: "Les trois conditions d'une restriction à l'article 10 ?", r: "Prévue par la loi, but légitime, nécessaire dans une société démocratique." },
            { q: "Que retient-on de l'arrêt Handyside (1976) ?", r: "La liberté d'expression protège aussi les idées qui heurtent, choquent ou inquiètent." },
            { q: "Qu'est-ce que la responsabilité en cascade ?", r: "Si l'auteur est connu et domicilié en Belgique, l'éditeur, l'imprimeur et le distributeur ne peuvent pas être poursuivis." },
            { q: "Quelle juridiction juge les délits de presse ?", r: "La cour d'assises (art. 150), sauf ceux inspirés par le racisme ou la xénophobie, jugés en correctionnelle depuis 1999." },
            { q: "Quelle loi belge protège les sources journalistiques ?", r: "La loi du 7 avril 2005." }
          ],
          quiz: [
            { q: "En Belgique, la censure préalable est :", choix: ["Autorisée en temps de crise", "Interdite par l'article 25", "Autorisée pour la télévision", "Décidée par le CSA"], bonne: 1, explication: "« La censure ne pourra jamais être établie » (art. 25 de la Constitution)." },
            { q: "Laquelle N'EST PAS une condition de l'article 10 §2 ?", choix: ["Prévue par la loi", "But légitime", "Accord du journaliste", "Nécessaire dans une société démocratique"], bonne: 2, explication: "Les trois conditions cumulatives sont : loi, but légitime, nécessité." },
            { q: "L'arrêt Handyside c. Royaume-Uni date de :", choix: ["1950", "1976", "1996", "2005"], bonne: 1, explication: "7 décembre 1976." },
            { q: "Un délit de presse raciste est jugé par :", choix: ["La cour d'assises", "Le tribunal correctionnel", "Le Conseil d'État", "Le Conseil de déontologie journalistique"], bonne: 1, explication: "Depuis la révision de l'article 150 en 1999." },
            { q: "Goodwin c. Royaume-Uni (1996) porte sur :", choix: ["Le droit à l'image", "La protection des sources", "La publicité", "Le droit d'auteur"], bonne: 1, explication: "La Cour y qualifie la protection des sources de « pierre angulaire » de la liberté de la presse." }
          ]
        },
        {
          id: "c2",
          titre: "Vie privée et droit à l'image",
          duree: 35,
          resume: `
## Le droit au respect de la vie privée
Il est garanti par l'**article 8 de la CEDH** et l'**article 22 de la Constitution belge**. Il entre souvent en conflit avec la liberté d'expression (art. 10) : le juge doit alors **mettre en balance** les deux droits.

> **Critère clé** : la publication contribue-t-elle à un **débat d'intérêt général** ? (CEDH, *Von Hannover c. Allemagne*, 2004 : des photos de la vie quotidienne d'une princesse n'y contribuent pas.)

## Le droit à l'image
En droit belge, il repose sur l'**article XI.174 du Code de droit économique** : on ne peut pas reproduire ni communiquer au public le portrait d'une personne sans son **consentement**.

- Le consentement porte séparément sur la **prise** de l'image et sur sa **diffusion**.
- Il est **spécial** : un accord donné pour un usage ne vaut pas pour un autre (une photo de classe n'autorise pas une publicité).
- Après le décès, l'accord des proches reste nécessaire pendant **20 ans**.

**Exceptions admises par la jurisprudence** :
- personnalité publique photographiée dans l'exercice de ses fonctions ;
- personne prise dans un événement public ou d'actualité, ou dans une foule, sans être isolée ;
- personne qui apparaît de façon accessoire dans l'image.

## Le RGPD
Le **règlement (UE) 2016/679**, applicable depuis le **25 mai 2018**, encadre le traitement des données personnelles. Principes : licéité, limitation des finalités, minimisation des données, exactitude, conservation limitée, sécurité. Droits des personnes : accès, rectification, effacement (==« droit à l'oubli »==, art. 17), opposition, portabilité.

L'**article 85** prévoit des exemptions pour le traitement à des fins **journalistiques**, pour concilier protection des données et liberté d'expression.
`,
          pointsCles: [
            "Vie privée : art. 8 CEDH et art. 22 de la Constitution.",
            "Conflit vie privée et liberté d'expression : mise en balance, critère du débat d'intérêt général (Von Hannover, 2004).",
            "Droit à l'image : art. XI.174 CDE, consentement requis, distinct pour la prise et la diffusion.",
            "Exceptions : personnalité publique en fonction, événement d'actualité, personne accessoire.",
            "RGPD (2016/679), applicable depuis le 25 mai 2018 ; droit à l'oubli à l'article 17 ; exemption journalistique à l'article 85."
          ],
          definitions: [
            { terme: "Donnée à caractère personnel", def: "Toute information se rapportant à une personne physique identifiée ou identifiable." },
            { terme: "Principe de spécialité du consentement", def: "Un consentement donné pour un usage précis ne vaut pas pour un autre usage." },
            { terme: "Débat d'intérêt général", def: "Critère utilisé par la CEDH pour juger si une atteinte à la vie privée est justifiée par l'information du public." }
          ],
          fiches: [
            { q: "Quels textes protègent la vie privée ?", r: "Article 8 de la CEDH et article 22 de la Constitution belge." },
            { q: "Quel article fonde le droit à l'image en Belgique ?", r: "L'article XI.174 du Code de droit économique." },
            { q: "Le consentement pour la prise d'une photo vaut-il pour sa diffusion ?", r: "Non : les deux consentements sont distincts, et chacun vaut pour un usage précis." },
            { q: "Trois exceptions au consentement pour l'image ?", r: "Personnalité publique en fonction ; événement public ou d'actualité ; personne accessoire ou dans une foule." },
            { q: "Depuis quand le RGPD est-il applicable ?", r: "Depuis le 25 mai 2018 (règlement 2016/679)." },
            { q: "Quel article du RGPD consacre le droit à l'effacement ?", r: "L'article 17 (« droit à l'oubli »)." }
          ],
          quiz: [
            { q: "Le droit à l'image en Belgique est fondé sur :", choix: ["L'art. 10 CEDH", "L'art. XI.174 du Code de droit économique", "L'art. 150 de la Constitution", "Le RGPD uniquement"], bonne: 1, explication: "L'art. XI.174 CDE exige l'assentiment de la personne représentée." },
            { q: "Dans Von Hannover c. Allemagne (2004), le critère décisif est :", choix: ["La célébrité de la personne", "La contribution à un débat d'intérêt général", "La qualité des photos", "Le tirage du magazine"], bonne: 1, explication: "Les photos de la vie quotidienne ne contribuaient à aucun débat d'intérêt général." },
            { q: "Le RGPD est applicable depuis :", choix: ["1995", "2016", "25 mai 2018", "2020"], bonne: 2, explication: "Adopté en 2016, il est applicable depuis le 25 mai 2018." },
            { q: "Une personne photographiée seule et en gros plan lors d'une manifestation :", choix: ["N'a aucun droit", "Peut en principe s'opposer à une diffusion qui l'isole", "Doit payer pour être floutée", "Perd son droit à l'image"], bonne: 1, explication: "L'exception « événement public » vise les personnes non isolées ; un gros plan qui individualise la personne demande en principe son accord." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "eco",
      nom: "Introduction à l'économie",
      prof: "Prof. (exemple)",
      credits: 5,
      quadrimestre: "Q1",
      couleur: "#30b057",
      icone: "chart",
      examen: {
        date: "2027-01-18T09:00",
        type: "Écrit (QCM et exercices)",
        duree: "2 h",
        poids: "80 % (20 % de travaux pendant l'année)",
        lieu: "Auditoire (à confirmer)",
        consignes: [
          "QCM avec points négatifs pour les mauvaises réponses.",
          "Exercices de calcul : équilibre de marché et élasticité.",
          "Calculatrice non programmable autorisée."
        ]
      },
      fichiers: [],
      chapitres: [
        {
          id: "c1",
          titre: "Offre, demande et équilibre de marché",
          duree: 50,
          resume: `
## La demande
La **demande** est la quantité d'un bien que les acheteurs veulent et peuvent acheter à chaque prix. ==Loi de la demande== : toutes choses égales par ailleurs, quand le prix augmente, la quantité demandée diminue. La courbe de demande est donc **décroissante**.

## L'offre
L'**offre** est la quantité que les producteurs veulent vendre à chaque prix. Quand le prix augmente, produire devient plus rentable : la quantité offerte augmente. La courbe d'offre est **croissante**.

## Mouvement le long de la courbe ou déplacement de la courbe ?
| Ce qui change | Effet |
|---|---|
| Le **prix** du bien lui-même | Mouvement **le long** de la courbe |
| Le revenu, les goûts, le prix des autres biens, les attentes | **Déplacement** de la courbe de demande |
| Le coût de production, la technologie, le nombre de producteurs | **Déplacement** de la courbe d'offre |

> **Piège fréquent** : « le prix augmente, donc la demande baisse » est faux. C'est la **quantité demandée** qui baisse ; la demande (la courbe) ne bouge pas.

## L'équilibre
L'équilibre est atteint au prix où la quantité demandée est égale à la quantité offerte.

**Exemple** : demande Qd = 100 − 2P et offre Qs = 20 + 2P.
On pose 100 − 2P = 20 + 2P, donc 80 = 4P et **P\\* = 20 €**. On trouve **Q\\* = 60**.

- Au-dessus de P\\* : **excédent d'offre** (surplus), le prix tend à baisser.
- En dessous de P\\* : **excédent de demande** (pénurie), le prix tend à monter.

## L'élasticité-prix de la demande
Elle mesure la sensibilité de la quantité demandée au prix :

**Élasticité = variation en % de la quantité ÷ variation en % du prix**

Exemple : le prix passe de 2,00 € à 2,20 € (+10 %) et la quantité de 1 000 à 900 (−10 %). L'élasticité vaut −1 : la demande est **unitaire**.

| Valeur absolue | Demande | Exemple typique |
|---|---|---|
| Plus grande que 1 | Élastique | Biens de luxe, biens avec beaucoup de substituts |
| Égale à 1 | Unitaire | — |
| Plus petite que 1 | Inélastique | Biens de première nécessité, carburant, tabac |
`,
          pointsCles: [
            "Loi de la demande : prix en hausse, quantité demandée en baisse (courbe décroissante).",
            "Loi de l'offre : prix en hausse, quantité offerte en hausse (courbe croissante).",
            "Le prix du bien fait bouger le long de la courbe ; les autres facteurs déplacent la courbe.",
            "Équilibre : quantité demandée = quantité offerte. Au-dessus, surplus ; en dessous, pénurie.",
            "Élasticité-prix = variation % de la quantité ÷ variation % du prix. |e| > 1 : élastique ; |e| < 1 : inélastique."
          ],
          definitions: [
            { terme: "Toutes choses égales par ailleurs", def: "On étudie l'effet d'une variable en supposant que toutes les autres restent constantes (ceteris paribus)." },
            { terme: "Prix d'équilibre", def: "Prix auquel la quantité demandée égale la quantité offerte." },
            { terme: "Bien substituable", def: "Bien qui peut en remplacer un autre (thé et café) : si le prix de l'un monte, la demande de l'autre augmente." },
            { terme: "Bien complémentaire", def: "Bien consommé avec un autre (imprimante et encre) : si le prix de l'un monte, la demande de l'autre baisse." }
          ],
          fiches: [
            { q: "Énonce la loi de la demande.", r: "Toutes choses égales par ailleurs, quand le prix d'un bien augmente, la quantité demandée diminue." },
            { q: "Que provoque une hausse du revenu sur la demande d'un bien normal ?", r: "Un déplacement de la courbe de demande vers la droite." },
            { q: "Qd = 100 − 2P et Qs = 20 + 2P : quel est l'équilibre ?", r: "P* = 20 € et Q* = 60." },
            { q: "Que se passe-t-il si le prix est sous le prix d'équilibre ?", r: "Excédent de demande (pénurie) : le prix tend à monter." },
            { q: "Formule de l'élasticité-prix de la demande ?", r: "Variation en % de la quantité demandée ÷ variation en % du prix." },
            { q: "Une demande inélastique, c'est quoi ?", r: "Une demande peu sensible au prix : valeur absolue de l'élasticité inférieure à 1 (ex. carburant)." }
          ],
          quiz: [
            { q: "Une baisse du prix du café provoque, sur le marché du café :", choix: ["Un déplacement de la demande vers la droite", "Une hausse de la quantité demandée le long de la courbe", "Un déplacement de l'offre", "Aucun effet"], bonne: 1, explication: "Une variation du prix du bien lui-même fait bouger le long de la courbe." },
            { q: "Avec Qd = 100 − 2P et Qs = 20 + 2P, le prix d'équilibre vaut :", choix: ["10 €", "20 €", "30 €", "60 €"], bonne: 1, explication: "100 − 2P = 20 + 2P, donc 4P = 80 et P = 20." },
            { q: "Le prix passe de 10 € à 11 € et la quantité de 200 à 170. L'élasticité vaut :", choix: ["−0,5", "−1", "−1,5", "−3"], bonne: 2, explication: "Quantité : −15 %. Prix : +10 %. −15 ÷ 10 = −1,5 : demande élastique." },
            { q: "Une amélioration technologique dans la production de smartphones :", choix: ["Déplace l'offre vers la droite", "Déplace la demande vers la gauche", "Fait monter le prix d'équilibre", "Réduit la quantité échangée"], bonne: 0, explication: "Les coûts baissent, l'offre augmente : prix d'équilibre plus bas, quantité plus haute." },
            { q: "Le thé et le café sont des biens :", choix: ["Complémentaires", "Substituables", "Inférieurs", "Indépendants"], bonne: 1, explication: "L'un peut remplacer l'autre." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "semio",
      nom: "Sémiologie",
      prof: "Prof. (exemple)",
      credits: 4,
      quadrimestre: "Q1",
      couleur: "#ff9f0a",
      icone: "eye",
      examen: {
        date: "2027-01-22T09:00",
        type: "Écrit : analyse d'image",
        duree: "3 h",
        poids: "100 % de la note",
        lieu: "Auditoire (à confirmer)",
        consignes: [
          "Analyse sémiologique d'une publicité inconnue, avec la méthode de Barthes.",
          "Une question de théorie (Saussure ou Peirce).",
          "Structure attendue : description (dénotation), interprétation (connotation), rôle du texte (ancrage ou relais)."
        ]
      },
      fichiers: [],
      chapitres: [
        {
          id: "c1",
          titre: "Le signe : Saussure, Peirce, Barthes",
          duree: 40,
          resume: `
## Saussure : le signe à deux faces
Dans le *Cours de linguistique générale* (1916, publié après sa mort par ses élèves), Ferdinand de Saussure définit le **signe linguistique** comme l'union de deux faces :

- le **signifiant** : l'image acoustique, la forme (les sons « a-r-b-r »);
- le **signifié** : le concept, l'idée d'arbre.

Le lien entre les deux est ==arbitraire== : rien dans le mot « arbre » ne ressemble à un arbre. La preuve : chaque langue utilise un signifiant différent (*tree*, *Baum*, *boom*). Saussure imagine aussi une science générale des signes, la **sémiologie**.

## Peirce : trois types de signes
Le philosophe américain Charles Sanders Peirce classe les signes selon leur rapport à ce qu'ils représentent.

| Type | Rapport à l'objet | Exemple |
|---|---|---|
| **Icône** | Ressemblance | Un portrait, un pictogramme |
| **Indice** | Lien physique ou causal | La fumée pour le feu, une empreinte |
| **Symbole** | Convention | La colombe pour la paix, les mots |

## Barthes : dénotation et connotation
Roland Barthes applique la sémiologie à la culture de masse (*Mythologies*, 1957). Il distingue :

- la **dénotation** : le sens littéral, ce que l'image montre ;
- la **connotation** : les sens seconds, culturels, associés.

Dans « Rhétorique de l'image » (1964), il analyse une publicité **Panzani** (pâtes, tomates, filet à provisions) et dégage trois messages :

1. le **message linguistique** (le texte, la marque) ;
2. le **message iconique codé** : les connotations, comme l'« italianité » suggérée par les couleurs vert, blanc, rouge ;
3. le **message iconique non codé** : les objets reconnus littéralement.

Le texte a deux fonctions par rapport à l'image :
- **Ancrage** : il fixe le sens parmi tous les sens possibles (cas le plus fréquent en publicité).
- **Relais** : texte et image se complètent pour faire avancer le récit (bande dessinée).

> **Méthode d'examen** : 1) décrire ce qu'on voit (dénotation), 2) interpréter (connotations), 3) analyser le rôle du texte (ancrage ou relais), 4) conclure sur l'effet recherché.
`,
          pointsCles: [
            "Saussure (1916) : signe = signifiant (forme) + signifié (concept), lien arbitraire.",
            "Peirce : icône (ressemblance), indice (contiguïté, causalité), symbole (convention).",
            "Barthes : dénotation (sens littéral) et connotation (sens culturels).",
            "Rhétorique de l'image (1964), pub Panzani : message linguistique, iconique codé, iconique non codé.",
            "Fonctions du texte : ancrage (fixe le sens) et relais (complète l'image)."
          ],
          definitions: [
            { terme: "Signifiant", def: "La face matérielle du signe : sons, lettres, forme visuelle." },
            { terme: "Signifié", def: "La face conceptuelle du signe : l'idée évoquée." },
            { terme: "Arbitraire du signe", def: "Absence de lien naturel entre signifiant et signifié (Saussure)." },
            { terme: "Connotation", def: "Sens second, culturel ou affectif, qui s'ajoute au sens littéral (dénotation)." },
            { terme: "Ancrage", def: "Fonction du texte qui oriente la lecture d'une image vers un sens précis." }
          ],
          fiches: [
            { q: "Les deux faces du signe selon Saussure ?", r: "Le signifiant (forme) et le signifié (concept)." },
            { q: "Que signifie « l'arbitraire du signe » ?", r: "Il n'y a pas de lien naturel entre signifiant et signifié." },
            { q: "Les trois types de signes chez Peirce ?", r: "Icône (ressemblance), indice (lien causal ou physique), symbole (convention)." },
            { q: "La fumée qui signale un feu est :", r: "Un indice (lien de cause à effet)." },
            { q: "Dénotation contre connotation ?", r: "Dénotation : sens littéral. Connotation : sens seconds, culturels." },
            { q: "Les trois messages de la pub Panzani (Barthes, 1964) ?", r: "Message linguistique, message iconique codé (connoté), message iconique non codé (dénoté)." },
            { q: "Ancrage contre relais ?", r: "Ancrage : le texte fixe le sens de l'image. Relais : texte et image se complètent (BD)." }
          ],
          quiz: [
            { q: "Selon Saussure, le signifié est :", choix: ["Le son du mot", "Le concept", "L'objet réel", "Le contexte"], bonne: 1, explication: "Le signifié est la face conceptuelle ; l'objet réel est le référent." },
            { q: "Une empreinte de pas dans le sable est, chez Peirce :", choix: ["Une icône", "Un symbole", "Un indice", "Un signifiant"], bonne: 2, explication: "L'empreinte est liée physiquement à ce qui l'a produite." },
            { q: "L'« italianité » de la pub Panzani relève :", choix: ["De la dénotation", "De la connotation", "De l'ancrage", "Du relais"], bonne: 1, explication: "C'est un sens second, culturel, suggéré par les couleurs et les objets." },
            { q: "Dans une bande dessinée, les bulles jouent surtout un rôle :", choix: ["D'ancrage", "De relais", "D'indice", "De dénotation"], bonne: 1, explication: "Le texte et l'image font avancer ensemble le récit." },
            { q: "Le Cours de linguistique générale a été publié en :", choix: ["1857", "1916", "1957", "1964"], bonne: 1, explication: "En 1916, à titre posthume, par ses élèves." }
          ]
        }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "anglais",
      nom: "Anglais",
      prof: "Prof. (exemple)",
      credits: 3,
      quadrimestre: "Q1",
      couleur: "#ff375f",
      icone: "globe",
      examen: {
        date: "2027-01-26T10:00",
        type: "Écrit et oral",
        duree: "1 h 30 d'écrit, 10 min d'oral",
        poids: "60 % écrit, 40 % oral",
        lieu: "À confirmer",
        consignes: [
          "Écrit : compréhension d'un article de presse et rédaction de 250 mots.",
          "Oral : présentation d'un sujet d'actualité préparé."
        ]
      },
      fichiers: [],
      chapitres: []
    }
  ]
};

export default DEMO_COURSES;
