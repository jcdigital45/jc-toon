// JC Toon — moteur de rendu (three.js r160), écrit de zéro.
// Monde 3D toon + cartes de personnages 2D + passe d'encre + étalonnage + profondeur de champ.
// Une histoire est un module qui exporte : DUREE, construire(M), etat(f) (voir histoires/test.js).
import * as THREE from "three";
import { dessinerPersonnage, LARG, HAUT, SOL } from "./personnages.js";

export { THREE };
const params = new URLSearchParams(location.search);
export const L = +(params.get("l") || 1080), H = Math.round((L * 16) / 9);
const ECH = H / 1920; // tous les réglages en pixels sont donnés pour 1080 x 1920

// ---------- rendu de base ----------
const cv = document.createElement("canvas"); document.body.appendChild(cv);
const rendu = new THREE.WebGLRenderer({ canvas: cv, antialias: false, preserveDrawingBuffer: true });
rendu.setPixelRatio(1); rendu.setSize(L, H, false);
rendu.shadowMap.enabled = true; rendu.shadowMap.type = THREE.PCFSoftShadowMap;
rendu.outputColorSpace = THREE.SRGBColorSpace;
export const scene = new THREE.Scene();
export const cam = new THREE.PerspectiveCamera(40, L / H, 0.1, 2000);

// ---------- matériaux toon ----------
const degrade = (() => { const d = new Uint8Array([150, 205, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const cacheTex = new Map();
export function texture(toile, cle) {
  if (cle && cacheTex.has(cle)) return cacheTex.get(cle);
  const t = new THREE.CanvasTexture(toile); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  if (cle) cacheTex.set(cle, t); return t;
}
export function toon(o = {}) {
  // o : { couleur, toile (canvas), cle, metresParMotif, double }
  const m = new THREE.MeshToonMaterial({ color: o.couleur || "#ffffff", gradientMap: degrade, side: o.double ? THREE.DoubleSide : THREE.FrontSide });
  if (o.toile) m.map = texture(o.toile, o.cle);
  m.userData.mpm = o.metresParMotif || 2;
  return m;
}

// UV à densité constante : 1 répétition de la texture = mpm mètres
function uvBoite(geo, w, h, d, mpm) {
  const uv = geo.attributes.uv, tailles = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, (uv.getX(i) * tailles[f][0]) / mpm, (uv.getY(i) * tailles[f][1]) / mpm); }
  uv.needsUpdate = true;
}
function uvEchelle(geo, su, sv) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); uv.needsUpdate = true; }

const monde = new THREE.Group(); scene.add(monde);
export function poser(mesh, o = {}) {
  mesh.position.set(o.x || 0, o.y || 0, o.z || 0); if (o.ry) mesh.rotation.y = o.ry; if (o.rx) mesh.rotation.x = o.rx; if (o.rz) mesh.rotation.z = o.rz;
  if (o.echelle) mesh.scale.setScalar(o.echelle);
  mesh.castShadow = o.ombre !== false; mesh.receiveShadow = true; mesh.userData.genre = mesh.userData.genre || "monde";
  (o.parent || monde).add(mesh); return mesh;
}
export const boite = (w, h, d, mat, o = {}) => { const g = new THREE.BoxGeometry(w, h, d); uvBoite(g, w, h, d, mat.userData.mpm || 2); g.translate(0, h / 2, 0); return poser(new THREE.Mesh(g, mat), o); };
export const cylindre = (rh, rb, h, mat, o = {}) => { const g = new THREE.CylinderGeometry(rh, rb, h, o.cotes || 20, 1, o.ouvert); uvEchelle(g, (Math.PI * 2 * Math.max(rh, rb)) / (mat.userData.mpm || 2), h / (mat.userData.mpm || 2)); g.translate(0, h / 2, 0); return poser(new THREE.Mesh(g, mat), o); };
export const cone = (r, h, mat, o = {}) => { const g = new THREE.ConeGeometry(r, h, o.cotes || 20, 1, true); uvEchelle(g, (Math.PI * 2 * r) / (mat.userData.mpm || 2), Math.hypot(r, h) / (mat.userData.mpm || 2)); g.translate(0, h / 2, 0); return poser(new THREE.Mesh(g, mat), { ...o }); };
export const boule = (r, mat, o = {}) => { const g = new THREE.SphereGeometry(r, o.cotes || 18, 12); uvEchelle(g, (Math.PI * 2 * r) / (mat.userData.mpm || 2), (Math.PI * r) / (mat.userData.mpm || 2)); const m = poser(new THREE.Mesh(g, mat), o); if (o.sy) m.scale.y = o.sy; return m; };
export const facettes = (r, mat, o = {}) => { const g = new THREE.IcosahedronGeometry(r, 0); return poser(new THREE.Mesh(g, mat), o); }; // rochers à facettes
export function sol(taille, mat, o = {}) {
  const g = new THREE.PlaneGeometry(taille, taille, 1, 1); g.rotateX(-Math.PI / 2); uvEchelle(g, taille / (mat.userData.mpm || 4), taille / (mat.userData.mpm || 4));
  return poser(new THREE.Mesh(g, mat), { ...o, ombre: false });
}
export function panneau(largeur, hauteur, toile, o = {}) { // enseigne non éclairée (toujours lisible)
  const m = new THREE.MeshBasicMaterial({ map: texture(toile), side: THREE.FrontSide }); m.map.wrapS = m.map.wrapT = THREE.ClampToEdgeWrapping;
  const g = new THREE.PlaneGeometry(largeur, hauteur); g.translate(0, hauteur / 2, 0); return poser(new THREE.Mesh(g, m), { ...o, ombre: false });
}

// ---------- ciel (3 couleurs : haut / milieu / horizon) + disque du soleil ----------
const ciel = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { haut: { value: new THREE.Color() }, milieu: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, dirSoleil: { value: new THREE.Vector3() }, couleurSoleil: { value: new THREE.Color() }, tailleSoleil: { value: 0 } },
  vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w; }`,
  fragmentShader: `uniform vec3 haut, milieu, horizon, dirSoleil, couleurSoleil; uniform float tailleSoleil; varying vec3 vDir;
    void main(){ float y = max(vDir.y, 0.0);
      vec3 c = y < 0.18 ? mix(horizon, milieu, smoothstep(0.0, 0.18, y)) : mix(milieu, haut, smoothstep(0.18, 0.75, y));
      float s = dot(normalize(vDir), normalize(dirSoleil));
      c += couleurSoleil * (smoothstep(1.0 - tailleSoleil, 1.0 - tailleSoleil * 0.6, s) * 1.6 + pow(max(s, 0.0), 60.0) * 0.25);
      gl_FragColor = vec4(c, 1.0); }`,
}));
ciel.userData.genre = "ciel"; ciel.frustumCulled = false; scene.add(ciel);

// ---------- lumières ----------
const soleil = new THREE.DirectionalLight("#ffffff", 2.0); soleil.castShadow = true;
soleil.shadow.mapSize.set(2048, 2048); soleil.shadow.bias = -0.0006; soleil.shadow.normalBias = 0.03;
Object.assign(soleil.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 260 });
scene.add(soleil, soleil.target);
const ambiance = new THREE.HemisphereLight("#bcd3ff", "#8a5a3a", 0.9); scene.add(ambiance);

// Préréglages de lumière. az / el en degrés ; teinteCarte = couleur appliquée aux personnages.
export const LUMIERES = {
  jour: { az: 35, el: 50, soleil: ["#fff3dc", 2.3], ciel: ["#3f86d8", "#86b6ea", "#cfe3f4"], amb: ["#bcd3ff", "#9a6a46", 1.0], brume: [40, 420], carte: "#ffffff", sat: 1.08, gain: [1, 1, 1], lift: [0.0, 0.005, 0.02], tailleSoleil: 0.0 },
  dore: { az: 200, el: 9, soleil: ["#ffb46a", 2.6], ciel: ["#6f74b8", "#e8a07a", "#ffd08a"], amb: ["#7d7ac8", "#8a5a3a", 0.85], brume: [35, 360], carte: "#ffe2c4", sat: 1.12, gain: [1.04, 0.98, 0.92], lift: [0.02, 0.0, 0.035], tailleSoleil: 0.012 },
  nuit: { az: 60, el: 35, soleil: ["#9fb8ff", 0.9], ciel: ["#0d1840", "#22356e", "#3d5594"], amb: ["#3a4c99", "#1d1a33", 0.9], brume: [30, 300], carte: "#a9b8ff", sat: 0.9, gain: [0.8, 0.86, 1.05], lift: [0.0, 0.01, 0.05], tailleSoleil: 0.0 },
  aube: { az: 95, el: 14, soleil: ["#ffd2a8", 1.9], ciel: ["#7aa0d6", "#f0b8a8", "#ffe4c4"], amb: ["#a8b8ee", "#8a6a5a", 0.95], brume: [40, 380], carte: "#fff0e4", sat: 1.05, gain: [1.02, 1, 0.97], lift: [0.01, 0.005, 0.03], tailleSoleil: 0.01 },
};
let lumiereCourante = LUMIERES.jour;
function appliquerLumiere(nom, centre) {
  const l = typeof nom === "string" ? LUMIERES[nom] : nom; lumiereCourante = l;
  const az = (l.az * Math.PI) / 180, el = (l.el * Math.PI) / 180, dir = new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
  soleil.color.set(l.soleil[0]); soleil.intensity = l.soleil[1];
  soleil.position.copy(new THREE.Vector3(...centre)).addScaledVector(dir, 120); soleil.target.position.set(...centre); soleil.target.updateMatrixWorld();
  ambiance.color.set(l.amb[0]); ambiance.groundColor.set(l.amb[1]); ambiance.intensity = l.amb[2];
  const u = ciel.material.uniforms; u.haut.value.set(l.ciel[0]); u.milieu.value.set(l.ciel[1]); u.horizon.value.set(l.ciel[2]);
  u.dirSoleil.value.copy(dir); u.couleurSoleil.value.set(l.soleil[0]); u.tailleSoleil.value = l.tailleSoleil;
  scene.fog = new THREE.Fog(l.ciel[2], l.brume[0], l.brume[1]);
}

// ---------- cartes de personnages ----------
// Une carte = un plan vertical qui pivote seulement autour de l'axe vertical pour faire face à la caméra.
// Taille : 1000 unités de dessin = TAILLE_CARTE mètres (adulte ≈ 2,1 m de haut, tête comprise).
export const TAILLE_CARTE = 2.25;
const RES_CARTE = 1.4; // résolution du canvas par unité de dessin
const cartes = new Map();
const ombreContact = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"); const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, "rgba(30,15,25,0.55)"); gr.addColorStop(0.6, "rgba(30,15,25,0.25)"); gr.addColorStop(1, "rgba(30,15,25,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();

function creerCarte(id) {
  const c = document.createElement("canvas"); c.width = Math.round(LARG * RES_CARTE); c.height = Math.round(HAUT * RES_CARTE);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const u = TAILLE_CARTE / HAUT, g = new THREE.PlaneGeometry(LARG * u, HAUT * u); g.translate(0, HAUT * u * 0.5 - (HAUT - SOL) * u, 0);
  const mat = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, transparent: false, side: THREE.DoubleSide, fog: true });
  const m = new THREE.Mesh(g, mat); m.userData.genre = "carte"; m.castShadow = true;
  m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
  const o = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.55).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: ombreContact, transparent: true, depthWrite: false }));
  o.userData.genre = "ombre"; o.renderOrder = 1;
  const groupe = new THREE.Group(); groupe.add(m); scene.add(groupe); scene.add(o);
  const carte = { c, ctx: c.getContext("2d"), tex, m, o, groupe, cle: "" }; cartes.set(id, carte); return carte;
}

function majCarte(a) {
  const k = a.id, carte = cartes.get(k) || creerCarte(k);
  const cle = JSON.stringify([a.def.nom, a.pose]);
  if (cle !== carte.cle) {
    const g = carte.ctx; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, carte.c.width, carte.c.height);
    g.setTransform(RES_CARTE, 0, 0, RES_CARTE, 0, 0); dessinerPersonnage(g, a.def, a.pose); carte.tex.needsUpdate = true; carte.cle = cle;
  }
  const e = a.echelle || (a.def.gabarit === "enfant" ? 0.82 : 1);
  carte.groupe.visible = carte.o.visible = a.visible !== false;
  carte.groupe.position.set(a.x, a.y || 0, a.z); carte.groupe.scale.set(e * (a.miroir ? -1 : 1), e, e);
  carte.groupe.rotation.y = Math.atan2(cam.position.x - a.x, cam.position.z - a.z);
  carte.m.rotation.z = ((a.penche || 0) * Math.PI) / 180;
  carte.m.material.color.set(lumiereCourante.carte);
  carte.o.position.set(a.x, (a.ySol ?? 0) + 0.02, a.z); carte.o.scale.setScalar(e * (1 - Math.min(0.6, (a.y || 0) * 0.3)));
  // rapprochement vers la caméra pour ne pas s'enfoncer dans un mur proche
  if (a.rapproche) { const d = new THREE.Vector3().subVectors(cam.position, carte.groupe.position).setY(0).normalize(); carte.groupe.position.addScaledVector(d, a.rapproche); }
}

// ---------- effets 2D (poussière, étoiles, cœurs, gouttes, Zzz, éclairs de choc) ----------
const effets = []; let nbEffets = 0;
function dessinEffet(type) {
  const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d");
  g.lineJoin = "round"; g.lineWidth = 10; g.strokeStyle = "#1e130f";
  if (type === "poussiere") { g.fillStyle = "#e3c39a"; for (const [x, y, r] of [[90, 150, 60], [160, 140, 55], [128, 100, 50]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke(); } g.fillStyle = "#e3c39a"; for (const [x, y, r] of [[90, 150, 52], [160, 140, 47], [128, 100, 42]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } }
  if (type === "etoile") { g.fillStyle = "#ffd23a"; g.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 45 : 110; g.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke(); }
  if (type === "coeur") { g.fillStyle = "#e8425a"; g.beginPath(); g.moveTo(128, 210); g.bezierCurveTo(20, 130, 50, 30, 128, 85); g.bezierCurveTo(206, 30, 236, 130, 128, 210); g.fill(); g.stroke(); }
  if (type === "goutte") { g.fillStyle = "#8fd3ff"; g.beginPath(); g.moveTo(128, 30); g.quadraticCurveTo(200, 150, 128, 210); g.quadraticCurveTo(56, 150, 128, 30); g.fill(); g.stroke(); }
  if (type === "zzz") { g.fillStyle = "#ffffff"; g.font = "bold 150px DejaVu Sans"; g.textAlign = "center"; g.lineWidth = 12; g.strokeText("Z", 128, 190); g.fillText("Z", 128, 190); }
  if (type === "choc") { g.fillStyle = "#fff3a0"; g.beginPath(); for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r = i % 2 ? 50 : 118; g.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke(); }
  if (type === "point") { g.fillStyle = "#ffffff"; g.font = "bold 190px DejaVu Sans"; g.textAlign = "center"; g.lineWidth = 14; g.strokeText("!", 128, 200); g.fillText("!", 128, 200); }
  if (type === "question") { g.fillStyle = "#ffffff"; g.font = "bold 190px DejaVu Sans"; g.textAlign = "center"; g.lineWidth = 14; g.strokeText("?", 128, 200); g.fillText("?", 128, 200); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const texEffets = {};
function majEffets(liste) {
  for (let i = 0; i < liste.length; i++) {
    const e = liste[i];
    if (!effets[i]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.5, depthWrite: true, fog: false })); m.userData.genre = "carte"; scene.add(m); effets[i] = m; }
    const m = effets[i]; texEffets[e.type] = texEffets[e.type] || dessinEffet(e.type);
    m.material.map = texEffets[e.type]; m.visible = true; m.position.set(e.x, e.y, e.z); m.scale.setScalar(e.taille || 0.5);
    m.quaternion.copy(cam.quaternion); m.rotateZ(e.rot || 0);
  }
  for (let i = liste.length; i < effets.length; i++) effets[i].visible = false;
}

// ---------- passes de post-traitement ----------
const rtCouleur = new THREE.WebGLRenderTarget(L, H, { type: THREE.HalfFloatType, samples: 4 });
const rtND = new THREE.WebGLRenderTarget(L, H, { type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const rtEncre = new THREE.WebGLRenderTarget(L, H, { type: THREE.HalfFloatType });
const camOrtho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), plein = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
const scenePost = new THREE.Scene(); scenePost.add(plein);
const vsPlein = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

// matériau normale + profondeur : monde -> (normale vue, distance) ; carte -> (0, -distance) ; ciel/ombres cachés
const matND = new THREE.ShaderMaterial({ vertexShader: `varying vec3 vN; varying float vZ; void main(){ vN = normalize(normalMatrix * normal); vec4 p = modelViewMatrix * vec4(position,1.0); vZ = -p.z; gl_Position = projectionMatrix * p; }`, fragmentShader: `varying vec3 vN; varying float vZ; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; gl_FragColor = vec4(n, vZ); }`, side: THREE.DoubleSide });
const matsCarteND = new Map();
function matCarteND(tex) {
  if (!matsCarteND.has(tex)) matsCarteND.set(tex, new THREE.ShaderMaterial({ uniforms: { carte: { value: tex } }, side: THREE.DoubleSide, vertexShader: `varying vec2 vUv; varying float vZ; void main(){ vUv = uv; vec4 p = modelViewMatrix * vec4(position,1.0); vZ = -p.z; gl_Position = projectionMatrix * p; }`, fragmentShader: `uniform sampler2D carte; varying vec2 vUv; varying float vZ; void main(){ if (texture2D(carte, vUv).a < 0.5) discard; gl_FragColor = vec4(0.0, 0.0, 0.0, -vZ); }` }));
  return matsCarteND.get(tex);
}

const matEncre = new THREE.ShaderMaterial({
  uniforms: { tCol: { value: null }, tND: { value: null }, res: { value: new THREE.Vector2(L, H) }, ep: { value: 4.6 * ECH }, encre: { value: new THREE.Color("#140c0a") }, sat: { value: 1 }, gain: { value: new THREE.Vector3(1, 1, 1) }, lift: { value: new THREE.Vector3() }, flash: { value: 0 }, vign: { value: 0.22 }, seuilPli: { value: 0.32 } },
  vertexShader: vsPlein, depthTest: false, depthWrite: false,
  fragmentShader: `uniform sampler2D tCol, tND; uniform vec2 res; uniform float ep, sat, flash, vign, seuilPli; uniform vec3 encre, gain, lift; varying vec2 vUv;
  float invZ(float a){ return a > 0.0 ? 1.0 / a : 0.0; }
  void main(){
    vec3 col = texture2D(tCol, vUv).rgb; vec4 c = texture2D(tND, vUv); float ink = 0.0;
    if (c.a > 0.0) {
      float z0 = c.a, D0 = 1.0 / z0, e = ep * mix(1.0, 0.62, smoothstep(6.0, 90.0, z0));
      vec2 px = e / res; vec2 dirs[4]; dirs[0] = vec2(1.0, 0.0); dirs[1] = vec2(0.0, 1.0); dirs[2] = vec2(0.7071, 0.7071); dirs[3] = vec2(0.7071, -0.7071);
      for (int i = 0; i < 4; i++) {
        vec4 a = texture2D(tND, vUv + dirs[i] * px), b = texture2D(tND, vUv - dirs[i] * px);
        if (a.a < 0.0 || b.a < 0.0) continue;          // les cartes ont leur propre contour
        float d2 = (invZ(a.a) + invZ(b.a) - 2.0 * D0) / D0; // 0 sur tout plan, négatif du côté proche d'un saut
        if (-d2 > 0.035) ink = 1.0;
        if (a.a > 0.0 && b.a > 0.0) { float pli = 1.0 - min(dot(c.rgb, a.rgb), dot(c.rgb, b.rgb)); if (pli > seuilPli) ink = max(ink, 0.85); }
      }
      ink *= 1.0 - smoothstep(140.0, 520.0, z0);
    }
    col = col * gain + lift;
    float lum = dot(col, vec3(0.2126, 0.7152, 0.0722)); col = mix(vec3(lum), col, sat);
    col = mix(col, encre, ink);
    vec2 v = vUv - 0.5; col *= 1.0 - vign * smoothstep(0.35, 0.85, length(v * vec2(0.85, 1.0)));
    col = mix(col, vec3(1.0), flash);
    gl_FragColor = vec4(max(col, 0.0), 1.0);
  }`,
});

const matFlou = new THREE.ShaderMaterial({
  uniforms: { tIn: { value: null }, tND: { value: null }, res: { value: new THREE.Vector2(L, H) }, focus: { value: 5 }, force: { value: 0 } },
  vertexShader: vsPlein, depthTest: false, depthWrite: false,
  fragmentShader: `uniform sampler2D tIn, tND; uniform vec2 res; uniform float focus, force; varying vec2 vUv;
  float dist(vec4 n){ return n.a == 0.0 ? 1e5 : abs(n.a); }
  float coc(float z){ return min(force, force * abs(1.0 - focus / z)); }
  void main(){
    vec3 c0 = texture2D(tIn, vUv).rgb;
    if (force < 0.5) { gl_FragColor = vec4(c0, 1.0); }
    else {
      float z0 = dist(texture2D(tND, vUv)), k0 = coc(z0); vec3 somme = c0; float poids = 1.0;
      for (int i = 0; i < 48; i++) {
        float r = sqrt((float(i) + 0.5) / 48.0) * force, a = float(i) * 2.39996;
        vec2 uv2 = vUv + vec2(cos(a), sin(a)) * r / res;
        float zs = dist(texture2D(tND, uv2)), ks = coc(zs);
        float eff = zs < z0 ? ks : min(ks, k0);          // l'arrière-plan ne bave pas sur un premier plan net
        float w = clamp(eff - r + 1.0, 0.0, 1.0);
        somme += texture2D(tIn, uv2).rgb * w; poids += w;
      }
      gl_FragColor = vec4(somme / poids, 1.0);
    }
    #include <colorspace_fragment>
  }`,
});

function passeND() {
  const sauve = [];
  scene.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.userData.genre;
    sauve.push([o, o.material, o.visible]);
    if (g === "ciel" || g === "ombre") o.visible = false;
    else if (g === "carte") o.material = matCarteND(o.material.map);
    else o.material = matND;
  });
  const brume = scene.fog; scene.fog = null; const ombres = rendu.shadowMap.enabled; rendu.shadowMap.enabled = false;
  rendu.setRenderTarget(rtND); rendu.setClearColor(0x000000, 0); rendu.clear(); rendu.render(scene, cam);
  for (const [o, m, v] of sauve) { o.material = m; o.visible = v; }
  scene.fog = brume; rendu.shadowMap.enabled = ombres;
}

// ---------- rendu d'une image ----------
let histoire = null;
export async function charger(nom) {
  histoire = await import(`./histoires/${nom}.js`);
  await histoire.construire(MOTEUR);
  window.DUREE = histoire.DUREE;
}
export function rendreImage(f) {
  const e = histoire.etat(f);
  appliquerLumiere(e.lumiere || "jour", e.centre || e.camera.cible);
  cam.position.set(...e.camera.pos); cam.up.set(0, 1, 0); cam.lookAt(...e.camera.cible);
  cam.fov = e.camera.fov; cam.updateProjectionMatrix(); cam.rotateZ(((e.camera.roulis || 0) * Math.PI) / 180); cam.updateMatrixWorld();
  ciel.position.copy(cam.position);
  if (histoire.animer) histoire.animer(f, e);
  const vus = new Set();
  for (const a of e.acteurs || []) { majCarte(a); vus.add(a.id); }
  for (const [id, c] of cartes) if (!vus.has(id)) c.groupe.visible = c.o.visible = false;
  majEffets(e.effets || []);
  rendu.shadowMap.needsUpdate = true;
  rendu.setRenderTarget(rtCouleur); rendu.setClearColor(0x000000, 1); rendu.clear(); rendu.render(scene, cam);
  passeND();
  const l = lumiereCourante, u = matEncre.uniforms;
  u.tCol.value = rtCouleur.texture; u.tND.value = rtND.texture; u.sat.value = l.sat; u.gain.value.set(...l.gain); u.lift.value.set(...l.lift); u.flash.value = Math.min(0.9, e.flash || 0);
  plein.material = matEncre; rendu.setRenderTarget(rtEncre); rendu.render(scenePost, camOrtho);
  const fl = matFlou.uniforms; fl.tIn.value = rtEncre.texture; fl.tND.value = rtND.texture;
  fl.focus.value = e.flou ? e.flou.focus : 5; fl.force.value = e.flou ? e.flou.force * ECH : 0;
  plein.material = matFlou; rendu.setRenderTarget(null); rendu.render(scenePost, camOrtho);
  return cv.toDataURL("image/jpeg", 0.95);
}

export const MOTEUR = { THREE, scene, cam, toon, texture, boite, cylindre, cone, boule, facettes, sol, panneau, poser, monde, LUMIERES };
window.rendreImage = rendreImage;
window.charger = charger;
