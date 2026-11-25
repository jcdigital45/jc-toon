#!/usr/bin/env python3
"""Démo sonore JC Toon : les 3 ambiances musicales puis une série de bruitages.  python3 demo.py sortie.wav"""
import sys, time
import numpy as np
from base import SR, poser, stereo, ecrire_wav, lufs, limiteur
from musique import composer
import bruitages as B

t0 = time.time()
parts = []
mar = composer(14, 104, 62, "marche", arret=11.5, graine=3); poser(mar, stereo(B.sting(0.9)), 11.5); parts.append(mar)
parts.append(composer(12, 84, 64, "conte", graine=5))
sus = composer(12, 92, 57, "suspense", arret=10.5, graine=7); poser(sus, stereo(B.sting(1.0)), 10.5); parts.append(sus)
# bruitages, un toutes les 1,2 s environ
sfx = np.zeros((int(22 * SR), 2)); t = 0.3
for f in [lambda: B.whoosh(0.6), lambda: B.impact(), lambda: B.fracas(), lambda: B.ting(), lambda: B.pop(),
          lambda: B.course(1.2), lambda: B.craquement(), lambda: B.eclaboussure(), lambda: B.porte(), lambda: B.coq(),
          lambda: B.moto(2.0), lambda: B.cloche_ecole(), lambda: B.zzz(), lambda: B.rire_foule(1.6), lambda: B.applaudissements(1.6)]:
    s = f(); poser(sfx, s, t); t += len(s) / SR + 0.35
sfx = sfx[: int((t + 0.3) * SR)]
ambi = np.zeros((int(6 * SR), 2))
for f in (B.oiseaux, B.vent, B.eau): poser(ambi, f(6.0), 0)
poser(ambi, B.foule(3.0), 3)
silence = np.zeros((int(0.6 * SR), 2))
seq = []
for p in parts + [sfx, ambi]:
    p = p * 10 ** ((-16 - lufs(p)) / 20); seq += [p, silence]
out = limiteur(np.concatenate(seq), -1.0)
ecrire_wav(sys.argv[1], out)
print(f"{len(out)/SR:.1f} s écrits en {time.time()-t0:.0f} s, {lufs(out):.1f} LUFS")
