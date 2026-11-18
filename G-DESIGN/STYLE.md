# STYLE — Signal Guard · « Relief »

Validé par Gaia le 2026-11-18 (planche `planches/v3/03-relief.html`). **Verrouillé (/lock) le 2026-11-18** : plus d'exploration ; toute évolution passe par `/delta` dans ce style.
Desktop 1440 × 900 uniquement, sans aucune version ni mention mobile.

## 1. L'idée en une phrase

L'application est une salle blanche éclairée par le plafond. Les chiffres qui comptent (scores, statistiques) sont **sculptés au mur**, et les messages sont posés sur des **plaques au sol**. Ce qui est sûr reste en plâtre blanc et ne se lit que par son ombre. Ce qui est dangereux est en orange, et le feutre explique pourquoi.

## 2. Palette

| Rôle | Hex | Usage |
|---|---|---|
| Mur, haut | `#e6e4df` | dégradé vertical du mur |
| Mur, milieu / bas | `#dcdad4` / `#d0cdc6` | idem |
| Sol | `#c9c5bd` → `#e2dfd9` | dégradé, joints de dalles en perspective |
| Plinthe | `#f2f0eb` → `#d3d0c9` | ligne de 8 px entre le mur et le sol |
| Plaque (papier) | `#f6f5f1`, filet `#e3e0da` | cartes posées au sol |
| Encre | `#141414` | texte principal, bouton principal |
| Encre 2 / 3 | `#77756f` / `#a9a6a0` | texte secondaire, étiquettes |
| Texte mural | `#5f5d58` / `#8f8c85` | titres et sur-titres peints au mur |
| **Accent unique** | `#ee4f24` (face du relief `#f2582b`) | arnaque (score ≥ 70) et appel cloud, rien d'autre |
| Flancs du plâtre | `#e2e0da` → `#b2aea6` | extrusion des chiffres sûrs |
| Flancs de l'orange | `#d6401a` → `#8c240c` | extrusion des chiffres dangereux |

Règles :
- La couleur **est une donnée**. L'orange n'apparaît que pour un score ≥ 70 ou pour un trajet vers le cloud.
- Pas de vert ni de rouge plein : le risque bas se lit par l'**absence** de couleur, et le risque moyen par un orange à 50 % (relief en plâtre, feutre orange en pointillé).
- Jamais de fond orange plein. L'orange reste sur le relief, le trait de feutre, une étiquette ou le bouton d'action de la page Message.

## 3. Lumière et matière

- **Lampes** : des bandes blanches de 120 × 6 px au plafond, une par colonne de contenu. Chacune projette une flaque de lumière au mur (`radial-gradient 260 × 420`).
- **Grain** : bruit fractal en `multiply` à 60 % sur le mur.
- **Relief** : la lumière tombe du plafond, légèrement de gauche. L'extrusion compte 22 couches décalées de (+0,35 ; +0,9) px, du clair au sombre. L'ombre portée sur le mur est composée de deux couches floues (22 px et 60 px).
- **Boîtes en relief** (barres, panneaux fixés au mur) : même recette, avec une profondeur de 10 à 16.
- **Plaques** : papier, rayon de 3 px, ombre courte (`0 10px 24px -8px`).

## 4. Typographie

| Niveau | Police | Taille / interligne | Graisse | Approche |
|---|---|---|---|---|
| Relief (chiffres au mur) | Inter Tight | 232 px (page principale), 120 à 300 px ailleurs | 800 | −0,075 em |
| Titre mural | Inter Tight | 26 px | 500 | −0,03 em |
| Sur-titre mural | JetBrains Mono | 11 px | 500 | +0,32 em, capitales |
| Titre de plaque | Inter Tight | 15 px | 600 | −0,01 em |
| Texte de plaque | Inter Tight | 12,5 à 15 px / 1,45 | 400 | 0 |
| Métadonnées (latence, n°, niveau) | JetBrains Mono | 10 à 11 px | 500 | +0,14 em |
| Note au feutre | JetBrains Mono | 12 px / 1,5 | 500 | +0,02 em, orange |

Les deux polices sont sous licence OFL et embarquées en base64 dans chaque planche.

## 5. Grille

- Cadre de 1440 × 900 avec des marges latérales de 40 px. Le chrome (logo, navigation, actions) est à y = 26–40.
- La ligne de sol est à y = 660 par défaut. Elle descend jusqu'à 760 quand le mur doit porter plus de contenu.
- Colonnes de contenu : 4 × 330 px centrées sur x = 245 / 575 / 905 / 1235, avec une lampe au-dessus de chaque colonne.
- Les plaques mesurent 290 px de large et sont posées 24 px sous la plinthe.

## 6. Composants

- **Chiffre en relief** : le score ou la statistique. Il est en plâtre ou en orange selon l'état et ne porte jamais d'unité dans le relief (l'unité est peinte à côté, en mono).
- **Plaque message** : en-tête mono (n° · type · niveau), expéditeur, extrait et pied de page (latence locale, puis cloud ou « stayed here »).
- **Mots signalés** : soulignement orange de 2 px sur le mot exact repéré par le modèle local.
- **Feutre** :
  - un cercle autour d'un relief dangereux ;
  - une flèche vers le haut pour « up to the cloud » ;
  - un trait ondulé sous un appel à l'action ;
  - un cadre autour d'un domaine ;
  - une coche grise pour un message sain.
- **Boutons** en pilule : principal noir, secondaire translucide. L'orange plein est réservé à l'action qui sert l'utilisateur face à une arnaque (copier la réponse suggérée).
- **Badges LOCAL / CLOUD** : en texte mono, sans pastille. LOCAL est en encre 2, CLOUD en orange.

## 7. Mouvement

- **Montée du relief** : 900 ms, `cubic-bezier(.2,.8,.2,1)`, translation de 14 px vers le haut, avec un compteur de 0 au score ; décalage de 170 ms d'une colonne à l'autre.
- **Feutre** : chaque trait se dessine en 600 ms, `cubic-bezier(.5,0,.3,1)`, à partir de 1,2 s, à 160 ms d'intervalle.
- **Notes** : fondu de 400 ms après leur trait.
- **Aucun rebond, aucune boucle permanente**, sauf sur la page Paste : un balayage lumineux pendant l'analyse locale et une pulsation pendant l'attente du cloud.

## 8. États

| État | Relief | Feutre | Plaque |
|---|---|---|---|
| Sûr (< 35) | plâtre | coche grise | « stayed here » |
| Moyen (35 à 69) | plâtre | cercle orange en pointillé | « stayed here » |
| Dangereux (≥ 70) | orange | cercle et flèche vers le cloud | « cloud x s » en orange |
| Analyse locale en cours | plâtre à 40 %, compteur qui défile | — | balayage de lumière |
| En attente du cloud | orange | flèche en pointillé qui pulse | « asking the cloud… » |
| Hors ligne (heuristique locale) | plâtre ou orange selon l'heuristique | note grise « offline — local rules only » | sans ligne cloud |
