// JC Toon — capture d'une page de test.  node capture.mjs <page.html> <sortie.png>
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const racine = path.resolve("web"), types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg" };
const serveur = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.startsWith("/three/")) p = path.resolve("node_modules/three/build", p.slice(7)); else p = path.join(racine, p);
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { "Content-Type": types[path.extname(p)] || "application/octet-stream" }); res.end(d); });
}).listen(0);
const port = serveur.address().port;
const nav = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await nav.newPage();
page.on("console", (m) => console.log("[page]", m.text()));
page.on("pageerror", (e) => console.log("[erreur]", e.message));
await page.goto(`http://localhost:${port}/${process.argv[2]}`);
await page.waitForFunction(() => window.done === true, null, { timeout: 120000 });
const data = await page.evaluate(() => document.querySelector("canvas").toDataURL("image/png"));
fs.writeFileSync(process.argv[3], Buffer.from(data.split(",")[1], "base64"));
await nav.close(); serveur.close();
console.log("écrit", process.argv[3]);
