#!/usr/bin/env python3
"""JC Toon — planche contact : python3 planche_images.py <dossier> <sortie.jpg> [colonnes] [largeur_vignette]"""
import sys, glob, os
from PIL import Image, ImageDraw
d, sortie = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 4
lv = int(sys.argv[4]) if len(sys.argv) > 4 else 360
fichiers = sorted(glob.glob(os.path.join(d, "*.jpg")))
hv = int(lv * 16 / 9); lignes = (len(fichiers) + cols - 1) // cols
out = Image.new("RGB", (cols * lv, lignes * (hv + 26)), "#1a1a1a"); dr = ImageDraw.Draw(out)
for i, f in enumerate(fichiers):
    x, y = (i % cols) * lv, (i // cols) * (hv + 26)
    out.paste(Image.open(f).resize((lv, hv)), (x, y)); dr.text((x + 6, y + hv + 6), os.path.basename(f), fill="#ffffff")
out.save(sortie, quality=90)
