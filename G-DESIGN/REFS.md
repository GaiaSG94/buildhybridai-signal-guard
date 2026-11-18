# REFS — ce qu'on retient (principes uniquement)

Ouvertes le 2026-11-18 dans Chrome desktop, mode clair et mode sombre.

## Vercel — vercel.com

Constaté :
- En mode sombre, le fond est noir pur, le texte presque blanc (~#ededed) et les filets sont du blanc à 14 % d'opacité, partout, à 1 px. La structure repose sur les filets, pas sur des ombres.
- Le titre est une grotesque à graisse **régulière** (400, pas bold), de très grande taille (64 px) avec un interlignage de 1,0 et un **approche fortement négative** (-6 %). La hiérarchie vient de la taille, pas de la graisse.
- Une mono est associée à la grotesque pour tout ce qui est technique.
- La lumière est rare et ponctuelle : quelques halos discrets derrière les visuels de produit, jamais sur le texte.

On garde : les filets à faible opacité comme seule structure, l'approche négative sur les titres en graisse moyenne, le couple grotesque + mono, le peu de lumière.
On ne prend pas : le noir pur (on reste sur `#0f1216`, moins dur en vidéo), ni aucun layout, asset ou texte.

## Cron — cron.com (redirige vers « Notion Calendar »)

Constaté :
- Le fond est un **anthracite chaud** (`rgb(22,20,18)`) et non un noir froid ; le texte est gris clair (#ccc), pas blanc.
- La donnée est en **petite taille et dense** : grille horaire, petits chiffres gris, filets très fins. La couleur n'arrive que sur les données (blocs d'événements colorés en aplats sourds), et un seul accent vif marque « maintenant ».
- Le titre est en grande taille, bold et serré (-3 px), en Helvetica.

On garde : la couleur réservée aux données, un seul repère vif pour « l'état courant », des chiffres petits mais précis alignés en colonnes (tabulaires), des aplats sourds plutôt que saturés.
On ne prend pas : l'orange de marque, la grille calendrier, aucun layout.

---

## V3 — références de l'usine (`hackatons-pipeline/REFERENCES-DESIGN.md`), ouvertes le 2026-11-18 en 1440 × 900

À la demande de Gaia, les 11 références fixées de l'usine remplacent Vercel et Cron comme base.
Deux d'entre elles ne sont plus en ligne : **Igloo** (iglooinc.com, domaine parqué) et **NexusGPT** (gptnexus.com, domaine à vendre). Je ne les cite donc pas.
Raben Rifaie (rabenrifaie.com) n'a pas fini de charger sa scène 3D dans le navigateur intégré : je ne la cite pas non plus.

| Réf. | Constaté | Ce qu'on en prend pour Signal Guard |
|---|---|---|
| **Flow Computing** | Un relief blanc et doux, éclairé par la gauche avec l'ombre à droite ; un titre noir dont la seconde phrase est grise ; la seule action est un onglet noir vertical au bord droit. | V3-01 : chaque galet est éclairé par la gauche avec son ombre à droite, le titre a une seconde phrase grise, et l'action unique est un onglet vertical. |
| **Dominic Burt** | Une sculpture crème granuleuse ; une linéale serrée ; le tiret long comme signe (D—B). | V3-01 : la matière granuleuse des galets, le grain du fond et le tiret long dans le logotype (Signal——Guard) et les lignes de trajet. |
| **Teko** | Une courbe lumineuse qui monte du bas d'une page noire comme un horizon, avec une texture fine d'anneaux et du grain ; un seul mot repris en couleur. | V3-02 : l'horizon d'un astre sombre sert de périmètre de l'appareil, avec des sillons concentriques et du grain. Un seul mot est en cyan (« up there »). |
| **Noon** | Aujourd'hui sur fond clair (la fiche de l'usine le décrit sombre) : un accent unique, orange chaud en dégradé, porté par deux mots du titre et par le bouton principal. | V3-01 et V3-03 : un orange chaud (`#ef5a24` et `#ee4f24`) est le seul accent, réservé aux arnaques. |
| **Gapsy Studio** | Des lettres en relief fixées au mur d'une salle blanche éclairée par le plafond, avec des griffonnages à la main par-dessus. | V3-03 : les scores deviennent des chiffres sculptés sur un mur en plâtre, sous des lampes de plafond, avec des cercles et des flèches au feutre. |
| **LogoPoint** | Un objet 3D brillant posé au centre d'un panneau ; colonne de gauche sombre, sobre et numérotée. | Principe : un objet héros par écran, l'interface s'efface autour. |
| **Concept Studio** | Un mot géant en flat noir sur fond blanc, très peu d'éléments. | Principe : la typographie comme image (le titre de V3-02, « Scored here. »). |
| **D.FY** | Fond sombre, une grande capitale large en tête. | Principe : une typographie qui occupe le cadre. |
