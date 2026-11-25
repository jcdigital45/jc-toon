---
name: jc-toon
description: Crée un court dessin animé vertical en français (style JC Toon : personnages 2D africains dans un monde 3D encré) à partir d'une idée, d'un script ou d'une voix off, avec musique afro et bruitages synthétisés. MP4 1080x1920 fini.
---

# JC Toon : idée → script → voix off → dessin animé fini

JC Toon est le moteur de dessins animés de **JC Digital**, écrit entièrement par nous (aucun code tiers à part three.js et Playwright, sous licence MIT).
Le style : personnages 2D à tête en forme de galet, grands yeux avec reflet, contour brun-noir plus épais côté ombre, tissus wax, dans un monde 3D coloré (latérite, cases en banco, chaume, baobabs, marchés) avec contours à l'encre, flou de profondeur et caméras qui glissent.
Vidéo verticale 1080x1920, 30 images/s, d'exactement la durée de la voix off. Musique afro 12/8 et bruitages synthétisés, à 50 % du niveau de la voix.

**Langue** : tout en français (idées, script, messages, plan, textes du décor). Public : francophones d'Afrique de l'Ouest et centrale en priorité.

## Mise en place (une fois par session)
Le code vit dans le dépôt GitHub du skill. Si `web/moteur.js` n'est pas à côté de ce SKILL.md :
```bash
git clone --depth 1 https://github.com/jcdigital45/jc-toon.git ~/jc-toon && cd ~/jc-toon && npm install
```
Prérequis : Node 22+, Python 3 avec numpy + scipy + Pillow, ffmpeg, un Chromium pour Playwright.
- Si `PLAYWRIGHT_BROWSERS_PATH` existe déjà (navigateurs préinstallés), installer la version de `playwright-core` qui correspond à ces navigateurs.
- Sinon : `npx playwright install chromium`.
- Le rendu se fait en WebGL logiciel (SwiftShader) : aucune carte graphique nécessaire. Environ 1 s par image en 720 px de large, 2 à 4 s en 1080.

Chaque nouveau dessin animé = un nouveau fichier `web/histoires/<nom>.js` (copier `web/histoires/test.js`), une bande son dans `son/`, et un dossier `out/<nom>/`.

## Règles
- Histoires, personnages et plans toujours originaux. Ne jamais recopier la vidéo d'un autre créateur.
- Pas de personne réelle vivante comme personnage, pas de mascotte ni de logo de marque. Les figures historiques décédées sont permises.
- Pas de sous-titres sauf demande. Le texte du décor (enseignes, inscriptions) est en français, lisible, jamais en miroir.
- Ne jamais modifier la voix. L'image est calée sur elle : chaque réaction visuelle arrive 0 à 3 images avant son mot.
- Niveaux : musique à −6 dB du volume de la voix, bruitages à −6 dB avec crêtes plafonnées. Toujours mixer avec `son/mix.py`.
- Liste de tâches visible. Envoyer une planche d'images fixes avant le long rendu.

## Étape 1 : point de départ
Si une voix off est jointe, aller à l'étape 4. Sinon demander : **« Tu pars d'où ? »**
- **Ma voix off est prête** : la demander, avec le texte du script.
- **J'ai un script** : le resserrer (étape 3) et donner les conseils d'enregistrement.
- **Il me faut des idées** : étape 2.
Demander la durée visée si elle manque (20-30 s par défaut, 45-60 s possible).

## Étape 2 : 10 idées
10 idées numérotées, réponse par numéro. Pour chacune : **titre** (5-8 mots qui donnent envie), **phrase d'accroche** (un paradoxe dit comme un fait), **retournement** (la chute en une ligne), **pourquoi ça s'anime bien** (2-3 moments visuels), **vrai ou légende**.
- Au moins 4 histoires d'Afrique à chaque fois (empires du Mali, du Ghana, Songhaï, royaumes bamiléké, bamoun, Kongo, Dahomey ; inventeurs, bâtisseurs, résistants, contes), plus le monde francophone et le reste du monde.
- Vérifier les faits par une recherche web. Une légende se présente comme « la légende raconte que… ».
- Rien de choquant ni de politique, pas de personne vivante tournée en dérision.

## Étape 3 : le script
Narration seule, ~3 mots/s pour une voix dynamique (20 s ≈ 60 mots, 30 s ≈ 90, 60 s ≈ 180). Une voix lente ou grave : ~2,4 mots/s.
Structure : **accroche** (sans intro) → **décor** (quand, où, qui) → **escalade** en 2-4 temps → **bascule** (« Mais… », « En fait… », avec une comparaison du quotidien) → **chute** ironique en derniers mots.
Français parlé : phrases de 8-15 mots, nombres en toutes lettres, passé composé et présent de narration, pas d'expressions trop franco-françaises. Ne jamais décrire ce que le spectateur voit déjà.
Répondre avec : le script (bloc copiable, nombre de mots, durée estimée), le plan visuel en un paragraphe, les conseils d'enregistrement (une seule voix chaleureuse, pièce calme, pauses en fin de phrase, sans musique ; ElevenLabs multilingue vitesse 1,05-1,1 convient), et : **« Envoie-moi la voix off quand elle est prête et je fais la vidéo complète. »**

## Étape 4 : construire la vidéo (après réception de la voix)
Tout faire sans s'arrêter ; une question seulement si le minutage est impossible.

### 4.1 Minutage
`python3 minutage.py voix.mp3 script.txt --sortie out/<nom>/travail` → `phrases.json`, `mots.json` (secondes + images).
Comptage de syllabes français (e muet, -ent des verbes, élisions, é en hiatus). Vérifier que les fins de phrase tombent sur les pauses. Nombre d'images = round(durée × 30).
Sans script, le demander : Claude ne peut pas écouter l'audio.

### 4.2 Plan de tournage (`out/<nom>/PLAN.md` avant le code)
Une ligne par plan : images, mots, décor, lumière, caméra, personnages (pose, visage), effets, bruitages.
- L'image 0 est déjà l'accroche. En général un plan par phrase.
- Varier les valeurs : gros plan d'accroche → plan large de révélation → plan à deux → insert sur l'objet clé → réaction → mouvement final.
- Lumières : `jour` (normal), `dore` (drame, déclin), `nuit` (explication, mystère), `aube` (espoir). Saut dans le temps = flash blanc de 6 images (`flash` ≤ 0,9).
- Retournement : la musique s'arrête (`arret`), sting, poussée avant avec roulis.
- Moments tristes : jamais moqués ; on suit l'objet qui tombe et la personne sort du cadre.
- Costumes et décors fidèles au lieu et à l'époque.

### 4.3 L'histoire (`web/histoires/<nom>.js`)
Un module qui exporte :
- `DUREE` (en images) ;
- `construire(M)` : bâtit le monde une seule fois avec les outils du moteur ;
- `etat(f)` : fonction pure du numéro d'image qui renvoie
  `{ camera: { pos, cible, fov, roulis }, lumiere, centre, acteurs: [...], effets: [...], flou: { focus, force }, flash }`.

Outils du moteur (`M`) : `toon({ couleur, toile, cle, metresParMotif, double })`, `boite(l, h, p, mat, { x, y, z, ry })`, `cylindre(rHaut, rBas, h, mat, o)`, `cone(r, h, mat, o)`, `boule(r, mat, { sy })`, `facettes(r, mat, o)` (rochers), `sol(taille, mat, o)`, `panneau(l, h, toile, o)` (enseigne toujours lisible), `THREE`. Les objets posés au sol ont leur base à y = 0.
Textures peintes (`peinture.js`) : `laterite`, `herbe`, `banco`, `chaume`, `tole`, `planches`, `ecorce`, `feuillage`, `tissu({ type, c })`, `enseigne(texte, fond, encre)`. En ajouter dans le même style : aplats + joints sombres.

Acteurs : `{ id, def, x, z, y?, pose, echelle?, miroir?, penche?, rapproche?, visible? }`
- `def` : un personnage de `troupe.js` (Papa Moussa, Maman Awa, Ibrahim, Fatou, Koffi, Serge, Aminata, Junior, le tirailleur, Maman Ngono) ou un nouveau.
- `pose` : `{ brasG, brasD, visage, regard: [x, y], inclinaison, marche (phase) ou null, cligne, anim }`.
- Bras : repos, ecarte, hanches, montre, montreHaut, leve, salut, porte, croise, pouce, tete, menton, offre, coeur, tient, marche (ou `[angle, coude]` en degrés).
- Visages : neutre, sourire, rire, surpris, choque, triste, colere, peur, malin, dort, decide, doute, fier, pleure.
- Toujours vivant : `cligne(f, graine)`, `vie(f, graine).incl` pour l'inclinaison, `phasePas(distance)` pour la marche. Arrondir les valeurs (`arrondi`) pour ne redessiner la carte que si quelque chose change.
- `rapproche` (mètres) : avance la carte vers la caméra quand elle touche un mur (0,3 à 0,9).

Nouveaux personnages (`troupe.js`) : `{ nom, role, peau (PEAUX.*), gabarit (adulte | fort | mince | enfant), coupe (rase | afro | tresses), cheveux, blanc, barbe ("blanche" ou couleur), barbeLongue, moustache, coiffe (foulard | kufi | chechia | casquette | paille), coiffeCouleur, coiffeWax, coiffeBrod, charge ("bassine"), tenue: { type (boubou | robe | jupe | chemise), haut, waxHaut, wax, bas ("short"), couleurBas, manches (courtes | longues | larges), col (chemise | rond), brod, liseré, ceinture, poches, bandes, logo, chaussures (sandales | pieds | baskets | couleur) }, accessoire (canne | houe | telephone | cartable | fusil | livre), mainAccessoire ("g" | "d") }`.
Nouveaux vêtements, coiffes, accessoires : les dessiner dans `personnages.js`, dans le même style (fonction `forme` = contour épais côté ombre + croissant d'ombre). Vérifier avec la planche : `node capture.mjs planche.html out/planche.png`.

Effets 2D : `{ type: poussiere | etoile | coeur | goutte | zzz | choc | point | question, x, y, z, taille, rot }`.

Caméra (`mouvement.js`) : `camera(cles, f, { secousses })` avec des clés `{ f, pos, cible, fov, roulis, courbe: lisse | sortie | rebond | coupe, passage: [...] }`, ou calcul direct dans `etat(f)` avec `tresLisse`, `sortie`, `mel3`.
- Glissements de 18 à 45 images ; jamais immobile 4 images ou plus (poussée lente permanente).
- Secousses de 7 images sur les impacts ; roulis de 3-5° sur le drame.
- Flou : `{ focus: distance au visage, force: 8-14 }` sur gros plans et plans moyens ; 0 sur les plans larges.

### 4.4 Contrôle visuel
`LARG=540 node rendu.mjs <nom> out/<nom>/fixes "5,40,90,..."` (milieu de chaque plan + moments clés) puis `python3 planche_images.py out/<nom>/fixes out/<nom>/planche.jpg 4 400`. Regarder la planche et corriger :
- cadre vertical étroit : à 4 m avec fov 40, la largeur visible n'est que de ±0,8 m → échelonner les personnages en profondeur ;
- objets devant les visages, caméra dans un mur ou un arbre, premier plan à moins de 2 m ;
- grandes ombres sans objet visible (déplacer le soleil : `az` dans `LUMIERES`) ;
- texte en miroir, personnage coupé, geste hors cadre.
Envoyer la planche à l'utilisateur avec un résumé des plans, puis lancer le rendu.

### 4.5 Le son
Écrire `son/<nom>.py` sur le modèle de `son/audio_test.py` : `composer(duree, tempo, tonique, ambiance, arret)` (ambiances : `marche`, `conte`, `suspense`) + bruitages posés aux images des événements (`bruitages.py` : whoosh, impact, fracas, ting, sting, pop, pas, course, craquement, eclaboussure, eau, vent, oiseaux, grillons, foule, rire_foule, applaudissements, porte, coq, moto, cloche_ecole, zzz, tambour_roulement).
Écrire `musique.wav` et `bruitages.wav` séparément, puis : `python3 son/mix.py voix.mp3 musique.wav bruitages.wav mix.wav`. Vérifier l'affichage : musique −6,0 dB, bruitages ≤ −6 dB, mix −14 LUFS.
Figer le minutage de l'image avant le son : tout changement de minutage oblige à refaire le son.

### 4.6 Rendu et finition
- Rendu en arrière-plan avec reprise : `for i in 1 2 3 4 5 6; do RESUME=1 LARG=1080 node rendu.mjs <nom> out/<nom>/images "0-<N-1>" && break; done`. Rester dans le tour jusqu'à la fin (attentes de ≤ 10 min qui affichent le nombre d'images).
- Après correction d'un plan, supprimer seulement ses images et relancer avec `RESUME=1`.
- `bash finition.sh out/<nom>/images out/<nom>/mix.wav out/<nom>/<nom>.mp4 "Titre"` : encodage H.264, détection d'images noires et de passages figés (≥ 0,4 s), volume, planche de contrôle. Corriger tout passage figé (ajouter une poussée de caméra) et re-rendre ses images.
- Livrer le MP4 avec SendUserFile et une ligne par plan. Proposer des sous-titres, des retouches ou l'idée suivante.

## Pièges connus du moteur
- La passe d'encre lit une cible normale + distance : monde = (normale, distance), cartes = (0, −distance), ciel = 0. Les cartes ne sont jamais encrées par le monde (elles ont leur propre contour).
- L'encre ne se pose que du côté proche d'un saut de profondeur (dérivée seconde de 1/z, nulle sur tout plan) : pas de fausses lignes sur un sol rasant.
- Le flou ne laisse pas l'arrière-plan baver sur un premier plan net.
- Les textures de canvas sont en sRGB (`colorSpace`), les cibles intermédiaires en linéaire ; seule la dernière passe convertit pour l'écran.
- Les cartes ne sont redessinées que si leur clé (définition + pose) change : arrondir les valeurs animées.
- Le soleil se règle par préréglage (`az`, `el`) ; la caméra d'ombre suit `centre` (±22 m).
