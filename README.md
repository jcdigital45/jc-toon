# JC Toon

Le moteur de courts dessins animés de **JC Digital** : des personnages 2D africains dans un monde 3D coloré et encré, avec une musique afro et des bruitages synthétisés. Vidéo verticale 1080x1920, prête pour YouTube Shorts, TikTok et Reels.

Tout le code est original et écrit pour JC Toon : personnages, monde 3D, encre, flou, caméras, musique, bruitages, mixage et minutage de la voix. Seules dépendances : [three.js](https://threejs.org) et [Playwright](https://playwright.dev), sous licence MIT.

## Ce que ça fait
1. Propose 10 idées d'histoires (dont des histoires d'Afrique), écrit le script en français.
2. Tu enregistres la voix off.
3. Le skill cale l'image sur ta voix, construit le décor, anime les personnages, compose la musique, place les bruitages et livre le MP4 fini.

## Installation (skill Claude)
```bash
git clone https://github.com/jcdigital45/jc-toon.git ~/.claude/skills/jc-toon
cd ~/.claude/skills/jc-toon && npm install
```
Prérequis : Node 22+, Python 3 avec numpy, scipy et Pillow, ffmpeg, un Chromium pour Playwright (`npx playwright install chromium`).
Puis dans Claude : *« Utilise JC Toon et fais-moi un dessin animé sur … »*.

## Contenu
| Dossier | Rôle |
|---|---|
| `SKILL.md` | La méthode complète pour Claude |
| `web/personnages.js` | Bibliothèque de dessin des personnages (têtes, yeux, 14 expressions, poses, tenues wax, coiffes) |
| `web/troupe.js` | 10 personnages prêts : Papa Moussa, Maman Awa, Ibrahim, Fatou, Koffi, Serge, Aminata, Junior, le tirailleur, Maman Ngono |
| `web/moteur.js` | Rendu 3D toon, cartes de personnages, encre, étalonnage, flou de profondeur |
| `web/peinture.js` | Textures peintes : latérite, herbe, banco, chaume, tôle, bois, écorce, feuillage, wax, enseignes |
| `web/mouvement.js` | Courbes, caméras, clignements, marche |
| `web/histoires/test.js` | Scène d'exemple : un matin au marché du village |
| `son/` | Instruments (djembé, doum, cloche, balafon, kora…), musique 12/8, bruitages, mixage |
| `minutage.py` | Cale le script sur la voix off (syllabes françaises) |
| `rendu.mjs`, `finition.sh` | Rendu des images, assemblage et contrôle qualité |

## Essai rapide
```bash
LARG=540 node rendu.mjs test out/fixes "20,140,200,285"
python3 planche_images.py out/fixes out/planche.jpg 4 400
node capture.mjs planche.html out/troupe.png
cd son && python3 demo.py ../out/demo_son.wav
```

## Licence
MIT © 2026 JC Digital. Tu peux utiliser, modifier et vendre les vidéos créées avec JC Toon.

Chaîne YouTube : [JC Digital (@JCTECH2)](https://www.youtube.com/@JCTECH2)
