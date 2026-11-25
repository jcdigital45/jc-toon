"""JC Toon — outils audio de base (numpy + scipy), écrits de zéro.
Fréquence 48 kHz, signaux float64 mono ou stéréo (N, 2)."""
import wave
import numpy as np
from scipy import signal

SR = 48000
rng = np.random.default_rng(2026)


def t_(dur):
    return np.arange(int(round(dur * SR))) / SR


def bruit(dur, couleur="blanc", graine=None):
    g = np.random.default_rng(graine) if graine is not None else rng
    n = g.standard_normal(int(round(dur * SR)))
    if couleur == "rose":  # filtre 1/f approché
        b, a = [0.049922, -0.095993, 0.050613, -0.004408], [1, -2.494956, 2.017265, -0.522189]
        n = signal.lfilter(b, a, n) * 4
    elif couleur == "brun":
        n = np.cumsum(n); n = signal.lfilter([1, -1], [1, -0.995], n) * 0.05
    return n


def env(n, a=0.005, d=0.2, forme=4.0):
    """enveloppe percussive : attaque linéaire puis décroissance exponentielle (d = temps à -60 dB)"""
    tt = np.arange(n) / SR
    att = np.clip(tt / max(a, 1e-4), 0, 1)
    dec = np.exp(-6.9 * np.maximum(tt - a, 0) / max(d, 1e-4))
    return att * dec


def adsr(n, a, d, s, r):
    tt = np.arange(n) / SR; dur = n / SR
    e = np.interp(tt, [0, a, a + d, max(a + d, dur - r), dur], [0, 1, s, s, 0])
    return e


def passe_bas(x, fc, ordre=2):
    b, a = signal.butter(ordre, min(fc, SR * 0.45) / (SR / 2), "low"); return signal.lfilter(b, a, x, axis=0)


def passe_haut(x, fc, ordre=2):
    b, a = signal.butter(ordre, max(fc, 10) / (SR / 2), "high"); return signal.lfilter(b, a, x, axis=0)


def passe_bande(x, f1, f2, ordre=2):
    b, a = signal.butter(ordre, [max(f1, 10) / (SR / 2), min(f2, SR * 0.45) / (SR / 2)], "band"); return signal.lfilter(b, a, x, axis=0)


def stereo(x, pan=0.0):
    """pan -1 (gauche) .. +1 (droite), loi à puissance constante"""
    a = (pan + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], axis=1)


def poser(piste, son, debut):
    """ajoute un son (mono ou stéréo) dans une piste stéréo à l'instant debut (s)"""
    if son.ndim == 1: son = stereo(son)
    i = int(round(debut * SR))
    if i >= len(piste) or i + len(son) <= 0: return
    j = max(0, -i); i = max(0, i); n = min(len(son) - j, len(piste) - i)
    piste[i:i + n] += son[j:j + n]


def reverb(x, duree=1.2, humide=0.18, graine=5):
    """réverbe par convolution avec une réponse synthétique (bruit décroissant, décorrélé G/D)"""
    if x.ndim == 1: x = stereo(x)
    n = int(duree * SR); g = np.random.default_rng(graine)
    ir = g.standard_normal((n, 2)) * np.exp(-6.9 * np.arange(n) / n)[:, None]
    ir = passe_bas(ir, 6000); ir[: int(0.012 * SR)] = 0; ir /= np.sqrt((ir ** 2).sum(axis=0))
    w = np.stack([signal.fftconvolve(x[:, k], ir[:, k])[: len(x)] for k in range(2)], axis=1)
    return x * (1 - humide) + w * humide * 1.6


# ---------- mesure de volume (ITU BS.1770 : pondération K + gate) ----------
def _ponderation_k(x):
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    return signal.lfilter(b2, a2, signal.lfilter(b1, a1, x, axis=0), axis=0)


def lufs(x):
    """volume intégré en LUFS (blocs de 400 ms, recouvrement 75 %, gate absolu -70 et relatif -10)"""
    if x.ndim == 1: x = x[:, None]
    y = _ponderation_k(x); bl, pas = int(0.4 * SR), int(0.1 * SR)
    if len(y) < bl: return -70.0
    ms = np.array([(y[i:i + bl] ** 2).mean(axis=0).sum() for i in range(0, len(y) - bl + 1, pas)])
    l = -0.691 + 10 * np.log10(ms + 1e-12)
    ms = ms[l > -70]
    if len(ms) == 0: return -70.0
    rel = -0.691 + 10 * np.log10(ms.mean()) - 10
    ms2 = ms[(-0.691 + 10 * np.log10(ms)) > rel]
    return float(-0.691 + 10 * np.log10(ms2.mean() + 1e-12))


def crete(x, sur=4):
    """crête vraie approchée par suréchantillonnage x4"""
    y = signal.resample_poly(x, sur, 1, axis=0)
    return float(np.abs(y).max() + 1e-12)


def limiteur(x, plafond_db=-1.0, attaque=0.002, relache=0.08):
    """limiteur de crête avec anticipation : gain lissé qui ne laisse rien dépasser le plafond"""
    lim = 10 ** (plafond_db / 20) * 0.93
    pic = np.abs(x).max(axis=1) if x.ndim == 2 else np.abs(x)
    besoin = np.minimum(1.0, lim / np.maximum(pic, 1e-9))
    la = int(attaque * SR)
    # minimum glissant sur la fenêtre d'anticipation
    from scipy.ndimage import minimum_filter1d
    g = minimum_filter1d(besoin, size=2 * la + 1, origin=0)
    rel = np.exp(-1 / (relache * SR)); out = np.empty_like(g); c = 1.0
    for i, v in enumerate(g):
        c = v if v < c else v + (c - v) * rel
        out[i] = c
    out = np.convolve(out, np.ones(la) / la, "same") if la > 1 else out
    out = np.minimum(out, g)
    return x * (out[:, None] if x.ndim == 2 else out)


# ---------- fichiers ----------
def lire_audio(chemin):
    """lit n'importe quel format via ffmpeg, renvoie stéréo float 48 kHz"""
    import subprocess
    brut = subprocess.run(["ffmpeg", "-v", "error", "-i", chemin, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(brut, dtype=np.float32).reshape(-1, 2).astype(np.float64)


def ecrire_wav(chemin, x):
    if x.ndim == 1: x = stereo(x)
    y = (np.clip(x, -1, 1) * 32767).astype("<i2")
    with wave.open(chemin, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(y.tobytes())


def lire_wav(chemin):
    return lire_audio(chemin)
