# DESIGN — journal (écrit par Claude, versions jamais écrasées)

## V1 — 2026-11-18 · exploration du style (étape B)

**Contexte** : la cible passe de l'app Android à l'app web Chrome desktop 1440 × 900 (IDEE R2). Le brief UI de `SPEC.md` §7 (Material 3, cloud en orange) est remplacé par `PROMPT-DESIGN.md` §5.

**Livré**
- `PAGES.md` : 4 pages proposées et 4 questions produit ouvertes.
- `REFS.md` : Vercel et Cron décodés (principes seulement).
- 3 planches de la page principale (Inbox), dans `planches/v1/` :
  - `01-instrument.html` : la direction de départ, avec un fond froid, des jauges en arc et une mono pour les scores.
  - `02-evidence.html` : un dossier de pièces à conviction, avec un fond anthracite chaud, des barres segmentées et le domaine mis en scellé.
  - `03-report.html` : un écart assumé, en rapport clair sur papier, avec une échelle graduée et une encre sombre.

**Décisions**
- On n'utilise que les 4 messages fictifs de `MainActivity.kt` ; les scores et latences sont des valeurs de démo plausibles (seuil 70, niveaux LOW < 35 ≤ MEDIUM < 70 ≤ HIGH).
- Le rouge ne sert qu'à la jauge et à la pastille de niveau, jamais à un fond plein.
- Les polices sont des piles système (aucune dépendance réseau), donc le rendu varie légèrement selon l'OS.
- Chaque planche contient un bouton « Replay scan » qui rejoue le remplissage des jauges, le moment signature de la vidéo.

**En attente** : la validation de Gaia (choix d'une direction et de `PAGES.md`).

**Retour de Gaia (2026-11-18)** : V1 rejetée en bloc. Les planches ressemblent à du « slop IA » : aucune identité visuelle, aucun travail des couleurs, des détails ni des motifs.

## V2 — 2026-11-18 · trois concepts d'identité (étape B, second tour)

**Diagnostic V1** : c'étaient trois gabarits de dashboard sans idée. On y trouvait des polices système, des puces arrondies, des cartes génériques, aucune marque, aucun motif propre au produit, et une couleur appliquée plutôt que construite.

**Méthode V2** : chaque direction part d'une vérité du produit, et en tire un motif dessiné, une marque, une palette et des détails.

- `planches/v2/01-intaglio.html` : l'**impression de sécurité**. L'anti-fraude a déjà un langage visuel, celui des billets, des chèques et des sceaux.
  - Motifs : un bandeau guilloché génératif, du micro-texte, des numéros de série (Nº SG-01) et des tampons perforés LOCAL et CLOUD.
  - Jauge : chaque message porte une rosace guillochée calculée à partir de son texte, encrée de la couleur du risque sur la fraction correspondant au score.
  - Pied de page : une règle graduée de 0 à 100 où les quatre messages sont repérés et où le seuil 70 est marqué.
  - Palette : papier `#ebe6da`, encre `#17282a`, guilloche `#7fa39b`, encres de risque (vert `#2c7552`, ocre `#b06f17`, vermillon `#ad3726`). L'accent unique est un bleu cobalt `#1d4d9c`, qui marque le cloud.
  - Typo : Instrument Serif pour le titre et les chiffres, Inter Tight pour l'interface, JetBrains Mono pour les séries.
- `planches/v2/02-proof.html` : l'**épreuve corrigée**. Le produit explique, donc les messages se lisent comme un texte annoté.
  - Marques au crayon dans le texte même : un cercle pour l'urgence, une ondulation pour l'appel à l'action, un cadre pour le domaine allongé.
  - Les lignes de rappel courent dans l'interligne jusqu'aux notes de marge.
  - Le cloud est le « crayon bleu » de l'éditeur : un crochet bleu « SENT TO CLOUD » encadre les messages concernés. C'est ce qui justifie l'accent cyan, assombri à `#1a95d1` pour rester lisible sur le papier.
  - Autres éléments : les tallies au crayon, une légende des marques, et à droite une règle de score avec le seuil en pointillé.
  - Typo : Newsreader pour la lecture, Instrument Serif pour l'affichage.
- `planches/v2/03-perimeter.html` : le **périmètre de l'appareil**, l'inférence hybride rendue spatiale.
  - Une ligne de périmètre pointillée et graduée coupe l'écran en deux : le ciel cloud au-dessus, l'appareil en dessous.
  - Seuls les messages signalés la franchissent, par une liaison montante cyan animée qui aboutit à un paquet « UPLINK ».
  - Chaque message a une signature d'onde, une barre par caractère, où les jetons signalés par le modèle local s'allument dans la couleur du risque.
  - Palette du brief (`#0f1216`, `#161b21`, `#e8edf2`, accent `#38bdf8`) ; typo Inter Tight 800 et JetBrains Mono.

**Décisions techniques**
- Les polices libres OFL sont embarquées en base64 (sous-ensembles latins woff2 de Google Fonts, avec l'accord de Gaia). Chaque fichier reste autonome et s'ouvre sans réseau.
- Les motifs sont générés en SVG par le script de la page : aucun asset externe.
- Un bouton « Replay scan » rejoue le moment signature de chaque planche : remplissage des rosaces, tracé au crayon, montée des ondes.
- Les données sont celles de la V1 ; seul le total de temps cloud de 2.59 s est dérivé (1.38 + 1.21).

**En attente** : la validation de Gaia.

**Retour de Gaia (2026-11-18)** : V2 rejetée elle aussi. C'est toujours du « slop IA » : matière, couleurs et motifs ne sont pas travaillés, et il n'y a pas d'identité visuelle. Gaia demande de partir des références de l'usine (`REFERENCES-DESIGN.md`) et rappelle la règle : desktop uniquement, aucun téléphone sauf si le hackathon l'exige.

## V3 — 2026-11-18 · matière et lumière (étape B, troisième tour)

**Diagnostic V2** : les concepts étaient là (sceau, épreuve, périmètre), mais tout restait plat : des traits vectoriels fins sur des aplats. Les références de l'usine ont toutes un **objet héros avec une matière et une lumière réelles**, et c'est ce qui manquait.

**Méthode** : un objet rendu en lumière réelle par planche, avec un shader WebGL écrit à la main (aucune bibliothèque, aucun réseau) ou une extrusion CSS éclairée. L'objet porte la donnée.

- `planches/v3/01-galets.html` (Flow, Dominic Burt, Noon) : chaque message est un galet éclairé par la gauche, avec son ombre portée à droite et du grain.
  - **La texture est le score** : lisse comme un galet de rivière quand le message est sain, hérissé d'arêtes quand c'est une arnaque.
  - L'orange `#ee4f24` est le seul accent et n'apparaît que sur les messages au-dessus du seuil.
  - Le titre a une seconde phrase grise ; l'action unique est un onglet noir vertical.
- `planches/v3/02-horizon.html` (Teko) : un astre sombre à sillons concentriques, dont le bord lumineux cyan est le périmètre de l'appareil.
  - Les messages signalés quittent leur ligne par un coude lumineux, franchissent le bord dans un éclat et montent jusqu'à leur paquet cloud.
  - Titre « Scored here. » en 128 px ; un seul mot en cyan.
- `planches/v3/03-relief.html` (Gapsy) : les quatre scores sont des chiffres sculptés au mur d'une salle en plâtre éclairée par le plafond.
  - Les messages sains sont en plâtre blanc, lisibles par leur seule ombre ; les arnaques sont en orange, entourées au feutre, avec une flèche vers le cloud.
  - Les messages sont posés sur des plaques au sol.

**Règle confirmée** : desktop 1440 uniquement, aucune maquette de téléphone.
**En attente** : la validation de Gaia.

**Retour de Gaia (2026-11-18)** : « le 3e est très bien ». **Le style Relief est validé.**

## V4 — 2026-11-18 · déclinaison Relief (étape C)

- `STYLE.md` formalise le style : palette avec hex, lumière et matière, échelle typo, grille, composants, mouvement et états.
- Toutes les planches partagent un même kit (mur, lampes, extrusion, plaques, feutre). Chaque planche reste un fichier autonome.
- `planches/relief/01-inbox.html` : la planche validée, inchangée (seul le cartouche change).
- `planches/relief/02-message.html` : le détail du message 01.
  - Le score 92 est en relief orange, entouré au feutre, avec une flèche vers l'explication au sol.
  - Le message est épinglé au mur comme une pièce à conviction, annoté au feutre sur les trois signaux locaux (urgence, appel à l'action, domaine allongé).
  - Le domaine est sculpté au mur, avec le « 1 » d'allongement en orange.
  - Au sol : l'explication du cloud (3 raisons) et la réponse suggérée, avec le bouton orange « Copy reply ».
- `planches/relief/03-paste.html` : l'état d'analyse.
  - La feuille collée au mur reçoit un balayage lumineux. Le score se sculpte à côté et vire à l'orange en franchissant 70.
  - Une flèche en pointillé qui pulse indique « asking the cloud… ».
  - Au sol : trois plaques d'étapes. Une note décrit le comportement hors ligne (règles locales uniquement).
- `planches/relief/04-dashboard.html` : la session.
  - Au mur, 4 statistiques en relief : 12 analyses locales, 03 appels cloud, 09 messages restés sur l'appareil et 184 ms de temps médian local.
  - Dessous, la répartition des niveaux en barres fixées au mur, avec le niveau moyen cerclé de pointillés.
  - Au sol : trois signalements.

**Textes et valeurs de démo à relire par Gaia** (non présents dans le dépôt) :
- Page Message : les 3 raisons de l'explication cloud et la réponse suggérée.
- Dashboard : la répartition 8 / 1 / 3. Les totaux 12 et 3 viennent de l'exemple d'`IDEE.md` ; les 9 messages restés sur l'appareil s'en déduisent ; 184 ms est la médiane des 4 latences de démo.
- Le troisième signalement du Dashboard est le message collé de la page Paste.

**Retour de Gaia (2026-11-18)** : les quatre planches Relief (Inbox, Message, Paste, Dashboard) sont validées. Toutes les pages ont leur planche validée : `/lock` est possible.

## LOCK — 2026-11-18

Style **Relief** verrouillé à la demande de Gaia. Les références sont `STYLE.md` et les planches de `planches/relief/`. `v1/`, `v2/` et `v3/` restent comme historique et ne sont jamais écrasés. Toute nouvelle page (par exemple la popup de l'extension Chrome, si elle est demandée) se dessine dans ce style, sans nouvelle exploration.

## opencode - Revue d'implémentation (07b, 2026-11-21)

Design Relief porté au produit web R2 (TypeScript + Vite), écran par écran.
Preuves : paires **planche | produit** 1440 × 900 dans `G-DESIGN/revue/`
(`01-inbox.png` … `04-dashboard.png`, gauche = planche, droite = produit,
produit en `?demo=1` : moteur hors-ligne déterministe, données réelles de
session, aucune requête réseau). Outil : `tools/make-review-captures.py`
(Chrome headless via Playwright, canal `chrome`). Vérification DOM + delta
pixels par page : delta moyen RGB 3-17 / 255, zéro erreur console
(`#view-inbox`, `#view-message`, `#view-paste`, `#view-dashboard`).

- **Inbox** (`revue/01-inbox.png`) : 1-1 avec la planche (chiffres en relief,
  plaques, feutre, montée du relief 900 ms + compteur). Écart volontaire :
  la ligne d'audit sous le titre (données mesurées, `PAGES.md` l'exige) et
  le seuil affiché dans le sur-titre — pas dans la planche.
- **Message** (`revue/02-message.png`) : score en relief à gauche, pièce à
  conviction épinglée (feutre : urgence cerclée, appel à l'action ondulé,
  domaine encadré), domaine sculpté au mur avec le chiffre d'allongement en
  orange, plaques « why » numérotées et réponse suggérée au sol. Écarts
  volontaires : pas de bouton « Report as scam » (aucun pipeline de
  signalement dans le produit — feature fantôme refusée) ; les raisons
  viennent du texte cloud réel (3 phrases), pas de texte codé en dur ;
  état « non flaggé » prévu par STYLE.md §8 (score plâtre, pas de flèche
  cloud) — la planche ne couvre que l'état flaggé.
- **Paste** (`revue/03-paste.png`) : feuille scotchée, balayage lumineux
  pendant la lecture locale, score en relief à droite, 3 plaques d'étapes
  (live/done/off), flèche cloud en pointillés qui pulse, note hors-ligne.
  Écarts volontaires : la latence affichée est mesurée (pas 196 ms figé) ;
  l'exemple prérempli de la planche sert de placeholder, pas de valeur ;
  le champ garde le texte collé au retour sur la page.
- **Dashboard** (`revue/04-dashboard.png`) : 4 statistiques en relief,
  barres de répartition en boîtes en relief, cercle orange sur les appels
  cloud, cercle pointillé sur la barre medium, coche grise sur « never
  left », 3 plaques de signalements. Écarts volontaires : **les valeurs
  sont celles de la session réelle** (12 analyses fictives de la planche →
  compteur live : 4 analyses au scan + 1 collé = 5 local, 2-3 cloud) ;
  état vide prévu (aucune analyse → note « run Score the inbox ») ; les
  latences sont les médianes mesurées, pas 184 ms figé.

Constats d'implémentation remontés au produit (hors design) :
- pointes de flèches de l'Inbox : attribut `d` SVG invalide depuis le
  scaffold (pas de `M` initial) — corrigé, les flèches se dessinent enfin ;
- mur (`--floor`), lampes et ligne de sol devenus des paramètres par vue,
  comme dans chaque planche (660 px Inbox, 700 px ailleurs).

Gates : tests 30/30 vitest, typecheck propre, build OK, check-limits 0.
