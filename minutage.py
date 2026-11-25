#!/usr/bin/env python3
"""JC Toon — minutage d'une voix off à partir de son script (sans reconnaissance vocale).

usage : python3 minutage.py voix.mp3 script.txt --sortie travail [--langue fr|en]

Méthode :
  1. on détecte les passages parlés et les pauses dans la voix (énergie par tranches de 10 ms) ;
  2. on découpe le script en phrases (ponctuation) et on compte les syllabes de chaque mot ;
  3. on répartit les syllabes sur le temps PARLÉ (les pauses ne comptent pas) ;
  4. chaque fin de phrase est aimantée sur la pause la plus proche (si elle est à moins de 0,4 s) ;
  5. à l'intérieur d'une phrase, chaque mot reçoit un temps proportionnel à ses syllabes.
Sorties : travail/phrases.json, travail/mots.json (temps en secondes et en images à 30 i/s), et un résumé.
Si whisper ou faster-whisper est installé, utiliser plutôt ses horodatages de mots (language="fr") pour vérifier."""
import sys, os, re, json, argparse, subprocess
import numpy as np

FPS = 30
VOY_FR = "aeiouyàâäéèêëîïôöùûüœæ"


def syllabes_fr(mot):
    m = mot.lower()
    m = re.sub(r"[^a-zàâäéèêëîïôöùûüœæç'-]", "", m)
    if not m: return 0
    m = re.sub(r"^(l|d|j|m|n|s|t|c|qu|jusqu|lorsqu|puisqu)'", "", m)  # élisions : la consonne se lie au mot suivant
    m = m.replace("qu", "k").replace("gu", "g").replace("œu", "e").replace("eau", "o").replace("au", "o")
    m = re.sub(r"(ou|ai|ei|eu|oi|ui|ie|ue)", "a", m)
    m = re.sub(r"(ent)$", "", m) if len(m) > 4 and re.search(r"[" + VOY_FR + "].*ent$", m) and not m.endswith("ment") else m
    m = re.sub(r"(es|e)$", "", m) if len(m) > 2 else m  # e muet final
    groupes = re.findall(r"[" + VOY_FR + "]+", m)
    n = 0
    for g in groupes:
        n += 1 + sum(1 for k in range(len(g) - 1) if g[k] == "é" and g[k + 1] in "aeiouéè")  # é en hiatus : « réalité »
    return max(1, n)


def syllabes_en(mot):
    m = re.sub(r"[^a-z]", "", mot.lower())
    if not m: return 0
    m = re.sub(r"e$", "", m) if len(m) > 3 else m
    return max(1, len(re.findall(r"[aeiouy]+", m)))


NOMBRES = {"0": "zéro", "1": "un", "2": "deux", "3": "trois", "4": "quatre", "5": "cinq", "6": "six", "7": "sept", "8": "huit", "9": "neuf"}


def decouper(script):
    texte = script.replace("’", "'").replace("…", "...").replace("«", " ").replace("»", " ")
    texte = re.sub(r"\s+", " ", texte).strip()
    morceaux = re.split(r"(?<=[\.\!\?;:])\s+|(?<=\.\.\.)\s+", texte)
    return [p.strip() for p in morceaux if p.strip()]


def lire_energie(chemin):
    sr = 16000
    brut = subprocess.run(["ffmpeg", "-v", "error", "-i", chemin, "-f", "f32le", "-ac", "1", "-ar", str(sr), "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(brut, dtype=np.float32)
    pas = sr // 100
    n = len(x) // pas
    e = np.sqrt((x[: n * pas].reshape(n, pas) ** 2).mean(axis=1) + 1e-12)
    return 20 * np.log10(e), len(x) / sr


def zones(db, pause_min=0.12):
    """renvoie la liste des passages parlés [(début, fin)] en secondes"""
    haut = np.percentile(db, 95)
    seuil = max(np.percentile(db, 10) + 10, haut - 32)
    parle = db > seuil
    # lissage : on bouche les trous plus courts que pause_min
    k = int(pause_min * 100)
    i = 0; segs = []
    while i < len(parle):
        if parle[i]:
            j = i
            while j < len(parle) and (parle[j] or (j + k < len(parle) and parle[j:j + k].any())): j += 1
            segs.append((i / 100, j / 100)); i = j
        else: i += 1
    return [s for s in segs if s[1] - s[0] > 0.06]


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("voix"); ap.add_argument("script"); ap.add_argument("--sortie", default="travail"); ap.add_argument("--langue", default="fr")
    a = ap.parse_args(); os.makedirs(a.sortie, exist_ok=True)
    syl = syllabes_fr if a.langue == "fr" else syllabes_en
    phrases = decouper(open(a.script, encoding="utf-8").read())
    mots = [[(w, syl(w)) for w in p.split() if syl(w) > 0] for p in phrases]
    db, duree = lire_energie(a.voix); segs = zones(db)
    if not segs: sys.exit("aucune parole détectée dans la voix")
    parle_total = sum(e - b for b, e in segs)
    # fonction : temps parlé cumulé -> temps réel
    cum = np.cumsum([0] + [e - b for b, e in segs])
    def reel(tp):
        i = min(len(segs) - 1, int(np.searchsorted(cum, tp, side="right") - 1)); i = max(0, i)
        return segs[i][0] + (tp - cum[i])
    pauses = [segs[i][1] for i in range(len(segs) - 1)]  # fins de passages parlés suivis d'une pause
    debuts_apres = [segs[i + 1][0] for i in range(len(segs) - 1)]
    total_syl = sum(s for p in mots for _, s in p)
    sortie_p, sortie_m, acc = [], [], 0
    debut = segs[0][0]
    for k, p in enumerate(mots):
        s = sum(x for _, x in p); acc += s
        fin = reel(parle_total * acc / total_syl)
        prochain = None
        if k < len(mots) - 1 and pauses:
            j = int(np.argmin([abs(t - fin) for t in pauses]))
            if abs(pauses[j] - fin) < 0.4: fin, prochain = pauses[j], debuts_apres[j]
        else: fin = segs[-1][1]
        # mots de la phrase, au prorata des syllabes
        t = debut
        for w, x in p:
            d = (fin - debut) * x / max(1, s)
            sortie_m.append({"mot": w, "debut": round(t, 3), "fin": round(t + d, 3), "image": int(round(t * FPS)), "phrase": k}); t += d
        sortie_p.append({"phrase": phrases[k], "debut": round(debut, 3), "fin": round(fin, 3), "image_debut": int(round(debut * FPS)), "image_fin": int(round(fin * FPS)), "syllabes": s})
        debut = prochain if prochain is not None else fin
    json.dump(sortie_p, open(os.path.join(a.sortie, "phrases.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(sortie_m, open(os.path.join(a.sortie, "mots.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"voix : {duree:.2f} s ({int(round(duree * FPS))} images), parole {parle_total:.1f} s, {len(segs)} passages, {total_syl} syllabes, {total_syl / parle_total:.1f} syll/s")
    for p in sortie_p: print(f"  {p['debut']:6.2f}-{p['fin']:6.2f}  [{p['image_debut']:4d}-{p['image_fin']:4d}]  {p['phrase'][:70]}")


if __name__ == "__main__":
    main()
