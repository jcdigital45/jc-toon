// JC Toon — textures peintes à la main sur canvas (aplats + joints sombres). Déterministes.
import { alea, assombrir, melanger, motifWax } from "./personnages.js";

const toile = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; };
const taches = (g, w, h, n, couleurs, rmin, rmax, r) => {
  for (let i = 0; i < n; i++) { g.fillStyle = couleurs[Math.floor(r() * couleurs.length)]; g.globalAlpha = 0.25 + r() * 0.35; g.beginPath(); g.ellipse(r() * w, r() * h, rmin + r() * (rmax - rmin), (rmin + r() * (rmax - rmin)) * 0.6, r() * 3, 0, 7); g.fill(); }
  g.globalAlpha = 1;
};

// sol de latérite (terre rouge) avec cailloux et zones plus sombres
export function laterite(base = "#b5643a", graine = 1) {
  const [c, g] = toile(512, 512), r = alea(graine);
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  taches(g, 512, 512, 60, [assombrir(base, 0.86), melanger(base, "#d9905a", 0.4), assombrir(base, 0.92)], 20, 70, r);
  for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.5 ? assombrir(base, 0.6) : melanger(base, "#f0c090", 0.5); g.fillRect(r() * 512, r() * 512, 2 + r() * 4, 2 + r() * 3); }
  return c;
}

// herbe sèche de savane
export function herbe(base = "#9aa045", graine = 2) {
  const [c, g] = toile(512, 512), r = alea(graine);
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  taches(g, 512, 512, 50, [assombrir(base, 0.85), melanger(base, "#d6c26a", 0.5)], 25, 80, r);
  g.lineWidth = 2;
  for (let i = 0; i < 700; i++) { const x = r() * 512, y = r() * 512; g.strokeStyle = r() < 0.5 ? assombrir(base, 0.7) : melanger(base, "#e8d88a", 0.5); g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 6, y - 6 - r() * 8); g.stroke(); }
  return c;
}

// mur en banco (terre crue) : enduit ocre, traînées de main, fissures
export function banco(base = "#c98a4e", graine = 3) {
  const [c, g] = toile(512, 512), r = alea(graine);
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) { g.strokeStyle = r() < 0.5 ? assombrir(base, 0.9) : melanger(base, "#e8b77c", 0.35); g.globalAlpha = 0.4; g.lineWidth = 10 + r() * 20; g.beginPath(); const x = r() * 512, y = r() * 512; g.arc(x, y, 20 + r() * 30, r() * 6, r() * 6 + 1.5); g.stroke(); }
  g.globalAlpha = 1; g.strokeStyle = assombrir(base, 0.55); g.lineWidth = 2;
  for (let i = 0; i < 8; i++) { let x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 30; y += 8 + r() * 14; g.lineTo(x, y); } g.stroke(); }
  // bande sombre en bas (éclaboussures de pluie)
  const gr = g.createLinearGradient(0, 430, 0, 512); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(60,25,10,0.35)"); g.fillStyle = gr; g.fillRect(0, 430, 512, 82);
  return c;
}

// toit de chaume : traits de paille en rangées
export function chaume(base = "#d2a752", graine = 4) {
  const [c, g] = toile(512, 512), r = alea(graine);
  g.fillStyle = assombrir(base, 0.8); g.fillRect(0, 0, 512, 512);
  for (let rang = 0; rang < 9; rang++) {
    const y0 = rang * 60;
    for (let i = 0; i < 160; i++) { const x = r() * 512; g.strokeStyle = r() < 0.4 ? assombrir(base, 0.72) : melanger(base, "#f0d48a", r() * 0.5); g.lineWidth = 3 + r() * 2; g.beginPath(); g.moveTo(x, y0 + r() * 8); g.lineTo(x + (r() - 0.5) * 8, y0 + 62 + r() * 10); g.stroke(); }
    g.strokeStyle = assombrir(base, 0.5); g.lineWidth = 3; g.beginPath(); g.moveTo(0, y0 + 64); g.lineTo(512, y0 + 64); g.stroke();
  }
  return c;
}

// tôle ondulée avec rouille
export function tole(base = "#9aa3a8", graine = 5) {
  const [c, g] = toile(512, 512), r = alea(graine);
  for (let x = 0; x < 512; x += 32) { const gr = g.createLinearGradient(x, 0, x + 32, 0); gr.addColorStop(0, assombrir(base, 0.7)); gr.addColorStop(0.5, melanger(base, "#ffffff", 0.25)); gr.addColorStop(1, assombrir(base, 0.7)); g.fillStyle = gr; g.fillRect(x, 0, 32, 512); }
  taches(g, 512, 512, 30, ["#a0522d", "#8b4513", "#b8692f"], 10, 50, r);
  g.fillStyle = assombrir(base, 0.4); g.fillRect(0, 0, 512, 6); g.fillRect(0, 256, 512, 4);
  return c;
}

// planches de bois
export function planches(base = "#9a6a3a", graine = 6) {
  const [c, g] = toile(512, 512), r = alea(graine);
  for (let y = 0; y < 512; y += 64) {
    g.fillStyle = melanger(base, r() < 0.5 ? "#000000" : "#ffffff", r() * 0.12); g.fillRect(0, y, 512, 64);
    g.strokeStyle = assombrir(base, 0.75); g.lineWidth = 2; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(0, y + 10 + k * 13 + r() * 4); g.bezierCurveTo(170, y + 6 + k * 13, 340, y + 16 + k * 13, 512, y + 10 + k * 13); g.stroke(); }
    g.fillStyle = assombrir(base, 0.4); g.fillRect(0, y + 60, 512, 4);
    g.fillRect(r() * 400 + 50, y, 4, 64);
  }
  return c;
}

// écorce de baobab : gris-brun lisse avec plis verticaux
export function ecorce(base = "#8d7a68", graine = 7) {
  const [c, g] = toile(512, 512), r = alea(graine);
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 40; i++) { const x = r() * 512; g.strokeStyle = r() < 0.6 ? assombrir(base, 0.72) : melanger(base, "#c4b4a0", 0.5); g.lineWidth = 4 + r() * 8; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + (r() - 0.5) * 60, 170, x + (r() - 0.5) * 60, 340, x + (r() - 0.5) * 30, 512); g.stroke(); }
  return c;
}

// feuillage peint (pour les boules d'arbres)
export function feuillage(base = "#4f8a3a", graine = 8) {
  const [c, g] = toile(256, 256), r = alea(graine);
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 220; i++) { g.fillStyle = r() < 0.5 ? assombrir(base, 0.78) : melanger(base, "#a8d060", 0.35); g.beginPath(); g.ellipse(r() * 256, r() * 256, 8 + r() * 10, 5 + r() * 6, r() * 3, 0, 7); g.fill(); }
  return c;
}

// tissu wax (auvents, nappes, pagnes étendus)
export function tissu(m) {
  const [c, g] = toile(256, 256); g.fillStyle = motifWax(g, { ...m, taille: 64 }); g.fillRect(0, 0, 256, 256); return c;
}

// enseigne peinte avec texte (lisible, accents compris)
export function enseigne(texte, fond = "#1f6fb2", encre = "#ffffff", largeur = 1024, hauteur = 256) {
  const [c, g] = toile(largeur, hauteur);
  g.fillStyle = fond; g.fillRect(0, 0, largeur, hauteur);
  g.strokeStyle = assombrir(fond, 0.5); g.lineWidth = 14; g.strokeRect(7, 7, largeur - 14, hauteur - 14);
  g.fillStyle = encre; g.font = `bold ${Math.round(hauteur * 0.5)}px "DejaVu Sans", sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(texte, largeur / 2, hauteur / 2 + 4);
  return c;
}
