"""JC Toon — instruments synthétisés (écrits de zéro) : djembé, doum, cloche, shaker, balafon, kora, basse,
nappe, flûte, cuivres. Chaque fonction renvoie un signal mono à 48 kHz."""
import numpy as np
from base import SR, t_, bruit, env, adsr, passe_bas, passe_haut, passe_bande

rng = np.random.default_rng(11)


def _hum(v=0.06):
    """petite variation humaine (volume)"""
    return 1 + (rng.random() - 0.5) * 2 * v


# ---------- percussions ----------
def djembe(coup="tone", force=1.0):
    """coup = 'basse' (centre, grave), 'tone' (bord, rond), 'slap' (claqué, aigu)"""
    if coup == "basse":
        tt = t_(0.5); f = 72 + 38 * np.exp(-tt * 30)
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.002, 0.42)
        x += passe_bas(bruit(0.5), 400) * env(len(tt), 0.001, 0.03) * 0.5
    elif coup == "tone":
        tt = t_(0.35); x = 0
        for r, a, d in [(1, 1, 0.22), (1.59, 0.55, 0.14), (2.14, 0.35, 0.1), (2.65, 0.2, 0.07)]:
            x = x + a * np.sin(2 * np.pi * 330 * r * tt + rng.random() * 6) * env(len(tt), 0.001, d)
        x += passe_bande(bruit(0.35), 800, 3500) * env(len(tt), 0.001, 0.025) * 0.5
    else:  # slap
        tt = t_(0.28)
        x = passe_bande(bruit(0.28), 1500, 7000) * env(len(tt), 0.0005, 0.09) * 1.3
        for r, a in [(1, 0.5), (2.3, 0.35), (3.7, 0.25)]:
            x += a * np.sin(2 * np.pi * 420 * r * tt) * env(len(tt), 0.0005, 0.08)
    return x * force * _hum() * 0.7


def doum(force=1.0):
    """grosse caisse grave type doundoun"""
    tt = t_(0.7); f = 52 + 60 * np.exp(-tt * 22)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.002, 0.6)
    x += passe_bande(bruit(0.7), 200, 1200) * env(len(tt), 0.001, 0.02) * 0.6
    return x * force * 0.55


def cloche(haut=True, force=1.0):
    """cloche en fer (type gankogui) : partiels inharmoniques"""
    tt = t_(0.6); f0 = 880 if haut else 660; x = 0
    for r, a, d in [(1, 1, 0.5), (2.76, 0.5, 0.25), (5.4, 0.25, 0.12), (8.93, 0.12, 0.06)]:
        x = x + a * np.sin(2 * np.pi * f0 * r * tt) * env(len(tt), 0.0008, d)
    return x * force * _hum() * 0.3


def shaker(force=1.0, dur=0.09):
    tt = t_(dur)
    x = passe_bande(bruit(dur), 4000, 12000) * adsr(len(tt), dur * 0.35, dur * 0.3, 0.3, dur * 0.3)
    return x * force * _hum(0.15) * 0.35


def claquement(force=1.0):
    """claquement de mains"""
    tt = t_(0.2); x = 0
    for k in range(3):
        d = int(rng.random() * 0.008 * SR)
        y = np.zeros(len(tt)); y[d:] = passe_bande(bruit(0.2 - d / SR), 900, 3000) * env(len(tt) - d, 0.0005, 0.06)
        x = x + y
    return x * force * 0.6


# ---------- instruments mélodiques ----------
def hz(note):
    """numéro MIDI -> fréquence"""
    return 440.0 * 2 ** ((note - 69) / 12)


def balafon(note, force=1.0):
    """lame de bois : partiels 1 / 3,9 / 9,2, décroissance rapide + vibration de la calebasse (bourdonnement léger)"""
    f = hz(note); tt = t_(0.9); x = 0
    for r, a, d in [(1, 1, 0.45), (3.93, 0.32, 0.12), (9.2, 0.12, 0.04)]:
        if f * r < SR * 0.45: x = x + a * np.sin(2 * np.pi * f * r * tt) * env(len(tt), 0.001, d)
    buzz = np.sign(np.sin(2 * np.pi * f * tt)) * env(len(tt), 0.002, 0.18) * 0.06
    x = x + passe_bande(buzz, f * 2, 6000)
    x += passe_bande(bruit(0.9), 1500, 6000) * env(len(tt), 0.0005, 0.012) * 0.25  # frappe de la mailloche
    return x * force * _hum() * 0.42


def kora(note, force=1.0, dur=1.6):
    """corde pincée de kora : somme de partiels à décroissance plus rapide dans l'aigu (son de corde pincée)"""
    f = hz(note); tt = t_(dur); x = 0
    for k in range(1, 12):
        if f * k > SR * 0.45: break
        a = (1 / k) * (1 if k % 2 else 0.7) * np.sin(np.pi * k * 0.18) * 2
        x = x + a * np.sin(2 * np.pi * f * k * (1 + 0.0004 * k * k) * tt) * env(len(tt), 0.002, dur * 0.9 / (1 + 0.35 * k))
    x += passe_bande(bruit(dur), 2000, 8000) * env(len(tt), 0.0005, 0.01) * 0.2
    return x * force * _hum() * 0.32


def basse(note, dur=0.4, force=1.0):
    f = hz(note); tt = t_(dur + 0.2)
    x = np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(4 * np.pi * f * tt) + 0.12 * np.sin(6 * np.pi * f * tt)
    return np.tanh(x * 1.4) * adsr(len(tt), 0.006, 0.08, 0.6, 0.15) * force * 0.22


def nappe(notes, dur, force=1.0):
    """accord tenu doux (scies désaccordées filtrées)"""
    tt = t_(dur); x = 0
    for n in notes:
        for d in (-0.08, 0.0, 0.07):
            ph = (hz(n + d) * tt) % 1.0; x = x + (2 * ph - 1)
    x = passe_bas(x, 1400) / (len(notes) * 3)
    return x * adsr(len(tt), min(0.6, dur / 3), 0.3, 0.85, min(0.8, dur / 3)) * force * 0.5


def flute(note, dur, force=1.0):
    f = hz(note); tt = t_(dur)
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.2 * tt) * np.clip(tt / 0.3, 0, 1)
    ph = np.cumsum(f * vib) / SR
    x = np.sin(2 * np.pi * ph) + 0.12 * np.sin(4 * np.pi * ph) + passe_bande(bruit(dur), f, f * 3) * 0.08
    return x * adsr(len(tt), 0.05, 0.1, 0.8, 0.12) * force * 0.3


def cuivre(note, dur, force=1.0):
    """attaque de cuivres (pour les moments forts)"""
    f = hz(note); tt = t_(dur); x = 0
    br = np.clip(tt / 0.06, 0, 1)
    for k in range(1, 10):
        x = x + (1 / k) * np.sin(2 * np.pi * f * k * tt) * np.clip(br * 1.6 - k * 0.08, 0, 1)
    return np.tanh(x * 1.2) * adsr(len(tt), 0.03, 0.15, 0.7, 0.15) * force * 0.3
