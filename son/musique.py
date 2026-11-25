"""JC Toon — musique originale générée : groove afro en 12/8 (cloche, djembé, doum, shaker, balafon, kora, basse).
usage (module) : composer(duree, tempo=100, tonique=62, ambiance="marche", arret=None, graine=1) -> piste stéréo

ambiance :
  "marche"   : enjoué, tout l'orchestre (histoire qui avance, humour)
  "conte"    : doux, kora + balafon + nappe, percussions légères (récit, émotion)
  "suspense" : grave, doum + cloche + nappe mineure, montée de roulement (mystère)
arret : instant (s) où la musique coupe pour le retournement ; seule une nappe grave tient ensuite."""
import numpy as np
from base import SR, poser, stereo, reverb, passe_haut
import instruments as I

PENTA_MAJ = [0, 2, 4, 7, 9]
PENTA_MIN = [0, 3, 5, 7, 10]


def _gamme(tonique, mode, octaves=(0, 1)):
    deg = PENTA_MAJ if mode == "maj" else PENTA_MIN
    return [tonique + 12 * o + d for o in octaves for d in deg]


def composer(duree, tempo=100, tonique=62, ambiance="marche", arret=None, graine=1):
    r = np.random.default_rng(graine)
    n = int((duree + 2.5) * SR)
    pist = np.zeros((n, 2))
    pulse = 60.0 / tempo / 3  # 12/8 : 3 pulsations par temps, 12 par mesure
    mesure = pulse * 12
    fin = min(duree, arret) if arret else duree
    mode = "min" if ambiance == "suspense" else "maj"
    accords = [0, 5, 0, 7] if mode == "maj" else [0, 8, 5, 7]  # I IV I V  /  i VI iv v
    gamme = _gamme(tonique, mode, (0, 1))
    cloche_pos = [0, 2, 4, 5, 7, 9, 11]
    djembe_motif = {0: "basse", 3: "tone", 4: "tone", 6: "slap", 8: "tone", 9: "slap", 10: "tone"}
    # motif de balafon : 12 pulsations, degrés de la gamme (None = silence), varie à chaque accord
    bal_motif = [0, None, 2, 1, None, 3, 2, None, 4, 3, 2, None]
    nb_mesures = int(np.ceil(fin / mesure))
    for m in range(nb_mesures):
        t0 = m * mesure
        acc = accords[m % 4]
        intro = m == 0
        for p in range(12):
            t = t0 + p * pulse
            if t >= fin: break
            swing = pulse * 0.08 if p % 3 == 2 else 0.0
            tt = t + swing
            if ambiance in ("marche", "suspense") and p in cloche_pos:
                poser(pist, stereo(I.cloche(p == 0, 0.9 if ambiance == "marche" else 0.6), 0.35), tt)
            if ambiance == "conte" and p in (0, 6):
                poser(pist, stereo(I.cloche(True, 0.35), 0.35), tt)
            if p in (0, 6) or (ambiance == "marche" and p == 9 and m % 2):
                poser(pist, stereo(I.doum(1.0 if p == 0 else 0.75), 0.0), tt)
            if not intro and ambiance != "suspense" and p in djembe_motif:
                f = 0.5 if ambiance == "conte" else 1.0
                poser(pist, stereo(I.djembe(djembe_motif[p], f), -0.25), tt)
            if ambiance != "suspense":
                poser(pist, stereo(I.shaker(0.9 if p % 3 == 0 else 0.5), 0.55), tt)
            # basse sur les temps
            if p % 6 == 0 and not intro:
                poser(pist, stereo(I.basse(tonique - 24 + acc, pulse * 5, 0.9), 0.0), tt)
            # balafon (sauf suspense)
            if ambiance != "suspense" and not intro:
                d = bal_motif[p]
                if d is not None:
                    note = gamme[(d + (1 if acc == 5 else 2 if acc == 7 else 0)) % len(gamme)] + 12
                    poser(pist, stereo(I.balafon(note, 0.8 if p % 3 == 0 else 0.6), -0.45), tt)
        # kora : phrase qui répond toutes les deux mesures
        if ambiance != "suspense" and m % 2 == 1:
            for k in range(4):
                t = t0 + k * 3 * pulse
                if t >= fin: break
                note = gamme[r.integers(2, len(gamme))] + 12
                poser(pist, stereo(I.kora(note, 0.8, 1.4), 0.45), t)
        # nappe
        if ambiance in ("conte", "suspense"):
            base = tonique - 12 + acc
            tierce = 3 if mode == "min" else 4
            d = min(mesure, fin - t0)
            if d > 0.1: poser(pist, stereo(I.nappe([base, base + tierce, base + 7], d + 0.4, 0.8), 0.0), t0)
    # après l'arrêt : bourdon grave qui tient jusqu'à la fin
    if arret and arret < duree:
        poser(pist, stereo(I.nappe([tonique - 24, tonique - 17], duree - arret + 1.5, 1.0), 0.0), arret)
    # suspense : roulement de djembé avant l'arrêt
    if ambiance == "suspense" and arret:
        from bruitages import tambour_roulement
        poser(pist, stereo(tambour_roulement(min(2.0, arret), 0.6), -0.2), max(0, arret - 2.0))
    # fondu de fin
    fe = int(1.5 * SR); e = int(duree * SR)
    pist[max(0, e - fe):e] *= np.linspace(1, 0, min(fe, e))[:, None]
    pist[e:] = 0
    pist = reverb(passe_haut(pist, 35), 1.1, 0.14)
    return pist[: int(duree * SR)]
