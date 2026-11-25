// JC Toon — rendu des images avec Playwright (WebGL logiciel SwiftShader, aucune carte graphique requise).
//   node rendu.mjs <histoire> <dossier> "0-299"        toutes les images d'une plage
//   node rendu.mjs <histoire> <dossier> "10,80,150"    quelques images fixes
// Variables : LARG=1080 (largeur, hauteur = 16/9), RESUME=1 (saute les images déjà rendues)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const [histoire, dossier, plage] = process.argv.slice(2);
const larg = +(process.env.LARG || 1080);
const images = plage.includes("-") && !plage.includes(",")
  ? (() => { const [a, b] = plage.split("-").map(Number); return Array.from({ length: b - a + 1 }, (_, i) => a + i); })()
  : plage.split(",").map(Number);
fs.mkdirSync(dossier, { recursive: true });
const racine = path.resolve(path.dirname(new URL(import.meta.url).pathname), "web");
const three = path.resolve(path.dirname(new URL(import.meta.url).pathname), "node_modules/three/build");
const types = { ".html": "text/html", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg" };
const serveur = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  p = p.startsWith("/three/") ? path.join(three, p.slice(7)) : path.join(racine, p);
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { "Content-Type": types[path.extname(p)] || "application/octet-stream" }); res.end(d); });
}).listen(0);
const nav = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await nav.newPage({ viewport: { width: 400, height: 400 } });
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log("[page]", m.text().slice(0, 300)); });
page.on("pageerror", (e) => console.log("[erreur]", e.message));
await page.goto(`http://localhost:${serveur.address().port}/index.html?histoire=${histoire}&l=${larg}`);
await page.waitForFunction(() => window.pret || window.erreur, null, { timeout: 300000 });
const err = await page.evaluate(() => window.erreur);
if (err) { console.error("échec du chargement :", err); process.exit(1); }
const t0 = Date.now(); let n = 0;
for (const f of images) {
  const fichier = path.join(dossier, `f${String(f).padStart(4, "0")}.jpg`);
  if (process.env.RESUME && fs.existsSync(fichier)) continue;
  const url = await page.evaluate((f) => window.rendreImage(f), f);
  fs.writeFileSync(fichier, Buffer.from(url.split(",")[1], "base64")); n++;
  if (n % 10 === 0 || n === 1) console.log(`image ${f} (${n}/${images.length}) — ${((Date.now() - t0) / 1000 / n).toFixed(1)} s/image`);
}
console.log(`terminé : ${n} images en ${((Date.now() - t0) / 1000).toFixed(0)} s`);
await nav.close(); serveur.close();
