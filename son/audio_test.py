#!/usr/bin/env python3
"""Bande son de la scène test (10 s, sans voix) : musique « marche » + bruitages calés sur les images.
python3 audio_test.py sortie.wav"""
import sys
import numpy as np
from base import SR, poser, stereo, ecrire_wav, lufs, limiteur
from musique import composer
import bruitages as B

DUREE = 10.0
im = lambda f: f / 30.0
mus = composer(DUREE, 104, 62, "marche", graine=4)
sfx = np.zeros((int(DUREE * SR), 2))
poser(sfx, stereo(B.oiseaux(DUREE, 0.8), 0.3), 0)
poser(sfx, stereo(B.foule(DUREE, 0.35), -0.2), 0)
for f in range(4, 150, 14): poser(sfx, stereo(B.pas("terre", 0.7), 0.1), im(f))          # pas d'Awa (au rythme de la poussière)
poser(sfx, stereo(B.whoosh(1.4, True, 0.8), 0.0), im(105))                                  # la caméra s'élève
poser(sfx, stereo(B.rire_foule(1.2, 0.5), -0.5), im(122))                                  # les enfants passent en riant
poser(sfx, stereo(B.course(3.5, 7.0, "terre", 0.45), -0.4), im(125))
poser(sfx, stereo(B.whoosh(0.8, False, 0.7), 0.0), im(238))                                # poussée vers Serge
poser(sfx, stereo(B.ting(1760, 1.0), -0.3), im(264))                                       # l'étoile du pouce
poser(sfx, stereo(B.pop(0.8), -0.3), im(263))
m = mus * 10 ** ((-17 - lufs(mus)) / 20)
s = sfx * 10 ** ((-21 - lufs(sfx)) / 20)
mix = m + s
mix = limiteur(mix * 10 ** ((-14 - lufs(mix)) / 20), -1.0)
ecrire_wav(sys.argv[1], mix)
print(f"bande son test : {lufs(mix):.1f} LUFS")
