// ─────────────────────────────────────────────────────────────────────────────
// La série prête à téléverser.
//
// Les illustrations ne sont pas retouchées : elles sont reprises telles quelles
// pour l'App Store. Pour Google Play, dont le format n'accepte pas un visuel
// aussi allongé, elles sont posées au centre d'un 1080 × 1920 sur le même fond
// crème — le dessin reste entier, on ne fait qu'ajouter de la marge.
//
//   node scripts/captures-serie-finale.mjs  -> captures-store-final/{ios,android}
// ─────────────────────────────────────────────────────────────────────────────
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const CREME = 'rgb(247,236,221)';

const SERIE_IOS = [
  ['01', 'captures-appstore/01-arretez-de-fumer.png'],
  ['02', 'captures-appstore/02-fixez-votre-date-arret.png'],
  ['03', 'captures-appstore/03-voyez-vos-economies.png'],
  ['04', 'captures-appstore/04-mesurez-chaque-progres.png'],
  ['05', 'captures-store/ios/01-accueil.png'],
  ['06', 'captures-store/ios/07-statistiques-periode.png'],
  ['07', 'captures-store/ios/09-plan-impact.png'],
  ['08', 'captures-store/ios/10-plan-habitudes.png'],
  ['09', 'captures-store/ios/11-plan-paliers.png'],
  ['10', 'captures-store/ios/14-jai-fume.png'],
];

// Google Play : 8 visuels maximum, format 1080 × 1920.
const SERIE_ANDROID = [
  ['01', 'captures-appstore/01-arretez-de-fumer.png', true],
  ['02', 'captures-appstore/03-voyez-vos-economies.png', true],
  ['03', 'captures-appstore/04-mesurez-chaque-progres.png', true],
  ['04', 'captures-store/android/01-accueil.png', false],
  ['05', 'captures-store/android/07-statistiques-periode.png', false],
  ['06', 'captures-store/android/09-plan-impact.png', false],
  ['07', 'captures-store/android/10-plan-habitudes.png', false],
  ['08', 'captures-store/android/11-plan-paliers.png', false],
];

const nom = f => path.basename(f).replace(/^\d+-/, '').replace(/\.png$/, '');

fs.rmSync('captures-store-final', { recursive: true, force: true });
fs.mkdirSync('captures-store-final/ios', { recursive: true });
fs.mkdirSync('captures-store-final/android', { recursive: true });

for (const [rang, src] of SERIE_IOS) {
  fs.copyFileSync(src, `captures-store-final/ios/${rang}-${nom(src)}.png`);
  console.log('  ios', rang, nom(src));
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });

for (const [rang, src, aRecadrer] of SERIE_ANDROID) {
  const cible = `captures-store-final/android/${rang}-${nom(src)}.png`;
  if (!aRecadrer) { fs.copyFileSync(src, cible); console.log('  and', rang, nom(src)); continue; }
  const html = `<!doctype html><meta charset="utf-8"><style>
    html,body{margin:0;padding:0}
    .scene{width:1080px;height:1920px;background:${CREME};display:flex;align-items:center;justify-content:center;overflow:hidden}
    img{height:1920px;display:block}
  </style><div class="scene"><img src="${pathToFileURL(path.resolve(src)).href}"></div>`;
  const tmp = 'captures-store-final/_t.html';
  fs.writeFileSync(tmp, html);
  await page.goto(pathToFileURL(path.resolve(tmp)).href + '?v=' + Date.now(), { waitUntil: 'load' });
  await page.evaluate(() => Promise.all([...document.images].map(i => i.complete ? i.decode().catch(() => {}) : new Promise(r => { i.onload = r; i.onerror = r; }))));
  await page.screenshot({ path: cible });
  fs.unlinkSync(tmp);
  console.log('  and', rang, nom(src), '(posé sur 1080×1920)');
}

await browser.close();
console.log('terminé.');
