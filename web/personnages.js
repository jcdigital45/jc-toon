// JC Toon — bibliothèque de personnages 2D (Canvas2D), écrite de zéro pour JC Digital.
// Style : têtes « galet », grands yeux ovales avec reflet, contour brun-noir plus épais côté ombre,
// ombre en croissant, tissus wax à motifs. Espace de dessin : 640 x 1000 unités, sol à y = 980.
// Tout est déterministe : même définition + même pose = même image.

export const ENCRE = "#1e130f";
export const LARG = 640, HAUT = 1000, SOL = 980;

// ---------- couleurs ----------
const rgb = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const enHex = (a) => "#" + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
export const assombrir = (c, k = 0.8) => enHex(rgb(c).map((v) => v * k));
export const melanger = (a, b, t) => { const A = rgb(a), B = rgb(b); return enHex(A.map((v, i) => v + (B[i] - v) * t)); };
// ombre légèrement violacée (jamais grise ni brune) : on assombrit puis on tire vers un bleu-violet
const ombreDe = (c) => melanger(assombrir(c, 0.74), "#3a2a5a", 0.12);

export const PEAUX = { tresFoncee: "#4a2a1a", foncee: "#64391f", moyenne: "#82502c", claire: "#a36a3e", rose: "#e9b48f" };

// ---------- générateur pseudo-aléatoire ----------
export const alea = (graine) => { let s = (graine >>> 0) || 7; return () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296); };

// ---------- motifs wax ----------
const cacheMotifs = new Map();
export function motifWax(ctx, m) {
  // m = { type: "cercles" | "losanges" | "vagues" | "feuilles" | "rayures", c: [fond, c1, c2], taille }
  const cle = JSON.stringify(m);
  if (cacheMotifs.has(cle)) return ctx.createPattern(cacheMotifs.get(cle), "repeat");
  const t = m.taille || 84, cv = document.createElement("canvas"); cv.width = cv.height = t;
  const g = cv.getContext("2d"), [fond, c1, c2] = m.c;
  g.fillStyle = fond; g.fillRect(0, 0, t, t); g.lineWidth = t * 0.06;
  if (m.type === "cercles") {
    for (const [x, y] of [[t / 2, t / 2], [0, 0], [t, 0], [0, t], [t, t]]) {
      g.fillStyle = c1; g.beginPath(); g.arc(x, y, t * 0.3, 0, 7); g.fill();
      g.fillStyle = c2; g.beginPath(); g.arc(x, y, t * 0.17, 0, 7); g.fill();
      g.fillStyle = fond; g.beginPath(); g.arc(x, y, t * 0.07, 0, 7); g.fill();
    }
  } else if (m.type === "losanges") {
    g.fillStyle = c1; g.beginPath(); g.moveTo(t / 2, t * 0.06); g.lineTo(t * 0.94, t / 2); g.lineTo(t / 2, t * 0.94); g.lineTo(t * 0.06, t / 2); g.fill();
    g.fillStyle = c2; g.beginPath(); g.moveTo(t / 2, t * 0.28); g.lineTo(t * 0.72, t / 2); g.lineTo(t / 2, t * 0.72); g.lineTo(t * 0.28, t / 2); g.fill();
  } else if (m.type === "vagues") {
    for (let k = 0; k < 3; k++) {
      g.strokeStyle = k === 1 ? c2 : c1; g.lineWidth = t * 0.1; g.beginPath();
      for (let x = 0; x <= t; x += 2) g.lineTo(x, t * (0.18 + k * 0.32) + Math.sin((x / t) * Math.PI * 2) * t * 0.08);
      g.stroke();
    }
  } else if (m.type === "feuilles") {
    for (const [x, y, r] of [[t * 0.3, t * 0.3, 0.6], [t * 0.75, t * 0.75, -0.9]]) {
      g.save(); g.translate(x, y); g.rotate(r);
      g.fillStyle = c1; g.beginPath(); g.ellipse(0, 0, t * 0.26, t * 0.11, 0, 0, 7); g.fill();
      g.strokeStyle = c2; g.lineWidth = t * 0.04; g.beginPath(); g.moveTo(-t * 0.24, 0); g.lineTo(t * 0.24, 0); g.stroke();
      g.restore();
    }
    g.fillStyle = c2; g.beginPath(); g.arc(t * 0.78, t * 0.22, t * 0.07, 0, 7); g.arc(t * 0.2, t * 0.8, t * 0.07, 0, 7); g.fill();
  } else { // rayures
    g.fillStyle = c1; g.fillRect(0, 0, t, t * 0.3); g.fillStyle = c2; g.fillRect(0, t * 0.5, t, t * 0.12);
  }
  cacheMotifs.set(cle, cv);
  return ctx.createPattern(cv, "repeat");
}

// ---------- forme encrée : contour plus épais côté ombre + croissant d'ombre ----------
// cote = +1 : lumière à gauche (ombre à droite) ; -1 : l'inverse
function forme(ctx, chemin, rempli, o = {}) {
  const ep = o.ep ?? 7, cote = o.cote ?? 1, ombre = o.ombre ?? true;
  // 1. épaisseur supplémentaire de l'encre du côté ombre
  ctx.save(); ctx.translate(3.5 * cote, 4); ctx.fillStyle = ENCRE; ctx.fill(chemin); ctx.restore();
  // 2. couleur de base
  ctx.fillStyle = rempli; ctx.fill(chemin);
  // 3. croissant d'ombre : on assombrit tout puis on remet la base décalée vers la lumière
  if (ombre) {
    ctx.save(); ctx.clip(chemin);
    ctx.fillStyle = o.teinteOmbre || "rgba(40,18,60,0.30)"; ctx.fill(chemin);
    ctx.translate(-(o.decal ?? 16) * cote, -(o.decal ?? 16) * 0.45); ctx.fillStyle = rempli; ctx.fill(chemin);
    ctx.restore();
  }
  // 4. trait
  ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.lineWidth = ep; ctx.strokeStyle = ENCRE; ctx.stroke(chemin);
}

// membre en capsule (bras, jambe) : trait d'encre large puis trait de couleur
function membre(ctx, pts, larg, coul) {
  const p = new Path2D(); p.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) p.lineTo(q[0], q[1]);
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.strokeStyle = ENCRE; ctx.lineWidth = larg + 13; ctx.stroke(p);
  ctx.strokeStyle = coul; ctx.lineWidth = larg; ctx.stroke(p);
}
function rond(ctx, x, y, r, coul, ep = 5) {
  const p = new Path2D(); p.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = coul; ctx.fill(p); ctx.lineWidth = ep; ctx.strokeStyle = ENCRE; ctx.stroke(p);
}

// ---------- squelette selon le gabarit ----------
export function squelette(gab = "adulte") {
  const G = {
    adulte: { tete: [218, 250], cou: 30, epaules: 150, hanches: 120, torse: 260, jambe: 330, bras: [118, 112], main: 18 },
    fort:   { tete: [226, 252], cou: 30, epaules: 176, hanches: 160, torse: 262, jambe: 320, bras: [118, 112], main: 19 },
    mince:  { tete: [210, 250], cou: 34, epaules: 136, hanches: 104, torse: 262, jambe: 338, bras: [120, 114], main: 17 },
    enfant: { tete: [214, 232], cou: 18, epaules: 112, hanches: 96, torse: 160, jambe: 196, bras: [80, 76], main: 15 },
  }[gab] || {};
  const pied = SOL - 12, hanche = pied - G.jambe, epaule = hanche - G.torse, cou = epaule - G.cou + 6;
  return { ...G, gab, pied, hanche, epaule, cou, cxTete: LARG / 2, cyTete: cou - G.tete[1] / 2 + 14 };
}

// ---------- poses de bras ----------
// [angle du bras depuis la verticale vers l'extérieur, flexion du coude] en degrés.
// Coude positif = l'avant-bras continue vers l'extérieur / le haut ; négatif = il revient vers le corps.
export const BRAS = {
  repos: [9, -4], ecarte: [32, 6], hanches: [48, -98], montre: [88, 2], montreHaut: [128, 4],
  leve: [168, 4], salut: [140, 26], porte: [150, 64], croise: [16, -106], pouce: [26, 150],
  tete: [146, 92], menton: [14, 172], offre: [44, 54], coeur: [16, -128], tient: [22, 58], marche: [0, -10],
};

function bras(sk, cote, pose, anim = 0) {
  // cote = -1 : bras à gauche de l'écran, +1 : à droite
  let [a1, a2] = Array.isArray(pose) ? pose : (BRAS[pose] || BRAS.repos);
  if (pose === "salut") a2 += Math.sin(anim * 0.5) * 22;
  if (pose === "marche") a1 += Math.sin(anim) * 18 * cote;
  const r = Math.PI / 180, ex = LARG / 2 + cote * (sk.epaules / 2 - 8), ey = sk.epaule + 14;
  const t1 = a1 * r, t2 = (a1 + a2) * r;
  const cx = ex + cote * Math.sin(t1) * sk.bras[0], cy = ey + Math.cos(t1) * sk.bras[0];
  const mx = cx + cote * Math.sin(t2) * sk.bras[1], my = cy + Math.cos(t2) * sk.bras[1];
  return { e: [ex, ey], c: [cx, cy], m: [mx, my] };
}

// ---------- tête ----------
function cheminTete(cx, cy, w, h) {
  // galet : crâne large, joues pleines, menton un peu plus étroit
  const p = new Path2D(), rx = w / 2, ry = h / 2, k = 0.56;
  p.moveTo(cx, cy - ry);
  p.bezierCurveTo(cx + rx * k * 1.05, cy - ry, cx + rx, cy - ry * k, cx + rx, cy + ry * 0.02);
  p.bezierCurveTo(cx + rx, cy + ry * 0.55, cx + rx * 0.62, cy + ry, cx, cy + ry);
  p.bezierCurveTo(cx - rx * 0.62, cy + ry, cx - rx, cy + ry * 0.55, cx - rx, cy + ry * 0.02);
  p.bezierCurveTo(cx - rx, cy - ry * k, cx - rx * k * 1.05, cy - ry, cx, cy - ry);
  return p;
}

// ---------- expressions ----------
// s : sourcils [inclinaison, hauteur] ; p : paupières 0..1 ; b : bouche ; r : direction du regard
export const VISAGES = {
  neutre: { s: [0, 0], p: 0.1, b: "neutre" },
  sourire: { s: [-4, 2], p: 0.15, b: "sourire" },
  rire: { s: [-8, 6], p: 0.55, b: "rire", yeuxRieurs: true },
  surpris: { s: [0, 16], p: 0, b: "o", pupille: 0.75 },
  choque: { s: [6, 20], p: 0, b: "cri", pupille: 0.6 },
  triste: { s: [16, 4], p: 0.35, b: "triste" },
  colere: { s: [-20, -6], p: 0.3, b: "serre" },
  peur: { s: [14, 14], p: 0, b: "tremble", pupille: 0.65 },
  malin: { s: [-10, 0], p: 0.35, b: "malin", clin: true },
  dort: { s: [4, -2], p: 1, b: "dort" },
  decide: { s: [-14, -2], p: 0.25, b: "plat" },
  doute: { s: [0, 0], p: 0.3, b: "moue", sourcilLeve: true },
  fier: { s: [-6, 4], p: 0.45, b: "sourire" },
  pleure: { s: [18, 6], p: 0.3, b: "triste", larmes: true },
};

function visage(ctx, sk, def, expr, regard, cote) {
  const v = VISAGES[expr] || VISAGES.neutre, cx = sk.cxTete, cy = sk.cyTete, [w, h] = sk.tete;
  const ey = cy + h * 0.02, ecart = w * 0.19, ew = w * 0.1, eh = h * 0.12, peau = def.peau;
  const [rx, ry] = regard || [0, 0];
  for (const s of [-1, 1]) {
    const x = cx + s * ecart;
    const clin = v.clin && s === 1;
    if (v.p >= 0.98 || clin) { // œil fermé : arc
      ctx.strokeStyle = ENCRE; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath();
      if (v.yeuxRieurs || clin) ctx.arc(x, ey + eh * 0.25, ew * 0.9, Math.PI * 1.15, Math.PI * 1.85);
      else ctx.arc(x, ey - eh * 0.1, ew * 0.9, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    } else if (v.yeuxRieurs) {
      ctx.strokeStyle = ENCRE; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, ey + eh * 0.3, ew * 0.85, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
    } else {
      const oeil = new Path2D(); oeil.ellipse(x, ey, ew, eh, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#fbf6ee"; ctx.fill(oeil);
      ctx.save(); ctx.clip(oeil);
      const pr = ew * 0.62 * (v.pupille || 1);
      ctx.fillStyle = "#2a1712"; ctx.beginPath(); ctx.ellipse(x + rx * ew * 0.42, ey + eh * 0.12 + ry * eh * 0.3, pr, pr * 1.12, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(x + rx * ew * 0.42 - pr * 0.35, ey - eh * 0.12 + ry * eh * 0.3, pr * 0.3, 0, 7); ctx.fill();
      if (v.p > 0) { ctx.fillStyle = peau; ctx.fillRect(x - ew * 1.2, ey - eh * 1.2, ew * 2.4, eh * 2.4 * v.p * 0.5 + eh * 0.2); ctx.strokeStyle = ENCRE; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - ew * 1.1, ey - eh * 1.0 + eh * 2.4 * v.p * 0.5 + eh * 0.2); ctx.lineTo(x + ew * 1.1, ey - eh * 1.0 + eh * 2.4 * v.p * 0.5 + eh * 0.2); ctx.stroke(); }
      ctx.restore();
      ctx.lineWidth = 5; ctx.strokeStyle = ENCRE; ctx.stroke(oeil);
    }
    // sourcil
    const [inc, hau] = v.s, lev = v.sourcilLeve && s === 1 ? 12 : 0;
    const by = ey - eh - 16 - hau - lev, ang = (inc * Math.PI) / 180;
    ctx.strokeStyle = def.sourcils || ENCRE; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.beginPath();
    ctx.moveTo(x - s * ew * 0.95 * Math.cos(ang) * -1 - ew * 0.95 * (s < 0 ? 1 : -1) * 0, by);
    const dx = ew * 0.95, dy = Math.tan(ang) * dx;
    ctx.beginPath(); ctx.moveTo(x - dx, by + (s < 0 ? -dy : dy)); ctx.lineTo(x + dx, by + (s < 0 ? dy : -dy)); ctx.stroke();
    if (v.larmes) { ctx.fillStyle = "#8fd3ff"; ctx.strokeStyle = ENCRE; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x + s * ew * 0.6, ey + eh * 1.6, 6, 10, 0, 0, 7); ctx.fill(); ctx.stroke(); }
  }
  // nez
  ctx.strokeStyle = assombrir(peau, 0.62); ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.beginPath();
  ctx.arc(cx + 4 * cote, cy + h * 0.15, w * 0.045, -0.3, Math.PI * 0.75); ctx.stroke();
  // bouche
  const by = cy + h * 0.29, bw = w * 0.15, b = v.b;
  ctx.strokeStyle = ENCRE; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.lineJoin = "round";
  const levres = (p) => { ctx.fillStyle = "#4a1712"; ctx.fill(p); ctx.save(); ctx.clip(p); ctx.fillStyle = "#e46a5c"; ctx.beginPath(); ctx.ellipse(cx, by + bw * 0.75, bw * 0.6, bw * 0.4, 0, 0, 7); ctx.fill(); ctx.restore(); ctx.stroke(p); };
  if (b === "neutre") { ctx.beginPath(); ctx.moveTo(cx - bw * 0.6, by); ctx.quadraticCurveTo(cx, by + 6, cx + bw * 0.6, by); ctx.stroke(); }
  else if (b === "sourire") { ctx.beginPath(); ctx.moveTo(cx - bw, by - 6); ctx.quadraticCurveTo(cx, by + bw * 0.8, cx + bw, by - 6); ctx.stroke(); }
  else if (b === "rire") { const p = new Path2D(); p.moveTo(cx - bw * 1.1, by - 8); p.quadraticCurveTo(cx, by - 2, cx + bw * 1.1, by - 8); p.quadraticCurveTo(cx + bw * 0.9, by + bw * 1.3, cx, by + bw * 1.35); p.quadraticCurveTo(cx - bw * 0.9, by + bw * 1.3, cx - bw * 1.1, by - 8); levres(p); ctx.fillStyle = "#fbf6ee"; ctx.save(); ctx.clip(p); ctx.fillRect(cx - bw, by - 10, bw * 2, 14); ctx.restore(); ctx.stroke(p); }
  else if (b === "o") { const p = new Path2D(); p.ellipse(cx, by + 8, bw * 0.38, bw * 0.5, 0, 0, 7); levres(p); }
  else if (b === "cri") { const p = new Path2D(); p.ellipse(cx, by + 14, bw * 0.7, bw * 0.95, 0, 0, 7); levres(p); }
  else if (b === "triste") { ctx.beginPath(); ctx.moveTo(cx - bw * 0.8, by + 12); ctx.quadraticCurveTo(cx, by - 10, cx + bw * 0.8, by + 12); ctx.stroke(); }
  else if (b === "serre") { ctx.beginPath(); ctx.moveTo(cx - bw * 0.8, by + 6); ctx.lineTo(cx - bw * 0.2, by); ctx.lineTo(cx + bw * 0.3, by + 4); ctx.lineTo(cx + bw * 0.8, by - 2); ctx.stroke(); }
  else if (b === "tremble") { ctx.beginPath(); for (let i = 0; i <= 8; i++) ctx.lineTo(cx - bw + (i * bw) / 4, by + 6 + (i % 2 ? -5 : 5)); ctx.stroke(); }
  else if (b === "malin") { ctx.beginPath(); ctx.moveTo(cx - bw * 0.8, by + 2); ctx.quadraticCurveTo(cx + bw * 0.1, by + 10, cx + bw, by - 10); ctx.stroke(); }
  else if (b === "dort") { ctx.beginPath(); ctx.ellipse(cx, by + 6, bw * 0.25, bw * 0.2, 0, 0, 7); ctx.stroke(); }
  else if (b === "plat") { ctx.beginPath(); ctx.moveTo(cx - bw * 0.75, by + 2); ctx.lineTo(cx + bw * 0.75, by + 2); ctx.stroke(); }
  else if (b === "moue") { ctx.beginPath(); ctx.moveTo(cx - bw * 0.6, by + 6); ctx.quadraticCurveTo(cx + bw * 0.2, by - 4, cx + bw * 0.7, by + 4); ctx.stroke(); }
}

// ---------- cheveux et coiffes ----------
function cheveuxArriere(ctx, sk, def) {
  const cx = sk.cxTete, cy = sk.cyTete, [w, h] = sk.tete, col = def.cheveux || "#1a1210";
  if (def.coupe === "afro") { const p = new Path2D(); p.ellipse(cx, cy - h * 0.12, w * 0.6, h * 0.5, 0, 0, 7); forme(ctx, p, col, { decal: 10 }); }
  if (def.coupe === "tresses") {
    for (let i = -4; i <= 4; i++) { if (Math.abs(i) < 3) continue; membre(ctx, [[cx + i * w * 0.11, cy - h * 0.2], [cx + i * w * 0.12, cy + h * 0.55]], 13, col); }
  }
}
function cheveuxAvant(ctx, sk, def) {
  const cx = sk.cxTete, cy = sk.cyTete, [w, h] = sk.tete, col = def.cheveux || "#1a1210";
  if (!def.coupe || def.coupe === "rase" || def.coiffe === "foulard") return;
  // calotte bosselée
  const p = new Path2D(), n = def.coupe === "afro" ? 11 : 9, ry = h * (def.coupe === "afro" ? 0.56 : 0.5);
  p.moveTo(cx - w * 0.5, cy - h * 0.02);
  for (let i = 0; i <= n; i++) {
    const a = Math.PI + (i / n) * Math.PI, x = cx + Math.cos(a) * w * 0.52, y = cy - h * 0.06 + Math.sin(a) * ry;
    const am = Math.PI + ((i - 0.5) / n) * Math.PI;
    if (i > 0) p.quadraticCurveTo(cx + Math.cos(am) * w * 0.6, cy - h * 0.06 + Math.sin(am) * ry * 1.1, x, y); else p.lineTo(x, y);
  }
  p.lineTo(cx + w * 0.5, cy - h * 0.02); p.quadraticCurveTo(cx + w * 0.38, cy - h * 0.26, cx + w * 0.1, cy - h * 0.3);
  p.quadraticCurveTo(cx - w * 0.3, cy - h * 0.3, cx - w * 0.5, cy - h * 0.02);
  forme(ctx, p, def.blanc ? "#e8e4dc" : col, { decal: 8, ep: 6 });
  if (def.coupe === "tresses") { ctx.strokeStyle = melanger(col, "#ffffff", 0.18); ctx.lineWidth = 4; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(cx + i * w * 0.1, cy - h * 0.48 + Math.abs(i) * 6); ctx.lineTo(cx + i * w * 0.14, cy - h * 0.12); ctx.stroke(); } }
}
function barbe(ctx, sk, def) {
  if (!def.barbe) return;
  const cx = sk.cxTete, cy = sk.cyTete, [w, h] = sk.tete, col = def.barbe === "blanche" ? "#ece8e0" : def.cheveux || "#1a1210";
  const p = new Path2D(); p.moveTo(cx - w * 0.42, cy + h * 0.12);
  p.quadraticCurveTo(cx - w * 0.36, cy + h * 0.62, cx, cy + h * (def.barbeLongue ? 0.78 : 0.62));
  p.quadraticCurveTo(cx + w * 0.36, cy + h * 0.62, cx + w * 0.42, cy + h * 0.12);
  p.quadraticCurveTo(cx + w * 0.2, cy + h * 0.36, cx, cy + h * 0.38); p.quadraticCurveTo(cx - w * 0.2, cy + h * 0.36, cx - w * 0.42, cy + h * 0.12);
  forme(ctx, p, col, { decal: 6, ep: 5 });
}
function moustache(ctx, sk, def) {
  if (!def.moustache) return;
  const cx = sk.cxTete, cy = sk.cyTete, [w, h] = sk.tete, col = def.barbe === "blanche" ? "#ece8e0" : def.cheveux || "#1a1210";
  const p = new Path2D(); p.moveTo(cx, cy + h * 0.22);
  p.quadraticCurveTo(cx + w * 0.14, cy + h * 0.17, cx + w * 0.17, cy + h * 0.27); p.quadraticCurveTo(cx + w * 0.08, cy + h * 0.25, cx, cy + h * 0.25);
  p.quadraticCurveTo(cx - w * 0.08, cy + h * 0.25, cx - w * 0.17, cy + h * 0.27); p.quadraticCurveTo(cx - w * 0.14, cy + h * 0.17, cx, cy + h * 0.22);
  forme(ctx, p, col, { ombre: false, ep: 4 });
}
function coiffe(ctx, sk, def, cote) {
  const cx = sk.cxTete, cy = sk.cyTete, [w, h] = sk.tete, c = def.coiffe;
  if (!c) return;
  const tissu = def.coiffeWax ? motifWax(ctx, def.coiffeWax) : def.coiffeCouleur || "#d23b2a";
  if (c === "foulard") { // foulard noué (gélé) : grand volume plissé + nœud
    const p = new Path2D(); p.moveTo(cx - w * 0.54, cy - h * 0.02);
    p.bezierCurveTo(cx - w * 0.75, cy - h * 0.55, cx - w * 0.3, cy - h * 0.95, cx + w * 0.05, cy - h * 0.82);
    p.bezierCurveTo(cx + w * 0.45, cy - h * 0.98, cx + w * 0.8, cy - h * 0.55, cx + w * 0.54, cy - h * 0.02);
    p.quadraticCurveTo(cx, cy - h * 0.2, cx - w * 0.54, cy - h * 0.02);
    forme(ctx, p, tissu, { cote, decal: 14 });
    ctx.strokeStyle = ENCRE; ctx.lineWidth = 4; for (const k of [-0.25, 0.05, 0.3]) { ctx.beginPath(); ctx.moveTo(cx + w * k - 30, cy - h * 0.2); ctx.quadraticCurveTo(cx + w * k, cy - h * 0.55, cx + w * k + 26, cy - h * 0.78); ctx.stroke(); }
    const n = new Path2D(); n.moveTo(cx + w * 0.12, cy - h * 0.8); n.quadraticCurveTo(cx + w * 0.5, cy - h * 1.15, cx + w * 0.42, cy - h * 0.72); n.quadraticCurveTo(cx + w * 0.3, cy - h * 0.82, cx + w * 0.12, cy - h * 0.8);
    forme(ctx, n, tissu, { cote, decal: 6, ep: 6 });
    const n2 = new Path2D(); n2.moveTo(cx - w * 0.02, cy - h * 0.82); n2.quadraticCurveTo(cx - w * 0.38, cy - h * 1.1, cx - w * 0.3, cy - h * 0.7); n2.quadraticCurveTo(cx - w * 0.18, cy - h * 0.8, cx - w * 0.02, cy - h * 0.82);
    forme(ctx, n2, tissu, { cote, decal: 6, ep: 6 });
  } else if (c === "kufi" || c === "chechia") { // bonnet rond / chéchia
    const haut = c === "chechia" ? h * 0.36 : h * 0.28, bas = cy - h * 0.34, lw = c === "chechia" ? w * 0.36 : w * 0.46;
    const p = new Path2D(); p.moveTo(cx - lw, bas + 10); p.lineTo(cx - lw * 0.92, bas - haut + 12);
    p.quadraticCurveTo(cx, bas - haut - 14, cx + lw * 0.92, bas - haut + 12); p.lineTo(cx + lw, bas + 10); p.quadraticCurveTo(cx, bas + 26, cx - lw, bas + 10);
    forme(ctx, p, tissu, { cote, decal: 10 });
    if (c === "kufi") { ctx.strokeStyle = def.coiffeBrod || "#d9b54a"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx - lw * 0.95, bas - 6); ctx.quadraticCurveTo(cx, bas + 8, cx + lw * 0.95, bas - 6); ctx.stroke(); }
    else { ctx.strokeStyle = ENCRE; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(cx, bas - haut - 2); ctx.quadraticCurveTo(cx + 40, bas - haut + 10, cx + 52, bas - haut / 2); ctx.stroke(); ctx.strokeStyle = "#1c1c2a"; ctx.lineWidth = 4; ctx.stroke(); rond(ctx, cx + 52, bas - haut / 2 + 8, 9, "#1c1c2a", 4); }
  } else if (c === "casquette") {
    const p = new Path2D(); p.moveTo(cx - w * 0.52, cy - h * 0.18); p.bezierCurveTo(cx - w * 0.52, cy - h * 0.72, cx + w * 0.52, cy - h * 0.72, cx + w * 0.52, cy - h * 0.18); p.closePath();
    forme(ctx, p, tissu, { cote });
    const v = new Path2D(); v.moveTo(cx - w * 0.1 * cote, cy - h * 0.2); v.quadraticCurveTo(cx + w * 0.55 * cote, cy - h * 0.28, cx + w * 0.72 * cote, cy - h * 0.12); v.quadraticCurveTo(cx + w * 0.3 * cote, cy - h * 0.1, cx - w * 0.1 * cote, cy - h * 0.2);
    forme(ctx, v, assombrir(def.coiffeCouleur || "#d23b2a", 0.85), { ombre: false, ep: 6 });
  } else if (c === "paille") {
    const bord = new Path2D(); bord.ellipse(cx, cy - h * 0.3, w * 0.82, h * 0.12, 0, 0, 7); forme(ctx, bord, "#e2bd62", { cote, decal: 8 });
    const cal = new Path2D(); cal.moveTo(cx - w * 0.4, cy - h * 0.3); cal.bezierCurveTo(cx - w * 0.42, cy - h * 0.78, cx + w * 0.42, cy - h * 0.78, cx + w * 0.4, cy - h * 0.3); cal.quadraticCurveTo(cx, cy - h * 0.22, cx - w * 0.4, cy - h * 0.3);
    forme(ctx, cal, "#ecc970", { cote, decal: 10 });
    ctx.strokeStyle = "#a8402c"; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(cx - w * 0.41, cy - h * 0.36); ctx.quadraticCurveTo(cx, cy - h * 0.28, cx + w * 0.41, cy - h * 0.36); ctx.stroke();
  }
}

// ---------- vêtements ----------
// def.tenue : { type, haut, bas, manches ("courtes" | "longues" | "larges"), wax (motif), brod, ceinture, chaussures }
function jambes(ctx, sk, def, marche) {
  const t = def.tenue, pied = sk.pied, ec = sk.hanches * 0.26;
  const pas = marche == null ? 0 : Math.sin(marche);
  const jambesNues = t.bas === "short" || t.bas === "jupeCourte";
  const pts = [];
  for (const s of [-1, 1]) {
    const avance = s * pas * 46, leve = Math.max(0, -s * pas) * 22;
    pts.push({ s, h: [LARG / 2 + s * ec, sk.hanche + 10], g: [LARG / 2 + s * ec * 1.05 + avance * 0.45, (sk.hanche + pied) / 2 - leve * 0.4], p: [LARG / 2 + s * ec * 1.1 + avance, pied - leve] });
  }
  for (const j of pts) {
    if (jambesNues || t.type === "robe" || t.type === "boubou" ) membre(ctx, [j.h, j.g, j.p], sk.gab === "enfant" ? 24 : 28, def.peau);
    if (!jambesNues && t.type !== "robe") membre(ctx, [j.h, j.g, j.p.map((v, i) => (i ? v - 10 : v))], sk.gab === "enfant" ? 40 : 48, t.couleurBas || "#33415e");
    if (t.bas === "short") membre(ctx, [j.h, [j.g[0], j.g[1] - (sk.gab === "enfant" ? 14 : 30)]], sk.gab === "enfant" ? 40 : 50, t.couleurBas || "#c8a36a");
    if (t.bandes) membre(ctx, [[j.p[0], j.p[1] - 90], [j.p[0], j.p[1] - 14]], 44, t.bandes);
    // pied / chaussure
    const ch = t.chaussures || "sandales", pc = new Path2D();
    pc.ellipse(j.p[0] + j.s * 10, j.p[1] + 2, sk.gab === "enfant" ? 30 : 38, 17, 0, 0, 7);
    forme(ctx, pc, ch === "pieds" || ch === "sandales" ? def.peau : ch, { ombre: false, ep: 6 });
    if (ch === "sandales") { ctx.strokeStyle = t.couleurSandale || "#7a3b1e"; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(j.p[0] + j.s * 10 - 18, j.p[1] - 6); ctx.lineTo(j.p[0] + j.s * 10 + 18, j.p[1] - 6); ctx.stroke(); }
    if (ch === "baskets") { ctx.fillStyle = "#f4f1ea"; ctx.fillRect(j.p[0] + j.s * 10 - 34, j.p[1] + 8, 68, 8); }
  }
}

function corps(ctx, sk, def, cote) {
  const t = def.tenue, x = LARG / 2, eY = sk.epaule, hY = sk.hanche, ew = sk.epaules / 2, hw = sk.hanches / 2;
  const tissuHaut = t.waxHaut ? motifWax(ctx, t.waxHaut) : t.haut;
  if (t.type === "boubou") {
    // grand boubou : trapèze ample jusqu'aux chevilles
    const basY = sk.pied - 52, lb = ew * 1.55, p = new Path2D();
    p.moveTo(x - ew + 6, eY + 6); p.quadraticCurveTo(x, eY - 14, x + ew - 6, eY + 6);
    p.quadraticCurveTo(x + lb * 1.02, (eY + basY) * 0.5, x + lb, basY); p.quadraticCurveTo(x, basY + 18, x - lb, basY);
    p.quadraticCurveTo(x - lb * 1.02, (eY + basY) * 0.5, x - ew + 6, eY + 6);
    forme(ctx, p, t.wax ? motifWax(ctx, t.wax) : t.haut, { cote, decal: 22 });
    // broderie du col
    ctx.strokeStyle = t.brod || "#e0b84a"; ctx.lineWidth = 7; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x - 34, eY + 2); ctx.quadraticCurveTo(x, eY + 120, x + 34, eY + 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 50, eY + 6); ctx.quadraticCurveTo(x, eY + 160, x + 50, eY + 6); ctx.stroke();
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(x, eY + 150 + i * 20, 5, 0, 7); ctx.stroke(); }
    return;
  }
  if (t.type === "robe") { // kaba / pagne : haut ajusté + jupe longue évasée
    const tY = hY - 20, basY = sk.pied - 44, p = new Path2D();
    p.moveTo(x - hw * 0.95, tY); p.quadraticCurveTo(x - hw * 1.25, (tY + basY) / 2, x - hw * 1.18, basY);
    p.quadraticCurveTo(x, basY + 16, x + hw * 1.18, basY); p.quadraticCurveTo(x + hw * 1.25, (tY + basY) / 2, x + hw * 0.95, tY); p.closePath();
    forme(ctx, p, t.wax ? motifWax(ctx, t.wax) : t.bas, { cote, decal: 18 });
    if (t.liseré) { ctx.strokeStyle = t.liseré; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(x - hw * 1.14, basY - 18); ctx.quadraticCurveTo(x, basY - 2, x + hw * 1.14, basY - 18); ctx.stroke(); }
  }
  if (t.type === "jupe") { // jupe genoux
    const tY = hY - 16, basY = hY + (sk.gab === "enfant" ? 100 : 170), p = new Path2D();
    p.moveTo(x - hw, tY); p.lineTo(x - hw * 1.3, basY); p.quadraticCurveTo(x, basY + 12, x + hw * 1.3, basY); p.lineTo(x + hw, tY); p.closePath();
    forme(ctx, p, t.wax ? motifWax(ctx, t.wax) : t.bas, { cote, decal: 16 });
  }
  // torse (chemise, tee-shirt, haut de robe, uniforme)
  const bas = t.type === "robe" || t.type === "jupe" ? hY - 6 : hY + 22, p = new Path2D();
  p.moveTo(x - ew, eY + 22); p.quadraticCurveTo(x - ew, eY, x - ew + 30, eY);
  p.lineTo(x + ew - 30, eY); p.quadraticCurveTo(x + ew, eY, x + ew, eY + 22);
  p.quadraticCurveTo(x + ew * 0.98, (eY + bas) / 2, x + hw * 1.04, bas); p.quadraticCurveTo(x, bas + 10, x - hw * 1.04, bas);
  p.quadraticCurveTo(x - ew * 0.98, (eY + bas) / 2, x - ew, eY + 22);
  forme(ctx, p, tissuHaut, { cote, decal: 20 });
  ctx.strokeStyle = ENCRE; ctx.lineWidth = 5;
  if (t.col === "chemise") { // col en V + boutons
    const c = new Path2D(); c.moveTo(x - 36, eY - 2); c.lineTo(x, eY + 48); c.lineTo(x + 36, eY - 2); c.lineTo(x + 14, eY + 6); c.lineTo(x, eY + 26); c.lineTo(x - 14, eY + 6); c.closePath();
    forme(ctx, c, melanger(t.haut || "#ffffff", "#ffffff", 0.3), { ombre: false, ep: 4 });
    for (let i = 0; i < 4; i++) rond(ctx, x, eY + 70 + i * ((bas - eY - 90) / 3), 5, "#f3efe6", 3);
  } else if (t.col === "rond") { ctx.beginPath(); ctx.arc(x, eY - 4, 30, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
  if (t.logo) { rond(ctx, x + 24 * cote, eY + 90, 22, t.logo, 4); }
  if (t.ceinture) { ctx.fillStyle = t.ceinture; ctx.strokeStyle = ENCRE; ctx.lineWidth = 5; ctx.beginPath(); ctx.rect(x - hw * 1.04, hY - 4, hw * 2.08, 22); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#d9b54a"; ctx.fillRect(x - 12, hY - 2, 24, 18); ctx.strokeRect(x - 12, hY - 2, 24, 18); }
  if (t.poches) { ctx.strokeStyle = ENCRE; ctx.lineWidth = 4; for (const s of [-1, 1]) ctx.strokeRect(x + s * ew * 0.5 - 22, eY + 50, 44, 40); }
}

function dessinerBras(ctx, sk, def, cote, pose, anim, devant) {
  const b = bras(sk, cote, pose, anim), t = def.tenue, man = t.manches || "courtes";
  const larg = sk.gab === "enfant" ? 26 : 30, tissu = t.waxHaut ? t.waxHaut.c[0] : (t.type === "boubou" && t.wax ? t.wax.c[0] : t.haut);
  if (man === "larges") { // manche de boubou : manche ample + pan de tissu qui pend sous l'avant-bras
    membre(ctx, [b.c, b.m], larg - 4, def.peau);
    const d = [b.m[0] - b.c[0], b.m[1] - b.c[1]], s = [b.c[0] + d[0] * 0.6, b.c[1] + d[1] * 0.6];
    const tis = t.wax ? motifWax(ctx, t.wax) : t.haut, bas = Math.max(b.c[1], s[1]);
    const pan = new Path2D(); pan.moveTo(b.e[0], b.e[1] + 20); pan.lineTo(b.c[0], b.c[1] + 16); pan.lineTo(s[0], s[1] + 16);
    pan.quadraticCurveTo(s[0] + cote * 4, bas + 70, (b.c[0] + s[0]) / 2, bas + 84); pan.quadraticCurveTo(b.c[0] - cote * 30, bas + 60, b.e[0] - cote * 30, b.e[1] + 140); pan.closePath();
    forme(ctx, pan, tis, { cote, decal: 10, ep: 6 });
    membre(ctx, [b.e, b.c, s], 62, t.wax ? motifWax(ctx, t.wax) : t.haut);
    ctx.strokeStyle = t.brod || "#e0b84a"; ctx.lineWidth = 6; ctx.lineCap = "round";
    const L = Math.hypot(...d) || 1, n = [-d[1] / L * 26, d[0] / L * 26];
    ctx.beginPath(); ctx.moveTo(s[0] + n[0] - d[0] * 0.08, s[1] + n[1] - d[1] * 0.08); ctx.lineTo(s[0] - n[0] - d[0] * 0.08, s[1] - n[1] - d[1] * 0.08); ctx.stroke();
  } else {
    membre(ctx, [b.e, b.c, b.m], larg - 4, def.peau);
    const finManche = man === "longues" ? [b.c[0] + (b.m[0] - b.c[0]) * 0.78, b.c[1] + (b.m[1] - b.c[1]) * 0.78] : [b.e[0] + (b.c[0] - b.e[0]) * 0.62, b.e[1] + (b.c[1] - b.e[1]) * 0.62];
    membre(ctx, man === "longues" ? [b.e, b.c, finManche] : [b.e, finManche], larg + 10, tissu);
  }
  rond(ctx, b.m[0], b.m[1], sk.main, def.peau, 5);
  if (pose === "pouce") { ctx.lineWidth = 13; ctx.strokeStyle = ENCRE; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(b.m[0], b.m[1] - 8); ctx.lineTo(b.m[0], b.m[1] - 34); ctx.stroke(); ctx.lineWidth = 7; ctx.strokeStyle = def.peau; ctx.stroke(); }
  if (pose === "montre" || pose === "montreHaut") { const d = [b.m[0] - b.c[0], b.m[1] - b.c[1]], L = Math.hypot(...d); ctx.lineWidth = 12; ctx.strokeStyle = ENCRE; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(b.m[0], b.m[1]); ctx.lineTo(b.m[0] + (d[0] / L) * 30, b.m[1] + (d[1] / L) * 30); ctx.stroke(); ctx.lineWidth = 6; ctx.strokeStyle = def.peau; ctx.stroke(); }
  return b;
}

// ---------- accessoires ----------
function accessoire(ctx, sk, def, nom, main, cote) {
  if (!nom) return;
  const [mx, my] = main;
  if (nom === "canne") { membre(ctx, [[mx, my - 30], [mx + cote * 14, sk.pied]], 10, "#7a4a24"); rond(ctx, mx, my, sk.main, def.peau, 5); }
  if (nom === "houe") { membre(ctx, [[mx - cote * 10, my + 120], [mx + cote * 10, my - 170]], 11, "#8a5a2c"); const l = new Path2D(); l.moveTo(mx + cote * 10, my - 170); l.lineTo(mx + cote * 70, my - 150); l.lineTo(mx + cote * 64, my - 118); l.lineTo(mx + cote * 6, my - 148); l.closePath(); forme(ctx, l, "#9aa3ad", { ombre: false, ep: 5 }); rond(ctx, mx, my, sk.main, def.peau, 5); }
  if (nom === "telephone") { const p = new Path2D(); p.roundRect(mx - 18, my - 50, 36, 62, 8); forme(ctx, p, "#22252e", { ombre: false, ep: 5 }); ctx.fillStyle = "#6fd0ff"; ctx.fillRect(mx - 11, my - 42, 22, 40); rond(ctx, mx, my, sk.main, def.peau, 5); }
  if (nom === "cartable") { const p = new Path2D(); p.roundRect(mx - 40, my - 6, 80, 64, 10); forme(ctx, p, "#d63c3c", { ep: 6 }); ctx.strokeStyle = ENCRE; ctx.lineWidth = 5; ctx.strokeRect(mx - 28, my + 14, 56, 18); rond(ctx, mx, my, sk.main, def.peau, 5); }
  if (nom === "fusil") { membre(ctx, [[mx - cote * 30, my + 60], [mx + cote * 20, my - 230]], 12, "#5a3a22"); membre(ctx, [[mx + cote * 14, my - 150], [mx + cote * 24, my - 260]], 7, "#3a3d44"); rond(ctx, mx, my, sk.main, def.peau, 5); }
  if (nom === "livre") { const p = new Path2D(); p.roundRect(mx - 44, my - 30, 88, 60, 6); forme(ctx, p, "#2d6fb3", { ep: 6 }); ctx.fillStyle = "#f6f0dd"; ctx.fillRect(mx - 36, my - 22, 72, 6); rond(ctx, mx, my, sk.main, def.peau, 5); }
}
function chargeSurTete(ctx, sk, def) {
  if (!def.charge) return;
  const cx = sk.cxTete, top = sk.cyTete - sk.tete[1] / 2 - (def.coiffe === "foulard" ? 70 : 6);
  if (def.charge === "bassine") {
    // fruits
    const fr = def.fruits || "#f2a531", r = alea(3);
    for (let i = 0; i < 7; i++) rond(ctx, cx - 80 + i * 27, top - 52 - (i % 2) * 18 - r() * 6, 24, i % 3 ? fr : "#7cbf3a", 5);
    const b = new Path2D(); b.moveTo(cx - 128, top - 46); b.lineTo(cx + 128, top - 46); b.quadraticCurveTo(cx + 104, top + 8, cx, top + 6); b.quadraticCurveTo(cx - 104, top + 8, cx - 128, top - 46);
    forme(ctx, b, def.bassine || "#3aa0d8", { decal: 10 });
    const bord = new Path2D(); bord.ellipse(cx, top - 46, 132, 12, 0, 0, 7); forme(ctx, bord, melanger(def.bassine || "#3aa0d8", "#ffffff", 0.3), { ombre: false, ep: 5 });
  }
}

// ---------- dessin complet ----------
// def : { peau, gabarit, tenue, coupe, cheveux, coiffe, barbe, moustache, charge, accessoire, mainAccessoire }
// pose : { brasG, brasD, visage, regard: [x, y], inclinaison (deg), marche (phase en radians ou null), anim (images), cote }
export function dessinerPersonnage(ctx, def, pose = {}) {
  const sk = squelette(def.gabarit), cote = pose.cote ?? 1, anim = pose.anim ?? 0;
  const bG = pose.brasG || (pose.marche != null ? "marche" : "repos"), bD = pose.brasD || (pose.marche != null ? "marche" : "repos");
  ctx.save();
  // respiration : très léger étirement vertical
  const souffle = 1 + Math.sin(anim * 0.18) * 0.006;
  ctx.translate(0, SOL); ctx.scale(1, souffle); ctx.translate(0, -SOL);
  if (pose.marche != null) ctx.translate(0, -Math.abs(Math.sin(pose.marche)) * 14);
  const manchesLarges = def.tenue.manches === "larges";
  // bras de l'arrière-plan si manches larges (le boubou les recouvre)
  jambes(ctx, sk, def, pose.marche);
  const mains = {};
  corps(ctx, sk, def, cote);
  // cou
  const c = new Path2D(); c.roundRect(LARG / 2 - sk.tete[0] * 0.14, sk.cou - 30, sk.tete[0] * 0.28, sk.epaule - sk.cou + 40, 14);
  ctx.save(); ctx.fillStyle = def.peau; ctx.fill(c); ctx.fillStyle = "rgba(40,18,60,0.25)"; ctx.fill(c); ctx.restore();
  ctx.lineWidth = 6; ctx.strokeStyle = ENCRE; ctx.beginPath(); ctx.moveTo(LARG / 2 - sk.tete[0] * 0.14, sk.cou); ctx.lineTo(LARG / 2 - sk.tete[0] * 0.14, sk.epaule); ctx.moveTo(LARG / 2 + sk.tete[0] * 0.14, sk.cou); ctx.lineTo(LARG / 2 + sk.tete[0] * 0.14, sk.epaule); ctx.stroke();
  { mains.g = dessinerBras(ctx, sk, def, -1, bG, anim); mains.d = dessinerBras(ctx, sk, def, 1, bD, anim); }
  if (def.accessoire) accessoire(ctx, sk, def, def.accessoire, (def.mainAccessoire === "g" ? mains.g : mains.d).m, def.mainAccessoire === "g" ? -1 : 1);
  // tête (inclinaison autour du cou)
  ctx.save();
  const inc = ((pose.inclinaison || 0) * Math.PI) / 180;
  ctx.translate(LARG / 2, sk.cou); ctx.rotate(inc); ctx.translate(-LARG / 2, -sk.cou);
  cheveuxArriere(ctx, sk, def);
  for (const s of [-1, 1]) rond(ctx, sk.cxTete + s * sk.tete[0] * 0.49, sk.cyTete + sk.tete[1] * 0.06, sk.tete[0] * 0.08, def.peau, 6);
  forme(ctx, cheminTete(sk.cxTete, sk.cyTete, sk.tete[0], sk.tete[1]), def.peau, { cote, decal: 20, teinteOmbre: "rgba(50,20,70,0.26)" });
  barbe(ctx, sk, def);
  cheveuxAvant(ctx, sk, def);
  visage(ctx, sk, def, pose.visage || "neutre", pose.regard, cote);
  moustache(ctx, sk, def);
  coiffe(ctx, sk, def, cote);
  chargeSurTete(ctx, sk, def);
  ctx.restore();
  ctx.restore();
  return { sk, mains };
}

// Centre de la tête (pour aligner une pièce détachée, une bulle, un effet) en unités de dessin.
export const centreTete = (gabarit) => { const sk = squelette(gabarit); return [sk.cxTete, sk.cyTete]; };
