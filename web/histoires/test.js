// Scène test JC Toon (10 s) : un matin au marché du village.
// Awa arrive avec sa bassine de mangues, la caméra s'élève pour montrer le village, puis Serge lève le pouce.
import * as P from "../peinture.js";
import { TROUPE } from "../troupe.js";
import { prog, lisse, tresLisse, sortie, mel, mel3, cligne, vie, phasePas, arrondi, rebond } from "../mouvement.js";

export const DUREE = 300; // images (10 s à 30 i/s)
export const FPS = 30;

export async function construire(M) {
  const { toon, boite, cylindre, cone, boule, facettes, sol, panneau, THREE } = M;
  const mHerbe = toon({ toile: P.herbe(), cle: "herbe", metresParMotif: 6 });
  const mTerre = toon({ toile: P.laterite(), cle: "terre", metresParMotif: 5 });
  const mBanco = toon({ toile: P.banco(), cle: "banco", metresParMotif: 3 });
  const mBanco2 = toon({ toile: P.banco("#b9774a", 9), cle: "banco2", metresParMotif: 3 });
  const mChaume = toon({ toile: P.chaume(), cle: "chaume", metresParMotif: 2.5 });
  const mTole = toon({ toile: P.tole(), cle: "tole", metresParMotif: 3 });
  const mBois = toon({ toile: P.planches(), cle: "bois", metresParMotif: 2 });
  const mEcorce = toon({ toile: P.ecorce(), cle: "ecorce", metresParMotif: 4 });
  const mFeuille = toon({ toile: P.feuillage(), cle: "feuille", metresParMotif: 3 });
  const mFeuilleSombre = toon({ toile: P.feuillage("#3b6e33", 3), cle: "feuille2", metresParMotif: 3 });
  const mPorte = toon({ couleur: "#3a2418" });
  const mRocher = toon({ couleur: "#9b8a78" });

  sol(900, mHerbe, { y: -0.02 });
  sol(60, mTerre, { y: 0 });
  boite(8, 0.03, 120, mTerre, { x: 4, z: -40, ry: 0.3, ombre: false });  // route vers le fond

  // cases rondes à toit de chaume
  const caseRonde = (x, z, r = 2.2, mat = mBanco) => {
    cylindre(r, r, 2.6, mat, { x, z, cotes: 24 });
    cone(r * 1.42, r * 1.1, mChaume, { x, y: 2.45, z, cotes: 24 });
    const a = Math.atan2(-x, 6 - z); boite(0.9, 1.7, 0.2, mPorte, { x: x + Math.sin(a) * r, z: z + Math.cos(a) * r, ry: a });
  };
  caseRonde(-12, -14); caseRonde(-6.5, -19, 2.0, mBanco2); caseRonde(13, -21, 2.4); caseRonde(20, -12, 2.0, mBanco2); caseRonde(-20, -24, 2.3);
  // maison en banco à toit de tôle
  boite(7, 3.0, 4.5, mBanco2, { x: -15, z: -3, ry: 0.5 });
  const toit = boite(7.8, 0.12, 5.4, mTole, { x: -15, y: 3.0, z: -3, ry: 0.5 }); toit.rotation.z = 0.12;
  boite(1.0, 2.0, 0.2, mPorte, { x: -13.6, z: -0.9, ry: 0.5 });

  // baobab : tronc massif, branches tordues, feuillage clairsemé
  cylindre(1.25, 1.9, 6.5, mEcorce, { x: 9, z: -9, cotes: 16 });
  const branche = (ang, incl, long, ep) => { const b = cylindre(ep * 0.5, ep, long, mEcorce, { x: 9, y: 6.0, z: -9, cotes: 8 }); b.rotation.set(Math.cos(ang) * incl, 0, Math.sin(ang) * incl); };
  for (let i = 0; i < 7; i++) branche(i * 0.9, 0.75 + (i % 3) * 0.15, 3.2 + (i % 2), 0.45);
  for (let i = 0; i < 9; i++) { const a = i * 0.7; boule(1.1 + (i % 3) * 0.3, mFeuille, { x: 9 + Math.sin(a) * 3.4, y: 8.4 + (i % 3) * 0.7, z: -9 + Math.cos(a) * 3.4, sy: 0.7 }); }

  // manguiers et palmiers du fond
  const manguier = (x, z, s = 1) => { cylindre(0.35 * s, 0.5 * s, 3 * s, mEcorce, { x, z, cotes: 10 }); boule(3.2 * s, mFeuilleSombre, { x, y: 4.6 * s, z, sy: 0.8 }); boule(2.2 * s, mFeuille, { x: x + 1.4 * s, y: 5.6 * s, z: z + 0.6, sy: 0.8 }); };
  const palmier = (x, z, h = 8) => {
    const t = cylindre(0.22, 0.32, h, mEcorce, { x, z, cotes: 8 }); t.rotation.z = 0.08;
    for (let i = 0; i < 8; i++) { const f = boite(4.2, 0.08, 0.9, mFeuille, { x, y: h - 0.2, z, ry: (i / 8) * Math.PI * 2 }); f.geometry.translate(2.1, 0, 0); f.rotation.z = -0.35; }
  };
  manguier(-24, -10, 1.1); manguier(26, -30, 1.3); manguier(-4, -36, 1.2); manguier(30, 2, 1.0); manguier(-30, 8, 1.2);
  palmier(17, -6, 9); palmier(-9, -30, 10); palmier(4, -48, 11); palmier(-26, -40, 9);
  // collines au loin
  for (const [x, z, r] of [[-120, -260, 90], [40, -300, 120], [180, -240, 80], [-260, -120, 100]]) boule(r, mHerbe, { x, y: -r * 0.55, z, cotes: 28 });
  for (const [x, z, r] of [[-5, 6, 0.7], [7, 3, 0.5], [-8, -8, 0.9]]) facettes(r, mRocher, { x, y: r * 0.4, z });

  // étal de marché « Chez Awa » : table, poteaux, auvent wax, tas de fruits
  const ex = -2.2, ez = -3.2;
  boite(3.4, 0.9, 1.4, mBois, { x: ex, z: ez });
  for (const [dx, dz] of [[-1.6, -0.6], [1.6, -0.6], [-1.6, 0.6], [1.6, 0.6]]) cylindre(0.06, 0.06, 2.6, mBois, { x: ex + dx, z: ez + dz, cotes: 6 });
  const mWax = toon({ toile: P.tissu({ type: "cercles", c: ["#e8742a", "#1f4fa0", "#f6d23c"] }), cle: "waxEtal", metresParMotif: 1.2, double: true });
  const auvent = boite(3.8, 0.06, 2.0, mWax, { x: ex, y: 2.55, z: ez }); auvent.rotation.x = -0.18;
  const mOrange = toon({ couleur: "#f29a1e" }), mVert = toon({ couleur: "#6fb83a" }), mRouge = toon({ couleur: "#d8402c" });
  for (let i = 0; i < 18; i++) boule(0.13, [mOrange, mVert, mRouge][i % 3], { x: ex - 1.3 + (i % 9) * 0.32, y: 1.0 + Math.floor(i / 9) * 0.2, z: ez - 0.2 + Math.floor(i / 9) * 0.25, cotes: 10 });
  panneau(2.2, 0.55, P.enseigne("CHEZ AWA", "#1f6fb2", "#ffffff"), { x: ex, y: 2.7, z: ez + 1.02 });
  // deuxième étal
  boite(3.0, 0.9, 1.3, mBois, { x: 3.8, z: -5.5, ry: -0.4 });
  const mWax2 = toon({ toile: P.tissu({ type: "losanges", c: ["#0f7d6b", "#f4c430", "#c2362b"] }), cle: "waxEtal2", metresParMotif: 1.2, double: true });
  const a2 = boite(3.4, 0.06, 1.9, mWax2, { x: 3.8, y: 2.45, z: -5.5, ry: -0.4 }); a2.rotation.x = -0.16;
  for (const [dx, dz] of [[-1.4, -0.6], [1.4, -0.6], [-1.4, 0.6], [1.4, 0.6]]) cylindre(0.06, 0.06, 2.5, mBois, { x: 3.8 + dx * Math.cos(0.4) + dz * Math.sin(-0.4), z: -5.5 - dx * Math.sin(-0.4) + dz * Math.cos(0.4), cotes: 6 });
}

// position d'Awa : elle arrive de la droite et s'arrête devant son étal
const awaPos = (f) => { const t = sortie(prog(0, 150, f)); return [mel(6.5, 0.4, t), 0, mel(3.5, -1.3, t)]; };
const awaDist = (f) => { const t = sortie(prog(0, 150, f)); return Math.hypot(6.1, 4.8) * t; };

export function etat(f) {
  const [ax, , az] = awaPos(f), serge = [1.9, 0, -1.2], moussa = [7.4, 0, -6.2];
  // ---- caméra ----
  let pos, cible, fov = 38, roulis = 0, flou = null;
  const suivi = { pos: [ax + 0.9, 1.45, az + 4.4], cible: [ax, 1.5, az] };
  const large = { pos: [3.2, 4.2, 11.5], cible: [0, 1.6, -5] };
  const serr = { pos: [serge[0] + 0.6, 1.55, serge[2] + 3.4], cible: [serge[0], 1.6, serge[2]] };
  if (f < 105) { pos = suivi.pos; cible = suivi.cible; flou = { focus: 4.5, force: 13 }; roulis = -2; }
  else if (f < 175) { const t = tresLisse(prog(105, 175, f)); pos = mel3(suivi.pos, large.pos, t); cible = mel3(suivi.cible, large.cible, t); flou = { focus: 4.5, force: 13 * (1 - t) }; roulis = mel(-2, 0, t); fov = mel(38, 42, t); }
  else if (f < 238) { const t = (f - 175) * 0.0018; pos = mel3(large.pos, large.cible, t); cible = large.cible; fov = 42; }
  else { const t = tresLisse(prog(238, 268, f)); const p0 = mel3(large.pos, large.cible, 63 * 0.0018); pos = mel3(p0, serr.pos, t); cible = mel3(large.cible, serr.cible, t); fov = mel(42, 36, t); roulis = mel(0, 3, t); flou = { focus: 3.4, force: 11 * t };
    if (f > 268) { const k = (f - 268) * 0.003; pos = mel3(serr.pos, serr.cible, k); } }

  // ---- acteurs ----
  const v1 = vie(f, 1), v2 = vie(f, 2), v3 = vie(f, 3);
  const marche = f < 150 ? arrondi(phasePas(awaDist(f)), 0.25) : null;
  const awaVisage = f < 120 ? "sourire" : f < 200 ? "rire" : "sourire";
  const pouce = f >= 262;
  const acteurs = [
    { id: "awa", def: TROUPE.awa, x: ax, z: az, pose: { marche, brasG: "porte", brasD: "porte", visage: awaVisage, cligne: cligne(f, 1), inclinaison: arrondi(v1.incl, 1), regard: f > 150 ? [-0.5, 0] : [0, 0] } },
    { id: "serge", def: TROUPE.serge, x: serge[0], z: serge[2], pose: pouce ? { brasG: "pouce", brasD: "tient", visage: "malin", regard: [0, 0.1], inclinaison: arrondi(4 * rebond(prog(262, 272, f)), 1) } : { brasG: f > 150 && f < 240 ? "salut" : "repos", brasD: "tient", visage: f > 150 ? "sourire" : "neutre", cligne: cligne(f, 2), inclinaison: arrondi(v2.incl, 1), anim: f % 12, regard: [0.4, 0] } },
    { id: "moussa", def: TROUPE.moussa, x: moussa[0], z: moussa[2], pose: { brasG: "menton", visage: f > 170 ? "sourire" : "doute", cligne: cligne(f, 3), inclinaison: arrondi(v3.incl, 1), regard: [-0.6, 0] } },
    { id: "ngono", def: TROUPE.ngono, x: -5.2, z: -6.5, pose: { brasG: "hanches", brasD: "montre", visage: "rire", cligne: cligne(f, 4), inclinaison: arrondi(vie(f, 4).incl, 1) } },
  ];
  // les enfants traversent au fond en courant
  const tk = prog(120, 250, f);
  if (tk > 0 && tk < 1) {
    const kx = mel(-14, 14, tk), d = 28 * tk * 1.4;
    acteurs.push({ id: "junior", def: TROUPE.junior, x: kx, z: -12, pose: { marche: arrondi(phasePas(d), 0.25), brasG: "marche", brasD: "marche", visage: "rire" } });
    acteurs.push({ id: "amina", def: TROUPE.amina, x: kx - 1.6, z: -12.8, pose: { marche: arrondi(phasePas(d) + 1.3, 0.25), brasG: "tient", brasD: "leve", visage: "rire" } });
  }
  // ---- effets ----
  const effets = [];
  if (marche != null) { const k = f % 14; if (k < 8) effets.push({ type: "poussiere", x: ax + 0.25, y: 0.12 + k * 0.01, z: az + 0.3, taille: 0.2 + k * 0.015 }); }
  if (f >= 264 && f < 300) { const t = prog(264, 272, f); effets.push({ type: "etoile", x: serge[0] - 0.62, y: 1.72 + 0.12 * t, z: serge[2] + 0.45, taille: 0.26 * rebond(t), rot: f * 0.05 }); }
  return { camera: { pos, cible, fov, roulis }, lumiere: "jour", centre: [0, 0, -4], acteurs, effets, flou };
}
