#!/usr/bin/env python3
"""JC Toon — mixage final.
usage : python3 mix.py voix.(mp3|wav) musique.wav bruitages.wav sortie.wav [--musique -6] [--bruitages -6]

Règles :
  - la voix n'est jamais modifiée (aucun gain, aucun filtre avant le mastering global) ;
  - musique à -6 dB du volume de la voix (LUFS intégré, 50 %), bruitages à -6 dB avec crêtes plafonnées à 0,7 x la crête de la voix ;
  - pas de ducking, pas de compression : un seul gain par piste ;
  - mastering : un gain linéaire unique vers -14 LUFS puis un limiteur de crête à -1 dBFS sur le mix complet."""
import sys, argparse
import numpy as np
from base import lire_audio, ecrire_wav, lufs, crete, limiteur

ap = argparse.ArgumentParser()
ap.add_argument("voix"); ap.add_argument("musique"); ap.add_argument("bruitages"); ap.add_argument("sortie")
ap.add_argument("--musique-db", type=float, default=-6.0); ap.add_argument("--bruitages-db", type=float, default=-6.0)
ap.add_argument("--cible", type=float, default=-14.0)
a = ap.parse_args()

v = lire_audio(a.voix); n = len(v)
def ajuster(x):
    y = np.zeros((n, 2)); y[: min(n, len(x))] = x[:n]; return y
m, s = ajuster(lire_audio(a.musique)), ajuster(lire_audio(a.bruitages))
Lv = lufs(v)
gm = 10 ** ((Lv + a.musique_db - lufs(m)) / 20) if np.abs(m).max() > 0 else 0
m = m * gm
if np.abs(s).max() > 0:
    s = s * 10 ** ((Lv + a.bruitages_db - lufs(s)) / 20)
    plafond = 0.7 * crete(v)
    if crete(s) > plafond: s = limiteur(s, 20 * np.log10(plafond))
mix = v + m + s
g = 10 ** ((a.cible - lufs(mix)) / 20)
mix = limiteur(mix * g, -1.0)
ecrire_wav(a.sortie, mix)
print(f"voix {Lv:.1f} LUFS | musique {lufs(m) - Lv:+.1f} dB | bruitages {lufs(s) - Lv:+.1f} dB (crête {20*np.log10(crete(s)/crete(v)):+.1f} dB vs voix)")
print(f"mix final {lufs(mix):.1f} LUFS, crête {20*np.log10(crete(mix)):.1f} dBFS, durée {n/48000:.2f} s -> {a.sortie}")
