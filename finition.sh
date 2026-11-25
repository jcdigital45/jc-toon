#!/usr/bin/env bash
# JC Toon — assemblage final + contrôle qualité.
# usage : bash finition.sh <dossier_images> <mix.wav> <sortie.mp4> ["Titre"]
# Encode les images (30 i/s) avec le son, puis vérifie : images noires, passages figés, volume, et fait une planche de contrôle.
set -euo pipefail
IMAGES="$1"; SON="$2"; SORTIE="$3"; TITRE="${4:-JC Toon}"
ICI="$(cd "$(dirname "$0")" && pwd)"
ffmpeg -v error -y -framerate 30 -i "$IMAGES/f%04d.jpg" -i "$SON" -map 0:v:0 -map 1:a:0 \
  -c:v libx264 -preset veryfast -crf 17 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest \
  -metadata title="$TITRE" -movflags +faststart "$SORTIE"
echo "== vidéo : $SORTIE"
ffprobe -v error -show_entries format=duration:stream=width,height,r_frame_rate -of compact "$SORTIE"
echo "== images noires (aucune ligne = OK)"
ffmpeg -v info -i "$SORTIE" -vf "blackdetect=d=0.1:pix_th=0.08" -an -f null - 2>&1 | grep -o "black_start.*" || true
echo "== passages figés de 0,4 s ou plus (aucune ligne = OK)"
ffmpeg -v info -i "$SORTIE" -vf "freezedetect=n=0.002:d=0.4" -an -f null - 2>&1 | grep -o "freeze_\(start\|duration\).*" || true
echo "== volume (cible -14 LUFS, crête < -1 dBTP)"
ffmpeg -v info -i "$SORTIE" -af ebur128=peak=true -vn -f null - 2>&1 | grep -A12 "Summary" | grep -E "I:|Peak:" || true
DIR="$(dirname "$SORTIE")"; mkdir -p "$DIR/controle"; rm -f "$DIR/controle/"*.jpg
ffmpeg -v error -i "$SORTIE" -vf "fps=1.5,scale=270:-1" "$DIR/controle/f%04d.jpg"
python3 "$ICI/planche_images.py" "$DIR/controle" "$DIR/planche_controle.jpg" 8 270
echo "== planche de contrôle : $DIR/planche_controle.jpg"
