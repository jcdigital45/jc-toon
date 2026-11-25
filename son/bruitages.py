"""JC Toon — bruitages synthétisés (écrits de zéro). Chaque fonction renvoie un signal mono à 48 kHz.
Liste : whoosh, impact, fracas, ting, sting, pop, pas, course, craquement, eclaboussure, eau, vent, oiseaux,
grillons, foule, rire_foule, applaudissements, porte, coq, moto, cloche_ecole, zzz, tambour_roulement."""
import numpy as np
from base import SR, t_, bruit, env, adsr, passe_bas, passe_haut, passe_bande

g = np.random.default_rng(77)


def whoosh(dur=0.5, montee=True, force=1.0):
    tt = t_(dur); x = bruit(dur); fc = np.linspace(400, 3000, len(tt)) if montee else np.linspace(3000, 400, len(tt))
    y = np.zeros(len(tt)); blocs = 64
    for i in range(0, len(tt), len(tt) // blocs + 1):
        j = min(len(tt), i + len(tt) // blocs + 1); c = fc[i]
        y[i:j] = passe_bande(x, c * 0.6, c * 1.6)[i:j]
    return y * np.sin(np.pi * tt / dur) ** 2 * force * 0.6


def impact(force=1.0, grave=60):
    """choc sourd au sol ou sur une table"""
    tt = t_(0.6); f = grave + 80 * np.exp(-tt * 40)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.001, 0.35)
    x += passe_bas(bruit(0.6), 900) * env(len(tt), 0.0005, 0.06)
    return np.tanh(x * 1.5) * force * 0.8


def fracas(force=1.0, dur=1.4):
    """effondrement : grondement + éclats + débris"""
    tt = t_(dur); x = passe_bas(bruit(dur, "brun"), 300) * env(len(tt), 0.01, dur * 0.8) * 3
    x += passe_bande(bruit(dur), 600, 5000) * env(len(tt), 0.001, 0.25)
    for k in range(24):  # débris qui retombent
        d = int(g.random() * dur * 0.8 * SR); n = int(0.05 * SR)
        if d + n < len(tt): x[d:d + n] += passe_bande(bruit(0.05), 1500, 6000)[:n] * env(n, 0.0005, 0.03) * (0.6 - d / len(tt) * 0.5)
    return np.tanh(x * 1.2) * force * 0.7


def ting(note_hz=1760, force=1.0):
    """petit tintement de révélation"""
    tt = t_(1.2); x = 0
    for r, a, d in [(1, 1, 0.9), (2.0, 0.3, 0.5), (3.01, 0.15, 0.3)]:
        x = x + a * np.sin(2 * np.pi * note_hz * r * tt) * env(len(tt), 0.001, d)
    return x * force * 0.3


def sting(force=1.0):
    """coup final du retournement : impact grave + cymbale inversée courte + accord"""
    tt = t_(2.0); f = 45 + 50 * np.exp(-tt * 12)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.002, 1.6)
    x += passe_haut(bruit(2.0), 5000) * env(len(tt), 0.001, 0.8) * 0.25
    for n in (110, 164.8, 220):
        x += np.sin(2 * np.pi * n * tt) * env(len(tt), 0.01, 1.4) * 0.18
    return np.tanh(x * 1.3) * force * 0.8


def pop(force=1.0):
    tt = t_(0.12); f = 900 * np.exp(-tt * 25) + 300
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.001, 0.08) * force * 0.5


def pas(sol="terre", force=1.0):
    tt = t_(0.18)
    if sol == "bois": x = passe_bande(bruit(0.18), 150, 1200) * env(len(tt), 0.001, 0.07) * 1.5 + np.sin(2 * np.pi * 140 * tt) * env(len(tt), 0.001, 0.06)
    else: x = passe_bande(bruit(0.18), 250, 3500) * env(len(tt), 0.003, 0.09)  # terre, gravier
    return x * force * (0.8 + g.random() * 0.4) * 0.5


def course(dur=1.5, cadence=6.0, sol="terre", force=1.0):
    x = np.zeros(int(dur * SR))
    for k in range(int(dur * cadence)):
        i = int(k / cadence * SR); p = pas(sol, force)
        x[i:i + len(p)] += p[: max(0, len(x) - i)]
    return x


def craquement(force=1.0):
    """bois qui craque"""
    x = np.zeros(int(0.5 * SR))
    for k in range(9):
        i = int(g.random() * 0.35 * SR); n = int(0.02 * SR)
        x[i:i + n] += passe_bande(bruit(0.02), 800, 5000) * env(n, 0.0003, 0.012) * (1 - k / 12)
    return x * force * 1.2


def eclaboussure(force=1.0):
    tt = t_(1.0); x = passe_bande(bruit(1.0), 400, 6000) * env(len(tt), 0.004, 0.45)
    for k in range(14):  # gouttes
        i = int((0.1 + g.random() * 0.7) * SR); n = int(0.04 * SR); fq = 1200 + g.random() * 1800
        x[i:i + n] += np.sin(2 * np.pi * np.cumsum(np.linspace(fq, fq * 1.6, n)) / SR) * env(n, 0.001, 0.03) * 0.25
    return x * force * 0.6


def eau(dur=4.0, force=1.0):
    """ruissellement continu (rivière)"""
    x = passe_bande(bruit(dur, "rose"), 300, 4000)
    m = passe_bas(bruit(dur), 3) * 6 + 1
    return x * np.clip(m, 0.4, 1.6) * force * 0.25


def vent(dur=4.0, force=1.0):
    x = bruit(dur); m = passe_bas(bruit(dur), 0.7) * 20
    return passe_bande(x, 200, 900) * np.clip(0.6 + m, 0.2, 1.4) * force * 0.25


def oiseaux(dur=4.0, force=1.0):
    x = np.zeros(int(dur * SR))
    for k in range(int(dur * 2.2)):
        i = int(g.random() * (dur - 0.4) * SR); n = int((0.06 + g.random() * 0.12) * SR)
        f0 = 2500 + g.random() * 2500; tt = np.arange(n) / SR
        fq = f0 * (1 + 0.25 * np.sin(2 * np.pi * (8 + g.random() * 10) * tt))
        x[i:i + n] += np.sin(2 * np.pi * np.cumsum(fq) / SR) * np.sin(np.pi * tt / tt[-1]) ** 2 * 0.3
    return x * force * 0.35


def grillons(dur=4.0, force=1.0):
    tt = t_(dur); porteuse = np.sin(2 * np.pi * 4500 * tt)
    mod = (np.sin(2 * np.pi * 30 * tt) > 0.3) * (np.sin(2 * np.pi * 1.6 * tt) > -0.2)
    return passe_bas(porteuse * mod, 9000) * force * 0.08


def foule(dur=3.0, force=1.0):
    """brouhaha de marché : bruit modulé par des formants de voix"""
    x = 0
    for k in range(10):
        f1 = 350 + g.random() * 400
        b = passe_bande(bruit(dur), f1, f1 * 2.4)
        m = np.clip(passe_bas(bruit(dur), 4 + g.random() * 3) * 25 + 0.3, 0, 1.5)
        x = x + b * m
    return x / 10 * force * 0.9


def rire_foule(dur=2.0, force=1.0):
    tt = t_(dur); x = 0
    for k in range(6):
        f0 = 180 + g.random() * 200; rate = 4.5 + g.random() * 2
        voix = np.sign(np.sin(2 * np.pi * f0 * tt)) * 0.3
        voix = passe_bande(voix, 500 + g.random() * 300, 2200)
        x = x + voix * (np.sin(2 * np.pi * rate * tt) > 0.1) * np.clip(1 - tt / dur, 0, 1)
    return x / 6 * force * 1.2


def applaudissements(dur=2.5, force=1.0):
    x = np.zeros(int(dur * SR))
    for k in range(int(dur * 60)):
        i = int(g.random() * (dur - 0.05) * SR); n = int(0.03 * SR)
        x[i:i + n] += passe_bande(bruit(0.03), 800, 4000) * env(n, 0.0005, 0.02)
    return x * np.clip(1.4 - np.arange(len(x)) / len(x), 0, 1) * force * 0.5


def porte(force=1.0):
    """grincement + claquement"""
    tt = t_(0.9); f = 300 + 150 * np.sin(2 * np.pi * 1.4 * tt)
    grin = passe_bande(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 600, 3000) * np.clip(1 - tt / 0.7, 0, 1) * 0.2
    c = impact(0.8, 90); x = np.zeros(len(tt) + len(c)); x[: len(tt)] += grin; x[int(0.7 * SR):int(0.7 * SR) + len(c)] += c
    return x * force


def coq(force=1.0):
    """chant du coq (glissandos à formants)"""
    segs = [(0.18, 600, 900), (0.22, 900, 950), (0.5, 950, 700)]; x = []
    for d, a, b in segs:
        tt = t_(d); f = np.linspace(a, b, len(tt))
        v = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR))
        x.append(passe_bande(v, 900, 3200) * np.sin(np.pi * tt / d) ** 0.5)
    return np.concatenate(x) * force * 0.25


def moto(dur=2.5, force=1.0, approche=True):
    """moto-taxi qui passe"""
    tt = t_(dur); f = 38 + 10 * np.sin(np.pi * tt / dur)
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) + 0.3 * bruit(dur)
    x = passe_bas(x, 1800)
    v = np.sin(np.pi * tt / dur) ** 2 if approche else np.ones(len(tt))
    return x * v * force * 0.25


def cloche_ecole(force=1.0, dur=1.2):
    tt = t_(dur); x = 0
    for r, a in [(1, 1), (2.4, 0.5), (4.1, 0.3)]:
        x = x + a * np.sin(2 * np.pi * 1300 * r * tt)
    trem = (np.sin(2 * np.pi * 22 * tt) > 0) * 0.8 + 0.2
    return x * trem * adsr(len(tt), 0.01, 0.05, 0.8, 0.2) * force * 0.15


def zzz(force=1.0):
    """ronflement"""
    tt = t_(1.4); f = 90 + 20 * np.sin(np.pi * tt / 1.4)
    x = passe_bande(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) + 0.5 * bruit(1.4), 100, 1500)
    return x * np.sin(np.pi * tt / 1.4) ** 2 * force * 0.25


def tambour_roulement(dur=1.5, force=1.0):
    """roulement de tambour qui monte (suspense)"""
    tt = t_(dur); x = np.zeros(len(tt)); k = 0.0
    while k < dur - 0.05:
        i = int(k * SR); n = int(0.06 * SR)
        x[i:i + n] += passe_bande(bruit(0.06), 200, 2500) * env(n, 0.0005, 0.04) * (0.3 + 0.7 * k / dur)
        k += 0.045
    return x * force * 0.7
