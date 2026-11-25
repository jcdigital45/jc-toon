// JC Toon — courbes et mouvements. Tout est fonction pure du numéro d'image.
export const borne = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const prog = (a, b, f) => borne((f - a) / (b - a));
export const lisse = (t) => t * t * (3 - 2 * t);
export const tresLisse = (t) => t * t * t * (t * (t * 6 - 15) + 10);
export const sortie = (t) => 1 - (1 - t) ** 3;            // départ vif, arrivée douce
export const entree = (t) => t * t * t;
export const rebond = (t, k = 1.7) => 1 + (k + 1) * (t - 1) ** 3 + k * (t - 1) ** 2; // dépasse puis revient
export const ressort = (t) => 1 - Math.exp(-6 * t) * Math.cos(t * 14);
export const mel = (a, b, t) => a + (b - a) * t;
export const mel3 = (a, b, t) => [mel(a[0], b[0], t), mel(a[1], b[1], t), mel(a[2], b[2], t)];
export const arrondi = (x, pas = 0.02) => Math.round(x / pas) * pas;

// bruit doux 1D (pour les petites vies)
const h1 = (n) => { const s = Math.sin(n * 91.345 + 12.9898) * 43758.5453; return s - Math.floor(s); };
export const bruitDoux = (x, graine = 0) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return mel(h1(i + graine * 17), h1(i + 1 + graine * 17), u) * 2 - 1; };

// Catmull-Rom sur une liste de points 3D, t de 0 à 1
export function chemin(pts, t) {
  const n = pts.length - 1, x = borne(t) * n, i = Math.min(n - 1, Math.floor(x)), u = x - i;
  const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)];
  return [0, 1, 2].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u * u + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u * u * u));
}

// Caméra par clés : [{ f, pos, cible, fov, roulis, courbe ("lisse"|"sortie"|"coupe"), passage: [[x,y,z]...] }]
// Entre deux clés, la caméra glisse ; une clé avec courbe "coupe" saute directement.
// Chaque plan fixe avance tout seul (« poussée lente ») pour ne jamais rester immobile.
export function camera(cles, f, o = {}) {
  let i = 0; while (i < cles.length - 1 && cles[i + 1].f <= f) i++;
  const a = cles[i], b = cles[i + 1];
  let pos, cible, fov, roulis;
  if (!b || b.courbe === "coupe" && f < b.f) {
    pos = a.pos; cible = a.cible; fov = a.fov ?? 40; roulis = a.roulis ?? 0;
  } else {
    const tl = prog(a.f, b.f, f), c = b.courbe === "sortie" ? sortie : b.courbe === "rebond" ? (x) => rebond(x, 1.2) : tresLisse, t = c(tl);
    pos = b.passage ? chemin([a.pos, ...b.passage, b.pos], t) : mel3(a.pos, b.pos, t);
    cible = mel3(a.cible, b.cible, t); fov = mel(a.fov ?? 40, b.fov ?? 40, t); roulis = mel(a.roulis ?? 0, b.roulis ?? 0, t);
  }
  // poussée lente permanente vers la cible (0,25 % de la distance par image depuis la dernière clé)
  const pousse = (o.poussee ?? 0.0025) * Math.max(0, f - a.f) * (b && b.courbe !== "coupe" ? 0 : 1);
  const d = [cible[0] - pos[0], cible[1] - pos[1], cible[2] - pos[2]];
  pos = [pos[0] + d[0] * Math.min(0.35, pousse), pos[1] + d[1] * Math.min(0.35, pousse), pos[2] + d[2] * Math.min(0.35, pousse)];
  // secousses d'impact : changent de signe à chaque image et s'éteignent en 7 images
  let sec = 0;
  for (const k of o.secousses || []) { const dt = f - k.f; if (dt >= 0 && dt < 7) sec += (k.force ?? 0.08) * (dt % 2 ? -1 : 1) * (1 - dt / 7); }
  return { pos: [pos[0] + sec * 0.6, pos[1] + sec, pos[2]], cible, fov, roulis: roulis + sec * 20 };
}

// Clignement : renvoie vrai pendant 4 images toutes les 0,6 à 2,4 s (différent pour chaque graine)
export function cligne(f, graine = 1) {
  let t = 0, k = 0;
  while (t <= f) { const ecart = 18 + Math.floor(h1(graine * 7 + k) * 54); if (f >= t + ecart && f < t + ecart + 4) return true; t += ecart; k++; if (k > 500) break; }
  return false;
}

// Petite vie : balancement et inclinaison de tête, jamais figé
export const vie = (f, graine = 1) => ({ incl: bruitDoux(f / 40, graine) * 3, dx: bruitDoux(f / 55, graine + 3) * 0.02 });

// Marche : distance parcourue -> phase des pas (1 pas = 0,7 m)
export const phasePas = (distance) => (distance / 0.7) * Math.PI;
