// ─────────────────────────────────────────────────────────────────────────────
// Visuels finaux pour les stores : l'illustration d'origine (titre + dessin)
// avec, posé par-dessus, un vrai écran de l'app en plus petit.
//
//   node scripts/captures-composites.mjs            -> 1290 x 2796 (App Store)
//   OUT_DIR=... SRC_SHOTS=... node ...              -> autre serie
//
// Sortie : captures-finales/*.png
// ─────────────────────────────────────────────────────────────────────────────
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CHROME = process.env.CHROME_PATH
  ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FONDS = 'captures-appstore';
const SHOTS = process.env.SRC_SHOTS ?? 'captures-store/ios';
const OUT = process.env.OUT_DIR ?? 'captures-finales';
const W = Number(process.env.W ?? 1290);
const H = Number(process.env.H ?? 2796);

// Quel écran réel va avec quelle illustration, et à quelle hauteur le poser.
const PAIRES = [
  ['01-arretez-de-fumer',          '01-accueil',                  0],
  ['02-fixez-votre-date-arret',    '11-plan-paliers',             0],
  ['03-voyez-vos-economies',       '09-plan-impact',              0],
  ['04-mesurez-chaque-progres',    '07-statistiques-periode',     0],
  ['05-comprenez-vos-declencheurs','10-plan-habitudes',           0],
  ['06-objectif-clair-chaque-jour','11-plan-paliers',             0],
  ['07-restez-motive',             '06-statistiques-mois-detail', 0],
  ['08-suivez-chaque-cigarette',   '14-jai-fume',                 0],
  ['09-bienfaits-de-arret',        '13-profil',                   0],
  ['10-ameliorez-votre-sante',     '02-accueil-economies',        0],
];

fs.mkdirSync(OUT, { recursive: true });

const url = p => pathToFileURL(path.resolve(p)).href;
const TMP_HTML = path.join(OUT, '_composition.html');

function page(fond, shot, decalage = 0) {
  return `<!doctype html><meta charset="utf-8"><style>
  html,body{margin:0;padding:0}
  .scene{position:relative;width:${W}px;height:${H}px;overflow:hidden}
  .fond{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  /* L'écran réel : posé sur le dessin, assez petit pour le laisser respirer. */
  .tel{position:absolute;left:50%;transform:translateX(-50%);
       top:${Math.round(H * (0.30 + decalage))}px;width:${Math.round(W * 0.54)}px;
       border-radius:${Math.round(W * 0.038)}px;overflow:hidden;
       box-shadow:0 ${Math.round(H*0.012)}px ${Math.round(H*0.028)}px rgba(31,61,41,.28),
                  0 ${Math.round(H*0.002)}px ${Math.round(H*0.004)}px rgba(31,61,41,.18);
       outline:${Math.round(W*0.005)}px solid rgba(255,255,255,.92);
       outline-offset:${-Math.round(W*0.005)}px}
  .tel img{display:block;width:100%}
  </style>
  <div class="scene">
    <img class="fond" src="${url(`${FONDS}/${fond}.png`)}">
    <div class="tel"><img src="${url(`${SHOTS}/${shot}.png`)}"></div>
  </div>`;
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const tab = await browser.newPage();
await tab.setViewport({ width: W, height: H, deviceScaleFactor: 1 });

for (const [fond, shot, decalage] of PAIRES) {
  if (!fs.existsSync(`${FONDS}/${fond}.png`)) { console.log('  ⚠ fond manquant', fond); continue; }
  if (!fs.existsSync(`${SHOTS}/${shot}.png`)) { console.log('  ⚠ écran manquant', shot); continue; }
  fs.writeFileSync(TMP_HTML, page(fond, shot, decalage ?? 0));
  await tab.goto(url(TMP_HTML) + '?v=' + Date.now(), { waitUntil: 'load' });
  await tab.evaluate(() => Promise.all(
    [...document.images].map(i => (i.complete ? i.decode().catch(() => {}) : new Promise(r => { i.onload = r; i.onerror = r; }))),
  ));
  const file = path.join(OUT, `${fond}.png`);
  await tab.screenshot({ path: file });
  console.log('  ✓', file, '←', shot);
}

await browser.close();
fs.rmSync(TMP_HTML, { force: true });
console.log('terminé.');
