# Visuels de fiche — ce que font les autres, et ce qu'on en retient

Relevé fait le 3 novembre 2026 sur les fiches françaises. Les visuels sont dans
`captures-reference/<app>/{ios,android}/`, et les deux PDF de travail sont
`references-apple.pdf` et `references-android.pdf`.

---

## 1. Les contraintes des deux magasins

| | App Store | Google Play |
|---|---|---|
| Nombre | jusqu'à **10** | jusqu'à **8** (minimum 2, 4 conseillés) |
| Taille | **1290 × 2796** (6,9") ou 1320 × 2868 | **1080 × 1920**, côtés entre 320 et 3840 px |
| Rapport | le format iPhone, très allongé | **9:16 ou 16:9**, jamais plus de 2:1 |
| Format | PNG ou JPEG | PNG ou JPEG 24 bits, 8 Mo max par image |
| Visibles sans faire défiler | les **3 premiers** (1 à 2 dans les résultats de recherche) | les **3 à 4 premiers** |
| En plus | — | une **image mise en avant 1024 × 500** obligatoire |
| Règle de contenu | **2.3.3** : les visuels doivent montrer l'app en fonctionnement | pas de contenu trompeur, pas de « classé n°1 » non prouvé |
| Test | pas d'A/B natif | **tests de fiche A/B** intégrés à la console |

**Conséquence directe : le 1290 × 2796 de l'App Store est refusé par Play**
(rapport 2,17:1). Il faut deux séries, pas une.

---

## 2. App par app

### Cal AI — *Calorie Tracker* (6 visuels iOS, 5 Play)
- Fond **blanc**, titre noir centré en haut, **2 à 4 mots**, à l'impératif :
  « Prenez une photo », « Voir les calories », « Suivez vos progrès ».
- Un seul téléphone, droit, **châssis complet** avec l'heure 9:41.
- Visuel 1 = logo + nom, pas de titre. Dernier = **Avant / Après** (la preuve).
- iOS et Play : **les mêmes visuels**, seuls changent la langue et le châssis
  (encoche iPhone contre barre Android).

### Compteur de calories AI — *Azumio* (6 iOS, 5 Play)
- iOS : fond blanc, **titre + sous-titre** (deux niveaux), téléphones penchés et
  superposés, photos de plats, pastille verte « 99.9 % Accuracy ».
- Play : **une autre série**, plus ancienne, bandeau orange, texte anglais.
- À retenir surtout comme **contre-exemple** : les deux canaux ne racontent pas
  la même chose, la fiche Play a l'air abandonnée.

### Kwit — *Arrêter de fumer* (10 iOS, 8 Play) · le concurrent direct
- iOS : un **fond pastel différent par visuel**, titre où le verbe est surligné
  au marqueur de couleur — « **Identifiez** vos envies de fumer ».
- Visuel 1 = **crédibilité** : « Application recommandée par l'OMS », « App du jour ».
- Visuel 9 = **les chiffres** : 2 491 €, 17 556 litres, 4 745 cigarettes.
- Visuel 10 = **avis clients** 5 étoiles, recopiés en toutes lettres.
- La mascotte apparaît dans presque tous les visuels.
- Play : titres **plus gros**, téléphones penchés et **sans châssis**, texte
  parfois en bas. Même histoire, mise en page refaite pour le canal.

### Option Zéro — *Addiction alcool* (6 iOS, 6 Play) · santé publique
- Fond violet uni, titre blanc centré, téléphone avec châssis.
- Visuel 1 = logo + **note 4,7 / +1 300 avis** + « Parcours guidé 100 % anonyme ».
- Dernier visuel = **aucune capture** : un texte institutionnel et les logos
  ARS, Ministères, MILDECA, CaPASSCité.
- iOS et Play : **strictement identiques**.

### Duolingo (8 iOS, 8 Play)
- **Une couleur pleine par visuel** (orange, bleu, violet, jaune, rouge, vert…),
  titre blanc **en minuscules**, capture **sans châssis**, coupée en bas.
- La série forme un dégradé de couleurs quand on la fait défiler.
- iOS et Play : identiques au cadrage près.

### Tinder (10 iOS, 8 Play)
- Registre **éditorial** : titre en serif italique, photos pleine page, la
  capture est fondue dans la photo. Pas de téléphone.
- Visuel 1 = logo sur une photo. L'interface arrive en second.

### Bumble (7 iOS, 7 Play)
- **Jaune de marque**, photos noir et blanc de vrais couples avec leur histoire
  (« Leslie et Thomas · Match sur Bumble en 2021 · Fiancés en 2025 »).
- Les écrans sont posés en **cartes**, pas en téléphones.
- iOS et Play : identiques.

---

## 3. Les règles qui reviennent partout

1. **Un visuel = une idée.** Jamais deux messages dans la même image.
2. **Le titre se lit en vignette.** 2 à 6 mots, gros, en haut, fort contraste.
   C'est le titre qui porte le message, pas la capture.
3. **Les trois premiers visuels font le travail.** Ce sont les seuls vus sans
   faire défiler : promesse, preuve, mécanisme.
4. **Un gabarit unique, répété.** Même position de titre, même taille de
   téléphone, même marge, d'un visuel à l'autre. La variation se fait sur la
   couleur, pas sur la mise en page.
5. **La capture est réelle et peuplée.** Des données crédibles, jamais un écran
   vide ni des données de test.
6. **On termine par la preuve** : chiffres cumulés, avis clients, avant/après,
   logos institutionnels. Kwit, Option Zéro et Cal AI le font tous les trois.
7. **La crédibilité se place au début** quand on l'a (OMS, note, nombre d'avis).
8. **Play n'est pas une copie d'écran d'iOS.** Même histoire, mais recadrée en
   9:16, titres plus gros, châssis souvent supprimé.

---

## 4. Ce que ça donne pour Stopklop

- **Deux séries** : 10 visuels en 1290 × 2796 pour Apple, 8 en 1080 × 1920 pour Play.
- Les illustrations existantes tiennent déjà la règle 1, 2 et 4 : titre court en
  haut, gabarit identique, une idée par image. Il leur manque la capture réelle.
- Ordre à viser, d'après ce que font Kwit et Option Zéro :
  1. la promesse (Arrêtez de fumer) + la preuve sociale quand on l'aura
  2. le plan : 5 → 0
  3. l'argent : 4 497 € en un an
  4. les déclencheurs
  5. le suivi quotidien
  6. les statistiques sur un an
  7. la santé
  8. les avis clients (à ajouter dès qu'il y en a)
- Ce qui nous manque par rapport à eux : **une mascotte présente partout**
  (Klop n'apparaît que dans l'app) et **des avis à citer**.
